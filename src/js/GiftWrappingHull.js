GiftWrappingHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'GiftWrappingHullGeometry';
	var scope = this;

	// for (var i = 0; i < pointNumber; i++) {
	// 	vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
	// 	scope.vertices.push(vertex);
	// };

	this.mergeVertices();

	scope.hull = function() {
		var delta = 1e-9;
		var pointList = [];
		var triangleList = [];

		if (scope.vertices.length < 4) {
			return;
		}

		for (var i = 0; i < scope.vertices.length; i++) {
			vertex = scope.vertices[i].clone();
			vertex.index = i;
			vertex.triangles = [];
			vertex.used = false;
			pointList.push(vertex);
		}
		var indexA = 0;
		var initList = [];
		for (var i = 1; i < pointList.length; i++) {
			if (pointList[i].y < pointList[indexA].y) {
				indexA = i;
			}
		}
		pointA = pointList[indexA];
		var indexB = (indexA + 1) % pointList.length;
		var angleB = Math.abs((pointList[indexB].clone().sub(pointA)).angleTo(pointList[indexB].clone().setY(pointA.y).sub(pointA)));
		for (var i = 0; i < pointList.length; i++) {
			if (i == indexA || i == indexB) {
				continue;
			}
			angleI = Math.abs((pointList[i].clone().sub(pointA)).angleTo(pointList[i].clone().setY(pointA.y).sub(pointA)));
			if (angleI < angleB) {
				angleB = angleI;
				indexB = i;
			}
		}
		pointB = pointList[indexB];
		var indexC = (Math.max(indexA, indexB) + 1) % pointList.length;
		triNormal = (pointB.clone().sub(pointA)).cross(pointB.clone().setY(pointA.y).sub(pointA));
		faceNormal = (pointB.clone().sub(pointA)).cross(triNormal);
		if (faceNormal.y < -delta) {
			faceNormal.negate();
		}
		normalC = (pointB.clone().sub(pointA)).cross(pointList[indexC].clone().sub(pointA))
		if (normalC.y < -delta) {
			normalC.negate();
		}
		angleC = Math.abs(faceNormal.angleTo(normalC));
		for (var i = 0; i < pointList.length; i++) {
			if (i == indexA || i == indexB || i == indexC) {
				continue;
			}
			normalI = (pointB.clone().sub(pointA)).cross(pointList[i].clone().sub(pointA))
			if (normalI.y < -delta) {
				normalI.negate();
			}
			angleI = Math.abs(faceNormal.angleTo(normalI))
			if (angleI < angleC) {
				angleC = angleI;
				indexC = i;
			}
		}
		pointC = pointList[indexC];

		pointA.used = true;
		pointB.used = true;
		pointC.used = true;

		var triangle = new Triangle(indexA, indexB, indexC, 0);
		faceNormal = (pointB.clone().sub(pointA)).cross(pointC.clone().sub(pointA));
		if (faceNormal.y > delta) {
			swap(triangle.points, 1, 2);
		}
		for (var j = 0; j < 3; j++) {
			pointList[triangle.points[j]].triangles.push(triangle);
		}

		triangleList.push(triangle);

		for (var i = 0; i < triangleList.length; i++) {
			var pointIds = triangleList[i].points;
			var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
			var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
			var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
			for (var j = 0; j < 3; j++) {
				if (triangleList[i].neighbors[j] == null) {
					indexNext = null;
					angleNext = null;
					for (var k = 0; k < pointList.length; k++) {
						if (k == pointIds[0] || k == pointIds[1] || k == pointIds[2]) {
							continue;
						}
						points = [pointList[pointIds[(j + 2) % 3]], pointList[pointIds[(j + 1) % 3]], pointList[k]];
						nromalK = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
						angleK = faceNormal.angleTo(nromalK);
						if (indexNext == null) {
							indexNext = k;
							angleNext = angleK
							continue;
						} else {
							if (angleK < angleNext) {
								angleNext = angleK;
								indexNext = k;
							}
						}
					}
					var triangle = new Triangle(pointIds[(j + 2) % 3], pointIds[(j + 1) % 3], indexNext, triangleList.length);
					triangleList[i].neighbors[j] = triangle.index;
					triangle.neighbors[2] = i;
					if (pointList[indexNext].used) {
						for (var k = 0; k < pointList[indexNext].triangles.length; k++) {
							var triangles = pointList[indexNext].triangles[k];
							for (var l = 0; l < 3; l++) {
								if (triangles.points[l] == pointIds[(j + 2) % 3]) {
									triangle.neighbors[1] = triangles.index;
									if (triangles.points[(l + 1) % 3] == indexNext) {
										triangles.neighbors[(l + 2) % 3] = triangle.index;
									} else {
										triangles.neighbors[(l + 1) % 3] = triangle.index;
									}
									// break;
								} else if (triangles.points[l] == pointIds[(j + 1) % 3]) {
									triangle.neighbors[0] = triangles.index;
									if (triangles.points[(l + 1) % 3] == indexNext) {
										triangles.neighbors[(l + 2) % 3] = triangle.index;
									} else {
										triangles.neighbors[(l + 1) % 3] = triangle.index;
									}
									// break;
								}
							}
						}
					} else {
						pointList[indexNext].used = true;
					}
					for (var k = 0; k < 3; k++) {
						pointList[triangle.points[k]].triangles.push(triangle);
					}
					triangleList.push(triangle);
				}
			}
		}
		for (var i = 0; i < triangleList.length; i++) {
			if (triangleList[i].valid) {
				var pointIds = triangleList[i].points;
				var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
				var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
				var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
				face.normal.copy(faceNormal);
				scope.faces.push(face);
			}
		}
		scope.mergeVertices();
		return [triangleList];
	}
}

GiftWrappingHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
GiftWrappingHullGeometry.prototype.constructor = GiftWrappingHullGeometry;