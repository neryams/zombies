/* globals webix */
var Simulator = null,
	Console = null,
	Renderer = null;

var Debugger = function() {
	var buildTreeFromObject = function(data, maxDepth, name, id) {
		if(id === undefined)
			id = '';

		if(maxDepth < 0) {
			if(data)
				return { id: id, value: name, property: data.toString() };
			else
				return { id: id, value: name };
		}
		else {
			var returnData = [];

			for(var key in data)
				if (data.hasOwnProperty(key)) {
					var newId = id ? id + '.' + key : key;
					if(typeof data[key] === 'object') {
						returnData.push(buildTreeFromObject(data[key], maxDepth - 1, key, newId));
					} else {
						returnData.push({ id: newId, value: key, property: data[key] });
					}
				}

			if(id === '')
				return returnData;
			else if(returnData.length > 0)
				return { id: id, value: name, data: returnData };
			else
				return { id: id, value: name };
		}
	};

	return {
		selectedTab: 'infoHordes',
		editHorde: function(data, rowId) {
			var hordeTable = $$('infoHordes');
			if(rowId === undefined) {
				rowId = hordeTable.add( {
					id: 'hordeRow'+data.id,
					uid: data.id,
					size: data.size,
					lat: data.location.lat,
					lng: data.location.lng,
					pointer: data
				} );
				if(Console.options.activeHorde === null)
					hordeTable.select(rowId);
			} else {
				var row = hordeTable.getItem(rowId);
				if(row) {
					row.size = data.size;
					row.lat = data.location.lat;
					row.lng = data.location.lng;
				}
			}
			return rowId;
		},
		editPoint: function(data) {
			var pointsTable = $$('infoPoints'),
				rowId = 'pointRow'+data.id;
			if(!pointsTable.getItem(rowId))
				pointsTable.add( {
					id: rowId,
					lat: data.lat,
					lng: data.lng,
					infected: data.infected,
					population: data.total_pop,
					pointer: data
				} );
			else {
				var row = pointsTable.getItem(rowId);
				if(row) {
					row.infected = data.infected;
					row.population = data.total_pop;
				}
			}
		},
		removeHorde: function(rowId) {
			var hordeTable = $$('infoHordes');
			if(hordeTable.getItem(rowId))
				hordeTable.remove(rowId);
		},
		clearModules: function() {
			$$('infoModules').clearAll();
		},
		addModulePassData: function(moduleId, passData) {
			var moduleTable = $$('infoModules'),
				rowToAdd = { module: moduleId },
				columnsAdded = false;
			for (var key in passData)
				if (passData.hasOwnProperty(key)) {
					if(moduleTable.getColumnConfig(key) === undefined) {
						moduleTable.config.columns.push({ id:key, header: key, width: 60 });
						columnsAdded = true;
					}
					rowToAdd[key] = passData[key];
				}

			if(columnsAdded)
				moduleTable.refreshColumns();

			moduleTable.add(rowToAdd);
		},
		updateGlobalInfo: function(data) {
			$$('infoGlobal').setValues(data);
			$$('windowHeader').setValue('Simulator Active, Turn ' + data.iteration);

			if(Console.options.manualTicks) {
				$$('infoHordes').enable();
				$$('infoPoints').enable();
				$$('endTickButton').enable();
			}
			else {
				$$('infoHordes').disable();
				$$('infoPoints').disable();
				$$('endTickButton').disable();
			}

			$$('hordeToolbarCount').setValue($$('infoHordes').count() + ' Hordes found');
		},
		insertInfo: function(data) {
			var infoTree = $$('infoSelected');
			var openItems = infoTree.getOpenItems();
			infoTree.clearAll();
			infoTree.parse(buildTreeFromObject(data, 3));
			for(var i = 0; i < openItems.length; i++) {
				try {
					infoTree.open(openItems[i]);
				}
				catch (e) {
					console.log(e);
				}
			}
		},
		updateInfo: function() {
			var selectedTabView = $$(ui.selectedTab);
			if(selectedTabView.getSelectedId()) {
				var selected = selectedTabView.getItem(selectedTabView.getSelectedId(false,true));
				if(selected.pointer)
					ui.insertInfo(selected.pointer);
			}
		},
		insertTarget: function() {

		},
		filterHordes: function(id,lat,lng) {
			var hordeTable = $$('infoHordes');
			if(hordeTable.count() > 0) {
				// Get selected row as string
				var selected = hordeTable.getSelectedId(false,true);

				hordeTable.filter(function(row){   //here it filters all titles from the dataset 
					return row.lat === lat && row.lng === lng;
				});

				if(hordeTable.getFirstId()) {
					hordeTable.select(hordeTable.getFirstId());
					$$('hordeToolbarHeader').setValue('Showing only Hordes on ' + lat + ', ' + lng);
					$$('hordeButtonClearFilter').enable();
					$$('hordeToolbarCount').setValue(hordeTable.count() + ' Hordes');
				} else {
					ui.clearHordeFilter();
					if(selected) {
						hordeTable.select(selected);
						hordeTable.showItem(selected);
					}
				}
			}
		},
		clearHordeFilter: function() {
			var hordeTable = $$('infoHordes');
			var selected = hordeTable.getSelectedId(false,true);
			hordeTable.filter('','', false);
			$$('hordeToolbarHeader').setValue('');
			$$('hordeButtonClearFilter').disable();

			if(selected) {
				hordeTable.select(selected);
				hordeTable.showItem(selected);
			}
			$$('hordeToolbarCount').setValue(hordeTable.count() + ' Hordes');
		},
		selectSquare: function(lat, lng) {
			var pointsTable = $$('infoPoints');
			if(lat && lng && pointsTable.count() > 0) {
				pointsTable.filter(function(row){   //here it filters all titles from the dataset 
					return row.lat === lat && row.lng === lng;
				});

				if(pointsTable.getFirstId()) {
					pointsTable.select(pointsTable.getFirstId());
					var selected = pointsTable.getSelectedId(false,true);
					pointsTable.filter('','', false);
					pointsTable.select(selected);
					pointsTable.showItem(selected);
				}
				else
					pointsTable.filter('','', false);
			}
		}
	};
};

