/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'event';
exports.run = function() {
};
exports.options = {
	init: function(dataPoints) {
		var seaport_count = 10,
			coast_tiles = [];
		for(var i = 0, n = dataPoints.length; i < n; i++) {
			if(dataPoints[i].coast_distance === 1) {
				coast_tiles.push(dataPoints[i]);
			}
		}

		coast_tiles.sort(function(a, b) {
			return b.total_pop - a.total_pop;
		});

		for(i = 0; i < seaport_count; i++) {
			var index = Math.floor(Math.pow(Math.random(),2) * coast_tiles.length);

			coast_tiles[index].seaport = true;
			this.S.UILink.rendererDecal('seaport' + coast_tiles[index].id, coast_tiles[index].lat, coast_tiles[index].lng, 10, 'seaport');
		}
	}
};