function Upgrade(options) {
	if(options)
		for (var key in options)
    		if (options.hasOwnProperty(key))
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
	bg: 0,
	paths:[],
	children: []
}

// Return an array of gene points
Upgrade.prototype.generateGene = function(pieceSize, shape, color) {
	var currPoint = new gridPoint(), topLeft = new gridPoint(), bottomRight = new gridPoint(),
		j,n,direction,nextDirection,rand;

    currPoint.setCoords(0,0);
    topLeft.setCoords(0,0);
    bottomRight.setCoords(0,0);

    // Generate the tetris shapes based on the options defined in each gene
    direction = Math.floor(Math.random()*4);
    nextDirection = 0;
    var points = [new gridPoint(currPoint)];

    // Draw the shape by adding on squares in a snake fashion
    for(j = 0, n = pieceSize - 1; j < n; j++) {
        // Change the direction of the "snake" while drawing the piece depending on shape selected
        switch(shape) {
            case 'r':
                if(j == 0)
                    var turn_point = Math.floor(Math.random() * (n-1)) + 1;         
                else if(j == turn_point)
                    if(Math.random() > 0.5)
                        direction++;
                    else
                        direction--;
            break;
            case 'c':
            case 's':
                if(j == 0) {
                    var lastDirection = -1;
                    var turn_point = Math.floor(Math.random() * (n-3)) + 1;
                    var turn_point2 = turn_point + Math.floor(Math.random() * (n - turn_point - 2)) + 2;
                } else if(j == turn_point || j == turn_point2) {
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
                } else if(j > turn_point2) {
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
	for(var j = 0; j < points.length; j++) {
		points[j].addCoords(topLeft.x*-1, topLeft.y*-1);
	}

    this.gene.shape = points;
    this.gene.height = bottomRight.y - topLeft.y + 1;
    this.gene.width = bottomRight.x - topLeft.x + 1;
    this.gene.placement = new gridPoint();
}
Upgrade.prototype.activate = function() {
	this.active = true;
	// If there is no gene, run the process.
	if(!this.gene) {
		this.module.process(this);
	}
}
Upgrade.prototype.resetGene = function() {
	if(this.gene && this.gene.active) {
		delete this.gene.active;
		delete this.gene.placement;
    	this.gene.placement = new gridPoint();
	}
}
Upgrade.prototype.activateGene = function(x,y) {
	if(this.gene && this.active) {
		this.gene.active = true;
		this.gene.position = new gridPoint().setCoords(x,y);
		this.module.process(this);
		return true;
	}
	return false;
}

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
}
gridPoint.prototype.setCoords = function(x,y) {
    this.x = x;
    this.y = y;
}
gridPoint.prototype.addCoords = function(x,y) {
    this.x += x;
    this.y += y;
}
gridPoint.prototype.equals = function(gridpoint) {
    return this.x == gridpoint.x && this.y == gridpoint.y;
}

function Simulator(modules, R, UI) {
	this.modules = {};
	this.activeModules = {infect:[],spread:[],event:[]};
	this.activePoints = [];
	this.iteration = 0;
	this.date = new Date();
	this.date.setTime(1577880000000); // Jan 1st, 2030
	this.UIData = {};
	this.properties = { virus_name: '', money: 500000, panic: 0, gridSize: 5 };
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
	}
	for (var i = 0; i < 90; i++) {
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
		for(var j = 0; j < 8; j++) {
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
		for(var j = 1; j < 8; j++) {
			this.bakedValues.latCumChance[i][j] += this.bakedValues.latCumChance[i][j-1];
		}
	}

	if(this.points == undefined) {
		if(R != undefined) {
			Simulator.prototype.points = gData.points;
			Simulator.prototype.countries = gData.countries;
			Simulator.prototype.config = gConfig;
			Simulator.prototype.Renderer = R;
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
}
Simulator.prototype = {
	modules: null,
	strain:  null,
	division: 1,
	iteration: 0,
	paused: false,
	properties: {},
	setName: function (name) {
		this.properties.virus_name = name;		
	}
}

Simulator.prototype.start = function(strainId) {
	// Add all the modules specified in the contruction of the Simulator
	this.addModule('main');
	this.addActive(strainId);
	Math.seedrandom(); // Before we start the simulation, generate a new random seed so the game itself is unpredictable with respect to the land generation.

	that = this;
	that.strain.init(function(startSq) {
		that.activePoints.push(startSq);
		startSq.infected = 1;

		// Sort out the children for the upgrades, convert string pointers to related upgrades to actual pointers.
		for (key in that.upgrades) {
			var pathPointers = []
			if (that.upgrades.hasOwnProperty(key)) {
				current = that.upgrades[key];
				for(i = 0; i < current.paths.length; i++) {
					that.upgrades[current.paths[i]].children.push(current);
					pathPointers.push(that.upgrades[current.paths[i]]);
				}
				delete current.paths;
				current.paths = pathPointers;
			}
		}

		// Initialize all the other modules
		for(var id in that.modules)
			if(that.modules[id].onStart != undefined && that.modules[id].type != 'strain')
				that.modules[id].onStart(startSq);

		that.Renderer.lookAt(startSq);

		that.tick()
		that.interval = setInterval( (function(self) { return function() {self.tick()}} )(that), 500);
	});
}

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
}

Simulator.prototype.addModule = function(id) {
	var i,n,newModule = SimulatorModules[id](),
		that = this;
	if(!this.modules[id])
		if(newModule != undefined) {
			// Add dependencies recursively
			for(i = 0, n = newModule.dependencies.length; i < n; i++)
				this.addModule(newModule.dependencies[i]);

			newModule.id = id;
			this.modules[id] = newModule;
			if(newModule.alwaysActive)
				this.addActive(id);
			if(newModule.init != undefined && newModule.type != 'strain')
				newModule.init();

			// Add children recursively
			for(i = 0, n = newModule.children.length; i < n; i++)
				this.addModule(newModule.children[i]);
		}
		else
			console.error('Module "'+id+'" not found. Must assign variable "newModule" to the new module object');
}

Simulator.prototype.addActive = function(id) {
	if(!this.modules[id].isActive()) {
		// If module is a strain, set it as the Simulator's strain function. Never will need to be removed, just potentially overwritten.
		if(this.modules[id].type == 'strain')
			this.strain = this.modules[id];
		// Otherwise, just add it to the relavant function array
		else {
			this.modules[id].activeId = this.activeModules[this.modules[id].type].length;
			this.activeModules[this.modules[id].type].push(this.modules[id]);
			this.activeModules[this.modules[id].type].sort(function (a,b) {
				return a.runtime - b.runtime;
			});
			if(this.modules[id].onActivate != undefined)
				this.modules[id].onActivate();
		}	
	}
}

Simulator.prototype.removeActive = function(id) {
	if(this.modules[id].isActive()) {
		if(this.modules[id].onDeactivate != undefined)
			this.modules[id].onDeactivate();
		this.activeModules[this.modules[id].type].splice(this.modules[id].activeId,1);
		for(var i = 0, n = this.activeModules[this.modules[id].type].length; i < n; i++)
			this.activeModules[this.modules[id].type][i].activeId = i;
		delete this.modules[id].activeId;
	}
}

Simulator.prototype.togglePause = function(force) {
	if(force)
		this.paused = force;
	else if(!force && this.paused)
		this.paused = false;
	else if(!force && !this.paused)
		this.paused = true;
}

Simulator.prototype.addUpgrades = function(module) {
	var module = module;
	var levels = [];
	var j;
    for (var i = 1, n = arguments.length; i < n; i++) {
    	j = i-1;
    	levels[j] = arguments[i];
		if(n == 2)
			levels[j].id = module.id;
		else
			levels[j].id = module.id + '-' + j;

    	this.upgrades[levels[j].id] = new Upgrade(levels[j]);
    	this.upgrades[levels[j].id].module = module;
    	this.upgrades[levels[j].id].level = j;
    }
    // send all the levels to the UI
    var evolution = this.UI.addEvolution(module.id,levels);

    return this.upgrades;
}

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
	for (key in this.upgrades)
		if (this.upgrades.hasOwnProperty(key)) {
			upgrade = this.upgrades[key];
			if(upgrade.active)
				for(j = 0; j < upgrade.children.length; j++) {
					if(this.properties.money >= totalCost + upgrade.children[j].cost)
						available.push(upgrade.children[j].id)
				}
		}
	for(i = 0; i < selectedUpgrades.length; i++) {
		upgrade = this.upgrades[selectedUpgrades[i]];
		for(j = 0; j < upgrade.children.length; j++) {
			if(this.properties.money >= totalCost + upgrade.children[j].cost)
				available.push(upgrade.children[j].id)
		}
	}
	return available;

}
Simulator.prototype.purchaseUpgrades = function(upgrades) {
	var upgrade;
	if(!this.availableUpgrades(upgrades))
		return false;
	while(upgrades.length) {
		upgrade = this.upgrades[upgrades.pop()];
		this.properties.money -= upgrade.cost;
		upgrade.activate();
	}

	return true;
}
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
	for (key in this.upgrades)
		if (this.upgrades.hasOwnProperty(key)) 
			this.upgrades[key].resetGene();
	for (key in this.modules)
		if (this.modules.hasOwnProperty(key)) 
			this.modules[key].reset();

	// Sort the upgrades so that lower level ones go in first, improving consistency for the modules.
	var that = this;
	mutations.sort(function (a,b) {
		return that.upgrades[a.upgrade].level - that.upgrades[b.upgrade].level;
	})

	// Activate the new mutations
	while(mutations.length) {
		mutation = mutations.pop();
		this.upgrades[mutation.upgrade].activateGene(mutation.placement.x,mutation.placement.y);
	}

	// Run any onMutationChange functions in the modules
	for(var id in that.modules)
		if (that.modules.hasOwnProperty(id)) 
			if(that.modules[id].onMutationChange != undefined)
				that.modules[id].onMutationChange(grid);

	return true;
}

Simulator.prototype.tick = function() {
	this.date.setTime(1577880000000 + 86400000*this.iteration)
	if(this.paused)
		return false;

	var i,j,n,spread_rand,rand,target,current,chance,chances,direction,distance,beginInfected,strength = {},
		S = this;
	if(this.strain != null) {
        var size;

		for(i = 0, n = this.activePoints.length; i < n; i++) {
			current = this.activePoints[i];
			chances = this.bakedValues.latCumChance[Math.floor(Math.abs(current.lat))];
			beginInfected = current.infected;

			rand = Math.random();
			if(rand < chances[0]) {
				target = current.adjacent[0];
			}
			else if(rand < chances[1]) {
				target = current.adjacent[1];
			}
			else if(rand < chances[2]) {
				target = current.adjacent[2];
			}
			else if(rand < chances[3]) {
				target = current.adjacent[3];
			}
			else if(rand < chances[4]) {
				target = current.adjacent[0].adjacent[1];
			}
			else if(rand < chances[5]) {
				target = current.adjacent[2].adjacent[1];
			}
			else if(rand < chances[6]) {
				target = current.adjacent[2].adjacent[3];
			}
			else {
				target = current.adjacent[0].adjacent[3];
			}
			
			// infect is for all squares, infectSelf is for just its own square, mobili
			strength.infect = 0;
			strength.infectSelf = 0;
			strength.kill = 0;
			strength.mobility = 0;
			strength.panic = 0;

			for(j = 0; j < this.activeModules.infect.length; j++)
				this.activeModules.infect[j].process(current,target,strength);
			
			this.strain.process(current,current,strength);
			this.strain.process(current,target,strength);

			for(j = 0; j < this.activeModules.spread.length; j++)
				this.activeModules.spread[j].process(current,strength);

			this.updateSquare(current);
			this.updateSquare(target);
		}
		for(j = 0; j < this.activeModules.event.length; j++)
			this.activeModules.event[j].process();

		this.Renderer.updateMatrix();

		//if(this.iteration % 2 == 0)
		this.UIData['gridSize'] = this.properties.gridSize;
		this.UIData['iteration'] = this.iteration;
		this.UI.updateUI(this.UIData);
		this.iteration++;
	}
}
Simulator.prototype.updateSquare = function(target) {
	var	size_pop = (target.total_pop) / gConfig.max_pop,
		size_zom = (target.infected) / gConfig.max_pop;
	if(!target.cache) {
		this.Renderer.setData(target, size_pop, size_zom);
		target.cache = { infected: target.infected, total_pop: target.total_pop }
	} else if(target.cache.infected != target.infected || target.cache.total_pop != target.total_pop) {
		this.Renderer.setData(target, size_pop, size_zom); 
		target.cache.infected = target.infected;
		target.cache.total_pop = target.total_pop;
	}
}

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
		S.Renderer  -- reference to renderer class for visual effects etc
		S.UI        -- reference to UI class for user input buttons etc
		S.modules   -- all the currently loaded modules
		ALL OPERATION ON MODULE INITIALIZE MUST ONLY STORE DATA IN MODULE OR IN OTHER MODULES

	Common functions on simulator
		.addActive(module id)    -- Make the module run at regular intervals specified by the type.
		.removeActive(module id) -- Make the module not run at regular intervals
*/
function Module(type,processFunction,options) {
	this.type = type;
	this.process = processFunction;
	if(options != undefined)
		for (var key in options)
    		if (options.hasOwnProperty(key)) {
				if(typeof(options[key]) === "function")
    				this[key] = bind(this, options[key]);
				else
					this[key] = options[key];
    		}
}

Module.prototype = {
	type: 'infect',
	alwaysActive: false,
	runtime: 10, // Smaller numbers run sooner
	dependencies: [],
	children: [],
	process: function() {return 0}
}
Module.prototype.isActive = function() {
	return this.activeId != undefined;
}
Module.prototype.val = function(name, newval, operation) {
	if(!newval)
		return this[name];
	else {
		if(!this.defaults)
			this.defaults = {};
		if(this.defaults[name] === undefined)
			this.defaults[name] = this[name]
		switch(operation) {
			case '+':
				this[name] += newval;
				break;
			case '-':
				this[name] -= newval;
				break;
			case '*':
				this[name] *= newval;
				break;
			case '/':
				this[name] /= newval;
				break;
			case '^':
				this[name] = Math.pow(this[name],newval);
				break;
			default:
				this[name] = newval;
		}
	}
}
Module.prototype.reset = function() {
	if(this.defaults) {
		for (var key in this.defaults)
			if(this.defaults.hasOwnProperty(key))
				this[key] = this.defaults[key];
		delete this.defaults
	}
}

var SimulatorModules = {};

/* 
	STRAIN - Simple virus. Infects  or kills healthy people, raises panic based on infected. 1 evo point per tick.
*/
SimulatorModules['main'] = function() {
	var newModule = new Module('strain', function(current,target,strength) {
		var newInfection = false,
			totalConverted = 0,
			totalKilled = 0,
			rand = Math.random();
		if(target.total_pop > 0) {
			// Kill people in self tile
			if(target.dead == undefined)
				target.dead = 0;
			if(current.infected == 0)
				strength.infect = 0;
			if(target.id != current.id) {
				strength.kill = 0;
				strength.infectSelf = 0;
			}

			// strength can represent how many people are killed per minute (50% chance 120 times a minute at 60 strength)
			totalKilled = Math.round(Math.sqrt(rand * strength.kill/4));
			if(target.total_pop - totalKilled < 0)
				totalKilled = target.total_pop;

			// Infect adjacent tiles and self
			if(strength.infect && target.infected == 0) {
				if(rand < (strength.infect/600)) {
					totalConverted = Math.round(rand * strength.infect/600);
					if(totalConverted > 0 && !target.active) {
						this.S.activePoints.push(target);
						target.active = true;				
					}
				}
			} else if(strength.infect) {
				// strength can represent how many zombies are created per minute (50% chance 120 times a minute at 60 strength)
				totalConverted = Math.round(Math.sqrt(rand * strength.infect/4));
			} else if(strength.infectSelf) {
				// strength can represent how many zombies are created per minute (50% chance 120 times a minute at 60 strength)
				totalConverted = Math.round(Math.sqrt(rand * strength.infectSelf/2));
			}
			if(target.total_pop - totalConverted - totalKilled < 0)
				totalConverted = target.total_pop - totalKilled;

			target.total_pop -= totalConverted;
			target.total_pop -= totalKilled;
			target.infected += totalConverted;
			target.dead += totalKilled;

			// Add the cumulative panic level into the country and the world
			strength.panic = Math.round((totalConverted*1.5+totalKilled) * (target.total_pop/this.S.config.max_pop + 0.5) * strength.panic / 10);
			this.S.properties.panic += strength.panic;
			this.S.countries[target.country].panic += strength.panic;
		}

		return newInfection;
	},{
		init: function(callback) {
			var candidate = [0,null];
			var randCountry = Math.floor((this.S.countries.length-1) * Math.random()) + 1;

			this.S.addUpgrades(this,
				{cost:0,paths:[],name:'Virus',active:true, description:'Basic Virus. Creates slow, witless zombies that enjoy eating healthy brains.'} // setting active to true makes the upgrade automatically purchased
			);

			callback(this.S.countries[randCountry].capitol);
		},
		children: ['panic','world_stats','gridBoost','population','climate','seaports','vaccine','bite','viral_infect','movement']
	});
	return newModule;
}

/* 
	World Stats: Module to update the UI with various statistics about the simulation.
*/
SimulatorModules['world_stats'] = function() {
	var newModule = new Module('event', function() {

		this.S.properties.money += 1;

		if(this.S.iteration % 2 == 0) {
			this.S.UIData['world_pop'] = 0;
			this.S.UIData['world_infected'] = 0;
			for(var i = 0, n = this.S.populatedPoints.length; i < n; i++) {
				this.S.UIData['world_pop'] += this.S.populatedPoints[i].total_pop;
				this.S.UIData['world_infected'] += this.S.populatedPoints[i].infected;
			}
		}
		this.S.UIData['cur_date'] = this.S.date.getMonthName() + ' ' + this.S.date.getDate() + ', ' + this.S.date.getFullYear();
		
		this.S.UIData['money'] = this.S.properties.money;
	},{
		init: function() {
            this.S.UI.interfaceParts.stats.addDataField('text',{
            	dynamic: 'cur_date'
            });
            this.S.UI.interfaceParts.stats.addDataField('text',{title: 'Disease Name'}).val(this.S.properties.virus_name);
            this.S.UI.interfaceParts.stats.addDataField('text',{
            	title: 'World Population',
            	dynamic: 'world_pop'
            });
            this.S.UI.interfaceParts.stats.addDataField('text',{
            	title: 'Zombie Population',
            	dynamic: 'world_infected'
            });
		},
		alwaysActive: true
	});
	return newModule;
}

/*
	Panic: module for activating various modules based on world panic
*/
SimulatorModules['panic'] = function() {
	var newModule = new Module('event', function() {
		this.S.properties.panic = Math.ceil(this.S.properties.panic * 0.95);
		if(this.S.properties.panic > this.panicThresholds[this.currPanicLevel]) {
			this.currPanicLevel++;
			switch(this.currPanicLevel) {
				case 2:
					this.S.modules['vaccine'].startResearch();
			}
		}
		if(this.S.properties.panic < this.panicThresholds[this.currPanicLevel - 1]) {
			this.S.properties.panic = this.panicThresholds[this.currPanicLevel - 1];			
		}
		if(this.worldPanic.visible && this.currPanicLevel > this.panicThresholds.length - 1) {
			this.worldPanic.hide();
		}

		for(var i = 1; i < this.S.countries.length; i++) {
			this.S.countries[i].panic = Math.ceil(this.S.countries[i].panic * 0.95);
			if(this.S.countries[i].panic < this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1]) {
				this.S.countries[i].panic = this.countryPanicThresholds[this.S.countries[i].currPanicLevel - 1];			
			}
			if(this.S.countries[i].panic > this.countryPanicThresholds[this.S.countries[i].currPanicLevel]) {
				this.S.countries[i].currPanicLevel++;
				switch(this.S.countries[i].currPanicLevel) {
					case 2:
						this.S.modules['vaccine'].startResearch(i);
				}
			}			
		}

		this.S.UIData['world_panic'] = (this.S.properties.panic - this.panicThresholds[this.currPanicLevel - 1]) / this.panicThresholds[this.currPanicLevel];
	},{
		init: function () {
			for(var i = 1; i < this.S.countries.length; i++) {
				this.S.countries[i].currPanicLevel = 1;
			}
			this.panicThresholds = [0,10000,1000000,1000000000,this.S.config.world_pop/2];
			this.currPanicLevel = 1;
			this.countryPanicThresholds = [0,200,2000];
            this.worldPanic = this.S.UI.interfaceParts.stats.addDataField('progressBar',{
            	title: 'World Panic',
            	dynamic: 'world_panic',
            	width: 186
            });
		},
		alwaysActive: true
	});
	return newModule;
}

