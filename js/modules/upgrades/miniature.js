exports.type = 'event';
exports.run = function() {
};
exports.options = {
	init: function() {
		var purchase = function() {
			this.S.status.gridSize++;
		};
		this.S.addUpgrades(this,
			{
				cost: 5000,
				paths:['movement.base_0'],
				name:'Miniturization',
				onUpgrade: purchase,
				description:'Smaller robots are noticed less and require less parts to build'
			}
		);
	}
};