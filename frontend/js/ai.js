const aiRewriteState = {
    activeField: null,
    activeDescriptor: null,
    backendOnline: Boolean(window.ResumeBackendState?.online),
    aiReady: Boolean(window.ResumeBackendState?.aiRewriteReady),
    popoverOpen: false,
    resumePopoverOpen: false,
    loading: false,
    currentRequestId: 0,
};

const aiFloatingButton = document.getElementById('aiRewriteFab');
const aiPopover = document.getElementById('aiRewritePopover');
const resumeAiFab = document.getElementById('resumeAiFab');
const resumeAiPopover = document.getElementById('resumeAiPopover');
const resumeAiReviewBtn = document.getElementById('resumeAiReviewBtn');
const resumeAiKeywordBtn = document.getElementById('resumeAiKeywordBtn');
const resumeAiImpactBtn = document.getElementById('resumeAiImpactBtn');
const resumeAiConciseBtn = document.getElementById('resumeAiConciseBtn');
const resumeAiModal = document.getElementById('resumeAiModal');
const resumeAiModalTitle = document.getElementById('resumeAiModalTitle');
const resumeAiModalText = document.getElementById('resumeAiModalText');
const resumeAiCopyBtn = document.getElementById('resumeAiCopyBtn');
const resumeAiCloseBtn = document.getElementById('resumeAiCloseBtn');
const aiSummaryPanel = document.getElementById('aiSummaryPanel');
const aiSummaryInput = document.getElementById('aiSummaryWordCount');
const aiSummaryGenerateBtn = document.getElementById('aiSummaryGenerateBtn');
const aiBackBtn = document.getElementById('aiBackBtn');
const aiLoadingOverlay = document.getElementById('aiLoadingOverlay');
const aiLoadingText = document.getElementById('aiLoadingText');
const aiCompareModal = document.getElementById('aiCompareModal');
const aiCompareTitle = document.getElementById('aiCompareTitle');
const aiCompareBefore = document.getElementById('aiCompareBefore');
const aiCompareAfter = document.getElementById('aiCompareAfter');
const aiAcceptBtn = document.getElementById('aiAcceptBtn');
const aiRejectBtn = document.getElementById('aiRejectBtn');
const aiCloseCompareBtn = document.getElementById('aiCloseCompareBtn');

const AI_BUTTON_WIDTH = 36;
const AI_BUTTON_HEIGHT = 36;
const AI_OFFSET = 10;
const AI_API_URL = `${API_BASE_URL}/ai/rewrite`;
const AI_REVIEW_API_URL = `${API_BASE_URL}/ai/review-resume`;
const AI_DEFAULT_SUMMARY_WORDS = 40;

const RESUME_REVIEW_LABELS = {
    ats_review: 'Resume Review',
    keyword_scan: 'ATS Keyword Scan',
    impact_review: 'Impact & Metrics Check',
    conciseness_check: 'Conciseness Check',
};

const RESUME_REVIEW_HINTS = {
    ats_review: 'Overall ATS structure, readability, and recruiter fit',
    keyword_scan: 'Missing keywords and keyword placement opportunities',
    impact_review: 'Action verbs, measurable results, and stronger bullet phrasing',
    conciseness_check: 'Overlong sections, repetition, and wording that can be tightened',
};

let aiPendingResult = null;

if (resumeAiFab) {
    resumeAiFab.disabled = !aiRewriteState.aiReady;
}

function readBackendState(detail) {
    aiRewriteState.backendOnline = Boolean(detail?.online);
    aiRewriteState.aiReady = Boolean(detail?.aiRewriteReady);
    if (resumeAiFab) {
        resumeAiFab.disabled = !aiRewriteState.aiReady;
        resumeAiFab.title = aiRewriteState.aiReady ? 'Resume AI tools' : 'Resume AI unavailable right now';
    }
    if (!aiRewriteState.backendOnline || !aiRewriteState.aiReady) {
        hideAiControls();
    } else {
        refreshAiControls();
    }
}

