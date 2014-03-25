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
	this.S.UI.updateEvolution(this.id,property,value);
};

Upgrade.prototype.purchase = function() {
	this.active = true;
	// If there is no gene, run the process.
	if(!this.gene) {
		this.onUpgrade();
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
		this.onUpgrade();
		return true;
	}
	return false;
};
Upgrade.prototype.val = function(val, newval, operation) {
	if(!operation)
		operation = '';
	this.module.val(val, newval, operation, this);
};
Upgrade.prototype.activate = function() {
	if(!this.module.isActive())
		this.module.S.addActive(this.module.id);
};

function gridPoint(clone) {
    if(clone) {
        this.x = clone.x;
        this.y = clone.y;
    }
    return this;
}
gridPoint.prototype = {
    x: null,
    y: null,
    directions: [{y:-1,x:0},{y:0,x:-1},{y:1,x:0},{y:0,x:1}]
};
gridPoint.prototype.setCoords = function(x,y) {
    this.x = x;
    this.y = y;
};
gridPoint.prototype.addCoords = function(x,y) {
    this.x += x;
    this.y += y;
};
gridPoint.prototype.equals = function(gridpoint) {
    return this.x == gridpoint.x && this.y == gridpoint.y;
};

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
	pointsToWatch: null,
	move: function(newLocation) {
		if(this.location) {
			this.pointsToWatch[this.location.id] = true;
			this.location.infected -= this.size;
		}
		this.pointsToWatch[newLocation.id] = true;
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

function Simulator(R, UI, generatorConfig, generatorData) {
	// Game and virus properties!
	this.properties = {
		virus_name: '',
		money: 500000,
		panic: 0,
		gridSize: 5
	};
	this.modules = {};
	this.strainOptions = [];
	this.activeModules = {infect:[],spread:[],event:[]};
	this.iteration = 0;
	this.date = new Date();
	this.date.setTime(1577880000000); // Jan 1st, 2030
	this.UIData = {};
	this.upgrades = {};

	// Pre-generate some values for the simulation so they only have to be calculated once
	this.bakedValues = {};
	this.bakedValues.latDistances = [];
	this.bakedValues.latCumChance = [];
	var getGridDistance = function (lat,latdelta,lngdelta) {
		var phi = latdelta/180*Math.PI,
			theta = lngdelta/180*Math.PI,
			phix = lat/180*Math.PI,
			phiy = (lat+latdelta)/180*Math.PI;
		
		var a = (Math.sin(phi/2) * Math.sin(phi/2) +
			Math.sin(theta/2) * Math.sin(theta/2) * Math.cos(phix) * Math.cos(phiy));
		return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6378; // rough estimate of the radius of the earth in km (6378.1)
	};

	var i,j,n;

	for (i = 0; i < 90; i++) {
		// directly adjacent points clockwise from top, then diagonal points clockwise from top right.
		this.bakedValues.latDistances.push([
			getGridDistance(i+0.5,-1, 0),
			getGridDistance(i+0.5, 0, 1),
			getGridDistance(i+0.5, 1, 0),
			getGridDistance(i+0.5, 0,-1),
			getGridDistance(i+0.5,-1, 1),
			getGridDistance(i+0.5, 1, 1),
			getGridDistance(i+0.5, 1,-1),
			getGridDistance(i+0.5,-1,-1)
		]);
		var total_dists = 0;
		for(j = 0; j < 8; j++) {
			total_dists += 1/this.bakedValues.latDistances[i][j];
		}
		this.bakedValues.latCumChance.push([
			1/this.bakedValues.latDistances[i][0]/total_dists,
			1/this.bakedValues.latDistances[i][1]/total_dists,
			1/this.bakedValues.latDistances[i][2]/total_dists,
			1/this.bakedValues.latDistances[i][3]/total_dists,
			1/this.bakedValues.latDistances[i][4]/total_dists,
			1/this.bakedValues.latDistances[i][5]/total_dists,
			1/this.bakedValues.latDistances[i][6]/total_dists,
			1/this.bakedValues.latDistances[i][7]/total_dists
		]);
		for(j = 1; j < 8; j++) {
			this.bakedValues.latCumChance[i][j] += this.bakedValues.latCumChance[i][j-1];
		}
	}

	if(this.points === undefined) {
		if(R !== undefined) {
			Simulator.prototype.points = generatorData.points;
			Simulator.prototype.countries = generatorData.countries;
			Simulator.prototype.config = generatorConfig;
			Simulator.prototype.R = R;
			Simulator.prototype.UI = UI;
			Simulator.prototype.populatedPoints = [];
			Module.prototype.S = this;
			Upgrade.prototype.S = this;

			for(i = 0, n = this.points.length; i < n; i++)
				if(this.points[i].total_pop > 0)
					Simulator.prototype.populatedPoints.push(this.points[i]);
		}
		else {
			console.error('First Simulator Object must have initialized generator, renderer and ui classes linked as parameters.');
			return false;
		}
	}

	this.pointsToWatch = [];

	Horde.prototype.pointsToWatch = this.pointsToWatch;
	this.hordes = [];
	this.hordes.sizeSort = function (a, b) {
		return b.size - a.size;
	};
	this.hordes.toAdd = [];
	this.hordes.total = function() {
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
	this.hordes.sortPush = function(horde) {
		this.toAdd.push(horde);
	};
	this.hordes.addAllNew = function() {
		if(this.toAdd.length) {
			// Sort the new hordes biggest to smallest
			this.toAdd.sort(this.sizeSort);
			this.sort(this.sizeSort);
			var n, newHordes = [];
			while(this.length > 0 || this.toAdd.length > 0) {
				n = newHordes.length;

				// If new hordes list is empty, add the rest of the originals reverse order
				if(!this.toAdd.length)
					newHordes.push(this.pop());
				// If originals hordes list is empty, add the rest of the news reverse order
				else if(!this.length)
					newHordes.push(this.toAdd.pop());
				// Check the last (smallest) horde in the orignals and the news, put the smaller one on first
				else if(this[this.length-1].size < this.toAdd[this.toAdd.length-1].size)
					newHordes.push(this.pop());
				else
					newHordes.push(this.toAdd.pop());

				if(newHordes[n].location.hordes.length > 0)
					newHordes[n].location.hordes.length = 0;
			}
			// Reverse the sorted combined arrays back onto the hordes array
			while(newHordes.length > 0) {
				n = this.length;
				this.push(newHordes.pop());
				this[n].order = n;
				this[n].location.hordes.push(this[n]);
			}
		}
	};

	// Load specified modules
	// if running in node, grab the modules automagically
	if(typeof require === 'function') {
		for(i = 0; i < this.loadModules.length; i++)
			this.addModule(this.loadModules[i],'node');
    // if doing PHP loading, run the provided function
	} else if(typeof this.loadModules === 'function') {
		this.loadModules();
    } else {
		console.error('Unable to load modules');
    }
}
Simulator.prototype = {
	modules: null,
	strain:  null,
	division: 1,
	iteration: 0,
	paused: false,
	startPoint: null,
	properties: {},
	interval: null,
	loadModules: null,
	setName: function (name) {
		this.properties.virus_name = name;
	},
	getStrainOptions: function() {
		return this.strainOptions;
	}
};

Simulator.prototype.start = function(strainId) {
	// Add all the modules specified in the contruction of the Simulator

	this.addActive(strainId);

	for(var i = 0; i < this.strainOptions.length; i++) {
		if(this.strainOptions[i].id !== strainId)
			delete this.modules[this.strainOptions[i].id];
	}
	delete this.strainOptions;
	delete this.loadModules;

	Math.seedrandom(); // Before we start the simulation, generate a new random seed so the game itself is unpredictable with respect to the land generation.

	var that = this;
	this.strain.onStart(function(startSq) {
		// Sort out the children for the upgrades, convert string pointers to related upgrades to actual pointers.
		for (var key in that.upgrades) {
			var pathPointers = [],
				current;
			if (that.upgrades.hasOwnProperty(key)) {
				current = that.upgrades[key];
				for(var i = 0; i < current.paths.length; i++) {
					if(that.upgrades[current.paths[i]] !== undefined) {
						that.upgrades[current.paths[i]].children.push(current);
						pathPointers.push(that.upgrades[current.paths[i]]);
					}
				}
				delete current.paths;
				current.paths = pathPointers;
			}
		}
		that.upgrades[that.strain.id].set('active',true);

		// Initialize all the other modules
		for(var id in that.modules)
			if(that.modules[id].onStart !== undefined && that.modules[id].type != 'strain')
				that.modules[id].onStart(startSq);

		that.R.lookAt(startSq);

		if(debugMenu.active) {
			debugMenu.setSimulator(that).newTick();
		}

		that.tick();
	});
};

Simulator.prototype.end = function(state) {
	clearInterval(this.interval);
	switch(state) {
		case 'win':
			this.UI.alert('win_message');
			break;
		case 'lose':
			this.UI.alert('lose_message');
			break;
	}
};

Simulator.prototype.addModule = function(id,moduleArray) {
	var i,n,newModule;

	// dot in id name symbolizes subdirectory
	var idParts = id.split('.');
	if(!this.modules[id]) {
		if(moduleArray === 'node') {
			var path = './js/modules/'+idParts.join('/')+'.js',
				//fileStats = fs.lstat(path),
				loaded;

			try {
				loaded = require(path);
			}
			catch(err) {
				if(err.code == 'MODULE_NOT_FOUND')
					console.error('Module ' + id + ' not found. Looked in ' + path);
				else
					console.error(err);
			}
			finally {
				newModule = new Module(loaded.type,loaded.run,loaded.options);
			}
		} else {
			newModule = moduleArray[id];
		}

		if(newModule !== undefined) {
			// Add dependencies recursively
			for(i = 0, n = newModule.dependencies.length; i < n; i++)
				this.addModule(newModule.dependencies[i],moduleArray);

			// Make sure this module wasn't added somewhere in its dependencies
			if(!this.modules[id]) {
				newModule.id = id;
				this.modules[id] = newModule;
				if(newModule.type === 'strain') {
					this.strainOptions.push(newModule);
				}
				if(newModule.init !== undefined)
					newModule.init();

				// Add children recursively
				for(i = 0, n = newModule.children.length; i < n; i++)
					this.addModule(newModule.children[i],moduleArray);

				// Activate after adding all linked modules
				if(newModule.alwaysActive)
					this.addActive(id);
			}
		}
		else
			console.error('Module "'+id+'" not found. Try adding it to Dependencies or Children');
	}
};

Simulator.prototype.addActive = function(id) {
	var i,addModule = this.modules[id];
	if(!addModule.isActive()) {
		// Also activate this module's dependencies
		if(addModule.dependencies.length > 0)
			for(i = 0; i < addModule.dependencies.length; i++)
				this.addActive(addModule.dependencies[i]);

		// If module is a strain, set it as the Simulator's strain function. Never will need to be removed, just potentially overwritten.
		if(addModule.type == 'strain') {
			addModule.activeId = 0;
			this.strain = addModule;
		}
		// Otherwise, just add it to the relavant function array
		else {
			for(i = this.activeModules[addModule.type].length; !addModule.isActive(); i--) {
				if(i === 0 || this.activeModules[addModule.type][i-1].runtime < addModule.runtime) {
					this.activeModules[addModule.type][i] = addModule;
					addModule.activeId = i;
				} else {
					this.activeModules[addModule.type][i] = this.activeModules[addModule.type][i-1];
					this.activeModules[addModule.type][i].activeId = i;
				}
			}
			if(addModule.onActivate !== undefined)
				addModule.onActivate();
		}

		// Also activate this module's children
		if(addModule.children.length > 0)
			for(i = 0; i < addModule.children.length; i++)
				this.addActive(addModule.children[i]);
	}
};

Simulator.prototype.removeActive = function(id) {
	var i,removeModule = this.modules[id];
	if(removeModule !== undefined && removeModule.isActive() && !removeModule.alwaysActive && removeModule.type !== 'strain') {
		// Also deactivate this module's children
		if(removeModule.children.length > 0)
			for(i = 0; i < removeModule.children.length; i++)
				this.removeActive(removeModule.children[i]);

		// Run the ondeactivate function
		if(removeModule.onDeactivate !== undefined)
			removeModule.onDeactivate();

		// Replace this module with the next in line and shift all subsequent modules down the queue
		for(i = removeModule.activeId; i < this.activeModules[removeModule.type].length - 1; i++) {
			this.activeModules[removeModule.type][i] = this.activeModules[removeModule.type][i+1];
			this.activeModules[removeModule.type][i].activeId = i;
		}
		this.activeModules[removeModule.type].length--;
		delete removeModule.activeId;
	}
};

Simulator.prototype.pause = function() {
	this.paused = true;
};
Simulator.prototype.unPause = function() {
	this.paused = false;
};

Simulator.prototype.addUpgrades = function(module) {
	var levels = [],
		i = 0,
		n = arguments.length;

	// If an upgrade got added with the wrong id, fix it
	if(this.upgrades[module.id] !== undefined) {
		this.upgrades[module.id + '_0'] = this.upgrades[module.id];
		delete this.upgrades[module.id];
	}

	while(this.upgrades[module.id + '_' + i] !== undefined) {
		i++;
	}

	for (var j = 1; j < n; i++,j++) {
		var currentLevel = arguments[j];
		levels.push(currentLevel);

		if(!currentLevel.id) {
			if(n == 2)
				currentLevel.id = module.id;
			else
				currentLevel.id = module.id + '_' + i;
		}

		this.upgrades[currentLevel.id] = new Upgrade(currentLevel);
		this.upgrades[currentLevel.id].module = module;
		this.upgrades[currentLevel.id].level = currentLevel;

		var idParts = module.id.split('.');
		if(idParts.length > 1)  {
			idParts.pop();
			currentLevel.resourcePath = idParts.join('/');
		}

		delete currentLevel.onUpgrade;
    }
    // send all the levels to the UI
    this.UI.addEvolution(module.id,levels);

    return this.upgrades;
};

// Returns false if selected upgrades are invalid.
// Returns an array of purchasable upgrades is selected upgrades are valid.
Simulator.prototype.availableUpgrades = function(selectedUpgrades) {
	var totalCost = 0, available = [],
		validPath,upgrade,
		i,j,k;

	for(i = 0; i < selectedUpgrades.length; i++) {
		upgrade = this.upgrades[selectedUpgrades[i]];
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
	if (this.properties.money < totalCost)
		return false;

	// Selected upgrades are valid, now return which ones are selectable
	for (var key in this.upgrades)
		if (this.upgrades.hasOwnProperty(key)) {
			upgrade = this.upgrades[key];
			if(upgrade.active)
				for(j = 0; j < upgrade.children.length; j++) {
					if(upgrade.children[j].cost >= 0 && this.properties.money >= totalCost + upgrade.children[j].cost)
						available.push(upgrade.children[j].id);
				}
		}

	for(i = 0; i < selectedUpgrades.length; i++) {
		upgrade = this.upgrades[selectedUpgrades[i]];
		for(j = 0; j < upgrade.children.length; j++) {
			if(upgrade.children[j].cost >= 0 && this.properties.money >= totalCost + upgrade.children[j].cost)
				available.push(upgrade.children[j].id);
		}
	}
	return available;
};

Simulator.prototype.purchaseUpgrades = function(upgrades) {
	var upgrade;
	if(!this.availableUpgrades(upgrades))
		return false;
	else
		while(upgrades.length) {
			upgrade = this.upgrades[upgrades.pop()];
			this.properties.money -= upgrade.cost;
			upgrade.purchase();
		}

	return true;
};
Simulator.prototype.purchaseMutation = function(mutations) {
	var mutation,upgrade;
	var totalCost = 0;

	var grid = [];
    // Create the grid storage object for keeping track of each gene location
	while(grid.length < this.properties.gridSize) {
		grid.push([]);
	}

	// Check the grid placements and costs of modules to make sure this is a valid upgrade. 
	// Don't charge for unmoved genes
	for(var i = 0; i < mutations.length; i++) {
		upgrade = this.upgrades[mutations[i].upgrade];
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
	if(totalCost > this.properties.money)
		return false;

	// Reset the last mutations to prep modules for new mutation.
	for (var key in this.upgrades)
		if (this.upgrades.hasOwnProperty(key))
			this.upgrades[key].resetGene();
	for (key in this.modules)
		if (this.modules.hasOwnProperty(key))
			this.modules[key].reset();

	// Sort the upgrades so that lower level ones go in first, improving consistency for the modules.
	var that = this;
	mutations.sort(function (a,b) {
		return that.upgrades[a.upgrade].level - that.upgrades[b.upgrade].level;
	});

	// Activate the new mutations
	while(mutations.length) {
		mutation = mutations.pop();
		this.upgrades[mutation.upgrade].activateGene(mutation.placement.x,mutation.placement.y);
	}

	// Run any onMutationChange functions in the modules
	for(var id in that.modules)
		if (that.modules.hasOwnProperty(id))
			if(that.modules[id].onMutationChange !== undefined)
				that.modules[id].onMutationChange(grid);

	return true;
};
Simulator.prototype.tick_begin = function(options) {
	var simplifyCof = 1;
	for(var i = 0, n = this.hordes.length; i < n; i += simplifyCof) {
		// Don't process every horde every turn. Smaller hordes can be skipped the majority of turns 
		if(i > 0 && i % options.simplifyAt < simplifyCof) {
			i = simplifyCof * options.simplifyAt;
			simplifyCof++;
			i += this.iteration % simplifyCof;
			if(i >= n)
				break;
		}
		var current = this.hordes[i];

		// If current horde is empty, remove it from the simulation
		if(current.size < 1) {
			this.R.updateHorde(current, true);
			current = this.hordes[i] = this.hordes.pop(); // don't use splice here, very expensive for huge array. Just swap element to remove with last.
			n--;
		}

		var target,
			currentLocation = current.location,
			latId = Math.floor(Math.abs(currentLocation.lat)),
			chances = this.bakedValues.latCumChance[latId],
			rand = Math.random();

		this.pointsToWatch[currentLocation.id] = true;

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
			current.passData.targetDistance = 0;
		}
		else {
			rand *= 2;

			if(rand < chances[0]){
				target = currentLocation.adjacent[0];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][0];
			}
			else if(rand < chances[1]){
				target = currentLocation.adjacent[1];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][1];
			}
			else if(rand < chances[2]){
				target = currentLocation.adjacent[2];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][2];
			}
			else if(rand < chances[3]){
				target = currentLocation.adjacent[3];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][3];
			}
			else if(rand < chances[4]){
				target = currentLocation.adjacent[0].adjacent[1];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][4];
			}
			else if(rand < chances[5]){
				target = currentLocation.adjacent[2].adjacent[1];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][5];
			}
			else if(rand < chances[6]){
				target = currentLocation.adjacent[2].adjacent[3];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][6];
			}
			else{
				target = currentLocation.adjacent[0].adjacent[3];
				current.passData.targetDistance = this.bakedValues.latDistances[latId][7];
			}
		}

		this.pointsToWatch[target.id] = true;

		if(debugMenu.active)
			debugMenu.console.updateTarget(current, target);

		current.passData.target = target;
	}
};
Simulator.prototype.tick_module = function(process, moduleName, options) {
	var simplifyCof = 1;
	for(var i = 0, n = this.hordes.length; i < n; i += simplifyCof) {
		// Don't process every horde every turn. Smaller hordes can be skipped the majority of turns 
		if(i > 0 && i % options.simplifyAt < simplifyCof) {
			i = simplifyCof * options.simplifyAt;
			simplifyCof++;
			i += this.iteration % simplifyCof;
			if(i >= n)
				break;
		}
		var current = this.hordes[i];
		var result = process(current, current.passData, simplifyCof);

		if(debugMenu.active && options.reportPassData)
			debugMenu.console.reportModule(current, moduleName, current.passData);
		else
			debugMenu.console.reportOutput(current, moduleName, result);
	}
};