/* 
	Population: Module to change the infect rate based on population
*/
SimulatorModules['population'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		var infect_strength = current.infected*(1+target.total_pop/this.S.config.max_pop);
		strength.infectSelf *= infect_strength;
		strength.infect *= infect_strength;
	},{
		runtime: 9,
		children: ['aggression'],
		alwaysActive: true
	});
	return newModule;
}

/*
	Movement: causes zombies to wander around.
*/
SimulatorModules['movement'] = function() {
	var newModule = new Module('spread', function(current,strength) {
		// Zombies walking around, distance probability distribution function based in strength. mobility being in km/h, and radius of planet being 6378.1 km
		if(strength.mobility > 0 && current.infected > 0) {
			if(current.infectedMovement === undefined)
				current.infectedMovement = 0;

			// error function approximation. No need to worry about sign, since x, or distance/maxDistance, will always be positive
		    var direction,target,normalRand,normalMean,cumChance,actualChance,
		    	chances = this.cumChance(current.lat, (strength.mobility + current.infectedMovement));
				rand = Math.random(),
		    	totalMoved = 0,
		    	surroundPop = current.adjacent[0].total_pop + current.adjacent[1].total_pop + current.adjacent[2].total_pop + current.adjacent[3].total_pop;
		    var cumChance = (chances[0]+chances[1])*current.infected;
		    
			if(cumChance > 1) {
				rand *= cumChance;
				actualChance = 1;
			} else {
				actualChance = cumChance;
			}

			// If random is less than the cumulative chance, we can assume a zombie will be transferring
			if(rand < cumChance) {
				totalMoved = 1;
				// If one side has no people, always send zombies to the other side
				if(!current.adjacent[0].total_pop && !current.adjacent[2].total_pop && (current.adjacent[1].total_pop || current.adjacent[3].total_pop))
					direction = 1;
				else if(!current.adjacent[1].total_pop && !current.adjacent[3].total_pop && (current.adjacent[0].total_pop || current.adjacent[2].total_pop))
					direction = 0;
				// If both sides have people or no sides have people, spread zombies in a random direction
				else
					for(direction = 0; direction < 2; direction++) {
						chances[direction] *= current.infected;
						// We want cumulative chance for the randomization
						actualChance = chances[direction];
						if(direction > 0) 
							chances[direction] += chances[direction-1];

						// If at least one zombie makes it to the next square, calculate how many actually make it in
						if(rand < chances[direction]) {
							break;
						}
					}				
			}

			// If the zombie didn't make it, add a movement value for the next move (increases chances of movement).
			current.infectedMovement += strength.mobility;
			// If the zombie is actually moving, do the movement stuff
			if(totalMoved > 0) {
				if(cumChance > 1) {
					totalMoved = Math.round(actualChance*current.infected);				
				}
				/*// mean number of transfers is equal to the square root of the total possible.
				normalMean = Math.ceil(Math.pow(current.infected,0.85)); 
				// standard deviation of transfers is 1/3 of the mean, so that 99% of the number of transfers is within the mean.
				totalMoved = Math.ceil((normalRand*2 + (normalRand*10%1)*2 + (normalRand*100%1)*2 - 3)*(normalMean/3) + normalMean);
				if(totalMoved < 1)
					totalMoved = 1;
				*/

				// finally, determine which direction they moved in (direction of more healthy people is more likely)
				rand = Math.random();
				if(surroundPop > 0) {
					if(rand > current.adjacent[direction].total_pop/(current.adjacent[direction].total_pop + current.adjacent[direction+2].total_pop))
						direction += 2;
				// If there are no people around, walk in the direction of less zombies (spread out)
				} else {
					if(rand < current.adjacent[direction].infected/(current.adjacent[direction].infected + current.adjacent[direction+2].infected))
						direction += 2;					
				}

				target = current.adjacent[direction];

				// TODO: keep zombies walking when there are no people, add water traversing

		    	// Move the zombies
				if(current.infected < totalMoved)
					totalMoved = current.infected;

				// Adjust infectedMovement based on the number of zombies moving
		    	current.infectedMovement = Math.round((1 - actualChance/cumChance)*(1-totalMoved/current.infected));
		    	if(target.infectedMovement)
		    		target.infectedMovement = Math.round(target.infectedMovement * (1-totalMoved/(target.infected+totalMoved)));


				// must remove the point from activepoints or something otherwise there will be multiple identical squares
				if(totalMoved > 0 && !target.active) {
					this.S.activePoints.push(target);
					target.active = true;
				}

				target.infected += totalMoved;
				current.infected -= totalMoved;
				this.S.updateSquare(target);
			}
		    if(isNaN(current.infectedMovement))
		    	console.log('whoah');
		}
	},{
		init: function() {
			this.bakedMoveChance = [];
			this.cumChance = function (lat,movement) {
				var lat = Math.floor(Math.abs(lat)),
					movement = Math.floor(movement);
				var chances = this.S.bakedValues.latCumChance[lat];
				if(!this.bakedMoveChance[lat])
					this.bakedMoveChance[lat] = [];
				if(!this.bakedMoveChance[lat][movement]) {
					var result = [],
						meanMovement = Math.sqrt(24*movement),
						sigma = meanMovement/3;
					// only need to do two directions because the two horiz directions are the same and the two vert directions are the same
					for(var direction = 0; direction < 2; direction++) {
						distance = this.S.bakedValues.latDistances[lat][direction];
						// A&S erf formula 7.1.26
					    	// distance is the distance in kilometers needed to travel to be in the next square
					    	// 24 "steps", or hours, in a day. Each step is the distance the zombie can travel in one hour, or kph.
					    	// basically get the distribution of zombies that make it past
					    	x = (distance*0.5 - meanMovement)/(1.414213562*sigma),

					    	t = 1.0/(1.0 + 0.3275911*x);
						result[direction] = (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.pow(Math.E,-x*x);
					}
					this.bakedMoveChance[lat][movement] = result;
				}
				return this.bakedMoveChance[lat][movement].slice(0); // return a copy so the array can be freely modified
			}
		},
		alwaysActive: true,
		children: ['movespeed']

	});
	return newModule;
}

/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
SimulatorModules['movespeed'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		// If this is running  due to an upgrade, do the upgrade
		if(arguments.length < 3) {
			if(current.level < 2) {
				this.val('speed',1.2,'+');
				this.val('panic',1,'+');
			}
			else if(current.level == 2) {
				this.val('panic',2,'+');
				this.val('speed',0.5,'+');
				this.val('burstSpeed',7);
			}
			else if(current.level == 3) {
				this.val('panic',20,'+');
				this.val('speed',0.5,'+');
				this.val('burstSpeed',20);
			}
		// Otherwise this is a standard run
		} else {
			strength.mobility = this.speed;
			strength.panic += this.panic	
		}
	},{
		init: function() {
			this.speed = 3; // movement speed of zombies in kph. Average walking speed is 4.5-5.5 kph so they start pretty slow
			this.burstSpeed = 0;
			this.panic = 0;
			this.S.addUpgrades(this,
				{cost: 1000,paths:['bite'],name:'Hunched Walk', description:'Zombies move and spread faster, are slightly more deadly, and make people panic. All movement boosts synergize with biting.', gene:{size: 4, shape: 's', color: 'grey'}},
				{cost: 2000,paths:['movespeed-0'],name:'Upright Walk', description:'Zombies move spread even faster, are slightly more deadly, and make people panic. All movement boosts synergize with biting.', gene:{size: 4, shape: 's', color: 'grey'}},
				{cost: 2000,paths:['movespeed-0'],name:'Famished Trot', description:'Zombies can shuffle quickly to chase prey. More deadly, slightly faster spreading.', gene:{size: 5, shape: 'c', color: 'red'}},
				{cost: 8000,paths:['movespeed-2'],name:'Ravenous Sprint', description:'Zombies can sprint. Results in abject terror and a large increase in deadliness.', gene:{size: 6, shape: 'c', color: 'red'}}
			);
		},
		runtime: 0,
		alwaysActive: true
	});
	return newModule;
}

