/*
	Main: Import Required Modules 
*/
exports.type = 'event';
exports.run = function() {

};
exports.options = {
	init: function() {
		var beacons = [];

		this.maxBeacons = 1;
		this.beaconStrength = 800;
		this.S.modules['movement.base'].val('smellItem', 'beacon');
		this.S.modules['movement.base'].val('canDetect', true);

		var globeRadius = 6378.1,
			globeSize = 200,
			circleColor = 0xff00ff;

		var addBeacon = function(lat, lng) {
			var circleRadius = globeSize * this.beaconStrength / globeRadius;

			while(beacons.length >= this.maxBeacons) {
				var beacon = beacons.shift();
				beacon.location.beacon = 0;
			}

			this.S.UILink.rendererDecal('beacon' + beacons.length, {
				lat: lat,
				lng: lng,
				size: 8,
				texture: 'moveto'
			});
			this.S.UILink.rendererCircle('beacon_c' + beacons.length, lat, lng, circleRadius, circleColor);

			var location = this.S.getPointProperties(lat, lng),
				thisBeacon = {
					location: location,
					strength: this.beaconStrength
				};

			beacons.push(thisBeacon);
			location.beacon = thisBeacon.strength;

			this.S.modules['movement.base'].currentSmellAdd('beacon', this.beaconStrength);
		};

		var removeBeacon = function(index) {
			beacons[index].location.beacon = 0;
			this.S.UILink.rendererRemoveDecal('beacon' + index);
			this.S.UILink.rendererRemoveDecal('beacon_c' + index);
			beacons.splice(index, 1);

			if(!beacons.length)
				this.S.modules['movement.base'].currentSmellRemove('beacon');
		};

		this.toggleBeacon = function(lat, lng) {
			lat = Math.round(lat - 0.5) + 0.5;
			lng = Math.round(lng - 0.5) + 0.5;
			var removed = false;

			for(var i = 0; i < beacons.length; i++) {
				if(beacons[i].location.lat == lat && beacons[i].location.lng == lng) {
					removeBeacon.call(this, i);
					removed = true;
				}
			}

			if(!removed) {
				addBeacon.call(this, lat, lng);
			}
			return true;
		};
	},
	ui: function(UI) {
		UI.on('globeRClick', function(lat, lng) {
			return UI.simulator.moduleFunction('beacon','toggleBeacon',[lat, lng]);
		});
	},
	dependencies: ['movement.base']
};