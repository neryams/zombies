/*
	Base Movement: upgrades to make robots move faster
*/
exports.type = 'infect';
exports.run = function(current, passData) {
	var vegetationSlow = current.location.trees * this.vegetationSlow * 0.00001 + 1;
	passData.mobility = this.speed / vegetationSlow;
	passData.encounterProbability = passData.mobility;
	passData.panic += passData.mobility / 10 + this.panic;

	if(vegetationSlow > 2) {
		this.S.UILink.addNews('vegetation_slow');
	}
};
exports.options = {
	init: function() {
		this.speed = 2.5; // movement speed of robots in kph. Average walking speed is 4.5-5.5 kph so they start pretty slow
		this.burstSpeed = 0;
		this.panic = 0;
		this.vegetationSlow = 10;

		this.swimming = false;

		var smellItems = [];

		this.getCurrentSmell = function() {
			if(!smellItems.length)
				return '';
			else
				return smellItems[smellItems.length - 1].id;
		};
		this.getCurrentSmellDistance = function() {
			if(!smellItems.length)
				return 0;
			else
				return smellItems[smellItems.length - 1].strength;			
		};
		this.currentSmellAdd = function(item, strength) {
			this.currentSmellRemove(item);
			smellItems.push({
				id: item,
				strength: strength
			});
		};
		this.currentSmellRemove = function(item) {
			for(var i = 0; i < smellItems.length; i++) {
				if(smellItems[i].id == item) {
					smellItems.splice(i, 1);
					break;
				}
			}
		};

		var speedUpgrade = function() {
			this.val('speed',1,'+');
		};

		this.S.addUpgrades(this,
			{
				id: 'movement.base_0',
				cost: 1000,
				paths:['zombie.strain','reproducer.strain'],
				name:'Servo Oil Research', 
				onUpgrade: speedUpgrade, 
				description:'Robots walk faster.',
				style: {
					angle: 0.66
				}
			},
			{
				id: 'movement.base_1',
				cost: 2000,
				paths:['movement.base_0'],
				name:'Servo Motor Research', 
				onUpgrade: speedUpgrade, 
				description:'Robots walk faster.'
			},
			{
				id: 'movement.base_2',
				cost: 4000,
				paths:['movement.base_1'],
				name:'Actuator Servos', 
				onUpgrade: speedUpgrade, 
				description:'Robots walk faster.'
			}
		);
	},
	runtime: 1,
	children: ['movement.addEncounters','movement.move','movement.dataPointUpdate','movement.upgrade-swim']
};