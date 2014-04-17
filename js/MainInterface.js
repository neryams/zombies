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
				return parseInt(value) - UI.evolutions.selectedCost();
			}
		});

		var sidebarAccordion = mainInfo.addDataField('sidebarAccordion',{
			type: 'accordion'
		});
		sidebarAccordion.addDataField('newsTicker',{
			title: 'ui:buttons.news',
			class: 'news'
		});

		var dataViewList = mainControl.addDataField('dataViewList',{
			type: 'choiceToggle',
			alignment: 'top',
			label: 'ui:buttons.dataviews'
		});
		dataViewList.visualTooltip = function(visual, mathFunction) {
			return function() {
				R.setVisualization(visual);
				UI.toggleGlobeTooltip(true, mathFunction);
			};
		};

		dataViewList.addOption('ui:buttons.dataviews_inner.disable', function() {
			R.closeVisualization();
			UI.toggleGlobeTooltip(false);
		});
		dataViewList.addOption('ui:buttons.dataviews_inner.political', dataViewList.visualTooltip('country',function(point) {
			if(point.country) {
				return '<strong>' + point.country.name + '</strong>';
			}
		}));
		dataViewList.addOption('ui:buttons.dataviews_inner.rain', dataViewList.visualTooltip('precipitation',function(point) {
			return Math.round(point.precipitation*10)/10 + 'mm';
		}));
		dataViewList.addOption('ui:buttons.dataviews_inner.temperature', dataViewList.visualTooltip('temperature',function(point){
			return Math.round((point.temperature - 273)*10)/10 + 'C';
		}));

		mainControl.addDataField({
			type: 'button',
			label: 'ui:buttons.population'
		}).click(function() {
			R.togglePopDisplay();
		});


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
			type: 'h1',
			onHide: function() {
				strainPrompt.remove();
			}
		}).html('Pick a Specification');

		var selectStrain = function(id) {
			return function() {
				strainPrompt.hide();
				callback(id);
				$(this).off('.selectStrain');
			};
		};

		for(var i = 0; i < options.length; i++) {
			strainPrompt.addDataField({
				type:'button',
				label:'Pick'
			})
			.on('click.selectStrain',selectStrain(options[i].id))
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