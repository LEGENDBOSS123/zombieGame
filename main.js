import Vector3 from "./3D/Physics/Math3D/Vector3.mjs";
import Matrix3 from "./3D/Physics/Math3D/Matrix3.mjs";
import Hitbox3 from "./3D/Physics/Broadphase/Hitbox3.mjs";
import Quaternion from "./3D/Physics/Math3D/Quaternion.mjs";
import Triangle from "./3D/Physics/Shapes/Triangle.mjs";
import PhysicsBody3 from "./3D/Physics/Core/PhysicsBody3.mjs";
import Material from "./3D/Physics/Collision/Material.mjs";
import Composite from "./3D/Physics/Shapes/Composite.mjs";
import Sphere from "./3D/Physics/Shapes/Sphere.mjs";
import Box from "./3D/Physics/Shapes/Box.mjs";
import Point from "./3D/Physics/Shapes/Point.mjs";
import Terrain3 from "./3D/Physics/Shapes/Terrain3.mjs";
import SpatialHash from "./3D/Physics/Broadphase/SpatialHash.mjs";
import World from "./3D/Physics/Core/World.mjs";
import Contact from "./3D/Physics/Collision/Contact.mjs";
import CollisionDetector from "./3D/Physics/Collision/CollisionDetector.mjs";
import SimpleCameraControls from "./3D/SimpleCameraControls.mjs";
import CameraTHREEJS from "./3D/CameraTHREEJS.mjs";
import Player from "./Player.mjs";
import Keysheld from "./3D/Web/Keysheld.mjs";

import AssetManager from "./3D/Graphics/AssetManager.mjs"

import Stats from "./3D/Web/Stats.mjs";
import GraphicsEngine from "./3D/Graphics/GraphicsEngine.mjs";
import SlimeSpawner from "./SlimeSpawner.mjs";

import * as THREE from "three";
import Target from "./Target.mjs";
import Slime from "./Slime.mjs";
import Ability from "./Ability.mjs";
import Hotbar from "./Hotbar.mjs";
import EntitySystem from "./EntitySystem.mjs";
top.Ability = Ability;
top.Box = Box;
top.World = World;

var hotbar = new Hotbar({
    document: document,
});

hotbar.createHTML({
    container: document.getElementById("hotbarContainer"),
    aspectRatio: 1,
});


var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var graphicsEngine = new GraphicsEngine({
    window: window,
    document: document,
    container: document.body,
    canvas: document.getElementById("canvas"),
});

graphicsEngine.ambientLight.intensity = 1;

graphicsEngine.setBackgroundImage("3D/Graphics/Textures/autumn_field_puresky_8k.hdr", true, false);

graphicsEngine.setSunlightDirection(new Vector3(-2, -8, -5));
graphicsEngine.setSunlightBrightness(1);
graphicsEngine.disableAO();
graphicsEngine.disableShadows();


graphicsEngine.renderDistance = 1024;
graphicsEngine.cameraFar = 2048;
window.graphicsEngine = graphicsEngine;


var assetManager = new AssetManager({
    loader: new THREE.TextureLoader()
});

assetManager.loadAll([
    { name: "rug", file: "rug.jpg" },
    { name: "grass", file: "grass.png" },
    { name: "rocky ground", file: "rockyGround.jpg" }
]);


var gameCamera = new CameraTHREEJS({ camera: graphicsEngine.camera, pullback: 5, maxPullback: 20 });
var cameraControls = new SimpleCameraControls({
    camera: gameCamera,
    speed: 1,
    pullbackRate: 0.1,
    rotateMethods: {
        wheel: true,
        shiftLock: true,
        drag: true
    },
    rotateSensitivity: {
        wheel: 0.01,
        shiftLock: 0.01,
        drag: 0.01
    },
    shiftLockCursor: document.getElementById('shiftlockcursor'),
    window: window,
    document: document,
    renderDomElement: document.body
});


var keyListener = new Keysheld(window);



document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('keydown', function (e) {
    if (e.key == "r") {
        player.respawn();
        return;
    }
});



var world = new World();
var entitySystem = new EntitySystem();

top.world = world;
top.setWorld = function (w) {
    window.player = window.player.toJSON();
    world = w;
    window.player = Player.fromJSON(window.player, world);
    window.player.updateReferences(world, graphicsEngine);
    return world;
}
world.setIterations(4);
world.graphicsEngine = graphicsEngine;

var gravity = -0.2;

var targets = [];
var slimes = [];

var player = new Player({
    radius: 1,
    moveStrength: new Vector3(0.2, 0.05, 0.2),
    jumpStrength: 0.75,
    global: {
        body: {
            acceleration: new Vector3(0, gravity, 0),
            position: new Vector3(0, 80, 0),
            linearDamping: new Vector3(0.05, 0, 0.05),
            angularDamping: 1
        }
    },
    local: {
        body: {
            mass: 1
        }
    },
    graphicsEngine: graphicsEngine
});
top.player = player;
player.setMeshAndAddToScene({}, graphicsEngine);
player.addToWorld(world);
entitySystem.register(player);