Simulator.prototype.tick = function() {
	var S = this,
		R = this.R;

	this.date.setTime(1577880000000 + 86400000*this.iteration);
	if(this.paused)
		return false;

	var i,
		options = {
			simplifyAt: 2000,
			reportPassData: false
		};
	if(this.strain !== null) {
		if(debugMenu.active) {
			debugMenu.console.initTick();
			
			if(debugMenu.console.options.profileTick)
				console.profile('Tick ' + this.iteration);
			console.time('tickTime');
		}

		this.tick_begin(options);

		this.tick_module(this.strain.process, this.strain.id, options);

		options.reportPassData = true;
		for(i = 0; i < this.activeModules.infect.length; i++) {
			this.tick_module(this.activeModules.infect[i].process, this.activeModules.infect[i].id, options);
		}
		options.reportPassData = false;

		for(i = 0; i < this.activeModules.spread.length; i++) {
			this.tick_module(this.activeModules.spread[i].process, this.activeModules.spread[i].id, options);
		}

		this.tick_module(function(current) {
			// Update nearby square populations
			current.location.updateNearbyPop(S.iteration);

			if(!current.renderer.cacheLat || current.renderer.cacheLat != current.location.lat || current.renderer.cacheLng != current.location.lng) {
				R.updateHorde(current);
				current.renderer.cacheLat = current.location.lat;
				current.renderer.cacheLng = current.location.lng;
			}
		}, 'system', options);

		if(debugMenu.active) {
			console.timeEnd('tickTime');
			if(debugMenu.console.options.profileTick) {
				console.profileEnd();
				debugMenu.console.disableProfileTick();
			}
		}

		// Run event modules once
		for(i = 0; i < this.activeModules.event.length; i++) {
			if(debugMenu.active)
				debugMenu.console.reportOutput(null, this.activeModules.event[i].id, this.activeModules.event[i].process());
			else
				this.activeModules.event[i].process();
		}

		// Update all the points in the renderer that may have been affected 
		// Iterate over the sparse array
		for (var point in this.pointsToWatch) {
			// If item is array index
			if (String(point >>> 0) == point && point >>> 0 != 0xffffffff) {
				this.updateSquare(this.points[point]);
			}
		}
		this.pointsToWatch.length = 0;

		this.R.updateMatrix();

		this.UIData.gridSize = this.properties.gridSize;
		this.UIData.iteration = this.iteration;
		this.UI.updateUI(this.UIData);

		this.hordes.addAllNew();

		if(debugMenu.active && debugMenu.console.options.manualTicks) {
			if(this.interval) {
				clearInterval(this.interval);
				this.interval = false;
			}
		} else {
			if(!this.interval)
				this.interval = setInterval( (function(self) { return function() {self.tick();};} )(this), 500);
		}
		if(debugMenu.active)
			debugMenu.console.newTick();

		this.iteration++;
	}
};
Simulator.prototype.updateSquare = function(target, force) {
	if(!target.cache) {
		this.R.setData(target, this.config.max_pop);
		target.cache = { infected: target.infected, total_pop: target.total_pop };
	} else if(force || (target.cache.infected != target.infected || target.cache.total_pop != target.total_pop)) {
		this.R.setData(target, this.config.max_pop);
		target.cache.infected = target.infected;
		target.cache.total_pop = target.total_pop;
	}
};
Simulator.prototype.rendererDecal = function(id, lat, lng, size, texture) {
	this.R.decal(id, lat, lng, size, texture);
};

