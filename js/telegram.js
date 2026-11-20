/**
 * Telegram Notification Logic
 */

function getTelegramSettings() {
    const token = localStorage.getItem('nadr_tg_token') || '';
    const chatid = localStorage.getItem('nadr_tg_chatid') || '';
    return { token, chatid };
}

function saveTelegramSettings() {
    const token = document.getElementById('setting-tg-token').value.trim();
    const chatid = document.getElementById('setting-tg-chatid').value.trim();
    
    if (token) localStorage.setItem('nadr_tg_token', token);
    if (chatid) localStorage.setItem('nadr_tg_chatid', chatid);
    
    if (typeof showToast === 'function') {
        showToast('បានរក្សាទុកការកំណត់ Telegram រួចរាល់', 'success');
    }
}

// Populate fields on load
window.addEventListener('load', () => {
    setTimeout(() => {
        const set = getTelegramSettings();
        if (document.getElementById('setting-tg-token')) {
            document.getElementById('setting-tg-token').value = set.token;
        }
        if (document.getElementById('setting-tg-chatid')) {
            document.getElementById('setting-tg-chatid').value = set.chatid;
        }
        // Check notifications on load and every minute
        checkAndSendTelegramNotifications();
        setInterval(checkAndSendTelegramNotifications, 60000);
    }, 1000);
});

window.lastTelegramError = null;

async function sendTelegramMessage(message) {
    window.lastTelegramError = null;
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) {
        window.lastTelegramError = 'MISSING_CONFIG';
        return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatid,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        if (!data.ok) {
            window.lastTelegramError = data.description || `HTTP ${response.status}`;
            console.error('Telegram API rejected message:', window.lastTelegramError);
        }
        return !!data.ok;
    } catch (e) {
        window.lastTelegramError = e && e.message ? e.message : 'NETWORK_ERROR';
        console.error('Telegram API Error:', e);
        return false;
    }
}

async function sendTelegramDocument(fileBlob, filename, caption = '') {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) return false;

    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', chatid);
    formData.append('document', fileBlob, filename);
    if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!data.ok) window.lastTelegramError = data.description || `HTTP ${response.status}`;
        return !!data.ok;
    } catch (e) {
        window.lastTelegramError = e && e.message ? e.message : 'NETWORK_ERROR';
        console.error('Telegram API Error:', e);
        return false;
    }
}

async function testTelegramNotification() {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) {
        if (typeof showToast === 'function') showToast('សូមវាយបញ្ចូល Token និង Chat ID ជាមុនសិន!', 'error');
        return;
    }
    
    if (typeof showToast === 'function') showToast('កំពុងផ្ញើសារសាកល្បង...', 'info');
    
    const msg = `🔔 <b>សារសាកល្បង</b>\n━━━━━━━━━━━━━━━━\n✅ កម្មវិធីគ្រប់គ្រងសំណុំរឿង បានភ្ជាប់ជាមួយ Telegram ដោយជោគជ័យ!\n━━━━━━━━━━━━━━━━\n<i>✉️ NADR CMS Pro</i>`;
    const success = await sendTelegramMessage(msg);
    
    if (success) {
        if (typeof showToast === 'function') showToast('បានផ្ញើសារសាកល្បងជោគជ័យ!', 'success');
    } else {
        if (typeof showToast === 'function') showToast('បរាជ័យក្នុងការផ្ញើសារ។ សូមពិនិត្យ Token ឡើងវិញ។', 'error');
    }
}

