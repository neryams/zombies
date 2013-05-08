/* 
	World Stats: Module to update the UI with various statistics about the simulation.
*/
new Module('event', function() {
	this.S.properties.money += 1;

	if(this.S.iteration % 2 == 0) {
		this.S.UIData['world_pop'] = 0;
		this.S.UIData['world_infected'] = 0;
		for(var i = 0, n = this.S.populatedPoints.length; i < n; i++) {
			this.S.UIData['world_pop'] += this.S.populatedPoints[i].total_pop;
			this.S.UIData['world_infected'] += this.S.populatedPoints[i].infected;
		}
	}
	this.S.UIData['cur_date'] = this.S.date.getMonthName() + ' ' + this.S.date.getDate() + ', ' + this.S.date.getFullYear();
	
	this.S.UIData['money'] = this.S.properties.money;
},{
	init: function() {
        this.S.UI.interfaceParts.stats.addDataField('text',{
        	dynamic: 'cur_date'
        });
        this.S.UI.interfaceParts.stats.addDataField('text',{title: 'Disease Name'}).val(this.S.properties.virus_name);
        this.S.UI.interfaceParts.stats.addDataField('text',{
        	title: 'World Population',
        	dynamic: 'world_pop'
        });
        this.S.UI.interfaceParts.stats.addDataField('text',{
        	title: 'Zombie Population',
        	dynamic: 'world_infected'
        });
	},
	alwaysActive: true
})