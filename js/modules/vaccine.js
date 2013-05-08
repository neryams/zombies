/* 
	Vaccine: Makes the world start vaccine research based on panic. If the vaccine is completed, you lose
	Vaccine progress is applied to the upgrade colors on a specific row  
*/
new Module('event', function() {
	var addResearch = 0;
	// get the total amount of research added this turn based on remaining actively researching country populations
	for(var i = 1, n = this.S.countries.length; i < n; i++)
		if(this.S.countries[i].research)
			addResearch += this.S.countries[i].research * this.S.countries[i].capitol.total_pop * 5 / this.S.config.max_pop;

	if(addResearch > 0) {
		// add the research into each square and color association
		this.research = 0;
		for(var i = 0; i < this.currentColors.length; i++) {
			this.progress[this.currentColors[i]+i] += addResearch/this.currentColors.length;
    		this.research += this.progress[this.currentColors[i]+i];
		}

    	// If there is enough research, make the player lose
		this.progressBar.val(this.research / this.requiredResearch);
		if(this.research > this.requiredResearch)
			this.S.end('lose'); 			
	}
},{
	init: function() {
		this.research = 0;
		this.requiredResearch = 10000;
		this.countryResearchStrength = [];
		this.progress = {};
		this.currentColors = [];
		this.hotRow = Math.floor(this.S.properties.gridSize/2); // row index of the grid that the vacciene progress will be cased on.
		this.S.UI.addMutationGridOverlay(null,this.hotRow);

		this.startResearch = function(country) {
			var countryList = [];
			if(!this.isActive()) {
				this.S.addActive('vaccine');
			}
			if(country) {
				if(!this.S.countries[country].research) {
					this.researchRate(1, country);
				}
			}
			else 
			{
				this.researchRate(1);
			}
		}

		this.researchRate = function(val, country) {
			if(country) {
				if(val == 0 || this.S.countries[country].research < val) 
					this.S.countries[country].research = val;
			}
			else 
			{
				for(var i = 1; i < this.S.countries.length; i++) {
					if(!this.S.countries[i].research)
						this.S.countries[i].research = 0;
					if(val == 0 || this.S.countries[i].research < val)
						this.S.countries[i].research = val;
				}
			}
		}
	},
	onActivate: function() {
		var progressContainer = this.S.UI.addDataField('div',{ class: 'bottom_stats' });
		this.progressBar = progressContainer.addDataField('progressBar',{title: 'Vaccine Progress', width: 300}).val(0);
	},
	onMutationChange: function(grid) {
		this.currentColors.length = 0;
		for(var i = 0; i < this.S.properties.gridSize; i++) {
			if(grid[i][this.hotRow])
				var color = grid[i][this.hotRow].color;
			else 
				var color = '_';
			if(!this.progress[color+i])
				this.progress[color+i] = 0;
			this.currentColors.push(color);
		}
	}
})