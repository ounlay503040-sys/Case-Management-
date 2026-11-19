/* ==========================================================================
   NADR CMS Pro — Letters (បង្កើតលិខិត)
   Phase A: letter settings, case fields used by the letter templates,
            and the case folder on this computer.
   ========================================================================== */
(function () {
    'use strict';
    const $ = id => document.getElementById(id);

    /* ---------- Settings used by every letter ---------- */
    const LT_SETTINGS_KEY = 'nadr_letter_settings';
    const NADR_ADDRESS = 'អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ ក្នុងបរិវេណបណ្ឌិត្យសភាភូមិន្ទយុត្តិធម៌កម្ពុជា ដែលស្ថិតនៅមហាវិថីឈ្នះឈ្នះ ភូមិព្រែកតារ័ត្ន សង្កាត់ព្រែកតាសេក ខណ្ឌជ្រោយចង្វារ រាជធានីភ្នំពេញ';
    function defaultSettings() {
        return {
            mediator_title: 'លោក',
            mediator_name: localStorage.getItem('nadr_user_profile_name') || '',
            mediator_gender: 'ប្រុស',
            mediator_pronoun: 'ខ្ញុំបាទ',
            mediator_phone: localStorage.getItem('nadr_user_profile_phone') || '',
            sg_honorific: 'ឯកឧត្តម',
            sg_name: 'យ៉ម ផារ៉ូត',
            lunar_year: 'ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០',
            meeting_location: NADR_ADDRESS
        };
    }
    function ltGetSettings() {
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(LT_SETTINGS_KEY) || '{}') || {}; } catch (e) { saved = {}; }
        const s = Object.assign(defaultSettings(), saved);
        s.mediator_pronoun_short = 'ខ្ញុំ';
        return s;
    }
    const FIELD_IDS = {
        mediator_title: 'lt-mediator-title', mediator_name: 'lt-mediator-name', mediator_gender: 'lt-mediator-gender',
        mediator_pronoun: 'lt-mediator-pronoun', mediator_phone: 'lt-mediator-phone', sg_honorific: 'lt-sg-honorific',
        sg_name: 'lt-sg-name', lunar_year: 'lt-lunar-year', meeting_location: 'lt-nadr-address'
    };
    function fillSettingsForm() {
        const s = ltGetSettings();
        Object.entries(FIELD_IDS).forEach(([k, id]) => { const el = $(id); if (el) el.value = s[k] || ''; });
    }
    function ltSaveSettings() {
        const s = {};
        Object.entries(FIELD_IDS).forEach(([k, id]) => { const el = $(id); if (el) s[k] = el.value.trim(); });
        if (!s.meeting_location) s.meeting_location = NADR_ADDRESS;
        localStorage.setItem(LT_SETTINGS_KEY, JSON.stringify(s));
        if (typeof showToast === 'function') showToast('បានរក្សាទុកព័ត៌មានសម្រាប់លិខិត', 'success');
    }

    /* ---------- Case fields used by the letters ---------- */
    const isLocalPath = p => /^[a-zA-Z]:[\\/]|^\\\\/.test(String(p || '').trim());
    function populateLetterFields(c) {
        const set = (id, v) => { const el = $(id); if (el) el.value = v || ''; };
        set('intake-dispute-subject', c && c.disputeSubject);
        set('intake-assign-letter-no', c && c.assignmentLetterNo);
        set('intake-application-date', c && c.applicationDate);
        let folder = c && c.caseFolderPath;
        // Older cases kept the local folder in the Drive-link field: offer it here (the old field is left as it was).
        if (!folder && c) folder = [c.driveLink, c.folderLink].find(isLocalPath) || '';
        folder = String(folder || '').trim().replace(/​/g, '');
        set('intake-case-folder', folder);
    }
    function collectLetterFields() {
        const v = id => ($(id)?.value || '').trim();
        return {
            disputeSubject: v('intake-dispute-subject'),
            assignmentLetterNo: v('intake-assign-letter-no'),
            applicationDate: v('intake-application-date'),
            caseFolderPath: v('intake-case-folder')
        };
    }

    /* ---------- Case folder ---------- */
    async function ltPickCaseFolder() {
        const api = window.electronAPI;
        if (!api || !api.pickFolder) {
            if (typeof showToast === 'function') showToast('មុខងារនេះប្រើបានតែក្នុងកម្មវិធី Desktop', 'warning');
            return;
        }
        const el = $('intake-case-folder');
        const p = await api.pickFolder(el?.value || '');
        if (p && el) {
            el.value = p.replace(/​/g, '');
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    async function ltOpenCaseFolder() {
        const p = $('intake-case-folder')?.value || '';
        if (!p) { if (typeof showToast === 'function') showToast('មិនទាន់ជ្រើស Folder សំណុំរឿង', 'warning'); return; }
        const api = window.electronAPI;
        if (api?.folderExists && !(await api.folderExists(p))) {
            if (typeof showToast === 'function') showToast('រក Folder នេះមិនឃើញ៖ ' + p, 'error');
            return;
        }
        api?.openFolder?.(p);
    }
    function ltClearCaseFolder() {
        const el = $('intake-case-folder');
        if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    /* ---------- Wiring ---------- */
    function wrapOpeners() {
        const oa = window.openAddModal, oe = window.openEditModal;
        if (typeof oa === 'function' && !oa.__lt) {
            window.openAddModal = function () { const r = oa.apply(this, arguments); populateLetterFields(null); return r; };
            Object.assign(window.openAddModal, oa, { __lt: true });
        }
        if (typeof oe === 'function' && !oe.__lt) {
            window.openEditModal = function (id) {
                const r = oe.apply(this, arguments);
                populateLetterFields((window.casesData || (typeof casesData !== 'undefined' ? casesData : [])).find(x => String(x.id) === String(id)));
                return r;
            };
            Object.assign(window.openEditModal, oe, { __lt: true });
        }
        try { openAddModal = window.openAddModal; openEditModal = window.openEditModal; } catch (e) { /* ignore */ }
    }

    function init() {
        wrapOpeners();
        fillSettingsForm();
        document.querySelector('#settings-view .tab-btn[data-tab="tab-letters"]')?.addEventListener('click', fillSettingsForm);
    }

    Object.assign(window, {
        ltGetSettings, ltSaveSettings, collectLetterFields, populateLetterFields,
        ltPickCaseFolder, ltOpenCaseFolder, ltClearCaseFolder
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
