/*
	Movement: causes zombies to wander around.
	Zombies walking around, distance probability distribution function based in movement strength (Speed). mobility being in km/h, and radius of planet being 6378.1 km
*/
new Module('spread', function(current,strength) {
	if(strength.mobility > 0 && current.infected > 0) {
		if(current.infectedMovement === undefined || current.infectedMovement === null)
			current.infectedMovement = 0;
	    current.infectedMovement += strength.mobility;

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
				current.smellCache[direction]   = this.getSmells(current, direction, this.humanSense);
				current.smellCache[direction+4] = this.getSmells(current, direction+4, this.humanSense);				
			// If this direction has been calculated, only update squares once every 2 turns and only one direction at a time. TODO: raise this if it seems OK for speed
			} else if(this.S.iteration%4 == current.id%4) {
				var direction = Math.floor(this.S.iteration/4)%8;
				current.smellCache[direction]   = this.getSmells(current, direction, this.humanSense);
			}
			delete direction;
		}

		// Get the random numbers for the movement.
		// randAngle is the randomly picked direction, where 0-7 are adjacent squares clockwise from top
	    var rand = Math.sqrt(Math.random()),
			randAngle = Math.random()*8, // modify this to point towards more people
			chances = this.getChances(current.lat, current.infectedMovement);

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

	    if(rand > 1 - chance*current.infected) {
	    	var movedA = Math.round(chances[chanceA]*ratioA*current.infected);
	    	var movedB = Math.round(chances[chanceB]*ratioB*current.infected);
	    	if(movedA == 0 && movedB == 0) {
	    		if(chances[chanceA]*ratioA > chances[chanceB]*ratioB)
	    			movedA = 1;
	    		else
	    			movedB = 1;
	    	}

	    	// Move the zombies
	    	if(targetA % 2 == 0) {
	    		targetA = current.adjacent[targetA/2];
	    	} else {
	    		targetA = current.adjacent[Math.floor(targetA/2)].adjacent[Math.ceil(targetA/2)%4];
	    	}
	    	if(targetB % 2 == 0) {
	    		targetB = current.adjacent[targetB/2];
	    	} else {
	    		targetB = current.adjacent[Math.floor(targetB/2)].adjacent[Math.ceil(targetB/2)%4];
	    	}

			// if the zombies don't swim, don't send them in that direction
			if(!this.swimming) {
				if(targetA.water && !targetB.water) {
					movedB = movedA+movedB;
					movedA = 0;
				}
				else if(!targetA.water && targetB.water) {
					movedA = movedA+movedB;
					movedB = 0;					
				}
				else if(targetA.water && targetB.water) {
					movedA = 0;
					movedB = 0;
					this.smellCache[Math.floor(randAngle)] = 0;
					this.smellCache[Math.ceil(randAngle)] = 0;
				}
			}

			if(movedA > 0 || movedB > 0) {

				// Adjust infectedMovement based on the number of zombies moving
		    	current.infectedMovement = Math.round(current.infectedMovement * (1 - (movedA+movedB)/current.infected));
		    	if(targetA.infectedMovement && movedA > 0)
		    		targetA.infectedMovement = Math.round(targetA.infectedMovement * (1 - movedA/(targetA.infected+movedA)));
		    	if(targetB.infectedMovement && movedB > 0)
		    		targetB.infectedMovement = Math.round(targetB.infectedMovement * (1 - movedB/(targetB.infected+movedB)));

				if(movedA > 0 && !targetA.active) {
					this.S.activePoints.push(targetA);
					targetA.active = true;
				}
				if(movedB > 0 && !targetB.active) {
					this.S.activePoints.push(targetB);
					targetB.active = true;
				}

				targetA.infected += movedA;
				targetB.infected += movedB;
				current.infected -= movedA + movedB;
				this.S.updateSquare(targetA);
				this.S.updateSquare(targetB);
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
				

				// only need to do two directions because the two horiz directions are the same and the two vert directions are the same
				// A&S erf formula 7.1.26
			    	// distance is the distance in kilometers needed to travel to be in the next square
			    	// 24 "steps", or hours, in a day. Each step is the distance the zombie can travel in one hour, or kph.
			    	// basically get the distribution of zombies that make it past
			    
		    	/*x = (this.S.bakedValues.latDistances[lat][0]*0.5 - meanMovement)/(1.414213562*sigma),
		    	t = 1.0/(1.0 + 0.3275911*x);
				result[0] = (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.pow(Math.E,-x*x);
				result[2] = result[0]*(this.S.bakedValues.latDistances[lat][0]/this.S.bakedValues.latDistances[lat][1]);
				result[1] = result[0]*(this.S.bakedValues.latDistances[lat][0]/this.S.bakedValues.latDistances[lat][4]);
				result[3] = result[0]*(this.S.bakedValues.latDistances[lat][0]/this.S.bakedValues.latDistances[lat][5]);*/

				this.bakedMoveChance[lat][movement] = result;
			}
			return this.bakedMoveChance[lat][movement].slice(0); // return a copy so the array can be manipulated without destroying the cache
		}
		this.getSmells = function (dataPoint,direction,maxDistance) {
	    	/*var surroundPop = current.adjacent[0].total_pop + current.adjacent[1].total_pop + current.adjacent[2].total_pop + current.adjacent[3].total_pop + 
	    		current.adjacent[1].adjacent[0].total_pop + current.adjacent[1].adjacent[2].total_pop + current.adjacent[3].adjacent[0].total_pop + current.adjacent[3].adjacent[2].total_pop;*/
	    	var returnAmount = 0;
	    	var totalDistance = 0;
	    	for(var i = 0; i <= maxDistance; i++) {
		    	if(direction % 2 == 0) { // horizontal and vertical
		    		totalDistance += this.S.bakedValues.latDistances[Math.floor(Math.abs(dataPoint.lat))][direction/2];
	    			dataPoint = dataPoint.adjacent[direction/2];

		    	} else { // diagonal
		    		totalDistance += this.S.bakedValues.latDistances[Math.floor(Math.abs(dataPoint.lat))][Math.floor(direction/2)+4];
	    			dataPoint = dataPoint.adjacent[Math.floor(direction/2)].adjacent[Math.ceil(direction/2)%4];		    		
		    	}

		    	if(dataPoint.nearby_pop)
		    		if(dataPoint.nearby_pop[i]) {
		    			returnAmount += dataPoint.nearby_pop[i] / (totalDistance*totalDistance);
		    		} else {
		    			returnAmount += dataPoint.nearby_pop[dataPoint.nearby_pop.length - 1] / (totalDistance*totalDistance);		    			
		    		}
	    	}
	    	return returnAmount;
		}
	},
	alwaysActive: true,
	children: ['moveSpeed']
})