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
			// set a valid seaport
			this.S.UILink.trigger('shipping.addPorts', [location.lat + ',' + location.lng]);
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
		// Verify that the chosen port is a seaport, then trigger
		this.selectPort = function(lat, lng) {
			var point = this.S.getPointProperties(lat, lng);
			if(point.seaport) {
				for(var i = 0, total = 0; i < point.hordes.length; i++) {
					total += point.hordes[i].size;
				}
				// Handle the click when there's a port
				this.S.UILink.trigger('shipping.selectPort', [lat, lng, total]);
			}
		};

		// Tell the UI whether a tile is a valid boat target
		this.destinationValid = function(lat, lng) {
			var point = this.S.getPointProperties(lat, lng);
			this.S.UILink.trigger('shipping.destinationValid', [point.coast_distance === 1]);
		};

		// Verify that the chosen port is a seaport, chosen destination is coastal, then trigger boat
		this.selectPortDestination = function(startLat, startLng, endLat, endLng, number) {
			var start = this.S.getPointProperties(startLat, startLng),
				end = this.S.getPointProperties(endLat, endLng);

			this.S.UILink.trigger('rClick.cancelPortDestination');
			if(end.coast_distance === 1 && start.seaport) {
				var path = this.S.modules.pathfind.search(start, end, 'ocean');
				path.unshift(start);

				this.S.modules['shipping.seaMove'].addNew(path, number);				
			}
		};
	},
	ui: function(UI) {
		var shippingLoadWindow = UI.addDataField('shippingLoadMenu', {
			type: 'modal',
			title: 'Depart Ship',
			class: 'tiny'
		});
		UI.status.ports = [];
		UI.on('globeClick.selectPort', 100, function(lat, lng) {
			lat = Math.round(lat - 0.5) + 0.5;
			lng = Math.round(lng - 0.5) + 0.5;

			// If the clicked point is a valid port, initiate selecting the endpoint
			if(UI.status.ports.indexOf(lat + ',' + lng) != -1) {
				UI.simulator.moduleFunction('shipping.seaports','selectPort',[lat, lng]);
			} else
				// Pass the click through to the next function when there's no port
				return false;
		});

		// Handler for starting the port selection
		UI.on('shipping.addPorts', function() {
			var portsToAdd = Array.prototype.slice.call(arguments);
			while(portsToAdd.length) {
				UI.status.ports.push(portsToAdd.pop());
			}
		});

		// Valid port selected, time to pick the destination
		UI.on('shipping.selectPort', function(startLat, startLng, maxLoad) {
			shippingLoadWindow.empty();

			var countSlider = shippingLoadWindow.addDataField('control_shipLoad',{
				type:'slider',
				title: 'Number of Robots to load in ship',
				dataOptions: 'start: 0; end: ' + maxLoad + '; initial: 0; step: 1;',
				displayValue: true
			});
			var shippingLoadMenu = shippingLoadWindow.addDataField({
				type: 'div',
				class: 'menu'
			});
			// Add slider for zombie behavior: how much 
			shippingLoadMenu.addDataField({
				type: 'button',
				label: 'Accept',
				click: selectDestination(startLat, startLng, countSlider)
			});
			shippingLoadMenu.addDataField({
				type: 'button',
				class: 'icon cancel secondary',
				click: function() {
					shippingLoadWindow.hide();
				}
			});
			shippingLoadWindow.append(shippingLoadMenu);

			shippingLoadWindow.show();
		});

		var selectDestination = function(startLat, startLng, countSlider) {
			return function() {
				shippingLoadWindow.hide();
				var shipsize = countSlider.val();
				
				if(shipsize > 0) {
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
						UI.simulator.moduleFunction('shipping.seaports','selectPortDestination',[startLat, startLng, endLat, endLng, shipsize]);
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
				}
			};
		};
	},
	dependencies: ['shipping.seaMove', 'pathfind'],
	alwaysActive: true
};