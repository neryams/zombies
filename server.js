var express = require('express');
var fs = require('fs');
var app = express();

var rootDir = '/client/';

app.get('/', function(req, res){
  	res.sendfile(__dirname + rootDir + 'index.htm');
});

app.get(/^\/modules\/(.+)$/, function(req, res) {
	res.header('Content-Type', 'application/javascript');
	var urlparts = req.url.split('/');
	var loadModules = urlparts[urlparts.length - 1].split(',');

	var loaded = {};

	var outputModules = function(modules, file) {
		if(file === undefined)
			file = '';

		for(var i = 0; i < modules.length; i++) {
			if(!loaded[modules[i]]) {
				var path = __dirname + rootDir + 'js/modules/' + modules[i].split('.').join('/');
				var module = require(path).options;
				loaded[modules[i]] = true;

				if(module.dependencies !== undefined)
					file += outputModules(module.dependencies);

				file += 'exports = {};\n';
				file += fs.readFileSync(path + '.js') + '\n';
				file += 'window.toLoad["' + modules[i] + '"] = exports;\n';

				if(module.children !== undefined)
					file += outputModules(module.children);
			}
		}

		return file;
	};

	res.send(
		'window.toLoad = {};\n' +
		outputModules(loadModules)
	);
});

app.get(/^\/(.+)$/, function(req, res) { 
	res.sendfile(__dirname + rootDir + req.params[0]); 
});

var server = app.listen(8080, function() {
    console.log('Listening on port %d', server.address().port);
});