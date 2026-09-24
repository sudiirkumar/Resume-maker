// ==========================================
// 🔐 AUTHENTICATION & TOKEN MANAGEMENT
// ==========================================

// Change this to your live backend URL when deploying!
const API_BASE_URL = 'https://resume-maker-ih3k.onrender.com/api';
// const API_BASE_URL = 'http://0.0.0.0:8000/api';
let isLoginMode = true;

// DOM Elements
const authModal = document.getElementById('authModal');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authMessage = document.getElementById('authMessage');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const loadResume = document.getElementById('loadResume');
const cloudActionRow = document.getElementById('cloudActionRow');
const logoutBtn = document.getElementById('logoutBtn');

const backendState = {
    online: false,
    dbReady: false,
    aiRewriteReady: false,
};

function broadcastBackendState(nextState) {
    backendState.online = Boolean(nextState.online);
    backendState.dbReady = Boolean(nextState.dbReady);
    backendState.aiRewriteReady = Boolean(nextState.aiRewriteReady);

    window.ResumeBackendState = { ...backendState };
    window.dispatchEvent(new CustomEvent('resume-backend-status', {
        detail: { ...backendState },
    }));
}

async function refreshBackendState() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            broadcastBackendState({
                online: true,
                dbReady: Boolean(data.db_ready),
                aiRewriteReady: Boolean(data.ai_rewrite_ready),
            });

            syncCloudActionVisibility();

            return true;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Backend health check timed out (Server might be asleep). Cloud features disabled.');
        } else {
            console.warn('Backend is currently offline or unreachable. Cloud features disabled.');
        }
    }

    broadcastBackendState({ online: false, dbReady: false, aiRewriteReady: false });
    syncCloudActionVisibility();
    return false;
}

// Wake up the server as soon as the page loads
refreshBackendState().catch(() => console.log('Waking up backend...'));

// Keep it awake while they are filling out the form
setInterval(() => {
    refreshBackendState().catch(() => {});
}, 14 * 60 * 1000); // Runs every 14 minutes
// Open and Close Modal
if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));

// Switch to Login Tab
tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    authSubmitBtn.textContent = 'Log In';
    hideMessage();
});

// Switch to Register Tab
tabRegister.addEventListener('click', () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmitBtn.textContent = 'Sign Up';
    hideMessage();
});

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
}

function hideMessage() {
    authMessage.className = 'auth-message hidden';
}

function hasStoredToken() {
    return Boolean(localStorage.getItem('resume_jwt_token'));
}

function syncCloudActionVisibility() {
    const canShowCloudActions = backendState.dbReady;
    const isLoggedIn = hasStoredToken();

    if (openAuthBtn) {
        openAuthBtn.style.display = canShowCloudActions ? 'inline-block' : 'none';
        openAuthBtn.textContent = isLoggedIn ? '☁️ Save to Cloud' : 'Cloud Sync / Login';
    }

    if (cloudActionRow) {
        cloudActionRow.style.display = canShowCloudActions && isLoggedIn ? 'flex' : 'none';
    }

    if (loadResume) {
        loadResume.style.display = canShowCloudActions && isLoggedIn ? 'inline-block' : 'none';
    }

    if (logoutBtn) {
        logoutBtn.style.display = canShowCloudActions && isLoggedIn ? 'inline-block' : 'none';
    }
}

// --- 2. Smart Cloud Sync Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!openAuthBtn) return;
    syncCloudActionVisibility();
});

// The Smart Button: Opens modal if logged out, saves data if logged in
if (openAuthBtn) {
    openAuthBtn.addEventListener('click', () => {
        const token = localStorage.getItem('resume_jwt_token');
        if (token) {
            saveResumeToCloud(token);
        } else {
            authModal.classList.remove('hidden');
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('resume_jwt_token');
        if (!token) {
            syncCloudActionVisibility();
            return;
        }

        logoutBtn.disabled = true;
        const originalText = logoutBtn.textContent;
        logoutBtn.textContent = 'Logging out...';

        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.warn('Logout request could not reach the backend, clearing the local session anyway.');
        } finally {
            localStorage.removeItem('resume_jwt_token');
            showMessage('Logged out successfully.', 'success');
            syncCloudActionVisibility();
            logoutBtn.disabled = false;
            logoutBtn.textContent = originalText;
        }
    });
}

