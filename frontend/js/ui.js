// Initialize Image Listeners
handleImageUpload('inp-photo', 'profilePicBase64');
handleImageUpload('inp-logo', 'logoBase64');
document.getElementById('resumeForm').addEventListener('input', () => updatePreview());

// ---- Compacted Form Handlers ----
const appendHTML = (id, html, classes = '') => {
    const div = document.createElement('div');
    if (classes) div.className = classes; else div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;';
    div.innerHTML = html;
    document.getElementById(id).appendChild(div);
    updatePreview();
};

const rmBtn = (isRow = false) => `<button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn" ${isRow ? 'style="width:auto; padding:0 10px;">X' : '><img src="./close.png" height=20>'}</button>`;

function addEducation() { appendHTML('educationList', `<input type="text" placeholder="Year" data-field="year" class="edu-input"><input type="text" placeholder="Degree/Exam" data-field="degree" class="edu-input"><input type="text" placeholder="Institution/Board" data-field="institution" class="edu-input"><input type="text" placeholder="CGPA/Percentage" data-field="score" class="edu-input">${rmBtn()}`, 'list-item'); }
function addAchievement() { appendHTML('achievementsList', `<input type="text" placeholder="Achievement" class="ach-input" style="flex:1;">${rmBtn(true)}`); }
function addProject() { appendHTML('projectsList', `<input type="text" placeholder="Project Title" data-field="title" class="proj-input"><input type="text" placeholder="Date" data-field="date" class="proj-input"><textarea placeholder="Description" data-field="desc" class="proj-input" rows="3"></textarea>${rmBtn()}`, 'list-item project-item'); }
function addInterest() { appendHTML('interestsList', `<input type="text" placeholder="Interest" class="int-input" style="flex:1;">${rmBtn(true)}`); }
function addPOR() { appendHTML('porList', `<input type="text" placeholder="Role" data-field="role" class="por-input"><input type="text" placeholder="Date" data-field="date" class="por-input"><textarea placeholder="Description" data-field="desc" class="por-input" rows="2"></textarea>${rmBtn()}`, 'list-item por-item'); }
function addExtracurricular() { appendHTML('extraActivitesList', `<input type="text" placeholder="Category" data-field="category" class="ext-input"><input type="text" placeholder="Details" data-field="desc" class="ext-input">${rmBtn()}`, 'list-item extra-item'); }
function addCustomSkill() { appendHTML('customSkillsList', `<input type="text" placeholder="Category (e.g. Frameworks)" class="skill-cat-input ext-input"><input type="text" placeholder="Skills (e.g. React, Node.js)" class="skill-val-input ext-input">${rmBtn()}`, 'list-item custom-skill-item'); }

// ---- Custom Section Engine ----
function getWrapperHTML() {
    return `<div class="add-section-divider" style="display: flex; align-items: center; cursor: pointer; transition: opacity 0.2s; opacity: 0.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="this.nextElementSibling.style.display='flex'; this.style.display='none';"><div style="flex: 1; height: 1.5px; background: #cbd5e1;"></div><span style="margin: 0 15px; color: #64748b; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">+ Add Section</span><div style="flex: 1; height: 1.5px; background: #cbd5e1;"></div></div><div class="add-section-controls" style="display: none; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; padding: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;"><select class="custom-type-select" style="flex: 1; min-width: 220px; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.95rem; color: #0f172a; background: #ffffff; cursor: pointer; outline: none;"><option value="type1">Type 1: Detailed (Sub-heading, Date, Desc)</option><option value="type2">Type 2: Bullet Points Only</option><option value="type3">Type 3: Categorized (Category + Bullet)</option></select><button type="button" onclick="injectCustomSection(this)" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">Insert</button><button type="button" onclick="this.parentElement.style.display='none'; this.parentElement.previousElementSibling.style.display='flex';" style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0 5px; line-height: 1;">&times;</button></div>`;
}

document.querySelectorAll('#resumeForm > section').forEach(sec => {
    const w = document.createElement('div'); w.className = 'add-custom-wrapper'; w.style.cssText = 'margin: 15px 0 25px 0;'; w.innerHTML = getWrapperHTML(); sec.insertAdjacentElement('afterend', w);
});

function injectCustomSection(btn) {
    const wrapper = btn.closest('.add-custom-wrapper'), type = wrapper.querySelector('.custom-type-select').value, secId = 'custom-sec-' + Date.now();
    const sec = document.createElement('section'); sec.className = 'custom-section'; sec.id = secId; sec.dataset.type = type;
    sec.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;"><input type="text" placeholder="Enter Section Title..." class="custom-sec-title" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; color: #0f172a; width: 75%; background: transparent;" value="" oninput="updatePreview()"><button type="button" onclick="const w = this.closest('section').nextElementSibling; if(w && w.classList.contains('add-custom-wrapper')) w.remove(); this.closest('section').remove(); updatePreview();" style="color: #ef4444; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.9rem;">&times; Remove</button></div><div class="custom-items-container"></div><button type="button" class="add-btn" onclick="addCustomItem('${secId}', '${type}')" style="margin-top: 10px;">+ Add Item</button>`;
    
    wrapper.querySelector('.add-section-controls').style.display = 'none'; wrapper.querySelector('.add-section-divider').style.display = 'flex';
    wrapper.parentNode.insertBefore(sec, wrapper);
    
    const newW = document.createElement('div'); newW.className = 'add-custom-wrapper'; newW.style.cssText = 'margin: 15px 0 25px 0;'; newW.innerHTML = getWrapperHTML();
    sec.insertAdjacentElement('beforebegin', newW); addCustomItem(secId, type);
}

function addCustomItem(secId, type) {
    const c = document.querySelector(`#${secId} .custom-items-container`), div = document.createElement('div');
    if (type === 'type1') { div.className = 'list-item project-item custom-item-type1'; div.innerHTML = `<input type="text" placeholder="Sub-heading" class="c-title proj-input"><input type="text" placeholder="Date" class="c-date proj-input"><textarea placeholder="Description" class="c-desc proj-input" rows="3"></textarea>${rmBtn()}`; } 
    else if (type === 'type2') { div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;'; div.innerHTML = `<input type="text" placeholder="Bullet point..." class="c-bullet ach-input" style="flex:1;">${rmBtn(true)}`; } 
    else if (type === 'type3') { div.className = 'list-item extra-item custom-item-type3'; div.innerHTML = `<input type="text" placeholder="Category" class="c-cat ext-input"><input type="text" placeholder="Details" class="c-desc ext-input">${rmBtn()}`; }
    c.appendChild(div); updatePreview();
}

// ---- Resizer Engine ----
const resizer = document.getElementById('dragMe'), leftPanel = document.getElementById('leftPanel'), rightPanel = document.getElementById('rightPanel');
let isResizing = false;
if (resizer) {
    resizer.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'col-resize'; leftPanel.style.userSelect = rightPanel.style.userSelect = rightPanel.style.pointerEvents = 'none'; });
    document.addEventListener('mousemove', (e) => { if (isResizing) { let nw = (e.clientX / window.innerWidth) * 100; if (nw > 20 && nw < 60) leftPanel.style.width = nw + '%'; } });
    document.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; document.body.style.cursor = 'default'; leftPanel.style.userSelect = rightPanel.style.userSelect = rightPanel.style.pointerEvents = 'auto'; } });
}