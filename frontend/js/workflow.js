// ==========================================
// 🔄 AUTOSAVE + UNDO/REDO + CLEAR ALL
// ==========================================
const RESUME_AUTOSAVE_KEY = 'resume_autosave_enabled';
const RESUME_DRAFT_KEY = 'resume_local_draft';
const RESUME_HISTORY_LIMIT = 10;
const RESUME_HISTORY_DELAY_MS = 2000;

const ResumeWorkflow = {
    autosaveEnabled: localStorage.getItem(RESUME_AUTOSAVE_KEY) !== 'false',
    history: [],
    index: -1,
    pendingTimer: null,
    applying: false,
    initialized: false,
    lastSnapshot: '',

    beginBatch() {
        this.applying = true;
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
    },

    endBatch({ refreshHistory = false } = {}) {
        this.applying = false;
        if (refreshHistory) {
            this.resetHistoryFromCurrent();
        }
        this.syncToolbar();
    },

    snapshot() {
        if (typeof getResumeData !== 'function') return '';
        return JSON.stringify(getResumeData());
    },

    persistDraft(snapshot) {
        try {
            localStorage.setItem(RESUME_DRAFT_KEY, snapshot);
        } catch (error) {
            console.warn('Unable to save local resume draft.', error);
        }
    },

    async persistCloud() {
        const token = localStorage.getItem('resume_jwt_token');
        const backendReady = Boolean(window.ResumeBackendState?.dbReady);
        if (!this.autosaveEnabled || !token || !backendReady || typeof window.saveResumeToCloud !== 'function') {
            return;
        }
        try {
            await window.saveResumeToCloud(token, { silent: true });
        } catch (error) {
            console.warn('Autosave to cloud failed.', error);
        }
    },

    pushSnapshot(snapshot) {
        if (!snapshot) return;
        if (snapshot === this.lastSnapshot) return;

        this.history = this.history.slice(0, this.index + 1);
        this.history.push(snapshot);
        if (this.history.length > RESUME_HISTORY_LIMIT) {
            this.history.shift();
        }
        this.index = this.history.length - 1;
        this.lastSnapshot = snapshot;
        this.persistDraft(snapshot);
        this.syncToolbar();
        void this.persistCloud();
    },

    commitPendingSnapshot() {
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
        if (this.applying) return;

        const snapshot = this.snapshot();
        this.pushSnapshot(snapshot);
    },

    scheduleSnapshot() {
        if (this.applying) return;
        if (this.pendingTimer) clearTimeout(this.pendingTimer);
        this.pendingTimer = setTimeout(() => {
            this.pendingTimer = null;
            this.commitPendingSnapshot();
        }, RESUME_HISTORY_DELAY_MS);
        this.syncToolbar();
    },

    resetHistoryFromCurrent() {
        const snapshot = this.snapshot();
        if (!snapshot) return;
        this.history = [snapshot];
        this.index = 0;
        this.lastSnapshot = snapshot;
        this.persistDraft(snapshot);
        this.syncToolbar();
    },

    applySnapshot(snapshot) {
        if (!snapshot) return;
        this.beginBatch();
        try {
            const data = JSON.parse(snapshot);
            if (typeof populateFormWithData === 'function') {
                populateFormWithData(data, { resetHistory: false });
            }
        } catch (error) {
            console.error('Failed to restore resume snapshot.', error);
        } finally {
            this.endBatch();
        }
    },

    undo() {
        this.commitPendingSnapshot();
        if (this.index <= 0) return;
        this.index -= 1;
        const snapshot = this.history[this.index];
        this.lastSnapshot = snapshot;
        this.persistDraft(snapshot);
        this.applySnapshot(snapshot);
        this.syncToolbar();
    },

    redo() {
        this.commitPendingSnapshot();
        if (this.index >= this.history.length - 1) return;
        this.index += 1;
        const snapshot = this.history[this.index];
        this.lastSnapshot = snapshot;
        this.persistDraft(snapshot);
        this.applySnapshot(snapshot);
        this.syncToolbar();
    },

    clearAll() {
        const confirmClear = window.confirm('Clear the entire resume? This can be undone.');
        if (!confirmClear) return;

        this.commitPendingSnapshot();
        const blankData = {
            name: '',
            degree_title: '',
            gender: 'Male',
            dob: '',
            email: '',
            phone: '',
            profile_pic_path: '',
            logo_path: '',
            footer_text: '',
            skills_programming: '',
            skills_engineering: '',
            skills_other: '',
            custom_skills: [],
            educations: [],
            achievements: [],
            projects: [],
            interests: [],
            pors: [],
            extras: [],
            custom_sections: [],
        };

        if (typeof populateFormWithData === 'function') {
            populateFormWithData(blankData, { resetHistory: false });
        }
        if (window.AppState) {
            window.AppState.profilePicBase64 = '';
            window.AppState.logoBase64 = '';
        }

        this.commitPendingSnapshot();
    },

    setAutosaveEnabled(enabled) {
        this.autosaveEnabled = Boolean(enabled);
        try {
            localStorage.setItem(RESUME_AUTOSAVE_KEY, String(this.autosaveEnabled));
        } catch (error) {
            console.warn('Unable to persist autosave preference.', error);
        }
        this.syncToolbar();
    },

    toggleAutosave() {
        this.setAutosaveEnabled(!this.autosaveEnabled);
        if (this.autosaveEnabled) {
            this.scheduleSnapshot();
        }
    },

    syncToolbar() {
        const autosaveBtn = document.getElementById('autoSaveToggle');
        if (autosaveBtn) {
            autosaveBtn.classList.toggle('is-on', this.autosaveEnabled);
            autosaveBtn.setAttribute('aria-pressed', String(this.autosaveEnabled));
            const stateLabel = autosaveBtn.querySelector('.toolbar-toggle-state');
            if (stateLabel) stateLabel.textContent = this.autosaveEnabled ? 'On' : 'Off';
        }

        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.disabled = this.index <= 0;

        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) redoBtn.disabled = this.index >= this.history.length - 1;
    },

    bind() {
        const autosaveBtn = document.getElementById('autoSaveToggle');
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const clearBtn = document.getElementById('clearAllBtn');

        if (autosaveBtn) autosaveBtn.addEventListener('click', () => this.toggleAutosave());
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());

        window.addEventListener('resume-backend-status', () => this.syncToolbar());
        window.addEventListener('storage', (event) => {
            if (event.key === RESUME_AUTOSAVE_KEY) {
                this.autosaveEnabled = event.newValue !== 'false';
                this.syncToolbar();
            }
        });
    },

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
        this.syncToolbar();
        this.bind();
        this.resetHistoryFromCurrent();
    },
};

window.ResumeWorkflow = ResumeWorkflow;

// Restore any saved preference immediately.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ResumeWorkflow.initialize());
} else {
    ResumeWorkflow.initialize();
}
