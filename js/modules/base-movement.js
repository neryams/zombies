/*
	Base Movement: upgrades to make zombies move faster
*/
exports.type = 'infect';
exports.run = function(current,target,passData) {
	passData.mobility = this.speed;
	passData.encounterProbability = 1 + this.burstSpeed;
	passData.panic += this.panic;
};
exports.options = {
	init: function() {
		this.speed = 3; // movement speed of zombies in kph. Average walking speed is 4.5-5.5 kph so they start pretty slow
		this.burstSpeed = 0;
		this.panic = 0;
		var speedUpgrade = function() {
			this.val('speed',1.2,'+');
			this.val('panic',1,'+');
		}
		this.S.addUpgrades(this,
			{cost: 1000,paths:['infect-bite'],name:'Hunched Walk', onUpgrade: speedUpgrade, description:'Zombies move and spread faster, are slightly more deadly, and make people panic. All movement boosts synergize with biting.', gene:{size: 4, shape: 's', color: 'grey'}},
			{cost: 2000,paths:['base-movement_0'],name:'Upright Walk', onUpgrade: speedUpgrade, description:'Zombies move spread even faster, are slightly more deadly, and make people panic. All movement boosts synergize with biting.', gene:{size: 4, shape: 's', color: 'grey'}},
			{cost: 2000,paths:['base-movement_0'],name:'Famished Trot', onUpgrade: function() {
				this.val('panic',2,'+');
				this.val('speed',0.5,'+');
				this.val('burstSpeed',7);
			}, description:'Zombies can shuffle quickly to chase prey. More deadly, slightly faster spreading.', gene:{size: 5, shape: 'c', color: 'red'}},
			{cost: 8000,paths:['base-movement_2'],name:'Ravenous Sprint', onUpgrade: function() {
				this.val('panic',20,'+');
				this.val('speed',0.5,'+');
				this.val('burstSpeed',20);
			}, description:'Zombies can sprint. Results in abject terror and a large increase in deadliness.', gene:{size: 6, shape: 'c', color: 'red'}}
		);
	},
	runtime: 1,
	children: ['fight-movement','spread-movement']
};