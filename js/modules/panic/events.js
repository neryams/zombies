/*
	Panic: module for activating various modules based on world panic
*/
exports.type = 'event';
exports.run = function() {
	if(this.S.status.panic > 0) {
		// Check world panic, level up is panic is higher than the defined threshold
		if(this.S.status.panic > this.panicThresholds[this.currPanicLevel]) {
			if(this.panicThresholds.length > this.currPanicLevel){
				this.addGlobalNews(this.currPanicLevel);
				this.currPanicLevel++;
			}
			else {
				this.addGlobalNews('end');
				this.currPanicLevel = 0;
				this.worldPanicBar.hide();
			}
		}

		// Clamp panic above minimum for the level
		if(this.S.status.panic < this.panicThresholds[this.currPanicLevel - 1]) {
			this.S.status.panic = this.panicThresholds[this.currPanicLevel - 1];
		}

		// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
		this.S.status.world_panic = (this.S.status.panic - this.panicThresholds[this.currPanicLevel - 1]) / (this.panicThresholds[this.currPanicLevel] - this.panicThresholds[this.currPanicLevel - 1]);

		// Check country panic levels, level up is panic is higher than the defined threshold
		for(var i = 1; i < this.S.countries.length; i++) {
			if(this.S.countries[i].panic > 0) {
				if(this.S.countries[i].panic > this.countryPanicThresholds[this.S.countries[i].currPanicLevel]) {
					// If the panic level is past the maximum, turn off the growth.
					if(this.countryPanicThresholds.length > this.S.countries[i].currPanicLevel) {
						this.addCountryNews(this.S.countries[i].currPanicLevel, this.S.countries[i].name);
						this.S.countries[i].currPanicLevel++;
					}
					else {
						this.addCountryNews('end', this.S.countries[i].name);
						this.S.countries[i].currPanicLevel = 0;
					}
				}

				// Clamp panic above minimum for the level
				if(this.S.countries[i].panic < this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) {
					this.S.countries[i].panic = this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1];
				}
			}

			// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
			this.S.status['country_panic-'+i] = (this.S.countries[i].panic - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) / (this.countryPanicThresholds[this.S.countries[i].currPanicLevel] - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]);
		}
	}

};
exports.options = {
	init: function () {
		this.addGlobalNews = function(panicLevel) {
			this.S.UILink.addNews('world_research.' + panicLevel);
		};
		this.addCountryNews = function(panicLevel, name) {
			this.S.UILink.addNews('country_military.' + panicLevel, [name]);
		};

		for(var i = 1; i < this.S.countries.length; i++) {
			this.S.countries[i].currPanicLevel = 1;
		}
		this.panicThresholds = [0,1000,100000,1000000];
		this.currPanicLevel = 1;
		this.countryPanicThresholds = [0,500,5000,160000,320000];
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
	children: ['panic.applyToPoint','panic.applyToGlobal']
};