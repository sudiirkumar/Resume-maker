// Data Extraction Helper
const getListVals = (sel, fields) => Array.from(document.querySelectorAll(sel)).map(el => {
    let obj = {}; fields.forEach(f => obj[f] = el.querySelector(`[data-field="${f}"]`)?.value || ''); return obj;
});
// Minimal helper to add a new line to an extra activity
function addExtraLine(btn) {
    const linesContainer = btn.closest('.list-item').querySelector('.desc-lines');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; gap:8px; margin-bottom:8px;';
    div.innerHTML = `
        <input type="text" data-field="desc" class="ext-input" placeholder="Activity details..." style="flex:1;" oninput="updatePreview()">
        <button type="button" onclick="this.parentElement.remove(); updatePreview();" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size: 1.1rem;">&times;</button>
    `;
    linesContainer.appendChild(div);
    if (typeof updatePreview === 'function') updatePreview();
}
// 1. Create a global function that JUST builds the JSON object
function getResumeData() {
    const data = {
        name: document.getElementById('inp-name').value, 
        degree_title: document.getElementById('inp-degree-title').value,
        gender: document.getElementById('inp-gender').value, 
        dob: document.getElementById('inp-dob').value,
        email: document.getElementById('inp-email').value, 
        phone: document.getElementById('inp-phone').value,
        profile_pic_path: AppState.profilePicBase64, 
        logo_path: AppState.logoBase64, 
        footer_text: document.getElementById('inp-footer').value,
        skills_programming: document.getElementById('inp-skills-prog').value, 
        skills_engineering: document.getElementById('inp-skills-eng').value, 
        skills_other: document.getElementById('inp-skills-other').value,
        
        custom_skills: Array.from(document.querySelectorAll('.custom-skill-item')).map(i => ({ cat: i.querySelector('.skill-cat-input').value, val: i.querySelector('.skill-val-input').value, _hidden: i.dataset.hidden === 'true' })),
        educations: getListVals('#educationList .list-item', ['year', 'degree', 'institution', 'score']).map((item, idx) => {
            const allItems = document.querySelectorAll('#educationList .list-item');
            if (idx < allItems.length) item._hidden = allItems[idx].dataset.hidden === 'true';
            return item;
        }),
        achievements: Array.from(document.querySelectorAll('#achievementsList .list-item .ach-input')).map((i, idx) => {
            const allItems = document.querySelectorAll('#achievementsList .list-item');
            const isHidden = idx < allItems.length && allItems[idx].dataset.hidden === 'true';
            return { text: i.value, _hidden: isHidden };
        }).filter(v => v.text),
        projects: getListVals('#projectsList .project-item', ['title', 'date', 'desc']).map((item, idx) => {
            const allItems = document.querySelectorAll('#projectsList .project-item');
            if (idx < allItems.length) item._hidden = allItems[idx].dataset.hidden === 'true';
            return item;
        }),
        interests: Array.from(document.querySelectorAll('#interestsList .list-item .int-input:not(.c-bullet)')).map((i, idx) => {
            const allItems = document.querySelectorAll('#interestsList .list-item');
            const isHidden = idx < allItems.length && allItems[idx].dataset.hidden === 'true';
            return { text: i.value, _hidden: isHidden };
        }).filter(v => v.text),
        pors: getListVals('#porList .por-item', ['role', 'date', 'desc']).map((item, idx) => {
            const allItems = document.querySelectorAll('#porList .por-item');
            if (idx < allItems.length) item._hidden = allItems[idx].dataset.hidden === 'true';
            return item;
        }),
        extras: Array.from(document.querySelectorAll('#extraActivitesList .extra-item')).map(el => ({
    category: el.querySelector('[data-field="category"]')?.value || '',
    desc: Array.from(el.querySelectorAll('[data-field="desc"]')).map(i => i.value).filter(v => v),
    _hidden: el.dataset.hidden === 'true'
})),
        custom_sections: []
    };

    document.querySelectorAll('.custom-section').forEach(sec => {
        let prev = sec.previousElementSibling, insertAfterHeading = '';
        while(prev) { if (prev.tagName === 'SECTION' && !prev.classList.contains('custom-section')) { insertAfterHeading = prev.querySelector('h2')?.textContent || ''; break; } prev = prev.previousElementSibling; }
        
        const type = sec.dataset.type, items = [];
        if (type === 'type1') sec.querySelectorAll('.custom-item-type1').forEach(i => items.push({ title: i.querySelector('.c-title').value, date: i.querySelector('.c-date').value, desc: i.querySelector('.c-desc').value, _hidden: i.dataset.hidden === 'true' }));
        else if (type === 'type2') sec.querySelectorAll('.list-item:not([data-hidden="true"]) .c-bullet').forEach(i => { if(i.value) items.push(i.value); });
        else if (type === 'type3') sec.querySelectorAll('.custom-item-type3').forEach(i => items.push({ cat: i.querySelector('.c-cat').value, desc: i.querySelector('.c-desc').value, _hidden: i.dataset.hidden === 'true' }));
        
        data.custom_sections.push({ title: sec.querySelector('.custom-sec-title').value, type, insertAfterHeading, items });
    });

    return data;
}

