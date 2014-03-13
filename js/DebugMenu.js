debugMenu = {
	active: false,
    logModules: false,
    openConsole: function () {
    	if(!this.console.window)
    	var newConsole = window.open('debugger.htm', '_blank', "height=800,width=1200,location=no"),
    		menu = this;

		$(newConsole).load(function() {
	        menu.console.window = newConsole;
	        menu.active = true;
	        menu.console.window.Simulator = menu.simulator;
	        menu.console.window.Console = menu.console;
	        menu.console.window.Renderer = menu.renderer;
	    });
    },
	setSimulator: function(Simulator) {
		this.console.S = this.simulator.S = Simulator;
		this.renderer.R = Simulator.Renderer;
		return this.console;
	},
    renderer: {
    	R: null,
    	highlightSquare: function(lat,lng) {
    		R.drawCircle('debugHighlight', lat, lng, 3, 0xff00ff, 2);
    	}
    },
    simulator: {
    	S: null,
    	endTurn: function() {
    		if(this.S)
				this.S.tick();
    	},
    	toggleGlobeTooltip: function(activate) {
    		this.S.UI.toggleGlobeTooltip(activate);
    	}
    },
    console: {
    	window: null,
    	S: null,
    	simulatorLinks: {
    		hordes: {}
    	},
    	options: {
			manualTicks: false,
    		mouseOverDebugData: false,
			activeHorde: null
    	},
		close: function() {
			if(this.window) {
				this.window.close();
				this.window = null;
        		debugMenu.active = false;
			}
		},
		newTick: function() {
			if(this.options.manualTicks)
				for(i = 0, n = this.S.hordes.length; i < n; i++) {
					if(this.S.hordes[i].size == 0) {
						this.window.ui.removeHorde(this.simulatorLinks.hordes[this.S.hordes[i].id]);
					} else {
						if(this.simulatorLinks.hordes[this.S.hordes[i].id] === undefined && this.S.hordes[i].size > 0) 
							this.simulatorLinks.hordes[this.S.hordes[i].id] = this.window.ui.editHorde(this.S.hordes[i]);
						else 
							this.window.ui.editHorde(this.S.hordes[i], this.simulatorLinks.hordes[this.S.hordes[i].id]);
					}
				}

			this.window.ui.updateGlobalInfo({
				iteration: this.S.iteration,
				hordeCount: this.S.hordes.length
			});

			this.window.ui.clearModules();
		},
		updateInfo: function(current, target) {
			if(this.options.activeHorde && this.options.activeHorde.id == current.id) {
				this.window.ui.insertInfo(current);
				if(target)
					this.window.ui.insertTarget(target);				
			}
		},
		reportModule: function(current, moduleId, passData) {
			if(this.options.activeHorde && this.options.activeHorde.id == current.id) {
				this.window.ui.addModulePassData(moduleId, passData);
			}
		},
		reportOutput: function(current, moduleId, result) {

		},
		filterLocation: function(lat,lng) {
			this.window.ui.filterHordes(null,lat,lng);
		}
	}
};
// On window close or reload, close all child windows (i.e. debug consoles)
$(window).unload(function() {
    if(debugMenu.active) {
        debugMenu.console.close();
    }
});

if(typeof global !== 'undefined')
    global.debugMenu = debugMenu;