/*
	Climate: Module to change the infect and killing rate (overall zombie strength) based on the climate. Zombies like the climate that they start in.
*/
SimulatorModules['climate'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		strength.infect *= 1.2 / (Math.pow((this.idealTemp - target.temperature)/(this.rangeTemp),2) + 1);
		strength.infect *= 1.2 / (Math.pow((this.idealWet - target.precipitation)/(this.rangeWet),2) + 1);
		strength.kill *= 1.2 / (Math.pow((this.idealTemp - target.temperature)/(this.rangeTemp),2) + 0.5);
		strength.kill *= 1.2 / (Math.pow((this.idealWet - target.precipitation)/(this.rangeWet),2) + 0.5);
	},{
		onStart: function(startSquare) {
			this.idealTemp = startSquare.temperature;
			this.rangeTemp = 2;
			this.idealWet = startSquare.precipitation;
			this.rangeWet = 1;
		},
		children: ['climateAcc'],
		alwaysActive: true
	});
	return newModule;
}

/* 
	Climate Acclimation: Upgrades to reduce the penalties for spreading to a region with different climate
*/
SimulatorModules['climateAcc'] = function() {
	var newModule = new Module('event', function(upgrade) {
		if(upgrade.level % 3 == 0) {
			this.S.modules['climate'].val('idealTemp',1.5,'+');
			this.S.modules['climate'].val('rangeTemp',1.5,'*');
		}
		else if(upgrade.level - 1 % 3 == 0) {
			this.S.modules['climate'].val('idealTemp',1.5,'-');
			this.S.modules['climate'].val('rangeTemp',1.5,'*');
		}
		else {
			this.S.modules['climate'].val('idealWet',1,'+');
			this.S.modules['climate'].val('rangeWet',1,'+');
		}
	},{
		init: function() {
			this.S.addUpgrades(this,
				{cost: 200,paths:['main'],name:'Heat Affinity I', description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
				{cost: 200,paths:['main'],name:'Cold Affinity I', description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
				{cost: 200,paths:['main'],name:'Water Affinity I',bg:30, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}},
				{cost: 400,paths:['climateAcc-0'],name:'Heat Affinity II', description:'Zombies become stronger in warmth.', gene:{size: 3, shape: 'r', color: 'yellow'}},
				{cost: 400,paths:['climateAcc-1'],name:'Cold Affinity II', description:'Zombies become stronger in cold.', gene:{size: 3, shape: 'r', color: 'green'}},
				{cost: 400,paths:['climateAcc-2'],name:'Water Affinity II',bg:30, description:'Zombies become stronger in wet conditions.', gene:{size: 3, shape: 'r', color: 'blue'}}
			);
		},
		dependencies: ['climate']
	});
	return newModule;
}

/*
	Bite: infect healthy people that are in the same square as the zombie. 
*/
SimulatorModules['bite'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		// If this is running  due to an upgrade, do the upgrade
		if(arguments.length < 3) {
			this.val('panic',2);
			this.val('infectPower',1);
		// Otherwise this is a standard run
		} else {
			strength.infectSelf = this.infectPower * current.infected * this.S.modules['aggression'].val('aggression') * (strength.mobility + this.S.modules['movespeed'].val('burstSpeed'));
			strength.panic += this.panic;
		}
	},{
		init: function() {
			this.panic = 0;
			this.infectPower = 0;
			this.S.addUpgrades(this,
				{cost: 500,paths:['main'],name:'Infected Bite', description:'The quintessential trademark of a zombie. Allows infection of healthy humans.', gene:{size: 2, shape: 'l', color: 'purple'}}
			);
		},
		runtime: 1,
		alwaysActive: true
	});
	return newModule;
}

