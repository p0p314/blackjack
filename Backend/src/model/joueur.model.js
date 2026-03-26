import { DataTypes } from "sequelize";
import { bdd } from "../framework/connexion.js";

const Joueur = bdd.define(
  "Joueur",
  {
    id_joueur: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pseudo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bankroll_initiale: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1000.0,
    },
    bankroll_actuelle: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "Joueur",
    timestamps: false,
    freezeTableName: true,
  },
);

export default Joueur;
