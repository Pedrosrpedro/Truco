// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve o arquivo HTML principal quando alguém acessa o site
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const gameRooms = {}; // Objeto para armazenar o estado de todas as salas de jogo

io.on('connection', (socket) => {
    console.log(`Jogador conectado: ${socket.id}`);

    // --- LÓGICA DE SALAS ---
    socket.on('criarSala', () => {
        const roomId = `SALA_${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        socket.join(roomId);
        gameRooms[roomId] = {
            players: [{ id: socket.id, name: 'Jogador 1' }],
            gameState: null
        };
        socket.emit('salaCriada', roomId);
        console.log(`Sala criada: ${roomId} por ${socket.id}`);
    });

    socket.on('entrarNaSala', (roomId) => {
        if (gameRooms[roomId] && gameRooms[roomId].players.length < 2) {
            socket.join(roomId);
            gameRooms[roomId].players.push({ id: socket.id, name: 'Jogador 2' });
            console.log(`${socket.id} entrou na sala ${roomId}`);

            // Avisa os dois jogadores que a partida vai começar
            io.to(roomId).emit('partidaIniciada', { players: gameRooms[roomId].players });
            iniciarNovaMao(roomId);
        } else {
            socket.emit('erro', 'A sala não existe ou está cheia.');
        }
    });

    // --- LÓGICA DO JOGO ---
    socket.on('jogarCarta', ({ roomId, carta }) => {
        const room = gameRooms[roomId];
        // Validação básica (quem jogou? é a vez dele?)
        // (uma lógica mais robusta seria necessária para um jogo real)
        
        console.log(`Jogador ${socket.id} jogou ${carta.valor}${carta.naipe} na sala ${roomId}`);

        // Avisa a todos na sala sobre a jogada
        io.to(roomId).emit('cartaJogada', { jogadorId: socket.id, carta: carta });

        // Aqui entraria a lógica de quem venceu a rodada, etc.
        // Por simplicidade, essa parte terá que ser expandida.
    });
    
    socket.on('pedirTruco', (roomId) => {
        const player = gameRooms[roomId].players.find(p => p.id === socket.id);
        // Emite para o OUTRO jogador
        socket.to(roomId).emit('trucoRecebido', { message: `${player.name} pediu TRUCO!` });
    });


    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        // Encontra a sala em que o jogador estava e avisa o oponente
        for (const roomId in gameRooms) {
            const room = gameRooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Remove o jogador da sala
                room.players.splice(playerIndex, 1);
                // Avisa o outro jogador
                io.to(roomId).emit('oponenteDesconectou');
                // Deleta a sala se estiver vazia
                if (room.players.length === 0) {
                    delete gameRooms[roomId];
                    console.log(`Sala ${roomId} vazia, deletada.`);
                }
                break;
            }
        }
    });
});

function iniciarNovaMao(roomId) {
    const room = gameRooms[roomId];
    if (!room || room.players.length < 2) return;

    const naipes = ['♦', '♠', '♥', '♣'];
    const valores = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    let baralho = [];
    for (const naipe of naipes) {
        for (const valor of valores) {
            baralho.push({ valor, naipe });
        }
    }

    // Embaralhar
    for (let i = baralho.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
    }

    const vira = baralho[6];
    const viraIndex = valores.indexOf(vira.valor);
    const manilha = viraIndex === valores.length - 1 ? valores[0] : valores[viraIndex + 1];

    const maoJogador1 = baralho.slice(0, 3);
    const maoJogador2 = baralho.slice(3, 6);

    room.gameState = {
        placarNos: 0, // Jogador 1
        placarEles: 0, // Jogador 2
        vira: vira,
        manilha: manilha,
        turno: room.players[0].id // O primeiro a entrar começa jogando
    };
    
    // Envia para cada jogador sua mão específica e o estado do jogo
    io.to(room.players[0].id).emit('maoRecebida', { 
        mao: maoJogador1, 
        gameState: room.gameState 
    });
    io.to(room.players[1].id).emit('maoRecebida', { 
        mao: maoJogador2, 
        gameState: room.gameState 
    });

    console.log(`Nova mão distribuída na sala ${roomId}`);
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor ouvindo na porta ${PORT}`);
});
