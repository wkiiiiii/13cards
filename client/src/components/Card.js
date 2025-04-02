import React from 'react';

function Card({ card, onClick, selected, selectable = true }) {
  const { suit, value } = card;
  
  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  return (
    <div 
      className={`card ${suit} ${selected ? 'selected' : ''}`} 
      onClick={selectable ? onClick : undefined}
      style={{ cursor: selectable ? 'pointer' : 'default' }}
    >
      <div>{value}</div>
      <div>{getSuitSymbol(suit)}</div>
    </div>
  );
}

export default Card; 