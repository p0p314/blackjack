import { io } from "socket.io-client";

export const socket = io("http://localhost:3000");

socket.on("connected", () => {
  console.log("Connecté au serveur");
});

function tirerCarte() {
  socket.emit("tirerCarte");
}

socket.on("carteRecue", (carte) => {
  console.log("Carte reçue du serveur", carte);
});
