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
    console.log('API: GET /api/platforms');
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
    console.log('API: GET /health');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Download routes that were missing
app.post('/api/download/youtube', (req, res) => {
    console.log('API: POST /api/download/youtube');
    res.status(400).json({ 
        error: 'YouTube download temporarily disabled - backend setup needed',
        tip: 'Backend yt-dlp integration required'
    });
});

app.post('/api/download/instagram', (req, res) => {
    console.log('API: POST /api/download/instagram');
    res.status(400).json({ 
        error: 'Instagram download temporarily disabled - backend setup needed',
        tip: 'Backend yt-dlp integration required'
    });
});

app.post('/api/download/tiktok', (req, res) => {
    console.log('API: POST /api/download/tiktok');
    res.status(400).json({ 
        error: 'TikTok download temporarily disabled - backend setup needed',
        tip: 'Backend yt-dlp integration required'
    });
});

app.post('/api/download/twitter', (req, res) => {
    console.log('API: POST /api/download/twitter');
    res.status(400).json({ 
        error: 'Twitter download temporarily disabled - backend setup needed',
        tip: 'Backend yt-dlp integration required'
    });
});

app.post('/api/download', (req, res) => {
    console.log('API: POST /api/download');
    res.status(400).json({ 
        error: 'Generic download temporarily disabled - backend setup needed',
        tip: 'Backend yt-dlp integration required'
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    console.log('Serving: GET /');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/batch.html', (req, res) => {
    console.log('Serving: GET /batch.html');
    res.sendFile(path.join(__dirname, 'public', 'batch.html'));
});

// Catch-all for any other HTML files
app.get('*.html', (req, res) => {
    console.log('Serving HTML:', req.path);
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Page not found');
    }
});

// API catch-all
app.use('/api/*', (req, res) => {
    console.log('API 404:', req.path);
    res.status(404).json({ error: 'API endpoint not found' });
});

// General catch-all
app.use((req, res) => {
    console.log('General 404:', req.path);
    res.status(404).send('Page not found');
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('Available endpoints:');
    console.log('  / - Main page');
    console.log('  /batch.html - Batch download page');
    console.log('  /api/platforms - Platform list');
    console.log('  /health - Health check');
});

console.log('Server setup complete');