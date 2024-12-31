
var Hotbar = class {
    constructor(options) {
        this.slotSize = options?.slots?.length ?? options?.slotSize ?? 9;
        this.slots = options?.slots ?? Array(this.slotSize).fill(null);
        this.hotbarItems = Array(this.slotSize).fill(null);
        this.activeSlot = options?.activeSlot ?? null;
        this.document = options.document;
        this.document.addEventListener("keydown", this._onKeyDown.bind(this));
    }

    _onKeyDown(event) {
        if(parseInt(event.key) >= 1 && parseInt(event.key) <= 9){
            var activeSlot = parseInt(event.key) - 1;
            if(this.activeSlot == activeSlot){
                this.activeSlot = null;
            }
            else{
                this.activeSlot = activeSlot;
            }
            this.update();
        }
    }

    createHTML(options) {
        var container = options.container;
        var aspectRatio = options.aspectRatio ?? 1;
        container.innerHTML = '';

        // Set the container's style for the hotbar
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.gap = '5px';
        container.style.padding = '10px';
        container.style.border = '1px solid black';
        container.style.boxSizing = 'border-box';

        // Create N elements and append them to the container
        for (let i = 0; i < this.slotSize; i++) {
            const hotbarItemContainer = document.createElement('div');
            hotbarItemContainer.style.flex = '1 1 0';
            hotbarItemContainer.style.display = 'flex';
            hotbarItemContainer.style.alignItems = 'center';
            hotbarItemContainer.style.justifyContent = 'center';
            
            const hotbarItem = document.createElement('div');
            hotbarItem.style.aspectRatio = aspectRatio.toString();
            hotbarItem.style.maxWidth = '100%';
            hotbarItem.style.maxHeight = '100%';
            hotbarItem.style.backgroundColor = 'gray';
            hotbarItem.style.position = 'relative';
            hotbarItem.textContent = i + 1;
            var updateSize = function(){
                var minWH = Math.min(hotbarItemContainer.clientWidth, hotbarItemContainer.clientHeight * aspectRatio);
                hotbarItem.style.width = minWH + 'px';
            }

            var resizeObserver = new ResizeObserver(updateSize);
            resizeObserver.observe(hotbarItemContainer);

            hotbarItemContainer.appendChild(hotbarItem);
            container.appendChild(hotbarItemContainer);
            
            this.hotbarItems[i] = hotbarItem;
        }
    }

    update() {
        for (let i = 0; i < this.slotSize; i++) {
            if(this.slots[i]){
                this.hotbarItems[i].style.backgroundColor = 'green';
            }
            else{
                this.hotbarItems[i].style.backgroundColor = 'gray';
            }
        }
        if(this.activeSlot != null){
            this.hotbarItems[this.activeSlot].style.backgroundColor = 'blue';
        }
    }
}

export default Hotbar;