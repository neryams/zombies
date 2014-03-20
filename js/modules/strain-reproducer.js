/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
exports.type = 'strain';
exports.run = function(current,passData) {
	passData.encounterProbability = 0;
	passData.zombieStrength = 0;
	passData.humanStrength = 0;
	passData.infectChance = 0;
	passData.transferStrength = 0;
	passData.transferChance = 0;
	passData.mobility = 0;
	passData.panic = 0;
};
exports.options = {
	init: function() {
		// Create the starting seed for the upgrade tree. Strains should only have one upgrade. Add other free upgrades via other modules.
		// Upgrades attatched to a strain get a special ID "strain", the center of the uprgade grid
		this.S.addUpgrades(this,
			{cost:0,paths:[],name:this.name,active:true, description:this.description} // setting active to true makes the upgrade automatically purchased
		);
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

		// Send the starting point back to the callback function to start the simulation
		callback(randPoint);
	},
	name: 'Self-Replicating Robots',
	description: 'Clones Selves',
	children: ['base-movement','process-fightBite']
};