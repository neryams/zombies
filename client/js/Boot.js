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
    $.getScript('vendor/modernizr/modernizr.js', function() {
        $.getScript('vendor/foundation/js/foundation.js', function() {
            $.getScript('vendor/foundation/js/foundation/foundation.accordion.js');
            $.getScript('vendor/foundation/js/foundation/foundation.slider.js');
            $.getScript('vendor/foundation/js/foundation/foundation.reveal.js');
            $.getScript('vendor/foundation/js/foundation/foundation.tooltip.js');
        });
    });
    $.getScript('vendor/three.js/build/three.js', function() {
        $.getScript('vendor/ShaderParticleEngine/build/ShaderParticles.min.js');
    });
    $.getScript('js/third-party/seedrandom.min.js');
    $.getScript('vendor/tween.js/build/tween.min.js');
    $.getScript('js/third-party/hqx.min.js');
    $.getScript('js/DebugMenu.js');
    $.getScript('js/DataPoint.js');
    $.getScript('js/gridPoint.js');
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
            generatorData,
            generatorTexture,
            loadModules,
            UI,MI,R,
            userConfig = {
                seed: $('#s_seed').val(),
                tx_w: $('#s_tx').val(),
                language: $('#s_lng').val(),
                resolution: $('#s_rs').val(),
                saveGenerator: !!$('#s_save:checked').val()
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
                    generatorWorker.terminate();
                    var loadEnd = false,
                        startGame = function(strain) {
                            S.start(strain);
                            UI.evolutions.buildUI(strain);
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
                        R.simulatorStart(generatorTexture, generatorConfig, generatorData);
                        if(loadEnd)
                            startGame(loadEnd);
                        else
                            loadEnd = true;
                    }, 150);
                }
            },
            generatorLoadConfig = function(config, setSeed) {
                generatorConfig = config;
                if(setSeed)
                    Math.seedrandom(config.seed);

                console.time('webWorkerTransferTimer');
            },
            generatorLoadData = function(points, countries, name) {
                generatorData = {points: [], countries: countries};
                // Re-reference the adjacent points
                for(var i = 0, n = points.length; i < n; i++) {
                    generatorData.points[i] = new DataPoint(points[i]);
                }
                for(i = 0, n = generatorData.points.length; i < n; i++) {
                    generatorData.points[i].adjacent[0] = generatorData.points[generatorData.points[i].adjacent[0]];
                    generatorData.points[i].adjacent[1] = generatorData.points[generatorData.points[i].adjacent[1]];
                    generatorData.points[i].adjacent[2] = generatorData.points[generatorData.points[i].adjacent[2]];
                    generatorData.points[i].adjacent[3] = generatorData.points[generatorData.points[i].adjacent[3]];
                    generatorData.points[i].country = generatorData.countries[generatorData.points[i].country];
                }
                console.timeEnd('webWorkerTransferTimer');
                MI.load.endGenerator();
                S = S.init(UI, loadModules, generatorConfig, generatorData);
                S.setName(name);

                UI.simulator.link(S);
            };

        // Load the rest of the language files
        $.i18n.loadNamespaces(['ui', 'messages', 'dom'], function() {
            $.i18n.setDefaultNamespace('messages');
        });

        var startLoad = function () {
            var loadModules = function (toLoad) {
                // Open debug menu by default in node.
                R = Renderer(userConfig.resolution, function() {
                    UI = UserInterface(R);

                    MI = MainInterface(UI,R);

                    // Start load
                    MI.load.start();
                    generatorWorker.postMessage(userConfig);

                    R.init();
                });

                S = Simulator();

                if(node) {
                    // If running within node, import the modules through node
                    var loaded = {};
                    var requireModules = function(modules) {
                        for(var i = 0; i < modules.length; i++) {
                            if(!loaded[modules[i]]) {
                                loaded[modules[i]] = true;
                                var path = './js/modules/'+ modules[i].split('.').join('/')+'.js';
                                var exports = require(path);

                                if(exports.options.dependencies !== undefined)
                                    requireModules(exports.options.dependencies);

                                S.addModule(modules[i], exports);

                                if(exports.options.children !== undefined)
                                    requireModules(exports.options.children);
                            }
                        }
                    };

                    requireModules(toLoad);
                } else {
                    // If running in client, load the modules via server
                    for (var moduleId in toLoad)
                        if (toLoad.hasOwnProperty(moduleId)) {
                            S.addModule(moduleId, toLoad[moduleId]);
                        }
                }

                if(node)
                    debugMenu.openConsole();
                debugMenu.setRenderer(R);
            };

            // Load the chosen modules first, then initiate the game 
            // If this is not running in node, load modules form server
            if(!node) {
                $.getScript('modules/'+$('#s_modules').val(), function() {
                    loadModules(window.toLoad);
                    delete window.toLoad;
                });
            } else {
                loadModules($('#s_modules').val().split(','));
            }
        };

        var startWorker = function() {
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
                        loadingState++;
                        checkLoadingState(loadingState);
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
        }

        if(node && userConfig.saveGenerator) {
            fs.readFile('./generated.data', function (err, data) {
                if (err) {
                    console.log(err);
                    userConfig.saveData = {};
                    startWorker();
                } else {
                    userConfig.saveData = JSON.parse(data);
                    userConfig.saveData.loaded = true;

                    generatorWorker = {
                        postMessage: function() {
                            // Set the seed so the module functions have a predictable seed when loading saved generator.
                            generatorLoadConfig(userConfig.saveData.config, true);

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
            startWorker();
            startLoad();
        }

        return false;
    });
});