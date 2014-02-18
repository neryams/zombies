/*
	Panic: module for activating various modules based on world panic
*/
new Module('event', function() {
	if(this.S.properties.panic > 0) {
		this.S.properties.panic = Math.ceil(this.S.properties.panic * 0.95);
		if(this.S.properties.panic > this.panicThresholds[this.currPanicLevel]) {
			switch(this.currPanicLevel) {
				case 1:
					this.S.modules['vaccine'].startResearch();
					this.S.UI.addNews('world_research.0');
					break;
				case 2:
					this.S.modules['vaccine'].researchRate(2);
					this.S.UI.addNews('world_research.1');
					break;
				case 3:
					this.S.modules['vaccine'].researchRate(4);
					this.S.UI.addNews('world_research.2');
					break;
				case 4:
					this.S.modules['vaccine'].researchRate(0);
					this.S.UI.addNews('world_research.end');
					break;
			}
			if(this.panicThresholds.length > this.currPanicLevel)
				this.currPanicLevel++;
			else
				this.currPanicLevel = 0
		}
		if(this.S.properties.panic < this.panicThresholds[this.currPanicLevel - 1]) {
			this.S.properties.panic = this.panicThresholds[this.currPanicLevel - 1];			
		}
		if(this.worldPanic.visible && this.currPanicLevel > this.panicThresholds.length - 1) {
			this.worldPanic.hide();
		}

		for(var i = 1; i < this.S.countries.length; i++) {
			if(this.S.countries[i].panic > 0) {
				this.S.countries[i].panic = Math.ceil(this.S.countries[i].panic * 0.95);
				if(this.S.countries[i].panic < this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) {
					this.S.countries[i].panic = this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1];			
				}
				if(this.S.countries[i].panic > this.countryPanicThresholds[this.S.countries[i].currPanicLevel]) {
					switch(this.S.countries[i].currPanicLevel) {
						case 1:
							if(this.S.modules['armies'].createArmy(i))
								this.S.UI.addNews('country_military.0',this.S.countries[i].name);
							break;
						case 2:
							if(this.S.modules['armies'].boostArmy(2,i))
								this.S.UI.addNews('country_military.1',this.S.countries[i].name);
							break;
						case 3:
							if(this.S.modules['armies'].boostArmy(2,i))
								this.S.UI.addNews('country_military.2',this.S.countries[i].name);
							break;
						case 4:
							if(this.S.modules['vaccine'].researchRate(0,i))
								this.S.UI.addNews('country_military.end',this.S.countries[i].name);
							break;
					}
					// If the panic level is past the maximum, turn off the growth.
					if(this.countryPanicThresholds.length > this.S.countries[i].currPanicLevel)
						this.S.countries[i].currPanicLevel++;
					else
						this.S.countries[i].currPanicLevel = 0
				}				
			}

			// Panic to display is progress to next level, so (panic increase since last level up) / (difference between this level and next level)
			this.S.UIData['country_panic-'+i] = (this.S.countries[i].panic - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) / (this.countryPanicThresholds[this.S.countries[i].currPanicLevel] - this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]);
		}
	}

	this.S.UIData['world_panic'] = (this.S.properties.panic - this.panicThresholds[this.currPanicLevel - 1]) / (this.panicThresholds[this.currPanicLevel] - this.panicThresholds[this.currPanicLevel - 1]);
},{
	init: function () {
		for(var i = 1; i < this.S.countries.length; i++) {
			this.S.countries[i].currPanicLevel = 1;
		}
		this.panicThresholds = [0,1000,1000000,30000000];
		this.currPanicLevel = 1;
		this.countryPanicThresholds = [0,400,80000,160000,320000];
        this.worldPanic = this.S.UI.interfaceParts.stats.addDataField('progressBar',{
        	title: 'ui:labels.world_panic',
        	dynamic: 'world_panic',
        	width: 186
        });
	},
	alwaysActive: true,
	children: ['vaccine','panicAttrib']
})