// 2. Make the download button use that new function
function downloadJSON() {
    // 1. First, fetch the data using your helper function
    const data = getResumeData();
    
    // 2. Then, convert that data into a downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = 'resume_data.json';
    
    // 3. Trigger the download
    document.body.appendChild(a); // Append for better browser compatibility
    a.click(); 
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(a.href);
}
// ==========================================
// 🔄 DATA POPULATION HELPER
// ==========================================
function populateFormWithData(data) {
    // 1. Restore primitive text inputs
    ['name','degree_title','gender','dob','email','phone'].forEach(k => { 
        if(document.getElementById(`inp-${k.replace('_','-')}`)) {
            document.getElementById(`inp-${k.replace('_','-')}`).value = data[k] || ''; 
        }
    });
    document.getElementById('inp-footer').value = data.footer_text !== undefined ? data.footer_text : `Department of Training and Placement, NIT Trichy 620015\nTelephone : +91-431-2501081    e-mail: tp@nitt.edu, tnp.nitt@gmail.com`;
    
    ['prog','eng','other'].forEach(k => {
        document.getElementById(`inp-skills-${k}`).value = data[`skills_${k === 'prog' ? 'programming' : k === 'eng' ? 'engineering' : 'other'}`] || '';
    });
    
    // 2. Restore images to global state
    AppState.profilePicBase64 = data.profile_pic_path || ''; 
    AppState.logoBase64 = data.logo_path || '';

    // 3. UI Builder Helper for standard lists
    const fillList = (id, arr, htmlFn) => {
        const el = document.getElementById(id); 
        el.innerHTML = '';
        (arr || []).forEach(item => { 
            const div = document.createElement('div'); 
            if(['educationList','projectsList','porList','extraActivitesList','customSkillsList'].includes(id)) {
                div.className = 'list-item' + (id==='projectsList'?' project-item':id==='porList'?' por-item':id==='extraActivitesList'?' extra-item':id==='customSkillsList'?' custom-skill-item':''); 
            } else {
                div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;'; 
            }
            div.innerHTML = htmlFn(item); 
            el.appendChild(div); 
        });
    };
    
    // 4. Fill all standard lists
    fillList('customSkillsList', data.custom_skills, s => `<input type="text" class="skill-cat-input ext-input" value="${escapeHTML(s.cat||'')}"><input type="text" class="skill-val-input ext-input" value="${escapeHTML(s.val||'')}">${actionRow(rmBtn())}`);
    fillList('educationList', data.educations, e => `<input type="text" data-field="year" class="edu-input" value="${escapeHTML(e.year||'')}"><input type="text" data-field="degree" class="edu-input" value="${escapeHTML(e.degree||'')}"><input type="text" data-field="institution" class="edu-input" value="${escapeHTML(e.institution||'')}"><input type="text" data-field="score" class="edu-input" value="${escapeHTML(e.score||'')}">${actionRow(rmBtn())}`);
    fillList('achievementsList', data.achievements, a => `<input type="text" class="ach-input" value="${escapeHTML(typeof a === 'string' ? a : a.text || '')}" style="flex:1;">${actionRow(rmBtn(true))}`);
    fillList('projectsList', data.projects, p => `<input type="text" data-field="title" class="proj-input" value="${escapeHTML(p.title||'')}"><input type="text" data-field="date" class="proj-input" value="${escapeHTML(p.date||'')}"><textarea data-field="desc" class="proj-input" rows="3">${escapeHTML(p.desc||'')}</textarea>${actionRow(rmBtn())}`);
    fillList('interestsList', data.interests, int => `<input type="text" class="int-input" value="${escapeHTML(typeof int === 'string' ? int : int.text || '')}" style="flex:1;">${actionRow(rmBtn(true))}`);
    fillList('porList', data.pors, p => `<input type="text" data-field="role" class="por-input" value="${escapeHTML(p.role||'')}"><input type="text" data-field="date" class="por-input" value="${escapeHTML(p.date||'')}"><textarea data-field="desc" class="por-input" rows="2">${escapeHTML(p.desc||'')}</textarea>${actionRow(rmBtn())}`);
    fillList('extraActivitesList', data.extras, e => {
        // Force desc into an array (handles backwards compatibility with old JSONs)
        const descArray = Array.isArray(e.desc) ? e.desc : [e.desc || ''];
        
        // Build the HTML for all the lines
        const linesHTML = descArray.map((d, i) => `
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <input type="text" data-field="desc" class="ext-input" value="${escapeHTML(d)}" style="flex:1;">
                ${i > 0 ? `<button type="button" onclick="this.parentElement.remove(); updatePreview();" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size: 1.1rem;">&times;</button>` : ''}
            </div>
        `).join('');

        // Return the minimal nested UI structure with up/down buttons
        return `
            <input type="text" data-field="category" class="ext-input" value="${escapeHTML(e.category||'')}">
            <div class="desc-lines">${linesHTML}</div>
            <div class="item-action-row" style="margin-top: 5px;">
                <div class="action-left">
                    <button type="button" onclick="addExtraLine(this)" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:0.9rem; font-weight: bold;">+ Add Line</button>
                </div>
                <div class="action-center">
                    <div class="move-btns">
                        <button type="button" onclick="moveItemUp(this)" class="move-btn move-up-btn" title="Move up" aria-label="Move up">&#9650;</button>
                        <button type="button" onclick="moveItemDown(this)" class="move-btn move-down-btn" title="Move down" aria-label="Move down">&#9660;</button>
                    </div>
                </div>
                <div class="action-right" style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="toggleHideItem(this)" class="hide-btn" style="pointer-events:auto;" title="Toggle hide/show"><img src="./hide.png" height="16"></button>
                    <button type="button" onclick="removeItem(this)" class="remove-btn" style="width:auto; margin:0; padding: 2px 5px;"><img src="./close.png" height=16></button>
                </div>
            </div>
        `;
    });

    // Restore hidden state for all list items that have _hidden flag
    const restoreHiddenState = (selector, items) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, idx) => {
            if (items && items[idx] && items[idx]._hidden) {
                el.classList.add('is-hidden');
                el.dataset.hidden = 'true';
                el.querySelectorAll('input, textarea, select, button').forEach(inp => {
                    if (!inp.classList.contains('hide-btn') && !inp.classList.contains('remove-btn')) {
                        inp.disabled = true;
                    }
                });
            }
        });
    };
    restoreHiddenState('#educationList .list-item', data.educations);
    restoreHiddenState('#achievementsList .list-item', data.achievements);
    restoreHiddenState('#projectsList .project-item', data.projects);
    restoreHiddenState('#interestsList .list-item', data.interests);
    restoreHiddenState('#porList .por-item', data.pors);
    restoreHiddenState('#extraActivitesList .extra-item', data.extras);
    restoreHiddenState('.custom-skill-item', data.custom_skills);

    // 5. Clean Custom Wrappers & Re-init
    document.querySelectorAll('.add-custom-wrapper, .custom-section').forEach(el => el.remove());
    document.querySelectorAll('#resumeForm > section').forEach(sec => { 
        const w = document.createElement('div'); 
        w.className = 'add-custom-wrapper'; 
        w.style.cssText = 'margin: 15px 0 25px 0;'; 
        w.innerHTML = getWrapperHTML(); 
        sec.insertAdjacentElement('afterend', w); 
    });

    // 6. Restore Custom Sections
    (data.custom_sections || []).forEach(cs => {
        const secId = 'custom-sec-' + Date.now() + Math.random();
        const sec = document.createElement('section'); 
        sec.className = 'custom-section'; 
        sec.id = secId; 
        sec.dataset.type = cs.type;
        
        sec.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;"><input type="text" class="custom-sec-title" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; color: #0f172a; width: 75%; background: transparent;" value="${escapeHTML(cs.title)}" oninput="updatePreview()"><button type="button" onclick="const w = this.closest('section').nextElementSibling; if(w && w.classList.contains('add-custom-wrapper')) w.remove(); this.closest('section').remove(); updatePreview();" style="color: #ef4444; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.9rem;">&times; Remove</button></div><div class="custom-items-container"></div><button type="button" class="add-btn" onclick="addCustomItem('${secId}', '${cs.type}')" style="margin-top: 10px;">+ Add Item</button>`;
        
        let target = null;
        if (cs.insertAfterHeading) { 
            const tSec = Array.from(document.querySelectorAll('#resumeForm > section:not(.custom-section)')).find(s => s.querySelector('h2')?.textContent === cs.insertAfterHeading); 
            if (tSec) { 
                let n = tSec.nextElementSibling; 
                while(n && n.tagName !== 'SECTION' && n.id !== 'generateBtn') { 
                    if (n.classList.contains('add-custom-wrapper')) target = n; 
                    n = n.nextElementSibling; 
                } 
            } 
        }
        if (!target) target = document.getElementById('generateBtn');

        target.parentNode.insertBefore(sec, target);
        const w = document.createElement('div'); 
        w.className = 'add-custom-wrapper'; 
        w.style.cssText = 'margin: 15px 0 25px 0;'; 
        w.innerHTML = getWrapperHTML(); 
        sec.insertAdjacentElement('beforebegin', w);

        const c = sec.querySelector('.custom-items-container');
        cs.items.forEach(item => {
            const div = document.createElement('div');
            if (cs.type === 'type1') { 
                div.className = 'list-item project-item custom-item-type1'; 
                div.innerHTML = `<input type="text" class="c-title proj-input" value="${escapeHTML(item.title||'')}"><input type="text" class="c-date proj-input" value="${escapeHTML(item.date||'')}"><textarea class="c-desc proj-input" rows="3">${escapeHTML(item.desc||'')}</textarea>${actionRow(rmBtn())}`; 
            } else if (cs.type === 'type2') { 
                div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;'; 
                div.innerHTML = `<input type="text" class="c-bullet ach-input" value="${escapeHTML(item)}" style="flex:1;">${actionRow(rmBtn(true))}`; 
            } else if (cs.type === 'type3') { 
                div.className = 'list-item extra-item custom-item-type3'; 
                div.innerHTML = `<input type="text" class="c-cat ext-input" value="${escapeHTML(item.cat||'')}"><input type="text" class="c-desc ext-input" value="${escapeHTML(item.desc||'')}">${actionRow(rmBtn())}`; 
            }
            c.appendChild(div);
            // Restore hidden state for custom section items
            if (item._hidden) {
                div.classList.add('is-hidden');
                div.dataset.hidden = 'true';
                div.querySelectorAll('input, textarea, select, button').forEach(inp => {
                    if (!inp.classList.contains('hide-btn') && !inp.classList.contains('remove-btn') && !inp.classList.contains('move-btn')) {
                        inp.disabled = true;
                    }
                });
            }
        });
        if (typeof refreshMoveButtons === 'function') refreshMoveButtons(c);
    });

    // 7. Refresh all move buttons and trigger the visual update
    if (typeof refreshAllMoveButtons === 'function') refreshAllMoveButtons();
    updatePreview();
}
document.getElementById('uploadJsonBtn').addEventListener('change', function(e) {
    if (!e.target.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            populateFormWithData(data);
        } catch (err) {
            console.error("Error parsing JSON file:", err);
            alert("Invalid JSON file uploaded.");
        }
    };
    reader.readAsText(e.target.files[0]);
    
    e.target.value = ''; 
});

