import express, { Express, Request, Response } from "express";
import * as http from "http";
import * as socketio from "socket.io";

const app: Express = express();
const server: http.Server = http.createServer(app);
const io: socketio.Server = new socketio.Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
  transports: ["websocket"]
});

interface PlayerList {
  [key: string]: string;
}
let players: PlayerList = {};
let alllog: any = {};
let idx = 0;

io.on("connection", (socket: socketio.Socket) => {
  console.log("connected:" + socket.id);
  alllog[idx++] = "connected:" + socket.id;
  io.to(socket.id).emit("connected");
  // roomへの入室は、「socket.join(room名)」
  socket.on("client_to_server_join", (data) => {
    socket.join(data.value);
  });

  socket.on("chat message", (msg: string) => {
    // io.emit("chat message", msg);
    socket.broadcast.emit("chat message", msg);
  });

  socket.on("player info", (msg: string) => {
    players[socket.id] = msg;
    socket.broadcast.emit("player info", msg);
  });

  socket.on("get players", () => {
    io.to(socket.id).emit("get players", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    socket.broadcast.emit("player disconnect", socket.id);
    console.log("client disconnected:" + socket.id);
    alllog[idx++] = "client disconnected:" + socket.id;
  });
});

// const PORT = process.env.PORT || 8080;
const PORT = 8080;
server.listen(PORT, () => {
  // http://localhost:8080/
  console.log("listening on *:" + PORT);
});

app.get("/", (_: Request, res: Response) => {
  // res.sendFile(__dirname + "/index.html");
  res.send(String(PORT));
  // res.send(PORT);
});

app.get("/log/", (_: Request, res: Response) => {
  res.send(JSON.stringify(alllog));
});
