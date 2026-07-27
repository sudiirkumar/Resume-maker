// Global State (Will sync with FastAPI later)
const AppState = {
    profilePicBase64: "",
    logoBase64: ""
};

// ── Hide/Show Toggle for sub-section items ──
function toggleHideItem(btn) {
    const item = btn.closest('.list-item');
    if (!item) return;
    const isHidden = item.classList.toggle('is-hidden');
    item.dataset.hidden = isHidden ? 'true' : 'false';
    // Disable/enable all inputs inside the item
    item.querySelectorAll('input, textarea, select, button').forEach(el => {
        if (el !== btn && !el.classList.contains('remove-btn') && !el.classList.contains('hide-btn')) {
            el.disabled = isHidden;
        }
    });
    if (typeof updatePreview === 'function') updatePreview();
}

// HTML Sanitization
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/&lt;b&gt;/gi, '<b>').replace(/&lt;\/b&gt;/gi, '</b>')
              .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>')
              .replace(/&lt;i&gt;/gi, '<i>').replace(/&lt;\/i&gt;/gi, '</i>')
              .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>');
}

// File Reader Helper
function handleImageUpload(inputId, stateKey) {
    document.getElementById(inputId).addEventListener('change', function(e) {
        const file = e.target.files && e.target.files[0];
        
        if (file) {
            // Pass the file to our new compressor instead of reading it directly
            compressImage(file, function(compressedData) {
                AppState[stateKey] = compressedData; 
                if (typeof updatePreview === 'function') updatePreview(); 
            });
        }
    });
}