function isAiEligibleField(field) {
    if (!field || !aiRewriteState.backendOnline || !aiRewriteState.aiReady) {
        return false;
    }

    return Boolean(describeAiField(field));
}

function getSectionTitle(section) {
    if (!section) return '';
    const heading = section.querySelector('h2, .custom-sec-title');
    return heading ? (heading.value || heading.textContent || '').trim() : '';
}

function getItemIndex(field, selector) {
    const items = Array.from(document.querySelectorAll(selector));
    return items.findIndex((item) => item.contains(field));
}

function getTextValue(element, selector) {
    return element?.querySelector(selector)?.value?.trim() || '';
}

function buildResumeReviewContext(reviewType) {
    const data = getResumeData();
    const context = {
        review_type: reviewType,
        degree_title: data.degree_title || '',
        skills: {
            programming: data.skills_programming || '',
            engineering: data.skills_engineering || '',
            other: data.skills_other || '',
            custom: data.custom_skills || [],
        },
        sections: {
            achievements: data.achievements || [],
            projects: data.projects || [],
            interests: data.interests || [],
            positions_of_responsibility: data.pors || [],
            extracurricular: data.extras || [],
            custom_sections: data.custom_sections || [],
        },
        resume_stats: {
            achievements_count: (data.achievements || []).length,
            projects_count: (data.projects || []).length,
            interests_count: (data.interests || []).length,
            por_count: (data.pors || []).length,
            extracurricular_count: (data.extras || []).length,
            custom_section_count: (data.custom_sections || []).length,
        },
        excluded_from_context: ['profile_pic_path', 'logo_path', 'name', 'gender', 'dob', 'email', 'phone', 'educations', 'footer_text'],
    };

    return context;
}

