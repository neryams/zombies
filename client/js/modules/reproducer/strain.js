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
	init: function(dataPoints) {
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
		for(var i = 0, n = dataPoints.length; i < n; i++) {
			if(dataPoints[i].water) {
				dataPoints[i].tech = 0;
				dataPoints[i].trees = 0;
			} else {
				dataPoints[i].tech = Math.pow(Math.log(dataPoints[i].total_pop+1),4);
				dataPoints[i].trees = Math.log(this.S.config.maximums.total_pop/(dataPoints[i].total_pop+10) + 1)*dataPoints[i].precipitation * (dataPoints[i].temperature / 100);
			
				if(this.S.config.maximums.tech < dataPoints[i].tech)
					this.S.config.maximums.tech = dataPoints[i].tech;
				if(this.S.config.maximums.trees < dataPoints[i].trees)
					this.S.config.maximums.trees = dataPoints[i].trees;
			}
		}
	},
	ui: function(UI) {
		// Add data view options for the resources
		var viewList = UI.interfaceParts.viewList;
		
		viewList.addOption('ui:buttons.dataviews_inner.tech', function() {
			UI.renderer.switchVisual('tech', [ // hsl
				0.3,
				1.0,
				0.5
			],[
				0,
				1.0,
				0.3
			]);
			UI.tooltip.setPointFunction(function(lat, lng) {
				var value = UI.simulator.getPointProperties(lat, lng).tech;
				if(value > 0)
					return value + ' robot parts';
				else
					return false;
			});
		});
		viewList.addOption('ui:buttons.dataviews_inner.trees', function() {
			UI.renderer.switchVisual('trees', [ // hsl
				0.15,
				0.75,
				0.65
			],[
				0.4,
				1.0,
				0.40
			]);
			UI.tooltip.setPointFunction(function(lat, lng) {
				var value = UI.simulator.getPointProperties(lat, lng).trees;
				if(value > 0)
					return value + ' vegetation';
				else
					return false;
			});
		});
		// Add slider for zombie behavior: how much 
		UI.interfaceParts.main_control.addDataField('control_collect',{
			type:'slider',
			title: 'Resource to put towards reproduction',
			dynamic: 'control_moneyRatio',
			dataOptions: 'start: 0; end: 12; initial: 2; step: 0.1;',
			displayValue: true
		});		
	},
	startSimulation: function(dataPoints) {
		// Code to start the simulation
		var startRandomizer = 1000 + Math.round(Math.random()*4000);
		var startPoint = null;

		// Loop through all the points and pick the starting point, the point with population closest to a random number
		// don't want to start in an area with no people, but not in a huge city either.
		for(var i = 0, n = dataPoints.length; i < n; i++) {
			if(dataPoints[i].total_pop) {
				if(!startPoint) {
					startPoint = dataPoints[i];
				} else {
					if(Math.abs(startPoint.total_pop - startRandomizer) > Math.abs(dataPoints[i].total_pop - startRandomizer))
						startPoint = dataPoints[i];
				}
			}
		}
		// Create the fort/factory location
		this.fort = startPoint;
		this.S.modules['factory'].val('productionSpeed',1);
		this.S.modules['factory'].addLocation(startPoint);
		this.S.modules['movement.base'].currentSmellAdd('total_pop', 10);

		// Send the starting point back to the callback function to start the simulation
		return startPoint;
	},
	name: 'Self-Replicating Robots',
	description: 'Robots make more of themselves using ',
	dependencies: ['factory'],
	children: ['movement.base','fight','reproducer.reproduce','reproducer.hordeBoost']
};