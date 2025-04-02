import React, { useState } from 'react';

function LoginForm({ onJoin }) {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName.trim());
    }
  };

  return (
    <div className="login-container">
      <h2>Join Game Room</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
        />
        <button type="submit">Join Game</button>
      </form>
    </div>
  );
}

export default LoginForm; 