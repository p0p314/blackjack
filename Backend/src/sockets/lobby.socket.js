const registerLobbySocket = (io) => {
  const joueursConnectes = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connectée : ${socket.id}`);

    socket.on("lobby:join", (payload) => {
      const pseudo = payload?.pseudo || "Anonyme";

      joueursConnectes.set(socket.id, {
        socketId: socket.id,
        pseudo,
      });

      io.emit("lobby:update", Array.from(joueursConnectes.values()));
    });

    socket.on("lobby:leave", () => {
      joueursConnectes.delete(socket.id);
      io.emit("lobby:update", Array.from(joueursConnectes.values()));
    });

    socket.on("disconnect", () => {
      joueursConnectes.delete(socket.id);
      io.emit("lobby:update", Array.from(joueursConnectes.values()));
      console.log(`Socket déconnectée : ${socket.id}`);
    });
  });
};

export default registerLobbySocket;
