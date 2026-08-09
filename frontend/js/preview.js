function createNewPage() {
    const page = document.createElement('div'); page.className = 'a4-page';
    const content = document.createElement('div'); content.className = 'page-content'; page.appendChild(content);

    const fInput = document.getElementById('inp-footer');
    let fText = fInput ? escapeHTML(fInput.value).replace(/\n/g, '<br>') : 'Department of Training and Placement, NIT Trichy 620015<br>Telephone : +91-431-2501081 &nbsp;&nbsp; e-mail: tp@nitt.edu, tnp.nitt@gmail.com';
    const footer = document.createElement('div'); footer.className = 'resume-footer';
    footer.innerHTML = `<div class="footer-line"></div><div class="footer-text">${fText}</div><div class="footer-line"></div>`;
    page.appendChild(footer); return page;
}

function paginateChunks(chunks) {
    const container = document.getElementById('resume-pages'); container.innerHTML = ''; 
    let currPage = createNewPage(), currContent = currPage.querySelector('.page-content');
    container.appendChild(currPage);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]; currContent.appendChild(chunk.el);
        if (currContent.scrollHeight > currContent.clientHeight + 2) {
            currContent.removeChild(chunk.el); 
            currPage = createNewPage(); container.appendChild(currPage);
            currContent = currPage.querySelector('.page-content');
            if (chunk.type === 'block' && i > 0 && chunks[i-1].type === 'title') {
                const prevTitle = chunks[i-1].el, prevContent = container.children[container.children.length - 2].querySelector('.page-content');
                if (prevContent.contains(prevTitle)) prevContent.removeChild(prevTitle);
                currContent.appendChild(prevTitle);
            }
            currContent.appendChild(chunk.el);
        }
    }
}

