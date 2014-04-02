/*
	Panic: module for activating various modules based on world panic
*/
exports.type = 'event';
exports.run = function() {
	if(this.S.properties.panic > 0) {
		// Check world panic, level up is panic is higher than the defined threshold
		if(this.S.properties.panic > this.panicThresholds[this.currPanicLevel]) {
			if(this.panicThresholds.length > this.currPanicLevel){
				this.S.UI.addNews('world_research.' + this.currPanicLevel);
				this.currPanicLevel++;
			}
			else {
				this.S.UI.addNews('world_research.end');
				this.currPanicLevel = 0;
				this.worldPanic.hide();
			}
		}

		// Clamp panic above minimum for the level
		if(this.S.properties.panic < this.panicThresholds[this.currPanicLevel - 1]) {
			this.S.properties.panic = this.panicThresholds[this.currPanicLevel - 1];
		}

		// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
		this.S.UIData['world_panic'] = (this.S.properties.panic - this.panicThresholds[this.currPanicLevel - 1]) / (this.panicThresholds[this.currPanicLevel] - this.panicThresholds[this.currPanicLevel - 1]);

		// Check country panic levels, level up is panic is higher than the defined threshold
		for(var i = 1; i < this.S.countries.length; i++) {
			if(this.S.countries[i].panic > 0) {
				if(this.S.countries[i].panic > this.countryPanicThresholds[this.S.countries[i].currPanicLevel]) {
					// If the panic level is past the maximum, turn off the growth.
					if(this.countryPanicThresholds.length > this.S.countries[i].currPanicLevel) {
						this.S.UI.addNews('country_military.' + this.S.countries[i].currPanicLevel, this.S.countries[i].name);
						this.S.countries[i].currPanicLevel++;
					}
					else {
						this.S.UI.addNews('country_military.end', this.S.countries[i].name);
						this.S.countries[i].currPanicLevel = 0;
					}
				}

				// Clamp panic above minimum for the level
				if(this.S.countries[i].panic < this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) {
					this.S.countries[i].panic = this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1];
				}
			}

			// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
			this.S.UIData['country_panic-'+i] = (this.S.countries[i].panic - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) / (this.countryPanicThresholds[this.S.countries[i].currPanicLevel] - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]);
		}
	}

};
exports.options = {
	init: function () {
		for(var i = 1; i < this.S.countries.length; i++) {
			this.S.countries[i].currPanicLevel = 1;
		}
		this.panicThresholds = [0,1000,1000000,30000000];
		this.currPanicLevel = 1;
		this.countryPanicThresholds = [0,400,80000,160000,320000];

		this.worldPanic = this.S.UI.interfaceParts.stats.addDataField({
			type: 'progressBar',
			title: 'ui:labels.world_panic',
			dynamic: 'world_panic',
			width: 186
		});
	},
	alwaysActive: true,
	children: ['panic.applyToPoint','panic.applyToGlobal']
};