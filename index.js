const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    socket.on('join', ({ name }) => {
        console.log(`'${name}' joined the game`)
    })

    socket.on('disconnect', ({ name }) => {
        console.log(`'${name}' disconnected`);
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
