# Basic Structure

Modules should follow this format with three required parts:

	exports.type = 'infect';

	exports.run = function(horde, passData) {
	};

	exports.options = {
		init: function() {
		},
		dependencies: []
	};


## type

A string, with a few options that change the behavior of the module

	exports.type = 'strain | infect | spread | event';

#### strain
* The module [runs](#si_run) once for every horde every turn, and will *always* run first
* The player gets to pick between all the registered strain modules. 
* After choosing a strain, all dependencies and children of the strain will be activated, and other strains (but not their dependencies) will be removed.

#### infect
* The module [runs](#si_run) once for every horde every turn.
* Use infect modules for modifying hordes or doing things based on hordes

#### spread
* The module [runs](#sp_run) once for every **location square**, and only runs on squares that are have or are adjacent to hordes.
* Use spread modules for actions involving square properties and caching square data

#### event
* The module [runs](#ev_run) once every turn.
* Use event modules for global actions not directly connected to individual points or hordes


## run
This function will run every turn, and it's parameters will depend on the module type.
<a name="si_run">
#### type: strain, infect
</a>
Runs once for every horde every turn

	exports.run = function(horde, passData) {
	};

`horde`
Pointer to the current horde object  
`passData`
Basic object that is passed along the chain of modules, for storing data for the currently processing horde
<a name="sp_run">
#### type: spread
</a>
Runs once for every land point (DataPoint) every turn (only points with or with adjacent hordes)

	exports.run = function(location) {
	};

`location`
Pointer to the current location DataPoint object
<a name="ev_run">
#### type: event
</a>
Runs once a turn

	exports.run = function() {
	};


## options

	exports.options = {
		[startSimulation : function(dataPoints),]
		init             : function(dataPoints),
		ui               : function(UIObject),
		onStart          : function(startSquare),
		onTick           : function(iteration),
		onActivate       : function(),
		onDectivate      : function(),
		onMutationChange : function(),
		reset            : function(),
		runtime          : int,
		dependencies     : array,
		children         : array,
		alwaysActive     : boolean
	};

### startSimulation `DataPoint function(dataPoints)`
Runs once when the user picks this strain.  
`dataPoints` Array of all the points on the globe

* **required for strain modules, unused for all others**
* must return a DataPoint object which is sent to other modules with onStart functions as the starting square 

### init `null function(dataPoints)`
Runs once during loading before simulation starts. Use it to initialize module variables, objects, etc.  
`dataPoints` Array of all the points on the globe

# Datapoint Properties
* `infected`
* `total_pop`
* `dead`
* `water`
* `polar`
* `coast_distance`
* `precipitation`
* `temperature`
* `height`
* `country`
* `adjacent`
	todo: adjacent can also include airports and seaports
	
# Module functions
* `val(property, value, string operation, bool reversible)` Setter function for properties of modules. 
	* operation is the math function used to apply `newval`, and can be set to +, -, *, /, ^, append. If blank, value is replaced.
	* reversible should be set to true for upgrades by genes, since when genes are removed the module's values are set to the default.

# Common functions on simulator
* `S.addActive(module id)   ` Make the module run at regular intervals specified by the type.
* `S.removeActive(module id)` Make the module not run at regular intervals
* `S.modules[module id]` pointer to module with ID, can run module functions on specific module instead of `this`