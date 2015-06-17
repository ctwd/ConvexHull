var ioConfig = {
	clear: onClear(),
	init: onInit(),
	pointCount: 50,
	openFile: onOpenFile(),
	saveFile: onSavePoints(),
};

var hullConfig = {
	type: "分治法",
	convexHull: onHull(),
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
	showSTLMesh: true,
	perspectiveCamera: true,
	orthographicCamera: false,

};

var authorConfig = {
	author1: "孙聪",
	author2: "高莹",
};

$(document).ready(
	function() {
		$("#upload_file").change(function() {
			if ($("#upload_file").val() != '') $("#submit_form").submit();
		});

		$("#exec_target").load(function() {
			var data = $(window.frames['exec_target'].document.body).find("textarea").html();
			if (data != null) {
				onClear()();

				alert(data.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
				var filename = $("#upload_file").val();

				$("#upload_file").val('');

				var index = filename.lastIndexOf('\\');
				var name = filename.substring(index + 1);
				STLFileName = name;

				if (name == null || name == "") {
					alert("请先选择上传点集文件");
					return;
				}

				index = filename.lastIndexOf('.');
				var type = filename.substring(index + 1);


				loadFile(name, type);

			} //end if(data !=null )
		});
	}
);



function setupGUI() {
	gui = new dat.GUI();

	var ioGUI = gui.addFolder("点集操作");
	var hullGui = gui.addFolder("算法控制");
	var playGui = gui.addFolder("播放控制");
	var displayGui = gui.addFolder("显示控制");
	var authorGui = gui.addFolder("关于作者");

	ioGUI.add(ioConfig, "pointCount").min(4).max(100).step(1).name("随机点数").onFinishChange();
	ioGUI.add(ioConfig, "init").name("初始化点集");
	ioGUI.add(ioConfig, "openFile").name("选择文件");
	ioGUI.add(ioConfig, "clear").name("清空");
	ioGUI.add(ioConfig, "saveFile").name("保存点集");


	hullGui.add(hullConfig, "type", ["增量法", "礼品包装法", "冲突图法", "分治法", "分治法(改)"]).name("算法类型").onChange(onType());
	hullGui.add(hullConfig, "convexHull").name("生成凸包");

	playGui.add(playConfig, "animation").name("播放动画").onChange(onAnimation());
	playGui.add(playConfig, "paused").name("暂停").onChange();
	playGui.add(playConfig, "speed").min(1).max(10).step(1).name("播放速度").onFinishChange(onSpeedChanged);
	playGui.add(playConfig, "progress").min(0).max(100).step(1).name("播放进度").listen().onChange(onProgressChange).onFinishChange(onProgressChanged);
	playGui.add(playConfig, "dampFactor").min(0.0).max(0.3).step(0.01).name("转动阻尼").onFinishChange(onDampChanged);

	displayGui.add(displayConfig, "showPoint").name("显示顶点").onChange(onShowPoint);
	displayGui.add(displayConfig, "showSTLMesh").name("显示模型").listen().onFinishChange(onShowSTLMesh);
	displayGui.add(displayConfig, "perspectiveCamera").name("透视投影").listen().onFinishChange(onPerspectiveCamera);
	displayGui.add(displayConfig, "orthographicCamera").name("正交投影").listen().onFinishChange(onOrthographicCamera);


	authorGui.add(authorConfig, "author1").name("清软研140");
	authorGui.add(authorConfig, "author2").name("清软研143");

	ioGUI.open();
	hullGui.open();
	playGui.open();
	displayGui.open();
	authorGui.open();

	gui.width = 200;
	gui.open();
}

function onShowSTLMesh() {

	if (displayConfig.showSTLMesh) {
		removeFromScene("loadSTL");
		if (STLFileName == null || STLFileName == "")
			return;
		loadOldSTLFile(STLFileName);
	} else {
		removeFromScene("loadSTL");
	}

}

function onOpenFile() {
	return function() {

		onClear()();
		displayConfig.showSTLMesh = true;
		var element = document.getElementById("upload_file");
		element.click();
	}
}

function onSavePoints() {

	return function() {
		if (points.length == 0) {
			alert("请先初始化点集");
			return;
		}
		var textFile = null;
		var saveContent = "";
		for (var i = 0; i < points.length - 1; i++) {
			saveContent = saveContent + points[i].x + "," + points[i].y + "," + points[i].z + ",";
		}

		saveContent = saveContent + points[points.length - 1].x + "," + points[points.length - 1].y + "," + points[points.length - 1].z;

		textFile = makeTextFile(saveContent);

		$("#adddiv").empty();

		var cc = "<a id=\"linkdown\"  href=\"" + textFile + "\" download=\"data.txt\">下载</a>";
		$("#adddiv").append(cc);

		var element = document.getElementById("linkdown");
		element.click();
	}

}

function onClear() {
	return function() {
		removeFromScene("pointMesh");
		removeFromScene("loadSTL");
		removeFinalHull();
		points = [];
		geometry = null;
		meta = null;
		hullValid = false;
		progressing = false;
		removeFaces();
		STLFileName = "";
	}
}

function onShowPoint() {
	removeFromScene("pointMesh");
	if (displayConfig.showPoint) {
		showPoints();
	}
}

function onType() {
	return function() {
		removeFaces();
		geometry = null;
		meta = null;
		hullValid = false;
		progressing = false;
	}
}

function onAnimation() {
	removeFinalHull();
	hullValid = false;
}

function onInit() {
	return function() {
		onClear()();
		points = initPoints(ioConfig.pointCount);
		if (displayConfig.showPoint) {
			showPoints();
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
		removeFromScene("loadSTL");
		displayConfig.showSTLMesh = false;
		removeFaces();
		switch (hullConfig.type) {
			case "增量法":
				geometry = new IncrementalHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				var1 = 0;
				var2 = 0;
				playConfig.progress = 0;
				progressing = false;
				break;
			case "礼品包装法":
				geometry = new GiftWrappingHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				var1 = 0;
				var2 = 0;
				playConfig.progress = 0;
				progressing = false;
				interval = 1500 / playConfig.speed;
				lastTime -= interval;
				break;
			case "冲突图法":
				geometry = new ConflictGraphHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				var1 = 0;
				var2 = 0;
				playConfig.progress = 0;
				progressing = false;
				break;
			case "分治法":
			case "分治法(改)":
				geometry = new DivideConquerHullGeometry();
				geometry.vertices = points;
				meta = geometry.hull();
				var1 = 0;
				var2 = 0;
				playConfig.progress = 0;
				progressing = false;
				nextDcInterval = 300.0 / playConfig.speed;
				break;
			default:
				geometry = null;
				meta = null;
				progressing = false;
				break;
		}
	}
}


function onSpeedChanged() {

}

function stayPaused() {

}

function onDampChanged() {
	controls.dynamicDampingFactor = playConfig.dampFactor;
}

function onPerspectiveCamera() {
	displayConfig.perspectiveCamera = true;
	displayConfig.orthographicCamera = false;

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.z = 1100;
	controls = new THREE.TrackballControls(camera, renderer.domElement);
	controls.dynamicDampingFactor = 0.3;
	controls.addEventListener('change', render);
	// controls.noZoom = true;
	// controls.noPan = true;
	onDampChanged();
}

function onOrthographicCamera() {
	displayConfig.perspectiveCamera = false;
	displayConfig.orthographicCamera = true;

	camera = new THREE.OrthographicCamera(window.innerWidth / -1.8, window.innerWidth / 1.8, window.innerHeight / 1.8, window.innerHeight / -1.8, -10000, 10000);
	camera.position.z = 2000;

	controls = new THREE.TrackballControls(camera, renderer.domElement);
	controls.dynamicDampingFactor = 0.3;
	controls.addEventListener('change', render);
	// controls.noZoom = true;
	// controls.noPan = true;
	onDampChanged();
}

function onProgressChange() {
	progressing = true;
}

function onProgressChanged() {
	if (geometry == null) {
		return;
	}
	removeFaces();
	switch (hullConfig.type) {
		case "增量法":
			progressIncremental();
			break;
		case "礼品包装法":
			progressGiftWrapping();
			break;
		case "冲突图法":
			progressConflictGraph();
			break;
		case "分治法":
			progressDiviedConquer();
			break;
		case "分治法(改)":
			progressDiviedConquerEx();
			break;
		default:
			break;
	}
	progressing = false;
}

function progressIncremental() {
	var lastTime = new Date().getTime();
	var trl = meta[0];
	var actions = meta[1];
	meta[3] = 0;
	var1 = 0;
	var2 = 0;
	var finalTriangles = [];
	var finalStep = Math.floor(playConfig.progress * meta[2] / 100);
	for (var i = 0; i < finalStep; i++) {
		if (var1 >= actions.length) {
			break;
		}
		var removeCount = actions[var1][0].length;
		var addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			var1++;
			i--;
			continue;
		}
		if (var2 < removeCount) {
			removeId = actions[var1][0][var2];
			finalTriangles[removeId] = false;
		} else {
			var index = actions[var1 - 1][1] + var2 - removeCount;

			if (finalTriangles[index] != true) {
				finalTriangles.push(true);
			}
		}
		var2++;
	}
	meta[3] = finalStep;
	if (meta[3] > meta[2]) {
		meta[2] = meta[3];
	}

	for (var i = 0; i < finalTriangles.length && i < trl.length; i++) {
		if (finalTriangles[i]) {
			newFace = GenerateFaceGeometry(trl[i], points, false);
			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "incFace_base" + i;
			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "incFace_inwire" + i;
			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "incFace_inface" + i;

			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(wiremesh);
			scene.add(inmesh);
		}
	}
	stressPoint(var1 + 2);
}

function progressConflictGraph() {
	progressIncremental();
}

function progressGiftWrapping() {
	var lastTime = new Date().getTime();
	removeFromScene("gifMovingFace");

	var trl = meta[0];

	var1 = Math.floor(playConfig.progress * trl.length / 100);

	var1++;
	for (var i = 0; i < var1; i++) {
		newFace = GenerateFaceGeometry(trl[i], points, false);

		newFace1 = GenerateFaceGeometry(trl[i], points, true);

		var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
		mesh.matrixAutoUpdate = false;
		mesh.name = "gifFace_outface" + i;

		var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
		wiremesh.matrixAutoUpdate = false;
		wiremesh.name = "gifFace_inwire" + i;

		var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
		inmesh.matrixAutoUpdate = false;
		inmesh.name = "gifFace_inface" + i;

		objs.push(mesh.name);
		objs.push(wiremesh.name);
		objs.push(inmesh.name);
		scene.add(mesh);
		scene.add(wiremesh);
		scene.add(inmesh);
	}
	if (var1 < trl.length) {
		addGifMovingFace(trl, var1);
	} else {
		gifMovingFace1 = null;
		gifMovingFace2 = null;
	}
}

function progressDiviedConquer() {
	MovingFace1 = null;
	MovingFace2 = null;
	var lastTime = new Date().getTime();
	var trl = meta[0];
	var actions = meta[1];
	meta[3] = 0;
	var1 = 0;
	var2 = 0;
	var finalTriangles = [];
	var finalStep = Math.floor(playConfig.progress * meta[2] / 100);
	for (var i = 0; i < finalStep; i++) {
		if (var1 >= actions.length) {
			break;
		}
		var removeCount = actions[var1][0].length;
		var addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			var1++;
			i--;
			continue;
		}
		if (var2 < removeCount) {
			removeId = actions[var1][0][var2];
			finalTriangles[removeId] = false;
		} else {
			var index = actions[var1 - 1][1] + var2 - removeCount;

			if (finalTriangles[index] != true) {
				finalTriangles.push(true);
			}
		}
		var2++;
	}
	meta[3] = finalStep;
	if (meta[3] > meta[2]) {
		meta[2] = meta[3];
	}

	for (var i = 0; i < finalTriangles.length && i < trl.length; i++) {
		if (finalTriangles[i]) {
			newFace = GenerateFaceGeometry(trl[i], points, false);
			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcFace_base" + i;
			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcFace_inwire" + i;
			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcFace_inface" + i;

			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(wiremesh);
			scene.add(inmesh);
		}
	}
	if (var2 != 0 && var1 > 1) {
		var removeCount = actions[var1][0].length;
		var addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (var2 > removeCount) {
			for (var i = actions[var1 - 1][1]; i < finalTriangles.length && i < trl.length; i++) {
				newFace = GenerateFaceGeometry(trl[i], points, false);
				var acmesh = new THREE.Mesh(newFace, geometryMaterialActive);
				acmesh.matrixAutoUpdate = false;
				acmesh.name = "dcFace_active" + i;

				objs.push(acmesh.name);
				scene.add(acmesh);
			}
		}
	}
}

