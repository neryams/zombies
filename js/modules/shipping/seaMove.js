/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	for(var i = 0, n = this.boats.length; i < n; i++) {
		var boat = this.boats[i];

		if(boat.route.length === 0) {
			this.S.UILink.updateHorde('boat', boat, true);
			this.boats.splice(i, 1);
			n--;
			i--;
		} else {
			boat.movePoints += this.boatSpeed;
			boat.advance();
			this.S.UILink.updateHorde('boat', boat);
		}
	}
};
exports.options = {
	init: function() {
		var UILink = this.S.UILink,
			boatCount = 0,
			boatInitCount = 10;
		this.boats = [];
		this.boatSpeed = 100;

		this.S.UILink.addNewHordeType('boat', boatInitCount, {
			iconSizeMin: 20,
			iconSizeMax: 20,
			opacity: 1,
			randomize: false
		});

		this.addNew = function(path, size) {
			if(size) {
				this.boats.push(new Boat(boatCount, path, size));
				boatCount++;
			}
		};

		var Boat = function(id, route, size) {
			this.id = id;
			this.route = route.reverse();
			this.size = size;

			this.location = this.route.pop();
			UILink.updateHorde('boat', this);
		};
		Boat.prototype = {
			size: 0,
			movePoints: 0,
			advance: function() {
				while(this.movePoints > this.nextPointDistance()) {
					this.movePoints -= this.nextPointDistance();
					this.location = this.route.pop();
					if(this.route.length === 0)
						break;
				}
				return this.location;
			},
			nextPointDistance: function() {
				return this.location.getDistanceTo(this.route[this.route.length - 1]);
			}
		};
	}
};