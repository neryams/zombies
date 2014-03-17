/* 
	Population: Module to change the infect rate based on population density
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	var lat = Math.floor(Math.abs(current.location.lat));
	var area = this.S.bakedValues.latDistances[lat][0] * this.S.bakedValues.latDistances[lat][1]; // square km
	passData.encounterProbability *= Math.sqrt((current.size + current.location.total_pop) / area);
	passData.transferChance *= Math.log(current.size*10);

	passData.zombieStrength *= Math.log((current.size) / area + Math.E);
	passData.humanStrength *= Math.log((current.location.total_pop) / area + Math.E);

	passData.panic *= current.size;
	if(passData.panic > current.location.total_pop)
		passData.panic = current.location.total_pop;
};
exports.options = {
	runtime: 15,
	alwaysActive: true
};