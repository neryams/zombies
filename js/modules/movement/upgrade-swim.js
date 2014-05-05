exports.type = 'event';
exports.run = function() {
};
exports.options = {
	init: function() {
		var swimEnable = function() {
			this.S.modules['movement.base'].val('swimming',true);
		};
		this.S.addUpgrades(this,
			{cost: 200,
				paths:['climate_3'],
				name:'Waterproofing',
				onUpgrade: swimEnable,
				description:'Robots can traverse water slowly',
				style: {
					angle: 0.5,
					distance: 40
				}
			}
		);
	},
	dependencies: ['movement.base']
};