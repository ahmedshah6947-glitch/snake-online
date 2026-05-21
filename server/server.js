const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const WORLD_SIZE = 3000;

const players = {};

const food = [];

function randomFoodColor() {

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

        color: randomFoodColor()
    });
}

for (let i = 0; i < 400; i++) {
    spawnFood();
}

function createPlayer(name) {

    const spawnX = Math.random() * WORLD_SIZE;

    const spawnY = Math.random() * WORLD_SIZE;

    return {

        name,

        x: spawnX,

        y: spawnY,

        angle: 0,

        speed: 4,

        score: 0,

        alive: true,

        color: `hsl(${Math.random() * 360},100%,50%)`,

        snake: Array.from({ length: 20 }, (_, i) => ({

            x: spawnX - i * 15,

            y: spawnY
        }))
    };
}

io.on("connection", (socket) => {

    socket.on("newPlayer", (name) => {

        players[socket.id] = createPlayer(name);
    });

    socket.on("move", (angle) => {

        const p = players[socket.id];

        if (!p) return;

        p.angle = angle;
    });

    socket.on("respawn", (name) => {

        players[socket.id] = createPlayer(name);
    });

    socket.on("disconnect", () => {

        delete players[socket.id];
    });
});

function gameLoop() {

    // natural food spawning

    if (food.length < 400) {

        for (let i = 0; i < 5; i++) {
            spawnFood();
        }
    }

    for (let id in players) {

        const p = players[id];

        if (!p.alive) continue;

        // movement

        p.x += Math.cos(p.angle) * p.speed;

        p.y += Math.sin(p.angle) * p.speed;

        // HARD MAP LIMITS

        p.x = Math.max(20, Math.min(WORLD_SIZE - 20, p.x));

        p.y = Math.max(20, Math.min(WORLD_SIZE - 20, p.y));

        // snake body

        p.snake.unshift({

            x: p.x,

            y: p.y
        });

        while (p.snake.length > 20 + p.score) {

            p.snake.pop();
        }

        // food collision

        for (let i = food.length - 1; i >= 0; i--) {

            const f = food[i];

            const dist = Math.hypot(

                p.x - f.x,

                p.y - f.y
            );

            if (dist < 20) {

                p.score++;

                food.splice(i, 1);
            }
        }
    }

    io.emit("gameState", {

        players,

        food
    });
}

setInterval(gameLoop, 1000 / 60);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("Running on port " + PORT);
});