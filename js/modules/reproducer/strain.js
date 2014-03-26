/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
/*jshint sub:true*/
exports.type = 'strain';
exports.run = function(current,passData) {
	passData.encounterProbability = 0;
	passData.zombieStrength = 0;
	passData.humanStrength = 0;
	passData.mobility = 0;
	passData.panic = 0;
	passData.reproduction = 5;
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

		for(var i = 0, n = this.S.points.length; i < n; i++) {
			if(this.S.points[i].water) {
				this.S.points[i].tech = 0;
				this.S.points[i].trees = 0;
			} else {
				this.S.points[i].tech = Math.log(this.S.points[i].total_pop*10000000);
				this.S.points[i].trees = Math.log(this.S.config.max_pop/(this.S.points[i].total_pop+10) + 1)*this.S.points[i].precipitation*this.S.points[i].temperature;
			}
		}

		var dataViews = this.S.UI.interfaceParts.dataViewSelector;
		dataViews.addDataField({
			type:'button',
			onClick: function() {
				this.R.setVisualization('tech');
				this.parent.hide();
				this.S.UI.toggleGlobeTooltip(true,function(point){
					return Math.round((point.tech)*10)/10 + ' parts';
				});
			}
		}).label('ui:buttons.dataviews_inner.tech');
		dataViews.addDataField({
			type:'button',
			onClick: function() {
				this.R.setVisualization('trees');
				this.parent.hide();
				this.S.UI.toggleGlobeTooltip(true,function(point){
					return Math.round((point.trees)*10)/10 + ' vegetation';
				});
			}
		}).label('ui:buttons.dataviews_inner.trees');
	},
	onStart: function(callback) {
		// Code to start the simulation
		var startRandomizer = 1000 + Math.round(Math.random()*4000);
		var randPoint = null;

		// Loop through all the points and pick the starting point, the point with population closest to a random number
		// don't want to start in an area with no people, but not in a huge city either.
		for(var i = 0, n = this.S.points.length; i < n; i++) {
			if(this.S.points[i].total_pop) {
				if(!randPoint) {
					randPoint = this.S.points[i];
				} else {
					if(Math.abs(randPoint.total_pop - startRandomizer) > Math.abs(this.S.points[i].total_pop - startRandomizer))
						randPoint = this.S.points[i];
				}
			}
		}
		// Create the fort/factory location
		this.fort = randPoint;
		this.S.modules['factory'].val('locations',randPoint,'append');

		// Send the starting point back to the callback function to start the simulation
		callback(randPoint);
	},
	name: 'Self-Replicating Robots',
	description: 'Robots make more of themselves using ',
	dependencies: ['factory'],
	children: ['movement.base','fight','reproducer.upgrade-repro']
};