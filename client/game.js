const socket = io(window.location.origin);

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");

canvas.width = innerWidth;

canvas.height = innerHeight;

let gameState = null;

let myId = null;

let myAngle = 0;

let controlMode = "mouse";

socket.on("connect", () => {

    myId = socket.id;
});

// CONTROL SELECTION

document.getElementById("mouseBtn").onclick = () => {

    startGame("mouse");
};

document.getElementById("keyboardBtn").onclick = () => {

    startGame("keyboard");
};

function startGame(mode) {

    controlMode = mode;

    const name =
        document.getElementById("nameInput").value;

    if (!name) return;

    document.getElementById("menu").style.display = "none";

    socket.emit("newPlayer", name);
}

socket.on("gameState", (state) => {

    gameState = state;
});

// MOUSE CONTROLS

document.addEventListener("mousemove", (e) => {

    if (controlMode !== "mouse") return;

    myAngle = Math.atan2(

        e.clientY - canvas.height / 2,

        e.clientX - canvas.width / 2
    );
});

// KEYBOARD CONTROLS

document.addEventListener("keydown", (e) => {

    if (controlMode !== "keyboard") return;

    if (e.key === "ArrowUp") {
        myAngle = -Math.PI / 2;
    }

    if (e.key === "ArrowDown") {
        myAngle = Math.PI / 2;
    }

    if (e.key === "ArrowLeft") {
        myAngle = Math.PI;
    }

    if (e.key === "ArrowRight") {
        myAngle = 0;
    }
});

// SEND MOVEMENT

setInterval(() => {

    socket.emit("move", myAngle);

}, 1000 / 20);

// DRAW FOOD

function drawFood(food, camX, camY) {

    for (const f of food) {

        const x = f.x - camX;

        const y = f.y - camY;

        if (
            x < -20 ||
            y < -20 ||
            x > canvas.width + 20 ||
            y > canvas.height + 20
        ) continue;

        ctx.fillStyle = f.color;

        ctx.beginPath();

        ctx.arc(x, y, 5, 0, Math.PI * 2);

        ctx.fill();
    }
}

// DRAW PLAYERS

function drawPlayers(players, camX, camY) {

    for (let id in players) {

        const p = players[id];

        const x = p.x - camX;

        const y = p.y - camY;

        // PLAYER

        ctx.fillStyle = p.color;

        ctx.beginPath();

        ctx.arc(x, y, 18, 0, Math.PI * 2);

        ctx.fill();

        // NAME

        ctx.fillStyle = "white";

        ctx.font = "16px Arial";

        ctx.fillText(

            p.name,

            x - 20,

            y - 30
        );

        // SCORE

        ctx.fillText(

            p.score,

            x - 5,

            y + 40
        );
    }
}

// LEADERBOARD

function drawLeaderboard(players) {

    const sorted = Object.values(players)

        .sort((a, b) => b.score - a.score)

        .slice(0, 5);

    ctx.fillStyle = "rgba(0,0,0,0.5)";

    ctx.fillRect(

        canvas.width - 220,

        20,

        200,

        170
    );

    ctx.fillStyle = "white";

    ctx.font = "22px Arial";

    ctx.fillText(

        "Leaderboard",

        canvas.width - 200,

        50
    );

    ctx.font = "18px Arial";

    for (let i = 0; i < sorted.length; i++) {

        const p = sorted[i];

        ctx.fillText(

            `${i+1}. ${p.name} - ${p.score}`,

            canvas.width - 200,

            90 + i * 25
        );
    }
}

// GAME LOOP

function gameLoop() {

    requestAnimationFrame(gameLoop);

    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height
    );

    if (!gameState) return;

    const me = gameState.players[myId];

    if (!me) return;

    const camX =
        me.x - canvas.width / 2;

    const camY =
        me.y - canvas.height / 2;

    drawFood(
        gameState.food,
        camX,
        camY
    );

    drawPlayers(
        gameState.players,
        camX,
        camY
    );

    drawLeaderboard(
        gameState.players
    );
}

gameLoop();