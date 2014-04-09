/* 
	Grid Booster: Allows the evolution grid to be expanded
*/
exports.type = 'event';
exports.run = function() {
};
exports.options = {
	init: function() {
		var enlargeGrid = function() {
			this.S.status.gridSize++;
		};
		this.S.addUpgrades(this,
			{
				cost: 5000,
				paths:['reproducer.strain'],
				name:'Gene Upgrade',
				onUpgrade: enlargeGrid,
				description:'Makes gene mutation grid larger. Allows for more complex mutations. <p><strong>6x6 Mutation Grid</strong></p>'
			},
			{
				cost: 20000,
				paths:['upgrade-grid_0'],
				name:'Gene Upgrade II',
				onUpgrade: enlargeGrid,
				description:'Makes gene mutation grid larger. Allows for even more complex mutations. <p><strong>7x7 Mutation Grid</strong></p>'
			},
			{
				cost: 100000,
				paths:['upgrade-grid_1'],
				name:'Gene Upgrade III',
				onUpgrade: enlargeGrid,
				description:'Makes gene mutation grid larger. Allows for the most complex mutations. <p><strong>8x8 Mutation Grid</strong></p>'
			}
		);
	}
};