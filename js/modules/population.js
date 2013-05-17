/* 
	Population: Module to change the infect rate based on population
*/
new Module('infect', function(current,target,strength) {
	strength.infectSelf *= Math.sqrt(current.infected)*Math.sqrt(current.total_pop/this.S.config.max_pop);
	strength.infect *= Math.sqrt(current.infected)*Math.sqrt(target.total_pop/this.S.config.max_pop);
},{
	runtime: 9,
	children: ['aggression'],
	alwaysActive: true
})