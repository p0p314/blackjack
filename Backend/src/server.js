import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { connect } from "./framework/connexion.js";
import Game from "./domain/Game.js";
import initSocket from "./server/socket.js";

const PORT = process.env.PORT || 3000;

const normalizeOrigin = (origin) => origin.replace(/\/$/, "").toLowerCase();

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].map(normalizeOrigin);

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const corsAllowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (corsAllowedOrigins.includes(normalized)) return true;
  if (/\.vercel\.app$/.test(normalized)) return true;
  if (/\.onrender\.com$/.test(normalized)) return true;
  return false;
};
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsAllowedOrigins,
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
