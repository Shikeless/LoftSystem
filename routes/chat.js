module.exports = io => {
    const connections = {};

    io.on("connection", socket => {
        socket.on("users:connect", user => {
            const userData = { username: user.username, id: socket.id };
            connections[userData.id] = userData;
            socket.json.emit("users:list", Object.values(connections));
            socket.broadcast.emit("users:add", userData);
        });

        socket.on("message:add", data => {
            console.log(data);
            socket.json.emit("message:add", {
                senderId: data.senderId,
                text: `Me: ${data.text}`
            });
            io.to(data.roomId).emit("message:add", {
                senderId: socket.id,
                roomId: data.roomId,
                text: `${connections[socket.id].username}: ${data.text}`
            });
        });

        socket.on("disconnect", data => {
            socket.broadcast.emit("users:leave", connections[socket.id]);
            delete connections[socket.id];
        });
    });
};
