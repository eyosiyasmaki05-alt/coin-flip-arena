const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
const { generateFlipResult } = require('./fairness.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static frontend files from the root directory
app.use(express.static(path.join(__dirname, './')));

let globalPoolBalance = 10000; // Starting pool balance

// Generate a secure, random Server Seed on launch
const serverSeed = crypto.randomBytes(32).toString('hex');
let nonce = 0;

wss.on('connection', (ws) => {
    // Send the initial pool status immediately to a newly connected player
    ws.send(JSON.stringify({ type: 'INIT', poolBalance: globalPoolBalance }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'FLIP') {
                nonce++;
                const clientSeed = data.clientSeed || 'default_client_seed';
                const betAmount = Number(data.betAmount) || 10;
                const playerChoice = data.choice; // 'Heads' or 'Tails'
                
                // Calculate the provably fair result
                const result = generateFlipResult(serverSeed, clientSeed, nonce);
                
                let playerWon = (result.outcome === playerChoice);
                
                if (playerWon) {
                    globalPoolBalance -= betAmount;
                } else {
                    globalPoolBalance += betAmount;
                }

                // Broadcast the outcome to EVERY connected player instantly
                const response = JSON.stringify({
                    type: 'RESULT',
                    outcome: result.outcome,
                    hash: result.hash,
                    secretSeed: serverSeed,
                    nonce: nonce,
                    playerWon: playerWon,
                    poolBalance: globalPoolBalance
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                    }
                });
            }
        } catch (err) {
            console.error("Error processing player message:", err);
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