function describeAiField(field) {
    if (!field || !field.closest) return null;

    if (field.classList.contains('ach-input')) {
        const listItem = field.closest('.list-item');
        const section = field.closest('section');
        const allItems = Array.from(document.querySelectorAll('#achievementsList .ach-input')).map((input) => input.value.trim()).filter(Boolean);
        const targetIndex = Array.from(document.querySelectorAll('#achievementsList .ach-input')).indexOf(field);

        return {
            field,
            fieldLabel: 'Academic Achievements',
            targetLabel: 'Achievement text',
            sectionType: 'achievements',
            sectionTitle: getSectionTitle(section),
            sectionContext: {
                section_type: 'academic_achievements',
                section_title: getSectionTitle(section),
                items: allItems,
                target_index: targetIndex,
                target_item: field.value.trim(),
            },
            getCurrentText: () => field.value,
            applyText: (nextText) => { field.value = nextText; },
        };
    }

    const projectDesc = field.closest('#projectsList') && field.dataset.field === 'desc';
    if (projectDesc) {
        const item = field.closest('.project-item');
        const section = field.closest('section');
        const items = Array.from(document.querySelectorAll('#projectsList .project-item')).map((row) => ({
            title: getTextValue(row, '[data-field="title"]'),
            date: getTextValue(row, '[data-field="date"]'),
            desc: getTextValue(row, '[data-field="desc"]'),
        }));
        const targetIndex = getItemIndex(field, '#projectsList .project-item');

        return {
            field,
            fieldLabel: 'Project Description',
            targetLabel: 'Description',
            sectionType: 'projects',
            sectionTitle: getSectionTitle(section),
            sectionContext: {
                section_type: 'other_projects',
                section_title: getSectionTitle(section),
                items,
                target_index: targetIndex,
                target_item: {
                    title: getTextValue(item, '[data-field="title"]'),
                    date: getTextValue(item, '[data-field="date"]'),
                    desc: field.value.trim(),
                },
            },
            getCurrentText: () => field.value,
            applyText: (nextText) => { field.value = nextText; },
        };
    }

    const porDesc = field.closest('#porList') && field.dataset.field === 'desc';
    if (porDesc) {
        const item = field.closest('.por-item');
        const section = field.closest('section');
        const items = Array.from(document.querySelectorAll('#porList .por-item')).map((row) => ({
            role: getTextValue(row, '[data-field="role"]'),
            date: getTextValue(row, '[data-field="date"]'),
            desc: getTextValue(row, '[data-field="desc"]'),
        }));
        const targetIndex = getItemIndex(field, '#porList .por-item');

        return {
            field,
            fieldLabel: 'POR Description',
            targetLabel: 'Description',
            sectionType: 'pors',
            sectionTitle: getSectionTitle(section),
            sectionContext: {
                section_type: 'positions_of_responsibility',
                section_title: getSectionTitle(section),
                items,
                target_index: targetIndex,
                target_item: {
                    role: getTextValue(item, '[data-field="role"]'),
                    date: getTextValue(item, '[data-field="date"]'),
                    desc: field.value.trim(),
                },
            },
            getCurrentText: () => field.value,
            applyText: (nextText) => { field.value = nextText; },
        };
    }

    const extraDesc = field.closest('#extraActivitesList') && field.dataset.field === 'desc';
    if (extraDesc) {
        const item = field.closest('.extra-item');
        const section = field.closest('section');
        const descFields = Array.from(item.querySelectorAll('[data-field="desc"]'));
        const targetIndex = descFields.indexOf(field);
        const allItems = Array.from(document.querySelectorAll('#extraActivitesList .extra-item')).map((row) => ({
            category: getTextValue(row, '[data-field="category"]'),
            desc: Array.from(row.querySelectorAll('[data-field="desc"]')).map((input) => input.value.trim()).filter(Boolean),
        }));

        return {
            field,
            fieldLabel: 'Extracurricular Description',
            targetLabel: 'Description line',
            sectionType: 'extracurricular',
            sectionTitle: getSectionTitle(section),
            sectionContext: {
                section_type: 'extracurricular_activities',
                section_title: getSectionTitle(section),
                items: allItems,
                target_index: getItemIndex(item, '#extraActivitesList .extra-item'),
                target_line_index: targetIndex,
                target_item: {
                    category: getTextValue(item, '[data-field="category"]'),
                    desc_lines: Array.from(item.querySelectorAll('[data-field="desc"]')).map((input) => input.value.trim()).filter(Boolean),
                    target_line: field.value.trim(),
                },
            },
            getCurrentText: () => field.value,
            applyText: (nextText) => { field.value = nextText; },
        };
    }

    const customSection = field.closest('.custom-section');
    if (customSection) {
        const sectionType = customSection.dataset.type;
        const sectionTitle = getSectionTitle(customSection);

        if (sectionType === 'type1' && field.classList.contains('c-desc')) {
            const item = field.closest('.custom-item-type1');
            const items = Array.from(customSection.querySelectorAll('.custom-item-type1')).map((row) => ({
                title: getTextValue(row, '.c-title'),
                date: getTextValue(row, '.c-date'),
                desc: getTextValue(row, '.c-desc'),
            }));
            const targetIndex = getItemIndex(field, '.custom-item-type1');

            return {
                field,
                fieldLabel: 'Custom Section Description',
                targetLabel: 'Description',
                sectionType,
                sectionTitle,
                sectionContext: {
                    section_type: 'custom_section_type_1',
                    section_title: sectionTitle,
                    custom_section_type: sectionType,
                    items,
                    target_index: targetIndex,
                    target_item: {
                        title: getTextValue(item, '.c-title'),
                        date: getTextValue(item, '.c-date'),
                        desc: field.value.trim(),
                    },
                },
                getCurrentText: () => field.value,
                applyText: (nextText) => { field.value = nextText; },
            };
        }

        if (sectionType === 'type2' && field.classList.contains('c-bullet')) {
            const items = Array.from(customSection.querySelectorAll('.c-bullet')).map((input) => input.value.trim()).filter(Boolean);
            const targetIndex = Array.from(customSection.querySelectorAll('.c-bullet')).indexOf(field);

            return {
                field,
                fieldLabel: 'Custom Section Bullet',
                targetLabel: 'Bullet text',
                sectionType,
                sectionTitle,
                sectionContext: {
                    section_type: 'custom_section_type_2',
                    section_title: sectionTitle,
                    custom_section_type: sectionType,
                    items,
                    target_index: targetIndex,
                    target_item: field.value.trim(),
                },
                getCurrentText: () => field.value,
                applyText: (nextText) => { field.value = nextText; },
            };
        }

        if (sectionType === 'type3' && field.classList.contains('c-desc')) {
            const item = field.closest('.custom-item-type3');
            const items = Array.from(customSection.querySelectorAll('.custom-item-type3')).map((row) => ({
                cat: getTextValue(row, '.c-cat'),
                desc: getTextValue(row, '.c-desc'),
            }));
            const targetIndex = getItemIndex(field, '.custom-item-type3');

            return {
                field,
                fieldLabel: 'Custom Section Description',
                targetLabel: 'Description',
                sectionType,
                sectionTitle,
                sectionContext: {
                    section_type: 'custom_section_type_3',
                    section_title: sectionTitle,
                    custom_section_type: sectionType,
                    items,
                    target_index: targetIndex,
                    target_item: {
                        cat: getTextValue(item, '.c-cat'),
                        desc: field.value.trim(),
                    },
                },
                getCurrentText: () => field.value,
                applyText: (nextText) => { field.value = nextText; },
            };
        }
    }

    return null;
}

