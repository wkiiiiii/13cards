const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the client/build directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
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

// Send React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Check for Render environment
const isRender = process.env.RENDER === 'true' || process.env.IS_RENDER === 'true';
console.log('Running on Render:', isRender ? 'Yes' : 'No');

// Additional check for the build directory in Render
if (process.env.NODE_ENV === 'production' && isRender) {
  console.log('Performing additional Render-specific checks');
  
  // Check the file permissions
  try {
    const buildPath = path.join(__dirname, 'client/build');
    execSync(`ls -la ${buildPath}`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Error checking build directory permissions:', err);
  }
} 