/* 
	Viral Infection: Vanilla infection module that allows the zombie virus to infect people contagioiusly over the air and water.
*/
SimulatorModules['viral_infect'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		strength.infect += this.infectPower;
		strength.panic += this.panic;
	},{
		init: function() {
			this.panic = 0;
			this.infectPower = 0;
		},
		children: ['transmit_air','transmit_water'],
		runtime: 5
	});
	return newModule;
}

/* 
	Transmit Water: Allows zombies to cross deserts,regions with very low humidity (PLACEHOLDER)
*/
SimulatorModules['transmit_water'] = function() {
	var newModule = new Module('event', function(upgrade) {

	},{
		init: function() {
			this.S.addUpgrades(this,
				{cost: 2000,paths:['bite'],name:'Water Transmittance', gene:{size: 7, shape: 's', color: 'blue'}, description:'Virus can poison the water supply. Areas high in precipitation, <span class="strong">especially downhill</span>, will experience great increases in infection rates. More powerful than air transmittance, but more situational.'}
			);
		}
	});
	return newModule;
}

/* 
	Transmit Water: Allows zombies to cross deserts,regions with very low humidity (PLACEHOLDER)
*/
SimulatorModules['transmit_air'] = function() {
	var newModule = new Module('event', function(upgrade) {
		if(!this.S.modules['viral_infect'].isActive())
			this.S.addActive('viral_infect');

		if(upgrade.level == 0)
		{
			this.S.modules['viral_infect'].val('infectPower',2,'+');
		}
		else if(upgrade.level == 1)
		{
			this.S.modules['viral_infect'].val('panic',0.5,'+');
			this.S.modules['viral_infect'].val('infectPower',8,'+');
		}
		else if(upgrade.level == 2)
		{
			this.S.modules['viral_infect'].val('panic',0.5,'+');
			this.S.modules['viral_infect'].val('infectPower',12,'+');
		}
	},{
		init: function() {
			this.S.addUpgrades(this,
				{cost: 2000,paths:['bite'],name:'Airborne Transmittance', description:'Unlocks evolutions for the zombie virus to infect healthy people through the air. Air infection does not need a zombie in the square to infect, can infect large numbers of people independent of the number of zombies in the area.'},
				{cost: 1500,paths:['transmit_air-0'],name:'Coughing', gene:{size: 4, shape: 's', color: 'green'}, description:'Makes the virus more infectious via air. Increases panic slightly.'},
				{cost: 2500,paths:['transmit_air-1'],name:'Sneezing', gene:{size: 5, shape: 'c', color: 'red'}, description:'Makes the virus more infectious via air. Increases panic moderately.'}
			);
		}
	});
	return newModule;
}

