/* ==========================================================================
   CASEWORK — data fields, consistency rules, reports and Excel import that
   mirror the officer's "Case Management" workbook (sheet "Case Manage").

   1. Canonical option lists + normalisation of stored values
   2. Entry form step 4 (meetings, outcome, amounts, activities, support)
   3. Validation before saving
   4. Case profile section
   5. Reports: evaluation, monthly flow, provinces, activities, weekly
   6. Import from the workbook's "Case Manage" sheet (with preview)
   ========================================================================== */
(function () {
'use strict';

/* ---------- 1. Canonical lists & normalisation ---------- */
const MEET_OPTIONS = {
    a: ['មិនទាន់ប្រជុំ', 'ភាគីមិនចូលរួម', 'បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់'],
    b: ['មិនទាន់ប្រជុំ', 'ភាគីមិនចូលរួម', 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់'],
    m: ['មិនទាន់ប្រជុំ', 'ភាគីមិនចូលរួម', 'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)',
        'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)', 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)']
};
const MEET_DONE_A = 'បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់';
const MEET_DONE_B = 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់';
const GENERIC_DONE = ['បានប្រជុំប្រមូលព័ត៌មានភាគីរួច', 'បានប្រមូលព័ត៌មានភាគីសន្និដ្ឋានរួចរាល់',
    MEET_DONE_A, MEET_DONE_B];
const CATEGORY_FIX = { 'វិវាទមត៌ក': 'វិវាទមរតក', 'វិវាទមត៌ករ': 'វិវាទមរតក', 'វិវាទមរតករ': 'វិវាទមរតក' };
const DEFAULT_CATEGORIES = ['វិវាទជំពាក់ប្រាក់', 'វិវាទដីធ្លី', 'វិវាទកិច្ចសន្យា', 'វិវាទក្នុងគ្រួសារ',
    'វិវាទពាណិជ្ជកម្ម', 'វិវាទអចលនវត្ថុ', 'វិវាទមរតក', 'វិវាទការងារ'];

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const $ = id => document.getElementById(id);
const todayIso = () => (typeof getTodayDateString === 'function' ? getTodayDateString() : new Date().toISOString().slice(0, 10));
const isoDay = v => (typeof toIsoDay === 'function' ? toIsoDay(v) : String(v || '').slice(0, 10));
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[,\s$៛]/g, '')); return isFinite(n) ? n : 0; };
const fmtNum = (n, d = 0) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const khDigits = s => String(s).replace(/\d/g, d => '០១២៣៤៥៦៧៨៩'[d]);

/** Province names: the workbook spells ្ដ (coeng DA) where the app uses ្ត (coeng TA). */
function normProvince(p) {
    const s = String(p || '').trim().replace(/្ដ/g, '្ត');
    return s.replace(/^(រាជធានី|ខេត្ត)\s*/, '');
}
function normCategory(cat) {
    const s = String(cat || '').trim();
    return CATEGORY_FIX[s] || s;
}

function normMeeting(kind, v) {
    const s = String(v || '').trim();
    if (!s) return 'មិនទាន់ប្រជុំ';
    if (kind === 'a' && GENERIC_DONE.includes(s)) return MEET_DONE_A;
    if (kind === 'b' && GENERIC_DONE.includes(s)) return MEET_DONE_B;
    return s;
}

/** Bring one stored case to the canonical vocabulary. Returns true if anything changed. */
function normalizeCaseRecord(c) {
    if (!c || typeof c !== 'object') return false;
    const before = JSON.stringify([c.category, c.disputeLocation, c.locationProvince, c.partyA_location, c.partyB_location, c.meetingPartyA, c.meetingPartyB, c.mediationMeeting, c.status]);
    if (c.category) c.category = normCategory(c.category);
    ['disputeLocation', 'locationProvince', 'partyA_location', 'partyB_location', 'partyC_location'].forEach(k => { if (c[k]) c[k] = normProvince(c[k]); });
    c.meetingPartyA = normMeeting('a', c.meetingPartyA);
    c.meetingPartyB = normMeeting('b', c.meetingPartyB);
    c.mediationMeeting = normMeeting('m', c.mediationMeeting);
    // One spelling for an unsuccessful (closed without agreement) case.
    if (/^Close\b/i.test(String(c.status || ''))) c.status = 'No Settle (មិនព្រមព្រៀង)';
    const after = JSON.stringify([c.category, c.disputeLocation, c.locationProvince, c.partyA_location, c.partyB_location, c.meetingPartyA, c.meetingPartyB, c.mediationMeeting, c.status]);
    return before !== after;
}
window.normalizeCaseRecord = normalizeCaseRecord;

// Every save passes through the normaliser so all entry paths stay consistent.
if (typeof window.saveCases === 'function' && !window.saveCases.__cw) {
    const origSave = window.saveCases;
    window.saveCases = function () {
        try { (window.casesData || casesData || []).forEach(normalizeCaseRecord); } catch (e) { /* keep saving */ }
        return origSave.apply(this, arguments);
    };
    window.saveCases.__cw = true;
    try { saveCases = window.saveCases; } catch (e) { /* global binding already shared */ }
}

function normalizeAllOnce() {
    try {
        if (!Array.isArray(casesData)) return;
        let changed = 0;
        casesData.forEach(c => { if (normalizeCaseRecord(c)) changed++; });
        if (changed) {
            saveCases();
            console.info('casework: normalised', changed, 'cases');
            if (typeof renderAllViews === 'function') { try { renderAllViews(); } catch (e) { /* view not ready */ } }
        }
    } catch (e) { console.warn('casework normalise failed', e); }
}

function listCategories() {
    const sel = $('intake-dispute-type');
    const fromForm = sel ? [...sel.options].map(o => o.value).filter(Boolean) : [];
    const list = fromForm.length ? fromForm : DEFAULT_CATEGORIES.slice();
    (casesData || []).forEach(c => { const k = normCategory(c.category); if (k && !list.includes(k)) list.push(k); });
    return list;
}
function listProvinces() {
    const sel = $('intake-loc-province');
    return sel ? [...sel.options].map(o => o.value) : [];
}

/* Status helpers */
function statusKey(c) {
    const st = typeof normalizeCaseStatus === 'function' ? normalizeCaseStatus(c.status, c.isDraft) : 'mediating';
    return st === 'settled' ? 'settle' : st === 'unsuccessful' ? 'close' : st === 'shelved' ? 'pending' : st === 'draft' ? 'draft' : 'active';
}
/** Status as it was on a given day: cases closed after that day were still open then. */
function statusAsOf(c, asOf) {
    const k = statusKey(c);
    if ((k === 'settle' || k === 'close') && asOf && c.closedAt && isoDay(c.closedAt) > asOf) return 'active';
    return k;
}
function caseStart(c) { return isoDay(c.receivedDate || c.dateReceived || c.filingDate); }
/** Handling time in days (Excel column W): intake → closing date, or → as-of day while open. */
function caseDays(c, asOf) {
    const a = caseStart(c); if (!a) return null;
    const k = statusAsOf(c, asOf);
    let b;
    if (k === 'settle' || k === 'close') { if (!c.closedAt) return null; b = isoDay(c.closedAt); }
    else b = asOf || todayIso();
    const d = Math.round((new Date(b) - new Date(a)) / 86400000);
    return d >= 0 ? d : null;
}
function meetCount(c, kind) {
    const map = { a: ['meetingPartyA', 'meetingPartyACount'], b: ['meetingPartyB', 'meetingPartyBCount'], m: ['mediationMeeting', 'mediationMeetingCount'] };
    const [sk, ck] = map[kind];
    const n = parseInt(c[ck], 10);
    if (n >= 0 && String(c[ck]).trim() !== '') return n;
    const s = String(c[sk] || '');
    return s && !/មិនទាន់|មិនចូលរួម/.test(s) ? 1 : 0;
}
function officersOf(c) {
    if (Array.isArray(c.participatingOfficers) && c.participatingOfficers.length) return c.participatingOfficers;
    return [c.official1, c.official2, c.official3, c.official4, c.official5].filter(v => v && String(v).trim());
}
function isPersonal(c) { return (c.caseType || 'personal') !== 'assisting'; }

/* ---------- 2. Entry form step 4 ---------- */
function fillSelect(sel, options, value) {
    if (!sel) return;
    const opts = options.slice();
    if (value && !opts.includes(value)) opts.push(value);
    sel.innerHTML = opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
    sel.value = value || opts[0];
}
const setVal = (id, v) => { const e = $(id); if (e) e.value = v == null ? '' : v; };

function outcomeFromStatus(c) {
    const k = statusKey(c);
    if (k === 'settle') return 'settled';
    if (k === 'pending') return 'shelved';
    if (k === 'close') {
        const r = String(c.remarks || '') + ' ' + String(c.unsuccessfulReason || '');
        if (c.legacyOutcome && c.legacyOutcome.startsWith('unsuccessful')) return c.legacyOutcome;
        if (r.includes('ដកពាក្យ')) return 'unsuccessful_withdrawn';
        if (r.includes('មិនចូលរួម')) return 'unsuccessful_no_show';
        return 'unsuccessful_no_agreement';
    }
    return 'mediating';
}

function populateOutcomeTab(c) {
    c = c || {};
    $('legacy-status-box')?.classList.remove('hidden'); // openAddModal hides the old accordion box
    fillSelect($('oc-meet-a'), MEET_OPTIONS.a, normMeeting('a', c.meetingPartyA));
    fillSelect($('oc-meet-b'), MEET_OPTIONS.b, normMeeting('b', c.meetingPartyB));
    fillSelect($('oc-meet-m'), MEET_OPTIONS.m, normMeeting('m', c.mediationMeeting));
    setVal('oc-meet-a-date', isoDay(c.meetingPartyADate)); setVal('oc-meet-a-count', c.meetingPartyACount);
    setVal('oc-meet-b-date', isoDay(c.meetingPartyBDate)); setVal('oc-meet-b-count', c.meetingPartyBCount);
    setVal('oc-meet-m-date', isoDay(c.mediationMeetingDate)); setVal('oc-meet-m-count', c.mediationMeetingCount);
    setVal('oc-challenges', c.challengesNote);
    // Outcome always follows the saved status (quick status changes elsewhere do not update legacyOutcome).
    setVal('legacy-outcome', c.id ? outcomeFromStatus(c) : 'mediating');
    setVal('oc-closed-at', isoDay(c.closedAt));
    setVal('oc-closure-report', c.closureReport || '');
    setVal('oc-remarks', c.closeNote || (c.id && (statusKey(c) === 'settle' || statusKey(c) === 'close') ? 'បានបិទ' : 'មិនទាន់បិទ'));
    setVal('oc-settled-amount', c.settledAmount ? fmtNum(num(c.settledAmount), 2) : '');
    setVal('oc-settled-currency', c.settledCurrency || 'USD');
    setVal('oc-settled-land', c.settledLandHa || '');
    setVal('oc-settled-other', c.settledOther || '');
    setVal('oc-missions', c.missionCount);
    setVal('oc-minutes', c.minutesCount);
    setVal('oc-support-amount', c.supportAmount || '');
    setVal('oc-support-share', c.supportShare || '');
    setVal('oc-support-status', c.supportStatus || '');
    setVal('oc-officers', officersOf(c).join(', '));
    if (typeof caseIntakeMode !== 'undefined') { try { caseIntakeMode = 'legacy'; } catch (e) { /* ignore */ } }
    if (typeof updateLinkageBadges === 'function') updateLinkageBadges();
    ocOnOutcomeChange();
}
window.populateOutcomeTab = populateOutcomeTab;

function isClosedOutcome(o) { return o === 'settled' || String(o || '').startsWith('unsuccessful'); }

function ocOnOutcomeChange() {
    const out = $('legacy-outcome')?.value || 'mediating';
    const closed = isClosedOutcome(out);
    $('oc-closed-req')?.classList.toggle('hidden', !closed);
    const closedAt = $('oc-closed-at');
    if (closed && closedAt && !closedAt.value) closedAt.value = todayIso();
    if (!closed && closedAt) closedAt.value = '';
    const rem = $('oc-remarks');
    if (rem) rem.value = closed ? 'បានបិទ' : 'មិនទាន់បិទ';
    document.querySelectorAll('#oc-settled-amount, #oc-settled-land, #oc-settled-other, #oc-settled-currency')
        .forEach(e => { e.disabled = out !== 'settled'; e.closest('div')?.classList.toggle('oc-dim', out !== 'settled'); });
}
window.ocOnOutcomeChange = ocOnOutcomeChange;

