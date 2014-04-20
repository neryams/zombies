/* global PerlinSimplex */
/* global DataPoint */
importScripts('third-party/seedrandom.min.js','third-party/perlinsimplex.min.js','DataPoint.js');

var generateName = function(c) {
	var d = [];
	switch (c) {
		case 'virus':
			d = [{
				options: ['V']
			}, {
				type: 'int',
				min: 10,
				max: 4999
			}, {
				options: ['.H']
			}, {
				type: 'int',
				min: 1,
				max: 17
			}, {
				options: ['N']
			}, {
				type: 'int',
				min: 1,
				max: 9
			}, {
				options: ['.A', '.B', '.C', '.I', '.II', '.III']
			}];
			break;
		case 'country':
			d = [{
				chance: 0.12,
				options: ['United ', 'United States of ', 'Republic of ', 'Democratic Republic of ', 'Kingdom of ', 'Empire of ', 'New ']
			}, {
				chance: 0.5,
				options: ['Alb', 'Arg', 'Arm', 'Ant', 'Ger', 'Isr', 'Ald', 'Cor', 'Mac', 'Lux', 'Mad', 'Zim', 'Els']
			}, {
				exclude: 1,
				options: ['A', 'B', 'C', 'G', 'J', 'K', 'L', 'M', 'Q', 'N', 'H', 'Ir', 'Br', 'Am', 'Br', 'Fr', 'Sp', 'Ter']
			}, {
				options: ['a', 'au', 'ae', 'ay', 'e', 'i', 'o', 'a', 'e', 'i', 'o', 'u', 'y', 'ya']
			}, {
				require: 2,
				chance: 0.5,
				options: ['b', 'n', 'g', 't', 'tr', 'r', 'th', 'sh', 'd', 'v', 'z', 's', 'w']
			}, {
				require: 4,
				options: ['i', 'i', 'o', 'o', 'a', 'ai', 'ua']
			}, {
				chance: 0.5,
				exclude: 4,
				require: 2,
				options: ['r', 'n', 't', 'm', 'l', 'th', 'b']
			}, {
				chance: 0.7,
				require: 6,
				options: ['stan', 'sia', 'nia', 'ria', 'lia', 'via', 'da', 'ra', 'ia', 'la', 'gua', 'ea', 'y', 'ay', 'bourg', 'it', 'stein', 'scar', '']
			}, {
				chance: 0.7,
				exclude: 7,
				options: ['stan', 'scar', 'tania', 'nia', 'nia', 'lia', 'ria', 'via', 'sia', 'stein', 'da', 'ra', 'lia', 'thia', 'la', 'zil', 'gua', 'na', 'mar', 'in', 'ca', 'nce', 'que', 'pan', 'nya', 'os', 'on', 'non', 'don', 'ger', '']
			}, ];
			break;
		case 'city':
			d = [{
				chance: 0.1,
				options: ['New ', 'Old ', 'San ', 'Los ', 'Sao ']
			}, {
				chance: 0.2,
				options: ['Winter', 'Wood', 'Summer', 'Sunny', 'Hill', 'Somer', 'River', 'Angel', 'Riven', 'Small', 'Hog', 'Fog']
			}, {
				require: 1,
				options: ['ville', 'vale', 'town', 'fell', 'fale', 'thale', 'hale', 'set', 'dale', 'dell', 'butte', 'smeade', 'warts', 'cliff', 'bourg']
			}, {
				exclude: 1,
				options: ['Q', 'T', 'Y', 'Az', 'M', 'W', 'J', 'Sh', 'Om', 'Lux', 'L', 'M', 'P', 'V', 'O', 'H', 'R', 'Cr', 'U', 'D']
			}, {
				require: 3,
				options: ['a', 'o', 'er', 'aka', 'u', 'a', 'a', 'a', 'em', 'y', 'o', 'o', 'e', 'e', 'e']
			}, {
				require: 3,
				options: ['kyo-', 'rk-', 'this-', 'bourg-', 'djan-', 'scow-', 'th', 'long', 'nd', 'ng', 'ngh-', 'ris-', 'nice-', 'me-', 'ka-', 'kk', 'ji-', 'je-', 'scent-']
			}, {
				require: 4,
				chance: 0.7,
				options: ['ai', 'u', 'yu', 'ah', 'y', 'ay', 'is', 'am', 'ym', 'im', 'on', 'aido']
			}];
			break;
	}

	var a = '';
	for (var b = 0; b < d.length; b++) {
		if (d[b].chance !== undefined && d[b].chance < 1) {
			if (Math.random() > d[b].chance) {
				continue;
			}
		}
		if (d[b].exclude !== undefined && d[d[b].exclude].used) {
			continue;
		}
		if (d[b].require !== undefined && !d[d[b].require].used) {
			continue;
		}
		d[b].used = true;
		switch (d[b].type) {
			case 'int':
				if (d[b].min === undefined) {
					d[b].min = 0;
				}
				a += Math.floor(Math.random() * (d[b].max + 1 - d[b].min)) + d[b].min;
				break;
			case 'string':
				/* falls through */
			default:
				a += d[b].options[parseInt(Math.random() * d[b].options.length)];
				break;
		}
		if (a.substr(-1) == '-') {
			break;
		}
	}
	return a.replace(/^\s+|[\s-]+$/g, '');
};

