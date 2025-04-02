import React from 'react';

function PlayersList({ players, currentPlayer, currentTurn }) {
  return (
    <div>
      <h2>Players ({players.length}/4)</h2>
      <div className="players-list">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`player-card ${player.id === currentTurn ? 'current-turn' : ''}`}
          >
            <h3>
              {player.name} 
              {player.id === currentPlayer.id ? ' (You)' : ''}
            </h3>
            {player.ready ? (
              <p className="player-ready">Ready</p>
            ) : (
              <p>Not Ready</p>
            )}
            {player.cardCount !== undefined && (
              <p>Cards: {player.cardCount}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayersList; 