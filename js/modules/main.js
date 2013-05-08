/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
new Module('strain', function(current,target,strength) {
	var newInfection = false,
		totalConverted = 0,
		totalKilled = 0;
	if(target.total_pop > 0) {
		var rand = Math.random();
		if(!current.infected && current.infected !== 0)
			current.infected = 0;
		// strength represents how many people are killed a day (50% chance 120 times a turn at 60 strength)
		if(target.dead == undefined)
			target.dead = 0;
		if(current.infected == 0)
			strength.infect = 0;
		if(target.id != current.id) {
			strength.kill = 0;
			strength.infectSelf = 0;
		}

		// Newly infect adjacent tiles
		if(strength.infect && target.infected == 0) {
			if(rand < (strength.infect/600)) {
				totalConverted = Math.round(rand * strength.infect/600);
				if(totalConverted > 0 && !target.active) {
					this.S.activePoints.push(target);
					target.active = true;				
				}
			}
		// Infect adjacent tiles with zombies already in them
		} else if(strength.infect) {
			totalConverted = Math.round(Math.sqrt(rand * strength.infect/4));
		// Infect self tile
		} else if(strength.infectSelf) {
			var self_affected = ((rand*2 + (rand*10%1)*2 + (rand*100%1)*2 - 3)*(current.infected/3)) + strength.infectSelf + strength.kill;
			if(self_affected < 0)
				self_affected = self_affected*-1;
			totalKilled = Math.round(self_affected * (strength.kill/(strength.infectSelf + strength.kill)));
			totalConverted = Math.round(self_affected * (strength.infectSelf/(strength.infectSelf + strength.kill)));
		}
		if(target.total_pop - totalKilled < 0)
			totalKilled = target.total_pop;
		if(target.total_pop - totalConverted - totalKilled < 0)
			totalConverted = target.total_pop - totalKilled;

		target.total_pop -= totalConverted;
		target.total_pop -= totalKilled;
		target.infected += totalConverted;
		target.dead += totalKilled;

		// Add the cumulative panic level into the country and the world
		strength.panic = Math.round((totalConverted*1.5+totalKilled) * (target.total_pop/this.S.config.max_pop + 0.5) * strength.panic / 10);
		this.S.properties.panic += strength.panic;
		this.S.countries[target.country].panic += strength.panic;
	}

	return newInfection;
},{
	init: function(callback) {
		var candidate = [0,null];
		var randCountry = Math.floor((this.S.countries.length-1) * Math.random()) + 1;

		this.S.addUpgrades(this,
			{cost:0,paths:[],name:'Virus',active:true, description:'Basic Virus. Creates slow, witless zombies that enjoy eating healthy brains.'} // setting active to true makes the upgrade automatically purchased
		);

		callback(this.S.countries[randCountry].capitol);
	},
	children: ['panic','worldStats','gridBoost','population','climate','seaports','vaccine','bite','viralInfect','movement']
})