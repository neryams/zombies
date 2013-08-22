/* 
	Resistance: Module to make humans kill zombies
*/
new Module('infect', function(current,target,strength) {
	// If this is running  due to an upgrade, do the upgrade
	if(current.total_pop > 0 && current.cache) {
		if(!current.human_strength)
			current.human_strength = 0;

		// .cache property contains the last turn's (or however many turns ago it changed) population data.
		if(current.cache.total_pop != current.total_pop)
			current.human_strength *= (current.total_pop/current.cache.total_pop)

		// 1 solder at base strength is worth 20 civilians
		if(current.army) {
			var adjustedCombat = current.human_strength * (current.total_pop - current.army.size) * 0.05 + current.army.size * current.army.experience;
			// Army can protect itself but offers only limited protection to civilians, the less the better
			adjustedCombat *= (current.army.size / current.total_pop);
		} else {
			var adjustedCombat = current.human_strength * current.total_pop * 0.05;
		}

		strength.humanStrength = adjustedCombat;
	}
},{
	init: function() {

	},
	runtime: 1,
	alwaysActive: true,
	children: ['armies']
})