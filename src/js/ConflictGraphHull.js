ConflictGraphHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'ConflictGraphHullGeometry';
	var scope = this;
	for (var i = 0; i < pointNumber; i++) {
		vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		//vertex = new THREE.Vector3(rand(1000) - 500, rand(1000) - 500, rand(1000) - 500);
		scope.vertices.push(vertex);
	};

	this.mergeVertices();

	scope.hull = function() {
		var delta = 1e-9;
		var pointList = [];
		var triangleList = [];

		isVisible = function(triangleId, pointId) {
			var triangle = triangleList[triangleId];
			var point = pointList[pointId];
			var pointIds = triangle.points;
			var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
			var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
			pointDirection = point.clone().sub(points[0])
			return faceNormal.dot(pointDirection) > delta
		}

		isEdge = function(triangleId) {
			var triangle = triangleList[triangleId];
			var neighbors = triangle.neighbors;
			edge = [];
			for (var i = 0; i < 3; i++) {
				if (triangleList[neighbors[i]].valid) {
					edge.push([triangleId, i]);
				}
			}
			if (edge.length == 2) {
				if (edge[0][1] == 0 && edge[1][1] == 2) {
					swap(edge, 0, 1);
				}
			}
			return edge;
		}

		// 获取某组边的下一组边。
		nextEdge = function(edges) {
			triangleId = edges[0][0];
			triangle = triangleList[triangleId];
			if (edges.length == 3) {
				return [];
			} else if (edges.length == 1 || edges.length == 2) {
				edgeIndex = edges[edges.length - 1][1];
				nextTriangleId = triangle.neighbors[(edgeIndex + 1) % 3];
				nextEdges = isEdge(nextTriangleId);
				preTriangleId = triangleId;
				endPoint = triangle.points[(edges[edges.length - 1][1] + 2) % 3];
				while (nextEdges.length == 0 || endPoint != triangleList[nextEdges[0][0]].points[(nextEdges[0][1] + 1) % 3]) {
					for (var i = 0; i < 3; i++) {
						if (triangleList[nextTriangleId].neighbors[i] == preTriangleId) {
							edgeIndex = i;
							preTriangleId = nextTriangleId;
							nextTriangleId = triangleList[nextTriangleId].neighbors[(edgeIndex + 1) % 3];
							nextEdges = isEdge(nextTriangleId);
							break;
						}
					}
				}
				// if (nextEdges.length == 2) {
				// 	endPoint = triangle.points[(edges[edges.length - 1][1] + 2) % 3];
				// 	startPoint = triangleList[nextEdges[0][0]].points[(nextEdges[0][1] + 1) % 3];
				// 	if (endPoint != startPoint) {
				// 		swap(nextEdges, 0, 1);
				// 	}
				// }
				return nextEdges;
			} else {
				return [];
			}
		}

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

		// pointList[0].triangles.push(triangleList[0]);
		// pointList[0].triangles.push(triangleList[2]);
		// pointList[0].triangles.push(triangleList[3]);
		// pointList[1].triangles.push(triangleList[0]);
		// pointList[1].triangles.push(triangleList[1]);
		// pointList[1].triangles.push(triangleList[3]);
		// pointList[2].triangles.push(triangleList[0]);
		// pointList[2].triangles.push(triangleList[1]);
		// pointList[2].triangles.push(triangleList[2]);
		// pointList[3].triangles.push(triangleList[1]);
		// pointList[3].triangles.push(triangleList[2]);
		// pointList[3].triangles.push(triangleList[3]);


		for (var i = 0; i < 4; i++) {
			triangleList[i].conflicts = [];
		}
		for (var i = 4; i < pointList.length; i++) {
			pointList[i].conflicts = [];
		}
		for (var i = 0; i < 4; i++) {
			for (var j = 4; j < pointList.length; j++) {
				if (isVisible(i, j)) {
					triangleList[i].conflicts.push(j);
					pointList[j].conflicts.push(i);
				}
			}
		}

		for (var i = 4; i < pointList.length; i++) {
			var faceToRemove = [];
			for (var j = 0; j < pointList[i].conflicts.length; j++) {
				if (triangleList[pointList[i].conflicts[j]].valid) {
					triangleList[pointList[i].conflicts[j]].valid = false;
					faceToRemove.push(pointList[i].conflicts[j]);
				}
			}
			if (faceToRemove.length == 0) {
				continue;
			}
			var triangleEdges = [];
			var edges = [];
			for (var j = 0; j < faceToRemove.length; j++) {
				triangleEdges = isEdge(faceToRemove[j]);
				if (triangleEdges.length != 0) {
					break;
				}
			}
			var firstEdges = triangleEdges;
			while (true) {
				for (var j = 0; j < triangleEdges.length; j++) {
					edges.push(triangleEdges[j]);
				}
				triangleEdges = nextEdge(triangleEdges);
				if (triangleEdges.length == 0) {
					break;
				}
				if (triangleEdges[0][0] == firstEdges[0][0]) {
					break;
				}
			}
			var offset = triangleList.length;
			for (var j = 0; j < edges.length; j++) {
				edge = edges[j];
				var triangle = new Triangle(
					triangleList[edge[0]].points[(edge[1] + 1) % 3],
					triangleList[edge[0]].points[(edge[1] + 2) % 3], i, triangleList.length);
				neighborTriangleId = triangleList[edge[0]].neighbors[edge[1]];
				triangle.neighbors[2] = neighborTriangleId;
				neighborTriangle = triangleList[neighborTriangleId];
				for (var k = 0; k < 3; k++) {
					if (neighborTriangle.neighbors[k] == edge[0]) {
						neighborTriangle.neighbors[k] = triangle.index;
						break;
					}
				}
				triangleList.push(triangle);
				triangle.conflicts = [];
				conflicts1 = triangleList[edge[0]].conflicts;
				conflicts2 = neighborTriangle.conflicts;
				index1 = 0;
				index2 = 0;
				while (conflicts1[index1] <= i && index1 < conflicts1.length) {
					index1++;
				}
				while (conflicts2[index2] <= i && index2 < conflicts2.length) {
					index2++;
				}
				while (index1 < conflicts1.length && index2 < conflicts2.length) {
					if (conflicts1[index1] == conflicts2[index2]) {
						index2++;
					} else if (conflicts1[index1] < conflicts2[index2]) {
						if (isVisible(triangle.index, conflicts1[index1])) {
							triangle.conflicts.push(conflicts1[index1]);
							pointList[conflicts1[index1]].conflicts.push(triangle.index);
						}
						index1++;
					} else if (conflicts1[index1] > conflicts2[index2]) {
						if (isVisible(triangle.index, conflicts2[index2])) {
							triangle.conflicts.push(conflicts2[index2]);
							pointList[conflicts2[index2]].conflicts.push(triangle.index);
						}
						index2++;
					}
				}
				while (index1 < conflicts1.length) {
					if (isVisible(triangle.index, conflicts1[index1])) {
						triangle.conflicts.push(conflicts1[index1]);
						pointList[conflicts1[index1]].conflicts.push(triangle.index);
					}
					index1++;
				}
				while (index2 < conflicts2.length) {
					if (isVisible(triangle.index, conflicts2[index2])) {
						triangle.conflicts.push(conflicts2[index2]);
						pointList[conflicts2[index2]].conflicts.push(triangle.index);
					}
					index2++;
				}
			}
			for (var j = 0; j < edges.length; j++) {
				triangleList[j + offset].neighbors[0] = offset + (j + 1) % edges.length;
				triangleList[j + offset].neighbors[1] = offset + (j - 1 + edges.length) % edges.length;
			}
		}

		for (var i = 0; i < triangleList.length; i++) {
			if (triangleList[i].valid) {
				ps = triangleList[i].points;
				face = new THREE.Face3(pointList[ps[0]].index, pointList[ps[1]].index, pointList[ps[2]].index);
				trp = [pointList[ps[0]], pointList[ps[1]], pointList[ps[2]]];
				faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
				face.normal.copy(faceNormal);
				scope.faces.push(face);
			}
		}
		scope.mergeVertices();
	}
}

ConflictGraphHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
ConflictGraphHullGeometry.prototype.constructor = ConflictGraphHullGeometry;