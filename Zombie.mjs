import Sphere from "./3D/Physics/Shapes/Sphere.mjs";
import HealthUnit from "./HealthUnit.mjs";
import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
var Zombie = class extends HealthUnit {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 10;
        this.speed = options?.speed ?? 0.03;
        this.fireRate = options?.fireRate ?? 1;
        this.maxAmmo = options?.maxAmmo ?? 1;
        this.ammo = options?.ammo ?? this.maxAmmo;
        this.range = options?.range ?? 3;
        this.reloadTime = options?.reloadTime ?? 1;
        this.sphere = new Sphere(options?.sphere);
        this.sphere.radius = 1;
        this.sphere.setRestitution(0);
        this.sphere.setFriction(0);
        this.sphere.global.body.linearDamping = new Vector3(0.05, 0, 0.05)
        this.sphere.global.body.angularDamping = 1;
        this.sphere.calculateLocalHitbox();
    }

    addToScene(scene) {
        this.sphere.addToScene(scene);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
    }

    setMeshAndAddToScene(options, graphicsEngine) {
        this.sphere.setMesh(options, graphicsEngine);
        this.sphere.addToScene(graphicsEngine.scene);
    }

    findTarget(targets, world) {
        if (targets.length == 0) {
            return null;
        }
        return targets[0];
    }

    update(targets, world) {
        var target = this.findTarget(targets, world);
        if (!target) {
            return;
        }
        var targetBody = world.getByID(target.followID);
        if (!targetBody) {
            return;
        }
        var direction = targetBody.global.body.position.subtract(this.sphere.global.body.position);
        direction.y = 0;
        direction.normalizeInPlace();
        this.sphere.applyForce(direction.scale(this.speed));
        
    }

    toJSON() {
        var json = super.toJSON();
        json.damage = this.damage;
        json.speed = this.speed;
        json.fireRate = this.fireRate;
        json.maxAmmo = this.maxAmmo;
        json.ammo = this.ammo;
        json.range = this.range;
        json.reloadTime = this.reloadTime;
        json.sphere = this.sphere.id;
        return json;
    }

    static fromJSON(json, world) {
        var zombie = super.fromJSON(json, world);
        zombie.damage = json.damage;
        zombie.speed = json.speed;
        zombie.fireRate = json.fireRate;
        zombie.maxAmmo = json.maxAmmo;
        zombie.ammo = json.ammo;
        zombie.range = json.range;
        zombie.reloadTime = json.reloadTime;
        zombie.sphere = json.sphere;
        return zombie;
    }

    updateReferences(world) {
        this.sphere = world.getByID(this.sphere);
    }
}

export default Zombie;