const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('Starting server...');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple routes
app.get('/', (req, res) => {
    res.send('<h1>Social Media Downloader</h1><p>Server is running!</p>');
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Server is healthy'
    });
});

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working!',
        version: '1.0.0'
    });
});

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('Health check available at /health');
});

console.log('Server setup complete');