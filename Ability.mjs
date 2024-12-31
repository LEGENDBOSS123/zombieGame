
var Ability = class {
    constructor(options) {
        this.name = options?.name ?? "ABILITY";
        this.key = options?.key ?? null;
        this.holdTimeStamp = options?.holdTimeStamp ?? 0;
        this.holding = options?.holding ?? false;
        this.holdingTimeoutID = options?.holdingIntervalID ?? null;
        this.maxHoldTime = options?.maxHoldTime ?? 2000;

        this.document = options.document;
        this.reloadTime = options?.reloadTime ?? 1000;
        this.lastUsedTime = options?.lastUsedTime ?? 0;

        options.document.addEventListener("keydown", this._onKeyDown.bind(this));

        options.document.addEventListener("keyup", this._onKeyUp.bind(this));
    }

    _onKeyDown(event) {
        if (this.key == null || event.key != this.key) {
            return;
        }
        if (this.holding || this.lastUsedTime + this.reloadTime > performance.now()) {
            return;
        }
        this.holdTimeStamp = performance.now();
        this.holding = true;
        this.holdingTimeoutID = setTimeout(function () {
            this._activate(this.maxHoldTime);
        }.bind(this), this.maxHoldTime);
    }

    _onKeyUp(event) {
        if (this.key == null || event.key != this.key) {
            return;
        }
        if (!this.holding || this.lastUsedTime + this.reloadTime > performance.now()) {
            return;
        }
        clearTimeout(this.holdingTimeoutID);
        this._activate(performance.now() - this.holdTimeStamp);
    }

    _activate(timeHeld) {
        this.holding = false;
        this.onActivate(timeHeld);
        this.lastUsedTime = performance.now();
    }

    onActivate(timeHeld) {
        console.log("Ability Activated for " + timeHeld + "ms.");
    }
}


export default Ability;