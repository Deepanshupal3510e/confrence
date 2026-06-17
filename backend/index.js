
import express from "express"
import { createServer } from "http";
import cors from "cors"
import { Server } from "socket.io";

const app = express()
const port = process.env.PORT || 5555


const server = createServer(app);


const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});


app.use(cors({ origin: "*" }))


io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);

        console.log(`${socket.id} joined ${roomId}`);

        socket.to(roomId).emit("user-joined", {
            userId: socket.id,
        });
    });

    socket.on("message", (data) => {
        console.log(data);

        io.emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
    });



    

    socket.on("offer", ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
        socket.to(roomId).emit("ice-candidate", candidate);
    });



});










server.listen(port, () => {
    console.log(`server is listening on port ${port}....`)
})