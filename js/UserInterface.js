/*
	UI handlers and functions. 
	Interfaces with Renderer object to get coordinates on sphere, create 3d elements etc. Should be created within document.onready
	Dependencies: jQuery, Renderer.js, Three.js
	Parameters: 
		Renderer -- Reference to the Renderer object so that the UI can send commands to it
*/

function bind(scope, fn) {
	return function () {
		fn.apply(scope, arguments);
	};
}
Date.prototype.getMonthName = function(lang) {
	lang = lang && (lang in Date.locale) ? lang : 'en';
	return Date.locale[lang].month_names[this.getMonth()];
};
Date.prototype.getMonthNameShort = function(lang) {
	lang = lang && (lang in Date.locale) ? lang : 'en';
	return Date.locale[lang].month_names_short[this.getMonth()];
};
Date.locale = {
	en: {
	   month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	   month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	}
};

function DataField(id,type,options,parent) {
	var newElement, fullElement,
		className = 'dataField';
	if(id) {
		this.interfaceParts[id] = this;
		this.id = id;
		className += ' dataField-'+id;
	}

	this.children = [];
	if(type) {
		this.dataType = type;
		className += ' dataField-'+type;
	}

	if(this.dataType == 'text')
		newElement = $(i18n.t('dom:interface.dataField.text'));
	else if(this.dataType == 'p')
		newElement = $(i18n.t('dom:interface.dataField.paragraph'));
	else if(this.dataType == 'progressBar')
		newElement = $(i18n.t('dom:interface.dataField.progressBar'));
	else if(this.dataType == 'button')
		newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'a', className:className+' button tiny expand' }));
	else if(this.dataType == 'accordion') {
		newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'dl', className:className+' accordion' })).attr('data-accordion','');
	}
	else if(this.dataType == 'accordion_child') {
		newElement = $(i18n.t('dom:interface.dataField.default',{ element:'div', className:className }));
		fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'dd', className:'' })).append(newElement);		
	}
	else 
		newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:this.dataType, className:className }));

	if(!fullElement)
		fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'div', className:className })).append(newElement);

	if(parent) {
		this.parent = parent;
		parent.children.push(this);
		parent.element.append(fullElement);		
	} else {
		$('#ui').append(fullElement);		
	}
	
	this.element = newElement;

	if(options)
		for (var key in options)
			if (options.hasOwnProperty(key)) {
				if(typeof(options[key]) === "function")
					this[key] = bind(this, options[key]);
				else
					this[key] = options[key];
			}


	if(this.dataType == 'accordion_child') {
		var uniqueId = 'accordion_' + Object.keys(this.interfaceParts).length;
		fullElement.prepend($(i18n.t('dom:interface.dataField.accordionTitle',{ title:this.title, link: uniqueId})));
		newElement.addClass('content');
		newElement.attr('id',uniqueId);
	} else {
		if(this.title) {
			if(this.parent && this.parent.dataType == 'accordion')
				fullElement.prepend($(i18n.t('dom:interface.dataField.accordionTitle',{ title:this.title })));
			else
				fullElement.prepend($(i18n.t('dom:interface.dataField.title',{ title:this.title })));
		}
	}
	if(this.class)
		newElement.addClass(this.class);
	if(this.outerClass)
		fullElement.addClass(this.outerClass);
	if(this.onClick)
		fullElement.on('click',this.onClick);
	if(this.onHover)
		fullElement.on('mouseover',this.onHover);
	if(this.overlay) {
		fullElement.addClass('overlay');
		this.visible = false;
	}
	if(this.opens)
		for(var i = 0; i < this.opens.length; i++)
			this.opens[i].opener = this;
	if(!this.visible)
		this.element.css('display','none');

	if(this.parent)
		this.parent.element.foundation('reflow');
}
DataField.prototype = {
	dataType: 'text',
	title: null,
	children: null,
	class: null,
	onClick: null,
	onHover: null,
	singleChild: false,
	dynamic: false,
	visible: true,
	overlay: false,
	addDataField: function(id,type,options) {
		if(arguments.length == 1) {
			var type = arguments[0],
				id = null;
		}
		// If second parameter is not a string and there are only two arguments, ID got left out
		if(arguments.length == 2 && !arguments[1].substring) { 
			var options = arguments[1],
				type = arguments[0],
				id = null;
		}
		var newDataField = new DataField(id,type,options,this);
		return newDataField;
	},
	display: function(recursive) {
		if(this.onDisplay)
			this.onDisplay();
		if(this.parent && this.parent.singleChild)
			for(var i = 0; i < this.parent.children.length; i++)
				this.parent.children[i].hide();
		if(this.opener)
			this.opener.element.addClass('selected');
		if(this.overlay) {
			// Hide any other visible overlays
			for (var key in this.interfaceParts)
				if (this.interfaceParts.hasOwnProperty(key) && this.interfaceParts[key].overlay && this.interfaceParts[key].visible) {
					this.interfaceParts[key].hide();
				}
			var that = this;
			$('#ui_mask').css('visibility','visible').on('click.closeOverlay', function (event) {
				that.hide();
			});
			this.UIStatus.pauseRenderer = true;
			if(this.Simulator)
				this.Simulator.pause();
		}

		this.element.css('display','');
		this.visible = true;
		if(recursive)
			for(var i = 0; i < this.children.length; i++)
				this.children[i].display(true);
		return this;
	},
	hide: function() {
		if(this.onHide)
			this.onHide();
		this.element.css('display','none');	
		this.visible = false;
		if(this.opener)
			this.opener.element.removeClass('selected');
		if(this.overlay) {
			$('#ui_mask').css('visibility','hidden').off('click.closeOverlay');
			this.UIStatus.pauseRenderer = false;
			if(this.Simulator)
				this.Simulator.unPause();
		}
		this.hideTooltip();

		return this;
	},
	label: function(value) {
		this.element.attr('data-i18n',value);
		this.element.i18n();
		return this;
	},
	val: function(value) {
		if(this.dataType == 'progressBar') {
			if(!this.width)
				this.width = 100;
			var bar = this.element.children();
			if(isNaN(value)) {
				this.element.addClass('date');
				bar.html(value).css('width','');
			} else {
				this.element.removeClass('date countdown');
				bar.html('').css('width',Math.round(this.width*value));
			}
		}
		else
			this.element.html(value);
		return this;
	}
}

