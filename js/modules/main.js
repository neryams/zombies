/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
new Module('strain', function(current,target,strength) {
	var newInfection = false,
		totalInfected = 0,
		totalKilled = 0,
		zombieLosses = 0,
		// Human strength and zombie strength should be directly comparable.
		totalStrength = strength.zombieStrength + strength.humanStrength;

	if(debug.console)
		var result = '';

	// Non-contact infection to self or adjacent tiles
	if(target.total_pop > 0) {
		var rand = Math.random();
		if(target.dead == undefined)
			target.dead = 0;

		// If target has no zombies, newly infect
		if(strength.spreadChance && target.infected == 0) {
			if(rand < (strength.spreadChance)) {
				totalInfected = Math.round(rand * strength.spreadChance);
			}
		// Or further infect tiles with zombies already in them
		} else if(strength.spreadChance) {
			totalInfected = Math.round(rand * strength.spreadChance);
		}

		this.attack(target, totalInfected);

		if(debug.console)
			result += 'targetInfected: '+totalInfected+'<br />';
	}

	var self_encounters = 0;
	// Contact infection on self tile
	if(strength.encounterProbability && totalStrength > 0) {
		var rand = Math.random();
		self_encounters = Math.round(((rand*2 + (rand*10%1)*2 + (rand*100%1)*2)/3) * (strength.encounterProbability));
		var humanLosses = Math.round(self_encounters*(strength.zombieStrength/totalStrength));
		zombieLosses = self_encounters - humanLosses;
		totalInfected = Math.round(humanLosses * strength.infectChance);
		totalKilled = humanLosses - totalInfected;

		this.attack(current.location, totalInfected, current, totalKilled, zombieLosses);

		if(debug.console)
			result += 'selfInfected: '+totalInfected+'<br />selfHumansKilled: '+totalKilled+'<br />selfZombiesKilled: '+zombieLosses;
	}
	if(current.location.panic === undefined)
		current.location.panic = 0;
	current.location.panic += strength.panic*self_encounters;

	this.S.modules['worldStats'].val('squaresToUpdate',current.location,'append');
	this.S.modules['worldStats'].val('squaresToUpdate',target,'append');

	if(debug.console)
		return result + '<br />' + current.location.id + ' square change: '+strength.panic;
},{
	init: function(callback) {

		// Save the function that will perform the simulation based on strength, after the infect modules.
		this.attack = function(target, totalInfected, horde, totalKilled, zombiesKilled) {
			if(!totalKilled)
				totalKilled = 0;
			if(!zombiesKilled)
				zombiesKilled = 0;
			if(target.total_pop < totalKilled)
				totalKilled = target.total_pop;
			if(target.total_pop < totalInfected + totalKilled)
				totalInfected = target.total_pop - totalKilled;

			if(totalInfected > 0 || totalKilled > 0) {
				// Update the population record on the square
				target.total_pop -= totalInfected;
				target.total_pop -= totalKilled;
				target.infected += totalInfected;
				target.dead += totalKilled;

				if(target.infected < zombiesKilled)
					zombiesKilled = target.infected;
				
				target.infected -= zombiesKilled;

				if(!horde && totalInfected > 0) {
					var horde = new Horde(totalInfected, target);
					this.S.hordes.push(horde);
				}
				else
					horde.size += totalInfected

				// Update world pop numbers
				this.S.modules['worldStats'].val('world_pop',totalInfected+totalKilled,'-');
			}
		}

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

		// Create the starting seed for the upgrade tree
		this.S.addUpgrades(this,
			{cost:0,paths:[],name:'Virus',active:true, description:'Basic Virus. Creates slow, witless zombies that enjoy eating healthy brains.'} // setting active to true makes the upgrade automatically purchased
		);

		// Send the starting point back to the callback function to start the simulation
		callback(randPoint);
	},
	children: ['worldStats','population','bite','movement','panic','viralInfect']
})