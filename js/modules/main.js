/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
new Module('strain', function(current,target,strength) {
	var newInfection = false,
		totalInfected = 0,
		totalKilled = 0,
		zombieLosses = 0;
	if(target.total_pop > 0) {
		var rand = Math.random();
		// Human strength and zombie strength should be directly comparable.
		if(target.dead == undefined)
			target.dead = 0;

		// Newly infect adjacent tiles
		if(strength.spreadChance && target.infected == 0) {
			if(rand < (strength.spreadChance)) {
				totalInfected = Math.round(rand * strength.spreadChance);
				if(totalInfected > 0 && !target.active) {
					this.S.activePoints.push(target);
					target.active = true;				
				}
			}
		// Or further infect adjacent tiles with zombies already in them
		} else if(strength.spreadChance) {
			totalInfected = Math.round(rand * strength.spreadChance);
		}

		this.attack(target, totalInfected);

		if(debug.console)
			var result = "targetInfected: "+totalInfected;

		// Infect self tile
		if(strength.encounterProbability) {
			var self_encounters = Math.round(((rand*2 + (rand*10%1)*2 + (rand*100%1)*2)/3) * (strength.encounterProbability)),
				totalStrength = strength.zombieStrength + strength.humanStrength,
				humanLosses = Math.round(self_encounters*(strength.zombieStrength/totalStrength));
			zombieLosses = self_encounters - humanLosses;
			totalInfected = Math.round(humanLosses * strength.infectChance);
			totalKilled = humanLosses - totalInfected;
		}

		this.attack(current, totalInfected, totalKilled, zombieLosses);

		if(debug.console)
			result += "<br />selfInfected: "+totalInfected+"<br />selfHumansKilled: "+totalKilled+"<br />selfZombiesKilled: "+zombieLosses;

		this.S.properties.panic += strength.panic;
		this.S.countries[target.country].panic += strength.panic;

		if(debug.console)
			return result;
	}
},{
	init: function(callback) {
		var candidate = [0,null];
		var randCountry = Math.floor((this.S.countries.length-1) * Math.random()) + 1;

		this.attack = function(target, totalInfected, totalKilled, zombiesKilled) {
			if(!totalKilled)
				totalKilled = 0;
			if(!zombiesKilled)
				zombiesKilled = 0;
			if(target.total_pop < totalKilled)
				totalKilled = target.total_pop;
			if(target.total_pop< totalInfected + totalKilled)
				totalInfected = target.total_pop - totalKilled;
			if(target.infected < zombiesKilled)
				zombiesKilled = target.infected;

			target.total_pop -= totalInfected;
			target.total_pop -= totalKilled;
			target.infected += totalInfected;
			target.infected -= zombiesKilled;
			target.dead += totalKilled;

			// Update world pop numbers
			this.S.modules['worldStats'].val('world_pop',totalInfected+totalKilled,'-');
			this.S.modules['worldStats'].val('world_infected',totalInfected,'+');
			this.S.modules['worldStats'].val('world_infected',zombiesKilled,'-');

			// Test removing panic from main, too confusing. // Add the cumulative panic level into the country and the world
			// return Math.round((totalInfected*1.5+totalKilled) * (target.total_pop/this.S.config.max_pop + 0.5));
		}

		this.S.addUpgrades(this,
			{cost:0,paths:[],name:'Virus',active:true, description:'Basic Virus. Creates slow, witless zombies that enjoy eating healthy brains.'} // setting active to true makes the upgrade automatically purchased
		);

		callback(this.S.countries[randCountry].capitol);
	},
	children: ['worldStats','population','bite','movement','panic'/*,'viralInfect'*/]
})