
var container;
var camera, controls, scene, renderer;
var mesh, texture;
var worldWidth = 256, worldDepth = 256,
worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
var clock;
var helper;
var mouse;

function load3D(width, height, extent)
{
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
		document.getElementById( 'map3D' ).innerHTML = "";
	}
	init3JS();
	createTerrain(width, height, extent);
	animate();
}	

function init3JS() {
		scene = null;
   	 	renderer = null;
    	camera = null;
    	clock = null;
		clock = new THREE.Clock();	
		mouse = new THREE.Vector2();	
		container = document.getElementById( 'map3D' );
		empty(container);
		container.innerHTML = "";
		camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
		scene = new THREE.Scene();
		controls = new THREE.OrbitControls(camera);
		controls.center.set( 0.0, 50.0, 0.0 );
		controls.userPanSpeed = 100;
		camera.position.y =  controls.center.y + 800;
		camera.position.x = 0;
		camera.position.z = 500;
		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( 0x333333 );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );        
		var ambientLight = new THREE.AmbientLight(0xbbbbbb);
		scene.add(ambientLight);
		window.addEventListener( 'resize', onWindowResize, false );
}


function createTerrain(width, height, extent){

	var extentString = extent._southWest.lng + "," 
		+ extent._southWest.lat + "," 
		+ extent._northEast.lng + "," 
		+ extent._northEast.lat;

	var imageUrl = "http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/export?"
		+ "bbox="+ extentString+"&bboxSR=4326&layers=&layerDefs=&size=" + window.innerWidth +"%2C" + window.innerHeight 
		+ "&imageSR=&format=jpg&transparent=false&dpi=&time=&layerTimeOptions=&dynamicLayers=&gdbVersion=&mapScale=&f=image";

	var geometry = new THREE.PlaneBufferGeometry( width, height, worldWidth - 1, worldDepth - 1 );
	var geometry2 = new THREE.PlaneBufferGeometry( width, height, worldWidth - 1, worldDepth - 1 );
	var geometry3 = new THREE.PlaneBufferGeometry( width, height, worldWidth - 1, worldDepth - 1 );

	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	geometry2.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	geometry3.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

	for ( var j = 0; j < geometry2.attributes.position.array.length; j +=3 ) {
		geometry2.attributes.position.array[ j+1 ] = geometry2.attributes.position.array[ j+1 ]- 200;
		geometry3.attributes.position.array[ j+1 ] = geometry3.attributes.position.array[ j+1 ] - 2;
	}

	var helperTerrainGrid = new THREE.Mesh(
		geometry2, 
			new THREE.MeshBasicMaterial({ 
				color: 0x8888FF, //0x888888, 
				wireframe: true, 
				transparent: true,
				opacity: 0.1 
			})
	); 
	scene.add(helperTerrainGrid );	

	var helperTerrainGrid2 = new THREE.Mesh(
		geometry3, 
		new THREE.MeshBasicMaterial({ 
			color: 0x888888, //0x888888, 
			wireframe: true, 
			transparent: true,
			opacity: 0.1 
		})
	); 
	scene.add(helperTerrainGrid2 );	

	THREE.ImageUtils.crossOrigin = "";
	var material = new THREE.MeshLambertMaterial({
		          	map: THREE.ImageUtils.loadTexture(imageUrl),
					transparent: true,
					opacity: 0.95 
		        });
	mesh = new THREE.Mesh( geometry, material );
	scene.add(mesh);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
	controls.update( clock.getDelta() );
	renderer.render( scene, camera );
}

function empty(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
}