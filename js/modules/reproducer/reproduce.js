exports.type = 'infect';
exports.run = function(current, passData, multiplier) {
	if(passData.reproduction > 0) {
	}
};
exports.options = {
	runtime: 20,
	children: ['reproducer.upgrade-repro']
};