import {
  BACK_CARDS,
  CARDS,
  CHIPS,
  OUTLINED_CARDS,
  TABLE,
} from "../constant/Assets.js";

const assets = {
  cards: {},
  outlinedCards: {},
  backCards: {},
  chips: {},
  table: {},
};

const flatAssets = {};
let isLoaded = false;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Impossible de charger l'image: ${src}`));
    img.src = src;
  });
}

async function loadGroup(definitions, targetStore, flatKeyPrefix) {
  const entries = Object.entries(definitions);

  await Promise.all(
    entries.map(async ([key, src]) => {
      const image = await loadImage(src);

      targetStore[key] = image;
      flatAssets[`${flatKeyPrefix}_${key}`] = image;
    }),
  );
}

export async function loadAssets() {
  if (isLoaded) return;

  await Promise.all([
    loadGroup(CARDS, assets.cards, "CARD"),
    loadGroup(OUTLINED_CARDS, assets.outlinedCards, "OUTLINED"),
    loadGroup(BACK_CARDS, assets.backCards, "BACK"),
    loadGroup(CHIPS, assets.chips, "CHIP"),
    loadGroup(TABLE, assets.table, "TABLE"),
  ]);

  Object.assign(flatAssets, assets.table, assets.backCards);
  flatAssets.CARD_BACK = assets.backCards.BLACK;

  isLoaded = true;
}

export function getAsset(key) {
  return (
    flatAssets[key] ||
    assets.cards[key] ||
    assets.outlinedCards[key] ||
    assets.chips[key]
  );
}

export function getCard(key) {
  return assets.cards[key];
}

export function getOutlinedCard(key) {
  return assets.outlinedCards[key];
}

export function getBackCards(key) {
  return assets.backCards[key];
}

export function getChip(key) {
  return assets.chips[key];
}

export function getTable(key) {
  return assets.table[key];
}
