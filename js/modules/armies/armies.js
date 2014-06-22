/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	for(var i = 0; i < this.armies.length; i++) {
		var army = this.armies[i];
		// Army has no path, get a new one
		if(!army.route) {
			var destination = this.S.modules['panic.applyToGlobal'].getMaxPanic(army.country.id);
			if(destination.id !== army.location.id) {
				var path = this.S.modules.pathfind.search(army.location, destination, 'both');
				army.setPath(path);
			}
		}

		var lastLocation = army.location;
		army.advance();
		if(lastLocation.id !== army.location.id)
			this.S.UILink.updateHorde('e1', army);
	}
};
exports.options = {
	init: function() {
		var UILink = this.S.UILink,
			armyCount = 0,
			armyInitCount = 10,
			defaultWalkSpeed = 100;

		this.S.UILink.addNewHordeType('e1', armyInitCount, {
			iconSizeMin: 8,
			iconSizeMax: 8,
			opacity: 1
		});
		this.armies = [];

		this.addNew = function(base, size) {
			if(size) {
				var newArmy = new Army(armyCount, base, size);
				armyCount++;
				this.armies.push(newArmy);
				return newArmy;
			}
		};

		var Army = function(id, base, size) {
			this.location = base.location;
			this.country = base.country;
			this.size = size;
			Army.prototype.nextId++;
			this.id = id;

			UILink.updateHorde('e1', this);
		};
		Army.prototype = {
			size: 0,
			walkSpeed: defaultWalkSpeed,
			movePoints: 0,
			location: {
				lat: 0,
				lng: 0
			},
			advance: function() {
				if(this.route && this.route.length > 0) {
					this.movePoints += this.walkSpeed;
					while(this.movePoints > this.nextPointDistance()) {
						this.movePoints -= this.nextPointDistance();
						this.location = this.route.pop();
						if(this.route.length === 0) {
							delete this.route;
							break;
						}
					}
					return this.location;
				}
			},
			nextPointDistance: function() {
				if(this.route)
					return this.location.getDistanceTo(this.route[this.route.length - 1]);
			},
			setPath: function(path) {
				this.route = path.reverse();
			}
		};
	},
	dependencies: ['pathfind']
};