targets.push(new Target({
    followID: player.id,
    threatLevel: Infinity
}))

var ability1 = new Ability({
    document: document,
    graphicsEngine: graphicsEngine,
    world: world
});
ability1.onActivate = function (timeHeld) {
    var intersection = graphicsEngine.raycastFirst();
    if (!intersection) {
        return;
    }
    // var radius = intersection.distance / 20;
    var radius = 1
    var point = Vector3.from(intersection.point);
    var normal = Vector3.from(intersection.face.normal);
    point.addInPlace(normal.scale(radius));
    var slime = new Slime({
        sphere: {
            global: {
                body: {
                    position: point,
                    acceleration: new Vector3(0, -0.2, 0),
                }
            },
            local: {
                body: {
                    mass: 1
                }
            }
        }
    })
    var sphere = new Sphere({
        global: {
            body: {
                position: point,
                acceleration: new Vector3(0, -0.2, 0),
            }
        },
        radius: radius,
    });
    // slime.setRestitution(0);
    // slime.setFriction(0.5);
    slime.addToWorld(this.world);
    entitySystem.register(slime);
    slime.setMeshAndAddToScene({}, this.graphicsEngine);
    slimes.push(slime);
}
hotbar.addAbility(ability1, 1);


var ability2 = new Ability({
    document: document,
    graphicsEngine: graphicsEngine,
    world: world
});
ability2.onActivate = function (timeHeld) {
    var intersection = graphicsEngine.raycastFirst();
    if (!intersection) {
        return;
    }
    // var radius = intersection.distance / 20;
    var radius = 10;
    var point = Vector3.from(intersection.point);
    var normal = Vector3.from(intersection.face.normal);
    point.addInPlace(normal.scale(radius));
    var slime = new Slime({
        sphere: {
            global: {
                body: {
                    position: point,
                    acceleration: new Vector3(0, -0.2, 0),
                }
            },
            local: {
                body: {
                    mass: 1
                }
            }
        },
        radius: radius
    })
    slime.addToWorld(this.world);
    entitySystem.register(slime);
    slime.setMeshAndAddToScene({}, this.graphicsEngine);
    slimes.push(slime);
}
hotbar.addAbility(ability2);



var ability3 = new Ability({
    document: document,
    graphicsEngine: graphicsEngine,
    world: world,
    reloadTime: 0
});
ability3.onActivate = function (timeHeld) {
    var intersection = graphicsEngine.raycastFirst();
    if (!intersection) {
        return;
    }
    // var radius = intersection.distance / 20;
    var radius = 1;
    var point = Vector3.from(intersection.point);
    var normal = Vector3.from(intersection.face.normal);
    point.addInPlace(normal.scale(radius));
    var sphere = new Sphere({
        global: {
            body: {
                position: player.composite.global.body.position.add(new Vector3(0, 2, 0)),
                acceleration: new Vector3(0, -0.2, 0),
            }
        },
        local: {
            body: {
                mass: 1000
            }
        },
        radius: radius
    })
    var direction = point.subtract(sphere.global.body.position);
    direction.y = 0;
    direction.normalizeInPlace();
    var addition = player.composite.global.body.getVelocity();
    if (addition.dot(direction) < 0) {
        addition = new Vector3(0, 0, 0);
    }
    sphere.global.body.setVelocity(direction.scale(0.3).add(addition));
    sphere.setRestitution(5);
    sphere.setFriction(1);
    sphere.addToWorld(this.world);
    sphere.addEventListener("postCollision", function (contact) {
        if(contact.body1.maxParent.id == sphere.maxParent.id){
            if(entitySystem.getEntityFromShape(contact.body2)?.isHealthUnit){
                sphere.toBeRemoved = true;
                entitySystem.getEntityFromShape(contact.body2).health -= 10;
                return;
            }
        }
        if(contact.body2.maxParent.id == sphere.maxParent.id){
            if(entitySystem.getEntityFromShape(contact.body1)?.isHealthUnit){
                sphere.toBeRemoved = true;
                entitySystem.getEntityFromShape(contact.body1).health -= 10;
                return;
            }
        }
        
        
    });
    sphere.collisionMask = 0;
    sphere.collisionMask = sphere.setBitMask(sphere.collisionMask, "B", true);
    sphere.canCollideWithMask = sphere.setBitMask(sphere.canCollideWithMask, "P", false);
    sphere.canCollideWithMask = sphere.setBitMask(sphere.canCollideWithMask, "B", false);
    sphere.setMeshAndAddToScene({}, this.graphicsEngine);
}
hotbar.addAbility(ability3);



var slimeSpawner = new SlimeSpawner({
    sphere: {
        global: {
            body: {
                position: new Vector3(40, 6.3, 0)
            }
        }
    }
});
slimeSpawner.setMeshAndAddToScene({}, graphicsEngine);
entitySystem.register(slimeSpawner);

slimeSpawner.addToWorld(world);
for (var i = 0; i < 1; i++) {
    slimes.push(slimeSpawner.spawnSlime(Slime, world, graphicsEngine));
}

