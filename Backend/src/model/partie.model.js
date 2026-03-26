import { DataTypes } from "sequelize";
import { bdd } from "../framework/connexion.js";

const Partie = bdd.define(
  "Partie",
  {
    id_partie: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_joueur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mise: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resultat: {
      type: DataTypes.ENUM("Victoire", "Défaite", "Égalité", "Bust"),
      allowNull: false,
    },
    gain_perte: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    score_final_joueur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_partie: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "Partie",
    timestamps: false,
    freezeTableName: true,
  },
);

export default Partie;
