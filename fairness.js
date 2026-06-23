const crypto = require('crypto');

function generateFlipResult(serverSeed, clientSeed, nonce) {
    // Combine the seeds and nonce to create a unique puzzle piece
    const combinedInput = `${serverSeed}-${clientSeed}-${nonce}`;
    
    // Hash the input using SHA-256
    const hash = crypto.createHash('sha256').update(combinedInput).digest('hex');
    
    // Take the first 8 characters of the hash and turn it into a number
    const targetHex = hash.substring(0, 8);
    const decimalValue = parseInt(targetHex, 16);
    
    // If the number is even, it's Heads (0). If it's odd, it's Tails (1).
    const outcome = decimalValue % 2 === 0 ? 'Heads' : 'Tails';
    
    return {
        outcome: outcome,
        hash: hash
    };
}

module.exports = { generateFlipResult };
