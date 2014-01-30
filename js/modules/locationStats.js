/*
	locationStats: Adds up horde data like size to get data for displaying information on the UI
*/
new Module('spread', function(current,strength) {
	// If this is a new iteration, reset the counter
	if(this.currentIteration != this.S.iteration) {
		this.currentIteration = this.S.iteration;
		this.calculatedSquares = {};
		this.S.modules['worldStats'].val('world_infected',0);
	}
	var currentLocation = current.location;

	// If the square hasn't been hit this iteration, set zero array
	if(this.calculatedSquares[currentLocation.id] == undefined)
		this.calculatedSquares[currentLocation.id] = [0];

	// Add on horde sizes
	this.calculatedSquares[currentLocation.id][0] += current.size;

	// Set square value
	current.location.infected = this.calculatedSquares[currentLocation.id][0];
	this.S.modules['worldStats'].val('world_infected',current.size);
},{
	runtime: 19, // Always run right before worldStats to get accurate data
	init: function() {
		this.currentIteration = 0;
		this.calculatedSquares = {};
	},
	alwaysActive: true,
	dependencies: ['worldStats']
})