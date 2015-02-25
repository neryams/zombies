/*
	Movement: causes zombies to wander around.
	Zombies walking around, distance probability distribution function based in movement strength (Speed). mobility being in km/h, and radius of planet being 6378.1 km
*/
exports.type = 'infect';
exports.run = function(current,passData,multiplier) {
	if(passData.mobility > 0) {
		var currentLocation = current.location;
		if(current.movement === undefined || current.movement === null)
			current.movement = 0;
	    current.movement += passData.mobility * multiplier;

	    // Default movement direction is obtained from the default direction for the turn
		var target = passData.target,
			targetDistance = current.location.getDistanceTo(passData.target),
			max = 0;

		// If zombies can smell humans, get the movement weighting values to change the direction
		if(current.moveWeighting !== undefined) {
			// Get highest value weighting 
			max = current.moveWeighting.self;
			var maxDir = -1;

			for(var direction = 0; direction < current.moveWeighting.length; direction++) {
				if(current.moveWeighting[direction] > max) {
					max = current.moveWeighting[direction];
					maxDir = direction;
				}
			}

			// If any direction has a positive weight, set the highest one to be the movement direction
			if(maxDir >= 0) {
				if(max > 0) {
					if(maxDir % 2 === 0) {
						target = currentLocation.adjacent[maxDir/2];
					} else {
						target = currentLocation.adjacent[Math.floor(maxDir/2)].adjacent[Math.ceil(maxDir/2)%4];
					}

					if(maxDir%2 === 0)
						targetDistance = currentLocation.getDistanceTo(maxDir / 2);
					else
						targetDistance = currentLocation.getDistanceTo(Math.floor(maxDir/2)+4);
				}
			}
			else {
				target = false;
			}
		}

		if(current.movement > targetDistance && target) {
			current.movement -= targetDistance;
			current.move(target);
		} else {
			// zombie horde did not move, possibly combine with a horde in the same square
			if(current.location.hordes.length > 1 && passData.rand > 1 - (this.S.status.hordeCount / 40000)) {
				var newRand = Math.pow(((passData.rand * 100) % 10) / 10, 3),
					combineWith = Math.floor(current.location.hordes.length*newRand);
				if(current.location.hordes[combineWith].id != current.id) {
					current.location.hordes[combineWith].size += current.size;
					current.size = 0;
				}
			}
	    }
	}
};
exports.options = {
	init: function() {
		this.bakedMoveChance = [];
	},
	runtime: 30,
	dependencies: ['movement.base']
};