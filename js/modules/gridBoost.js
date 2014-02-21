/* 
	Grid Booster: Allows the evolution grid to be expanded
*/
exports.type = 'event';
exports.run = function(upgrade) {
};
exports.options = {
	init: function() {
		var enlargeGrid = function() {
			this.S.properties.gridSize++;	
		};
		this.S.addUpgrades(this,
			{cost: 5000,paths:['strain'],name:'Gene Upgrade', onUpgrade: enlargeGrid, description:'Makes gene mutation grid larger. Allows for more complex mutations. <p class="strong">6x6 Mutation Grid</p>'},
			{cost: 20000,paths:['gridBoost_0'],name:'Gene Upgrade II', onUpgrade: enlargeGrid, description:'Makes gene mutation grid larger. Allows for even more complex mutations. <p class="strong">7x7 Mutation Grid</p>'},
			{cost: 100000,paths:['gridBoost_1'],name:'Gene Upgrade III', onUpgrade: enlargeGrid, description:'Makes gene mutation grid larger. Allows for the most complex mutations. <p class="strong">8x8 Mutation Grid</p>'}
		);
	}
};