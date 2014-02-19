/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
exports.type = 'spread';
exports.run = function(current,strength) {
	this.S.countries[current.location.country].panic += current.location.panic;
	this.S.properties.panic += current.location.panic;
	current.location.panic /= 2;

	if(debugMenu.console)
		return 'panic change: ' + (current.location.panic*2) + '<br />world panic change: ' + this.S.properties.panic + '<br />' + this.S.countries[current.location.country].name+' panic change: '+this.S.countries[current.location.country].panic;
};
exports.options = {
	alwaysActive: true
};