import React, { useState } from 'react';
import Card from './Card';
import PlayersList from './PlayersList';

function GameRoom({ 
  player, 
  players, 
  hand, 
  onReady, 
  gameInProgress, 
  currentTurn,
  onPlayCards,
  lastPlayedCards,
  winner
}) {
  const [selectedCards, setSelectedCards] = useState([]);
  
  const handleCardClick = (index) => {
    if (currentTurn !== player.id || winner) return;
    
    setSelectedCards(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  const handlePlayCards = () => {
    if (selectedCards.length > 0) {
      onPlayCards(selectedCards);
      setSelectedCards([]);
    }
  };
  
  const isMyTurn = currentTurn === player.id;
  const isReady = players.find(p => p.id === player.id)?.ready || false;
  
  return (
    <div className="game-room">
      <PlayersList 
        players={players} 
        currentPlayer={player} 
        currentTurn={currentTurn}
      />
      
      {!gameInProgress && !isReady && (
        <div className="game-actions">
          <button onClick={onReady}>
            Ready to Play
          </button>
        </div>
      )}
      
      {lastPlayedCards && (
        <div className="played-cards">
          <h3>{lastPlayedCards.playerName} played:</h3>
          <div className="player-cards">
            {lastPlayedCards.cards.map((card, index) => (
              <Card 
                key={index} 
                card={card} 
                selectable={false}
              />
            ))}
          </div>
        </div>
      )}
      
      {gameInProgress && (
        <>
          <h2>Your Cards {isMyTurn ? "(Your Turn)" : ""}</h2>
          <div className="player-cards">
            {hand.map((card, index) => (
              <Card 
                key={index} 
                card={card} 
                onClick={() => handleCardClick(index)}
                selected={selectedCards.includes(index)}
                selectable={isMyTurn}
              />
            ))}
          </div>
          
          {isMyTurn && (
            <div className="game-actions">
              <button 
                onClick={handlePlayCards}
                disabled={selectedCards.length === 0}
              >
                Play Selected Cards
              </button>
            </div>
          )}
        </>
      )}
      
      {winner && (
        <div className="game-actions">
          <h2>{winner === player.name ? "You won!" : `${winner} won!`}</h2>
          {!isReady && (
            <button onClick={onReady}>
              Ready for Next Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default GameRoom; 