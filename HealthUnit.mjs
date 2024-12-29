

var HealthUnit = class {
    constructor(options){
        this.health = options?.health ?? 100;
    }

    toJSON(){
        var json = {};
        json.health = this.health;
        return json;
    }

    static fromJSON(json, world){
        var healthUnit = new this();
        healthUnit.health = json.health;
        return healthUnit;
    }
}


export default HealthUnit;