function collectOutcomeFields() {
    const officers = ($('oc-officers')?.value || '').split(/[,،;\n]+/).map(s => s.trim()).filter(Boolean);
    const out = $('legacy-outcome')?.value || 'mediating';
    const closed = isClosedOutcome(out);
    const closedAt = closed ? ($('oc-closed-at')?.value || '') : '';
    const supportAmount = $('oc-support-amount')?.value.trim() || '';
    let supportShare = $('oc-support-share')?.value.trim() || '';
    if (supportAmount && !supportShare) supportShare = String(num(supportAmount) / 2);
    const fields = {
        meetingPartyA: $('oc-meet-a')?.value || 'មិនទាន់ប្រជុំ',
        meetingPartyADate: $('oc-meet-a-date')?.value || '',
        meetingPartyACount: $('oc-meet-a-count')?.value || '',
        meetingPartyB: $('oc-meet-b')?.value || 'មិនទាន់ប្រជុំ',
        meetingPartyBDate: $('oc-meet-b-date')?.value || '',
        meetingPartyBCount: $('oc-meet-b-count')?.value || '',
        mediationMeeting: $('oc-meet-m')?.value || 'មិនទាន់ប្រជុំ',
        mediationMeetingDate: $('oc-meet-m-date')?.value || '',
        mediationMeetingCount: $('oc-meet-m-count')?.value || '',
        challengesNote: $('oc-challenges')?.value.trim() || '',
        closureReport: $('oc-closure-report')?.value || '',
        closeNote: $('oc-remarks')?.value || '',
        settledAmount: out === 'settled' ? String(num($('oc-settled-amount')?.value) || '') : '',
        settledCurrency: $('oc-settled-currency')?.value || 'USD',
        settledLandHa: out === 'settled' ? ($('oc-settled-land')?.value.trim() || '') : '',
        settledOther: out === 'settled' ? ($('oc-settled-other')?.value.trim() || '') : '',
        missionCount: $('oc-missions')?.value || '',
        minutesCount: $('oc-minutes')?.value || '',
        supportAmount: supportAmount ? String(num(supportAmount)) : '',
        supportShare: supportShare ? String(num(supportShare)) : '',
        supportStatus: supportAmount ? ($('oc-support-status')?.value || 'unpaid') : '',
        participatingOfficers: officers,
        officerCount: officers.length,
        closedAt
    };
    for (let i = 0; i < 5; i++) fields['official' + (i + 1)] = officers[i] || '';
    if (closedAt) { fields.closedAtEstimated = false; fields.closedAtUnknown = false; }
    return fields;
}
window.collectOutcomeFields = collectOutcomeFields;

// Auto 50% share while typing the support amount.
document.addEventListener('input', e => {
    if (e.target && e.target.id === 'oc-support-amount') {
        const share = $('oc-support-share');
        if (share && !share.dataset.touched) share.value = e.target.value ? String(num(e.target.value) / 2) : '';
        const st = $('oc-support-status');
        if (st && e.target.value && !st.value) st.value = 'unpaid';
    }
    if (e.target && e.target.id === 'oc-support-share') e.target.dataset.touched = '1';
});
// Mediation finished with agreement → suggest the matching outcome.
document.addEventListener('change', e => {
    if (!e.target || e.target.id !== 'oc-meet-m') return;
    const out = $('legacy-outcome');
    if (!out || out.value !== 'mediating') return;
    if (e.target.value.includes('(ព្រមព្រៀង)')) { out.value = 'settled'; ocOnOutcomeChange(); if (typeof updateLinkageBadges === 'function') updateLinkageBadges(); toast('បានកំណត់លទ្ធផលរួម «ព្រមព្រៀង» តាមកិច្ចប្រជុំសម្រុះសម្រួល — សូមពិនិត្យថ្ងៃបិទ និងទឹកប្រាក់', 'info'); }
    else if (e.target.value.includes('(មិនព្រមព្រៀង)')) { out.value = 'unsuccessful_no_agreement'; ocOnOutcomeChange(); if (typeof updateLinkageBadges === 'function') updateLinkageBadges(); toast('បានកំណត់លទ្ធផលរួម «មិនព្រមព្រៀង» តាមកិច្ចប្រជុំសម្រុះសម្រួល', 'info'); }
});

function toast(msg, type) { if (typeof showToast === 'function') showToast(msg, type || 'info'); }

function wrapModalOpeners() {
    const oa = window.openAddModal, oe = window.openEditModal;
    if (typeof oa === 'function' && !oa.__cw) {
        window.openAddModal = function () { const r = oa.apply(this, arguments); populateOutcomeTab(null); const s = $('oc-support-share'); if (s) delete s.dataset.touched; return r; };
        window.openAddModal.__cw = true;
    }
    if (typeof oe === 'function' && !oe.__cw) {
        window.openEditModal = function (id) {
            const r = oe.apply(this, arguments);
            const c = (casesData || []).find(x => String(x.id) === String(id));
            populateOutcomeTab(c);
            const s = $('oc-support-share'); if (s) { if (c && c.supportShare) s.dataset.touched = '1'; else delete s.dataset.touched; }
            if (typeof updateWizardUI === 'function') updateWizardUI();
            return r;
        };
        window.openEditModal.__cw = true;
    }
    // Remember the form as opened, so leaving it only asks when something was changed.
    ['openAddModal', 'openEditModal'].forEach(name => {
        const fn = window[name];
        if (typeof fn !== 'function' || fn.__snap) return;
        window[name] = function () { const r = fn.apply(this, arguments); setTimeout(takeFormSnap, 400); return r; };
        window[name].__snap = true; window[name].__cw = true;
    });
    try { openAddModal = window.openAddModal; openEditModal = window.openEditModal; } catch (e) { /* ignore */ }
}

/* ---------- Leaving the entry form: save / discard / keep editing ---------- */
let formSnap = null;
function formState() {
    const form = $('case-form');
    const vals = form ? [...form.querySelectorAll('input, select, textarea')].map(e => (e.type === 'checkbox' || e.type === 'radio') ? e.checked : e.value) : [];
    let parties = '';
    try { parties = JSON.stringify([claimants, respondents, thirdParties]); } catch (e) { /* not ready */ }
    let type = '';
    try { type = currentCaseAssignmentType; } catch (e) { /* not ready */ }
    return JSON.stringify(vals) + parties + type;
}
function takeFormSnap() { formSnap = formState(); }
const formOpen = () => !!$('case-modal')?.classList.contains('open');
const formDirty = () => formSnap === null || formState() !== formSnap;
function closeForm() { $('case-modal')?.classList.remove('open'); formSnap = null; }

function leaveDialog(onSave, onDiscard) {
    let d = $('cw-leave');
    if (!d) { d = document.createElement('div'); d.id = 'cw-leave'; d.className = 'cw-modal cw-leave'; document.body.appendChild(d); }
    const editing = !!$('case-id')?.value;
    d.innerHTML = `<div class="cw-modal-box cw-leave-box">
        <div class="cw-leave-icon"><i class="fa-solid fa-floppy-disk"></i></div>
        <h3>${editing ? 'រក្សាទុកការកែសម្រួល?' : 'រក្សាទុកសំណុំរឿងនេះ?'}</h3>
        <p>លោកអ្នកមានព័ត៌មានដែលមិនទាន់បានរក្សាទុក។ តើចង់រក្សាទុកមុនចាកចេញ ឬបោះបង់?</p>
        <div class="cw-leave-actions">
            <button type="button" class="cw-btn cw-btn-ghost" data-act="stay">បន្តបញ្ចូល</button>
            <button type="button" class="cw-btn cw-btn-danger" data-act="discard"><i class="fa-solid fa-trash-can"></i> បោះបង់</button>
            <button type="button" class="cw-btn cw-btn-primary" data-act="save"><i class="fa-solid fa-check"></i> រក្សាទុក</button>
        </div></div>`;
    d.classList.add('open');
    d.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
        d.classList.remove('open');
        if (b.dataset.act === 'save') onSave();
        else if (b.dataset.act === 'discard') onDiscard();
    }));
}
/** Leave the form, asking first when it holds unsaved changes. then() runs once the form is closed. */
function leaveForm(then) {
    if (!formOpen()) { if (then) then(); return; }
    if (!formDirty()) { closeForm(); if (then) then(); return; }
    leaveDialog(
        () => {
            if (typeof handleCaseSubmit === 'function') handleCaseSubmit({ preventDefault() {} });
            // Saved only if validation passed (the form closes); otherwise stay and show what is missing.
            setTimeout(() => { if (!formOpen()) { formSnap = null; if (then) then(); } }, 250);
        },
        () => { closeForm(); if (then) then(); }
    );
}
window.cwLeaveForm = leaveForm;

function wrapNavigation() {
    const sv = window.switchView;
    if (typeof sv === 'function' && !sv.__cw) {
        window.switchView = function (viewId) {
            if (formOpen() && viewId !== 'entry-view') { leaveForm(() => sv.call(this, viewId)); return; }
            if (formOpen() && viewId === 'entry-view') return; // already entering a case
            return sv.apply(this, arguments);
        };
        window.switchView.__cw = true;
        try { switchView = window.switchView; } catch (e) { /* ignore */ }
    }
    // Close button and «បោះបង់» use the same question.
    window.closeCaseModal = function () { leaveForm(); };
    try { closeCaseModal = window.closeCaseModal; } catch (e) { /* ignore */ }
    // Saving closes the form: forget the snapshot.
    const hs = window.handleCaseSubmit;
    if (typeof hs === 'function' && !hs.__cwSnap) {
        window.handleCaseSubmit = function () { const r = hs.apply(this, arguments); if (!formOpen()) formSnap = null; return r; };
        window.handleCaseSubmit.__cwSnap = true;
        try { handleCaseSubmit = window.handleCaseSubmit; } catch (e) { /* ignore */ }
    }
}

