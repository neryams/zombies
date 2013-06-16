function DataPoint(i,config) {
	if(typeof i == "object") {
		for (var key in i)
    		if (i.hasOwnProperty(key)) 
				this[key] = i[key];
	} else {
		this.lat = config.h / 2 - Math.floor(i/config.w) - 0.5;
		this.lng = i%config.w + 0.5;
		this.id = i;		
	}
}
DataPoint.prototype = {
	id: 0,
	lat: 0,
	lng: 0,
	infected: 0,
	total_pop: 0,
	dead: 0,
	water: false,
	polar: false,
	coast_distance: 0,
	border_distance: 0,
	human_strength: 0,
	precipitation: -1,
	temperature: -1,
	height: 0,
	country: 0,
	adjacent:[]
}
DataPoint.prototype.updateNearbyPop = function () {
	if(!this.nearby_pop)
		this.nearby_pop = [this.total_pop];
	else if(this.nearby_pop[0] != this.total_pop)
		this.nearby_pop[0] = this.total_pop;

	// Calculate the averaged populations of squares for finding groups of people etc
	if(this.nearby_pop[this.nearby_pop.length-1] > 0) {
		target = this;

		var total_pop = this.total_pop;
		for (j = 1; j <= 15; j++) {
			target = target.adjacent[0];
			steps = j;
			do {
				target = target.adjacent[1];
				total_pop += target.total_pop;
			} while (--steps)
			steps = j*2;
			do {
				target = target.adjacent[2];
				total_pop += target.total_pop;
			} while (--steps)
			steps = j*2;
			do {
				target = target.adjacent[3];
				total_pop += target.total_pop;
			} while (--steps)
			steps = j*2;
			do {
				target = target.adjacent[0];
				total_pop += target.total_pop;
			} while (--steps)
			steps = j;
			do {
				target = target.adjacent[1];
				total_pop += target.total_pop;
			} while (--steps)

			this.nearby_pop[j] = total_pop;
		}
	}
}