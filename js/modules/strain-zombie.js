/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
exports.type = 'strain';
exports.run = function(current,target,strength) {
	strength.encounterProbability = 0;
	strength.zombieStrength = 0;
	strength.humanStrength = 0;
	strength.infectChance = 0;
	strength.transferStrength = 0;
	strength.transferChance = 0;
	strength.mobility = 0;
	strength.panic = 0;
};
exports.options = {
	init: function(callback) {
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

		// Create the starting seed for the upgrade tree. Strains should only have one upgrade. Add other free upgrades via other modules.
		// Upgrades attatched to a strain get a special ID "strain", the center of the uprgade grid
		this.S.addUpgrades(this,
			{cost:0,paths:[],name:'Virus',active:true, description:'Basic Virus. Creates slow, witless zombies that enjoy eating healthy brains.'} // setting active to true makes the upgrade automatically purchased
		);

		// Send the starting point back to the callback function to start the simulation
		callback(randPoint);
	},
	children: ['base-movement','process-fightBite']
};