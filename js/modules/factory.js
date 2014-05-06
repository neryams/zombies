exports.type = 'event';
exports.run = function() {
	if(this.productionSpeed > 0)
		if(this.productionSpeed > this.baseInterval || this.S.status.iteration % (this.baseInterval / this.productionSpeed) === 0) {
			var robotsCreated = Math.ceil(this.productionSpeed / this.baseInterval);

			for(var i = 0; i < this.locations.length; i++)
				this.S.hordes.push(new Horde(robotsCreated, this.locations[i]));
		}
};
exports.options = {
	runtime: 20, // Always run this last to get accurate data
	init: function() {
		this.locations = [];
		this.productionSpeed = 0;
		this.baseInterval = 10;
	}
};