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
        if (el !== btn && !el.classList.contains('remove-btn') && !el.classList.contains('hide-btn') && !el.classList.contains('move-btn')) {
            el.disabled = isHidden;
        }
    });
    if (typeof updatePreview === 'function') updatePreview();
}

// ── Move item up/down within its container ──
function moveItemUp(btn) {
    const item = btn.closest('.list-item');
    if (!item) return;
    const container = item.parentElement;
    const siblings = Array.from(container.children);
    const idx = siblings.indexOf(item);
    if (idx > 0) {
        container.insertBefore(item, siblings[idx - 1]);
        if (typeof refreshMoveButtons === 'function') refreshMoveButtons(container);
        if (typeof updatePreview === 'function') updatePreview();
    }
}

function moveItemDown(btn) {
    const item = btn.closest('.list-item');
    if (!item) return;
    const container = item.parentElement;
    const siblings = Array.from(container.children);
    const idx = siblings.indexOf(item);
    if (idx < siblings.length - 1) {
        container.insertBefore(siblings[idx + 1], item);
        if (typeof refreshMoveButtons === 'function') refreshMoveButtons(container);
        if (typeof updatePreview === 'function') updatePreview();
    }
}

// ── Remove an entire sub-section item ──
function removeItem(btn) {
    const item = btn.closest('.list-item');
    if (!item) return;
    const container = item.parentElement;
    item.remove();
    if (typeof refreshMoveButtons === 'function') refreshMoveButtons(container);
    if (typeof updatePreview === 'function') updatePreview();
}

// ── Refresh up/down button disabled states for a container ──
function refreshMoveButtons(container) {
    if (!container) return;
    // Find all direct children that have move buttons (works regardless of class names)
    const items = Array.from(container.children).filter(child =>
        child.querySelector('.move-up-btn') || child.querySelector('.move-down-btn')
    );
    items.forEach((item, idx) => {
        const upBtn = item.querySelector('.move-up-btn');
        const downBtn = item.querySelector('.move-down-btn');
        if (upBtn) upBtn.disabled = (idx === 0);
        if (downBtn) downBtn.disabled = (idx === items.length - 1);
    });
}

// Refresh all known list containers' move buttons
function refreshAllMoveButtons() {
    ['educationList', 'achievementsList', 'projectsList', 'interestsList', 'porList', 'extraActivitesList', 'customSkillsList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) refreshMoveButtons(el);
    });
    document.querySelectorAll('.custom-items-container').forEach(c => refreshMoveButtons(c));
}

// HTML Sanitization
// Uses char codes to avoid the auto-formatter mangling HTML entities.
const LT = String.fromCharCode(60);   // <
const GT = String.fromCharCode(62);   // >
const LT_ENT = String.fromCharCode(38) + 'lt;';   // <
const GT_ENT = String.fromCharCode(38) + 'gt;';   // >

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(new RegExp(LT, 'g'), LT_ENT)
              .replace(new RegExp(GT, 'g'), GT_ENT)
              .replace(new RegExp(LT_ENT + 'b' + GT_ENT, 'gi'), LT + 'b' + GT)
              .replace(new RegExp(LT_ENT + '/b' + GT_ENT, 'gi'), LT + '/b' + GT)
              .replace(new RegExp(LT_ENT + 'strong' + GT_ENT, 'gi'), LT + 'strong' + GT)
              .replace(new RegExp(LT_ENT + '/strong' + GT_ENT, 'gi'), LT + '/strong' + GT)
              .replace(new RegExp(LT_ENT + 'i' + GT_ENT, 'gi'), LT + 'i' + GT)
              .replace(new RegExp(LT_ENT + '/i' + GT_ENT, 'gi'), LT + '/i' + GT)
              .replace(new RegExp(LT_ENT + 'em' + GT_ENT, 'gi'), LT + 'em' + GT)
              .replace(new RegExp(LT_ENT + '/em' + GT_ENT, 'gi'), LT + '/em' + GT)
              .replace(new RegExp(LT_ENT + 'u' + GT_ENT, 'gi'), LT + 'u' + GT)
              .replace(new RegExp(LT_ENT + '/u' + GT_ENT, 'gi'), LT + '/u' + GT)
              .replace(new RegExp(LT_ENT + 'ul' + GT_ENT, 'gi'), LT + 'ul' + GT)
              .replace(new RegExp(LT_ENT + '/ul' + GT_ENT, 'gi'), LT + '/ul' + GT)
              .replace(new RegExp(LT_ENT + 'ol' + GT_ENT, 'gi'), LT + 'ol' + GT)
              .replace(new RegExp(LT_ENT + '/ol' + GT_ENT, 'gi'), LT + '/ol' + GT)
              .replace(new RegExp(LT_ENT + 'li' + GT_ENT, 'gi'), LT + 'li' + GT)
              .replace(new RegExp(LT_ENT + '/li' + GT_ENT, 'gi'), LT + '/li' + GT)
              .replace(new RegExp(LT_ENT + "a\\s+href=[\\\"']((?:https?:\\/\\/|mailto:)[^\\\"']+)[\\\"']" + GT_ENT, 'gi'), LT + 'a href="$1"' + GT)
              .replace(new RegExp(LT_ENT + '/a' + GT_ENT, 'gi'), LT + '/a' + GT);
}

function formatRichText(str) {
    return escapeHTML(str)
        .replace(/\n/g, '<br>')
        .replace(/(<(?:ul|ol)>|<\/li>)<br>/gi, '$1')
        .replace(/<br>(<\/(?:ul|ol)>)/gi, '$1');
}

