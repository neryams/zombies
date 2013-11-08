/* 
	Aggression: allows zombies to kill people
*/
new Module('infect', function(current,target,strength) {
	strength.zombieStrength = this.zombieStartStrength;
	strength.panic = this.panic;
},{
	runtime: 0,
	init: function() {
		this.panic = 0;
		this.zombieStartStrength = 0;
		this.S.addUpgrades(this,
			{cost: 1000,paths:['main'],name:'Hunger', onUpgrade: function() {
				this.val('zombieStartStrength',5);
				this.val('panic',3);
			}, description:'Makes zombies aggressive.'},
			{cost: 1000,paths:['aggression-0'],name:'Hyper Agression',gene:{size: 5, shape: 's', color: 'red'}, onUpgrade: function() {
				this.val('zombieStartStrength',10,'+');
				this.val('panic',3,'+');
			}, description:'Makes zombies more likely to kill people. Improves effectiveness against military. Increases Panic.'}
		);
	},
	alwaysActive: true
})