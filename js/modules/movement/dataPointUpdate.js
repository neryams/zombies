/*
	Mobility: Module to apply the mobility value into the encounter chance after other modules finish with it
*/
exports.type = 'spread';
exports.run = function(location) {
	if(this.S.modules['movement.base'].getCurrentSmellDistance()) {
		var smellItem = this.S.modules['movement.base'].getCurrentSmell();

		var detectStrength = this.S.modules['movement.base'].getCurrentSmellDistance();
		var direction = this.S.status.iteration % 4;

		if(location.hordes.length > 0) {
			var dirA = this.detectDirection(location, smellItem, direction, detectStrength),
				dirB = this.detectDirection(location, smellItem, direction + 4, detectStrength),
				self = this.detectDirection(location, smellItem);

			for(var i = 0; i < location.hordes.length; i++) {
				// Go around the square calculating the opposing directions
				var currentHorde = location.hordes[i];
				if(currentHorde.moveWeighting === undefined)
					currentHorde.moveWeighting = [-1,-1,-1,-1,-1,-1,-1,-1];

				currentHorde.moveWeighting[direction] = dirA;
				currentHorde.moveWeighting[direction + 4] = dirB;
				currentHorde.moveWeighting.self = self;
			}
		}
	}
};
exports.options = {
	init: function() {
		this.detectDirection = function (dataPoint, smellItem, direction, maxDistance) {
			var returnAmount = 0,
				totalDistance = 1,
				i = 1;

			if(direction === undefined) {
				this.calculatePointNearbyProp(dataPoint, smellItem);
				return dataPoint.nearby_prop[0] * 2;
			}

			while(totalDistance <= maxDistance) {
				if(direction % 2 === 0)  {// horizontal and vertical
					dataPoint = dataPoint.adjacent[direction/2];
					totalDistance += this.S.bakedValues.latDistances[
							Math.floor( Math.abs(dataPoint.lat) )
						][
							direction/2
						];
				}
				else {
					dataPoint = dataPoint.adjacent[Math.floor(direction/2)].adjacent[Math.ceil(direction/2)%4];
					totalDistance += this.S.bakedValues.latDistances[
							Math.floor( Math.abs(dataPoint.lat) )
						][
							Math.floor(direction / 2) + 4
						];
				}

				if(i === 1 && dataPoint.water && !this.S.modules['movement.base'].val('swimming')) {
					return 0;
				} else {
					this.calculatePointNearbyProp(dataPoint, smellItem);

					if(i < dataPoint.nearby_prop.length) {
						returnAmount += dataPoint.nearby_prop[i] / Math.pow(totalDistance,(i-1)/10);
					} else {
						returnAmount += dataPoint.nearby_prop[dataPoint.nearby_prop.length - 1] / Math.pow(totalDistance,(i-1)/10);
					}
				}

				i++;
			}
			return returnAmount;
		};

		this.calculatePointNearbyProp = function(location, smellItem) {
			var safeCalculate = function(val) {
				if(typeof(val) === 'number')
					return val;
				else
					return 0;
			};

			if(location.nearby_prop === undefined)
				location.nearby_prop = [];

			var totals = safeCalculate(location[smellItem]);
			location.nearby_prop[0] = totals;

			if(location.nearby_prop.length <= 1 || this.S.status.iteration - location.nearby_prop.lastCalculated > 10) {
				var reduce,steps,target = location;

				for (var j = 1; j <= 15; j++) {
					target = target.adjacent[0];
					steps = j;
					reduce = Math.pow(j * 2 + 1, 2);
					do {
						target = target.adjacent[1];
						totals += safeCalculate(target[smellItem]);
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[2];
						totals += safeCalculate(target[smellItem]);
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[3];
						totals += safeCalculate(target[smellItem]);
					} while (--steps);
					steps = j*2;
					do {
						target = target.adjacent[0];
						totals += safeCalculate(target[smellItem]);
					} while (--steps);
					steps = j;
					do {
						target = target.adjacent[1];
						totals += safeCalculate(target[smellItem]);
					} while (--steps);

					location.nearby_prop[j] = totals / reduce;
				}
				location.nearby_prop.lastCalculated = this.S.status.iteration;
			}
		};
	},
	runtime: 11,
	dependencies: ['movement.base']
};