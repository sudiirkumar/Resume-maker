let profilePicBase64 = "";
let logoBase64 = "";

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/&lt;b&gt;/gi, '<b>').replace(/&lt;\/b&gt;/gi, '</b>')
        .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>')
        .replace(/&lt;i&gt;/gi, '<i>').replace(/&lt;\/i&gt;/gi, '</i>')
        .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>');
}

// ---- Native Form Addition Handlers ----
function addEducation() {
    const div = document.createElement('div'); div.className = 'list-item';
    div.innerHTML = `<input type="text" placeholder="Year" data-field="year" class="edu-input"><input type="text" placeholder="Degree/Exam" data-field="degree" class="edu-input"><input type="text" placeholder="Institution/Board" data-field="institution" class="edu-input"><input type="text" placeholder="CGPA/Percentage" data-field="score" class="edu-input">`;
    document.getElementById('educationList').appendChild(div); updatePreview();
}
function addAchievement() {
    const input = document.createElement('input'); input.type = 'text'; input.className = 'ach-input'; input.placeholder = 'Achievement';
    document.getElementById('achievementsList').appendChild(input); updatePreview();
}
function addProject() {
    const div = document.createElement('div'); div.className = 'list-item project-item';
    div.innerHTML = `<input type="text" placeholder="Project Title" data-field="title" class="proj-input"><input type="text" placeholder="Date" data-field="date" class="proj-input"><textarea placeholder="Description" data-field="desc" class="proj-input" rows="3"></textarea>`;
    document.getElementById('projectsList').appendChild(div); updatePreview();
}
function addInterest() {
    const input = document.createElement('input'); input.type = 'text'; input.className = 'int-input'; input.placeholder = 'Interest';
    document.getElementById('interestsList').appendChild(input); updatePreview();
}
function addPOR() {
    const div = document.createElement('div'); div.className = 'list-item por-item';
    div.innerHTML = `<input type="text" placeholder="Role" data-field="role" class="por-input"><input type="text" placeholder="Date" data-field="date" class="por-input"><textarea placeholder="Description" data-field="desc" class="por-input" rows="2"></textarea>`;
    document.getElementById('porList').appendChild(div); updatePreview();
}
function addExtracurricular() {
    const div = document.createElement('div'); div.className = 'list-item extra-item';
    div.innerHTML = `<input type="text" placeholder="Category" data-field="category" class="ext-input"><input type="text" placeholder="Details" data-field="desc" class="ext-input">`;
    document.getElementById('extraActivitesList').appendChild(div); updatePreview();
}
document.getElementById('inp-logo').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function (evt) { logoBase64 = evt.target.result; updatePreview(); };
        reader.readAsDataURL(e.target.files[0]);
    }
});
document.getElementById('resumeForm').addEventListener('input', updatePreview);
document.getElementById('inp-photo').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function (evt) { profilePicBase64 = evt.target.result; updatePreview(); };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// ---- CUSTOM SECTION ENGINE ----
function getWrapperHTML() {
    return `
        <div class="add-section-divider" style="display: flex; align-items: center; cursor: pointer; transition: opacity 0.2s; opacity: 0.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="this.nextElementSibling.style.display='flex'; this.style.display='none';">
            <div style="flex: 1; height: 1.5px; background: #cbd5e1;"></div>
            <span style="margin: 0 15px; color: #64748b; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">+ Add Section</span>
            <div style="flex: 1; height: 1.5px; background: #cbd5e1;"></div>
        </div>
        
        <div class="add-section-controls" style="display: none; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px; padding: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
            <select class="custom-type-select" style="flex: 1; min-width: 220px; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.95rem; color: #0f172a; background: #ffffff; cursor: pointer; outline: none;">
                <option value="type1">Type 1: Detailed (Sub-heading, Date, Desc)</option>
                <option value="type2">Type 2: Bullet Points Only</option>
                <option value="type3">Type 3: Categorized (Category + Bullet)</option>
            </select>
            
            <button type="button" onclick="injectCustomSection(this)" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                Insert
            </button>
            
            <button type="button" onclick="this.parentElement.style.display='none'; this.parentElement.previousElementSibling.style.display='flex';" style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0 5px; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'" title="Cancel">
                &times;
            </button>
        </div>
    `;
}

