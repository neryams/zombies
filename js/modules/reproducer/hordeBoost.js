exports.type = 'infect';
exports.run = function(current, passData) {
	if(current.size > 0) {
		var area = current.location.getDistanceTo(0) * current.location.getDistanceTo(1); // square km
		passData.collect *= Math.sqrt((current.size) / area + 1);
	}
};
exports.options = {
	runtime: 15
};