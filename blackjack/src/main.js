import {
  loadAssets,
  getAsset,
  getCard,
  getChip,
} from "./Manager/AssetsManager.js";
import { CARDS, CHIPS } from "./Assets.js";
import ImageView from "./Manager/ImageView.js";
import Scene from "./Scene.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
let sceneJeu = new Scene();
let sceneFond = new Scene();

document.body.appendChild(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();
(async () => {
  await loadAssets();

  let index = 0;
  let taille = Object.keys(CARDS).length;
  const fond = new ImageView(
    getAsset("FOND"),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  sceneFond.add(fond);

  const tapis = new ImageView(
    getAsset("TAPIS"),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  sceneFond.add(tapis);

  const carte = new ImageView(
    getCard("D2"),
    canvas.width / 2.1 - 50,
    canvas.height / 1.5 - 75,
    100,
    150,
  );

  carte.onClick = () => {
    console.log("Carte clicked!");
    index = Math.floor(Math.random() * taille);
    carte.image = getCard(Object.keys(CARDS)[index]);
  };
  sceneJeu.add(carte);

  const carte2 = new ImageView(
    getCard("D2"),
    canvas.width / 2.1 + 100,
    canvas.height / 1.5 - 75,
    100,
    150,
  );

  carte2.onClick = () => {
    console.log("Carte clicked!");
    index = Math.floor(Math.random() * taille);
    carte2.image = getCard(Object.keys(CARDS)[index]);
  };
  sceneJeu.add(carte2);

  Object.keys(CHIPS).forEach((key, idx) => {
    if (idx < 14) {
      if (idx % 2 === 0) {
        const chip = new ImageView(
          getChip(key),
          50 + idx * 60,
          canvas.height - 160,
          110,
          110,
        );
        sceneJeu.add(chip);
      }
    }
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sceneFond.draw(ctx);
    sceneJeu.draw(ctx);
    requestAnimationFrame(render);
  }

  render();
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sceneJeu.handleClick(x, y);
  });
})();