self.addEventListener('message', function(event) {
	var customConfig = event.data,

		CONFIG = {
			tx_w: 720,
			tx_h: 0,
			w: 360,
			h: 0,
			waterLevel: 0.6,
			horse_lats: 32,
			polar_lats: 60,
			wind_mix: 5,
			temperature: 268.15,
			pop_ratio: 26991953,
			height_ratio: 8000,
			world_pop: 11000000,
			maximums:{
				total_pop: 0
			},
			landmass_size: 0.62,
			seed: false
		};

	// Override default configs with supplied ones, if they exist.
	for (var key in customConfig)
		if (customConfig.hasOwnProperty(key))
			CONFIG[key] = customConfig[key];

	if(!CONFIG.seed) {
		var d = new Date();
		CONFIG.seed = d.getTime().toString();
	}
	// Force Mercator projection dimensions on image
	CONFIG.tx_h = CONFIG.tx_w / 2;
	CONFIG.h = CONFIG.w / 2;

	// Math.seedrandom(1396304923488); This is a great seed to test climate simulator changes. Very "messy" landscape
	Math.seedrandom(CONFIG.seed);

	var P = PerlinSimplex; // Set Perlin function to the Simplex object for texture
	P.setRng(Math);

	var myEarth = new Planet(CONFIG,P);
    
    myEarth.generate(P,function () { // function to run after generation is complete
		// Remove cyclic references for sending the data
		//http://stackoverflow.com/questions/15560518/elegantly-reattach-methods-to-object-in-web-worker serialize each datapoint ?! Import common classes to all the files
		for(var i = 0, n = myEarth.data.length; i < n; i++) {
			myEarth.data[i].adjacent[0] = myEarth.data[i].adjacent[0].id;
			myEarth.data[i].adjacent[1] = myEarth.data[i].adjacent[1].id;
			myEarth.data[i].adjacent[2] = myEarth.data[i].adjacent[2].id;
			myEarth.data[i].adjacent[3] = myEarth.data[i].adjacent[3].id;
		}

		self.postMessage({
			cmd: 'ready',
		config: CONFIG
		});

		self.postMessage({
			cmd: 'data',
			points: myEarth.data,
			countries: myEarth.countries,
			generatedName: generateName('virus'),
		});

		self.postMessage({
			cmd: 'texture',
			texture: myEarth.texture.buffer
		},[myEarth.texture.buffer]);

		self.postMessage({
			cmd: 'complete'
		});
    });

}, false);

var ProgressCalc = function(loadShares) {
	var currentStep = 0,
		totalProgress = 0,
		advance = function(currentProgress) {
			if(loadShares[currentStep] === undefined)
				console.warn('You have more generator steps than was defined');

			self.postMessage({
				cmd: 'progress',
				message: currentStep,
				progress: totalProgress + currentProgress * loadShares[currentStep]
			});
		};

	return {
		advance: advance,
		done: function() {
			totalProgress += loadShares[currentStep];
			currentStep++;
			advance(0);
		}
	};
};

var Country = function(i,center){
	this.id = i;
	this.centroid = center;
	this.panic = 0;

	this.color = [
		Math.floor(Math.random()*256),
		Math.floor(Math.random()*256),
		Math.floor(Math.random()*256)
	];

	if(this.color[0] > this.color[1] && this.color[0] > this.color[2])
		this.color[0] = 255;
	else if(this.color[1] > this.color[0] && this.color[1] > this.color[2])
		this.color[1] = 255;
	else
		this.color[2] = 255;

	this.name = generateName('country');
};
Country.prototype = {
	id: 0,
	color: [0,0,0],
	name: '',
	centroid: null,
	capitol: null,
	panic: 0
};

