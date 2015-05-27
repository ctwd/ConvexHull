IncrementalHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'IncrementalHullGeometry';
	var scope = this;

	for (var i = 0; i < pointNumber; i++) {
		vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		scope.vertices.push(vertex);
	};

	this.mergeVertices();

	scope.hull = function() {

		deal = function(_p, _to, _td) {
			if (tl[_td].valid) {
				trp = [pl[tl[_td].points[0]], pl[tl[_td].points[1]], pl[tl[_td].points[2]]]
				faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]))
				pointDirection = pl[_p].clone().sub(trp[0])
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(_p, _td);
				} else {
					index = -1;
					for (var i = 0; i < 3; i++) {
						if (tl[_td].neighbors[i] == _to) {
							index = i;
							break;
						}
					}
					tr = new Triangle(tl[_td].points[(index + 2) % 3], tl[_td].points[(index + 1) % 3], _p, tl.length);
					tr.neighbors[2] = _td;
					tl[_td].neighbors[index] = tr.index;
					tl.push(tr);
					pl[_p].triangles.push(tr);
					pl[tl[_td].points[(index + 2) % 3]].triangles.push(tr);
					pl[tl[_td].points[(index + 1) % 3]].triangles.push(tr);
				}
			}
		}

		dfs = function(_p, _t) {
			tl[_t].valid = false;

			deal(_p, _t, tl[_t].neighbors[0])
			deal(_p, _t, tl[_t].neighbors[1])
			deal(_p, _t, tl[_t].neighbors[2])
		}

		var delta = 1e-9;
		var pl = [];
		var tl = [];

		if (scope.vertices.length < 4) {
			return;
		}
		vs = scope.vertices;

		var valid = false;
		for (var i = 1; i < vs.length; i++) {
			if (vs[0].distanceTo(vs[i]) > delta) {
				swap(vs, 1, i);
				valid = true;
				break;
			}
		}
		if (!valid) {
			return;
		}

		valid = false;
		for (var i = 2; i < vs.length; i++) {
			if (((vs[0].clone().sub(vs[1])).cross((vs[0].clone().sub(vs[i])))).length() > delta) {
				swap(vs, 2, i);
				valid = true;
				break;
			}
		}
		if (!valid) {
			return;
		}
		valid = false;
		var positive = 0;
		for (var i = 3; i < vs.length; i++) {
			positive = ((vs[1].clone().sub(vs[0])).cross((vs[2].clone().sub(vs[0])))).dot(vs[i].clone().sub(vs[0]))
			if (Math.abs(positive) > delta) {
				swap(vs, 3, i);
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
			pl.push(vertex);
		}

		tl.push(new Triangle(0, 1, 2, 0));
		tl.push(new Triangle(2, 1, 3, 1));
		tl.push(new Triangle(2, 3, 0, 2));
		tl.push(new Triangle(0, 3, 1, 3));
		if (positive > 0) {
			for (var i = 0; i < 4; i++) {
				swap(tl[i].points, 1, 2);
			}
		}

		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 3; j++) {
				tl[i].neighbors[j] = (tl[i].points[j] + 1) % 4;
			}
		}
		pl[0].triangles.push(tl[0]);
		pl[0].triangles.push(tl[2]);
		pl[0].triangles.push(tl[3]);
		pl[1].triangles.push(tl[0]);
		pl[1].triangles.push(tl[1]);
		pl[1].triangles.push(tl[3]);
		pl[2].triangles.push(tl[0]);
		pl[2].triangles.push(tl[1]);
		pl[2].triangles.push(tl[2]);
		pl[3].triangles.push(tl[1]);
		pl[3].triangles.push(tl[2]);
		pl[3].triangles.push(tl[3]);

		for (var i = 4; i < pl.length; i++) {
			for (var j = 0; j < tl.length; j++) {
				if (!tl[j].valid) {
					continue;
				}
				trp = [pl[tl[j].points[0]], pl[tl[j].points[1]], pl[tl[j].points[2]]]
				faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]))
				pointDirection = pl[i].clone().sub(trp[0])
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(i, j);
					break;
				}
			}
			var index = 0;
			if (pl[i].triangles.length > 0) {
				ts = pl[i].triangles;
				while (true) {
					if (ts[index].neighbors[0] != null) {
						break;
					}
					for (var j = 0; j < ts.length; j++) {
						if (ts[j].points[0] == ts[index].points[1]) {
							ts[index].neighbors[0] = ts[j].index;
							ts[j].neighbors[1] = ts[index].index;
							index = j;
							break;
						}
					}
				}
			}
		}

		for (var i = 0; i < tl.length; i++) {
			if (tl[i].valid) {
				ps = tl[i].points;
				face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
				trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
				faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
				face.normal.copy(faceNormal);
				scope.faces.push(face);
			}
		}
		scope.mergeVertices();
	}
}

IncrementalHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
IncrementalHullGeometry.prototype.constructor = IncrementalHullGeometry;