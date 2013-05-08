/* 
	Transmit Water: Allows zombies to cross deserts,regions with very low humidity (PLACEHOLDER)
*/
new Module('event', function(upgrade) {

},{
	init: function() {
		this.S.addUpgrades(this,
			{cost: 2000,paths:['bite'],name:'Water Transmittance', gene:{size: 7, shape: 's', color: 'blue'}, description:'Virus can poison the water supply. Areas high in precipitation, <span class="strong">especially downhill</span>, will experience great increases in infection rates. More powerful than air transmittance, but more situational.'}
		);
	}
})