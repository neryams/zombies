/* 
	Population: Module to change the infect rate based on population
*/
new Module('infect', function(current,target,strength) {
	var ratio = Math.sqrt(current.infected + target.total_pop)/Math.pow(this.S.config.max_pop,1/2.5);
	strength.infectSelf *= ratio * current.infected;
	strength.kill *= ratio * current.infected;
	strength.infect *= ratio * (current.infected/3);
},{
	runtime: 11,
	children: ['density'],
	alwaysActive: true
})