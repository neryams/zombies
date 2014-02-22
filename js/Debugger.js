debugMenu.console = {};
debugMenu.console.manualTicks = false;
debugMenu.console.watchModulesCache = false;
debugMenu.console.push = function(debugObject) {
	if(debugObject.selectedPoint === null)
		debugMenu.console['_default'] = debugObject;
	else
		debugMenu.console['_'+debugObject.selectedPoint.id] = debugObject;
}
debugMenu.console.updateTarget = function(self,target) {
	var consoleId = '_'+self.id;
	if(debugMenu.console[consoleId]) {
		debugMenu.console[consoleId].updateTarget(self,target);
	}
	else
		return false;
}
debugMenu.console.reportModule = function(self,name,passData) {
	var consoleId = '_'+self.id;
	if(debugMenu.console[consoleId])
		debugMenu.console[consoleId].updatePassData(self,name,passData);
	else
		return false;
}
debugMenu.console.reportOutput = function(self,name,string) {
	var consoleId = '_'+self.id;
	if(debugMenu.console[consoleId])
		debugMenu.console[consoleId].reportOutput(self,name,string);
	else
		return false;
}
debugMenu.console.newTick = function() {
	for (var point in debugMenu.console) 
		if(debugMenu.console.hasOwnProperty(point) && debugMenu.console[point].debugWindow) {
			delete debugMenu.console[point].lastPassData;
			debugMenu.console[point].debugBody.find('.debugConsole').empty();
			debugMenu.console[point].debugBody.find('.pointInfo .selfInfo').empty();
			debugMenu.console[point].debugBody.find('.pointInfo .hordes').empty();
			delete debugMenu.console[point].currentHorde;
		}
}
debugMenu.console.watch = function(horde) {
	for (var point in debugMenu.console) 
		if(debugMenu.console.hasOwnProperty(point) && debugMenu.console[point].debugWindow && debugMenu.console[point].selectedPoint === null) {
			debugMenu.console[point].watch(horde);
			break;
		}
}
debugMenu.console.watchModules = function(self) {
	if(!self) {
		if(!debugMenu.console.watchModulesCache) {
			debugMenu.console.watchModulesCache = {}
			for (var point in debugMenu.console) 
				if(debugMenu.console.hasOwnProperty(point) && debugMenu.console[point].debugWindow) {
					for (var watch in debugMenu.console[point].watchModules) {
						if(debugMenu.console[point].watchModules.hasOwnProperty(watch) && !debugMenu.console.watchModulesCache[watch]) {
							debugMenu.console.watchModulesCache[watch] = debugMenu.console[point].watchModules[watch];
						}
					}
				}		
		}
		return debugMenu.console.watchModulesCache;
	}
	else if(debugMenu.console['_'+self.id] && debugMenu.console['_'+self.id].watchModules)
		return debugMenu.console['_'+self.id].watchModules;
	else
		return {};
}

function Debugger(horde) {
	// Open a new debugger window
	this.debugWindow = window.open('debugger.htm', '_blank', "height=400,width=1000,location=no");
	var that = this;

	// Wait for all the HTML and stuff to load
	$(this.debugWindow).load(function() {
		that.debugBody = $(that.debugWindow.document.body);

		if(horde !== undefined)
			that.watch(horde);

		// Add handler on textbox to change the watch point
		that.debugBody.find('#o_debugPoint').on('blur', function() {
			if($(this).val() === '' && this.selectedPoint !== null)
				$(this).val(this.selectedPoint.id)
			else if($(this).val() !== '')
				that.watch(S.points[$(this).val()]);
		});

		// Add handler on checkbox to break on every turn
		debugMenu.console.manualTicks = that.debugBody.find('#o_manualTicks').on('click', function() {
			debugMenu.console.manualTicks = $(this).is(':checked');
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
			debugMenu.console.watchModulesCache = false;
		})
	});
}

Debugger.prototype = {
	pause: false,
	selectedPoint: null,
	lastPassData: null,
	watchModules: {},
	desiredHorde: 0
}

