/*
	UI handlers and functions.
	Interfaces with Renderer object to get coordinates on sphere, create 3d elements etc. Should be created within document.onready
	Dependencies: jQuery, Renderer.js, Three.js
	Parameters:
		Renderer -- Reference to the Renderer object so that the UI can send commands to it
*/
/* exported UserInterface */

Date.prototype.getMonthName = function() {
	return i18n.t('ui:dates.month_names.'+this.getMonth());
};
Date.prototype.getMonthNameShort = function() {
	return i18n.t('ui:dates.month_names_short.'+this.getMonth());
};

function DataField(id,options,parent) {
	var newElement, fullElement,
		className = 'dataField';

	if(typeof id == 'object') {
		options = id;
		id = undefined;
	}

	if(!id)
		id = '_' + Object.keys(this.interfaceParts).length;
	this.interfaceParts[id] = this;
	this.id = id;
	className += ' dataField-'+id;

	if(options && options.type) {
		this.dataType = options.type;
		delete options.type;
	}
	className += ' dataField-'+this.dataType;

	this.children = [];

	switch(this.dataType) {
		case 'text':
			newElement = $(i18n.t('dom:interface.dataField.text'));
		break;

		case 'p':
			newElement = $(i18n.t('dom:interface.dataField.paragraph'));
		break;

		case 'progressBar':
			newElement = $(i18n.t('dom:interface.dataField.progressBar'));
		break;
		case 'button':
			newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'a', className:className+' button tiny' }));
		break;
		case 'accordion':
			newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'dl', className:className+' accordion' })).attr('data-accordion','');
		break;
		case 'accordion_child':
			newElement = $(i18n.t('dom:interface.dataField.default',{ element:'div', className:className }));
			fullElement = $(i18n.t('dom:interface.dataField.default',{ element:'dd', className:'' })).append(newElement);
		break;
		default:
			newElement = fullElement = $(i18n.t('dom:interface.dataField.default',{ element:this.dataType, className:className }));
	}

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
	this.fullElement = fullElement;

	if(options)
		for (var key in options)
			if (options.hasOwnProperty(key)) {
				this[key] = options[key];

				if(typeof(options[key]) === 'function')
					this[key].bind(this);
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
		fullElement.on('click',this.onClick.bind(this));
	if(this.onHover)
		fullElement.on('mouseover',this.onHover.bind(this));
	if(this.overlay) {
		fullElement.addClass('overlay');
		this.visible = false;
	}
	if(this.opens)
		for(var i = 0; i < this.opens.length; i++)
			this.opens[i].opener = this;
	if(!this.visible)
		newElement.css('display','none');
	if(this.mousePriority) {
		var that = this;
		newElement
			.mouseenter(function() {
				that.UIStatus.mouse.bound = newElement;
			})
			.mouseleave(function() {
				that.UIStatus.mouse.bound = null;
			});
	}

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
	mousePriority:false,
	interfaceParts: null,
	UIStatus: null,
	remove: function() {
		this.fullElement.remove();
		delete this.interfaceParts[this.id];
	},
	addDataField: function(id,options) {
		if(typeof id == 'object') {
			options = id;
			id = undefined;
		}

		var newDataField = new DataField(id,options,this);
		return newDataField;
	},
	display: function(recursive) {
		var i;

		if(this.onDisplay)
			this.onDisplay();
		if(this.parent && this.parent.singleChild)
			for(i = 0; i < this.parent.children.length; i++)
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
			$('#ui_mask').css('visibility','visible').on('click.closeOverlay', function () {
				that.hide();
			});
			this.UIStatus.pauseRenderer = true;
			if(this.Simulator)
				this.Simulator.pause();
		}

		this.element.css('display','');
		this.visible = true;
		if(recursive)
			for(i = 0; i < this.children.length; i++)
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
};

