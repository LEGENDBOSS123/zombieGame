import * as THREE from "three";
import Entity from "./Entity.mjs";

var HealthUnit = class extends Entity {
    constructor(options) {
        super(options);
        this.maxHealth = options?.maxHealth ?? 100;
        this.health = options?.health ?? this.maxHealth;
        this.isHealthUnit = true;
    }

    updateHealthTexture(model, graphicsEngine) {
        if (!model?.mesh?.healthInfo) {
            return;
        }
        model = model.mesh;
        var healthCanvas = model.healthInfo.canvas;
        var ctx = model.healthInfo.context;

        var texture = model.healthInfo.texture;
        var sprite = model.healthInfo.sprite;
        ctx.clearRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, healthCanvas.width, healthCanvas.height);

        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, healthCanvas.width * this.health / this.maxHealth, healthCanvas.height);
        texture.needsUpdate = true;
    }

    makeHealthSprite(model, scale, position) {
        if (!model?.mesh) {
            return;
        }
        model = model.mesh;
        var canv = document.createElement("canvas");
        canv.width = 100;
        canv.height = 100;
        var ctx = canv.getContext("2d");

        var texture = new THREE.CanvasTexture(canv);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        var material = new THREE.SpriteMaterial({
            map: texture
        });
        var sprite = new THREE.Sprite(material);
        model.healthInfo = {
            canvas: canv,
            context: ctx,
            sprite: sprite,
            texture: texture
        }
        sprite.scale.set(...scale);
        sprite.position.set(...position);
        model.add(sprite);
    }

    toJSON() {
        var json = {};
        json.health = this.health;
        return json;
    }

    static fromJSON(json, world) {
        var healthUnit = new this();
        healthUnit.health = json.health;
        return healthUnit;
    }
}


export default HealthUnit;