/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
new Module('spread', function(current,strength) {
	this.S.countries[current.location.country].panic += current.location.panic;
	this.S.properties.panic += current.location.panic;
	current.location.panic /= 2;

	if(debug.console)
		return 'panic change: ' + (current.location.panic*2) + '<br />world panic change: ' + this.S.properties.panic + '<br />' + this.S.countries[current.location.country].name+' panic change: '+this.S.countries[current.location.country].panic;
},{
	alwaysActive: true
})