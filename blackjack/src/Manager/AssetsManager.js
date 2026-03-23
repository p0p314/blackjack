import { BACK_CARDS, CARDS, OUTLINED_CARDS, TABLE } from "../Assets";
import { Assets } from "pixi.js";

export async function loadAssets(loader) {
  const AllAssets = [
    ...Object.values(CARDS),
    ...Object.values(OUTLINED_CARDS),
    ...Object.values(TABLE),
    ...Object.values(BACK_CARDS),
  ];

  await Assets.load(AllAssets);
  console.log("Assets chargés");
}

export function getCard(cardKey) {
  return Assets.get(CARDS[cardKey]);
}

export function getOutlinedCard(cardKey) {
  return Assets.get(OUTLINED_CARDS[cardKey]);
}

export function getTable(assetKey) {
  return Assets.get(TABLE[assetKey]);
}
export function getBackCards(assetKey) {
  return Assets.get(BACK_CARDS[assetKey]);
}
