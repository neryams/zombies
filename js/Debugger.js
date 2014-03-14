var Simulator = null,
	Console = null,
	Renderer = null;

var Debugger = function() {
	var buildTreeFromObject = function(data, maxDepth, name, id) {
		if(id === undefined)
			var id = '';

		if(maxDepth < 0)
			return { id: id, value: name, property: data.toString() };
		else {
			var returnData = [];

			for (key in data)
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
	}

	return {
		editHorde: function(data, rowId) {
			if(rowId === undefined) {
				var hordeTable = $$('infoHordes');
				var rowId = hordeTable.add( {
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
				var row = $$('infoHordes').getItem(rowId);
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
				rowId = 'point'+data.id;
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
				row.infected = data.infected;
				row.population = data.total_pop;
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
			$$("infoGlobal").setValues(data);
			$$('windowHeader').setValue('Simulator Active, Turn ' + data.iteration);

			if(Console.options.manualTicks)
				$$('infoHordes').enable();
			else
				$$('infoHordes').disable();

			$$('hordeToolbarCount').setValue($$('infoHordes').count() + ' Hordes');
		},
		insertInfo: function(data) {
			var infoTree = $$('infoSelected');
			var openItems = infoTree.getOpenItems();
			infoTree.clearAll();
			infoTree.parse(buildTreeFromObject(data, 3));
			for(var i = 0; i < openItems.length; i++) {
				infoTree.open(openItems[i]);
			}
		},
		insertTarget: function() {

		},
		filterHordes: function(id,lat,lng) {
			var hordeTable = $$('infoHordes');
			if(hordeTable.count() > 0) {
				// Get selected row as string
				var selected = hordeTable.getSelectedId(false,true);

				if(lat)
					hordeTable.filter('#lat#',lat, false);
				if(lng)
					hordeTable.filter('#lng#',lng, true);

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
		selectSquare: function(lat, lng, ignoreInsert) {
			var pointsTable = $$('infoPoints')
			if(lat && lng && pointsTable.count() > 0) {
				pointsTable.filter('#lat#',lat, false);
				pointsTable.filter('#lng#',lng, true);	
				pointsTable.select(pointsTable.getFirstId());	
				var selected = pointsTable.getSelectedId(false,true);
				pointsTable.filter('','', false);
				pointsTable.select(selected);
				pointsTable.showItem(selected);
			}
			if(!ignoreInsert)
				ui.insertInfo(pointsTable.getItem(selected).pointer);
		}
	}
}

var ui = Debugger();

webix.ui({
	rows:[
		{
		    view:"toolbar",
		    id:"mainToolbar",
		    cols:[
		    	{ id:"windowHeader", view:"label", label:'0' },
		    	{},
		        { view:"toggle", offLabel:"Enable Mouseover Debug", onLabel:"Disable Mouseover Debug", width:200, align:"center", 
    				on:{'onChange': function() {
    					Console.options.mouseOverDebugData = !!this.getValue();
		        	}}
		        },
		        { view:"toggle", offLabel:"Freeze", onLabel:"Resume", width:100, align:"center", 
    				on:{'onChange': function() {
    					Console.options.manualTicks = !!this.getValue();
    					if(!Console.options.manualTicks)
		        			Simulator.endTurn();
		        	}}
		        },
		        { view:"button", id:"endTickButton", value:"End Turn", width:100, align:"center", click: function() {
		        	Simulator.endTurn();
		        }},
		        { view:"button", id:"closeButton", value:"Close", width:100, align:"center", click: function() {
		        	Console.close();
		        }}
		    ]
		},
		{cols:[
			{
				id:"infoGlobal",
				view: "property",
				elements:[
					{ label:"Horde Count", type:"text", id:"hordeCount"},
					{ label:"Iteration", type:"text", id:"iteration"}
				],
				editable: false,
				width:200,
				minWidth:125,
				maxWidth:250
			},
			{
				view:"resizer"
			},
			{
			    view:"tabview",
			    animate:false,
				minWidth:500,
			    cells:[
			        {
						header:"Hordes",
						body:{
							rows:[
								{
								    view:"toolbar",
								    id:"hordeToolbar",
								    cols:[
								    	{ id:"hordeToolbarHeader", view:"label", label:'' },
								    	{ id:"hordeToolbarCount", view:"label", label:'' },
								    	{},
								        { view:"button", id:"hordeButtonClearFilter", disabled: true, value:"Clear Filter", width:100, align:"center", click: function() {
								        	ui.clearHordeFilter();
								        }}
								    ]
								},
								{
					            	id:"infoHordes",
									view:"datatable",
									disabled: true,
									resizeColumn:true,
									select: "row",
									on:{
										onSelectChange: function(){
											if($$('infoHordes').getSelectedId()) {
												var selected = $$('infoHordes').getItem($$('infoHordes').getSelectedId(false,true));
												Console.options.activeHorde = selected.pointer;
												ui.insertInfo(selected.pointer);
												ui.selectSquare(selected.lat,selected.lng, true);
												ui.clearModules();
											}
										}
									},
									columns:[
										{ id:"uid", header: "Horde ID", width:100, sort:"int"},
										{ id:"lat", width: 100, header: "Latitude"},
										{ id:"lng", width: 100, header: "Longitude"},
										{ id:"size",header: "Size", fillspace:true, sort:"int"}
									]
								}
							]
						}
			        },
			        {
						header:"Modules",
						body:{
			            	id:"infoModules",
							view:"datatable",
							resizeColumn:true,
							columns:[
								{ id:"module", header: "Module", width: 150 }
							]
						}
			        },
			        {
						header:"Globe Points",
						body:{
			            	id:"infoPoints",
							view:"datatable",
							resizeColumn:true,
							select: "row",
							on:{
								onSelectChange:function(){
									if($$('infoPoints').getSelectedId()){
										var selected = $$('infoPoints').getItem($$('infoPoints').getSelectedId(false,true));
										Renderer.highlightSquare(selected.lat,selected.lng);
									}
								}
							},
							columns:[
								{ id:"lat", width: 100, header: "Latitude"},
								{ id:"lng", width: 100, header: "Longitude"},
								{ id:"population", width: 150, header: "Population", sort:"int"},
								{ id:"infected", width: 150, header: "Infected", sort:"int"},
								{ id:"country", header: "Country", fillspace:true}
							]
						}
			        }
			    ]
			},
			{
				view:"resizer"
			},
			{
				id:"infoSelected",
				view:"treetable",
				minWidth:150,
				width:200,
				resizeColumn:true,
				columns: [
			        { id:"value", header:"Property", template:"{common.treetable()} #value#",  width:100},
			        { id:"property", header:"Value", fillspace:true}
				]
			}
		]}
	]
}).show();