/*
	Infection modifier objects. Runs the activated functions on every tick of the simulator.
	Parameters: 
		type -- string | what kind of module this is. 
			Valid Values:
				infect  -- runs processFunction ON EVERY SQUARE at INFECT TIME with parameters CURRENT, TARGET and STRENGTH
					Modifies chance (various options of STRENGTH) of a square (CURRENT) infecting another square or self (TARGET) based on the parameters of each square.
				strain  -- runs processFunction ON EVERY SQUARE at INFECT TIME with parameters CURRENT, TARGET, STRENGTH, and CHANCE.
					Returns TRUE if the target had no infections and now does (becomes newly 'active'). 
					UNIQUE, multiple 'strain's will remove all but the last.
					Runs after infect. Changes parameters in TARGET based on CURRENT and STRENGTH. Actually infects people or dead bodies, kills people, raises panic, all of that jazz.
					CHANCE is the multiplier for the effects on the target square (if the target square isn't itself). It's the chance that the square was selected, since further squares will
					actually get hit less often.
				spread  -- runs processFunction ON EVERY SQUARE with parameter CURRENT and STRENGTH. 
					Runs after strain. Can simulate resistance killing infected, burning bodies, closing airports, developing medicine, etc.
				event   -- runs processFunction once at the end of every tick. Can also be non-active (alwaysActive = false) to run function ON USER INPUT.
					Recieves parameters SIMULATORDATA, and optional second parameter that is the mouse click event with attached jQuery.on event.data.
					Affects other modules by changing their data.  Useful for activating, modifying or deactivating modules based on world events or infection upgrades.
		processFunction -- function | function that performs tasks at intervals depending on the type of the module
			parameters
				strain, infect --
					current: current square
					passData: object that is passed to every module and should be used by final modules to affect squares and hordes
					multiple: results should be multiplied by this value, number of times module has been skipped

		options -- object | Optional. Sets other options.
			Valid options:
				dependencies -- array | List of modules that should be loaded before this one. If they are not loaded, they will be initialized before this one is.
				children     -- array | List of modules that should be loaded after this one, if they aren't already.
				alwaysActive -- bool  | Defaults to false. If true, module is immediately activated and run on every tick of the simulation (If false, activate with a event type module)
					If type is 'strain', this should be set to false so the user can pick the strain
				runtime      -- Default 10. Integer that defines run order. Smaller numbers will run first. Typically you will enter all definition functions 
					as 0-8 (lower numbers may be overwritten), addition as 9, and multiplication can be default.
				init         -- function that runs when the module is first read. Takes one parameter, SIMULATORDATA. on 'strain' type modules, takes two, SIMULATORDATA and CALLBACK.
					Strain modules should end in CALLBACK(startSquareDataPoint)
				onStart      -- function that runs after the simulation is started and strain.init has run
				onActivate   -- function that runs every time a module is activated.
				onDectivate   -- function that runs every time a module is deactivated.
				onMutationChange   -- function that runs every time the player submits a new mutation. 1st parameter is the grid array with selected mutations.
				reset        -- function that runs when a module is deactivated or the levels are reset.
	
	Properties of Data Points (CURRENT and TARGET)
		infected
		total_pop
		dead
		water
		polar
		coast_distance
		precipitation
		temperature
		height
		country
		adjacent
			adjacent can also include airports and seaports

	Data that can be accessed inside SIMULATORDATA in init, onStart, and onActivate
		S.points[i] -- array of all Data Points
		S.countries -- array of all Countries
		S.R  -- reference to renderer class for visual effects etc
		S.UI        -- reference to UI class for user input buttons etc
		S.modules   -- all the currently loaded modules
		ALL OPERATION ON MODULE INITIALIZE MUST ONLY STORE DATA IN MODULE OR IN OTHER MODULES

	Common functions on simulator
		.addActive(module id)    -- Make the module run at regular intervals specified by the type.
		.removeActive(module id) -- Make the module not run at regular intervals
*/
function Module(type,processFunction,options) {
	this.type = type;
	this.process = processFunction.bind(this);
	if(options !== undefined)
		for (var key in options)
			if (options.hasOwnProperty(key)) {
				if(key == 'upgrades') {
					for(var i = 0; i < options[key].length; i++) {
						var upgrade = options[key][i];
						if(upgrade.target) {
							var target = this.S.modules[upgrade.target];
							delete options[key].target;
							this.S.addUpgrades(target, upgrade);
						}
						else {
							this.S.addUpgrades(this, upgrade);
						}
					}
				}
				else {
					if(typeof(options[key]) === 'function')
						options[key].bind(this);
					this[key] = options[key];
				}
			}
}

