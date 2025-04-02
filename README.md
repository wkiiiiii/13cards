# Chinese Poker

A simple card game with a global game room that can host up to 4 players. The game is designed to run locally or be deployed on Render.

## Game Features

- Single global game room
- Maximum of 4 players
- Real-time gameplay using Socket.IO
- Simple card game mechanics

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (v6 or higher recommended)

### Installation

1. Clone this repository or download the source code
2. Install the dependencies for the server:

```bash
npm install
```

3. Install the dependencies for the client:

```bash
npm run install-client
```

### Running the Application Locally

To run both the server and client concurrently:

```bash
npm run dev-all
```

This will start:
- Backend server on http://localhost:3001
- Frontend client on http://localhost:3000

### Development

If you want to run the server and client separately:

- Server only:
```bash
npm run dev
```

- Client only:
```bash
npm run client
```

## How to Play

1. Open the application in your browser (http://localhost:3000)
2. Enter your name and join the game
3. Click "Ready to Play" when you're ready
4. When all players are ready (minimum 2), the game will start
5. On your turn, select cards to play and click "Play Selected Cards"
6. The first player to play all their cards wins

## Deployment

The application is configured to run on Render:

1. Connect your GitHub repository to Render
2. Set up a new Web Service with the following settings:
   - Build Command: `npm install && npm run install-client && npm run build`
   - Start Command: `npm start`

## Technologies Used

- **Frontend**: React, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Render compatible 