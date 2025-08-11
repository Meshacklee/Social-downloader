const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('=== DEBUG SERVER STARTING ===');
console.log('Current directory:', __dirname);
console.log('Files in directory:', fs.readdirSync(__dirname));
console.log('Public folder exists:', fs.existsSync(path.join(__dirname, 'public')));

const app = express();
const PORT = process.env.PORT || 3000;

// Log all requests
app.use((req, res, next) => {
    console.log(`REQUEST: ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use(express.static('public'));

// Simple test routes
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
            <p>Files in public folder:</p>
            <pre>${JSON.stringify(fs.readdirSync(path.join(__dirname, 'public')), null, 2)}</pre>
        `);
    }
});

app.get('/health', (req, res) => {
    console.log('Serving health route');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        debug: true
    });
});

app.get('/api/test', (req, res) => {
    console.log('Serving API test route');
    res.json({ 
        message: 'API working!',
        debug: true
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== DEBUG SERVER RUNNING ON PORT ${PORT} ===`);
});
app.get('/test-files', (req, res) => {
    const publicPath = path.join(__dirname, 'public');
    const files = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'Public folder not found';
    
    res.json({
        currentDir: __dirname,
        publicPath: publicPath,
        publicExists: fs.existsSync(publicPath),
        publicFiles: files,
        allFiles: fs.readdirSync(__dirname)
    });
});