/* ---------- Message cards (one layout for every automatic message) ---------- */
const TG_LINE = '━━━━━━━━━━━━━━━━';
function tgEscape(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function tgLocalIso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function tgEventOf(c) {
    const e = typeof getCaseEventDetails === 'function' ? getCaseEventDetails(c) : { date: c.caseEventDate, time: c.caseEventTime, desc: c.caseEvent };
    return { date: String(e.date || c.caseEventDate || '').slice(0, 10), time: e.time || c.caseEventTime || '', desc: e.desc || (typeof c.caseEvent === 'string' ? c.caseEvent : '') || 'ប្រជុំសម្រុះសម្រួល' };
}
function tgDate(iso) { const U = window.nadrUtil; return U ? U.khLongDate(iso) : iso; }
function tgTime(t) { const U = window.nadrUtil; return U ? U.khTime(t) : t; }
/** heading line, then the case, the program and the parties */
function tgCaseCard(heading, c, opts = {}) {
    const e = tgEventOf(c);
    let m = `${heading}\n${TG_LINE}\n📁 <b>សំណុំរឿងលេខ ${tgEscape(c.caseNumber)}</b>\n`;
    if (c.category) m += `⚖️ ${tgEscape(c.category)}\n`;
    if (opts.event !== false && e.date) {
        m += `🗓 <b>${tgEscape(e.desc)}</b>\n`;
        m += `📅 ${tgEscape(tgDate(e.date))}${e.time ? ` · 🕘 ម៉ោង ${tgEscape(tgTime(e.time))}` : ''}\n`;
    }
    if (c.disputeLocation) m += `📍 ${tgEscape(c.disputeLocation)}\n`;
    if (opts.status) m += `📊 ស្ថានភាព៖ ${tgEscape(opts.status)}\n`;
    m += `\n🅰️ ${tgEscape(c.partyA_name || '—')}${c.partyA_phone ? ' · 📞 ' + tgEscape(c.partyA_phone) : ''}\n`;
    m += `🅱️ ${tgEscape(c.partyB_name || '—')}${c.partyB_phone ? ' · 📞 ' + tgEscape(c.partyB_phone) : ''}`;
    return m + `\n${TG_LINE}\n<i>✉️ NADR CMS Pro</i>`;
}

function checkAndSendTelegramNotifications() {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) return; // Not configured
    if (typeof casesData === 'undefined') return;
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tgLocalIso(tomorrow);   // local day (the old toISOString() gave the UTC day)
    const save = () => { if (typeof saveCases === 'function') saveCases(); };

    casesData.forEach(c => {
        if (typeof checkCaseHasEvent === 'function' ? !checkCaseHasEvent(c) : !(c.caseEvent && c.caseEventDate)) return;
        const e = tgEventOf(c);
        if (!e.date) return;
        // 1. one day before
        if (e.date === tomorrowStr && c.notifiedEventDate !== tomorrowStr) {
            c.notifiedEventDate = tomorrowStr;   // mark first so the next minute does not send it again
            sendTelegramMessage(tgCaseCard('🔔 <b>រំលឹកកម្មវិធីថ្ងៃស្អែក</b>', c)).then(ok => { if (!ok) c.notifiedEventDate = null; save(); });
        }
        if (!e.time) return;
        const at = new Date(`${e.date}T${String(e.time).slice(0, 5)}:00`);
        const mins = (at - now) / 60000;
        // 2. one hour before
        if (!c.notifiedOneHour && mins > 0 && mins <= 60) {
            c.notifiedOneHour = true;
            sendTelegramMessage(tgCaseCard('⏳ <b>រំលឹក៖ កម្មវិធីចាប់ផ្តើមក្នុងរយៈពេល ១ ម៉ោងទៀត</b>', c)).then(ok => { if (!ok) c.notifiedOneHour = false; save(); });
        }
        // 3. at the time (within 5 minutes)
        if (!c.notifiedNow && mins <= 0 && mins > -5) {
            c.notifiedNow = true;
            sendTelegramMessage(tgCaseCard('🚨 <b>ដល់ម៉ោងកម្មវិធីហើយ</b>', c)).then(ok => { if (!ok) c.notifiedNow = false; save(); });
        }
    });
}

async function notifyTelegramAction(c, actionType) {
    if (!c) return;
    let msg = '';
    if (actionType === 'NEW_CASE') msg = tgCaseCard('🆕 <b>សំណុំរឿងថ្មីត្រូវបានបញ្ចូល</b>', c, { event: !!tgEventOf(c).date, status: c.dateReceived ? `ទទួលពាក្យ ${tgDate(String(c.dateReceived).slice(0, 10))}` : '' });
    else if (actionType === 'UPDATE_CASE') msg = tgCaseCard('🔄 <b>សំណុំរឿងត្រូវបានធ្វើបច្ចុប្បន្នភាព</b>', c, { event: !!tgEventOf(c).date, status: window.nadrUtil ? window.nadrUtil.STATUS[window.nadrUtil.statusOf(c)].label : c.status });
    else if (actionType === 'SCHEDULE_EVENT') { if (!tgEventOf(c).date) return; msg = tgCaseCard('🗓 <b>កម្មវិធីត្រូវបានកំណត់ / កែប្រែលើប្រតិទិន</b>', c); }
    if (msg) await sendTelegramMessage(msg);
}

/** Daily program summary (kept for older buttons): opens the send dialog on the calendar. */
async function sendTelegramReport() {
    if (typeof window.tgShare === 'function') { window.tgShare('calendar'); return; }
}

async function notifyTelegramEventCancelled(caseNumber, eventName) {
    const msg = `❌ <b>កម្មវិធីត្រូវបានលុបចោល</b>\n${TG_LINE}\n📁 <b>សំណុំរឿងលេខ ${tgEscape(caseNumber)}</b>\n🗓 ${tgEscape(eventName || 'មិនស្គាល់')}\n${TG_LINE}\n<i>✉️ NADR CMS Pro</i>`;
    await sendTelegramMessage(msg);
}
