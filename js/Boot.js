/* global Renderer*/
/* global Simulator */
/* global UserInterface */
/* global MainInterface */
/* global DataPoint */
/* global debugMenu: true */

// Replace the normal jQuery getScript function with one that supports
// debugging and which references the script files as external resources
// rather than inline.
$.extend({
    getScript: function(url, callback) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = url;

        // Handle Script loading
        {
            var done = false;

            // Attach handlers for all browsers
            script.onload = script.onreadystatechange = function(){
                if ( !done && (!this.readyState ||
                this.readyState == 'loaded' || this.readyState == 'complete') ) {
                    done = true;
                    if (callback)
                        callback();

                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                }
            };
        }

        head.appendChild(script);

        // We handle everything using the script element injection
        return undefined;
    },
});

// Reset require cache for testing
if(typeof global !== 'undefined')
    for(var key in global.require.cache)
        if (global.require.cache.hasOwnProperty(key))
            delete global.require.cache[key];

// Global variables
var S,debugMenu,
    node = typeof require !== 'undefined';
if(node) {
    var fs = require('fs');
    var sass = require('node-sass');

    sass.render({
        data: '@import "third-party/normalize","third-party/foundation","main","setup","ui";',
        success: function(css){
            fs.writeFile('zombies/css/compiled.css', css, function (err) {
                if (err) throw err;

                var queryString = '?reload=' + new Date().getTime();
                $('link.main').each(function () {
                    this.href = this.href.replace(/\?.*|$/, queryString);
                });
            });
        },
        error: function(error) {
            console.log(error);
        },
        includePaths: [ 'zombies/sass/' ],
        outputStyle: 'nested'
    });
}