function hideAiControls() {
    aiRewriteState.activeField = null;
    aiRewriteState.activeDescriptor = null;
    aiRewriteState.popoverOpen = false;

    if (aiFloatingButton) aiFloatingButton.classList.add('hidden');
    if (aiPopover) {
        aiPopover.classList.add('hidden');
        aiPopover.dataset.mode = 'actions';
    }
}

function openResumeAiPopover() {
    if (!resumeAiPopover || !resumeAiFab || !aiRewriteState.aiReady) return;

    if (aiRewriteState.popoverOpen) {
        closeAiPopover();
    }

    resumeAiPopover.classList.remove('hidden');
    aiRewriteState.resumePopoverOpen = true;
}

function closeResumeAiPopover() {
    if (!resumeAiPopover) return;

    resumeAiPopover.classList.add('hidden');
    aiRewriteState.resumePopoverOpen = false;
}

function toggleResumeAiPopover() {
    if (!resumeAiPopover || !resumeAiFab || resumeAiFab.disabled) return;

    if (aiRewriteState.resumePopoverOpen) {
        closeResumeAiPopover();
        return;
    }

    openResumeAiPopover();
}

function refreshAiControls() {
    if (!aiRewriteState.activeField || !isAiEligibleField(aiRewriteState.activeField)) {
        hideAiControls();
        return;
    }

    const rect = aiRewriteState.activeField.getBoundingClientRect();
    if (!aiFloatingButton) return;

    const buttonLeft = Math.min(
        Math.max(rect.left, 12),
        Math.max(12, window.innerWidth - AI_BUTTON_WIDTH - 12),
    );
    let buttonTop = rect.top - AI_BUTTON_HEIGHT - AI_OFFSET;
    if (buttonTop < 12) {
        buttonTop = rect.bottom + AI_OFFSET;
    }

    aiFloatingButton.style.left = `${buttonLeft}px`;
    aiFloatingButton.style.top = `${buttonTop}px`;
    aiFloatingButton.classList.remove('hidden');

    if (aiPopover && !aiPopover.classList.contains('hidden')) {
        positionPopover();
    }
}

