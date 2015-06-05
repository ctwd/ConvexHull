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
		while (lp < rp && vector[lp].x <= pin.x) {
			lp++;
		}
		while (rp > lp && vector[rp].x > pin.x) {
			rp--;
		}
		swap(vector, lp, rp);
	}
	pinpos = lp;
	if (vector[lp].x > pin.x) {
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