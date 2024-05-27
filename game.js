
function aabbCollision(xA, yA, wA, hA, xB, yB, wB, hB) {
    return xA + wA >= xB
        && xB + wB >= xA
        && yA + hA >= yB
        && yB + hB >= yA;
}


function addNoteLink(url) {
    const e = document.createElement("div");
    e.innerHTML = `<a href=\"${url}\" target=\"_blank\">${url}</a>`;
    const notes = document.getElementById("notes");
    for(const note of notes.children) {
        if(note.innerHTML === e.innerHTML) {
            return;
        }
    }
    notes.appendChild(e);
    notes.scrollTo(0, notes.scrollHeight);
}


const camera = {
    x: 0.0,
    y: 0.0,

    minX: 0,
    maxX: Infinity,
    minY: 0,
    maxY: Infinity,
    distance: 100,

    pxSize: 0,
    offsetX: 0,
    offsetY: 0,
    computeOffsets: function() {
        // compute px size on screen
        this.pxSize = Math.min(engine.canvas.width, engine.canvas.height) 
            / this.distance;
        // compute offsets
        this.offsetX = -this.x * this.pxSize + engine.canvas.width / 2;
        const minX = this.minX * this.pxSize;
        if(this.offsetX > minX) { this.offsetX = minX; }
        const maxX = -this.maxX * this.pxSize + engine.canvas.width;
        if(this.offsetX < maxX) { this.offsetX = maxX; }
        this.offsetY = -this.y * this.pxSize + engine.canvas.height / 2;
        const minY = this.minY * this.pxSize;
        if(this.offsetY > minY) { this.offsetY = minY; }
        const maxY = -this.maxY * this.pxSize + engine.canvas.height;
        if(this.offsetY < maxY) { this.offsetY = maxY; }
    },

    onScreenX: function(x) {
        return x * this.pxSize + this.offsetX;
    },
    onScreenY: function(y) {
        return y * this.pxSize + this.offsetY;
    },
    onScreenS: function(s) {
        return s * this.pxSize;
    }
};


const BACKGROUND_IMAGE = engine.load(imageFile("res/background.png"));

function drawBackground() {
    camera.maxX = BACKGROUND_IMAGE.value.width;
    camera.maxY = BACKGROUND_IMAGE.value.height;
    engine.drawImage(
        BACKGROUND_IMAGE.value,
        camera.onScreenX(0),
        camera.onScreenY(0),
        camera.onScreenS(BACKGROUND_IMAGE.value.width),
        camera.onScreenS(BACKGROUND_IMAGE.value.height)
    );
}


let dialogueQueue = [];
let displayedDialogue = null;

function dialogueText(text, handler) {
    return {
        type: "text", value: text, handler: handler
    };
}

function dialogueChoice(choices, handler) {
    return {
        type: "choice", value: choices, handler: handler
    };
}

function dialogueStart(dialogue, origin) {
    if(displayedDialogue !== null) {
        dialogueQueue.push({ dialogue: dialogue, origin: origin });
        return;
    }
    displayedDialogue = { 
        dialogue: dialogue, origin: origin,
        timer: 0, endTime: Infinity
    };
    const d = document.getElementById("dialogue");
    d.hidden = false;
    if(dialogue.handler) {
        dialogue.handler();
    }
    switch(dialogue.type) {
        case "choice": {
            d.innerHTML = "";
            for(const choice in dialogue.value) {
                const c = document.createElement("p");
                c.innerHTML = choice;
                c.onclick = () => {
                    const after = dialogueQueue;
                    dialogueQueue = [];
                    for(const cd of dialogue.value[choice]) {
                        dialogueQueue.push({ dialogue: cd, origin: origin });
                    }
                    dialogueQueue.push(...after);
                    dialogueEnd();
                };
                d.appendChild(c);
            }
        } break;
        case "text": {
            d.innerHTML = dialogue.value;
            displayedDialogue.endTime = 3.0;
        } break;
    }
}

function dialogueUpdate() {
    if(displayedDialogue === null) {
        return;
    }
    displayedDialogue.timer += engine.deltaTime;
    if(displayedDialogue.timer >= displayedDialogue.endTime) {
        dialogueEnd();
    }
}

