import Material from "../Collision/Material.mjs";
import PhysicsBody3 from "../Core/PhysicsBody3.mjs";
import Hitbox3 from "../Broadphase/Hitbox3.mjs";
import Vector3 from "../Math3D/Vector3.mjs";
import Matrix3 from "../Math3D/Matrix3.mjs";

var Composite = class {

    static FLAGS = {
        STATIC: 1 << 0,
        DYNAMIC: 1 << 1,
        KINEMATIC: 1 << 2,
        CENTER_OF_MASS: 1 << 3,
        FIXED_POSITION: 1 << 4,
        FIXED_ROTATION: 1 << 5,
        OCCUPIES_SPACE: 1 << 6
    };

    static SHAPES = {};

    static SHAPES_CLASSES = {};

    static SHAPE_MAX_ID = 0;
    static REGISTER_SHAPE(obj) {
        this.SHAPES[obj.name] = this.SHAPE_MAX_ID++;
        this.SHAPES_CLASSES[this.SHAPES[obj.name]] = obj;
    }

    static name = "COMPOSITE";

    constructor(options) {
        this.id = options?.id ?? -1;
        this.shape = options?.shape ?? this.constructor.SHAPES.COMPOSITE;

        this.world = options?.world ?? null;
        this.parent = options?.parent ?? null;
        this.maxParent = options?.maxParents ?? this;
        this.children = options?.children ?? [];
        this.material = options?.material ?? new Material();
        this.global = {};
        this.global.body = new PhysicsBody3(options?.global?.body);
        this.global.hitbox = new Hitbox3(options?.global?.hitbox);
        this.global.flags = options?.global?.flags ?? 0;

        this.local = {};
        this.local.body = new PhysicsBody3(options?.local?.body);
        this.local.flags = options?.local?.flags ?? 0;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, false);

        this.preCollisionCallback = null;
        this.postCollisionCallback = null;
        this.preStepCallback = null;
        this.postStepCallback = null;
        this.preIterationCallback = null;
        this.postIterationCallback = null;
        this.toBeRemoved = false;

        this.local.hitbox = new Hitbox3(options?.local?.hitbox);
        this.graphicsEngine = null;
        this._mesh = options?.mesh ?? null;

    }

    setRestitution(restitution) {
        this.material.setRestitution(restitution);
        return this;
    }

    setFriction(friction) {
        this.material.setFriction(friction);
        return this;
    }

    setWorld(world) {
        this.world = world;
        return this;
    }

    translateWorldToLocal(v) {
        return this.global.body.rotation.conjugate().multiplyVector3(v.subtract(this.global.body.position));
    }

    translateLocalToWorld(v) {
        return this.global.body.rotation.multiplyVector3(v)
            .addInPlace(this.global.body.position);
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        var rotationMatrix = quaternion.toMatrix3();
        var result = rotationMatrix.multiply(this.local.body.momentOfInertia).multiply(rotationMatrix.transpose());
        return result;
    }

    calculateGlobalMomentOfInertia() {
        this.calculateLocalMomentOfInertia();
        this.global.body.momentOfInertia.setMatrix3(this.rotateLocalMomentOfInertia(this.global.body.rotation));
        var mass = this.local.body.mass;
        var dx = this.maxParent.global.body.position.x - this.global.body.position.x;
        var dy = this.maxParent.global.body.position.y - this.global.body.position.y;
        var dz = this.maxParent.global.body.position.z - this.global.body.position.z;
        var Ixx = mass * (dy * dy + dz * dz);
        var Iyy = mass * (dx * dx + dz * dz);
        var Izz = mass * (dx * dx + dy * dy);
        var Ixy = - mass * dx * dy;
        var Ixz = - mass * dx * dz;
        var Iyz = - mass * dy * dz;
        this.global.body.momentOfInertia.elements[0] += Ixx;
        this.global.body.momentOfInertia.elements[1] += Ixy;
        this.global.body.momentOfInertia.elements[2] += Ixz;
        this.global.body.momentOfInertia.elements[3] += Ixy;
        this.global.body.momentOfInertia.elements[4] += Iyy;
        this.global.body.momentOfInertia.elements[5] += Iyz;
        this.global.body.momentOfInertia.elements[6] += Ixz;
        this.global.body.momentOfInertia.elements[7] += Iyz;
        this.global.body.momentOfInertia.elements[8] += Izz;
        return this.global.body.momentOfInertia;
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(0, 0, 0);
        this.local.hitbox.max = new Vector3(0, 0, 0);
        return this.local.hitbox;
    }

    calculateGlobalHitbox() {
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    getGlobalFlag(flag) {
        return (this.global.flags & flag) != 0;
    }

    setGlobalFlag(flag, value) {
        if (value) {
            this.global.flags |= flag;
        } else {
            this.global.flags &= ~flag;
        }
    }

    toggleGlobalFlag(flag) {
        this.flags ^= flag;
    }

    setLocalFlag(flag, value) {
        if (value) {
            this.local.flags |= flag;
        } else {
            this.local.flags &= ~flag;
        }
    }

    toggleLocalFlag(flag) {
        this.local.flags ^= flag;
    }

    getLocalFlag(flag) {
        return (this.local.flags & flag) != 0;
    }

    canCollideWith(other) {
        if (other.maxParent == this.maxParent) {
            return false;
        }
        if (this.getLocalFlag(Composite.FLAGS.STATIC | Composite.FLAGS.KINEMATIC) && other.getLocalFlag(Composite.FLAGS.STATIC | Composite.FLAGS.KINEMATIC)) {
            return false;
        }
        return true;
    }

    translate(v) {
        if (this.isMaxParent()) {
            var velocity = this.global.body.getVelocity();
            this.global.body.position.addInPlace(v);
            this.global.body.setVelocity(velocity);
            this.translateChildrenGlobal(v);
            return;
        }
        this.maxParent.translate(v);
    }

    setParentAll(parent) {
        this.parent = parent;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setParentAll(parent);
        }
    }

    add(child) {
        child.setParentAll(this);
        child.setMaxParentAll(this);
        this.children.push(child);
    }

    isMaxParent() {
        return this == this.maxParent;
    }

    setMaxParentAll(maxParent) {
        this.maxParent = maxParent;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setMaxParentAll(maxParent);
        }
    }
    removeSelf() {
        if (this.isMaxParent()) {
            return;
        }
        this.maxParent = this;
        this.setMaxParentAll(this);
    }

    getVelocityAtPosition(position) {
        return this.global.body.getVelocityAtPosition(position);
    }

    applyForce(force, position) {
        if (!position) {
            position = this.global.body.position;
        }
        if (this.isMaxParent()) {
            if (this.getGlobalFlag(this.constructor.FLAGS.KINEMATIC | this.constructor.FLAGS.STATIC)) {
                return;
            }
            this.global.body.netForce.addInPlace(force);
            this.global.body.netTorque.addInPlace((position.subtract(this.global.body.position)).cross(force));
            return;
        }
        this.maxParent.applyForce(force, position);
    }

    setPosition(position) {
        if (this.isMaxParent()) {
            this.global.body.setPosition(position);
            return;
        }
        this.local.body.setPosition(position);
    }

    setRotation(rotation) {
        if (this.isMaxParent()) {
            this.global.body.rotation = rotation.copy();
            return;
        }
        this.local.body.rotation = rotation.copy();
    }

    setAngularVelocity(angularVelocity) {
        if (this.isMaxParent()) {
            this.global.body.angularVelocity = angularVelocity.copy();
            return;
        }
        this.local.body.angularVelocity = angularVelocity.copy();
    }

    getCenterOfMass(skip = false) {
        if (!this.children.length) {
            return this.global.body.position.copy();
        }
        var centerOfMass = skip ? new Vector3() : this.global.body.position.scale(this.local.body.mass);
        for (var i = 0; i < this.children.length; i++) {
            centerOfMass.addInPlace(this.children[i].getCenterOfMass().scale(this.children[i].global.body.mass));
        }
        centerOfMass.scaleInPlace(1 / (this.global.body.mass - (skip ? this.local.body.mass : 0)));
        return centerOfMass;
    }

    calculatePropertiesAll() {

        this.global.body.mass = this.local.body.mass;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].calculatePropertiesAll();
        }

        if (this.parent) {
            this.parent.global.body.mass += this.global.body.mass;
        }

        this.global.body.setMass(this.global.body.mass);
    }

    syncAll() {

        if (!this.isMaxParent()) {

            this.global.flags = this.parent.global.flags | this.local.flags;

            this.global.body.rotation.set(this.parent.global.body.rotation.multiply(this.local.body.rotation));
            this.global.body.position.set(this.parent.global.body.position.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.position)));
            this.global.body.acceleration.set(this.parent.global.body.acceleration.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.acceleration)));

            this.global.body.angularVelocity.set(this.parent.global.body.angularVelocity.add(this.local.body.angularVelocity));
            this.global.body.angularAcceleration.set(this.parent.global.body.angularAcceleration.add(this.local.body.angularAcceleration));
        }
        else {
            this.global.flags = this.local.flags;
        }

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].syncAll();
        }

        if (this.getLocalFlag(this.constructor.FLAGS.CENTER_OF_MASS)) {
            var centerOfMass = this.getCenterOfMass(true);
            var translationAmount = this.global.body.rotation.conjugate().multiplyVector3(this.global.body.position.subtract(centerOfMass));
            this.translateChildren(translationAmount);
        }
    }

    updateGlobalHitboxAll() {
        this.calculateGlobalHitbox();
        if (this.world?.spatialHash && this.getLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE)) {
            this.world.spatialHash.addHitbox(this.global.hitbox, this.id);
        }
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateGlobalHitboxAll();
        }
    }

    updateGlobalMomentOfInertiaAll() {
        this.calculateGlobalMomentOfInertia();
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateGlobalMomentOfInertiaAll();
        }
        this.global.body.inverseMomentOfInertia = this.global.body.momentOfInertia.invert();
    }

    updateMaxParentMomentOfInertia() {
        if (this.isMaxParent()) {
            this.updateGlobalMomentOfInertiaAll();
        }
        else {
            this.maxParent.global.body.momentOfInertia.addInPlace(this.global.body.momentOfInertia);
        }
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateMaxParentMomentOfInertia();
        }
        if (this.isMaxParent()) {
            this.maxParent.global.body.inverseMomentOfInertia = this.maxParent.global.body.momentOfInertia.invert();
        }
    }

    setMesh(options, graphicsEngine) {
        return null;
    }

    setMeshAndAddToScene(options, graphicsEngine) {
        return null;
    }

    setColorGeometry(geometry, graphicsEngine) {
        var attrib = geometry.attributes;
        var color = new Float32Array(attrib.position.count * 3);
        for (var i = 0; i < attrib.position.count; i++) {
            var y = i * 3;
            color[y] = 1;
            color[y + 1] = 1;
            color[y + 2] = 1;
        }
        geometry.setAttribute('color', new graphicsEngine.THREE.BufferAttribute(color, 3));
    }

    update() {
        if (!this.isMaxParent()) {
            this.local.body.update(this.world);
            this.global.body.updateWithoutMoving(this.world);
            return;
        }
        this.global.body.update(this.world);
    }

    updateBeforeCollisionAll() {

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateBeforeCollisionAll();
        }

        this.update();

        if (this.isMaxParent()) {
            this.calculatePropertiesAll();
            this.syncAll();
        }

        this.updateGlobalHitboxAll();

        if (this.isMaxParent()) {
            this.updateMaxParentMomentOfInertia();
        }
    }

    updateAfterCollisionAll() {
        if (this.isMaxParent()) {
            this.syncAll();
        }

    }

    addToScene(scene) {
        if (!this.mesh) {
            return null;
        }
        if (this.mesh.isMeshLink) {
            scene.add(this.mesh.mesh);
            return;
        }
        scene.add(this.mesh);
    }

    addToWorld(world) {
        world.addComposite(this);
    }

    translateChildren(v) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].local.body.position.addInPlace(v);
            this.children[i].local.body.previousPosition.addInPlace(v);
        }
    }

    translateChildrenGlobal(v) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].global.body.position.addInPlace(v);
            this.children[i].global.body.previousPosition.addInPlace(v);
        }
    }

    toJSON() {
        var composite = {};
        composite.id = this.id;
        composite.shape = this.shape;
        composite.world = this.world?.id ?? null;
        composite.parent = this.parent?.id ?? null;
        composite.maxParent = this.maxParent.id;
        composite.children = [];
        for (var i of this.children) {
            composite.children.push(i.id);
        }
        composite.toBeRemoved = this.toBeRemoved;
        composite.material = this.material.toJSON();
        composite.global = {};
        composite.global.body = this.global.body.toJSON();
        composite.global.hitbox = this.global.hitbox.toJSON();
        composite.global.flags = this.global.flags;
        composite.local = {};
        composite.local.body = this.local.body.toJSON();
        composite.local.hitbox = this.local.hitbox.toJSON();
        composite.local.flags = this.local.flags;
        return composite;
    }

    static fromJSON(json, world, graphicsEngine) {
        var composite = new this();
        composite.world = world;
        composite.id = json.id;
        composite.shape = json.shape;
        composite.parent = json.parent;
        composite.maxParent = json.maxParent;
        composite.children = [];
        for (var i of json.children) {
            composite.children.push(i);
        }
        composite.toBeRemoved = json.toBeRemoved;
        composite.material = Material.fromJSON(json.material, world);
        composite.global.body = PhysicsBody3.fromJSON(json.global.body, world);
        composite.global.hitbox = Hitbox3.fromJSON(json.global.hitbox);
        composite.global.flags = json.global.flags;
        composite.local.body = PhysicsBody3.fromJSON(json.local.body, world);
        composite.local.hitbox = Hitbox3.fromJSON(json.local.hitbox, world);
        composite.local.flags = json.local.flags;
        composite.graphicsEngine = graphicsEngine;
        return composite;
    }

    updateReferences(world = this.world, graphicsEngine = this.world.graphicsEngine) {
        this.parent = this.parent == null ? null : world.getByID(this.parent);
        this.maxParent = world.getByID(this.maxParent);
        for (var i = 0; i < this.children.length; i++) {
            this.children[i] = world.getByID(this.children[i]);
        }
        if (graphicsEngine) {
            this.graphicsEngine = graphicsEngine;
        }
    }

    set mesh(value) {
        if (this.id == -1 || !value) {
            this._mesh = value;
            return;
        }
        this.graphicsEngine.meshLinker.addMesh(this.id, value);
    }

    get mesh() {
        if (this.id == -1) {
            return this._mesh;
        }
        return this.graphicsEngine.meshLinker.getByID(this.id);
    }
}

Composite.REGISTER_SHAPE(Composite);

export default Composite;