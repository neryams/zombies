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
			targetDistance = passData.targetDistance,
			max = 0;

		// If zombies can smell humans, get the movement weighting values to change the direction
		if(current.moveWeighting !== undefined) {
			// Get highest value weighting 
			var maxDir = -1;
			for(var direction = 0; direction < current.moveWeighting.length; direction++) {
				if(current.moveWeighting[direction] > max) {
					max = current.moveWeighting[direction];
					maxDir = direction;
				}
			}

			// If any direction has a positibe weight, set the highest one to be the movement direction
			if(max > 0) {
				if(maxDir % 2 === 0) {
					target = currentLocation.adjacent[maxDir/2];
				} else {
					target = currentLocation.adjacent[Math.floor(maxDir/2)].adjacent[Math.ceil(maxDir/2)%4];
				}

				if(maxDir%2 === 0)
					targetDistance = this.S.bakedValues.latDistances[
							Math.floor( Math.abs(currentLocation.lat) )
						][
							maxDir / 2
						];
				else
					targetDistance = this.S.bakedValues.latDistances[
							Math.floor( Math.abs(currentLocation.lat) )
						][
							Math.floor(maxDir/2)+4
						];
			}
		}

		if(current.movement > targetDistance) {
			current.movement -= targetDistance;
			current.move(target);
		} else {
			// zombie horde did not move, possibly combine with a horde in the same square
			if(current.location.hordes.length > 1 && passData.rand > 1 - (this.S.hordes.length / 40000)) {
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