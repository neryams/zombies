function DataPoint(i,config) {
	if(typeof i == 'object') {
		for (var key in i)
			if(i.hasOwnProperty(key))
				this[key] = i[key];
	} else {
		this.lat = config.h / 2 - Math.floor(i/config.w) - 0.5;
		this.lng = i%config.w + 0.5;
		this.id = i;
	}
	this.hordes = [];
	this.renderer = {};
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
	hordes:[]
};