/* ---------- 3. Validation ---------- */
function validateCaseForm() {
    const errs = [];
    let tab = null;
    const v = id => ($(id)?.value || '').trim();
    const filing = v('intake-filing-date'), assigned = v('intake-assigned-date'), received = v('intake-received-date');
    const today = todayIso();
    if (filing && filing > today) { errs.push('ថ្ងៃចុះបញ្ជី មិនអាចលើសថ្ងៃនេះ'); tab = tab || 'general'; }
    if (filing && assigned && assigned < filing) { errs.push('ថ្ងៃចាត់តាំង មិនអាចមុនថ្ងៃចុះបញ្ជី'); tab = tab || 'general'; }
    if (assigned && received && received < assigned) { errs.push('ថ្ងៃទទួលចាត់ការ មិនអាចមុនថ្ងៃចាត់តាំង'); tab = tab || 'general'; }
    if (typeof currentCaseAssignmentType !== 'undefined' && currentCaseAssignmentType === 'assisting' && !v('intake-lead-officer')) {
        errs.push('សំណុំរឿងអម ត្រូវបញ្ចូលឈ្មោះមន្ត្រីដឹកនាំ'); tab = tab || 'general';
    }
    // Duplicate case number in the same year
    const code = v('intake-case-code'), editId = v('case-id');
    const year = (filing || received || '').slice(0, 4);
    const norm = s => String(s || '').replace(/\s+/g, '').replace(/[០-៩]/g, d => '០១២៣៤៥៦៧៨៩'.indexOf(d));
    const dup = (casesData || []).find(c => String(c.id) !== editId && norm(c.caseNumber) === norm(code)
        && String(c.filingDate || c.dateReceived || '').slice(0, 4) === year);
    if (code && dup) { errs.push(`លេខសំណុំរឿង «${code}» ឆ្នាំ ${year} មានរួចហើយ (${dup.partyA_name || ''})`); tab = tab || 'general'; }

    const start = received || filing;
    [['oc-meet-a-date', 'ថ្ងៃប្រជុំភាគី «ក»'], ['oc-meet-b-date', 'ថ្ងៃប្រជុំភាគី «ខ»'], ['oc-meet-m-date', 'ថ្ងៃប្រជុំសម្រុះសម្រួល']].forEach(([id, label]) => {
        const d = v(id);
        if (d && filing && d < filing) { errs.push(`${label} មិនអាចមុនថ្ងៃចុះបញ្ជី`); tab = tab || 'outcome'; }
    });
    [['oc-meet-a', 'oc-meet-a-date', 'ភាគី «ក»'], ['oc-meet-b', 'oc-meet-b-date', 'ភាគី «ខ»'], ['oc-meet-m', 'oc-meet-m-date', 'សម្រុះសម្រួល']].forEach(([sid, did, label]) => {
        const s = v(sid);
        if (v(did) && (!s || s === 'មិនទាន់ប្រជុំ')) { errs.push(`កិច្ចប្រជុំ${label} មានថ្ងៃប្រជុំ ប៉ុន្តែស្ថានភាពនៅ «មិនទាន់ប្រជុំ»`); tab = tab || 'outcome'; }
    });
    const out = v('legacy-outcome');
    if (isClosedOutcome(out)) {
        const closedAt = v('oc-closed-at');
        if (!closedAt) { errs.push('សំណុំរឿងបិទ ត្រូវបញ្ចូលថ្ងៃខែបិទបញ្ចប់'); tab = tab || 'outcome'; }
        else {
            if (closedAt > today) { errs.push('ថ្ងៃបិទបញ្ចប់ មិនអាចលើសថ្ងៃនេះ'); tab = tab || 'outcome'; }
            if (start && closedAt < start) { errs.push('ថ្ងៃបិទបញ្ចប់ មិនអាចមុនថ្ងៃទទួលចាត់ការ'); tab = tab || 'outcome'; }
        }
    }
    if (out === 'settled' && v('oc-meet-m').includes('(មិនព្រមព្រៀង)')) { errs.push('លទ្ធផលរួម «ព្រមព្រៀង» ផ្ទុយនឹងកិច្ចប្រជុំ «មិនព្រមព្រៀង»'); tab = tab || 'outcome'; }
    if (out === 'unsuccessful_no_agreement' && v('oc-meet-m').includes('(ព្រមព្រៀង)') && !v('oc-meet-m').includes('មិន')) { errs.push('លទ្ធផលរួម «មិនព្រមព្រៀង» ផ្ទុយនឹងកិច្ចប្រជុំ «ព្រមព្រៀង»'); tab = tab || 'outcome'; }
    ['oc-meet-a-count', 'oc-meet-b-count', 'oc-meet-m-count', 'oc-missions', 'oc-minutes'].forEach(id => {
        const s = v(id); if (s && !(parseInt(s, 10) >= 0)) { errs.push('ចំនួនដង ត្រូវជាលេខ ០ ឬច្រើនជាងនេះ'); tab = tab || 'outcome'; }
    });
    ['oc-settled-amount', 'oc-settled-land', 'oc-support-amount', 'oc-support-share'].forEach(id => {
        const s = v(id); if (s && !isFinite(parseFloat(s.replace(/[,\s$៛]/g, '')))) { errs.push('ទឹកប្រាក់/ផ្ទៃដី ត្រូវជាលេខ'); tab = tab || 'outcome'; }
    });
    if (errs.length) {
        if (tab && typeof switchCaseTab === 'function') switchCaseTab(tab);
        const uniq = [...new Set(errs)];
        toast('សូមកែ៖ ' + uniq.join(' • '), 'error');
        return false;
    }
    // Meeting order: information meeting → mediation meeting → settlement minutes.
    const issues = meetingIssues({
        meetingPartyA: v('oc-meet-a'), meetingPartyADate: v('oc-meet-a-date'),
        meetingPartyB: v('oc-meet-b'), meetingPartyBDate: v('oc-meet-b-date'),
        mediationMeeting: v('oc-meet-m'), mediationMeetingDate: v('oc-meet-m-date'),
        outcome: v('legacy-outcome')
    });
    const hard = issues.filter(x => x.hard), soft = issues.filter(x => !x.hard);
    const goFill = list => { if (typeof switchCaseTab === 'function') switchCaseTab('outcome'); flagFields(list.map(x => x.field)); };
    if (hard.length) {
        goFill(hard);
        ask('មិនទាន់អាចរក្សាទុកបាន',
            'លក្ខខណ្ឌនៃការដោះស្រាយមិនទាន់គ្រប់៖\n\n' + hard.map(x => '• ' + x.msg).join('\n') + '\n\nសូមបំពេញព័ត៌មានកិច្ចប្រជុំដែលខ្វះ (ជំហាន ០៤) ជាមុនសិន។',
            () => goFill(hard), null, 'ទៅបំពេញ', 'បិទ');
        return false;
    }
    if (soft.length && !window.__cwSoftOk) {
        ask('ព័ត៌មានកិច្ចប្រជុំមិនទាន់ពេញលេញ',
            soft.map(x => '• ' + x.msg).join('\n') + '\n\nថ្ងៃប្រជុំប្រើក្នុងរបាយការណ៍ប្រចាំខែ/ត្រីមាស/ឆមាស។',
            () => goFill(soft),
            () => { window.__cwSoftOk = true; try { handleCaseSubmit({ preventDefault() {} }); } finally { window.__cwSoftOk = false; } },
            'ទៅបំពេញ', 'រក្សាទុកសិន');
        return false;
    }
    return true;
}
window.validateCaseForm = validateCaseForm;

/* Meeting prerequisites
   - a settled case (minutes issued) needs an information meeting and a mediation meeting;
   - a mediation meeting needs an information meeting first;
   - a meeting marked as held should carry its date (soft: may be saved anyway). */
const INFO_DONE = s => /^បានប្រមូលព័ត៌មាន|^បានប្រជុំប្រមូលព័ត៌មាន/.test(String(s || ''));
const MED_DONE = s => /^បានប្រជុំសម្រុះសម្រួល/.test(String(s || ''));
function meetingIssues(c) {
    const a = normMeeting('a', c.meetingPartyA), b = normMeeting('b', c.meetingPartyB), m = normMeeting('m', c.mediationMeeting);
    const info = INFO_DONE(a) || INFO_DONE(b), med = MED_DONE(m);
    const settled = c.outcome ? c.outcome === 'settled' : statusKey(c) === 'settle';
    const out = [];
    if (settled && !info) out.push({ hard: true, field: 'oc-meet-a', code: 'settle-no-info', msg: 'ព្រមព្រៀង (ចេញកំណត់ហេតុ) ប៉ុន្តែមិនទាន់មានកិច្ចប្រជុំផ្តល់ព័ត៌មាន' });
    if (settled && !med) out.push({ hard: true, field: 'oc-meet-m', code: 'settle-no-med', msg: 'ព្រមព្រៀង (ចេញកំណត់ហេតុ) ប៉ុន្តែមិនទាន់មានកិច្ចប្រជុំសម្រុះសម្រួល' });
    if (med && !info && !settled) out.push({ hard: true, field: 'oc-meet-a', code: 'med-no-info', msg: 'មានកិច្ចប្រជុំសម្រុះសម្រួល ប៉ុន្តែមិនទាន់មានកិច្ចប្រជុំផ្តល់ព័ត៌មាន' });
    if (INFO_DONE(a) && !isoDay(c.meetingPartyADate)) out.push({ field: 'oc-meet-a-date', code: 'no-date-a', msg: 'កិច្ចប្រជុំផ្តល់ព័ត៌មានភាគី «ក» មិនទាន់មានថ្ងៃប្រជុំ' });
    if (INFO_DONE(b) && !isoDay(c.meetingPartyBDate)) out.push({ field: 'oc-meet-b-date', code: 'no-date-b', msg: 'កិច្ចប្រជុំផ្តល់ព័ត៌មានភាគី «ខ» មិនទាន់មានថ្ងៃប្រជុំ' });
    if (med && !isoDay(c.mediationMeetingDate)) out.push({ field: 'oc-meet-m-date', code: 'no-date-m', msg: 'កិច្ចប្រជុំសម្រុះសម្រួល មិនទាន់មានថ្ងៃប្រជុំ' });
    return out;
}
window.cwMeetingIssues = meetingIssues;

function ask(title, msg, onYes, onNo, yes, no) {
    if (typeof customConfirm === 'function') customConfirm(title, msg, onYes, onNo, yes, no);
    else if (confirm(title + '\n\n' + msg)) { if (onYes) onYes(); } else if (onNo) onNo();
}
function flagFields(ids) {
    document.querySelectorAll('.oc-missing').forEach(e => e.classList.remove('oc-missing'));
    const els = [...new Set(ids)].map(id => $(id)).filter(Boolean);
    els.forEach(e => e.classList.add('oc-missing'));
    if (els[0]) setTimeout(() => { els[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); els[0].focus(); }, 120);
    setTimeout(() => els.forEach(e => e.classList.remove('oc-missing')), 6000);
}

