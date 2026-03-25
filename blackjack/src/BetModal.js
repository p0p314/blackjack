import { CHIPS } from './Assets.js';
import { loadAssets, getChip } from './Manager/AssetsManager.js';

class BetModal {
  constructor() {
    this.currentBet = 0;
    this.playerMoney = 1000;
    this.playerName = 'Joueur';
    this.selectedChipAmount = null;
    this.chipConfigs = [
      { key: 'WHITE', value: 1 },
      { key: 'RED', value: 5 },
      { key: 'GREEN', value: 25 },
      { key: 'BLUE', value: 100 },
      { key: 'BLACK', value: 500 },
    ];
    this.onDealCallback = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderChips();
  }

  setupEventListeners() {
    document.getElementById('clearBetBtn').addEventListener('click', () => this.clearBet());
    document.getElementById('dealBtn').addEventListener('click', () => this.deal());
  }

  renderChips() {
    const container = document.getElementById('chipsContainer');
    container.innerHTML = '';

    this.chipConfigs.forEach(chipConfig => {
      const { key, value } = chipConfig;
      const chipImagePath = CHIPS[key];

      const button = document.createElement('button');
      button.className = 'chip-button';
      button.id = `chip-${value}`;
      button.innerHTML = `
        <img src="${chipImagePath}" alt="${key} Chip" style="width: 90px; height: 90px; object-fit: contain;">
        <span class="chip-value">$${value}</span>
      `;

      button.addEventListener('click', () => this.addBet(value));
      container.appendChild(button);
    });
  }

  addBet(amount) {
    if (this.currentBet + amount <= this.playerMoney) {
      this.currentBet += amount;
      this.updateDisplay();
      this.updateChipHighlight();
    }
  }

  clearBet() {
    this.currentBet = 0;
    this.updateDisplay();
    this.updateChipHighlight();
  }

  updateDisplay() {
    document.getElementById('playerMoney').textContent = `$${this.playerMoney}`;
    document.getElementById('currentBet').textContent = `$${this.currentBet}`;
    
    const dealBtn = document.getElementById('dealBtn');
    dealBtn.disabled = this.currentBet === 0;
  }

  updateChipHighlight() {
    document.querySelectorAll('.chip-button').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  deal() {
    if (this.currentBet > 0 && this.onDealCallback) {
      this.onDealCallback(this.currentBet);
      this.hide();
    }
  }

  show(playerData = {}) {
    this.playerName = playerData.name || 'Joueur';
    this.playerMoney = playerData.money || 1000;
    this.currentBet = 0;

    document.getElementById('playerName').textContent = this.playerName;
    this.updateDisplay();
    
    const overlay = document.getElementById('betModalOverlay');
    overlay.classList.add('show');
  }

  hide() {
    const overlay = document.getElementById('betModalOverlay');
    overlay.classList.remove('show');
  }

  setOnDealCallback(callback) {
    this.onDealCallback = callback;
  }
}

export default new BetModal();
