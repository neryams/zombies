/*
	Main: Import Required Modules 
*/
exports.type = 'event';
exports.run = function() {};
exports.options = {
	children: ['strain-zombie','strain-reproducer','event-worldStats','base-population','process-transfer']
};