document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO JOGO ---
    const playerHandDisplay = document.getElementById('human-player');
    const viraDisplay = document.getElementById('vira');
    const newGameButton = document.getElementById('new-game-button');
    const playedCardsContainer = document.getElementById('played-cards-container');

    // --- VARIÁVEIS DE ESTADO DO JOGO ---
    const suits = { '♦': 'red', '♠': 'black', '♥': 'red', '♣': 'black' };
    const ranks = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    let deck = [];
    let playerHand = [];
    // ... (mãos dos outros jogadores e outras variáveis virão aqui)

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

    function dealCards() {
        // Por enquanto, vamos distribuir apenas para o jogador humano
        playerHand = deck.splice(0, 3);
        // Os outros 9 cartas seriam para os CPUs
        deck.splice(0, 9); 
        
        const vira = deck.pop();
        
        updateUI(vira);
    }

    // --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI) ---

    function createCardElement(card, index) {
        if (!card) return document.createElement('div'); // Retorna div vazia se a carta for nula

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        // Adiciona um 'data-index' para sabermos qual carta foi clicada
        if (index !== undefined) {
            cardDiv.dataset.index = index;
        }
        
        cardDiv.innerHTML = `<span class="value">${card.rank}</span><span class="suit">${card.suit}</span>`;
        
        // Adiciona o evento de clique diretamente aqui
        cardDiv.addEventListener('click', handleCardClick);
        
        return cardDiv;
    }
    
    function updateUI(vira) {
        // Limpa a mão do jogador e a mesa
        playerHandDisplay.innerHTML = '';
        playedCardsContainer.innerHTML = '';
        
        // Mostra as cartas do jogador
        playerHand.forEach((card, index) => {
            playerHandDisplay.appendChild(createCardElement(card, index));
        });
        
        // Mostra a carta Vira
        viraDisplay.innerHTML = createCardElement(vira).innerHTML;
        viraDisplay.className = `card ${vira.color}`; // Garante que a cor da vira esteja correta
    }
    
    // --- FUNÇÕES DE MANIPULAÇÃO DE EVENTOS ---
    
    function handleCardClick(event) {
        // 'currentTarget' é o elemento .card que tem o listener
        const cardDiv = event.currentTarget; 
        const cardIndex = cardDiv.dataset.index;
        
        if (cardIndex === undefined) return;

        const playedCard = playerHand[cardIndex];

        console.log(`Jogador jogou: ${playedCard.rank} de ${playedCard.suit}`);

        // Move a carta para a mesa
        cardDiv.classList.add('played-card');
        cardDiv.id = 'played-card-player';
        playedCardsContainer.appendChild(cardDiv);

        // Lógica da IA viria aqui
        // Por enquanto, vamos simular uma jogada da IA depois de 1 segundo
        setTimeout(() => {
            alert("Vez da IA jogar!");
            // Aqui você implementaria a lógica para a IA escolher e jogar uma carta.
        }, 1000);
    }

    function startNewGame() {
        console.log("Iniciando novo jogo...");
        createDeck();
        shuffleDeck();
        dealCards();
        // Resetar placares e outros estados de jogo viria aqui
        document.getElementById('player-score').textContent = '0';
        document.getElementById('cpu-score').textContent = '0';
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    newGameButton.addEventListener('click', startNewGame);
    
    // Inicia o primeiro jogo assim que a página carrega
    startNewGame();
});
