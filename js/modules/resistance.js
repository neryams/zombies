/* 
	Resistance: Module to make humans kill zombies
*/
new Module('event', function() {
	
},{
	init: function() {
		module = this;
		this.armies = [];
		this.Army = function(nationality,size) {
			this.nationality = nationality;
			this.size = size;
			this.lat = module.S.countries[nationality].capitol.lat;
			this.lat = module.S.countries[nationality].capitol.lng;
		}
		this.Army.prototype = {
			nationality: 0,
			size: 0,
			experience: 0
		}

		this.startResistance = function(country) {
		}

		this.boostResistance = function(val, country) {
		}
	},
	runtime: 9,
	alwaysActive: true
})