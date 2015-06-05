DivideConquerHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'DivideConquerHullGeometry';
	var scope = this;

	for (var i = 0; i < pointNumber; i++) {

		var vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		var dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		while (dis > 500 * 500) {
			vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
			dis = vertex.x * vertex.x + vertex.y * vertex.y + vertex.z * vertex.z;
		}
		//vertex = new THREE.Vector3(rand(1000) - 500, rand(1000) - 500, rand(1000) - 500);
		scope.vertices.push(vertex);
	};
	this.mergeVertices();

	scope.hull = function() {
		dcHull = function(l, r) {
			nextL = function(pointLeft, pointRight) {
				var pointIds = [];
				for (var i = 0; i < pointList[pointLeft].triangles.length; i++) {
					if (!pointList[pointLeft].triangles[i].valid) {
						continue;
					}
					for (var j = 0; j < 3; j++) {
						if (pointList[pointLeft].triangles[i].points[j] == pointLeft) {
							pointIds.push(pointList[pointLeft].triangles[i].points[(j + 1) % 3]);
						}
					}
				}
				var next = pointLeft;
				var angleNext = (pointList[pointLeft].y - pointList[pointRight].y) / (pointList[pointRight].x - pointList[pointLeft].x);
				for (var i = 0; i < pointIds.length; i++) {
					angle = (pointList[pointIds[i]].y - pointList[pointRight].y) / (pointList[pointRight].x - pointList[pointIds[i]].x);
					if (angle > angleNext) {
						angleNext = angle;
						next = pointIds[i];
					}
				}
				return next;
			}

			nextR = function(pointLeft, pointRight) {
				var pointIds = [];
				for (var i = 0; i < pointList[pointRight].triangles.length; i++) {
					if (!pointList[pointRight].triangles[i].valid) {
						continue;
					}
					for (var j = 0; j < 3; j++) {
						if (pointList[pointRight].triangles[i].points[j] == pointRight) {
							pointIds.push(pointList[pointRight].triangles[i].points[(j + 1) % 3]);
						}
					}
				}
				var next = pointRight;
				var angleNext = (pointList[pointRight].y - pointList[pointLeft].y) / (pointList[pointRight].x - pointList[pointLeft].x);
				for (var i = 0; i < pointIds.length; i++) {
					angle = (pointList[pointIds[i]].y - pointList[pointLeft].y) / (pointList[pointIds[i]].x - pointList[pointLeft].x);
					if (angle > angleNext) {
						angleNext = angle;
						next = pointIds[i];
					}
				}
				return next;
			}

			candidate = function(pointLeft, pointRight, kick) {
				var points = [];
				var leftOrRight = [];
				var triangleToRemove = [];
				var triangleList = pointList[pointLeft].triangles;
				for (var i = 0; i < triangleList.length; i++) {
					if (triangleList[i].valid) {
						for (var j = 0; j < 3; j++) {
							if (triangleList[i].points[j] == pointLeft) {
								if (triangleList[i].points[(j + 2) % 3] != kick) {
									points.push(triangleList[i].points[(j + 2) % 3]);
									leftOrRight.push('l');
									triangleToRemove.push(triangleList[i]);
								}
							}
						}
					}
				}
				triangleList = pointList[pointRight].triangles;
				for (var i = 0; i < triangleList.length; i++) {
					if (triangleList[i].valid) {
						for (var j = 0; j < 3; j++) {
							if (triangleList[i].points[j] == pointRight) {
								if (triangleList[i].points[(j + 1) % 3] != kick) {
									points.push(triangleList[i].points[(j + 1) % 3]);
									leftOrRight.push('r');
									triangleToRemove.push(triangleList[i]);
								}
							}
						}
					}
				}
				return [points, leftOrRight, triangleToRemove];
			}

			advance = function(triangle, pointLeft, pointRight) {
				var faceNormal; //= THREE.Vector3(0,0,0)
				var kick = -1;
				if (triangle == null) {
					var direction = pointList[pointRight].clone().sub(pointList[pointLeft]);
					faceNormal = new THREE.Vector3(-direction.y, direction.x, 0);

				} else {
					var pointIds = triangle.points;
					var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
					var faceNormal = (points[1].clone().sub(points[0])).cross((points[2].clone().sub(points[0])));
					for (var j = 0; j < 3; j++) {
						if (triangle.points[j] != pointLeft && triangle.points[j] != pointRight) {
							kick = triangle.points[j];
							break;
						}
					}
				}
				var ret = candidate(pointLeft, pointRight, kick);
				var points = ret[0];
				var leftOrRight = ret[1];
				var triangleToRemove = ret[2];
				var next = points[0];
				var nextLr = leftOrRight[0];
				var nextTriangle = triangleToRemove[0];
				var vector1 = pointList[pointRight].clone().sub(pointList[pointLeft]);
				var vector2 = pointList[next].clone().sub(pointList[pointLeft]);
				var nextAngle = faceNormal.angleTo(vector1.cross(vector2));
				for (var i = 1; i < points.length; i++) {
					var vector1 = pointList[pointRight].clone().sub(pointList[pointLeft]);
					var vector2 = pointList[points[i]].clone().sub(pointList[pointLeft]);
					var angle = faceNormal.angleTo(vector1.cross(vector2));
					if (angle < nextAngle) {
						nextAngle = angle;
						next = points[i];
						nextLr = leftOrRight[i];
						nextTriangle = triangleToRemove[i];
					}
				}
				return [next, nextLr, nextTriangle];
			}

			dfsList = function(triangleList, seedList) {
				if (seedList.length == 0) {
					for (var i = 0; i < triangleList.length; i++) {
						triangleList[i].valid = false;
					}
					return;
				}
				for (var i = 0; i < seedList.length; i++) {
					seedList[i].valid = false;
					for (var j = 0; j < 3; j++) {
						if (seedList[i].neighbors[j] != null && seedList[i].neighbors[j].valid) {
							dfsSingle(triangleList, seedList[i].neighbors[j]);
						}
					}
				}
			}

			dfsSingle = function(triangleList, seed) {
				if (seed.length == 0) {
					for (var i = 0; i < triangleList.length; i++) {
						triangleList[i].valid = false;
					}
					return;
				}
				seed.valid = false;
				for (var j = 0; j < 3; j++) {
					if (seed.neighbors[j] != null && seed.neighbors[j].valid) {
						dfsSingle(triangleList, seed.neighbors[j]);
					}
				}
			}

			merge = function(triangleListLeft, triangleListRight, triangleRing, leftSeed, rightSeed) {
				dfsList(triangleListLeft, leftSeed);
				dfsList(triangleListRight, rightSeed);

				var result = [];
				for (var i = 0; i < triangleListLeft.length; i++) {
					if (triangleListLeft[i].valid) {
						result.push(triangleListLeft[i]);
					}
				}
				for (var i = 0; i < triangleListRight.length; i++) {
					if (triangleListRight[i].valid) {
						result.push(triangleListRight[i]);
					}
				}
				for (var i = 0; i < triangleRing.length; i++) {
					if (triangleRing[i].valid) {
						result.push(triangleRing[i]);
					}
				}
				for (var i = 0; i < result.length; i++) {
					result[i].index = i;
				}
				return result;
			}

			if (r - l < 7) {
				return incHull(l, r);
			} else {
				var middle = Math.floor((l + r) / 2);
				var triangleListLeft = dcHull(l, middle);
				var triangleListRight = dcHull(middle + 1, r);
				if (triangleListLeft.length == 0 || triangleListRight.length == 0) {
					for (var i = l; i <= r; i++) {
						pointList[i].triangles = [];
					}
					return incHull(l, r);
				} else {
					if (triangleListLeft.length == 0) {
						for (var i = l; i <= middle; i++) {
							hullInc(triangleListRight, i);
						}
						return triangleListRight;
					} else if (triangleListRight.length == 0) {
						for (var i = middle + 1; i <= r; i++) {
							hullInc(triangleListLeft, i);
						}
						return triangleListLeft;
					} else {
						// first edge.
						var pointLeft = middle;
						var pointRight = middle + 1;
						var nextRight = nextR(pointLeft, pointRight);
						var nextLeft = pointLeft;
						while (nextRight != pointRight) {
							pointRight = nextRight;
							nextRight = nextR(pointLeft, pointRight);
						}
						while (true) {
							nextLeft = nextL(pointLeft, pointRight);
							if (nextLeft == pointLeft) {
								break;
							}
							while (nextLeft != pointLeft) {
								pointLeft = nextLeft;
								nextLeft = nextL(pointLeft, pointRight);
							}
							nextRight = nextR(pointLeft, pointRight);
							while (nextRight != pointRight) {
								pointRight = nextRight;
								nextRight = nextR(pointLeft, pointRight);
							}
						}

						var initLeft = pointLeft;
						var initRight = pointRight;
						var preTriangle = null;
						var triangleRing = [];
						var leftPair = [];
						var rightPair = [];
						var leftSeed = [];
						var rightSeed = [];
						while (true) {
							var tupointListeNext = advance(preTriangle, pointLeft, pointRight);
							var next = tupointListeNext[0];
							var nextLr = tupointListeNext[1];
							var nextRpointList = tupointListeNext[2];
							nextTriangle = new Triangle(pointLeft, pointRight, next, triangleRing.length);
							if (preTriangle != null) {
								nextTriangle.neighbors[2] = preTriangle;
								for (var j = 0; j < 3; j++) {
									if (preTriangle.points[j] != pointLeft && preTriangle.points[j] != pointRight) {
										preTriangle.neighbors[j] = nextTriangle;
									}
								}
							}
							for (var j = 0; j < 3; j++) {
								if (nextRpointList.points[j] != pointLeft && nextRpointList.points[j] != pointRight && nextRpointList.points[j] != next) {
									if (nextLr == 'l') {
										leftPair.push([nextRpointList, nextTriangle, j]);
									} else {
										rightPair.push([nextRpointList, nextTriangle, j]);
									}
									break;
								}
							}

							if (nextLr == 'l') {
								leftSeed.push(nextRpointList);
								pointLeft = next;
							} else {
								rightSeed.push(nextRpointList);
								pointRight = next;
							}

							preTriangle = nextTriangle;
							triangleRing.push(nextTriangle);
							if (pointLeft == initLeft && pointRight == initRight) {
								firstTriangle = triangleRing[0];
								firstTriangle.neighbors[2] = preTriangle;
								for (var j = 0; j < 3; j++) {
									if (preTriangle.points[j] != initLeft && preTriangle.points[j] != initRight) {
										preTriangle.neighbors[j] = firstTriangle;
										break;
									}
								}
								break;
							}
						}
						for (var i = 0; i < leftPair.length; i++) {
							var temp = leftPair[i];
							temp[0].valid = false;
							temp[1].neighbors[1] = temp[0].neighbors[temp[2]]
							temp[0].neighbors[temp[2]] = null;
						}
						for (var i = 0; i < rightPair.length; i++) {
							var temp = rightPair[i];
							temp[0].valid = false;
							temp[1].neighbors[0] = temp[0].neighbors[temp[2]]
							temp[0].neighbors[temp[2]] = null;
						}
						for (var i = 0; i < triangleRing.length; i++) {
							for (var j = 0; j < 3; j++) {
								pointList[triangleRing[i].points[j]].triangles.push(triangleRing[i]);
							}
						}
						return merge(triangleListLeft, triangleListRight, triangleRing, leftSeed, rightSeed);
					}
				}
			}
		}

		incHull = function(l, r) {
			var triangleList = [];
			var p1 = l;
			var p2 = -1;
			var p3 = -1;
			var p4 = -1;
			var valid = false;
			for (var i = l + 1; i <= r; i++) {
				if (pointList[p1].distanceTo(pointList[i]) > delta) {
					valid = true;
					p2 = i;
					break;
				}
			}
			if (!valid) {
				return [];
			}
			valid = false;
			for (var i = l + 1; i <= r; i++) {
				if (i == p1) {
					continue;
				}
				var vector1 = (pointList[p1].clone().sub(pointList[p2]));
				var vector2 = (pointList[p1].clone().sub(pointList[i]));
				if (vector1.cross(vector2).length() > delta) {
					valid = true;
					p3 = i;
					break;
				}
			}
			if (!valid) {
				return [];
			}
			valid = false;
			var positive = 0;
			for (var i = l + 1; i <= r; i++) {
				if (i == p2 || i == p3) {
					continue;
				}
				var vector1 = pointList[p2].clone().sub(pointList[p1]);
				var vector2 = pointList[p3].clone().sub(pointList[p1]);
				var vector3 = pointList[i].clone().sub(pointList[p1]);
				positive = vector1.cross(vector2).dot(vector3);
				if (Math.abs(positive) > delta) {
					valid = true;
					p4 = i;
					break;
				}
			}
			if (!valid) {
				return [];
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

			var pointListookup = [p1, p2, p3, p4]
			for (var i = 0; i < 4; i++) {
				for (var j = 0; j < 3; j++) {
					triangleList[i].neighbors[j] = triangleList[(triangleList[i].points[j] + 1) % 4];
					triangleList[i].points[j] = pointListookup[triangleList[i].points[j]];
				}
			}
			for (var i = 0; i < 4; i++) {
				var triangle = triangleList[i];
				for (var j = 0; j < 3; j++) {
					pointList[triangle.points[j]].triangles.push(triangle);
				}
			}
			// pointList[p1].triangles.push(triangleList[0]);
			// pointList[p1].triangles.push(triangleList[2]);
			// pointList[p1].triangles.push(triangleList[3]);
			// pointList[p2].triangles.push(triangleList[0]);
			// pointList[p2].triangles.push(triangleList[1]);
			// pointList[p2].triangles.push(triangleList[3]);
			// pointList[p3].triangles.push(triangleList[0]);
			// pointList[p3].triangles.push(triangleList[1]);
			// pointList[p3].triangles.push(triangleList[2]);
			// pointList[p4].triangles.push(triangleList[1]);
			// pointList[p4].triangles.push(triangleList[2]);
			// pointList[p4].triangles.push(triangleList[3]);

			if (r - l >= 4) {
				for (var i = l; i <= r; i++) {
					if (i == p1 || i == p2 || i == p3 || i == p4) {
						continue;
					}
					hullInc(triangleList, i);
				}
			}
			return triangleList;
		}

		hullInc = function(triangleList, pointId) {
			deal = function(triangleList, pointId, triangleFrom, triangleTo) {
				if (triangleTo.valid) {
					var pointIds = triangleTo.points;
					var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
					var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
					var pointDirection = pointList[pointId].clone().sub(points[0]);
					if (faceNormal.dot(pointDirection) > delta) {
						dfs(triangleList, pointId, triangleTo);
					} else {
						var index = -1;
						for (var i = 0; i < 3; i++) {
							if (triangleTo.neighbors[i] == triangleFrom) {
								index = i;
								break;
							}
						}
						var triangle = new Triangle(
							triangleTo.points[(index + 2) % 3],
							triangleTo.points[(index + 1) % 3],
							pointId,
							triangleList.length);
						triangle.neighbors[2] = triangleTo;
						triangleTo.neighbors[index] = triangle;
						triangleList.push(triangle);
						for (var j = 0; j < 3; j++) {
							pointList[triangle.points[j]].triangles.push(triangle);
						}
					}
				}
			}

			dfs = function(triangleList, pointId, triangle) {
				triangle.valid = false;

				deal(triangleList, pointId, triangle, triangle.neighbors[0]);
				deal(triangleList, pointId, triangle, triangle.neighbors[1]);
				deal(triangleList, pointId, triangle, triangle.neighbors[2]);
			}

			for (var i = 0; i < triangleList.length; i++) {
				if (!triangleList[i].valid) {
					continue;
				}
				var pointIds = triangleList[i].points;
				var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
				var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
				var pointDirection = pointList[pointId].clone().sub(points[0]);
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(triangleList, pointId, triangleList[i]);
					break;
				}
			}

			var index = 0;
			if (pointList[pointId].triangles.length > 0) {
				triangles = pointList[pointId].triangles;
				while (true) {
					if (triangles[index].neighbors[0] != null) {
						break;
					}
					for (var j = 0; j < triangles.length; j++) {
						if (triangles[j].points[0] == triangles[index].points[1]) {
							triangles[index].neighbors[0] = triangles[j];
							triangles[j].neighbors[1] = triangles[index];
							index = j;
							break;
						}
					}
				}
			}
		}

		if (scope.vertices.length < 4) {
			return;
		}

		var delta = 1e-9;
		var pointList = [];

		sort(scope.vertices, 0, scope.vertices.length - 1);

		for (var i = 0; i < scope.vertices.length; i++) {
			vertex = scope.vertices[i].clone();
			vertex.index = i;
			vertex.triangles = [];
			vertex.used = false;
			pointList.push(vertex);
		}

		triangleList = dcHull(0, pointList.length - 1);

		for (var i = 0; i < triangleList.length; i++) {
			var pointIds = triangleList[i].points;
			var points = [pointList[pointIds[0]], pointList[pointIds[1]], pointList[pointIds[2]]];
			var face = new THREE.Face3(pointIds[0], pointIds[1], pointIds[2]);
			var faceNormal = (points[1].clone().sub(points[0])).cross(points[2].clone().sub(points[0]));
			face.normal.copy(faceNormal);
			scope.faces.push(face);
		}
	}
}

DivideConquerHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
DivideConquerHullGeometry.prototype.constructor = DivideConquerHullGeometry;