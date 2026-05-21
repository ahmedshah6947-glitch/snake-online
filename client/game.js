const socket = io();

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");

canvas.width = innerWidth;

canvas.height = innerHeight;

const WORLD_SIZE = 3000;

let gameState = null;

let myId = null;

let myName = "";

socket.on("connect", () => {

    myId = socket.id;
});

document.getElementById("playBtn").onclick = () => {

    myName = document.getElementById("nameInput").value;

    if (!myName) return;

    document.getElementById("menu").style.display = "none";

    socket.emit("newPlayer", myName);
};

document.getElementById("respawnBtn").onclick = () => {

    document.getElementById("deathScreen").style.display = "none";

    socket.emit("respawn", myName);
};

socket.on("gameState", (state) => {

    gameState = state;
});

document.addEventListener("mousemove", (e) => {

    const angle = Math.atan2(

        e.clientY - canvas.height / 2,

        e.clientX - canvas.width / 2
    );

    socket.emit("move", angle);
});

function drawBorders(camX, camY) {

    ctx.strokeStyle = "red";

    ctx.lineWidth = 20;

    ctx.strokeRect(

        -camX,

        -camY,

        WORLD_SIZE,

        WORLD_SIZE
    );
}

function drawFood(food, camX, camY) {

    for (const f of food) {

        ctx.beginPath();

        ctx.fillStyle = f.color;

        ctx.shadowBlur = 20;

        ctx.shadowColor = f.color;

        ctx.arc(

            f.x - camX,

            f.y - camY,

            8,

            0,

            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

function drawPlayers(players, camX, camY) {

    for (let id in players) {

        const p = players[id];

        for (let i = p.snake.length - 1; i >= 0; i--) {

            const s = p.snake[i];

            ctx.beginPath();

            ctx.fillStyle = p.color;

            ctx.shadowBlur = 15;

            ctx.shadowColor = p.color;

            ctx.arc(

                s.x - camX,

                s.y - camY,

                18,

                0,

                Math.PI * 2
            );

            ctx.fill();

            ctx.shadowBlur = 0;
        }

        // eyes

        ctx.fillStyle = "white";

        ctx.beginPath();

        ctx.arc(

            p.x - camX - 5,

            p.y - camY - 5,

            4,

            0,

            Math.PI * 2
        );

        ctx.arc(

            p.x - camX + 5,

            p.y - camY - 5,

            4,

            0,

            Math.PI * 2
        );

        ctx.fill();

        // name

        ctx.fillStyle = "white";

        ctx.font = "18px Arial";

        ctx.fillText(

            p.name,

            p.x - camX - 20,

            p.y - camY - 30
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

        180
    );

    ctx.fillStyle = "white";

    ctx.font = "24px Arial";

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

    const camX = me.x - canvas.width / 2;

    const camY = me.y - canvas.height / 2;

    drawBorders(camX, camY);

    drawFood(gameState.food, camX, camY);

    drawPlayers(gameState.players, camX, camY);

    drawLeaderboard(gameState.players);
}

gameLoop();