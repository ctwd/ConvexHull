var hullConfig = {
	clear: onClear(),
	init: onInit(),
	type: "增量法",
	convexHull: onHull(),
	pointCount: 50,
};

var playConfig = {
	speed: 1,
	progress: 0,
	dampFactor: 0.3,
	animation: true,
	paused: false,
};

var displayConfig = {
	showPoint: true,
};

function setupGUI() {
	gui = new dat.GUI();

	var hullGui = gui.addFolder("凸包控制");
	var playGui = gui.addFolder("播放控制");
	var displayGui = gui.addFolder("显示控制");

	hullGui.add(hullConfig, "pointCount").min(4).max(100).step(1).name("点数").onFinishChange();
	hullGui.add(hullConfig, "clear").name("清空");
	hullGui.add(hullConfig, "init").name("初始化点集");
	hullGui.add(hullConfig, "type", ["增量法", "礼品包装法", "冲突图法", "分治法"]).name("算法类型").onChange(onType())

	hullGui.add(hullConfig, "convexHull").name("生成凸包");

	playGui.add(playConfig, "animation").name("播放动画").onChange(onAnimation());
	playGui.add(playConfig, "paused").name("暂停").onChange();
	playGui.add(playConfig, "speed").min(1).max(10).step(1).name("播放速度").onFinishChange(onSpeedChanged);
	playGui.add(playConfig, "progress").min(0).max(100).step(1).name("播放进度").onFinishChange(onProgressChanged);
	playGui.add(playConfig, "dampFactor").min(0.0).max(0.3).step(0.01).name("转动阻尼").onFinishChange(onDampChanged);

	displayGui.add(displayConfig, "showPoint").name("显示顶点").onChange();

	hullGui.open();
	playGui.open();
	displayGui.open();
	gui.width = 200;
	gui.open();
}

function onClear() {
	return function() {
		for (var i = 0; i < points.length; i++) {
			removeFromScene("point" + i);
		};
		removeFromScene("finalHull");
		points = [];
		geometry = null;
		meta = null;
		actions = null;
		hullValid = false;
		removeFaces();
	}
}

function onType() {
	return function() {
		removeFaces();
		geometry = null;
		meta = null;
		actions = null;
		hullValid = false;
	}
}

function onAnimation() {
	removeFaces();
}

function onInit() {
	return function() {
		onClear()();
		points = initPoints(hullConfig.pointCount);
		var sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			opacity: 0.5,
		});
		var sphere = new THREE.SphereGeometry(5, 4, 4)
		for (var i = 0; i < points.length; i++) {
			var mesh = new THREE.Mesh(sphere, sphereMaterial);
			mesh.position.x = points[i].x;
			mesh.position.y = points[i].y;
			mesh.position.z = points[i].z;
			mesh.updateMatrix();
			mesh.matrixAutoUpdate = false;
			mesh.name = "point" + i;
			scene.add(mesh);
		}
	}
}

function onHull() {
	return function() {
		// ["增量法", "礼品包装法", "冲突图法", "分治法"]
		if (points.length == 0) {
			alert("请先初始化点集");
			return;
		}
		switch (hullConfig.type) {
			case "增量法":
				geometry = new IncrementalHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				var1 = 0;
				var2 = 0;
				break;
			case "礼品包装法":
				geometry = new GiftWrappingHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				break;
			case "冲突图法":
				geometry = new ConflictGraphHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				break;
			case "分治法":
				geometry = new DivideConquerHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				break;
			default:
				geometry = null;
				meta = null;
				break;
		}
		removeFaces();
	}
}

function onSpeedChanged() {

}

function onProgressChanged() {
	removeFaces();
}

function onDampChanged() {
	controls.dynamicDampingFactor = playConfig.dampFactor;
}

