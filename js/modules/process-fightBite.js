/* 
	Process Bite: infect healthy people passively over the air.
*/
exports.type = 'infect';
exports.run = function(current,target,strength) {
	// Contact infection on self tile
	var totalStrength = strength.zombieStrength + strength.humanStrength;

	if(strength.encounterProbability && totalStrength > 0) {
		var rand = Math.random();
		var self_encounters = Math.round(((rand*2 + (rand*10%1)*2 + (rand*100%1)*2)/3) * (strength.encounterProbability));
		var humanLosses = Math.round(self_encounters*(strength.zombieStrength/totalStrength));
		zombieLosses = self_encounters - humanLosses;
		totalInfected = Math.round(humanLosses * strength.infectChance);
		totalKilled = humanLosses - totalInfected;

		if(totalInfected > 0 || totalKilled > 0) {
			// Update the population record on the square
			current.location.total_pop -= totalInfected;
			current.location.total_pop -= totalKilled;
			current.size += totalInfected;
			target.dead += totalKilled;

			if(current.size < zombieLosses)
				zombieLosses = current.size;

			current.size -= zombieLosses;

			// Update world pop numbers
			this.S.modules['event-worldStats'].val('world_pop',totalInfected+totalKilled,'-');
		}

		strength.panic *= strength.panic * self_encounters;
	}
};
exports.options = {
	runtime: 20,
	children: ['fight-zombie','infect-bite']
};