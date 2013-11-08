/* 
	Resistance: Module to make humans kill zombies
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(current.total_pop > 0 && current.cache) {
		if(!current.humanStrength)
			current.humanStrength = 0;

		/*if(current.army) {
			// Army can protect itself but offers only limited protection to civilians, the less the better
			current.humanStrength += (current.army.size / current.total_pop) * current.army.experience;
		}*/

		strength.humanStrength = current.humanStrength + Math.log(current.panic+1);
	}
},{
	init: function() {

	},
	runtime: 1,
	alwaysActive: true,
	children: ['armies']
})