var Planet = function(config, perlinFunction) {
	this.config = config;
	this.P = perlinFunction;
};
Planet.prototype = {
	data:[],
	texture:[],
	grid_point:[],
	countries:[null], // make the countries start at 1 so there's no 'country 0'
	max:0,
	config: {}
};

Planet.prototype.generate = function(P,callback) {
	// Generate terrain texture
	var planet = this,
		// progress share array should sum 1
		progress = ProgressCalc([
			0.40,
			0.01,
			0.01,
			0.33,
			0.05,
			0.05,
			0.15,
			0
		]);
	this.progress = progress;

	var perlinSphereGenerator = function (width, scale, octaves) {
		if(typeof scale == 'function') {
			this.customFunction = scale;
		} else {
			this.scale = scale;
		}

		if(octaves !== undefined)
			this.octaves = octaves;

		this.w = width;

		this.data = this.generate();
	};
	perlinSphereGenerator.prototype = {
		P: planet.P,
		getPoint: planet.P.noise,
		scale: 1,
		octaves: 3,
		rowPointDistance: [],
		generate: function() {
			this.h = this.w / 2; // Height is always 1/2 of width in mercator
			var data_ratio = this.w / planet.config.w, // Determine the resolution of the globe, size must remain constant for consistent results
				reportInterval = 800 * ( data_ratio * data_ratio ), // How many times we can run the perlin generator before reporting the progress (for speed)
				n = this.w * this.h,
				falloff = 0.5,
				degToRad = Math.PI / 180,
				centerRowSquareSize = planet.getDistance(0.5/data_ratio, 0.5/data_ratio, 0.5/data_ratio, 1.5/data_ratio),
				radx,rady,xx,yy,zz,val,currentRow,currentRowSquareSize;

			var storage = new ArrayBuffer(n * 4); // 4 bytes per element for 32 bit float
			var landGen = new Float32Array(storage);
			this.P.noiseDetail(this.octaves, falloff);

			for(var i = 0, columnsCopied = 1; i < n; i++,columnsCopied++) {
				if(currentRow != Math.floor(i / this.w) || currentRowSquareSize * columnsCopied >= centerRowSquareSize) {
					currentRow = Math.floor(i / this.w);
					columnsCopied = 1;
					currentRowSquareSize = planet.getDistance((currentRow + 0.5 - this.h / 2)/data_ratio, 0.5/data_ratio, (currentRow + 0.5 - this.h / 2)/data_ratio, 1.5/data_ratio);

					radx = (i % this.w + 0.5) / data_ratio * degToRad; // we want to use the centers of the lat and long grid squares to avoid calculating with the poles
					rady = (currentRow + 0.5) / data_ratio * degToRad;
					xx = Math.sin(rady) * Math.cos(radx);
					yy = Math.sin(rady) * Math.sin(radx);
					zz = Math.cos(rady);

					if(this.customFunction === undefined)
						val = this.getPoint(xx * this.scale, yy * this.scale, zz * this.scale);
					else
						val = this.customFunction(xx,yy,zz);
				}
				landGen[i] = val;

				if(i % reportInterval == reportInterval - 1)
					planet.progress.advance(i/n);
			}

			return landGen;
		}
	};
	perlinSphereGenerator.prototype.rowPointDistance[89] =
	perlinSphereGenerator.prototype.rowPointDistance[90] = planet.getDistance(0, 0, 0, 1);

	var planetSurface = new perlinSphereGenerator(planet.config.tx_w, function (xx, yy, zz) {
		xx *= planet.config.landmass_size;
		yy *= planet.config.landmass_size;
		zz *= planet.config.landmass_size;
		this.P.noiseDetail(8,0.50);
		var landMask = this.P.noise(xx*0.8, yy*0.8, zz*0.8); // generate the land edges first

		if(landMask > planet.config.waterLevel) {
			this.P.noiseDetail(6,0.50);
			var rBase = this.P.noise(xx, yy, zz); // Hills and base shape of the landmasses
			var rRidge = Math.pow(1 - Math.abs(1 - 2 * this.P.noise(2*xx, yy, 2*zz)), 4); // Mountain ridges

			var edgeSmoothing = 1 - planet.config.waterLevel;
			if((landMask - planet.config.waterLevel) < 0.75)
				edgeSmoothing = Math.sin(1.5*Math.PI*(landMask - planet.config.waterLevel));
			
			return (rBase*0.25 + rRidge*0.75) * edgeSmoothing + planet.config.waterLevel;

		} else {
			return landMask;
		}
	});
	progress.done();

	planet.texture = planetSurface.data;
	planet.setHeight(planet.texture);
	progress.done();

	planet.calculateCoastLine();
	progress.done();

	planet.calculateClimate();
	progress.done();

	Math.seedrandom( Math.random() );
	var populationNoise = new perlinSphereGenerator(planet.config.w, 4, 8);
	progress.done();

	Math.seedrandom( Math.random() );
	var countryBordersNoise = new perlinSphereGenerator(planet.config.w, 2, 7);
	progress.done();

	planet.generatePop(populationNoise.data, countryBordersNoise.data);
	progress.done();

	setTimeout(callback,50);
};