$(function () {
    // Select Resolution closes to device pixel ratio
    var ratioSelect = $('#s_rs');
    $('option', ratioSelect).each(function() {
        if(Math.abs(parseFloat(ratioSelect.val()) - window.devicePixelRatio) > Math.abs(parseFloat($(this).attr('value')) - window.devicePixelRatio))
            ratioSelect.val($(this).attr('value'));
    });
    if(node) {
        $('.node-only').css('display', 'block');
        fs.exists('./generated.data', function (exists) {
            if(exists)
                $('#s_save').attr('checked',true);
        });
    }

    // Load language files
    $.i18n.init({ resGetPath: 'locales/__lng__/__ns__.json', lng: 'en', load: 'unspecific', ns: 'setup', fallbackLng: 'en', debug: true, useCookie: false }, function() {
        $('#setup').i18n();
        $('head title').i18n();
    });

    // Event handler for updating setup menu with language choice change
    $('#s_lng').change(function () {
        $('form :input').attr('disabled', true);
        $.i18n.setLng( $(this).val(), function() {
            $('#setup').i18n();
            $('head title').i18n();
            $('form :input').attr('disabled', false);
        });
    });

    $.getScript('js/third-party/foundation.min.js');
    $.getScript('js/third-party/three.js', function() {
        $.getScript('js/third-party/ShaderParticles.js');
    });
    $.getScript('js/third-party/seedrandom.min.js');
    $.getScript('js/third-party/tween.min.js');
    $.getScript('js/third-party/hqx.min.js');
    $.getScript('js/DebugMenu.js');
    $.getScript('js/DataPoint.js');
    $.getScript('js/Renderer.js');
    $.getScript('js/UserInterface.js');
    $.getScript('js/Simulator.js');
    $.getScript('js/MainInterface.js');

    // On form submit, load the game
    $('form').on('submit', function (event) {
        event.preventDefault();

        var loadingState = 0,
            generatorWorker,
            generatorConfig,
            generatorTexture,
            UI,MI,R,
            userConfig = {
                seed: $('#s_seed').val(),
                tx_w: $('#s_tx').val(),
                language: $('#s_lng').val(),
                resolution: $('#s_rs').val(),
                saveGenerator: !!$('#s_save:checked').val()
            },
            onLoadModules = function () {
                // Open debug menu by default in node.
                if(node)
                    debugMenu.openConsole();

                R = Renderer(userConfig.resolution, function() {
                    UI = UserInterface(R);

                    MI = MainInterface(UI,R);
                    MI.load.start();
                    generatorWorker.postMessage(userConfig);
                    R.init();
                });
            },
            checkLoadingState = function(completeSteps) {
                if(completeSteps == 3) {
                    if(userConfig.saveData) {
                        fs.writeFile('generated.data', JSON.stringify(userConfig.saveData), function(err) {
                            if(err) throw err;
                            console.log('JSON saved');
                        });
                    }

                    // Function also initializes UI.
                    UI.setSimulator(S);
                    generatorWorker.terminate();
                    var loadEnd = false,
                        startGame = function(strain) {
                            S.start(strain);
                            UI.processUpgrades(strain);
                            MI.load.end();
                            R.animate();
                        };

                    MI.strainPrompt(S.getStrainOptions(), function(strain) {
                        if(loadEnd) {
                            startGame(strain);
                        } else {
                            loadEnd = strain;
                        }
                    });

                    // Let window render
                    setTimeout(function() {
                        R.simulatorStart(generatorTexture,generatorConfig,S);
                        if(loadEnd)
                            startGame(loadEnd);
                        else
                            loadEnd = true;
                    }, 50);
                }
            },
            generatorLoadConfig = function(config) {
                generatorConfig = config;
                console.time('webWorkerTransferTimer');
            },
            generatorLoadData = function(points, countries, name) {
                var data = {points: [], countries: countries};
                // Re-reference the adjacent points
                for(var i = 0, n = points.length; i < n; i++) {
                    data.points[i] = new DataPoint(points[i]);
                }
                for(i = 0, n = data.points.length; i < n; i++) {
                    data.points[i].adjacent[0] = data.points[data.points[i].adjacent[0]];
                    data.points[i].adjacent[1] = data.points[data.points[i].adjacent[1]];
                    data.points[i].adjacent[2] = data.points[data.points[i].adjacent[2]];
                    data.points[i].adjacent[3] = data.points[data.points[i].adjacent[3]];
                    data.points[i].country = data.countries[data.points[i].country];
                }
                console.timeEnd('webWorkerTransferTimer');
                MI.load.endGenerator();
                S = new Simulator(R,UI,generatorConfig,data);
                S.setName(name);
                loadingState++;
                checkLoadingState(loadingState);
            };

        // Load the rest of the language files
        $.i18n.loadNamespaces(['ui', 'messages', 'dom'], function() {
            $.i18n.setDefaultNamespace('messages');
        });

        var startLoad = function () {
            // Load the chosen modules first, then initiate the game 
            // If this is not running in node, load modules form server
            if(!node) {
                $.getScript('js/loadModules.php?modules='+$('#s_modules').val(), onLoadModules);
            } else {
                Simulator.prototype.loadModules = $('#s_modules').val().split(',');
                onLoadModules();
            }
        };

        generatorWorker = new Worker('js/Generator.js');
        generatorWorker.addEventListener('message', function(event) {
            switch (event.data.cmd) {
                case 'progress':
                    MI.load.progress(event.data.message,event.data.progress);
                    break;
                case 'ready':
                    if(node && userConfig.saveGenerator) {
                        userConfig.saveData.config = event.data.config;
                    }

                    generatorLoadConfig(event.data.config);
                    break;
                case 'data':
                    if(node && userConfig.saveGenerator) {
                        userConfig.saveData.points = JSON.parse(JSON.stringify(event.data.points));
                        userConfig.saveData.countries = JSON.parse(JSON.stringify(event.data.countries));
                        userConfig.saveData.name = event.data.generatedName;
                    }

                    generatorLoadData(event.data.points, event.data.countries, event.data.generatedName);
                    break;
                case 'texture':
                    generatorTexture = new Float32Array(event.data.texture);
                    if(node && userConfig.saveGenerator) {
                        userConfig.saveData.texture = generatorTexture;
                    }

                    loadingState++;
                    checkLoadingState(loadingState);
                    break;
                case 'complete':
                    loadingState++;
                    checkLoadingState(loadingState);
                    break;
            }
        }, false);

        if(node && userConfig.saveGenerator) {
            fs.readFile('./generated.data', function (err, data) {
                if (err) {
                    console.log(err);
                    userConfig.saveData = {};
                } else {
                    userConfig.saveData = JSON.parse(data);
                    userConfig.saveData.loaded = true;

                    generatorWorker.terminate();
                    generatorWorker = {
                        postMessage: function() {
                            generatorLoadConfig(userConfig.saveData.config);
                            generatorLoadData(userConfig.saveData.points, userConfig.saveData.countries, userConfig.saveData.name);
                            generatorTexture = [];
                            var i = 0;
                            while(userConfig.saveData.texture[i]) {
                                generatorTexture.push(userConfig.saveData.texture[i]);
                                i++;
                            }
                            delete userConfig.saveData;
                            checkLoadingState(3);
                        },
                        terminate: function() {}
                    };
                }

                startLoad();
            });
        } else {
            startLoad();
        }

        return false;
    });
});