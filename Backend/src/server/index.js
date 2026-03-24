import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Card from "../domain/Card.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Blackjack Game API!");
});

const server = http.createServer(app);

// ✅ brancher socket dessus
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
io.on("connect", (socket) => {
  // console.log(socket);
  console.log("Un joueur connecté");
  socket.emit("connected");
  const card = new Card("D", "2");

  socket.on("tirerCarte", () => {
    console.log("Le joueur a tiré une carte", { card: card.toString() });
    socket.emit("carteRecue", { rank: "10", suit: "hearts" });
  });
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
