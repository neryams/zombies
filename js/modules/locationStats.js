/*
	locationStats: Adds up horde data like size to get data for displaying information on the UI
*/
new Module('spread', function(current,strength) {
	var currentLocation = current.location;
	
	// If this is a new iteration, reset the counter
	if(this.currentIteration != this.S.iteration) {
		this.currentIteration = this.S.iteration;

		for (var lastSquare in this.calculatedSquares) {
			this.S.points[lastSquare].infected = 0;				
		}
		this.calculatedSquares = {};
	}

	// If the square hasn't been hit this iteration, initialize the infected counter
	if(this.calculatedSquares[currentLocation.id] == undefined)
		this.calculatedSquares[currentLocation.id] = 0;

	// Add on horde sizes
	this.calculatedSquares[currentLocation.id] += current.size;

	// Set square value
	current.location.infected = this.calculatedSquares[currentLocation.id];
	this.S.modules['worldStats'].val('world_infected',current.size);
},{
	runtime: 19, // Always run last to get accurate data
	init: function() {
		this.currentIteration = 0;
		this.calculatedSquares = {};
	},
	alwaysActive: true,
	dependencies: ['worldStats']
})