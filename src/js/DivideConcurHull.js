DivideConcurHullGeometry = function(pointNumber) {
	THREE.Geometry.call(this)
	this.type = 'DivideConcurHullGeometry';
	var scope = this;

	for (var i = 0; i < pointNumber; i++) {
		vertex = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 1000 - 500, Math.random() * 1000 - 500);
		//vertex = new THREE.Vector3(rand(1000) - 500, rand(1000) - 500, rand(1000) - 500);
		scope.vertices.push(vertex);
	};
	this.mergeVertices();

	scope.hull = function() {
		sort = function(v, l, r) {
			if (l >= r) {
				return;
			}
			pin = v[l];
			var lp = l + 1;
			var rp = r;
			while (lp < rp) {
				while (lp < rp && v[lp].x <= pin.x) {
					lp++;
				}
				while (rp > lp && v[rp].x > pin.x) {
					rp--;
				}
				swap(v, lp, rp);
			}
			pinpos = lp;
			if (v[lp].x > pin.x) {
				pinpos = lp - 1;
			} else {
				pinpos = lp;
			}
			swap(v, l, pinpos);
			sort(v, l, pinpos - 1);
			sort(v, pinpos + 1, r);
		}

		dcHull = function(l, r) {
			nextL = function(_fl, _fr) {
				var cand = [];
				for (var i = 0; i < pl[_fl].triangles.length; i++) {
					if (!pl[_fl].triangles[i].valid) {
						continue;
					}
					for (var j = 0; j < 3; j++) {
						if (pl[_fl].triangles[i].points[j] == _fl) {
							cand.push(pl[_fl].triangles[i].points[(j + 1) % 3]);
						}
					}
				}
				var next = _fl;
				var angle = (pl[_fl].y - pl[_fr].y) / (pl[_fr].x - pl[_fl].x);
				for (var i = 0; i < cand.length; i++) {
					ang = (pl[cand[i]].y - pl[_fr].y) / (pl[_fr].x - pl[cand[i]].x);
					if (ang > angle) {
						angle = ang;
						next = cand[i];
					}
				}
				return next;
			}
			nextR = function(_fl, _fr) {
				var cand = [];
				for (var i = 0; i < pl[_fr].triangles.length; i++) {
					if (!pl[_fr].triangles[i].valid) {
						continue;
					}
					for (var j = 0; j < 3; j++) {
						if (pl[_fr].triangles[i].points[j] == _fr) {
							cand.push(pl[_fr].triangles[i].points[(j + 1) % 3]);
						}
					}
				}
				var next = _fr;
				var angle = (pl[_fr].y - pl[_fl].y) / (pl[_fr].x - pl[_fl].x);
				for (var i = 0; i < cand.length; i++) {
					ang = (pl[cand[i]].y - pl[_fl].y) / (pl[cand[i]].x - pl[_fl].x);
					if (ang > angle) {
						angle = ang;
						next = cand[i];
					}
				}
				return next;
			}
			candidate = function(_fl, _fr, _kick) {
				var c = [];
				var d = [];
				var r = [];
				var _tl = pl[_fl].triangles;
				for (var i = 0; i < _tl.length; i++) {
					if (_tl[i].valid) {
						for (var j = 0; j < 3; j++) {
							if (_tl[i].points[j] == _fl) {
								if (_tl[i].points[(j + 2) % 3] != _kick) {
									c.push(_tl[i].points[(j + 2) % 3]);
									d.push('l');
									r.push(_tl[i]);
								}
							}
						}
					}
				}
				_tl = pl[_fr].triangles;
				for (var i = 0; i < _tl.length; i++) {
					if (_tl[i].valid) {
						for (var j = 0; j < 3; j++) {
							if (_tl[i].points[j] == _fr) {
								if (_tl[i].points[(j + 1) % 3] != _kick) {
									c.push(_tl[i].points[(j + 1) % 3]);
									d.push('r');
									r.push(_tl[i]);
								}
							}
						}
					}
				}
				return [c, d, r];
			}
			advance = function(_tr, _fl, _fr) {
				var faceNormal; //= THREE.Vector3(0,0,0)
				var kick = -1;
				if (_tr == null) {
					var dir = pl[_fr].clone().sub(pl[_fl]);
					faceNormal = new THREE.Vector3(-dir.y, dir.x, 0);

				} else {
					var ps = [pl[_tr.points[0]], pl[_tr.points[1]], pl[_tr.points[2]]];
					faceNormal = (ps[1].clone().sub(ps[0])).cross((ps[2].clone().sub(ps[0])));
					for (var j = 0; j < 3; j++) {
						if (_tr.points[j] != _fl && _tr.points[j] != _fr) {
							kick = _tr.points[j];
							break;
						}
					}
				}
				var ret = candidate(_fl, _fr, kick);
				var cand = ret[0];
				var lr = ret[1];
				var rpl = ret[2];
				var next = cand[0];
				var nextLr = lr[0];
				var nextRpl = rpl[0];
				var angle = faceNormal.angleTo((pl[_fr].clone().sub(pl[_fl])).cross(pl[next].clone().sub(pl[_fl])));
				for (var i = 1; i < cand.length; i++) {
					var nex = cand[i];
					var ang = faceNormal.angleTo((pl[_fr].clone().sub(pl[_fl])).cross(pl[nex].clone().sub(pl[_fl])));
					if (ang < angle) {
						angle = ang;
						next = nex;
						nextLr = lr[i];
						nextRpl = rpl[i];
					}
				}
				return [next, nextLr, nextRpl];
			}
			dfs2 = function(_tl, seed) {
				if (seed.length == 0) {
					for (var i = 0; i < _tl.length; i++) {
						_tl[i].valid = false;
					}
					return;
				}
				for (var i = 0; i < seed.length; i++) {
					seed[i].valid = false;
					for (var j = 0; j < 3; j++) {
						if (seed[i].neighbors[j] != null && seed[i].neighbors[j].valid) {
							dfs3(_tl, seed[i].neighbors[j]);
						}
					}
				}
			}

			dfs3 = function(_tl, seed) {
				if (seed.length == 0) {
					for (var i = 0; i < _tl.length; i++) {
						_tl[i].valid = false;
					}
					return;
				}
				seed.valid = false;
				for (var j = 0; j < 3; j++) {
					if (seed.neighbors[j] != null && seed.neighbors[j].valid) {
						dfs3(_tl, seed.neighbors[j]);
					}
				}
			}

			merge = function(_trl, _trr, _triangleRing, _leftSeed, _rightSeed) {
				dfs2(_trl, _leftSeed);
				dfs2(_trr, _rightSeed);

				var result = [];
				for (var i = 0; i < _trl.length; i++) {
					if (_trl[i].valid) {
						result.push(_trl[i]);
					}
				}
				for (var i = 0; i < _trr.length; i++) {
					if (_trr[i].valid) {
						result.push(_trr[i]);
					}
				}
				for (var i = 0; i < _triangleRing.length; i++) {
					if (_triangleRing[i].valid) {
						result.push(_triangleRing[i]);
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
				var mid = Math.floor((l + r) / 2);
				var _trl = dcHull(l, mid);
				var _trr = dcHull(mid + 1, r);
				if (_trl.length == 0 || _trr.length == 0) {
					for (var i = l; i <= r; i++) {
						pl[i].triangles = [];
					}
					return incHull(l, r);
				} else {
					if (_trl.length == 0) {
						for (var i = l; i <= mid; i++) {
							hullInc(_trr, i);
						}
						return _trr;
					} else if (_trr.length == 0) {
						for (var i = mid + 1; i <= r; i++) {
							hullInc(_trl, i);
						}
						return _trl;
					} else {
						// first edge.
						var fl = mid;
						var fr = mid + 1;
						var nr = nextR(fl, fr);
						var nl = fl;
						while (nr != fr) {
							fr = nr;
							nr = nextR(fl, fr);
						}
						//while (!(fl == nextL(fl, fr) && fr == nextR(fl,fr))) {
						while (true) {
							nl = nextL(fl, fr);
							if (nl == fl) {
								break;
							}
							while (nl != fl) {
								fl = nl;
								nl = nextL(fl, fr);
							}
							nr = nextR(fl, fr);
							while (nr != fr) {
								fr = nr;
								nr = nextR(fl, fr);
							}
						}

						var initLeft = fl;
						var initRight = fr;
						var preTriangle = null;
						var triangleRing = [];
						var leftPair = [];
						var rightPair = [];
						var leftSeed = [];
						var rightSeed = [];
						// var count = 0;
						// var tuple = [];
						// alert([l, r]);
						while (true) {
							var tupleNext = advance(preTriangle, fl, fr);
							var next = tupleNext[0];
							var nextLr = tupleNext[1];
							var nextRpl = tupleNext[2];
							nextTriangle = new Triangle(fl, fr, next, triangleRing.length);
							if (preTriangle != null) {
								nextTriangle.neighbors[2] = preTriangle;
								for (var j = 0; j < 3; j++) {
									if (preTriangle.points[j] != fl && preTriangle.points[j] != fr) {
										preTriangle.neighbors[j] = nextTriangle;
									}
								}
							}
							for (var j = 0; j < 3; j++) {
								if (nextRpl.points[j] != fl && nextRpl.points[j] != fr && nextRpl.points[j] != next) {
									if (nextLr == 'l') {
										leftPair.push([nextRpl, nextTriangle, j]);
									} else {
										rightPair.push([nextRpl, nextTriangle, j]);
									}
									break;
								}
							}

							// if (l == 0 && r == 49) {
							// 	tuple.push([fl, fr, 0, 0]);
							// 	count++;
							// 	if (count > 1) {
							// 		//alert(tuple);
							// 		return [_trl, _trr, triangleRing];
							// 		break;
							// 	}
							// }

							if (nextLr == 'l') {
								leftSeed.push(nextRpl);
								fl = next;
							} else {
								rightSeed.push(nextRpl);
								fr = next;
							}

							preTriangle = nextTriangle;
							triangleRing.push(nextTriangle);
							if (fl == initLeft && fr == initRight) {
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
								pl[triangleRing[i].points[j]].triangles.push(triangleRing[i]);
							}
						}
						return merge(_trl, _trr, triangleRing, leftSeed, rightSeed);

						// return [_trl, _trr, fl, fr]
					}
				}
			}
		}

		incHull = function(l, r) {
			var _tl = [];
			var p1 = l;
			var p2 = -1;
			var p3 = -1;
			var p4 = -1;
			var valid = false;
			for (var i = l + 1; i <= r; i++) {
				if (pl[p1].distanceTo(pl[i]) > delta) {
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
				if (((pl[p1].clone().sub(pl[p2])).cross((pl[p1].clone().sub(pl[i])))).length() > delta) {
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
				positive = ((pl[p2].clone().sub(pl[p1])).cross((pl[p3].clone().sub(pl[p1])))).dot(pl[i].clone().sub(pl[p1]))
				if (Math.abs(positive) > delta) {
					valid = true;
					p4 = i;
					break;
				}
			}
			if (!valid) {
				return [];
			}
			_tl.push(new Triangle(0, 1, 2, 0));
			_tl.push(new Triangle(2, 1, 3, 1));
			_tl.push(new Triangle(2, 3, 0, 2));
			_tl.push(new Triangle(0, 3, 1, 3));
			if (positive > 0) {
				for (var i = 0; i < 4; i++) {
					swap(_tl[i].points, 1, 2);
				}
			}

			var plookup = [p1, p2, p3, p4]

			for (var i = 0; i < 4; i++) {
				for (var j = 0; j < 3; j++) {
					_tl[i].neighbors[j] = _tl[(_tl[i].points[j] + 1) % 4];
					_tl[i].points[j] = plookup[_tl[i].points[j]];
				}
			}

			pl[p1].triangles.push(_tl[0]);
			pl[p1].triangles.push(_tl[2]);
			pl[p1].triangles.push(_tl[3]);
			pl[p2].triangles.push(_tl[0]);
			pl[p2].triangles.push(_tl[1]);
			pl[p2].triangles.push(_tl[3]);
			pl[p3].triangles.push(_tl[0]);
			pl[p3].triangles.push(_tl[1]);
			pl[p3].triangles.push(_tl[2]);
			pl[p4].triangles.push(_tl[1]);
			pl[p4].triangles.push(_tl[2]);
			pl[p4].triangles.push(_tl[3]);

			if (r - l >= 4) {
				for (var i = l; i <= r; i++) {
					if (i == p1 || i == p2 || i == p3 || i == p4) {
						continue;
					}
					hullInc(_tl, i);
				}
			}
			return _tl;
		}

		hullInc = function(_tl, _p) {
			deal = function(_tl, _p, _to, _td) {
				if (_td.valid) {
					trp = [pl[_td.points[0]], pl[_td.points[1]], pl[_td.points[2]]]
					faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]))
					pointDirection = pl[_p].clone().sub(trp[0])
					if (faceNormal.dot(pointDirection) > delta) {
						dfs(_tl, _p, _td);
					} else {
						var index = -1;
						for (var i = 0; i < 3; i++) {
							if (_td.neighbors[i] == _to) {
								index = i;
								break;
							}
						}
						var tr = new Triangle(_td.points[(index + 2) % 3], _td.points[(index + 1) % 3], _p, _tl.length);
						tr.neighbors[2] = _td;
						_td.neighbors[index] = tr;
						_tl.push(tr);
						pl[_p].triangles.push(tr);
						pl[tr.points[0]].triangles.push(tr);
						pl[tr.points[1]].triangles.push(tr);
					}
				}
			}
			dfs = function(_tl, _p, _t) {
				_t.valid = false;

				deal(_tl, _p, _t, _t.neighbors[0]);
				deal(_tl, _p, _t, _t.neighbors[1]);
				deal(_tl, _p, _t, _t.neighbors[2]);
			}

			for (var i = 0; i < _tl.length; i++) {
				if (!_tl[i].valid) {
					continue;
				}
				trp = [pl[_tl[i].points[0]], pl[_tl[i].points[1]], pl[_tl[i].points[2]]]
				faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]))
				pointDirection = pl[_p].clone().sub(trp[0])
				if (faceNormal.dot(pointDirection) > delta) {
					dfs(_tl, _p, _tl[i]);
					break;
				}
			}
			var index = 0;
			if (pl[_p].triangles.length > 0) {
				ts = pl[_p].triangles;
				while (true) {
					if (ts[index].neighbors[0] != null) {
						break;
					}
					for (var j = 0; j < ts.length; j++) {
						if (ts[j].points[0] == ts[index].points[1]) {
							ts[index].neighbors[0] = ts[j];
							ts[j].neighbors[1] = ts[index];
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
		var pl = [];
		var tl = [];
		sort(scope.vertices, 0, scope.vertices.length - 1);

		for (var i = 0; i < scope.vertices.length; i++) {
			vertex = scope.vertices[i].clone();
			vertex.index = i;
			vertex.triangles = [];
			vertex.used = false;
			pl.push(vertex);
		}


		temp = dcHull(0, pl.length - 1);

		for (var j = 0; j < temp.length; j++) {
			if (!temp[j].valid) {
				continue;
			}
			ps = temp[j].points;
			face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
			trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
			faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
			face.normal.copy(faceNormal);
			scope.faces.push(face);
		}

		// ret = dcHull(0, pl.length - 1);
		// for (var i = 0; i < 3; i++) {
		// 	temp = ret[i];
		// 	for (var j = 0; j < temp.length; j++) {
		// 		if (!temp[j].valid) {
		// 			continue;
		// 		}
		// 		ps = temp[j].points;
		// 		face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
		// 		trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
		// 		faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
		// 		face.normal.copy(faceNormal);
		// 		scope.faces.push(face);
		// 	}
		// }


		// temp = ret[2][0];
		// for (var i = 0; i < 2; i++) {
		// 	pi = temp.points[i];
		// 	for (var j = 0; j < pl[pi].triangles.length; j++) {
		// 		if (!pl[pi].triangles[j].valid) {
		// 			continue;
		// 		}
		// 		ps = pl[pi].triangles[j].points;
		// 		face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
		// 		trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
		// 		faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
		// 		face.normal.copy(faceNormal);
		// 		scope.faces.push(face);
		// 	}
		// }


		// // for (var j = 0; j < scope.vertices.length; j++) {
		// // 	scope.vertices[j].z = 0;
		// // }
		// ret = dcHull(0, pl.length - 1);
		// scope.vertices[ret[2]].top = true;
		// scope.vertices[ret[3]].top = true;
		// pl[ret[2]].top = true;
		// pl[ret[3]].top = true;
		// temp = ret[0];
		// for (var j = 0; j < temp.length; j++) {
		// 	if (!temp[j].valid) {
		// 		continue;
		// 	}
		// 	ps = temp[j].points;
		// 	face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
		// 	trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
		// 	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
		// 	face.normal.copy(faceNormal);
		// 	scope.faces.push(face);
		// }
		// temp = ret[1];
		// for (var j = 0; j < temp.length; j++) {
		// 	if (!temp[j].valid) {
		// 		continue;
		// 	}
		// 	ps = temp[j].points;
		// 	face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
		// 	trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
		// 	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
		// 	face.normal.copy(faceNormal);
		// 	scope.faces.push(face);
		// }
		// // for (var j = 0; j < scope.vertices.length; j++) {
		// // 	scope.vertices[j].z = 0;
		// // }


		// for (var i = 0; i < pl.length - 50; i = i + 50) {
		// 	temp = incHull(i, i + 49);
		// 	for (var j = 0; j < temp.length; j++) {
		// 		if (!temp[j].valid) {
		// 			continue;
		// 		}
		// 		ps = temp[j].points;
		// 		face = new THREE.Face3(pl[ps[0]].index, pl[ps[1]].index, pl[ps[2]].index);
		// 		trp = [pl[ps[0]], pl[ps[1]], pl[ps[2]]];
		// 		faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
		// 		face.normal.copy(faceNormal);
		// 		scope.faces.push(face);
		// 	}
		// }
	}
}

DivideConcurHullGeometry.prototype = Object.create(THREE.Geometry.prototype);
DivideConcurHullGeometry.prototype.constructor = DivideConcurHullGeometry;