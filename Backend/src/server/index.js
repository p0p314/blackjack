import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ obligatoire en ES modules pour __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_moi",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// 📂 chemin vers ton dossier blackjack
const FRONT_PATH = path.join(__dirname, "../../../../blackjack/blackjack");

// servir le frontend
app.use(express.static(FRONT_PATH));

// page d'accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONT_PATH, "home.html"));
});

// Connexion BDD
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ================= API =================

// Test
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Vérifier session
app.get("/api/me", async (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }

  const [rows] = await pool.query(
    "SELECT id_joueur, pseudo, bankroll_initiale, bankroll_actuelle FROM Joueur WHERE id_joueur = ?",
    [req.session.user.id_joueur],
  );

  if (rows.length === 0) {
    return res.json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    user: rows[0],
  });
});

// INSCRIPTION
app.post("/api/register", async (req, res) => {
  const { pseudo, password } = req.body;

  if (!pseudo || !password) {
    return res.status(400).json({ message: "Champs requis." });
  }

  const [existing] = await pool.query(
    "SELECT id_joueur FROM Joueur WHERE pseudo = ?",
    [pseudo],
  );

  if (existing.length > 0) {
    return res.status(409).json({ message: "Pseudo déjà utilisé." });
  }

  const hash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    "INSERT INTO Joueur (pseudo, password, bankroll_initiale, bankroll_actuelle) VALUES (?, ?, 1000, 1000)",
    [pseudo, hash],
  );

  req.session.user = {
    id_joueur: result.insertId,
    pseudo,
  };

  res.json({ message: "Compte créé !" });
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { pseudo, password } = req.body;

  const [rows] = await pool.query("SELECT * FROM Joueur WHERE pseudo = ?", [
    pseudo,
  ]);

  if (rows.length === 0) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  req.session.user = {
    id_joueur: user.id_joueur,
    pseudo: user.pseudo,
  };

  res.json({ message: "Connexion réussie." });
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Déconnecté." });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
