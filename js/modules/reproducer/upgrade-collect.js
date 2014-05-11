exports.type = 'infect';
exports.run = function(current,passData) {
	passData.collect += this.rateAdjust;
};
exports.options = {
	init: function() {
		this.rateAdjust = 0;
		var adjustReproduction = function() {
			this.val('rateAdjust', 2, '+');
		};
		var adjustReproduction2 = function() {
			this.val('rateAdjust', 2, '*');
		};
		this.S.addUpgrades(this,
			{cost: 200,
				paths:['reproducer.strain'],
				name:'Reproduction Boost',
				onUpgrade: adjustReproduction,
				onGeneActivate: adjustReproduction2,
				description:'Zombies Reproduce more.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'red'
				},
				style: {
					angle: 0.125,
					arcTangent: 0.5
				}
			},
			{
				cost: 200,
				paths:['reproducer.upgrade-collect_0'],
				name:'Reproduction Boost',
				onUpgrade: adjustReproduction,
				onGeneActivate: adjustReproduction2,
				description:'Zombies Reproduce more.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'red'
				},
				style: {
				}
			}
		);
	},
	dependencies: ['reproducer.strain','reproducer.reproduce']
};