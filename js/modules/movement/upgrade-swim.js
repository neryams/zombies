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
				paths:['reproducer.strain'],
				name:'Waterproofing',
				onUpgrade: swimEnable,
				description:'Robots can traverse water slowly',
				style: {
					angle: 0.5
				}
			}
		);
	},
	dependencies: ['movement.base']
};