function Evolution(name,levels,options) {
	var i,j,position,evol = this;

	// Inherit the DataField class
	DataField.call( this, null, 'div', options, this.evolveMenu );
	// Save the process function to the Evolution object
	this.name = name;

	// Clear classes from the original element so it may be cloned for all the levels of the evolution object
	this.element.attr('class','');
	for(i = 0; i < levels.length; i++) {
		var currentId = levels[i].id

		// Create the evolution upgrade button in the menu
			// Clone a div element for each level so it can be treated as a separate evolution
		var currentElement = this.element.clone().addClass(/*'evolutionButton_' + this.name + ' */'evolutionButton_' + currentId).appendTo(this.evolveMenu.element)
			.css('background-position', (levels[i].bg*30) + 'px 0').data('id',currentId);

		this.all[currentId] = levels[i];
		if(this.all[currentId].gene)
			this.all[currentId].gene = {
				shape: levels[i].gene.shape,
				color: levels[i].gene.color,
				height: levels[i].gene.height,
				width: levels[i].gene.width,
			}
		this.all[currentId].evolution = this;
		this.all[currentId].element = currentElement;
		this.all[currentId].children = [];

		// Draw gene shape image, (the tetris peices)
		if(this.all[currentId].gene) {
			// Get canvas for drawing the image
			var imageCtx = this.imageCanvas.getContext("2d"),
				currPoint;
			// Clear the last gene graphic and set the canvas size to the final shape size
			this.imageCanvas.height = this.SQUARE_SIZE * this.all[currentId].gene.height;
			this.imageCanvas.width = this.SQUARE_SIZE * this.all[currentId].gene.width;

			// Drawing styles
			switch(this.all[currentId].gene.color) {
				case 'red':
					imageCtx.fillStyle = "rgba(120, 0, 0, 255)";
					imageCtx.strokeStyle = "rgba(255, 0, 0, 255)";
					break;
				case 'green': 
					imageCtx.fillStyle = "rgba(30, 150, 30, 255)";
					imageCtx.strokeStyle = "rgba(0, 220, 0, 255)";
					break;
				case 'blue': 
					imageCtx.fillStyle = "rgba(0, 30, 220, 255)";
					imageCtx.strokeStyle = "rgba(20, 80, 255, 255)";
					break;
				case 'yellow': 
					imageCtx.fillStyle = "rgba(220, 150, 0, 255)";
					imageCtx.strokeStyle = "rgba(255, 255, 0, 255)";
					break;
				case 'purple': 
					imageCtx.fillStyle = "rgba(170, 0, 160, 255)";
					imageCtx.strokeStyle = "rgba(255, 0, 220, 255)";
					break;
				case 'grey': 
					imageCtx.fillStyle = "rgba(160, 180, 180, 255)";
					imageCtx.strokeStyle = "rgba(230, 230, 230, 255)";
					break;
			}
			imageCtx.lineWidth = 1;

			// array for removing points that are not on the outside
			var borders = [];
			// For each point, draw a square at the coordinates
			for(var j = 0; j < this.all[currentId].gene.shape.length; j++) {
				currPoint = this.all[currentId].gene.shape[j];
				imageCtx.beginPath();
				imageCtx.rect(currPoint.x*this.SQUARE_SIZE, currPoint.y*this.SQUARE_SIZE, this.SQUARE_SIZE, this.SQUARE_SIZE);
				imageCtx.fill();
				borders[currPoint.y*this.all[currentId].gene.width + currPoint.x] = j;
			}
			for(var j = 0; j < borders.length; j++) {
				if(borders[j] !== undefined) {
					currPoint = this.all[currentId].gene.shape[borders[j]];
					if(borders[j - 1] === undefined || currPoint.x == 0) {
						imageCtx.beginPath();
						imageCtx.moveTo(currPoint.x*this.SQUARE_SIZE + 0.5,currPoint.y*this.SQUARE_SIZE );
						imageCtx.lineTo(currPoint.x*this.SQUARE_SIZE + 0.5,(currPoint.y+1)*this.SQUARE_SIZE );
						imageCtx.stroke();
					}
					if(borders[j - this.all[currentId].gene.width] === undefined || currPoint.y == 0) {
						imageCtx.beginPath();
						imageCtx.moveTo(currPoint.x*this.SQUARE_SIZE ,currPoint.y*this.SQUARE_SIZE + 0.5);
						imageCtx.lineTo((currPoint.x+1)*this.SQUARE_SIZE ,currPoint.y*this.SQUARE_SIZE + 0.5);
						imageCtx.stroke();
					}
					if(borders[j + 1] === undefined || currPoint.x == this.all[currentId].gene.width - 1) {
						imageCtx.beginPath();
						imageCtx.moveTo((currPoint.x+1)*this.SQUARE_SIZE - 0.5,currPoint.y*this.SQUARE_SIZE);
						imageCtx.lineTo((currPoint.x+1)*this.SQUARE_SIZE - 0.5,(currPoint.y+1)*this.SQUARE_SIZE);
						imageCtx.stroke();
					}
					if(borders[j + this.all[currentId].gene.width] === undefined || currPoint.y == this.all[currentId].gene.height - 1) {
						imageCtx.beginPath();
						imageCtx.moveTo(currPoint.x*this.SQUARE_SIZE,(currPoint.y+1)*this.SQUARE_SIZE - 0.5);
						imageCtx.lineTo((currPoint.x+1)*this.SQUARE_SIZE,(currPoint.y+1)*this.SQUARE_SIZE - 0.5);
						imageCtx.stroke();
					}
				}
			}

			// Copy a image elemnt for the user interface and put the gene image into it.
			this.all[currentId].gene.imageElement = $('<img />').attr('src', this.imageCanvas.toDataURL());
		}

		// Mouseover tooltip for evolution
		currentElement.on('mouseover.evolutionTooltip', this, function(event) {
			var data = event.data.all[$(this).data('id')];
			var toolTipContent = $('<table/>');
			toolTipContent.append($('<tr><th colspan="2">'+data.name+'</th></tr><tr><td>Cost</td><td>'+data.cost+'</td></tr>'));
			if(data.gene)
				toolTipContent = toolTipContent.append($('<tr><td>Gene</td></tr>').append($('<td/>').append(data.gene.imageElement)));

			toolTipContent.append($('<tr><td colspan="2">'+data.description+'</td></tr>'));
			evol.showToolTip(toolTipContent,$(this),200);
		});

		// Click event for evolution in the upgrade menu
		currentElement.on('click.evolutionSelect', { Simulator: this.Simulator, evolution: this },function(event) {
			var i, upgradeId = $(this).data('id'),
				upgrade = event.data.evolution.all[upgradeId],
				selectedUpgrades = event.data.evolution.selectedUpgrades;

			// User is buying the upgrade
			if(!upgrade.selected) {
				if(upgrade.available) {
					selectedUpgrades.push(upgradeId);
					upgrade.selected = true;
					evol.UIStatus.money -= upgrade.cost;
					evol.interfaceParts.money.val(evol.UIStatus.money);
				}
			// User is undoing the purchase
			} else {
				for(i = 0; i < upgrade.children.length; i++)
					if(upgrade.children[i].selected)
						upgrade.children[i].element.triggerHandler('click');
				for(i = 0; i < selectedUpgrades.length; i++)
					if(selectedUpgrades[i] == upgrade.id) {
						selectedUpgrades.splice(i,1);
						evol.UIStatus.money += upgrade.cost;
						evol.interfaceParts.money.val(evol.UIStatus.money);
						delete upgrade.selected;
						upgrade.element.removeClass('active');
						break;
					}
			}
			upgrade.evolution.refresh();
		});

	}
	this.element.remove();
	this.element = $('.evolutionButton_' + name, this.evolveMenu.element);
}
// Inherit the DataField class
Evolution.prototype = Object.create( DataField.prototype );
Evolution.prototype.all = {};
Evolution.prototype.selectedUpgrades = [];
Evolution.prototype.mutation = [];

