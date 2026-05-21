const socket = io(window.location.origin);

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

function drawFood(food, camX, camY) {

    for (const f of food) {

        const x = f.x - camX;

        const y = f.y - camY;

        // render only nearby food

        if (
            x < -50 ||
            y < -50 ||
            x > canvas.width + 50 ||
            y > canvas.height + 50
        ) continue;

        ctx.beginPath();

        ctx.fillStyle = f.color;

        ctx.arc(x, y, 6, 0, Math.PI * 2);

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
                x < -100 ||
                y < -100 ||
                x > canvas.width + 100 ||
                y > canvas.height + 100
            ) continue;

            ctx.beginPath();

            ctx.fillStyle = p.color;

            ctx.arc(x, y, 16, 0, Math.PI * 2);

            ctx.fill();
        }

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

    drawFood(gameState.food, camX, camY);

    drawPlayers(gameState.players, camX, camY);

    drawLeaderboard(gameState.players);
}

gameLoop();