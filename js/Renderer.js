/*
    3d renderer module. 
    Dependencies: Three.js
*/
var Renderer = function (scaling) {
    // Function for filling the canvases with the data generated previously
    var buildImage = function(globeTexture, globeHeightmap, texture) {
        var current, dtI, gradX, gradY, gradI, color, color_ratio,
            ctxT = globeTexture.getContext("2d"),
            ctxH = globeHeightmap.getContext("2d"),
            ctxC = climateGradient.getContext("2d"),
            imgdT = ctxT.getImageData(0, 0, gConfig.tx_w, gConfig.tx_h),
            imgdH = ctxH.getImageData(0, 0, gConfig.tx_w, gConfig.tx_h),
            imgdC = ctxC.getImageData(0, 0, climateGradient.width, climateGradient.height),
            pixT = imgdT.data,
            pixH = imgdH.data,
            grdC = imgdC.data,

            data_ratio = gConfig.tx_w / gConfig.w,
            i, j, k;

        for (i = 0, j = 0, n = texture.length; i < n; i++) {
            current = Math.floor(texture[i]);

            // Figure out the current square in the data map (as opposed to the texture map)
            dtI = Math.floor(i / gConfig.tx_w / data_ratio) * gConfig.w + Math.floor(i % gConfig.tx_w / data_ratio);
            currentConditions = gData.points[dtI];

            // Get the x/y coordinates in the climate coloring texture
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
            if (current > gConfig.waterLevel) {
                pixH[i * 4] = pixH[i * 4 + 2] = pixH[i * 4 + 1] = Math.floor((current - gConfig.waterLevel) / 10);
                pixT[i * 4] = color[0];
                pixT[i * 4 + 1] = color[1];
                pixT[i * 4 + 2] = color[2];
            } else {
                pixH[i * 4] = pixH[i * 4 + 2] = pixH[i * 4 + 1] = 0;
                pixT[i * 4] = 0;
                pixT[i * 4 + 1] = Math.floor(gConfig.waterLevel / 2) - (gConfig.waterLevel - current) * 3;
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
    },

    init = function(texture) {
        /* Create Textures for Globe ----------- */
        var globeTexture = document.createElement( 'canvas' ); 
        globeTexture.width = gConfig.tx_w;
        globeTexture.height = gConfig.tx_h;
        var ctx = globeTexture.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 255)"; 
        ctx.fillRect(0, 0, gConfig.tx_w, gConfig.tx_h);

        var globeHeightmap = document.createElement( 'canvas' ); 
        globeHeightmap.width = gConfig.tx_w;
        globeHeightmap.height = gConfig.tx_h;
        var ctx = globeHeightmap.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 255)";
        ctx.fillRect(0, 0, gConfig.tx_w, gConfig.tx_h);

        visualization = document.createElement( 'canvas' );
        visualization.width = gConfig.w;
        visualization.height = gConfig.h;
        var ctx = visualization.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 255)";
        ctx.fillRect(0, 0, gConfig.w, gConfig.h);

        buildImage(globeTexture,globeHeightmap,texture);

        /* Create 3D Globe --------------------- */
        camera = new THREE.PerspectiveCamera( 60, display.windowX / display.windowY, 1, 10000 );
        camera.position.z = 450;

        scene = new THREE.Scene();

        var group = new THREE.Object3D();
        sphere = new THREE.Object3D();

        group.add( sphere );
        scene.add( group );

        // lights

        ambientLight = new THREE.AmbientLight( 0x404040 );
        scene.add( ambientLight );

        directionalLight = new THREE.DirectionalLight( 0xcccccc, 2 );
        directionalLight.position.set( -500, 0, 500 );
        directionalLight.target = sphere;
        scene.add( directionalLight );

        // earth

        var earthTexture = new THREE.Texture( globeTexture );
        earthTexture.needsUpdate = true;
        var earthHeight = new THREE.Texture( globeHeightmap );
        earthHeight.needsUpdate = true;

        var geometry = new THREE.SphereGeometry( 200, 40, 30 );
        //var material = new THREE.MeshBasicMaterial( { map: earthTexture, overdraw: true } );
        var material = new THREE.MeshPhongMaterial( { ambient: 0x222222, color: 0x888888, specular: 0x333333, shininess: 2, perPixel: true, map: earthTexture, bumpMap: earthHeight, bumpScale: 20, metal: false } );

        var earthMesh = new THREE.Mesh( geometry, material );
        sphere.add( earthMesh );

        // Visualization layer floating above the earth
        var visualLayerGeometry = new THREE.SphereGeometry( 202, 40, 30 );
        visualLayerTexture = new THREE.Texture( visualization );
        visualLayer = new THREE.Mesh(visualLayerGeometry, new THREE.MeshLambertMaterial({ map: visualLayerTexture, opacity: 0.8, transparent: true }));
        visualLayer.visible = false;
        sphere.add( visualLayer );

        // Arc for showing shipping routes and flights
        var visualArcGeometry = new THREE.Geometry();
        while(visualArcGeometry.vertices.length < 108)
            visualArcGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        visualArc = new THREE.Line(visualArcGeometry,new THREE.LineBasicMaterial({linewidth:5}));
        visualArc.visible = false;
        sphere.add( visualArc );

        // Bars to show zombies and humans
        geometry = new THREE.CubeGeometry(1, 1, 1);
        // Move the "position point" of the cube to the bottom so it sits on the surface of the globe.
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 0.5) );
        point = new THREE.Mesh(geometry); // humans

        geometry = new THREE.CubeGeometry(1, 1, 1);
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, 0, 0.5) );
        point2 = new THREE.Mesh(geometry); // zombies

        camera.lookAt( scene.position );
        //camera.position.x = -100;

        /*renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );*/
        renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x060708, clearAlpha: 1 } );
        resize();

        document.getElementById('container').appendChild( renderer.domElement );

        addData();
        ready = true;
    },

    addData = function() {
        var lat, lng, color, i, element;
        console.time('rendererSetup');

        for (i = 0; i < gData.points.length; i++) {
            if(gData.points[i].total_pop > 0 && !gData.points[i].water) {
                addPoint(gData.points[i].lat, gData.points[i].lng, gData.points[i]);
            }
        }

        console.timeEnd('rendererSetup');

        subgeo.dynamic = true;

        dataBars = new THREE.Mesh(subgeo, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.FaceColors,
            morphTargets: false,
            side: THREE.BackSide
        }));
        sphere.add( dataBars );
    },

    addPoint = function( lat, lng, datapoint ) {
        var phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180,
            color = new THREE.Color(),
            infectColor = new THREE.Color(),
            element = datapoint.total_pop / gConfig.max_pop;
            //element = (gData.points[i].temperature - 220) / 100;

        color.setHSL( ( 0.6 - ( element * 0.3 ) ), 1.0, 0.5 );
        infectColor.setHSL( 0, 1.0, 0.45 );
        var size = element * 60 + 2;

        point.position.x = 198 * Math.sin(phi) * Math.cos(theta);
        point.position.y = 198 * Math.cos(phi);
        point.position.z = 198 * Math.sin(phi) * Math.sin(theta);

        point2.position.copy(point.position);

        point.lookAt(sphere.position);
        point2.lookAt(sphere.position);

        if(element > 0)
            point.scale.z = -size;
        else
            point.scale.z = -1;
        point2.scale.z = -1;

        var i;
        for (i = 0; i < point.geometry.faces.length; i++) 
            point.geometry.faces[i].color = color;
        for (i = 0; i < point2.geometry.faces.length; i++) 
            point2.geometry.faces[i].color = infectColor;

        THREE.GeometryUtils.merge(subgeo, point);
        // Last 8 points in merged geometry should be the vertices of the moving bar
        datapoint.vertices_pop = subgeo.vertices.slice(-8);

        THREE.GeometryUtils.merge(subgeo, point2);
        // Last 8 points in merged geometry should be the vertices of the moving bar
        datapoint.vertices_zom = subgeo.vertices.slice(-8);
    },

    render = function() {
        if(mouseVector.length() < 0.5)
            mouseVector.set(0,0,0);
        else {
            mouseVector.multiplyScalar(0.95);
            rotation.x += mouseVector.x * 0.002;
            if(Math.abs(rotation.y - mouseVector.y * 0.002) < PI_HALF)
                rotation.y -= mouseVector.y * 0.002;

            camera.position.z += mouseVector.z * 0.02;
            if(camera.position.z < 250)
                camera.position.z = 250;
            else if(camera.position.z > 500)
                camera.position.z = 500;
            if(camera.position.z < 400) {
                scene.position.y = 400 - camera.position.z;
                camera.lookAt(scene.position);
            }
        }

        TWEEN.update();
        sphere.rotation.y = -rotation.x;
        sphere.rotation.x = rotation.y;

        onRender();

        renderer.render( scene, camera );
    },

    animate = function() {
        requestAnimationFrame( animate );
        render();
    },

    getSphereScreenSize = function( dist ) {
        // Given sphere size of 200 and FoV of 60
        return (400/(2 * Math.tan( 30/180 * Math.PI ) * dist))*display.windowY;
    },

    checkIntersection = function( mouseX, mouseY ) {
        var projector = new THREE.Projector();
        var vector    = new THREE.Vector3( (mouseX / display.windowX) * 2 - 1,    -(mouseY / display.windowY) * 2 + 1, 0.5);

        // now "unproject" the point on the screen
        // back into the the scene itself. This gives
        // us a ray direction
        projector.unprojectVector(vector, camera);

        // create a ray from our current camera position
        // with that ray direction and see if it hits the sphere
        var raycaster  = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
        var intersects = raycaster.intersectObjects([visualLayer]);

        if(intersects.length) {
            return intersects[0].point;
        }
        return false;
    },

    getVisualization = function(layer) {
        if(visualizations[layer] != undefined)
            return visualizations[layer];

        visualization.width = gConfig.w;
        visualization.height = gConfig.h;

        var ctx = visualization.getContext("2d"),
            imgd = ctx.getImageData(0,0,gConfig.w,gConfig.h),
            pix = imgd.data,
            data_ratio = gConfig.tx_w / gConfig.w,
            discrete = false,
            i,n;
        switch(layer) {
            case 'precipitation': 
                var setColor = function(i,val) {
                    pix[i*4+1] = Math.floor(Math.pow(val / 200,2) * 150);
                    pix[i*4+2] = Math.floor(val / 100 * 255);
                };
                var organizeColor = function(i) {
                    pix[i*4+3] = pix[i*4+2];
                    pix[i*4+2] = 255;
                }; 
                var save = true; break;
            case 'temperature': 
                var setColor = function(i,val) {
                    if(val < 290) {
                        pix[i*4+1] = Math.floor(Math.pow((290-val) / 50,2) * 150);
                        pix[i*4+2] = Math.floor((290-val) / 50 * 255);
                    }
                    if(val > 280) {
                        pix[i*4+0] = Math.floor((2/(Math.pow((val-310)/30,2)+1) - 1) * 255);
                        pix[i*4+1] += Math.floor((1.30/(Math.pow((val-295)/26,2)+1) - 1) * 255);                   
                    }
                };
                var organizeColor = function(i) {
                    pix[i*4+3] = Math.floor((pix[i*4] + pix[i*4+1] + pix[i*4+2])*0.7);
                    if(pix[i*4] > 0) {
                        pix[i*4+1] = pix[i*4+1]*(255/pix[i*4]);
                        pix[i*4] = 255
                    }
                    if(pix[i*4+2] > 0) {
                        if(pix[i*4] == 0)
                            pix[i*4+1] = pix[i*4+1]*(255/pix[i*4+2]);
                        pix[i*4+2] = 255
                    }
                }; 
                var save = true; break;
            case 'country': 
                var setColor = function(i,val,opacity) {
                    if(val > 0) {
                        pix[i*4] = gData.countries[val].color[0]*opacity;
                        pix[i*4+1] = gData.countries[val].color[1]*opacity;
                        pix[i*4+2] = gData.countries[val].color[2]*opacity;
                    }      
                };
                var organizeColor = function(i) {
                    if(pix[i*4] != 255 && pix[i*4+1] == 0 && pix[i*4+2] == 0)
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
                var discrete = true;
                var save = true; break;
            case 'perlinTest':
                var setColor = function(i,val) {
                    pix[i*4] = val * 255;
                };
                var organizeColor = function(i) {
                    pix[i*4+3] = pix[i*4];
                    pix[i*4] = 255;
                }; 
                var save = true; break;
        }
        //dtI = Math.floor(i/gConfig.tx_w/data_ratio)*gConfig.w + Math.floor(i%gConfig.tx_w / data_ratio);
        for(i = 0, n = pix.length/4; i < n; i++) {
            currentSq = gData.points[i];
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
        while(data_ratio % 2 == 0 || data_ratio % 3 == 0) {
            if(data_ratio % 4 == 0) {
                scaledCanvas = hqx(visualization,4);
                data_ratio /=4;
            }
            else if(data_ratio % 3 == 0) {
                scaledCanvas = hqx(visualization,3);
                data_ratio /=3;
            }
            else {
                scaledCanvas = hqx(visualization,2);
                data_ratio /=2;
            }
            delete visualization;
            visualization = scaledCanvas;
        }

        ctx = visualization.getContext("2d");
        imgd = ctx.getImageData(0,0,gConfig.tx_w,gConfig.tx_h);
        pix = imgd.data;

        for(i = 0, n = pix.length/4; i < n; i++) {
            organizeColor(i);
        }
        ctx.putImageData(imgd, 0, 0);
        
        if(save) {
            visualizations[layer] = document.createElement( 'canvas' );
            visualizations[layer].width = gConfig.tx_w;
            visualizations[layer].height = gConfig.tx_h;
            ctx = visualizations[layer].getContext("2d");
            ctx.drawImage(visualization,0,0);
        }

        return visualization;
    },

    getSphereCoords = function(mouseX,mouseY) {
        var distX = mouseX - display.windowX/2;
        var distY = mouseY - display.windowY/2;
        if(Math.sqrt(distX*distX + distY*distY) < getSphereScreenSize(camera.position.z)/2) {
            var intersect = checkIntersection( event.clientX, event.clientY );

            var phi = Math.acos(intersect.y/200) - rotation.y;
            var theta = Math.asin(intersect.x/Math.sin(phi)/200) + rotation.x;
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
        phi = (90 - lat) * Math.PI / 180;
        theta = (180 - lng) * Math.PI / 180;
        x = dist * Math.sin(phi) * Math.cos(theta);
        y = dist * Math.cos(phi);
        z = dist * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x,y,z);
    },

    resize = function(newWidth, newHeight, scaling) {
        if(newWidth) {
            display.windowX = newWidth;
            display.windowY = newHeight;            
        }
        if(scaling)
            display.scaling = parseFloat(scaling);

        if(camera != undefined) {
            camera.aspect = display.windowX / display.windowY;
            camera.updateProjectionMatrix();
        }
        if(renderer != undefined) {
            renderer.setSize( display.windowX/display.scaling, display.windowY/display.scaling );
            $(renderer.domElement).css('width',display.windowX).css('height',display.windowY);
            /*if(display.scaling != 1)
                renderer.setViewport( 0, 0, display.windowX, display.windowY );     */       
        }
    },

    // Initialize variables
    camera, scene, sphere, renderer, dataBars, point, point2, visualLayer, visualLayerTexture, visualArc,
        visualization, visualizations = {}, uiTextures = {}, decals = {},
        mouseVector, 
        display = { windowX:0 , windowY:0 , scaling:0 },

        climateGradient = document.createElement('canvas'),
        climateBg = new Image(),

        subgeo = new THREE.Geometry(),
        rotation = { x: 0, y: 0, z: 0 },
        PI_HALF = Math.PI / 2,
        onRender = function () {},
        ready = false;

    mouseVector = new THREE.Vector3(0, 0, 0);

    climateBg.onload = function () {
        climateGradient.width = climateBg.width;
        climateGradient.height = climateBg.height;
        var ctx = climateGradient.getContext("2d");
        ctx.drawImage(climateBg, 0, 0);
    };
    climateBg.src = 'ui/climateGradient.jpg';

    uiTextures['gun'] = new THREE.ImageUtils.loadTexture('ui/gun.png');

    resize(window.innerWidth, window.innerHeight, scaling);

    $(window).resize(function(event) {
        resize(window.innerWidth,window.innerHeight);
    });

    THREE.Vector3.prototype.addScalars = function(x,y,z) {
        this.x += x;
        this.y += y;
        this.z += z;

        return this;
    }

    // Return functions
    return {
        animate: animate,
        getSphereCoords: getSphereCoords,
        resize: resize,
        onRender: function(doOnRender) {
            onRender = doOnRender;
        },
        updateMatrix: function() {
            subgeo.verticesNeedUpdate = true;
        },
        moveCamera: function(x,y) {
            mouseVector.multiplyScalar(0.5).addScalars(x,y,0);
        },
        stopCameraMovement: function() {
            mouseVector.set(0,0,0);
        },
        zoomCamera: function(z) {
            mouseVector.addScalars(0,0,z);
        },
        clickSphere: function(x,y) {
            var sphereCoords = getSphereCoords(x,y);
            var dimensionalSpot = sphereCoords[2]; // Sphere intersection point
            if(sphereCoords) {
                console.log(sphereCoords);
            } else
                return false;
        },
        decal: function(id, lat, lng, size, texture) {
            if(decals[id] === undefined) {
                var geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
                var material = new THREE.MeshBasicMaterial({map: uiTextures[texture], side: THREE.DoubleSide, transparent: true, opacity: 1});
                decals[id] = new THREE.Mesh(geometry, material);

                decals[id].material.textureId = texture;
                decals[id].scale.x = size;
                decals[id].scale.y = size;
                decals[id].position = coordToCartesian(lat,lng,205);
                decals[id].lookAt(sphere.position);

                sphere.add(decals[id]);
            } else {
                // If the decal already exists, animate it
            }
        },
        lookAt: function (square) {
            var tween = new TWEEN.Tween(rotation).to({x: -(90 - square.lng) * Math.PI / 180, y: square.lat * Math.PI / 180, z: 0}, 2000);
            tween.easing(TWEEN.Easing.Cubic.Out);
            tween.start();
        },
        setData: function(dataPoint, ratio) {
            if(!dataPoint.vertices_pop) {
                addPoint(dataPoint.lat, dataPoint.lng, dataPoint);
                subgeo.verticesNeedUpdate = true;
            }
            var popLength = 198;
            if(dataPoint.total_pop > 0) {
                popLength = 60 * dataPoint.total_pop / ratio + 200;
                dataPoint.vertices_pop[0].setLength(popLength);
                dataPoint.vertices_pop[2].setLength(popLength);
                dataPoint.vertices_pop[5].setLength(popLength);
                dataPoint.vertices_pop[7].setLength(popLength);
            } else if(dataPoint.vertices_pop[0].length() >= 200) {
                dataPoint.vertices_pop[0].setLength(popLength);
                dataPoint.vertices_pop[2].setLength(popLength);
                dataPoint.vertices_pop[5].setLength(popLength);
                dataPoint.vertices_pop[7].setLength(popLength);
            }

            var zomLength = 198;
            if(dataPoint.infected > 0) {
                zomLength = 60 * dataPoint.infected / ratio + 200;
                if(zomLength < 200.1)
                    zomLength = 200.1;
                dataPoint.vertices_zom[1].setLength(popLength);
                dataPoint.vertices_zom[3].setLength(popLength);
                dataPoint.vertices_zom[4].setLength(popLength);
                dataPoint.vertices_zom[6].setLength(popLength);
                dataPoint.vertices_zom[0].setLength(zomLength);
                dataPoint.vertices_zom[2].setLength(zomLength);
                dataPoint.vertices_zom[5].setLength(zomLength);
                dataPoint.vertices_zom[7].setLength(zomLength);
            } else if(dataPoint.vertices_zom[0].length() >= 200) {
                dataPoint.vertices_zom[1].setLength(popLength);
                dataPoint.vertices_zom[3].setLength(popLength);
                dataPoint.vertices_zom[4].setLength(popLength);
                dataPoint.vertices_zom[6].setLength(popLength);
                dataPoint.vertices_zom[0].setLength(zomLength);
                dataPoint.vertices_zom[2].setLength(zomLength);
                dataPoint.vertices_zom[5].setLength(zomLength);
                dataPoint.vertices_zom[7].setLength(zomLength);
            }
        },
        setVisualization: function( layer ) {
            if(ready) {
                visualLayerTexture.image = getVisualization(layer);
                visualLayerTexture.needsUpdate = true;
                visualLayer.material.map = visualLayerTexture;
                visualLayer.visible = true;              
            }
        },
        closeVisualization: function () {
            if(ready)
                visualLayer.visible = false;
        },
        visualization: function () {
            if(ready)
                return visualLayer.visible;
            else
                return false;
        },
        togglePopDisplay: function (square) {
            if(dataBars.visible) {
                var tween = new TWEEN.Tween(dataBars.scale).to({x:0, y: 0, z: 0}, 1000);
                tween.onComplete(function(){
                    dataBars.visible = false;
                });
                tween.easing(TWEEN.Easing.Circular.In);
            }
            else {
                dataBars.visible = true;
                var tween = new TWEEN.Tween(dataBars.scale).to({x: 1, y: 1, z: 1}, 1000);
                tween.easing(TWEEN.Easing.Circular.Out);
            }
            tween.start();
        },
        displayArc: function (point1, point2) {
            var i,A,B,position,index,
                phi1 = (90 - point1.lat) * Math.PI / 180,
                theta1 = (180 - point1.lng) * Math.PI / 180,
                phi2 = (90 - point2.lat) * Math.PI / 180,
                theta2 = (180 - point2.lng) * Math.PI / 180,
                n_sub = 24;

            var d = Math.acos(Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(theta1 - theta2)),
                points = [coordToCartesian(point1.lat,point1.lng)];

            for(i = 1; i < n_sub; i++) {
                var f = i/n_sub;
                var A = Math.sin((1 - f) * d) / Math.sin(d);
                var B = Math.sin(f * d) / Math.sin(d);
                var x = A * Math.sin(phi1) * Math.cos(theta1) + B * Math.sin(phi2) * Math.cos(theta2),
                    y = A * Math.cos(phi1) + B * Math.cos(phi2),
                    z = A * Math.sin(phi1) * Math.sin(theta1) + B * Math.sin(phi2) * Math.sin(theta2);

                points.push(new THREE.Vector3(x,y,z).setLength(200+30*Math.sin(f*Math.PI)));
            }
            points.push(coordToCartesian(point2.lat,point2.lng));

            var spline = new THREE.Spline(points);

            for ( i = 0; i < n_sub*3; i++ ) {
                index = i / ( n_sub*3 - 1 );
                position = spline.getPoint( index );

                visualArc.geometry.vertices[i].copy( position );
            }
            visualArc.geometry.verticesNeedUpdate = true;

            visualArc.visible = true;
        },
        hideArc: function () {
            visualArc.visible = false;
        },
        init: init
    };
}