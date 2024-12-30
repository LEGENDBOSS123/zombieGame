import Sphere from "./3D/Physics/Shapes/Sphere.mjs";
import Composite from "./3D/Physics/Shapes/Composite.mjs";
import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
var ZombieSpawner = class {
    constructor(options) {
        this.sphere = new Sphere(options?.sphere);
        this.sphere.radius = 15;
        this.sphere.local.body.mass = Infinity;
        this.sphere.calculateLocalHitbox();

        this.sphere.setLocalFlag(Composite.FLAGS.STATIC, true);
        this.sphere.setRestitution(0);
        this.sphere.setFriction(0);
    }

    addToScene(scene) {
        this.sphere.addToScene(scene);
    }

    addToWorld(world) {
        world.addComposite(this.sphere);
    }

    setMeshAndAddToScene(options, graphicsEngine) {
        graphicsEngine.load("zombieSpawner.glb", function (gltf) {
            this.sphere.mesh = gltf.scene;
            this.addToScene(graphicsEngine.scene);
        }.bind(this));
    }

    toJSON() {
        var json = {};
        json.sphere = this.sphere.id;
        return json;
    }

    static fromJSON(json, world) {
        var zombieSpawner = new this();
        this.sphere = json.sphere;
        return zombieSpawner;
    }

    updateReferences(world) {
        this.sphere = world.getByID(this.sphere);
    }

    spawnZombie(zombieClass, world, graphicsEngine) {
        var zombie = new zombieClass({
            sphere: {
                global: {
                    body: {
                        position: this.sphere.global.body.position.add(new Vector3(0, 10, 0)),
                        acceleration: new Vector3(0, -0.2, 0),
                    }
                }
            }
        });
        zombie.addToWorld(world);
        zombie.setMeshAndAddToScene({}, graphicsEngine);
        return zombie;
    }
}

export default ZombieSpawner;