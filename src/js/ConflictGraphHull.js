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
		var pl = [];
		var tl = [];

		isVisible = function(_td, _p) {
			trp = [pl[tl[_td].points[0]], pl[tl[_td].points[1]], pl[tl[_td].points[2]]]
			faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]))
			pointDirection = pl[_p].clone().sub(trp[0])
			return faceNormal.dot(pointDirection) > delta
		}

		isEdge = function(_td) {
			edge = []
			for (var i = 0; i < 3; i++) {
				if (tl[tl[_td].neighbors[i]].valid) {
					edge.push([_td, i]);
				}
			}
			if (edge.length == 2) {
				if (edge[0][1] == 0 && edge[1][1] == 2) {
					swap(edge, 0, 1);
				}
			}
			return edge;
		}

		nextEdge = function(_tes) {
			td = _tes[0][0];
			if (_tes.length == 3) {
				return [];
			} else if (_tes.length == 1 || _tes.length == 2) {
				ei = _tes[_tes.length - 1][1];
				ntr = tl[td].neighbors[(ei + 1) % 3];
				res = isEdge(ntr);
				pre = td;
				exps = tl[_tes[_tes.length - 1][0]].points[(_tes[_tes.length - 1][1] + 2) % 3];
				while (res.length == 0 || exps != tl[res[0][0]].points[(res[0][1] + 1) % 3]) {
					for (var i = 0; i < 3; i++) {
						if (tl[ntr].neighbors[i] == pre) {
							ei = i;
							pre = ntr;
							ntr = tl[ntr].neighbors[(ei + 1) % 3];
							res = isEdge(ntr);
							break;
						}
					}
				}
				if (res.length == 2) {
					ep = tl[td].points[(_tes[_tes.length - 1][1] + 2) % 3];
					sp = tl[res[0][0]].points[(res[0][1] + 1) % 3]
					if (ep != sp) {
						swap(res, 0, 1);
					}
				}
				return res;
			} else {
				return [];
			}
		}

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
		valid = true;
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


		for (var i = 0; i < 4; i++) {
			tl[i].conflicts = [];
		}
		for (var i = 4; i < pl.length; i++) {
			pl[i].conflicts = [];
		}
		for (var i = 0; i < 4; i++) {
			for (var j = 4; j < pl.length; j++) {
				if (isVisible(i, j)) {
					tl[i].conflicts.push(j);
					pl[j].conflicts.push(i);
				}
			}
		}

		for (var i = 4; i < pl.length; i++) {
			var fr = [];
			for (var j = 0; j < pl[i].conflicts.length; j++) {
				if (tl[pl[i].conflicts[j]].valid) {
					tl[pl[i].conflicts[j]].valid = false;
					fr.push(pl[i].conflicts[j]);
				}
			}
			if (fr.length == 0) {
				continue;
			}
			var tes = [];
			var es = [];
			for (var j = 0; j < fr.length; j++) {
				tes = isEdge(fr[j]);
				if (tes.length != 0) {
					break;
				}
			}
			var fes = tes;
			while (true) {
				for (var j = 0; j < tes.length; j++) {
					es.push(tes[j]);
				}
				tes = nextEdge(tes);
				if (tes.length == 0) {
					break;
				}
				if (tes[0][0] == fes[0][0]) {
					break;
				}
			}
			var offset = tl.length;
			for (var j = 0; j < es.length; j++) {
				e = es[j];
				var tr = new Triangle(
					tl[e[0]].points[(e[1] + 1) % 3],
					tl[e[0]].points[(e[1] + 2) % 3], i, tl.length);
				ntr = tl[e[0]].neighbors[e[1]];
				tr.neighbors[2] = ntr;
				for (var k = 0; k < 3; k++) {
					if (tl[ntr].neighbors[k] == e[0]) {
						tl[ntr].neighbors[k] = tr.index;
						break;
					}
				}
				tl.push(tr);
				tr.conflicts = [];
				c1 = tl[e[0]].conflicts;
				c2 = tl[ntr].conflicts;
				kc1 = 0;
				kc2 = 0;
				while (c1[kc1] <= i && kc1 < c1.length) {
					kc1++;
				}
				while (c2[kc2] <= i && kc2 < c2.length) {
					kc2++;
				}
				while (kc1 < c1.length && kc2 < c2.length) {
					if (c1[kc1] == c2[kc2]) {
						kc2++;
					} else if (c1[kc1] < c2[kc2]) {
						if (isVisible(tr.index, c1[kc1])) {
							tr.conflicts.push(c1[kc1]);
							pl[c1[kc1]].conflicts.push(tr.index);
						}
						kc1++;
					} else if (c1[kc1] > c2[kc2]) {
						if (isVisible(tr.index, c2[kc2])) {
							tr.conflicts.push(c2[kc2]);
							pl[c2[kc2]].conflicts.push(tr.index);
						}
						kc2++;
					}
				}
				while (kc1 < c1.length) {
					if (isVisible(tr.index, c1[kc1])) {
						tr.conflicts.push(c1[kc1]);
						pl[c1[kc1]].conflicts.push(tr.index);
					}
					kc1++;
				}
				while (kc2 < c2.length) {
					if (isVisible(tr.index, c2[kc2])) {
						tr.conflicts.push(c2[kc2]);
						pl[c2[kc2]].conflicts.push(tr.index);
					}
					kc2++;
				}
			}
			for (var j = 0; j < es.length; j++) {
				tl[j + offset].neighbors[0] = offset + (j + 1) % es.length;
				tl[j + offset].neighbors[1] = offset + (j - 1 + es.length) % es.length;
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

ConflictGraphHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
ConflictGraphHullGeometry.prototype.constructor = ConflictGraphHullGeometry;