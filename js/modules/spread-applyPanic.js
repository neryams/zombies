/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
exports.type = 'spread';
exports.run = function(current,passData) {
	current.location.country.panic += current.location.panic;
	this.S.properties.panic += current.location.panic;
	current.location.panic /= 2;

	if(debugMenu.active)
		return 'panic change: ' + (current.location.panic*2) + '<br />world panic change: ' + this.S.properties.panic + '<br />' + current.location.country.name+' panic change: '+current.location.country.panic;
};
exports.options = {
	dependencies: ['event-panic']
};