function progressDiviedConquerEx() {
	MovingFace1 = null;
	MovingFace2 = null;
	var lastTime = new Date().getTime();
	var trl = meta[0];
	var actions = meta[1];
	meta[3] = 0;
	var1 = 0;
	var2 = 0;
	var finalTriangles = [];
	var finalStep = Math.floor(playConfig.progress * meta[2] / 100);
	for (var i = 0; i < finalStep; i++) {
		if (var1 >= actions.length) {
			break;
		}
		var removeCount = actions[var1][0].length;
		var addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			var1++;
			i--;
			continue;
		}
		if (actions[var1][2] == "inc") {
			if (var2 < removeCount) {
				removeId = actions[var1][0][var2];
				finalTriangles[removeId] = false;
			} else {
				var index = actions[var1 - 1][1] + var2 - removeCount;

				if (finalTriangles[index] != true) {
					finalTriangles.push(true);
				}
			}
		} else {
			if (var2 < addCount) {
				var index = index = actions[var1 - 1][1] + var2;
				if (finalTriangles[index] != true) {
					finalTriangles.push(true);
				}
			} else {
				removeId = actions[var1][0][var2 - addCount];
				finalTriangles[removeId] = false;
			}
		}
		var2++;

	}
	meta[3] = finalStep;
	if (meta[3] > meta[2]) {
		meta[2] = meta[3];
	}

	for (var i = 0; i < finalTriangles.length && i < trl.length; i++) {
		if (finalTriangles[i]) {
			newFace = GenerateFaceGeometry(trl[i], points, false);
			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcFace_base" + i;
			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcFace_inwire" + i;
			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcFace_inface" + i;

			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(wiremesh);
			scene.add(inmesh);
		}
	}
}

