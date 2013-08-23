/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
new Module('spread', function(current,strength) {
	this.S.countries[current.country].panic += current.panic;
	this.S.properties.panic += current.panic;
	current.panic /= 2;
},{
	alwaysActive: true
})