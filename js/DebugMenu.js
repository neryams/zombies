/* global debugMenu:true */
/* global sass */
/* global node */
/* global fs */
var debugMenu = {
	active: false,
    logModules: false,
    openConsole: function () {
		if(node) {
			sass.render({
				data: '@import "third-party/webix","debugger";',
				success: function(css){
					fs.writeFile('robots/css/debugger.css', css, function (err) {
						if (err) throw err;

						var queryString = '?reload=' + new Date().getTime();
						$('link.debugger').each(function () {
							this.href = this.href.replace(/\?.*|$/, queryString);
						});
					});
				},
				error: function(error) {
					console.log(error);
				},
				includePaths: [ 'robots/sass/' ],
				outputStyle: 'nested'
			});
		}
		if(!this.console.window) {
			var newConsole = window.open('debugger.htm', '_blank', 'height=800,width=1200,location=no'),
				menu = this;

			$(newConsole).load(function() {
				menu.console.window = newConsole;
				menu.console.window.Simulator = menu.simulator;
				menu.console.window.Console = menu.console;
				menu.console.window.Renderer = menu.renderer;
			});
			menu.active = true;
		}
    },
	setRenderer: function(Renderer) {
		this.renderer.R = Renderer;
	},
	setSimulator: function(Simulator) {
		this.console.S = this.simulator.S = Simulator;
		return this.console;
	},
    renderer: {
		R: null,
		highlightSquare: function(lat,lng) {
			this.R.drawCircle('debugHighlight', lat, lng, 3, 0xff00ff, 2);
		}
    },
    simulator: {
		S: null,
		endTurn: function() {
			if(this.S)
				this.S.tick();
		}
    },
    console: {
		window: null,
		S: null,
		simulatorCache: {
			hordes: {},
			pointsInfected: [],
			pointsPopulation: []
		},
		options: {
			manualTicks: false,
			activeHorde: null,
			activePoint: null,
			profileTick: false
		},
		close: function() {
			if(this.window) {
				this.window.close();
				this.window = null;
				debugMenu.active = false;
			}
		},
		initTick: function() {
			this.window.ui.clearModules();
		},
		newTick: function() {
			if(this.options.manualTicks) {
				var i,n;
				for(i = 0, n = this.S.points.length; i < n; i++) {
					if(!this.S.points[i].water && !this.S.points[i].polar)
						if(this.simulatorCache.pointsInfected[i] === undefined ||
							this.S.points[i].infected != this.simulatorCache.pointsInfected[i] ||
							this.S.points[i].total_pop != this.simulatorCache.pointsPopulation[i]) {
								this.window.ui.editPoint(this.S.points[i]);
								this.simulatorCache.pointsInfected[i] = this.S.points[i].infected;
								this.simulatorCache.pointsPopulation[i] = this.S.points[i].total_pop;
						}
				}
				this.window.$$('infoPoints').refresh();
				for(i = 0, n = this.S.hordes.length; i < n; i++) {
					if(this.S.hordes[i].size === 0) {
						this.window.ui.removeHorde(this.simulatorCache.hordes[this.S.hordes[i].id]);
					} else {
						if(this.simulatorCache.hordes[this.S.hordes[i].id] === undefined && this.S.hordes[i].size > 0)
							this.simulatorCache.hordes[this.S.hordes[i].id] = this.window.ui.editHorde(this.S.hordes[i]);
						else
							this.window.ui.editHorde(this.S.hordes[i], this.simulatorCache.hordes[this.S.hordes[i].id]);
					}
				}
				this.window.$$('infoHordes').refresh();
			}

			// If the active horde moved while in horde view mode, update selected square
			if(this.options.activeHorde && this.options.activePoint &&
					this.window.ui.selectedTab == 'infoHordes' &&
					this.options.activePoint.id != this.options.activeHorde.location.id) {
				this.window.ui.selectSquare(this.options.activeHorde.location.lat,this.options.activeHorde.location.lng);
			}

			this.window.ui.updateInfo();

			this.window.ui.updateGlobalInfo({
				iteration: this.S.status.iteration,
				hordeCount: this.S.hordes.length
			});
		},
		updateTarget: function(current, target) {
			if(this.options.activeHorde && this.options.activeHorde.id == current.id) {
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
		selectSquare: function(lat,lng) {
			this.window.ui.filterHordes(null,lat,lng);
			this.window.ui.selectSquare(lat,lng);
		},
		disableProfileTick: function() {
			if(this.window.$$('profileTick').getValue())
				this.window.$$('profileTick').toggle();
			this.options.profileTick = false;
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