Debugger.prototype.updateTarget = function(self,target) {
	// print information about the point. Only do this once each tick.
	if(this.debugBody.find('.pointInfo .selfInfo').html() == "") {
		var printStr = JSON.stringify(self.location, function(key,value) { 
				if(key == 'adjacent' || key == 'vertices_pop' || key == 'vertices_zom') 
					return undefined;
				else if(key == 'army') 
					return {size: value.size, experience: value.experience, nationality: value.nationality};
				else
					return value;
			}, '  ').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');

		this.debugBody.find('.pointInfo .selfInfo').html("<h3>Target: "+target.id+" ("+target.lat+","+target.lng+")</h3>" + printStr);
	}

	// print information about the hordes
	var printStr = JSON.stringify(self, function(key,value) {
				if(key == 'location') 
					return value.id;
				else if(key == 'location' || key == 'split') 
					return undefined;
				else
					return value;
			}, '  ').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');

	this.debugBody.find('.pointInfo .hordes').html( this.debugBody.find('.pointInfo .hordes').html() + 
		"<h3>Horde "+self.id+":</h3>" + printStr);
}
Debugger.prototype.getHordeDebugConsole = function(id) {
	// Don't mix hordes. Keep each one in a separate row. This function just returns that row.
    if(this.debugBody.find('.debugConsole:first-child').html() == "")
    	var consoleRoot = this.debugBody.find('.debugConsole').addClass('horde'+id);
    else {
    	var consoleRoot = this.debugBody.find('.debugConsole.horde'+id)
    	if(!consoleRoot) {
    		var consoleRoot = this.debugBody.find('.debugConsole:first-child').clone().attr('class','debugConsole inactive horde'+id);
    		this.debugBody.find('.debugConsole:first-child').parent.append(consoleRoot);
    	}
    }
    return consoleRoot;
} 
Debugger.prototype.updatePassData = function(self,name,passData) {
	var moduleId = name.split('.',1)[0];
	var moduleInfo = $('<table></table>');
	moduleInfo.append($('<tr></tr>').html('<th colspan="4">'+name+'</th>'));
	if(this.lastPassData === null)
		this.lastPassData = {};
    for (var item in passData) 
        if(passData.hasOwnProperty(item)) {
			if(this.lastPassData[item] === undefined)
				this.lastPassData[item] = 0;

			moduleInfo.append($('<tr></tr>').html('<td>s.'+item+'</td><td>'+this.lastPassData[item].toPrecision(3)+'</td><td class="to"></td><td>'+passData[item].toPrecision(3)+'</td>'));

        	this.lastPassData[item] = passData[item];
        }

    var moduleContainer = $('<td class="module"></td>').append(moduleInfo);

	this.getHordeDebugConsole(self.id).append(moduleContainer);
	
	if(this.watchModules[moduleId])
		moduleContainer.addClass('selected');
	if(!moduleContainer.data('moduleId'))
		moduleContainer.data('moduleId', moduleId);
}
Debugger.prototype.reportOutput = function(self,name,string) {
	var moduleId = name.split('.',1)[0];
	var moduleContainer = $('<td class="module"></td>').html('<div><h3>'+name+'</h3>'+string+'</div>');

	this.getHordeDebugConsole(self.id).append(moduleContainer);

	if(this.watchModules[moduleId])
		moduleContainer.addClass('selected');
	if(!moduleContainer.data('moduleId'))
		moduleContainer.data('moduleId', moduleId);
}
Debugger.prototype.watch = function(horde) {
	if(horde !== undefined) {
		if(this.selectedPoint === null)
			delete debugMenu.console['_default'];
		else
			delete debugMenu.console['_'+this.selectedPoint.id];

		this.debugBody.find('#o_debugPoint').val(horde.id);
		this.selectedPoint = horde;
		debugMenu.console['_'+this.selectedPoint.id] = this;
	}
}
Debugger.prototype.close = function() {
	if(this.debugWindow.window)
		this.debugWindow.window.close();
}
Debugger.prototype.setSimulator = function(S) {
	this.S = S;
}