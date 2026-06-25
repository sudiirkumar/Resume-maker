// Data Extraction Helper
const getListVals = (sel, fields) => Array.from(document.querySelectorAll(sel)).map(el => {
    let obj = {}; fields.forEach(f => obj[f] = el.querySelector(`[data-field="${f}"]`)?.value || ''); return obj;
});

function downloadJSON() {
    const data = {
        name: document.getElementById('inp-name').value, degree_title: document.getElementById('inp-degree-title').value,
        gender: document.getElementById('inp-gender').value, dob: document.getElementById('inp-dob').value,
        email: document.getElementById('inp-email').value, phone: document.getElementById('inp-phone').value,
        profile_pic_path: AppState.profilePicBase64, logo_path: AppState.logoBase64, footer_text: document.getElementById('inp-footer').value,
        skills_programming: document.getElementById('inp-skills-prog').value, skills_engineering: document.getElementById('inp-skills-eng').value, skills_other: document.getElementById('inp-skills-other').value,
        
        custom_skills: Array.from(document.querySelectorAll('.custom-skill-item')).map(i => ({ cat: i.querySelector('.skill-cat-input').value, val: i.querySelector('.skill-val-input').value })),
        educations: getListVals('#educationList .list-item', ['year', 'degree', 'institution', 'score']),
        achievements: Array.from(document.querySelectorAll('.ach-input')).map(i => i.value).filter(v => v),
        projects: getListVals('#projectsList .project-item', ['title', 'date', 'desc']),
        interests: Array.from(document.querySelectorAll('.int-input:not(.c-bullet)')).map(i => i.value).filter(v => v),
        pors: getListVals('#porList .por-item', ['role', 'date', 'desc']),
        extras: getListVals('#extraActivitesList .extra-item', ['category', 'desc']),
        custom_sections: []
    };

    document.querySelectorAll('.custom-section').forEach(sec => {
        let prev = sec.previousElementSibling, insertAfterHeading = '';
        while(prev) { if (prev.tagName === 'SECTION' && !prev.classList.contains('custom-section')) { insertAfterHeading = prev.querySelector('h2')?.textContent || ''; break; } prev = prev.previousElementSibling; }
        
        const type = sec.dataset.type, items = [];
        if (type === 'type1') sec.querySelectorAll('.custom-item-type1').forEach(i => items.push({ title: i.querySelector('.c-title').value, date: i.querySelector('.c-date').value, desc: i.querySelector('.c-desc').value }));
        else if (type === 'type2') sec.querySelectorAll('.c-bullet').forEach(i => { if(i.value) items.push(i.value); });
        else if (type === 'type3') sec.querySelectorAll('.custom-item-type3').forEach(i => items.push({ cat: i.querySelector('.c-cat').value, desc: i.querySelector('.c-desc').value }));
        
        data.custom_sections.push({ title: sec.querySelector('.custom-sec-title').value, type, insertAfterHeading, items });
    });

    // 🚀 FUTURE FASTAPI TRIGGER: Replace the blob logic below with fetch()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resume_data.json';
    a.click(); URL.revokeObjectURL(a.href);
}

