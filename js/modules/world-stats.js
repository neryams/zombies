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
	init: function() {
		this.world_infected = 0;
		this.world_pop = 0;

		// Set the initial world population
		for(var i = 0, n = this.S.populatedPoints.length; i < n; i++) {
			this.world_pop += this.S.populatedPoints[i].total_pop;
		}

		this.S.UI.interfaceParts.top_bar.addDataField({
			title: 'ui:labels.date',
			dynamic: 'date',
			dynamicFormat: function(value) {
				return value.getMonthName() + ' ' + value.getDate() + ', ' + value.getFullYear();
			}
		});

		this.S.UI.interfaceParts.top_bar.addDataField({
			title: 'ui:labels.virus_name',
			dynamic: 'virus_name'
		}).val(this.S.status.virus_name);

		this.S.UI.interfaceParts.top_bar.addDataField({
			title: 'ui:labels.population_world',
			dynamic: 'world_pop',
			value: this.world_pop
		});

		this.S.UI.interfaceParts.top_bar.addDataField({
			title: 'ui:labels.population_zombies',
			dynamic: 'world_infected',
			value: this.world_infected
		});
	},
	alwaysActive: true
};