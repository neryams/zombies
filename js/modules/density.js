/* 
	Density: Module to change the infect and human killing rate based on population density
*/
new Module('infect', function(current,target,strength) {
	var adjust = 1 + Math.cos(current.lat)*6371;
	strength.kill *= adjust;
	strength.infectSelf /= adjust;
},{
	runtime: 19,
	alwaysActive: true
})