function dialogueEnd() {
    const d = document.getElementById("dialogue");
    d.hidden = true;
    displayedDialogue = null;
    if(dialogueQueue.length > 0) {
        const qi = dialogueQueue.shift();
        dialogueStart(qi.dialogue, qi.origin);
    }
}


function createBooth(image, x, y, colliders, interactions, npcs) {
    return {
        image: image,
        x: x * 16, 
        y: y * 16,
        colliders: colliders,
        interactions: interactions,
        npcs: npcs
    }
}

function createCollider(x, y, w, h) {
    return { x: x, y: y, w: w, h: h };
}

function createInteraction(x, y, message) {
    return { x: x, y: y, message: message };
}

const NPC_IMAGE = engine.load(imageFile("res/npc.png"));

function createNPC(x, y, id, dialogue) {
    return { 
        x: x, y: y, 
        width: 11,
        height: 19,
        id: id, 
        interacts: false,
        frame: 0,
        frameTimer: Math.random(),
        frameDelta: 1.0,
        frameCount: 4,
        dialogue: dialogue 
    };
}

const booths = [
    createBooth(
        engine.load(imageFile("res/countryside-booth.png")),
        10, 6,
        [
            createCollider(0, 0, 80, 32), // back wall
            createCollider(17, 11, 7, 30), // lamp
            createCollider(38, 32, 33, 15), // back two pots
            createCollider(49, 47, 17, 14), // front pot
            createCollider(14, 53, 14, 36) // desk
        ],
        [
            createInteraction(20, 30, "Seems like it's a prop from the game...") // lamp
        ],
        [
            createNPC(33, 72, 7, [
                dialogueText("Mommy said I am not allowed to play Countryside."),
                dialogueText("But it's not that scary, so it's probably fine."),
                dialogueText(
                    "You wanna play Countryside as well?",
                    () => addNoteLink("https://typesafeschwalbe.itch.io/countryside")
                )
            ]) // desk
        ]
    ),
    createBooth(
        engine.load(imageFile("res/currant-booth.png")), 
        28, 6,
        [
            createCollider(0, 0, 128, 32), // back wall
            createCollider(7, 32, 13, 14), // top left flower pot
            createCollider(26, 11, 13, 35), // trophy box
            createCollider(44, 45, 14, 36), // desk
            createCollider(91, 20, 28, 44), // board
            createCollider(105, 81, 14, 26) // bottom right flower pot
        ],
        [
            createInteraction(
                104, 41, 
                "\"Currant is a multi-paradigm, high-Level programming language."
                    + " It emphasizes simplicity and consistency.\""
            ) // board
        ],
        [
            createNPC(63, 65, 6, [
                dialogueText("Currant certainly is one of the programming languages of all time."),
                dialogueText("It was the first full-fledged programming language TypeSafeSchwalbe ever made."),
                dialogueText("That's also why it features some..."),
                dialogueText("...interesting design decisions."),
                dialogueText(
                    "You can check out the Currant website if you're interested.",
                    () => addNoteLink("https://currant.netlify.app/")
                )
            ]) // desk
        ]
    ),
    createBooth(
        engine.load(imageFile("res/discord-booth.png")), 
        0, 15, 
        [
            createCollider(0, 0, 64, 32), // back wall
            createCollider(2, 10, 22, 36), // board
            createCollider(18, 44, 14, 36), // desk
        ],
        [],
        [
            createNPC(12, 64, 1, [
                dialogueText("Yes, TypeSafeSchwalbe is on Discord."),
                dialogueText("His username is 'typesafeschwalbe'.")
            ]) // desk
        ]
    ),
    createBooth(
        engine.load(imageFile("res/gera-booth.png")), 
        10, 14,
        [
            createCollider(0, 0, 192, 32), // back wall
            createCollider(25, 17, 49, 36), // TV
            createCollider(120, 11, 13, 35), // trophy box
            createCollider(87, 50, 19, 27), // right couch
            createCollider(158, 48, 14, 36), // right desk
            createCollider(15, 99, 14, 36), // left desk
            createCollider(53, 79, 24, 23), // left couch
            createCollider(111, 89, 34, 31), // left board
            createCollider(148, 89, 28, 44) // right board
        ],
        [
            createInteraction(
                49, 28, 
                "Looks like some Gera code is on screen."
            ), // TV
            createInteraction(
                128, 103, 
                "\"Gera - A high-level, procedural,"
                    + " compiled and garbage-collected programming language"
                    + " without type annotations.\""
            ), // left board
            createInteraction(
                161, 110,
                "\"Gera is a language that attempts to be simple"
                    + " while still being nice to use.\""
            ) // right board
        ],
        [
            createNPC(35, 118, 2, [
                dialogueText("The Gera programming language..."),
                dialogueText(
                    "TypeSafeSchwalbe developed it over the course of over 8 months..."
                ),
                dialogueText(
                    "and it is one of the projects he is most proud of."
                ),
                dialogueText(
                    "You can learn more on the Gera website.",
                    () => addNoteLink("https://geralang.netlify.app/")
                )
            ]), // left desk
            createNPC(158, 69, 3, [
                dialogueText("I will talk about Gera for hours if you let me."),
                dialogueText("Gera is so simple and elegant, I adore it."),
                dialogueText("In fact, I am playing around with it right now.")
            ])
        ]
    ),
    createBooth(
        engine.load(imageFile("res/lania-booth.png")),
        17, 6,
        [
            createCollider(0, 0, 80, 32), // back wall
            createCollider(3, 12, 22, 45), // TV
            createCollider(43, 32, 19, 27), // top couch
            createCollider(7, 68, 24, 23), // bottom couch
            createCollider(57, 66, 14, 36), // desk
        ],
        [
            createInteraction(
                14, 31, 
                "There is a terminal on screen."
                    + " Looks like 'lania' has been executed a number of times."
            ) // TV
        ],
        [
            createNPC(51, 88, 8, [
                dialogueText("Lania is a turn-based strategy game made by TypeSafeSchwalbe."),
                dialogueText("It's written from scratch in C and runs completely within the terminal."),
                dialogueText(
                    "You can play it yourself by downloading it from Github.",
                    () => addNoteLink("https://github.com/typesafeschwalbe/lania")
                )
            ]) // desk
        ]
    ),
    createBooth(
        engine.load(imageFile("res/rosequartz-booth.png")), 
        0, 6,
        [
            createCollider(0, 0, 64, 32), // back wall
            createCollider(5, 32, 7, 8), // elevated TV
            createCollider(18, 44, 14, 36), // desk
            createCollider(0, 77, 29, 48), // TV
            createCollider(37, 104, 7, 21), // crystal
        ],
        [
            createInteraction(
                15, 95, 
                "The TV shows a loading screen."
                    + " A small crystal is spinning in the bottom right."
            ) // TV
        ],
        [
            createNPC(12, 66, 0, [
                dialogueText("Rose Quartz, huh..."),
                dialogueText("What do you want to know?"),
                dialogueChoice({
                    "What?": [
                        dialogueText("Well, Rose Quartz is a game engine."),
                        dialogueText("You can use it to like..."),
                        dialogueText("make games and stuff.")
                    ],
                    "Who?": [
                        dialogueText("TypeSafeSchwalbe made it.")
                    ],
                    "Where?": [
                        dialogueText(
                            "You can get it on Itch.io.",
                            () => addNoteLink("https://typesafeschwalbe.itch.io/rosequartz")
                        ),
                        dialogueText(
                            "And there are some usage examples on Github too, I guess...",
                            () => addNoteLink("https://github.com/typesafeschwalbe/rosequartz-examples")
                        )
                    ]
                })
            ]) // desk
        ]
    ),
    createBooth(
        engine.load(imageFile("res/silicon-runes-booth.png")), 
        28, 14,
        [
            createCollider(0, 0, 128, 32), // back wall
            createCollider(14, 94, 14, 36), // desk
            createCollider(77, 34, 3, 8), // candle (N)
            createCollider(102, 45, 3, 8), // candle (NE)
            createCollider(113, 68, 3, 8), // candle (E)
            createCollider(102, 89, 3, 8), // candle (SE)
            createCollider(78, 104, 3, 8), // candle (S)
            createCollider(54, 91, 3, 8), // candle (SW)
            createCollider(43, 67, 3, 8), // candle (W)
            createCollider(56, 45, 3, 8), // candle (NW)
            createCollider(75, 71, 9, 5) // CPU
        ],
        [
            createInteraction(
                79, 68,
                "A small chip is in the center of the summoning circle."
                    + " Looking closer, it reads \"Made in China\"."
            )
        ],
        [
            // left side of circle
            createNPC(66, 44, 4, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(47, 61, 4, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(47, 87, 4, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(65, 105, 4, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            // right side of circle
            createNPC(91, 46, 5, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(109, 61, 5, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(110, 86, 5, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            createNPC(95, 104, 5, [
                dialogueText("O magne silicium, redibit creator tuus.")
            ]),
            // desk
            createNPC(34, 113, 5, [
                dialogueText(
                    "We believe in the return of the ancient civilization that"
                        + " once tricked rocks into thinking for them."
                ),
                dialogueText(
                    "They instructed these rocks in cryptic runes, which we seek to decipher.",
                    () => addNoteLink("https://github.com/typesafeschwalbe/silicon-runes")
                )
            ])
        ]
    )
];

function collidesWithBooth(x, y, w, h) {
    for(const b of booths) {
        for(const c of b.colliders) {
            if(aabbCollision(x, y, w, h, c.x + b.x, c.y + b.y, c.w, c.h)) {
                return true;
            }
        }
        for(const n of b.npcs) {
            if(aabbCollision(
                x, y, w, h, 
                b.x + n.x - n.width / 2, b.y + n.y - 1, n.width, 1
            )) {
                return true;
            }
        }
    }
    return false;
}

const INTERACTION_DISTANCE = 32;
let walkedSinceInteract = false;

function doBoothInteractions() {
    walkedSinceInteract |= player.walking;
    if(!walkedSinceInteract || player.walking) {
        return;
    }
    for(const b of booths) {
        for(const i of b.interactions) {
            const d = Math.hypot(b.x + i.x - player.x, b.y + i.y - player.y);
            if(d > INTERACTION_DISTANCE) {
                continue;
            }
            dialogueStart(dialogueText(i.message), { x: b.x + i.x, y: b.y + i.y });
            walkedSinceInteract = false;
        }
    }
}

function drawBooths() {
    for(const booth of booths) {
        engine.drawImage(
            booth.image.value,
            camera.onScreenX(booth.x), 
            camera.onScreenY(booth.y),
            camera.onScreenS(booth.image.value.width), 
            camera.onScreenS(booth.image.value.height)
        );
    }
}

function updateBoothNPCs() {
    walkedSinceInteract |= player.walking;
    for(const booth of booths) {
        for(const npc of booth.npcs) {
            npc.frameTimer += engine.deltaTime;
            if(npc.frameTimer >= npc.frameDelta) {
                npc.frame = (npc.frame + 1) % npc.frameCount;
                npc.frameTimer %= npc.frameDelta;
            }
            npc.interacts = INTERACTION_DISTANCE > Math.hypot(
                booth.x + npc.x - player.x,
                booth.y + npc.y - player.y
            );
            if(npc.interacts && walkedSinceInteract && !player.walking) {
                for(const d of npc.dialogue) {
                    dialogueStart(d, { x: booth.x + npc.x, y: booth.y + npc.y });
                }
                walkedSinceInteract = false;
            }
        }
    }
}

function drawBoothNPCsBehind() {
    for(const b of booths) {
        for(const n of b.npcs) {
            if(b.y + n.y > player.y) {
                continue;
            }
            engine.drawImage(
                NPC_IMAGE.value,
                camera.onScreenX(b.x + n.x - n.width / 2), 
                camera.onScreenY(b.y + n.y - n.height),
                camera.onScreenS(n.width), camera.onScreenS(n.height),
                n.interacts? 0 : (n.frame + 1) * n.width,
                n.id * n.height,
                n.width, n.height
            );
        }
    }
}

function drawBoothNPCsFront() {
    for(const b of booths) {
        for(const n of b.npcs) {
            if(b.y + n.y <= player.y) {
                continue;
            }
            engine.drawImage(
                NPC_IMAGE.value,
                camera.onScreenX(b.x + n.x - n.width / 2), 
                camera.onScreenY(b.y + n.y - n.height),
                camera.onScreenS(n.width), camera.onScreenS(n.height),
                n.interacts? 0 : (n.frame + 1) * n.width,
                n.id * n.height,
                n.width, n.height
            );
        }
    }
}

function collidesWithWorld(x, y, w, h) {
    return collidesWithBooth(x, y, w, h)
        || x < 0
        || y < 64
        || x + w > BACKGROUND_IMAGE.value.width
        || y + h > BACKGROUND_IMAGE.value.height;
}


const PLAYER_IMAGE = engine.load(imageFile("res/player.png"));

const player = {
    x: 50,
    y: 430,

    width: 11,
    height: 19,

    walking: false,
    facingRight: true,
    walkFrame: 0,
    frameTimer: 0,
    frameDelta: 0.1,
    frameCount: 4,

    walkSpeed: 40,

    move: function () {
        let movementX = 0;
        let movementY = 0;
        if(engine.keyPressed("ArrowLeft") || engine.keyPressed("KeyA")) {
            movementX -= 1;
        }
        if(engine.keyPressed("ArrowRight") || engine.keyPressed("KeyD")) {
            movementX += 1;
        }
        if(engine.keyPressed("ArrowUp") || engine.keyPressed("KeyW")) {
            movementY -= 1;
        }
        if(engine.keyPressed("ArrowDown") || engine.keyPressed("KeyS")) {
            movementY += 1;
        }
        const movementLen = Math.hypot(movementX, movementY);
        this.walking = movementLen > 0;
        if(this.walking) {
            document.getElementById("move-prompt").hidden = true;
        }
        if(movementX > 0) { 
            this.facingRight = true;
        }
        if(movementX < 0) { 
            this.facingRight = false;
        }
        if(this.walking) {
            movementX = movementX * this.walkSpeed * engine.deltaTime / movementLen;
            movementY = movementY * this.walkSpeed * engine.deltaTime / movementLen;
            let destX = this.x + movementX;
            let destY = this.y + movementY;
            if(collidesWithWorld(
                destX - this.width / 2, this.y - 1, 
                this.width, 1
            )) {
                destX = this.x;
            }
            if(collidesWithWorld(
                this.x - this.width / 2, destY - 1, 
                this.width, 1
            )) {
                destY = this.y;
            }
            this.x = destX;
            this.y = destY;
        }
        if(displayedDialogue !== null) {
            const ddd = Math.hypot(
                displayedDialogue.origin.x - this.x, 
                displayedDialogue.origin.y - this.y
            );
            if(ddd >= INTERACTION_DISTANCE) {
                dialogueQueue = [];
                dialogueEnd();
            }
        }
    },

    draw: function() {
        this.frameTimer += engine.deltaTime;
        if(this.frameTimer >= this.frameDelta) {
            this.walkFrame = (this.walkFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
        engine.drawImage(
            PLAYER_IMAGE.value,
            camera.onScreenX(this.x - this.width / 2), 
            camera.onScreenY(this.y - this.height),
            camera.onScreenS(this.width), 
            camera.onScreenS(this.height),
            this.walking? this.width * (1 + this.walkFrame) : 0, 
            this.facingRight? this.height : 0, 
            this.width, this.height
        );
    }
};


engine.gameloop(() => {
    // update
    player.move();
    doBoothInteractions();
    updateBoothNPCs();
    dialogueUpdate();
    // render
    camera.distance = 150;
    camera.x = player.x;
    camera.y = player.y - player.height / 2;
    camera.computeOffsets();
    drawBackground();
    drawBooths();
    drawBoothNPCsBehind();
    player.draw();
    drawBoothNPCsFront();
});