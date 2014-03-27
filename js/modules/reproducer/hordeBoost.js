exports.type = 'infect';
exports.run = function(current, passData) {
	if(current.size > 0) {
		var lat = Math.floor(Math.abs(current.location.lat));
		var area = this.S.bakedValues.latDistances[lat][0] * this.S.bakedValues.latDistances[lat][1]; // square km
		passData.collect *= Math.sqrt((current.size) / area + 1);
	}
};
exports.options = {
	runtime: 15
};