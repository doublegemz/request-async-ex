var container;

var camera, controls, raycaster, renderer;
var canvas;

var scene = new THREE.Scene();
window.scene = scene;

var lighting, ambient, keyLight, fillLight, backLight;
var gridHelper;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var LoadingTimeStamp = 0;
var testArray = [];
var storedTexture = [];
var bustOn = undefined;
var bustOnName = undefined;

window.onload = function() {
    console.log("start onload");
    init();
};

function init() {
    window.addEventListener('resize', onWindowResize, false);
    container = document.getElementById('threeD-content');
    var ModelCount = document.getElementById("modelCount");
    var LoadCount = document.getElementById("loadCount");

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    /* Camera */
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 2.5;

    /* Controls */
    var controls = new THREE.OrbitControls( camera );
    // console.log(controls);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.25; 
    controls.enableZoom = false;

    /* Scene */
    lighting = false;

    ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    topLeftLight = new THREE.DirectionalLight("rgb(184,176,149)", 0.34);
    topLeftLight.position.set(-40, 10, 50);
    topLeftLight.target.position.set(0.5,0,1.5);
    topLeftLight.target.updateMatrixWorld();
    topLeftLight.castShadow=true;
    scene.add(topLeftLight);

    frontSecondLight = new THREE.DirectionalLight("rgb(144,86,170)", 0.3);
    frontSecondLight.position.set(0.5, 0, 100);
    frontSecondLight.target.position.set(0.5,0,1.5);
    frontSecondLight.target.updateMatrixWorld();
    frontSecondLight.castShadow=true;
    scene.add(frontSecondLight);

    sunLight = new THREE.SpotLight( 0xffffff, 0, 0, Math.PI/2 );
    sunLight.position.set( 1000, 2000, 1000 );
    sunLight.castShadow = false;
    scene.add(sunLight);

    var size = 0.8; 
    var divisions = 0.1; 
    gridHelper = new THREE.GridHelper( size, divisions ); 
    gridHelper.setColors( 0xf618ef, 0x0ccf0c );
    scene.add( gridHelper );
    // console.log( gridHelper );
    //path names must match ids of p tags
    var paths = ["yulu", "sabrina"]

    // add event listeners to list of names
    console.log(paths);
    for (var n = paths.length - 1; n >= 0; n--) {
        document.getElementById(paths[n]).addEventListener("click", displayOneModel, false);
    }

    j = 0;

    function loadNextPath() {
        var p = paths.pop();
        var pathToLoad = "assets/" + p + "/";
        // console.log(p);
        ModelCount.innerHTML = pathToLoad;
        if (!p) {
            console.log("OK THERE SHOULD BE NO ANIMATES BEFORE THIS LINE!");
            animate();
            document.getElementById("loadingOverlay").style.display="none";
            if (currentURL != "") {
                //load specific piece
                var URLbust = 13 - currentURL.substring(4, 6);
                console.log("the current URL / model num is: " + URLbust);
            }
        } else {
            // document.getElementById(p).addEventListener('click', displayOneModel(p));
            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.setBaseUrl(pathToLoad);
            mtlLoader.setPath(pathToLoad);                       
            mtlLoader.load('model_mesh.obj.mtl', function (materials) {

                materials.preload();
                var objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath(pathToLoad);
                // console.log("loading model");
                objLoader.load('model_mesh.obj', function (obj) {
                    var l = pathToLoad.length;
                    obj.name = pathToLoad.substring(7, l-1);
                    var mesh = obj.children[ 0 ]; 
                    mesh.geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry ); 
                    mesh.geometry.mergeVertices(); 
                    mesh.geometry.computeVertexNormals();
                    testArray.push(obj);
                    storedTexture[j] = obj.children[0].material.map;
                    // console.log(obj.name);
                    scene.add(obj); 
                    // console.log(obj);
                    // TEMP
                    if (obj.name == "yulu") {
                        obj.visible = true;
                    } else {
                       obj.visible = false; 
                    }
                    
                    obj.children["0"].geometry.computeBoundingSphere();
                    var bottOfFeet=obj.children["0"].geometry.boundingSphere.center.y-obj.children["0"].geometry.boundingSphere.radius;
                    // console.log(bottOfFeet);
                    // console.log(gridHelper); 
                    gridHelper.position.y=bottOfFeet;
                    loadNextPath(); 
                });
            });
            // console.timeEnd(pathToLoad);
            var end = window.performance.now(); 
            // console.log("end: " + end);
            var time = end - LoadingTimeStamp;
            // console.log(time);
            LoadingTimeStamp = end;
            LoadCount.innerHTML = Math.round(time * 100 / 1000) / 100 + " s";
        }
    
    }
    loadNextPath();

    //URL
    currentURL = window.location.hash;

    /* Vectors */
    raycaster = new THREE.Raycaster();

    /* Renderer */
    canvas = document.getElementById("canvasID"); 
    canvas.style.marginLeft = "auto";
    canvas.style.marginRight = "auto";
    canvas.style.display = "block";
    canvas.allowTouchScrolling = true;
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setSize(document.getElementById("threeD-content").clientWidth, document.getElementById("threeD-content").clientHeight)
    // var ren_W = document.getElementById("threeD-content").clientWidth;
    // var ren_H = (ren_W*window.innerHeight)/window.innerWidth;
    // renderer.setSize(ren_W, ren_H);
    renderer.setClearColor(new THREE.Color(0xF8F8F8)); //2a6489
    container.appendChild(renderer.domElement);

  
}

function displayOneModel(evt) {
    // remove selected model name in list
    // if (bustOnName != undefined) {
    //     var modelRemoveClass = document.getElementById(bustOnName).classList;
    //     modelRemoveClass.remove("selected");
    // }
    var foundPerson;
    for (var i = testArray.length - 1; i >= 0; i--) {
        if (testArray[i].name === evt.target.id) {
            bustOnName = evt.target.id;
            var foundPerson = i;
            bustOn = i;
            testArray[i].visible = true;
            // reposition grid
            testArray[i].children["0"].geometry.computeBoundingSphere();
            var bottOfFeet=testArray[i].children["0"].geometry.boundingSphere.center.y-testArray[i].children["0"].geometry.boundingSphere.radius;
            gridHelper.position.y=bottOfFeet;
            // var modelClasses = document.getElementById(evt.target.id).classList;
            // modelClasses.add("selected");
            // console.log(evt.target.innerHTML);
            // console.log(document.getElementById("selected").innerHTML);
            document.getElementById("selected").innerHTML = evt.target.innerHTML;
        } else {
            testArray[i].visible = false;
        }
    }
}

// dropdown
function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function onWindowResize() {
    // resize canvas
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize( window.innerWidth, window.innerHeight );
    // var ren_W = document.getElementById("threeD-content").clientWidth;
    // var ren_H = (ren_W*window.innerHeight)/window.innerWidth;
    // renderer.setSize(ren_W, ren_H);

}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}