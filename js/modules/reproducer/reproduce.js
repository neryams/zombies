exports.type = 'infect';
exports.run = function(current, passData, multiplier) {
	if(current.location.tech > 0 && passData.collect > 0) {
		if(current.collected === undefined)
			current.collected = 0;

		var resource_collected = passData.collect * current.size;

		passData.panic += resource_collected;

		resource_collected *= multiplier;
		if(current.location.tech < resource_collected)
			resource_collected = current.location.tech;
		current.location.tech -= resource_collected;
		
		var money_collected = Math.ceil(resource_collected * this.ratio_money);

		resource_collected -= money_collected;
		current.collected += resource_collected;

		if(current.collected > this.efficiency) {
			var create_count = Math.floor(current.collected / this.efficiency);
			current.collected = current.collected % this.efficiency;

			current.size += create_count;
		}
		this.S.status.money += money_collected;
	}
};
exports.options = {
	init: function() {
		this.efficiency = 200;
		this.ratio_money = 0.1;
	},
	runtime: 20,
	children: ['reproducer.upgrade-repro']
};