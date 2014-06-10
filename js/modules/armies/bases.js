/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	for(var i = 0; i < this.armyBases.length; i++) {
		var current = this.armyBases[i].armyBase;
		if(current.productionSpeed > this.baseInterval || this.S.status.iteration % (this.baseInterval / current.productionSpeed) === 0) {
			var robotsCreated = Math.ceil(current.productionSpeed / this.baseInterval);
			var newArmy = this.createArmy(current.location, robotsCreated);

			this.S.UILink.updateHorde('swords', newArmy);
			this.armies.push(newArmy);
		}
	}
};
exports.options = {
	init: function(dataPoints) {
		this.baseInterval = 10;
		this.armyBases = [];
		this.armies = [];

		var UILink = this.S.UILink;

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

		var Army = function(base, size) {
			this.location = base;
			this.size = size;

			UILink.updateHorde('swords', this);
		};
		Army.prototype = {
			size: 0,
			location: {
				lat: 0,
				lng: 0
			}
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
				size: 8,
				texture: 'armybase',
				opacity: 1
			});
		};
		this.createArmy = function(base, size) {
			var newArmy = new Army(base, size);
			return newArmy;
		};

		this.S.UILink.addNewHordeType('swords', 20, {
			iconSizeMin: 2,
			iconSizeMax: 4,
			opacity: 1,
			randomize: false
		});
	},
	ui: function() {
	},
	dependencies: ['shipping.seaMove', 'pathfind'],
	alwaysActive: true
};