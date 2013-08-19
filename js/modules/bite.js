/*
	Bite: infect healthy people that are in the same square as the zombie. 
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(arguments.length < 3) {
		if(!this.isActive())
			this.S.addActive(this.id);

		this.val('panic',1);
		this.val('infectPower',0.2);
	// Otherwise this is a standard run
	} else {
		strength.infectChance = this.infectPower;
		strength.panic += this.panic;
	}
},{
	init: function() {
		this.panic = 0;
		this.infectPower = 0;
		this.S.addUpgrades(this,
			{cost: 500,paths:['main'],name:'Infected Bite', description:'The quintessential trademark of a zombie. Allows infection of healthy humans.', gene:{size: 2, shape: 'l', color: 'purple'}}
		);
	},
	runtime: 1,
	dependencies: ['aggression']
})