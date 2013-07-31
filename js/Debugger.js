debug.console = {};
debug.console.manualTicks = false;
debug.console.watchModulesCache = false;
debug.console.push = function(debugObject) {
	if(debugObject.selectedPoint === null)
		debug.console['_default'] = debugObject;
	else
		debug.console['_'+debugObject.selectedPoint.id] = debugObject;
}
debug.console.updateTarget = function(self,target) {
	if(debug.console['_'+self.id])
		debug.console['_'+self.id].updateTarget(self,target);
	else
		return false;
}
debug.console.reportModule = function(self,name,strength) {
	if(debug.console['_'+self.id])
		debug.console['_'+self.id].updateStrength(name,strength);
	else
		return false;
}
debug.console.reportOutput = function(self,name,string) {
	if(debug.console['_'+self.id])
		debug.console['_'+self.id].reportOutput(name,string);
	else
		return false;
}
debug.console.newTick = function() {
	for (var point in debug.console) 
		if(debug.console.hasOwnProperty(point) && debug.console[point].debugWindow) {
			delete debug.console[point].lastStrength;
			debug.console[point].debugBody.find('.debugConsole').empty();
		}
}
debug.console.watchPoint = function(dataPoint) {
	for (var point in debug.console) 
		if(debug.console.hasOwnProperty(point) && debug.console[point].debugWindow && debug.console[point].selectedPoint === null) {
			debug.console[point].watchPoint(dataPoint);
			break;
		}
}
debug.console.watchModules = function(self) {
	if(!self) {
		if(!debug.console.watchModulesCache) {
			debug.console.watchModulesCache = {}
			for (var point in debug.console) 
				if(debug.console.hasOwnProperty(point) && debug.console[point].debugWindow) {
					for (var watch in debug.console[point].watchModules) {
						if(debug.console[point].watchModules.hasOwnProperty(watch) && !debug.console.watchModulesCache[watch]) {
							debug.console.watchModulesCache[watch] = debug.console[point].watchModules[watch];
						}
					}
				}		
		}
		return debug.console.watchModulesCache;
	}
	else if(debug.console['_'+self.id] && debug.console['_'+self.id].watchModules)
		return debug.console['_'+self.id].watchModules;
	else
		return {};
}

function Debugger(dataPoint) {
	// Open a new debugger window
	this.debugWindow = window.open('debugger.htm', '_blank', "height=400,width=1000,location=no");
	var that = this;

	// Wait for all the HTML and stuff to load
	$(this.debugWindow).load(function() {
		that.debugBody = $(that.debugWindow.document.body);

		if(dataPoint)
			that.watchPoint(dataPoint);

		// Add handler on textbox to change the watch point
		that.debugBody.find('#o_debugPoint').on('blur', function() {
			if($(this).val() === '' && this.selectedPoint !== null)
				$(this).val(this.selectedPoint.id)
			else if($(this).val() !== '')
				that.watchPoint(S.points[$(this).val()]);
		});

		// Add handler on checkbox to break on every turn
		debug.console.manualTicks = that.debugBody.find('#o_manualTicks').on('click', function() {
			debug.console.manualTicks = $(this).is(':checked');
		}).is(':checked');

		that.debugBody.find('#o_endTurn').on('click', function() {
			S.tick();
		});

		// Make side scrolling box scrollable with mouse wheel
		that.debugBody.find('.debugConsoleWindow').on('mousewheel DOMMouseScroll', function(event) {
		    event.preventDefault();
		    if (event.type == 'mousewheel') {
		        this.scrollLeft -= parseInt(event.originalEvent.wheelDelta);
		    }
		    else if (event.type == 'DOMMouseScroll') {
		        this.scrollLeft -= parseInt(event.originalEvent.detail);
		    }
		});

		// Add handler for clicking on modules to break on them
		that.debugBody.find('.debugConsole').on('click','.module',function() {
			var moduleId = $(this).data('moduleId');
			if(!that.watchModules[moduleId]) {
				$(this).addClass('selected');
				if($(this).data('moduleRuntime'))
					that.watchModules[moduleId] = $(this).data('moduleRuntime');
				else
					that.watchModules[moduleId] = true;
			}
			else {
				$(this).removeClass('selected');
				that.watchModules[moduleId] = false;
			}
			debug.console.watchModulesCache = false;
		})
	});
}

Debugger.prototype = {
	pause: false,
	selectedPoint: null,
	lastStrength: null,
	watchModules: {}
}

Debugger.prototype.updateTarget = function(self,target) {
	var printStr = JSON.stringify(self, function(key,value) {
			if(key == 'adjacent' || key == 'vertices_pop' || key == 'vertices_zom') 
				return undefined;
			else if(key == 'army') 
				return {size: value.size, experience: value.experience, nationality: value.nationality};
			else
				return value;
		}, '  ').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');

	this.debugBody.find('.pointInfo').html("<h3>Target: "+target.id+" ("+target.lat+","+target.lng+")</h3>" + printStr);
}
Debugger.prototype.updateStrength = function(name,strength) {
	var moduleId = name.split('.',1)[0];
	var moduleInfo = $('<table class="module"></table>');
	moduleInfo.append($('<tr></tr>').html('<th colspan="4">'+name+'</th>'));
	if(this.lastStrength === null)
		this.lastStrength = {};
    for (var item in strength) 
        if(strength.hasOwnProperty(item)) {
			if(this.lastStrength[item] === undefined)
				this.lastStrength[item] = 0;

			moduleInfo.append($('<tr></tr>').html('<td>s.'+item+'</td><td>'+this.lastStrength[item]+'</td><td class="to"></td><td>'+strength[item]+'</td>'));

        	this.lastStrength[item] = strength[item];
        }

	this.debugBody.find('.debugConsole').append($('<td></td>').append(moduleInfo));
	
	if(this.watchModules[moduleId])
		moduleInfo.addClass('selected');
	if(!moduleInfo.data('moduleId'))
		moduleInfo.data('moduleId', moduleId);
}
Debugger.prototype.reportOutput = function(name,string) {
	var moduleId = name.split('.',1)[0];
	var moduleInfo = $('<div class="module"></div>').html('<h3>'+name+'</h3>'+string);
	this.debugBody.find('.debugConsole').append($('<td></td>').append(moduleInfo));

	if(this.watchModules[moduleId])
		moduleInfo.addClass('selected');
	if(!moduleInfo.data('moduleId'))
		moduleInfo.data('moduleId', moduleId);
}
Debugger.prototype.watchPoint = function(dataPoint) {
	if(dataPoint) {
		if(this.selectedPoint === null)
			delete debug.console['_default'];
		else
			delete debug.console['_'+this.selectedPoint.id];

		this.debugBody.find('#o_debugPoint').val(dataPoint.id);
		this.selectedPoint = dataPoint;
		debug.console['_'+this.selectedPoint.id] = this;
	}
}
Debugger.prototype.close = function() {
	if(this.debugWindow.window)
		this.debugWindow.window.close();
}
Debugger.prototype.setSimulator = function(S) {
	this.S = S;
}