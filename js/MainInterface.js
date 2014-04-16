/* exported MainInterface */
function MainInterface(UI,R) {
	var status = UI.status;
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
			$('#setup').remove();
			$('#progress').addClass('display','block');
			$('#progress p').html(i18n.t('setup:loading.default'));
		},
		endGenerator: function() {
			buildUI();
			$('#progress').remove();
			$('#container').addClass('active');
		},
		end: function() {
			attachEvents();
			$(document).foundation();
		},
		progress: function(message, totalProgress) {
			$('#progress p').html(i18n.t('setup:loading.'+message));
			$('#progress .pace .pace-progress').css('width', (totalProgress * 100) + '%');
		}
	},

	buildUI = function() {
		UI.addDataField('tooltip', {
			class: 'tooltip'
		}).attr('id', 'tooltip').appendTo($('body'));

		var mainControl = UI.interfaceParts.main_control,
			mainInfo = UI.interfaceParts.main_info,
			mainBar = UI.interfaceParts.top_bar;

		mainBar.addDataField({
			type: 'h1'
		}).html(i18n.t('setup:title'));

		mainBar.addDataField('money',{
			type: 'field',
			title: 'Evolution Points',
			dynamic: 'money',
			dynamicFormat: function(value) {
				var money = parseInt(value);
				for(var i = 0; i < UI.evolutions.selectedUpgrades.length; i++)
					money -= UI.evolutions.all[UI.evolutions.selectedUpgrades[i]].cost;
				return money;
			}
		});
/*
		mainInfo.addDataField('sidebarAccordion',{
			type: 'accordion'
		}).addDataField('newsTicker',{
			type: 'accordion_child',
			title: 'ui:buttons.news',
			class: 'news'
		});*/

		var visualTooltip = function(visual, mathFunction) {
			return function() {
				R.setVisualization(visual);
				UI.toggleGlobeTooltip(true, mathFunction);
			};
		};

		var dataViewList = mainControl.addDataField('dataViewList',{
			type: 'choiceToggle',
			alignment: 'top',
			label: 'ui:buttons.dataviews'
		});

		dataViewList.addOption('ui:buttons.dataviews_inner.disable', function() {
			R.closeVisualization();
			UI.toggleGlobeTooltip(false);
		});
		dataViewList.addOption('ui:buttons.dataviews_inner.political', visualTooltip('country',function(point) {
			if(point.country) {
				return '<strong>' + point.country.name + '</strong>';
			}
		}));
		dataViewList.addOption('ui:buttons.dataviews_inner.rain', visualTooltip('precipitation',function(point) {
			return Math.round(point.precipitation*10)/10 + 'mm';
		}));
		dataViewList.addOption('ui:buttons.dataviews_inner.temperature', visualTooltip('temperature',function(point){
			return Math.round((point.temperature - 273)*10)/10 + 'C';
		}));

		mainControl.addDataField({
			type: 'button',
			label: 'ui:buttons.population'
		}).click(function() {
			R.togglePopDisplay();
		});

		var evolveMenuOuter = UI.addDataField('evolveMenu',{
			type: 'modal',
			class: 'draggable-parent',
			title: 'Evolution',
			onShow: function() {
				UI.evolutions.refresh();
			},
			opener: mainControl.addDataField({
				type: 'button',
				label: 'ui:buttons.evolution'
			})
		});
		UI.evolutions.evolveMenu = evolveMenuOuter.addDataField({
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
				UI.evolutions.deselectAll();
				evolveMenuOuter.hide();
			}
		});
		evolveMenu_controls.addDataField({
			type: 'button',
			class: 'icon accept',
			tooltip: i18n.t('ui:evolution.accept'),
			click: function() {
				UI.evolutions.buyEvolutions();
				evolveMenuOuter.hide();
			}
		});
		evolveMenu_controls.find('.has-tip').addClass('tip-top');

		UI.evolutions.mutationMenu = UI.addDataField('mutationMenu',{
			type: 'modal',
			class: 'toolbox',
			title: 'Mutation',
			onShow: function() {
				UI.evolutions.refreshGenes();
			},
			onHide: function() {
				UI.evolutions.clearGrid();
			},
			opener: mainControl.addDataField({
				type: 'button',
				label: 'ui:buttons.mutation'
			})
		});
		
		UI.evolutions.mutationMenu.grid = $(i18n.t('dom:interface.mutation.grid'));
		UI.evolutions.mutationMenu.piece_container = $(i18n.t('dom:interface.mutation.piece_container'));
		UI.evolutions.mutationMenu.append(UI.evolutions.mutationMenu.grid).append(UI.evolutions.mutationMenu.piece_container);

		var mutationMenu_controls = UI.evolutions.mutationMenu.addDataField({
			type: 'div',
			class: 'menu'
		});
		mutationMenu_controls.addDataField('mutationMenu_clear',{
			type: 'button',
			class: 'icon clear',
			tooltip: i18n.t('ui:mutation.clear'),
			click: function() {
				UI.evolutions.clearGrid();
			}
		});
		mutationMenu_controls.addDataField('mutationMenu_cancel',{
			type: 'button',
			class: 'icon cancel',
			tooltip: i18n.t('ui:mutation.cancel'),
			click: function() {
				UI.evolutions.mutationMenu.hide();
			}
		});
		mutationMenu_controls.addDataField('mutationMenu_submit',{
			type: 'button',
			class: 'icon accept',
			tooltip: i18n.t('ui:mutation.mutate'),
			click: function() {
				UI.evolutions.mutate();
				UI.evolutions.mutationMenu.hide();
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


		UI.addDataField('alert',{
			type: 'modal'
		});
	},

	// Commands to run when loading is finished and main game UI is displayed
	attachEvents = function() {
		$('.draggable, .draggable-parent').on('mousedown.draggable', function (event) {
			var elements;
			event.preventDefault();
			status.mouse.down = true;
			status.mouse.x = event.clientX;
			status.mouse.y = event.clientY;

			if($(this).hasClass('draggable')) {
				elements = $(this).parent().find('.draggable');
				if($(this).hasClass('draggable-bind'))
					elements.maxPos = { top: $(this).parent().height() - elements.height(), left: $(this).parent().width() - elements.width() };
				else
					elements.maxPos = false;
			}
			else {
				elements = $(this).find('.draggable');
				elements.maxPos = false;
			}
			$(this).on('mousemove.dragging', null, elements, function (event) {
				event.preventDefault();
				var position = event.data.position();
				position.left += event.clientX - status.mouse.x;
				position.top += event.clientY - status.mouse.y;
				if(event.data.maxPos) {
					if(position.left > 0)
						position.left = 0;
					else if(position.left < event.data.maxPos.left)
						position.left = event.data.maxPos.left;
					if(position.top > 0)
						position.top = 0;
				}

				else if(position.top < event.data.maxPos.top)
					position.top = event.data.maxPos.top;

				event.data.css('left', position.left);
				event.data.css('top', position.top);
				status.mouse.x = event.clientX;
				status.mouse.y = event.clientY;
			});
		});
		$('.draggable, .draggable-parent').on('mouseup.draggable', function () {
			status.mouse.down = false;
			$(this).off('mousemove.dragging');
		});

		$('#ui').on('mousedown.moveCamera', function (event) {
			if(!status.pauseR && status.mouse.bound === null) {
				event.preventDefault();
				status.mouse.down = true;
				status.mouse.x = status.mouse.lastx = event.clientX;
				status.mouse.y = status.mouse.lasty = event.clientY;
				status.mouse.click = true;
				R.stopCameraMovement();
				$(this).on('mousemove.moveCamera', function (event) {
					status.mouse.x = event.clientX;
					status.mouse.y = event.clientY;
					// If user moves the mouse enough, declare this mousedown as NOT a click.
					if(Math.abs(status.mouse.lastx - status.mouse.x) + Math.abs(status.mouse.lasty - status.mouse.y) > 3)
						status.mouse.click = false;
				});
			}
		});
		$('#ui').on('mouseup.moveCamera', function () {
			$(this).off('mousemove.moveCamera');
			// If mouse didn't move, do the click
			if(status.mouse.click) {
				var sphereCoords = R.clickSphere(status.mouse.x,status.mouse.y);
				if(sphereCoords && debugMenu.active)
					debugMenu.console.selectSquare(Math.round(sphereCoords[0] - 0.5) + 0.5, Math.round(sphereCoords[1] - 0.5) + 0.5);
			}
			status.mouse.x = status.mouse.lastx = status.mouse.y = status.mouse.lasty = status.mouse.scroll = 0;
			status.mouse.click = status.mouse.down = false;
		});
		$('#ui').on('mousewheel.zoomCamera DOMMouseScroll.zoomCamera', function(event) {
			if(status.mouse.bound === null) {
				event.preventDefault();
				if (event.type == 'mousewheel') {
					status.mouse.scroll += parseInt(event.originalEvent.wheelDelta);
				}
				else if (event.type == 'DOMMouseScroll') {
					status.mouse.scroll += parseInt(event.originalEvent.detail);
				}
			}
		});

		// Making the gene pieces interactive, gradding them onto the grid. etc
		$('.toolbox').on('mousedown','.geneBlock',function (event) {
			event.preventDefault();
			var i,valid,element,position,
				gene = $(this),
				geneImage = gene.find('img'),
				currentUpgrade = UI.evolutions.all[gene.data('geneId')],
				overlayPosition = geneImage.parents('.dataField-modal').offset(),
				mousePosition = { left:event.clientX , top:event.clientY },
				grid = UI.evolutions.grid,
				gridElement = $('#tb_board .grid'),
				gridElementPosition = gridElement.offset(),
				gridSquareSize = UI.evolutions.SQUARE_SIZE;

			// If gene has been placed on the board, pick it up to move it
			if(gene.hasClass('placed')) {
				element = gene;
				var mouseOffsetGrid = { left: mousePosition.left - gridElementPosition.left, top: mousePosition.top - gridElementPosition.top };

				// if the grid point you clicked on isn't actually this element, mousedown on the gridpoint owner and stop this at once
				if(!grid[Math.floor(mouseOffsetGrid.left/gridSquareSize)][Math.floor(mouseOffsetGrid.top/gridSquareSize)]) {
					event.stopImmediatePropagation();
					return false;
				}
				else if(grid[Math.floor(mouseOffsetGrid.left/gridSquareSize)][Math.floor(mouseOffsetGrid.top/gridSquareSize)].id != currentUpgrade.id) {
					currentUpgrade = grid[Math.floor(mouseOffsetGrid.left/gridSquareSize)][Math.floor(mouseOffsetGrid.top/gridSquareSize)];
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
					event.data.currentGene.placement.x = Math.round((event.data.position.left - event.data.gridElementPosition.left) / gridSquareSize);
					event.data.currentGene.placement.y = Math.round((event.data.position.top - event.data.gridElementPosition.top) / gridSquareSize);
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
		
		$('.reveal-modal').foundation('reveal', {
			animation_speed: 250,
			close_on_background_click: false,
			bg_class: 'reveal-modal-bg',
			bg : $('.reveal-modal-bg')
		});

		$('#ui').addClass('started');
	},

	strainPrompt = function(options, callback) { // jshint ignore:line
		var strainPrompt = UI.addDataField('strainPrompt',{
			type: 'modal',
			class: 'strain_prompt'
		});
		strainPrompt.addDataField({
			type: 'h1'
		}).html('Pick a Specification');

		var selectStrain = function(id) {
			return function() {
				strainPrompt.hide();
				strainPrompt.remove();
				callback(id);
			};
		};

		for(var i = 0; i < options.length; i++) {
			strainPrompt.addDataField({
				type:'button',
				label:'Pick'
			})
			.click(selectStrain(options[i].id))
			.addDataField({
				type: 'field',
				title: options[i].name,
				value: options[i].description
			});
		}
		
		strainPrompt.foundation('reveal', {
			animation_speed: 250,
			close_on_background_click: false,
			bg_class: 'reveal-modal-bg',
			bg : $('.reveal-modal-bg')
		});

		strainPrompt.show();
	};

	var preload_html = '<div id="progress"><div class="progressbar pace"><div class="pace-progress"></div></div><p></p></div>';
	$('#ui').addClass('active').append($(preload_html));

	return {
		load: load,
		strainPrompt: strainPrompt
	};
}