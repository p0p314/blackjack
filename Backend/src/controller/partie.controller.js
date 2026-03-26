import { Partie, Joueur, Action } from "../model/index.js";

const create = async (req, res) => {
  try {
    const {
      id_joueur,
      mise,
      resultat,
      gain_perte,
      score_final_joueur,
      date_partie,
    } = req.body;

    if (!id_joueur || mise == null || !resultat) {
      return res.status(400).json({
        message: "id_joueur, mise et resultat sont requis",
      });
    }

    const joueur = await Joueur.findByPk(id_joueur);

    if (!joueur) {
      return res.status(404).json({
        message: "Joueur introuvable",
      });
    }

    const partie = await Partie.create({
      id_joueur,
      mise,
      resultat,
      gain_perte,
      score_final_joueur,
      date_partie: date_partie || new Date(),
    });

    res.status(201).json(partie);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la partie" });
  }
};

const getAll = async (req, res) => {
  try {
    const parties = await Partie.findAll({
      include: [
        {
          model: Joueur,
          as: "joueur",
          attributes: ["id_joueur", "pseudo"],
        },
      ],
      order: [["date_partie", "DESC"]],
    });

    res.status(200).json(parties);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des parties" });
  }
};

const getById = async (req, res) => {
  try {
    const partie = await Partie.findByPk(req.params.id, {
      include: [
        {
          model: Joueur,
          as: "joueur",
          attributes: ["id_joueur", "pseudo"],
        },
        {
          model: Action,
          as: "actions",
        },
      ],
    });

    if (!partie) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    res.status(200).json(partie);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de la partie" });
  }
};

const getByJoueur = async (req, res) => {
  try {
    const parties = await Partie.findAll({
      where: {
        id_joueur: req.params.idJoueur,
      },
      include: [
        {
          model: Action,
          as: "actions",
        },
      ],
      order: [["date_partie", "DESC"]],
    });

    res.status(200).json(parties);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des parties du joueur",
      });
  }
};

export default { create, getAll, getById, getByJoueur };