function positionPopover() {
    if (!aiPopover || !aiFloatingButton) return;

    const buttonRect = aiFloatingButton.getBoundingClientRect();
    const popoverRect = aiPopover.getBoundingClientRect();
    let top = buttonRect.bottom + 10;
    let left = buttonRect.left;

    if (left + popoverRect.width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popoverRect.width - 12);
    }
    if (top + popoverRect.height > window.innerHeight - 12) {
        top = Math.max(12, buttonRect.top - popoverRect.height - 10);
    }

    aiPopover.style.left = `${left}px`;
    aiPopover.style.top = `${top}px`;
}

function openAiPopover(mode = 'actions') {
    if (!aiPopover) return;
    aiPopover.dataset.mode = mode;
    if (aiSummaryPanel) {
        aiSummaryPanel.classList.toggle('hidden', mode !== 'summary');
    }
    if (aiSummaryGenerateBtn) {
        aiSummaryGenerateBtn.textContent = mode === 'summary' ? 'Generate Summary' : 'Generate';
    }
    aiPopover.classList.remove('hidden');
    aiRewriteState.popoverOpen = true;
    if (mode === 'summary' && aiSummaryInput) {
        aiSummaryInput.focus();
        aiSummaryInput.select?.();
    }
    positionPopover();
}

function closeAiPopover() {
    if (!aiPopover) return;
    aiPopover.classList.add('hidden');
    aiPopover.dataset.mode = 'actions';
    if (aiSummaryPanel) {
        aiSummaryPanel.classList.add('hidden');
    }
    aiRewriteState.popoverOpen = false;
}

function setLoadingState(isLoading, message = 'AI is rewriting this field...') {
    aiRewriteState.loading = isLoading;
    if (!aiLoadingOverlay) return;
    aiLoadingOverlay.classList.toggle('hidden', !isLoading);
    if (aiLoadingText) aiLoadingText.textContent = message;
}

function openCompareModal(result) {
    aiPendingResult = result;
    if (aiCompareTitle) aiCompareTitle.textContent = `${result.actionLabel} preview`;
    if (aiCompareBefore) aiCompareBefore.textContent = result.beforeText || '(empty)';
    if (aiCompareAfter) aiCompareAfter.textContent = result.afterText || '(empty)';
    if (aiCompareModal) aiCompareModal.classList.remove('hidden');
}

function openResumeReviewModal(result) {
    if (resumeAiModalTitle) resumeAiModalTitle.textContent = result.title;
    if (resumeAiModalText) resumeAiModalText.textContent = result.reviewText || '(No review text returned)';
    if (resumeAiModal) resumeAiModal.classList.remove('hidden');
}

function closeResumeReviewModal() {
    if (resumeAiModal) resumeAiModal.classList.add('hidden');
}

function closeCompareModal() {
    if (aiCompareModal) aiCompareModal.classList.add('hidden');
    aiPendingResult = null;
}

function applyAcceptedRewrite() {
    if (!aiPendingResult) return;

    const { descriptor, afterText } = aiPendingResult;
    descriptor.applyText(afterText);
    descriptor.field.dispatchEvent(new Event('input', { bubbles: true }));
    updatePreview();
    closeCompareModal();
}

function createRequestPayload(action, descriptor, summaryWordCount = null) {
    return {
        action,
        field_label: descriptor.fieldLabel,
        target_text: descriptor.getCurrentText(),
        section_context: descriptor.sectionContext,
        summary_word_count: summaryWordCount,
    };
}

async function requestRewrite(action, summaryWordCount = null) {
    if (!aiRewriteState.activeDescriptor) return;

    const descriptor = aiRewriteState.activeDescriptor;
    const beforeText = descriptor.getCurrentText();
    const payload = createRequestPayload(action, descriptor, summaryWordCount);
    const requestId = ++aiRewriteState.currentRequestId;

    closeAiPopover();
    setLoadingState(true);

    try {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'AI rewrite failed.');
        }

        const data = await response.json();
        if (requestId !== aiRewriteState.currentRequestId) {
            return;
        }

        setLoadingState(false);
        openCompareModal({
            descriptor,
            action,
            actionLabel: action === 'proofread' ? 'Proofread' : action === 'professional' ? 'Professional rewrite' : 'Summary',
            beforeText,
            afterText: data.rewritten_text,
        });
    } catch (error) {
        setLoadingState(false);
        alert(error.message || 'AI rewrite failed.');
    }
}

