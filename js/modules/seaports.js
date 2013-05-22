/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
new Module('event', function() {
	var interval,i,strength = {};

	// Check the ships that are currently moving
	for(i = 0; i < this.ships.length; i++) {
		this.ships[i].timeLeft--;
		// If ship is still progressing, increment timers
		if(this.ships[i].timeLeft > 0) {
			this.ships[i].progressBar.val((this.ships[i].travelTime - this.ships[i].timeLeft)/this.ships[i].travelTime);
		// If ship reached destination, try and add a zombie and then clean up
		} else {
			if(this.ships[i].from.infected) {
				var rand = Math.random();
				var transferCount = Math.floor(Math.abs((rand*2 + (rand*10%1)*2 + (rand*100%1)*2 - 3)*(this.ships[i].from.infected/4)));
				if(transferCount > 0 && !this.ships[i].to.active) {
					this.S.activePoints.push(this.ships[i].to);
					this.ships[i].to.active = true;
				}
				if(transferCount > this.ships[i].from.infected)
					transferCount = this.ships[i].from.infected;
				
				this.ships[i].to.infected += transferCount;
				this.ships[i].from.infected -= transferCount;
				/*
				strength.infect = 0;
				for(j = 0; j < this.S.activeModules.infect.length; j++)
					this.S.activeModules.infect[j].process(this.ships[i].from,this.ships[i].to,strength);
				this.S.strain.process(this.ships[i].from,this.ships[i].to,strength,Math.random());
				*/
			}
			this.ships[i].progressBar.val(this.getShipDate(this.S.date,this.ships[i].interval));
			this.ships[i].timeLeft = -1;
			this.intervalSortInsert(this.ships[i],this.S.iteration);
			this.ships.splice(i,1);
		}
	}

	// Check the ships that haven't departed yet
	for (var key in this.intervals)
		if (this.intervals.hasOwnProperty(key)) {
			interval = parseInt(key.substring(3));
			// If turn number is divisible by the interval number, send a boat
			if((this.S.iteration + 1) % (interval) == 0) {
				for(i = 0; i < this.intervals[key].length; i++) {
					this.intervals[key][i].timeLeft = this.intervals[key][i].travelTime;
					this.intervals[key][i].progressBar.val(0);
					this.ships.push(this.intervals[key][i]);
				}
			}
		}
},{
	init: function() {
		var i,j,a,b,ab,interval,phi,theta,phix,phiy,hyp,distance,progressBar;
		this.intervalList = [];
		this.intervals = {};
		this.ships = [];

		// Function to return a text-formatted date that is a specified number of days (turns) in the future.
		this.getShipDate = function(date,interval) {
			date.setDate(date.getDate()+interval);
			var dateString = date.getMonthName() + ' ' + date.getDate() + ', ' + date.getFullYear();
			date.setDate(date.getDate()-interval);
			return 'Departs ' + dateString;
		}

		// Function to sort the array of ship objects so that they may be displayed in the correct order.
		this.intervalSortInsert = function(shipObject,iteration) {
			// Clear the last position of the ship
			if(shipObject.order)
				this.intervalList.splice(shipObject.order,1);

			// Calculate how many turns are left before the ship sails and sort with that
			var turnsLeft = shipObject.interval - iteration % shipObject.interval,
				inserted = false;

    		for(var i = 0; i < this.intervalList.length; i++) {
				if(!inserted && this.intervalList[i].timeLeft == -1 && turnsLeft < this.intervalList[i].interval - iteration % this.intervalList[i].interval) {
					// Position the ship object right before the first element that is leaving later than it that isn't sailing to a destination.
					this.intervalList[i].progressBar.element.parent().before(shipObject.progressBar.element.parent());
					this.intervalList.splice(i,0,shipObject);
					inserted = true;
				}
				// Store the order of every ship object so they can be found in the array later.
				this.intervalList[i].order = i;
    		}

    		// If the ship sails after every other ship, place it on the end.
    		if(!inserted) {
				shipObject.order = this.intervalList.length;
				this.shippingMenu.element.append(shipObject.progressBar.element.parent());
				this.intervalList.push(shipObject);	  			
    		}
		}

		this.displayArc = function(event) {
        	event.data.R.displayArc(event.data.point1,event.data.point2);
        }

		// Shipping Schedule display button.
        this.shippingMenu = this.S.UI.interfaceParts.monitor_view.addDataField('div',{
        	title: 'Shipping Schedule',
        	class: 'shipping',
        	visible: false
        });
        var Renderer = this.S.Renderer;
        this.S.UI.interfaceParts.monitor_control.addDataField('button',{ 
        		onClick: function() {
        			if(!this.opens[0].visible) 
            			this.opens[0].display();             				
        			else {
        				this.opens[0].hide();
        				Renderer.hideArc();
        			}
        		},
        		opens: [this.shippingMenu] 
        	}).val('Shipping Schedule');

		for(i = 1; i < this.S.countries.length; i++) {
			//run once for every square, if the square is a capitol, then calculate frequency between it and all other cities
			a = this.S.countries[i].capitol;
			if(a.coast_distance == 1)
				for(j = 1; j < this.S.countries.length; j++) {
					b = this.S.countries[j].capitol;
					// For each country capitol, link it to every other capitol that is coastal
					if(a.id != b.id && b.coast_distance == 1) {
						// Calculate how the time between ships based on city size
						ab = b.total_pop*0.7 + a.total_pop*0.3;

						interval = Math.floor(2000 - 1960*(Math.log(ab)/Math.log(this.S.config.max_pop))); // number of intervals between freighters ranges up from 40 days
						if(interval < 700) { // If ships sail less than once every two years, might as well not bother.
							// get distance between the two ports to estimate the ship sailing time
							phi = (a.lat - b.lat)/180*Math.PI;
							theta = (a.lng - b.lng)/180*Math.PI;
							phix = a.lat/180*Math.PI;
							phiy = b.lat/180*Math.PI;
							hyp = (Math.sin(phi/2) * Math.sin(phi/2) +
							    Math.sin(theta/2) * Math.sin(theta/2) * Math.cos(phix) * Math.cos(phiy)); 
							distance = Math.round(2 * Math.atan2(Math.sqrt(hyp), Math.sqrt(1-hyp)) * 40); // ~40 days to get to the other side of the world?

							// Make progress bar for shipping route and add it to the intervals object
							progressBar = this.shippingMenu.addDataField('progressBar',{title: this.S.countries[i].name+' to '+this.S.countries[j].name, width: 186});
							progressBar.element.parent().on('mouseover.showRoute',{R: this.S.Renderer, point1: a, point2: b}, this.displayArc);
							progressBar.val(this.getShipDate(this.S.date,interval));
							if(!this.intervals['int'+interval])
								this.intervals['int'+interval] = [];
							this.intervals['int'+interval].unshift({from:a,to:b,progressBar:progressBar,travelTime:distance,interval:interval,timeLeft:-1});

							// Sort the progress bars based on how soon the ships will depart and arrive
							this.intervalSortInsert(this.intervals['int'+interval][0],1);
						}
					}
				}
		}
	},
	alwaysActive: true
})