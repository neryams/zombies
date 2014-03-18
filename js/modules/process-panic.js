/* 
	Process Panic: Add panic to location
*/
exports.type = 'infect';
exports.run = function(current,passData,multiplier) {
	// Contact infection on self tile
	if(passData.panic > 0) {
		current.location.panic += passData.panic * multiplier;
	}
};
exports.options = {
	runtime: 21,
	dependencies: ['event-panic','base-population']
};