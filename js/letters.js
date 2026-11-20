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

    /* ======================================================================
       Phase C: the "លិខិត" section on the case page, one button per letter,
       the small dialog for the values that change per letter, and the list
       of missing information before the letter is made.
       ====================================================================== */
    const LC = () => window.LettersCore;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const allCases = () => { try { return casesData; } catch (e) { return []; } };
    const getCase = id => (allCases() || []).find(x => String(x.id) === String(id));
    const isoDay = v => { const p = LC().parseDay(v); return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : ''; };
    const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t || 'info'); };

    // Dialog fields. "to: 'khDate'" turns a picked date into Khmer text for that template field.
    const F = {
        md: { k: 'meetingDate', label: 'ថ្ងៃប្រជុំ', type: 'date' },
        mt: { k: 'meetingTime', label: 'ម៉ោងប្រជុំ', type: 'time' },
        ts: { k: 'timeStart', label: 'ម៉ោងចាប់ផ្តើម', type: 'time' },
        te: { k: 'timeEnd', label: 'ម៉ោងបញ្ចប់', type: 'time' },
        round: { k: 'round', label: 'លើកទី', type: 'number' }
    };
    const T = (k, label, extra) => Object.assign({ k, label, type: 'text' }, extra || {});
    const MEET_KINDS = [['ប្រមូលព័ត៌មាន', 'ប្រមូលព័ត៌មាន'], ['សម្រុះសម្រួលផ្សះផ្សាវិវាទ', 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ']];
    const LETTERS = [
        { stage: '១. ត្រៀម', items: [
            { key: 'INV-INFO-A', label: 'លិខិតអញ្ជើញផ្តល់ព័ត៌មាន — ភាគីស្នើសុំ', kind: 'INFO', role: 'A', fields: [F.md, F.mt] },
            { key: 'INV-INFO-B', label: 'លិខិតអញ្ជើញផ្តល់ព័ត៌មាន — ភាគីម្ខាងទៀត', kind: 'INFO', role: 'B', fields: [F.md, F.mt] },
            { key: 'INV-INFO-W', label: 'លិខិតអញ្ជើញសាក្សី (ផ្តល់ព័ត៌មាន)', kind: 'INFO', role: 'W', fields: [F.md, F.mt] },
            { key: 'RPT-INFO-A', label: 'របាយការណ៍ប្រជុំផ្តល់ព័ត៌មាន — ភាគីស្នើសុំ', kind: 'INFO', fields: [F.md, F.ts, F.te] },
            { key: 'RPT-INFO-B', label: 'របាយការណ៍ប្រជុំផ្តល់ព័ត៌មាន — ភាគីម្ខាងទៀត', kind: 'INFO', fields: [F.md, F.ts, F.te] }
        ] },
        { stage: '២. ប្រជុំដោះស្រាយ', items: [
            { key: 'INV-MED-A', label: 'លិខិតអញ្ជើញសម្រុះសម្រួល — ភាគីស្នើសុំ', kind: 'MED', role: 'A', fields: [F.md, F.mt] },
            { key: 'INV-MED-B', label: 'លិខិតអញ្ជើញសម្រុះសម្រួល — ភាគីម្ខាងទៀត', kind: 'MED', role: 'B', fields: [F.md, F.mt] },
            { key: 'INV-MED-W', label: 'លិខិតអញ្ជើញសាក្សី (សម្រុះសម្រួល)', kind: 'MED', role: 'W', fields: [F.md, F.mt] },
            { key: 'RPT-MED', label: 'របាយការណ៍ប្រជុំសម្រុះសម្រួលផ្សះផ្សាវិវាទ', kind: 'MED', fields: [F.round, F.md, F.ts, F.te] },
            { key: 'MIN-SETTLE', label: 'កំណត់ហេតុព្រមព្រៀងបញ្ចប់វិវាទ', kind: 'MED', fields: [F.md, F.ts, F.te, T('minutes_no', 'លេខកំណត់ហេតុ'), T('minutes_date', 'ថ្ងៃកំណត់ហេតុ')] },
            { key: 'MIN-COPY', label: 'សេចក្តីចម្លងយថាភូតនៃកំណត់ហេតុ', fields: [T('minutes_no', 'លេខកំណត់ហេតុ'), T('minutes_date', 'ថ្ងៃកំណត់ហេតុ'), T('copies_count', 'ចំនួនច្បាប់ចម្លង'), T('minutes_pages', 'ចំនួនទំព័រកំណត់ហេតុ', { ph: 'ឧ. ៥ (ប្រាំ)' })] }
        ] },
        { stage: '៣. ក្រោយការប្រជុំ', items: [
            { key: 'RPT-RESULT', label: 'របាយការណ៍លទ្ធផលនៃការសម្រុះសម្រួល', fields: [] },
            { key: 'REQ-CLOSE', label: 'សំណើសុំបិទបញ្ចប់សំណុំរឿង', fields: [T('info_meetings_count', 'ចំនួនកិច្ចប្រជុំផ្តល់ព័ត៌មាន', { type: 'number' }), T('mediation_meetings_count', 'ចំនួនកិច្ចប្រជុំសម្រុះសម្រួល', { type: 'number' }), T('last_mediation_date', 'ថ្ងៃប្រជុំសម្រុះសម្រួលចុងក្រោយ', { type: 'date', to: 'khDate' })] }
        ] },
        { stage: 'លិខិតរដ្ឋបាលផ្សេងៗ', items: [
            { key: 'REQ-ROOM', label: 'សំណើសុំប្រើប្រាស់បន្ទប់ប្រជុំ', fields: [F.md, F.mt, T('room_purpose', 'គោលបំណង', { ph: 'ឧ. សាកសួរព័ត៌មានប្រមូលធាតុចូលបន្ថែម' })] },
            { key: 'REQ-MISSION', label: 'សំណើសុំចុះបេសកកម្ម', fields: [T('mission_place', 'ទីកន្លែងបេសកកម្ម', { ph: 'ឧ. ក្រុងអរិយក្សត្រ ខេត្តកណ្តាល' })] },
            { key: 'RPT-MISSION', label: 'របាយការណ៍លទ្ធផលចុះបេសកកម្ម', fields: [T('mission_place', 'ទីកន្លែងបេសកកម្ម'), T('mission_period', 'រយៈពេលបេសកកម្ម', { ph: 'ឧ. ថ្ងៃទី៧-១០ ខែមិថុនា ឆ្នាំ២០២៦' }), T('intro_letter_no', 'លេខលិខិតឧទ្ទេសនាម'), T('intro_letter_date', 'ថ្ងៃលិខិតឧទ្ទេសនាម', { type: 'date', to: 'khDate' }), T('mission_letter_no', 'លេខលិខិតបេសកកម្ម'), T('mission_letter_date', 'ថ្ងៃលិខិតបេសកកម្ម', { type: 'date', to: 'khDate' }), F.md, T('missionMeetingKind', 'ប្រភេទកិច្ចប្រជុំ', { type: 'select', options: [['ផ្តល់ព័ត៌មាន', 'ផ្តល់ព័ត៌មាន'], ['សម្រុះសម្រួលវិវាទ', 'សម្រុះសម្រួលវិវាទ']] })] },
            { key: 'COOP-HALL', label: 'សំណើសុំកិច្ចសហការ ប្រើប្រាស់សាលប្រជុំ', fields: [T('authority_addressee', 'ផ្ញើជូន', { ph: 'ឧ. លោកប្រធានក្រុមប្រឹក្សា សង្កាត់...' }), T('authority_short', 'ងារខ្លី', { ph: 'ឧ. លោកប្រធានក្រុមប្រឹក្សា' }), T('hall_name', 'ឈ្មោះសាលប្រជុំ'), T('meeting_kind', 'ប្រភេទកិច្ចប្រជុំ', { type: 'select', options: MEET_KINDS }), F.md, F.mt] },
            { key: 'COOP-HALL-PARTICIPANTS', label: 'សំណើសុំកិច្ចសហការ ប្រើសាលប្រជុំ និងអញ្ជើញសមាសភាព', fields: [T('authority_addressee', 'ផ្ញើជូន'), T('authority_short', 'ងារខ្លី'), T('hall_name', 'ឈ្មោះសាលប្រជុំ'), T('meeting_kind', 'ប្រភេទកិច្ចប្រជុំ', { type: 'select', options: MEET_KINDS }), F.md, F.mt] },
            { key: 'DOC-ATTEND', label: 'បញ្ជីសម្រង់វត្តមានអ្នកចូលរួម', fields: [T('meeting_title', 'កិច្ចប្រជុំ', { list: ['ផ្តល់ព័ត៌មាន ភាគីស្នើសុំ', 'ផ្តល់ព័ត៌មាន ភាគីម្ខាងទៀត', 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ លើកទី១', 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ លើកទី២'] }), F.md, F.mt] },
            { key: 'DOC-POA', label: 'លិខិតប្រគល់សិទ្ធិ', fields: [T('grantorGroup', 'អ្នកប្រគល់សិទ្ធិ', { type: 'select', options: [['B', 'ភាគីម្ខាងទៀត (ខ)'], ['A', 'ភាគីស្នើសុំ (ក)']] }),
                T('grantee_name', 'ឈ្មោះអ្នកទទួលសិទ្ធិ'), T('grantee_gender', 'ភេទអ្នកទទួលសិទ្ធិ', { type: 'select', options: [['ប្រុស', 'ប្រុស'], ['ស្រី', 'ស្រី']] }),
                T('grantee_dob', 'ថ្ងៃកំណើតអ្នកទទួលសិទ្ធិ', { type: 'date', to: 'khDate' }), T('grantee_id_no', 'លេខអត្តសញ្ញាណប័ណ្ណ'), T('grantee_address', 'អាសយដ្ឋានអ្នកទទួលសិទ្ធិ')] },
            { key: 'DOC-ENVELOPE', label: 'ឈ្មោះលើស្រោមសំបុត្រ', fields: [] }
        ] }
    ];
    const LETTER_BY_KEY = {};
    LETTERS.forEach(g => g.items.forEach(it => { LETTER_BY_KEY[it.key] = it; }));
    const SHORT = id => (LC().TEMPLATES.find(t => id === t.id || id.startsWith(t.id + '-')) || {}).short || id;

    /** Where each missing field is filled in. */
    const FIX_PLACE = {
        settings: /^(mediator_|sg_|meeting_location)/,
        general: /^(case_no|case_date|dispute_subject|dispute_location|assignment_letter_|application_date)/,
        parties: /^(recipient_|applicant_|witness_|parties_designation|respondent_short|party_._signer|attendees|envelope|grantor|counterparty)/,
        outcome: /^(mediation_meetings)$/
    };
    const PLACE_LABEL = { settings: 'ការកំណត់ › ព័ត៌មានលិខិត', general: 'ទម្រង់សំណុំរឿង › ជំហាន ១', parties: 'ទម្រង់សំណុំរឿង › ជំហាន ២ (ភាគី)', outcome: 'ទម្រង់សំណុំរឿង › ជំហាន ៤', dialog: 'ប្រអប់នេះ' };
    const placeOf = key => Object.keys(FIX_PLACE).find(p => FIX_PLACE[p].test(key)) || 'dialog';

    /* ---------- The section on the case page ---------- */
    function lettersSection(c) {
        const g = LC().caseGroups(c);
        const groups = LETTERS.map(grp => `
            <div class="lt-stage">
                <div class="lt-stage-h">${esc(grp.stage)}</div>
                <div class="lt-btns">${grp.items.map(it => {
                    const noWit = it.role === 'W' && !g.witnesses.length;
                    return `<button type="button" class="lt-btn" ${noWit ? 'disabled title="មិនទាន់មានសាក្សី (ភាគី «គ» តួនាទីសាក្សី)"' : ''} onclick="ltStartLetter('${esc(c.id)}','${it.key}')"><i class="fa-solid fa-file-word"></i><span>${esc(it.label)}</span></button>`;
                }).join('')}</div>
            </div>`).join('');
        const folder = c.caseFolderPath || '';
        return `<section class="cp-section lt-section">
            <h4 class="cp-h"><i class="fa-solid fa-envelope-open-text"></i> លិខិត <span class="cp-count">បង្កើតជា Word</span></h4>
            <div class="lt-folder-note">${folder ? `<i class="fa-solid fa-folder"></i> ${esc(folder)}` : '<i class="fa-solid fa-triangle-exclamation"></i> មិនទាន់ជ្រើស Folder សំណុំរឿង — នឹងសួរនៅពេលបង្កើតលិខិតដំបូង'}</div>
            ${groups}
        </section>`;
    }
    function wrapProfile() {
        const orig = window.renderCaseProfileHTML;
        if (typeof orig !== 'function' || orig.__lt) return;
        window.renderCaseProfileHTML = function (c) {
            const html = orig.apply(this, arguments);
            try {
                const aside = html.indexOf('<aside class="cp-side">');
                const end = aside < 0 ? -1 : html.lastIndexOf('</div>', aside);
                return end < 0 ? html : html.slice(0, end) + lettersSection(c) + html.slice(end);
            } catch (e) { return html; }
        };
        Object.assign(window.renderCaseProfileHTML, orig, { __lt: true });
        try { renderCaseProfileHTML = window.renderCaseProfileHTML; } catch (e) { /* ignore */ }
    }

    /* ---------- Dialog ---------- */
    function dialogEl() {
        let d = $('lt-dlg');
        if (!d) { d = document.createElement('div'); d.id = 'lt-dlg'; d.className = 'lt-dlg'; document.body.appendChild(d); }
        return d;
    }
    function closeDialog() { $('lt-dlg')?.classList.remove('open'); }
    function showDialog(html, bind) {
        const d = dialogEl();
        d.innerHTML = `<div class="lt-dlg-box" role="dialog" aria-modal="true">${html}</div>`;
        d.classList.add('open');
        d.onclick = e => { if (e.target === d) closeDialog(); };
        d.querySelectorAll('[data-close]').forEach(b => b.onclick = closeDialog);
        if (bind) bind(d);
        setTimeout(() => d.querySelector('input, select, button.lt-primary')?.focus(), 30);
    }

    /** Values typed earlier for this case (per letter, then shared per meeting kind), then case data. */
    function prefill(c, it) {
        const saved = (c.letterInputs || {});
        const own = saved[it.key] || {};
        const shared = it.kind ? (saved['_' + it.kind] || {}) : {};
        const fromCase = {};
        if (it.kind === 'MED') { fromCase.meetingDate = isoDay(c.mediationMeetingDate); fromCase.round = c.mediationMeetingCount || ''; }
        if (it.kind === 'INFO') fromCase.meetingDate = isoDay(/-B$/.test(it.key) ? c.meetingPartyBDate : c.meetingPartyADate);
        if (it.key === 'REQ-CLOSE') {
            const n = v => parseInt(LC().latinNum(v), 10) || 0;
            Object.assign(fromCase, { info_meetings_count: String(n(c.meetingPartyACount) + n(c.meetingPartyBCount)), mediation_meetings_count: String(n(c.mediationMeetingCount)), last_mediation_date: isoDay(c.mediationMeetingDate) });
        }
        const defaults = { round: '1', grantee_gender: 'ប្រុស', meetingTime: '13:00', timeStart: '14:00', timeEnd: '17:00', copies_count: LC().khCountWords(3), grantorGroup: 'B', meeting_kind: it.kind === 'MED' ? 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ' : 'ប្រមូលព័ត៌មាន' };
        const y = LC().khNum(String(new Date().getFullYear()));
        Object.assign(defaults, { minutes_no: `       /${y.slice(-2)} កពវ.អ.ដ.ក.`, minutes_date: `ថ្ងៃទី       ខែ       ឆ្នាំ${y}` });
        const out = {};
        it.fields.forEach(f => {
            const k = f.k;
            out[k] = [own[k], shared[k], fromCase[k], defaults[k]].find(v => v != null && v !== '') || '';
        });
        return out;
    }
    function fieldHTML(f, v) {
        const id = 'lt-f-' + f.k;
        let input;
        if (f.type === 'select') input = `<select id="${id}" class="kt-input">${f.options.map(([val, lab]) => `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
        else {
            const list = f.list ? `<datalist id="${id}-l">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : '';
            input = `<input id="${id}" class="kt-input" type="${f.type === 'number' ? 'number' : f.type}" ${f.type === 'number' ? 'min="0"' : ''} value="${esc(v)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${f.list ? `list="${id}-l"` : ''}>${list}`;
        }
        return `<label class="lt-field"><span>${esc(f.label)}</span>${input}</label>`;
    }
    function groupLabel(g) {
        const names = g.type === 'J' ? g.org_name : (g.persons || []).map(p => p.name).join(', ');
        return `ភាគី «${g.label}» — ${names || 'គ្មានឈ្មោះ'}`;
    }

    /** Button click: choose the template, ask for the recipient when needed, then the values. */
    function ltStartLetter(caseId, key) {
        const c = getCase(caseId), it = LETTER_BY_KEY[key];
        if (!c || !it || !LC()) return;
        const g = LC().caseGroups(c);
        // Who receives it
        let targets = [{ recipient: 'B0', label: '' }];
        if (it.role === 'B' || key === 'DOC-ENVELOPE') targets = g.others.filter(x => x.count).map((x, i) => ({ recipient: 'B' + i, label: groupLabel(x), tag: x.label }));
        if (it.role === 'W') targets = g.witnesses.map((w, i) => ({ witnessIndex: String(i), label: 'សាក្សី — ' + (w.name || ''), tag: 'W' }));
        if (!targets.length) targets = [{ recipient: 'B0', label: '' }];
        const vals = prefill(c, it);
        const pickTarget = targets.length > 1
            ? `<label class="lt-field lt-field-wide"><span>${key === 'DOC-ENVELOPE' ? 'ស្រោមសំបុត្រទី២ សម្រាប់' : 'បង្កើតសម្រាប់'}</span><select id="lt-f-target" class="kt-input">${targets.map((t, i) => `<option value="${i}">${esc(t.label)}</option>`).join('')}${key === 'DOC-ENVELOPE' ? '' : '<option value="all">ទាំងអស់ — មួយច្បាប់សម្រាប់ក្រុមនីមួយៗ</option>'}</select></label>`
            : (targets[0].label ? `<div class="lt-target-one"><i class="fa-solid fa-user"></i> ${esc(targets[0].label)}</div>` : '');
        const tplNote = it.role ? `<div class="lt-tpl-note">គម្រូ៖ <b>${esc(templateFor(it, g, targets[0]))}</b></div>` : '';
        showDialog(`
            <div class="lt-dlg-h"><i class="fa-solid fa-file-word"></i><div><b>${esc(it.label)}</b><small>សំណុំរឿងលេខ ${esc(c.caseNumber || '')}</small></div></div>
            <div class="lt-dlg-body">
                ${pickTarget}${tplNote}
                ${it.fields.length ? `<div class="lt-fields">${it.fields.map(f => fieldHTML(f, vals[f.k])).join('')}</div>` : '<p class="lt-muted">លិខិតនេះមិនត្រូវការព័ត៌មានបន្ថែមទេ។</p>'}
                <p class="lt-muted">ផ្នែកខ្លឹមសារ (អង្គហេតុ លទ្ធផល ជម្រើស…) ទុកចំណុចៗ សម្រាប់សរសេរក្នុង Word។</p>
            </div>
            <div class="lt-dlg-f">
                <button type="button" class="kt-btn" data-close>បោះបង់</button>
                <button type="button" class="kt-btn-primary lt-primary" id="lt-go"><i class="fa-solid fa-wand-magic-sparkles"></i> បង្កើតលិខិត</button>
            </div>`, d => {
            const sel = d.querySelector('#lt-f-target');
            if (sel && it.role) sel.onchange = () => { const t = targets[sel.value] || targets[0]; const n = d.querySelector('.lt-tpl-note b'); if (n) n.textContent = sel.value === 'all' ? 'តាមក្រុមនីមួយៗ' : templateFor(it, g, t); };
            d.querySelector('#lt-go').onclick = () => {
                const v = {};
                it.fields.forEach(f => { v[f.k] = (d.querySelector('#lt-f-' + f.k)?.value || '').trim(); });
                const chosen = !sel ? [targets[0]] : sel.value === 'all' ? targets : [targets[sel.value]];
                saveInputs(c, it, v);
                closeDialog();
                checkAndMake(c.id, it, v, chosen);
            };
        });
    }
    function templateFor(it, g, target) {
        if (!it.role) return it.key;
        if (it.role === 'W') return `INV-${it.kind}-W`;
        if (it.role === 'A') return LC().pickInviteTemplate(it.kind, 'A', g.A.type);
        const idx = parseInt(String((target && target.recipient) || 'B0').slice(1), 10) || 0;
        const B = g.others[idx] || g.others[0];
        return LC().pickInviteTemplate(it.kind, 'B', B.type, g.A.type);
    }
    function saveInputs(c, it, v) {
        const li = Object.assign({}, c.letterInputs || {});
        li[it.key] = Object.assign({}, li[it.key] || {}, v);
        if (it.kind) {
            const shared = {};
            ['meetingDate', 'meetingTime', 'timeStart', 'timeEnd', 'round'].forEach(k => { if (v[k]) shared[k] = v[k]; });
            li['_' + it.kind] = Object.assign({}, li['_' + it.kind] || {}, shared);
        }
        c.letterInputs = li;
        if (typeof updateCase === 'function') updateCase(c.id, { letterInputs: li });
    }
    function extrasFrom(it, v, target) {
        const ex = Object.assign({ kind: it.kind || '' }, target || {});
        it.fields.forEach(f => {
            const val = v[f.k];
            if (val === '' || val == null) return;
            ex[f.k] = f.to === 'khDate' ? LC().khDate(val) : (/_count$/.test(f.k) ? LC().khNum(val) : val);
        });
        if (it.key === 'REQ-CLOSE') {
            const n = x => parseInt(v[x], 10) || 0;
            ex.meetings_total = LC().khNum(n('info_meetings_count') + n('mediation_meetings_count'));
            ex.last_mediation_no = v.mediation_meetings_count ? LC().khNum(v.mediation_meetings_count) : '';
        }
        if (it.key === 'MIN-SETTLE' || it.key === 'MIN-COPY') delete ex.round;
        return ex;
    }

    /** Build the data, list what is missing, then make the letter(s). */
    async function checkAndMake(caseId, it, v, targets) {
        const c = getCase(caseId);
        const api = window.electronAPI;
        if (!api || !api.generateLetter) { toast('ការបង្កើតលិខិត ប្រើបានតែក្នុងកម្មវិធី Desktop', 'warning'); return; }
        const g = LC().caseGroups(c);
        const jobs = [];
        for (const t of targets) {
            const tplId = templateFor(it, g, t);
            const { data, warnings } = LC().buildLetterData(tplId, c, ltGetSettings(), extrasFrom(it, v, t));
            const tags = await api.letterTags(tplId);
            if (!tags.ok) { toast(tags.error, 'error'); return; }
            jobs.push({ tplId, data, warnings, target: t, missing: LC().missingFields(tags.tags, data) });
        }
        const missing = [];
        jobs.forEach(j => j.missing.forEach(m => { if (!missing.some(x => x.key === m.key)) missing.push(Object.assign({ place: placeOf(m.key) }, m)); }));
        const warnings = [...new Set(jobs.flatMap(j => j.warnings))];
        if (!missing.length && !warnings.length) return makeLetters(c, it, v, jobs);
        const byPlace = {};
        missing.forEach(m => { (byPlace[m.place] = byPlace[m.place] || []).push(m); });
        const first = ['dialog', 'settings', 'general', 'parties', 'outcome'].find(p => byPlace[p]);
        showDialog(`
            <div class="lt-dlg-h lt-warn-h"><i class="fa-solid fa-triangle-exclamation"></i><div><b>${missing.length ? 'ព័ត៌មានមិនទាន់គ្រប់' : 'សូមពិនិត្យ'}</b><small>${esc(it.label)}</small></div></div>
            <div class="lt-dlg-body">
                ${warnings.map(w => `<div class="lt-warn-line">${esc(w)}</div>`).join('')}
                ${Object.keys(byPlace).map(p => `<div class="lt-miss-group"><div class="lt-miss-place">${esc(PLACE_LABEL[p])}</div><ul>${byPlace[p].map(m => `<li>${esc(m.label)}</li>`).join('')}</ul></div>`).join('')}
                ${missing.length ? '<p class="lt-muted">បើបង្កើតឥឡូវ កន្លែងទាំងនេះនឹងទុកជាចំណុចៗ សម្រាប់សរសេរដោយដៃ។</p>' : ''}
            </div>
            <div class="lt-dlg-f">
                ${missing.length ? '<button type="button" class="kt-btn" id="lt-fix"><i class="fa-solid fa-pen-to-square"></i> បំពេញឥឡូវ</button>' : '<button type="button" class="kt-btn" data-close>បោះបង់</button>'}
                <button type="button" class="kt-btn-primary lt-primary" id="lt-blank"><i class="fa-solid fa-file-word"></i> ${missing.length ? 'បង្កើតដោយទុកចន្លោះទទេ' : 'បង្កើតលិខិត'}</button>
            </div>`, d => {
            const fix = d.querySelector('#lt-fix');
            if (fix) fix.onclick = () => { closeDialog(); goFix(c, it, first, byPlace[first]); };
            d.querySelector('#lt-blank').onclick = () => { closeDialog(); jobs.forEach(j => fillBlanks(j.data, j.missing)); makeLetters(c, it, v, jobs); };
        });
    }
    function goFix(c, it, place, items) {
        if (place === 'dialog') {
            ltStartLetter(c.id, it.key);
            const DIALOG_KEY = { meeting_date: 'meetingDate', meeting_date_full: 'meetingDate', meeting_time: 'meetingTime', meeting_time_start: 'timeStart', meeting_time_end: 'timeEnd', meeting_round: 'round' };
            const els = items.map(m => $('lt-f-' + (DIALOG_KEY[m.key] || m.key))).filter(Boolean);
            els.forEach(e => e.classList.add('oc-missing'));
            if (els[0]) setTimeout(() => els[0].focus(), 60);
            return;
        }
        $('view-modal')?.classList.remove('open');
        if (place === 'settings') {
            if (typeof switchView === 'function') switchView('settings-view');
            setTimeout(() => document.querySelector('#settings-view .tab-btn[data-tab="tab-letters"]')?.click(), 100);
            return;
        }
        if (typeof openEditModal !== 'function') return;
        openEditModal(c.id);
        setTimeout(() => {
            if (typeof switchCaseTab === 'function') switchCaseTab(place === 'general' ? 'general' : place === 'parties' ? 'parties' : 'outcome');
            const ids = { dispute_subject: 'intake-dispute-subject', assignment_letter_no: 'intake-assign-letter-no', assignment_letter_date: 'intake-assigned-date', application_date: 'intake-application-date', case_date: 'intake-filing-date', dispute_location: 'intake-loc-commune' };
            const el = items.map(m => $(ids[m.key])).find(Boolean);
            if (el) { el.classList.add('oc-missing'); el.scrollIntoView({ block: 'center' }); el.focus(); setTimeout(() => el.classList.remove('oc-missing'), 6000); }
            toast('សូមបំពេញ៖ ' + items.map(m => m.label).join(', '), 'warning');
        }, 300);
    }
    /** "Make it with blanks": empty places get dots so they can be written by hand. */
    function fillBlanks(data, missing) {
        const D = LC().DOTS;
        missing.forEach(m => {
            const k = m.key;
            if (/_persons$/.test(k)) data[k] = [{ name: D, gender: '......', nationality: 'ខ្មែរ', dob: '', address: '', sep: '' }];
            else if (k === 'attendees') data[k] = [{ title: '', name: D, role: '......' }];
            else if (k === 'mediation_meetings') data[k] = [{ no: '១', date: D, time: '', place: '' }];
            else if (k === 'grantors') data[k] = [{ name: D, gender: '......', dob: '......', id_no: '......', sep: '' }];
            else if (Array.isArray(data[k])) data[k] = [{}];
            else data[k] = D;
        });
    }

    /* ---------- Making the file (saved into the stage sub-folder of the case folder) ---------- */
    async function ensureCaseFolder(c) {
        const api = window.electronAPI;
        let folder = c.caseFolderPath || [c.driveLink, c.folderLink].find(isLocalPath) || '';
        if (folder && api.folderExists && await api.folderExists(folder)) return folder;
        const ok = await new Promise(res => {
            const msg = folder ? `រក Folder សំណុំរឿងមិនឃើញ៖\n${folder}\n\nសូមជ្រើស Folder សំណុំរឿងម្តងទៀត។` : 'សំណុំរឿងនេះមិនទាន់មាន Folder នៅលើកុំព្យូទ័រទេ។ សូមជ្រើស Folder សំណុំរឿង ដើម្បីរក្សាទុកលិខិត។';
            if (typeof customConfirm === 'function') customConfirm('ជ្រើស Folder សំណុំរឿង', msg, () => res(true), () => res(false), 'ជ្រើស Folder', 'បោះបង់');
            else res(confirm(msg));
        });
        if (!ok) return '';
        const p = (await api.pickFolder(folder || '')).replace(/[​-‍﻿]/g, '');
        if (!p) return '';
        c.caseFolderPath = p;
        if (typeof updateCase === 'function') updateCase(c.id, { caseFolderPath: p });
        return p;
    }
    function fileNameFor(c, it, job, v) {
        const no = LC().latinNum(String(c.caseNumber || '').split('/')[0]).trim() || 'សំណុំរឿង';
        const tag = it.role === 'A' || /-A$/.test(it.key) ? 'A' : it.role === 'W' ? 'W' : (it.role === 'B' || /-B$/.test(it.key)) ? 'B' : '';
        let name = SHORT(job.tplId);
        if (it.key === 'RPT-MED' && v.round) name += 'លើកទី' + LC().khNum(v.round);
        if (it.role === 'W' && job.data.witness_name) name += ' ' + job.data.witness_name;
        if (it.role === 'B' && job.target && job.target.tag && job.target.tag !== 'ខ') name += ` (ភាគី ${job.target.tag})`;
        return (tag ? `${no} ${tag}-${name}` : `${no}-${name}`).replace(/[\\/:*?"<>|]/g, '-').replace(/[​-‍﻿]/g, '');
    }
    // Stage 2 once a mediation meeting is held/scheduled or a mediation letter was already made.
    function currentStage(c) {
        const m = String(c.mediationMeeting || '').trim();
        const li = c.letterInputs || {};
        const medMade = Object.keys(li).some(k => /^(INV-MED-|RPT-MED|MIN-)/.test(k));
        return (m && m !== 'មិនទាន់ប្រជុំ') || c.mediationMeetingDate || medMade ? '2-ប្រជុំដោះស្រាយ' : '1-ត្រៀម';
    }
    function subFolderFor(c, tplId) {
        const id = String(tplId);
        if (/^INV-INFO-/.test(id)) return ['1-ត្រៀម', '1-លិខិតអញ្ជើញ'];
        if (/^RPT-INFO-/.test(id)) return ['1-ត្រៀម', '3-របាយការណ៍ប្រជុំ'];
        if (/^INV-MED-/.test(id)) return ['2-ប្រជុំដោះស្រាយ', '1-លិខិតអញ្ជើញ'];
        if (/^RPT-MED/.test(id)) return ['2-ប្រជុំដោះស្រាយ', '3-របាយការណ៍ប្រជុំ'];
        if (/^MIN-(SETTLE|COPY)/.test(id)) return ['2-ប្រជុំដោះស្រាយ', '4-កំណត់ហេតុបញ្ចប់វិវាទ'];
        if (/^(RPT-RESULT|REQ-CLOSE)/.test(id)) return ['3-ក្រោយការប្រជុំ', '1-របាយការណ៍'];
        return [currentStage(c), 'លិខិតរដ្ឋបាលផ្សេងៗ'];
    }
    async function makeLetters(c, it, v, jobs) {
        const api = window.electronAPI;
        const root = await ensureCaseFolder(c);
        if (!root) { toast('មិនបានបង្កើតលិខិត៖ មិនទាន់ជ្រើស Folder សំណុំរឿង', 'warning'); return; }
        const sep = root.includes('/') && !root.includes('\\') ? '/' : '\\';
        const made = [];
        for (const j of jobs) {
            const dir = [root.replace(/[\\/]+$/, '')].concat(subFolderFor(c, j.tplId)).join(sep);
            const r = await api.generateLetter({ templateId: j.tplId, data: j.data, dir, fileName: fileNameFor(c, it, j, v), open: !window.__ltNoOpen });
            if (!r.ok) { toast('បង្កើតលិខិតមិនបាន៖ ' + r.error + (r.details && r.details.length ? ' — ' + r.details.join('; ') : ''), 'error'); return; }
            made.push(r.path);
            if (r.shortened) toast(`ផ្លូវ File វែងជាង ២៤០ តួអក្សរ ដូច្នេះបានកាត់ឈ្មោះ File ឱ្យខ្លី៖ ${r.path.split(/[\\/]/).pop()}`, 'warning');
            if (r.openError) toast('បានរក្សាទុក ប៉ុន្តែបើក Word មិនបាន៖ ' + r.openError, 'warning');
        }
        window.__ltLastMade = made;
        toast(`បានបង្កើត ${LC().khNum(made.length)} លិខិត៖ ${made.map(p => p.split(/[\\/]/).slice(-3).join('\\')).join(', ')}`, 'success');
        if ($('view-modal')?.classList.contains('open') && typeof openViewModal === 'function') openViewModal(c.id);
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
        wrapProfile();
        fillSettingsForm();
        document.querySelector('#settings-view .tab-btn[data-tab="tab-letters"]')?.addEventListener('click', fillSettingsForm);
    }

    // Old "ផលិតលិខិត" entry points now lead here: open the case page at its «លិខិត» section.
    function ltGoToLetters(caseId) {
        const vm = $('view-modal');
        if (!(vm && vm.classList.contains('open')) && typeof openViewModal === 'function') openViewModal(caseId);
        setTimeout(() => {
            const s = document.querySelector('#view-modal .lt-section');
            if (!s) return;
            s.scrollIntoView({ behavior: 'smooth', block: 'start' });
            s.classList.add('lt-flash');
            setTimeout(() => s.classList.remove('lt-flash'), 1600);
        }, 250);
    }

    Object.assign(window, {
        ltGetSettings, ltSaveSettings, collectLetterFields, populateLetterFields,
        ltPickCaseFolder, ltOpenCaseFolder, ltClearCaseFolder, ltStartLetter, ltGoToLetters
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
