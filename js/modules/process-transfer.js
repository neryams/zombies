/* 
	Process Transfer: infect healthy people passively over the air.
*/
exports.type = 'infect';
exports.run = function(current,target,strength) {
	// If target has population, infect some of them
	if(target.total_pop > 0) {
		var rand = Math.random();

		if(strength.transferChance) {
			var totalInfected = Math.round(rand * strength.transferChance);
			if(target.total_pop < totalInfected)
				totalInfected = target.total_pop;

			if(totalInfected > 0) {
				target.total_pop -= totalInfected;

				// If the infect target is the current location, add infected to current horde sometimes.
				if(current.location.id === target.id && rand > 0.5) {
					current.size += totalInfected
				// If the infect target is in a different square, create new horde always
				} else {
					this.S.hordes.sortPush(new Horde(totalInfected, target));
				}
			}
			this.S.modules['event-worldStats'].val('world_pop',totalInfected,'-');
		}
	}
};
exports.options = {
	runtime: 20,
	children: ['transfer-air']
};