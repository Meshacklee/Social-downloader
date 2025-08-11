const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('=== DEBUG SERVER STARTING ===');
console.log('Current directory:', __dirname);
console.log('Files in directory:', fs.readdirSync(__dirname));

// Check if public folder exists
const publicPath = path.join(__dirname, 'public');
console.log('Public folder exists:', fs.existsSync(publicPath));
if (fs.existsSync(publicPath)) {
    console.log('Files in public:', fs.readdirSync(publicPath));
}

const app = express();
const PORT = process.env.PORT || 3000;

// Log all requests
app.use((req, res, next) => {
    console.log(`=== REQUEST: ${req.method} ${req.path} ===`);
    next();
});

// Middleware
app.use(express.json());

// Serve static files FIRST
app.use(express.static('public'));

// Simple test routes
app.get('/test', (req, res) => {
    console.log('Serving /test route');
    res.json({ message: 'Test route working!' });
});

app.get('/api/test', (req, res) => {
    console.log('Serving /api/test route');
    res.json({ message: 'API test route working!' });
});

app.get('/api/platforms', (req, res) => {
    console.log('Serving /api/platforms route');
    res.json({
        platforms: [
            { name: 'YouTube', icon: '📺' },
            { name: 'Test', icon: '✅' }
        ]
    });
});

// Serve main pages
app.get('/', (req, res) => {
    console.log('Serving root route');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log('Looking for index.html at:', indexPath);
    console.log('index.html exists:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <h1>Debug Server</h1>
            <p>Files available:</p>
            <ul>
                <li><a href="/test">Test Route</a></li>
                <li><a href="/api/test">API Test</a></li>
                <li><a href="/api/platforms">Platforms API</a></li>
            </ul>
        `);
    }
});

// Health check
app.get('/health', (req, res) => {
    console.log('Serving health route');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all to see what's being requested
app.use('*', (req, res) => {
    console.log('=== CATCH-ALL TRIGGERED ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method,
        message: 'This route is not defined in the server'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== DEBUG SERVER RUNNING ON PORT ${PORT} ===`);
    console.log('Test URLs:');
    console.log(`  http://localhost:${PORT}/`);
    console.log(`  http://localhost:${PORT}/test`);
    console.log(`  http://localhost:${PORT}/api/test`);
    console.log(`  http://localhost:${PORT}/api/platforms`);
});