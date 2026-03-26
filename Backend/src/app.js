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

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "API Blackjack opérationnelle",
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