/** Open a case at step 4 to fill the missing meeting details; refresh the report afterwards. */
window.cwFixCase = function (id) {
    const c = (casesData || []).find(x => String(x.id) === String(id));
    if (!c || typeof openEditModal !== 'function') return;
    openEditModal(c.id);
    setTimeout(() => {
        if (typeof switchCaseTab === 'function') switchCaseTab('outcome');
        flagFields(meetingIssues(c).map(x => x.field));
    }, 250);
    const modal = $('case-modal');
    if (modal && typeof MutationObserver !== 'undefined') {
        const mo = new MutationObserver(() => {
            if (modal.classList.contains('open')) return;
            mo.disconnect();
            if ($('reports-view')?.classList.contains('active') && typeof generateReport === 'function') generateReport(true);
        });
        mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
};

/** On-screen list of cases whose meeting data is incomplete (never printed or exported). */
function issuesBanner(list) {
    const bad = list.map(c => ({ c, iss: meetingIssues(c) })).filter(x => x.iss.length);
    if (!bad.length) return '';
    const hard = bad.filter(x => x.iss.some(i => i.hard));
    const items = bad.slice(0, 40).map(x => `<li><button type="button" class="rp2-fix" onclick="cwFixCase('${esc(x.c.id)}')">${esc(x.c.caseNumber)}</button> ${esc(x.iss.map(i => i.msg).join(' · '))}</li>`).join('');
    return `<div class="rp2-warn hide-on-export">
        <div class="rp2-warn-h"><i class="fa-solid fa-circle-exclamation"></i> ទិន្នន័យកិច្ចប្រជុំមិនទាន់គ្រប់ ${bad.length} សំណុំរឿង${hard.length ? ` (${hard.length} សំណុំរឿងខុសលក្ខខណ្ឌ)` : ''} — ចុចលេខសំណុំរឿង ដើម្បីបំពេញ</div>
        <ul>${items}</ul>${bad.length > 40 ? `<div class="rp2-tip">និង ${bad.length - 40} សំណុំរឿងទៀត</div>` : ''}
    </div>`;
}

/** Profile quick-status: marking a case settled checks the meeting prerequisites first. */
function wrapViewModal() {
    const orig = window.openViewModal;
    if (typeof orig !== 'function' || orig.__cw) return;
    window.openViewModal = function (id) {
        const r = orig.apply(this, arguments);
        const sel = $('quick-status-select');
        const c = (casesData || []).find(x => String(x.id) === String(id));
        if (sel && c && typeof sel.onchange === 'function') {
            const prevHandler = sel.onchange, prevVal = sel.value;
            sel.onchange = e => {
                if (String(e.target.value).startsWith('Settle')) {
                    const hard = meetingIssues({ ...c, outcome: 'settled' }).filter(x => x.hard);
                    if (hard.length) {
                        sel.value = prevVal;
                        ask('មិនទាន់អាចកំណត់ «ព្រមព្រៀង» បាន', hard.map(x => '• ' + x.msg).join('\n') + '\n\nសូមបំពេញព័ត៌មានកិច្ចប្រជុំជាមុនសិន។',
                            () => { $('view-modal')?.classList.remove('open'); window.cwFixCase(c.id); }, null, 'ទៅបំពេញ', 'បិទ');
                        return;
                    }
                }
                return prevHandler.call(sel, e);
            };
        }
        return r;
    };
    window.openViewModal.__cw = true;
    try { openViewModal = window.openViewModal; } catch (e) { /* ignore */ }
}

/* ---------- 4. Case profile section ---------- */
function profileOutcomeSection(c) {
    const k = statusKey(c);
    const rows = [];
    const row = (label, val) => { if (val !== '' && val != null) rows.push(`<div class="cp-kv"><span class="cp-k">${label}</span><span class="cp-v">${val}</span></div>`); };
    if (k === 'settle') {
        if (num(c.settledAmount)) row('ទឹកប្រាក់ព្រមព្រៀង', `<strong>${fmtNum(num(c.settledAmount), 2)} ${c.settledCurrency === 'KHR' ? '៛' : '$'}</strong>`);
        if (c.settledLandHa) row('ផ្ទៃដីព្រមព្រៀង', esc(c.settledLandHa) + ' ហិកតា');
        if (c.settledOther) row('លទ្ធផលផ្សេងៗ', esc(c.settledOther));
    }
    row('ការបិទបញ្ចប់', c.closureReport ? esc(c.closureReport) : '');
    row('បេសកកម្ម', c.missionCount ? esc(c.missionCount) + ' ដង' : '');
    row('កំណត់ហេតុ', c.minutesCount ? esc(c.minutesCount) + ' ច្បាប់' : '');
    if (num(c.supportAmount)) row('ការឧបត្ថម្ភ', `${fmtNum(num(c.supportAmount), 2)}$ · 50%: ${fmtNum(num(c.supportShare), 2)}$ · ${c.supportStatus === 'paid' ? 'ទូទាត់រួច' : 'មិនទាន់ទូទាត់'}`);
    if (c.challengesNote) rows.push(`<div class="cp-note"><span class="cp-k">កត់ចំណាំ/បញ្ហាប្រឈម</span><div>${esc(c.challengesNote)}</div></div>`);
    if (!rows.length) rows.push('<div class="cp-muted">មិនទាន់មានព័ត៌មានលទ្ធផល ឬសកម្មភាព — ចុច «កែសម្រួល» ជំហាន ០៤</div>');
    return `<section class="cp-section"><h4 class="cp-h"><i class="fa-solid fa-flag-checkered"></i> លទ្ធផល និងសកម្មភាព</h4>${rows.join('')}</section>`;
}
function wrapProfile() {
    const orig = window.renderCaseProfileHTML;
    if (typeof orig !== 'function' || orig.__cw) return;
    window.renderCaseProfileHTML = function (c) {
        const html = orig.apply(this, arguments);
        const at = html.lastIndexOf('</aside>');
        return at < 0 ? html : html.slice(0, at) + profileOutcomeSection(c) + html.slice(at);
    };
    window.renderCaseProfileHTML.__cw = true;
    try { renderCaseProfileHTML = window.renderCaseProfileHTML; } catch (e) { /* ignore */ }
}

/* ---------- 5. Reports ----------
   One plain table style for every report (class "rp2"):
   cells keep to one line and shrink to their text; only columns marked "w"
   (names, notes, activities) wrap and take the remaining width.
   Each report has a paper orientation (REPORT_LAYOUT) used on screen and in PDF/Word. */
const STATUS_COLS = [['active', 'កំពុងសម្រុះសម្រួល'], ['settle', 'ព្រមព្រៀង'], ['close', 'មិនព្រមព្រៀង'], ['pending', 'តម្កល់']];
const pct = (a, b) => (b ? Math.round(a * 1000 / b) / 10 : 0);
// Column headers wrap inside a capped box, so a long header does not widen its column past the data.
const th = (t, extra = '') => /colspan/.test(extra) ? `<th ${extra}>${t}</th>` : `<th ${extra}><span class="hd">${t}</span></th>`;
const REPORT_LAYOUT = {
    'monthly-progress': 'landscape', 'master-list': 'landscape', 'evaluation': 'landscape',
    'monthly-flow': 'landscape', 'activities': 'landscape',
    'period-cases': 'portrait', 'weekly': 'portrait', 'by-province': 'portrait'
};
window.cwReportLayout = type => REPORT_LAYOUT[type] || 'landscape';
const currentType = () => $('report-type')?.value || '';
/** Wrapper class for the print copy of the report paper. */
window.cwPrintClass = () => currentType() === 'monthly-progress' ? '' : `rp-print rp-${window.cwReportLayout(currentType())}`;
/** printToPDF options: A4 in the report's orientation, real size (the monthly A.D.K. report keeps its old setup). */
window.cwPdfOptions = () => {
    const type = currentType();
    // Chromium honours the CSS @page size over the landscape flag, so set it per report.
    let st = document.getElementById('cw-page-style');
    if (type === 'monthly-progress') { if (st) st.remove(); return { scale: 0.65 }; }
    if (!st) { st = document.createElement('style'); st.id = 'cw-page-style'; document.head.appendChild(st); }
    st.textContent = `@media print { @page { size: A4 ${window.cwReportLayout(type)}; margin: 11mm; } html, body { background: #fff !important; } }`;
    return { landscape: window.cwReportLayout(type) === 'landscape', scale: 1, pageSize: 'A4', printBackground: true,
        margins: { top: 0.45, bottom: 0.45, left: 0.45, right: 0.45 } };
};
const shortCat = c => String(c || '').replace(/^វិវាទ/, '');
const note = html => `<p class="rp2-note">${html}</p>`;

function reportTitle(type) {
    return {
        'master-list': 'បញ្ជីសំណុំរឿង',
        'evaluation': 'តារាងវិភាគ និងវាយតម្លៃសំណុំរឿងតាមប្រភេទវិវាទ',
        'monthly-flow': 'សំណុំរឿងចូល និងបញ្ចប់ តាមខែ',
        'by-province': 'សំណុំរឿងតាមរាជធានី/ខេត្ត',
        'activities': 'សកម្មភាព ការឧបត្ថម្ភ និងលទ្ធផលព្រមព្រៀង',
        'weekly': 'របាយការណ៍ការងារប្រចាំសប្តាហ៍'
    }[type] || '';
}
window.cwReportTitle = reportTitle;

function levelText(idx) {
    const L = (typeof AN_LEVELS !== 'undefined' ? AN_LEVELS : [{ label: 'មិនល្អ' }, { label: 'មធ្យម' }, { label: 'ល្អ' }, { label: 'ល្អណាស់' }])[idx];
    return L ? L.label : '-';
}
function speedLabel(days) {
    if (days == null) return '-';
    return days <= 90 ? 'លឿនណាស់' : days <= 180 ? 'លឿន' : days <= 270 ? 'មធ្យម' : 'យឺត';
}

function renderEvaluation(data, asOf) {
    const cats = listCategories().filter(cat => data.some(c => normCategory(c.category) === cat));
    const T = typeof anThresholds === 'function' ? anThresholds() : null;
    const up = (v, t) => (typeof anLevelUp === 'function' && t ? anLevelUp(v, t) : null);
    const down = (v, t) => (typeof anLevelDown === 'function' && t ? anLevelDown(v, t) : null);
    const avgOf = list => { const d = list.map(c => caseDays(c, asOf)).filter(x => x != null); return d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length) : null; };
    const make = (cat, list) => {
        const cnt = { active: 0, settle: 0, close: 0, pending: 0 };
        list.forEach(c => { const k = statusAsOf(c, asOf); if (cnt[k] != null) cnt[k]++; });
        return { cat, n: list.length, cnt, avg: avgOf(list) };
    };
    const rows = cats.map(cat => make(cat, data.filter(c => normCategory(c.category) === cat)));
    const tot = make('សរុប', data);
    const check = STATUS_COLS.reduce((a, [k]) => a + tot.cnt[k], 0);
    const cellNP = (r, k) => r.n ? `${r.cnt[k]} <span class="rp2-pc">(${pct(r.cnt[k], r.n)}%)</span>` : '0';
    const ev = r => {
        if (!r.n || !T) return '<td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>';
        const p = k => pct(r.cnt[k], r.n);
        return `<td>${levelText(down(p('active'), T.active))}</td><td>${levelText(up(p('settle'), T.settle))}</td><td>${levelText(down(p('close'), T.close))}</td><td>${levelText(down(p('pending'), T.pending))}</td><td>${speedLabel(r.avg)}</td>`;
    };
    const line = (r, i, isTot) => `<tr${isTot ? ' class="tot"' : ''}><td>${isTot ? '' : khDigits(i + 1)}</td><td class="l">${esc(r.cat)}</td><td>${r.n}</td><td>${pct(r.n, tot.n)}%</td>
        ${STATUS_COLS.map(([k]) => `<td>${cellNP(r, k)}</td>`).join('')}<td>${r.avg != null ? r.avg + ' ថ្ងៃ' : '-'}</td>${ev(r)}</tr>`;
    return `${check === tot.n ? '' : note(`ចំណាំ៖ ចំនួនតាមលទ្ធផល (${check}) មិនស្មើចំនួនសរុប (${tot.n})`)}
    <table class="rp2"><thead>
        <tr>${th('ល.រ', 'rowspan="2"')}${th('ប្រភេទវិវាទ', 'rowspan="2"')}${th('សរុប', 'rowspan="2"')}${th('ភាគរយ<br>នៃសរុប', 'rowspan="2"')}${th('ចំនួន (ភាគរយ)', 'colspan="4"')}${th('រយៈពេល<br>មធ្យម', 'rowspan="2"')}${th('វាយតម្លៃ', 'colspan="5"')}</tr>
        <tr>${STATUS_COLS.map(([, l]) => th(l)).join('')}${th('កំពុងសម្រុះ')}${th('ព្រមព្រៀង')}${th('មិនព្រមព្រៀង')}${th('តម្កល់')}${th('ល្បឿន')}</tr>
    </thead><tbody>${rows.map((r, i) => line(r, i)).join('')}${line(tot, 0, true)}</tbody></table>
    ${note('រយៈពេល = ពីថ្ងៃទទួលចាត់ការ ដល់ថ្ងៃបិទ (ឬដល់ថ្ងៃគិតត្រឹម បើមិនទាន់បិទ)។ កម្រិតវាយតម្លៃតាម «ការកំណត់ › លក្ខណៈវិនិច្ឆ័យវាយតម្លៃ»។ ល្បឿន៖ ៩០ថ្ងៃចុះ លឿនណាស់ · ១៨០ លឿន · ២៧០ មធ្យម · លើសនេះ យឺត។')}`;
}

function renderMonthlyFlow(data, year) {
    const cats = listCategories().filter(cat => data.some(c => normCategory(c.category) === cat));
    const inM = (d, m) => d && d.slice(0, 7) === `${year}-${String(m + 1).padStart(2, '0')}`;
    const closedDay = c => { const k = statusKey(c); return (k === 'settle' || k === 'close') && c.closedAt ? isoDay(c.closedAt) : ''; };
    const totals = cats.map(() => [0, 0]); let gIn = 0, gOut = 0;
    const body = MONTHS_KM.map((mn, m) => {
        let rIn = 0, rOut = 0;
        const cells = cats.map((cat, i) => {
            const list = data.filter(c => normCategory(c.category) === cat);
            const a = list.filter(c => inM(caseStart(c), m)).length;
            const b = list.filter(c => inM(closedDay(c), m)).length;
            totals[i][0] += a; totals[i][1] += b; rIn += a; rOut += b;
            return `<td>${a || ''}</td><td>${b || ''}</td>`;
        }).join('');
        gIn += rIn; gOut += rOut;
        return `<tr><td class="l">${mn}</td>${cells}<td>${rIn || ''}</td><td>${rOut || ''}</td></tr>`;
    }).join('');
    const unknown = data.filter(c => { const k = statusKey(c); return (k === 'settle' || k === 'close') && !c.closedAt; }).length;
    return `${note(`ឆ្នាំ ${khDigits(year)} · ចូល = ថ្ងៃទទួលចាត់ការ · បញ្ចប់ = ថ្ងៃបិទ${unknown ? ` · ${unknown} សំណុំរឿងបិទ មិនទាន់មានថ្ងៃបិទ (មិនបានរាប់)` : ''}`)}
    <table class="rp2"><thead><tr>${th('ខែ', 'rowspan="2"')}${cats.map(c => th(esc(shortCat(c)), 'colspan="2"')).join('')}${th('សរុប', 'colspan="2"')}</tr>
    <tr>${cats.map(() => th('ចូល') + th('បញ្ចប់')).join('')}${th('ចូល')}${th('បញ្ចប់')}</tr></thead>
    <tbody>${body}<tr class="tot"><td class="l">សរុប</td>${totals.map(t => `<td>${t[0]}</td><td>${t[1]}</td>`).join('')}<td>${gIn}</td><td>${gOut}</td></tr></tbody></table>`;
}

