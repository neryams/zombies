/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
/*jshint sub:true*/
exports.type = 'strain';
exports.run = function(current,passData) {
	passData.encounterProbability = 0;
	passData.mobility = 0;
	passData.panic = 0;
	passData.collect = 6;

	this.S.modules['reproducer.reproduce'].val('ratio_money',Math.min(Math.max(this.S.status.control_moneyRatio - 1, 0), 10)/10);
};
exports.options = {
	init: function() {
		this.S.modules['factory'].val('productionSpeed',1);

		// Create the starting seed for the upgrade tree. Strains should only have one upgrade. Add other free upgrades via other modules.
		this.S.addUpgrades(this,
			{
				cost: -1, // Negative cost means you can't buy it.
				paths:[],
				name: this.name,
				description: this.description,
				style: {
					offset: [100, -50],
					size: 90,
					graphic: 'strain.png'
				}
			} // Do not set an ID for the strain upgrade. The simulator needs to use the default name to give you the upgrade when you start the game.
		);

		this.S.config.maximums.tech = 0;
		this.S.config.maximums.trees = 0;
		for(var i = 0, n = this.S.points.length; i < n; i++) {
			if(this.S.points[i].water) {
				this.S.points[i].tech = 0;
				this.S.points[i].trees = 0;
			} else {
				this.S.points[i].tech = Math.pow(Math.log(this.S.points[i].total_pop+1),4);
				this.S.points[i].trees = Math.log(this.S.config.maximums.total_pop/(this.S.points[i].total_pop+10) + 1)*this.S.points[i].precipitation*this.S.points[i].temperature;
			
				if(this.S.config.maximums.tech < this.S.points[i].tech)
					this.S.config.maximums.tech = this.S.points[i].tech;
				if(this.S.config.maximums.trees < this.S.points[i].trees)
					this.S.config.maximums.trees = this.S.points[i].trees;
			}
		}
	},
	ui: function(UI) {
		// Add data view options for the resources
		var viewList = UI.interfaceParts.viewList;
		
		viewList.addOption('ui:buttons.dataviews_inner.tech', function() {
			UI.switchVisual('tech', [ // hsl
				0.3,
				1.0,
				0.5
			],[
				0,
				1.0,
				0.3
			]);
		});
		viewList.addOption('ui:buttons.dataviews_inner.trees', function() {
			UI.switchVisual('trees', [ // hsl
				0.15,
				0.75,
				0.65
			],[
				0.4,
				1.0,
				0.40
			]);
		});
		// Add slider for zombie behavior: how much 
		UI.interfaceParts.main_control.addDataField('control_collect',{
			type:'slider',
			title: 'Resource to put towards reproduction',
			dynamic: 'control_moneyRatio',
			dataOptions: 'start: 0; end: 12; initial: 2; step: 0.1;'
		});		
	},
	startSimulation: function() {
		// Code to start the simulation
		var startRandomizer = 1000 + Math.round(Math.random()*4000);
		var startPoint = null;

		// Loop through all the points and pick the starting point, the point with population closest to a random number
		// don't want to start in an area with no people, but not in a huge city either.
		for(var i = 0, n = this.S.points.length; i < n; i++) {
			if(this.S.points[i].total_pop) {
				if(!startPoint) {
					startPoint = this.S.points[i];
				} else {
					if(Math.abs(startPoint.total_pop - startRandomizer) > Math.abs(this.S.points[i].total_pop - startRandomizer))
						startPoint = this.S.points[i];
				}
			}
		}
		// Create the fort/factory location
		this.fort = startPoint;
		this.S.modules['factory'].val('locations',startPoint,'append');

		// Send the starting point back to the callback function to start the simulation
		return startPoint;
	},
	name: 'Self-Replicating Robots',
	description: 'Robots make more of themselves using ',
	dependencies: ['factory'],
	children: ['movement.base','fight','reproducer.reproduce','reproducer.hordeBoost']
};