updatePreview();
// ==========================================
// 🗜️ IMAGE COMPRESSION UTILITY
// ==========================================
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Max dimensions (600px is plenty for a resume thumbnail)
            const MAX_SIZE = 600; 
            let width = img.width;
            let height = img.height;

            // Calculate the new dimensions while keeping aspect ratio
            if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Export as JPEG at 70% quality (massively reduces file size)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            callback(compressedBase64);
        };
    };
}
// ==========================================
// 🚀 HYBRID PDF GENERATOR (SERVER + FALLBACK)
// ==========================================
async function downloadPDF() {
    const btn = document.getElementById('generateBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;

    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://127.0.0.1:8000/api'
        : 'https://resume-maker-ih3k.onrender.com/api';

    try {
        const cssRes = await fetch('preview.css?v=6');
        const cssText = await cssRes.text();
        const resumeHTML = document.getElementById('resume-pages').outerHTML;
        
        const payloadHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    ${cssText}
                    body { background: white; margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                ${resumeHTML}
            </body>
            </html>
        `;

        const response = await fetch(`${API_URL}/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: payloadHTML })
        });

        // 🚨 THE FALLBACK TRIGGER 🚨
        if (!response.ok) {
            throw new Error(`API failed with status: ${response.status}`);
        }

        // --- SUCCESS: Download the API PDF ---
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const userName = document.getElementById('inp-name').value.trim() || 'Resume';
        a.download = `${userName.replace(/\s+/g, '_')}_Resume.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        // --- FAILURE: Fallback to Local Print ---
        console.warn("Backend API limit reached or offline. Falling back to local print...", error);
        
        btn.innerHTML = '⚠️ API Limit: Using Local Print...';
        
        // Brief pause so the user reads the warning, then pop the print dialog
        setTimeout(() => {
            window.print();
        }, 800);

    } finally {
        // Reset the button state
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);
    }
}
document.getElementById('generateBtn').addEventListener('click', downloadPDF);