function renderByProvince(data, asOf) {
    const cats = listCategories().filter(cat => data.some(c => normCategory(c.category) === cat));
    const provs = listProvinces();
    data.forEach(c => { const p = normProvince(c.disputeLocation || c.locationProvince); if (p && !provs.includes(p)) provs.push(p); });
    const colTot = cats.map(() => 0); let g = 0, gs = 0, i = 0;
    const body = provs.map(p => {
        const list = data.filter(c => normProvince(c.disputeLocation || c.locationProvince) === p);
        if (!list.length) return '';
        const cells = cats.map((cat, j) => { const n = list.filter(c => normCategory(c.category) === cat).length; colTot[j] += n; return `<td>${n || ''}</td>`; }).join('');
        const s = list.filter(c => statusAsOf(c, asOf) === 'settle').length;
        g += list.length; gs += s;
        return `<tr><td>${khDigits(++i)}</td><td class="l">${esc(p)}</td>${cells}<td>${list.length}</td><td>${s}</td><td>${pct(s, list.length)}%</td></tr>`;
    }).join('');
    return `${note('បង្ហាញតែរាជធានី/ខេត្តដែលមានសំណុំរឿង')}
    <table class="rp2"><thead><tr>${th('ល.រ')}${th('រាជធានី/ខេត្ត')}${cats.map(c => th(esc(shortCat(c)))).join('')}${th('សរុប')}${th('ព្រមព្រៀង')}${th('អត្រា')}</tr></thead>
    <tbody>${body}<tr class="tot"><td></td><td class="l">សរុប</td>${colTot.map(n => `<td>${n}</td>`).join('')}<td>${g}</td><td>${gs}</td><td>${pct(gs, g)}%</td></tr></tbody></table>`;
}

function renderActivities(data, asOf) {
    const cats = listCategories().filter(cat => data.some(c => normCategory(c.category) === cat));
    const sum = (list, f) => list.reduce((a, c) => a + f(c), 0);
    const agg = list => {
        const P = list.filter(isPersonal), A = list.filter(c => !isPersonal(c));
        const info = l => sum(l, c => meetCount(c, 'a') + meetCount(c, 'b'));
        const med = l => sum(l, c => meetCount(c, 'm'));
        const settled = list.filter(c => statusAsOf(c, asOf) === 'settle');
        const unpaid = list.filter(c => num(c.supportAmount) && c.supportStatus !== 'paid');
        return {
            infoP: info(P), medP: med(P), infoA: info(A), medA: med(A),
            misP: sum(P, c => num(c.missionCount)), misA: sum(A, c => num(c.missionCount)),
            minP: sum(P, c => num(c.minutesCount)), minA: sum(A, c => num(c.minutesCount)),
            usd: sum(settled.filter(c => c.settledCurrency !== 'KHR'), c => num(c.settledAmount)),
            khr: sum(settled.filter(c => c.settledCurrency === 'KHR'), c => num(c.settledAmount)),
            land: sum(settled, c => num(c.settledLandHa)),
            sup: sum(list, c => num(c.supportAmount)), share: sum(list, c => num(c.supportShare)),
            unpaidN: unpaid.length, unpaid: sum(unpaid, c => num(c.supportShare))
        };
    };
    const v = (n, d = 0) => (n ? fmtNum(n, d) : '-');
    const line = (label, a, i, tot) => `<tr${tot ? ' class="tot"' : ''}><td>${tot ? '' : khDigits(i + 1)}</td><td class="l">${esc(label)}</td>
        <td>${a.infoP}</td><td>${a.medP}</td><td>${a.infoA}</td><td>${a.medA}</td>
        <td>${a.misP}</td><td>${a.misA}</td><td>${a.minP}</td><td>${a.minA}</td>
        <td>${v(a.sup, 2)}</td><td>${v(a.share, 2)}</td><td>${a.unpaidN ? a.unpaidN + ' / ' + fmtNum(a.unpaid, 2) : '-'}</td>
        <td>${v(a.usd, 2)}</td><td>${v(a.khr)}</td><td>${v(a.land, 2)}</td></tr>`;
    const body = cats.map((cat, i) => line(cat, agg(data.filter(c => normCategory(c.category) === cat)), i)).join('');
    const noCount = data.filter(c => ['a', 'b', 'm'].some(k => meetCount(c, k) && String(c[{ a: 'meetingPartyACount', b: 'meetingPartyBCount', m: 'mediationMeetingCount' }[k]] || '').trim() === '')).length;
    return `${noCount ? note(`${noCount} សំណុំរឿងមិនទាន់បញ្ចូលចំនួនដងប្រជុំ (រាប់ ១ ដង បើបានប្រជុំ)`) : ''}
    <table class="rp2"><thead>
    <tr>${th('ល.រ', 'rowspan="3"')}${th('ប្រភេទវិវាទ', 'rowspan="3"')}${th('កិច្ចប្រជុំ (ដង)', 'colspan="4"')}${th('បេសកកម្ម', 'colspan="2" rowspan="2"')}${th('កំណត់ហេតុ', 'colspan="2" rowspan="2"')}${th('ការឧបត្ថម្ភ ($)', 'colspan="3" rowspan="2"')}${th('លទ្ធផលព្រមព្រៀង', 'colspan="3" rowspan="2"')}</tr>
    <tr>${th('ផ្ទាល់ខ្លួន', 'colspan="2"')}${th('អម', 'colspan="2"')}</tr>
    <tr>${th('ព័ត៌មាន')}${th('សម្រុះ')}${th('ព័ត៌មាន')}${th('សម្រុះ')}${th('ផ្ទាល់')}${th('អម')}${th('ផ្ទាល់')}${th('អម')}${th('100%')}${th('50%')}${th('មិនទាន់ទូទាត់')}${th('ដុល្លារ')}${th('រៀល')}${th('ដី (ha)')}</tr>
    </thead><tbody>${body}${line('សរុប', agg(data), 0, true)}</tbody></table>
    ${note('មិនទាន់ទូទាត់ = ចំនួនសំណុំរឿង / ទឹកប្រាក់ 50%។ ទឹកប្រាក់ និងដីព្រមព្រៀង គិតតែសំណុំរឿងព្រមព្រៀង។')}`;
}

