/*
	Main: Import Required Modules 
*/
exports.type = 'event';
exports.run = function() {

};
exports.options = {
	init: function() {
		this.maxBeacons = 1;
		this.beacons = [];
		this.beaconStrength = 1;
		this.S.modules['movement.base'].val('smellItem', 'beacon');
		this.S.modules['movement.base'].val('canDetect', true);

		var circleRadius = 20,
			circleColor = 0xff00ff;

		this.addBeacon = function(lat, lng) {
			while(this.beacons.length >= this.maxBeacons) {
				var beacon = this.beacons.shift();
				beacon.location.beacon = 0;
			}

			lat = Math.round(lat - 0.5) + 0.5;
			lng = Math.round(lng - 0.5) + 0.5;

			this.S.UILink.rendererDecal('beacon' + this.beacons.length, {
				lat: lat,
				lng: lng,
				size: 8,
				texture: 'moveto'
			});
			this.S.UILink.rendererCircle('beacon_c' + this.beacons.length, lat, lng, circleRadius, circleColor);

			var location = this.S.getPointProperties(lat, lng),
				thisBeacon = {
					location: location,
					strength: this.beaconStrength
				};

			this.beacons.push(thisBeacon);
			location.beacon = thisBeacon.strength;
		};
	},
	ui: function(UI) {
		UI.addGlobeClickEvent(function(lat, lng) {
			UI.simulator.moduleFunction('beacon','addBeacon',[lat, lng]);
		});
	},
	dependencies: ['movement.base']
};