function Evolution(name,levels,options) {
	var i,j,evol = this;

	if(!options)
		options = {};

	options.type = 'div';
	// Inherit the DataField class
	DataField.call( this, '_evol'+name, options, this.evolveMenu );
	// Save the process function to the Evolution object
	this.name = name;

	// Clear classes from the original element so it may be cloned for all the levels of the evolution object
	this.element.attr('class','');

	var evolutionTooltip = function(event) {
		var data = event.data.all[$(this).data('id')];
		var toolTipContent = $('<table/>');
		toolTipContent.append($('<tr><th colspan="2">'+data.name+'</th></tr>'));
		if(data.cost > 0)
			toolTipContent.append($('<tr><td>Cost</td><td>'+data.cost+'</td></tr>'));
		if(data.gene)
			toolTipContent = toolTipContent.append($('<tr><td>Gene</td></tr>').append($('<td/>').append(data.gene.imageElement)));

		toolTipContent.append($('<tr><td colspan="2">'+data.description+'</td></tr>'));
		evol.showToolTip(toolTipContent,$(this),200);
	};

	var evolutionSelect = function(event) {
		event.preventDefault();
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
	};

	for(i = 0; i < levels.length; i++) {
		var currentId = levels[i].id;

		if(!levels[i].style)
			levels[i].style = {};

		// Create the evolution upgrade button in the menu
			// Clone a div element for each level so it can be treated as a separate evolution
		var currentElement = this.element.clone().addClass(/*'evolutionButton_' + this.name + ' */'evolutionButton_' + currentId).appendTo(this.evolveMenu.element);
		var icon = currentElement.append('<a class="evoIcon" />').css('background-position', ((levels[i].style.bg || this.defaultStyle.bg)*30) + 'px 0').data('id',currentId);


		this.all[currentId] = levels[i];
		if(this.all[currentId].gene)
			this.all[currentId].gene = {
				shape: levels[i].gene.shape,
				color: levels[i].gene.color,
				height: levels[i].gene.height,
				width: levels[i].gene.width,
			};
			
		this.all[currentId].evolution = this;
		this.all[currentId].element = currentElement;
		this.all[currentId].children = [];

		// Draw gene shape image, (the tetris peices)
		if(this.all[currentId].gene) {
			// Get canvas for drawing the image
			var imageCtx = this.imageCanvas.getContext('2d'),
				currPoint;
			// Clear the last gene graphic and set the canvas size to the final shape size
			this.imageCanvas.height = this.SQUARE_SIZE * this.all[currentId].gene.height;
			this.imageCanvas.width = this.SQUARE_SIZE * this.all[currentId].gene.width;

			// Drawing styles
			switch(this.all[currentId].gene.color) {
				case 'red':
					imageCtx.fillStyle = 'rgba(120, 0, 0, 255)';
					imageCtx.strokeStyle = 'rgba(255, 0, 0, 255)';
					break;
				case 'green':
					imageCtx.fillStyle = 'rgba(30, 150, 30, 255)';
					imageCtx.strokeStyle = 'rgba(0, 220, 0, 255)';
					break;
				case 'blue':
					imageCtx.fillStyle = 'rgba(0, 30, 220, 255)';
					imageCtx.strokeStyle = 'rgba(20, 80, 255, 255)';
					break;
				case 'yellow':
					imageCtx.fillStyle = 'rgba(220, 150, 0, 255)';
					imageCtx.strokeStyle = 'rgba(255, 255, 0, 255)';
					break;
				case 'purple':
					imageCtx.fillStyle = 'rgba(170, 0, 160, 255)';
					imageCtx.strokeStyle = 'rgba(255, 0, 220, 255)';
					break;
				case 'grey':
					imageCtx.fillStyle = 'rgba(160, 180, 180, 255)';
					imageCtx.strokeStyle = 'rgba(230, 230, 230, 255)';
					break;
			}
			imageCtx.lineWidth = 1;

			// array for removing points that are not on the outside
			var borders = [];
			// For each point, draw a square at the coordinates
			for(j = 0; j < this.all[currentId].gene.shape.length; j++) {
				currPoint = this.all[currentId].gene.shape[j];
				imageCtx.beginPath();
				imageCtx.rect(currPoint.x*this.SQUARE_SIZE, currPoint.y*this.SQUARE_SIZE, this.SQUARE_SIZE, this.SQUARE_SIZE);
				imageCtx.fill();
				borders[currPoint.y*this.all[currentId].gene.width + currPoint.x] = j;
			}
			for(j = 0; j < borders.length; j++) {
				if(borders[j] !== undefined) {
					currPoint = this.all[currentId].gene.shape[borders[j]];
					if(borders[j - 1] === undefined || currPoint.x === 0) {
						imageCtx.beginPath();
						imageCtx.moveTo(currPoint.x*this.SQUARE_SIZE + 0.5,currPoint.y*this.SQUARE_SIZE );
						imageCtx.lineTo(currPoint.x*this.SQUARE_SIZE + 0.5,(currPoint.y+1)*this.SQUARE_SIZE );
						imageCtx.stroke();
					}
					if(borders[j - this.all[currentId].gene.width] === undefined || currPoint.y === 0) {
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

		// Add gene graphic to evolution panel icons
		if(this.all[currentId].gene) {
			var geneGraphic = this.all[currentId].gene.imageElement.clone();
			currentElement.append(geneGraphic.addClass('geneIcon').css('bottom',this.imageCanvas.height/-2).css('right',this.imageCanvas.height/-2));
		}

		// Mouseover tooltip for evolution
		icon.on('mouseover.evolutionTooltip', this, evolutionTooltip);

		// Click event for evolution in the upgrade menu
		icon.on('click.evolutionSelect', { Simulator: this.Simulator, evolution: this }, evolutionSelect);

	}
	this.element.remove();
	this.element = $('.evolutionButton_' + name, this.evolveMenu.element);
}
// Inherit the DataField class
Evolution.prototype = Object.create( DataField.prototype );
Evolution.prototype.defaultStyle = {
	bg: 0,
	offset: [0,0]
};
Evolution.prototype.all = {};
Evolution.prototype.selectedUpgrades = [];
Evolution.prototype.mutation = [];

// Prototype properties for drawing gene shapes
Evolution.prototype.SQUARE_SIZE = 10;
// Canvas to draw the shape on
Evolution.prototype.imageCanvas = document.createElement( 'canvas' );
Evolution.prototype.imageCanvas.width = 100;
Evolution.prototype.imageCanvas.height = 100;
Evolution.prototype.connectorArrow = new Image();
Evolution.prototype.connectorArrow.src = './ui/evol_arrow.png';

Evolution.prototype.refresh = function() {
	var available = this.Simulator.availableUpgrades(this.selectedUpgrades);
	this.evolveMenu.element.find('.available').removeClass('available');
	for (var key in this.all)
		if (this.all.hasOwnProperty(key)) {
			this.all[key].available = false;
			if(this.all[key].active || this.all[key].selected)
				this.all[key].element.addClass('active');
		}

	for(var i = 0; i < available.length; i++) {
		this.all[available[i]].element.addClass('available');
		this.all[available[i]].available = true;
	}
};
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
				var current = $('#tb_gene',this.mutationMenu.element).clone().removeAttr('id').addClass('active geneBlock gene_'+upgrade.id).data('geneId',upgrade.id);
				$('img',current).replaceWith(upgrade.gene.imageElement.clone());
				$('.name',current).html(upgrade.name);
				upgrade.gene.element = current;

				this.mutationMenu.element.append(current);
			}
		}
		delete upgrade.selected;
	}
	this.evolveMenu.element.find('.available').removeClass('available');
};

