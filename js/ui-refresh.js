/* ==========================================================================
   NADR CMS Pro — UI refresh (v1.1.105)
   1. Shared helpers (Khmer digits, dates, escaping, status labels)
   2. Motto ornament (Tacteing glyph) for screen, PDF, Word and Excel
   3. Calendar page, part 1: month calendar + agenda
   4. Calendar page, part 2: the program list
   5. Notifications: toasts, confirm dialog, alert dialog
   Loaded after app.js / reports.js / casework.js; it replaces their render
   functions by assigning the global names they call.
   ========================================================================== */
(function () {
'use strict';

/* ---------- 1. Shared helpers ---------- */
const KH_DIGITS = '០១២៣៤៥៦៧៨៩';
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const KH_DAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const khNum = v => String(v == null ? '' : v).replace(/\d/g, d => KH_DIGITS[d]);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayIso = () => (typeof getTodayDateString === 'function' ? getTodayDateString() : isoOf(new Date()));
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
const dateOf = iso => new Date(String(iso).slice(0, 10) + 'T00:00:00');
/** "ថ្ងៃសុក្រ ទី២០ ខែវិច្ឆិកា ឆ្នាំ២០២៦" */
function khLongDate(iso, withWeekday = true) {
    if (!iso) return '';
    const d = dateOf(iso);
    if (isNaN(d)) return String(iso);
    return (withWeekday ? `ថ្ងៃ${KH_DAYS[d.getDay()]} ` : '') + `ទី${khNum(d.getDate())} ខែ${KH_MONTHS[d.getMonth()]} ឆ្នាំ${khNum(d.getFullYear())}`;
}
/** "២០ វិច្ឆិកា" */
const khShortDate = iso => { const d = dateOf(iso); return isNaN(d) ? String(iso || '') : `${khNum(d.getDate())} ${KH_MONTHS[d.getMonth()]}`; };
const khTime = t => (t ? khNum(String(t).slice(0, 5)) : '');

const STATUS = {
    mediating: { label: 'កំពុងសម្រុះសម្រួល', color: '#2563eb', emoji: '🔵' },
    settled: { label: 'ព្រមព្រៀង', color: '#059669', emoji: '🟢' },
    shelved: { label: 'តម្កល់', color: '#d97706', emoji: '🟠' },
    unsuccessful: { label: 'មិនព្រមព្រៀង / បិទ', color: '#dc2626', emoji: '🔴' },
    draft: { label: 'សំណុំរឿងព្រាង', color: '#64748b', emoji: '⚪' }
};
const statusOf = c => (typeof normalizeCaseStatus === 'function' ? normalizeCaseStatus(c.status, c.isDraft) : 'mediating');

/** Every case that has a program, as {c, id, date, time, desc}, sorted by date and time. */
function allEvents() {
    const list = (typeof casesData !== 'undefined' && Array.isArray(casesData)) ? casesData : [];
    return list
        .filter(c => (typeof checkCaseHasEvent === 'function' ? checkCaseHasEvent(c) : (c.caseEventDate || c.eventDate)))
        .map(c => {
            const e = typeof getCaseEventDetails === 'function' ? getCaseEventDetails(c)
                : { date: c.caseEventDate || c.eventDate || '', time: c.caseEventTime || c.eventTime || '', desc: c.caseEvent || '' };
            const date = String(e.date || c.caseEventDate || '').slice(0, 10);
            const desc = e.desc || (typeof c.caseEvent === 'string' ? c.caseEvent : '') || 'ប្រជុំសម្រុះសម្រួល';
            return { c, id: c.id, date, time: e.time || c.caseEventTime || '', desc };
        })
        .filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date))
        .sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')));
}
/** Program kind: mediation, field visit, or information / other. */
function eventKind(desc) {
    const s = String(desc || '');
    if (/ទីតាំង|បេសកកម្ម|ចុះ/.test(s)) return 'loc';
    if (/សម្រុះសម្រួល|ផ្សះផ្សា/.test(s)) return 'med';
    return 'info';
}
const partyA = c => c.partyA_name || '';
const partyB = c => c.partyB_name || '';

