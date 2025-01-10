import Sphere from "./3D/Physics/Shapes/Sphere.mjs";
import HealthUnit from "./HealthUnit.mjs";
import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
import Quaternion from "./3D/Physics/Math3D/Quaternion.mjs";

var Slime = class extends HealthUnit {
    constructor(options) {
        super(options);
        this.damage = options?.damage ?? 10;
        this.speed = options?.speed ?? 0.3;
        this.fireRate = options?.fireRate ?? 1;
        this.jumpPower = options?.jumpPower ?? 0.1;
        this.maxAmmo = options?.maxAmmo ?? 1;
        this.ammo = options?.ammo ?? this.maxAmmo;
        this.range = options?.range ?? 3;
        this.reloadTime = options?.reloadTime ?? 1;
        this.sphere = new Sphere(options?.sphere);
        this.sphere.radius = options?.radius ?? 1;
        this.maxJumpCooldown = options?.maxJumpCooldown ?? 50;
        this.jumpCooldown = options?.jumpCooldown ?? 0;
        this.sphere.setRestitution(0);
        this.sphere.setFriction(0.5);
        this.sphere.global.body.linearDamping = new Vector3(0.02, 0, 0.02)
        this.sphere.global.body.angularDamping = 1;
        this.target = null;
        this.sphere.calculateLocalHitbox();
        this.handleTargetHit = function(target){
            var world = this.sphere.world;
            var targetBody = world.getByID(target.followID);
            if(!targetBody){
                this.target = null;
                return;
            }
            targetBody.children[0].toBeRemoved = true;
        }
        this.spherePostCollision = function (contact) {
            if (contact.body1.maxParent == this.sphere) {
                if(this.target){
                    if(contact.body2.maxParent.id == this.target.followID){
                        this.handleTargetHit(this.target);
                    }
                }
                if (contact.normal.dot(new Vector3(0, 1, 0)) > 0.75) {
                    if(this.jumpCooldown <= 0){
                        this.jumpCooldown = this.maxJumpCooldown;
                    }
                }
            }
            else {
                if(this.target){
                    if(contact.body1.maxParent.id == this.target.followID){
                        this.handleTargetHit(this.target);
                    }
                }
                if (contact.normal.dot(new Vector3(0, -1, 0)) > 0.75) {
                    if(this.jumpCooldown <= 0){
                        this.jumpCooldown = this.maxJumpCooldown;
                    }
                }
            }
        }.bind(this);

        this.onDelete = function (x) {
            console.log("e", x)
        }.bind(this);
        this.sphere.addEventListener("postCollision", this.spherePostCollision);
        this.sphere.addEventListener("delete", this.onDelete);
        
    }

    addToScene(scene) {
        this.sphere.addToScene(scene);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
    }

    setMeshAndAddToScene(options, graphicsEngine) {
        graphicsEngine.load("slime.glb", function(gltf){
            gltf.scene.scale.set(this.sphere.radius, this.sphere.radius, this.sphere.radius);
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            this.sphere.mesh = graphicsEngine.meshLinker.createMeshData(gltf.scene);
            this.addToScene(graphicsEngine.scene);
        }.bind(this));
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
        this.target = target;
        var targetBody = world.getByID(target.followID);
        if (!targetBody) {
            return;
        }
        var direction = targetBody.global.body.position.subtract(this.sphere.global.body.position);
        direction.y = 0;
        direction.normalizeInPlace().scaleInPlace(this.speed);
        direction.y = this.jumpPower;
        this.sphere.global.body.rotation = Quaternion.lookAt(direction, new Vector3(0, 1, 0));
        
        if(this.jumpCooldown != this.maxJumpCooldown){
            this.jumpCooldown -= 1;
            return;
        }
        this.sphere.applyForce(direction);
        this.jumpCooldown -= 1;
        
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
        json.jumpCooldown = this.jumpCooldown;
        json.maxJumpCooldown = this.maxJumpCooldown;
        json.jumpPower = this.jumpPower;
        return json;
    }

    static fromJSON(json, world) {
        var slime = super.fromJSON(json, world);
        slime.damage = json.damage;
        slime.speed = json.speed;
        slime.fireRate = json.fireRate;
        slime.maxAmmo = json.maxAmmo;
        slime.ammo = json.ammo;
        slime.range = json.range;
        slime.maxJumpCooldown = json.maxJumpCooldown;
        slime.jumpCooldown = json.jumpCooldown;
        slime.reloadTime = json.reloadTime;
        slime.sphere = json.sphere;
        slime.jumpPower = json.jumpPower;
        return slime;
    }

    updateReferences(world) {
        this.sphere = world.getByID(this.sphere);
        this.sphere.addEventListener("postCollision", this.spherePostCollision);
        this.sphere.addEventListener("delete", this.onDelete);
    }
}

export default Slime;