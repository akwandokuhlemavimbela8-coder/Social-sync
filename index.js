// ============================================
// SOCIALSYNC - SIMPLE SERVER
// ============================================

const express = require('express');
const path = require('path');
const app = express();

// Serve your website files from "public" folder
app.use(express.static('public'));
app.use(express.json());

// Fake database (stores in memory - resets when server restarts)
let users = [];
let posts = [];
let notifications = [];

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    const user = { id: Date.now(), email, password, initials: email.substring(0,2).toUpperCase() };
    users.push(user);
    res.json({ success: true, user });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Wrong email or password' });
    res.json({ success: true, user });
});

// Get user
app.get('/api/me', (req, res) => {
    const email = req.headers['x-user-email'];
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Not logged in' });
    res.json(user);
});

// ============================================
// PLATFORM CONNECTION
// ============================================

// Fake connected platforms (in real app, this uses OAuth)
let connectedPlatforms = [];

app.get('/api/platforms', (req, res) => {
    res.json(connectedPlatforms);
});

app.post('/api/connect/:platform', (req, res) => {
    const { platform } = req.params;
    const email = req.headers['x-user-email'];
    
    // Redirect to real platform auth (simplified)
    const authUrls = {
        tiktok: `https://www.tiktok.com/auth/authorize?client_key=YOUR_KEY&scope=video.publish`,
        instagram: `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_ID&scope=instagram_basic`,
        youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_ID&scope=youtube.upload`
    };
    
    // For demo: just mark as connected
    if (!connectedPlatforms.find(p => p.platform === platform)) {
        connectedPlatforms.push({ 
            platform, 
            email,
            connected: true,
            connectedAt: new Date()
        });
    }
    
    res.json({ success: true, url: authUrls[platform] || '#' });
});

// ============================================
// SCHEDULE POSTS
// ============================================

app.post('/api/schedule', (req, res) => {
    const { caption, date, platforms, videoUrl } = req.body;
    const email = req.headers['x-user-email'];
    
    const post = {
        id: Date.now(),
        email,
        caption,
        date,
        platforms,
        videoUrl: videoUrl || 'placeholder',
        status: 'scheduled',
        createdAt: new Date()
    };
    
    posts.push(post);
    
    // Add notification
    notifications.push({
        id: Date.now(),
        email,
        type: 'scheduled',
        title: 'Post Scheduled',
        message: `Post scheduled for ${date}`,
        read: false,
        createdAt: new Date()
    });
    
    res.json({ success: true, post });
});

app.get('/api/schedule', (req, res) => {
    const email = req.headers['x-user-email'];
    const userPosts = posts.filter(p => p.email === email);
    res.json(userPosts);
});

// ============================================
// NOTIFICATIONS
// ============================================

app.get('/api/notifications', (req, res) => {
    const email = req.headers['x-user-email'];
    const userNotifications = notifications
        .filter(n => n.email === email)
        .sort((a, b) => b.createdAt - a.createdAt);
    res.json(userNotifications);
});

app.post('/api/notifications/read', (req, res) => {
    const { ids } = req.body;
    notifications.forEach(n => {
        if (ids.includes(n.id)) n.read = true;
    });
    res.json({ success: true });
});

// ============================================
// AI TOOLS (Using free APIs)
// ============================================

// Free video search from Pexels
app.get('/api/ai/videos', async (req, res) => {
    const { query } = req.query;
    
    try {
        // Using Pexels free API (you need to sign up for free key)
        const response = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=10`, {
            headers: { 'Authorization': process.env.PEXELS_API_KEY || '' }
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const videos = data.videos.map(v => ({
            id: v.id,
            url: v.video_files[0]?.link,
            thumbnail: v.image,
            duration: v.duration,
            author: v.user.name
        }));
        
        res.json({ videos });
    } catch (err) {
        // Return demo data if API fails
        res.json({
            videos: [
                { id: 1, thumbnail: 'https://via.placeholder.com/300x500/667eea/ffffff?text=Demo+Video+1', author: 'Demo', duration: 30 },
                { id: 2, thumbnail: 'https://via.placeholder.com/300x500/764ba2/ffffff?text=Demo+Video+2', author: 'Demo', duration: 45 },
                { id: 3, thumbnail: 'https://via.placeholder.com/300x500/f093fb/ffffff?text=Demo+Video+3', author: 'Demo', duration: 60 }
            ]
        });
    }
});

// Free hashtag generator (no API key needed)
app.post('/api/ai/hashtags', (req, res) => {
    const { topic, platform } = req.body;
    
    const hashtagDatabase = {
        fitness: ['#fitness', '#workout', '#gym', '#fitnessmotivation', '#health', '#training', '#bodybuilding', '#lifestyle'],
        cooking: ['#food', '#cooking', '#foodie', '#recipe', '#homemade', '#yummy', '#delicious', '#foodphotography'],
        gaming: ['#gaming', '#gamer', '#videogames', '#gameplay', '#twitch', '#streamer', '#esports', '#fortnite'],
        music: ['#music', '#musician', '#singer', '#song', '#newmusic', '#hiphop', '#rap', '#producer'],
        dance: ['#dance', '#dancer', '#choreography', '#dancing', '#hiphop', '#ballet', '#tiktokdance', '#viral'],
        funny: ['#funny', '#comedy', '#memes', '#lol', '#humor', '#viral', '#trending', '#entertainment']
    };
    
    // Find matching hashtags or generate generic ones
    let hashtags = hashtagDatabase[topic.toLowerCase()] || 
                  ['#' + topic, '#viral', '#trending', '#fyp', '#foryou', '#explore', '#viralvideo', '#trendingnow'];
    
    // Platform-specific additions
    if (platform === 'tiktok') {
        hashtags.push('#fyp', '#foryoupage', '#tiktok', '#viral');
    } else if (platform === 'instagram') {
        hashtags.push('#instagood', '#photooftheday', '#picoftheday', '#love');
    } else if (platform === 'youtube') {
        hashtags.push('#youtube', '#subscribe', '#youtuber', '#video');
    }
    
    // Remove duplicates and limit to 15
    hashtags = [...new Set(hashtags)].slice(0, 15);
    
    res.json({ 
        hashtags: hashtags.map(h => ({ tag: h.replace('#', ''), volume: Math.floor(Math.random() * 1000) + 'K' })),
        topic,
        platform
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ SocialSync running on http://localhost:${PORT}`);
});
