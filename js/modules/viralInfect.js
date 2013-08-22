/* 
	Viral Infection: Vanilla infection module that allows the zombie virus to infect people contagioiusly over the air and water.
*/
new Module('infect', function(current,target,strength) {
	strength.spreadChance += this.infectPower;
	strength.panic += this.panic;
},{
	init: function() {
		this.panic = 0;
		this.infectPower = 0;

		this.S.addUpgrades(this,
			{cost: 2000,paths:['bite'], name:'Airborne Transmittance', onUpgrade: function() {
				this.activate();
				this.val('infectPower',2);
			}, description:'Unlocks evolutions for the zombie virus to infect healthy people through the air. Air infection does not need a zombie in the square to infect, can infect large numbers of people independent of the number of zombies in the area.'},
			{cost: 1500, paths:['viralInfect-0'], name:'Coughing', gene:{size: 4, shape: 's', color: 'green'}, onUpgrade: function() {
				this.val('panic',0.5,'+');
				this.val('infectPower',8,'+');
			}, description:'Makes the virus more infectious via air. Increases panic slightly.'},
			{cost: 2500, paths:['viralInfect-1'], name:'Sneezing', gene:{size: 5, shape: 'c', color: 'red'}, onUpgrade: function() {
				this.val('panic',0.5,'+');
				this.val('infectPower',12,'+');
			}, description:'Makes the virus more infectious via air. Increases panic moderately.'}
		);
	},
	children: ['transmitWater'],
	runtime: 1
})