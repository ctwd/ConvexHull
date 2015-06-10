var hullConfig = {
	clear: onClear(),
	init: onInit(),
	type: "增量法",
	convexHull: onHull(),
	pointCount: 50,
	openSTL: onOpenFile(),
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
	hullGui.add(hullConfig,"openSTL").name("打开文件");//

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
function onOpenFile()
{
	return function() {
    try 
    {
        var Message = "Please select the folder path.";  //选择框提示信息
        var Shell = new ActiveXObject("Shell.Application");
        var Folder = Shell.BrowseForFolder(0, Message, 0x0040, 0x11); //起始目录为：我的电脑
        //var Folder = Shell.BrowseForFolder(0,Message,0); //起始目录为：桌面
        if (Folder != null) {
            Folder = Folder.items();  // 返回 FolderItems 对象
            Folder = Folder.item();  // 返回 Folderitem 对象
            Folder = Folder.Path;   // 返回路径
            if (Folder.charAt(Folder.length - 1) != "\\") {
                Folder = Folder + "\\";
            }
            return Folder;
        }
    }

    catch (e) 
    {
        alert(e.message);
    }
}
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
		onClear();
		points = initPoints(hullConfig.pointCount);
		//随机初始化点集显示   

	/*	var sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			opacity: 0.5,
		});*/

        var pointMaterial = new THREE.PointCloudMaterial({
			color: 0xffff00,
			size: 8.0,
			sizeAttenuation: true
		});//

		//var sphere = new THREE.SphereGeometry(5, 4, 4)
        var sphere = new THREE.Geometry();
		for (var i = 0; i < points.length; i++) 
		{
			sphere.vertices.push(
              new THREE.Vector3( points[i].x, points[i].y, points[i].z)
				);
			/*var mesh = new THREE.Mesh(sphere, sphereMaterial);
			mesh.position.x = points[i].x;
			mesh.position.y = points[i].y;
			mesh.position.z = points[i].z;
			mesh.updateMatrix();
			mesh.matrixAutoUpdate = false;
			mesh.name = "point" + i;
			scene.add(mesh);*/
		}
		var pointMesh = new THREE.PointCloud(sphere,pointMaterial);
		scene.add(pointMesh);

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

       if (counter != 0)
        {
        	counter--;
        	lastTime = time;
            return;
        }
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
		if (addCount + removeCount <= var2) 
		{
			
           //添完成所有面，获得刚才添加的面,将地平线删除
         
			var2 = 0;
			if (var1 >=1) 
			{ 
			  
				
				for(var i = actions[var1-1][1] ; i < actions[var1][1]; i++) 
	            {
	          		 removeFromScene("incLine"+var1+i);
                     removeFromScene("active_incFace" + i);        
	            } 
	             counter = 3;
             }
        
			var1++;
            

		    
			stressPoint(var1 + 2);  
			
			 //改变相机的位置
           /* camera.position.x = points[var1 + 2].x;
            camera.position.y = points[var1 + 2].y;
            camera.position.z = points[var1 + 2].z+500;
            camera.up.x = 0;
            camera.up.y = 1;
            camera.up.z = 0;
            camera.lookAt({
                x : 0,
                y : 0,
                z : 0
            });*/
			return;

		}

		if (var2 < removeCount)
		{
			//开始删除之前把所有要删除的面变红
			if (var2 ==0) 
			{

				var geometryMaterialActive = new THREE.MeshBasicMaterial({
					color: 0xff0000,
					shading: THREE.FlatShading,
				    transparent:true,
				    opacity:0.5
		            	});

				for (var i =0;  i<actions[var1][0].length; i++) 
				{
				          
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
					mesh.name = "active_rmvFace" + actions[var1][0][i];
					scene.add(mesh);

				}
			  
               //怎么能让要删除面变红之后不要马上删除第一个该删的面？？

        	 
			}//!!开始删
            


			removeId = actions[var1][0][var2];
			removeFromScene("active_incFace" + removeId);
			removeFromScene("active_rmvFace" + removeId);

			removeFromScene("base_incFace" + removeId);	
			removeFromScene("incFace_inface" + removeId);
			removeFromScene("incFace_inwire" + removeId);
		
			
            //removeFromScene("incLine" + removeId);
			
			//删除完成，添加新面之前将地平线描出
            if (var2 == removeCount-1) 
           {
           	   
           	  
         		for(var i = actions[var1-1][1] ; i < actions[var1][1]; i++) 
         		{

				    geometry = new THREE.Geometry();
					geometry.vertices.push(
							new THREE.Vector3( points[trl[i].points[0]].x, points[trl[i].points[0]].y, points[trl[i].points[0]].z ),
							new THREE.Vector3( points[trl[i].points[1]].x, points[trl[i].points[1]].y, points[trl[i].points[1]].z )
							);
					
					geometry.computeLineDistances();

					var object = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 15} ), THREE.LinePieces );
		            object.name = "incLine"+var1+i;

                    objs.push(object.name);
		            scene.add( object );

                   

         		}    
             
             	counter =2;
             	
            

         	}
			
		} 


		else 
		{
            
            var geometryMaterialActive = new THREE.MeshBasicMaterial({
					color: 0xff0000,
					shading: THREE.FlatShading,
				    transparent:true,
				    opacity:0.5
		            	});

			var geometryMaterialBasic = new THREE.MeshNormalMaterial({
				color: 0x0000ff,
				shading: THREE.FlatShading,
				transparent:true,
			    opacity:0.9
				
			});
			var geometryMaterialInFace= new THREE.MeshBasicMaterial({
				color: 0xffffff,
				shading: THREE.FlatShading,
			    transparent:true,
			    opacity:0.3
			});
            var geometryMaterialWireFrame =new THREE.MeshBasicMaterial({
				color: 0xffffff,
				shading: THREE.FlatShading,
				wireframe:true
			});

			
         

			newFace = new THREE.Geometry();
			newFace.vertices = points;
			i = actions[var1 - 1][1] + var2 - removeCount;
			var pointIds = trl[i].points;
			var pts = [points[pointIds[0]], points[pointIds[1]], points[pointIds[2]]];
			var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
			var faceNormal = (pts[1].clone().sub(pts[0])).cross(pts[2].clone().sub(pts[0]));
			face.normal.copy(faceNormal);
			newFace.faces.push(face);


            newFace1 = new THREE.Geometry();//
			newFace1.vertices = points;//
			face = new THREE.Face3(pointIds[0], pointIds[2], pointIds[1]);
			faceNormal = (pts[2].clone().sub(pts[0])).cross(pts[1].clone().sub(pts[0]));
			face.normal.copy(faceNormal);
			newFace1.faces.push(face);//1

            
            var mesh = new THREE.Mesh(newFace, geometryMaterialBasic);
			mesh.matrixAutoUpdate = false;
			mesh.name = "base_incFace" + i;


			var acmesh = new THREE.Mesh(newFace, geometryMaterialActive);
			acmesh.matrixAutoUpdate = false;
			acmesh.name = "active_incFace" + i;

            var wiremesh = new THREE.Mesh(newFace1, geometryMaterialWireFrame);//
			wiremesh.matrixAutoUpdate = false;//
			wiremesh.name = "incFace_inwire" + i;//

            var inmesh = new THREE.Mesh(newFace1, geometryMaterialInFace);//
			inmesh.matrixAutoUpdate = false;//
			inmesh.name = "incFace_inface" + i;//
         
            
            objs.push(mesh.name);
			scene.add(mesh);

			scene.add(acmesh);

			objs.push(wiremesh.name);//
			scene.add(wiremesh);//

			objs.push(inmesh.name);//
			scene.add(inmesh);//

		

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

		/*var sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			opacity: 0.5,
		});
		var sphere = new THREE.SphereGeometry(15, 4, 4);
		var mesh = new THREE.Mesh(sphere, sphereMaterial);
		mesh.position.x = points[index].x;
		mesh.position.y = points[index].y;
		mesh.position.z = points[index].z;
		mesh.updateMatrix();
		mesh.matrixAutoUpdate = false;
		mesh.name = "point" + index;
		scene.add(mesh);*/

		var pointMaterial = new THREE.PointCloudMaterial({
			color: 0xff0000,
			size: 20.0,
			sizeAttenuation: true
		});//

		//var sphere = new THREE.SphereGeometry(5, 4, 4)
        var sphere = new THREE.Geometry();
		
		sphere.vertices.push(
              new THREE.Vector3( points[index].x, points[index].y, points[index].z)
				);
	
		var pointMesh = new THREE.PointCloud(sphere,pointMaterial);
		pointMesh.name = "point" + index;
		scene.add(pointMesh);

		stressId = index;

	}
}

function unstressPoint(index) {
	removeFromScene("point" + index);
	if (index < points.length && index >= 0) {
		
		var pointMaterial = new THREE.PointCloudMaterial({
			color: 0xffff00,
			size: 8.0,
			sizeAttenuation: true
		});//

        var sphere = new THREE.Geometry();
		
		sphere.vertices.push(
              new THREE.Vector3( points[index].x, points[index].y, points[index].z)
				);
	
	    var pointMesh = new THREE.PointCloud(sphere,pointMaterial);
		pointMesh.name = "point" + index;
		scene.add(pointMesh);
		
		/*var sphereMaterial = new THREE.MeshBasicMaterial({
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
		scene.add(mesh);*/
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