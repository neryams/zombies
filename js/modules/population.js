/* 
	Population: Module to change the infect rate based on population
*/
new Module('infect', function(current,target,strength) {
	var infect_strength = Math.sqrt(current.infected)*Math.sqrt(target.total_pop/this.S.config.max_pop);
	strength.infectSelf *= infect_strength;
	strength.infect *= infect_strength;
},{
	runtime: 9,
	children: ['aggression'],
	alwaysActive: true
})