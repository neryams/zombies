/*
    3d renderer module. 
    Dependencies: Three.js
*/
var Renderer = function() {
    var camera, scene, sphere, renderer, dataBars, point, point2, visualLayer, visualLayerTexture, visualArc,
        climateGradient,visualizations={},visualization,
        mouseVector, windowX, windowY, 
        subgeo = new THREE.Geometry();
        rotation = { x: 0, y: 0, z: 0 },
        PI_HALF = Math.PI / 2,
        onRender = function() {}, 
        ready = false;
    mouseVector = new THREE.Vector3(0,0,0);

    climateGradient = document.createElement( 'canvas' ); 
    var climateBg = new Image();
    climateBg.src = 'ui/climateGradient.jpg';
    climateBg.onload = function(){
        climateGradient.width = climateBg.width;
        climateGradient.height = climateBg.height;
        var ctx = climateGradient.getContext("2d");
        ctx.drawImage(climateBg,0,0);
    }

    // Function for filling the canvases with the data generated previously
    function buildImage(globeTexture,globeHeightmap,texture) {
        var ctxT = globeTexture.getContext("2d");
        var ctxH = globeHeightmap.getContext("2d");
        var ctxC = climateGradient.getContext("2d");
        var imgdT = ctxT.getImageData(0,0,gConfig.tx_w,gConfig.tx_h);
        var imgdH = ctxH.getImageData(0,0,gConfig.tx_w,gConfig.tx_h);
        var imgdC = ctxC.getImageData(0,0,climateGradient.width,climateGradient.height);
        var pixT = imgdT.data;
        var pixH = imgdH.data;
        var grdC = imgdC.data;
        var current,dtI,gradX,gradY,gradI,color,color_ratio;

        var data_ratio = gConfig.tx_w / gConfig.w;
        for(i = 0, j = 0, n = texture.length; i < n; i++) {
            current = Math.floor(texture[i]);

            // Figure out the current square in the data map (as opposed to the texture map)
            dtI = Math.floor(i/gConfig.tx_w/data_ratio)*gConfig.w + Math.floor(i%gConfig.tx_w / data_ratio);
            currentConditions = gData.points[dtI];

            // Get the x/y coordinates in the climate coloring texture
            gradY = Math.round((1 - (312.5 - currentConditions.temperature)/60)*255);
            if(gradY < 0)
                gradY = 0;
            if(currentConditions.precipitation < 0)
                currentConditions.precipitation = 0;
            gradX = Math.round((1 - currentConditions.precipitation/20)*255);
            if(gradX < 0)
                gradX = 0; 
            gradI = gradY*climateGradient.width+gradX;

            // Get the color of the gorund at this point
            color = [grdC[gradI*4],grdC[gradI*4+1],grdC[gradI*4+2]];

            // Generate height texture (greyscale map of elevation) and earth texture (color map using climate info)
            if(current > gConfig.waterLevel) {
                pixH[i*4] = pixH[i*4+2] = pixH[i*4+1] = Math.floor((current - gConfig.waterLevel)/10);
                pixT[i*4] = color[0];
                pixT[i*4+1] = color[1];
                pixT[i*4+2] = color[2];
            } else {
                pixH[i*4] = pixH[i*4+2] = pixH[i*4+1] = 0;
                pixT[i*4] = 0;
                pixT[i*4+1] = Math.floor(gConfig.waterLevel/2) - (gConfig.waterLevel - current)*3;
                pixT[i*4+2] = current*2+10;

                if(currentConditions.temperature < 252.5) {
                    pixT[i*4+0] = color[0];
                    pixT[i*4+1] = color[1];
                    pixT[i*4+2] = color[2];         
                }
            }
        }
        ctxT.putImageData(imgdT, 0, 0);
        ctxH.putImageData(imgdH, 0, 0);
    }

    var init = function(texture) {
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
        windowX = window.innerWidth;
        windowY = window.innerHeight;

        camera = new THREE.PerspectiveCamera( 60, windowX / windowY, 1, 10000 );
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
        geometry = new THREE.CubeGeometry(0.9, 0.9, 1, 1, 1, 1, null, false, { px: true,
              nx: true, py: true, ny: true, pz: false, nz: true});
        geometry.faces.length = 5 // remove bottom of cube (=4 to temove top as well)
        /*for (var i = 0; i < geometry.vertices.length; i++) {
            var vertex = geometry.vertices[i];
            vertex.z += 0.5;
        }*/
        geometry.applyMatrix( new THREE.Matrix4().translate( new THREE.Vector3(0, 0, 0.5)));
        point = new THREE.Mesh(geometry); // humans

        geometry = new THREE.CubeGeometry(0.9, 0.8, 1, 1, 1, 1, null, false, { px: true,
              nx: true, py: true, ny: true, pz: false, nz: true});
        geometry.faces.length = 5 // remove bottom of cube
        /*for (var i = 0; i < geometry.vertices.length; i++) {
            var vertex = geometry.vertices[i];
            vertex.z += 0.5;
        }*/
        point2 = new THREE.Mesh(geometry); // zombies

        /*geometry = new THREE.PolyhedronGeometry([[1,1,0],[0,1,0],[1,0,0],[1,1,1]],[[2,1,0],[0,3,2],[1,3,0],[2,3,1]],0.76, 0);
        point2 = new THREE.Mesh(geometry);*/

        camera.lookAt( scene.position );
        //camera.position.x = -100;

        /*renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );*/
        renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x060708, clearAlpha: 1 } );
        renderer.setSize( windowX, windowY );

        document.getElementById('container').appendChild( renderer.domElement );

        addData();
        ready = true;
    }

    function addData() {
        var lat, lng, color, i, element;

        for (i = 0; i < gData.points.length; i++) {
            if(gData.points[i].total_pop > 0 && !gData.points[i].water) {
                addPoint(gData.points[i].lat, gData.points[i].lng, gData.points[i]);
            }
        }

        subgeo.dynamic = true;

        dataBars = new THREE.Mesh(subgeo, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.FaceColors,
            morphTargets: false,
            side: THREE.BackSide
        }));
        sphere.add( dataBars );
    };

    function addPoint( lat, lng, datapoint ) {
        var phi = (90 - lat) * Math.PI / 180,
            theta = (180 - lng) * Math.PI / 180,
            color = new THREE.Color(),
            infectColor = new THREE.Color(),
            element = datapoint.total_pop / gConfig.max_pop;
            //element = (gData.points[i].temperature - 220) / 100;

        color.setHSV( ( 0.6 - ( element * 0.3 ) ), 1.0, 1.0 );
        infectColor.setHSV( 0, 1.0, 0.9 );
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
    }

    function render() {
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
    }

    function animate() {
        requestAnimationFrame( animate );
        render();
    }

    function getSphereScreenSize( dist ) {
        // Given sphere size of 200 and FoV of 60
        return (400/(2 * Math.tan( 30/180 * Math.PI ) * dist))*windowY;
    }

    function checkIntersection( mouseX, mouseY ) {
        var projector = new THREE.Projector();
        var vector    = new THREE.Vector3( (mouseX / windowX) * 2 - 1,    -(mouseY / windowY) * 2 + 1, 0.5);

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
    }

    function getVisualization(layer) {
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
    }

    function getSphereCoords(mouseX,mouseY) {
        var distX = mouseX - windowX/2;
        var distY = mouseY - windowY/2;
        if(Math.sqrt(distX*distX + distY*distY) < getSphereScreenSize(camera.position.z)/2) {
            var intersect = checkIntersection( event.clientX, event.clientY );

            var phi = Math.acos(intersect.y/205) - rotation.y;
            var theta = Math.asin(intersect.x/Math.sin(phi)/205) + rotation.x;
            if(theta*180/Math.PI + 90 > 0)
                return [(90 - Math.abs(phi*180/Math.PI)),(theta*180/Math.PI + 90)%360,intersect];
            else
                return [(90 - Math.abs(phi*180/Math.PI)),360 + (theta*180/Math.PI + 90)%360,intersect];
        }
        return false;
    }

    // Return functions
    return {
        animate: animate,
        getSphereCoords: getSphereCoords,
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
            if(sphereCoords) {
                console.log(sphereCoords);
            } else
                return false;
        },
        resize: function(newWidth, newHeight) {
            if(camera != undefined) {
                windowX = newWidth;
                windowY = newHeight;

                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();

                renderer.setSize( newWidth, newHeight );          
            }
        },
        lookAt: function (square) {
            var tween = new TWEEN.Tween(rotation).to({x: -(90 - square.lng) * Math.PI / 180, y: square.lat * Math.PI / 180, z: 0}, 2000);
            tween.easing(TWEEN.Easing.Cubic.Out);
            tween.start();
        },
        setData: function(dataPoint, popLength, zomLength) {
            if(!dataPoint.vertices_pop) {
                addPoint(dataPoint.lat, dataPoint.lng, dataPoint);
                subgeo.verticesNeedUpdate = true;
            }
            popLength = popLength * 60 + 200;
            if(zomLength * 60 < 0.5 && zomLength > 0)
                zomLength = popLength + 0.5;
            else if(zomLength > 0 && popLength <= 200) {
                popLength = 200
                zomLength = zomLength * 60 + popLength;
            }
            else if(zomLength > 0)
                zomLength = zomLength * 60 + popLength;

            if(zomLength) {
                dataPoint.vertices_zom[1].setLength(popLength);
                dataPoint.vertices_zom[3].setLength(popLength);
                dataPoint.vertices_zom[4].setLength(popLength);
                dataPoint.vertices_zom[6].setLength(popLength);
                dataPoint.vertices_zom[0].setLength(zomLength);
                dataPoint.vertices_zom[2].setLength(zomLength);
                dataPoint.vertices_zom[5].setLength(zomLength);
                dataPoint.vertices_zom[7].setLength(zomLength);
            } else if(dataPoint.vertices_zom[0].length() >= 200) {
                dataPoint.vertices_zom[1].setLength(198);
                dataPoint.vertices_zom[3].setLength(198);
                dataPoint.vertices_zom[4].setLength(198);
                dataPoint.vertices_zom[6].setLength(198);
                dataPoint.vertices_zom[0].setLength(199);
                dataPoint.vertices_zom[2].setLength(199);
                dataPoint.vertices_zom[5].setLength(199);
                dataPoint.vertices_zom[7].setLength(199);
            }

            if(popLength > 200) {
                dataPoint.vertices_pop[0].setLength(popLength);
                dataPoint.vertices_pop[2].setLength(popLength);
                dataPoint.vertices_pop[5].setLength(popLength);
                dataPoint.vertices_pop[7].setLength(popLength);
            } else if(dataPoint.vertices_pop[0].length() >= 200) {
                dataPoint.vertices_pop[0].setLength(199);
                dataPoint.vertices_pop[2].setLength(199);
                dataPoint.vertices_pop[5].setLength(199);
                dataPoint.vertices_pop[7].setLength(199);                    
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
            var phi,theta,x,y,z,i,j,
                position, index, n_sub = 36;

            phi = (90 - point1.lat) * Math.PI / 180;
            theta = (180 - point1.lng) * Math.PI / 180;
            x = 200 * Math.sin(phi) * Math.cos(theta);
            y = 200 * Math.cos(phi);
            z = 200 * Math.sin(phi) * Math.sin(theta);
            var start = new THREE.Vector3(x,y,z);

            phi = (90 - point2.lat) * Math.PI / 180;
            theta = (180 - point2.lng) * Math.PI / 180;
            x = 200 * Math.sin(phi) * Math.cos(theta);
            y = 200 * Math.cos(phi);
            z = 200 * Math.sin(phi) * Math.sin(theta);
            var end = new THREE.Vector3(x,y,z);

            var points = [start];
            var midpoint = new THREE.Vector3(0,0,0);
            for ( i = 0; i < n_sub; i++ ) {
                midpoint.set(0, 0, 0);
                for (j = 0; j < n_sub - i; j++)
                    midpoint.add(start);
                for (j = 0; j < i + 1; j++)
                    midpoint.add(end);

                if(2*(n_sub/2 - Math.abs(n_sub/2 - i - 0.5)) < 30)
                    midpoint.setLength(200 + 2*(n_sub/2 - Math.abs(n_sub/2 - i - 0.5)));
                else
                    midpoint.setLength(230);

                points.push(new THREE.Vector3(0,0,0));
                points[points.length - 1].copy(midpoint);
            }
            points.push(end);

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

THREE.Vector3.prototype.addScalars = function(x,y,z) {
    this.x += x;
    this.y += y;
    this.z += z;

    return this;
}