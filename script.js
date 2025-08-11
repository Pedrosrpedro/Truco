document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO JOGO ---
    const playerHandDisplay = document.getElementById('human-player');
    const cpuHands = {
        cpu1: document.getElementById('cpu-player-1'),
        cpu2: document.getElementById('cpu-player-2'),
        cpu3: document.getElementById('cpu-player-3'),
    };
    const viraDisplay = document.getElementById('vira');
    const newGameButton = document.getElementById('new-game-button');
    const playedCardsContainer = document.getElementById('played-cards-container');
    const difficultySelector = document.getElementById('difficulty');

    // --- VARIÁVEIS DE ESTADO DO JOGO ---
    const suits = { '♦': 'red', '♠': 'black', '♥': 'red', '♣': 'black' };
    const ranks = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    let deck = [];
    let vira;
    let manilhas = [];

    let hands = {
        player: [],
        cpu1: [],
        cpu2: [],
        cpu3: [],
    };

    let turnOrder = ['player', 'cpu1', 'cpu2', 'cpu3']; // A ordem de quem joga
    let currentTurnIndex = 0;
    let playedCards = {}; // Guarda as cartas jogadas na rodada

    // --- FUNÇÕES DE LÓGICA DO JOGO ---

    function createDeck() {
        deck = [];
        for (const suit in suits) {
            for (const rank of ranks) {
                deck.push({ rank, suit, color: suits[suit] });
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function determineManilhas() {
        const viraIndex = ranks.indexOf(vira.rank);
        const manilhaRank = ranks[(viraIndex + 1) % ranks.length];
        // A força da manilha é definida pela ordem dos naipes: Paus > Copas > Espadas > Ouros
        manilhas = [
            { rank: manilhaRank, suit: '♣' }, // Zap
            { rank: manilhaRank, suit: '♥' }, // Copeta
            { rank: manilhaRank, suit: '♠' }, // Espadilha
            { rank: manilhaRank, suit: '♦' }  // Pica-fumo
        ];
        console.log("Vira:", vira.rank, "Manilhas são:", manilhaRank);
    }

    function dealCards() {
        hands.player = deck.splice(0, 3);
        hands.cpu1 = deck.splice(0, 3);
        hands.cpu2 = deck.splice(0, 3);
        hands.cpu3 = deck.splice(0, 3);
        
        vira = deck.pop();
        determineManilhas();
        updateUI();
    }
    
    function getCardValue(card) {
        // Verifica se a carta é uma manilha
        const manilhaIndex = manilhas.findIndex(m => m.rank === card.rank && m.suit === card.suit);
        if (manilhaIndex !== -1) {
            // Quanto menor o índice, mais forte a manilha (Zap=0, Pica-fumo=3)
            return 20 - manilhaIndex; // Ex: Zap=20, Copeta=19, etc.
        }
        // Valor das cartas comuns
        const rankIndex = ranks.indexOf(card.rank);
        return rankIndex; // 3=9, 2=8, A=7, etc.
    }

    // --- LÓGICA DA IA ---

    function getCPUPlay(hand, difficulty) {
        // Nível Fácil: Joga a carta com o menor valor.
        // Nível Médio/Difícil: (A ser melhorado) Joga a carta com maior valor.
        let bestCard = hand[0];
        let bestCardIndex = 0;

        for (let i = 1; i < hand.length; i++) {
            const currentCard = hand[i];
            
            if (difficulty === 'easy' && getCardValue(currentCard) < getCardValue(bestCard)) {
                bestCard = currentCard;
                bestCardIndex = i;
            } else if (difficulty !== 'easy' && getCardValue(currentCard) > getCardValue(bestCard)) {
                bestCard = currentCard;
                bestCardIndex = i;
            }
        }
        
        // Remove a carta da mão e a retorna
        return hand.splice(bestCardIndex, 1)[0];
    }
    
    // --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI) ---

    function createCardElement(card) {
        if (!card) return document.createElement('div');
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        cardDiv.innerHTML = `<span class="value">${card.rank}</span><span class="suit">${card.suit}</span>`;
        // Adiciona um objeto 'cardData' ao elemento para referência futura
        cardDiv.cardData = card;
        return cardDiv;
    }
    
    function updateUI() {
        playerHandDisplay.innerHTML = '';
        hands.player.forEach(card => {
            const cardElement = createCardElement(card);
            cardElement.addEventListener('click', handleCardClick);
            playerHandDisplay.appendChild(cardElement);
        });

        // Limpa e exibe as cartas viradas dos oponentes
        Object.keys(cpuHands).forEach(cpuId => {
            const handDisplay = cpuHands[cpuId];
            handDisplay.innerHTML = '';
            for (let i = 0; i < hands[cpuId].length; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card back';
                handDisplay.appendChild(cardBack);
            }
        });

        viraDisplay.innerHTML = createCardElement(vira).innerHTML;
        viraDisplay.className = `card ${vira.color}`;
    }

    // --- FUNÇÕES DE MANIPULAÇÃO DE JOGO E TURNOS ---

    function handleCardClick(event) {
        if (turnOrder[currentTurnIndex] !== 'player') {
            console.log("Não é a sua vez!");
            return;
        }

        const cardDiv = event.currentTarget;
        const playedCard = cardDiv.cardData;
        
        // Remove a carta da mão do jogador
        const cardIndex = hands.player.findIndex(c => c.rank === playedCard.rank && c.suit === playedCard.suit);
        hands.player.splice(cardIndex, 1);

        playCard(playedCard, 'player');
    }

    function playCard(card, playerId) {
        console.log(`${playerId} jogou: ${card.rank}${card.suit}`);
        playedCards[playerId] = card;

        const cardElement = createCardElement(card);
        cardElement.classList.add('played-card');
        // Define a posição da carta na mesa baseada em quem jogou
        cardElement.id = `played-card-${playerId}`; 
        playedCardsContainer.appendChild(cardElement);

        // Atualiza a UI para remover a carta da mão visualmente
        updateUI();

        processNextTurn();
    }
    
    function processNextTurn() {
        currentTurnIndex++;
        if (currentTurnIndex >= turnOrder.length) {
            console.log("Fim da rodada!");
            // Lógica para determinar o vencedor da rodada viria aqui
            currentTurnIndex = 0;
            playedCards = {};
            // Apenas para demonstração, vamos limpar a mesa após 2 segundos
            setTimeout(() => {
                playedCardsContainer.innerHTML = '';
                alert("Rodada terminada. Próxima rodada!");
            }, 2000);
            return;
        }

        const currentPlayerId = turnOrder[currentTurnIndex];
        if (currentPlayerId !== 'player') {
            // É a vez de uma IA
            setTimeout(() => playAITurn(currentPlayerId), 1000); // Delay para parecer que a IA "pensa"
        }
    }

    function playAITurn(playerId) {
        const difficulty = difficultySelector.value;
        const hand = hands[playerId];
        const cardToPlay = getCPUPlay(hand, difficulty);
        playCard(cardToPlay, playerId);
    }
    
    function startNewGame() {
        console.log("Iniciando novo jogo...");
        currentTurnIndex = 0;
        playedCards = {};
        playedCardsContainer.innerHTML = '';

        createDeck();
        shuffleDeck();
        dealCards();
        
        document.getElementById('player-score').textContent = '0';
        document.getElementById('cpu-score').textContent = '0';

        // Verifica se o primeiro a jogar é uma IA
        if(turnOrder[currentTurnIndex] !== 'player') {
            processNextTurn();
        }
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    newGameButton.addEventListener('click', startNewGame);
    startNewGame();
});