window.nadrUtil = { khNum, esc, khLongDate, khShortDate, khTime, todayIso, addDays, allEvents, eventKind, statusOf, STATUS, KH_MONTHS, KH_DAYS };

/* ---------- 2. Motto ornament ---------- */
/** The ornament as an <img>, centred. width in px (height follows the 17:1 shape). */
window.nadrOrnamentHTML = function (width = 190, extraStyle = '') {
    const src = window.NADR_ORNAMENT_PNG || 'images/ornament-tacteing-navy.png';
    const h = Math.round(width * 84 / 1426);
    return `<div class="nadr-orn" style="text-align:center;line-height:0;margin:2px auto 10px;${extraStyle}"><img src="${src}" alt="" width="${width}" height="${h}" style="width:${width}px;height:${h}px;display:inline-block;border:0"></div>`;
};
/** Static placeholders in index.html: <img class="nadr-orn-img"> */
function fillOrnaments(root) {
    (root || document).querySelectorAll('img.nadr-orn-img').forEach(img => {
        if (!img.getAttribute('src')) img.setAttribute('src', window.NADR_ORNAMENT_PNG || 'images/ornament-tacteing-navy.png');
    });
}

/* Word / Excel copies: an HTML document with a data: image is saved as a single-file web page
   (MHTML) so Word and Excel show the picture without needing the Tacteing font. */