function updateScene() {
	if (geometry == null) {
		return;
	}
	removeFinalHull();
	hullValid = false;
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
		case "分治法(改)":
			updateDiviedConquerEx();
			break;
		default:
			break;
	}
}

function updateIncremental() {
	if (geometry == null) {
		return;
	}
	var oldProgress = playConfig.progress;
	var time = new Date().getTime();

	interval = 300.0 / playConfig.speed;

	if (time - lastTime > interval) {
		var trl = meta[0];
		var actions = meta[1];
		if (counter != 0) {
			counter--;
			lastTime = time;
			if (counter == 0) {
				//开始删除之前把所有要删除的面变红
				if (var2 == 0) {
					for (var i = 0; i < actions[var1][0].length; i++) {

						newFace = new THREE.Geometry();
						newFace.vertices = points;
						var pointIds = trl[actions[var1][0][i]].points;
						var pts = [points[pointIds[0]], points[pointIds[1]], points[pointIds[2]]];
						var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
						var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
						face.normal.copy(faceNormal);
						newFace.faces.push(face);
						var mesh = new THREE.Mesh(newFace, geometryMaterialActive);
						mesh.matrixAutoUpdate = false;
						mesh.name = "incFace_active_remove" + actions[var1][0][i];
						objs.push(mesh.name);
						scene.add(mesh);
					}
					//怎么能让要删除面变红之后不要马上删除第一个该删的面？？

				} //!!开始删
			}
			return;
		}

		if (var1 == 0 && var2 == 0) {
			meta[3] = 0;
		}
		if (var1 >= actions.length) {
			unstressPoint();
			return;
		}
		removeCount = actions[var1][0].length;
		addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			//添完成所有面，获得刚才添加的面,将地平线删除
			var2 = 0;
			if (var1 >= 1) {
				for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
					removeFromScene("incLine" + var1 + i);
					removeFromScene("incFace_active" + i);
				}
				counter = 3;
			}
			var1++;
			stressPoint(var1 + 2);

			//改变相机的位置
			// camera.position.x = points[var1 + 2].x;
			// camera.position.y = points[var1 + 2].y;
			// camera.position.z = points[var1 + 2].z + 500;
			// camera.up.x = 0;
			// camera.up.y = 1;
			// camera.up.z = 0;
			// camera.lookAt({
			// 	x: 0,
			// 	y: 0,
			// 	z: 0
			// });
			return;
		}

		if (var2 < removeCount) {
			removeId = actions[var1][0][var2];
			removeFromScene("incFace_active" + removeId);
			removeFromScene("incFace_active_remove" + removeId);
			removeFromScene("incFace_base" + removeId);
			removeFromScene("incFace_inface" + removeId);
			removeFromScene("incFace_inwire" + removeId);
			//removeFromScene("incLine" + removeId);
			//删除完成，添加新面之前将地平线描出
			if (var2 == removeCount - 1) {
				for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
					lineGeometry = new THREE.Geometry();
					lineGeometry.vertices.push(
						points[trl[i].points[0]].clone(),
						points[trl[i].points[1]].clone()
					);
					lineGeometry.computeLineDistances();
					var object = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
						color: 0xff0000,
						linewidth: 15
					}), THREE.LinePieces);
					object.name = "incLine" + var1 + i;
					objs.push(object.name);
					scene.add(object);
				}
				counter = 3;
			}
		} else {
			i = actions[var1 - 1][1] + var2 - removeCount;

			newFace = GenerateFaceGeometry(trl[i], points, false);

			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "incFace_base" + i;

			var acmesh = new THREE.Mesh(newFace, geometryMaterialActive);
			acmesh.matrixAutoUpdate = false;
			acmesh.name = "incFace_active" + i;

			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "incFace_inwire" + i;

			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "incFace_inface" + i;


			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(acmesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(acmesh);
			scene.add(wiremesh);
			scene.add(inmesh);
		}

		var2++;
		meta[3]++;
		if (playConfig.progress != oldProgress) {
			return;
		}
		playConfig.progress = Math.floor(meta[3] * 100 / meta[2]);
		lastTime = time;
	}
}

