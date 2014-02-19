/*
	Bite: infect healthy people that are in the same square as the zombie. 
*/
exports.type = 'infect';
exports.run = function(current,target,strength) {
	strength.infectChance = this.infectPower;
	strength.panic += this.panic;
};
exports.options = {
	init: function() {
		this.panic = 0;
		this.infectPower = 0;
		this.S.addUpgrades(this,
			{cost: 500,paths:['aggression-0'],name:'Infected Bite', onUpgrade: function() {
				this.activate();
				this.val('panic',1);
				this.val('infectPower',0.5);
			}, description:'The quintessential trademark of a zombie. Allows infection of healthy humans. Creates lots of panic.', gene:{size: 2, shape: 'l', color: 'purple'}}
		);
	},
	runtime: 1,
	dependencies: ['aggression']
};