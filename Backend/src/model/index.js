import Joueur from "./joueur.model.js";
import Partie from "./partie.model.js";
import Action from "./action.model.js";

Joueur.hasMany(Partie, {
  foreignKey: "id_joueur",
  as: "parties",
});

Partie.belongsTo(Joueur, {
  foreignKey: "id_joueur",
  as: "joueur",
});

Partie.hasMany(Action, {
  foreignKey: "id_partie",
  as: "actions",
});

Action.belongsTo(Partie, {
  foreignKey: "id_partie",
  as: "partie",
});

export { Joueur, Partie, Action };
