import { Action, Partie } from "../model/index.js";

const create = async (req, res) => {
  try {
    const { id_partie, type_action, valeur_main } = req.body;

    if (!id_partie || !type_action || valeur_main == null) {
      return res.status(400).json({
        message: "id_partie, type_action et valeur_main sont requis",
      });
    }

    const partie = await Partie.findByPk(id_partie);

    if (!partie) {
      return res.status(404).json({
        message: "Partie introuvable",
      });
    }

    const action = await Action.create({
      id_partie,
      type_action,
      valeur_main,
    });

    res.status(201).json(action);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de l'action" });
  }
};

const getByPartie = async (req, res) => {
  try {
    const actions = await Action.findAll({
      where: {
        id_partie: req.params.idPartie,
      },
      order: [["id_action", "ASC"]],
    });

    res.status(200).json(actions);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des actions" });
  }
};

export default { create, getByPartie };
