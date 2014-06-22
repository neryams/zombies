/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	for(var i = 0; i < this.armyBases.length; i++) {
		var current = this.armyBases[i].armyBase;
		if(current.productionSpeed > this.baseInterval || this.S.status.iteration % (this.baseInterval / current.productionSpeed) === 0) {
			var armySize = Math.ceil(current.productionSpeed / this.baseInterval);

			this.S.modules['armies.armies'].addNew(current, armySize);
		}
	}
};
exports.options = {
	init: function(dataPoints) {
		this.baseInterval = 10;
		this.armyBases = [];

		var ArmyBase = function(country, location) {
			this.location = location;
			this.country = country;
		};
		ArmyBase.prototype = {
			strength: 1,
			location: {
				lat: 0,
				lng: 0
			},
			productionSpeed: 0
		};

		this.createBase = function(country) {
			if(!this.isActive())
				this.activate();

			var countryPoints = [],
				countryId = country.id;
			for(var i = 0, n = dataPoints.length; i < n; i++) {
				if(dataPoints[i].country && countryId == dataPoints[i].country.id)
					countryPoints.push(i);
			}
			var randPoint = countryPoints[ Math.floor(Math.random() * countryPoints.length) ];

			var newBase = dataPoints[randPoint];
			this.armyBases.push(newBase);
			newBase.armyBase = new ArmyBase(country, newBase);
			newBase.armyBase.productionSpeed = 1;

			this.S.UILink.rendererDecal('armybase' + newBase.id, {
				lat: newBase.lat,
				lng: newBase.lng,
				size: 5,
				texture: 'armybase',
				opacity: 1
			});
		};

	},
	ui: function() {
	},
	dependencies: ['armies.armies'],
	alwaysActive: true
};