async function saveResumeToCloud(token, options = {}) {
    const shouldUpdateButton = !options.silent && Boolean(openAuthBtn);
    const originalText = shouldUpdateButton ? openAuthBtn.innerHTML : '';

    // Give immediate feedback: disable the button and show "Saving..." while the request is in flight.
    if (shouldUpdateButton) {
        openAuthBtn.disabled = true;
        openAuthBtn.textContent = 'Saving...';
    }

    try {
        // 1. Grab the perfectly formatted data from your existing data.js logic!
        const resumeData = getResumeData();

        // 2. Send it securely to MongoDB
        const response = await fetch(`${API_BASE_URL}/resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: resumeData })
        });

        // 3. Handle Token Expiration
        if (response.status === 401) {
            localStorage.removeItem('resume_jwt_token');
            syncCloudActionVisibility();
            if (shouldUpdateButton) openAuthBtn.innerHTML = '⚠️ Session Expired';
            setTimeout(() => {
                authModal.classList.remove('hidden');
                if (shouldUpdateButton) openAuthBtn.innerHTML = 'Cloud Sync / Login';
            }, 2000);
            return;
        }

        if (!response.ok) throw new Error('Failed to save to MongoDB');

        // 4. Success UI
        if (shouldUpdateButton) {
            openAuthBtn.innerHTML = '✅ Saved!';
            openAuthBtn.style.backgroundColor = '#2e7d32';
        }

    } catch (error) {
        console.error(error);
        if (shouldUpdateButton) {
            openAuthBtn.innerHTML = '❌ Error';
            openAuthBtn.style.backgroundColor = '#c62828';
        }
    } finally {
        if (shouldUpdateButton) {
            setTimeout(() => {
                openAuthBtn.innerHTML = originalText;
                openAuthBtn.style.backgroundColor = '';
                openAuthBtn.disabled = false;
            }, 3000);
        }
    }
}

window.saveResumeToCloud = saveResumeToCloud;

// --- 3. API Communication Logic (Auth) ---

authSubmitBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        return showMessage('Please enter both email and password.', 'error');
    }

    // Disable button to prevent double-clicking
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Processing...';

    try {
        if (isLoginMode) {
            // LOGIN: FastAPI expects OAuth2 Form Data, NOT standard JSON!
            const formData = new URLSearchParams();
            formData.append('username', email); // Must be 'username' per OAuth2 specs
            formData.append('password', password);

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Invalid email or password');
            }

            const data = await response.json();
            
            // Securely store the token in the browser
            localStorage.setItem('resume_jwt_token', data.access_token);
            showMessage('Logged in successfully!', 'success');
            
            // Update UI and close modal
            syncCloudActionVisibility();
            setTimeout(() => authModal.classList.add('hidden'), 1000);  

            loadResume.click();


        } else {
            // REGISTER: FastAPI expects a standard JSON payload
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const detail = Array.isArray(errorData.detail)
                    ? errorData.detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(' ')
                    : errorData.detail;
                throw new Error(detail || 'Registration failed');
            }

            showMessage('Account created! Please log in.', 'success');
            
            // Automatically switch them over to the login tab
            setTimeout(() => tabLogin.click(), 1500);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
    }
});

loadResume.addEventListener('click', async () => {
    const token = localStorage.getItem('resume_jwt_token');
    if (!token) {
        showMessage('You must be logged in to load your resume.', 'error');
        return;
    }

    loadResume.disabled = true;
    loadResume.textContent = '⏳ Loading...';

    try {
        const response = await fetch(`${API_BASE_URL}/resume`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load resume from cloud');

        const data = await response.json();
        console.log('Loaded resume data:', data.content);
        populateFormWithData(data.content);

        showMessage('Resume loaded successfully!', 'success');
    } catch (error) {
        console.error(error);
        showMessage('Error loading resume. Please try again.', 'error');
    } finally {
        loadResume.disabled = false;
        loadResume.textContent = '☁️ Load Resume';
    }
});