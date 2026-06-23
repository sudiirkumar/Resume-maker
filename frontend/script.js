let profilePicBase64 = "";

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/&lt;b&gt;/gi, '<b>').replace(/&lt;\/b&gt;/gi, '</b>')
              .replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>')
              .replace(/&lt;i&gt;/gi, '<i>').replace(/&lt;\/i&gt;/gi, '</i>')
              .replace(/&lt;em&gt;/gi, '<em>').replace(/&lt;\/em&gt;/gi, '</em>');
}

// ---- Form Addition Handlers ----
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

document.getElementById('resumeForm').addEventListener('input', updatePreview);
document.getElementById('inp-photo').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) { profilePicBase64 = evt.target.result; updatePreview(); };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// ---- CORE PAGINATION ENGINE ----
function updatePreview() {
    const chunks = []; // Array of { el: DOMNode, type: String }

    // 1. Header
    const headerChunk = document.createElement('div');
    headerChunk.className = 'resume-header';
    const profilePicDisplay = profilePicBase64 ? 'block' : 'none';
    headerChunk.innerHTML = `
        <div class="school-logo">
            <img src="logo.png" alt="Logo">
        </div>
        <div class="header-center">
            <h1 class="header-name">${escapeHTML(document.getElementById('inp-name').value) || 'SUDHIR KUMAR'}</h1>
            <p class="header-info">
                <span>${escapeHTML(document.getElementById('inp-degree-title').value) || 'Master of Computer Applications'}</span><br>
                Gender: <span>${escapeHTML(document.getElementById('inp-gender').value) || 'Male'}</span><br>
                Date of Birth: <span>${escapeHTML(document.getElementById('inp-dob').value) || '07/08/2002'}</span><br>
                E-mail : <span>${escapeHTML(document.getElementById('inp-email').value) || 'tp@nitt.edu'}</span><br>
                Contact : <span>${escapeHTML(document.getElementById('inp-phone').value) || '+91-431-2501081'}</span>
            </p>
        </div>
        <div class="profile-pic-container">
            <img src="${profilePicBase64}" style="display: ${profilePicDisplay}; width: 100%; height: 100%; object-fit: cover;">
        </div>
    `;
    chunks.push({ el: headerChunk, type: 'header' });

    // 2. Education
    const eduItems = Array.from(document.querySelectorAll('#educationList .list-item'));
    if (eduItems.some(item => item.querySelector('[data-field="year"]').value || item.querySelector('[data-field="degree"]').value)) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Educational Qualification';
        chunks.push({ el: title, type: 'title' });
        
        const table = document.createElement('table'); table.className = 'edu-table';
        let tbodyStr = '';
        eduItems.forEach(item => {
            const y = escapeHTML(item.querySelector('[data-field="year"]').value);
            const d = escapeHTML(item.querySelector('[data-field="degree"]').value);
            const i = escapeHTML(item.querySelector('[data-field="institution"]').value);
            const s = escapeHTML(item.querySelector('[data-field="score"]').value);
            if(y || d || i || s) tbodyStr += `<tr><td>${y}</td><td>${d}</td><td>${i}</td><td>${s}</td></tr>`;
        });
        table.innerHTML = `<thead><tr><th>Year</th><th>Degree/Examination</th><th>Institution/Board</th><th>CGPA/Percentage</th></tr></thead><tbody>${tbodyStr}</tbody>`;
        chunks.push({ el: table, type: 'block' });
    }

    // 3. Achievements
    const achInputs = Array.from(document.querySelectorAll('.ach-input')).map(i => escapeHTML(i.value)).filter(v => v);
    if (achInputs.length > 0) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Academic Achievements';
        chunks.push({ el: title, type: 'title' });
        
        const ul = document.createElement('ul'); ul.className = 'bullet-list';
        achInputs.forEach(ach => { ul.innerHTML += `<li>${ach}</li>`; });
        chunks.push({ el: ul, type: 'block' });
    }

    // 4. Projects
    const projItems = Array.from(document.querySelectorAll('.project-item')).filter(i => i.querySelector('[data-field="title"]').value);
    if (projItems.length > 0) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Other Projects';
        chunks.push({ el: title, type: 'title' });
        
        projItems.forEach(item => {
            const block = document.createElement('div'); block.className = 'item-block';
            const pt = escapeHTML(item.querySelector('[data-field="title"]').value);
            const pd = escapeHTML(item.querySelector('[data-field="date"]').value);
            const pDesc = escapeHTML(item.querySelector('[data-field="desc"]').value);
            
            block.innerHTML = `
                <span class="item-bullet">&bull;</span>
                <div class="item-header">
                    <span class="item-title">${pt}</span>
                    <span class="item-date">${pd}</span>
                </div>
                ${pDesc ? `<p class="item-desc">${pDesc.split('\n').join('<br>')}</p>` : ''}
            `;
            chunks.push({ el: block, type: 'block' });
        });
    }

    // 5. Interests
    const intInputs = Array.from(document.querySelectorAll('.int-input')).map(i => escapeHTML(i.value)).filter(v => v);
    if (intInputs.length > 0) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Areas of Interest';
        chunks.push({ el: title, type: 'title' });
        
        const ul = document.createElement('ul'); ul.className = 'bullet-list';
        intInputs.forEach(int => { ul.innerHTML += `<li>${int}</li>`; });
        chunks.push({ el: ul, type: 'block' });
    }

    // 6. Skills
    const pS = escapeHTML(document.getElementById('inp-skills-prog').value);
    const eS = escapeHTML(document.getElementById('inp-skills-eng').value);
    const oS = escapeHTML(document.getElementById('inp-skills-other').value);
    
    if (pS || eS || oS) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Technical Skills and Certifications';
        chunks.push({ el: title, type: 'title' });
        
        const table = document.createElement('table'); table.className = 'skills-table';
        let tHTML = '';
        if(pS) tHTML += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Programming Languages</div></td><td>: ${pS}</td></tr>`;
        if(eS) tHTML += `<tr><td><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Engineering Software</div></td><td>: ${eS}</td></tr>`;
        if(oS) tHTML += `<tr><td><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Other Software</div></td><td>: ${oS}</td></tr>`;
        
        table.innerHTML = tHTML;
        chunks.push({ el: table, type: 'block' });
    }

    // 7. PORs
    const porItems = Array.from(document.querySelectorAll('.por-item')).filter(i => i.querySelector('[data-field="role"]').value);
    if (porItems.length > 0) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Positions of Responsibility';
        chunks.push({ el: title, type: 'title' });
        
        porItems.forEach(item => {
            const block = document.createElement('div'); block.className = 'item-block';
            const r = escapeHTML(item.querySelector('[data-field="role"]').value);
            const d = escapeHTML(item.querySelector('[data-field="date"]').value);
            const c = escapeHTML(item.querySelector('[data-field="desc"]').value);
            
            block.innerHTML = `
                <span class="item-bullet">&bull;</span>
                <div class="item-header">
                    <span class="item-title">${r}</span>
                    <span class="item-date">${d}</span>
                </div>
                ${c ? `<p class="item-desc">${c.split('\n').join('<br>')}</p>` : ''}
            `;
            chunks.push({ el: block, type: 'block' });
        });
    }

    // 8. Extras
    const extItems = Array.from(document.querySelectorAll('.extra-item')).filter(i => i.querySelector('[data-field="category"]').value || i.querySelector('[data-field="desc"]').value);
    if (extItems.length > 0) {
        const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Extracurricular Activities';
        chunks.push({ el: title, type: 'title' });
        
        extItems.forEach(item => {
            const block = document.createElement('div'); block.style.marginBottom = '10px';
            const c = escapeHTML(item.querySelector('[data-field="category"]').value);
            const d = escapeHTML(item.querySelector('[data-field="desc"]').value);
            
            block.innerHTML = `
                <div class="extra-category">${c}</div>
                <ul class="bullet-list" style="margin-bottom:0;">
                    <li>${d}</li>
                </ul>
            `;
            chunks.push({ el: block, type: 'block' });
        });
    }

    // Process all chunks through the paginator
    paginateChunks(chunks);
}

function createNewPage() {
    const page = document.createElement('div'); page.className = 'a4-page';
    const content = document.createElement('div'); content.className = 'page-content';
    page.appendChild(content);

    // Hardcode the footer to be injected on every single page
    const footer = document.createElement('div'); footer.className = 'resume-footer';
    footer.innerHTML = `<div class="footer-line"></div><div class="footer-text">Department of Training and Placement, NIT Trichy 620015<br>Telephone : +91-431-2501081 &nbsp;&nbsp; e-mail: tp@nitt.edu, tnp.nitt@gmail.com</div><div class="footer-line"></div>`;
    page.appendChild(footer);

    return page;
}

function paginateChunks(chunks) {
    const container = document.getElementById('resume-pages');
    container.innerHTML = ''; 

    let currentPage = createNewPage();
    container.appendChild(currentPage);
    let currentContent = currentPage.querySelector('.page-content');

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        currentContent.appendChild(chunk.el);

        // Detect if this chunk pushed the internal height past the A4 container limit
        if (currentContent.scrollHeight > currentContent.clientHeight + 2) {
            currentContent.removeChild(chunk.el); 
            
            currentPage = createNewPage();
            container.appendChild(currentPage);
            currentContent = currentPage.querySelector('.page-content');

            // Orphan Title Prevention: If the item we are moving belongs to a newly started section, pull the Section Title over too!
            if (chunk.type === 'block' && i > 0 && chunks[i-1].type === 'title') {
                const prevTitle = chunks[i-1].el;
                const prevPageContent = container.children[container.children.length - 2].querySelector('.page-content');
                if (prevPageContent.contains(prevTitle)) prevPageContent.removeChild(prevTitle);
                currentContent.appendChild(prevTitle);
            }

            currentContent.appendChild(chunk.el);
        }
    }
}

// ---- Data Import / Export ----
function downloadJSON() {
    const data = {
        name: document.getElementById('inp-name').value, degree_title: document.getElementById('inp-degree-title').value,
        gender: document.getElementById('inp-gender').value, dob: document.getElementById('inp-dob').value,
        email: document.getElementById('inp-email').value, phone: document.getElementById('inp-phone').value,
        profile_pic_path: profilePicBase64,
        skills_programming: document.getElementById('inp-skills-prog').value, skills_engineering: document.getElementById('inp-skills-eng').value, skills_other: document.getElementById('inp-skills-other').value,
        educations: [], achievements: [], projects: [], interests: [], pors: [], extras: []
    };
    document.querySelectorAll('#educationList .list-item').forEach(i => data.educations.push({ year: i.querySelector('[data-field="year"]').value, degree: i.querySelector('[data-field="degree"]').value, institution: i.querySelector('[data-field="institution"]').value, score: i.querySelector('[data-field="score"]').value }));
    document.querySelectorAll('.ach-input').forEach(i => { if(i.value) data.achievements.push(i.value); });
    document.querySelectorAll('.project-item').forEach(i => data.projects.push({ title: i.querySelector('[data-field="title"]').value, date: i.querySelector('[data-field="date"]').value, desc: i.querySelector('[data-field="desc"]').value }));
    document.querySelectorAll('.int-input').forEach(i => { if(i.value) data.interests.push(i.value); });
    document.querySelectorAll('.por-item').forEach(i => data.pors.push({ role: i.querySelector('[data-field="role"]').value, date: i.querySelector('[data-field="date"]').value, desc: i.querySelector('[data-field="desc"]').value }));
    document.querySelectorAll('.extra-item').forEach(i => data.extras.push({ category: i.querySelector('[data-field="category"]').value, desc: i.querySelector('[data-field="desc"]').value }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resume_data.json';
    a.click(); URL.revokeObjectURL(a.href);
}

document.getElementById('uploadJsonBtn').addEventListener('change', function(e) {
    if (!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = JSON.parse(evt.target.result);
        document.getElementById('inp-name').value = data.name || ''; document.getElementById('inp-degree-title').value = data.degree_title || '';
        document.getElementById('inp-gender').value = data.gender || 'Male'; document.getElementById('inp-dob').value = data.dob || '';
        document.getElementById('inp-email').value = data.email || ''; document.getElementById('inp-phone').value = data.phone || '';
        document.getElementById('inp-skills-prog').value = data.skills_programming || ''; document.getElementById('inp-skills-eng').value = data.skills_engineering || ''; document.getElementById('inp-skills-other').value = data.skills_other || '';
        profilePicBase64 = data.profile_pic_path || '';

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

        updatePreview();
    };
    reader.readAsText(e.target.files[0]);
});

// Init
updatePreview();