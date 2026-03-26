import Scene from "./Scene.js";
import ImageView from "../Manager/ImageView.js";
import ButtonView from "../Manager/ButtonView.js";
import TextView from "../Manager/TextView.js";
import { getAsset, getCard, getBackCards } from "../Manager/AssetsManager.js";
import { calculateHandValue, resultLabel } from "../utils/gameHelpers.js";

class SceneRenderer {
  constructor(canvas, { cardWidth, cardHeight, cardSpacing, maxPlayers }) {
    this.canvas = canvas;
    this.cardWidth = cardWidth;
    this.cardHeight = cardHeight;
    this.cardSpacing = cardSpacing;
    this.maxPlayers = maxPlayers;

    this.backgroundScene = new Scene();
    this.gameScene = new Scene();

    this.buttons = {
      hit: null,
      stand: null,
      playAgain: null,
      leave: null,
    };
  }

  buildStaticBackground() {
    this.backgroundScene.clear();

    this.backgroundScene.add(
      new ImageView(
        getAsset("FOND"),
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      ),
    );

    this.backgroundScene.add(
      new ImageView(
        getAsset("TAPIS"),
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      ),
    );
  }

  handleClick(x, y) {
    this.gameScene.handleClick(x, y);
  }

  renderFrame(
    ctx,
    {
      banner,
      currentUser,
      isHost,
      players,
      dealer,
      resultsByPlayerId,
      localPlayerId,
      phase,
      canAct,
      onHit,
      onStand,
      onLeaveGame,
      onPlayAgain,
    },
  ) {
    this.gameScene.clear();

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.renderTopBar(width, banner, currentUser, isHost, players.length);
    this.renderDealerArea(width, dealer);

    const seats = this.seatLayouts();
    const orderedPlayers = this.orderedPlayersForRender(players, localPlayerId);
    this.renderPlayersArea(
      seats,
      orderedPlayers,
      resultsByPlayerId,
      localPlayerId,
    );

    const showReplay = phase === "finished";
    this.renderControls(width, height, {
      canAct,
      showReplay,
      onHit,
      onStand,
      onLeaveGame,
      onPlayAgain,
    });

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.backgroundScene.draw(ctx);
    this.gameScene.draw(ctx);
  }

  renderTopBar(width, banner, currentUser, isHost, playerCount) {
    this.addTextToScene({
      text: "BLACKJACK",
      x: 30,
      y: 26,
      color: "#ffffff",
      font: "700 34px Arial",
    });

    this.addTextToScene({
      text: currentUser
        ? `${currentUser.pseudo}${isHost ? " • Host" : ""}`
        : "",
      x: width - 30,
      y: 28,
      color: "#ffffff",
      font: "600 22px Arial",
      align: "right",
    });

    this.addTextToScene({
      text: banner,
      x: width / 2,
      y: 42,
      color: "#f7f7f7",
      font: "600 24px Arial",
      align: "center",
    });

    this.addTextToScene({
      text: `Joueurs connectés : ${playerCount}`,
      x: width / 2,
      y: 76,
      color: "rgba(255,255,255,0.85)",
      font: "18px Arial",
      align: "center",
    });
  }

  renderDealerArea(width, dealer) {
    this.addHandToScene(dealer.hand, width / 2, 120);

    this.addTextToScene({
      text: `Dealer • ${resultLabel(dealer.status)} • ${dealer.score}`,
      x: width / 2,
      y: 104,
      color: "#ffffff",
      font: "600 22px Arial",
      align: "center",
    });
  }

  renderPlayersArea(seats, orderedPlayers, resultsByPlayerId, localPlayerId) {
    orderedPlayers.forEach((player, index) => {
      const seat = seats[index];
      const isLocal = player.id === localPlayerId;
      const result = resultsByPlayerId?.get(player.id);

      this.addHandToScene(player.hand, seat.x, seat.y);

      const titleColor = isLocal ? "#ffd54a" : "#ffffff";
      const subtitleColor = result ? "#9effa8" : "rgba(255,255,255,0.82)";
      const score =
        typeof player.score === "number"
          ? player.score
          : calculateHandValue(player.hand);

      this.addTextToScene({
        text: `${player.name}${isLocal ? " (vous)" : ""}`,
        x: seat.x,
        y: seat.y - 42,
        color: titleColor,
        font: "700 22px Arial",
        align: "center",
      });

      this.addTextToScene({
        text: `${result ? resultLabel(result) : resultLabel(player.status)} • ${score}`,
        x: seat.x,
        y: seat.y - 16,
        color: subtitleColor,
        font: "18px Arial",
        align: "center",
      });
    });
  }

  renderControls(
    width,
    height,
    { canAct, showReplay, onHit, onStand, onLeaveGame, onPlayAgain },
  ) {
    this.addButton("leave", {
      x: width - 475,
      y: height - 92,
      width: 100,
      height: 52,
      text: "QUITTER",
      background: "#b33a3a",
      enabled: true,
      onClick: onLeaveGame,
    });

    this.addButton("hit", {
      x: width - 360,
      y: height - 92,
      width: 100,
      height: 52,
      text: "TIRER",
      background: "#0d8f49",
      enabled: canAct,
      onClick: onHit,
    });

    this.addButton("stand", {
      x: width - 245,
      y: height - 92,
      width: 100,
      height: 52,
      text: "RESTER",
      background: "#865f09",
      enabled: canAct,
      onClick: onStand,
    });

    this.addButton("playAgain", {
      x: width - 130,
      y: height - 92,
      width: 100,
      height: 52,
      text: "REJOUER",
      background: "#325ec9",
      enabled: showReplay,
      onClick: onPlayAgain,
    });
  }

  seatLayouts() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    return [
      { x: w / 2, y: h * 0.77, align: "center" },
      { x: w * 0.2, y: h * 0.58, align: "left" },
      { x: w * 0.8, y: h * 0.58, align: "right" },
      { x: w / 2, y: h * 0.46, align: "center" },
    ];
  }

  orderedPlayersForRender(players, localPlayerId) {
    const local = players.find((player) => player.id === localPlayerId);
    const others = players.filter((player) => player.id !== localPlayerId);
    return [local, ...others].filter(Boolean).slice(0, this.maxPlayers);
  }

  handStartX(centerX, cardCount) {
    const totalWidth =
      this.cardWidth + Math.max(0, cardCount - 1) * this.cardSpacing;
    return centerX - totalWidth / 2;
  }

  addHandToScene(cards, centerX, y) {
    const startX = this.handStartX(centerX, cards.length);

    cards.forEach((card, index) => {
      this.gameScene.add(
        new ImageView(
          this.cardImage(card),
          startX + index * this.cardSpacing,
          y,
          this.cardWidth,
          this.cardHeight,
        ),
      );
    });
  }

  addTextToScene(config) {
    this.gameScene.add(new TextView(config));
  }

  addButton(key, config) {
    const button = new ButtonView(config);
    this.buttons[key] = button;
    this.gameScene.add(button);
  }

  cardImage(card) {
    if (!card) {
      return getBackCards("BLACK");
    }

    if (card.isRevealed === false) {
      return getBackCards("BLACK");
    }

    return getCard(card.alias) ?? getBackCards("BLACK");
  }
}

export default SceneRenderer;
