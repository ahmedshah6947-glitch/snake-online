const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const WORLD_SIZE = 2500;

const FOOD_COUNT = 60;

const players = {};

const food = [];

// FOOD

function randomColor() {

    const colors = [
        "#ff0000",
        "#00ff00",
        "#00aaff",
        "#ff00ff",
        "#ffaa00",
        "#ffff00"
    ];

    return colors[
        Math.floor(Math.random() * colors.length)
    ];
}

function spawnFood() {

    food.push({

        x: Math.random() * WORLD_SIZE,

        y: Math.random() * WORLD_SIZE,

        color: randomColor()
    });
}

for (let i = 0; i < FOOD_COUNT; i++) {
    spawnFood();
}

// PLAYER

function createPlayer(name) {

    const x = Math.random() * WORLD_SIZE;

    const y = Math.random() * WORLD_SIZE;

    return {

        name,

        x,

        y,

        angle: 0,

        speed: 4,

        score: 0,

        color: `hsl(${Math.random()*360},100%,50%)`
    };
}

// SOCKETS

io.on("connection", (socket) => {

    socket.on("newPlayer", (name) => {

        players[socket.id] = createPlayer(name);
    });

    socket.on("move", (angle) => {

        const p = players[socket.id];

        if (!p) return;

        p.angle = angle;
    });

    socket.on("disconnect", () => {

        delete players[socket.id];
    });
});

// GAME LOOP

function updateGame() {

    for (let id in players) {

        const p = players[id];

        p.x += Math.cos(p.angle) * p.speed;

        p.y += Math.sin(p.angle) * p.speed;

        // map boundaries

        p.x = Math.max(
            20,
            Math.min(WORLD_SIZE - 20, p.x)
        );

        p.y = Math.max(
            20,
            Math.min(WORLD_SIZE - 20, p.y)
        );

        // food

        for (let i = food.length - 1; i >= 0; i--) {

            const f = food[i];

            const dist = Math.hypot(

                p.x - f.x,

                p.y - f.y
            );

            if (dist < 20) {

                p.score++;

                food.splice(i, 1);

                spawnFood();
            }
        }
    }
}

// 20 TPS

setInterval(updateGame, 1000 / 20);

// LIGHT NETWORK UPDATE

setInterval(() => {

    io.emit("gameState", {

        players,

        food
    });

}, 1000 / 15);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("Running on port " + PORT);
});