/*
	Bite: infect healthy people that are in the same square as the zombie. 
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(arguments.length < 3) {
		this.val('panic',2);
		this.val('infectPower',1);
	// Otherwise this is a standard run
	} else {
		var bite_power = this.S.modules['aggression'].val('aggression') * (strength.mobility + this.S.modules['moveSpeed'].val('burstSpeed'));
		strength.infectSelf = this.infectPower * bite_power;
		strength.kill = 1/this.infectPower * bite_power;
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
	alwaysActive: true,
	dependencies: ['aggression']
})