IncrementalHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'IncrementalHullGeometry';
	var scope = this;

	// for (var i = 0; i < pointNumber; i++) {
	// 	vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
	// 	scope.vertices.push(vertex);
	// };

	this.mergeVertices();

	scope.hull = function() {

		deal = function(pointId, fromTriangleId, toTriangleId, removedList) {
			var triangle = triangleList[toTriangleId];
			if (triangle.valid) {
				var pointIds = triangle.points;
				var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
				var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
				var pointDirection = pointList[i].clone().sub(points[0]);
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(pointId, toTriangleId, removedList);
				} else {
					index = -1;
					for (var j = 0; j < 3; j++) {
						if (triangle.neighbors[j] == fromTriangleId) {
							index = j;
							break;
						}
					}
					newTriangle = new Triangle(triangle.points[(index + 2) % 3], triangle.points[(index + 1) % 3], pointId, triangleList.length);
					newTriangle.neighbors[2] = toTriangleId;
					triangleList[toTriangleId].neighbors[index] = newTriangle.index;
					triangleList.push(newTriangle);
					for (var j = 0; j < 3; j++) {
						pointList[newTriangle.points[j]].triangles.push(newTriangle);

					}
				}
			}
		}

		dfs = function(pointId, triangleId, removedList) {
			var triangle = triangleList[triangleId];
			triangle.valid = false;
			removedList.push(triangleId);

			deal(pointId, triangleId, triangle.neighbors[0], removedList)
			deal(pointId, triangleId, triangle.neighbors[1], removedList)
			deal(pointId, triangleId, triangle.neighbors[2], removedList)
		}

		var delta = 1e-9;
		var pointList = [];
		var triangleList = [];
		var steps = [];

		if (scope.vertices.length < 4) {
			return;
		}

		var vertices = scope.vertices;
		var valid = false;
		for (var i = 1; i < vertices.length; i++) {
			if (vertices[0].distanceTo(vertices[i]) > delta) {
				swap(vertices, 1, i);
				valid = true;
				break;
			}
		}
		if (!valid) {
			return;
		}

		valid = false;
		for (var i = 2; i < vertices.length; i++) {
			var vector1 = (vertices[0].clone().sub(vertices[1]));
			var vector2 = (vertices[0].clone().sub(vertices[i]));
			if ((vector1.cross(vector2)).length() > delta) {
				swap(vertices, 2, i);
				valid = true;
				break;
			}
		}
		if (!valid) {
			return;
		}
		valid = true;
		var positive = 0;
		for (var i = 3; i < vertices.length; i++) {
			var vector1 = (vertices[1].clone().sub(vertices[0]));
			var vector2 = (vertices[2].clone().sub(vertices[0]));
			var vector3 = vertices[i].clone().sub(vertices[0]);
			positive = (vector1.cross(vector2)).dot(vector3);
			if (Math.abs(positive) > delta) {
				swap(vertices, 3, i);
				valid = true;
				break;
			}
		}
		if (!valid) {
			return;
		}

		for (var i = 0; i < scope.vertices.length; i++) {
			vertex = scope.vertices[i].clone();
			vertex.index = i;
			vertex.triangles = [];
			pointList.push(vertex);
		}

		triangleList.push(new Triangle(0, 1, 2, 0));
		triangleList.push(new Triangle(2, 1, 3, 1));
		triangleList.push(new Triangle(2, 3, 0, 2));
		triangleList.push(new Triangle(0, 3, 1, 3));
		if (positive > 0) {
			for (var i = 0; i < 4; i++) {
				swap(triangleList[i].points, 1, 2);
			}
		}

		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 3; j++) {
				triangleList[i].neighbors[j] = (triangleList[i].points[j] + 1) % 4;
			}
		}

		for (var i = 0; i < 4; i++) {
			var triangle = triangleList[i];
			for (var j = 0; j < 3; j++) {
				pointList[triangle.points[j]].triangles.push(triangle);
			}
		}

		steps.push([
			[], 0
		]);
		steps.push([
			[], 4
		]);
		for (var i = 4; i < pointList.length; i++) {
			var removedTriangles = [];
			for (var j = 0; j < triangleList.length; j++) {
				if (!triangleList[j].valid) {
					continue;
				}
				var pointIds = triangleList[j].points;
				var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
				var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
				var pointDirection = pointList[i].clone().sub(points[0]);
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(i, j, removedTriangles);
					break;
				}
			}

			var index = 0;
			if (pointList[i].triangles.length > 0) {
				var triangles = pointList[i].triangles;
				while (true) {
					if (triangles[index].neighbors[0] != null) {
						break;
					}
					for (var j = 0; j < triangles.length; j++) {
						if (triangles[j].points[0] == triangles[index].points[1]) {
							triangles[index].neighbors[0] = triangles[j].index;
							triangles[j].neighbors[1] = triangles[index].index;
							index = j;
							break;
						}
					}
				}
			}

			steps.push([removedTriangles, triangleList.length]);
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

		return [triangleList, steps];
	}
}

IncrementalHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
IncrementalHullGeometry.prototype.constructor = IncrementalHullGeometry;