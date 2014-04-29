/*
	Mobility: Module to apply the mobility value into the encounter chance after other modules finish with it
*/
exports.type = 'spread';
exports.run = function(location) {
	if(this.S.modules['movement.base'].val('canDetect')) {
		var detectStrength = this.S.modules['movement.base'].val('detectStrength');
		var direction = this.S.iteration % 4;

		if(location.hordes.length > 0) {
			var dirA = this.detectDirection(location, direction, detectStrength),
				dirB = this.detectDirection(location, direction + 4, detectStrength);

			for(var i = 0; i < location.hordes.length; i++) {
				// Go around the square calculating the opposing directions
				var currentHorde = location.hordes[i];
				if(currentHorde.moveWeighting === undefined)
					currentHorde.moveWeighting = [-1,-1,-1,-1,-1,-1,-1,-1];

				currentHorde.moveWeighting[direction] = dirA;
				currentHorde.moveWeighting[direction + 4] = dirB;
			}
		}
	}
};
exports.options = {
	init: function() {
		this.smellItem = 'tech';

		this.detectDirection = function (dataPoint, direction, maxDistance) {
			var returnAmount = 0,
				totalDistance = 1,
				i = 0;
			while(totalDistance < maxDistance) {
				if(direction % 2 === 0) // horizontal and vertical
					dataPoint = dataPoint.adjacent[direction/2];
				else
					dataPoint = dataPoint.adjacent[Math.floor(direction/2)].adjacent[Math.ceil(direction/2)%4];

				if(i === 0 && dataPoint.water && !this.S.modules['movement.base'].val('swimming')) {
					return 0;
				} else {
					this.calculatePointNearbyProp(dataPoint);

					var reduceBy = 1 - totalDistance / maxDistance;

					if(i < dataPoint.nearby_prop.length) {
						returnAmount += dataPoint.nearby_prop[i] / (totalDistance * totalDistance);
					} else {
						returnAmount += dataPoint.nearby_prop[dataPoint.nearby_prop.length - 1] / (totalDistance * totalDistance);
					}
				}

				if(direction % 2 === 0) { // horizontal and vertical
					totalDistance += this.S.bakedValues.latDistances[
							Math.floor( Math.abs(dataPoint.lat) )
						][
							direction/2
						];
				} else { // diagonal
					totalDistance += this.S.bakedValues.latDistances[
							Math.floor( Math.abs(dataPoint.lat) )
						][
							Math.floor(direction / 2) + 4
						];
				}
				i++;
			}
			return returnAmount;
		};

		this.calculatePointNearbyProp = function(location) {
			if(location.nearby_prop === undefined)
				location.nearby_prop = [];

			var totals = location[this.smellItem];
			location.nearby_prop[0] = totals;

			if(location.nearby_prop.length <= 1 || (this.S.iteration - location.nearby_prop.lastCalculated > 10 && location.nearby_prop[location.nearby_prop.length-1] > 0)) {
				var steps,target = location;

				for (var j = 1; j <= 15; j++) {
					target = target.adjacent[0];
					steps = j;
					do {
						target = target.adjacent[1];
						totals += target[this.smellItem];
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[2];
						totals += target[this.smellItem];
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[3];
						totals += target[this.smellItem];
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[0];
						totals += target[this.smellItem];
					} while (--steps);
					steps = j;
					do {
						target = target.adjacent[1];
						totals += target[this.smellItem];
					} while (--steps);

					location.nearby_prop[j] = totals;
				}
				location.nearby_prop.lastCalculated = this.S.iteration;
			}
		};
	},
	runtime: 11,
	dependencies: ['movement.base']
};