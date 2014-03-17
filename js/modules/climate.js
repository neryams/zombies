/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	var tempAdjust = 1 / (Math.pow((this.idealTemp - passData.target.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - passData.target.precipitation)/(this.rangeWet),2) + 1);
	passData.spreadChance   *= tempAdjust * precAdjust * 1.5;

	tempAdjust = 1 / (Math.pow((this.idealTemp - current.location.temperature)/(this.rangeTemp),2) + 1);
	precAdjust = 1 / (Math.pow((this.idealWet - current.location.precipitation)/(this.rangeWet),2) + 1);
	passData.infectChance   *= tempAdjust * precAdjust * 1.5;
	passData.zombieStrength *= tempAdjust * precAdjust * 1.5;
	passData.mobility *= tempAdjust * precAdjust;
	passData.encounterProbability *= tempAdjust * precAdjust;
};
exports.options = {
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
			{cost: 200,paths:['strain'],name:'Heat Affinity I', onUpgrade: warmAcc, description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 200,paths:['strain'],name:'Cold Affinity I', onUpgrade: coldAcc, description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 200,paths:['strain'],name:'Water Affinity I', onUpgrade: wetAcc,bg:1, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}},
			{cost: 400,paths:['climate_0'],name:'Heat Affinity II', onUpgrade: warmAcc, description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
			{cost: 400,paths:['climate_1'],name:'Cold Affinity II', onUpgrade: coldAcc, description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
			{cost: 400,paths:['climate_2'],name:'Water Affinity II', onUpgrade: wetAcc,bg:1, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}}
		);
	},
	dependencies: ['base-movement'],
	alwaysActive: true
};