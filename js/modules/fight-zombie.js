/* 
	Aggression: allows zombies to kill people
*/
exports.type = 'infect';
exports.run = function(current,target,passData) {
	passData.zombieStrength = this.zombieStartStrength;
	passData.panic = this.panic;
};
exports.options = {
	init: function() {
		this.panic = 0;
		this.zombieStartStrength = 0;
		this.S.addUpgrades(this,
			{cost: 1000,paths:['strain'],name:'Hunger', onUpgrade: function() {
				this.val('zombieStartStrength',5);
				this.val('panic',1);
			}, description:'Makes zombies aggressive.'},
			{cost: 1000,paths:['fight-zombie_0'],name:'Hyper Agression',gene:{size: 5, shape: 's', color: 'red'}, onUpgrade: function() {
				this.val('zombieStartStrength',10,'+');
				this.val('panic',2,'+');
			}, description:'Makes zombies more likely to kill people. Improves effectiveness against military. Increases Panic.'}
		);
	},
	runtime: 5,
	dependencies: ['process-fightBite']
};