/* ==========================================================================
   NADR CMS Pro — Telegram send center
   One dialog for every page that has information worth sending:

     page / menu            what is sent                         default
     ---------------------  -----------------------------------  ----------
     ផ្ទាំងដើម (stats)       statistics summary                   text
     បញ្ជីសំណុំរឿង (cases)    the filtered case list               text + PDF
     កាលវិភាគប្រជុំ (calendar) programs of 7 days / month / ahead   text (+ PDF)
     របាយការណ៍ (report)      the report on screen                 PDF
     សំណុំរឿងមួយ (case)       one case's details                   text

   Formats: text message (read on the phone), PDF (official, to read / print),
   Word (to edit further), Excel (to sort / count). Files use the official
   header: Kingdom, motto, the Tacteing ornament, title, signature block.
   ========================================================================== */
(function () {
'use strict';
const U = () => window.nadrUtil;
const $ = id => document.getElementById(id);
const tgEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LINE = '━━━━━━━━━━━━━━━━';

const FORMATS = {
    text: { icon: 'fa-solid fa-message', label: 'សារអក្សរ', hint: 'អានលឿនលើទូរស័ព្ទ' },
    pdf: { icon: 'fa-solid fa-file-pdf', label: 'PDF', hint: 'ទម្រង់ផ្លូវការ សម្រាប់អាន និងបោះពុម្ព' },
    word: { icon: 'fa-solid fa-file-word', label: 'Word', hint: 'សម្រាប់កែសម្រួលបន្ត' },
    excel: { icon: 'fa-solid fa-file-excel', label: 'Excel', hint: 'សម្រាប់តម្រង និងរាប់ទិន្នន័យ' }
};

function officerName() {
    return localStorage.getItem('nadr_user_profile_name') || localStorage.getItem('nadr_auth_user_name') || sessionStorage.getItem('nadr_auth_user_name') || '';
}
function caseList(source) {
    const all = (typeof casesData !== 'undefined' && Array.isArray(casesData)) ? casesData : [];
    if (source === 'cases') return Array.isArray(window.filteredCasesCache) && window.filteredCasesCache.length ? window.filteredCasesCache : all;
    return all;
}
function statusCounts(list) {
    const n = { mediating: 0, settled: 0, shelved: 0, unsuccessful: 0, draft: 0 };
    list.forEach(c => { const k = U().statusOf(c); n[k] = (n[k] || 0) + 1; });
    return n;
}
function nextEventOf(c) {
    if (typeof checkCaseHasEvent === 'function' && !checkCaseHasEvent(c)) return null;
    const e = typeof getCaseEventDetails === 'function' ? getCaseEventDetails(c) : { date: c.caseEventDate, time: c.caseEventTime, desc: c.caseEvent };
    return e && e.date ? e : null;
}

/* ---------- Calendar range ---------- */
function calendarEvents(range) {
    const { allEvents, todayIso, addDays } = U();
    const today = todayIso();
    const evts = allEvents();
    if (range === 'month') {
        const base = (typeof currentCalDate !== 'undefined' && currentCalDate instanceof Date) ? currentCalDate : new Date();
        const ym = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
        return { list: evts.filter(e => e.date.startsWith(ym)), label: `ខែ${U().KH_MONTHS[base.getMonth()]} ឆ្នាំ${U().khNum(base.getFullYear())}` };
    }
    if (range === 'ahead') return { list: evts.filter(e => e.date >= today), label: 'កម្មវិធីខាងមុខទាំងអស់' };
    const end = addDays(today, 7);
    return { list: evts.filter(e => e.date >= today && e.date <= end), label: `ថ្ងៃនេះ ដល់ ${U().khShortDate(end)}` };
}

/* ---------- Sources ---------- */
const SOURCES = {
    stats: {
        title: 'ស្ថិតិសំណុំរឿង (ផ្ទាំងដើម)', icon: 'fa-solid fa-chart-pie', formats: ['text'], defaults: ['text'],
        summary: () => {
            const list = typeof getDashboardCases === 'function' ? getDashboardCases() : caseList('stats');
            return `${U().khNum(list.length)} សំណុំរឿង · តាមជម្រើសលើផ្ទាំងដើម`;
        },
        text() {
            const { khLongDate, todayIso } = U();
            const scope = window.dashboardScope || 'personal';
            const list = typeof getDashboardCases === 'function' ? getDashboardCases() : caseList('stats');
            const scopeTitle = { personal: 'សំណុំរឿងផ្ទាល់ខ្លួន', assisting: 'សំណុំរឿងអម', all: 'សំណុំរឿងសរុបរួម' }[scope] || 'សំណុំរឿងផ្ទាល់ខ្លួន';
            const period = typeof dsbPeriodLabel === 'function' ? ` — ${tgEsc(dsbPeriodLabel())}` : '';
            let t = `📊 <b>របាយការណ៍ស្ថិតិសំណុំរឿង</b>\n🏛 អ.ដ.ក. · ${tgEsc(khLongDate(todayIso()))}\n${LINE}\n`;
            t += `🔹 <b>${scopeTitle}${period}</b>\n`;
            t += typeof generateStatsTextForTelegram === 'function' ? generateStatsTextForTelegram(list) : statusBlock(list);
            return t + footer();
        }
    },
    cases: {
        title: 'បញ្ជីសំណុំរឿង', icon: 'fa-solid fa-folder-tree', formats: ['text', 'pdf', 'word', 'excel'], defaults: ['text', 'pdf'],
        summary: () => `${U().khNum(caseList('cases').length)} សំណុំរឿង · តាមតម្រងដែលកំពុងប្រើ`,
        text() {
            const { khLongDate, todayIso, khShortDate, khTime } = U();
            const list = caseList('cases');
            let t = `📁 <b>បញ្ជីសំណុំរឿង</b>\n🏛 អ.ដ.ក. · ${tgEsc(khLongDate(todayIso()))}\n${LINE}\n`;
            t += statusBlock(list);
            const today = todayIso();
            const soon = list.map(c => ({ c, e: nextEventOf(c) })).filter(x => x.e && x.e.date >= today)
                .sort((a, b) => (a.e.date + (a.e.time || '')).localeCompare(b.e.date + (b.e.time || ''))).slice(0, 12);
            if (soon.length) {
                t += `\n${LINE}\n📌 <b>កម្មវិធីខាងមុខ (${U().khNum(soon.length)})</b>\n`;
                soon.forEach(x => {
                    t += `• <b>${tgEsc(x.c.caseNumber)}</b> · ${tgEsc(khShortDate(x.e.date))}${x.e.time ? ' ' + khTime(x.e.time) : ''} — ${tgEsc(x.e.desc)}\n   ${tgEsc(x.c.partyA_name || '')}${x.c.partyB_name ? ' ⇄ ' + tgEsc(x.c.partyB_name) : ''}\n`;
                });
            }
            return t + footer('📎 បញ្ជីលម្អិតមានក្នុងឯកសារភ្ជាប់');
        },
        doc() {
            const { khShortDate, khNum, khTime, STATUS, statusOf } = U();
            const list = caseList('cases');
            const rows = list.map((c, i) => {
                const e = nextEventOf(c);
                const st = statusOf(c);
                return [khNum(c.originalListNo || i + 1), c.caseNumber, fmtDate(c.dateReceived), c.partyA_name, c.partyB_name, c.category, c.disputeLocation,
                    { html: `<span style="color:${STATUS[st].color};font-weight:bold">${STATUS[st].label}</span>`, text: STATUS[st].label },
                    e ? `${khShortDate(e.date)} ${e.time ? khTime(e.time) : ''} · ${e.desc}` : '—'];
            });
            const n = statusCounts(list);
            return {
                title: 'តារាងបញ្ជីសំណុំរឿង', subtitle: `គិតត្រឹម${U().khLongDate(U().todayIso(), false)} · ចំនួន ${khNum(list.length)} សំណុំរឿង`, landscape: true,
                body: summaryStrip(n, list.length) + table(['ល.រ', 'លេខសំណុំរឿង', 'ថ្ងៃទទួល', 'ភាគីស្នើសុំ (ក)', 'ភាគីម្ខាងទៀត (ខ)', 'ប្រភេទវិវាទ', 'ទីតាំង', 'ស្ថានភាព', 'កម្មវិធីបន្ទាប់'], rows,
                    [5, 9, 8, 15, 15, 10, 9, 11, 18]),
                file: 'NADR_Case_List'
            };
        }
    },
    calendar: {
        title: 'កាលវិភាគប្រជុំ', icon: 'fa-regular fa-calendar-days', formats: ['text', 'pdf', 'word', 'excel'], defaults: ['text'], hasRange: true,
        summary: range => { const r = calendarEvents(range); return `${U().khNum(r.list.length)} កម្មវិធី · ${r.label}`; },
        text(range) {
            const { khLongDate, todayIso, addDays, khTime, KH_DAYS, khShortDate } = U();
            const r = calendarEvents(range);
            const today = todayIso(), tomorrow = addDays(today, 1);
            let t = `🗓 <b>កាលវិភាគប្រជុំ</b> · ${tgEsc(r.label)}\n🏛 អ.ដ.ក. · ${tgEsc(khLongDate(today))}\n${LINE}\n`;
            if (!r.list.length) return t + '✅ មិនមានកម្មវិធីក្នុងរយៈពេលនេះទេ' + footer();
            let last = '';
            r.list.forEach(e => {
                if (e.date !== last) {
                    last = e.date;
                    const d = new Date(e.date + 'T00:00:00');
                    const head = e.date === today ? '🔴 ថ្ងៃនេះ' : e.date === tomorrow ? '🟡 ថ្ងៃស្អែក' : `📅 ថ្ងៃ${KH_DAYS[d.getDay()]}`;
                    t += `\n<b>${head} · ${tgEsc(khShortDate(e.date))}</b>\n`;
                }
                t += `🕘 <b>${e.time ? khTime(e.time) : '—'}</b> · ${tgEsc(e.desc)}\n`;
                t += `   📁 ${tgEsc(e.c.caseNumber)} · ${tgEsc(e.c.partyA_name || '')}${e.c.partyB_name ? ' ⇄ ' + tgEsc(e.c.partyB_name) : ''}\n`;
                if (e.c.disputeLocation) t += `   📍 ${tgEsc(e.c.disputeLocation)}\n`;
            });
            const pending = U().allEvents().filter(e => e.date < today && !e.c.eventOutcome).length;
            if (pending) t += `\n${LINE}\n⚠️ កម្មវិធីកន្លងផុត មិនទាន់កត់លទ្ធផល៖ <b>${U().khNum(pending)}</b>`;
            return t + footer();
        },
        doc(range) {
            const { khShortDate, khNum, khTime, KH_DAYS } = U();
            const r = calendarEvents(range);
            const OUT = { settled: 'ព្រមព្រៀង', unsuccessful: 'មិនជោគជ័យ', shelved: 'តម្កល់', continued: 'បន្តប្រជុំ' };
            const rows = r.list.map((e, i) => [khNum(i + 1), `ថ្ងៃ${KH_DAYS[new Date(e.date + 'T00:00:00').getDay()]} ${khShortDate(e.date)} ${khNum(e.date.slice(0, 4))}`,
                e.time ? khTime(e.time) : '—', e.c.caseNumber, e.desc, e.c.partyA_name, e.c.partyB_name, e.c.disputeLocation, OUT[e.c.eventOutcome] || '']);
            return {
                title: 'កាលវិភាគកម្មវិធីសំណុំរឿង', subtitle: `${r.label} · ចំនួន ${khNum(r.list.length)} កម្មវិធី`, landscape: true,
                body: r.list.length ? table(['ល.រ', 'ថ្ងៃ', 'ម៉ោង', 'លេខសំណុំរឿង', 'កម្មវិធី', 'ភាគីស្នើសុំ (ក)', 'ភាគីម្ខាងទៀត (ខ)', 'ទីតាំង', 'លទ្ធផល'], rows, [5, 15, 6, 9, 15, 15, 15, 11, 9])
                    : '<p style="text-align:center;font-size:12pt">មិនមានកម្មវិធីក្នុងរយៈពេលនេះទេ</p>',
                file: 'NADR_Schedule'
            };
        }
    },
    report: {
        title: 'របាយការណ៍', icon: 'fa-solid fa-file-lines', formats: ['text', 'pdf', 'word', 'excel'], defaults: ['pdf'],
        ready: () => { const p = $('report-content'); return !!(p && p.style.display !== 'none'); },
        summary: () => {
            const t = $('report-header-title'), s = $('report-header-subtitle');
            const n = typeof currentReportData !== 'undefined' && Array.isArray(currentReportData) ? currentReportData.length : 0;
            return `${(t && t.innerText.trim()) || 'របាយការណ៍'}${s && s.innerText.trim() ? ' · ' + s.innerText.trim() : ''} · ${U().khNum(n)} សំណុំរឿង`;
        },
        text() {
            const t = $('report-header-title'), s = $('report-header-subtitle');
            const list = typeof currentReportData !== 'undefined' && Array.isArray(currentReportData) ? currentReportData : [];
            let m = `📑 <b>${tgEsc((t && t.innerText.trim()) || 'របាយការណ៍')}</b>\n`;
            if (s && s.innerText.trim()) m += `🗓 ${tgEsc(s.innerText.trim())}\n`;
            m += `🏛 អ.ដ.ក. · ${tgEsc(U().khLongDate(U().todayIso()))}\n${LINE}\n`;
            m += statusBlock(list);
            return m + footer('📎 របាយការណ៍ពេញលេញមានក្នុងឯកសារភ្ជាប់');
        }
    },
    case: {
        title: 'ព័ត៌មានសំណុំរឿង', icon: 'fa-solid fa-folder-open', formats: ['text', 'pdf', 'word'], defaults: ['text'],
        summary: (r, id) => { const c = getCase(id); return c ? `សំណុំរឿងលេខ ${c.caseNumber} · ${c.partyA_name || ''}` : ''; },
        text(r, id) {
            const c = getCase(id); if (!c) return '';
            const { STATUS, statusOf, khShortDate, khTime } = U();
            const st = STATUS[statusOf(c)];
            const phone = p => (p ? ` · 📞 ${tgEsc(typeof formatPhoneNumberWithTelecom === 'function' ? formatPhoneNumberWithTelecom(p) : p)}` : '');
            let t = `📂 <b>សំណុំរឿងលេខ ${tgEsc(c.caseNumber)}</b>${c.caseType === 'assisting' ? ' <i>(សំណុំរឿងអម)</i>' : ''}\n${LINE}\n`;
            t += `${st.emoji} <b>ស្ថានភាព៖</b> ${st.label}\n`;
            t += `📅 <b>ថ្ងៃទទួល៖</b> ${tgEsc(fmtDate(c.dateReceived))}\n`;
            t += `⚖️ <b>ប្រភេទវិវាទ៖</b> ${tgEsc(c.category || '—')}\n`;
            t += `📍 <b>ទីតាំង៖</b> ${tgEsc(c.disputeLocation || '—')}\n\n`;
            t += `🅰️ <b>ភាគីស្នើសុំ៖</b> ${tgEsc(c.partyA_name || '—')}${phone(c.partyA_phone)}\n`;
            t += `🅱️ <b>ភាគីម្ខាងទៀត៖</b> ${tgEsc(c.partyB_name || '—')}${phone(c.partyB_phone)}\n`;
            const e = nextEventOf(c);
            if (e) t += `\n🗓 <b>កម្មវិធី៖</b> ${tgEsc(e.desc)} · ${tgEsc(khShortDate(e.date))}${e.time ? ' ម៉ោង ' + khTime(e.time) : ''}\n`;
            if (c.summary) t += `\n📝 <b>សេចក្តីសង្ខេប៖</b>\n${tgEsc(String(c.summary).slice(0, 1500))}\n`;
            return t + footer();
        },
        doc(r, id) {
            const c = getCase(id); if (!c) return null;
            const { STATUS, statusOf, khShortDate, khTime } = U();
            const e = nextEventOf(c);
            const kv = [['លេខសំណុំរឿង', c.caseNumber], ['ប្រភេទសំណុំរឿង', c.caseType === 'assisting' ? 'សំណុំរឿងអម' : 'សំណុំរឿងផ្ទាល់ខ្លួន'],
                ['ថ្ងៃទទួលពាក្យ', fmtDate(c.dateReceived)], ['ប្រភេទវិវាទ', c.category], ['ទីតាំងវិវាទ', c.disputeLocation],
                ['ភាគីស្នើសុំ (ក)', `${c.partyA_name || ''}${c.partyA_phone ? ' · ទូរស័ព្ទ ' + c.partyA_phone : ''}`],
                ['ភាគីម្ខាងទៀត (ខ)', `${c.partyB_name || ''}${c.partyB_phone ? ' · ទូរស័ព្ទ ' + c.partyB_phone : ''}`],
                ['ស្ថានភាព', STATUS[statusOf(c)].label],
                ['កម្មវិធីបន្ទាប់', e ? `${e.desc} · ${khShortDate(e.date)}${e.time ? ' ម៉ោង ' + khTime(e.time) : ''}` : '—'],
                ['សេចក្តីសង្ខេបវិវាទ', c.summary || '—']];
            const body = `<table style="width:100%;border-collapse:collapse;font-size:11pt">${kv.map(([k, v]) =>
                `<tr><td style="${TD}width:32%;background:#eef3fb;font-family:'Khmer OS Niroth','Khmer OS Battambang',sans-serif">${esc(k)}</td><td style="${TD}white-space:pre-wrap">${esc(v || '—')}</td></tr>`).join('')}</table>`;
            return { title: 'ប័ណ្ណព័ត៌មានសំណុំរឿង', subtitle: `សំណុំរឿងលេខ ${c.caseNumber}`, landscape: false, body, file: `NADR_Case_${String(c.caseNumber).replace(/[^\w-]/g, '_')}` };
        }
    }
};
function getCase(id) {
    if (typeof getCaseById === 'function') return getCaseById(id);
    return caseList('case').find(c => String(c.id) === String(id));
}
function statusBlock(list) {
    const n = statusCounts(list), { STATUS, khNum } = U();
    let t = `📊 <b>សរុប ${khNum(list.length)} សំណុំរឿង</b>\n`;
    ['mediating', 'settled', 'shelved', 'unsuccessful'].forEach(k => { t += `${STATUS[k].emoji} ${STATUS[k].label}៖ <b>${khNum(n[k] || 0)}</b>\n`; });
    if (n.draft) t += `${STATUS.draft.emoji} ${STATUS.draft.label}៖ <b>${khNum(n.draft)}</b>\n`;
    return t;
}
function footer(extra) {
    const who = officerName();
    return `\n${LINE}\n${extra ? extra + '\n' : ''}<i>✉️ ផ្ញើពីកម្មវិធីគ្រប់គ្រងសំណុំរឿង NADR CMS Pro${who ? ' · ' + tgEsc(who) : ''}</i>`;
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function fmtDate(v) {
    const s = String(v || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return v || '—';
    return U().khNum(`${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`);
}

/* ---------- Official document (PDF / Word / Excel) ---------- */
const TD = 'border:1px solid #64748b;padding:3px 6px;vertical-align:middle;';
function table(heads, rows, widths) {
    const th = heads.map((h, i) => `<th style="${TD}background:#dfe7f5;color:#0b2545;font-family:'Khmer OS Niroth','Khmer OS Battambang',sans-serif;font-weight:normal;text-align:center;${widths ? 'width:' + widths[i] + '%;' : ''}">${esc(h)}</th>`).join('');
    const body = rows.map((r, ri) => `<tr style="page-break-inside:avoid;${ri % 2 ? 'background:#f6f8fc;' : ''}">${r.map((v, i) => {
        const cell = v && typeof v === 'object' ? v.html : esc(v == null || v === '' ? '—' : v);
        return `<td style="${TD}${i === 0 ? 'text-align:center;' : ''}">${cell}</td>`;
    }).join('')}</tr>`).join('');
    return `<table class="tgd-table" style="width:100%;border-collapse:collapse;font-size:9pt;font-family:'Khmer OS Siemreap','Kantumruy Pro',sans-serif"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}
function summaryStrip(n, total) {
    const { STATUS, khNum } = U();
    const cell = (label, v, color) => `<td style="border:1px solid #cbd5e1;padding:4px 8px;text-align:center;font-size:10pt"><span style="color:${color};font-family:'Khmer OS Niroth','Khmer OS Battambang',sans-serif">${label}</span><br><b style="font-size:13pt;color:${color}">${khNum(v)}</b></td>`;
    return `<table style="border-collapse:collapse;margin:0 auto 10px auto"><tr>${cell('សរុប', total, '#0b2545')}${['mediating', 'settled', 'shelved', 'unsuccessful'].map(k => cell(STATUS[k].label, n[k] || 0, STATUS[k].color)).join('')}</tr></table>`;
}
function officialDoc(d) {
    const { khLongDate, todayIso } = U();
    const orn = typeof window.nadrOrnamentHTML === 'function' ? window.nadrOrnamentHTML(170, 'margin:2px auto 6px auto;') : '';
    const who = officerName();
    const moul = "font-family:'Khmer OS Muol Light','Moul',serif;font-weight:normal;";
    return `<div class="tgd" style="font-family:'Khmer OS Siemreap','Kantumruy Pro',sans-serif;color:#0f172a;background:#fff">
        <div style="text-align:center">
            <p style="${moul}font-size:12pt;color:#1e3a8a;margin:0 0 2px 0">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p style="${moul}font-size:11pt;color:#1e3a8a;margin:0">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
            ${orn}
        </div>
        <p style="${moul}font-size:10pt;color:#1e3a8a;margin:0 0 8px 0;text-align:left">អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ</p>
        <p style="${moul}font-size:13pt;text-align:center;margin:4px 0 2px 0;color:#0f172a">${esc(d.title)}</p>
        ${d.subtitle ? `<p style="text-align:center;font-size:10.5pt;color:#334155;margin:0 0 10px 0">${esc(d.subtitle)}</p>` : ''}
        ${d.body}
        <table style="width:100%;border:0;margin-top:16px;page-break-inside:avoid"><tr>
            <td style="border:0;width:50%"></td>
            <td style="border:0;width:50%;text-align:center;font-size:10.5pt">
                <p style="margin:0">ធ្វើនៅរាជធានីភ្នំពេញ ${esc(khLongDate(todayIso(), false))}</p>
                <p style="${moul}font-size:10.5pt;margin:4px 0 46px 0">អ្នករៀបចំ</p>
                <p style="margin:0">${esc(who)}</p>
            </td>
        </tr></table>
    </div>`;
}
function wordHtml(inner, landscape, title) {
    return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${esc(title)}</title>
<style>
@page WordSection1 { size: ${landscape ? '841.9pt 595.3pt' : '595.3pt 841.9pt'}; mso-page-orientation: ${landscape ? 'landscape' : 'portrait'}; margin: 0.5in; }
div.WordSection1 { page: WordSection1; }
body { font-family: 'Khmer OS Siemreap', 'Khmer OS Battambang', sans-serif; font-size: 10pt; }
table { border-collapse: collapse; } p { margin: 0; }
</style></head><body><div class="WordSection1">${inner}</div></body></html>`;
}
function excelHtml(inner, title) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page { mso-page-orientation: landscape; margin: 0.5in; } body { font-family: 'Khmer OS Siemreap', sans-serif; } td, th { vertical-align: middle; white-space: normal; mso-number-format: '\\@'; }</style>
</head><body>${inner}</body></html>`;
}
async function htmlToPdfBlob(inner, landscape) {
    const area = $('print-area');
    if (window.electronAPI && window.electronAPI.generatePDF && area) {
        const st = document.createElement('style');
        st.id = 'tg-page-style';
        st.textContent = `@media print { @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; } html, body { background: #fff !important; } #print-area .tgd td, #print-area .tgd th { font-size: 9pt !important; padding: 3px 5px !important; } #print-area .tgd thead { display: table-header-group !important; } }`;
        document.head.appendChild(st);
        const html = document.documentElement, dark = html.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');
        const darkOnHtml = html.classList.contains('dark-theme');
        if (dark) { html.classList.remove('dark-theme'); document.body.classList.remove('dark-theme'); }
        area.innerHTML = inner;
        try {
            const buf = await window.electronAPI.generatePDF({ landscape: !!landscape, pageSize: 'A4', printBackground: true, scale: 1, margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } });
            return new Blob([buf], { type: 'application/pdf' });
        } finally {
            area.innerHTML = '';
            st.remove();
            if (dark) { if (darkOnHtml) html.classList.add('dark-theme'); else document.body.classList.add('dark-theme'); }
        }
    }
    if (typeof html2pdf !== 'undefined') {
        const box = document.createElement('div');
        box.style.width = landscape ? '1080px' : '760px';
        box.innerHTML = inner;
        return html2pdf().set({ margin: 8, image: { type: 'jpeg', quality: 0.96 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' } }).from(box).outputPdf('blob');
    }
    throw new Error('PDF មិនអាចបង្កើតបានលើកុំព្យូទ័រនេះទេ');
}
const stamp = () => new Date().toISOString().slice(0, 10);

/** Build one file for a source: returns {blob, name}. */
async function buildFile(srcKey, fmt, range, id) {
    if (srcKey === 'report') {
        if (fmt === 'pdf' && typeof window.nadrReportPdfBlob === 'function') return window.nadrReportPdfBlob();
        if (fmt === 'word' && typeof exportReportToWord === 'function') return exportReportToWord({ returnBlob: true });
        if (fmt === 'excel' && typeof exportReportToExcel === 'function') return exportReportToExcel({ returnBlob: true });
        throw new Error('មិនអាចរៀបចំឯកសាររបាយការណ៍បានទេ');
    }
    const d = SOURCES[srcKey].doc(range, id);
    if (!d) throw new Error('គ្មានទិន្នន័យ');
    const inner = officialDoc(d);
    const base = `${d.file}_${stamp()}`;
    if (fmt === 'pdf') return { blob: await htmlToPdfBlob(inner, d.landscape), name: base + '.pdf' };
    if (fmt === 'word') return { blob: window.nadrOfficeBlob(wordHtml(inner, d.landscape, d.title), 'word'), name: base + '.doc' };
    if (fmt === 'excel') return { blob: window.nadrOfficeBlob(excelHtml(inner, d.title), 'excel'), name: base + '.xls' };
    throw new Error('ទម្រង់មិនស្គាល់');
}

/* ---------- Sending ---------- */
function splitMessage(text, max = 3800) {
    const out = []; let cur = '';
    String(text).split('\n').forEach(line => {
        if ((cur + '\n' + line).length > max && cur) { out.push(cur); cur = line; }
        else cur = cur ? cur + '\n' + line : line;
    });
    if (cur) out.push(cur);
    return out;
}
async function sendText(text) {
    for (const part of splitMessage(text)) {
        const ok = await sendTelegramMessage(part);
        if (!ok) throw new Error(window.lastTelegramError && window.lastTelegramError !== 'MISSING_CONFIG' ? window.lastTelegramError : 'Telegram មិនទទួលសារ');
    }
}
async function sendFile(file, caption) {
    const ok = await sendTelegramDocument(file.blob, file.name, caption);
    if (!ok) throw new Error(window.lastTelegramError || 'Telegram មិនទទួលឯកសារ');
}

/* ---------- Dialog ---------- */
let state = null;
function configured() { const s = typeof getTelegramSettings === 'function' ? getTelegramSettings() : {}; return !!(s.token && s.chatid); }
function savedFormats(src) {
    try { const v = JSON.parse(localStorage.getItem('nadr_tg_fmt_' + src)); if (Array.isArray(v) && v.length) return v.filter(f => SOURCES[src].formats.includes(f)); } catch (e) { /* none saved */ }
    return SOURCES[src].defaults.slice();
}
function previewHtml(tgText) {
    // Telegram HTML → safe display: keep <b>/<i>, the rest is already escaped
    return String(tgText).replace(/\n/g, '<br>');
}
function render() {
    const s = SOURCES[state.src];
    const dlg = $('tg-center');
    const ready = s.ready ? s.ready() : true;
    const okCfg = configured();
    const fm = s.formats.map(f => {
        const F = FORMATS[f], on = state.fmts.includes(f);
        return `<label class="tgc-fmt tgc-${f}${on ? ' on' : ''}">
            <input type="checkbox" value="${f}" ${on ? 'checked' : ''}>
            <span class="tgc-fmt-ic"><i class="${F.icon}"></i></span>
            <span class="tgc-fmt-txt"><b>${F.label}${s.defaults.includes(f) ? ' <em>ណែនាំ</em>' : ''}</b><small>${F.hint}</small></span>
            <i class="tgc-check fa-solid fa-circle-check"></i>
        </label>`;
    }).join('');
    const range = s.hasRange ? `<div class="tgc-sec"><div class="tgc-lbl">រយៈពេល</div><div class="tgc-seg">${[['7d', '៧ ថ្ងៃខាងមុខ'], ['month', 'ខែដែលកំពុងមើល'], ['ahead', 'ខាងមុខទាំងអស់']].map(([k, l]) =>
        `<button type="button" data-range="${k}" class="${state.range === k ? 'active' : ''}">${l}</button>`).join('')}</div></div>` : '';
    const txt = state.fmts.includes('text') ? s.text(state.range, state.id) : '';
    dlg.querySelector('.tgc-body').innerHTML = `
        <div class="tgc-src"><span class="tgc-src-ic"><i class="${s.icon}"></i></span><div><b>${esc(s.title)}</b><small>${esc(s.summary(state.range, state.id))}</small></div></div>
        ${okCfg ? '' : `<div class="tgc-warn"><i class="fa-solid fa-plug-circle-exclamation"></i><div><b>មិនទាន់ភ្ជាប់ Telegram Bot</b><span>សូមបញ្ចូល Bot Token និង Chat ID នៅក្នុង «ការកំណត់ → ការភ្ជាប់ប្រព័ន្ធ»</span></div><button type="button" class="tgc-link" data-go-settings>បើកការកំណត់</button></div>`}
        ${ready ? '' : `<div class="tgc-warn"><i class="fa-solid fa-circle-info"></i><div><b>មិនទាន់មានរបាយការណ៍</b><span>សូមជ្រើសប្រភេទរបាយការណ៍ ដើម្បីបង្ហាញវាជាមុនសិន</span></div></div>`}
        ${range}
        <div class="tgc-sec"><div class="tgc-lbl">ជ្រើសទម្រង់ផ្ញើ <span>(អាចជ្រើសច្រើន)</span></div><div class="tgc-fmts">${fm}</div></div>
        ${txt ? `<details class="tgc-prev" ${state.prevOpen ? 'open' : ''}><summary><i class="fa-regular fa-eye"></i> មើលសារមុនផ្ញើ</summary><div class="tgc-bubble">${previewHtml(txt)}</div></details>` : ''}
        <div class="tgc-progress" id="tgc-progress"></div>`;
    const n = state.fmts.length;
    const send = dlg.querySelector('.tgc-send');
    send.disabled = !n || !okCfg || !ready || state.busy;
    send.innerHTML = state.busy ? '<i class="fa-solid fa-spinner fa-spin"></i> កំពុងផ្ញើ...' : `<i class="fa-solid fa-paper-plane"></i> ផ្ញើ${n ? ' (' + U().khNum(n) + ')' : ''}`;
}
function build() {
    let dlg = $('tg-center');
    if (dlg) return dlg;
    dlg = document.createElement('div');
    dlg.id = 'tg-center';
    dlg.className = 'nt-overlay tgc-overlay';
    dlg.innerHTML = `<div class="tgc-dialog" role="dialog" aria-modal="true" aria-labelledby="tgc-title">
        <div class="tgc-head"><span class="tgc-logo"><i class="fab fa-telegram-plane"></i></span><div><h3 id="tgc-title">ផ្ញើទៅ Telegram</h3><p>ជ្រើសទម្រង់ដែលសមស្រប រួចចុច «ផ្ញើ»</p></div>
            <button type="button" class="tgc-x" aria-label="បិទ"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="tgc-body"></div>
        <div class="tgc-foot"><button type="button" class="nt-btn nt-btn-ghost tgc-cancel"><i class="fa-solid fa-xmark"></i> បិទ</button><button type="button" class="nt-btn nt-btn-tg tgc-send"></button></div>
    </div>`;
    document.body.appendChild(dlg);
    const close = () => { if (!state || !state.busy) dlg.classList.remove('open'); };
    dlg.querySelector('.tgc-x').onclick = close;
    dlg.querySelector('.tgc-cancel').onclick = close;
    dlg.addEventListener('mousedown', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    dlg.addEventListener('change', e => {
        if (!e.target.matches('.tgc-fmt input')) return;
        const f = e.target.value;
        state.fmts = e.target.checked ? [...new Set([...state.fmts, f])] : state.fmts.filter(x => x !== f);
        state.fmts = SOURCES[state.src].formats.filter(x => state.fmts.includes(x));
        try { localStorage.setItem('nadr_tg_fmt_' + state.src, JSON.stringify(state.fmts)); } catch (err) { /* storage off */ }
        render();
    });
    dlg.addEventListener('toggle', e => { if (e.target.matches('.tgc-prev')) state.prevOpen = e.target.open; }, true);
    dlg.addEventListener('click', e => {
        const r = e.target.closest('[data-range]');
        if (r) { state.range = r.dataset.range; render(); return; }
        if (e.target.closest('[data-go-settings]')) {
            dlg.classList.remove('open');
            if (typeof switchView === 'function') switchView('settings-view');
            setTimeout(() => { const tab = document.querySelector('#settings-view .st-tab[data-tab="tab-integrations"]'); if (tab) tab.click(); const t = $('setting-tg-token'); if (t) t.focus(); }, 200);
        }
    });
    dlg.querySelector('.tgc-send').onclick = run;
    return dlg;
}
async function run() {
    const s = SOURCES[state.src];
    if (!state.fmts.length || state.busy) return;
    state.busy = true; render();
    const prog = $('tgc-progress');
    const order = ['text', 'pdf', 'word', 'excel'].filter(f => state.fmts.includes(f));
    prog.innerHTML = order.map(f => `<div class="tgc-step" data-f="${f}"><i class="fa-solid fa-circle-notch fa-spin"></i> ${FORMATS[f].label}<span></span></div>`).join('');
    const mark = (f, ok, msg) => {
        const el = prog.querySelector(`[data-f="${f}"]`); if (!el) return;
        el.className = 'tgc-step ' + (ok ? 'ok' : 'bad');
        el.querySelector('i').className = ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
        el.querySelector('span').textContent = msg || '';
    };
    let good = 0;
    const docTitle = s.title;
    const caption = `📎 <b>${tgEsc(docTitle)}</b>\n${tgEsc(s.summary(state.range, state.id))}\n🏛 អ.ដ.ក. · ${tgEsc(U().khLongDate(U().todayIso()))}`.slice(0, 1000);
    for (const f of order) {
        try {
            if (f === 'text') await sendText(s.text(state.range, state.id));
            else await sendFile(await buildFile(state.src, f, state.range, state.id), caption);
            mark(f, true, 'បានផ្ញើ'); good++;
        } catch (err) {
            console.error('Telegram send', f, err);
            mark(f, false, String(err && err.message || err));
        }
    }
    state.busy = false;
    const send = $('tg-center').querySelector('.tgc-send');
    send.disabled = false;
    send.innerHTML = '<i class="fa-solid fa-rotate-right"></i> ផ្ញើម្តងទៀត';
    if (good === order.length) {
        showToast(`បានផ្ញើ «${docTitle}» ទៅ Telegram រួចរាល់ (${U().khNum(good)} ទម្រង់)`, 'success');
        setTimeout(() => { const d = $('tg-center'); if (d && !state.busy) d.classList.remove('open'); }, 1100);
    } else if (good) showToast(`បានផ្ញើ ${U().khNum(good)} ក្នុងចំណោម ${U().khNum(order.length)} ទម្រង់។ សូមមើលបញ្ជីខាងក្រោម។`, 'warning');
    else showToast('ការផ្ញើទៅ Telegram បរាជ័យ! សូមពិនិត្យ Bot Token, Chat ID និងអ៊ីនធឺណិត។', 'error');
}

/** Open the send dialog. src: stats | cases | calendar | report | case;  id: case id for "case". */
window.tgShare = function (src, id) {
    if (!SOURCES[src]) return;
    const dlg = build();
    state = { src, id, fmts: savedFormats(src), range: '7d', busy: false, prevOpen: false };
    render();
    dlg.classList.add('open');
    setTimeout(() => { const b = dlg.querySelector('.tgc-send'); if (b && !b.disabled) b.focus(); }, 40);
};

/** Build a file without sending it ({blob, name}); also handy to check the layout. */
window.tgBuildFile = (src, fmt, range = '7d', id) => buildFile(src, fmt, range, id);

/* The old buttons call these names: route them to the dialog. */
window.shareMasterTableToTelegramBot = () => window.tgShare('cases');
window.shareFilteredCasesToTelegram = () => window.tgShare('report');
window.shareStatsToTelegram = () => window.tgShare('stats');
window.shareCaseToTelegram = id => window.tgShare('case', id);
try { shareFilteredCasesToTelegram = window.shareFilteredCasesToTelegram; } catch (e) { /* declared elsewhere as const */ }
})();
