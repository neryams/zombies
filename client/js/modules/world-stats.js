/* 
	World Stats: Module to update the UI with various statistics about the simulation.
*/
exports.type = 'event';
exports.run = function() {
	this.world_infected = this.S.hordes.total();
	
	this.S.status.world_pop = this.world_pop;
	this.S.status.world_infected = this.world_infected;
};
exports.options = {
	runtime: 100, // Always run this last to get accurate data
	init: function(dataPoints) {
		this.world_infected = 0;
		this.world_pop = 0;

		// Set the initial world population
		for(var i = 0, n = dataPoints.length; i < n; i++) {
			if(dataPoints[i].total_pop)
				this.world_pop += dataPoints[i].total_pop;
		}
	},
	ui: function(UI) {
		var mainBar = UI.interfaceParts.top_bar;

		mainBar.addDataField({
			type: 'field',
			title: 'ui:labels.date',
			dynamic: 'date',
			dynamicFormat: function(value) {
				return value.getMonthName() + ' ' + value.getDate() + ', ' + value.getFullYear();
			}
		});

		mainBar.addDataField({
			type: 'field',
			title: 'ui:labels.virus_name',
			dynamic: 'virus_name'
		}).val(this.S.status.virus_name);

		mainBar.addDataField({
			type: 'field',
			title: 'ui:labels.population_world',
			dynamic: 'world_pop',
			value: this.world_pop
		});

		mainBar.addDataField({
			type: 'field',
			title: 'ui:labels.population_zombies',
			dynamic: 'world_infected',
			value: this.world_infected
		});
	},
	alwaysActive: true
};