async function requestResumeReview(reviewType) {
    if (!aiRewriteState.aiReady) return;

    const reviewContext = buildResumeReviewContext(reviewType);
    closeResumeAiPopover();
    setLoadingState(true, 'Analyzing the full resume for ATS improvements...');

    try {
        const response = await fetch(AI_REVIEW_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                review_type: reviewType,
                resume_context: reviewContext,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Resume review failed.');
        }

        const data = await response.json();
        setLoadingState(false);

        openResumeReviewModal({
            title: RESUME_REVIEW_LABELS[reviewType] || 'Resume Review',
            reviewText: data.review_text,
        });
    } catch (error) {
        setLoadingState(false);
        alert(error.message || 'Resume review failed.');
    }
}

function openSummaryMode() {
    if (!aiPopover) return;
    const summaryIsOpen = aiPopover.dataset.mode === 'summary' && !aiSummaryPanel?.classList.contains('hidden');

    if (summaryIsOpen) {
        const rawValue = aiSummaryInput?.value?.trim() || '';
        const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : AI_DEFAULT_SUMMARY_WORDS;
        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            alert('Enter a valid approximate word count for the summary.');
            return;
        }
        requestRewrite('summary', parsedValue);
        return;
    }

    aiSummaryInput.value = aiSummaryInput.value || `${AI_DEFAULT_SUMMARY_WORDS}`;
    openAiPopover('summary');
}

function handleAiFieldFocus(target) {
    const descriptor = describeAiField(target);
    aiRewriteState.activeField = descriptor ? target : null;
    aiRewriteState.activeDescriptor = descriptor;

    if (!descriptor) {
        hideAiControls();
        return;
    }

    refreshAiControls();
}

function refreshAiForActiveElement() {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    if (isInsideAiUi(activeElement)) {
        return;
    }

    if (activeElement.matches?.('input, textarea')) {
        handleAiFieldFocus(activeElement);
    }
}

function isInsideAiUi(target) {
    return Boolean(
        target && (
            target === aiFloatingButton ||
            aiFloatingButton?.contains(target) ||
            target === resumeAiFab ||
            resumeAiFab?.contains(target) ||
            target === resumeAiPopover ||
            resumeAiPopover?.contains(target) ||
            target === resumeAiModal ||
            resumeAiModal?.contains(target) ||
            target === aiPopover ||
            aiPopover?.contains(target) ||
            target === aiLoadingOverlay ||
            aiLoadingOverlay?.contains(target) ||
            target === aiCompareModal ||
            aiCompareModal?.contains(target)
        )
    );
}

document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (isInsideAiUi(target)) {
        return;
    }
    handleAiFieldFocus(target);
});

document.addEventListener('selectionchange', () => {
    refreshAiForActiveElement();
});

document.addEventListener('mouseup', () => {
    refreshAiForActiveElement();
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        refreshAiForActiveElement();
    }
});

document.addEventListener('click', (event) => {
    if (isAiEligibleField(event.target)) {
        return;
    }

    if (!isInsideAiUi(event.target) && event.target !== aiFloatingButton) {
        if (aiRewriteState.popoverOpen) {
            closeAiPopover();
        } else {
            hideAiControls();
        }
    }
});

window.addEventListener('resize', refreshAiControls);
const aiLeftPanel = document.getElementById('leftPanel');
if (aiLeftPanel) {
    aiLeftPanel.addEventListener('scroll', refreshAiControls, { passive: true });
}

