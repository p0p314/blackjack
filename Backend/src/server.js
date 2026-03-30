import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { connect } from "./framework/connexion.js";
import Game from "./domain/Game.js";
import initSocket from "./server/socket.js";

const PORT = process.env.PORT || 3000;

const parseOrigins = (rawOrigins = "") =>
  rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);
const corsAllowedOrigins = allowedOrigins.length
  ? allowedOrigins
  : defaultOrigins;
const isOriginAllowed = (origin) =>
  !origin || corsAllowedOrigins.includes(origin);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

let game = new Game();

initSocket(io, game);

const startServer = async () => {
  try {
    await connect();

    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("Impossible de démarrer le serveur :", error);
    process.exit(1);
  }
};

startServer();
