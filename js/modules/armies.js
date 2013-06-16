/* 
	Armies: Humans will create armies that will kill zombies
*/
new Module('event', function() {
	for(var i = 0; i < this.armies.length; i++) {

	}
},{
	init: function() {
		module = this;
		this.armies = [];
		this.Army = function(nationality) {
			this.nationality = nationality;
			this.location = this.S.countries[nationality].capitol;
			this.S.rendererDecal('army'+nationality+'marker', this.location.lat, this.location.lng, 10, 'gun');

			this.location.army = this;
		}
		this.Army.prototype = {
			nationality: 0,
			size: 0,
			experience: 1,
			S: module.S
		}
		this.Army.prototype.move = function(point) {

		}
		this.Army.prototype.enlist = function(portion) {
			var i = this.S.points.length,
				total_pop = 0,
				to_move;
			this.location.total_pop -= this.size;
			do {
				i--;
				if(this.S.points[i].country == this.nationality) {
					if(this.S.points[i].id == this.location.id)
						to_move = Math.ceil((this.S.points[i].total_pop - this.size) * portion * 0.005); // base 0.5% of the population in the army
					else
						to_move = Math.ceil(this.S.points[i].total_pop * portion * 0.005);
					this.S.points[i].total_pop -= to_move;
					this.S.updateSquare(this.S.points[i]);
					total_pop += to_move;

					// Enlisting to army also boosts the country's resistance level as a whole - Higher alertness.
					this.S.points[i].human_strength += portion;
				}
			} while (i);
			this.size += total_pop;
			this.location.total_pop += this.size;
			this.S.updateSquare(this.location);
		}

		this.createArmy = function(country) {
			this.S.countries[country].army = new this.Army(country)
			this.armies.push(this.S.countries[country].army);
			this.S.countries[country].army.enlist(1);
			return true;
		}

		this.boostArmy = function(val, country) {
			this.S.countries[country].army.enlist(val);
			return true;
		}
	},
	runtime: 9,
	alwaysActive: true,
	dependencies: ['resistance']
})