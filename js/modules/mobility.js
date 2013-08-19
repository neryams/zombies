/*
	Mobility: Module to apply the mobility value into the encounter chance after other modules finish with it
*/
new Module('infect', function(current,target,strength) {
	strength.encounterProbability += strength.mobility;
},{
	runtime: 11,
	dependencies: ['moveSpeed'],
	alwaysActive: true
})