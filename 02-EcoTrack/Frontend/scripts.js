const API_BASE = 'https://ecotrackbackend.onrender.com/api';

class EcoTrack {
    constructor() {
        this.token = localStorage.getItem('ecoToken');
        this.user = JSON.parse(localStorage.getItem('ecoUser') || 'null');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Activity buttons
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const activityType = e.currentTarget.dataset.activity;
                this.logActivity(activityType);
            });
        });
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.setAuthData(data.token, data.user);
                this.showApp();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Login failed. Please try again.');
        }
    }

    async register() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.setAuthData(data.token, data.user);
                this.showApp();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Registration failed. Please try again.');
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('ecoToken', token);
        localStorage.setItem('ecoUser', JSON.stringify(user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('ecoToken');
        localStorage.removeItem('ecoUser');
        this.showAuth();
    }

    checkAuth() {
        if (this.token && this.user) {
            this.showApp();
            this.loadStats();
            this.loadActivities();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-modal').style.display = 'flex';
        document.getElementById('main-app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('username-display').textContent = this.user.username;
    }

    async loadStats() {
        try {
            const response = await fetch(`${API_BASE}/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateStatsUI(stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    updateStatsUI(stats) {
        document.getElementById('points-value').textContent = stats.totalPoints;
        document.getElementById('co2-value').textContent = `${stats.co2Saved.toFixed(1)} kg`;
        document.getElementById('water-value').textContent = `${stats.waterSaved.toFixed(1)} L`;
        document.getElementById('waste-value').textContent = `${stats.wasteReduced.toFixed(1)} kg`;
        document.getElementById('energy-value').textContent = `${stats.energySaved.toFixed(1)} kWh`;

        // Calculate impact metrics
        document.getElementById('water-glasses').textContent = Math.floor(stats.waterSaved / 0.25);
        document.getElementById('trees-planted').textContent = Math.floor(stats.co2Saved / 15);
        document.getElementById('car-miles').textContent = Math.floor(stats.co2Saved / 0.4);
    }

    async logActivity(activityType) {
        try {
            const response = await fetch(`${API_BASE}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ activityType })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStatsUI(data.stats);
                this.loadActivities();
                this.showNotification(`+${data.activity.points} points earned!`);
            }
        } catch (error) {
            alert('Failed to log activity. Please try again.');
        }
    }

    async loadActivities() {
        try {
            const response = await fetch(`${API_BASE}/activities`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const activities = await response.json();
                this.updateActivitiesUI(activities);
            }
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    }

    updateActivitiesUI(activities) {
        const activitiesList = document.getElementById('activities-list');
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<div class="empty-state">No activities yet. Start tracking your eco-friendly habits!</div>';
            return;
        }

        activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-item-icon">${this.getActivityIcon(activity.activityType)}</span>
                <div class="activity-item-details">
                    <div class="activity-item-name">${this.formatActivityName(activity.activityType)}</div>
                    <div class="activity-item-date">${new Date(activity.createdAt).toLocaleDateString()}</div>
                </div>
                <span class="activity-item-points">+${activity.points}</span>
            </div>
        `).join('');
    }

    getActivityIcon(activityType) {
        const icons = {
            'reusable-bottle': '💧',
            'walked': '🚶',
            'recycled': '♻️',
            'led-bulb': '💡'
        };
        return icons[activityType] || '🌿';
    }

    formatActivityName(activityType) {
        return activityType
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app
const app = new EcoTrack();