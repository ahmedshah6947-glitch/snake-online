const socket = io(window.location.origin);

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");

canvas.width = innerWidth;

canvas.height = innerHeight;

let gameState = null;

let myId = null;

let controlMode = "mouse";

let myAngle = 0;

socket.on("connect", () => {

    myId = socket.id;
});

// PLAY BUTTONS

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

// SEND MOVEMENT LESS OFTEN

setInterval(() => {

    socket.emit("move", myAngle);

}, 1000 / 20);

function drawFood(food, camX, camY) {

    for (const f of food) {

        const x = f.x - camX;

        const y = f.y - camY;

        // render only nearby

        if (
            x < -50 ||
            y < -50 ||
            x > canvas.width + 50 ||
            y > canvas.height + 50
        ) continue;

        ctx.beginPath();

        ctx.fillStyle = f.color;

        ctx.arc(x, y, 5, 0, Math.PI * 2);

        ctx.fill();
    }
}

function drawPlayers(players, camX, camY) {

    for (let id in players) {

        const p = players[id];

        for (const s of p.snake) {

            const x = s.x - camX;

            const y = s.y - camY;

            if (
                x < -50 ||
                y < -50 ||
                x > canvas.width + 50 ||
                y > canvas.height + 50
            ) continue;

            ctx.beginPath();

            ctx.fillStyle = p.color;

            ctx.arc(x, y, 14, 0, Math.PI * 2);

            ctx.fill();
        }

        // name

        ctx.fillStyle = "white";

        ctx.font = "16px Arial";

        ctx.fillText(

            p.name,

            p.x - camX - 20,

            p.y - camY - 25
        );
    }
}

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

            `${i + 1}. ${p.name} - ${p.score}`,

            canvas.width - 200,

            90 + i * 25
        );
    }
}

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

    drawFood(gameState.food, camX, camY);

    drawPlayers(gameState.players, camX, camY);

    drawLeaderboard(gameState.players);
}

gameLoop();