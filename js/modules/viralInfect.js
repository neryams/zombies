/* 
	Viral Infection: Vanilla infection module that allows the zombie virus to infect people contagioiusly over the air and water.
*/
new Module('infect', function(current,target,strength) {
	strength.spreadChance += this.infectPower;
	strength.panic += this.panic;
},{
	init: function() {
		this.panic = 0;
		this.infectPower = 0;
	},
	children: ['transmitAir','transmitWater'],
	runtime: 1
})