function utf8Bytes(str) { return new TextEncoder().encode(str); }
function quotedPrintable(str) {
    const bytes = utf8Bytes(str.replace(/\r?\n/g, '\r\n'));
    let out = '', line = '';
    const push = tok => { if (line.length + tok.length > 75) { out += line + '=\r\n'; line = ''; } line += tok; };
    for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        if (b === 13 && bytes[i + 1] === 10) { out += line + '\r\n'; line = ''; i++; continue; }
        if ((b >= 33 && b <= 126 && b !== 61) || (b === 32 && bytes[i + 1] !== 13)) push(String.fromCharCode(b));
        else push('=' + b.toString(16).toUpperCase().padStart(2, '0'));
    }
    return out + line;
}
window.nadrOfficeBlob = function (html, kind /* 'word' | 'excel' */) {
    const parts = [];
    const body = String(html).replace(/src="data:(image\/[a-z+]+);base64,([^"]+)"/g, (m, mime, b64) => {
        const name = `nadr_files/image${parts.length + 1}.${mime === 'image/jpeg' ? 'jpg' : 'png'}`;
        parts.push({ mime, b64, name });
        return `src="${name}"`;
    });
    const type = kind === 'excel' ? 'application/vnd.ms-excel' : 'application/msword';
    if (!parts.length) return new Blob(['\ufeff', html], { type });
    const B = '----=_NextPart_NADR_' + Date.now().toString(16);
    let mht = `MIME-Version: 1.0\r\nContent-Type: multipart/related; boundary="${B}"; type="text/html"\r\n\r\n`;
    mht += `--${B}\r\nContent-Location: file:///C:/NADR/report.htm\r\nContent-Transfer-Encoding: quoted-printable\r\nContent-Type: text/html; charset="utf-8"\r\n\r\n`;
    mht += quotedPrintable(body.replace(/<meta charset=['"]?utf-8['"]?>/i, '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">')) + '\r\n\r\n';
    parts.forEach(p => {
        mht += `--${B}\r\nContent-Location: file:///C:/NADR/${p.name}\r\nContent-Transfer-Encoding: base64\r\nContent-Type: ${p.mime}\r\n\r\n`;
        mht += p.b64.replace(/(.{76})/g, '$1\r\n') + '\r\n\r\n';
    });
    mht += `--${B}--\r\n`;
    return new Blob([mht], { type });
};

/* ---------- 3. Calendar, part 1 ---------- */
const CV_TAB_KEY = 'nadr_cv_tab';
function setCvTab(which) {
    const cal = document.getElementById('cv-part-cal'), list = document.getElementById('cv-part-list');
    if (!cal || !list) return;
    cal.classList.toggle('hidden', which !== 'cal');
    list.classList.toggle('hidden', which !== 'list');
    document.querySelectorAll('#calendar-view .cv-tab').forEach(t => t.classList.toggle('active', t.dataset.cv === which));
    try { localStorage.setItem(CV_TAB_KEY, which); } catch (e) { /* storage off */ }
}
window.setCalendarPart = setCvTab;

function eventChip(e, today) {
    const past = e.date < today;
    const kind = eventKind(e.desc);
    const st = statusOf(e.c);
    const done = !!e.c.eventOutcome;
    return `<button type="button" class="cv-chip cv-k-${kind}${past ? ' is-past' : ''}" data-evt="${esc(e.id)}" data-tip="${esc(e.c.caseNumber)} · ${esc(e.desc)}${e.time ? ' · ម៉ោង ' + esc(e.time) : ''}">
        <i class="cv-chip-dot" style="background:${STATUS[st] ? STATUS[st].color : '#64748b'}"></i>
        <b>${esc(e.c.caseNumber)}</b>
        <span>${e.time ? esc(e.time) + ' · ' : ''}${esc(e.desc)}</span>
        ${past && done ? '<i class="fa-solid fa-circle-check cv-chip-ok"></i>' : ''}
    </button>`;
}

window.renderCalendar = function () {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-month-year');
    if (!grid || !title) return;
    const base = (typeof currentCalDate !== 'undefined' && currentCalDate instanceof Date) ? currentCalDate : new Date();
    const y = base.getFullYear(), m = base.getMonth();
    title.textContent = `ខែ${KH_MONTHS[m]} ឆ្នាំ${khNum(y)}`;

    const byDate = {};
    const evts = allEvents();
    evts.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
    const today = todayIso();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const cells = Math.ceil((first + days) / 7) * 7;
    let monthCount = 0;
    let html = '';
    for (let i = 0; i < cells; i++) {
        const dayNum = i - first + 1;
        const wd = i % 7;
        const weekend = wd === 0 || wd === 6 ? ' is-weekend' : '';
        if (dayNum < 1 || dayNum > days) {
            const n = dayNum < 1 ? prevDays + dayNum : dayNum - days;
            html += `<div class="cv-day is-other${weekend}"><div class="cv-day-top"><span class="cv-dnum">${khNum(n)}</span></div></div>`;
            continue;
        }
        const iso = `${y}-${pad(m + 1)}-${pad(dayNum)}`;
        const list = byDate[iso] || [];
        monthCount += list.length;
        const cls = 'cv-day' + weekend + (iso === today ? ' is-today' : '') + (list.length ? ' has-evt' : '') + (iso < today ? ' is-before' : '');
        const shown = list.slice(0, 3).map(e => eventChip(e, today)).join('');
        const more = list.length > 3 ? `<button type="button" class="cv-more" data-day="${iso}">+${khNum(list.length - 3)} ទៀត</button>` : '';
        html += `<div class="${cls}" data-date="${iso}" role="button" tabindex="0" aria-label="${esc(khLongDate(iso))}">
            <div class="cv-day-top">
                <span class="cv-dnum">${khNum(dayNum)}</span>
                ${iso === today ? '<span class="cv-today-tag">ថ្ងៃនេះ</span>' : ''}
                ${list.length ? `<span class="cv-dcount">${khNum(list.length)}</span>` : ''}
            </div>
            <div class="cv-evts">${shown}${more}</div>
            <i class="cv-add fa-solid fa-plus" aria-hidden="true"></i>
        </div>`;
    }
    grid.innerHTML = html;
    const stat = document.getElementById('cv-month-stat');
    if (stat) stat.innerHTML = monthCount ? `<i class="fa-regular fa-calendar-check"></i> កម្មវិធី <b>${khNum(monthCount)}</b> ក្នុងខែនេះ` : '<i class="fa-regular fa-calendar"></i> មិនទាន់មានកម្មវិធីក្នុងខែនេះ';
    renderAgenda(evts);
};

function renderAgenda(evts) {
    const body = document.getElementById('cv-agenda-body');
    if (!body) return;
    const today = todayIso(), end = addDays(today, 7), tomorrow = addDays(today, 1);
    const soon = evts.filter(e => e.date >= today && e.date <= end);
    const pendingPast = evts.filter(e => e.date < today && !e.c.eventOutcome).length;
    const later = evts.filter(e => e.date > end).length;
    let html = '';
    if (!soon.length) {
        html += `<div class="cv-agenda-empty"><i class="fa-regular fa-calendar-check"></i><b>មិនមានកម្មវិធីក្នុង ៧ ថ្ងៃខាងមុខ</b><span>ចុចលើថ្ងៃណាមួយក្នុងប្រតិទិន ដើម្បីបន្ថែមកម្មវិធី</span></div>`;
    } else {
        let lastDate = '';
        soon.forEach(e => {
            if (e.date !== lastDate) {
                lastDate = e.date;
                const label = e.date === today ? 'ថ្ងៃនេះ' : e.date === tomorrow ? 'ថ្ងៃស្អែក' : `ថ្ងៃ${KH_DAYS[dateOf(e.date).getDay()]}`;
                html += `<div class="cv-ag-date${e.date === today ? ' is-today' : ''}"><b>${label}</b><span>${khShortDate(e.date)}</span></div>`;
            }
            html += `<button type="button" class="cv-ag-item cv-k-${eventKind(e.desc)}" data-evt="${esc(e.id)}">
                <span class="cv-ag-time">${e.time ? khTime(e.time) : '—'}</span>
                <span class="cv-ag-main">
                    <b>${esc(e.desc)}</b>
                    <small><span class="cv-ag-no">${esc(e.c.caseNumber)}</span> ${esc(partyA(e.c))}${partyB(e.c) ? ' · ' + esc(partyB(e.c)) : ''}</small>
                    ${e.c.disputeLocation ? `<small class="cv-ag-loc"><i class="fa-solid fa-location-dot"></i> ${esc(e.c.disputeLocation)}</small>` : ''}
                </span>
            </button>`;
        });
    }
    const foot = [];
    if (later) foot.push(`<button type="button" class="cv-ag-link" data-goto="upcoming"><i class="fa-regular fa-calendar-plus"></i> កម្មវិធីក្រោយនេះទៀត ${khNum(later)}</button>`);
    if (pendingPast) foot.push(`<button type="button" class="cv-ag-link is-warn" data-goto="past"><i class="fa-solid fa-clipboard-check"></i> កន្លងផុត មិនទាន់កត់លទ្ធផល ${khNum(pendingPast)}</button>`);
    if (foot.length) html += `<div class="cv-ag-foot">${foot.join('')}</div>`;
    body.innerHTML = html;
    const sub = document.getElementById('cv-agenda-sub');
    if (sub) sub.textContent = soon.length ? `${khNum(soon.length)} កម្មវិធី · ថ្ងៃនេះ ដល់ ${khShortDate(end)}` : 'ថ្ងៃនេះ និង ៧ ថ្ងៃខាងមុខ';
}

/* ---------- 4. Calendar, part 2: the program list ---------- */
function outcomeCell(c) {
    const map = {
        settled: ['cv-oc-green', 'fa-handshake', 'ព្រមព្រៀង'],
        unsuccessful: ['cv-oc-red', 'fa-circle-xmark', 'មិនជោគជ័យ'],
        shelved: ['cv-oc-amber', 'fa-folder-closed', 'តម្កល់'],
        continued: ['cv-oc-blue', 'fa-rotate', 'បន្តប្រជុំ']
    };
    const o = map[c.eventOutcome];
    if (o) return `<span class="cv-oc ${o[0]}"><i class="fa-solid ${o[1]}"></i> ${o[2]}</span><button type="button" class="cv-ibtn cv-ibtn-sm" data-act="outcome" data-tip="កែប្រែលទ្ធផល"><i class="fa-solid fa-pen"></i></button>`;
    return `<button type="button" class="cv-record" data-act="outcome"><i class="fa-solid fa-clipboard-check"></i> កត់ត្រាលទ្ធផល</button>`;
}

window.renderUpcomingEventsTable = function () {
    const tbody = document.getElementById('upcoming-events-tbody');
    if (!tbody) return;
    const filter = typeof currentUpcomingEventFilter !== 'undefined' ? currentUpcomingEventFilter : 'all';
    const query = (typeof upcomingEventSearchQuery !== 'undefined' ? upcomingEventSearchQuery : '').toLowerCase().trim();
    const today = todayIso();
    const all = allEvents();
    const counts = { all: all.length, today: 0, upcoming: 0, past: 0 };
    all.forEach(e => { if (e.date === today) counts.today++; else if (e.date > today) counts.upcoming++; else counts.past++; });
    const rows = all.filter(e => {
        if (filter === 'today' && e.date !== today) return false;
        if (filter === 'upcoming' && !(e.date > today)) return false;
        if (filter === 'past' && !(e.date < today)) return false;
        if (!query) return true;
        return [e.c.caseNumber, partyA(e.c), partyB(e.c), e.c.disputeLocation, e.desc].some(v => String(v || '').toLowerCase().includes(query));
    });
    // past programs: newest first; the rest: soonest first
    if (filter === 'past') rows.reverse();

    const tabCount = document.getElementById('cv-list-count');
    if (tabCount) tabCount.textContent = khNum(counts.upcoming + counts.today);
    const showing = document.getElementById('upcoming-events-showing-text');
    if (showing) showing.innerHTML = `បង្ហាញកម្មវិធី <strong>${khNum(rows.length)}</strong> នៃ <strong>${khNum(all.length)}</strong>`;
    const sum = document.getElementById('upcoming-events-summary');
    if (sum) {
        const pill = (key, label, cls) => `<button type="button" class="cv-pill ${cls}${filter === key ? ' active' : ''}" onclick="filterUpcomingEvents('${key}')"><i class="cv-pill-dot"></i>${label}<b>${khNum(counts[key])}</b></button>`;
        sum.innerHTML = pill('all', 'ទាំងអស់', 'p-all') + pill('today', 'ថ្ងៃនេះ', 'p-today') + pill('upcoming', 'ខាងមុខ', 'p-up') + pill('past', 'កន្លងផុត', 'p-past');
    }
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="cv-empty"><i class="fa-regular fa-calendar-xmark"></i><b>មិនមានកម្មវិធីត្រូវនឹងលក្ខខណ្ឌនេះទេ</b></td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(e => {
        const c = e.c;
        const st = statusOf(c);
        const when = e.date === today ? ['is-today', '<span class="cv-st cv-st-today"><i class="cv-pulse"></i> ថ្ងៃនេះ</span>']
            : e.date > today ? ['is-up', '<span class="cv-st cv-st-up"><i class="fa-regular fa-calendar-check"></i> បានរៀបចំ</span>']
            : ['is-past', '<span class="cv-st cv-st-past"><i class="fa-solid fa-clock-rotate-left"></i> កន្លងផុត</span>'];
        return `<tr class="cv-row ${when[0]}" data-id="${esc(c.id)}">
            <td class="tc"><span class="cv-no" style="--c:${STATUS[st] ? STATUS[st].color : '#64748b'}">${esc(c.originalListNo || '-')}</span></td>
            <td><div class="cv-when"><b>${khShortDate(e.date)} ${khNum(e.date.slice(0, 4))}</b><span><i class="fa-regular fa-clock"></i> ${e.time ? 'ម៉ោង ' + khTime(e.time) : 'មិនកំណត់ម៉ោង'} · ${KH_DAYS[dateOf(e.date).getDay()]}</span></div></td>
            <td><span class="cv-caseno">${esc(c.caseNumber)}</span></td>
            <td><span class="cv-prog cv-k-${eventKind(e.desc)}">${esc(e.desc)}</span></td>
            <td><div class="cv-parties"><span><i class="cv-pa">ក</i>${esc(partyA(c)) || '—'}</span><span><i class="cv-pb">ខ</i>${esc(partyB(c)) || '—'}</span></div></td>
            <td><span class="cv-loc"><i class="fa-solid fa-location-dot"></i> ${esc(c.disputeLocation || 'មិនមាន')}</span></td>
            <td class="tc">${when[1]}</td>
            <td class="tc"><div class="cv-oc-wrap">${outcomeCell(c)}</div></td>
            <td class="tc"><div class="cv-acts">
                <button type="button" class="cv-ibtn" data-act="edit" data-tip="កែប្រែកម្មវិធី"><i class="fa-solid fa-pen-to-square"></i></button>
                <button type="button" class="cv-ibtn cv-ibtn-del" data-act="delete" data-tip="លុបកម្មវិធី"><i class="fa-solid fa-trash-can"></i></button>
            </div></td>
        </tr>`;
    }).join('');
};

function bindCalendarPage() {
    const sec = document.getElementById('calendar-view');
    if (!sec || sec.__cv) return;
    sec.__cv = true;
    sec.addEventListener('click', ev => {
        const tab = ev.target.closest('.cv-tab');
        if (tab) { setCvTab(tab.dataset.cv); return; }
        const chip = ev.target.closest('[data-evt]');
        if (chip) { ev.stopPropagation(); if (typeof openEventResultModal === 'function') openEventResultModal(chip.dataset.evt); return; }
        const more = ev.target.closest('.cv-more');
        if (more) {
            ev.stopPropagation();
            setCvTab('list');
            const input = document.getElementById('upcoming-event-search');
            if (input) input.value = '';
            if (typeof filterUpcomingEvents === 'function') filterUpcomingEvents(more.dataset.day < todayIso() ? 'past' : 'all');
            return;
        }
        const go = ev.target.closest('[data-goto]');
        if (go) { setCvTab('list'); if (typeof filterUpcomingEvents === 'function') filterUpcomingEvents(go.dataset.goto); return; }
        const day = ev.target.closest('.cv-day[data-date]');
        if (day && typeof openCalendarEventModal === 'function') { openCalendarEventModal(day.dataset.date); return; }
        const row = ev.target.closest('tr.cv-row');
        if (row) {
            const id = row.dataset.id;
            const act = ev.target.closest('[data-act]');
            if (act) {
                ev.stopPropagation();
                const e = allEvents().find(x => String(x.id) === String(id));
                if (act.dataset.act === 'edit' && typeof openCalendarEventModal === 'function') openCalendarEventModal(e ? e.date : todayIso(), id);
                else if (act.dataset.act === 'delete' && typeof confirmDeleteEvent === 'function') confirmDeleteEvent(id);
                else if (act.dataset.act === 'outcome' && typeof openOutcomeModal === 'function') openOutcomeModal(id);
                return;
            }
            if (typeof openViewModal === 'function') openViewModal(id);
        }
    });
    sec.addEventListener('keydown', ev => {
        if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.cv-day[data-date]')) { ev.preventDefault(); ev.target.click(); }
    });
    const todayBtn = document.getElementById('btn-today-month');
    if (todayBtn) todayBtn.addEventListener('click', () => {
        try { currentCalDate = new Date(); } catch (e) { /* not reachable */ }
        window.renderCalendar();
    });
    let saved = 'cal';
    try { saved = localStorage.getItem(CV_TAB_KEY) || 'cal'; } catch (e) { /* storage off */ }
    setCvTab(saved === 'list' ? 'list' : 'cal');
}

/* ---------- 5. Notifications ---------- */
const TOAST_META = {
    success: { icon: 'fa-circle-check', title: 'ជោគជ័យ' },
    error: { icon: 'fa-circle-exclamation', title: 'មានបញ្ហា' },
    warning: { icon: 'fa-triangle-exclamation', title: 'សូមពិនិត្យ' },
    info: { icon: 'fa-circle-info', title: 'ព័ត៌មាន' }
};
window.showToast = function (message, type = 'info') {
    let box = document.getElementById('toast-container');
    if (!box) { box = document.createElement('div'); box.id = 'toast-container'; document.body.appendChild(box); }
    box.className = 'toast-container nt-stack';
    const t = TOAST_META[type] ? type : 'info';
    const meta = TOAST_META[t];
    const ms = t === 'error' ? 6500 : 4200;
    // the same message twice in a row: refresh the one on screen instead of stacking
    const last = box.lastElementChild;
    if (last && last.dataset.msg === String(message) && last.dataset.type === t) { last.__restart && last.__restart(); return; }
    const el = document.createElement('div');
    el.className = `nt-toast nt-${t}`;
    el.dataset.msg = String(message); el.dataset.type = t;
    el.setAttribute('role', t === 'error' ? 'alert' : 'status');
    el.innerHTML = `<span class="nt-ic"><i class="fa-solid ${meta.icon}"></i></span>
        <div class="nt-txt"><b>${meta.title}</b><span>${message}</span></div>
        <button type="button" class="nt-x" aria-label="បិទ"><i class="fa-solid fa-xmark"></i></button>
        <i class="nt-bar" style="animation-duration:${ms}ms"></i>`;
    box.appendChild(el);
    while (box.children.length > 4) box.firstElementChild.remove();
    let timer = null, left = ms, started = Date.now();
    const close = () => { clearTimeout(timer); el.classList.add('nt-out'); setTimeout(() => el.remove(), 260); };
    const run = () => { started = Date.now(); timer = setTimeout(close, left); };
    el.__restart = () => { clearTimeout(timer); left = ms; const bar = el.querySelector('.nt-bar'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; bar.style.animationDuration = ms + 'ms'; run(); };
    el.addEventListener('mouseenter', () => { clearTimeout(timer); left -= Date.now() - started; el.classList.add('nt-paused'); });
    el.addEventListener('mouseleave', () => { el.classList.remove('nt-paused'); run(); });
    el.querySelector('.nt-x').onclick = close;
    run();
};

/** Confirm dialog: same signature as app.js customConfirm; tone from the wording. */
const DANGER = /លុប|ចាកចេញ|បោះបង់|សម្អាត|ស្ដារ|ស្តារ|ជំនួស|អាសន្ន|delete|remove|logout/i;
function buildConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal || modal.__nt) return modal;
    modal.__nt = true;
    modal.removeAttribute('style');
    modal.className = 'modal-overlay nt-overlay';
    modal.innerHTML = `<div class="nt-dialog" role="alertdialog" aria-modal="true" aria-labelledby="custom-confirm-title" aria-describedby="custom-confirm-message">
        <div class="nt-dialog-band"></div>
        <div id="custom-confirm-icon" class="nt-dialog-ic"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3 id="custom-confirm-title">បញ្ជាក់សកម្មភាព</h3>
        <p id="custom-confirm-message"></p>
        <div class="nt-dialog-btns">
            <button type="button" class="nt-btn nt-btn-ghost" id="btn-confirm-no"><i class="fa-solid fa-xmark"></i> បោះបង់</button>
            <button type="button" class="nt-btn nt-btn-primary" id="btn-confirm-yes"><i class="fa-solid fa-check"></i> យល់ព្រម</button>
        </div>
    </div>`;
    modal.addEventListener('mousedown', e => { if (e.target === modal) modal.__cancel && modal.__cancel(); });
    return modal;
}
window.customConfirm = function (title, message, onYes, onNo, yesText = 'យល់ព្រម', noText = 'បោះបង់') {
    const modal = buildConfirm();
    if (!modal) { if (confirm(`${title}\n\n${message}`)) { if (onYes) onYes(); } else if (onNo) onNo(); return; }
    const danger = DANGER.test(String(title) + ' ' + String(yesText));
    const dlg = modal.querySelector('.nt-dialog');
    dlg.classList.toggle('is-danger', danger);
    dlg.classList.toggle('is-info', !danger);
    const ic = document.getElementById('custom-confirm-icon');
    const isLogout = /ចាកចេញ/.test(title);
    ic.innerHTML = `<i class="fa-solid ${isLogout ? 'fa-right-from-bracket' : danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i>`;
    document.getElementById('custom-confirm-title').textContent = title || 'ការបញ្ជាក់';
    document.getElementById('custom-confirm-message').textContent = message || 'តើលោកអ្នកពិតជាចង់បន្តសកម្មភាពនេះមែនទេ?';
    const yes = document.getElementById('btn-confirm-yes'), no = document.getElementById('btn-confirm-no');
    const yes2 = yes.cloneNode(false), no2 = no.cloneNode(false);
    yes2.className = 'nt-btn ' + (danger ? 'nt-btn-danger' : 'nt-btn-primary');
    yes2.innerHTML = `<i class="fa-solid ${isLogout ? 'fa-right-from-bracket' : 'fa-check'}"></i> ${esc(yesText)}`;
    no2.innerHTML = `<i class="fa-solid fa-xmark"></i> ${esc(noText)}`;
    yes.replaceWith(yes2); no.replaceWith(no2);
    const finish = ok => {
        modal.classList.remove('open');
        document.removeEventListener('keydown', onKey, true);
        modal.__cancel = null;
        if (ok) { if (onYes) onYes(); } else if (onNo) onNo();
    };
    const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); finish(true); }
    };
    yes2.addEventListener('click', () => finish(true));
    no2.addEventListener('click', () => finish(false));
    modal.__cancel = () => finish(false);
    document.addEventListener('keydown', onKey, true);
    modal.classList.add('open');
    setTimeout(() => (danger ? no2 : yes2).focus(), 30);
};

