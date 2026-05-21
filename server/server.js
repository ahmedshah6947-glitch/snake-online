const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.static(path.join(__dirname, "../client")));

const WORLD_SIZE = 3000;

const players = {};

const food = [];

const FOOD_COUNT = 200;

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

for (let i = 0; i < FOOD_COUNT; i++) {

    spawnFood();
}

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

        color: `hsl(${Math.random()*360},100%,50%)`,

        snake: Array.from({ length: 20 }, (_, i) => ({

            x: x - i * 12,

            y
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

    socket.on("disconnect", () => {

        delete players[socket.id];
    });
});

function updatePlayers() {

    for (let id in players) {

        const p = players[id];

        p.x += Math.cos(p.angle) * p.speed;

        p.y += Math.sin(p.angle) * p.speed;

        // map collision

        p.x = Math.max(20, Math.min(WORLD_SIZE - 20, p.x));

        p.y = Math.max(20, Math.min(WORLD_SIZE - 20, p.y));

        // snake body smoothing

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

                spawnFood();
            }
        }
    }
}

// physics tick
setInterval(updatePlayers, 1000 / 30);

// network tick (LESS LAG)
setInterval(() => {

    io.emit("gameState", {

        players,

        food
    });

}, 1000 / 20);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("Server running");
});