function updateGiftWrapping() {
	if (geometry == null) {
		return;
	}
	var oldProgress = playConfig.progress;
	var time = new Date().getTime();
	var interval = 1500.0 / playConfig.speed;

	if (time - lastTime > interval) {
		var trl = meta[0];
		if (var1 >= trl.length) {
			playConfig.progress = 100;
			return;
		}
		removeFromScene("gifMovingOutFace");
		removeFromScene("gifMovingWireFace");
		removeFromScene("gifMovingInFace");
		if (var1 < trl.length - 1) {
			addGifMovingFace(trl, var1 + 1)
		} else {
			MovingFace1 = null;
			MovingFace2 = null;
		}

		newFace = GenerateFaceGeometry(trl[var1], points, false);

		newFace1 = GenerateFaceGeometry(trl[var1], points, true);

		var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
		mesh.matrixAutoUpdate = false;
		mesh.name = "gifFace_outface" + var1;

		var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
		wiremesh.matrixAutoUpdate = false;
		wiremesh.name = "gifFace_inwire" + var1;

		var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
		inmesh.matrixAutoUpdate = false;
		inmesh.name = "gifFace_inface" + var1;

		objs.push(mesh.name);
		objs.push(wiremesh.name);
		objs.push(inmesh.name);
		scene.add(mesh);
		scene.add(wiremesh);
		scene.add(inmesh);
		playConfig.progress = var1 * 100 / trl.length;
		var1++;
		lastTime = time;

	} else {
		if (MovingFace1) {
			removeFromScene("gifMovingOutFace");
			removeFromScene("gifMovingWireFace");
			removeFromScene("gifMovingInFace");

			var pts = MovingFace1.vertices;
			var vecLen = pts[4].clone().sub(pts[3]).length();

			var factor = (time - lastTime + 0.0) / interval

			var dir = (((pts[5].clone().sub(pts[3])).multiplyScalar(factor)).add((pts[4].clone().sub(pts[3])).multiplyScalar(1.0 - factor))).normalize();

			pts[2].copy(dir.clone().multiplyScalar(vecLen).add(pts[3]));
			var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));

			MovingFace1.faces[0].normal.copy(faceNormal);
			MovingFace1.verticesNeedUpdate = true;
			MovingFace1.normalsNeedUpdate = true;

			MovingFace2.faces[0].normal.copy(faceNormal.negate());
			MovingFace2.verticesNeedUpdate = true;
			MovingFace2.normalsNeedUpdate = true;

			var mesh = new THREE.Mesh(MovingFace1, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "gifMovingOutFace";

			var wiremesh = new THREE.Mesh(MovingFace2, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "gifMovingWireFace";

			var inmesh = new THREE.Mesh(MovingFace2, geometryMaterialBasic);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "gifMovingInFace";

			objs.push(mesh.name);
			scene.add(mesh);
			objs.push(wiremesh.name);
			scene.add(wiremesh);
			objs.push(inmesh.name);
			scene.add(inmesh);
		}
	}
}

