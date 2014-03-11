var Simulator = null,
	Console = null,
	Renderer = null;

var Debugger = function() {
	return {
		editHorde: function(data, rowId) {
			if(rowId === undefined) {
				var rowId = $$('infoHordes').add( {
					id: 'hordeRow'+data.id,
					uid: data.id,
					size: data.size,
					lat: data.location.lat,
					lng: data.location.lng
				} );
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
		}
	}
}

var ui = Debugger();

webix.ui({
	container:"layout_div",
	rows:[
		{
		    view:"toolbar",
		    id:"mainToolbar",
		    cols:[
		    	{ id:"turnNumber", view:"label", label:'0' },
		    	{},
		        { view:"toggle", offLabel:"Enable Mouseover Debug", onLabel:"Disable Mouseover Debug", width:200, align:"center", 
    				on:{'onChange': function() {
    					Console.options.mouseOverDebugData = !!this.getValue();
		        	}}
		        },
		        { view:"toggle", offLabel:"Freeze", onLabel:"Resume", width:100, align:"center", 
    				on:{'onChange': function() {
    					Console.options.manualTicks = !!this.getValue();
    					if(Console.options.manualTicks) {
    						$$('infoHordes').enable();
    					} else { 
    						$$('infoHordes').disable();
		        			Simulator.endTurn();
    					}
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
				template:"column 1",
				width:250,
				minWidth:150,
				maxWidth:250
			},
			{
				view:"resizer"
			},
			{
			    view:"tabview",
			    animate:false,
				minWidth:300,
				width:500,
			    cells:[
			        {
						header:"Hordes",
						body:{
			            	id:"infoHordes",
							view:"datatable",
							disabled: true,
							resizeColumn:true,
							select: "row",
							on:{
								onSelectChange:function(){
									var selected = $$('infoHordes').getItem($$('infoHordes').getSelectedId().id);
									Renderer.highlightSquare(selected.lat,selected.lng)
								}
							},
							columns:[
								{ id:"uid",      header: "Horde ID", width:100, sort:"int"},
								{ id:"lat", width: 100, header: ["Latitude",{content:"numberFilter"}]},
								{ id:"lng", width: 100, header: ["Longitude",{content:"numberFilter"}]},
								{ id:"size",     header: "Size", fillspace:true, sort:"int"}
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
			        }
			    ]
			},
			{
				view:"resizer"
			},
			{
				id:"infoSelected",
				template:"column 3"
			}
		]}
	]
}).show();