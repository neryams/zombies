exports.type = 'infect';
exports.run = function(current, passData, multiplier) {
	if(current.location.tech > 0 && passData.collect > 0) {
		if(current.collected === undefined)
			current.collected = 0;

		// Not just multiplying by horde size because the horde still has to walk through the point
		var resource_collected = passData.collect * Math.log(current.size * 10 + 1);

		passData.panic += resource_collected;

		resource_collected *= multiplier;
		if(current.location.total_pop < resource_collected)
			resource_collected = current.location.total_pop;
		current.location.total_pop -= resource_collected;
		
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
		this.efficiency = 100;
		this.ratio_money = 0.1;
	},
	runtime: 20,
	children: ['reproducer.upgrade-collect']
};