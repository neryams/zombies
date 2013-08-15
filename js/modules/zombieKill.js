/* 
	zombieKill: module for humans killing zombies
*/
new Module('infect', function(current,target,strength) {
	if(strength.humanStrength && current.infected > 0) {
		current.infected -= strength.humanStrength - (strength.infectSelf + strength.kill)/2;
	}
},{
	runtime: 20,
	alwaysActive: true
})