document.getElementById('uploadJsonBtn').addEventListener('change', function(e) {
    if (!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = JSON.parse(evt.target.result);
        
        // Restore primitives
        ['name','degree_title','gender','dob','email','phone'].forEach(k => { if(document.getElementById(`inp-${k.replace('_','-')}`)) document.getElementById(`inp-${k.replace('_','-')}`).value = data[k] || ''; });
        document.getElementById('inp-footer').value = data.footer_text !== undefined ? data.footer_text : `Department of Training and Placement, NIT Trichy 620015\nTelephone : +91-431-2501081    e-mail: tp@nitt.edu, tnp.nitt@gmail.com`;
        ['prog','eng','other'].forEach(k => document.getElementById(`inp-skills-${k}`).value = data[`skills_${k === 'prog' ? 'programming' : k === 'eng' ? 'engineering' : 'other'}`] || '');
        AppState.profilePicBase64 = data.profile_pic_path || ''; AppState.logoBase64 = data.logo_path || '';

        // UI Builder Helper
        const fillList = (id, arr, htmlFn) => {
            const el = document.getElementById(id); el.innerHTML = '';
            (arr || []).forEach(item => { const div = document.createElement('div'); if(['educationList','projectsList','porList','extraActivitesList','customSkillsList'].includes(id)) div.className = 'list-item' + (id==='projectsList'?' project-item':id==='porList'?' por-item':id==='extraActivitesList'?' extra-item':id==='customSkillsList'?' custom-skill-item':''); else div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;'; div.innerHTML = htmlFn(item); el.appendChild(div); });
        };
        
        fillList('customSkillsList', data.custom_skills, s => `<input type="text" class="skill-cat-input ext-input" value="${escapeHTML(s.cat||'')}"><input type="text" class="skill-val-input ext-input" value="${escapeHTML(s.val||'')}"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`);
        fillList('educationList', data.educations, e => `<input type="text" data-field="year" class="edu-input" value="${escapeHTML(e.year||'')}"><input type="text" data-field="degree" class="edu-input" value="${escapeHTML(e.degree||'')}"><input type="text" data-field="institution" class="edu-input" value="${escapeHTML(e.institution||'')}"><input type="text" data-field="score" class="edu-input" value="${escapeHTML(e.score||'')}"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`);
        fillList('achievementsList', data.achievements, a => `<input type="text" class="ach-input" value="${escapeHTML(a)}" style="flex:1;"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn" style="width:auto; padding:0 10px;">X</button>`);
        fillList('projectsList', data.projects, p => `<input type="text" data-field="title" class="proj-input" value="${escapeHTML(p.title||'')}"><input type="text" data-field="date" class="proj-input" value="${escapeHTML(p.date||'')}"><textarea data-field="desc" class="proj-input" rows="3">${escapeHTML(p.desc||'')}</textarea><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`);
        fillList('interestsList', data.interests, int => `<input type="text" class="int-input" value="${escapeHTML(int)}" style="flex:1;"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn" style="width:auto; padding:0 10px;">X</button>`);
        fillList('porList', data.pors, p => `<input type="text" data-field="role" class="por-input" value="${escapeHTML(p.role||'')}"><input type="text" data-field="date" class="por-input" value="${escapeHTML(p.date||'')}"><textarea data-field="desc" class="por-input" rows="2">${escapeHTML(p.desc||'')}</textarea><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`);
        fillList('extraActivitesList', data.extras, e => `<input type="text" data-field="category" class="ext-input" value="${escapeHTML(e.category||'')}"><input type="text" data-field="desc" class="ext-input" value="${escapeHTML(e.desc||'')}"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`);

        // Clean Custom Wrappers & Re-init
        document.querySelectorAll('.add-custom-wrapper, .custom-section').forEach(el => el.remove());
        document.querySelectorAll('#resumeForm > section').forEach(sec => { const w = document.createElement('div'); w.className = 'add-custom-wrapper'; w.style.cssText = 'margin: 15px 0 25px 0;'; w.innerHTML = getWrapperHTML(); sec.insertAdjacentElement('afterend', w); });

        (data.custom_sections || []).forEach(cs => {
            const secId = 'custom-sec-' + Date.now() + Math.random(), sec = document.createElement('section'); sec.className = 'custom-section'; sec.id = secId; sec.dataset.type = cs.type;
            sec.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;"><input type="text" class="custom-sec-title" style="font-size: 1.2rem; font-weight: bold; border: none; outline: none; color: #0f172a; width: 75%; background: transparent;" value="${escapeHTML(cs.title)}" oninput="updatePreview()"><button type="button" onclick="const w = this.closest('section').nextElementSibling; if(w && w.classList.contains('add-custom-wrapper')) w.remove(); this.closest('section').remove(); updatePreview();" style="color: #ef4444; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 0.9rem;">&times; Remove</button></div><div class="custom-items-container"></div><button type="button" class="add-btn" onclick="addCustomItem('${secId}', '${cs.type}')" style="margin-top: 10px;">+ Add Item</button>`;
            
            let target = null;
            if (cs.insertAfterHeading) { const tSec = Array.from(document.querySelectorAll('#resumeForm > section:not(.custom-section)')).find(s => s.querySelector('h2')?.textContent === cs.insertAfterHeading); if (tSec) { let n = tSec.nextElementSibling; while(n && n.tagName !== 'SECTION' && n.id !== 'generateBtn') { if (n.classList.contains('add-custom-wrapper')) target = n; n = n.nextElementSibling; } } }
            if (!target) target = document.getElementById('generateBtn');

            target.parentNode.insertBefore(sec, target);
            const w = document.createElement('div'); w.className = 'add-custom-wrapper'; w.style.cssText = 'margin: 15px 0 25px 0;'; w.innerHTML = getWrapperHTML(); sec.insertAdjacentElement('beforebegin', w);

            const c = sec.querySelector('.custom-items-container');
            cs.items.forEach(item => {
                const div = document.createElement('div');
                if (cs.type === 'type1') { div.className = 'list-item project-item custom-item-type1'; div.innerHTML = `<input type="text" class="c-title proj-input" value="${escapeHTML(item.title||'')}"><input type="text" class="c-date proj-input" value="${escapeHTML(item.date||'')}"><textarea class="c-desc proj-input" rows="3">${escapeHTML(item.desc||'')}</textarea><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`; } 
                else if (cs.type === 'type2') { div.style.cssText = 'display:flex; gap:10px; margin-bottom:8px;'; div.innerHTML = `<input type="text" class="c-bullet ach-input" value="${escapeHTML(item)}" style="flex:1;"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn" style="width:auto; padding:0 10px;">X</button>`; } 
                else if (cs.type === 'type3') { div.className = 'list-item extra-item custom-item-type3'; div.innerHTML = `<input type="text" class="c-cat ext-input" value="${escapeHTML(item.cat||'')}"><input type="text" class="c-desc ext-input" value="${escapeHTML(item.desc||'')}"><button type="button" onclick="this.parentElement.remove(); updatePreview();" class="remove-btn"><img src="./close.png" height=20></button>`; }
                c.appendChild(div);
            });
        });
        updatePreview();
    };
    reader.readAsText(e.target.files[0]);
});

// Run Initial Render
updatePreview();