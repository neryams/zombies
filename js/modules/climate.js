/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
new Module('infect', function(current,target,strength) {
	var tempAdjust = Math.pow((this.idealTemp - target.temperature)/(this.rangeTemp),2);
	var precAdjust = Math.pow((this.idealWet - target.precipitation)/(this.rangeWet),2);
	strength.infect *= 2.5 / (tempAdjust + 1);
	strength.infect *= 2.5 / (precAdjust + 1);
	strength.infectSelf *= 2.5 / (tempAdjust + 1);
	strength.infectSelf *= 2.5 / (precAdjust + 1);
	strength.kill *= 2.5 / (tempAdjust + 0.5);
	strength.kill *= 2.5 / (precAdjust + 0.5);
},{
	onStart: function(startSquare) {
		this.idealTemp = startSquare.temperature;
		this.rangeTemp = 2;
		this.idealWet = startSquare.precipitation;
		this.rangeWet = 1;
	},
	children: ['climateAcc'],
	alwaysActive: true
})