const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Use Render's PORT or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve downloaded videos
app.use('/downloads', express.static('downloads'));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

// Helper function to get the most recent file
function getMostRecentFile(dir) {
    try {
        const files = fs.readdirSync(dir);
        if (files.length === 0) return null;
        
        const recentFiles = files
            .map(file => ({ file, mtime: fs.statSync(path.join(dir, file)).mtime }))
            .sort((a, b) => b.mtime - a.mtime);
        
        return recentFiles[0] ? recentFiles[0].file : null;
    } catch (error) {
        console.error('Error reading directory:', error);
        return null;
    }
}

// Enhanced download function with platform-specific handling
function downloadVideo(url, format = 'best') {
    return new Promise((resolve, reject) => {
        // Auto-detect platform and choose appropriate yt-dlp
        const isWindows = process.platform === 'win32';
        const ytDlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
        
        // Ensure downloads directory exists
        const downloadsDirectory = path.join(__dirname, 'downloads');
        if (!fs.existsSync(downloadsDirectory)) {
            fs.mkdirSync(downloadsDirectory, { recursive: true });
        }
        
        // Get initial file count
        const initialFiles = fs.readdirSync(downloadsDirectory);
        
        // Platform-specific configurations (COMPATIBLE OPTIONS ONLY)
        let platformOptions = [];
        let formatSelection = format;
        
        if (url.includes('instagram.com')) {
            // Instagram-specific options (COMPATIBLE)
            platformOptions = [
                '--socket-timeout', '30',
                '--retries', '2',
                '--fragment-retries', '2',
                '--no-warnings',
                '--no-check-certificate'
            ];
            formatSelection = 'bv*+ba/b'; // Better format selection for Instagram
        } 
        else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // YouTube-specific options
            platformOptions = [
                '--socket-timeout', '30',
                '--retries', '2',
                '--fragment-retries', '2'
            ];
            formatSelection = 'bv*+ba/b'; // Best video + best audio
        }
        else if (url.includes('tiktok.com')) {
            // TikTok-specific options
            platformOptions = [
                '--socket-timeout', '30',
                '--retries', '2',
                '--fragment-retries', '2',
                '--no-check-certificate'
            ];
            formatSelection = 'bv*+ba/b';
        }
        else {
            // Generic options for other platforms
            platformOptions = [
                '--socket-timeout', '30',
                '--retries', '2',
                '--fragment-retries', '2',
                '--no-check-certificate'
            ];
            formatSelection = 'bv*+ba/b';
        }
        
        // Handle "best" format properly
        if (formatSelection === 'best') {
            formatSelection = 'bv*+ba/b';
        }
        
        console.log('Download configuration:', {
            url,
            format: formatSelection,
            platformOptions
        });
        
        // Changed variable name from 'process' to 'ytDlpProcess' to avoid conflict
        const ytDlpProcess = spawn(ytDlpPath, [
            url,
            '-f', formatSelection,
            '-o', path.join(downloadsDirectory, '%(title)s.%(ext)s'),
            '--newline',
            '--no-check-certificate',
            ...platformOptions
        ]);
        
        let output = '';
        let errorOutput = '';
        
        ytDlpProcess.stdout.on('data', (data) => {
            output += data.toString();
            console.log('yt-dlp output:', data.toString().trim());
        });
        
        ytDlpProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.log('yt-dlp error:', data.toString().trim());
        });
        
        ytDlpProcess.on('close', (code) => {
            console.log(`yt-dlp process exited with code ${code}`);
            
            if (code === 0) {
                // Success - find the downloaded file
                try {
                    const finalFiles = fs.readdirSync(downloadsDirectory);
                    const newFiles = finalFiles.filter(file => !initialFiles.includes(file));
                    
                    if (newFiles.length > 0) {
                        const filename = newFiles[0];
                        const downloadUrl = `/downloads/${encodeURIComponent(filename)}`;
                        
                        resolve({
                            success: true,
                            title: filename.replace(/\.[^/.]+$/, ""),
                            downloadUrl: downloadUrl,
                            filename: filename
                        });
                    } else {
                        // Fallback to most recent file
                        const recentFile = getMostRecentFile(downloadsDirectory);
                        if (recentFile) {
                            const downloadUrl = `/downloads/${encodeURIComponent(recentFile)}`;
                            resolve({
                                success: true,
                                title: recentFile.replace(/\.[^/.]+$/, ""),
                                downloadUrl: downloadUrl,
                                filename: recentFile
                            });
                        } else {
                            reject(new Error('File not found after download'));
                        }
                    }
                } catch (fileError) {
                    reject(new Error('Could not read downloads directory: ' + fileError.message));
                }
            } else {
                // Intelligent error handling
                let errorMessage = 'Download failed';
                let userFriendlyMessage = '';
                
                if (errorOutput.includes('login required') || errorOutput.includes('rate-limit')) {
                    userFriendlyMessage = 'This content requires login or is temporarily unavailable. Try again later or use a different public video.';
                    errorMessage = 'Content requires authentication or rate-limited';
                } 
                else if (errorOutput.includes('not available') || errorOutput.includes('unavailable')) {
                    userFriendlyMessage = 'The requested content is not available, private, or has been removed.';
                    errorMessage = 'Content not available';
                }
                else if (errorOutput.includes('WARNING: "-f best"')) {
                    userFriendlyMessage = 'Using optimized format selection for better compatibility.';
                    errorMessage = 'Format selection optimized';
                }
                else if (errorOutput.includes('Private video') || errorOutput.includes('private')) {
                    userFriendlyMessage = 'This video is private and cannot be downloaded.';
                    errorMessage = 'Private content';
                }
                else if (errorOutput.includes('blocked') || errorOutput.includes('Forbidden')) {
                    userFriendlyMessage = 'Access to this content is blocked. This might be due to regional restrictions or content policies.';
                    errorMessage = 'Content blocked';
                }
                else {
                    // Extract the most relevant error message
                    const errorLines = errorOutput.split('\n').filter(line => line.trim() !== '');
                    const lastErrorLine = errorLines[errorLines.length - 1] || 'Unknown error';
                    userFriendlyMessage = lastErrorLine.length > 100 ? 
                        lastErrorLine.substring(0, 100) + '...' : lastErrorLine;
                    errorMessage = lastErrorLine;
                }
                
                console.error('Download failed details:', {
                    url,
                    code,
                    errorOutput: errorOutput.substring(0, 500),
                    errorMessage
                });
                
                reject(new Error(userFriendlyMessage));
            }
        });
    });
}

