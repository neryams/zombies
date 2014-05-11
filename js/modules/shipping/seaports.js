/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
exports.type = 'spread';
exports.run = function(location) {
	if(location.hordes.length > 0 && location.seaport) {
		if(!location.seaport.active) {
			location.seaport.active = true;
			this.S.UILink.rendererDecal('seaport' + location.id, {
				opacity: 1
			});
		}
	}
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

			coast_tiles[index].seaport = {
				active: false
			};
			this.S.UILink.rendererDecal('seaport' + coast_tiles[index].id, {
				lat: coast_tiles[index].lat,
				lng: coast_tiles[index].lng,
				size: 10,
				texture: 'seaport',
				opacity: 0.5
			});
		}
	},
	dependencies: ['shipping.seaMove']
};