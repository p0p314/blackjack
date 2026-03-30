import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

import authRouter from "./routes/auth.routes.js";
import joueurRouter from "./routes/joueur.routes.js";
import partieRouter from "./routes/partie.routes.js";
import actionRouter from "./routes/action.routes.js";
import statsRouter from "./routes/stats.routes.js";

const app = express();

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

app.set("trust proxy", 1);

app.use(
  cors({
    origin: corsAllowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "API Blackjack opérationnelle",
    allowedOrigins: corsAllowedOrigins,
    requestOrigin: req.headers.origin || null,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/joueurs", joueurRouter);
app.use("/api/parties", partieRouter);
app.use("/api/actions", actionRouter);
app.use("/api/stats", statsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route introuvable" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Erreur interne du serveur",
  });
});

export default app;
