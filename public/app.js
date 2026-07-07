// ============================================
// SOCIALSYNC - FRONTEND
// ============================================

const API_URL = ''; // Same domain (or put your Render URL here)

let currentUser = null;
let currentDate = new Date();
let selectedDate = null;

// ============================================
// AUTH
// ============================================

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('userEmail', email);
            showMainApp();
        } else {
            alert('Login failed: ' + data.error);
        }
    });
}

function register() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert('Account created! Now login.');
        }
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('userEmail');
    location.reload();
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user display
    const email = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userInitials').textContent = email.substring(0,2).toUpperCase();
    
    // Load data
    loadNotifications();
    loadPlatforms();
    renderCalendar();
    loadPosts();
}

// ============================================
// NAVIGATION
// ============================================

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(name + 'Section').classList.remove('hidden');
    
    // Close dropdowns
    document.getElementById('userDropdown').classList.remove('active');
}

// ============================================
// NOTIFICATIONS
// ============================================

function toggleNotifications() {
    document.getElementById('notifDropdown').classList.toggle('active');
    document.getElementById('userDropdown').classList.remove('active');
}

function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('active');
    document.getElementById('notifDropdown').classList.remove('active');
}

function loadNotifications() {
    const email = localStorage.getItem('userEmail');
    
    fetch(`${API_URL}/api/notifications`, {
        headers: { 'x-user-email': email }
    })
    .then(r => r.json())
    .then(notifs => {
        const unread = notifs.filter(n => !n.read).length;
        document.getElementById('notifBadge').textContent = unread;
        document.getElementById('notifBadge').style.display = unread > 0 ? 'flex' : 'none';
        
        const list = document.getElementById('notifList');
        if (notifs.length === 0) {
            list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-light);">No notifications</div>';
            return;
        }
        
        list.innerHTML = notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif(${n.id})">
                <div style="font-weight: 600;">${n.title}</div>
                <div style="font-size: 0.875rem; color: var(--text-light);">${n.message}</div>
            </div>
        `).join('');
    });
}

function readNotif(id) {
    const email = localStorage.getItem('userEmail');
    
    fetch(`${API_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-user-email': email 
        },
        body: JSON.stringify({ ids: [id] })
    })
    .then(() => loadNotifications());
}

function markAllRead() {
    // Implementation similar to readNotif
    loadNotifications();
}

// ============================================
// PLATFORMS
// ============================================

function loadPlatforms() {
    fetch(`${API_URL}/api/platforms`)
    .then(r => r.json())
    .then(platforms => {
        platforms.forEach(p => {
            const statusEl = document.getElementById(p.platform + 'Status');
            if (statusEl) {
                statusEl.textContent = '✅ Connected';
                statusEl.classList.add('connected');
            }
        });
    });
}

function connectPlatform(platform) {
    const email = localStorage.getItem('userEmail');
    
    fetch(`${API_URL}/api/connect/${platform}`, {
        method: 'POST',
        headers: { 'x-user-email': email }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // In real app, redirect to OAuth URL
            // window.location.href = data.url;
            
            // For demo: just mark as connected
            const statusEl = document.getElementById(platform + 'Status');
            statusEl.textContent = '✅ Connected';
            statusEl.classList.add('connected');
            alert(`${platform} connected! (Demo mode)`);
        }
    });
}

// ============================================
// CALENDAR
// ============================================

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    const headers = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    
    let html = headers.map(h => `<div class="day-header">${h}</div>`).join('');
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="day-cell" style="visibility: hidden;"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const hasPost = false; // Check if post exists
        
        html += `<div class="day-cell ${isToday(year, month, day) ? 'today' : ''}" 
                      onclick="selectDate('${dateStr}', ${day})">
                    ${day}
                 </div>`;
    }
    
    grid.innerHTML = html;
}

