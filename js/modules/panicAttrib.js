/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
new Module('spread', function(current,strength) {
	this.S.countries[current.country].panic += current.panic;
	this.S.properties.panic += current.panic;
	current.panic /= 2;

	if(debug.console)
		return 'panic change: ' + (current.panic*2) + '<br />world panic change: ' + this.S.properties.panic + '<br />' + this.S.countries[current.country].name+' panic change: '+this.S.countries[current.country].panic;
},{
	alwaysActive: true
})