// Retry function for better reliability
async function downloadWithRetry(url, format = 'best', maxRetries = 2) {
    let lastError = null;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            console.log(`Download attempt ${i + 1}/${maxRetries + 1} for:`, url);
            return await downloadVideo(url, format);
        } catch (error) {
            lastError = error;
            console.log(`Download attempt ${i + 1} failed:`, error.message);
            
            if (i < maxRetries) {
                // Wait before retry (increasing delay)
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, etc.
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// Get video info function
function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        const ytDlpPath = path.join(__dirname, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
        
        // Changed variable name from 'process' to 'infoProcess' to avoid conflict
        const infoProcess = spawn(ytDlpPath, [
            url,
            '--dump-single-json',
            '--no-warnings',
            '--no-check-certificate',
            '--socket-timeout', '15'
        ]);
        
        let output = '';
        let errorOutput = '';
        
        infoProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        infoProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        infoProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(output);
                    resolve(info);
                } catch (parseError) {
                    reject(new Error('Failed to parse video info'));
                }
            } else {
                reject(new Error(`Failed to get video info: ${errorOutput}`));
            }
        });
    });
}

// Individual download endpoints with retry logic
app.post('/api/download/youtube', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('YouTube download requested for:', url);
        const result = await downloadWithRetry(url, format || 'best');
        res.json(result);
    } catch (error) {
        console.error('YouTube download error:', error);
        res.status(500).json({ 
            error: error.message,
            tip: 'Try a different YouTube video or check if the video is available in your region.'
        });
    }
});

