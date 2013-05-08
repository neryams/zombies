/* 
	Climate Acclimation: Upgrades to reduce the penalties for spreading to a region with different climate
*/
new Module('event', function(upgrade) {
	if(upgrade.level % 3 == 0) {
		this.S.modules['climate'].val('idealTemp',5,'+');
		this.S.modules['climate'].val('rangeTemp',3,'+');
	}
	else if(upgrade.level - 1 % 3 == 0) {
		this.S.modules['climate'].val('idealTemp',5,'-');
		this.S.modules['climate'].val('rangeTemp',3,'+');
	}
	else {
		this.S.modules['climate'].val('idealWet',25,'+');
		this.S.modules['climate'].val('rangeWet',12,'+');
	}
},{
	init: function() {
		this.S.addUpgrades(this,
			{cost: 200,paths:['main'],name:'Heat Affinity I', description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 200,paths:['main'],name:'Cold Affinity I', description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 200,paths:['main'],name:'Water Affinity I',bg:30, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}},
			{cost: 400,paths:['climateAcc-0'],name:'Heat Affinity II', description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 400,paths:['climateAcc-1'],name:'Cold Affinity II', description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 400,paths:['climateAcc-2'],name:'Water Affinity II',bg:30, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}}
		);
	},
	dependencies: ['climate']
})