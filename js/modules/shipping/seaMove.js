/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
	for(var i = 0, n = this.boats.length; i < n; i++) {
		var boat = this.boats[i];
		
		this.S.UILink.updateHorde('boat', boat);

		if(!boat.advance()) {
			this.S.UILink.updateHorde('boat', boat, true);
			this.boats.splice(i, 1);
			n--;
			i--;
		}
	}
};
exports.options = {
	init: function() {
		var boatCount = 0,
			boatInitCount = 10;
		this.boats = [];

		this.S.UILink.addNewHordeType('boat', boatInitCount, {
			iconSizeMin: 20,
			iconSizeMax: 20,
			opacity: 1
		});

		this.addNew = function(path) {
			this.boats.push(new Boat(boatCount, path, 100));
			boatCount++;
		};

		var Boat = function(id, route, size) {
			this.id = id;
			this.route = route.reverse();
			this.size = size;

			this.advance();
		};
		Boat.prototype = {
			size: 0,
			advance: function() {
				this.location = this.route.pop();
				return this.location;
			}
		};
	}
};