import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import LoginForm from './components/LoginForm';
import GameRoom from './components/GameRoom';

let socket;

function App() {
  const [connected, setConnected] = useState(false);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [hand, setHand] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [notification, setNotification] = useState('');
  const [lastPlayedCards, setLastPlayedCards] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socket = io();
    
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });
    
    // Game events
    socket.on('playerJoined', (playerData) => {
      setPlayer(playerData);
      setNotification(`You joined the game as ${playerData.name}`);
    });
    
    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
    
    socket.on('roomFull', () => {
      setNotification('Game room is full (max 4 players)');
    });
    
    socket.on('gameInProgress', () => {
      setNotification('Game is already in progress. Please wait for the next round.');
    });
    
    socket.on('gameStarted', (data) => {
      setHand(data.hand);
      setCurrentTurn(data.currentTurn);
      setGameInProgress(true);
      setNotification('Game started!');
      setLastPlayedCards(null);
      setWinner(null);
    });
    
    socket.on('updateGameState', (gameState) => {
      setPlayers(gameState.players);
      setCurrentTurn(gameState.currentTurn);
    });
    
    socket.on('cardPlayed', (data) => {
      setLastPlayedCards({
        playerName: data.playerName,
        cards: data.cards
      });
      setNotification(`${data.playerName} played ${data.cards.length} card(s)`);
    });
    
    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      setGameInProgress(false);
      setNotification(`Game over! ${data.winner} wins!`);
    });
    
    socket.on('gameStopped', (reason) => {
      setGameInProgress(false);
      setHand([]);
      setNotification(reason);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinGame = (playerName) => {
    socket.emit('joinGame', playerName);
  };
  
  const handleReady = () => {
    socket.emit('playerReady');
    setNotification('You are ready. Waiting for other players...');
  };
  
  const handlePlayCards = (cardIndices) => {
    socket.emit('playCard', cardIndices);
  };

  return (
    <div className="app">
      <h1>Chinese Poker</h1>
      
      {notification && (
        <div className="notification">{notification}</div>
      )}
      
      {!player ? (
        <LoginForm onJoin={handleJoinGame} />
      ) : (
        <GameRoom 
          player={player}
          players={players}
          hand={hand}
          onReady={handleReady}
          gameInProgress={gameInProgress}
          currentTurn={currentTurn}
          onPlayCards={handlePlayCards}
          lastPlayedCards={lastPlayedCards}
          winner={winner}
        />
      )}
    </div>
  );
}

export default App; 