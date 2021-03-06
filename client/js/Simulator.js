/* exported Simulator */
/* globals gridPoint */
function Simulator() {
	var status = {
			virus_name: '',
			money: 500000,
			panic: 0,
			gridSize: 5,
			date: new Date(),
			displayData: '',
			pointsToWatch: [],
			iteration: 0,
			get hordeCount() {
				return hordes.length;
			}
		},
		strain,
		interval,
		modules = {},
		strainOptions = [],
		activeModules = {
			infect:[],
			spread:[],
			event:[]
		},
		upgrades = {};

	function Horde(size, location, inherit) {
		if(inherit)
			for (var key in inherit)
				if (inherit.hasOwnProperty(key)) {
					this[key] = inherit[key];
				}

		this.order = this.id = Horde.prototype.id++;
		this.size = size;
		if(this.location !== undefined)
			this.move(location);
		this.renderer = {};
	}
	Horde.prototype = {
		id: 0,
		order: 0,
		size: 0,
		location: null,
		move: function(newLocation) {
			if(this.location) {
				status.pointsToWatch[this.location.id] = true;
				this.location.infected -= this.size;
			}
			status.pointsToWatch[newLocation.id] = true;
			newLocation.infected += this.size;
			this.location = newLocation;
		},
		split: function(amount) {
			var newHorde;
			if(amount > 0 && amount < 1) {
				newHorde = new Horde(this.size * amount, this.location, this);
				this.size = this.size * (1-amount);
				return newHorde;
			} else if(amount >= 1) {
				if(amount >= this.size) {
					amount = this.size;
				}
				newHorde = new Horde(amount, this.location, this);
				this.size = this.size - amount;
				return newHorde;
			}
		}
	};
	if(typeof global !== 'undefined')
	    global.Horde = Horde;

	// Initialize Simulation

	var hordes = [];
	hordes._sizeSort = function (a, b) {
		return b.size - a.size;
	};
	hordes._toAdd = [];
	hordes.total = function() {
		var result = [],
			total = 0;
		for(var i = 0; i < this.length; i++) {
			if(result[this[i].location.id] === undefined)
				result[this[i].location.id] = this[i].size;
			else
				result[this[i].location.id] += this[i].size;
			total += this[i].size;
			this[i].location.infected = result[this[i].location.id];
		}
		return total;
	};
	hordes._push = hordes.push;
	hordes.push = function(size, location, inherit) {
		this._toAdd.push(new Horde(size, location, inherit));
	};
	hordes.addAllNew = function() {
		this.sort(this._sizeSort);
		var n;
		if(this._toAdd.length) {
			// Sort the new hordes biggest to smallest
			this._toAdd.sort(this._sizeSort);
			var newHordes = [];
			while(this.length > 0 || this._toAdd.length > 0) {
				n = newHordes.length;

				// If new hordes list is empty, add the rest of the originals reverse order
				if(!this._toAdd.length)
					newHordes.push(this.pop());
				// If originals hordes list is empty, add the rest of the news reverse order
				else if(!this.length)
					newHordes.push(this._toAdd.pop());
				// Check the last (smallest) horde in the orignals and the news, put the smaller one on first
				else if(this[this.length-1].size < this._toAdd[this._toAdd.length-1].size)
					newHordes.push(this.pop());
				else
					newHordes.push(this._toAdd.pop());

				if(newHordes[n].location.hordes.length > 0)
					newHordes[n].location.hordes.length = 0;
			}
			// Reverse the sorted combined arrays back onto the hordes array
			while(newHordes.length > 0) {
				n = this.length;
				this._push(newHordes.pop());
				this[n].order = n;
				this[n].location.hordes.push(this[n]);
			}
		} else {
			var i;
			for(i = 0, n = this.length; i < n; i++) {
				if(this[i].location.hordes.length > 0)
					this[i].location.hordes.length = 0;				
			}
			for(i = 0, n = this.length; i < n; i++) {
				this[i].location.hordes.push(this[i]);			
			}
		}
	};

	var init = function(UI, loadModules, generatorConfig, generatorData) {
		function Upgrade(options) {
			if(options)
				for (var key in options)
					if(options.hasOwnProperty(key))
						this[key] = options[key];

			this.children = [];
			if(this.gene) {
				this.generateGene(this.gene.size, this.gene.shape, this.gene.color);
			}
		}
		Upgrade.prototype = {
			name:'',
			cost: 0,
			active: false,
			style: {},
			paths:[],
			children: []
		};

		if(typeof global !== 'undefined')
			global.Upgrade = Upgrade;

		// Return an array of gene points
		Upgrade.prototype.generateGene = function(pieceSize, shape) {
			var currPoint = new gridPoint(), topLeft = new gridPoint(), bottomRight = new gridPoint(),
				j,n,direction,rand,
				turn_point = [];

		    currPoint.setCoords(0,0);
		    topLeft.setCoords(0,0);
		    bottomRight.setCoords(0,0);

		    // Generate the tetris shapes based on the options defined in each gene
		    direction = Math.floor(Math.random()*4);
		    var nextDirection = 0;
		    var points = [new gridPoint(currPoint)];

		    // Draw the shape by adding on squares in a snake fashion
		    for(j = 0, n = pieceSize - 1; j < n; j++) {
		        // Change the direction of the "snake" while drawing the piece depending on shape selected
		        switch(shape) {
		            case 'r':
		                if(j === 0)
		                    turn_point = Math.floor(Math.random() * (n-1)) + 1;
		                else if(j == turn_point)
		                    if(Math.random() > 0.5)
		                        direction++;
		                    else
		                        direction--;
		            break;
		            case 'c':
		            case 's':
		                if(j === 0) {
		                    turn_point[0] = Math.floor(Math.random() * (n-3)) + 1;
		                    turn_point[1] = turn_point + Math.floor(Math.random() * (n - turn_point - 2)) + 2;
		                } else if(j == turn_point[0] || j == turn_point[1]) {
		                    if(!nextDirection) {
		                        if(Math.random() > 0.5) {
		                            if(shape == 'c')
		                                nextDirection = 1;
		                            else
		                                nextDirection = -1;
		                            direction++;
		                        } else {
		                            if(shape == 'c')
		                                nextDirection = -1;
		                            else
		                                nextDirection = 1;
		                            direction--;
		                        }
		                    } else {
		                        direction += nextDirection;
		                    }
		                } else if(j > turn_point[1]) {
		                    rand = Math.random();
		                    if(rand < 0.5) {
		                        rand *= 2;
		                        if(rand < 0.5)
		                            direction++;
		                        else
		                            direction--;
		                    }
		                }
		            break;
		        }

		        if(direction < 0)
		            direction = direction+4;
		        if(direction > 3)
		            direction = direction%4;

		        currPoint.addCoords(currPoint.directions[direction].x, currPoint.directions[direction].y);

		        if(topLeft.x > currPoint.x)
		            topLeft.x = currPoint.x;
		        if(topLeft.y > currPoint.y)
		            topLeft.y = currPoint.y;
		        if(bottomRight.x < currPoint.x)
		            bottomRight.x = currPoint.x;
		        if(bottomRight.y < currPoint.y)
		            bottomRight.y = currPoint.y;

		        points.push(new gridPoint(currPoint));
		    }

		    // Translate the gene so top leftmost part is always 0,0
			for(j = 0; j < points.length; j++) {
				points[j].addCoords(topLeft.x*-1, topLeft.y*-1);
			}

		    this.gene.shape = points;
		    this.gene.height = bottomRight.y - topLeft.y + 1;
		    this.gene.width = bottomRight.x - topLeft.x + 1;
		    this.gene.placement = new gridPoint();
		};

		Upgrade.prototype.set = function(property,value) {
			this[property] = value;
			UI.evolutions.set(this.id,property,value);
		};

		Upgrade.prototype.purchase = function() {
			this.active = true;
			// If there is no gene, run the process.
			if(typeof this.onUpgrade === 'function') {
				this.onUpgrade.call(this.module);
			}
		};
		Upgrade.prototype.resetGene = function() {
			if(this.gene && this.gene.active) {
				delete this.gene.active;
				delete this.gene.placement;
				this.gene.placement = new gridPoint();
			}
		};
		Upgrade.prototype.activateGene = function(x,y) {
			if(this.gene && this.active) {
				this.gene.active = true;
				this.gene.position = new gridPoint().setCoords(x,y);
				if(typeof this.onGeneActivate === 'function') {
					this.module._applyChangesToBase = false;
					this.onGeneActivate.call(this.module);
					delete this.module._applyChangesToBase;
				}
				return true;
			}
			return false;
		};

		var points =  generatorData.points,
			countries = generatorData.countries,
			config = generatorConfig;

		status.date.setTime(1577880000000); // Jan 1st, 2030

		var addUpgrades = function(module) {
				var levels = [],
					autoIdIndex = 0,
					n = arguments.length;

				// If an upgrade got added with id assuming only one upgrade, fix it now.
				if(upgrades[module.id] !== undefined) {
					upgrades[module.id + '_0'] = upgrades[module.id];
					delete upgrades[module.id];
				}

				for (var i = 1; i < n; i++) {
					var currentLevel = arguments[i];
					levels.push(currentLevel);

					if(!currentLevel.id) {
						// Find out what index this is
						while(upgrades[module.id + '_' + autoIdIndex] !== undefined) {
							autoIdIndex++;
						}

						if(n == 2)
							currentLevel.id = module.id;
						else
							currentLevel.id = module.id + '_' + autoIdIndex;
					}

					upgrades[currentLevel.id] = new Upgrade(currentLevel);
					upgrades[currentLevel.id].module = module;
					upgrades[currentLevel.id].level = currentLevel;

					var idParts = module.id.split('.');
					if(idParts.length > 1)  {
						idParts.pop();
						currentLevel.resourcePath = idParts.join('/');
					}

					delete currentLevel.onUpgrade;
			    }
			    // send all the levels to the UI
			    UI.evolutions.addNew(module.id,levels);

			    return upgrades;
			},

			// Returns false if selected upgrades are invalid.
			// Returns an array of purchasable upgrades is selected upgrades are valid.
			availableUpgrades = function(selectedUpgrades) {
				var totalCost = 0, available = [],
					validPath,upgrade,
					i,j,k;

				for(i = 0; i < selectedUpgrades.length; i++) {
					upgrade = upgrades[selectedUpgrades[i]];
					// If the upgrade is already active, then you can't activate it again
					if(upgrade.active)
						return false;
					if(upgrade.cost < 0)
						return false;

					totalCost += upgrade.cost;
					validPath = false;
					for(j = 0; j < upgrade.paths.length && !validPath; j++) {
						// If one of the paths to the upgrade is activated, the path is valid
						if(upgrade.paths[j].active)
							validPath = true;

						if(!validPath)
						// If one of the paths to the upgrade is selected (but not yet activated), the path is valid
							for(k = 0; k < selectedUpgrades.length; k++) {
								if(selectedUpgrades[k] == upgrade.paths[j].id)
									validPath = true;
							}
					}
					if(!validPath)
						return false;
				}
				if (status.money < totalCost)
					return false;

				// Selected upgrades are valid, now return which ones are selectable
				for (var key in upgrades)
					if (upgrades.hasOwnProperty(key)) {
						upgrade = upgrades[key];
						if(upgrade.active)
							for(j = 0; j < upgrade.children.length; j++) {
								if(upgrade.children[j].cost >= 0 && status.money >= totalCost + upgrade.children[j].cost)
									available.push(upgrade.children[j].id);
							}
					}

				for(i = 0; i < selectedUpgrades.length; i++) {
					upgrade = upgrades[selectedUpgrades[i]];
					for(j = 0; j < upgrade.children.length; j++) {
						if(upgrade.children[j].cost >= 0 && status.money >= totalCost + upgrade.children[j].cost)
							available.push(upgrade.children[j].id);
					}
				}
				return available;
			},

			purchaseUpgrades = function(selectedUpgrades) {
				var upgrade;
				if(!availableUpgrades(selectedUpgrades))
					return false;
				else
					while(selectedUpgrades.length) {
						upgrade = upgrades[selectedUpgrades.pop()];
						status.money -= upgrade.cost;
						upgrade.purchase();
					}

				return true;
			},

			purchaseMutation = function(mutations) {
				var mutation,upgrade;
				var totalCost = 0;

				var grid = [];
			    // Create the grid storage object for keeping track of each gene location
				while(grid.length < status.gridSize) {
					grid.push([]);
				}

				// Check the grid placements and costs of modules to make sure this is a valid upgrade. 
				// Don't charge for unmoved genes
				for(var i = 0; i < mutations.length; i++) {
					upgrade = upgrades[mutations[i].upgrade];
					if(!upgrade.gene.placement.equals(mutations[i].placement))
						totalCost += upgrade.cost;
					if(!upgrade.active)
						return false;
					for(var j = 0; j < upgrade.gene.shape.length; j++) {
						if(grid[mutations[i].placement.x + upgrade.gene.shape[j].x][mutations[i].placement.y + upgrade.gene.shape[j].y])
							return false;
						else
							grid[mutations[i].placement.x + upgrade.gene.shape[j].x][mutations[i].placement.y + upgrade.gene.shape[j].y] = upgrade.gene;
					}
				}
				if(totalCost > status.money)
					return false;

				// Reset the last mutations to prep modules for new mutation.
				for (var key in upgrades)
					if (upgrades.hasOwnProperty(key))
						upgrades[key].resetGene();
				for (key in modules)
					if (modules.hasOwnProperty(key))
						modules[key].reset();

				// Sort the upgrades so that lower level ones go in first, improving consistency for the modules.
				mutations.sort(function (a,b) {
					return upgrades[a.upgrade].level - upgrades[b.upgrade].level;
				});

				// Activate the new mutations
				while(mutations.length) {
					mutation = mutations.pop();
					upgrades[mutation.upgrade].activateGene(mutation.placement.x,mutation.placement.y);
				}

				// Run any onMutationChange functions in the modules
				for(var id in modules)
					if (modules.hasOwnProperty(id))
						if(modules[id].onMutationChange !== undefined)
							modules[id].onMutationChange(grid);

				return true;
			},

			tick_begin = function(options) {
				var simplifyCof = 1;
				for(var i = 0, n = hordes.length; i < n; i += simplifyCof) {
					// Don't process every horde every turn. Smaller hordes can be skipped the majority of turns 
					if(i > 0 && i % options.simplifyAt < simplifyCof) {
						i = simplifyCof * options.simplifyAt;
						simplifyCof++;
						i += status.iteration % simplifyCof;
						if(i >= n)
							break;
					}
					var current = hordes[i];

					// If current horde is empty, remove it from the simulation
					if(current.size < 1) {
						UI.renderer.updateHorde('basic', current, true);
						current = hordes[i] = hordes.pop(); // don't use splice here, very expensive for huge array. Just swap element to remove with last.
						n--;
					}

					var target,
						currentLocation = current.location,
						rand = Math.random();

					status.pointsToWatch[currentLocation.id] = true;

					if(current.passData) {
						current.passData.rand = Math.random();
						current.passData.randNorm = (Math.random()*2 + (Math.random()*10%1)*2 + (Math.random()*100%1)*2) / 3 - 1;
					}
					else {
						current.passData = {
							rand: Math.random(),
							randNorm: (Math.random()*2 + (Math.random()*10%1)*2 + (Math.random()*100%1)*2) / 3 - 1
						};
					}

					if(rand > 0.5) {
						target = currentLocation;
					}
					else {
						rand *= 2;
						target = currentLocation.angularDirection(rand);
					}

					status.pointsToWatch[target.id] = true;

					if(debugMenu.active)
						debugMenu.console.updateTarget(current, target);

					current.passData.target = target;
				}
			},

			tick_hordes = function(process, moduleName, options) {
				var simplifyCof = 1;
				for(var i = 0, n = hordes.length; i < n; i += simplifyCof) {
					// Don't process every horde every turn. Smaller hordes can be skipped the majority of turns 
					if(i > 0 && i % options.simplifyAt < simplifyCof) {
						i = simplifyCof * options.simplifyAt;
						simplifyCof++;
						i += status.iteration % simplifyCof;
						if(i >= n)
							break;
					}
					var current = hordes[i];
					var result = process(current, current.passData, simplifyCof);

					if(debugMenu.active && options.reportPassData)
						debugMenu.console.reportModule(current, moduleName, current.passData);
					else
						debugMenu.console.reportOutput(current, moduleName, result);
				}
			},

			tick_activePoints = function(process) {
				for (var point in status.pointsToWatch) {
					// If item is array index
					if (String(point >>> 0) == point && point >>> 0 != 0xffffffff) {
						process(points[point]);
					}
				}
			},

			tick = function() {
				status.date.setTime(1577880000000 + 86400000*status.iteration);

				var i,
					options = {
						simplifyAt: 2000,
						reportPassData: false
					};
				if(strain !== null) {
					var updatedStatus = UI.updateUI();
					for (var key in updatedStatus)
						if (updatedStatus.hasOwnProperty(key))
							status[key] = updatedStatus[key];

					if(debugMenu.active) {
						debugMenu.console.initTick();
						
						if(debugMenu.console.options.profileTick)
							console.profile('Tick ' + status.iteration);
						console.time('tickTime');
					}

					tick_begin(options);

					if(strain.onTick)
						strain.onTick(status.iteration);
					for(i = 0; i < activeModules.infect.length; i++)
						if(activeModules.infect[i].onTick)
							activeModules.infect[i].onTick(status.iteration);
					for(i = 0; i < activeModules.spread.length; i++)
						if(activeModules.spread[i].onTick)
							activeModules.spread[i].onTick(status.iteration);
					for(i = 0; i < activeModules.event.length; i++)
						if(activeModules.event[i].onTick)
							activeModules.event[i].onTick(status.iteration);

					tick_hordes(strain.process, strain.id, options);

					options.reportPassData = true;
					for(i = 0; i < activeModules.infect.length; i++) {
						tick_hordes(activeModules.infect[i].process, activeModules.infect[i].id, options);
					}
					options.reportPassData = false;

					tick_hordes(function(current) {
						if(!current.renderer.cacheLat || current.renderer.cacheLat != current.location.lat || current.renderer.cacheLng != current.location.lng) {
							UI.renderer.updateHorde('basic', current);
							current.renderer.cacheLat = current.location.lat;
							current.renderer.cacheLng = current.location.lng;
						}
					}, 'system', options);
					

					for(i = 0; i < activeModules.spread.length; i++) {
						tick_activePoints(activeModules.spread[i].process);
					}

					if(debugMenu.active) {
						console.timeEnd('tickTime');
						if(debugMenu.console.options.profileTick) {
							console.profileEnd();
							debugMenu.console.disableProfileTick();
						}
					}

					// Run event modules once
					for(i = 0; i < activeModules.event.length; i++) {
						if(debugMenu.active)
							debugMenu.console.reportOutput(null, activeModules.event[i].id, activeModules.event[i].process());
						else
							activeModules.event[i].process();
					}

					// Update all the points in the renderer that may have been affected 
					// Iterate over the sparse array
					var changedPoints = [];
					if(status.displayData !== '') {
						if(status.updateAllPoints) {
							status.pointsToWatch = points.slice(0);
							delete status.updateAllPoints;
						}
						tick_activePoints(function(point) {
							changedPoints.push([point.id, point[status.displayData] / config.maximums[status.displayData]]);
						});
						UI.renderer.updateVisual(changedPoints);
					}
					status.pointsToWatch.length = 0;
					UI.updateUI(status);

					hordes.addAllNew();

					if(status.paused || (debugMenu.active && debugMenu.console.options.manualTicks)) {
						if(interval) {
							clearInterval(interval);
							interval = false;
						}
					} else {
						if(!interval)
							interval = setInterval( function() { tick.call(this); } , 500);
					}
					if(debugMenu.active)
						debugMenu.console.newTick();

					status.iteration++;
				}
			},

			getPointProperties = function(lat, lng) {
				return points[Math.floor(lng) + (90 - Math.ceil(lat)) * config.w];
			};

		var public = {
			// true public functions, will need worker messages
			config: config,
			purchaseMutation: purchaseMutation,
			availableUpgrades: availableUpgrades,
			purchaseUpgrades: purchaseUpgrades,
			getPointProperties: getPointProperties,
			pause: function() {
				status.paused = true;
			},
			unPause: function() {
				status.paused = false;
				tick();
			},
			moduleFunction: function(moduleId, functionName, parameters) {
				 return modules[moduleId][functionName].apply(modules[moduleId],parameters);
			},
			start: function(strainId) {
				// Add all the modules specified in the contruction of the Simulator

				modules[strainId].activate();

				for(var i = 0; i < strainOptions.length; i++) {
					if(strainOptions[i].id !== strainId)
						delete modules[strainOptions[i].id];
				}

				Math.seedrandom(); // Before we start the simulation, generate a new random seed so the game itself is unpredictable with respect to the land generation.

				var startSq = strain.startSimulation(points);

				// Sort out the children for the upgrades, convert string pointers to related upgrades to actual pointers.
				for (var key in upgrades) {
					var pathPointers = [],
						current;
					if (upgrades.hasOwnProperty(key)) {
						current = upgrades[key];
						for(i = 0; i < current.paths.length; i++) {
							if(upgrades[current.paths[i]] !== undefined) {
								upgrades[current.paths[i]].children.push(current);
								pathPointers.push(upgrades[current.paths[i]]);
							}
						}
						delete current.paths;
						current.paths = pathPointers;
					}
				}
				upgrades[strain.id].set('active',true);

				// Initialize all the other modules
				for(var id in modules)
					if(modules[id].onStart)
						modules[id].onStart(startSq);

				UI.renderer.lookAt(startSq);

				status.displayData = 'total_pop';
				status.updateAllPoints = true;

				if(debugMenu.active)
					debugMenu.console.newTick();

				tick();

				delete public.start;
			},
			end: function(state) {
				clearInterval(interval);
				switch(state) {
					case 'win':
						UI.alert('win_message');
						break;
					case 'lose':
						UI.alert('lose_message');
						break;
				}
			},
			setName: function (name) {
				status.virus_name = name;
			},
			getStrainOptions: function() {
				return strainOptions;
			},
			getAllPointProperty: function(property) {
				var result = [];
				for(var i = 0, n = points.length; i < n; i++) {
					if(points[i][property] === undefined)
						result[i] = 0;
					else
						result[i] = points[i][property];
				}
				return result;
			}
		};

		Module.prototype.S = $.extend({
			hordes: hordes,
			addUpgrades: addUpgrades,
			modules: modules,
			status: status,
			countries: countries,
			UILink: {
				trigger: function(eventId, parameters) {
					UI.trigger(eventId, parameters);
				},
				rendererDecal: function(id, lat, lng, size, texture) {
					UI.renderer.decal(id, lat, lng, size, texture);
				},
				rendererCircle: function(id, lat, lng, radius, color, thickness) {
					UI.renderer.drawCircle(id, lat, lng, radius, color, thickness);
				},
				rendererRemoveDecal: function(id) {
					UI.renderer.removeDecal(id);
				},
				addNews: function(message, replacements) {
					UI.addNews(message, replacements);
				},
				updateHorde: function(textureId, horde, remove) {
					UI.renderer.updateHorde(textureId, horde, remove);
				},
				addNewHordeType: function(textureId, count, options) {
					UI.renderer.addNewHordeType(textureId, count, options);
				}
			}
		}, public);
		if(debugMenu.active)
			debugMenu.setSimulator($.extend({
				points: points,
				hordes: hordes,
				tick: tick,
				status: status,
			}, public));

		var initModules = {};
		var recusiveInitModules = function(moduleId) {
			if(!initModules[moduleId]) {
				initModules[moduleId] = true;
				var module = modules[moduleId];

				for(var i = 0, n = module.dependencies.length; i < n; i++)
					recusiveInitModules(module.dependencies[i]);

				if(module.ui)
					module.ui.call(module, UI);

				if(module.init)
					module.init(points);

				for(i = 0, n = module.children.length; i < n; i++)
					recusiveInitModules(module.children[i]);

				if(module.alwaysActive)
					module.activate();
			}
		};

		for (var moduleId in modules)
			if (modules.hasOwnProperty(moduleId))
				recusiveInitModules(moduleId);

		return public;
	};

	function Module(type,processFunction,options) {
		this.type = type;
		if(this.type !== 'helper')
			this.process = processFunction.bind(this);
		if(options !== undefined)
			for (var key in options)
				if (options.hasOwnProperty(key)) {
					if(typeof(options[key]) === 'function')
						options[key].bind(this);
					this[key] = options[key];
				}
	}


	Module.prototype = {
		id: '',
		type: 'infect',
		alwaysActive: false,
		runtime: 10, // Smaller numbers run sooner
		dependencies: [],
		children: [],

		init: false,
		onStart: false,
		onActivate: false,
		onDeactivate: false,
		onTick: false,
		_applyChangesToBase: true,

		process: function() { return 0; },
		isActive: function() {
			return this.activeId !== undefined;
		},
		activate: function() {
			var i;
			if(!this.isActive() && this.type !== 'helper') {
				// Also activate this module's dependencies
				if(this.dependencies.length > 0)
					for(i = 0; i < this.dependencies.length; i++)
						modules[this.dependencies[i]].activate();

				// If module is a strain, set it as the Simulator's strain function. Never will need to be removed, just potentially overwritten.
				if(this.type == 'strain') {
					this.activeId = 0;
					strain = this;
				}
				// Otherwise, just add it to the relavant function array
				else {
					for(i = activeModules[this.type].length; !this.isActive(); i--) {
						if(i === 0 || activeModules[this.type][i-1].runtime < this.runtime) {
							activeModules[this.type][i] = this;
							this.activeId = i;
						} else {
							activeModules[this.type][i] = activeModules[this.type][i-1];
							activeModules[this.type][i].activeId = i;
						}
					}
					if(this.onActivate)
						this.onActivate();
				}

				// Also activate this module's children
				if(this.children.length > 0)
					for(i = 0; i < this.children.length; i++)
						modules[this.children[i]].activate();
			}
		},

		deactivate: function(id) {
			var i,removeModule = modules[id];
			if(removeModule !== undefined && removeModule.isActive() && !removeModule.alwaysActive && removeModule.type !== 'strain') {
				// Also deactivate this module's children
				if(removeModule.children.length > 0)
					for(i = 0; i < removeModule.children.length; i++)
						modules[this.children[i]].deactivate();

				// Run the ondeactivate function
				if(removeModule.onDeactivate)
					removeModule.onDeactivate();

				// Replace this module with the next in line and shift all subsequent modules down the queue
				for(i = removeModule.activeId; i < activeModules[removeModule.type].length - 1; i++) {
					activeModules[removeModule.type][i] = activeModules[removeModule.type][i+1];
					activeModules[removeModule.type][i].activeId = i;
				}
				activeModules[removeModule.type].length--;
				delete removeModule.activeId;
			}
		},
			
		reset: function() {
			if(this.defaults) {
				for (var key in this.defaults)
					if(this.defaults.hasOwnProperty(key))
						this[key] = this.defaults[key];
			}
		},
		val: function(name, newval, operation) {
			/* jshint -W087 */
			var apply = function(pointer) {
				switch(operation) {
					case '+':
						pointer[name] += newval;
						break;
					case '-':
						pointer[name] -= newval;
						break;
					case '*':
						pointer[name] *= newval;
						break;
					case '/':
						pointer[name] /= newval;
						break;
					case '^':
						pointer[name] = Math.pow(pointer[name],newval);
						break;
					case 'append':
						if(pointer[name] === undefined)
							pointer[name] = [newval];
						else
							pointer[name].push(newval);
						break;
					default: 
						pointer[name] = newval;
				}
			};

			if(newval === undefined)
				return this[name];
			else {
				// Gene upgrades should store a default value to it gcan be reverted when the gene is removed. 
				if(!this.defaults)
					this.defaults = {};
				if(this.defaults[name] === undefined && typeof this[name] === 'number') 
					this.defaults[name] = this[name];

				// Make sure geneless upgrades actually change the default value as well so they are permanant.
				if(this._applyChangesToBase)
					apply(this.defaults);

				apply(this);
			}
		}
	};

	return {
		addModule: function(id, loaded) {
			if(!modules[id]) {
				modules[id] = new Module(loaded.type,loaded.run,loaded.options);
				modules[id].id = id;
				if(modules[id].type === 'strain') {
					strainOptions.push(modules[id]);
				}
			}
		},
		init: init
	};
}