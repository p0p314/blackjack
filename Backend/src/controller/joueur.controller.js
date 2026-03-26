import { Joueur, Partie } from "../model/index.js";

const getAll = async (req, res) => {
  try {
    const joueurs = await Joueur.findAll({
      attributes: [
        "id_joueur",
        "pseudo",
        "bankroll_initiale",
        "bankroll_actuelle",
      ],
      order: [["pseudo", "ASC"]],
    });

    res.status(200).json(joueurs);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des joueurs" });
  }
};

const getById = async (req, res) => {
  try {
    const joueur = await Joueur.findByPk(req.params.id, {
      attributes: [
        "id_joueur",
        "pseudo",
        "bankroll_initiale",
        "bankroll_actuelle",
      ],
    });

    if (!joueur) {
      return res.status(404).json({ message: "Joueur introuvable" });
    }

    res.status(200).json(joueur);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du joueur" });
  }
};

const getClassement = async (req, res) => {
  try {
    const joueurs = await Joueur.findAll({
      attributes: [
        "id_joueur",
        "pseudo",
        "bankroll_initiale",
        "bankroll_actuelle",
      ],
      order: [["bankroll_actuelle", "DESC"]],
    });

    res.status(200).json(joueurs);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du classement" });
  }
};

const getPartiesByJoueur = async (req, res) => {
  try {
    const joueur = await Joueur.findByPk(req.params.id, {
      attributes: ["id_joueur", "pseudo"],
      include: [
        {
          model: Partie,
          as: "parties",
        },
      ],
    });

    if (!joueur) {
      return res.status(404).json({ message: "Joueur introuvable" });
    }

    res.status(200).json(joueur);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des parties du joueur",
      });
  }
};

export default { getAll, getById, getClassement, getPartiesByJoueur };
