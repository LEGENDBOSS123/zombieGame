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
import Timer from "./Timer.mjs";
import ParticleSystem from "./ParticleSystem.mjs";
import Particle from "./Particle.mjs";

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
// graphicsEngine.disableAO();
// graphicsEngine.disableShadows();


graphicsEngine.renderDistance = 2048;
graphicsEngine.cameraFar = 4096;
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
    moveStrength: new Vector3(0.2, 0.05, 0.2).scale(3),
    jumpStrength: 0.75,
    global: {
        body: {
            acceleration: new Vector3(0, gravity, 0),
            position: new Vector3(0, 80, 0),
            // linearDamping: new Vector3(0.05, 0, 0.05),
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
    world: world,
    name: "Mini Slime"
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
    world: world,
    name: "Big Slime"
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
    reloadTime: 0,
    name: "Bullets"
});
ability3.onActivate = function (timeHeld) {
    var intersection = graphicsEngine.raycastFirst();
    if (!intersection) {
        return;
    }
    var radius = 0.5;
    var point = Vector3.from(intersection.point);
    var normal = Vector3.from(intersection.face.normal);
    point.addInPlace(normal.scale(radius));
    var sphere = new Sphere({
        global: {
            body: {
                position: player.composite.global.body.position.add(new Vector3(0, -1, 0)),
                acceleration: new Vector3(0, -0.2, 0),
            }
        },
        local: {
            body: {
                mass: 0.3
            }
        },
        width: radius,
        height: radius,
        depth: radius,
        radius: radius
    })
    var direction = point.subtract(sphere.global.body.position);
    direction.y = 0;
    direction.normalizeInPlace();
    var addition = player.composite.global.body.getVelocity();
    if (addition.dot(direction) < 0) {
        addition = new Vector3(0, 0, 0);
    }
    sphere.global.body.setVelocity(direction.scale(2).add(addition));
    sphere.setRestitution(-100);
    sphere.setFriction(0);
    sphere.addToWorld(this.world);
    sphere.addEventListener("postCollision", function (contact) {
        if (sphere.toBeRemoved) {
            return;
        }
        var dmg = Math.floor(Math.random() * 30) + 10;
        if (contact.body1.maxParent.id == sphere.maxParent.id) {
            if (entitySystem.getEntityFromShape(contact.body2)?.isHealthUnit) {
                // sphere.toBeRemoved = true;
                addParticle(contact.body2.global.body.position.copy(), dmg);
                entitySystem.getEntityFromShape(contact.body2).health -= dmg;
                return;
            }
        }
        if (contact.body2.maxParent.id == sphere.maxParent.id) {
            if (entitySystem.getEntityFromShape(contact.body1)?.isHealthUnit) {
                // sphere.toBeRemoved = true;
                addParticle(contact.body1.global.body.position.copy(), dmg);
                entitySystem.getEntityFromShape(contact.body1).health -= dmg;
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






var addParticle = function (position, damage) {
    var particle = new Particle({
        position: position.add(new Vector3(0, 3, 0)),
        duration: 1250,
        swaySpeed: 0.01,
        size: Math.max(-0.25 + damage * 0.1, 0.5),
        swayStrength: -0.1 + damage * 0.01,
        text: "-" + damage.toString(),
        color: "rgb(200, 36, 21)",
        velocity: new Vector3(0, 0.006, 0),
        damping: 0.005,
        fadeOutSpeed: 0.2,
        fadeInSpeed: 0.2,
        growthSpeed: 0.2,
        shrinkSpeed: 0.2,
    });
    particleSystem.addParticle(particle);
}

top.addParticle = addParticle;


var slimeSpawner = new SlimeSpawner({
    sphere: {
        global: {
            body: {
                position: new Vector3(40, -6.3, 0)
            }
        }
    }
});
slimeSpawner.setMeshAndAddToScene({}, graphicsEngine);
entitySystem.register(slimeSpawner);

//slimeSpawner.addToWorld(world);
// for (var i = 0; i < 1; i++) {
//     slimes.push(slimeSpawner.spawnSlime(Slime, world, graphicsEngine));
// }

var interv = setInterval(function () {

    if (slimes.length > 0) {
        return;
    }
    //slimes.push(slimeSpawner.spawnSlime(Slime, world, graphicsEngine));
}, 1);


// var s = slimeSpawner.spawnSlime(Slime, world, graphicsEngine);
// s.getMainShape().global.body.setPosition(s.getMainShape().global.body.position.add(new Vector3(-50, 0, -50)));
// // targets.unshift(new Target({
// //     followID: s.id,
// //     threatLevel: Infinity
// // }))
// slimes.push(s);
// top.s = s;
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

var topArray = [];
var bottomArray = [];
for (var i = 0; i < 10; i++) {
    var append = [];
    var append2 = [];
    for (var j = 0; j < 10; j++) {
        append.push(i + j * 10);
        append2.push(Math.sin(i + j) * 20 - 100);
    }
    topArray.push(append);
    bottomArray.push(append2);
}

// var terrain3 = Terrain3.from2dArrays(topArray, bottomArray);
// terrain3.setTerrainScale(40);
// terrain3.global.body.position = new Vector3(0, -100, 0);
// terrain3.global.body.setVelocity(new Vector3(0,0,0));
// terrain3.local.body.mass = Infinity;
// terrain3.setLocalFlag(Composite.FLAGS.STATIC, true);
// terrain3.setMesh({}, graphicsEngine);
// terrain3.addToScene(graphicsEngine.scene);
// world.addComposite(terrain3);
// top.terrain3 = terrain3;


var img = new Image();
img.src = "h.png"
// var terrain3 = Terrain3.fromDimensions(512, 512);
// terrain3.setTerrainScale(20);
img.onload = function () {
    console.log(img);

    var width = img.width;
    var height = img.height;
    var terrain3 = Terrain3.fromDimensions(width, height);
    terrain3.setTerrainScale(20);
    var arr = Terrain3.getArrayFromImage(img, 10);
    var arr2 = structuredClone(arr).flat();
    for (var i in arr2) {
        arr2[i] -= 1000;
    }
    var terr = Terrain3.from2dArrays(arr, arr2);
    terrain3.setMaps(terr.heightmaps.top.map, terr.heightmaps.bottom.map);

    terrain3.global.body.position = new Vector3(0, -1000, 0);
    terrain3.global.body.setVelocity(new Vector3(0, 0, 0));
    terrain3.local.body.mass = Infinity;
    terrain3.setLocalFlag(Composite.FLAGS.STATIC, true);
   
    world.addComposite(terrain3);
    top.terrain3 = terrain3;
    graphicsEngine.load("c" + ".png", function (txt) {
        var terrain3Material = new THREE.MeshPhongMaterial({ map: txt, vertexColors: true });
        terrain3.setMeshAndAddToScene({
            material: terrain3Material,
        }, graphicsEngine);
    });
}



var start = performance.now();
var fps = 20;
var steps = 0;
var timeAccumulated = 0;
var previousWorld = 0;

var timer = new Timer();
var stepper = new Timer.Interval(1000 / fps);
timer.schedule(stepper);
var particleSystem = new ParticleSystem({
    timer: timer,
    graphicsEngine: graphicsEngine
})
top.particleSystem = particleSystem;
function render() {
    stats.begin();

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


    stepper.job = function () {
        if (player.composite.global.body.position.y < -30) {
            //player.respawn();
        }
        previousWorld = World.fromJSON(structuredClone(world.toJSON()), graphicsEngine);
        for (var slime of slimes) {
            slime.update(targets, world);
        }
        // stats.begin();
        world.step();

        // stats.end();
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




    var lerpAmount = stepper.getLerpAmount();



    graphicsEngine.update(previousWorld || world, world, lerpAmount);

    gameCamera.update(Vector3.from(player.getMainShape()?.mesh?.mesh?.position));
    particleSystem.update();
    graphicsEngine.render();
    timer.step();
    requestAnimationFrame(render);

    stats.end();
}


render();