/* 
	Process Bite: infect healthy people passively over the air.
*/
exports.type = 'infect';
exports.run = function(current, passData, multiplier) {
	// Contact infection on self tile
	var totalStrength = passData.zombieStrength + passData.humanStrength;

	if(passData.encounterProbability && totalStrength > 0) {
		var self_encounters = Math.round(passData.randNorm * (passData.encounterProbability)) * multiplier;
		var humanLosses = Math.round(self_encounters*(passData.zombieStrength/totalStrength));
		var zombieLosses = self_encounters - humanLosses;

		if(humanLosses > 0) {
			if(current.location.total_pop < humanLosses)
				humanLosses = current.location.total_pop;
			current.location.total_pop -= humanLosses;

			if(current.size < zombieLosses)
				zombieLosses = current.size;
			current.size -= zombieLosses;

			passData.humansKilled = humanLosses;
			passData.robotsKilled = humanLosses;
			passData.target.dead += humanLosses;

			// Update world pop numbers
			this.S.modules['world-stats'].val('world_pop',humanLosses,'-');
		}

		passData.panic *= passData.panic * self_encounters;
	}
};
exports.options = {
	runtime: 20,
	children: ['upgrades.strength']
};