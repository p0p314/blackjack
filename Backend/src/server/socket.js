export default function initSocket(io, game) {
  let playerList = [];

  io.on("connect", (socket) => {
    console.log("Un joueur connecté");
    socket.emit("connected");

    socket.on("JOIN_GAME", (playerId) => {
      game.addPlayer(playerId, `Player ${playerId}`);
      console.log(`Le joueur ${playerId} a rejoint la partie`);
    });

    socket.on("HIT", (playerId) => {
      let result = game.playerHit(playerId);

      if (result.card.isAs()) {
        console.log("Le joueur doit choisir la valeur de l'as");
        socket.emit("SELECT_AS_VALUE", result);
      } else {
        if (result.status === "bust") {
          socket.emit("PLAYER_BUST", result);
        } else if (result.status === "blackjack") {
          socket.emit("PLAYER_BLACKJACK", result);
        } else if (result.status === "stood") {
          socket.emit("PLAYER_STOOD", result);
        } else socket.emit("CARD_RECEIVED", result);

        console.log(`Le joueur ${playerId} a tiré une carte`, result);

        if (game.dealerCanPlay()) {
          const result = game.dealerPlay();
          if (result.status === "bust") {
            console.log("Le dealer a busté");
            socket.emit("DEALER_BUST", result);
          } else if (result.status === "stood") {
            console.log("Le dealer a stand");
            socket.emit("DEALER_STOOD", result);
          }
        }

        let resultGame = game.calulateResults();

        if (resultGame != null) {
          console.log("Envoyer les résultats de la partie au client");
          if (resultGame.some((player) => player.status === "win")) {
            console.log("Envoyer le résultat de win au client");
            socket.emit("PLAYER_WIN", resultGame);
          }
          if (resultGame.some((player) => player.status === "lost")) {
            console.log("Envoyer le résultat de lose au client");
            socket.emit("PLAYER_LOST", resultGame);
          }

          if (resultGame.some((player) => player.status === "draw")) {
            console.log("Envoyer le résultat de draw au client");
            socket.emit("PLAYER_DRAW", resultGame);
          }
        }
      }
    });

    socket.on("APPLY_AS_VALUE", (playerId, cardAlias, value) => {
      game.applyAsValue(playerId, cardAlias, value);
    });

    socket.on("STAND", (playerId) => {
      const result = game.playerStand(playerId);

      socket.emit("PLAYER_STOOD", { result });

      console.log(`Le joueur ${playerId} a choisi de rester`);

      if (game.dealerCanPlay()) {
        const result = game.dealerPlay();
        if (result.status === "bust") {
          console.log("Le dealer a busté");
          socket.emit("DEALER_BUST", result);
        } else if (result.status === "stood") {
          console.log("Le dealer a stand");
          socket.emit("DEALER_STOOD", result);
        }
      }

      let resultGame = game.calulateResults();
      console.log(resultGame);
      if (resultGame) {
        if (resultGame.some((player) => player.status === "win")) {
          console.log("Envoyer le résultat de win au client");
          socket.emit("PLAYER_WIN", resultGame);
        }
        if (resultGame.some((player) => player.status === "lost")) {
          console.log("Envoyer le résultat de lose au client");
          socket.emit("PLAYER_LOST", resultGame);
        }

        if (resultGame.some((player) => player.status === "draw")) {
          console.log("Envoyer le résultat de draw au client");
          socket.emit("PLAYER_DRAW", resultGame);
        }
      }
    });

    socket.on("DEALER_PLAY", () => {
      game.dealerPlay();
      console.log("Le dealer joue");
    });

    socket.on("authenticate", (playerId, name) => {
      game.addPlayer(playerId, name);
      playerList.push({
        socketId: socket.id,
        playerId: playerId,
        playerName: name,
      });

      game.start();
      let hands = {
        players: game.players,
        dealer: game.dealer.hand,
      };
      socket.emit("GAME_STARTED", hands);
      console.log(hands);
      console.log(`Player ${playerId} authenticated and added to the game`);
    });

    socket.on("START_GAME", () => {
      game.start();
      console.log("Game started");
      socket.emit("GAME_STARTED", {
        players: game.players,
        dealer: game.dealer.hand,
      });
    });

    socket.on("disconnect", (reason) => {
      let player = playerList.find((player) => player.socketId == socket.id);
      playerList = playerList.filter((player) => player.socketId != socket.id);

      console.log(`Un joueur (${player.name}) c'est deconncté : `, reason);
      game.removePlayer(player.playerId);
      console.log(game.players);
    });
  });
}