Evolution.prototype.refreshGenes = function() {
	var i,j,n;
	for(i = 0, n = this.mutation.length; i < n; i++) {
		var geneElement = $('.geneBlock.active.gene_'+this.mutation[i].upgrade),
			geneImage = geneElement.find('img'),
			currentUpgrade = this.all[this.mutation[i].upgrade],
			//overlayPosition = geneImage.parents('.overlay').offset(),
			gridElement = $('#tb_board .grid'),
			//gridElementPosition = gridElement.offset(),
			gridSquareSize = this.SQUARE_SIZE;

		currentUpgrade.gene.placement = this.mutation[i].placement;
		currentUpgrade.gene.used = true;

		var element = geneElement.clone(true).removeClass('active').empty().append(geneImage.clone());
		element.css('left',currentUpgrade.gene.placement.x*gridSquareSize)
			.css('top',currentUpgrade.gene.placement.y*gridSquareSize).addClass('placed').appendTo(gridElement);
		geneElement.addClass('used');

		for(j = 0; j < currentUpgrade.gene.shape.length; j++) {
			this.grid[currentUpgrade.gene.shape[j].x + currentUpgrade.gene.placement.x][currentUpgrade.gene.shape[j].y + currentUpgrade.gene.placement.y] = currentUpgrade;
		}
	}
};
Evolution.prototype.mutate = function() {
	this.mutation.length = 0;
	for (var key in this.all)
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
};
Evolution.prototype.cleanMutation = function() {
	this.clearGrid();
};
Evolution.prototype.clearGrid = function() {
	for (var key in this.all)
		if (this.all.hasOwnProperty(key) && this.all[key].gene && this.all[key].gene.used) {
			this.all[key].gene.used = false;
			delete this.all[key].gene.placement;
		}
	for (var i = 0; i < this.grid.length; i++) {
		this.grid[i].length = 0;
	}
	$('.geneBlock.placed').remove();
	$('.geneBlock.active').removeClass('used');
};

