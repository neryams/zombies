exports.type = 'infect';
exports.run = function(current, passData) {
	passData.panic /= this.panicReduce;
};
exports.options = {
	init: function() {
		this.panicReduce = 1;

		var mini = function() {
			if(!this.isActive())
				this.activate();

			this.val('panicReduce', 1.5, '*');
			this.S.modules['reproducer.reproduce'].val('efficiency', 0.8, '*');
		};
		this.S.addUpgrades(this,
			{
				cost: 10000,
				paths:['movement.base_0'],
				name:'Miniturization',
				onUpgrade: mini,
				description:'Smaller robots are noticed less, require less parts to build, but move slower'
			}
		);
	},
	runtime: 21
};