// Prototype properties for drawing gene shapes
Evolution.prototype.SQUARE_SIZE = 10;
// Canvas to draw the shape on
Evolution.prototype.imageCanvas = document.createElement( 'canvas' );
Evolution.prototype.imageCanvas.width = 100;
Evolution.prototype.imageCanvas.height = 100;

Evolution.prototype.refresh = function() {
	var available = this.Simulator.availableUpgrades(this.selectedUpgrades);
	this.evolveMenu.element.find('.available').removeClass('available');
	for (key in this.all)
		if (this.all.hasOwnProperty(key)) {
			this.all[key].available = false;
			if(this.all[key].active || this.all[key].selected)
				this.all[key].element.addClass('active');
		}

	for(i = 0; i < available.length; i++) {
		this.all[available[i]].element.addClass('available');
		this.all[available[i]].available = true;
	}
}
/*
for (key in this.all)
	if (this.all.hasOwnProperty(key) && this.all[key].cost < money && this.all[key].available) {
		this.all[key].element.addClass('available');
		this.all[key].available = true;
	}*/

Evolution.prototype.buyEvolutions = function() {
	var upgrade, 
		success = this.Simulator.purchaseUpgrades(this.selectedUpgrades.slice(0));
	while(this.selectedUpgrades.length) {
		upgrade = this.all[this.selectedUpgrades.pop()];
		if(success) {
			upgrade.active = true;

			// Draw gene shape image
			if(upgrade.gene) {
				// Copy a gene for the user interface and put the gene into it.
				current = $('#tb_gene',this.mutationMenu.element).clone().removeAttr('id').addClass('active geneBlock gene_'+upgrade.id).data('geneId',upgrade.id);
				$('img',current).replaceWith(upgrade.gene.imageElement.clone());
				$('.name',current).html(upgrade.name);
				upgrade.gene.element = current;

				this.mutationMenu.element.append(current);
			}
		}
		delete upgrade.selected;
	}
	this.evolveMenu.element.find('.available').removeClass('available');
}

Evolution.prototype.refreshGenes = function() {
	var i,j,n;
	for(i = 0, n = this.mutation.length; i < n; i++) {
		var geneElement = $('.geneBlock.active.gene_'+this.mutation[i].upgrade),
			geneImage = geneElement.find('img'),
			currentUpgrade = this.all[this.mutation[i].upgrade],
			overlayPosition = geneImage.parents('.overlay').offset(),
			gridElement = $('#tb_board .grid'),
			gridElementPosition = gridElement.offset(),
			gridSquareSize = this.SQUARE_SIZE;

		currentUpgrade.gene.placement = this.mutation[i].placement;
		currentUpgrade.gene.used = true;

		element = geneElement.clone(true).removeClass('active').empty().append(geneImage.clone());
		element.css('left',currentUpgrade.gene.placement.x*gridSquareSize)
			.css('top',currentUpgrade.gene.placement.y*gridSquareSize).addClass('placed').appendTo(gridElement);
		geneElement.addClass('used');

		for(j = 0; j < currentUpgrade.gene.shape.length; j++) {
			this.grid[currentUpgrade.gene.shape[j].x + currentUpgrade.gene.placement.x][currentUpgrade.gene.shape[j].y + currentUpgrade.gene.placement.y] = currentUpgrade;
		}
	}
}
Evolution.prototype.mutate = function() {
	this.mutation.length = 0;
	for (key in this.all)
		if (this.all.hasOwnProperty(key) && this.all[key].gene) {
			if(this.all[key].gene.used) {
				this.all[key].gene.active = this.mutation.length;
				this.mutation.push({ upgrade: key, placement: this.all[key].gene.placement });
			} else {
				if(this.all[key].gene.active !== undefined)
					delete this.all[key].gene.active;
			}
		}

	if(this.mutation.length > 0)
		if(!this.Simulator.purchaseMutation(this.mutation.slice(0)))
			console.error('mutation not valid!');

	this.mutationMenu.hide();
}
Evolution.prototype.cleanMutation = function() {
	this.clearGrid();
}
Evolution.prototype.clearGrid = function() {
	for (key in this.all)
		if (this.all.hasOwnProperty(key) && this.all[key].gene && this.all[key].gene.used) {
			this.all[key].gene.used = false;
			delete this.all[key].gene.placement;
		}
	for (var i = 0; i < this.grid.length; i++) {
		this.grid[i].length = 0;
	}
	$('.geneBlock.placed').remove();
	$('.geneBlock.active').removeClass('used');
}

