/* 
	Population: Module to change the infect rate based on population density
*/
exports.type = 'infect';
exports.run = function(current,target,strength) {
	var lat = Math.floor(Math.abs(current.location.lat));
	var area = this.S.bakedValues.latDistances[lat][0] * this.S.bakedValues.latDistances[lat][1]; // square km
	strength.encounterProbability *= Math.sqrt((current.size + current.location.total_pop) / area);
	strength.transferChance *= Math.log(current.size);

	strength.zombieStrength *= Math.log((current.size) / area + Math.E);
	strength.humanStrength *= Math.log((current.location.total_pop) / area + Math.E);

	strength.panic *= current.size;
	if(strength.panic > current.location.total_pop)
		strength.panic = current.location.total_pop;
};
exports.options = {
	runtime: 15,
	alwaysActive: true
};