
var MeshLinker = class {
    constructor() {
        this.maxID = 0;
        this.meshes = {};
    }
    addMesh(id, mesh) {
        this.meshes[id] = {
            mesh: mesh,
            id: id,
            isMeshLink: true
        }
    }
    removeMesh(id) {
        if(!this.meshes[id]){
            return;
        }
        delete this.meshes[id];
    }
    getByID(id) {
        return this.meshes[id];
    }
    update(previousWorld, world, lerpAmount){
        for(var meshID in this.meshes){
            if(!world.getByID(meshID) || !previousWorld.getByID(meshID)){
                continue;
            }
            var mesh = this.meshes[meshID];
            var composite = world.getByID(meshID);
            var previousComposite = previousWorld.getByID(meshID);
            mesh.mesh.position.set(...previousComposite.global.body.position.lerp(composite.global.body.position, lerpAmount));
            var quat = previousComposite.global.body.rotation.slerp(composite.global.body.rotation, lerpAmount);
            mesh.mesh.quaternion.set(...[quat.x, quat.y, quat.z, quat.w]);

        }
    }
};

export default MeshLinker;