/** Case list: one line per case, no phone numbers or icons. */
function renderMasterList(data) {
    const last = c => {
        const m = normMeeting('m', c.mediationMeeting), b = normMeeting('b', c.meetingPartyB), a = normMeeting('a', c.meetingPartyA);
        return m !== 'មិនទាន់ប្រជុំ' ? m : b !== 'មិនទាន់ប្រជុំ' ? b : a;
    };
    const res = c => ({ settle: 'ព្រមព្រៀង', close: 'មិនព្រមព្រៀង', pending: 'តម្កល់', active: 'កំពុងសម្រុះសម្រួល' }[statusKey(c)] || '');
    const rows = data.map((c, i) => `<tr><td>${khDigits(i + 1)}</td><td>${esc(c.caseNumber)}</td><td>${fmtDayEn(c.filingDate || c.dateReceived)}</td>
        <td class="w">${esc(c.partyA_name)}</td><td class="w">${esc(c.partyB_name)}</td><td class="l">${esc(normCategory(c.category))}</td>
        <td class="l">${esc(normProvince(c.disputeLocation || c.locationProvince))}</td><td class="w">${esc(last(c))}</td>
        <td class="l">${res(c)}</td><td>${c.closedAt ? fmtDayEn(c.closedAt) : ''}</td></tr>`).join('');
    const n = k => data.filter(c => statusKey(c) === k).length;
    return `${issuesBanner(data)}${note(`សរុប ${data.length} សំណុំរឿង · កំពុងសម្រុះសម្រួល ${n('active')} · ព្រមព្រៀង ${n('settle')} · មិនព្រមព្រៀង ${n('close')} · តម្កល់ ${n('pending')}`)}
    <table class="rp2"><thead><tr>${th('ល.រ')}${th('លេខសំណុំរឿង')}${th('ថ្ងៃចុះបញ្ជី')}${th('ភាគី «ក»')}${th('ភាគី «ខ»')}${th('ប្រភេទវិវាទ')}${th('ទីតាំង')}${th('ចំណាត់ការចុងក្រោយ')}${th('លទ្ធផល')}${th('ថ្ងៃបិទ')}</tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* Weekly report */
function weekRange(val) {
    // val: "2026-W47" or a date; default = current week (Mon–Sun)
    let monday;
    const m = String(val || '').match(/^(\d{4})-W(\d{2})$/);
    if (m) {
        const y = +m[1], w = +m[2];
        const jan4 = new Date(Date.UTC(y, 0, 4));
        const dow = jan4.getUTCDay() || 7;
        monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (w - 1) * 7);
    } else {
        const d = val ? new Date(val + 'T00:00:00Z') : new Date(todayIso() + 'T00:00:00Z');
        const dow = d.getUTCDay() || 7; monday = new Date(d); monday.setUTCDate(d.getUTCDate() - dow + 1);
    }
    const iso = d => d.toISOString().slice(0, 10);
    const add = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
    return { start: iso(monday), end: iso(add(monday, 6)), nextStart: iso(add(monday, 7)), nextEnd: iso(add(monday, 13)) };
}
window.cwWeekRange = weekRange;

function renderWeekly(all, weekVal) {
    const R = weekRange(weekVal);
    const inR = (d, a, b) => d && d >= a && d <= b;
    const acts = [];
    // Meeting kind (a / b / m) so a meeting logged in both the case fields and the event history shows once.
    const meetType = k => /«ក»|ភាគី\s*ក(\s|$)/.test(k) ? 'a' : /«ខ»|ភាគី\s*ខ(\s|$)/.test(k) ? 'b' : /សម្រុះសម្រួល/.test(k) ? 'm' : '';
    const push = (c, date, kind, detail, fromHistory) => { const d = isoDay(date); if (inR(d, R.start, R.end)) acts.push({ c, d, kind, detail, fromHistory, mt: meetType(kind) }); };
    all.forEach(c => {
        push(c, c.receivedDate || c.dateReceived, 'ទទួលសំណុំរឿងថ្មី', normCategory(c.category));
        push(c, c.meetingPartyADate, 'ប្រជុំប្រមូលព័ត៌មានភាគី «ក»', normMeeting('a', c.meetingPartyA));
        push(c, c.meetingPartyBDate, 'ប្រជុំប្រមូលព័ត៌មានភាគី «ខ»', normMeeting('b', c.meetingPartyB));
        push(c, c.mediationMeetingDate, 'ប្រជុំសម្រុះសម្រួល', normMeeting('m', c.mediationMeeting));
        (Array.isArray(c.eventHistory) ? c.eventHistory : []).forEach(h => h && push(c, h.eventDate, String(h.eventName || 'កម្មវិធី').replace(/^[\d០-៩.\s]+/, ''), [h.result, h.details].filter(Boolean).join(' — '), true));
        const k = statusKey(c);
        if ((k === 'settle' || k === 'close') && c.closedAt) push(c, c.closedAt, 'បិទសំណុំរឿង', k === 'settle' ? 'ព្រមព្រៀង' + (num(c.settledAmount) ? ` ${fmtNum(num(c.settledAmount), 2)}${c.settledCurrency === 'KHR' ? '៛' : '$'}` : '') : 'មិនព្រមព្រៀង');
    });
    // Same case/day/meeting recorded twice → keep one, preferring the event-history entry (it has the result).
    const byKey = new Map();
    acts.forEach(a => {
        const key = a.c.id + '|' + a.d + '|' + (a.mt || a.kind.replace(/\s/g, ''));
        const prev = byKey.get(key);
        if (!prev || (a.fromHistory && !prev.fromHistory)) byKey.set(key, a);
    });
    const list = [...byKey.values()].sort((a, b) => a.d.localeCompare(b.d) || String(a.c.caseNumber).localeCompare(String(b.c.caseNumber), undefined, { numeric: true }));
    const plan = all.filter(c => inR(isoDay(c.caseEventDate), R.nextStart, R.nextEnd) && !['settle', 'close'].includes(statusKey(c)))
        .sort((a, b) => String(a.caseEventDate).localeCompare(String(b.caseEventDate)));
    const open = all.filter(c => ['active', 'pending'].includes(statusKey(c)));
    const noEvent = open.filter(c => !(isoDay(c.caseEventDate) >= R.start)).sort((a, b) => (caseDays(b) || 0) - (caseDays(a) || 0));
    const cnt = {
        newC: list.filter(a => a.kind === 'ទទួលសំណុំរឿងថ្មី').length,
        meet: list.filter(a => a.kind !== 'ទទួលសំណុំរឿងថ្មី' && a.kind !== 'បិទសំណុំរឿង').length,
        settled: list.filter(a => a.kind === 'បិទសំណុំរឿង' && a.detail.startsWith('ព្រមព្រៀង')).length,
        closed: list.filter(a => a.kind === 'បិទសំណុំរឿង' && !a.detail.startsWith('ព្រមព្រៀង')).length
    };
    const party = c => `${esc(c.partyA_name || '-')} និង ${esc(c.partyB_name || '-')}`;
    const lastStep = c => { const m = normMeeting('m', c.mediationMeeting), b = normMeeting('b', c.meetingPartyB); return m !== 'មិនទាន់ប្រជុំ' ? m : b !== 'មិនទាន់ប្រជុំ' ? b : normMeeting('a', c.meetingPartyA); };
    const empty = (cols, text) => `<tr><td colspan="${cols}" class="l">${text}</td></tr>`;
    return `    <table class="rp2 rp2-sum"><thead><tr>${th('សំណុំរឿងថ្មី')}${th('កិច្ចប្រជុំ/សកម្មភាព')}${th('បញ្ចប់ព្រមព្រៀង')}${th('បិទ (មិនព្រមព្រៀង)')}${th('កំពុងចាត់ការសរុប')}</tr></thead>
    <tbody><tr><td>${cnt.newC}</td><td>${cnt.meet}</td><td>${cnt.settled}</td><td>${cnt.closed}</td><td>${open.length}</td></tr></tbody></table>
    <h4 class="rp2-h">ក. សកម្មភាពបានអនុវត្តក្នុងសប្តាហ៍</h4>
    <table class="rp2"><thead><tr>${th('ល.រ')}${th('ថ្ងៃ')}${th('លេខសំណុំរឿង')}${th('ភាគី')}${th('សកម្មភាព')}${th('លទ្ធផល/កត់សម្គាល់')}</tr></thead><tbody>
    ${list.length ? list.map((a, i) => `<tr><td>${khDigits(i + 1)}</td><td>${fmtDayEn(a.d)}</td><td>${esc(a.c.caseNumber)}</td><td class="w">${party(a.c)}</td><td class="w">${esc(a.kind)}</td><td class="w">${esc(a.detail || '')}</td></tr>`).join('') : empty(6, 'មិនមានសកម្មភាពកត់ត្រាក្នុងសប្តាហ៍នេះ')}
    </tbody></table>
    <h4 class="rp2-h">ខ. ផែនការសប្តាហ៍បន្ទាប់ (${fmtDayEn(R.nextStart)} ដល់ ${fmtDayEn(R.nextEnd)})</h4>
    <table class="rp2"><thead><tr>${th('ល.រ')}${th('ថ្ងៃ')}${th('ម៉ោង')}${th('លេខសំណុំរឿង')}${th('ភាគី')}${th('កម្មវិធី')}</tr></thead><tbody>
    ${plan.length ? plan.map((c, i) => `<tr><td>${khDigits(i + 1)}</td><td>${fmtDayEn(c.caseEventDate)}</td><td>${esc(c.caseEventTime || '')}</td><td>${esc(c.caseNumber)}</td><td class="w">${party(c)}</td><td class="w">${esc(c.caseEvent || '')}</td></tr>`).join('') : empty(6, 'មិនទាន់មានកម្មវិធីគ្រោងទុក')}
    </tbody></table>
    <h4 class="rp2-h">គ. សំណុំរឿងកំពុងចាត់ការ ដែលមិនទាន់មានកម្មវិធីបន្ត (${khDigits(noEvent.length)})</h4>
    <table class="rp2"><thead><tr>${th('ល.រ')}${th('លេខសំណុំរឿង')}${th('ភាគី')}${th('ប្រភេទ')}${th('រយៈពេល')}${th('ចំណាត់ការចុងក្រោយ')}</tr></thead><tbody>
    ${noEvent.length ? noEvent.map((c, i) => `<tr><td>${khDigits(i + 1)}</td><td>${esc(c.caseNumber)}</td><td class="w">${party(c)}</td><td class="l">${esc(shortCat(normCategory(c.category)))}</td><td>${caseDays(c) != null ? caseDays(c) + ' ថ្ងៃ' : '-'}</td><td class="w">${esc(lastStep(c))}</td></tr>`).join('') : empty(6, 'គ្មាន')}
    </tbody></table>`;
}

/* Period report (monthly / quarterly / half-year): cases registered in a chosen run of months.
   Same 7 columns as the officer's "របាយការណ៍ចាត់ការសំណុំរឿង" workbook. */
const MONTHS_KM = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function periodRange() {
    const months = Math.min(12, Math.max(1, parseInt($('report-period-months')?.value, 10) || 6));
    let start = $('report-period-start')?.value || '';
    if (!/^\d{4}-\d{2}$/.test(start)) start = defaultPeriodStart(months);
    const [y, m] = start.split('-').map(Number);
    const endY = y + Math.floor((m - 1 + months - 1) / 12), endM = ((m - 1 + months - 1) % 12) + 1;
    const lastDay = new Date(Date.UTC(endY, endM, 0)).getUTCDate();
    return {
        months, y, m, endY, endM, lastDay,
        from: `${y}-${String(m).padStart(2, '0')}-01`,
        to: `${endY}-${String(endM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
}
/** Period ending with the current month (or the previous one during the first ten days). */
function defaultPeriodStart(months) {
    const t = todayIso();
    let y = +t.slice(0, 4), m = +t.slice(5, 7);
    if (+t.slice(8, 10) <= 10) { m -= 1; if (m < 1) { m = 12; y -= 1; } }
    m = m - months + 1;
    while (m < 1) { m += 12; y -= 1; }
    return `${y}-${String(m).padStart(2, '0')}`;
}
function periodTitle(R) {
    R = R || periodRange();
    const sameYear = R.y === R.endY;
    const from = `ថ្ងៃទី១ ខែ${MONTHS_KM[R.m - 1]}${sameYear ? '' : ' ' + khDigits(R.y)}`;
    const to = `ថ្ងៃទី${khDigits(R.lastDay)} ខែ${MONTHS_KM[R.endM - 1]} ${khDigits(R.endY)}`;
    return `របាយការណ៍ទិន្នន័យសំណុំរឿងទទួលបាន​រយៈពេល${khDigits(R.months)}ខែ (ចាប់ពី${from} ដល់${to})`;
}
window.cwPeriodTitle = () => periodTitle();
/** (2025) → "២០២៥"; (2026, 8) → "ខែសីហា ឆ្នាំ២០២៦" */
/** Font rules for the Word/Excel copies (they do not load theme.css). */
window.cwExportCss = () => `
    .kingdom-title h3, .kingdom-title h4, #report-header-title { font-family: 'Khmer OS Muol Light'; font-weight: normal; }
    #report-header-subtitle, .rp2-note { font-family: 'Khmer OS Siemreap'; font-style: normal; }
    table.rp2 th { font-family: 'Khmer OS Niroth'; font-weight: normal; background: #e8edf6; }
    table.rp2 td { font-family: 'Khmer OS Siemreap'; }
    table.rp2 tr.tot td { font-weight: bold; background: #eef1f7; }
    table.rp2 td.l, table.rp2 td.w { text-align: left; }
    .rp2-h { font-family: 'Khmer OS Niroth'; font-weight: normal; }
    .hide-on-export { display: none; }`;
window.cwKhYearMonth = (y, m) => (m ? `ខែ${MONTHS_KM[+m - 1]} ឆ្នាំ${khDigits(y)}` : khDigits(y));
window.cwKhDate = iso => { const d = isoDay(iso || todayIso()); return `ថ្ងៃទី${khDigits(+d.slice(8, 10))} ខែ${MONTHS_KM[+d.slice(5, 7) - 1]} ឆ្នាំ${khDigits(d.slice(0, 4))}`; };
window.cwPeriodRange = periodRange;

const fmtDayEn = iso => { const d = isoDay(iso); if (!d) return ''; return `${+d.slice(8, 10)}-${MONTHS_EN[+d.slice(5, 7) - 1]}-${d.slice(0, 4)}`; };
const metOk = (kind, status) => { const v = normMeeting(kind, status); return v !== 'មិនទាន់ប្រជុំ'; };
function periodInfoCell(c) {
    // A date only counts when the meeting status says it took place.
    const d = [metOk('b', c.meetingPartyB) && isoDay(c.meetingPartyBDate), metOk('a', c.meetingPartyA) && isoDay(c.meetingPartyADate)].filter(Boolean).sort().pop();
    if (d) return { date: d };
    if (INFO_DONE(normMeeting('a', c.meetingPartyA)) || INFO_DONE(normMeeting('b', c.meetingPartyB))) return { text: 'បានប្រមូលព័ត៌មាន (មិនទាន់កត់ថ្ងៃ)' };
    if (normMeeting('a', c.meetingPartyA) === 'ភាគីមិនចូលរួម') return { text: 'ភាគីមិនចូលរួម' };
    return { text: 'មិនទាន់ប្រមូលព័ត៌មាន' };
}
function periodMediationCell(c) {
    const d = metOk('m', c.mediationMeeting) && normMeeting('m', c.mediationMeeting) !== 'ភាគីមិនចូលរួម' ? isoDay(c.mediationMeetingDate) : '';
    if (d) return { date: d };
    const m = normMeeting('m', c.mediationMeeting), b = normMeeting('b', c.meetingPartyB);
    if (MED_DONE(m)) return { text: 'បានសម្រុះសម្រួល (មិនទាន់កត់ថ្ងៃ)' };
    if (m === 'ភាគីមិនចូលរួម') return { text: 'មិនទាន់សម្រុះសម្រួល(ភាគីមិនចូលរួម)' };
    if (b === 'ភាគីមិនចូលរួម') return { text: 'មិនទាន់សម្រុះសម្រួល(ភាគីម្ខាងទៀតមិនចូលរួម)' };
    return { text: 'មិនទាន់សម្រុះសម្រួល' };
}
function periodResult(c) {
    const k = statusKey(c);
    if (k === 'settle') return 'ចេញកំណត់ហេតុព្រមព្រៀង';
    if (k === 'close') {
        const why = [c.legacyOutcome, c.remarks, c.unsuccessfulReason, c.eventOutcome].join(' ');
        if (/withdrawn|ដកពាក្យ/.test(why)) return 'ភាគីដកពាក្យបណ្តឹង';
        if (/no_show|មិនចូលរួម/.test(why)) return 'បិទ (ភាគីមិនចូលរួម)';
        return 'បិទ (មិនព្រមព្រៀង)';
    }
    if (k === 'pending') return 'តម្កល់';
    return 'កំពុងចាត់ការ';
}
function periodCases(all, R) {
    const scope = $('report-period-scope')?.value || 'personal';
    return all.filter(c => {
        if (scope === 'personal' && !isPersonal(c)) return false;
        if (scope === 'assisting' && isPersonal(c)) return false;
        const d = isoDay(c.filingDate || c.dateReceived);
        return d && d >= R.from && d <= R.to;
    }).sort((a, b) => isoDay(a.filingDate || a.dateReceived).localeCompare(isoDay(b.filingDate || b.dateReceived))
        || String(a.caseNumber).localeCompare(String(b.caseNumber), undefined, { numeric: true }));
}
function renderPeriodCases(all) {
    const R = periodRange();
    const list = periodCases(all, R);
    // A meeting date after today is only planned: show it as text so it is not read as done.
    const today = todayIso();
    const cell = v => v.date && v.date <= today ? `<td data-date="${v.date}">${fmtDayEn(v.date)}</td>`
        : `<td class="w" contenteditable="true">${esc(v.date ? fmtDayEn(v.date) + ' (គ្រោងទុក)' : v.text)}</td>`;
    const rows = list.map((c, i) => `<tr>
        <td>${khDigits(i + 1)}</td>
        <td>${esc(c.caseNumber)}</td>
        <td data-date="${isoDay(c.filingDate || c.dateReceived)}">${fmtDayEn(c.filingDate || c.dateReceived)}</td>
        <td class="l">${esc(normCategory(c.category))}</td>
        ${cell(periodInfoCell(c))}
        ${cell(periodMediationCell(c))}
        <td class="w" contenteditable="true">${esc(periodResult(c))}</td></tr>`).join('');
    const n = k => list.filter(c => statusKey(c) === k).length;
    return `${issuesBanner(list)}<table class="rp2 rp-period-table" id="rp-period-table"><thead>
        <tr>${['ល.រ', 'លេខសំណុំរឿង', 'កាលបរិច្ឆេទចុះបញ្ជី', 'កម្មវត្ថុ', 'កាលបរិច្ឆេទប្រមូលព័ត៌មាន', 'កាលបរិច្ឆេទសម្រុះសម្រួល', 'ចំណាត់ការ/លទ្ធផល'].map(h => th(h)).join('')}</tr>
    </thead><tbody>${rows || '<tr><td colspan="7" class="l">មិនមានសំណុំរឿងចុះបញ្ជីក្នុងរយៈពេលនេះ</td></tr>'}</tbody></table>
    ${note(`សរុប ${list.length} សំណុំរឿង · ព្រមព្រៀង ${n('settle')} · បិទ ${n('close')} · កំពុងចាត់ការ ${n('active')} · តម្កល់ ${n('pending')}`)}
    <p class="rp2-tip hide-on-export">អាចចុចកែអត្ថបទក្នុងក្រឡាដែលមិនមែនជាថ្ងៃខែ មុនពេលបោះពុម្ព ឬទាញយក Excel។</p>`;
}

/** Excel file with the same layout as the officer's workbook (title row merged A1:G1, real dates). */
function exportPeriodXlsx() {
    const table = $('rp-period-table');
    if (!table || typeof XLSX === 'undefined') return false;
    const title = periodTitle();
    const serial = iso => (Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000) + 25569;
    const aoa = [[title, '', '', '', '', '', ''], [...table.querySelectorAll('thead th')].map(th => th.innerText.trim())];
    const body = [...table.querySelectorAll('tbody tr')].filter(tr => tr.children.length === 7);
    body.forEach((tr, i) => aoa.push([...tr.children].map((td, j) => {
        if (j === 0) return i + 1;
        if (j === 1) { const t = td.innerText.trim(); return /^\d+$/.test(t) && !/^0/.test(t) ? Number(t) : t; }
        const iso = td.dataset.date;
        return iso ? { t: 'n', v: serial(iso), z: 'd-mmm-yyyy' } : td.innerText.trim();
    })));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    ws['!cols'] = [6, 21, 26, 24, 22, 22, 23].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const R = periodRange();
    const name = `របាយការណ៍ចាត់ការសំណុំរឿង_${R.from.slice(0, 7)}_${R.to.slice(0, 7)}.xlsx`;
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`បានទាញយក ${name}`, 'success');
    return true;
}
window.cwExportPeriodXlsx = exportPeriodXlsx;

function wrapExcelExport() {
    const orig = window.exportReportToExcel;
    if (typeof orig !== 'function' || orig.__cw) return;
    window.exportReportToExcel = function () {
        if ($('report-type')?.value === 'period-cases' && $('rp-period-table') && exportPeriodXlsx()) return;
        return orig.apply(this, arguments);
    };
    window.exportReportToExcel.__cw = true;
    try { exportReportToExcel = window.exportReportToExcel; } catch (e) { /* ignore */ }
}

/** Called by generateReport for the new report types. */
window.cwRenderReport = function (type, data, ctx) {
    if (type === 'period-cases') return renderPeriodCases(data);
    if (type === 'master-list') return renderMasterList(data);
    const asOf = ctx.endDate && ctx.endDate < todayIso() ? ctx.endDate : todayIso();
    if (type === 'evaluation') return renderEvaluation(data, asOf);
    if (type === 'monthly-flow') return renderMonthlyFlow(data, ctx.year || todayIso().slice(0, 4));
    if (type === 'by-province') return renderByProvince(data, asOf);
    if (type === 'activities') return renderActivities(data, asOf);
    if (type === 'weekly') return renderWeekly(data, ctx.week);
    return '';
};
window.cwStatusAsOf = statusAsOf;
window.cwNormMeeting = normMeeting;
window.cwOfficersOf = officersOf;

/* ---------- 6. Import from the workbook ("Case Manage") ---------- */
let importPlan = null;

function cellText(v) {
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).replace(/\s+/g, ' ').trim();
}
function cellDate(v) {
    if (v == null || v === '') return '';
    if (v instanceof Date && !isNaN(v)) {
        // SheetJS builds dates in local time; read the local calendar day.
        return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
    }
    if (typeof v === 'number' && v > 20000 && v < 80000) {
        const d = new Date(Math.round((v - 25569) * 86400000));
        return d.toISOString().slice(0, 10);
    }
    return isoDay(v);
}
const STATUS_FROM_EXCEL = {
    settle: ['Settle (ព្រមព្រៀង)', 'settled', 'phase3'],
    close: ['No Settle (មិនព្រមព្រៀង)', 'unsuccessful_no_agreement', 'phase3'],
    pending: ['Pending (តម្កល់)', 'shelved', 'phase2'],
    active: ['Active (កំពុងសម្រុះសម្រួល)', 'mediating', 'phase2']
};

