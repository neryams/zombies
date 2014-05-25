(function(definition) {
    var exports = definition();
    window.DataPoint = exports.DataPoint;
})(function() {

function DataPoint(i,config) {
	this.hordes = [];
	this.adjacent = [];
	if(typeof i == 'object') {
		for (var key in i)
			if(i.hasOwnProperty(key))
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
	precipitation: 0,
	temperature: 0,
	height: 0,
	country: 0,
	panic: 0,
	adjacent:[],
	hordes:[],
	getDistanceTo: function(dataPoint) {
		// Right now only good for adjacent points
		var distances = bakedValues.latDistances[Math.floor(Math.abs(this.lat))];

		if(typeof dataPoint === 'number')
			return distances[dataPoint];

		if(dataPoint.id < this.id) {
			if(dataPoint.id === this.adjacent[0].id)
				return distances[0];
			else if(dataPoint.id === this.adjacent[3].id)
				return distances[3];
			else if(dataPoint.id === this.adjacent[0].adjacent[1].id)
				return distances[4];
			else if(dataPoint.id === this.adjacent[0].adjacent[3].id)
				return distances[7];
		}
		if(dataPoint.id > this.id) {
			if(dataPoint.id === this.adjacent[1].id)
				return distances[1];
			else if(dataPoint.id === this.adjacent[2].id)
				return distances[2];
			else if(dataPoint.id === this.adjacent[2].adjacent[1].id)
				return distances[5];
			else if(dataPoint.id === this.adjacent[2].adjacent[3].id)
				return distances[6];
		}

		return -1;
	},
	angularDirection: function(rand) {
		// rand is radian angle divided by 2pi, so 0-1
		var chances = bakedValues.latCumChance[Math.floor(Math.abs(this.lat))];

		if(rand < chances[0]){
			return this.adjacent[0];
		}
		else if(rand < chances[1]){
			return this.adjacent[1];
		}
		else if(rand < chances[2]){
			return this.adjacent[2];
		}
		else if(rand < chances[3]){
			return this.adjacent[3];
		}
		else if(rand < chances[4]){
			return this.adjacent[0].adjacent[1];
		}
		else if(rand < chances[5]){
			return this.adjacent[2].adjacent[1];
		}
		else if(rand < chances[6]){
			return this.adjacent[2].adjacent[3];
		}
		else{
			return this.adjacent[0].adjacent[3];
		}
	}
};

var bakedValues = {
	latDistances: [],
	latCumChance: []
};

// Pre-generate some values for the simulation so they only have to be calculated once
var getGridDistance = function (lat,latdelta,lngdelta) {
	var phi = latdelta/180*Math.PI,
		theta = lngdelta/180*Math.PI,
		phix = lat/180*Math.PI,
		phiy = (lat+latdelta)/180*Math.PI;
	
	var a = (Math.sin(phi/2) * Math.sin(phi/2) +
		Math.sin(theta/2) * Math.sin(theta/2) * Math.cos(phix) * Math.cos(phiy));
	return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6378; // rough estimate of the radius of the earth in km (6378.1)
};

for (var i = 0; i < 90; i++) {
	// directly adjacent points clockwise from top, then diagonal points clockwise from top right.
	bakedValues.latDistances.push([
		getGridDistance(i + 0.5,-1, 0),
		getGridDistance(i + 0.5, 0, 1),
		getGridDistance(i + 0.5, 1, 0),
		getGridDistance(i + 0.5, 0,-1),
		getGridDistance(i + 0.5,-1, 1),
		getGridDistance(i + 0.5, 1, 1),
		getGridDistance(i + 0.5, 1,-1),
		getGridDistance(i + 0.5,-1,-1)
	]);
	var total_dists = 0;
	for(var j = 0; j < 8; j++) {
		total_dists += 1/bakedValues.latDistances[i][j];
	}
	bakedValues.latCumChance.push([
		1 - bakedValues.latDistances[i][0]/total_dists,
		1 - bakedValues.latDistances[i][1]/total_dists,
		1 - bakedValues.latDistances[i][2]/total_dists,
		1 - bakedValues.latDistances[i][3]/total_dists,
		1 - bakedValues.latDistances[i][4]/total_dists,
		1 - bakedValues.latDistances[i][5]/total_dists,
		1 - bakedValues.latDistances[i][6]/total_dists,
		1 - bakedValues.latDistances[i][7]/total_dists
	]);
	for(j = 1; j < 8; j++) {
		bakedValues.latCumChance[i][j] += bakedValues.latCumChance[i][j-1];
	}
}

return {
	DataPoint: DataPoint
};

});