/** alert(): the same look as the confirm dialog, one button. */
const nativeAlert = window.alert.bind(window);
window.nadrAlert = function (message, title) {
    let box = document.getElementById('nt-alert');
    if (!box) {
        box = document.createElement('div');
        box.id = 'nt-alert';
        box.className = 'nt-overlay nt-alert-overlay';
        box.innerHTML = `<div class="nt-dialog is-info" role="alertdialog" aria-modal="true">
            <div class="nt-dialog-band"></div>
            <div class="nt-dialog-ic"><i class="fa-solid fa-bell"></i></div>
            <h3 class="nt-alert-title"></h3><p class="nt-alert-msg"></p>
            <div class="nt-dialog-btns"><button type="button" class="nt-btn nt-btn-primary nt-alert-ok"><i class="fa-solid fa-check"></i> យល់ហើយ</button></div>
        </div>`;
        document.body.appendChild(box);
        box.querySelector('.nt-alert-ok').onclick = () => box.classList.remove('open');
        box.addEventListener('keydown', e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); box.classList.remove('open'); } });
    }
    const text = String(message == null ? '' : message);
    const warn = /បរាជ័យ|កំហុស|error|មិនអាច|មិនត្រឹមត្រូវ|សូម/i.test(text);
    box.querySelector('.nt-dialog').classList.toggle('is-danger', warn);
    box.querySelector('.nt-dialog').classList.toggle('is-info', !warn);
    box.querySelector('.nt-dialog-ic').innerHTML = `<i class="fa-solid ${warn ? 'fa-circle-exclamation' : 'fa-bell'}"></i>`;
    box.querySelector('.nt-alert-title').textContent = title || (warn ? 'សូមពិនិត្យ' : 'ជូនដំណឹង');
    box.querySelector('.nt-alert-msg').textContent = text;
    box.classList.add('open');
    setTimeout(() => box.querySelector('.nt-alert-ok').focus(), 30);
};
window.alert = function (message) {
    try { window.nadrAlert(message); } catch (e) { nativeAlert(message); }
};

/* ---------- Start ---------- */
function init() {
    // the black ornament tints with CSS masks (gold on the login screen)
    if (window.NADR_ORNAMENT_MASK) document.documentElement.style.setProperty('--nr-orn-mask', `url("${window.NADR_ORNAMENT_MASK}")`);
    fillOrnaments();
    bindCalendarPage();
    buildConfirm();
    if (document.getElementById('calendar-grid')) { window.renderCalendar(); window.renderUpcomingEventsTable(); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
