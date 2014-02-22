/* 
	Process Bite: infect healthy people passively over the air.
*/
exports.type = 'infect';
exports.run = function(current,target,passData) {
	// Contact infection on self tile
	var totalStrength = passData.zombieStrength + passData.humanStrength;

	if(passData.encounterProbability && totalStrength > 0) {
		var rand = Math.random();
		var self_encounters = Math.round(((rand*2 + (rand*10%1)*2 + (rand*100%1)*2)/3) * (passData.encounterProbability));
		var humanLosses = Math.round(self_encounters*(passData.zombieStrength/totalStrength));
		var zombieLosses = self_encounters - humanLosses;
		var totalInfected = Math.round(humanLosses * passData.infectChance);
		var totalKilled = humanLosses - totalInfected;

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

		passData.panic *= passData.panic * self_encounters;
	}
};
exports.options = {
	runtime: 20,
	children: ['fight-zombie','infect-bite']
};