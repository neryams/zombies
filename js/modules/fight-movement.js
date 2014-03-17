/*
	Mobility: Module to apply the mobility value into the encounter chance after other modules finish with it
*/
exports.type = 'infect';
exports.run = function(current,passData) {
	passData.encounterProbability += passData.mobility;
};
exports.options = {
	runtime: 11,
	dependencies: ['base-movement']
};