/*
	Movement: causes zombies to wander around.
	Zombies walking around, distance probability distribution function based in movement strength (Speed). mobility being in km/h, and radius of planet being 6378.1 km
*/
new Module('spread', function(current,strength) {
	if(strength.mobility > 0) {
		var currentLocation = current.location;
		if(current.movement === undefined || current.movement === null)
			current.movement = 0;
	    current.movement += strength.mobility;

		// If zombies can smell humans, get the movement weighting values in an array
		//if(this.humanSense > 0) {
		if(true) { this.humanSense = 1500;
			var direction = this.S.iteration%4;
			if(!current.smellCache) {
				current.smellCache = [-1,-1,-1,-1,-1,-1,-1,-1];				
			}
			// If humans in this direction have never been calculated, do this direction and the opposing one (for symmetry)
			// Go around the square once doing the opposing directions
			if(current.smellCache[this.S.iteration%4] < 0) {
				var direction = this.S.iteration%4;
				current.smellCache[direction]   = this.getSmells(currentLocation, direction, this.humanSense);
				current.smellCache[direction+4] = this.getSmells(currentLocation, direction+4, this.humanSense);				
			// If this direction has been calculated, only update squares once every 2 turns and only one direction at a time. TODO: raise this if it seems OK for speed
			} else {
				var direction = this.S.iteration%8;
				current.smellCache[direction]   = this.getSmells(currentLocation, direction, this.humanSense);
			}
			delete direction;
		}

		// Get the random numbers for the movement.
		// randAngle is the randomly picked direction, where 0-7 are adjacent squares clockwise from top
	    var rand = Math.sqrt(Math.random()),
			randAngle = Math.random()*8, // modify this to point towards more people
			chances = this.getChances(currentLocation.lat, current.movement);

		if(current.smellCache) {
			// Weight randAngle based on the weighting values calculated earler
			var topStrength;
			var newRandAngle;
			// go up to 8 so the random direction weighting wraps around
			for(var i = 0; i <= 8; i++) {
				if(current.smellCache[i%8] > 1) {
					var thisStrength = (randAngle - i)/current.smellCache[i%8];
				}
				else {
					var thisStrength = randAngle - i;				
				}

				// Keep track of which grid square is strongest after weighting
				if(!topStrength || topStrength > Math.abs(thisStrength)) {
					topStrength = Math.abs(thisStrength);
					newRandAngle = thisStrength + i;
				}
			}
			randAngle = newRandAngle;
		}

	    var ratioA = 1 - randAngle%1,
	    	ratioB = randAngle%1,
	    	targetA = Math.floor(randAngle),
	    	targetB = Math.ceil(randAngle)%8;
	    var chanceA = targetA%4,
	    	chanceB = targetB%4;
    	if(targetA > 4)
    		chanceA = 4 - chanceA;
    	if(targetB > 4)
    		chanceB = 4 - chanceB;

	    var chance = chances[chanceA]*ratioA + chances[chanceB]*ratioB;
	    var cumChance = (chances[0] + chances[1] + chances[2] + chances[3]) * 2;

	    if(rand > 1 - chance*current.size) {
	    	// Move the zombies
	    	if(targetA % 2 == 0) {
	    		targetA = currentLocation.adjacent[targetA/2];
	    	} else {
	    		targetA = currentLocation.adjacent[Math.floor(targetA/2)].adjacent[Math.ceil(targetA/2)%4];
	    	}
	    	if(targetB % 2 == 0) {
	    		targetB = currentLocation.adjacent[targetB/2];
	    	} else {
	    		targetB = currentLocation.adjacent[Math.floor(targetB/2)].adjacent[Math.ceil(targetB/2)%4];
	    	}

			// if the zombies don't swim, don't send them in that direction
			if(!this.swimming) {
				if(targetA.water && !targetB.water) {
					chances[chanceA] = 0;
				}
				else if(!targetA.water && targetB.water) {
					chances[chanceB] = 0;			
				}
				else if(targetA.water && targetB.water) {
					var allWater = true;
					this.smellCache[Math.floor(randAngle)] = 0;
					this.smellCache[Math.ceil(randAngle)] = 0;
				}
			}
			if(!allWater) {
				current.movement = 0;
				this.S.modules['worldStats'].val('squaresToUpdate',currentLocation,'append');
		    	if(chances[chanceA]*ratioA > chances[chanceB]*ratioB) {
		    		current.location = targetA;
		    	} else {
		    		current.location = targetB;
		    	}
				this.S.modules['worldStats'].val('squaresToUpdate',current.location,'append');
			}
	    }
	}
},{
	init: function() {
		this.bakedMoveChance = [];
		this.smellCache = [];
		this.smellSense = 0;
		this.swimming = false;
		this.getChances = function (lat,movement) {
			var lat = Math.floor(Math.abs(lat)),
				movement = Math.floor(movement);
			var chances = this.S.bakedValues.latCumChance[lat];
			if(!this.bakedMoveChance[lat])
				this.bakedMoveChance[lat] = [];
			if(!this.bakedMoveChance[lat][movement]) {
				var result = [],
					meanMovement = Math.sqrt(24*movement),
					sigma = meanMovement/3,
					totalDistance = (this.S.bakedValues.latDistances[lat][0] + this.S.bakedValues.latDistances[lat][1] + 
						this.S.bakedValues.latDistances[lat][4] + this.S.bakedValues.latDistances[lat][5]);

				/* Old change generation. Makes zombies never spread to lesser change squares*/
				for(var direction = 0; direction < 4; direction++) {
					if(direction%2 == 0)
						var distance = this.S.bakedValues.latDistances[lat][direction/2];
					else
						var distance = this.S.bakedValues.latDistances[lat][Math.floor(direction/2)+4];
			    	var x = (distance*0.5 - meanMovement)/(1.414213562*sigma),
			    		t = 1.0/(1.0 + 0.3275911*x);
					result[direction] = (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.pow(Math.E,-x*x);
				}
				
				this.bakedMoveChance[lat][movement] = result;
			}
			return this.bakedMoveChance[lat][movement].slice(0); // return a copy so the array can be manipulated without destroying the cache
		}
		this.getSmells = function (dataPoint,direction,maxDistance) {
	    	/*var surroundPop = current.adjacent[0].total_pop + current.adjacent[1].total_pop + current.adjacent[2].total_pop + current.adjacent[3].total_pop + 
	    		current.adjacent[1].adjacent[0].total_pop + current.adjacent[1].adjacent[2].total_pop + current.adjacent[3].adjacent[0].total_pop + current.adjacent[3].adjacent[2].total_pop;*/
	    	var returnAmount = 0,
	    		totalDistance = 0,
	    		i = 0;
	    	while(totalDistance < maxDistance) {
		    	if(direction % 2 == 0) { // horizontal and vertical
		    		totalDistance += this.S.bakedValues.latDistances[Math.floor(Math.abs(dataPoint.lat))][direction/2];
	    			dataPoint = dataPoint.adjacent[direction/2];

		    	} else { // diagonal
		    		totalDistance += this.S.bakedValues.latDistances[Math.floor(Math.abs(dataPoint.lat))][Math.floor(direction/2)+4];
	    			dataPoint = dataPoint.adjacent[Math.floor(direction/2)].adjacent[Math.ceil(direction/2)%4];		    		
		    	}

		    	if(dataPoint.nearby_pop)
		    		if(i < dataPoint.nearby_pop.length) {
		    			returnAmount += dataPoint.nearby_pop[i] / (totalDistance*totalDistance);
		    		} else {
		    			returnAmount += dataPoint.nearby_pop[dataPoint.nearby_pop.length - 1] / (totalDistance*totalDistance);		    			
		    		}
		    	i++;
	    	}
	    	return returnAmount;
		}
	},
	alwaysActive: true,
	dependencies: ['moveSpeed']
})