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

var UserInterface = function UserInterface(Renderer) {
	var S,
		sphere_coords,
		interfaceParts = {},
		status = {
			gridSize: 0
		},
		UIstatus = {
			mouse: { x:0, y:0, lastx:0, lasty:0, down:false, click: false, scroll: 0, bound: null },
			pauseRenderer: false
		},
		changedStatus = {
		};

	var DataField = function (id,config,parent) {
		var className = 'dataField';

		if(typeof id == 'object') {
			config = id;
			id = undefined;
		}
		if(!id)
			id = '_' + Object.keys(interfaceParts).length;

		interfaceParts[id] = this;
		this.id = id;
		className += ' dataField-'+id;

		if(!config) 
			config = {}

		if(!config.type)
			config.type = 'div';

		if(typeof this._typeOptions[config.type] === 'function') {
			this._merge( this._typeOptions[config.type].call(this, config) );
		} else {
			this._merge( $(i18n.t('dom:interface.dataField.default', { element: config.type })) );
		}

		for (var key in config)
			if (config.hasOwnProperty(key)) {
				this[key] = config[key];

				if(this._options[key] !== undefined)
					this._options[key].call(this, config[key]);
			}

		className += ' dataField-'+this.type;
		this.addClass(className).addClass(this.class);

		parent.append(this);
		this.parent = parent;

		return this;
	};

	DataField.prototype = Object.create($.extend({}, $.prototype, {
		dynamic: false,
		mousePriority:false,
		class: '',
		val: function(value) {
			if(value) {
				if(this.find('input').length)
					this.find('input').val(value);
				else
					this.filter('input').val(value);
				this.value = value;
			}
			else
				return this.value;
		},
		addDataField: function(id,options) {
			if(typeof id == 'object') {
				options = id;
				id = undefined;
			}

			var newDataField = new DataField(id, options, this);
			return newDataField;
		},
		showToolTip: function(text,width) {
			var position = this.offset();

			var tooltip = $('#tooltip');

			tooltip.empty();
			if(width)
				tooltip.css('width',width);
			if(text instanceof jQuery)
				tooltip.append(text);
			else
				tooltip.html(text);
			tooltip.css('top',position.top - (tooltip.height() + 20)).css('left',position.left).addClass('');
			tooltip.fadeIn(250);

			this.on('mouseleave', function () {
				tooltip.hide();
			});
		},
		clone: function() {
			var newDataField = Object.create(DataField.prototype, this);
			newDataField.length = 0;
			newDataField._merge(this.clone().insertAfter(this));
		},
		_typeOptions: {
			button: function(config) {
				var button = $(i18n.t('dom:interface.dataField.default',{ element:'a' })),
					label = config.label || '';
				if(label && i18n.exists(label))
					button.html(i18n.t(label));
				else
					button.html(label);
				return button;
			},
			modal: function(config) {
				var modal = $('<div id="modal-' + this.id + '" class="reveal-modal" data-reveal></div>');
				modal.on('open', this, function (event) {
					var modal = event.data;

					if(modal.onShow)
						modal.onShow.call(modal);

					UIstatus.pauseRenderer = true;
					S.pause();
				});
				modal.on('closed', this, function (event) {
					var modal = event.data;

					UIstatus.pauseRenderer = false;
					S.unPause();

					if(modal.onHide)
						modal.onHide.call(modal);
				});

				this.attachOpener = function(opener) {
					if(this.opener)
						this.opener.removeAttr('data-reveal').removeAttr('data-reveal-id');

					opener.attr('data-reveal','').attr('data-reveal-id', 'modal-' + this.id);
					this.opener = opener;
				};
				this.show = function() {
					this.foundation('reveal', 'open');
				};
				this.hide = function() {
					this.foundation('reveal', 'close');
				};
				if(config.opener)
					this.attachOpener(config.opener);


				return modal;
			},
			field: function(config) {
				var field = $('<label/>'),
					input = $('<input type="text" readonly />');

				if(config.title)
					field.html(i18n.t(config.title));
				if(config.value)
					input.val(config.value);

				field.append(input);
				return field;
			},
			progressBar: function(config) {
				var field = $('<label/>'),
					bar = i18n.t('dom:interface.dataField.progressBar');
				this.val = function(value) {
					var bar = this.find('.progress div');

					if(isNaN(value)) {
						this.addClass('text');
						bar.html(value).css('width','');
					} else {
						this.removeClass('text countdown');
						bar.html('').css('width', Math.floor(100*value) + '%');
					}
				};
				if(config.title)
					field.html(i18n.t(config.title));
				field.append(bar);

				return field;
			},
			slider: function(config) {
				var field = $('<label/>'),
					slider = $(i18n.t('dom:interface.dataField.slider',{ options: config.dataOptions || '' }));

				if(config.dynamic)
					slider.on('change', this, function(event) {
						var df = event.data,
							value = parseFloat($(this).attr('data-slider'));
						if(value != status[df.data('dynamic')]) {
							status[df.data('dynamic')] = value;
							changedStatus[df.data('dynamic')] = true;
						}
					});

				this.val = function(value) {
					this.foundation('slider', 'set_value', value);
				};

				if(config.title)
					field.html(i18n.t(config.title));
				field.append(slider);

				return field;
			},
			accordion: function() {
				var accordion = $(i18n.t('dom:interface.dataField.default',{ element:'dl' })).attr('data-accordion','').addClass('accordion');

				this._addDataField = this.addDataField;
				this.addDataField = function(id, options) {
					var accordionChild = $(i18n.t('dom:interface.dataField.default',{ element:'dd' })),
						uniqueId = 'accordion_' + Object.keys(interfaceParts).length;
					accordionChild.append($(i18n.t('dom:interface.dataField.accordionTitle',{ title: options.title, link: uniqueId })));

					options.type = 'div';

					var content = this._addDataField(id, options);
					content.addClass('content');
					content.attr('id',uniqueId);
					accordionChild.append(content);

					this.append(accordionChild);

					return content;
				};

				return accordion;
			},
			choiceToggle: function(config) {
				var alignment = 'align:' + (config.alignment || 'left'),
					label = config.label || '';

				if(label && i18n.exists(label))
					label = i18n.t(label);
				var button = $('<a href="#" data-options="' + alignment + '" data-dropdown="drop" class="dataField-button">' + label + '</a>'),
					list = $('<ul id="drop" class="f-dropdown" data-dropdown-content></ul>');

				this.addOption = function(label, onpick) {
					if(label && i18n.exists(label))
						label = i18n.t(label);

					var link = $('<a href="#">' + label + '</a>').on('click', onpick);
					this.filter('ul').append($('<li></li>').append(link));
				};

				return [button,list];
			}
		},
		_merge: function(toMerge) {
			var _this = this;

			if(toMerge instanceof jQuery)
				toMerge.each(function() {
					_this.push(this);
				});
			else
				while(toMerge.length > 0)
					_this._merge(toMerge.pop());
		},
		_options: {
			mousePriority: function(val) {
				if(val) {
					this.mouseenter(function() {
							UIstatus.mouse.bound = this;
						})
						.mouseleave(function() {
							UIstatus.mouse.bound = null;
						});
				}
			},
			tooltip: function(val) {
				this.attr('data-tooltip', '').addClass('has-tip').attr('title', val);
			},
			click: function(func) {
				var _this = this;
				_this.on('click', function() {
					func.call(_this);
				});
			},
			dynamic: function(dynamic) {
				this.data('dynamic', dynamic);
			}
		}
	}));

	var Evolutions = function () {
		var SQUARE_SIZE = 20;

		var evolutions = {},
			defaultStyle = {
				bg: 0,
				offset: [0,0],
				distance: 65,
				size: 30
			},
			selectedUpgrades = [],
			mutations = [],
			grid = [],
			imageCanvas = document.createElement( 'canvas' ),
			connectorArrow = new Image();

		imageCanvas.width = 100;
		imageCanvas.height = 100;
		connectorArrow.src = './ui/evol_arrow.png';

		var evolveMenuOuter = addDataField('evolveMenu', {
			type: 'modal',
			class: 'draggable-parent',
			title: 'Evolution',
			onShow: function() {
				refresh();
			},
			onHide: function() {
				deselectAll();
			},
			opener: interfaceParts.main_control.addDataField({
				type: 'button',
				label: 'ui:buttons.evolution'
			})
		});
		var evolveMenu = evolveMenuOuter.addDataField({
			type: 'div',
			class: 'draggable evolveMenu'
		});

		var evolveMenu_controls = evolveMenuOuter.addDataField({
			type: 'div',
			class: 'menu'
		});
		evolveMenu_controls.addDataField({
			type: 'button',
			class: 'icon cancel',
			tooltip: i18n.t('ui:evolution.cancel'),
			click: function() {
				evolveMenuOuter.hide();
			}
		});
		evolveMenu_controls.addDataField({
			type: 'button',
			class: 'icon accept',
			tooltip: i18n.t('ui:evolution.accept'),
			click: function() {
				buyEvolutions();
				evolveMenuOuter.hide();
			}
		});
		evolveMenu_controls.find('.has-tip').addClass('tip-top');

		var mutationMenu = addDataField('mutationMenu',{
			type: 'modal',
			class: 'toolbox',
			title: 'Mutation',
			onShow: function() {
				refreshGenes();
			},
			onHide: function() {
				clearGrid();
			},
			opener: interfaceParts.main_control.addDataField({
				type: 'button',
				label: 'ui:buttons.mutation'
			})
		});
		
		mutationMenu.grid = $(i18n.t('dom:interface.mutation.grid'));
		mutationMenu.piece_container = $(i18n.t('dom:interface.mutation.piece_container'));
		mutationMenu.append(mutationMenu.grid).append(mutationMenu.piece_container);

		var mutationMenu_controls = mutationMenu.addDataField({
			type: 'div',
			class: 'menu'
		});
		mutationMenu_controls.addDataField('mutationMenu_clear',{
			type: 'button',
			class: 'icon clear',
			tooltip: i18n.t('ui:mutation.clear'),
			click: function() {
				clearGrid();
			}
		});
		mutationMenu_controls.addDataField('mutationMenu_cancel',{
			type: 'button',
			class: 'icon cancel',
			tooltip: i18n.t('ui:mutation.cancel'),
			click: function() {
				mutationMenu.hide();
			}
		});
		mutationMenu_controls.addDataField('mutationMenu_submit',{
			type: 'button',
			class: 'icon accept',
			tooltip: i18n.t('ui:mutation.mutate'),
			click: function() {
				mutate();
				mutationMenu.hide();
			}
		});
		mutationMenu_controls.find('.has-tip').addClass('tip-top');
		/*
		mutationMenu_controls.addDataField('mutationMenu_submit',{
			type: 'field',
			dynamic: 'selectedMutations'
		});
		var totalPrice = 0;
		for (var key in UI.evolutions.all)
			if (UI.evolutions.all.hasOwnProperty(key) && UI.evolutions.all[key].gene && UI.evolutions.all[key].gene.used)
				if(UI.evolutions.all[key].gene.active === undefined || !UI.evolutions.mutation[UI.evolutions.all[key].gene.active].placement.equals(UI.evolutions.all[key].gene.placement))
					totalPrice += UI.evolutions.all[key].cost;
		*/

		var addNew = function(name,levels,options) {
				var i;

				if(!options)
					options = {};

				options.type = 'div';

				var evolutionTooltip = function() {
					var row, evol = evolutions[$(this).data('id')];
					var toolTipContent = $(i18n.t('dom:interface.evolution.tooltipBase', { name: evol.name }));
					if(evol.cost > 0)
						toolTipContent.append($(i18n.t('dom:interface.evolution.tooltipRow', { label: 'ui:evolution.cost', value: evol.cost })));
					if(evol.gene) {
						row = $(i18n.t('dom:interface.evolution.tooltipRow', { label: 'ui:evolution.gene', value: '' }));
						row.find('.value').append(evol.gene.imageElement);
						toolTipContent.append(row);
					}

					toolTipContent.append($(i18n.t('dom:interface.evolution.tooltipDesc')));
					evol.element.showToolTip(toolTipContent,200);
				};

				var evolutionSelect = function(event) {
					event.preventDefault();
					var i, upgradeId = $(this).data('id'),
						upgrade = evolutions[upgradeId];

					// User is buying the upgrade
					if(!upgrade.selected) {
						if(upgrade.available) {
							selectedUpgrades.push(upgradeId);
							upgrade.selected = true;
							status.money -= upgrade.cost;
							interfaceParts.money.val(status.money);
						}
					// User is undoing the purchase
					} else {
						for(i = 0; i < upgrade.children.length; i++)
							if(upgrade.children[i].selected)
								upgrade.children[i].triggerHandler('click');
						for(i = 0; i < selectedUpgrades.length; i++)
							if(selectedUpgrades[i] == upgrade.id) {
								selectedUpgrades.splice(i,1);
								status.money += upgrade.cost;
								interfaceParts.money.val(status.money);
								delete upgrade.selected;
								upgrade.element.removeClass('active');
								break;
							}
					}

					refresh();
				};

				for(i = 0; i < levels.length; i++) {
					var currentId = levels[i].id,
						currentLevel = levels[i];

					if(!currentLevel.style)
						currentLevel.style = {};

					// Create the evolution upgrade button in the menu
						// Clone a div element for each level so it can be treated as a separate evolution
					var currentElement = evolveMenu.addDataField('_evol'+name, options).addClass('evolutionButton_' + currentId);
					var icon = $('<a class="evoIcon" />')
						.css('background-position', '-' + ((currentLevel.style.bg || defaultStyle.bg)*(currentLevel.style.size || defaultStyle.size)) + 'px 0')
						.data('id',currentId).appendTo(currentElement);

					if(currentLevel.resourcePath)
						icon.css('background-image', 'url(js/modules/' + currentLevel.resourcePath + '/sprite.png)');

					if(currentLevel.style.graphic && currentLevel.resourcePath) {
						icon.append('<img src="js/modules/' + currentLevel.resourcePath + '/' + currentLevel.style.graphic + '" />');
					}
					else {
						icon.append('<img src="ui/evol_sprite.png" />');
					}

					if(currentLevel.style.size) {
						icon.add(currentElement)
							.css('height',currentLevel.style.size)
							.css('width',currentLevel.style.size);

						icon.css('border-radius',currentLevel.style.size/2);

						currentElement.css('margin-left',-(currentLevel.style.size/2)).css('margin-top',-(currentLevel.style.size/2));
					}

					evolutions[currentId] = currentLevel;
					if(currentLevel.gene)
						currentLevel.gene = {
							shape: levels[i].gene.shape,
							color: levels[i].gene.color,
							height: levels[i].gene.height,
							width: levels[i].gene.width,
						};
						
					currentLevel.element = currentElement;
					currentLevel.children = [];

					// Draw gene shape image, (the tetris peices)
					if(currentLevel.gene) {
						var img = drawGene(imageCanvas, SQUARE_SIZE, currentLevel.gene);
						var imgSmall = drawGene(imageCanvas, Math.round(SQUARE_SIZE/2.5), currentLevel.gene);

						// Copy a image elemnt for the user interface and put the gene image into it.
						currentLevel.gene.imageElement = $('<img />').attr('src', img);
						currentLevel.gene.imageThumbnail = $('<img />').attr('src', imgSmall);

						// Add gene graphic to evolution panel icons
						var geneGraphic = currentLevel.gene.imageThumbnail.clone();
						currentElement.append(geneGraphic.addClass('geneIcon').css('bottom',imageCanvas.height/-2).css('right',imageCanvas.height/-2));
					}

					// Mouseover tooltip for evolution
					icon.on('mouseenter.evolutionTooltip', evolutionTooltip);

					// Click event for evolution in the upgrade menu
					icon.on('click.evolutionSelect', evolutionSelect);

				}

				return levels;
			},

			drawGene = function(imageCanvas, squareSize, gene) {
				// Get canvas for drawing the image
				var imageCtx = imageCanvas.getContext('2d'),
					currPoint,i;
				// Clear the last gene graphic and set the canvas size to the final shape size
				imageCanvas.height = squareSize * gene.height;
				imageCanvas.width = squareSize * gene.width;

				// Drawing styles
				switch(gene.color) {
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
				for(i = 0; i < gene.shape.length; i++) {
					currPoint = gene.shape[i];
					imageCtx.beginPath();
					imageCtx.rect(currPoint.x*squareSize, currPoint.y*squareSize, squareSize, squareSize);
					imageCtx.fill();
					borders[currPoint.y*gene.width + currPoint.x] = i;
				}
				for(i = 0; i < borders.length; i++) {
					if(borders[i] !== undefined) {
						currPoint = gene.shape[borders[i]];
						if(borders[i - 1] === undefined || currPoint.x === 0) {
							imageCtx.beginPath();
							imageCtx.moveTo(currPoint.x*squareSize + 0.5,currPoint.y*squareSize );
							imageCtx.lineTo(currPoint.x*squareSize + 0.5,(currPoint.y+1)*squareSize );
							imageCtx.stroke();
						}
						if(borders[i - gene.width] === undefined || currPoint.y === 0) {
							imageCtx.beginPath();
							imageCtx.moveTo(currPoint.x*squareSize ,currPoint.y*squareSize + 0.5);
							imageCtx.lineTo((currPoint.x+1)*squareSize ,currPoint.y*squareSize + 0.5);
							imageCtx.stroke();
						}
						if(borders[i + 1] === undefined || currPoint.x == gene.width - 1) {
							imageCtx.beginPath();
							imageCtx.moveTo((currPoint.x+1)*squareSize - 0.5,currPoint.y*squareSize);
							imageCtx.lineTo((currPoint.x+1)*squareSize - 0.5,(currPoint.y+1)*squareSize);
							imageCtx.stroke();
						}
						if(borders[i + gene.width] === undefined || currPoint.y == gene.height - 1) {
							imageCtx.beginPath();
							imageCtx.moveTo(currPoint.x*squareSize,(currPoint.y+1)*squareSize - 0.5);
							imageCtx.lineTo((currPoint.x+1)*squareSize,(currPoint.y+1)*squareSize - 0.5);
							imageCtx.stroke();
						}
					}
				}

				return imageCanvas.toDataURL();
			},

			refresh = function() {
				var available = S.availableUpgrades(selectedUpgrades);
				evolveMenu.find('.available').removeClass('available');
				for (var key in evolutions)
					if (evolutions.hasOwnProperty(key)) {
						evolutions[key].available = false;
						if(evolutions[key].active || evolutions[key].selected)
							evolutions[key].element.addClass('active');
					}

				for(var i = 0; i < available.length; i++) {
					evolutions[available[i]].element.addClass('available');
					evolutions[available[i]].available = true;
				}
			},

			buyEvolutions = function() {
				var upgrade,
					success = S.purchaseUpgrades(selectedUpgrades.slice(0));
				while(selectedUpgrades.length) {
					upgrade = evolutions[selectedUpgrades.pop()];
					if(success) {
						upgrade.active = true;

						// Draw gene shape image
						if(upgrade.gene) {
							// Copy a gene for the user interface and put the gene into it.
							var current = $(i18n.t('dom:interface.mutation.piece')).addClass('active gene_'+upgrade.id).data('geneId',upgrade.id);
							$('img',current).replaceWith(upgrade.gene.imageElement.clone());
							$('.name',current).html(upgrade.name);

							mutationMenu.piece_container.append(current);
						}
					}
					delete upgrade.selected;
				}
				evolveMenu.find('.available').removeClass('available');

				refresh();
			},

			deselectAll = function() {
				while(selectedUpgrades.length) {
					var upgrade = evolutions[selectedUpgrades.pop()];
					delete upgrade.selected;
					upgrade.element.removeClass('active');
				}
			},

			refreshGenes = function() {
				var i,j,n;
				for(i = 0, n = mutations.length; i < n; i++) {
					var geneElement = $('.geneBlock.active.gene_'+mutations[i].upgrade.replace('.','\\.')),
						geneImage = geneElement.find('img'),
						currentUpgrade = evolutions[mutations[i].upgrade];

					currentUpgrade.gene.placement = mutations[i].placement;
					currentUpgrade.gene.used = true;

					var element = geneElement.clone(true).removeClass('active').empty().append(geneImage.clone());
					element.css('left',currentUpgrade.gene.placement.x*SQUARE_SIZE)
						.css('top',currentUpgrade.gene.placement.y*SQUARE_SIZE).addClass('placed').appendTo(mutationMenu.grid.find('.grid'));
					geneElement.addClass('used');

					for(j = 0; j < currentUpgrade.gene.shape.length; j++) {
						grid[currentUpgrade.gene.shape[j].x + currentUpgrade.gene.placement.x][currentUpgrade.gene.shape[j].y + currentUpgrade.gene.placement.y] = currentUpgrade;
					}
				}
			},

			mutate = function() {
				mutations.length = 0;
				for (var key in evolutions)
					if (evolutions.hasOwnProperty(key) && evolutions[key].gene) {
						if(evolutions[key].gene.used) {
							evolutions[key].gene.active = mutations.length;
							mutations.push({ upgrade: key, placement: evolutions[key].gene.placement });
						} else {
							if(evolutions[key].gene.active !== undefined)
								delete evolutions[key].gene.active;
						}
					}

				if(mutations.length > 0)
					if(!S.purchaseMutation(mutations.slice(0)))
						console.error('mutation not valid!');
			},

			clearGrid = function() {
				for (var key in evolutions)
					if (evolutions.hasOwnProperty(key) && evolutions[key].gene && evolutions[key].gene.used) {
						evolutions[key].gene.used = false;
						delete evolutions[key].gene.placement;
					}
				for (var i = 0; i < grid.length; i++) {
					grid[i].length = 0;
				}
				$('.geneBlock.placed').remove();
				$('.geneBlock.active').removeClass('used');
			};

		return {
			levels: evolutions,
			addNew: addNew,
			selectedCost: function() {
				var money = 0;
				for(var i = 0; i < selectedUpgrades.length; i++)
					money += evolutions[selectedUpgrades[i]].cost;

				return money;
			},
			set: function(id, property, value) {
				evolutions[id][property] = value;
			},
			gridSize: function(newSize) {
				if(newSize) {
					while(grid.length < newSize) {
						grid.push([]);
					}
					$('#tb_board .grid', mutationMenu).css('width', newSize * SQUARE_SIZE).css('height', newSize * SQUARE_SIZE);
				}

				return grid.length;
			},
			buildUI: function(focusUpgrade) {
				var arrowWidth = connectorArrow.height,
					arrowLength = connectorArrow.width,
					evolutionBg = imageCanvas;
				evolutionBg.width = evolveMenu.width();
				evolutionBg.height = evolveMenu.height();
				$('.connector, .arrows', evolveMenu).remove();

				var bgCtx = evolutionBg.getContext('2d');
				bgCtx.clearRect(0, 0, evolutionBg.width, evolutionBg.height);

				var i,key;

				var placeUpgrades = function(upgrade, position, theta, depth) {
					if(!upgrade.position) {
						var currentOffset = upgrade.style.offset || defaultStyle.offset,
							upgradeDistance = upgrade.style.distance || defaultStyle.distance,
							arcTangent = upgrade.style.arcTangent || 0;
						var offsetX = currentOffset[0] + Math.round( upgradeDistance * Math.cos(theta) );
						var offsetY = currentOffset[1] - Math.round( upgradeDistance * Math.sin(theta) );
						upgrade.position = {
							top: position.top + offsetY,
							left: position.left + offsetX,
							arcTangent: arcTangent * Math.PI
						};

						upgrade.element.css('top', upgrade.position.top).css('left', upgrade.position.left);
					}

					// Scroll to put the upgrade to focus on in the middle
					if(upgrade.id == focusUpgrade) {
						evolveMenu.css('margin-left', -upgrade.position.left).css('margin-top', -upgrade.position.top);
					}
					
					depth++;
					theta -= upgrade.position.arcTangent;
					for(var i = 0, n = upgrade.children.length; i < n; i++) {
						var currentChild = upgrade.children[i],
							newTheta;
						currentChild.style.distance = (currentChild.style.distance || defaultStyle.distance) + (upgrade.style.size || defaultStyle.size)/2;
						if(currentChild.style.angle)
							newTheta = theta + Math.PI * currentChild.style.angle;
						else
							newTheta = theta + 2 * Math.PI * ( Math.ceil( i / 2 ) / n ) / depth * (1 - i % 2 * 2 );
						placeUpgrades(currentChild, upgrade.position, newTheta, depth);
					}

					return upgrade.position;
				};

				var drawUpgradeConnectors = function(upgrade) {
					var i,n,x,y,
						maxWidth = 4,
						maxHeight = 4,
						elementSize = upgrade.style.size || defaultStyle.size;
					for(i = 0, n = upgrade.children.length; i < n; i++) {
						x = upgrade.children[i].position.parentOffsetX = (upgrade.children[i].position.left - upgrade.position.left);
						y = upgrade.children[i].position.parentOffsetY = (upgrade.children[i].position.top - upgrade.position.top);
						x = Math.abs(x);
						y = Math.abs(y);

						maxWidth = x > maxWidth ? x : maxWidth;
						maxHeight = y > maxHeight ? y : maxHeight;
					}

					var bgCtx = evolutionBg.getContext('2d');

					var makePath = function(ctx, x, y, tangentsAngle) {
						ctx.beginPath();
						if(tangentsAngle) {
							var distance = Math.sqrt(x*x + y*y),
								radius = distance / (2 * Math.sin(Math.abs(tangentsAngle))),
								tangent, centerX, centerY;

							if(x > 0)
								tangent = Math.asin(y / distance);
							else
								tangent = Math.PI - Math.asin(y / distance);

							if(tangentsAngle > 0) {
								centerX = x/2 + Math.sqrt(radius * radius - Math.pow(distance / 2, 2)) * (-y) / distance;
								centerY = y/2 + Math.sqrt(radius * radius - Math.pow(distance / 2, 2)) * (x) / distance;
							} else {
								centerX = x/2 - Math.sqrt(radius * radius - Math.pow(distance / 2, 2)) * (-y) / distance;
								centerY = y/2 - Math.sqrt(radius * radius - Math.pow(distance / 2, 2)) * (x) / distance;
							}

							if(tangentsAngle > 0)
								tangent -= Math.PI / 2;
							else
								tangent += Math.PI / 2;
								
							if(tangentsAngle > 0)
								ctx.arc(centerX, centerY, radius, tangent - tangentsAngle, tangent + tangentsAngle);
							else
								ctx.arc(centerX, centerY, radius, tangent - tangentsAngle, tangent + tangentsAngle, true);
						} else {
							ctx.moveTo(0, 0);
							ctx.lineTo(x, y);
						}
						ctx.stroke();
					};

					var drawConnector = function (startX, startY, moveVector) {
						bgCtx.save();
						bgCtx.translate(startX, startY);

						bgCtx.lineWidth = 4;
						bgCtx.strokeStyle = 'rgba(95,66,16,255)';
						makePath(bgCtx, moveVector.parentOffsetX, moveVector.parentOffsetY, moveVector.arcTangent);

						bgCtx.lineWidth = 1;
						bgCtx.strokeStyle = 'rgba(188,128,28,255)';
						makePath(bgCtx, moveVector.parentOffsetX, moveVector.parentOffsetY, moveVector.arcTangent);

						bgCtx.restore();
					};

					var drawArrow = function (startX, startY, moveVector, buttonSize) {
						var theta = Math.atan2(moveVector.parentOffsetY,moveVector.parentOffsetX) - moveVector.arcTangent * (1 - buttonSize / 2);
						bgCtx.save();

						bgCtx.translate(startX, startY);
						bgCtx.rotate(theta);
						bgCtx.drawImage(connectorArrow, elementSize/2 - 2, -(arrowWidth/2));

						bgCtx.restore();

						delete moveVector.parentOffsetX;
						delete moveVector.parentOffsetY;
					};

					evolutionBg.width = maxWidth*2;
					evolutionBg.height = maxHeight*2;
					for(i = 0, n = upgrade.children.length; i < n; i++) {
						drawConnector(Math.floor(maxWidth) + 0.5, Math.floor(maxHeight), upgrade.children[i].position);
					}
					upgrade.element.append($('<img class="connector" />').attr('src', evolutionBg.toDataURL()).css('left', evolutionBg.width/-2).css('top', evolutionBg.height/-2));

					evolutionBg.height = evolutionBg.width = elementSize + arrowLength * 2;
					for(i = 0, n = upgrade.children.length; i < n; i++) {
						drawArrow(Math.floor(evolutionBg.width/2) + 0.5, Math.floor(evolutionBg.height/2) + 0.5, upgrade.children[i].position, (elementSize - arrowLength) / upgrade.children[i].style.distance);
					}
					upgrade.element.append($('<img class="arrows" />').attr('src', evolutionBg.toDataURL()).css('left', evolutionBg.width/-2).css('top', evolutionBg.height/-2));

					upgrade.element.children('img.connector, img.arrows').css('margin', elementSize/2);
				};


				// Figure out where to put the starting points.
				var startingUpgrades = [];
				for (key in evolutions)
					if (evolutions.hasOwnProperty(key)) {
						var current = evolutions[key];
						if(!current.paths.length)
							startingUpgrades.push(current);
						else {
							for(i = 0; i < current.paths.length; i++) {
								if(evolutions[current.paths[i]] === undefined) {
									if(typeof current.paths[i] !== 'object') {
										console.warn('Cannot find upgrade with ID "' + current.paths[i] + '", path removed');
										current.paths.splice(i,1);
										i--;
									}
								} else {
									current.paths[i] = evolutions[current.paths[i]];
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
				for (key in evolutions)
					if (evolutions.hasOwnProperty(key))
						drawUpgradeConnectors(evolutions[key]);

				refresh();


				// Making the gene pieces interactive, gradding them onto the grid. etc
				$('.toolbox').on('mousedown','.geneBlock',function (event) {
					event.preventDefault();
					var i,valid,element,position,elementOffset,
						gene = $(this),
						geneImage = gene.find('img'),
						currentUpgrade = evolutions[gene.data('geneId')],
						overlayPosition = geneImage.parents('.dataField-modal').offset(),
						mousePosition = { left:event.clientX , top:event.clientY },
						gridElement = $('#tb_board .grid'),
						gridElementPosition = gridElement.offset();

					// If gene has been placed on the board, pick it up to move it
					if(gene.hasClass('placed')) {
						element = gene;
						var mouseOffsetGrid = { left: mousePosition.left - gridElementPosition.left, top: mousePosition.top - gridElementPosition.top };

						// if the grid point you clicked on isn't actually this element, mousedown on the gridpoint owner and stop this at once
						if(!grid[Math.floor(mouseOffsetGrid.left/SQUARE_SIZE)][Math.floor(mouseOffsetGrid.top/SQUARE_SIZE)]) {
							event.stopImmediatePropagation();
							return false;
						}
						else if(grid[Math.floor(mouseOffsetGrid.left/SQUARE_SIZE)][Math.floor(mouseOffsetGrid.top/SQUARE_SIZE)].id != currentUpgrade.id) {
							currentUpgrade = grid[Math.floor(mouseOffsetGrid.left/SQUARE_SIZE)][Math.floor(mouseOffsetGrid.top/SQUARE_SIZE)];
							element = gene = $('.gene_'+currentUpgrade.id,gridElement);
							geneImage = gene.find('img');
						}

						for(i = 0; i < currentUpgrade.gene.shape.length; i++) {
							delete grid[currentUpgrade.gene.shape[i].x + currentUpgrade.gene.placement.x][currentUpgrade.gene.shape[i].y + currentUpgrade.gene.placement.y];
							$('.geneBlock.active.gene_'+currentUpgrade.id).removeClass('used');
							currentUpgrade.gene.used = false;
						}
						currentUpgrade.gene.validPlacement = false;
						elementOffset = element.offset();
						position = { left: elementOffset.left - overlayPosition.left, top: elementOffset.top - overlayPosition.top};
					}
					// If gene is in the 'toolshed', pick up a copy
					else {
						if(currentUpgrade.gene.used)
							return false;
						else
							element = gene.clone(true).removeClass('active').empty().append(geneImage.clone());
						elementOffset = gene.find('img').offset();
						position = { left: elementOffset.left - overlayPosition.left, top: elementOffset.top - overlayPosition.top};
					}

					geneImage.parents('.toolbox').append(element);
					element.addClass('dragging').css('top',position.top).css('left', position.left);

					currentUpgrade.gene.placement = new gridPoint();
					gridElementPosition.top -= overlayPosition.top;
					gridElementPosition.left -= overlayPosition.left;

					$('.toolbox').on('mousemove.toolbox',null,{
						position: position,
						gridElement: gridElement,
						gridElementPosition: gridElementPosition,
						element: element,
						mousePosition: mousePosition,
						currentGene: currentUpgrade.gene
					}, function (event) {
						event.data.position.left += event.clientX - event.data.mousePosition.left;
						event.data.position.top += event.clientY - event.data.mousePosition.top;
						event.data.mousePosition.left = event.clientX;
						event.data.mousePosition.top = event.clientY;
						if(
							event.data.gridElementPosition.left - SQUARE_SIZE/2 < event.data.position.left && event.data.gridElementPosition.top - SQUARE_SIZE/2 < event.data.position.top &&
							event.data.gridElementPosition.left + event.data.gridElement.width() + SQUARE_SIZE/2 > event.data.position.left + event.data.currentGene.width * SQUARE_SIZE &&
							event.data.gridElementPosition.top + event.data.gridElement.height() + SQUARE_SIZE/2 > event.data.position.top + event.data.currentGene.height * SQUARE_SIZE
						) {
							event.data.currentGene.placement.x = Math.round((event.data.position.left - event.data.gridElementPosition.left) / SQUARE_SIZE);
							event.data.currentGene.placement.y = Math.round((event.data.position.top - event.data.gridElementPosition.top) / SQUARE_SIZE);
							event.data.element.css('left',event.data.gridElementPosition.left + event.data.currentGene.placement.x*SQUARE_SIZE)
								.css('top',event.data.gridElementPosition.top + event.data.currentGene.placement.y*SQUARE_SIZE);
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
					$(document).on('mouseup.toolbox',null,{currentGene:currentUpgrade.gene,currentUpgrade:currentUpgrade,element:element,gridElement:gridElement}, function (event) {
						if(event.data.currentGene.validPlacement) {
							$('.geneBlock.active.gene_'+event.data.currentUpgrade.id).addClass('used');
							event.data.currentUpgrade.gene.used = true;
							for(i = 0; i < event.data.currentGene.shape.length; i++) {
								grid[event.data.currentGene.shape[i].x + event.data.currentGene.placement.x][event.data.currentGene.shape[i].y + event.data.currentGene.placement.y] = event.data.currentUpgrade;
							}
							event.data.element.removeClass('valid dragging').addClass('placed').css('left',event.data.currentGene.placement.x * SQUARE_SIZE).css('top',event.data.currentGene.placement.y * SQUARE_SIZE).appendTo(event.data.gridElement);
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
			}
		};
	};

	/*
		Parameter is a function that takes one paramater, a function that takes a dataPoint and returns a string.
		You will call this function to set up a tooltip that returns a property of a point on the planet
	*/
	var activatePlanetTooltip = function(getPointInfo) {
		$('#ui').off('mousemove.render_tooltip');
		$('#ui').on('mousemove.render_tooltip', null, getPointInfo, function(event) {
			UIstatus.mouse.x = event.clientX;
			UIstatus.mouse.y = event.clientY;
			sphere_coords = Renderer.getSphereCoords(UIstatus.mouse.x,UIstatus.mouse.y,200);
			if(sphere_coords && !isNaN(sphere_coords[0]) && !isNaN(sphere_coords[1]) && !UIstatus.pauseRenderer) {
				$('#render_tooltip').css('top',UIstatus.mouse.y+10).css('left',UIstatus.mouse.x+30);
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
		return new DataField(id,options,$('#ui'));
	},

	hideTooltip = function() {
		$('#tooltip').css('visibility','hidden');
	};

	// Function that runs on every frame, sending mouse movement from UI as coordinates to the renderer to move 3-d elements around
	Renderer.onRender(function() {
		if(!UIstatus.pauseRenderer) {
			if(UIstatus.mouse.down) {
				Renderer.moveCamera(UIstatus.mouse.lastx - UIstatus.mouse.x, UIstatus.mouse.lasty - UIstatus.mouse.y);
				UIstatus.mouse.lastx = UIstatus.mouse.x;
				UIstatus.mouse.lasty = UIstatus.mouse.y;
			}
			if(UIstatus.mouse.scroll) {
				Renderer.zoomCamera(-UIstatus.mouse.scroll);
				UIstatus.mouse.scroll = 0;
			}
		}
		else
			Renderer.stopCameraMovement();
	});

	// Build the containers for the UI elements
	addDataField('top_bar',{
		mousePriority: true,
		class: 'top_bar'
	});
	var mainSection = addDataField({
		class: 'main_ui'
	});

	mainSection.addDataField('main_info',{
		mousePriority: true
	});
	mainSection.addDataField('main_control',{
		mousePriority: true
	});

	var E = Evolutions();

	return {
		interfaceParts: interfaceParts,
		status: UIstatus,
		evolutions: E,
		addDataField: function(id, options) {
			return mainSection.addDataField.call(mainSection, id, options);
		},
		toggleGlobeTooltip: function(activate,getPointInfo) {
			if(activate)
				activatePlanetTooltip(getPointInfo);
			else
				deactivatePlanetTooltip();
		},
		setSimulator: function(Simulator) {
			S = Simulator;
		},
		updateUI: function(data) {
			for (var key in data)
				if (data.hasOwnProperty(key) && !changedStatus[key]) {
					status[key] = data[key];
				}

			for (var id in interfaceParts)
				if (interfaceParts.hasOwnProperty(id) && interfaceParts[id].dynamic) {
					key = interfaceParts[id].dynamic;
					if(status[key] !== undefined && !changedStatus[key]) {
						var val = status[key];
						if(interfaceParts[id].dynamicFormat) {
							interfaceParts[id].val(interfaceParts[id].dynamicFormat(val));
						} else {
							interfaceParts[id].val(val);
						}
					}
				}

			changedStatus = {};

			if(E.gridSize() < status.gridSize)
				E.gridSize(status.gridSize);

			return status;
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

				interfaceParts.newsTicker.prepend($('<p>'+langStr+'</p>'));
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

				interfaceParts.alert.append(dom);
				interfaceParts.alert.display();
				return interfaceParts.alert;
			}
		}
	};
};