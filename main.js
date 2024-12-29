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

import Stats from "./3D/Web/Stats.mjs"
import GraphicsEngine from "./3D/Graphics/GraphicsEngine.mjs";
import ZombieSpawner from "./ZombieSpawner.mjs";

import * as THREE from "three";
import Target from "./Target.mjs";
import Zombie from "./Zombie.mjs";
top.Box = Box;
top.World = World;
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
<<<<<<< HEAD


=======
>>>>>>> da3e335bf7af12987754a289b4bd05f5e4eccec1
graphicsEngine.renderDistance = 1024;
graphicsEngine.cameraFar = 2048;
window.graphicsEngine = graphicsEngine;


<<<<<<< HEAD

=======
>>>>>>> da3e335bf7af12987754a289b4bd05f5e4eccec1
var assetManager = new AssetManager({
    loader: new THREE.TextureLoader()
});

assetManager.loadAll([
    { name: "rug", file: "rug.jpg" },
    { name: "grass", file: "grass.png" },
    { name: "rocky ground", file: "rockyGround.jpg" }
<<<<<<< HEAD


=======
>>>>>>> da3e335bf7af12987754a289b4bd05f5e4eccec1
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
var zombies = [];

window.player = new Player({
    radius: 0.5,
    moveStrength: new Vector3(0.3, 0.05, 0.3),
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
//window.player = player;

// graphicsEngine.load('3D/Graphics/Textures/metal_grate_rusty_1k.gltf/metal_grate_rusty_1k.gltf', function (gltf) {
//     gltf.scene.traverse(function (child) {
//         if (child.isMesh) {
//             child.castShadow = true;
//             child.receiveShadow = true;
//         }
//     })
//     var scaleFactor = 4;
//     player.spheres.forEach(function (e) {
//         e.mesh = gltf.scene.clone();
//         e.mesh.mesh.scale.set(player.composite.children[0].radius * scaleFactor, player.composite.children[0].radius * scaleFactor, player.composite.children[0].radius * scaleFactor);
//         graphicsEngine.addToScene(e.mesh.mesh);
//     })
// });

player.setMeshAndAddToScene({}, graphicsEngine);
player.addToWorld(world);

targets.push(new Target({
    followID: player.composite.id,
    threatLevel: Infinity
}))



var zombieSpawner = new ZombieSpawner({
    global: {
        body: {
            position: new Vector3(100, 6.3, 0)
        }
    }
});
zombieSpawner.addToWorld(world);
zombieSpawner.setMeshAndAddToScene({}, graphicsEngine);
for(var i = 0; i< 20; i++){
    zombies.push(zombieSpawner.spawnZombie(Zombie, world, graphicsEngine));
}


for (var i = 0; i < 1; i++) {
    graphicsEngine.load('ground.glb', function (gltf) {
        gltf.scene.castShadow = true;
        gltf.scene.receiveShadow = true;

        gltf.scene.traverse(function (child) {
            child.castShadow = true;
            child.receiveShadow = true;
            //child.position.x += Math.random()*100



            if (child.isMesh) {
                var box = new Box({ local: { body: { mass: Infinity } } }).fromMesh(child);
                box.setRestitution(0);
                box.setFriction(0);
                box.setLocalFlag(Composite.FLAGS.STATIC, true);
                world.addComposite(box);
                box.mesh = child.clone();


                if (child.name.toLowerCase().includes("checkpoint") || child.name.toLowerCase().includes("spawn")) {
                    if (child.name.toLowerCase().includes("spawn")) {
                        player.spawnPoint = box.global.body.position;
                        if (localStorage["spawnPoint"]) {
                            player.spawnPoint = Vector3.fromJSON(JSON.parse(localStorage["spawnPoint"]));
                        }
                    }
                    box.postCollisionCallback = function (contact) {
                        if (contact.body1.maxParent == player) {
                            player.spawnPoint = contact.body2.global.body.position;
                            localStorage["spawnPoint"] = JSON.stringify(player.spawnPoint.toJSON());
                        }
                        else if (contact.body2.maxParent == player) {
                            player.spawnPoint = contact.body1.global.body.position;
                            localStorage["spawnPoint"] = JSON.stringify(player.spawnPoint.toJSON());
                        }
                    }
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
    cameraControls.updateZoom();
    var now = performance.now();
    var delta = (now - start) / 1000;
    var steps2 = delta * fps;

    for (var i = 0; i < Math.floor(steps2 - steps); i++) {

        for (var child of world.composites) {
            if (!child.previousPosition) {
                child.previousPosition = child.global.body.position.copy();
                child.previousRotation = child.global.body.rotation.copy();
            }

            child.previousPosition = child.global.body.position.copy();
            child.previousRotation = child.global.body.rotation.copy();
        }
        if (player.composite.global.body.position.y < -30) {
            //respawn();
        }
        previousWorld = World.fromJSON(structuredClone(world.toJSON()), graphicsEngine);
        //top.world = setWorld(World.fromJSON(structuredClone(world.toJSON()), graphicsEngine));
        for(var zombie of zombies){
            zombie.update(targets, world);
        }
        world.step();
        
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
    for (var child of world.composites) {
        if (!child.previousPosition) {
            child.previousPosition = child.global.body.position.copy();
            child.previousRotation = child.global.body.rotation.copy();
        }
        if (child.mesh) {
            child.mesh.mesh.position.set(...child.previousPosition.lerp(child.global.body.position, lerpAmount));
            child.mesh.mesh.quaternion.slerpQuaternions(child.previousRotation, new THREE.Quaternion().copy(child.global.body.rotation), lerpAmount);
        }
    }



    graphicsEngine.update(previousWorld || world, world, lerpAmount);
    gameCamera.update(player.getMeshTargetPosition());
    //gameCamera.update(player.composite.previousPosition.lerp(player.composite.global.body.position, lerpAmount));
    graphicsEngine.render();
    requestAnimationFrame(render);

    stats.end();
}


render();