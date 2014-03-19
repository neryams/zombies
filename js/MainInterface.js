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
			$('#progress').css('display','block');
			$('#progress p').html(i18n.t('setup:loading.0'));
		},
		endGenerator: function() {
			buildUI();
			$('#progress').remove();
			$('#container').css('display','block');
		},
		end: function() {
			Evolution.prototype.buildWeb();
			attachEvents();
		},
		progress: function(ratio, share) {
			if(ratio === undefined) {
				ratio = share = 0;
			}
			if(this.loading.curProg > ratio*share || this.loading.curShare === 0 || share === 0) { // A new loading portion started
				this.loading.done += this.loading.curShare;
				this.loading.curShare = share;
				this.loading.curStep++;
				$('#progress p').html(i18n.t('setup:loading.'+this.loading.curStep));
			}
			this.loading.curProg = ratio*share;
			$('#progress .pace .pace-progress').css('width', ((this.loading.done+this.loading.curProg) * 100) + '%');
		}
	},

	buildUI = function() {
		$('#ui').append($('<div id="render_tooltip" class="tooltip"></div><div id="tooltip" class="tooltip"></div>'));

		UI.addDataField('stats','div',{ class: 'stats' }).addDataField('h1').label('setup:title');
		var uiMenu = UI.addDataField('menu','div',{ class: 'main_menu' });

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
		uiMenuDataviews.addDataField('button',{ onClick: function() { R.setVisualization('country'); this.parent.hide(); UI.toggleGlobeTooltip(true,function(point){ if(point.country) { return '<strong>' + point.country.name + '</strong>'; }});}}).label('ui:buttons.dataviews_inner.political');
		uiMenuDataviews.addDataField('button',{ onClick: function() { R.setVisualization('precipitation'); this.parent.hide(); UI.toggleGlobeTooltip(true,function(point){ return Math.round(point.precipitation*10)/10 + 'mm'; });}}).label('ui:buttons.dataviews_inner.rain');
		uiMenuDataviews.addDataField('button',{ onClick: function() { R.setVisualization('temperature'); this.parent.hide(); UI.toggleGlobeTooltip(true,function(point){ return Math.round((point.temperature - 273)*10)/10 + 'C'; });}}).label('ui:buttons.dataviews_inner.temperature');
		uiMenuDataviews.addDataField('button',{ onClick: function() { R.closeVisualization(); this.parent.hide(); UI.deactivatePlanetTooltip(false); } }).label('ui:buttons.dataviews_inner.disable');
		uiMenuDataviews.element.css('top',uiMenuDataviewsPos.top - uiMenuDataviews.element.height());

		uiMenu.addDataField('button',{
				onClick: function() {
					R.togglePopDisplay();
				}
			}).label('ui:buttons.population');

		var evolveMenuOuter = UI.addDataField('evolveMenu','div',{ class: 'evolution', title: 'Evolution', overlay: true, onHide: function() {
			Evolution.prototype.buyEvolutions();
		}});
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

		Evolution.prototype.mutationMenu = UI.addDataField('mutationMenu','div',{ class: 'toolbox', title: 'Mutation', overlay: true, onHide: function() {
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
			}).val('Clear');
		mutationMenu_controls.addDataField('mutationMenu_submit','button',{
				class: 'primary',
				onHover: function() {
					var totalPrice = 0;
					for (var key in Evolution.prototype.all)
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

		var uiSidebar = UI.addDataField('div',{
			class: 'sidebar',
			mousePriority: true
		});

		var uiSidebarStatic = uiSidebar.addDataField('sidebarStatic','div');
		uiSidebarStatic.addDataField('money','text',{
			title: 'Evolution Points',
			dynamic: 'money'
		});

		var uiSidebarAccordion = uiSidebar.addDataField('sidebarAccordion','accordion');
		uiSidebarAccordion.addDataField('newsTicker','accordion_child',{
			title: 'ui:buttons.news',
			class: 'news'
		});

		UI.addDataField('alert','div',{ overlay: true });
	},

	// Commands to run when loading is finished and main game UI is displayed
	attachEvents = function() {
		$('.draggable').on('mousedown.draggable', function (event) {
			event.preventDefault();
			status.mouse.down = true;
			status.mouse.x = event.clientX;
			status.mouse.y = event.clientY;
			var elements = $(this).parent().find('.draggable');
			elements.maxPos = { top: $(this).parent().height() - elements.height(), left: $(this).parent().width() - elements.width() };
			$(this).on('mousemove.dragging', null, elements, function (event) {
				event.preventDefault();
				var position = event.data.position();
				position.left += event.clientX - status.mouse.x;
				position.top += event.clientY - status.mouse.y;
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
				status.mouse.x = event.clientX;
				status.mouse.y = event.clientY;
			});
		});
		$('.draggable').on('mouseup.draggable', function () {
			status.mouse.down = false;
			$(this).off('mousemove.dragging');
		});
		$('.draggable').on('mouseout.draggable', function () { $(this).trigger('mouseup'); });

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
				var mouseOffsetGrid = { left: mousePosition.left - gridElementPosition.left, top: mousePosition.top - gridElementPosition.top };

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
	},

	strainPrompt = function(options, callback) { // jshint ignore:line
        setTimeout(function() {
			callback('strain-zombie');
        }, 2000);
	};

	var preload_html = '<div id="progress"><div class="progressbar pace"><div class="pace-progress"></div></div><p></p></div>';
	$('#ui').css('display','block').append($(preload_html));

	return {
		load: load,
		strainPrompt: strainPrompt
	};
}