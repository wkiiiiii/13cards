const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the client/build directory in production
if (process.env.NODE_ENV === 'production') {
  // Check if the client/build directory exists
  const buildPath = path.join(__dirname, 'client/build');
  if (fs.existsSync(buildPath)) {
    console.log('Serving static files from:', buildPath);
    app.use(express.static(buildPath));
  } else {
    console.log('Warning: Build directory does not exist at:', buildPath);
  }
}

// Game state
const gameRoom = {
  players: [],
  maxPlayers: 4,
  gameInProgress: false,
  deck: [],
  currentTurn: null
};

// Card deck setup
function initializeDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

// Deal cards to players
function dealCards() {
  gameRoom.deck = initializeDeck();
  
  const playerCount = gameRoom.players.length;
  const cardsPerPlayer = Math.floor(gameRoom.deck.length / playerCount);
  
  gameRoom.players.forEach((player, index) => {
    player.hand = gameRoom.deck.slice(
      index * cardsPerPlayer, 
      (index + 1) * cardsPerPlayer
    );
  });
}

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle player joining
  socket.on('joinGame', (playerName) => {
    if (gameRoom.players.length >= gameRoom.maxPlayers) {
      socket.emit('roomFull');
      return;
    }
    
    if (gameRoom.gameInProgress) {
      socket.emit('gameInProgress');
      return;
    }
    
    const player = {
      id: socket.id,
      name: playerName || `Player ${gameRoom.players.length + 1}`,
      hand: [],
      ready: false
    };
    
    gameRoom.players.push(player);
    socket.join('gameRoom');
    
    socket.emit('playerJoined', player);
    io.to('gameRoom').emit('updatePlayers', gameRoom.players);
    
    console.log(`${player.name} joined the game`);
  });
  
  // Handle player ready status
  socket.on('playerReady', () => {
    const playerIndex = gameRoom.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      gameRoom.players[playerIndex].ready = true;
      io.to('gameRoom').emit('updatePlayers', gameRoom.players);
      
      // Check if all players are ready
      const allReady = gameRoom.players.length >= 2 && 
                      gameRoom.players.every(p => p.ready);
      
      if (allReady) {
        gameRoom.gameInProgress = true;
        dealCards();
        gameRoom.currentTurn = gameRoom.players[0].id;
        
        // Send each player their own cards
        gameRoom.players.forEach(player => {
          io.to(player.id).emit('gameStarted', {
            hand: player.hand,
            currentTurn: gameRoom.currentTurn
          });
        });
        
        io.to('gameRoom').emit('updateGameState', {
          gameInProgress: gameRoom.gameInProgress,
          players: gameRoom.players.map(p => ({
            id: p.id,
            name: p.name,
            cardCount: p.hand.length
          })),
          currentTurn: gameRoom.currentTurn
        });
      }
    }
  });
  
  // Handle player disconnection
  socket.on('disconnect', () => {
    const playerIndex = gameRoom.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      const playerName = gameRoom.players[playerIndex].name;
      gameRoom.players.splice(playerIndex, 1);
      io.to('gameRoom').emit('updatePlayers', gameRoom.players);
      console.log(`${playerName} left the game`);
      
      // Reset game if in progress and a player leaves
      if (gameRoom.gameInProgress) {
        gameRoom.gameInProgress = false;
        gameRoom.currentTurn = null;
        gameRoom.players.forEach(p => p.ready = false);
        io.to('gameRoom').emit('gameStopped', 'A player left the game');
      }
    }
    
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle card play
  socket.on('playCard', (cardIndices) => {
    if (!gameRoom.gameInProgress || gameRoom.currentTurn !== socket.id) {
      return;
    }
    
    const playerIndex = gameRoom.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    
    const player = gameRoom.players[playerIndex];
    const playedCards = cardIndices.map(i => player.hand[i]);
    
    // Remove played cards from player's hand
    player.hand = player.hand.filter((_, i) => !cardIndices.includes(i));
    
    // Move to next player's turn
    const nextPlayerIndex = (playerIndex + 1) % gameRoom.players.length;
    gameRoom.currentTurn = gameRoom.players[nextPlayerIndex].id;
    
    // Emit events
    io.to('gameRoom').emit('cardPlayed', {
      playerId: socket.id,
      playerName: player.name,
      cards: playedCards
    });
    
    io.to('gameRoom').emit('updateGameState', {
      players: gameRoom.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length
      })),
      currentTurn: gameRoom.currentTurn
    });
    
    // Check for winner
    if (player.hand.length === 0) {
      io.to('gameRoom').emit('gameOver', {
        winner: player.name
      });
      
      // Reset game state
      gameRoom.gameInProgress = false;
      gameRoom.players.forEach(p => {
        p.hand = [];
        p.ready = false;
      });
    }
  });
});

// API routes
app.get('/api/game-status', (req, res) => {
  res.json({
    playerCount: gameRoom.players.length,
    maxPlayers: gameRoom.maxPlayers,
    gameInProgress: gameRoom.gameInProgress
  });
});

// Create a simple index.html for the root route if client/build doesn't exist
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Send React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'client/build', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback to a simple HTML page if the build doesn't exist
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Chinese Poker</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background-color: #2c3e50;
                color: #ecf0f1;
              }
              h1 { color: #e74c3c; }
              p { margin-bottom: 20px; }
              .card-container {
                display: flex;
                margin-top: 30px;
              }
              .card {
                width: 80px;
                height: 120px;
                margin: 0 10px;
                background-color: white;
                border-radius: 5px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: black;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              }
              .hearts, .diamonds { color: #e74c3c; }
              .server-status {
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #34495e;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <h1>Chinese Poker Game</h1>
            <p>Server is running, but the client build is not available.</p>
            <div class="card-container">
              <div class="card hearts">
                <div>A</div>
                <div>♥</div>
              </div>
              <div class="card spades">
                <div>K</div>
                <div>♠</div>
              </div>
              <div class="card diamonds">
                <div>Q</div>
                <div>♦</div>
              </div>
              <div class="card clubs">
                <div>J</div>
                <div>♣</div>
              </div>
            </div>
            <div class="server-status">
              Server is ready to accept connections
            </div>
          </body>
        </html>
      `);
    }
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 