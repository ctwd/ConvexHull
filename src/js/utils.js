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

var rand = (function() {
	//dfs2 的时候笔误+triangleRing置false笔误
	// var seed = 4;
	// inc构建失败，需要清空point的triangle表。
	// var seed = 7;
	// merge 的时候剔除面片，因为预先把所有边界上的面全置为false了，所以有排除不充分的请款出现。
	// var seed = 15;
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