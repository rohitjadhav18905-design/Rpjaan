const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname)); // Serve frontend files

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", socket.id);

        socket.on("offer", (data) => {
            socket.to(roomId).emit("offer", data);
        });

        socket.on("answer", (data) => {
            socket.to(roomId).emit("answer", data);
        });

        socket.on("ice-candidate", (data) => {
            socket.to(roomId).emit("ice-candidate", data);
        });

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", socket.id);
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