Evolution.prototype.buildWeb = function(focusUpgrade) {
	var upgradeDistance = 80,
		arrowLength = Evolution.prototype.connectorArrow.width/2,
		evolutionBg = this.imageCanvas;
	evolutionBg.width = this.evolveMenu.element.width();
	evolutionBg.height = this.evolveMenu.element.height();
	$('.connector, .arrows',this.evolveMenu.element).remove();

	var bgCtx = evolutionBg.getContext('2d');
	bgCtx.clearRect(0, 0, evolutionBg.width, evolutionBg.height);

	var i,key,
		E = this;

	var placeUpgrades = function(upgrade, position, lastTheta, depth) {
		var currentOffset = upgrade.style.offset || E.defaultStyle.offset;
		if(!upgrade.position) {
			upgrade.position = {
				top: position.top + currentOffset[1],
				left: position.left + currentOffset[0]
			};
			upgrade.element.css('top', upgrade.position.top).css('left', upgrade.position.left);
		}

		// Scroll to put the upgrade to focus on in the middle
		if(upgrade.id == focusUpgrade) {
			E.evolveMenu.element.css('margin-left', -upgrade.position.left).css('margin-top', -upgrade.position.top);
		}
		
		depth++;
		for(var i = 0, n = upgrade.children.length; i < n; i++) {
			var currentChild = upgrade.children[i],
				theta = lastTheta + 2 * Math.PI * ( Math.ceil( i / 2 ) / n ) / depth * (1 - i % 2 * 2 ),
				childPosition = {
					top: upgrade.position.top + Math.round( upgradeDistance * Math.sin(theta) ),
					left: upgrade.position.left + Math.round( upgradeDistance * Math.cos(theta) )
				};

			placeUpgrades(currentChild, childPosition, theta, depth);
		}

		return upgrade.position;
	};

	var drawUpgradeConnectors = function(upgrade) {
		var i,n,x,y,
			maxWidth = 4,
			maxHeight = 4;
		for(i = 0, n = upgrade.children.length; i < n; i++) {
			x = upgrade.children[i].position.x = (upgrade.children[i].position.left - upgrade.position.left);
			y = upgrade.children[i].position.y = (upgrade.children[i].position.top - upgrade.position.top);
			x = Math.abs(x);
			y = Math.abs(y);

			maxWidth = x > maxWidth ? x : maxWidth;
			maxHeight = y > maxHeight ? y : maxHeight;
		}

		var bgCtx = evolutionBg.getContext('2d');

		var drawArrow = function (startX, startY, moveVector) {
			var theta = Math.atan2(moveVector.y,moveVector.x);
			bgCtx.save();

			bgCtx.translate(startX, startY);
			bgCtx.rotate(theta);
			bgCtx.drawImage(Evolution.prototype.connectorArrow, -(arrowLength), -(arrowLength));

			bgCtx.restore();

			delete moveVector.x;
			delete moveVector.y;
		};

		var drawConnector = function (startX, startY, moveVector) {
			bgCtx.save();
			bgCtx.translate(startX, startY);

			bgCtx.lineWidth = 4;
			bgCtx.strokeStyle = 'rgba(95,66,16,255)';
			bgCtx.beginPath();
			bgCtx.moveTo(0, 0);
			bgCtx.lineTo(moveVector.x, moveVector.y);
			bgCtx.stroke();

			bgCtx.lineWidth = 1;
			bgCtx.strokeStyle = 'rgba(188,128,28,255)';
			bgCtx.beginPath();
			bgCtx.moveTo(0, 0);
			bgCtx.lineTo(moveVector.x, moveVector.y);
			bgCtx.stroke();
			bgCtx.restore();
		};

		evolutionBg.width = maxWidth*2;
		evolutionBg.height = maxHeight*2;
		maxWidth = Math.floor(maxWidth) + 0.5;
		maxHeight = Math.floor(maxHeight) + 0.5;
		for(i = 0, n = upgrade.children.length; i < n; i++) {
			drawConnector(maxWidth, maxHeight, upgrade.children[i].position);
		}
		upgrade.element.append($('<img class="connector" />').attr('src', evolutionBg.toDataURL()).css('left', evolutionBg.width/-2).css('top', evolutionBg.height/-2));

		evolutionBg.width = arrowLength*2;
		evolutionBg.height = arrowLength*2;
		for(i = 0, n = upgrade.children.length; i < n; i++) {
			drawArrow(arrowLength + 0.5, arrowLength + 0.5, upgrade.children[i].position);
		}
		upgrade.element.append($('<img class="arrows" />').attr('src', evolutionBg.toDataURL()).css('left', -arrowLength).css('top', -arrowLength));
	};


	// Figure out where to put the starting points.
	var startingUpgrades = [];
	for (key in this.all)
		if (this.all.hasOwnProperty(key)) {
			var current = this.all[key];
			if(!current.paths.length)
				startingUpgrades.push(current);
			else {
				for(i = 0; i < current.paths.length; i++) {
					if(this.all[current.paths[i]] === undefined) {
						if(typeof current.paths[i] !== 'object') {
							console.warn('Cannot find upgrade with ID "' + current.paths[i] + '", path removed');
							current.paths.splice(i,1);
							i--;
						}
					} else {
						current.paths[i] = this.all[current.paths[i]];
						current.paths[i].children.push(current);
					}
					if(!current.paths.length) {
						current.element.hide();
					}
				}
			}
		}

	var position = {
		left:0,
		top:0
	};

	for(i = 0; i < startingUpgrades.length; i++) {
		placeUpgrades(startingUpgrades[i], position, 0, 0);
	}
	for (key in this.all)
		if (this.all.hasOwnProperty(key))
			drawUpgradeConnectors(this.all[key]);
};

