import "dotenv/config";
import { Sequelize } from "sequelize";

export const bdd = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
);

export const connect = async () => {
  try {
    await bdd.authenticate();
    console.log("Connexion BDD réussie");
  } catch (error) {
    console.error("Erreur de connexion BDD :", error);
    throw error;
  }
};