Evolution.prototype.buildWeb = function(upgrade,lastTheta,depth) {
	// Figure out where to put the starting points.
	var evolutionBg = this.evolveMenuBg.element[0];
	if(!upgrade) {
		evolutionBg.width = this.evolveMenu.element.width();
		evolutionBg.height = this.evolveMenu.element.height();
	}
	var bgCtx = evolutionBg.getContext("2d");
	/*bgCtx.fillStyle = "rgba(30, 30, 30, 255)";
	bgCtx.fillRect(0, 0, evolutionBg.width, evolutionBg.height);*/

	var i,key,current,target,position,childUpgrades,theta,
		shiftPosition = {}, arrow_separation = 0.03;
	if(upgrade == undefined) {
		childUpgrades = [];
		for (key in this.all)
			if (this.all.hasOwnProperty(key)) {
				current = this.all[key];
				if(!current.paths.length)
					childUpgrades.push(current);
				else
					for(i = 0; i < current.paths.length; i++) 
						this.all[current.paths[i]].children.push(current);
			}
		position = {left:500,top:500};
	} else {
		position = upgrade.position;
		childUpgrades = upgrade.children;
	}
	if(depth == undefined)
		depth = 0;

	for(i = 0; i < childUpgrades.length; i++) {
		current = childUpgrades[i];
		// Switch going up and down
		if(current.position == undefined) {
			if(lastTheta == undefined) {
				theta = 0;
				current.position = { top: position.top, left: position.left}			
			}
			else 
			{
				theta = lastTheta + 2*Math.PI*(Math.ceil(i/2)/childUpgrades.length)/depth*(1 - i%2*2);
				current.position = { top: position.top + Math.round(75*Math.sin(theta)), left: position.left + Math.round(75*Math.cos(theta))}
			}

			current.element.css('top', current.position.top).css('left', current.position.left);			
		}
		
		if(current.children.length) {
			if(childUpgrades.length > 1 || depth < 2)
				this.buildWeb(current,theta,depth+1);
			else
				this.buildWeb(current,theta,depth);
			for(j = 0; j < current.children.length; j++) {
				// Link the children of this object together both visually and symbolically
				target = current.children[j];

				/*var shiftX = current.position.left - target.position.left;
				var shiftY = current.position.top - target.position.top;
				var shiftH = Math.sqrt(shiftX*shiftX+shiftY*shiftY);

				if(shiftY > 0)
					shiftPosition.top = Math.sin(Math.asin(shiftY/shiftH) - arrow_separation)*shiftH - shiftY;
				else
					shiftPosition.top = Math.sin(Math.asin(shiftY/shiftH) + arrow_separation)*shiftH - shiftY;
				if(shiftX > 0)
					shiftPosition.left = Math.cos(Math.acos(shiftX/shiftH) - arrow_separation)*shiftH - shiftX;
				else
					shiftPosition.left =  Math.cos(Math.acos(shiftX/shiftH) + arrow_separation)*shiftH - shiftX;

				bgCtx.lineWidth = 2;
				bgCtx.strokeStyle = 'rgba(225,150,0,255)';
				bgCtx.beginPath();
				bgCtx.moveTo(current.position.left + shiftPosition.left, current.position.top + shiftPosition.top);
				bgCtx.lineTo(target.position.left, target.position.top);
				bgCtx.lineTo(current.position.left - shiftPosition.left, current.position.top - shiftPosition.top);
				bgCtx.stroke();*/

				bgCtx.lineWidth = 4;
				bgCtx.strokeStyle = 'rgba(120,120,120,255)';
				bgCtx.beginPath();
				bgCtx.moveTo(current.position.left, current.position.top);
				bgCtx.lineTo(target.position.left, target.position.top);
				bgCtx.stroke();

				bgCtx.lineWidth = 1;
				bgCtx.strokeStyle = 'rgba(255,255,150,255)';
				bgCtx.beginPath();
				bgCtx.moveTo(current.position.left, current.position.top);
				bgCtx.lineTo(target.position.left, target.position.top);
				bgCtx.stroke();
			}			
		}
	}
}