app.post('/api/download/instagram', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('Instagram download requested for:', url);
        const result = await downloadWithRetry(url, format || 'best');
        res.json(result);
    } catch (error) {
        console.error('Instagram download error:', error);
        res.status(500).json({ 
            error: error.message,
            tip: 'Instagram often blocks automated downloads. Try a public video or wait a few minutes before trying again.'
        });
    }
});

app.post('/api/download/tiktok', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('TikTok download requested for:', url);
        const result = await downloadWithRetry(url, format || 'best');
        res.json(result);
    } catch (error) {
        console.error('TikTok download error:', error);
        res.status(500).json({ 
            error: error.message,
            tip: 'Try a different TikTok video or check if the video is public.'
        });
    }
});

app.post('/api/download/twitter', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('Twitter download requested for:', url);
        const result = await downloadWithRetry(url, format || 'best');
        res.json(result);
    } catch (error) {
        console.error('Twitter download error:', error);
        res.status(500).json({ 
            error: error.message,
            tip: 'Try a different Twitter video or check if the video is public.'
        });
    }
});

app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('Generic download requested for:', url);
        const result = await downloadWithRetry(url, format || 'best');
        res.json(result);
    } catch (error) {
        console.error('Generic download error:', error);
        res.status(500).json({ 
            error: error.message,
            tip: 'Try a different video URL or check if the content is publicly available.'
        });
    }
});

// Batch download endpoint
app.post('/api/download/batch', async (req, res) => {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'URLs array is required' });
    }
    
    // Return immediately to acknowledge request
    res.json({
        success: true,
        message: `Batch download started for ${urls.length} videos`,
        total: urls.length
    });
    
    // Process videos in background
    process.nextTick(async () => {
        console.log('Starting batch download for', urls.length, 'videos');
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`Processing video ${i + 1}/${urls.length}:`, url);
            
            try {
                // Download the video with retry logic
                await downloadWithRetry(url, 'best');
                console.log(`Successfully downloaded video ${i + 1}:`, url);
                
            } catch (error) {
                console.error(`Error downloading video ${i + 1}:`, url, error.message);
            }
        }
        
        console.log('Batch download completed');
    });
});

// Get video info endpoint
app.post('/api/video/info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
        console.log('Getting video info for:', url);
        const info = await getVideoInfo(url);
        
        const videoInfo = {
            title: info.title || 'Unknown Title',
            thumbnail: info.thumbnail || '',
            duration: info.duration || 0,
            uploader: info.uploader || 'Unknown',
            formats: info.formats ? info.formats
                .filter(f => f.ext && f.format_note)
                .map(f => ({
                    format_id: f.format_id,
                    quality: f.format_note,
                    ext: f.ext,
                    filesize: f.filesize ? `${(f.filesize / (1024*1024)).toFixed(1)} MB` : 'Unknown',
                    resolution: f.height ? `${f.height}p` : 'Audio'
                }))
                .slice(0, 10) : []
        };
        
        res.json({
            success: true,
            info: videoInfo
        });
    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Platform info endpoint
app.get('/api/platforms', (req, res) => {
    res.json({
        platforms: [
            { name: 'YouTube', key: 'youtube', icon: '📺' },
            { name: 'Instagram', key: 'instagram', icon: '📱' },
            { name: 'TikTok', key: 'tiktok', icon: '🎵' },
            { name: 'Twitter/X', key: 'twitter', icon: '🐦' },
            { name: 'Facebook', key: 'generic', icon: '👥' },
            { name: 'Other Platforms', key: 'generic', icon: '🔗' }
        ]
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('Enhanced downloader with retry logic and platform-specific handling ready!');
});