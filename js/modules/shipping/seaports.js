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

		this.selectPort = function(lat, lng) {
			var point = this.S.getPointProperties(lat, lng);
			if(point.seaport) {
				// Handle the click when there's a port
				lat = Math.round(lat - 0.5) + 0.5;
				lng = Math.round(lng - 0.5) + 0.5;
				this.S.UILink.trigger('shipping.selectPort', [lat, lng]);
				return true;
			} else
				// Pass the click through to the next function when there's no port
				return false;
		};
		this.destinationValid = function(lat, lng) {
			var point = this.S.getPointProperties(lat, lng);
			this.S.UILink.trigger('shipping.destinationValid', [point.coast_distance === 1]);
		};
		this.selectPortDestination = function(startLat, startLng, endLat, endLng) {
			var start = this.S.getPointProperties(startLat, startLng),
				end = this.S.getPointProperties(endLat, endLng);

			this.S.UILink.trigger('rClick.cancelPortDestination');
			var path = this.S.modules.pathfind.search(start, end, 'ocean');

			this.S.modules['shipping.seaMove'].addNew(path);
		};
	},
	ui: function(UI) {
		// Handler for starting the port selection
		UI.on('globeClick.selectPort', 100, function(lat, lng) {
			return UI.simulator.moduleFunction('shipping.seaports','selectPort',[lat, lng]);
		});

		// Valid port selected, time to pick the destination
		UI.on('shipping.selectPort', function(startLat, startLng) {
			// Draw arcs to destinations on mouseover
			UI.tooltip.setPointFunction(function(endLat, endLng) {
				endLat = Math.round(endLat - 0.5) + 0.5;
				endLng = Math.round(endLng - 0.5) + 0.5;

				UI.renderer.displayArc({
					lat: startLat,
					lng: startLng
				}, {
					lat: endLat,
					lng: endLng
				});

				// Check with simulator to see if the destination is valid
				UI.simulator.moduleFunction('shipping.seaports','destinationValid', [endLat, endLng]);
			}, 5); // high priority to override all other point functions.

			var toolTipWasActive = false;
			if(UI.tooltip.active())
				toolTipWasActive = true;
			else
				UI.tooltip.activate();

			// If destination isn't valid, grey out the arc
			UI.on('shipping.destinationValid', function(valid) {
				if(valid)
					UI.renderer.displayArc(undefined, undefined, 1);
				else
					UI.renderer.displayArc(undefined, undefined, 0.4);
			});

			// Set up handlers for choosing the destination
			UI.on('globeClick.selectPortDestination', 150, function(endLat, endLng) {
				UI.simulator.moduleFunction('shipping.seaports','selectPortDestination',[startLat, startLng, endLat, endLng]);
				return true;
			});
			UI.on('rClick.cancelPortDestination', function() {
				UI.tooltip.restore();
				if(!toolTipWasActive)
					UI.tooltip.deactivate();
				UI.renderer.hideArc();
				UI.off('globeClick.selectPortDestination');
				UI.off('rClick.cancelPortDestination');
				return true;
			});
		});
	},
	dependencies: ['shipping.seaMove', 'pathfind'],
	alwaysActive: true
};