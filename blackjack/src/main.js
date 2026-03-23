import { Application, Assets, Sprite, Texture } from "pixi.js";
import tapis from "/assets/CasinoPack/tapis.png";
import fond from "/assets/CasinoPack/fond.jpg";
import carte from "/assets/CasinoPack/PNG/Cards/BackgroundRed.png";
import {
  loadAssets,
  getCard,
  getOutlinedCard,
  getTable,
  getBackCards,
} from "./Manager/AssetsManager.js";
import { CARDS } from "./Assets.js";
const cartes = [
  "/assets/CasinoPack/PNG/Cards/club_2.png",
  "/assets/CasinoPack/PNG/Cards/club_3.png",
];

(async () => {
  await loadAssets();
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });
  document.body.appendChild(app.canvas);

  const sprite = new Sprite(getTable("FOND"));
  console.log(sprite);
  sprite.width = app.screen.width;
  sprite.height = app.screen.height;
  sprite.x = 0;
  sprite.y = 0;

  app.stage.addChild(sprite);

  const tapisSprite = new Sprite(getTable("TAPIS"));
  tapisSprite.width = app.screen.width;
  tapisSprite.height = app.screen.height;

  tapisSprite.x = 0;
  tapisSprite.y = 0;

  app.stage.addChild(tapisSprite);

  // // On va donc chercher en cache le sprite correspondant à la carte que l'on veut afficher
  // //const carteSprite = new Sprite(Assets.get(cartes[index]));
  const carteSprite = new Sprite(getBackCards("BLACK"));
  let carteAJouer = CARDS;
  console.log(carteAJouer);

  carteSprite.width = 100;
  carteSprite.height = 150;
  carteSprite.x = app.screen.width / 2.1 - carteSprite.width / 2;
  carteSprite.y = app.screen.height / 1.5 - carteSprite.height / 2;
  carteSprite.interactive = true;

  let index = 0;
  let taille = Object.keys(carteAJouer).length;
  carteSprite.on("pointerdown", () => {
    console.log("Carte clicked!");
    index = Math.floor(Math.random() * taille);

    carteSprite.texture = getCard(Object.keys(carteAJouer)[index]);
    carteSprite.interactive = false; // Désactive l'interaction après le clic
  });
  app.stage.addChild(carteSprite);

  const carteSprite2 = new Sprite(getBackCards("BLACK"));
  carteSprite2.width = 100;
  carteSprite2.height = 150;
  carteSprite2.x = app.screen.width / 1.9 - carteSprite2.width / 2;
  carteSprite2.y = app.screen.height / 1.5 - carteSprite2.height / 2;
  carteSprite2.interactive = true;
  app.stage.addChild(carteSprite2);

  carteSprite2.on("pointerdown", () => {
    console.log("Carte clicked!");
    index = Math.floor(Math.random() * taille);

    carteSprite2.texture = getCard(Object.keys(carteAJouer)[index]);
    carteSprite2.interactive = false; // Désactive l'interaction après le clic
  });
})();
