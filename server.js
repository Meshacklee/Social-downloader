const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('Starting server...');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve downloaded videos
app.use('/downloads', express.static('downloads'));

// API Routes
app.get('/api/platforms', (req, res) => {
    res.json({
        platforms: [
            { name: 'YouTube', key: 'youtube', icon: '📺' },
            { name: 'Instagram', key: 'instagram', icon: '📱' },
            { name: 'TikTok', key: 'tiktok', icon: '🎵' },
            { name: 'Twitter/X', key: 'twitter', icon: '🐦' },
            { name: 'Other Platforms', key: 'generic', icon: '🔗' }
        ]
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/batch.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'batch.html'));
});

// Add a catch-all for any other HTML files
app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Page not found');
    }
});

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// 404 handler for all other routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('Health check available at /health');
});

console.log('Server setup complete');