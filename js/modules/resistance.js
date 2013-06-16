/* 
	Resistance: Module to make humans kill zombies
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(current.id == target.id && current.total_pop > 0) {
		// .cache property contains the last turn's (or however many turns ago it changed) population data.
		if(current.cache.total_pop != current.total_pop)
			current.human_strength *= (current.total_pop/current.cache.total_pop)

		var civilians = current.total_pop
		if(current.army) {
			civilians -= army.size;
		}
		// Civilians have a base strength of 0.01 per person, soldiers have experience (starting at 1)
		var adjustedCombat = current.human_strength * civilians * 0.01 + army.size * army.experience;
		adjustedCombat *= 0.1;
		strength.kill /= (1+adjustedCombat);
		strength.infectSelf /= (1+adjustedCombat);
	}
},{
	init: function() {

	},
	alwaysActive: true,
	children: ['armies']
})