function fillFinalGeometry() {
	if (hullValid) {
		return;
	}
	removeFaces();
	if (geometry != null) {
		var geometryMaterial = new THREE.MeshNormalMaterial({
			color: 0x0000ff,
			shading: THREE.FlatShading
		});
		var mesh = new THREE.Mesh(geometry, geometryMaterial);
		mesh.name = "finalHull";
		objs.push("finalHull");
		mesh.matrixAutoUpdate = false;
		scene.add(mesh);
		hullValid = true;
	}
}

function stayPaused() {

}

function updateScene() {
	if (geometry == null) {
		return;
	}
	switch (hullConfig.type) {
		case "增量法":
			updateIncremental();
			break;
		case "礼品包装法":
			updateGiftWrapping();
			break;
		case "冲突图法":
			updateConflictGraph();
			break;
		case "分治法":
			updateDiviedConquer();
			break;
		default:
			break;
	}
}

function updateIncremental() {
	if (geometry == null) {
		return;
	}
	var time = new Date().getTime();


	interval = 300.0 / playConfig.speed;

	if (time - lastTime > interval) {

		trl = meta[0];
		actions = meta[1];
		if (var1 >= actions.length) {
			unstressPoint(points.length - 1);
			return;
		}
		removeCount = actions[var1][0].length;
		addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			var1++;
			stressPoint(var1 + 2);
			return;
		}
		if (var2 < removeCount) {
			removeId = actions[var1][0][var2];
			removeFromScene("incFace" + removeId);
		} else {
			var geometryMaterial = new THREE.MeshNormalMaterial({
				color: 0x0000ff,
				shading: THREE.FlatShading
			});
			//geometryMaterial.transparent
			newFace = new THREE.Geometry();
			newFace.vertices = points;
			i = actions[var1 - 1][1] + var2 - removeCount;
			var pointIds = trl[i].points;
			var pts = [points[pointIds[0]], points[pointIds[1]], points[pointIds[2]]];
			var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
			var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
			face.normal.copy(faceNormal);
			newFace.faces.push(face);
			face = new THREE.Face3(pointIds[0], pointIds[2], pointIds[1]);
			faceNormal = (pts[2].clone().sub(pts[0])).cross(pts[1].clone().sub(pts[0]));
			face.normal.copy(faceNormal);
			newFace.faces.push(face);
			var mesh = new THREE.Mesh(newFace, geometryMaterial);
			mesh.matrixAutoUpdate = false;
			mesh.name = "incFace" + i;
			objs.push(mesh.name);
			scene.add(mesh);
		}
		var2++;
		lastTime = time;
	}
}

function removeFromScene(name) {
	var selectedObject = scene.getObjectByName(name);
	if (selectedObject != null) {
		scene.remove(selectedObject);
	}
}

function stressPoint(index) {
	if (index > 0) {
		unstressPoint(index - 1);
	}
	removeFromScene("point" + index);
	if (index < points.length && index >= 0) {

		var sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			opacity: 0.5,
		});
		var sphere = new THREE.SphereGeometry(10, 4, 4);
		var mesh = new THREE.Mesh(sphere, sphereMaterial);
		mesh.position.x = points[index].x;
		mesh.position.y = points[index].y;
		mesh.position.z = points[index].z;
		mesh.updateMatrix();
		mesh.matrixAutoUpdate = false;
		mesh.name = "point" + index;
		scene.add(mesh);
		stressId = index;
	}
}

function unstressPoint(index) {
	removeFromScene("point" + index);
	if (index < points.length && index >= 0) {
		var sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			opacity: 0.5,
		});
		var sphere = new THREE.SphereGeometry(5, 4, 4);

		var mesh = new THREE.Mesh(sphere, sphereMaterial);
		mesh.position.x = points[index].x;
		mesh.position.y = points[index].y;
		mesh.position.z = points[index].z;
		mesh.updateMatrix();
		mesh.matrixAutoUpdate = false;
		mesh.name = "point" + index;
		scene.add(mesh);
	}
}

function removeFaces() {
	lastTime = new Date().getTime();
	for (var i = 0; i < objs.length; i++) {
		removeFromScene(objs[i]);
	}
	objs = [];
	hullValid = false;
	unstressPoint(stressId);
}