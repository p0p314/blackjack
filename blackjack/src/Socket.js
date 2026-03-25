import { io } from "socket.io-client";
import ImageView from "./Manager/ImageView";
import { getCard } from "./Manager/AssetsManager";
import Scene from "./Scene";

export const socket = io("http://localhost:3000");

socket.on("connected", () => {
  console.log("Connecté au serveur");
  socket.emit("authenticate", "p1"); // Envoyer un message de test au serveur
});

// socket.on("disconnect", () => {
//   socket.emit("disconnect", "p1");
// });

socket.on("HIT", (carte) => {});
socket.on("CARD_RECEIVED", (data) => {
  console.log("Carte reçue du serveur", data);
});
socket.on("GAME_STARTED", (data) => {
  console.log("Game started with data:", data);
});
function hit() {
  socket.emit("HIT");
}