Module.prototype = {
	id: '',
	type: 'infect',
	alwaysActive: false,
	runtime: 10, // Smaller numbers run sooner
	dependencies: [],
	children: [],
	process: function() { return 0; },
	isActive: function() {
		return this.activeId !== undefined;
	},
	activate: function() {
		this.S.addActive(this.id);
	},
	reset: function() {
		if(this.defaults) {
			for (var key in this.defaults)
				if(this.defaults.hasOwnProperty(key))
					this[key] = this.defaults[key];
			delete this.defaults;
		}
	},
	val: function(name, newval, operation, upgrade) {
		/* jshint -W087 */
		if(!newval)
			return this[name];
		else {
			// Gene upgrades should store a default value to it gcan be reverted when the gene is removed. 
			if(!this.defaults)
				this.defaults = {};
			if(this.defaults[name] === undefined)
				this.defaults[name] = this[name];

			// Make sure geneless upgrades actually change the default value as well so they are permanant.
			if(upgrade !== undefined && !upgrade.gene) {
				switch(operation) {
					case '+':this.defaults[name] += newval;break;
					case '-':this.defaults[name] -= newval;break;
					case '*':this.defaults[name] *= newval;break;
					case '/':this.defaults[name] /= newval;break;
					case '^':this.defaults[name] = Math.pow(this[name],newval);break;
					case 'append':
						if(this.defaults[name].push === undefined)
							this.defaults[name] = [this.defaults[name],newval];
						else
							this.defaults[name].push(newval);
						break;
					default: this.defaults[name] = newval;
				}

			}

			switch(operation) {
				case '+':this[name] += newval;break;
				case '-':this[name] -= newval;break;
				case '*':this[name] *= newval;break;
				case '/':this[name] /= newval;break;
				case '^':this[name] = Math.pow(this[name],newval);break;
				case 'append':
					if(this[name].push === undefined)
						this[name] = [this[name],newval];
					else
						this[name].push(newval);
					break;
				default: this[name] = newval;
			}
		}
		if(this[name] === Infinity)
			debugger;
	}
};