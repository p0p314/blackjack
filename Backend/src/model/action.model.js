import { DataTypes } from "sequelize";
import { bdd } from "../framework/connexion.js";

const Action = bdd.define(
  "Action",
  {
    id_action: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_partie: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type_action: {
      type: DataTypes.ENUM("Tirer", "Rester", "Doubler", "Partager"),
      allowNull: false,
    },
    valeur_main: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Action",
    timestamps: false,
    freezeTableName: true,
  },
);

export default Action;
