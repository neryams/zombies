/* global Renderer*/
/* global Simulator */
/* global UserInterface */
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
var R,S,debugMenu;

$(function () {
    // Select Resolution closes to device pixel ratio
    var ratioSelect = $('#s_rs');
    $('option', ratioSelect).each(function() {
        if(Math.abs(parseFloat(ratioSelect.val()) - window.devicePixelRatio) > Math.abs(parseFloat($(this).attr('value')) - window.devicePixelRatio))
            ratioSelect.val($(this).attr('value'));
    });

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
    $.getScript('js/third-party/three.min.js');
    $.getScript('js/third-party/seedrandom.min.js');
    $.getScript('js/third-party/tween.min.js');
    $.getScript('js/third-party/hqx.min.js');
    $.getScript('js/DebugMenu.js');
    $.getScript('js/DataPoint.js');
    $.getScript('js/Renderer.js');
    $.getScript('js/UserInterface.js');
    $.getScript('js/Simulator.js');

    // On form submit, load the game
    $('form').on('submit', function (event) {
        var tGenerator = new Worker('js/Generator.js'),
            tCompletion = 0,
            generatorConfig,
            UI;
        tGenerator.addEventListener('message', function(event) {
            var gStart = function(completeSteps) {
                if(completeSteps == 3) {
                    // Function also initializes UI.
                    UI.setSimulator(S);
                    tGenerator.terminate();

                    UI.load.end();
                    R.animate();
                }
            };
            
            switch (event.data.cmd) {
                case 'progress':
                    if(!event.data.progress)
                        UI.load.progress();
                    else
                        UI.load.progress(event.data.progress,event.data.share);
                    break;
                case 'ready':
                    generatorConfig = event.data.config;
                    console.time('webWorkerTransferTimer');
                    break;
                case 'data':
                    var gData = {points: [], countries: event.data.countries};
                    // Re-reference the adjacent points
                    for(var i = 0, n = event.data.points.length; i < n; i++) {
                        gData.points[i] = new DataPoint(event.data.points[i]);
                    }
                    for(i = 0, n = gData.points.length; i < n; i++) {
                        gData.points[i].adjacent[0] = gData.points[gData.points[i].adjacent[0]];
                        gData.points[i].adjacent[1] = gData.points[gData.points[i].adjacent[1]];
                        gData.points[i].adjacent[2] = gData.points[gData.points[i].adjacent[2]];
                        gData.points[i].adjacent[3] = gData.points[gData.points[i].adjacent[3]];
                        gData.points[i].country = gData.countries[gData.points[i].country];
                    }
                    UI.load.endGenerator();
                    S = new Simulator(R,UI,generatorConfig,gData);
                    S.setName(event.data.generatedName);
                    tCompletion++;
                    console.timeEnd('webWorkerTransferTimer');
                    gStart(tCompletion);
                    break;
                case 'texture':
                    R.init(new Float32Array(event.data.texture),generatorConfig,S);
                    tCompletion++;
                    gStart(tCompletion);
                    break;
                case 'complete':
                    tCompletion++;
                    gStart(tCompletion);
                    break;
            }
        }, false);

        event.preventDefault();

        var userConfig = {
            seed: $('#s_seed').val(),
            tx_w: $('#s_tx').val(),
            language: $('#s_lng').val(),
            resolution: $('#s_rs').val()
        };

        // Load the rest of the language files
        $.i18n.loadNamespaces(['ui', 'messages', 'dom'], function() {
            $.i18n.setDefaultNamespace('messages');
        });

        var onLoadModules = function () {
            $('#setup').remove();

            R = Renderer(userConfig.resolution);
            UI = UserInterface(R);

            UI.init(function() {
                UI.load.start();
                tGenerator.postMessage(userConfig);
            });
        };

        // Load the chosen modules first, then initiate the game 
        // If this is not running in node, load modules form server
        if(typeof require === 'undefined') {
            $.getScript('js/loadModules.php?modules='+$('#s_modules').val(), onLoadModules);
        } else {
            Simulator.prototype.loadModules = $('#s_modules').val().split(',');
            onLoadModules();
        }

        // Open debug menu by default.
        debugMenu.openConsole();
        return false;
    });
});