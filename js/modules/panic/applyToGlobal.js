/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
exports.type = 'spread';
exports.run = function(location) {
	if(location.panic) {
		if(location.country) {
			if(this.countryPanic[location.country.id] === undefined)
				this.countryPanic[location.country.id] = 0;
			this.countryPanic[location.country.id] += location.panic;
			location.country.panic = this.countryPanic[location.country.id];
		}
		this.globalPanic += location.panic;

		this.S.status.panic = this.globalPanic;
	}
};
exports.options = {
	onTick: function() {
		this.countryPanic = [];
		this.globalPanic = 0;
	},
	dependencies: ['panic.events']
};