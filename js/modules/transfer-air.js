/* 
	Viral Infection: Vanilla infection module that allows the zombie virus to infect people contagioiusly over the air and water.
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	passData.transferStrength += this.transferStrength;
	passData.transferChance += this.transferChance;
	passData.panic += this.panic;
};
exports.options = {
	init: function() {
		this.panic = 0;
		this.transferStrength = 0;
		this.transferChance = 0;

		this.S.addUpgrades(this,
			{cost: 2000,paths:['infect-bite'], name:'Respiratory Infection', onUpgrade: function() {
				this.activate();
				this.val('transferChance',1);
				this.val('transferStrength',2);
			}, description:'Unlocks evolutions for the zombie virus to infect healthy people through the air. Air infection does not need a zombie in the square to infect, can infect large numbers of people independent of the number of zombies in the area.'},
			{cost: 1500, paths:['transfer-air_0'], name:'Coughing', gene:{size: 4, shape: 's', color: 'green'}, onUpgrade: function() {
				this.val('panic',0.5,'+');
				this.val('transferChance',0.05,'+');
			}, description:'Makes the virus more infectious via air. Increases panic slightly.'},
			{cost: 2500, paths:['transfer-air_1'], name:'Sneezing', gene:{size: 5, shape: 'c', color: 'red'}, onUpgrade: function() {
				this.val('panic',0.5,'+');
				this.val('transferChance',0.05,'+');
			}, description:'Makes the virus more infectious via air. Increases panic moderately.'}
		);
	},
	children: [],
	dependencies: ['process-transfer'],
	runtime: 5
};