function isToday(year, month, day) {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function selectDate(dateStr, day) {
    selectedDate = dateStr;
    const date = new Date(dateStr);
    document.getElementById('selectedDate').textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric' 
    });
    
    // Show posts for this day
    const email = localStorage.getItem('userEmail');
    fetch(`${API_URL}/api/schedule`, {
        headers: { 'x-user-email': email }
    })
    .then(r => r.json())
    .then(posts => {
        const dayPosts = posts.filter(p => p.date === dateStr);
        const container = document.getElementById('dayPosts');
        
        if (dayPosts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">No posts scheduled</p>';
        } else {
            container.innerHTML = dayPosts.map(p => `
                <div class="post-card">
                    <div class="post-platforms">
                        ${JSON.parse(p.platforms).map(pl => `<span>${pl}</span>`).join('')}
                    </div>
                    <p>${p.caption}</p>
                    <small>${p.date}</small>
                </div>
            `).join('');
        }
        
        document.getElementById('dayModal').classList.add('active');
    });
}

function closeModal() {
    document.getElementById('dayModal').classList.remove('active');
}

// ============================================
// SCHEDULE POSTS
// ============================================

function schedulePost() {
    const email = localStorage.getItem('userEmail');
    const date = document.getElementById('postDate').value;
    const time = document.getElementById('postTime').value;
    const caption = document.getElementById('postCaption').value;
    const platforms = Array.from(document.querySelectorAll('.postPlatform:checked')).map(cb => cb.value);
    
    if (!date || !time || !caption || platforms.length === 0) {
        alert('Please fill all fields');
        return;
    }
    
    const dateTime = `${date}T${time}`;
    
    fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-user-email': email 
        },
        body: JSON.stringify({ date: dateTime, caption, platforms })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert('Post scheduled!');
            loadPosts();
            renderCalendar();
        }
    });
}

function loadPosts() {
    const email = localStorage.getItem('userEmail');
    
    fetch(`${API_URL}/api/schedule`, {
        headers: { 'x-user-email': email }
    })
    .then(r => r.json())
    .then(posts => {
        const container = document.getElementById('postsList');
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No scheduled posts yet</p>';
            return;
        }
        
        container.innerHTML = posts.map(p => `
            <div class="post-card">
                <div class="post-platforms">
                    ${JSON.parse(p.platforms).map(pl => `<span>${pl}</span>`).join('')}
                </div>
                <p>${p.caption}</p>
                <small style="color: var(--text-light);">
                    📅 ${new Date(p.date).toLocaleString()}
                </small>
            </div>
        `).join('');
    });
}

// ============================================
// AI TOOLS
// ============================================

function showAITab(tab) {
    document.querySelectorAll('.ai-tabs button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('videosPanel').classList.add('hidden');
    document.getElementById('hashtagsPanel').classList.add('hidden');
    document.getElementById(tab + 'Panel').classList.remove('hidden');
}

function searchVideos() {
    const query = document.getElementById('videoSearch').value;
    if (!query) return;
    
    fetch(`${API_URL}/api/ai/videos?query=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(data => {
        const container = document.getElementById('videoResults');
        container.innerHTML = data.videos.map(v => `
            <div class="video-card">
                <img src="${v.thumbnail}" alt="Video" loading="lazy">
                <div class="info">
                    <div>By ${v.author}</div>
                    <small>${v.duration}s</small>
                </div>
            </div>
        `).join('');
    });
}

function generateHashtags() {
    const topic = document.getElementById('hashtagTopic').value;
    const platform = document.getElementById('hashtagPlatform').value;
    
    if (!topic) return;
    
    fetch(`${API_URL}/api/ai/hashtags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform })
    })
    .then(r => r.json())
    .then(data => {
        const container = document.getElementById('hashtagsResults');
        container.innerHTML = data.hashtags.map(h => `
            <div class="hashtag-tag">#${h.tag} <small style="opacity: 0.6;">(${h.volume})</small></div>
        `).join('');
    });
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        currentUser = { email: savedEmail };
        showMainApp();
    }
});
