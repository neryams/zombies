/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
new Module('infect', function(current,target,strength) {
	var tempAdjust = 1 / (Math.pow((this.idealTemp - target.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - target.precipitation)/(this.rangeWet),2) + 1);
	strength.spreadChance   *= tempAdjust * precAdjust * 1.5;

	var tempAdjust = 1 / (Math.pow((this.idealTemp - current.location.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - current.location.precipitation)/(this.rangeWet),2) + 1);
	strength.infectChance   *= tempAdjust * precAdjust * 1.5;
	strength.zombieStrength *= tempAdjust * precAdjust * 1.5;
	strength.mobility *= tempAdjust * precAdjust;
	strength.encounterProbability *= tempAdjust * precAdjust;
},{
	onStart: function(startSquare) {
		this.idealTemp = startSquare.temperature;
		this.rangeTemp = 3;
		this.idealWet = startSquare.precipitation;
		this.rangeWet = 5;
	},
	init: function() {
		var warmAcc = function() {
			this.val('idealTemp',6,'+');
			this.val('rangeTemp',3,'+');			
		};
		var coldAcc = function() {
			this.val('idealTemp',6,'-');
			this.val('rangeTemp',3,'+');			
		};
		var wetAcc = function() {
			this.val('idealWet',10,'+');
			this.val('rangeWet',10,'+');			
		};
		this.S.addUpgrades(this,
			{cost: 200,paths:['main'],name:'Heat Affinity I', onUpgrade: warmAcc, description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 200,paths:['main'],name:'Cold Affinity I', onUpgrade: coldAcc, description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 200,paths:['main'],name:'Water Affinity I', onUpgrade: wetAcc,bg:1, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}},
			{cost: 400,paths:['climate-0'],name:'Heat Affinity II', onUpgrade: warmAcc, description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 400,paths:['climate-1'],name:'Cold Affinity II', onUpgrade: coldAcc, description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 400,paths:['climate-2'],name:'Water Affinity II', onUpgrade: wetAcc,bg:1, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}}
		);
	},
	dependencies: ['moveSpeed'],
	alwaysActive: true
})