import { Partie, Joueur, Action } from "../model/index.js";
import { fn, col, Op } from "sequelize";

const getGlobalStats = async (req, res) => {
  try {
    const totalParties = await Partie.count();
    const totalJoueurs = await Joueur.count();

    const resultatStats = await Partie.findAll({
      attributes: ["resultat", [fn("COUNT", col("resultat")), "total"]],
      group: ["resultat"],
    });

    const topJoueurs = await Joueur.findAll({
      attributes: ["id_joueur", "pseudo", "bankroll_actuelle"],
      order: [["bankroll_actuelle", "DESC"]],
      limit: 5,
    });

    res.status(200).json({
      totalParties,
      totalJoueurs,
      repartitionResultats: resultatStats,
      topJoueurs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques globales",
    });
  }
};

const getJoueurStats = async (req, res) => {
  try {
    const idJoueur = req.params.id;

    const joueur = await Joueur.findByPk(idJoueur, {
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

    const totalParties = await Partie.count({
      where: { id_joueur: idJoueur },
    });

    const victoires = await Partie.count({
      where: { id_joueur: idJoueur, resultat: "Victoire" },
    });

    const busts = await Partie.count({
      where: { id_joueur: idJoueur, resultat: "Bust" },
    });

    const parties = await Partie.findAll({
      where: { id_joueur: idJoueur },
      attributes: [
        "id_partie",
        "resultat",
        "gain_perte",
        "mise",
        "score_final_joueur",
        "date_partie",
      ],
      order: [
        ["date_partie", "ASC"],
        ["id_partie", "ASC"],
      ],
    });

    const [
      tirerCount,
      resterCount,
      doublerCount,
      partagerCount,
      tirerHautCount,
      tirerBasCount,
    ] = await Promise.all([
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: { type_action: "Tirer" },
      }),
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: { type_action: "Rester" },
      }),
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: { type_action: "Doubler" },
      }),
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: { type_action: "Partager" },
      }),
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: {
          type_action: "Tirer",
          valeur_main: {
            [Op.gt]: 16,
          },
        },
      }),
      Action.count({
        include: [
          {
            model: Partie,
            as: "partie",
            where: { id_joueur: idJoueur },
            attributes: [],
          },
        ],
        where: {
          type_action: "Tirer",
          valeur_main: {
            [Op.lt]: 15,
          },
        },
      }),
    ]);

    const totalActions =
      tirerCount + resterCount + doublerCount + partagerCount;

    const makeActionStat = (count) => ({
      count,
      percentage: totalActions > 0 ? (count / totalActions) * 100 : 0,
    });

    let tendance = "Équilibré";

    if (tirerHautCount > tirerBasCount) {
      tendance = "Agressif";
    } else if (tirerBasCount > tirerHautCount) {
      tendance = "Prudent";
    }

    let bankrollCourante = Number(joueur.bankroll_initiale || 0);

    const bankrollEvolution = parties.map((partie, index) => {
      bankrollCourante += Number(partie.gain_perte || 0);

      return {
        partie: index + 1,
        valeur: bankrollCourante,
      };
    });

    res.status(200).json({
      pseudo: joueur.pseudo,
      totalParties,
      tauxVictoires: totalParties > 0 ? (victoires / totalParties) * 100 : 0,
      tauxBust: totalParties > 0 ? (busts / totalParties) * 100 : 0,
      tendance,
      actions: {
        tirer: makeActionStat(tirerCount),
        rester: makeActionStat(resterCount),
        doubler: makeActionStat(doublerCount),
        partager: makeActionStat(partagerCount),
      },
      bankrollEvolution,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques joueur",
    });
  }
};

export default { getGlobalStats, getJoueurStats };