function updatePreview() {
    const chunks = []; 
    const headerChunk = document.createElement('div'); headerChunk.className = 'resume-header';
    const nameText = document.getElementById('inp-name').value || 'YOUR NAME';
    const nSize = nameText.length > 22 ? Math.max(11, 20 * (22 / nameText.length)) : 20; 

    headerChunk.innerHTML = `<div class="school-logo">${AppState.logoBase64 ? `<img src="${AppState.logoBase64}" alt="Logo">` : '<div style="color:#ccc; font-size:10px; text-align:center;">Logo</div>'}</div><div class="header-center"><h1 class="header-name" style="font-size: ${nSize}pt;">${escapeHTML(nameText)}</h1><p class="header-info"><span>${escapeHTML(document.getElementById('inp-degree-title').value) || 'Master of Computer Applications'}</span><br>Gender: <span>${escapeHTML(document.getElementById('inp-gender').value) || ''}</span><br>Date of Birth: <span>${escapeHTML(document.getElementById('inp-dob').value) || 'DD/MM/YYYY'}</span><br>E-mail : <span>${escapeHTML(document.getElementById('inp-email').value) || 'abc@example.com'}</span><br>Contact : <span>${escapeHTML(document.getElementById('inp-phone').value) || '+91-XYZ-ABCDEFG'}</span></p></div><div class="profile-pic-container"><img src="${AppState.profilePicBase64}" style="display: ${AppState.profilePicBase64 ? 'block' : 'none'}; width: 100%; height: 100%; object-fit: cover;"></div>`;
    chunks.push({ el: headerChunk, type: 'header' });
    const horizontalRule = document.createElement('div');
    horizontalRule.className = 'horizontal-rule';
    horizontalRule.innerHTML = '<hr width="100%">';
    chunks.push({ el: horizontalRule, type: 'block' });
    document.querySelectorAll('#resumeForm > section').forEach(sec => {
        if (sec.querySelector('#inp-name')) return; 

        if (sec.querySelector('#educationList')) {
            const items = Array.from(sec.querySelectorAll('#educationList .list-item')).filter(i => i.dataset.hidden !== 'true');
            if (items.some(i => i.querySelector('[data-field="year"]').value)) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Educational Qualification'; chunks.push({ el: t, type: 'title' });
                const table = document.createElement('table'); table.className = 'edu-table'; let tbody = '';
                items.forEach(i => { tbody += `<tr><td>${escapeHTML(i.querySelector('[data-field="year"]').value)}</td><td>${escapeHTML(i.querySelector('[data-field="degree"]').value)}</td><td>${escapeHTML(i.querySelector('[data-field="institution"]').value)}</td><td>${escapeHTML(i.querySelector('[data-field="score"]').value)}</td></tr>`; });
                table.innerHTML = `<thead><tr><th>Year</th><th>Degree/Examination</th><th>Institution/Board</th><th>CGPA/Percentage</th></tr></thead><tbody>${tbody}</tbody>`; chunks.push({ el: table, type: 'block' });
            }
        } 
        else if (sec.querySelector('#achievementsList')) {
            const achs = Array.from(sec.querySelectorAll('#achievementsList .list-item:not([data-hidden="true"]) .ach-input')).map(i => escapeHTML(i.value)).filter(v => v);
            if (achs.length) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Academic Achievements'; chunks.push({ el: t, type: 'title' });
                const ul = document.createElement('ul'); ul.className = 'bullet-list'; achs.forEach(a => { ul.innerHTML += `<li>${a}</li>`; }); chunks.push({ el: ul, type: 'block' });
            }
        }
        else if (sec.querySelector('#projectsList')) {
            const projs = Array.from(sec.querySelectorAll('#projectsList .project-item')).filter(i => i.dataset.hidden !== 'true' && i.querySelector('[data-field="title"]').value);
            if (projs.length) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Other Projects'; chunks.push({ el: t, type: 'title' });
                projs.forEach(i => {
                    const b = document.createElement('div'); b.className = 'item-block'; const pD = escapeHTML(i.querySelector('[data-field="desc"]').value);
                    b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${escapeHTML(i.querySelector('[data-field="title"]').value)}</span><span class="item-date">${escapeHTML(i.querySelector('[data-field="date"]').value)}</span></div>${pD ? `<p class="item-desc">${pD.split('\n').join('<br>')}</p>` : ''}`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        else if (sec.querySelector('#interestsList')) {
            const ints = Array.from(sec.querySelectorAll('#interestsList .list-item:not([data-hidden="true"]) .int-input')).map(i => escapeHTML(i.value)).filter(v => v);
            if (ints.length) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Areas of Interest'; chunks.push({ el: t, type: 'title' });
                const ul = document.createElement('ul'); ul.className = 'bullet-list'; ints.forEach(i => { ul.innerHTML += `<li>${i}</li>`; }); chunks.push({ el: ul, type: 'block' });
            }
        }
        else if (sec.querySelector('#inp-skills-prog')) {
            const pS = escapeHTML(sec.querySelector('#inp-skills-prog').value), eS = escapeHTML(sec.querySelector('#inp-skills-eng').value), oS = escapeHTML(sec.querySelector('#inp-skills-other').value);
            const cItems = Array.from(sec.querySelectorAll('.custom-skill-item')).filter(i => i.dataset.hidden !== 'true' && (i.querySelector('.skill-cat-input').value || i.querySelector('.skill-val-input').value));
            if (pS || eS || oS || cItems.length) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Technical Skills and Certifications'; chunks.push({ el: t, type: 'title' });
                const table = document.createElement('table'); table.className = 'skills-table'; let html = '';
                if(pS) html += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Programming Languages</div></td><td>: ${pS}</td></tr>`;
                if(eS) html += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Engineering Software</div></td><td>: ${eS}</td></tr>`;
                if(oS) html += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> Other Software</div></td><td>: ${oS}</td></tr>`;
                cItems.forEach(i => html += `<tr><td style="width:230px;"><div class="skill-label-wrapper"><span class="skill-bullet">&bull;</span> ${escapeHTML(i.querySelector('.skill-cat-input').value)}</div></td><td>: ${escapeHTML(i.querySelector('.skill-val-input').value)}</td></tr>`);
                table.innerHTML = html; chunks.push({ el: table, type: 'block' });
            }
        }
        else if (sec.querySelector('#porList')) {
            const pors = Array.from(sec.querySelectorAll('#porList .por-item')).filter(i => i.dataset.hidden !== 'true' && i.querySelector('[data-field="role"]').value);
            if (pors.length) {
                const t = document.createElement('div'); t.className = 'section-title'; t.textContent = 'Positions of Responsibility'; chunks.push({ el: t, type: 'title' });
                pors.forEach(i => {
                    const b = document.createElement('div'); b.className = 'item-block'; const pD = escapeHTML(i.querySelector('[data-field="desc"]').value);
                    b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${escapeHTML(i.querySelector('[data-field="role"]').value)}</span><span class="item-date">${escapeHTML(i.querySelector('[data-field="date"]').value)}</span></div>${pD ? `<p class="item-desc">${pD.split('\n').join('<br>')}</p>` : ''}`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        else if (sec.querySelector('#extraActivitesList')) {
            // Updated to check if the category OR any of the description lines have text
            const exts = Array.from(sec.querySelectorAll('#extraActivitesList .extra-item')).filter(i => {
                if (i.dataset.hidden === 'true') return false;
                const hasCat = i.querySelector('[data-field="category"]').value;
                const hasDesc = Array.from(i.querySelectorAll('[data-field="desc"]')).some(inp => inp.value.trim() !== '');
                return hasCat || hasDesc;
            });
            
            if (exts.length > 0) {
                const title = document.createElement('div'); title.className = 'section-title'; title.textContent = 'Extracurricular Activities'; chunks.push({ el: title, type: 'title' });
                exts.forEach(i => {
                    const b = document.createElement('div'); b.style.marginBottom = '10px';
                    const c = escapeHTML(i.querySelector('[data-field="category"]').value);
                    
                    // Grab ALL description lines, ignore empty ones, and turn them into list items
                    const descHTML = Array.from(i.querySelectorAll('[data-field="desc"]'))
                        .map(inp => escapeHTML(inp.value.trim()))
                        .filter(val => val !== '')
                        .map(val => `<li>${val}</li>`)
                        .join('');

                    b.innerHTML = `<div class="extra-category">${c}</div><ul class="bullet-list" style="margin-bottom:0;">${descHTML}</ul>`;
                    chunks.push({ el: b, type: 'block' });
                });
            }
        }
        else if (sec.classList.contains('custom-section')) {
            const t = document.createElement('div'); t.className = 'section-title'; t.textContent = escapeHTML(sec.querySelector('.custom-sec-title').value) || 'Custom Section';
            const type = sec.dataset.type;
            
            if (type === 'type1') {
                const items = Array.from(sec.querySelectorAll('.custom-item-type1')).filter(i => i.dataset.hidden !== 'true');
                if (items.length) {
                    chunks.push({ el: t, type: 'title' });
                    items.forEach(i => {
                        const b = document.createElement('div'); b.className = 'item-block'; const pD = escapeHTML(i.querySelector('.c-desc').value);
                        b.innerHTML = `<span class="item-bullet">&bull;</span><div class="item-header"><span class="item-title">${escapeHTML(i.querySelector('.c-title').value)}</span><span class="item-date">${escapeHTML(i.querySelector('.c-date').value)}</span></div>${pD ? `<p class="item-desc">${pD.split('\n').join('<br>')}</p>` : ''}`;
                        chunks.push({ el: b, type: 'block' });
                    });
                }
            } else if (type === 'type2') {
                const inputs = Array.from(sec.querySelectorAll('.list-item:not([data-hidden="true"]) .c-bullet')).filter(i => i.value);
                if (inputs.length) {
                    chunks.push({ el: t, type: 'title' });
                    const ul = document.createElement('ul'); ul.className = 'bullet-list'; inputs.forEach(i => ul.innerHTML += `<li>${escapeHTML(i.value)}</li>`);
                    chunks.push({ el: ul, type: 'block' });
                }
            } else if (type === 'type3') {
                const items = Array.from(sec.querySelectorAll('.custom-item-type3')).filter(i => i.dataset.hidden !== 'true');
                if (items.length) {
                    chunks.push({ el: t, type: 'title' });
                    items.forEach(i => {
                        const b = document.createElement('div'); b.style.marginBottom = '10px';
                        b.innerHTML = `<div class="extra-category">${escapeHTML(i.querySelector('.c-cat').value)}</div><ul class="bullet-list" style="margin-bottom:0;"><li>${escapeHTML(i.querySelector('.c-desc').value)}</li></ul>`;
                        chunks.push({ el: b, type: 'block' });
                    });
                }
            }
        }
    });
    paginateChunks(chunks);

    if (window.ResumeWorkflow && !window.ResumeWorkflow.applying) {
        window.ResumeWorkflow.scheduleSnapshot();
    }
}