function updateConflictGraph() {
	updateIncremental();
}

function updateDiviedConquer() {
	if (geometry == null) {
		return;
	}
	var time = new Date().getTime();

	// interval = 300.0 / playConfig.speed;

	if (time - lastTime > nextDcInterval) {
		var trl = meta[0];
		var actions = meta[1];
		var totalMoves = meta[2];
		if (counter != 0) {
			counter--;
			lastTime = time;
			if (counter == 0) {
				//开始删除之前把所有要删除的面变红
				if (var2 == 0 && var1 < actions.length) {
					for (var i = 0; i < actions[var1][0].length; i++) {

						newFace = new THREE.Geometry();
						newFace.vertices = points;
						var pointIds = trl[actions[var1][0][i]].points;
						var pts = [points[pointIds[0]], points[pointIds[1]], points[pointIds[2]]];
						var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
						var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
						face.normal.copy(faceNormal);
						newFace.faces.push(face);
						var mesh = new THREE.Mesh(newFace, geometryMaterialActive);
						mesh.matrixAutoUpdate = false;
						mesh.name = "dcFace_active_remove" + actions[var1][0][i];
						objs.push(mesh.name);
						scene.add(mesh);
					}
				}
			}
			return;
		}
		MovingFace1 = null;
		MovingFace2 = null;
		unstressPoint();
		nextDcInterval = 300.0 / playConfig.speed;

		removeFromScene("dcMovingOutFace");
		removeFromScene("dcMovingWireFace");
		removeFromScene("dcMovingInFace");


		if (var1 == 0 && var2 == 0) {
			meta[3] = 0;
		}
		if (var1 >= actions.length) {
			playConfig.progress = 100;
			return;
		}
		removeCount = actions[var1][0].length;
		addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			if (var1 >= 1) {
				for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
					removeFromScene("dcLine" + var1 + i);
					removeFromScene("dcFace_active" + i);
				}
				counter = 3;
			}
			var1++;

			return;
		}
		if (actions[var1][2] == "inc" && removeCount != 0 && addCount != 0) {
			triangleId = actions[var1][1] - 1;
			stressPoint(trl[triangleId].points[2]);
		}
		if (var2 < removeCount) {
			removeId = actions[var1][0][var2];
			removeFromScene("dcFace_base" + removeId);
			removeFromScene("dcFace_active" + removeId);
			removeFromScene("dcFace_active_remove" + removeId);
			removeFromScene("dcFace_inwire" + removeId);
			removeFromScene("dcFace_inface" + removeId);
			if (var2 == removeCount - 1) {
				//if (actions[var1][2] == "inc") {
				for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
					lineGeometry = new THREE.Geometry();
					var ids;
					if (actions[var1][2] == "inc") {
						ids = [0, 1];
					} else if (trl[i].direction == "l") {
						ids = [2, 0];
					} else {
						ids = [1, 2];
					}
					lineGeometry.vertices.push(
						points[trl[i].points[ids[0]]].clone(),
						points[trl[i].points[ids[1]]].clone()
					);
					lineGeometry.computeLineDistances();
					var object = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
						color: 0xff0000,
						linewidth: 15
					}), THREE.LinePieces);
					object.name = "dcLine" + var1 + i;
					objs.push(object.name);
					scene.add(object);
				}
				counter = 3;
			}
		} else {
			if (actions[var1][2] == "d&c") {
				var i = actions[var1 - 1][1] + var2 - removeCount;
				if (i < actions[var1][1] - 1) {
					addDivideConquerMovingFace(trl, i + 1);
					nextDcInterval = 1500.0 / playConfig.speed
				}
			} else {
				MovingFace1 = null;
				MovingFace2 = null;
			}

			i = actions[var1 - 1][1] + var2 - removeCount;

			newFace = GenerateFaceGeometry(trl[i], points, false);

			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcFace_base" + i;

			var acmesh = new THREE.Mesh(newFace, geometryMaterialActive);
			acmesh.matrixAutoUpdate = false;
			acmesh.name = "dcFace_active" + i;

			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcFace_inwire" + i;

			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcFace_inface" + i;


			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(acmesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(acmesh);
			scene.add(wiremesh);
			scene.add(inmesh);
		}
		var2++;
		meta[3]++;
		playConfig.progress = Math.floor(meta[3] * 100 / meta[2]);
		lastTime = time;
	} else {
		if (MovingFace1) {
			removeFromScene("dcMovingOutFace");
			removeFromScene("dcMovingWireFace");
			removeFromScene("dcMovingInFace");

			var pts = MovingFace1.vertices;
			var vecLen = pts[4].clone().sub(pts[3]).length();

			var factor = (time - lastTime + 0.0) / nextDcInterval

			var dir = (((pts[5].clone().sub(pts[3])).multiplyScalar(factor)).add((pts[4].clone().sub(pts[3])).multiplyScalar(1.0 - factor))).normalize();

			pts[2].copy(dir.clone().multiplyScalar(vecLen).add(pts[3]));
			var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));

			MovingFace1.faces[0].normal.copy(faceNormal);
			MovingFace1.verticesNeedUpdate = true;
			MovingFace1.normalsNeedUpdate = true;

			MovingFace2.faces[0].normal.copy(faceNormal.negate());
			MovingFace2.verticesNeedUpdate = true;
			MovingFace2.normalsNeedUpdate = true;

			var mesh = new THREE.Mesh(MovingFace1, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcMovingOutFace";

			var wiremesh = new THREE.Mesh(MovingFace2, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcMovingWireFace";

			var inmesh = new THREE.Mesh(MovingFace2, geometryMaterialBasic);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcMovingInFace";

			objs.push(mesh.name);
			scene.add(mesh);
			objs.push(wiremesh.name);
			scene.add(wiremesh);
			objs.push(inmesh.name);
			scene.add(inmesh);
		}
	}
}

