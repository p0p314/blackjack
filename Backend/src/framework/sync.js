import { bdd } from "./connexion.js";

export const sync = async () => {
  try {
    await bdd.sync({ alter: false });
    console.log("Synchronisation Sequelize terminée");
  } catch (error) {
    console.error("Erreur de synchronisation :", error);
    throw error;
  }
};