/* 
	Grid Booster: Allows the evolution grid to be expanded
*/
SimulatorModules['gridBoost'] = function() {
	var newModule = new Module('event', function(upgrade) {
		this.S.properties.gridSize++;
	},{
		init: function() {
			this.S.addUpgrades(this,
				{cost: 5000,paths:['main'],name:'Gene Upgrade', description:'Makes gene mutation grid larger. Allows for more complex mutations. <p class="strong">6x6 Mutation Grid</p>'},
				{cost: 20000,paths:['gridBoost-0'],name:'Gene Upgrade II', description:'Makes gene mutation grid larger. Allows for even more complex mutations. <p class="strong">7x7 Mutation Grid</p>'},
				{cost: 100000,paths:['gridBoost-1'],name:'Gene Upgrade III', description:'Makes gene mutation grid larger. Allows for the most complex mutations. <p class="strong">8x8 Mutation Grid</p>'}
			);
		}
	});
	return newModule;
}

/* 
	Aggression: allows zombies to kill people
*/
SimulatorModules['aggression'] = function() {
	var newModule = new Module('infect', function(current,target,strength) {
		// If this is running  due to an upgrade, do the upgrade
		if(arguments.length < 3) {
			this.val('agression',2);
			this.val('panic',3);
		// Otherwise this is a standard run
		} else {
			strength.kill = current.infected * this.aggression * (strength.mobility + this.S.modules['movespeed'].val('burstSpeed')) / 5;
			strength.panic = this.panic;
		}
	},{
		runtime: 0,
		init: function() {
			this.panic = 1;
			this.aggression = 1;
			this.S.addUpgrades(this,
				{cost: 1000,paths:['climateAcc-3'],name:'Hyper Agression',gene:{size: 5, shape: 's', color: 'red'}, description:'Makes zombies more likely to kill people. Improves effectiveness against military. Increases Panic.'}
			);
		},
		alwaysActive: true
	});
	return newModule;
}

