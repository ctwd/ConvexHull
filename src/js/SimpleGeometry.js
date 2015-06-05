EmptyGeometry = function() {
	THREE.Geometry.call(this)
	this.type = 'EmptyGeometry';
	var scope = this;

	this.mergeVertices();
}
EmptyGeometry.prototype = Object.create(THREE.Geometry.prototype);
EmptyGeometry.prototype.constructor = EmptyGeometry;

PyramidGeometry = function() {
	THREE.Geometry.call(this)
	this.type = 'PyramidGeometry';
	var scope = this;
	normal = new THREE.Vector3(0, 0, 1);

	scope.vertices.push(new THREE.Vector3(0, 0, 0))
	scope.vertices.push(new THREE.Vector3(100, 0, 0))
	scope.vertices.push(new THREE.Vector3(0, 100, 0))
	scope.vertices.push(new THREE.Vector3(0, 0, 100))

	face = new THREE.Face3(0, 2, 1);
	face.normal.copy(normal);
	scope.faces.push(face);
	face = new THREE.Face3(0, 1, 3);
	face.normal.copy(normal);
	scope.faces.push(face);
	face = new THREE.Face3(0, 3, 2);
	face.normal.copy(normal);
	scope.faces.push(face);
	face = new THREE.Face3(1, 2, 3);
	face.normal.copy(normal);
	scope.faces.push(face);
	this.mergeVertices();
}
PyramidGeometry.prototype = Object.create(THREE.Geometry.prototype);
PyramidGeometry.prototype.constructor = PyramidGeometry;