// ── Text formatting helpers (Ctrl+B/I/U) ──
const FORMAT_TAGS = {
    b: { open: '<b>', close: '</b>', attr: 'data-bold-open' },
    i: { open: '<i>', close: '</i>', attr: 'data-italic-open' },
    u: { open: '<u>', close: '</u>', attr: 'data-underline-open' }
};

const LIST_SHORTCUTS = {
    '8': { open: '<ul>\n', close: '\n</ul>' },
    '7': { open: '<ol>\n', close: '\n</ol>' }
};

// Remove empty formatting tag pairs like <b></b>, <i></i>, <u></u> (case-insensitive)
function cleanEmptyFormattingTags(value) {
    if (!value) return value;
    let prev;
    let cleaned = value;
    // Repeat until no more empty pairs found (handles nested/sequential empties)
    do {
        prev = cleaned;
        cleaned = cleaned.replace(/<b\s*><\/b\s*>/gi, '')
                         .replace(/<i\s*><\/i\s*>/gi, '')
                         .replace(/<u\s*><\/u\s*>/gi, '')
                         .replace(/<strong\s*><\/strong\s*>/gi, '')
                         .replace(/<em\s*><\/em\s*>/gi, '');
    } while (cleaned !== prev);
    return cleaned;
}

// Wrap the currently-selected text in open/close tags
function wrapSelection(field, openTag, closeTag) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = field.value;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + openTag + selected + closeTag + value.substring(end);
    field.value = cleanEmptyFormattingTags(newValue);
    // Place cursor after the wrapped selection (after close tag)
    const newPos = start + openTag.length + selected.length + closeTag.length;
    field.setSelectionRange(newPos, newPos);
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

function wrapSelectionInList(field, listTags) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = field.value.substring(start, end);
    const lines = selected.split(/\r?\n/);
    const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
    const list = `${listTags.open}${listItems}${listTags.close}`;
    field.value = field.value.substring(0, start) + list + field.value.substring(end);
    const newPos = start + list.length;
    field.setSelectionRange(newPos, newPos);
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

function wrapSelectionInLink(field) {
    const url = window.prompt('Enter a URL (https://, http://, or mailto:)');
    if (!url) return;

    const trimmedUrl = url.trim();
    if (!/^(?:https?:\/\/|mailto:)[^\s"<>]+$/i.test(trimmedUrl)) {
        window.alert('Please enter a valid http, https, or mailto URL.');
        return;
    }

    const start = field.selectionStart;
    const end = field.selectionEnd;
    const selected = field.value.substring(start, end) || trimmedUrl;
    const link = `<a href="${trimmedUrl}">${selected}</a>`;
    field.value = field.value.substring(0, start) + link + field.value.substring(end);
    const newPos = start + link.length;
    field.setSelectionRange(newPos, newPos);
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

// Toggle open/close tag at cursor position (no selection)
function toggleFormatTag(field, openTag, closeTag, attrName) {
    const isOpen = field.getAttribute(attrName) === 'true';
    const pos = field.selectionStart;
    const value = field.value;
    if (isOpen) {
        field.value = cleanEmptyFormattingTags(value.substring(0, pos) + closeTag + value.substring(pos));
        field.setAttribute(attrName, 'false');
        field.setSelectionRange(pos + closeTag.length, pos + closeTag.length);
    } else {
        field.value = cleanEmptyFormattingTags(value.substring(0, pos) + openTag + value.substring(pos));
        field.setAttribute(attrName, 'true');
        field.setSelectionRange(pos + openTag.length, pos + openTag.length);
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
}

// Handle Ctrl+B/I/U on form text fields
document.addEventListener('keydown', (event) => {
    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl) return;
    const key = event.key.toLowerCase();
    const isLinkShortcut = key === 'k' && !event.shiftKey;
    const listShortcutKey = event.code === 'Digit7' ? '7' : event.code === 'Digit8' ? '8' : null;
    const isListShortcut = event.shiftKey && Boolean(listShortcutKey);
    if (key !== 'b' && key !== 'i' && key !== 'u' && !isListShortcut && !isLinkShortcut) return;

    const field = event.target;
    if (!field || !field.matches) return;
    // Only act on text inputs and textareas inside the resume form
    if (!field.matches('input[type="text"], textarea')) return;
    if (!field.closest('#resumeForm')) return;

    event.preventDefault();

    if (isLinkShortcut) {
        wrapSelectionInLink(field);
        return;
    }

    if (isListShortcut) {
        const listTags = LIST_SHORTCUTS[listShortcutKey];
        if (field.selectionStart !== field.selectionEnd) {
            wrapSelectionInList(field, listTags);
        } else {
            const pos = field.selectionStart;
            const list = `${listTags.open}<li></li>${listTags.close}`;
            field.value = field.value.substring(0, pos) + list + field.value.substring(pos);
            const newPos = pos + listTags.open.length + '<li>'.length;
            field.setSelectionRange(newPos, newPos);
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
    }

    const fmt = FORMAT_TAGS[key];
    if (!fmt) return;

    const hasSelection = field.selectionStart !== field.selectionEnd;
    if (hasSelection) {
        wrapSelection(field, fmt.open, fmt.close);
    } else {
        toggleFormatTag(field, fmt.open, fmt.close, fmt.attr);
    }
});

// Clean up empty formatting tags on input (e.g., user deletes text between tags)
document.addEventListener('input', (event) => {
    const field = event.target;
    if (!field || !field.matches) return;
    if (!field.matches('input[type="text"], textarea')) return;
    if (!field.closest('#resumeForm')) return;
    const cleaned = cleanEmptyFormattingTags(field.value);
    if (cleaned !== field.value) {
        const pos = field.selectionStart;
        field.value = cleaned;
        const newPos = Math.min(pos, cleaned.length);
        field.setSelectionRange(newPos, newPos);
    }
});

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