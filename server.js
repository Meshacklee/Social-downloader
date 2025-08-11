const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// CRITICAL: Use Render's PORT or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Your existing routes here...
// ... all your existing code ...

// CRITICAL: Make sure this is at the end of your server.js
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('Social Media Downloader ready!');
});


// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit - let Render handle restarts
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - let Render handle restarts
});

// Make sure server starts
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('Social Media Downloader ready!');
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
});