import socketManager from '/src/socket/SocketManager.js';
import { ClientEvents, ServerEvents } from '/src/socket/SocketEvents.js';

class LobbyManager {
  constructor() {
    this.currentPlayer = null;
    this.players = [];
    this.gameStarting = false;
    this.init();
  }

  async init() {
    // Get current user info
    await this.getCurrentUser();
    
    // Connect socket
    try {
      await socketManager.connect();
      console.log('Socket connecté au lobby');
      
      // Join lobby with player info
      if (this.currentPlayer) {
        socketManager.emit(ClientEvents.JOIN_LOBBY, {
          playerId: this.currentPlayer.id_joueur,
          name: this.currentPlayer.pseudo,
        });
      }
      
      // Set up event listeners
      this.setupSocketListeners();
    } catch (error) {
      console.error('Erreur connexion socket:', error);
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch('http://localhost:3000/api/me', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.loggedIn) {
        this.currentPlayer = data.user;
        document.getElementById('userInfo').textContent = `Bienvenue, ${data.user.pseudo}`;
      } else {
        // Redirect to home if not logged in
        window.location.href = './home.html';
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      window.location.href = './home.html';
    }
  }

  setupSocketListeners() {
    // Lobby updated event
    socketManager.onLobbyUpdated((data) => {
      console.log('Lobby mis à jour:', data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
      this.checkStartGameButton();
    });

    // Player joined event
    socketManager.onPlayerJoined((data) => {
      console.log('Joueur rejoint:', data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
      this.checkStartGameButton();
    });

    // Player left event
    socketManager.onPlayerLeft((data) => {
      console.log('Joueur quitté:', data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
    });

    // Game starting event
    socketManager.onGameStarting((data) => {
      console.log('Partie en cours de démarrage:', data);
      this.gameStarting = true;
      
      // Redirect to game page
      setTimeout(() => {
        window.location.href = './index.html';
      }, 1500);
    });

    // Error handler
    socketManager.onError((error) => {
      console.error('Erreur socket:', error);
    });
  }

  updatePlayersList() {
    const playersList = document.getElementById('playersList');
    
    if (!this.players || this.players.length === 0) {
      playersList.innerHTML = '<li class="empty-state">En attente de joueurs...</li>';
      return;
    }

    playersList.innerHTML = this.players.map(player => `
      <li class="player-item">
        <span class="player-name">${player.name}</span>
        <span class="player-status">${player.status === 'ready' ? 'Pret' : 'En attente'}</span>
      </li>
    `).join('');
  }

  updatePlayerCount() {
    const count = this.players.length;
    const maxPlayers = 4;
    document.getElementById('playerCount').textContent = `${count} / ${maxPlayers} joueurs`;
  }

  checkStartGameButton() {
    const startBtn = document.getElementById('startGameBtn');
    const playersCount = this.players.length;
    
    // Game can start with at least 1 player
    // and current player is the first one (dealer)
    const isDealer = this.currentPlayer && this.players[0]?.id === this.currentPlayer.id_joueur;
    
    if (playersCount >= 1 && isDealer && !this.gameStarting) {
      startBtn.disabled = false;
    } else {
      startBtn.disabled = true;
    }
  }

  showNotification(message, type = 'success') {
    // Notifications disabled - using console logging only
    console.log(`[${type}] ${message}`);
  }

  leaveLobby() {
    if (this.currentPlayer) {
      socketManager.leaveLobby(this.currentPlayer.id_joueur);
    }
    window.location.href = './home.html';
  }

  startGame() {
    if (!this.gameStarting && this.players.length > 0) {
      socketManager.startGame();
      console.log('Demarrage de la partie...');
    }
  }
}

// Initialize
const lobbyManager = new LobbyManager();

// Setup button listeners
document.getElementById('startGameBtn').addEventListener('click', () => {
  lobbyManager.startGame();
});

document.getElementById('leaveBtn').addEventListener('click', () => {
  if (confirm('Êtes-vous sûr de vouloir quitter le lobby ?')) {
    lobbyManager.leaveLobby();
  }
});

// Handle window close
window.addEventListener('beforeunload', () => {
  if (lobbyManager.currentPlayer) {
    socketManager.leaveLobby(lobbyManager.currentPlayer.id_joueur);
  }
});
