/* 
	Process Panic: Add panic to location
*/
exports.type = 'infect';
exports.run = function(current,target,strength) {
	// Contact infection on self tile
	if(strength.panic > 0) {
		current.location.panic += strength.panic;
	}
};
exports.options = {
	runtime: 21,
	dependencies: ['event-panic','base-population']
};