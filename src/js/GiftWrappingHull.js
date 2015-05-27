GiftWrappingHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'GiftWrappingHullGeometry';
	var scope = this;

	for (var i = 0; i < pointNumber; i++) {
		vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		scope.vertices.push(vertex);
	};

	this.mergeVertices();

	scope.hull = function() {
		var delta = 1e-9;
		var pl = [];
		var tl = [];

		if (scope.vertices.length < 4) {
			return;
		}

		for (var i = 0; i < scope.vertices.length; i++) {
			vertex = scope.vertices[i].clone();
			vertex.index = i;
			vertex.triangles = [];
			vertex.used = false;
			pl.push(vertex);
		}
		var i_a = 0;
		for (var i = 1; i < pl.length; i++) {
			if (pl[i].y < pl[i_a].y) {
				i_a = i;
			}
		}

		var i_b = (i_a + 1) % pl.length;
		var b_th = Math.abs((pl[i_b].clone().sub(pl[i_a])).angleTo(pl[i_b].clone().setY(pl[i_a].y).sub(pl[i_a])));
		for (var i = 0; i < pl.length; i++) {
			if (i == i_b || i == i_a) {
				continue;
			}
			i_th = Math.abs((pl[i].clone().sub(pl[i_a])).angleTo(pl[i].clone().setY(pl[i_a].y).sub(pl[i_a])));
			if (i_th < b_th) {
				b_th = i_th;
				i_b = i;
			}
		}

		var i_c = (Math.max(i_b, i_a) + 1) % pl.length;
		triNormal = (pl[i_b].clone().sub(pl[i_a])).cross(pl[i_b].clone().setY(pl[i_a].y).sub(pl[i_a]));
		faceNormal = (pl[i_b].clone().sub(pl[i_a])).cross(triNormal);
		if (faceNormal.y < -delta) {
			faceNormal.negate();
		}
		cNormal = (pl[i_b].clone().sub(pl[i_a])).cross(pl[i_c].clone().sub(pl[i_a]))
		if (cNormal.y < -delta) {
			cNormal.negate();
		}
		c_th = Math.abs(faceNormal.angleTo(cNormal));
		for (var i = 0; i < pl.length; i++) {
			if (i == i_a || i == i_b || i == i_c) {
				continue;
			}
			iNormal = (pl[i_b].clone().sub(pl[i_a])).cross(pl[i].clone().sub(pl[i_a]))
			if (iNormal.y < -delta) {
				iNormal.negate();
			}
			i_th = Math.abs(faceNormal.angleTo(iNormal))
			if (i_th < c_th) {
				c_th = i_th;
				i_c = i;
			}
		}

		pl[i_a].used = true;
		pl[i_b].used = true;
		pl[i_c].used = true;

		tr = new Triangle(i_a, i_b, i_c, 0);
		faceNormal = (pl[i_b].clone().sub(pl[i_a])).cross(pl[i_c].clone().sub(pl[i_a]));
		if (faceNormal.y > delta) {
			swap(tr.points, 1, 2);
		}
		pl[i_a].triangles.push(tr)
		pl[i_b].triangles.push(tr)
		pl[i_c].triangles.push(tr)

		tl.push(tr);

		for (var i = 0; i < tl.length; i++) {
			ps = tl[i].points;
			trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
			faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
			for (var j = 0; j < 3; j++) {
				if (tl[i].neighbors[j] == null) {
					j_i = null;
					j_th = null;
					for (var k = 0; k < pl.length; k++) {
						if (k == ps[0] || k == ps[1] || k == ps[2]) {
							continue;
						}
						if (j_i == null) {
							j_i = k;
							trp = [pl[ps[(j + 2) % 3]], pl[ps[(j + 1) % 3]], pl[k]];
							jNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
							j_th = faceNormal.angleTo(jNormal);
							continue;
						}
						trp = [pl[ps[(j + 2) % 3]], pl[ps[(j + 1) % 3]], pl[k]];
						kNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
						k_th = faceNormal.angleTo(kNormal);
						if (k_th < j_th) {
							j_th = k_th;
							j_i = k;
						}
					}
					var tr = new Triangle(ps[(j + 2) % 3], ps[(j + 1) % 3], j_i, tl.length);
					tl[i].neighbors[j] = tr.index;
					tr.neighbors[2] = i;
					if (pl[j_i].used) {
						for (var k = 0; k < pl[j_i].triangles.length; k++) {
							tri = pl[j_i].triangles[k];
							for (var l = 0; l < 3; l++) {
								if (tri.points[l] == ps[(j + 2) % 3]) {
									tr.neighbors[1] = tri;
									if(tri.points[(l+1)%3] == j_i) {
										tri.neighbors[(l+2)%3] = tr;
									} else {
										tri.neighbors[(l+2)%3] = tr;
									}
									break;
								} else if (tri.points[l] == ps[(j + 1) % 3]) {
									tr.neighbors[0] = tri;
									if(tri.points[(l+1)%3] == j_i) {
										tri.neighbors[(l+2)%3] = tr;
									} else {
										tri.neighbors[(l+2)%3] = tr;
									}
									break;
								}
							}
						}
					} else {
						pl[j_i].used = true;
					}
					pl[j_i].triangles.push(tr);
					pl[ps[(j + 2) % 3]].triangles.push(tr);
					pl[ps[(j + 1) % 3]].triangles.push(tr);
					tl.push(tr);
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

GiftWrappingHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
GiftWrappingHullGeometry.prototype.constructor = GiftWrappingHullGeometry;