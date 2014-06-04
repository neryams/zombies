/*
	Panic: module for activating various modules based on world panic
*/
exports.type = 'event';
exports.run = function() {
	if(this.S.status.panic > 0) {
		var thresholds = this.countryPanicThresholds;
		// Check country panic levels, level up is panic is higher than the defined threshold
		for(var i = 1; i < this.S.countries.length; i++) {
			if(this.S.countries[i].panicLevel !== 'max') {
				var panic = this.S.countries[i].panic;
				var panicLevel = this.S.countries[i].panicLevel;

				if(panic > thresholds[panicLevel + 1])
					this.raisePanic(this.S.countries[i]);

				// Clamp panic above minimum for the level
				panic = Math.max(panic, thresholds[panicLevel]);

				// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
				this.S.status['country_panic-'+i] = (panic - thresholds[panicLevel]) / (thresholds[panicLevel + 1] - thresholds[panicLevel]);
			}
		}
	}

};
exports.options = {
	init: function () {
		var S = this.S;
		for(var i = 1; i < S.countries.length; i++) {
			S.countries[i].panicLevel = 0;
			S.countries[i].panic = 0;
		}
		this.countryPanicThresholds = [
			0,
			10,
			300,
			10000
		];

		var panicFunctions = [
			null,
			function(country) {
				S.modules['armies.bases'].createBase(country);
			},
			function(country) {

			},
			function(country) {

			}
		];
		this.raisePanic = function(country) {
			country.panicLevel++;

			S.UILink.addNews('country_military.' + country.panicLevel, [country.name]);
			panicFunctions[country.panicLevel](country);

			// If panic level is maxed, make sure you don't add any more
			if(this.countryPanicThresholds[country.panicLevel + 1] === undefined)
				country.panicLevel = 'max';
		};
	},
	ui: function(UI) {
		var mainInfo = UI.interfaceParts.main_info;

		this.worldPanicBar = mainInfo.addDataField({
			type: 'progressBar',
			title: 'ui:labels.world_panic',
			dynamic: 'world_panic'
		}).prependTo(mainInfo);
	},
	alwaysActive: true,
	children: ['panic.applyToPoint','panic.applyToGlobal'],
	dependencies: ['armies.bases']
};