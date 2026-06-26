// ==========================================
// 🔐 AUTHENTICATION & TOKEN MANAGEMENT
// ==========================================

// Change this to your live backend URL when deploying!
const API_BASE_URL = 'https://resume-maker-ih3k.onrender.com:10000/api';
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

// --- 1. UI Toggle Logic ---

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

// --- 2. Smart Cloud Sync Logic ---

// Check login state when the page loads
// Check login state and backend health when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!openAuthBtn) return;

    try {
        // 1. Ping the backend to see if it is alive
        // We use a short timeout so the user isn't waiting forever if the server is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second max wait

        const response = await fetch(`${API_BASE_URL}/health`, { 
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            // 2. The backend is ALIVE! Reveal the button.
            openAuthBtn.style.display = 'inline-block'; // Or 'block', depending on your CSS layout

            // 3. Check if they are already logged in
            if (localStorage.getItem('resume_jwt_token')) {
                openAuthBtn.textContent = '☁️ Save to Cloud';
            }
        }
    } catch (error) {
        // 4. The backend is DEAD or unreachable. 
        // We do absolutely nothing. The button remains hidden, and the 
        // user uses the local JSON export without ever knowing something failed!
        console.warn("Backend is currently offline. Cloud features are disabled.");
    }
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

async function saveResumeToCloud(token) {
    const originalText = openAuthBtn.innerHTML;
    openAuthBtn.innerHTML = '⏳ Saving...';
    openAuthBtn.disabled = true;

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
            openAuthBtn.innerHTML = '⚠️ Session Expired';
            setTimeout(() => {
                authModal.classList.remove('hidden');
                openAuthBtn.innerHTML = 'Cloud Sync / Login';
            }, 2000);
            return;
        }

        if (!response.ok) throw new Error('Failed to save to MongoDB');

        // 4. Success UI
        openAuthBtn.innerHTML = '✅ Saved!';
        openAuthBtn.style.backgroundColor = '#2e7d32'; 

    } catch (error) {
        console.error(error);
        openAuthBtn.innerHTML = '❌ Error';
        openAuthBtn.style.backgroundColor = '#c62828'; 
    } finally {
        setTimeout(() => {
            openAuthBtn.innerHTML = '☁️ Save to Cloud';
            openAuthBtn.style.backgroundColor = ''; 
            openAuthBtn.disabled = false;
        }, 3000);
    }
}

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

            if (!response.ok) throw new Error('Invalid email or password');

            const data = await response.json();
            
            // Securely store the token in the browser
            localStorage.setItem('resume_jwt_token', data.access_token);
            showMessage('Logged in successfully!', 'success');
            
            // Update UI and close modal
            if(openAuthBtn) openAuthBtn.textContent = '☁️ Save to Cloud';
            loadResume.style.display = 'inline-block';
            setTimeout(() => authModal.classList.add('hidden'), 1000);  


        } else {
            // REGISTER: FastAPI expects a standard JSON payload
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
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