document.querySelectorAll('#resumeForm > section').forEach((sec) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'add-custom-wrapper';
    wrapper.style.cssText = 'margin: 15px 0 25px 0;';
    wrapper.innerHTML = getWrapperHTML();
    sec.insertAdjacentElement('afterend', wrapper);
});

function injectCustomSection(btn) {
    const wrapper = btn.closest('.add-custom-wrapper');
    const type = wrapper.querySelector('.custom-type-select').value;
    const secId = 'custom-sec-' + Date.now();
    const sec = document.createElement('section');
    sec.className = 'custom-section';
    sec.id = secId;
    sec.dataset.type = type;

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">
            <input type="text" placeholder="Enter Section Title..." class="custom-sec-title" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; color: #0f172a; width: 75%; background: transparent;" value="" oninput="updatePreview()">
            <button type="button" onclick="const w = this.closest('section').nextElementSibling; if(w && w.classList.contains('add-custom-wrapper')) w.remove(); this.closest('section').remove(); updatePreview();" style="color: #ef4444; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.9rem;">&times; Remove</button>
        </div>
        <div class="custom-items-container"></div>
    `;

    if (type === 'type1') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type1')" style="margin-top: 10px;">+ Add Item</button>`;
    if (type === 'type2') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type2')" style="margin-top: 10px;">+ Add Bullet</button>`;
    if (type === 'type3') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type3')" style="margin-top: 10px;">+ Add Category</button>`;

    sec.innerHTML = html;
    wrapper.querySelector('.add-section-controls').style.display = 'none';
    wrapper.querySelector('.add-section-divider').style.display = 'flex';
    wrapper.parentNode.insertBefore(sec, wrapper);

    const newWrapper = document.createElement('div');
    newWrapper.className = 'add-custom-wrapper';
    newWrapper.style.cssText = 'margin: 15px 0 25px 0;';
    newWrapper.innerHTML = getWrapperHTML();
    sec.insertAdjacentElement('beforebegin', newWrapper);

    addCustomItem(secId, type);
}

function addCustomItem(secId, type) {
    const container = document.querySelector(`#${secId} .custom-items-container`);
    if (type === 'type1') {
        const div = document.createElement('div'); div.className = 'list-item project-item custom-item-type1';
        div.innerHTML = `<input type="text" placeholder="Sub-heading" class="c-title proj-input"><input type="text" placeholder="Date (Optional)" class="c-date proj-input"><textarea placeholder="Description" class="c-desc proj-input" rows="3"></textarea>`;
        container.appendChild(div);
    } else if (type === 'type2') {
        const input = document.createElement('input'); input.type = 'text'; input.placeholder = 'Bullet point...'; input.className = 'c-bullet ach-input'; input.style.marginBottom = '8px';
        container.appendChild(input);
    } else if (type === 'type3') {
        const div = document.createElement('div'); div.className = 'list-item extra-item custom-item-type3';
        div.innerHTML = `<input type="text" placeholder="Category (Italicized)" class="c-cat ext-input"><input type="text" placeholder="Details" class="c-desc ext-input">`;
        container.appendChild(div);
    }
    updatePreview();
}

