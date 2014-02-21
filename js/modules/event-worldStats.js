/* 
	World Stats: Module to update the UI with various statistics about the simulation.
*/
exports.type = 'event';
exports.run = function() {
	this.world_infected = this.S.hordes.total();
	
	this.S.UIData['world_pop'] = this.world_pop;
	this.S.UIData['world_infected'] = this.world_infected;

	this.S.UIData['cur_date'] = this.S.date.getMonthName() + ' ' + this.S.date.getDate() + ', ' + this.S.date.getFullYear();
	this.S.UIData['money'] = this.S.properties.money;

};
exports.options = {
	runtime: 20, // Always run this last to get accurate data
	init: function() {
		this.world_infected = 0;
		this.world_pop = 0;

		// Set the initial world population
		for(var i = 0, n = this.S.populatedPoints.length; i < n; i++) {
			this.world_pop += this.S.populatedPoints[i].total_pop;
		}

        this.S.UI.interfaceParts.stats.addDataField('text',{
        	dynamic: 'cur_date'
        });
        this.S.UI.interfaceParts.stats.addDataField('text',{title: 'ui:labels.virus_name'}).val(this.S.properties.virus_name);
        this.S.UI.interfaceParts.stats.addDataField('text',{
        	title: 'ui:labels.population_world',
        	dynamic: 'world_pop',
        	value: this.world_pop
        });
        this.S.UI.interfaceParts.stats.addDataField('text',{
        	title: 'ui:labels.population_zombies',
        	dynamic: 'world_infected', 
        	value: this.world_infected
        });
	},
	alwaysActive: true
};