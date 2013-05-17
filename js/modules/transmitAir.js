/* 
	Transmit Air: Allows zombie virus to infect people over the air.
*/
new Module('event', function(upgrade) {
	if(!this.S.modules['viralInfect'].isActive())
		this.S.addActive('viralInfect');

	if(upgrade.level == 0)
	{
		this.S.modules['viralInfect'].val('infectPower',2,'+');
	}
	else if(upgrade.level == 1)
	{
		this.S.modules['viralInfect'].val('panic',0.5,'+');
		this.S.modules['viralInfect'].val('infectPower',8,'+');
	}
	else if(upgrade.level == 2)
	{
		this.S.modules['viralInfect'].val('panic',0.5,'+');
		this.S.modules['viralInfect'].val('infectPower',12,'+');
	}
},{
	init: function() {
		this.S.addUpgrades(this,
			{cost: 2000,paths:['bite'],name:'Airborne Transmittance', description:'Unlocks evolutions for the zombie virus to infect healthy people through the air. Air infection does not need a zombie in the square to infect, can infect large numbers of people independent of the number of zombies in the area.'},
			{cost: 1500,paths:['transmitAir-0'],name:'Coughing', gene:{size: 4, shape: 's', color: 'green'}, description:'Makes the virus more infectious via air. Increases panic slightly.'},
			{cost: 2500,paths:['transmitAir-1'],name:'Sneezing', gene:{size: 5, shape: 'c', color: 'red'}, description:'Makes the virus more infectious via air. Increases panic moderately.'}
		);
	}
})