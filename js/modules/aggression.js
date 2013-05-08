/* 
	Aggression: allows zombies to kill people
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(arguments.length < 3) {
		this.val('agression',2);
		this.val('panic',3);
	// Otherwise this is a standard run
	} else {
		strength.kill = current.infected * this.aggression * (strength.mobility + this.S.modules['moveSpeed'].val('burstSpeed')) / 5;
		strength.panic = this.panic;
	}
},{
	runtime: 0,
	init: function() {
		this.panic = 1;
		this.aggression = 1;
		this.S.addUpgrades(this,
			{cost: 1000,paths:['climateAcc-3'],name:'Hyper Agression',gene:{size: 5, shape: 's', color: 'red'}, description:'Makes zombies more likely to kill people. Improves effectiveness against military. Increases Panic.'}
		);
	},
	alwaysActive: true
})