window.addEventListener('resume-backend-status', (event) => {
    readBackendState(event.detail);
});

if (window.ResumeBackendState) {
    readBackendState(window.ResumeBackendState);
}

if (resumeAiFab) {
    resumeAiFab.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleResumeAiPopover();
    });
}

if (resumeAiPopover) {
    resumeAiPopover.addEventListener('click', (event) => event.stopPropagation());
}

if (aiFloatingButton) {
    aiFloatingButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!aiRewriteState.activeDescriptor) return;
        openAiPopover('actions');
    });
}

if (aiPopover) {
    aiPopover.addEventListener('click', (event) => event.stopPropagation());
}

const aiProofreadBtn = document.getElementById('aiProofreadBtn');
const aiProfessionalBtn = document.getElementById('aiProfessionalBtn');
const aiSummaryBtn = document.getElementById('aiSummaryBtn');

if (aiProofreadBtn) {
    aiProofreadBtn.addEventListener('click', () => requestRewrite('proofread'));
}

if (aiProfessionalBtn) {
    aiProfessionalBtn.addEventListener('click', () => requestRewrite('professional'));
}

if (aiSummaryBtn) {
    aiSummaryBtn.addEventListener('click', () => openSummaryMode());
}

if (aiBackBtn) {
    aiBackBtn.addEventListener('click', () => openAiPopover('actions'));
}

if (aiSummaryGenerateBtn) {
    aiSummaryGenerateBtn.addEventListener('click', () => {
        const rawValue = aiSummaryInput?.value?.trim() || '';
        const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : AI_DEFAULT_SUMMARY_WORDS;
        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            alert('Enter a valid approximate word count for the summary.');
            return;
        }
        requestRewrite('summary', parsedValue);
    });
}

if (aiSummaryInput) {
    aiSummaryInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const rawValue = aiSummaryInput.value.trim() || '';
            const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : AI_DEFAULT_SUMMARY_WORDS;
            if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
                alert('Enter a valid approximate word count for the summary.');
                return;
            }
            requestRewrite('summary', parsedValue);
        }
    });
}

if (aiAcceptBtn) {
    aiAcceptBtn.addEventListener('click', applyAcceptedRewrite);
}

if (aiRejectBtn) {
    aiRejectBtn.addEventListener('click', closeCompareModal);
}

if (aiCloseCompareBtn) {
    aiCloseCompareBtn.addEventListener('click', closeCompareModal);
}

if (aiCompareModal) {
    aiCompareModal.addEventListener('click', (event) => {
        if (event.target === aiCompareModal) {
            closeCompareModal();
        }
    });
}

if (resumeAiReviewBtn) {
    resumeAiReviewBtn.addEventListener('click', () => requestResumeReview('ats_review'));
}

if (resumeAiKeywordBtn) {
    resumeAiKeywordBtn.addEventListener('click', () => requestResumeReview('keyword_scan'));
}

if (resumeAiImpactBtn) {
    resumeAiImpactBtn.addEventListener('click', () => requestResumeReview('impact_review'));
}

if (resumeAiConciseBtn) {
    resumeAiConciseBtn.addEventListener('click', () => requestResumeReview('conciseness_check'));
}

if (resumeAiCloseBtn) {
    resumeAiCloseBtn.addEventListener('click', closeResumeReviewModal);
}

if (resumeAiCopyBtn) {
    resumeAiCopyBtn.addEventListener('click', async () => {
        const text = resumeAiModalText?.textContent || '';
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            resumeAiCopyBtn.textContent = 'Copied';
            setTimeout(() => {
                resumeAiCopyBtn.textContent = 'Copy text';
            }, 1200);
        } catch (error) {
            alert('Unable to copy the review text.');
        }
    });
}

if (resumeAiModal) {
    resumeAiModal.addEventListener('click', (event) => {
        if (event.target === resumeAiModal) {
            closeResumeReviewModal();
        }
    });
}

refreshAiControls();
