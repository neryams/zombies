/* 
	Population: Module to change the infect rate based on population density
*/
new Module('infect', function(current,target,strength) {
	var lat = Math.floor(Math.abs(current.lat));
	var area = this.S.bakedValues.latDistances[lat][0] * this.S.bakedValues.latDistances[lat][1]; // square km
	strength.encounterProbability *= Math.sqrt((current.infected + current.total_pop) / area);
	strength.spreadChance *= Math.log(current.infected * 10);

	strength.zombieStrength *= Math.log((current.infected) / area + Math.E);
	strength.humanStrength *= Math.log((current.total_pop) / area + Math.E);

	strength.panic *= current.infected;
	if(strength.panic > current.total_pop)
		strength.panic = current.total_pop;
},{
	runtime: 15,
	alwaysActive: true
})