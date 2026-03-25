import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import cors from "cors";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Lobby management
const lobby = {
  players: [],
  maxPlayers: 4,
};

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log(`Joueur connecté: ${socket.id}`);

  socket.on("JOIN_LOBBY", (data) => {
    console.log(`Joueur ${data.playerId} (${data.name}) rejoint le lobby`);
    
    // Check if player already in lobby
    const existingPlayer = lobby.players.find(
      (p) => p.id === data.playerId
    );
    
    if (!existingPlayer) {
      const newPlayer = {
        id: data.playerId,
        socketId: socket.id,
        name: data.name || `Joueur ${data.playerId}`,
        status: "ready",
      };
      lobby.players.push(newPlayer);
      
      // Notify all players that someone joined
      io.emit("PLAYER_JOINED", {
        playerName: newPlayer.name,
        players: lobby.players.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        })),
      });
      
      // Send updated lobby to new player
      socket.emit("LOBBY_UPDATED", {
        players: lobby.players.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        })),
      });
    }
    
    socket.join("lobby");
  });

  socket.on("LEAVE_LOBBY", (data) => {
    console.log(`Joueur ${data.playerId} quitte le lobby`);
    const playerIndex = lobby.players.findIndex(
      (p) => p.id === data.playerId
    );
    
    if (playerIndex !== -1) {
      const removedPlayer = lobby.players[playerIndex];
      lobby.players.splice(playerIndex, 1);
      
      // Notify all players that someone left
      io.emit("PLAYER_LEFT", {
        playerName: removedPlayer.name,
        players: lobby.players.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        })),
      });
    }
    
    socket.leave("lobby");
  });

  socket.on("START_GAME", () => {
    console.log("Démarrage de la partie");
    
    if (lobby.players.length > 0) {
      // Notify all players that game is starting
      io.emit("GAME_STARTING", {
        players: lobby.players.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      });
      
      // Clear lobby for next game
      setTimeout(() => {
        lobby.players = [];
      }, 2000);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Joueur déconnecté: ${socket.id}`);
    
    // Remove player from lobby if they disconnect
    const playerIndex = lobby.players.findIndex(
      (p) => p.socketId === socket.id
    );
    
    if (playerIndex !== -1) {
      const removedPlayer = lobby.players[playerIndex];
      lobby.players.splice(playerIndex, 1);
      
      // Notify all players that someone left
      io.emit("PLAYER_LEFT", {
        playerName: removedPlayer.name,
        players: lobby.players.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        })),
      });
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/me", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Erreur /api/me :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res
        .status(400)
        .json({ message: "Pseudo et mot de passe requis." });
    }

    const [existing] = await pool.query(
      "SELECT id_joueur FROM Joueur WHERE pseudo = ?",
      [pseudo],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Ce pseudo existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO Joueur (pseudo, password, bankroll_initiale, bankroll_actuelle) VALUES (?, ?, 1000, 1000)",
      [pseudo, hashedPassword],
    );

    req.session.user = {
      id_joueur: result.insertId,
      pseudo,
    };

    res.status(201).json({
      message: "Compte créé avec succès.",
    });
  } catch (error) {
    console.error("Erreur /api/register :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res
        .status(400)
        .json({ message: "Pseudo et mot de passe requis." });
    }

    const [rows] = await pool.query("SELECT * FROM Joueur WHERE pseudo = ?", [
      pseudo,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    req.session.user = {
      id_joueur: user.id_joueur,
      pseudo: user.pseudo,
    };

    res.json({
      message: "Connexion réussie.",
    });
  } catch (error) {
    console.error("Erreur /api/login :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur /api/logout :", err);
      return res
        .status(500)
        .json({ message: "Erreur lors de la déconnexion." });
    }

    res.json({ message: "Déconnexion réussie." });
  });
});

app.get("/api/stats", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Non connecté." });
    }

    const userId = req.session.user.id_joueur;

    // 1) Récupération bankroll initiale
    const [joueurRows] = await pool.query(
      `
      SELECT pseudo, bankroll_initiale
      FROM Joueur
      WHERE id_joueur = ?
      `,
      [userId],
    );

    const joueur = joueurRows[0];

    const bankrollInitiale = Number(joueur?.bankroll_initiale) || 1000;
    const pseudo = joueur?.pseudo || "Joueur";

    // 2) Overview stats
    const [overviewRows] = await pool.query(
      `
      SELECT 
          COUNT(*) AS total_parties,
          ROUND((COUNT(CASE WHEN resultat = 'Victoire' THEN 1 END) / COUNT(*)) * 100, 2) AS taux_victoires,
          ROUND((COUNT(CASE WHEN resultat = 'Bust' THEN 1 END) / COUNT(*)) * 100, 2) AS taux_bust
      FROM Partie
      WHERE id_joueur = ?
      `,
      [userId],
    );

    const overview = overviewRows[0] || {};

    // 3) Evolution bankroll
    const [bankrollRows] = await pool.query(
      `
      SELECT 
          p.date_partie,
          j.bankroll_initiale + SUM(p.gain_perte) OVER (
            ORDER BY p.date_partie, p.id_partie
          ) AS evolution_bankroll
      FROM Partie p
      INNER JOIN Joueur j ON p.id_joueur = j.id_joueur
      WHERE p.id_joueur = ?
      ORDER BY p.date_partie ASC, p.id_partie ASC
      `,
      [userId],
    );

    // 👉 Ajout du point de départ (partie 0)
    const bankrollEvolution = [
      {
        partie: 0,
        date: null,
        valeur: bankrollInitiale,
      },
      ...bankrollRows.map((row, index) => ({
        partie: index + 1,
        date: row.date_partie,
        valeur: Number(row.evolution_bankroll) || 0,
      })),
    ];

    // 4) Fréquence des actions
    const [actionsRows] = await pool.query(
      `
      SELECT 
          a.type_action,
          COUNT(*) AS nb_utilisations,
          ROUND(
            (
              COUNT(*) / NULLIF((
                SELECT COUNT(*)
                FROM Action a2
                INNER JOIN Partie p2 ON a2.id_partie = p2.id_partie
                WHERE p2.id_joueur = ?
              ), 0)
            ) * 100,
            2
          ) AS pourcentage
      FROM Action a
      INNER JOIN Partie p ON a.id_partie = p.id_partie
      WHERE p.id_joueur = ?
      GROUP BY a.type_action
      `,
      [userId, userId],
    );

    const actionsMap = {
      Tirer: 0,
      Rester: 0,
      Doubler: 0,
      Partager: 0,
    };

    const actionsCountMap = {
      Tirer: 0,
      Rester: 0,
      Doubler: 0,
      Partager: 0,
    };

    for (const row of actionsRows) {
      if (row.type_action in actionsMap) {
        actionsMap[row.type_action] = Number(row.pourcentage) || 0;
        actionsCountMap[row.type_action] = Number(row.nb_utilisations) || 0;
      }
    }

    // 5) Tendance
    const [trendRows] = await pool.query(
      `
      SELECT 
          CASE 
              WHEN COUNT(CASE WHEN a.type_action = 'Tirer' AND a.valeur_main > 16 THEN 1 END) >
                   COUNT(CASE WHEN a.type_action = 'Tirer' AND a.valeur_main < 15 THEN 1 END)
              THEN 'Agressif'
              WHEN COUNT(CASE WHEN a.type_action = 'Tirer' AND a.valeur_main < 15 THEN 1 END) >
                   COUNT(CASE WHEN a.type_action = 'Tirer' AND a.valeur_main > 16 THEN 1 END)
              THEN 'Prudent'
              ELSE 'Équilibré'
          END AS tendance_nom
      FROM Action a
      INNER JOIN Partie p ON a.id_partie = p.id_partie
      WHERE p.id_joueur = ?
      `,
      [userId],
    );

    const tendance = trendRows[0]?.tendance_nom || "Équilibré";

    // 6) Réponse finale
    res.json({
      pseudo,
      totalParties: Number(overview.total_parties) || 0,
      tauxVictoires: Number(overview.taux_victoires) || 0,
      tauxBust: Number(overview.taux_bust) || 0,
      tendance,
      bankrollEvolution,
      actions: {
        tirer: {
          count: actionsCountMap.Tirer,
          percentage: actionsMap.Tirer,
        },
        rester: {
          count: actionsCountMap.Rester,
          percentage: actionsMap.Rester,
        },
        doubler: {
          count: actionsCountMap.Doubler,
          percentage: actionsMap.Doubler,
        },
        partager: {
          count: actionsCountMap.Partager,
          percentage: actionsMap.Partager,
        },
      },
    });
  } catch (error) {
    console.error("Erreur /api/stats :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur API lancé sur http://localhost:${PORT}`);
  console.log(`Socket.io serveur prêt`);
});
