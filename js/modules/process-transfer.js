/* 
	Process Transfer: infect healthy people passively over the air.
*/
exports.type = 'infect';
exports.run = function(current,passData, multiplier) {
	// If passData.target has population, infect some of them
	if(passData.target.total_pop > 0) {
		if(passData.transferChance) {
			var totalInfected = Math.round(passData.rand * passData.transferChance / Math.pow(passData.targetDistance / passData.transferStrength + 1, 2) + Math.abs(passData.randNorm));
			if(passData.target.total_pop < totalInfected)
				totalInfected = passData.target.total_pop;

			if(totalInfected > 0) {
				totalInfected *= multiplier;
				passData.target.total_pop -= totalInfected;

				// If the infect target is the current location, add infected to current horde sometimes.
				if(current.location.id === passData.target.id && Math.round(passData.rand*100)%2 === 0) {
					current.size += totalInfected;
				// If the infect target is in a different square, create new horde always
				} else {
					this.S.hordes.sortPush(new Horde(totalInfected, passData.target));
				}
				this.S.modules['event-worldStats'].val('world_pop',totalInfected,'-');
			}
		}
	}
};
exports.options = {
	runtime: 20,
	children: ['transfer-air']
};