/** Read one "Case Manage" row (array indexed by column, A = 0) into a case object. */
function rowToCase(r, opts) {
    const col = L => r[XLSX.utils.decode_col(L)];
    const caseNo = cellText(col('C'));
    const partyA = cellText(col('G')), partyB = cellText(col('J'));
    if (!caseNo && !partyA) return null;
    const stRaw = cellText(col('Z')).toLowerCase();
    const st = STATUS_FROM_EXCEL[stRaw] || STATUS_FROM_EXCEL[(stRaw.match(/settle|close|pending|active/) || ['active'])[0]];
    const filing = cellDate(col('D'));
    const assigned = cellDate(col('E')) || filing;
    const received = cellDate(col('F')) || assigned || filing;
    const closed = st[1] !== 'mediating' && st[1] !== 'shelved';
    const descN = col('N');
    const officers = cellText(col('AM')).split(/[,،;\/\n]+/).map(s => s.trim()).filter(Boolean);
    const settledAmt = num(col('AP'));
    const support = num(col('AH'));
    const c = {
        originalListNo: parseInt(col('A'), 10) || undefined,
        caseNumber: caseNo,
        caseType: opts.caseType || 'personal',
        filingDate: filing, assignedDate: assigned, receivedDate: received, dateReceived: received,
        partyA_name: partyA, partyA_address: cellText(col('H')), partyA_phone: cellText(col('I')),
        partyB_name: partyB, partyB_address: cellText(col('K')), partyB_phone: cellText(col('L')),
        category: normCategory(cellText(col('M'))) || 'វិវាទជំពាក់ប្រាក់',
        claimAmount: typeof descN === 'number' && descN > 0 ? String(descN) : '',
        claimCurrency: 'USD',
        facts: typeof descN === 'string' ? cellText(descN) : '',
        disputeLocation: normProvince(cellText(col('O'))) || 'ភ្នំពេញ',
        meetingPartyA: normMeeting('a', cellText(col('P'))), meetingPartyADate: cellDate(col('Q')),
        meetingPartyB: normMeeting('b', cellText(col('R'))), meetingPartyBDate: cellDate(col('S')),
        mediationMeeting: normMeeting('m', cellText(col('T'))), mediationMeetingDate: cellDate(col('U')),
        challengesNote: cellText(col('V')) === 'គ្មាន' ? '' : cellText(col('V')),
        status: st[0], legacyOutcome: st[1], legacyPhase: st[2],
        remarks: closed ? 'បានបិទ' : 'មិនទាន់បិទ',
        closeNote: cellText(col('AC')) || (closed ? 'បានបិទ' : 'មិនទាន់បិទ'),
        closedAt: closed ? cellDate(col('AB')) : '',
        meetingPartyACount: cellText(col('AD')),
        mediationMeetingCount: cellText(col('AE')),
        missionCount: cellText(col('AF')),
        supportAmount: support ? String(support) : '',
        supportShare: num(col('AI')) ? String(num(col('AI'))) : (support ? String(support / 2) : ''),
        supportStatus: support ? (num(col('AK')) ? 'unpaid' : (num(col('AJ')) ? 'paid' : 'unpaid')) : '',
        participatingOfficers: officers, officerCount: officers.length,
        closureReport: cellText(col('AO')),
        settledAmount: st[1] === 'settled' && settledAmt ? String(settledAmt) : '',
        settledCurrency: 'USD',
        settledOther: cellText(col('AQ')),
        minutesCount: cellText(col('AR')),
        importedFrom: 'excel-case-manage'
    };
    [['meetingPartyA', 'meetingPartyADate', 'a'], ['meetingPartyB', 'meetingPartyBDate', 'b'], ['mediationMeeting', 'mediationMeetingDate', 'm']]
        .forEach(([st, dt]) => { if (c[st] === 'មិនទាន់ប្រជុំ') c[dt] = ''; });
    c.locationProvince = c.disputeLocation;
    c.partyA_location = c.disputeLocation; c.partyB_location = c.disputeLocation;
    officers.slice(0, 5).forEach((o, i) => { c['official' + (i + 1)] = o; });
    if (c.closedAt) c.closedAtEstimated = false; else if (closed) c.closedAtUnknown = true;
    c.claimants = [{ id: 1, type: 'individual', name: partyA, gender: 'ប្រុស', phone: c.partyA_phone, address: c.partyA_address, province: c.disputeLocation }];
    c.respondents = [{ id: 1, type: 'individual', name: partyB, gender: 'ប្រុស', phone: c.partyB_phone, address: c.partyB_address, province: c.disputeLocation }];
    c.thirdParties = [];
    // Row-level problems are reported in the preview, not silently fixed.
    const issues = [];
    if (!caseNo) issues.push('គ្មានលេខសំណុំរឿង');
    if (!filing) issues.push('គ្មានថ្ងៃចុះបញ្ជី');
    if (!partyB) issues.push('គ្មានភាគី «ខ»');
    if (closed && !c.closedAt) issues.push('បិទ ប៉ុន្តែគ្មានថ្ងៃបិទ');
    if (!STATUS_FROM_EXCEL[stRaw]) issues.push(`លទ្ធផល «${cellText(col('Z')) || 'ទទេ'}» → Active`);
    c.__issues = issues;
    return c;
}

function findCaseManageSheet(wb) {
    const name = wb.SheetNames.find(n => n.trim().toLowerCase() === 'case manage')
        || wb.SheetNames.find(n => { const ws = wb.Sheets[n]; return ws && ['C7', 'C8'].some(a => ws[a] && String(ws[a].v).includes('លេខសំណុំរឿង')); });
    return name ? { name, ws: wb.Sheets[name] } : null;
}

function sameCase(a, b) {
    const n = s => String(s || '').replace(/\s+/g, '').replace(/[០-៩]/g, d => '០១២៣៤៥៦៧៨៩'.indexOf(d)).replace(/^0+/, '');
    const numA = n(a.caseNumber).split('/')[0], numB = n(b.caseNumber).split('/')[0];
    if (!numA || numA !== numB) return false;
    // Same number and an overlapping year (filing or intake date — a case filed on 31 Dec is often received in January).
    const years = c => [c.filingDate, c.receivedDate, c.dateReceived].map(d => String(d || '').slice(0, 4)).filter(Boolean);
    const ya = years(a), yb = years(b);
    return !ya.length || !yb.length || ya.some(y => yb.includes(y));
}