/* 
	Desert Walker: Allows zombies to cross deserts,regions with very low humidity (PLACEHOLDER)
*//*
SimulatorModules['desertWalker'] = function() {
	var newModule = new Module('event', function(upgrade) {

	},{
		init: function() {
			this.S.addUpgrades(this,
				{cost: 1500,paths:['climateAcc-3'],name:'Desert Traversing',gene:{size: 5, shape: 's', color: 'red'}, description:'Allows zombies to enter desert without dying.'}
			);
		}
	});
	return newModule;
}*/

/* 
	Vaccine: Makes the world start vaccine research based on panic. If the vaccine is completed, you lose
	Vaccine progress is applied to the upgrade colors on a specific row  
*/
SimulatorModules['vaccine'] = function() {
	var newModule = new Module('event', function() {
		var addResearch = 0;
		// get the total amount of research added this turn based on remaining actively researching country populations
		for(var i = 1, n = this.S.countries.length; i < n; i++)
			if(this.S.countries[i].research)
				addResearch += this.S.countries[i].capitol.total_pop * 5 / this.S.config.max_pop;

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
			this.requiredResearch = 5000;
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
						countryList = [null,this.S.countries[country]];
						this.S.UI.addNews('country_research',this.S.countries[country].name);
					}
				}
				else {
					countryList = this.S.countries;
					this.S.UI.addNews('world_research');
				}

				for(var i = 1; i < countryList.length; i++)
					countryList[i].research = true;
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
	});
	return newModule;
}