function updateDiviedConquerEx() {
	if (geometry == null) {
		return;
	}
	var time = new Date().getTime();

	// interval = 300.0 / playConfig.speed;

	if (time - lastTime > nextDcInterval) {
		var trl = meta[0];
		var actions = meta[1];
		var totalMoves = meta[2];
		if (counter != 0) {
			counter--;
			lastTime = time;
			if (counter == 0) {
				//开始删除之前把所有要删除的面变红
				if (var1 < actions.length) {
					removeCount = actions[var1][0].length;
					addCount = actions[var1][1];
					if (var1 != 0) {
						addCount -= actions[var1 - 1][1];
					}
					if ((var2 == 0 && actions[var1][2] == "inc") || (var2 == addCount && actions[var1][2] == "d&c")) {
						for (var i = 0; i < actions[var1][0].length; i++) {

							newFace = new THREE.Geometry();
							newFace.vertices = points;
							var pointIds = trl[actions[var1][0][i]].points;
							var pts = [points[pointIds[0]], points[pointIds[1]], points[pointIds[2]]];
							var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
							var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
							face.normal.copy(faceNormal);
							newFace.faces.push(face);
							var mesh = new THREE.Mesh(newFace, geometryMaterialActive);
							mesh.matrixAutoUpdate = false;
							mesh.name = "dcFace_active_remove" + actions[var1][0][i];
							objs.push(mesh.name);
							scene.add(mesh);
						}
					}
				}
			}
			return;
		}
		MovingFace1 = null;
		MovingFace2 = null;
		unstressPoint();
		nextDcInterval = 300.0 / playConfig.speed;

		removeFromScene("dcMovingOutFace");
		removeFromScene("dcMovingWireFace");
		removeFromScene("dcMovingInFace");


		if (var1 == 0 && var2 == 0) {
			meta[3] = 0;
		}
		if (var1 >= actions.length) {
			playConfig.progress = 100;
			return;
		}
		removeCount = actions[var1][0].length;
		addCount = actions[var1][1];
		if (var1 != 0) {
			addCount -= actions[var1 - 1][1];
		}
		if (addCount + removeCount <= var2) {
			var2 = 0;
			if (var1 >= 1) {
				for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
					removeFromScene("dcLine" + var1 + i);
					removeFromScene("dcFace_active" + i);
				}
				counter = 3;
			}
			var1++;
			return;
		}
		if (actions[var1][2] == "inc" && removeCount != 0 && addCount != 0) {
			triangleId = actions[var1][1] - 1;
			stressPoint(trl[triangleId].points[2]);
		}
		if ((var2 == removeCount - 1 && actions[var1][2] == "inc") || (var2 == addCount - 1 && actions[var1][2] == "d&c")) {
			//if (actions[var1][2] == "inc") {
			for (var i = actions[var1 - 1][1]; i < actions[var1][1]; i++) {
				lineGeometry = new THREE.Geometry();
				var ids;
				if (actions[var1][2] == "inc") {
					ids = [0, 1];
				} else if (trl[i].direction == "l") {
					ids = [2, 0];
				} else {
					ids = [1, 2];
				}
				lineGeometry.vertices.push(
					points[trl[i].points[ids[0]]].clone(),
					points[trl[i].points[ids[1]]].clone()
				);
				lineGeometry.computeLineDistances();
				var object = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
					color: 0xff0000,
					linewidth: 15
				}), THREE.LinePieces);
				object.name = "dcLine" + var1 + i;
				objs.push(object.name);
				scene.add(object);
			}
			counter = 3;
		}
		if ((var2 < removeCount && actions[var1][2] == "inc") || (var2 < removeCount + addCount && var2 >= addCount && actions[var1][2] == "d&c")) {
			removeId = actions[var1][0][var2];
			if (actions[var1][2] == "d&c") {
				removeId = actions[var1][0][var2 - addCount];
			}
			removeFromScene("dcFace_base" + removeId);
			removeFromScene("dcFace_active" + removeId);
			removeFromScene("dcFace_active_remove" + removeId);
			removeFromScene("dcFace_inwire" + removeId);
			removeFromScene("dcFace_inface" + removeId);
		} else {
			if (actions[var1][2] == "d&c") {
				var i = actions[var1 - 1][1] + var2;
				if (i < actions[var1][1] - 1) {
					addDivideConquerMovingFace(trl, i + 1);
					nextDcInterval = 1500.0 / playConfig.speed
				}
			} else {
				MovingFace1 = null;
				MovingFace2 = null;
			}

			i = actions[var1 - 1][1] + var2 - removeCount;

			if (actions[var1][2] == "d&c") {
				i = actions[var1 - 1][1] + var2;
			}
			newFace = GenerateFaceGeometry(trl[i], points, false);

			newFace1 = GenerateFaceGeometry(trl[i], points, true);

			var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcFace_base" + i;

			var acmesh = new THREE.Mesh(newFace, geometryMaterialActive);
			acmesh.matrixAutoUpdate = false;
			acmesh.name = "dcFace_active" + i;

			var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcFace_inwire" + i;

			var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcFace_inface" + i;


			objs.push(mesh.name);
			objs.push(wiremesh.name);
			objs.push(inmesh.name);

			scene.add(mesh);
			scene.add(wiremesh);
			scene.add(inmesh);
			if (actions[var1][2] == "inc") {
				objs.push(acmesh.name);
				scene.add(acmesh);
			}
		}
		var2++;
		meta[3]++;
		playConfig.progress = Math.floor(meta[3] * 100 / meta[2]);
		lastTime = time;
	} else {
		if (MovingFace1) {
			removeFromScene("dcMovingOutFace");
			removeFromScene("dcMovingWireFace");
			removeFromScene("dcMovingInFace");

			var pts = MovingFace1.vertices;
			var vecLen = pts[4].clone().sub(pts[3]).length();

			var factor = (time - lastTime + 0.0) / nextDcInterval

			var dir = (((pts[5].clone().sub(pts[3])).multiplyScalar(factor)).add((pts[4].clone().sub(pts[3])).multiplyScalar(1.0 - factor))).normalize();

			pts[2].copy(dir.clone().multiplyScalar(vecLen).add(pts[3]));
			var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));

			MovingFace1.faces[0].normal.copy(faceNormal);
			MovingFace1.verticesNeedUpdate = true;
			MovingFace1.normalsNeedUpdate = true;

			MovingFace2.faces[0].normal.copy(faceNormal.negate());
			MovingFace2.verticesNeedUpdate = true;
			MovingFace2.normalsNeedUpdate = true;

			var mesh = new THREE.Mesh(MovingFace1, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "dcMovingOutFace";

			var wiremesh = new THREE.Mesh(MovingFace2, geometryMaterialWireFrame);
			wiremesh.matrixAutoUpdate = false;
			wiremesh.name = "dcMovingWireFace";

			var inmesh = new THREE.Mesh(MovingFace2, geometryMaterialBasic);
			inmesh.matrixAutoUpdate = false;
			inmesh.name = "dcMovingInFace";

			objs.push(mesh.name);
			scene.add(mesh);
			objs.push(wiremesh.name);
			scene.add(wiremesh);
			objs.push(inmesh.name);
			scene.add(inmesh);
		}
	}
}

