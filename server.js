const express = require('express');
const path = require('path');

console.log('Starting server...');
console.log('Current directory:', __dirname);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Simple routes
app.get('/', (req, res) => {
    console.log('Serving root route');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log('Looking for index.html at:', indexPath);
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <h1>Server Running</h1>
            <p>No index.html found.</p>
        `);
    }
});

app.get('/health', (req, res) => {
    console.log('Serving health route');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Server is healthy'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});