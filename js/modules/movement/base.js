/*
	Base Movement: upgrades to make zombies move faster
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	passData.mobility = this.speed;
	passData.encounterProbability = this.speed + this.burstSpeed;
	passData.panic += this.panic;
};
exports.options = {
	init: function() {
		this.speed = 3.5; // movement speed of zombies in kph. Average walking speed is 4.5-5.5 kph so they start pretty slow
		this.burstSpeed = 0;
		this.panic = 0;

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
			this.val('speed',1.5,'+');
			this.val('panic',1,'+');
		};
		this.S.addUpgrades(this,
			{
				cost: 1000,
				paths:['zombie.strain','reproducer.strain'],
				name:'Servo Upgrade', 
				onUpgrade: speedUpgrade, 
				description:'Robots walk faster.',
				style: {
					angle: 0.66
				}
			}
		);
	},
	runtime: 1,
	children: ['movement.addEncounters','movement.move','movement.dataPointUpdate','movement.upgrade-swim']
};