async function readWorkbook(file) {
    const buf = await file.arrayBuffer();
    // Raw serial numbers: SheetJS Date objects can shift a day with historical time zones.
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const sh = findCaseManageSheet(wb);
    if (!sh) throw new Error('រកមិនឃើញសន្លឹក «Case Manage» (ក្បាលជួរឈរ «លេខសំណុំរឿង» នៅជួរ C)');
    // Cells such as "=TODAY()" hold the day the workbook was last saved, not a real event date.
    Object.keys(sh.ws).forEach(a => { const cell = sh.ws[a]; if (a[0] !== '!' && cell && cell.f && /\b(TODAY|NOW)\s*\(/i.test(cell.f)) delete sh.ws[a]; });
    const rows = XLSX.utils.sheet_to_json(sh.ws, { header: 1, raw: true, defval: null });
    // Data starts after the helper row "Column1, Column2…" (row 9) — or after row 8 if absent.
    let start = rows.findIndex(r => r && String(r[0] || '').trim() === 'Column1');
    start = start >= 0 ? start + 1 : 9;
    return { sheet: sh.name, rows: rows.slice(start) };
}

function openImportModal(html) {
    let m = $('cw-import-modal');
    if (!m) {
        m = document.createElement('div');
        m.id = 'cw-import-modal';
        m.className = 'cw-modal';
        document.body.appendChild(m);
    }
    m.innerHTML = `<div class="cw-modal-box">${html}</div>`;
    m.classList.add('open');
}
window.cwCloseImport = () => { $('cw-import-modal')?.classList.remove('open'); importPlan = null; };

async function handleCaseManageFile(file) {
    if (!file) return;
    if (typeof XLSX === 'undefined') { toast('បណ្ណាល័យ Excel មិនទាន់ផ្ទុក', 'error'); return; }
    let parsed;
    try { parsed = await readWorkbook(file); }
    catch (e) { toast('មិនអាចអាន Excel៖ ' + e.message, 'error'); return; }
    const caseType = $('cw-import-type')?.value || 'personal';
    const items = parsed.rows.map(r => rowToCase(r, { caseType })).filter(Boolean);
    const plan = items.map(c => {
        const existing = (casesData || []).find(x => sameCase(x, c));
        return { c, existing, action: existing ? 'fill' : (c.caseNumber ? 'add' : 'skip') };
    });
    importPlan = plan;
    const n = k => plan.filter(p => p.action === k).length;
    const issues = plan.filter(p => p.c.__issues.length);
    const rowsHtml = plan.slice(0, 400).map((p, i) => `<tr class="cw-${p.action}">
        <td>${i + 1}</td><td>${esc(p.c.caseNumber)}</td><td>${esc(p.c.filingDate)}</td><td class="rp-left">${esc(p.c.partyA_name)} / ${esc(p.c.partyB_name)}</td>
        <td>${esc(p.c.category)}</td><td>${esc({ settle: 'ព្រមព្រៀង', close: 'មិនព្រមព្រៀង', pending: 'តម្កល់', active: 'កំពុងសម្រុះ' }[statusKey(p.c)] || '')}</td>
        <td>${p.action === 'add' ? 'បន្ថែមថ្មី' : p.action === 'fill' ? 'មានរួច — បំពេញតែវាលទទេ' : 'រំលង'}</td>
        <td class="rp-left cw-issue">${esc(p.c.__issues.join(' · '))}</td></tr>`).join('');
    openImportModal(`
        <div class="cw-modal-head"><h3><i class="fa-solid fa-file-excel"></i> ពិនិត្យមុននាំចូល — សន្លឹក «${esc(parsed.sheet)}»</h3><button type="button" class="cw-x" onclick="cwCloseImport()">✕</button></div>
        <div class="cw-sum">
            <div><b>${plan.length}</b><span>ជួរទិន្នន័យ</span></div>
            <div class="cw-add"><b>${n('add')}</b><span>បន្ថែមថ្មី</span></div>
            <div class="cw-fill"><b>${n('fill')}</b><span>មានក្នុងកម្មវិធីរួច</span></div>
            <div class="cw-warn"><b>${issues.length}</b><span>ជួរមានបញ្ហា</span></div>
        </div>
        <p class="cw-help">សំណុំរឿងដែលមានរួច (លេខ និងឆ្នាំដូចគ្នា) នឹងមិនត្រូវសរសេរជាន់ទេ — កម្មវិធីបំពេញតែវាលដែលនៅទទេ (ឧ. ចំនួនប្រជុំ បេសកកម្ម ទឹកប្រាក់ព្រមព្រៀង ការឧបត្ថម្ភ)។ ប្រភេទវិវាទ និងឈ្មោះខេត្តត្រូវបានកែអក្ខរាវិរុទ្ធស្វ័យប្រវត្តិ។ ឯកសារ Backup ត្រូវបានរក្សាទុកមុននាំចូល។</p>
        <div class="cw-table-wrap"><table class="rp-table cw-table"><thead><tr><th>#</th><th>លេខ</th><th>ថ្ងៃចុះបញ្ជី</th><th>ភាគី ក / ខ</th><th>ប្រភេទ</th><th>លទ្ធផល</th><th>សកម្មភាព</th><th>បញ្ហា</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
        <div class="cw-actions"><button type="button" class="btn btn-secondary" onclick="cwCloseImport()">បោះបង់</button>
        <button type="button" class="btn btn-success" onclick="cwCommitImport()" ${n('add') + n('fill') ? '' : 'disabled'}><i class="fa-solid fa-check"></i> នាំចូល ${n('add')} ថ្មី + បំពេញ ${n('fill')}</button></div>`);
}

window.cwCommitImport = async function () {
    if (!importPlan) return;
    try { if (window.electronAPI && typeof window.electronAPI.autoBackup === 'function') await window.electronAPI.autoBackup(JSON.stringify(casesData, null, 2)); }
    catch (e) { console.warn('pre-import backup failed', e); }
    let added = 0, filled = 0;
    let nextNo = (casesData || []).reduce((m, c) => Math.max(m, parseInt(c.originalListNo, 10) || 0), 0);
    const today = todayIso();
    importPlan.forEach((p, i) => {
        const c = { ...p.c }; delete c.__issues;
        if (p.action === 'add') {
            c.id = 'case-xl-' + Date.now() + '-' + i;
            c.originalListNo = ++nextNo;
            c.createdAt = today; c.updatedAt = today;
            c.leadOfficer = ''; c.caseEvent = ''; c.caseEventDate = ''; c.caseEventTime = '';
            c.summary = c.facts; c.claims = ''; c.claimsRequests = '';
            casesData.push(c); added++;
        } else if (p.action === 'fill' && p.existing) {
            let changed = false;
            const keep = ['closedAtUnknown', 'closedAtEstimated', 'id', 'originalListNo', 'createdAt', 'status', 'legacyOutcome', 'legacyPhase', 'claimants', 'respondents', 'thirdParties', 'caseType', 'importedFrom', 'remarks'];
            Object.keys(c).forEach(k => {
                if (keep.includes(k)) return;
                const cur = p.existing[k];
                const empty = cur == null || cur === '' || (Array.isArray(cur) && !cur.length) || (k.startsWith('meeting') && cur === 'មិនទាន់ប្រជុំ') || (k === 'mediationMeeting' && cur === 'មិនទាន់ប្រជុំ');
                const val = c[k];
                const hasVal = !(val == null || val === '' || (Array.isArray(val) && !val.length) || val === 'មិនទាន់ប្រជុំ');
                if (empty && hasVal) { p.existing[k] = val; changed = true; }
            });
            // A real closing date from the workbook beats an estimate.
            if (c.closedAt && p.existing.closedAtEstimated) { p.existing.closedAt = c.closedAt; changed = true; }
            if (p.existing.closedAt) { if (p.existing.closedAtUnknown || p.existing.closedAtEstimated) changed = true; p.existing.closedAtUnknown = false; p.existing.closedAtEstimated = false; }
            if (changed) { p.existing.updatedAt = today; filled++; }
        }
    });
    saveCases();
    cwCloseImport();
    toast(`នាំចូលរួចរាល់៖ បន្ថែមថ្មី ${added} · បំពេញព័ត៌មាន ${filled} សំណុំរឿង`, 'success');
    if (typeof renderAllViews === 'function') renderAllViews();
    else if (typeof renderMasterTable === 'function') renderMasterTable();
};

window.cwHandleCaseManageFile = f => handleCaseManageFile(f);
function bindImportInput() {
    const inp = $('cw-import-file');
    if (inp && !inp.__cw) {
        inp.__cw = true;
        inp.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; handleCaseManageFile(f); e.target.value = ''; });
    }
}

/* ---------- Report controls (week picker visibility) ---------- */
function bindReportControls() {
    const typeSel = $('report-type');
    if (!typeSel || typeSel.__cw) return;
    typeSel.__cw = true;
    const periodLabel = () => { const l = $('report-period-label'); if (l) l.textContent = periodTitle().replace(/^.*?\(/, '(').replace(/\)$/, ')'); };
    const setPreset = months => {
        const sel = $('report-period-months'); if (sel) sel.value = String(months);
        const st = $('report-period-start'); if (st) st.value = defaultPeriodStart(months);
        document.querySelectorAll('.rp-period-presets button').forEach(b => b.classList.toggle('active', +b.dataset.months === months));
        periodLabel();
    };
    document.querySelectorAll('.rp-period-presets button').forEach(b => b.addEventListener('click', () => setPreset(+b.dataset.months)));
    ['report-period-start', 'report-period-months'].forEach(id => $(id)?.addEventListener('change', () => {
        const months = +($('report-period-months')?.value || 0);
        document.querySelectorAll('.rp-period-presets button').forEach(b => b.classList.toggle('active', +b.dataset.months === months));
        periodLabel();
    }));
    const sync = () => {
        const weekly = typeSel.value === 'weekly';
        const period = typeSel.value === 'period-cases';
        const pg = $('report-period-group'); if (pg) pg.style.display = period ? '' : 'none';
        if (period && !$('report-period-start')?.value) setPreset(6);
        const fg = $('report-filter-status')?.closest('.form-group'); if (fg) fg.style.display = period ? 'none' : '';
        const wg = $('report-week-group'); if (wg) wg.style.display = weekly ? '' : 'none';
        const mg = $('report-month-year')?.closest('.form-group'); if (mg) mg.style.display = (weekly || period) ? 'none' : '';
        const wk = $('report-week');
        if (weekly && wk && !wk.value) {
            const d = new Date(todayIso() + 'T00:00:00Z'); const dow = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dow);
            const y = d.getUTCFullYear(); const w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
            wk.value = `${y}-W${String(w).padStart(2, '0')}`;
        }
    };
    typeSel.addEventListener('change', sync);
    // Rebuild the report whenever a setting changes, so the paper, PDF, Word and Excel
    // always match what is selected (before, a PDF could print the previously built report).
    let regenTimer = null;
    const regen = () => {
        clearTimeout(regenTimer);
        regenTimer = setTimeout(() => {
            const sec = document.getElementById('reports-view');
            if (sec && !sec.classList.contains('active')) return;
            if (typeof generateReport === 'function') generateReport(true);
        }, 120);
    };
    ['report-type', 'report-month-year', 'report-filter-status', 'report-week', 'report-period-start', 'report-period-months', 'report-period-scope']
        .forEach(id => { const el = $(id); if (el) { el.addEventListener('change', regen); if (el.type === 'month' || el.type === 'week') el.addEventListener('input', regen); } });
    document.querySelectorAll('.rp-period-presets button').forEach(b => b.addEventListener('click', regen));
    sync();
}

function init() {
    wrapModalOpeners();
    wrapProfile();
    bindImportInput();
    bindReportControls();
    wrapExcelExport();
    wrapViewModal();
    wrapNavigation();
    normalizeAllOnce();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
else setTimeout(init, 0);
})();
