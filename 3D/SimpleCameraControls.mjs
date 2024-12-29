import Vector3 from "./Physics/Math3D/Vector3.mjs";

var SimpleCameraControls = class {
    constructor(options) {
        this.speed = options?.speed ?? 1;
        this.movement = { "forward": false, "backward": false, "left": false, "right": false, "up": false, "down": false, "zoom-in": false, "zoom-out": false };
        this.camera = options?.camera;
        this.pullbackRate = options?.pullbackRate ?? 0.5;

        this.rotateMethods = {
            "drag": options?.rotateMethods?.drag ?? true,
            "wheel": options?.rotateMethods?.wheel ?? true,
            "shiftLock": options?.rotateMethods?.shiftLock ?? true
        }
        this.rotateSensitivity = {
            "drag": options?.rotateSensitivity?.drag ?? 0.1,
            "wheel": options?.rotateSensitivity?.wheel ?? 0.1,
            "shiftLock": options?.rotateSensitivity?.shiftLock ?? 0.1
        }
        this.shiftLocked = false;
        this.isDragging = false;
        this.shiftLockCursor = options?.shiftLockCursor;

        this.window = options?.window || window;
        this.document = options?.document || document;
        this.renderDomElement = options?.renderDomElement || document.body;

        this.window.addEventListener('mousedown', function (e) {
            this.isDragging = true;
        }.bind(this));

        this.window.addEventListener('mouseup', function (e) {
            this.isDragging = false;
        }.bind(this));

        this.window.addEventListener('keydown', function (e) {
            if (e.key == "Shift") {
                if (!this.shiftLocked && this.rotateMethods.shiftLock) {
                    this.renderDomElement.requestPointerLock({
                        unadjustedMovement: true,
                    });
                }
                else {
                    this.document.exitPointerLock();
                }

            }
        }.bind(this));

        this.window.addEventListener('wheel', function (e) {
            if (!this.camera || !this.rotateMethods.wheel) {
                return;
            }
            this.camera.rotateY(e.deltaY * this.rotateSensitivity.wheel);
            this.camera.rotateX(-e.deltaX * this.rotateSensitivity.wheel);
        }.bind(this));

        window.addEventListener('mousemove', function (e) {
            if (!this.camera) {
                return;
            }
            if(this.rotateMethods.drag && this.isDragging){
                this.camera.rotateX(e.movementX * this.rotateSensitivity.drag);
                this.camera.rotateY(-e.movementY * this.rotateSensitivity.drag);
            }
            else if(this.rotateMethods.shiftLock && this.shiftLocked){
                this.camera.rotateX(e.movementX * this.rotateSensitivity.shiftLock);
                this.camera.rotateY(-e.movementY * this.rotateSensitivity.shiftLock);
            }
        }.bind(this));
        this.document.addEventListener("pointerlockchange", function (e) {
            if (this.document.pointerLockElement) {
                this.shiftLocked = true;
                this.shiftLockCursor.style.display = "block";

            } else {
                this.shiftLocked = false;
                this.shiftLockCursor.style.display = "none";
            }
        }.bind(this));
    }
    up() {
        this.movement.up = true;
    }
    down() {
        this.movement.down = true;
    }
    left() {
        this.movement.left = true;
    }
    right() {
        this.movement.right = true;
    }
    forward() {
        this.movement.forward = true;
    }
    backward() {
        this.movement.backward = true;
    }

    zoomIn() {
        this.movement["zoom-in"] = true;
    }

    zoomOut() {
        this.movement["zoom-out"] = true;
    }

    reset() {
        this.movement = { "forward": false, "backward": false, "left": false, "right": false, "up": false, "down": false, "zoom-in": false, "zoom-out": false };
    }

    getDelta() {
        var direction = this.camera.camera.getWorldDirection(new this.camera.camera.position.constructor(0, 0, 0));

        direction.y = 0;
        direction = direction.normalize()
        var delta = new Vector3(0, 0, 0);
        if (this.movement.forward) {
            delta.addInPlace(direction);
        }
        if (this.movement.backward) {
            delta.addInPlace(direction.clone().multiplyScalar(-1));
        }
        if (this.movement.left) {
            delta.addInPlace(new Vector3(direction.z, 0, -direction.x));
        }
        if (this.movement.right) {
            delta.addInPlace(new Vector3(-direction.z, 0, direction.x));
        }
        if (this.movement.up) {
            delta.addInPlace(new Vector3(0, 1, 0));
        }
        if (this.movement.down) {
            delta.addInPlace(new Vector3(0, -1, 0));
        }

        delta.normalize();
        delta.scale(this.speed);
        this.reset();
        return Vector3.from(delta);
    }

    updateZoom() {
        if (this.movement["zoom-in"]) {
            this.camera.zoom(-this.pullbackRate);
            this.movement["zoom-in"] = false;
        }
        if (this.movement["zoom-out"]) {
            this.camera.zoom(this.pullbackRate);
            this.movement["zoom-out"] = false;
        }
    }
};


export default SimpleCameraControls;