function removeFromScene(name) {
	var selectedObject = scene.getObjectByName(name);
	if (selectedObject != null) {
		scene.remove(selectedObject);
	}
}

function stressPoint(index) {
	unstressPoint();
	if (index < points.length && index >= 0) {
		var sphere = new THREE.Geometry();

		sphere.vertices.push(
			new THREE.Vector3(points[index].x, points[index].y, points[index].z)
		);

		var pointMesh = new THREE.PointCloud(sphere, pointMaterialRed);
		pointMesh.name = "stressPoint";
		scene.add(pointMesh);
	}
}

function unstressPoint() {
	removeFromScene("stressPoint");
}

function removeFaces() {
	removeFinalHull();
	lastTime = new Date().getTime();
	for (var i = 0; i < objs.length; i++) {
		removeFromScene(objs[i]);
	}
	objs = [];
	hullValid = false;
	unstressPoint();
}

function startPoint(preTriangle, triangle) {
	var pi1 = preTriangle.points;
	var pi2 = triangle.points;
	var pl1 = [points[pi1[0]].clone(), points[pi1[1]].clone(), points[pi1[2]].clone()];
	var pl2 = [points[pi2[0]].clone(), points[pi2[1]].clone(), points[pi2[2]].clone()];

	faceNormal1 = (pl1[1].clone().sub(pl1[0])).cross(pl1[2].clone().sub(pl1[0]));
	faceNormal2 = (pl2[1].clone().sub(pl2[0])).cross(pl2[2].clone().sub(pl2[0]));

	// angle = faceNormal1.angleTo(faceNormal2);

	axis1 = pl2[1].clone().sub(pl2[0]).normalize();
	axis2 = faceNormal1.clone().normalize();
	axis3 = axis2.clone().cross(axis1);

	projLen = (pl2[2].clone().sub(pl2[0])).dot(axis1.clone());

	projPoint = pl2[0].clone().add(axis1.clone().multiplyScalar(projLen));

	vecLen = (pl2[2].clone().sub(projPoint)).length();

	return [projPoint, projPoint.clone().add(axis3.clone().multiplyScalar(vecLen))];
}

