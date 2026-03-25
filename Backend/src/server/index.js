import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Card from "../domain/Card.js";
import initSocket from "./socket.js";
import Game from "../domain/Game.js";
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
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const game = new Game();
initSocket(io, game); // Passer une instance de jeu si nécessaire
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
