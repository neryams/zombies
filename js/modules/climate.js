/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	var tempAdjust = 1 / (Math.pow((this.idealTemp - current.location.temperature)/(this.rangeTemp),2) + 1);
	var precAdjust = 1 / (Math.pow((this.idealWet - current.location.precipitation)/(this.rangeWet),2) + 1);
	
	passData.zombieStrength *= tempAdjust * precAdjust * 1.5;};
exports.options = {
	onStart: function(startSquare) {
		this.idealTemp = startSquare.temperature;
		this.rangeTemp = 8;
		this.idealWet = startSquare.precipitation;
		this.rangeWet = 10;
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
			{cost: 200,
				paths:['zombie.strain','reproducer.strain'],
				name:'Heat Affinity I',
				onUpgrade: warmAcc,
				description:'Zombies become stronger in warmth.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'yellow'
				},
				style: {
					bg: 2,
					angle: 1,
					arcTangent: -0.0833,
					distance: 120
				}
			},
			{
				cost: 200,
				paths:['zombie.strain','reproducer.strain'],
				name:'Water Affinity I',
				onUpgrade: wetAcc,
				description:'Zombies become stronger in wet conditions.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'blue'
				},
				style: {
					bg: 1,
					angle:1.1667
				}
			},
			{
				cost: 200,
				paths:['zombie.strain','reproducer.strain'],
				name:'Cold Affinity I',
				onUpgrade: coldAcc,
				description:'Zombies become stronger in cold.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'green'
				},
				style: {
					bg: 3,
					angle: 1.3333,
					arcTangent: 0.0833,
					distance: 120
				}
			},
			{
				cost: 400,
				paths:['climate_0'],
				name:'Heat Affinity II',
				onUpgrade: warmAcc,
				description:'Zombies become stronger in warmth.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'yellow'
				},
				style: {
					bg: 2
				}
			},
			{cost: 400,
				paths:['climate_1'],
				name:'Water Affinity II',
				onUpgrade: wetAcc,
				description:'Zombies become stronger in wet conditions.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'blue'
				},
				style: {
					bg: 1
				}
			},
			{
				cost: 400,
				paths:['climate_2'],
				name:'Cold Affinity II',
				onUpgrade: coldAcc,
				description:'Zombies become stronger in cold.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'green'
				},
				style: {
					bg: 3
				}
			}
		);
	},
	alwaysActive: true
};