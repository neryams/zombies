/*
    3d renderer module. 
    Dependencies: Three.js
*/
/* global requestAnimationFrame */
/* global hqx */
/* exported Renderer */
var Renderer = function (scaling,onLoad) {
    // Initialize variables
    var Camera, Scene, Sphere, SceneRenderer, DataBarsMesh, DataBarsGeometry, DataBarMesh,
        Simulator,
        hordeSystem = {
            length: 0,
            particles: null
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
        onRender = function () {},
        ready = false,
        generatorConfig = null;

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
    visualization.decalTextures.gun = new THREE.ImageUtils.loadTexture('ui/gun.png');

    var init = function() {
        /* Create 3D Globe --------------------- */
        Camera = new THREE.PerspectiveCamera( 60, WindowConfig.windowX / WindowConfig.windowY, 1, 10000 );
        Camera.position.z = 450;

        Scene = new THREE.Scene();

        var group = new THREE.Object3D();
        Sphere = new THREE.Object3D();

        group.add( Sphere );
        Scene.add( group );

        // lights

        var ambientLight = new THREE.AmbientLight( 0x404040 );
        Scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xcccccc, 2 );
        directionalLight.position.set( -500, 0, 500 );
        directionalLight.target = Sphere;
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

        // Bars to show zombies and humans
        var geometry = new THREE.CubeGeometry(1, 1, 1);
        // Move the 'position point' of the cube to the bottom so it sits on the surface of the globe.
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 0.5) );
        DataBarMesh = new THREE.Mesh(geometry); // humans

        Camera.lookAt( Scene.position );
        //Camera.position.x = -100;

        /*SceneRenderer = new THREE.CanvasRenderer();
        SceneRenderer.setSize( window.innerWidth, window.innerHeight );*/
        SceneRenderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x060708, clearAlpha: 1 } );
        resize();

        document.getElementById('container').appendChild( SceneRenderer.domElement );

        DataBarsGeometry = new THREE.Geometry();
        DataBarsGeometry.dynamic = true;

        addHordeParticles();
    },

    simulatorStart = function(texture, generatorOptions, simulatorLink) {
        generatorConfig = generatorOptions;
        Simulator = simulatorLink;

        // Function for filling the canvases with the data generated previously
        var buildImage = function(globeTexture, globeHeightmap, texture) {
            var current, dtI, gradX, gradY, gradI, color,
                ctxT = globeTexture.getContext('2d'),
                ctxH = globeHeightmap.getContext('2d'),
                ctxC = climateGradient.getContext('2d'),
                imgdT = ctxT.getImageData(0, 0, generatorConfig.tx_w, generatorConfig.tx_h),
                imgdH = ctxH.getImageData(0, 0, generatorConfig.tx_w, generatorConfig.tx_h),
                imgdC = ctxC.getImageData(0, 0, climateGradient.width, climateGradient.height),
                pixT = imgdT.data,
                pixH = imgdH.data,
                grdC = imgdC.data,

                data_ratio = generatorConfig.tx_w / generatorConfig.w;

            for (var i = 0, n = texture.length; i < n; i++) {
                current = Math.floor(texture[i]);

                // Figure out the current square in the data map (as opposed to the texture map)
                dtI = Math.floor(i / generatorConfig.tx_w / data_ratio) * generatorConfig.w + Math.floor(i % generatorConfig.tx_w / data_ratio);
                var currentConditions = Simulator.points[dtI];

                // Get the x/y coordinates in the climate coloring textureW
                gradY = Math.round((1 - (312.5 - currentConditions.temperature) / 60) * 255);
                if (gradY < 0)
                    gradY = 0;
                if (currentConditions.precipitation < 0)
                    currentConditions.precipitation = 0;
                gradX = Math.round((1 - currentConditions.precipitation/20)*255);
                if (gradX < 0)
                    gradX = 0;
                gradI = gradY * climateGradient.width + gradX;

                // Get the color of the gorund at this point
                color = [grdC[gradI * 4],grdC[gradI * 4 + 1],grdC[gradI * 4 + 2]];

                // Generate height texture (greyscale map of elevation) and earth texture (color map using climate info)
                if (current > generatorConfig.waterLevel) {
                    pixH[i * 4] = pixH[i * 4 + 2] = pixH[i * 4 + 1] = Math.floor((current - generatorConfig.waterLevel) / 10);
                    pixT[i * 4] = color[0];
                    pixT[i * 4 + 1] = color[1];
                    pixT[i * 4 + 2] = color[2];
                } else {
                    pixH[i * 4] = pixH[i * 4 + 2] = pixH[i * 4 + 1] = 0;
                    pixT[i * 4] = 0;
                    pixT[i * 4 + 1] = Math.floor(generatorConfig.waterLevel / 2) - (generatorConfig.waterLevel - current) * 3;
                    pixT[i * 4 + 2] = current * 2 + 10;

                    if (currentConditions.temperature < 252.5) {
                        pixT[i * 4 + 0] = color[0];
                        pixT[i * 4 + 1] = color[1];
                        pixT[i * 4 + 2] = color[2];
                    }
                }
            }
            ctxT.putImageData(imgdT, 0, 0);
            ctxH.putImageData(imgdH, 0, 0);
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
        var material = new THREE.MeshPhongMaterial( { ambient: 0x222222, color: 0x888888, specular: 0x333333, shininess: 2, perPixel: true, map: earthTexture, bumpMap: earthHeight, bumpScale: 20, metal: false } );

        var earthMesh = new THREE.Mesh( geometry, material );
        Sphere.add( earthMesh );

        addData();
        ready = true;
    },

    addData = function() {
        var i;
        console.time('rendererSetup');

        for (i = 0; i < Simulator.points.length; i++) {
            if(!Simulator.points[i].water && !Simulator.points[i].polar) {
                addPoint(Simulator.points[i].lat, Simulator.points[i].lng, Simulator.points[i]);
            }
        }

        console.timeEnd('rendererSetup');

        DataBarsMesh = new THREE.Mesh(DataBarsGeometry, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.FaceColors,
            morphTargets: false,
            side: THREE.BackSide
        }));
        Sphere.add( DataBarsMesh );
    },

    addPoint = function( lat, lng, datapoint ) {
        var phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180,
            color = new THREE.Color(),
            element = datapoint.total_pop / generatorConfig.max_pop;
            //element = (Simulator.points[i].temperature - 220) / 100;

        color.setHSL( ( 0.6 - ( element * 0.3 ) ), 1.0, 0.5 );

        DataBarMesh.position.x = 198 * Math.sin(phi) * Math.cos(theta);
        DataBarMesh.position.y = 198 * Math.cos(phi);
        DataBarMesh.position.z = 198 * Math.sin(phi) * Math.sin(theta);

        DataBarMesh.lookAt(Sphere.position);

        if(element > 0)
            DataBarMesh.scale.z = element * -60 - 2;
        else
            DataBarMesh.scale.z = -1;

        var i;
        for (i = 0; i < DataBarMesh.geometry.faces.length; i++)
            DataBarMesh.geometry.faces[i].color = color;

        THREE.GeometryUtils.merge(DataBarsGeometry, DataBarMesh);
        // Last 8 points in merged geometry should be the vertices of the moving bar
        datapoint.renderer.vertices_pop = DataBarsGeometry.vertices.slice(-8);
    },

    addHordeParticles = function() {
        var particleCount = 40000,
            particles = new THREE.Geometry(),
            pMaterial = new THREE.ParticleBasicMaterial({
                size: 1,
                map: THREE.ImageUtils.loadTexture(
                    'ui/zombie_basic.png'
                ),
                transparent: true,
                depthWrite: false,
                opacity: 0.5
            });

        // now create the individual particles
        for (var p = 0; p < particleCount; p++) {
            var particle = new THREE.Vector3();

            // add it to the geometry
            particles.vertices.push(particle);
        }

        // create the particle system
        var particleSystem = new THREE.ParticleSystem(particles, pMaterial);
        //particleSystem.sortParticles = true;

        // add it to the scene
        Sphere.add(particleSystem);
        hordeSystem.particles = particles;
    },

    updateHorde = function(horde, remove) {
        if(remove && horde.renderer.particleVertex) {
            hordeSystem.length--;

            // Replace this vector with the last vector in the array
            hordeSystem.particles.vertices[hordeSystem.length].index = horde.renderer.particleVertex.index;
            hordeSystem.particles.vertices[horde.renderer.particleVertex.index] = hordeSystem.particles.vertices[hordeSystem.length];

            horde.renderer.particleVertex.index = hordeSystem.length;
            hordeSystem.particles.vertices[hordeSystem.length] = horde.renderer.particleVertex;
            horde.renderer.particleVertex.set(0,0,0);
            delete horde.renderer.particleVertex;
        } else {
            if(horde.renderer.particleVertex) {
                horde.renderer.particleVertex.copy(coordToCartesian(horde.location.lat-0.5+Math.random(), horde.location.lng-0.5+Math.random()));
            } else {
                var currentParticle = hordeSystem.particles.vertices[hordeSystem.length];
                currentParticle.copy(coordToCartesian(horde.location.lat-0.5+Math.random(), horde.location.lng-0.5+Math.random()));
                currentParticle.index = hordeSystem.length;
                hordeSystem.length++;

                horde.renderer.particleVertex = currentParticle;
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

        onRender();

        SceneRenderer.render( Scene, Camera );
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

    getVisualization = function(layer) {
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
                    pix[i*4] = Math.floor(val / 50000 * 255);
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
        //dtI = Math.floor(i/generatorConfig.tx_w/data_ratio)*generatorConfig.w + Math.floor(i%generatorConfig.tx_w / data_ratio);
        for(i = 0, n = pix.length/4; i < n; i++) {
            var currentSq = Simulator.points[i];
            pix[i*4] = pix[i*4+1] = pix[i*4+2] = 0;
            pix[i*4+3] = 255;
            if(!currentSq.water && currentSq[layer] !== undefined) {
                if(discrete) {
                    var opacity = 1-(currentSq.border_distance-1)/3;
                    if(opacity < 0) opacity = 0;
                    setColor(i,currentSq[layer],opacity);
                }
                else
                    setColor(i,currentSq[layer],1);
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

    getSphereCoords = function(mouseX,mouseY) {
        var distX = mouseX - WindowConfig.windowX/2;
        var distY = mouseY - WindowConfig.windowY/2;
        if(Math.sqrt(distX*distX + distY*distY) < getSphereScreenSize(Camera.position.z)/2) {
            var intersect = checkIntersection( event.clientX, event.clientY );

            var phi = Math.acos(intersect.y/200) - WindowConfig.rotation.y;
            var theta = Math.asin(intersect.x/Math.sin(phi)/200) + WindowConfig.rotation.x;
            if(theta*180/Math.PI + 90 > 0)
                return [(90 - Math.abs(phi*180/Math.PI)),(theta*180/Math.PI + 90)%360,intersect];
            else
                return [(90 - Math.abs(phi*180/Math.PI)),360 + (theta*180/Math.PI + 90)%360,intersect];
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
        coordsToPoint: function(lat,lng) {
            return Simulator.points[(Math.floor(90-lat)*generatorConfig.w + Math.floor(lng))];
        },
        onRender: function(doOnRender) {
            onRender = doOnRender;
        },
        updateMatrix: function() {
            DataBarsGeometry.verticesNeedUpdate = true;
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
        decal: function(id, lat, lng, size, texture) {
            if(visualization.decals[id] === undefined) {
                var geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
                var material = new THREE.MeshBasicMaterial({map: visualization.decalTextures[texture], side: THREE.DoubleSide, transparent: true, opacity: 1});
                visualization.decals[id] = new THREE.Mesh(geometry, material);

                visualization.decals[id].material.textureId = texture;
                visualization.decals[id].scale.x = size;
                visualization.decals[id].scale.y = size;
                visualization.decals[id].position = coordToCartesian(lat,lng,205);
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
        setData: function(dataPoint, ratio) {
            var popLength = 198;
            if(dataPoint.renderer.vertices_pop !== undefined) {
                if(dataPoint.total_pop > 0) {
                    popLength = 60 * dataPoint.total_pop / ratio + 200;
                    dataPoint.renderer.vertices_pop[0].setLength(popLength);
                    dataPoint.renderer.vertices_pop[2].setLength(popLength);
                    dataPoint.renderer.vertices_pop[5].setLength(popLength);
                    dataPoint.renderer.vertices_pop[7].setLength(popLength);
                } else if(dataPoint.renderer.vertices_pop[0].length() >= 200) {
                    dataPoint.renderer.vertices_pop[0].setLength(popLength);
                    dataPoint.renderer.vertices_pop[2].setLength(popLength);
                    dataPoint.renderer.vertices_pop[5].setLength(popLength);
                    dataPoint.renderer.vertices_pop[7].setLength(popLength);
                }
            }
        },
        setVisualization: function( layer ) {
            if(ready) {
                visualization.texture.image = getVisualization(layer);
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
        togglePopDisplay: function () {
            var tween;
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