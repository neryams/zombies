/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	
};
exports.options = {
	init: function(dataPoints) {
		var UILink = this.S.UILink,
			armyBases = [];

		var ArmyBase = function(country, location) {
			this.location = location;
			this.country = country;
		};
		ArmyBase.prototype = {
			strength: 1,
			location: {
				lat: 0,
				lng: 0
			}
		};

		var Army = function(base, size) {
			this.location = base.location;
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
			armyBases.push(newBase);
			newBase.armyBase = new ArmyBase(country, newBase);

			this.S.UILink.rendererDecal('armybase' + newBase.id, {
				lat: newBase.lat,
				lng: newBase.lng,
				size: 8,
				texture: 'armybase',
				opacity: 1
			});
		};
		this.createArmy = function(base, size) {
			return new Army(base, size);
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