var UserInterface = function UserInterface(Renderer,language) {
	var mouse = { x:0, y:0, lastx:0, lasty:0, down:false, click: false, scroll: 0 },
		sphere_coords,visualization = '', WorldData, Simulator, 
		status = { pauseRenderer: false, showToolTip: false, toolTipMode: '', mutateGridSize: 0 },
		dataFieldsRoot = [], interfaceParts = {},alerts = {};

	DataField.prototype.interfaceParts = interfaceParts;
	DataField.prototype.UIStatus = status;

	/*
		Functions for generating the loading bar
		Parameters:
			ratio -- float | how much of the current portion is done
			share -- float | how big the current portion is out of 1
		If called without parameters, it advances the current step text immediately. If called with a ratio of 0, it starts the load.
	*/
	var load = {
		loading: {
			done: 0, curProg: 0, curShare: 0, curStep: 0
		},
		start: function() {
			$('#setup').css('display','none');
			$('#progress').css('display','block');
			$('#progress p').html(i18n.t("setup:loading.0"));
		},
		endGenerator: function() {
			addDataField('stats','div',{ class: 'stats' }).addDataField('h1').label('setup:title');
			var uiMenu = addDataField('menu','div',{ class: 'main_menu' });

			var uiMenuDataviews = uiMenu.addDataField('div',{ visible: false, class: 'dataViewList' });
			var uiMenuDataviewsPos = uiMenu.addDataField('button',{ 
					onClick: function() {
						if(!this.opens[0].visible) 
							this.opens[0].display();		   				
						else
							this.opens[0].hide();
					}, 
					opens: [uiMenuDataviews] 
				}).label('ui:buttons.dataviews').element.position();
			uiMenuDataviews.addDataField('button',{ class: 'secondary', onClick: function() { this.parent.hide(); } }).label('ui:buttons.close');
			uiMenuDataviews.addDataField('button',{ onClick: function() { Renderer.setVisualization('country'); this.parent.hide(); activatePlanetTooltip(function(point){ if(point.country) { return '<strong>' + gData.countries[point.country].name + '</strong>'; }});}}).label('ui:buttons.dataviews_inner.political');
			uiMenuDataviews.addDataField('button',{ onClick: function() { Renderer.setVisualization('precipitation'); this.parent.hide(); activatePlanetTooltip(function(point){ return Math.round(point.precipitation*10)/10 + 'mm'; });}}).label('ui:buttons.dataviews_inner.rain');
			uiMenuDataviews.addDataField('button',{ onClick: function() { Renderer.setVisualization('temperature'); this.parent.hide(); activatePlanetTooltip(function(point){ return Math.round((point.temperature - 273)*10)/10 + 'C'; });}}).label('ui:buttons.dataviews_inner.temperature');
			uiMenuDataviews.addDataField('button',{ onClick: function() { Renderer.closeVisualization(); this.parent.hide(); deactivatePlanetTooltip(); } }).label('ui:buttons.dataviews_inner.disable');
			uiMenuDataviews.element.css('top',uiMenuDataviewsPos.top - uiMenuDataviews.element.height());

			uiMenu.addDataField('button',{
					onClick: function() {
						Renderer.togglePopDisplay();
					}
				}).label('ui:buttons.population');

			var evolveMenuOuter = addDataField('evolveMenu','div',{ class: 'evolution', title: 'Evolution', overlay: true, onHide: function() {
				Evolution.prototype.buyEvolutions();
			} });
			Evolution.prototype.evolveMenuBg = evolveMenuOuter.addDataField('canvas',{ class: 'draggable' });
			Evolution.prototype.evolveMenu = evolveMenuOuter.addDataField('div',{ class: 'draggable' });
			uiMenu.addDataField('evolveMenu_button','button',{
					class: 'primary',
					onClick: function() {
						if(!this.opens[0].visible) {
							Evolution.prototype.refresh();
							this.opens[0].display();
						}
						else
							this.opens[0].hide();
					}, 
					opens: [evolveMenuOuter]
				}).label('ui:buttons.evolution');

			Evolution.prototype.mutationMenu = addDataField('mutationMenu','div',{ class: 'toolbox', title: 'Mutation', overlay: true, onHide: function() {
				Evolution.prototype.clearGrid();
			}});
			Evolution.prototype.mutationMenu.element.append($(i18n.t('dom:interface.mutation.menu')));
			uiMenu.addDataField('mutationMenu_button','button',{
					class: 'primary',
					onClick: function() {
						if(!this.opens[0].visible) {
							Evolution.prototype.refreshGenes();
							this.opens[0].display();
						}
						else
							this.opens[0].hide();
					}, 
					opens: [Evolution.prototype.mutationMenu]
				}).label('ui:buttons.mutation');
			var mutationMenu_controls = Evolution.prototype.mutationMenu.addDataField('div',{ class: 'menu' });
			mutationMenu_controls.addDataField('mutationMenu_clear','button',{
					class: 'icon',
					onHover: function() { 
						this.showToolTip( 'Clear the mutation grid.' );
					},
					onClick: function() {
						Evolution.prototype.clearGrid();
					}
				});
			mutationMenu_controls.addDataField('mutationMenu_submit','button',{ 
					class: 'primary',
					onHover: function() {
						var totalPrice = 0;
						for (key in Evolution.prototype.all)
							if (Evolution.prototype.all.hasOwnProperty(key) && Evolution.prototype.all[key].gene && Evolution.prototype.all[key].gene.used)
								if(Evolution.prototype.all[key].gene.active === undefined || !Evolution.prototype.mutation[Evolution.prototype.all[key].gene.active].placement.equals(Evolution.prototype.all[key].gene.placement)) 
									totalPrice += Evolution.prototype.all[key].cost;

						this.showToolTip( 'Mutate your infection for <span class="strong">'+totalPrice+'</span> evolution points' );
					},
					onClick: function() {
						Evolution.prototype.mutate();
					}
				}).val('Mutate');
			mutationMenu_controls.addDataField('mutationMenu_cancel','button',{ 
					class: 'secondary',
					onHover: function() {
						this.showToolTip( 'Revert all changes.' );
					},
					onClick: function() {
						Evolution.prototype.mutationMenu.hide();
					}
				}).val('Cancel');

			var uiSidebar = addDataField('div',{ class: 'sidebar' });

			uiSidebarStatic = uiSidebar.addDataField('sidebarStatic','div');
			uiSidebarStatic.addDataField('money','text',{
				title: 'Evolution Points',
				dynamic: 'money'
			});

			uiSidebarAccordion = uiSidebar.addDataField('sidebarAccordion','accordion');
			uiSidebarAccordion.addDataField('newsTicker','accordion_child',{
				title: 'ui:buttons.news',
				class: 'news'
			});

			addDataField('alert','div',{ overlay: true });
		},
		end: function() {
			$('#setup,#progress').remove();
			$('#container').css('display','block');

			$("#ui").append($('<div id="render_tooltip" class="tooltip"></div><div id="tooltip" class="tooltip"></div>'));

			mainUIReady();
			Evolution.prototype.buildWeb();
		},
		progress: function(ratio, share) {
			if(ratio == undefined) {
				ratio = share = 0;
			}
			if(this.loading.curProg > ratio*share || this.loading.curShare == 0 || share == 0) { // A new loading portion started
				this.loading.done += this.loading.curShare;
				this.loading.curShare = share;
				this.loading.curStep++;
				$('#progress p').html(i18n.t("setup:loading."+this.loading.curStep));
			}
			this.loading.curProg = ratio*share;
			$('#progress .pace .pace-progress').css('width', ((this.loading.done+this.loading.curProg) * 100) + '%');
		}
	}

	/* 
		Parameter is a function that takes one paramater, a function that takes a dataPoint and returns a string.
		You will call this function to set up a tooltip that returns a property of a point on the planet
	*/ 
	function activatePlanetTooltip(getPointInfo) {
		$('#ui').off('mousemove.render_tooltip');
		$('#ui').on('mousemove.render_tooltip', null, getPointInfo, function(event) {
			mouse.x = event.clientX;
			mouse.y = event.clientY;
			sphere_coords = Renderer.getSphereCoords(mouse.x,mouse.y,200);
			if(sphere_coords && !isNaN(sphere_coords[0]) && !isNaN(sphere_coords[1]) && !status.pauseRenderer) {
				$('#render_tooltip').css('top',mouse.y+10).css('left',mouse.x+30);
				//$('#tooltip').css('display','block').html('asf');
				var point = gData.points[(Math.floor(90-sphere_coords[0])*gConfig.w + Math.floor(sphere_coords[1]))];
				if(point != undefined && (!point.water || point.total_pop > 0)) {
					if($('#render_tooltip').css('visibility') != 'visible')
						$('#render_tooltip').css('visibility','visible');
					$('#render_tooltip').html(event.data(point));

					// Debug information to mouse over points
					if(debugMenu.mouseOverDebugData) {
						$('#render_tooltip').html(JSON.stringify(point, 
							function(key,value) {
								if(key == 'adjacent' || key == 'vertices_pop' || key == 'vertices_zom') 
									return undefined;
								else if(key == 'army') 
									return {size: value.size, experience: value.experience, nationality: value.nationality};
								else
									return value;
							}, '&nbsp;').replace(/\n/g, '<br />')).css('font-size', '8pt');
					}
				}
				else
					if($('#render_tooltip').css('visibility') != 'hidden')
						$('#render_tooltip').css('visibility','hidden');
			}
			else 
				if($('#render_tooltip').css('visibility') != 'hidden')
					$('#render_tooltip').css('visibility','hidden');
		})
	}
	function deactivatePlanetTooltip() {
		hideTooltip();
		$('#ui').off('mousemove.render_tooltip');
	}

	DataField.prototype.showToolTip = function (text,element,width) {
		if(!element)
			element = this.element;
		var position = element.offset();

		var tooltip = $('#tooltip');
		if(tooltip.css("visibility") == 'hidden' && text) {
			tooltip.empty();
			if(width)
				tooltip.css('width',width);
			if(text.appendTo)
				tooltip.append(text);
			else
				tooltip.html(text);
			tooltip.css('top',position.top - (tooltip.height() + 20)).css('left',position.left).addClass('');
			tooltip.css("display","none").css("visibility","visible").fadeIn('fast');
		}

		element.on('mouseout',this ,function (event) {
			event.data.hideTooltip();
		});
	}

	function hideTooltip() {
		$('#tooltip').css('visibility','hidden');
	}
	DataField.prototype.hideTooltip = hideTooltip;

	// Commands to run when loading is finished and main game UI is displayed
	function mainUIReady() {
		$('.draggable').on('mousedown.draggable', function (event) {
			event.preventDefault();
			mouse.down = true;
			mouse.x = event.clientX;
			mouse.y = event.clientY;
			var elements = $(this).parent().find('.draggable');
			elements.maxPos = { top: $(this).parent().height() - elements.height(), left: $(this).parent().width() - elements.width() }
			$(this).on('mousemove.dragging', null, elements, function (event) {
				event.preventDefault();
				var position = event.data.position();
				position.left += event.clientX - mouse.x;
				position.top += event.clientY - mouse.y;
				if(position.left > 0)
					position.left = 0;
				else if(position.left < event.data.maxPos.left)
					position.left = event.data.maxPos.left;
				if(position.top > 0)
					position.top = 0;
				else if(position.top < event.data.maxPos.top)
					position.top = event.data.maxPos.top;

				event.data.css('left', position.left);
				event.data.css('top', position.top);
				mouse.x = event.clientX;
				mouse.y = event.clientY;
			})
		});
		$('.draggable').on('mouseup.draggable', function (event) {
			mouse.down = false;
			$(this).off('mousemove.dragging');			
		});
		$('.draggable').on('mouseout.draggable', function (event) { $(this).trigger('mouseup'); });

		$('#ui').on('mousedown.moveCamera', function (event) {
			if(!status.pauseRenderer) {
				event.preventDefault();
				mouse.down = true;
				mouse.x = mouse.lastx = event.clientX;
				mouse.y = mouse.lasty = event.clientY;
				mouse.click = true;
				Renderer.stopCameraMovement();
				$(this).on('mousemove.moveCamera', function (event) {
					mouse.x = event.clientX;
					mouse.y = event.clientY;
					// If user moves the mouse enough, declare this mousedown as NOT a click.
					if(Math.abs(mouse.lastx - mouse.x) + Math.abs(mouse.lasty - mouse.y) > 3)
						mouse.click = false;
				});
			}
		});
		$('#ui').on('mouseup.moveCamera', function (event) {
			$(this).off('mousemove.moveCamera');
			// If mouse didn't move, do the click
			if(mouse.click)
				Renderer.clickSphere(mouse.x,mouse.y);
			mouse.x = mouse.lastx = mouse.y = mouse.lasty = mouse.scroll = 0;
			mouse.click = mouse.down = false;
		});
		$('#ui').on('mousewheel.zoomCamera DOMMouseScroll.zoomCamera', function(event) {
		    event.preventDefault();
		    if (event.type == 'mousewheel') {
		        mouse.scroll += parseInt(event.originalEvent.wheelDelta);
		    }
		    else if (event.type == 'DOMMouseScroll') {
		        mouse.scroll += parseInt(event.originalEvent.detail);
		    }
		});

		// Making the gene pieces interactive, gradding them onto the grid. etc
		$('.toolbox').on('mousedown','.geneBlock',function (event) {
			event.preventDefault();
			var i,valid,element,position,	
				gene = $(this),
				geneImage = gene.find('img'),
				currentUpgrade = Evolution.prototype.all[gene.data('geneId')],
				overlayPosition = geneImage.parents('.overlay').offset(),
				mousePosition = { left:event.clientX , top:event.clientY },
				grid = Evolution.prototype.grid,
				gridElement = $('#tb_board .grid'),
				gridElementPosition = gridElement.offset(),
				gridSquareSize = Evolution.prototype.SQUARE_SIZE;

			// If gene has been placed on the board, pick it up to move it
			if(gene.hasClass('placed')) {
				element = gene;
				var mouseOffsetGrid = { left: mousePosition.left - gridElementPosition.left, top: mousePosition.top - gridElementPosition.top }

				// if the grid point you clicked on isn't actually this element, mousedown on the gridpoint owner and stop this at once
				if(!grid[Math.floor(mouseOffsetGrid.left/10)][Math.floor(mouseOffsetGrid.top/10)]) {
					event.stopImmediatePropagation();
					return false;
				}
				else if(grid[Math.floor(mouseOffsetGrid.left/10)][Math.floor(mouseOffsetGrid.top/10)].id != currentUpgrade.id) {
					currentUpgrade = grid[Math.floor(mouseOffsetGrid.left/10)][Math.floor(mouseOffsetGrid.top/10)];
					element = gene = $('.gene_'+currentUpgrade.id,gridElement);
					geneImage = gene.find('img');
				}

				for(i = 0; i < currentUpgrade.gene.shape.length; i++) {
					delete grid[currentUpgrade.gene.shape[i].x + currentUpgrade.gene.placement.x][currentUpgrade.gene.shape[i].y + currentUpgrade.gene.placement.y];
					$('.geneBlock.active.gene_'+currentUpgrade.id).removeClass('used');
					currentUpgrade.gene.used = false;
				}
				currentUpgrade.gene.validPlacement = false;
				var elementOffset = element.offset();
				position = { left: elementOffset.left - overlayPosition.left, top: elementOffset.top - overlayPosition.top};				   
			}
			// If gene is in the 'toolshed', pick up a copy
			else {
				if(currentUpgrade.gene.used)
					return false;
				else
					element = gene.clone(true).removeClass('active').empty().append(geneImage.clone());
				position = { left: mousePosition.left - overlayPosition.left - geneImage.width(), top: mousePosition.top - overlayPosition.top - geneImage.height()};
			}

			geneImage.parents('.toolbox').append(element);
			element.addClass('dragging').css('top',position.top).css('left', position.left);

			currentUpgrade.gene.placement = new gridPoint();
			gridElementPosition.top -= overlayPosition.top;
			gridElementPosition.left -= overlayPosition.left;

			$('.toolbox').on('mousemove.toolbox',null,{position:position,gridSquareSize:gridSquareSize,gridElement:gridElement,gridElementPosition:gridElementPosition,element:element,mousePosition:mousePosition,currentGene:currentUpgrade.gene}, function (event) {
				event.data.position.left += event.clientX - event.data.mousePosition.left;
				event.data.position.top += event.clientY - event.data.mousePosition.top;
				event.data.mousePosition.left = event.clientX;
				event.data.mousePosition.top = event.clientY;
				if(event.data.gridElementPosition.left - gridSquareSize/2 < event.data.position.left && event.data.gridElementPosition.top - gridSquareSize/2 < event.data.position.top &&
				  event.data.gridElementPosition.left + event.data.gridElement.width() + gridSquareSize/2 > event.data.position.left + event.data.currentGene.width*gridSquareSize && event.data.gridElementPosition.top + event.data.gridElement.height() + gridSquareSize/2 > event.data.position.top + event.data.currentGene.height*gridSquareSize) {
					event.data.currentGene.placement.x = Math.round((event.data.position.left - event.data.gridElementPosition.left) / 10);
					event.data.currentGene.placement.y = Math.round((event.data.position.top - event.data.gridElementPosition.top) / 10);
					event.data.element.css('left',event.data.gridElementPosition.left + event.data.currentGene.placement.x*gridSquareSize - 1)
						.css('top',event.data.gridElementPosition.top + event.data.currentGene.placement.y*gridSquareSize - 1);
					valid = true;
					for(i = 0; i < event.data.currentGene.shape.length; i++)
						if(grid[event.data.currentGene.shape[i].x + event.data.currentGene.placement.x][event.data.currentGene.shape[i].y + event.data.currentGene.placement.y]) 
							valid = false;

					if(valid) {
						event.data.element.addClass('valid');
						event.data.currentGene.validPlacement = true;								
					} else if(event.data.currentGene.validPlacement) {
						event.data.element.removeClass('valid');
						event.data.currentGene.validPlacement = false;							
					}
				}
				else {
					if(event.data.currentGene.validPlacement) {
						event.data.element.removeClass('valid');
						event.data.currentGene.validPlacement = false;							
					}
					event.data.element.css('left',event.data.position.left).css('top',event.data.position.top);
				}
			});
			$(document).on('mouseup.toolbox',null,{gridSquareSize:gridSquareSize,currentGene:currentUpgrade.gene,currentUpgrade:currentUpgrade,element:element,gridElement:gridElement}, function (event) {
				if(event.data.currentGene.validPlacement) {
					$('.geneBlock.active.gene_'+event.data.currentUpgrade.id).addClass('used');
					event.data.currentUpgrade.gene.used = true;
					for(i = 0; i < event.data.currentGene.shape.length; i++) {
						grid[event.data.currentGene.shape[i].x + event.data.currentGene.placement.x][event.data.currentGene.shape[i].y + event.data.currentGene.placement.y] = event.data.currentUpgrade;
					}
					event.data.element.removeClass('valid dragging').addClass('placed').css('left',event.data.currentGene.placement.x * gridSquareSize).css('top',event.data.currentGene.placement.y * gridSquareSize).appendTo(event.data.gridElement);
				} else {
					event.data.element.remove();
				}
				$('.toolbox').off('mousemove.toolbox');
				$(document).off('mouseup.toolbox');
			});

			/*if(gene.hasClass('placed')) {
				$('.toolbox').triggerHandler('mousemove');
			}*/
		});

        //UI.interfaceParts.evolveMenu_button.element.trigger('click');
        //UI.interfaceParts.mutateMenu_button.element.trigger('click');

        // This is where we open the strain select/start game prompt. Auto-start for now.
        Simulator.start('strain-zombie');
	}

   	// Function that runs on every frame, sending mouse movement from UI as coordinates to the renderer to move 3-d elements around
	Renderer.onRender(function() {
		if(!status.pauseRenderer) {
			if(mouse.down) {
				Renderer.moveCamera(mouse.lastx - mouse.x, mouse.lasty - mouse.y);
				mouse.lastx = mouse.x;
				mouse.lasty = mouse.y;
			}
			if(mouse.scroll) {
				Renderer.zoomCamera(-mouse.scroll);
				mouse.scroll = 0;
			}
		} 
		else
			Renderer.stopCameraMovement();
	});

	function addDataField(id,type,options) {
		if(arguments.length == 1) {
			var type = arguments[0],
				id = null;
		}
		// If second parameter is not a string and there are only two arguments, ID got left out
		if(arguments.length == 2 && !arguments[1].substring) { 
			var options = arguments[1],
				type = arguments[0],
				id = null;
		}
		var newDataField = new DataField(id,type,options);
		dataFieldsRoot.push(newDataField);
		return newDataField;
	}

	function updateUI(dataField,data) {
		if(data['money']) {
			var money = parseInt(data['money']);
			for(var i = 0; i < Evolution.prototype.selectedUpgrades.length; i++)
				money -= Evolution.prototype.all[Evolution.prototype.selectedUpgrades[i]].cost;
			status.money = money;
		}
		if(dataField.visible) {
			// Refresh the evolution menu if it is visible so you get updated availability of evolutions as you make money etc. 
			if(dataField.id == 'evolveMenu') {
				Evolution.prototype.refresh();
			}

			// Recurse into a visible datafield's children
			for(var i = 0, n = dataField.children.length; i < n; i++) {
				updateUI(dataField.children[i],data);
			}
			if(dataField.dynamic) {
				if(dataField.dynamic == 'money') {
					dataField.val(status.money);
				}
				else
					dataField.val(data[dataField.dynamic]);				
			}
		}
	}

	return {
		load: load,
		interfaceParts: interfaceParts,
		upgrades: Evolution.prototype.all,
		addDataField: addDataField,
		status: status,
		addEvolution: function(name,runOnClick,options) {
			var newEvolution = new Evolution(name,runOnClick,options);
			return newEvolution;
		},
		setSimulator: function(S) {
			Simulator = S;
			DataField.prototype.Simulator = S;
			Upgrade.prototype.Simulator = S;
		},
		init: function(onComplete) {
			var preload_html = '<div id="progress"><div class="progressbar pace"><div class="pace-progress"></div></div><p></p></div>';
			$("#ui").css('display','block').append($(preload_html));
			onComplete();
			/*
			$.ajax({
				url : 'ui/preload.htm',
				dataType: 'html',
				success : function (data) {
					$("#ui").html(data);
					onComplete();
				}
			});*/
		},
		updateUI: function(data) {
			for(var i = 0, n = dataFieldsRoot.length; i < n; i++) {
				updateUI(dataFieldsRoot[i],data);
			}

			if(status.mutateGridSize < data['gridSize']) {
				Evolution.prototype.gridSize = status.mutateGridSize = data['gridSize'];
				if(!Evolution.prototype.grid)
					Evolution.prototype.grid = [];
				// Create the grid storage object for keeping track of each gene location
				while(Evolution.prototype.grid.length < data['gridSize']) {
					Evolution.prototype.grid.push([]);
				}
				$('#tb_board .grid', Evolution.prototype.mutationMenu.element).css('width',data.gridSize*Evolution.prototype.SQUARE_SIZE).css('height',data.gridSize*Evolution.prototype.SQUARE_SIZE);
			}
		},
		addNews: function(item) {
			if(arguments.length == 0)
				console.error('no language item id defined');
			else {
				if(arguments.length > 1) 
					var langStr = i18n.t('messages:'+item, { postProcess: "sprintf", sprintf: Array.prototype.slice.call(arguments,1) });
				else
					var langStr = i18n.t('messages:'+item);

				interfaceParts['newsTicker'].element.prepend($('<p>'+langStr+'</p>'));				
			}
		},
		// Call with alert id followed by the data to fill the alert with, any number of parameters.
		alert: function(item) {
			if(arguments.length == 0)
				console.error('no language item id defined');
			else {
				if(arguments.length > 1) 
					var dom = $(i18n.t('dom:alerts.'+item, { postProcess: "sprintf", sprintf: Array.prototype.slice.call(arguments,1) }));
				else
					var dom = $(i18n.t('dom:alerts.'+item));

				interfaceParts['alert'].element.append(dom)
				interfaceParts['alert'].display();
			}
		},
		addMutationGridOverlay: function(x,y) {
			var overlay = $('<div class="grid_overlay"></div>');
			if(!x)
				overlay.css('width', '100%');
			else 
				overlay.css('width', Evolution.prototype.SQUARE_SIZE);
			if(!y)
				overlay.css('height', '100%');
			else 
				overlay.css('height', Evolution.prototype.SQUARE_SIZE);

			if(!x)
				overlay.css('left', '0px');
			else
				overlay.css('left', Evolution.prototype.SQUARE_SIZE * x);
			if(!y)
				overlay.css('top', '0px');
			else
				overlay.css('top', Evolution.prototype.SQUARE_SIZE * y);
			
			$('.toolbox .grid').append(overlay);
		}
	};
}