exports.type = 'infect';
exports.run = function(current,passData) {
	passData.reproduction += this.rateAdjust;
};
exports.options = {
	init: function() {
		this.rateAdjust = 0;
		var adjustReproduction = function() {
			this.val('rateAdjust',2,'+');
		};
		this.S.addUpgrades(this,
			{cost: 200,
				paths:['reproducer.strain'],
				name:'Reproduction Boost',
				onUpgrade: adjustReproduction,
				description:'Zombies Reproduce more.',
				gene:{
					size: 3,
					shape: 'r',
					color: 'red'
				},
				style: {
					angle: 0.125
				}
			},
			{
				cost: 200,
				paths:['reproducer.upgrade-repro_0'],
				name:'Reproduction Boost',
				onUpgrade: adjustReproduction,
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
	dependencies: ['reproducer.strain','reproducer.reproduce'],
	alwaysActive: true
};