var UserInterface = function UserInterface(Renderer) {
	var sphere_coords,
		interfaceParts = {},
		status = {
			mouse: { x:0, y:0, lastx:0, lasty:0, down:false, click: false, scroll: 0, bound: null },
			pauseRenderer: false,
			showToolTip: false,
			toolTipMode: '',
			mutateGridSize: 0
		};

	/*
		Parameter is a function that takes one paramater, a function that takes a dataPoint and returns a string.
		You will call this function to set up a tooltip that returns a property of a point on the planet
	*/
	var activatePlanetTooltip = function(getPointInfo) {
		$('#ui').off('mousemove.render_tooltip');
		$('#ui').on('mousemove.render_tooltip', null, getPointInfo, function(event) {
			status.mouse.x = event.clientX;
			status.mouse.y = event.clientY;
			sphere_coords = Renderer.getSphereCoords(status.mouse.x,status.mouse.y,200);
			if(sphere_coords && !isNaN(sphere_coords[0]) && !isNaN(sphere_coords[1]) && !status.pauseRenderer) {
				$('#render_tooltip').css('top',status.mouse.y+10).css('left',status.mouse.x+30);
				//$('#tooltip').css('display','block').html('asf');
				var point = Renderer.coordsToPoint(sphere_coords[0],sphere_coords[1]);

				if(point !== undefined && (!point.water || point.total_pop > 0)) {
					if($('#render_tooltip').css('visibility') != 'visible')
						$('#render_tooltip').css('visibility','visible');
					$('#render_tooltip').html(event.data(point));

					// Debug information to mouse over points
					if(debugMenu.console.options.mouseOverDebugData) {
						$('#render_tooltip').html(JSON.stringify(point,
							function(key,value) {
								if(key == 'adjacent' || key == 'renderer')
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
		});
	},

	deactivatePlanetTooltip = function() {
		hideTooltip();
		$('#ui').off('mousemove.render_tooltip');
	},

	addDataField = function(id,options) {
		var newDataField = new DataField(id,options);
		return newDataField;
	},

	updateUI = function(dataField,data) {
		if(data.money) {
			var money = parseInt(data.money);
			for(i = 0; i < Evolution.prototype.selectedUpgrades.length; i++)
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
	},

	hideTooltip = function() {
		$('#tooltip').css('visibility','hidden');
	};

	DataField.prototype.showToolTip = function (text,element,width) {
		if(!element)
			element = this.element;
		var position = element.offset();

		var tooltip = $('#tooltip');
		if(tooltip.css('visibility') == 'hidden' && text) {
			tooltip.empty();
			if(width)
				tooltip.css('width',width);
			if(text.appendTo)
				tooltip.append(text);
			else
				tooltip.html(text);
			tooltip.css('top',position.top - (tooltip.height() + 20)).css('left',position.left).addClass('');
			tooltip.css('display','none').css('visibility','visible').fadeIn('fast');
		}

		element.on('mouseout',this ,function (event) {
			event.data.hideTooltip();
		});
	};
	DataField.prototype.hideTooltip = hideTooltip;
	DataField.prototype.interfaceParts = interfaceParts;
	DataField.prototype.UIStatus = status;

	// Function that runs on every frame, sending mouse movement from UI as coordinates to the renderer to move 3-d elements around
	Renderer.onRender(function() {
		if(!status.pauseRenderer) {
			if(status.mouse.down) {
				Renderer.moveCamera(status.mouse.lastx - status.mouse.x, status.mouse.lasty - status.mouse.y);
				status.mouse.lastx = status.mouse.x;
				status.mouse.lasty = status.mouse.y;
			}
			if(status.mouse.scroll) {
				Renderer.zoomCamera(-status.mouse.scroll);
				status.mouse.scroll = 0;
			}
		}
		else
			Renderer.stopCameraMovement();
	});

	return {
		interfaceParts: interfaceParts,
		upgrades: Evolution.prototype.all,
		addDataField: addDataField,
		status: status,
		toggleGlobeTooltip: function(activate,getPointInfo) {
			if(activate)
				activatePlanetTooltip(getPointInfo);
			else
				deactivatePlanetTooltip();
		},
		addEvolution: function(name,runOnClick,options) {
			var newEvolution = new Evolution(name,runOnClick,options);
			return newEvolution;
		},
		updateEvolution: function(id,property,value) {
			Evolution.prototype.all[id][property] = value;
		},
		processUpgrades: function(focusUpgrade) {
			Evolution.prototype.buildWeb(focusUpgrade);
		},
		setSimulator: function(S) {
			DataField.prototype.Simulator = S;
		},
		updateUI: function(data) {
			for (var key in interfaceParts)
				if (interfaceParts.hasOwnProperty(key)) {
					updateUI(interfaceParts[key],data);
				}

			if(status.mutateGridSize < data.gridSize) {
				Evolution.prototype.gridSize = status.mutateGridSize = data.gridSize;
				if(!Evolution.prototype.grid)
					Evolution.prototype.grid = [];
				// Create the grid storage object for keeping track of each gene location
				while(Evolution.prototype.grid.length < data.gridSize) {
					Evolution.prototype.grid.push([]);
				}
				$('#tb_board .grid', Evolution.prototype.mutationMenu.element).css('width',data.gridSize*Evolution.prototype.SQUARE_SIZE).css('height',data.gridSize*Evolution.prototype.SQUARE_SIZE);
			}
		},
		addNews: function(item) {
			if(arguments.length === 0)
				console.error('no language item id defined');
			else {
				var langStr;
				if(arguments.length > 1)
					langStr = i18n.t('messages:'+item, { postProcess: 'sprintf', sprintf: Array.prototype.slice.call(arguments,1) });
				else
					langStr = i18n.t('messages:'+item);

				interfaceParts.newsTicker.element.prepend($('<p>'+langStr+'</p>'));
			}
		},
		// Call with alert id followed by the data to fill the alert with, any number of parameters.
		alert: function(item) {
			if(arguments.length === 0)
				console.error('no language item id defined');
			else {
				var dom;
				if(arguments.length > 1)
					dom = $(i18n.t('dom:alerts.'+item, { postProcess: 'sprintf', sprintf: Array.prototype.slice.call(arguments,1) }));
				else
					dom = $(i18n.t('dom:alerts.'+item));

				interfaceParts.alert.element.append(dom);
				interfaceParts.alert.display();
				return interfaceParts.alert;
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
};