function fillFinalGeometry() {
	if (hullValid) {
		return;
	}

	if (geometry != null) {
		var faceIn = new THREE.Geometry();
		faceIn.vertices = points;

		for (var i = 0; i < geometry.faces.length; i++) {
			var oriFace = geometry.faces[i];
			var pts = [points[oriFace.a], points[oriFace.a], points[oriFace.a]];
			var faceNormal = (pts[2].clone().sub(pts[0])).cross(pts[1].clone().sub(pts[0]));

			var face = new THREE.Face3(oriFace.a, oriFace.c, oriFace.b);
			face.normal.copy(faceNormal);
			faceIn.faces.push(face);
		}

		var mesh = new THREE.Mesh(geometry, geometryMaterialBasic);
		mesh.matrixAutoUpdate = false;
		mesh.name = "finalHullOut";
		var wiremesh = new THREE.Mesh(faceIn, geometryMaterialWireFrame);
		wiremesh.matrixAutoUpdate = false;
		wiremesh.name = "finalHullWire";
		var inmesh = new THREE.Mesh(faceIn, geometryMaterialInFace);
		inmesh.matrixAutoUpdate = false;
		inmesh.name = "finalHullIn";

		scene.add(mesh);
		scene.add(wiremesh);
		scene.add(inmesh);
		hullValid = true;
	}
}

function removeFinalHull() {
	removeFromScene("finalHullOut");
	removeFromScene("finalHullWire");
	removeFromScene("finalHullIn");
}

function GenerateFaceGeometry(triangle, pointList, reverse) {
	var retFace = new THREE.Geometry();
	retFace.vertices = pointList;
	var pointIds = triangle.points;
	var pts = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
	if (reverse) {
		var face = new THREE.Face3(pointIds[0], pointIds[2], pointIds[1]);
		var faceNormal = (pts[2].clone().sub(pts[0])).cross(pts[1].clone().sub(pts[0]));
		face.normal.copy(faceNormal);
		retFace.faces.push(face);
	} else {
		var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
		var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
		face.normal.copy(faceNormal);
		retFace.faces.push(face);
	}
	return retFace;
}

function addGifMovingFace(trl, index) {
	var triangle = trl[index];
	var preTriangle = trl[triangle.neighbors[2]];
	addMovingFace(preTriangle, triangle, "gif");
}

function addDivideConquerMovingFace(trl, index) {
	var triangle = trl[index];
	var preTriangle = trl[index - 1];
	addMovingFace(preTriangle, triangle, "dc");
}

function addMovingFace(preTriangle, triangle, prefix) {
	var sPoint = startPoint(preTriangle, triangle);
	var pointIds = triangle.points;
	var pts = [points[pointIds[0]].clone(), points[pointIds[1]].clone(), sPoint[1].clone(), sPoint[0].clone(), sPoint[1].clone(), points[pointIds[2]].clone()];

	MovingFace1 = new THREE.Geometry();
	MovingFace1.vertices = pts;
	MovingFace2 = new THREE.Geometry();
	MovingFace2.vertices = pts;

	var face = new THREE.Face3(0, 1, 2);
	var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
	face.normal.copy(faceNormal);
	MovingFace1.faces.push(face);

	face = new THREE.Face3(0, 2, 1);
	faceNormal = (pts[2].clone().sub(pts[0])).cross(pts[1].clone().sub(pts[0]));
	face.normal.copy(faceNormal);
	MovingFace2.faces.push(face);

	var mesh = new THREE.Mesh(MovingFace1, geometryMaterialBasic);
	mesh.matrixAutoUpdate = false;
	mesh.name = prefix + "MovingOutFace";

	var wiremesh = new THREE.Mesh(MovingFace2, geometryMaterialWireFrame);
	wiremesh.matrixAutoUpdate = false;
	wiremesh.name = prefix + "MovingWireFace";

	var inmesh = new THREE.Mesh(MovingFace2, geometryMaterialBasic);
	inmesh.matrixAutoUpdate = false;
	inmesh.name = prefix + "MovingInFace";

	objs.push(mesh.name);
	scene.add(mesh);
	objs.push(wiremesh.name);
	scene.add(wiremesh);
	objs.push(inmesh.name);
	scene.add(inmesh);
}