// Returns the distance between two points given by ID as a fraction of the radius. Multiply by the radius of globe to get actual distance.
Planet.prototype.getDistance = function(xLat, xLng, yLat, yLng) {
	var phi = (xLat - yLat)/180*Math.PI,
		theta = (xLng - yLng)/180*Math.PI,
		phix = xLat/180*Math.PI,
		phiy = yLat/180*Math.PI;
	
	var a = (Math.sin(phi/2) * Math.sin(phi/2) +
	        Math.sin(theta/2) * Math.sin(theta/2) * Math.cos(phix) * Math.cos(phiy));
	return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Sets the surface height for all the points on the globe using a provided heightmap
Planet.prototype.setHeight = function(heightmap) {
	var pps = Math.floor(Math.sqrt(heightmap.length / (this.config.w * this.config.h))); //  scaling factor since the heightmap will likely be higher resolution
	var heightmapW = pps*this.config.w;
	var shift,
		height,
		point = 0,
		i = 0;
	while(heightmap[i] !== undefined) {
		if(this.data[point] === undefined)
			this.data[point] = new DataPoint(point, this.config);
		shift = pps-1;
		// this retarded looking shit averages the heights on the higher-resolution heightmap to produce the standard grid
		height = (heightmap[i] + heightmap[i+shift] + heightmap[i+pps*this.config.w*(shift)] + heightmap[i+heightmapW*(shift) + shift]) / 4;
		if(height > this.config.waterLevel)
			this.data[point].height = (height - this.config.waterLevel)/(1 - this.config.waterLevel) * this.config.height_ratio;
		else {
			this.data[point].height = 0;
			this.data[point].water = true;
		}
		i = i + pps;
		if(i % heightmapW === 0)
			i = i + heightmapW * shift;
		point++;
	}
};

// Sets the population for all the points on the globe using a provided perlin heightmap
// Also define countries
Planet.prototype.generatePop = function(heightmap, borderNoise) {
	var i,j,k,n,current,result_pop,livability,concentration,world_pop=0,centroids=[],
		planet = this;

	// Parse through all the grid squares and determining the amount of people that live in them.
	// Also define country centers based on the population and a random generator.
	for(i = 0, n = heightmap.length; i < n; i++) {
		current = this.data[i];
		if(!current.water) {
			// Work out population of each given square based on Perlin density function and conditions
			concentration = 3;
			livability = 1 + 0.15*Math.pow(current.coast_distance + 1,-0.75); // Closer to the coast is better
			
			livability *= 1.08 - Math.abs(300 - current.temperature) / 130; // temperate temperature is better
			if(current.temperature < this.config.temperature) // colder areas have less people living in the outskirts
				concentration += ((this.config.temperature)/current.temperature)*200 - 200;
			if(current.temperature < this.config.temperature-10)  // if it becomes too cold, population is drastically reduced
				livability *= 0.1 + 0.9/(this.config.temperature - current.temperature - 9);
			if(current.temperature < this.config.temperature-20) // fuckin cold nothing is there
				current.polar = true;
			
			if(current.precipitation < 10)
				livability *= 0.01 + current.precipitation/(10/0.99); // People don't live in desserts
			result_pop = Math.pow(Math.log(1-heightmap[i]*livability)/(-1*concentration),2);
			if(isNaN(result_pop))
				current.total_pop = 0;
			else {
				current.total_pop = result_pop;
				world_pop += result_pop;
			}

			// Generate centers of countries randomly depending on livability
			if(!current.polar && Math.random() < livability*livability/200) {
				current.country = this.countries.length;
				this.countries[current.country] = new Country(current.country,current);
				centroids[centroids.length] = current;
			}
		}
	}
	this.progress.advance(0.05);
	if(centroids.length) {
		// Determine the population multiplier based on the desired total world population
		this.config.pop_ratio = this.config.world_pop / world_pop;

		var centroidSort = function(i) {
			return function(x,y) {
				return planet.getDistance(i.lat, i.lng, x.lat, x.lng) - planet.getDistance(i.lat, i.lng, y.lat, y.lng);
			};
		};

		// Multiply relative populations with the ratio to get the actual number of people living in each square.
		// Also define the base country divisions using Voronoi analysis of the country centers
		for(i = 0, n = this.data.length; i < n; i++) {
			current = this.data[i];

			if(current.total_pop > 0) {
				if(current.total_pop < 50/this.config.pop_ratio)
					current.total_pop = 0;
				else {
					current.total_pop = Math.floor(current.total_pop*this.config.pop_ratio);
					if(current.total_pop > this.config.maximums.total_pop)
						this.config.maximums.total_pop = current.total_pop;
				}
			}
			if(!current.water) {
				centroids.sort(centroidSort(current));
				current.country = centroids[0].country;
			}
			current.perlinTest = borderNoise[i];
		}
		this.progress.advance(0.1);

		// Fuzzify the country edges based on perlin noise, otherwise the country borders will be straight lines
		for(j = 0; j < 10; j++) {
			for(i = 0, n = this.data.length; i < n; i++) {
				current = this.data[i];
				if((!current.water && !current.polar) || current.total_pop > 0) {
					for(k = 0; k < 4; k++) {
						if(borderNoise[current.adjacent[k].id] < borderNoise[current.id])
							current.adjacent[k].country = current.country;
					}
				}
			}
		}
		this.progress.advance(0.15);

		for(i = 0, n = this.data.length; i < n; i++) {
			current = this.data[i];
			if(current.total_pop > 0) {
				// Try to get rid of any one-cell wide bits of countries to clean up.
				if(current.adjacent[0].country !== 0 && current.adjacent[0].country != current.country && current.adjacent[0].country == current.adjacent[2].country)
					current.country = current.adjacent[0].country;
				else if(current.adjacent[1].country !== 0 && current.adjacent[1].country != current.country && current.adjacent[1].country == current.adjacent[3].country)
					current.country = current.adjacent[1].country;
			}
		}
		this.progress.advance(0.2);

		for(i = 0, n = this.data.length; i < n; i++) {
			current = this.data[i];
			// Find the biggest squares in each country and designate it as the capitol.
			if(current.total_pop > 0 && (this.countries[current.country].capitol === null || this.countries[current.country].capitol.total_pop < current.total_pop))
				this.countries[current.country].capitol = current;
		}
		this.progress.advance(0.25);

		// Remove countries without capitols (meaning countries with no population), set capitol names?
		for(i = 1; i < this.countries.length; i++) {
			if(this.countries[i].capitol === null) {
				this.countries.splice(i,1);
				i--;
				for(j = 0, n = this.data.length; j < n; j++) {
					if(this.data[j].country > i)
						this.data[j].country--;
				}
			}/* else {
				this.countries[i].capitol.name = this.generateName('city');
			}*/
		}

		// Calculate distances to country borders
		var borderDistRing = this.data.slice(0);
		var target,dir,dist;
		while(borderDistRing.length > 0) {
			current = borderDistRing.shift();
			if(!current.water && current.country) {
				// New border tiles detected on first pass through
				if(current.border_direction === undefined) {
					if(current.coast_distance == 1 || current.adjacent[0].country != current.country || current.adjacent[1].country != current.country || current.adjacent[2].country != current.country || current.adjacent[3].country != current.country) {
						current.border_direction = [2,1,3,0];
						current.border_distance = 1;
						borderDistRing.push(current);
					}
				// Second passthrough, start spreading tiles
				} else {
					for(j=0;j<current.border_direction.length;j++) {
						dir = current.border_direction[j];
						target = current.adjacent[dir];
						// If the target to check is the same country and has not been calculated yet, do it
						if(target.country == current.country) {
							if(dir == 3 || dir == 1)
								dist = Math.abs(Math.sin((90 - current.lat) * Math.PI / 180));
							else
								dist = 1;
							if(target.border_distance === 0 || target.border_distance > current.border_distance + dist) {
								target.border_distance = current.border_distance + dist;
								target.border_direction = [2,1,3,0];
								borderDistRing.push(target);
							}
						}
					}
				}
			}
		}

		this.progress.advance(0.35);

		for(i = 0, n = this.data.length; i < n; i++) {
			// Clean up unneeded stuff from all the previous steps
			delete this.data[i].border_direction;
			delete this.data[i].coast_direction;
			delete this.data[i].wind;

			this.data[i].updateNearbyPop();
			if(i % 1000 === 0)
				this.progress.advance(0.35 + 0.6 * i / this.data.length);
		}
	}
	this.progress.advance(1);
};

// Figure out how far each tile is from the coast
Planet.prototype.calculateCoastLine = function() {
	var coastDistRing = this.data.slice(0);
	var i,j,target,dir,dist;
	var adj = {n:0,w:0,e:0,s:0};

	while(coastDistRing.length > 0) {
		var current = coastDistRing.shift();
		i = current.id;
		// Get the adjacent tile IDs
		if(!current.adjacent.length) {
			adj = this.getAdj(i);
			current.adjacent = [this.data[adj.n],this.data[adj.e],this.data[adj.s],this.data[adj.w]];
		}
		if(!current.water) {
			// New coast tile detected on first pass through
			if(current.coast_direction === undefined) {
				if(current.adjacent[0].water || current.adjacent[1].water || current.adjacent[2].water || current.adjacent[3].water) {
					current.coast_direction = [];
					if(current.adjacent[0].water) current.coast_direction.push(2);
					if(current.adjacent[1].water) current.coast_direction.push(3);
					if(current.adjacent[2].water) current.coast_direction.push(0);
					if(current.adjacent[3].water) current.coast_direction.push(1);
					current.coast_distance = 1;
					coastDistRing.push(current);
				}
			// Second passthrough, start spreading tiles
			} else {
				for(j=0;j<current.coast_direction.length;j++) {
					dir = current.coast_direction[j];
					target = current.adjacent[dir];
					// If the target to check is not water and has not been calculated yet, do it
					if(!target.water) {
						if(dir == 3 || dir == 1)
							dist = Math.abs(Math.sin((90 - current.lat) * Math.PI / 180));
						else
							dist = 1;
						if(target.coast_distance === 0 || target.coast_distance > current.coast_distance + dist) {
							target.coast_distance = current.coast_distance + dist;
							target.coast_direction = [2,1,3,0];
							coastDistRing.push(target);
						}
					}
				}
			}
		}
	}
};

// Simulate the climate by following the wind across the tiles and monitoring the progress
// Going over water 'recharges' the moisture based on latitude (more recharging when warmer), going over land lowers it based on altitude change. (mountains sap all the water)
// Wind starts at +-32 degrees latitude (Horse Latitude) and at the poles and starts out with no moisture.
Planet.prototype.calculateClimate = function() {
	var i,current,
		n = this.config.horse_lats * 1.5,
		planet = this;

	var Wind = function(location, direction) {
		this.location = location;
		this.direction = direction;
		this.blendWinds = [];
		this.blendAmts = [];

		location.wind = this;
	};

	Wind.prototype = {
		temperature: 0,
		moisture: 0,
		saturationPressure: 0,
		blendDistance: 4,
		coriolis: 0,
		options: {
			wtrChangeTemp: 0.65,
			gndChangeTemp: 0.5,
			feedbackChangeTemp: 0.1,
			wtrAddMoisture: 0.1,
			rainSpeed: 0.05,
			gndChangeMoisture: 0.1,
			centerWeight: 0.5,
			coriolisStrength: 250,
		},
		// Changes temperature based on terrain, returns a value of precipitation
		init: function() {
			if(this.moveTo !== undefined) {
				if(this.moveTo.wind) {
					if(this.reduce === undefined)
						this.reduce = 1;
					else
						this.reduce *= 0.75;

					if(this.reduce < 0.025) {
						return false;
					}
				}
				if(this.moveTo.wind instanceof Wind) {
					// swap move
					var swapWith = this.moveTo.wind;
					this.location.wind = swapWith;
					swapWith.location = this.location;
					delete swapWith.moveTo;

					this.location = this.moveTo;
					this.location.wind = this;

					swapWith.blend(this,0.5);
					this.blend(swapWith, 0.5);
					swapWith.doBlend();
					this.doBlend();

					swapWith.blendDistance /= 4;
					this.blendDistance /= 4;

					swapWith.reduce = 1;
					this.reduce = 1;
				}
				else {
					this.location.wind = true; // Went through here
					this.location = this.moveTo;
					this.location.wind = this;
				}

				delete this.moveTo;
			}

			var adjustedLat = Math.abs(this.location.lat);

			// Temperature function based on insolation and air pressure change due to elevation
			var baseTemperature = planet.config.temperature + 40*(Math.cos(adjustedLat * Math.PI / 90)) - 0.0075 * this.location.height;

			if(!this.temperature) {
				this.temperature = baseTemperature;
			} else {
				if(this.location.water)
					this.temperature = this.temperature * (1 - this.options.wtrChangeTemp) + baseTemperature * this.options.wtrChangeTemp;
				else
					this.temperature = this.temperature * (1 - this.options.gndChangeTemp) + baseTemperature * this.options.gndChangeTemp;
			}

			// Equation for saturation pressure vs temperature: http://www.engineeringtoolbox.com/water-vapor-saturation-pressure-air-d_689.html
			this.saturationPressure = Math.pow(Math.E, 77.3450 + 0.0057 * this.temperature - 7235 / this.temperature) / Math.pow(this.temperature, 8.2);

			// Add moisture up to saturation when over water
			if(this.location.water)
				this.moisture += (this.saturationPressure - this.moisture) * this.options.wtrAddMoisture;

			return true;
		},
		move: function(newLocation) {
			this.moveTo = newLocation;
		},
		apply: function() {
			if(this.reduce !== undefined)
				this.location.temperature = this.location.temperature * (1 - this.reduce) + this.temperature * this.reduce;
			else
				this.location.temperature = this.temperature;

			this.saturationPressure = Math.pow(Math.E,77.3450+0.0057*this.temperature-7235/this.temperature)/Math.pow(this.temperature,8.2);
			
			var precipitation = 0;
			// If temperature decreases for whatever reason and lowers the saturation pressure, rain out the extra water
			if(this.saturationPressure < this.moisture ) {
				precipitation += (this.moisture - this.saturationPressure) * this.options.rainSpeed * 2;
			}
			precipitation += (this.moisture/this.saturationPressure) * this.moisture * this.options.rainSpeed;

			if(precipitation > this.moisture)
				precipitation = this.moisture;

			if(this.reduce !== undefined)
				this.location.precipitation = this.location.precipitation * (1 - this.reduce) + precipitation * this.reduce;
			else
				this.location.precipitation = precipitation;

			this.moisture -= precipitation;
		},
		feedback: function() {
			var dryModifier = 18 / (this.location.precipitation + 1) - 3;
			if(dryModifier + this.location.temperature > 312.5)
				dryModifier = 312.5 - this.location.temperature;

			this.location.temperature += dryModifier;

			this.temperature = this.temperature * (1 - this.options.feedbackChangeTemp) + this.location.temperature * this.options.feedbackChangeTemp;
		},
		blend: function(blendWith, strength) {
			this.blendWinds.push({
				temperature: blendWith.temperature,
				moisture: blendWith.moisture
			});

			if(this.reduce !== undefined)
				this.blendAmts.push(strength * this.reduce);
			else
				this.blendAmts.push(strength);
		},
		doBlend: function() {
			var maxAmt = 0,
				totalAmt = 0,
				temperature = 0,
				moisture = 0;
			var currentcacher = [];

			while(this.blendWinds.length) {
				var current = this.blendWinds.pop(),
					currentAmt = this.blendAmts.pop();

				if(currentAmt > maxAmt)
					maxAmt = currentAmt;
				totalAmt += currentAmt;

				currentcacher.push(current);
				currentcacher.push(currentAmt);

				temperature += current.temperature * currentAmt;
				moisture += current.moisture * currentAmt;
			}

			if(totalAmt) {
				this.temperature = this.temperature * (1 - maxAmt) + temperature * maxAmt / totalAmt;
				this.moisture = this.moisture * (1 - maxAmt) + moisture * maxAmt / totalAmt;
			}
		}
	};

	var turns = 0, winds = [];
	// Create all the wind objects
	/*
	for(i = 72; i < 86; i++) {
		winds.push(new Wind(this.data[this.data.length / 2 - this.config.horse_lats * this.config.w + i],       's'));
		winds.push(new Wind(this.data[this.data.length / 2 + (planet.config.horse_lats - 1) * this.config.w + i],       'n'));
	}*/

	for(i = 0; i < planet.config.w; i++) {
		winds.push(new Wind(this.data[i],                                                                       's'));
		winds.push(new Wind(this.data[this.data.length / 2 - (this.config.horse_lats + 1) * this.config.w + i], 'n'));
		winds.push(new Wind(this.data[this.data.length / 2 - this.config.horse_lats * this.config.w + i],       's'));
		winds.push(new Wind(this.data[this.data.length / 2 + (this.config.horse_lats - 1) * this.config.w + i], 'n'));
		winds.push(new Wind(this.data[this.data.length / 2 + (this.config.horse_lats) * this.config.w + i],     's'));
		winds.push(new Wind(this.data[this.data.length - this.config.w + i],                                    'n'));
	}

	while(winds.length > 0) {
		for(i = 0; i < winds.length; i++) {
			// If wind init returns false, wind is finished and delete it.
			if(!winds[i].init()) {
				winds[i].location.wind = true;
				winds.splice(i, 1);
				i--;
			}
		}
		for(i = 0; i < winds.length; i++) {
			current = winds[i];

			var blendStrength = (0.8 - 1/current.blendDistance) + 0.1;

			if(current.reduce !== undefined) {
				blendStrength *= current.reduce;
			}

			for(var j = 0; j < current.blendDistance; j++) {
				if(current.location.adjacent[1].wind instanceof Wind)
					current.location.adjacent[1].wind.blend(current, Math.pow(blendStrength, j + 1));
				if(current.location.adjacent[3].wind instanceof Wind)
					current.location.adjacent[3].wind.blend(current, Math.pow(blendStrength, j + 1));
			}
		}
		for(i = 0; i < winds.length; i++) {
			current = winds[i];

			current.doBlend();
			current.apply();
			//current.feedback();

			// Advance wind front
			var target;
			switch(current.direction) {
				case 'n':
					target = current.location.adjacent[0];
					break;
				case 's':
					target = current.location.adjacent[2];
					break;
			}

			// Calculate Coriolis Force 
			current.coriolis += Math.asin(Math.sin((90 - current.location.lat) * Math.PI / 180) - Math.sin((90 - target.lat) * Math.PI / 180)) * current.options.coriolisStrength;
			if(current.coriolis > 0) { // Coriolis force is positive, move the wind east (positive lat)
				while(current.coriolis > 1) {
					target = target.adjacent[1];
					current.coriolis--;
					current.blendDistance++;
				}
			} else { // Coriolis force is negative, move the wind west (negative lat)
				while(current.coriolis < -1) {
					target = target.adjacent[3];
					current.coriolis++;
					current.blendDistance++;
				}
			}

			current.move(target);
		}

		turns++;
		planet.progress.advance(turns/n);
	}
};

Planet.prototype.getAdj = function(i, direction) {
	if (direction === undefined) {
		var adj = {
			n: 0,
			w: 0,
			e: 0,
			s: 0
		};
		if (i % this.config.w === 0) adj.w = i + this.config.w - 1;
		else adj.w = i - 1;
		if ((i + 1) % this.config.w === 0) adj.e = i - this.config.w + 1;
		else adj.e = i + 1;
		if (i - this.config.w < 0)
			if (i - this.config.w / 2 < 0) adj.n = i + this.config.w / 2;
			else adj.n = i - this.config.w / 2;
			else adj.n = i - this.config.w;
		if (i + this.config.w > this.config.w * this.config.h - 1)
			if (i + this.config.w / 2 > this.config.w * this.config.h - 1) adj.s = i - this.config.w / 2;
			else adj.s = i + this.config.w / 2;
			else adj.s = i + this.config.w;
		return adj;
	} else {
		var result;
		switch (direction) {
			case 'w':
				if (i % this.config.w === 0)
					result = i + this.config.w - 1;
				else
					result = i - 1;
				break;
			case 'e':
				if ((i + 1) % this.config.w === 0)
					result = i - this.config.w + 1;
				else
					result = i + 1;
				break;
			case 'n':
				if (i - this.config.w < 0)
					if (i - this.config.w / 2 < 0)
						result = i + this.config.w / 2;
					else
						result = i - this.config.w / 2;
					else
						result = i - this.config.w;
				break;
			case 's':
				if (i + this.config.w > this.config.w * this.config.h - 1)
					if (i + this.config.w / 2 > this.config.w * this.config.h - 1)
						result = i - this.config.w / 2;
					else
						result = i + this.config.w / 2;
					else
						result = i + this.config.w;
				break;
		}
		return result;
	}
};