/*
    3d renderer module. 
    Dependencies: Three.js
*/
/* global requestAnimationFrame */
/* global hqx */
/* global SPE */
/* exported Renderer */
var Renderer = function (scaling,onLoad) {
    // Initialize variables
    var Camera, Scene, Sphere, SceneRenderer, DataBarsMesh, DataBarsGeometry, DataBarMesh,
        hordeSystem = {
            length: 0,
            maxSize: 0,
            particles: null,
            arrayLinks: []
        },
        WindowConfig = {
            windowX: 0,
            windowY: 0,
            scaling: 0,
            rotation: { x: 0, y: 0, z: 0 },
            mouseVector: new THREE.Vector3(0, 0, 0)
        },
        visualization = {
            mesh: null,
            texture: null,
            textureCanvas: null,
            textureStore: {},
            decalTextures: {},
            decals: {},
            arc: null
        },
        dataBarColors = {
            min: [
                0.6,// h
                1.0,// s
                0.5 // l
            ],
            max: [
                0.2,// h
                1.0,// s
                0.5 // l
            ]
        },
        onRender = function () {},
        ready = false,
        generatorConfig = null,
        dataPoints = [];

    // Define constants
    var PI_HALF = Math.PI / 2;

    var climateGradient = document.createElement('canvas'),
        climateBg = new Image();

    climateBg.onload = function () {
        climateGradient.width = climateBg.width;
        climateGradient.height = climateBg.height;
        var ctx = climateGradient.getContext('2d');
        ctx.drawImage(climateBg, 0, 0);
        onLoad();
    };
    climateBg.src = 'ui/climateGradient.jpg';

    // Load decal textures here
    visualization.decalTextures.gun = new THREE.ImageUtils.loadTexture('ui/decals/gun.png');
    visualization.decalTextures.seaport = new THREE.ImageUtils.loadTexture('ui/decals/port.png');
    
    /* Create 3D Globe --------------------- */
    Camera = new THREE.PerspectiveCamera( 60, WindowConfig.windowX / WindowConfig.windowY, 1, 10000 );
    Camera.position.z = 450;

    Scene = new THREE.Scene();

    var group = new THREE.Object3D();
    Sphere = new THREE.Object3D();

    group.add( Sphere );
    Scene.add( group );

    var init = function() {

        // lights

        var ambientLight = new THREE.AmbientLight( 0x808080 );
        Scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xcccccc, 2 );
        directionalLight.position.set( -600, 0, 400 );
        directionalLight.target = Sphere;
        directionalLight.castShadow = true;
        Scene.add( directionalLight );

        // Visualization layer floating above the earth
        var visualLayerGeometry = new THREE.SphereGeometry( 202, 40, 30 );
        visualization.texture = new THREE.Texture( visualization.textureCanvas );
        visualization.mesh = new THREE.Mesh(visualLayerGeometry, new THREE.MeshLambertMaterial({ map: visualization.texture, opacity: 0.8, transparent: true }));
        visualization.mesh.visible = false;
        Sphere.add( visualization.mesh );

        // Arc for showing shipping routes and flights
        var visualArcGeometry = new THREE.Geometry();
        while(visualArcGeometry.vertices.length < 108)
            visualArcGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        visualization.arc = new THREE.Line(visualArcGeometry,new THREE.LineBasicMaterial({linewidth:5}));
        visualization.arc.visible = false;
        Sphere.add( visualization.arc );

        // Bars to show various point properties
        var geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
        // Move the 'position point' of the cube to the bottom so it sits on the surface of the globe.
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, -0.5) );
        DataBarMesh = new THREE.Mesh(geometry); // humans

        Camera.lookAt( Scene.position );
        //Camera.position.x = -100;

        /*SceneRenderer = new THREE.CanvasRenderer();
        SceneRenderer.setSize( window.innerWidth, window.innerHeight );*/
        SceneRenderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x060708, clearAlpha: 1 } );
        SceneRenderer.shadowMapEnabled = true;
        resize();

        document.getElementById('container').appendChild( SceneRenderer.domElement );

        DataBarsGeometry = new THREE.Geometry();
        DataBarsGeometry.dynamic = true;

        addHordeParticles();
    },

    simulatorStart = function(texture, generatorOptions, generatorDataAll) {
        generatorConfig = generatorOptions;
        var generatorData = generatorDataAll.points;

        // Function for filling the canvases with the data generated previously
        var buildImage = function(globeTexture, globeHeightmap, texture) {
            var current, dtI, gradX, gradY, gradI, color, currentTemp, currentWet,
                ctxT = globeTexture.getContext('2d'),
                ctxH = globeHeightmap.getContext('2d'),
                ctxC = climateGradient.getContext('2d'),
                imgdT = ctxT.getImageData(0, 0, generatorConfig.tx_w, generatorConfig.tx_h),
                imgdH = ctxH.getImageData(0, 0, generatorConfig.tx_w, generatorConfig.tx_h),
                imgdC = ctxC.getImageData(0, 0, climateGradient.width, climateGradient.height),
                pixT = imgdT.data,
                pixH = imgdH.data,
                grdC = imgdC.data,
                maxColorHeight = climateBg.height/2,
                maxColorWidth = climateBg.width,

                data_ratio = generatorConfig.tx_w / generatorConfig.w;

            var blendProperties = function(center, low, high, ratio) {
                if(ratio > 0 && ratio < 1)
                    if(ratio < 0.5) {
                        return center * (2 * ratio) + low * (1 - 2 * ratio);
                    } else {
                        return center * (2 - 2 * ratio) + high * (2 * ratio - 1);
                    }
            };

            for (var i = 0, n = texture.length; i < n; i++) {
                current = texture[i];

                // Figure out the current square in the data map (as opposed to the texture map)
                dtI = Math.floor(i / generatorConfig.tx_w / data_ratio) * generatorConfig.w + Math.floor(i % generatorConfig.tx_w / data_ratio);

                // Get the percentage of how far in the datasquare the current point is to get the ratios of blending with adjacent square values.
                var positionV = ( (Math.floor(i / generatorConfig.tx_w) + 0.5) % data_ratio ) / data_ratio;
                var positionH = ( (i % generatorConfig.tx_w + 0.5) % data_ratio ) / data_ratio;

                currentTemp = blendProperties(generatorData[dtI].temperature, generatorData[dtI].adjacent[0].temperature, generatorData[dtI].adjacent[2].temperature, positionV);
                currentWet = blendProperties(generatorData[dtI].precipitation, generatorData[dtI].adjacent[0].precipitation, generatorData[dtI].adjacent[2].precipitation, positionV);
                currentTemp = (currentTemp + blendProperties(generatorData[dtI].temperature, generatorData[dtI].adjacent[3].temperature, generatorData[dtI].adjacent[1].temperature, positionH)) / 2;
                currentWet = (currentWet + blendProperties(generatorData[dtI].precipitation, generatorData[dtI].adjacent[3].precipitation, generatorData[dtI].adjacent[1].precipitation, positionH)) / 2;

                // Get the x/y coordinates in the climate coloring textureW
                gradY = Math.round((1 - (312.5 - currentTemp) / 60) * (maxColorHeight - 1));
                gradY = Math.min(Math.max(gradY, 0), maxColorHeight - 1);

                // Generate height texture (greyscale map of elevation) and earth texture (color map using climate info)
                if (current > generatorConfig.waterLevel) {
                    gradX = Math.round((1 - currentWet/20)*(maxColorWidth - 1));
                    gradX = Math.min(Math.max(gradX, 0), maxColorWidth - 1);

                    gradI = gradY * climateGradient.width + gradX;
                    color = [grdC[gradI * 4],grdC[gradI * 4 + 1],grdC[gradI * 4 + 2]];

                    var currentHeight = Math.floor((current - generatorConfig.waterLevel)/(1 - generatorConfig.waterLevel) * 25) * 2;
                    pixH[i * 4] = pixH[i * 4 + 1] = pixH[i * 4 + 2] = Math.min(currentHeight, maxColorWidth - 1);
                } else {
                    gradX = Math.floor(current/generatorConfig.waterLevel * maxColorWidth);
                    gradX = Math.min(Math.max(gradX, 0), maxColorWidth - 1);

                    gradI = (gradY + maxColorHeight) * climateGradient.width + gradX;
                    color = [grdC[gradI * 4],grdC[gradI * 4 + 1],grdC[gradI * 4 + 2]];

                    pixH[i * 4] = pixH[i * 4 + 1] = pixH[i * 4 + 2] = 0;
                }
                pixT[i * 4] = color[0];
                pixT[i * 4 + 1] = color[1];
                pixT[i * 4 + 2] = color[2];
            }
            ctxT.putImageData(imgdT, 0, 0);
            ctxH.putImageData(imgdH, 0, 0);
        };
        var addData = function() {
            var i;
            console.time('rendererSetup');

            for (i = 0; i < generatorData.length; i++) {
                if(!generatorData[i].water && !generatorData[i].polar) {
                    addPoint(generatorData[i].lat, generatorData[i].lng, generatorData[i]);
                }
            }

            console.timeEnd('rendererSetup');

            DataBarsMesh = new THREE.Mesh(DataBarsGeometry, new THREE.MeshLambertMaterial({
                color: 0xffffff,
                ambient: 0xffffff,
                vertexColors: THREE.FaceColors,
                morphTargets: false
            }));
            DataBarsMesh.scale.set(0, 0, 0);
            DataBarsMesh.visible = false;
            DataBarsMesh.castShadow = false;
            DataBarsMesh.receiveShadow = true;
            Sphere.add( DataBarsMesh );
        };

        /* Create Textures for Globe ----------- */
        var globeTexture = document.createElement( 'canvas' );
        globeTexture.width = generatorConfig.tx_w;
        globeTexture.height = generatorConfig.tx_h;

        var ctx = globeTexture.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 255)';
        ctx.fillRect(0, 0, generatorConfig.tx_w, generatorConfig.tx_h);

        var globeHeightmap = document.createElement( 'canvas' );
        globeHeightmap.width = generatorConfig.tx_w;
        globeHeightmap.height = generatorConfig.tx_h;

        ctx = globeHeightmap.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 255)';
        ctx.fillRect(0, 0, generatorConfig.tx_w, generatorConfig.tx_h);

        visualization.textureCanvas = document.createElement( 'canvas' );
        visualization.textureCanvas.width = generatorConfig.w;
        visualization.textureCanvas.height = generatorConfig.h;
        ctx = visualization.textureCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 255)';
        ctx.fillRect(0, 0, generatorConfig.w, generatorConfig.h);

        buildImage(globeTexture,globeHeightmap,texture);

        // earth

        var earthTexture = new THREE.Texture( globeTexture );
        earthTexture.needsUpdate = true;
        var earthHeight = new THREE.Texture( globeHeightmap );
        earthHeight.needsUpdate = true;

        var geometry = new THREE.SphereGeometry( 200, 40, 30 );
        //var material = new THREE.MeshBasicMaterial( { map: earthTexture, overdraw: true } );
        var material = new THREE.MeshPhongMaterial({
            ambient: 0x404040,
            color: 0x888888,
            specular: 0x333333,
            shininess: 2,
            perPixel: true,
            map: earthTexture,
            bumpMap: earthHeight,
            bumpScale: 20,
            metal: false
        });

        var earthMesh = new THREE.Mesh( geometry, material );
        Sphere.add( earthMesh );
        earthMesh.castShadow = true;
        earthMesh.receiveShadow = false;

        addData();
        ready = true;
    },

    addPoint = function( lat, lng, datapoint ) {
        var phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180;

        DataBarMesh.position.x = 198 * Math.sin(phi) * Math.cos(theta);
        DataBarMesh.position.y = 198 * Math.cos(phi);
        DataBarMesh.position.z = 198 * Math.sin(phi) * Math.sin(theta);

        DataBarMesh.lookAt(Sphere.position);

        DataBarMesh.scale.z = 62;

        for (var i = 0; i < DataBarMesh.geometry.faces.length; i++)
            DataBarMesh.geometry.faces[i].color = new THREE.Color();

        THREE.GeometryUtils.merge(DataBarsGeometry, DataBarMesh);
        // Last 8 points in merged geometry should be the vertices of the moving bar
        dataPoints[datapoint.id] = {
            faces: DataBarsGeometry.faces.slice(-DataBarMesh.geometry.faces.length),
            vertices: DataBarsGeometry.vertices.slice(-DataBarMesh.geometry.vertices.length),
            border_distance: datapoint.border_distance
        };
    },

    addHordeParticles = function() {
        var particleGroup = new SPE.Group({
            texture: THREE.ImageUtils.loadTexture('ui/zombie_basic.png'),
            maxAge: 2
        });

        var emitter = new SPE.Emitter({
            type: 'sphere',

            radius: 0,
            radiusScale: new THREE.Vector3(1, 1, 1),

            position: new THREE.Vector3( 0, 0, 0 ),

            colorStart: (new THREE.Color()).setRGB(
                1,
                0,
                0
            ),
            sizeStart: 1,

            particleCount: 40000,

            opacityStart: 0.5,
            isStatic: 1
        });

        particleGroup.addEmitter( emitter );
        Sphere.add( particleGroup.mesh );
        
        hordeSystem.particles = particleGroup.geometry;
        hordeSystem.attributes = particleGroup.attributes;
    },

    updateHorde = function(horde, remove) {
        var selectedHorde = hordeSystem[horde.id];
        if(selectedHorde === undefined)
            selectedHorde = hordeSystem[horde.id] = {};

        if(remove && selectedHorde.particleVertex) {
            selectedHorde.particleVertex.set(0,0,0);
            selectedHorde.particleSizeAttrib.setLength(0.5);

            hordeSystem.length--;

            // Replace this vector with the last vector in the array
            hordeSystem.particles.vertices[selectedHorde.index] = hordeSystem.particles.vertices[hordeSystem.length];
            hordeSystem.attributes.size.value[selectedHorde.index] = hordeSystem.attributes.size.value[hordeSystem.length];
            hordeSystem.arrayLinks[selectedHorde.index] = hordeSystem.arrayLinks[hordeSystem.length];
            hordeSystem.arrayLinks[selectedHorde.index].index = selectedHorde.index;

            hordeSystem.particles.vertices[hordeSystem.length] = selectedHorde.particleVertex;
            hordeSystem.attributes.size.value[hordeSystem.length] = selectedHorde.particleSizeAttrib;
            hordeSystem.arrayLinks.length = hordeSystem.length;

            delete hordeSystem[horde.id];
        } else {
            if(selectedHorde.particleVertex === undefined) {
                // If horde does not have a particle, create one
                selectedHorde.particleVertex = hordeSystem.particles.vertices[hordeSystem.length];
                selectedHorde.particleSizeAttrib = hordeSystem.attributes.size.value[hordeSystem.length];
                hordeSystem.arrayLinks[hordeSystem.length] = selectedHorde;
                selectedHorde.index = hordeSystem.length;
                hordeSystem.length++;
            }

            selectedHorde.particleVertex.copy(coordToCartesian(horde.location.lat-0.5+Math.random(), horde.location.lng-0.5+Math.random()));

            if(hordeSystem.maxSize < horde.size)
                hordeSystem.maxSize = horde.size;

            // Particle size ranges from 6.75 to 2.75
            var newParticleSize = (hordeSystem.maxSize > 5000 ? 26 : hordeSystem.maxSize / 200 + 1) * horde.size / hordeSystem.maxSize + 1.75;
            if(selectedHorde.particleSizeAttrib.length() != newParticleSize) {
                selectedHorde.particleSizeAttrib.setLength(newParticleSize);
                hordeSystem.attributes.size.needsUpdate = true;
            }
        }
        
        hordeSystem.particles.verticesNeedUpdate = true;
    },

    render = function() {
        var vector = WindowConfig.mouseVector;

        if(vector.length() < 0.5)
            vector.set(0,0,0);
        else {
            vector.multiplyScalar(0.95);
            WindowConfig.rotation.x += vector.x * 0.002;
            if(Math.abs(WindowConfig.rotation.y - vector.y * 0.002) < PI_HALF)
                WindowConfig.rotation.y -= vector.y * 0.002;

            Camera.position.z += vector.z * 0.02;
            if(Camera.position.z < 250)
                Camera.position.z = 250;
            else if(Camera.position.z > 500)
                Camera.position.z = 500;
            if(Camera.position.z < 400) {
                Scene.position.y = 400 - Camera.position.z;
                Camera.lookAt(Scene.position);
            }
        }

        TWEEN.update();
        Sphere.rotation.y = -WindowConfig.rotation.x;
        Sphere.rotation.x = WindowConfig.rotation.y;

        if(!onRender()) {
            SceneRenderer.render( Scene, Camera );
        }
    },

    animate = function() {
        requestAnimationFrame( animate );
        render();
    },

    getSphereScreenSize = function( dist ) {
        // Given sphere size of 200 and FoV of 60
        return (400/(2 * Math.tan( 30/180 * Math.PI ) * dist))*WindowConfig.windowY;
    },

    checkIntersection = function( mouseX, mouseY ) {
        var projector = new THREE.Projector();
        var vector    = new THREE.Vector3( (mouseX / WindowConfig.windowX) * 2 - 1,    -(mouseY / WindowConfig.windowY) * 2 + 1, 0.5);

        // now 'unproject' the point on the screen
        // back into the the Scene itself. This gives
        // us a ray direction
        projector.unprojectVector(vector, Camera);

        // create a ray from our current Camera position
        // with that ray direction and see if it hits the sphere
        var raycaster  = new THREE.Raycaster(Camera.position, vector.sub(Camera.position).normalize());
        var intersects = raycaster.intersectObjects([visualization.mesh]);

        if(intersects.length) {
            return intersects[0].point;
        }
        return false;
    },

    getVisualization = function(layer, valuesArray) {
        if(visualization.textureStore[layer] !== undefined)
            return visualization.textureStore[layer];

        visualization.textureCanvas.width = generatorConfig.w;
        visualization.textureCanvas.height = generatorConfig.h;

        var ctx = visualization.textureCanvas.getContext('2d'),
            imgd = ctx.getImageData(0,0,generatorConfig.w,generatorConfig.h),
            pix = imgd.data,
            data_ratio = generatorConfig.tx_w / generatorConfig.w,
            discrete = false,
            i,n,
            setColor,organizeColor,save;
        switch(layer) {
            case 'precipitation':
                setColor = function(i,val) {
                    pix[i*4+1] = Math.floor(Math.pow(val / 200,2) * 150);
                    pix[i*4+2] = Math.floor(val / 100 * 255);
                };
                organizeColor = function(i) {
                    pix[i*4+3] = (pix[i*4+2])/2 + 128;
                };
                save = true; break;
            case 'tech':
                setColor = function(i,val) {
                    pix[i*4] = Math.floor(val / 80000 * 255);
                };
                organizeColor = function(i) {
                    pix[i*4+3] = (pix[i*4+1])/2 + 128;
                };
                break;
            case 'trees':
                setColor = function(i,val) {
                    pix[i*4+1] = Math.floor(val / 50000 * 255);
                };
                organizeColor = function(i) {
                    pix[i*4+3] = (pix[i*4+1])/2 + 128;
                };
                break;
            case 'temperature':
                setColor = function(i,val) {
                    if(val < 290) {
                        pix[i*4+1] = Math.floor(Math.pow((290-val) / 50,2) * 150);
                        pix[i*4+2] = Math.floor((290-val) / 50 * 255);
                    }
                    if(val > 280) {
                        pix[i*4+0] = Math.floor((2/(Math.pow((val-310)/30,2)+1) - 1) * 255);
                        pix[i*4+1] += Math.floor((1.30/(Math.pow((val-295)/26,2)+1) - 1) * 255);
                    }
                };
                organizeColor = function(i) {
                    pix[i*4+3] = Math.floor((pix[i*4] + pix[i*4+1] + pix[i*4+2])*0.7);
                    if(pix[i*4] > 0) {
                        pix[i*4+1] = pix[i*4+1]*(255/pix[i*4]);
                        pix[i*4] = 255;
                    }
                    if(pix[i*4+2] > 0) {
                        if(pix[i*4] === 0)
                            pix[i*4+1] = pix[i*4+1]*(255/pix[i*4+2]);
                        pix[i*4+2] = 255;
                    }
                };
                save = true; break;
            case 'country':
                setColor = function(i,val,opacity) {
                    if(val !== null) {
                        pix[i*4] = val.color[0]*opacity;
                        pix[i*4+1] = val.color[1]*opacity;
                        pix[i*4+2] = val.color[2]*opacity;
                    }
                };
                organizeColor = function(i) {
                    if(pix[i*4] !== 255 && pix[i*4+1] === 0 && pix[i*4+2] === 0)
                        pix[i*4+3] = 0;
                    else {
                        // Opacity of the country color is determined by the strongest RGB color.
                        if(pix[i*4] > pix[i*4+1] && pix[i*4] > pix[i*4+2])
                            pix[i*4+3] = pix[i*4];
                        else if(pix[i*4+1] > pix[i*4] && pix[i*4+1] > pix[i*4+2])
                            pix[i*4+3] = pix[i*4+1];
                        else
                            pix[i*4+3] = pix[i*4+2];
                    }
                };
                discrete = true;
                save = true; break;
            case 'perlinTest':
                setColor = function(i,val) {
                    pix[i*4] = val * 255;
                };
                organizeColor = function(i) {
                    pix[i*4+3] = pix[i*4];
                    pix[i*4] = 255;
                };
                save = true; break;
            default:
                setColor = function() {
                };
                organizeColor = function() {
                };
                console.warn('layer ' + layer + ' not found in visualizer');
        }

        for(i = 0, n = pix.length/4; i < n; i++) {
            pix[i*4] = pix[i*4+1] = pix[i*4+2] = 0;
            pix[i*4+3] = 255;
            if(valuesArray[i] !== undefined && !!valuesArray[i]) {
                if(discrete && dataPoints[i]) {
                    var opacity = 1 - (dataPoints[i].border_distance - 1) / 3;
                    if(opacity < 0) opacity = 0;
                    setColor(i, valuesArray[i], opacity);
                }
                else
                    setColor(i, valuesArray[i], 1);
            }
        }
        ctx.putImageData(imgd, 0, 0);

        var scaledCanvas;
        while(data_ratio % 2 === 0 || data_ratio % 3 === 0) {
            if(data_ratio % 4 === 0) {
                scaledCanvas = hqx(visualization.textureCanvas,4);
                data_ratio /=4;
            }
            else if(data_ratio % 3 === 0) {
                scaledCanvas = hqx(visualization.textureCanvas,3);
                data_ratio /=3;
            }
            else {
                scaledCanvas = hqx(visualization.textureCanvas,2);
                data_ratio /=2;
            }
            visualization.textureCanvas = scaledCanvas;
        }

        ctx = visualization.textureCanvas.getContext('2d');
        imgd = ctx.getImageData(0,0,generatorConfig.tx_w,generatorConfig.tx_h);
        pix = imgd.data;

        for(i = 0, n = pix.length/4; i < n; i++) {
            organizeColor(i);
        }
        ctx.putImageData(imgd, 0, 0);
        
        if(save) {
            visualization.textureStore[layer] = document.createElement( 'canvas' );
            visualization.textureStore[layer].width = generatorConfig.tx_w;
            visualization.textureStore[layer].height = generatorConfig.tx_h;
            ctx = visualization.textureStore[layer].getContext('2d');
            ctx.drawImage(visualization.textureCanvas,0,0);
        }

        return visualization.textureCanvas;
    },

    getSphereCoords = function(mouseX, mouseY) {
        var toDeg = 180/Math.PI,
            diameter = 200;

        var distX = mouseX - WindowConfig.windowX/2;
        var distY = mouseY - WindowConfig.windowY/2;
        if(Math.sqrt(distX*distX + distY*distY) < getSphereScreenSize(Camera.position.z)/2) {
            var intersect = checkIntersection( mouseX, mouseY );

            var phi = Math.acos(intersect.y/diameter) - WindowConfig.rotation.y;
            var theta = Math.asin(intersect.x/Math.sin(phi)/diameter) + WindowConfig.rotation.x;
            if(theta*toDeg + 90 > 0)
                return [(90 - Math.abs(phi*toDeg)),(theta*toDeg + 90)%360,intersect];
            else
                return [(90 - Math.abs(phi*toDeg)),360 + (theta*toDeg + 90)%360,intersect];
        }
        return false;
    },

    coordToCartesian = function(lat,lng,dist) {
        if(!dist)
            dist = 200;
        var phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180;
        var x = dist * Math.sin(phi) * Math.cos(theta),
            y = dist * Math.cos(phi),
            z = dist * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x,y,z);
    },

    resize = function(newWidth, newHeight, scaling) {
        if(newWidth) {
            WindowConfig.windowX = newWidth;
            WindowConfig.windowY = newHeight;
        }
        if(scaling)
            WindowConfig.scaling = parseFloat(scaling);

        if(Camera !== undefined) {
            Camera.aspect = WindowConfig.windowX / WindowConfig.windowY;
            Camera.updateProjectionMatrix();
        }
        if(SceneRenderer !== undefined) {
            SceneRenderer.setSize( WindowConfig.windowX/WindowConfig.scaling, WindowConfig.windowY/WindowConfig.scaling );
            $(SceneRenderer.domElement).css('width',WindowConfig.windowX).css('height',WindowConfig.windowY);
            /*if(WindowConfig.scaling != 1)
                SceneRenderer.setViewport( 0, 0, WindowConfig.windowX, WindowConfig.windowY );*/
        }
    },
    setData = function(dataPointId, value) {
        var point = dataPoints[dataPointId];

        if(point !== undefined) {
            var currentLength = point.vertices[1].length(),
                newLength = 199;

            if(value === undefined)
                value = (currentLength - 200) / 30;

            if(value > 0) {
                newLength = 30 * value + 200;
                point.vertices[1].setLength(newLength);
                point.vertices[3].setLength(newLength);
                point.vertices[4].setLength(newLength);
                point.vertices[6].setLength(newLength);

                for (var i = 0; i < point.faces.length; i++)
                    point.faces[i].color.setHSL(
                        dataBarColors.min[0] - value * (dataBarColors.min[0] - dataBarColors.max[0]), 
                        dataBarColors.min[1] - value * (dataBarColors.min[1] - dataBarColors.max[1]),
                        dataBarColors.min[2] - value * (dataBarColors.min[2] - dataBarColors.max[2])
                    );
            } else if(currentLength >= 200) {
                point.vertices[1].setLength(newLength);
                point.vertices[3].setLength(newLength);
                point.vertices[4].setLength(newLength);
                point.vertices[6].setLength(newLength);
            }
        }
    };

    $(window).resize(function() {
        resize(window.innerWidth,window.innerHeight);
    });
    resize(window.innerWidth, window.innerHeight, scaling);

    THREE.Vector3.prototype.addScalars = function(x,y,z) {
        this.x += x;
        this.y += y;
        this.z += z;

        return this;
    };

    // Return functions
    return {
        animate: animate,
        getSphereCoords: getSphereCoords,
        resize: resize,
        updateHorde: updateHorde,
        setData: setData,
        setDataBarColor: function(colorStart, colorEnd, updateBarsNow) {
            dataBarColors.min = colorStart;
            dataBarColors.max = colorEnd;

            if(updateBarsNow)
                for(var i = 0; i < dataPoints.length; i++) {
                    setData(i);
                }
        },
        onRender: function(doOnRender) {
            onRender = doOnRender;
        },
        updateMatrix: function() {
            DataBarsGeometry.verticesNeedUpdate = true;
            DataBarsGeometry.colorsNeedUpdate = true;      
        },
        moveCamera: function(x,y) {
            WindowConfig.mouseVector.multiplyScalar(0.5).addScalars(x,y,0);
        },
        stopCameraMovement: function() {
            WindowConfig.mouseVector.set(0,0,0);
        },
        zoomCamera: function(z) {
            WindowConfig.mouseVector.addScalars(0,0,z);
        },
        clickSphere: function(x,y) {
            var sphereCoords = getSphereCoords(x,y);
            if(sphereCoords) {
                console.log(sphereCoords);
                return sphereCoords;
            } else
                return false;
        },
        decal: function(id, options) {
            var defaults = {
                lat: 0,
                lng: 0,
                size: 5,
                texture: 'gun',
                opacity: 1
            };
            options = $.extend({}, defaults, options);

            if(visualization.decals[id] === undefined) {
                var geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
                var material = new THREE.MeshBasicMaterial({map: visualization.decalTextures[options.texture], side: THREE.DoubleSide, transparent: true, opacity: options.opacity});
                visualization.decals[id] = new THREE.Mesh(geometry, material);

                visualization.decals[id].material.textureId = options.texture;
                visualization.decals[id].scale.x = options.size;
                visualization.decals[id].scale.y = options.size;
                visualization.decals[id].position = coordToCartesian(options.lat, options.lng,205);
                visualization.decals[id].lookAt(Sphere.position);

                Sphere.add(visualization.decals[id]);
            } else {
                // If the decal already exists, animate it
            }
        },
        drawCircle: function(id, lat, lng, radius, color, thickness) {
            if(visualization.decals[id] !== undefined)
                Sphere.remove( visualization.decals[id] );

            radius = radius || 5;
            color = color || 0xffffff;
            thickness = thickness || 1;

            var segments = 32,
                circleGeometry = new THREE.Geometry(),
                material = new THREE.LineBasicMaterial({ color: color, linewidth: thickness });

            for (var i = 0; i <= segments; i++) {
                var theta = (i / segments) * Math.PI * 2;
                circleGeometry.vertices.push(
                    new THREE.Vector3(
                            Math.cos(theta) * radius,
                            Math.sin(theta) * radius,
                            0
                        )
                );
            }

            visualization.decals[id] = new THREE.Line(circleGeometry, material);
            visualization.decals[id].position = coordToCartesian(lat,lng,201);
            visualization.decals[id].lookAt(Sphere.position);

            Sphere.add( visualization.decals[id] );
        },
        lookAt: function (square) {
            var tween = new TWEEN.Tween(WindowConfig.rotation).to({x: -(90 - square.lng) * Math.PI / 180, y: square.lat * Math.PI / 180, z: 0}, 2000);
            tween.easing(TWEEN.Easing.Cubic.Out);
            tween.start();
        },
        setVisualization: function( layer, data ) {
            if(ready) {
                visualization.texture.image = getVisualization(layer, data);
                visualization.texture.needsUpdate = true;
                visualization.mesh.material.map = visualization.texture;
                visualization.mesh.visible = true;
            }
        },
        closeVisualization: function () {
            if(ready)
                visualization.mesh.visible = false;
        },
        visualization: function () {
            if(ready)
                return visualization.mesh.visible;
            else
                return false;
        },
        togglePopDisplay: function (force) {
            var tween;
            if(force === undefined || DataBarsMesh.visible !== force) {
                if(DataBarsMesh.visible) {
                    tween = new TWEEN.Tween(DataBarsMesh.scale).to({x:0, y: 0, z: 0}, 1000);
                    tween.onComplete(function(){
                        DataBarsMesh.visible = false;
                    });
                    tween.easing(TWEEN.Easing.Circular.In);
                }
                else {
                    DataBarsMesh.visible = true;
                    tween = new TWEEN.Tween(DataBarsMesh.scale).to({x: 1, y: 1, z: 1}, 1000);
                    tween.easing(TWEEN.Easing.Circular.Out);
                }
                tween.start();
            }
        },
        displayArc: function (point1, point2) {
            var i,position,index,
                phi1 = (90 - point1.lat) * Math.PI / 180,
                theta1 = (180 - point1.lng) * Math.PI / 180,
                phi2 = (90 - point2.lat) * Math.PI / 180,
                theta2 = (180 - point2.lng) * Math.PI / 180,
                n_sub = 24;

            var d = Math.acos(Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(theta1 - theta2)),
                points = [coordToCartesian(point1.lat,point1.lng)];

            for(i = 1; i < n_sub; i++) {
                var f = i/n_sub,
                    A = Math.sin((1 - f) * d) / Math.sin(d),
                    B = Math.sin(f * d) / Math.sin(d),
                    x = A * Math.sin(phi1) * Math.cos(theta1) + B * Math.sin(phi2) * Math.cos(theta2),
                    y = A * Math.cos(phi1) + B * Math.cos(phi2),
                    z = A * Math.sin(phi1) * Math.sin(theta1) + B * Math.sin(phi2) * Math.sin(theta2);

                points.push(new THREE.Vector3(x,y,z).setLength(200+30*Math.sin(f*Math.PI)));
            }
            points.push(coordToCartesian(point2.lat,point2.lng));

            var spline = new THREE.Spline(points);

            for ( i = 0; i < n_sub*3; i++ ) {
                index = i / ( n_sub*3 - 1 );
                position = spline.getPoint( index );

                visualization.arc.geometry.vertices[i].copy( position );
            }
            visualization.arc.geometry.verticesNeedUpdate = true;

            visualization.arc.visible = true;
        },
        hideArc: function () {
            visualization.arc.visible = false;
        },
        init: init,
        simulatorStart: simulatorStart
    };
};