setInterval(function () {
    if (slimes.length > 3) {
        return;
    }
    slimes.push(slimeSpawner.spawnSlime(Slime, world, graphicsEngine));
}, 1);


var s = slimeSpawner.spawnSlime(Slime, world, graphicsEngine);
s.getMainShape().global.body.setPosition(s.getMainShape().global.body.position.add(new Vector3(-50, 0, -50)));
targets.unshift(new Target({
    followID: s.id,
    threatLevel: Infinity
}))
slimes.push(s);
top.s = s;
for (var i = 0; i < 1; i++) {
    graphicsEngine.load('ground.glb', function (gltf) {
        gltf.scene.castShadow = true;
        gltf.scene.receiveShadow = true;

        gltf.scene.traverse(function (child) {
            child.castShadow = true;
            child.receiveShadow = true;
            //child.position.x += Math.random()*100



            if (child.isMesh) {
                var box = new Box({ local: { body: { mass: 1 } } }).fromMesh(child);
                box.setRestitution(0);
                box.setFriction(0);

                box.setLocalFlag(Composite.FLAGS.STATIC, true);
                world.addComposite(box);
                box.mesh = graphicsEngine.meshLinker.createMeshData(child.clone());


                if (child.name.toLowerCase().includes("checkpoint") || child.name.toLowerCase().includes("spawn")) {
                    if (child.name.toLowerCase().includes("spawn")) {
                        player.spawnPoint = box.global.body.position;
                        if (localStorage["spawnPoint"]) {
                            player.spawnPoint = Vector3.fromJSON(JSON.parse(localStorage["spawnPoint"]));
                        }
                    }
                    box.addEventListener("postCollision", function (contact) {
                        if (contact.body1.maxParent == player) {
                            player.spawnPoint = contact.body2.global.body.position;
                            localStorage["spawnPoint"] = JSON.stringify(player.spawnPoint.toJSON());
                        }
                        else if (contact.body2.maxParent == player) {
                            player.spawnPoint = contact.body1.global.body.position;
                            localStorage["spawnPoint"] = JSON.stringify(player.spawnPoint.toJSON());
                        }
                    });
                }
                graphicsEngine.addToScene(box.mesh.mesh);
            }
            else {
            }
        })
        player.respawn();

    });

}






var start = performance.now();
var fps = 20;
var steps = 0;
var previousWorld = 0;
function render() {
    //stats.begin();

    if (keyListener.isHeld("ArrowUp") || keyListener.isHeld("KeyW")) {
        cameraControls.forward();
    }
    if (keyListener.isHeld("ArrowDown") || keyListener.isHeld("KeyS")) {
        cameraControls.backward();
    }
    if (keyListener.isHeld("ArrowLeft") || keyListener.isHeld("KeyA")) {
        cameraControls.left();
    }
    if (keyListener.isHeld("ArrowRight") || keyListener.isHeld("KeyD")) {
        cameraControls.right();
    }
    if (keyListener.isHeld("Space")) {
        cameraControls.up();
    }
    if (keyListener.isHeld("ShiftLeft") || keyListener.isHeld("ShiftRight")) {
        cameraControls.down();
    }
    if (keyListener.isHeld("KeyO")) {
        cameraControls.zoomOut();
    }
    if (keyListener.isHeld("KeyI")) {
        cameraControls.zoomIn();
    }
    hotbar.update();
    player.updateHealthTexture(player.composite.mesh, graphicsEngine);
    for (var slime of slimes) {
        slime.updateHealthTexture(slime.sphere.mesh, graphicsEngine);
    }
    cameraControls.updateZoom();
    var now = performance.now();
    var delta = (now - start) / 1000;
    var steps2 = delta * fps;

    for (var i = 0; i < Math.floor(steps2 - steps); i++) {

        if (player.composite.global.body.position.y < -30) {
            player.respawn();
        }
        previousWorld = World.fromJSON(structuredClone(world.toJSON()), graphicsEngine);
        for (var slime of slimes) {
            slime.update(targets, world);
        }
        stats.begin();
        world.step();

        stats.end();
        steps++;

        if (cameraControls.movement.up && player.canJump) {
            var vel = player.composite.global.body.getVelocity();
            player.composite.global.body.setVelocity(new Vector3(vel.x, vel.y + player.jumpStrength * world.deltaTime, vel.z));
            player.canJump = false;
        }
        var delta2 = cameraControls.getDelta(graphicsEngine.camera);
        var delta3 = new Vector3(delta2.x, 0, delta2.z);
        delta3.normalizeInPlace();
        delta3.y = delta2.y;
        delta3.scaleInPlace(player.composite.global.body.mass * world.deltaTime).multiplyInPlace(player.moveStrength);
        var player_velocity = player.composite.global.body.getVelocity();
        player.composite.applyForce(delta3, player.composite.global.body.position);


    }
    var lerpAmount = (delta * fps - steps);



    graphicsEngine.update(previousWorld || world, world, lerpAmount);

    gameCamera.update(Vector3.from(player.getMainShape()?.mesh?.mesh?.position));
    graphicsEngine.render();
    requestAnimationFrame(render);

    //stats.end();
}


render();