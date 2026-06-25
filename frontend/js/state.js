// Global State (Will sync with FastAPI later)
const AppState = {
    profilePicBase64: "",
    logoBase64: ""
};

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
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(evt) { 
                AppState[stateKey] = evt.target.result; 
                if (typeof updatePreview === 'function') updatePreview(); 
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}