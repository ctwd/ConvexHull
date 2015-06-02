MyGeometry = function () 
{
	// body...
    THREE.Geometry.call(this)
    this.type = 'MyGeometry';
    var scope = this;
    
    var vertexArray = new Array();
    vertexArray[0] = new THREE.Vector3(-200,-200,200);
    vertexArray[1] = new THREE.Vector3(0,-200,0);
    vertexArray[2] = new THREE.Vector3(200,-200,200);
    vertexArray[3] = new THREE.Vector3(0,200,100);


    for (x in vertexArray)
	{
	   scope.vertices.push(vertexArray[x]);
	}
	scope.mergeVertices();


	face = new THREE.Face3(0,1,2);
	trp = [vertexArray[0],vertexArray[1], vertexArray[2]];
	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
	face.normal.copy(faceNormal);
	scope.faces.push(face);

	face = new THREE.Face3(0,3,1);
	trp = [vertexArray[0],vertexArray[3], vertexArray[1]];
	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
	face.normal.copy(faceNormal);
	scope.faces.push(face);

	face = new THREE.Face3(2,1,3);
	trp = [vertexArray[2],vertexArray[1], vertexArray[3]];
	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
	face.normal.copy(faceNormal);
	scope.faces.push(face);
    
    face = new THREE.Face3(0,2,3);
	trp = [vertexArray[0],vertexArray[2], vertexArray[3]];
	faceNormal = (trp[1].clone().sub(trp[0])).cross(trp[2].clone().sub(trp[0]));
	face.normal.copy(faceNormal);
	scope.faces.push(face);
}
MyGeometry.prototype = Object.create(THREE.Geometry.prototype);
MyGeometry.prototype.constructor = MyGeometry;