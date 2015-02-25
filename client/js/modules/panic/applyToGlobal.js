/*
	PanicAttrib: Module for applying local panic to country and world panic.
*/
exports.type = 'spread';
exports.run = function(location) {
	if(location.panic) {
		if(location.country) {
			// Add every location's panic to the coutry's panic
			if(this.countryPanic[location.country.id] === undefined)
				this.countryPanic[location.country.id] = 0;
			this.countryPanic[location.country.id] += location.panic;
			location.country.panic = this.countryPanic[location.country.id];

			// Ensure the max panic in the country is recorded
			if(this.countryMaxPanic[location.country.id] === undefined || this.countryMaxPanic[location.country.id].panic < location.panic)
				this.countryMaxPanic[location.country.id] = location;
		}
		this.globalPanic += location.panic;

		this.S.status.panic = this.globalPanic;
	}
};
exports.options = {
	init: function() {
		this.countryMaxPanic = [];

		this.getMaxPanic = function(countryId) {
			return this.countryMaxPanic[countryId];
		};
	},
	onTick: function() {
		this.countryPanic = [];
		this.globalPanic = 0;
	},
	dependencies: ['panic.events']
};