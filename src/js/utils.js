function swap(_list, _i, _j) {
	if (_i == _j) {
		return;
	}
	temp = _list[_i];
	_list[_i] = _list[_j];
	_list[_j] = temp;
}

var Triangle = function(_a, _b, _c, _index) {
	this.points = [_a, _b, _c];
	this.index = _index || 0;
	this.neighbors = [null, null, null];
	this.valid = true;
	this.scope = this;

	setNeighbor = function(_a, _b, _t) {
		var index_a = -1;
		var index_b = -1;
		for (var i = 0; i < 3; i++) {
			if (scope.points[i] == _a) {
				index_a = i;
			};
			if (scope.points[i] == _b) {
				index_b = i;
			}
		}
		if (index_a >= 0 && index_b >= 0 && index_a != index_b) {
			var index = 0 + 1 + 2 - index_a - index_b;
			scope.neighbors[index] = _t;
		}
	}
}

function initPoints(count) {
	var vertices = [];
	for (var i = 0; i < count; i++) {
		var vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		var dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		while (dis > 500 * 500) {
			vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
			dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		}
		//vertex = new THREE.Vector3(rand(1000) - 500, rand(1000) - 500, rand(1000) - 500);
		vertices.push(vertex);
	}
	sort(vertices, 0, vertices.length - 1);
	return vertices;
}

function sort(vector, l, r) {
	if (l >= r) {
		return;
	}
	pin = vector[l];
	var lp = l + 1;
	var rp = r;
	while (lp < rp) {
		while (lp < rp && vector[lp].x >= pin.x) {
			lp++;
		}
		while (rp > lp && vector[rp].x < pin.x) {
			rp--;
		}
		swap(vector, lp, rp);
	}
	pinpos = lp;
	if (vector[lp].x < pin.x) {
		pinpos = lp - 1;
	} else {
		pinpos = lp;
	}
	swap(vector, l, pinpos);
	sort(vector, l, pinpos - 1);
	sort(vector, pinpos + 1, r);
}

var rand = (function() {
	//dfs2 的时候笔误+triangleRing置false笔误
	// var seed = 4;
	// inc构建失败，需要清空point的triangle表。
	// var seed = 7;
	// merge 的时候剔除面片，因为预先把所有边界上的面全置为false了，所以有排除不充分的情况出现。
	// var seed = 15;
	// 排除面片的深度优先搜索出问题了。
	// var seed = 68;
	var seed = 4;

	function rnd() {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / (233280.0);
	};
	return function rand(number) {
		return Math.ceil(rnd(seed) * number);
	};
})();


function showPoints()
{
   var sphere = new THREE.Geometry();
		for (var i = 0; i < points.length; i++) {
			sphere.vertices.push(
				points[i].clone()
	
			);
		
		}
		var pointMesh = new THREE.PointCloud(sphere, pointMaterial);
		pointMesh.name = "pointMesh";
		scene.add(pointMesh);

}

makeTextFile = function(text) {
                var textFile;
                var data = new Blob([text], {type: 'text/plain'});
                
                // If we are replacing a previously generated file we need to
                // manually revoke the object URL to avoid memory leaks.
                if (textFile !== null) {
                  window.URL.revokeObjectURL(textFile);
                }

                textFile = window.URL.createObjectURL(data);

                // returns a URL you can use as a href
                return textFile;
              };

function initPoints(count) {
	var vertices = [];
	for (var i = 0; i < count; i++) {
		var vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		var dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		while (dis > 500 * 500) {
			vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
			dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		}
		//vertex = new THREE.Vector3(rand(1000) - 500, rand(1000) - 500, rand(1000) - 500);
		vertices.push(vertex);
	}
	sort(vertices, 0, vertices.length - 1);
	return vertices;
}

function loadFile (name,type) 
{
	
	 
	 STLFileName = name;
	 if (type == "stl") 
	 {
                     
	        	var filePath = "upload/" + name;
	            var loader = new THREE.STLLoader();
	            loader.load( filePath, function ( loadgeometry ) {
                        
                loadgeometry.computeBoundingBox ();
                loadgeometry.dynamic = true;


                var minBox = loadgeometry.boundingBox.min;
                var maxBox = loadgeometry.boundingBox.max;
				
				var centerObj = new THREE.Vector3();
				centerObj.addVectors (minBox,maxBox);
				centerObj.divideScalar (2);
				//所有的坐标都应减centerObj

			    //最大的到800
                var obgX = maxBox.x - minBox.x;
                var obgY = maxBox.y - minBox.y;
                var obgZ = maxBox.z - minBox.z;
                
                var max = obgX;
                if (max < obgY) {max = obgY;}
                if (max < obgZ) {max = obgZ;}
                //所有坐标都在减后 /max *800
                max = 800/max;

                if (points.length == 0) 
                {
                	for (var i = 0; i < loadgeometry.vertices.length; i++) 
                    {
	                	loadgeometry.vertices[i].sub(centerObj);
	                	loadgeometry.vertices[i].multiplyScalar ( max );        
	                	points.push(loadgeometry.vertices[i]);
                    }
                }
                else
                {
	                for (var i = 0; i < loadgeometry.vertices.length; i++) 
	                {
	                	loadgeometry.vertices[i].sub(centerObj);
	                	loadgeometry.vertices[i].multiplyScalar ( max );        
	                }
                }
                sort(points, 0, points.length - 1);

                loadgeometry.verticesNeedUpdate = true;                                          
                var loadmesh = new THREE.Mesh( loadgeometry, geometryMaterialLoadMesh );
                loadmesh.name ="loadSTL";
                scene.add( loadmesh );    
                showPoints();

	            } );

          }

         else if(type == "txt")
         {	
	        $.post("read_file.php",
	          {
	            name:name,
	          
	          },
	          function(data,status){
	          	 ch = new Array;
				 ch = data.split(",");
				 if (ch.length%3 ==0 ) 
				  {
				  	for(i=0;i<=ch.length-3;i+=2)
				  	{

				  	  var vertex = new THREE.Vector3(ch[i], ch[i+1], ch[i+2]);
				  	  points.push(vertex);
				  	}
                    sort(points, 0, points.length - 1);
                    showPoints();			  	
				  } 	
	            else
				  {alert("初始化失败，点集信息不足");
				return;}
		
	          });
         }   
}