// ---- DYNAMIC DOM-ORDERED PAGINATION ENGINE ----
function updatePreview() {
    const chunks = [];

    const headerChunk = document.createElement('div');
    headerChunk.className = 'resume-header';
    const profilePicDisplay = profilePicBase64 ? 'block' : 'none';
    headerChunk.innerHTML = `
        <div class="school-logo">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo">` : '<div style="color:#ccc; font-size:10px; text-align:center;">Logo</div>'}
        </div>
        <div class="header-center">
            <h1 class="header-name">${escapeHTML(document.getElementById('inp-name').value) || 'YOUR NAME'}</h1>
            <p class="header-info">
                <span>${escapeHTML(document.getElementById('inp-degree-title').value) || 'Master of Computer Applications'}</span><br>
                Gender: <span>${escapeHTML(document.getElementById('inp-gender').value) || ''}</span><br>
                Date of Birth: <span>${escapeHTML(document.getElementById('inp-dob').value) || 'DD/MM/YYYY'}</span><br>
                E-mail : <span>${escapeHTML(document.getElementById('inp-email').value) || 'abc@example.com'}</span><br>
                Contact : <span>${escapeHTML(document.getElementById('inp-phone').value) || '+91-XYZ-ABCDEFG'}</span>
            </p>
        </div>
        <div class="profile-pic-container"><img src="${profilePicBase64}" style="display: ${profilePicDisplay}; width: 100%; height: 100%; object-fit: cover;"></div>
    `;
    chunks.push({ el: headerChunk, type: 'header' });

    const allSections = document.querySelectorAll('#resumeForm > section');
    allSections.forEach(sec => {
        if (sec.querySelector('#inp-name')) return;

        if (sec.querySelector('#educationList')) {
            const eduItems = Array.from(sec.querySelectorAll('.list-item'));
            if (eduItems.some(i => i.querySelector('[data-field="year"]').value || i.querySelector('[data-field="degree"]').value)) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Educational Qualification';
                chunks.push({ el: title, type: 'title' });
                const table = document.createElement('table'); table.className = 'edu-table';
                let tbodyStr = '';
                eduItems.forEach(i => {
                    const y = escapeHTML(i.querySelector('[data-field="year"]').value), d = escapeHTML(i.querySelector('[data-field="degree"]').value), inst = escapeHTML(i.querySelector('[data-field="institution"]').value), s = escapeHTML(i.querySelector('[data-field="score"]').value);
                    if (y || d || inst || s) tbodyStr += `<tr><td>${y}</td><td>${d}</td><td>${inst}</td><td>${s}</td></tr>`;
                });
                table.innerHTML = `<thead><tr><th>Year</th><th>Degree/Examination</th><th>Institution/Board</th><th>CGPA/Percentage</th></tr></thead><tbody>${tbodyStr}</tbody>`;
                chunks.push({ el: table, type: 'block' });
            }
        }
        else if (sec.querySelector('#achievementsList')) {
            const achs = Array.from(sec.querySelectorAll('.ach-input')).map(i => escapeHTML(i.value)).filter(v => v);
            if (achs.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Academic Achievements'; chunks.push({ el: title, type: 'title' });
                const ul = document.createElement('ul'); ul.className = 'bullet-list'; achs.forEach(a => { ul.innerHTML += `<li>${a}</li>`; }); chunks.push({ el: ul, type: 'block' });
            }
        }
        else if (sec.querySelector('#projectsList')) {
            const projs = Array.from(sec.querySelectorAll('.project-item')).filter(i => i.querySelector('[data-field="title"]').value);
            if (projs.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Other Projects'; chunks.push({ el: title, type: 'title' });
                projs.forEach(i => {
                    const b = document.createElement('div'); b.className = 'item-block';
                    const pt = escapeHTML(i.querySelector('[data-field="title"]').value), pd = escapeHTML(i.querySelector('[data-field="date"]').value), pD = escapeHTML(i.querySelector('[data-field="desc"]').value);
                    b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${pt}</span><span class="item-date">${pd}</span></div>${pD ? `<p class="item-desc">${pD.split('\n').join('<br>')}</p>` : ''}`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        else if (sec.querySelector('#interestsList')) {
            const ints = Array.from(sec.querySelectorAll('.int-input')).map(i => escapeHTML(i.value)).filter(v => v);
            if (ints.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Areas of Interest'; chunks.push({ el: title, type: 'title' });
                const ul = document.createElement('ul'); ul.className = 'bullet-list'; ints.forEach(i => { ul.innerHTML += `<li>${i}</li>`; }); chunks.push({ el: ul, type: 'block' });
            }
        }
        else if (sec.querySelector('#inp-skills-prog')) {
            const pS = escapeHTML(sec.querySelector('#inp-skills-prog').value), eS = escapeHTML(sec.querySelector('#inp-skills-eng').value), oS = escapeHTML(sec.querySelector('#inp-skills-other').value);
            if (pS || eS || oS) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Technical Skills and Certifications'; chunks.push({ el: title, type: 'title' });
                const table = document.createElement('table'); table.className = 'skills-table'; let tHTML = '';
                if (pS) tHTML += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Programming Languages</div></td><td>: ${pS}</td></tr>`;
                if (eS) tHTML += `<tr><td><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Engineering Software</div></td><td>: ${eS}</td></tr>`;
                if (oS) tHTML += `<tr><td><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Other Software</div></td><td>: ${oS}</td></tr>`;
                table.innerHTML = tHTML; chunks.push({ el: table, type: 'block' });
            }
        }
        else if (sec.querySelector('#porList')) {
            const pors = Array.from(sec.querySelectorAll('.por-item')).filter(i => i.querySelector('[data-field="role"]').value);
            if (pors.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Positions of Responsibility'; chunks.push({ el: title, type: 'title' });
                pors.forEach(i => {
                    const b = document.createElement('div'); b.className = 'item-block';
                    const r = escapeHTML(i.querySelector('[data-field="role"]').value), d = escapeHTML(i.querySelector('[data-field="date"]').value), c = escapeHTML(i.querySelector('[data-field="desc"]').value);
                    b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${r}</span><span class="item-date">${d}</span></div>${c ? `<p class="item-desc">${c.split('\n').join('<br>')}</p>` : ''}`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        else if (sec.querySelector('#extraActivitesList')) {
            const exts = Array.from(sec.querySelectorAll('.extra-item')).filter(i => i.querySelector('[data-field="category"]').value || i.querySelector('[data-field="desc"]').value);
            if (exts.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Extracurricular Activities'; chunks.push({ el: title, type: 'title' });
                exts.forEach(i => {
                    const b = document.createElement('div'); b.style.marginBottom = '10px';
                    const c = escapeHTML(i.querySelector('[data-field="category"]').value), d = escapeHTML(i.querySelector('[data-field="desc"]').value);
                    b.innerHTML = `<div class="extra-category">${c}</div><ul class="bullet-list" style="margin-bottom:0;"><li>${d}</li></ul>`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        // Handle Injected Custom Sections
        else if (sec.classList.contains('custom-section')) {

            // FIX: Added a fallback title so the section renders instantly even if the title box is blank
            const titleText = escapeHTML(sec.querySelector('.custom-sec-title').value) || 'Custom Section';
            const type = sec.dataset.type;

            const titleEl = document.createElement('div');
            titleEl.className = 'section-title';
            titleEl.textContent = titleText;

            // FIX: Removed the empty-box filters so new items render immediately to the preview panel
            if (type === 'type1') {
                const items = Array.from(sec.querySelectorAll('.custom-item-type1'));
                if (items.length > 0) {
                    chunks.push({ el: titleEl, type: 'title' });
                    items.forEach(i => {
                        const b = document.createElement('div'); b.className = 'item-block';
                        const pt = escapeHTML(i.querySelector('.c-title').value);
                        const pd = escapeHTML(i.querySelector('.c-date').value);
                        const pDesc = escapeHTML(i.querySelector('.c-desc').value);
                        b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${pt}</span><span class="item-date">${pd}</span></div>${pDesc ? `<p class="item-desc">${pDesc.split('\n').join('<br>')}</p>` : ''}`;
                        chunks.push({ el: b, type: 'block' });
                    });
                }
            } else if (type === 'type2') {
                const inputs = Array.from(sec.querySelectorAll('.c-bullet'));
                if (inputs.length > 0) {
                    chunks.push({ el: titleEl, type: 'title' });
                    const ul = document.createElement('ul'); ul.className = 'bullet-list';
                    inputs.forEach(i => { ul.innerHTML += `<li>${escapeHTML(i.value)}</li>`; });
                    chunks.push({ el: ul, type: 'block' });
                }
            } else if (type === 'type3') {
                const items = Array.from(sec.querySelectorAll('.custom-item-type3'));
                if (items.length > 0) {
                    chunks.push({ el: titleEl, type: 'title' });
                    items.forEach(i => {
                        const b = document.createElement('div'); b.style.marginBottom = '10px';
                        const c = escapeHTML(i.querySelector('.c-cat').value);
                        const d = escapeHTML(i.querySelector('.c-desc').value);
                        b.innerHTML = `<div class="extra-category">${c}</div><ul class="bullet-list" style="margin-bottom:0;"><li>${d}</li></ul>`;
                        chunks.push({ el: b, type: 'block' });
                    });
                }
            }
        }
    });

    paginateChunks(chunks);
}

function createNewPage() {
    const page = document.createElement('div'); page.className = 'a4-page';
    const content = document.createElement('div'); content.className = 'page-content';
    page.appendChild(content);

    const footer = document.createElement('div'); footer.className = 'resume-footer';
    footer.innerHTML = `<div class="footer-line"></div><div class="footer-text">XXXXXXXXXX XX XXXXXXXX XXX XXXXXXXXX, XXX XXXXXX XXXXXX<br>Telephone : +91-XYZ-ABCDEFG&nbsp;&nbsp; e-mail: ab@lmno.xyz, abc.lmno@gmail.com</div><div class="footer-line"></div>`;
    page.appendChild(footer);
    return page;
}

function paginateChunks(chunks) {
    const container = document.getElementById('resume-pages');
    container.innerHTML = '';

    let currentPage = createNewPage(); container.appendChild(currentPage);
    let currentContent = currentPage.querySelector('.page-content');

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        currentContent.appendChild(chunk.el);

        if (currentContent.scrollHeight > currentContent.clientHeight + 2) {
            currentContent.removeChild(chunk.el);
            currentPage = createNewPage(); container.appendChild(currentPage);
            currentContent = currentPage.querySelector('.page-content');

            if (chunk.type === 'block' && i > 0 && chunks[i - 1].type === 'title') {
                const prevTitle = chunks[i - 1].el;
                const prevPageContent = container.children[container.children.length - 2].querySelector('.page-content');
                if (prevPageContent.contains(prevTitle)) prevPageContent.removeChild(prevTitle);
                currentContent.appendChild(prevTitle);
            }
            currentContent.appendChild(chunk.el);
        }
    }
}

// ---- Data Import / Export ----
// ---- Data Import / Export ----
function downloadJSON() {
    const data = {
        name: document.getElementById('inp-name').value, 
        degree_title: document.getElementById('inp-degree-title').value,
        gender: document.getElementById('inp-gender').value, 
        dob: document.getElementById('inp-dob').value,
        email: document.getElementById('inp-email').value, 
        phone: document.getElementById('inp-phone').value,
        profile_pic_path: profilePicBase64,
        logo_path: logoBase64, // <-- Added the logo here
        skills_programming: document.getElementById('inp-skills-prog').value, 
        skills_engineering: document.getElementById('inp-skills-eng').value, 
        skills_other: document.getElementById('inp-skills-other').value,
        educations: [], achievements: [], projects: [], interests: [], pors: [], extras: [], custom_sections: []
    };
    
    document.querySelectorAll('#educationList .list-item').forEach(i => data.educations.push({ year: i.querySelector('[data-field="year"]').value, degree: i.querySelector('[data-field="degree"]').value, institution: i.querySelector('[data-field="institution"]').value, score: i.querySelector('[data-field="score"]').value }));
    document.querySelectorAll('.ach-input').forEach(i => { if(i.value) data.achievements.push(i.value); });
    document.querySelectorAll('.project-item:not(.custom-item-type1)').forEach(i => data.projects.push({ title: i.querySelector('[data-field="title"]').value, date: i.querySelector('[data-field="date"]').value, desc: i.querySelector('[data-field="desc"]').value }));
    document.querySelectorAll('.int-input:not(.c-bullet)').forEach(i => { if(i.value) data.interests.push(i.value); });
    document.querySelectorAll('.por-item').forEach(i => data.pors.push({ role: i.querySelector('[data-field="role"]').value, date: i.querySelector('[data-field="date"]').value, desc: i.querySelector('[data-field="desc"]').value }));
    document.querySelectorAll('.extra-item:not(.custom-item-type3)').forEach(i => data.extras.push({ category: i.querySelector('[data-field="category"]').value, desc: i.querySelector('[data-field="desc"]').value }));

    document.querySelectorAll('.custom-section').forEach(sec => {
        const secData = { title: sec.querySelector('.custom-sec-title').value, type: sec.dataset.type, items: [] };
        if (secData.type === 'type1') {
            sec.querySelectorAll('.custom-item-type1').forEach(item => { secData.items.push({ title: item.querySelector('.c-title').value, date: item.querySelector('.c-date').value, desc: item.querySelector('.c-desc').value }); });
        } else if (secData.type === 'type2') {
            sec.querySelectorAll('.c-bullet').forEach(item => { if(item.value) secData.items.push(item.value); });
        } else if (secData.type === 'type3') {
            sec.querySelectorAll('.custom-item-type3').forEach(item => { secData.items.push({ cat: item.querySelector('.c-cat').value, desc: item.querySelector('.c-desc').value }); });
        }
        data.custom_sections.push(secData);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resume_data.json';
    a.click(); URL.revokeObjectURL(a.href);
}

document.getElementById('uploadJsonBtn').addEventListener('change', function(e) {
    if (!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = JSON.parse(evt.target.result);
        document.getElementById('inp-name').value = data.name || ''; 
        document.getElementById('inp-degree-title').value = data.degree_title || '';
        document.getElementById('inp-gender').value = data.gender || 'Male'; 
        document.getElementById('inp-dob').value = data.dob || '';
        document.getElementById('inp-email').value = data.email || ''; 
        document.getElementById('inp-phone').value = data.phone || '';
        document.getElementById('inp-skills-prog').value = data.skills_programming || ''; 
        document.getElementById('inp-skills-eng').value = data.skills_engineering || ''; 
        document.getElementById('inp-skills-other').value = data.skills_other || '';
        
        profilePicBase64 = data.profile_pic_path || '';
        logoBase64 = data.logo_path || ''; // <-- Restores the logo

        const fillList = (id, arr, htmlFn) => { const el = document.getElementById(id); el.innerHTML = ''; (arr || []).forEach(item => { const div = document.createElement('div'); div.className = 'list-item'; div.innerHTML = htmlFn(item); el.appendChild(div); }); };
        
        fillList('educationList', data.educations, e => `<input type="text" placeholder="Year" data-field="year" class="edu-input" value="${escapeHTML(e.year||'')}"><input type="text" placeholder="Degree/Exam" data-field="degree" class="edu-input" value="${escapeHTML(e.degree||'')}"><input type="text" placeholder="Institution/Board" data-field="institution" class="edu-input" value="${escapeHTML(e.institution||'')}"><input type="text" placeholder="CGPA/Percentage" data-field="score" class="edu-input" value="${escapeHTML(e.score||'')}">`);
        
        const achL = document.getElementById('achievementsList'); achL.innerHTML = ''; (data.achievements||[]).forEach(a => { const i = document.createElement('input'); i.type='text'; i.className='ach-input'; i.value=a; achL.appendChild(i); });
        
        fillList('projectsList', data.projects, p => `<input type="text" placeholder="Project Title" data-field="title" class="proj-input" value="${escapeHTML(p.title||'')}"><input type="text" placeholder="Date" data-field="date" class="proj-input" value="${escapeHTML(p.date||'')}"><textarea placeholder="Description" data-field="desc" class="proj-input" rows="3">${escapeHTML(p.desc||'')}</textarea>`);
        document.querySelectorAll('#projectsList .list-item').forEach(el => el.classList.add('project-item'));

        const intL = document.getElementById('interestsList'); intL.innerHTML = ''; (data.interests||[]).forEach(int => { const i = document.createElement('input'); i.type='text'; i.className='int-input'; i.value=int; intL.appendChild(i); });
        
        fillList('porList', data.pors, p => `<input type="text" placeholder="Role" data-field="role" class="por-input" value="${escapeHTML(p.role||'')}"><input type="text" placeholder="Date" data-field="date" class="por-input" value="${escapeHTML(p.date||'')}"><textarea placeholder="Description" data-field="desc" class="por-input" rows="2">${escapeHTML(p.desc||'')}</textarea>`);
        document.querySelectorAll('#porList .list-item').forEach(el => el.classList.add('por-item'));

        fillList('extraActivitesList', data.extras, e => `<input type="text" placeholder="Category" data-field="category" class="ext-input" value="${escapeHTML(e.category||'')}"><input type="text" placeholder="Details" data-field="desc" class="ext-input" value="${escapeHTML(e.desc||'')}">`);
        document.querySelectorAll('#extraActivitesList .list-item').forEach(el => el.classList.add('extra-item'));

        document.querySelectorAll('.custom-section').forEach(s => { if(s.nextElementSibling && s.nextElementSibling.classList.contains('add-custom-wrapper')) s.nextElementSibling.remove(); s.remove(); });
        const formBtn = document.getElementById('generateBtn');
        (data.custom_sections || []).forEach(cs => {
            const secId = 'custom-sec-' + Date.now() + Math.random();
            const sec = document.createElement('section'); sec.className = 'custom-section'; sec.id = secId; sec.dataset.type = cs.type;
            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">
                    <input type="text" class="custom-sec-title" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; color: #0f172a; width: 75%; background: transparent;" value="${escapeHTML(cs.title)}" oninput="updatePreview()">
                    <button type="button" onclick="const w = this.closest('section').nextElementSibling; if(w && w.classList.contains('add-custom-wrapper')) w.remove(); this.closest('section').remove(); updatePreview();" style="color: #ef4444; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.9rem;">&times; Remove</button>
                </div>
                <div class="custom-items-container"></div>
            `;
            if (cs.type === 'type1') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type1')" style="margin-top: 10px;">+ Add Item</button>`;
            if (cs.type === 'type2') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type2')" style="margin-top: 10px;">+ Add Bullet</button>`;
            if (cs.type === 'type3') html += `<button type="button" class="add-btn" onclick="addCustomItem('${secId}', 'type3')" style="margin-top: 10px;">+ Add Category</button>`;

            sec.innerHTML = html;
            formBtn.parentNode.insertBefore(sec, formBtn);
            
            const w = document.createElement('div'); w.className = 'add-custom-wrapper'; w.style.cssText = 'margin: 15px 0 25px 0;';
            w.innerHTML = getWrapperHTML();
            formBtn.parentNode.insertBefore(w, formBtn);

            const container = sec.querySelector('.custom-items-container');
            cs.items.forEach(item => {
                if (cs.type === 'type1') {
                    const div = document.createElement('div'); div.className = 'list-item project-item custom-item-type1';
                    div.innerHTML = `<input type="text" class="c-title proj-input" value="${escapeHTML(item.title||'')}"><input type="text" class="c-date proj-input" value="${escapeHTML(item.date||'')}"><textarea class="c-desc proj-input" rows="3">${escapeHTML(item.desc||'')}</textarea>`;
                    container.appendChild(div);
                } else if (cs.type === 'type2') {
                    const input = document.createElement('input'); input.type = 'text'; input.className = 'c-bullet ach-input'; input.value = item; input.style.marginBottom = '8px';
                    container.appendChild(input);
                } else if (cs.type === 'type3') {
                    const div = document.createElement('div'); div.className = 'list-item extra-item custom-item-type3';
                    div.innerHTML = `<input type="text" class="c-cat ext-input" value="${escapeHTML(item.cat||'')}"><input type="text" class="c-desc ext-input" value="${escapeHTML(item.desc||'')}">`;
                    container.appendChild(div);
                }
            });
        });

        updatePreview();
    };
    reader.readAsText(e.target.files[0]);
});

// Init
updatePreview();

// ---- THE RESIZER ENGINE ----
const resizer = document.getElementById('dragMe');
const leftPanel = document.getElementById('leftPanel');
const rightPanel = document.getElementById('rightPanel');

let isResizing = false;

if (resizer) {
    resizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        leftPanel.style.userSelect = 'none';
        rightPanel.style.userSelect = 'none';
        rightPanel.style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isResizing) return;
        let newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 60) {
            leftPanel.style.width = newWidth + '%';
        }
    });

    document.addEventListener('mouseup', function () {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            leftPanel.style.userSelect = 'auto';
            rightPanel.style.userSelect = 'auto';
            rightPanel.style.pointerEvents = 'auto';
        }
    });
}