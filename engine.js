
const imageFile = path => callback => {
    const img = new Image();
    img.onload = () => callback(img);
    img.src = path;
};

const textFile = path => callback => fetch(path)
        .then(r => r.text())
        .then(c => callback(c));

const engine = {
    loadQueue: [],
    loaded: false,
    load: function(r) {
        const engine = this;
        const queueItem = { loaded: false, value: null };
        r((value) => {
            queueItem.loaded = true;
            queueItem.value = value;
            let allLoaded = true;
            for(const queued of engine.loadQueue) {
                if(!queued.loaded) {
                    allLoaded = false;
                    break;
                }
            }
            if(allLoaded) {
                engine.init();
            }
        });
        this.loadQueue.push(queueItem);
        return queueItem;
    },

    canvas: null,
    g: null,
    pressedKeys: {},
    init: function() {
        // init graphics
        this.canvas = document.createElement("canvas");
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0px";
        this.canvas.style.left = "0px";
        this.canvas.style.width = "100vw";
        this.canvas.style.height = "100vh";
        document.body.appendChild(this.canvas);
        this.g = this.canvas.getContext("2d");
        // init user input
        window.addEventListener("keydown", e => {
            this.pressedKeys[e.code] = true;
        });
        window.addEventListener("keyup", e => {
            this.pressedKeys[e.code] = false;
        });
        // complete init
        this.loaded = true;
        if(this.frameHandler !== undefined) {
            this.gameloop(this.frameHandler);
        }
    },

    keyPressed: function(key) {
        return this.pressedKeys[key] === true;
    },

    frameHandler: undefined,
    lastTimestamp: undefined,
    deltaTime: 0,
    gameloop: function(f) {
        if(!this.loaded) {
            this.frameHandler = f;
            return;
        }
        const frame = (timestamp) => {
            // calculate deltaTime
            if(this.lastTimestamp !== undefined) {
                this.deltaTime = (timestamp - this.lastTimestamp) / 1000;
            }
            this.lastTimestamp = timestamp;
            // do canvas fuckery
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.g.imageSmoothingEnabled = false;
            // run handler
            f();
            // request next frame
            window.requestAnimationFrame(frame);
        };
        window.requestAnimationFrame(frame);
    },

    drawRect: function(x, y, w, h, r, g, b, a) {
        if(a === undefined) {
            a = 255;
        }
        this.g.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        this.g.fillRect(x, y, w, h);
    },

    drawImage: function(img, x, y, w, h, sx, sy, sw, sh) {
        if(sx === undefined) { sx = 0; }
        if(sy === undefined) { sy = 0; }
        if(sw === undefined) { sw = img.width; }
        if(sh === undefined) { sh = img.height; }
        this.g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
};

engine.load(callback => {
    window.onload = callback;
});