/* 
	Seaports: Creates boats that can transport zombies across oceans
*/
SimulatorModules['seaports'] = function() {
	var newModule = new Module('event', function() {
		var interval,i,strength = {};

		// Check the ships that are currently moving
    	for(i = 0; i < this.ships.length; i++) {
			this.ships[i].timeLeft--;
			// If ship is still progressing, increment timers
			if(this.ships[i].timeLeft > 0) {
				this.ships[i].progressBar.val((this.ships[i].travelTime - this.ships[i].timeLeft)/this.ships[i].travelTime);
			// If ship reached destination, clean up				
			} else {
				strength.infect = 0;
				for(j = 0; j < this.S.activeModules.infect.length; j++)
					this.S.activeModules.infect[j].process(this.ships[i].from,this.ships[i].to,strength);
				this.S.strain.process(this.ships[i].from,this.ships[i].to,strength,Math.random());
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
							if(a.total_pop < b.total_pop)
								ab = a.total_pop*0.7 + b.total_pop*0.3;
							else
								ab = a.total_pop*0.3 + b.total_pop*0.7;
							interval = Math.floor((300 - 280*(ab/this.S.config.max_pop))*(this.S.config.max_pop/a.total_pop)); // number of intervals between freighters ranges up from 20
							if(interval > 700) 
								continue; // If ships sail less than once every two years, might as well not bother.
							
							// get distance between the two ports to estimate the ship sailing time
							phi = (a.lat - b.lat)/180*Math.PI;
							theta = (a.lng - b.lng)/180*Math.PI;
							phix = a.lat/180*Math.PI;
							phiy = b.lat/180*Math.PI;
							hyp = (Math.sin(phi/2) * Math.sin(phi/2) +
							    Math.sin(theta/2) * Math.sin(theta/2) * Math.cos(phix) * Math.cos(phiy)); 
							distance = Math.round(2 * Math.atan2(Math.sqrt(hyp), Math.sqrt(1-hyp)) * 40); // ~40 days to get to the other side of the world?

							// Make progress bad for shipping route and add it to the intervals object
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
		},
		alwaysActive: true
	});
	return newModule;
}