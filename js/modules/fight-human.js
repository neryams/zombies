/* 
	Resistance: Module to make humans kill zombies
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	if(current.location.total_pop > 0 && current.location.cache) {
		if(!current.location.humanStrength)
			current.location.humanStrength = 0;

		/*if(current.army) {
			// Army can protect itself but offers only limited protection to civilians, the less the better
			current.humanStrength += (current.army.size / current.total_pop) * current.army.experience;
		}*/

		passData.humanStrength = current.location.humanStrength + Math.log(current.location.panic+1);
	}
};
exports.options = {
	init: function() {

	},
	runtime: 1,
	children: ['event-panic','event-armies']
};