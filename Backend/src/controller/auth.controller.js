import bcrypt from "bcrypt";
import { Joueur } from "../model/index.js";

const register = async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res.status(400).json({
        message: "Pseudo et mot de passe requis",
      });
    }

    const existingPlayer = await Joueur.findOne({ where: { pseudo } });

    if (existingPlayer) {
      return res.status(409).json({
        message: "Ce pseudo existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const joueur = await Joueur.create({
      pseudo,
      password: hashedPassword,
      bankroll_initiale: 1000,
      bankroll_actuelle: 1000,
    });

    req.session.joueur = {
      id_joueur: joueur.id_joueur,
      pseudo: joueur.pseudo,
    };

    return res.status(201).json({
      message: "Inscription réussie",
      joueur: {
        id_joueur: joueur.id_joueur,
        pseudo: joueur.pseudo,
        bankroll_initiale: joueur.bankroll_initiale,
        bankroll_actuelle: joueur.bankroll_actuelle,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
};

const login = async (req, res) => {
  try {
    const { pseudo, password } = req.body;

    if (!pseudo || !password) {
      return res.status(400).json({
        message: "Pseudo et mot de passe requis",
      });
    }

    const joueur = await Joueur.findOne({ where: { pseudo } });

    if (!joueur) {
      return res.status(401).json({
        message: "Identifiants invalides",
      });
    }

    const passwordMatch = await bcrypt.compare(password, joueur.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Identifiants invalides",
      });
    }

    req.session.joueur = {
      id_joueur: joueur.id_joueur,
      pseudo: joueur.pseudo,
    };

    return res.status(200).json({
      message: "Connexion réussie",
      joueur: {
        id_joueur: joueur.id_joueur,
        pseudo: joueur.pseudo,
        bankroll_actuelle: joueur.bankroll_actuelle,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

const me = async (req, res) => {
  try {
    if (!req.session || !req.session.joueur) {
      return res.status(401).json({
        message: "Non connecté",
      });
    }

    const joueur = await Joueur.findByPk(req.session.joueur.id_joueur, {
      attributes: [
        "id_joueur",
        "pseudo",
        "bankroll_initiale",
        "bankroll_actuelle",
      ],
    });

    if (!joueur) {
      return res.status(404).json({
        message: "Joueur introuvable",
      });
    }

    return res.status(200).json(joueur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          message: "Erreur lors de la déconnexion",
        });
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({
        message: "Déconnexion réussie",
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export default { register, login, me, logout };
