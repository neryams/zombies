/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
new Module('infect', function(current,target,strength) {
	var tempAdjust = 1 / (Math.pow((this.idealTemp - target.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - target.precipitation)/(this.rangeWet),2) + 1);
	strength.spreadChance   *= tempAdjust * precAdjust * 2.5;

	var tempAdjust = 1 / (Math.pow((this.idealTemp - current.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - current.precipitation)/(this.rangeWet),2) + 1);
	strength.infectChance   *= tempAdjust * precAdjust * 2.5;
	strength.zombieStrength *= tempAdjust * precAdjust * 2.5;
	strength.mobility *= tempAdjust * precAdjust;
	strength.encounterProbability *= tempAdjust * precAdjust;
},{
	onStart: function(startSquare) {
		this.idealTemp = startSquare.temperature;
		this.rangeTemp = 3;
		this.idealWet = startSquare.precipitation;
		this.rangeWet = 5;
	},
	runtime: 9,
	children: ['climateAcc'],
	dependencies: ['moveSpeed'],
	alwaysActive: true
})