var ui = Debugger();

webix.ui({
	rows:[
		{
			view:'toolbar',
			id:'mainToolbar',
			cols:[
				{ id:'windowHeader', view:'label', label:'0' },
				{},
				{ view:'toggle', offLabel:'Freeze', onLabel:'Resume', width:100, align:'center',
					on:{'onChange': function(newval) {
						Console.options.manualTicks = !!newval;
						if(!Console.options.manualTicks) {
							Simulator.endTurn();
						}
					}}
				},
				{ view:'button', id:'endTickButton', disabled: true, value:'End Turn', width:100, align:'center', click: function() {
					Simulator.endTurn();
				}},
				{ view:'toggle', offLabel:'Enable Mouseover Debug', onLabel:'Disable Mouseover Debug', width:180, align:'center',
					on:{'onChange': function(newval) {
						Console.options.mouseOverDebugData = !!newval; // 1 -> true
					}}
				},
				{ id:'profileTick', view:'toggle', offLabel:'Profile Next Turn', onLabel:'Stop Profiling', width:125, align:'center',
					on:{'onChange': function(newval) {
						Console.options.profileTick = !!newval;
					}}
				},
				{ view:'button', id:'closeButton', value:'Close', width:100, align:'center', click: function() {
					Console.close();
				}}
			]
		},
		{cols:[
			{
				id:'infoGlobal',
				view: 'property',
				elements:[
					{ label:'Horde Count', type:'text', id:'hordeCount'},
					{ label:'Iteration', type:'text', id:'iteration'}
				],
				editable: false,
				width:200,
				minWidth:125,
				maxWidth:250
			},
			{
				view:'resizer'
			},
			{
				rows:[
					{
						view:'tabbar',
						multiview:true,
						options: [
							{ value: 'Hordes', id: 'infoHordes.outer' },
							{ value: 'Modules', id: 'infoModules' },
							{ value: 'Globe Points', id: 'infoPoints' }
						],
						height:40,
						on:{'onChange': function(newCell) {
							var cell = $$(newCell.split('.')[0]);
							ui.selectedTab = cell.config.id;
							if(cell.getSelectedId()) {
								var selected = cell.getItem(cell.getSelectedId(false,true));
								if(selected.pointer !== undefined)
									ui.insertInfo(selected.pointer);
							}
						}}
					},{
						css:'mainView',
						animate: false,
						cells:[
							{
								id:'infoHordes.outer',
								rows:[
									{
										view:'toolbar',
										id:'hordeToolbar',
										height:30,
										cols:[
											{ id:'hordeToolbarHeader', view:'label', label:'', width: 265 },
											{ id:'hordeToolbarCount', view:'label', label:'' },
											{},
											{ view:'button', id:'hordeButtonClearFilter', disabled: true, value:'Clear Filter', width:100, align:'center', click: function() {
												ui.clearHordeFilter();
											}}
										]
									},
									{
										id:'infoHordes',
										view:'datatable',
										disabled: true,
										resizeColumn:true,
										select: 'row',
										on:{
											onSelectChange: function(){
												if($$('infoHordes').getSelectedId()) {
													var selected = $$('infoHordes').getItem($$('infoHordes').getSelectedId(false,true));
													Console.options.activeHorde = selected.pointer;
													if(ui.selectedTab == 'infoHordes')
														ui.insertInfo(selected.pointer);
													ui.selectSquare(selected.lat,selected.lng);
													ui.clearModules();
												}
											}
										},
										columns:[
											{ id:'uid', header: 'Horde ID', width:100, sort:'int'},
											{ id:'lat', width: 100, header: 'Latitude'},
											{ id:'lng', width: 100, header: 'Longitude'},
											{ id:'size',header: 'Size', fillspace:true, sort:'int'}
										]
									}
								]
							},
							{
								id:'infoModules',
								view:'datatable',
								css:'contentTooltip',
								resizeColumn:true,
								columns:[
									{ id:'module', header: 'Module', width: 150, fillspace:true }
								]
							},
							{
								id:'infoPoints',
								view:'datatable',
								resizeColumn:true,
								disabled: true,
								select: 'row',
								on:{
									onSelectChange:function(){
										if($$('infoPoints').getSelectedId()){
											var selected = $$('infoPoints').getItem($$('infoPoints').getSelectedId(false,true));
											Renderer.highlightSquare(selected.lat,selected.lng);
											Console.options.activePoint = selected.pointer;
											if(ui.selectedTab != 'infoHordes')
												ui.insertInfo(selected.pointer);
										}
									}
								},
								columns:[
									{ id:'lat', width: 100, header: 'Latitude'},
									{ id:'lng', width: 100, header: 'Longitude'},
									{ id:'population', width: 150, header: 'Population', sort:'int'},
									{ id:'infected', width: 150, header: 'Infected', sort:'int'},
									{ id:'country', header: 'Country', fillspace:true}
								]
							}
						]
					}
				]
			},
			{
				view:'resizer'
			},
			{
				id:'infoSelected',
				view:'treetable',
				minWidth:150,
				width:200,
				resizeColumn:true,
				columns: [
					{ id:'value', header:'Property', template:'{common.treetable()} #value#',  width:100},
					{ id:'property', header:'Value', fillspace:true}
				]
			}
		]}
	]
}).show();

$('.mainView').on('mouseover.addTooltip', '.contentTooltip td div', function() {
	$(this).attr('title',$(this).html());
});