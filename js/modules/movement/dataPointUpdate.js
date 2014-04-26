/*
	Mobility: Module to apply the mobility value into the encounter chance after other modules finish with it
*/
exports.type = 'spread';
exports.run = function(location) {
	if(!location.nearby_prop)
		location.nearby_prop = [location[this.smellItem]];
	else if(location.nearby_prop[0] != location[this.smellItem])
		location.nearby_prop[0] = location[this.smellItem];

	if(!location.nearby_prop.lastCalculated || this.S.iteration - location.nearby_prop.lastCalculated > 10) {
		// Calculate the averaged populations of squares for finding groups of people etc
		if(location.nearby_prop[location.nearby_prop.length-1] > 0) {
			var steps,target = location;

			var totals = location[this.smellItem];
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
		}
		location.nearby_prop.lastCalculated = this.S.iteration;
	}};
exports.options = {
	init: function() {
		this.smellItem = 'tech';
	},
	runtime: 11,
	dependencies: ['movement.base']
};