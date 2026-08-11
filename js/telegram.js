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

async function sendTelegramMessage(message) {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) return false;

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
        return data.ok;
    } catch (e) {
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
        return data.ok;
    } catch (e) {
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
    
    const msg = `🔔 <b>សារសាកល្បងពីប្រព័ន្ធគ្រប់គ្រងសំណុំរឿង</b>\nការតភ្ជាប់ Telegram របស់អ្នកជោគជ័យ!`;
    const success = await sendTelegramMessage(msg);
    
    if (success) {
        if (typeof showToast === 'function') showToast('បានផ្ញើសារសាកល្បងជោគជ័យ!', 'success');
    } else {
        if (typeof showToast === 'function') showToast('បរាជ័យក្នុងការផ្ញើសារ។ សូមពិនិត្យ Token ឡើងវិញ។', 'error');
    }
}

function checkAndSendTelegramNotifications() {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) return; // Not configured

    const now = new Date();
    
    // Get tomorrow's date string YYYY-MM-DD for the 1-day notification
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let hasChanges = false;

    if (typeof casesData !== 'undefined') {
        casesData.forEach(c => {
            if (!c.caseEvent || !c.caseEventDate) return;

            // 1. Check for 1-DAY before notification
            if (c.caseEventDate === tomorrowStr && c.notifiedEventDate !== tomorrowStr) {
                let timeStr = c.caseEventTime ? ` (ម៉ោង ${c.caseEventTime})` : '';
                const msg = `🔔 <b>ការរំលឹកកម្មវិធីសំណុំរឿង (ថ្ងៃស្អែក)</b>\n\n📁 <b>សំណុំរឿង៖</b> ${c.caseNumber}\n⚖️ <b>ប្រភេទវិវាទ៖</b> ${c.category}\n🗓 <b>កម្មវិធី៖</b> ${c.caseEvent} ${timeStr}\n📍 <b>ទីតាំង៖</b> ${c.disputeLocation}\n\n🧑 <b>ភាគីក៖</b> ${c.partyA_name} (${c.partyA_phone || 'គ្មានលេខ'})\n🧑 <b>ភាគីខ៖</b> ${c.partyB_name} (${c.partyB_phone || 'គ្មានលេខ'})`;

                sendTelegramMessage(msg).then(success => {
                    if (success) {
                        c.notifiedEventDate = tomorrowStr;
                        hasChanges = true;
                        if (typeof saveCases === 'function') saveCases();
                    }
                });
            }

            // 2. Check for 1-HOUR before notification
            if (c.caseEventTime && !c.notifiedOneHour) {
                const eventDateTime = new Date(`${c.caseEventDate}T${c.caseEventTime}:00`);
                const diffMs = eventDateTime - now;
                const diffHours = diffMs / (1000 * 60 * 60);

                // If event is in the future but less than 1 hour away
                if (diffHours > 0 && diffHours <= 1) {
                    const msg = `⏳ <b>ការរំលឹកបន្ទាន់ (១ ម៉ោងទៀត)</b>\n\nកម្មវិធីរបស់សំណុំរឿង <b>${c.caseNumber}</b> នឹងចាប់ផ្តើមក្នុងពេល ១ ម៉ោងទៀត!\n🗓 <b>កម្មវិធី៖</b> ${c.caseEvent} (ម៉ោង ${c.caseEventTime})\n📍 <b>ទីតាំង៖</b> ${c.disputeLocation}`;
                    
                    sendTelegramMessage(msg).then(success => {
                        if (success) {
                            c.notifiedOneHour = true;
                            hasChanges = true;
                            if (typeof saveCases === 'function') saveCases();
                        }
                    });
                }
            }
        });
    }
}

async function notifyTelegramEventUpdate(c) {
    if (!c.caseEvent || !c.caseEventDate) return;
    let timeStr = c.caseEventTime ? ` (ម៉ោង ${c.caseEventTime})` : '';
    const msg = `🔄 <b>មានការកែប្រែកម្មវិធីសំណុំរឿង</b>\n\n📁 <b>សំណុំរឿង៖</b> ${c.caseNumber}\n🗓 <b>កម្មវិធី៖</b> ${c.caseEvent} ${timeStr}\n📅 <b>ថ្ងៃទី៖</b> ${c.caseEventDate}\n📍 <b>ទីតាំង៖</b> ${c.disputeLocation}`;
    await sendTelegramMessage(msg);
}

/**
 * Send a summary report to Telegram
 */
async function sendTelegramReport() {
    const { token, chatid } = getTelegramSettings();
    if (!token || !chatid) {
        if (typeof showToast === 'function') showToast('សូមភ្ជាប់ Telegram ជាមុនសិន (ចូលទៅការកំណត់)!', 'error');
        return;
    }
    
    if (typeof casesData === 'undefined' || !casesData || casesData.length === 0) {
        if (typeof showToast === 'function') showToast('មិនមានទិន្នន័យសំណុំរឿងទេ!', 'warning');
        return;
    }

    if (typeof showToast === 'function') showToast('កំពុងរៀបចំ និងផ្ញើរបាយការណ៍ទៅ Telegram...', 'info');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let todayEvents = [];
    let tomorrowEvents = [];
    let pastEvents = [];

    casesData.forEach(c => {
        if (!c.caseEvent || !c.caseEventDate) return;
        
        const eventStr = `${c.caseNumber} - ${c.caseEvent}`;
        if (c.caseEventDate === todayStr) {
            todayEvents.push(eventStr);
        } else if (c.caseEventDate === tomorrowStr) {
            tomorrowEvents.push(eventStr);
        } else if (c.caseEventDate < todayStr) {
            pastEvents.push(eventStr);
        }
    });

    let msg = `📊 <b>របាយការណ៍កម្មវិធីសំណុំរឿងប្រចាំថ្ងៃ</b>\n📅 <b>កាលបរិច្ឆេទ៖</b> ${todayStr}\n\n`;
    
    msg += `📍 <b>កម្មវិធីថ្ងៃនេះ (${todayEvents.length})៖</b>\n`;
    if (todayEvents.length > 0) {
        todayEvents.forEach(e => msg += `• ${e}\n`);
    } else {
        msg += `• គ្មានកម្មវិធីទេ\n`;
    }
    msg += `\n`;

    msg += `⏭ <b>កម្មវិធីថ្ងៃស្អែក (${tomorrowEvents.length})៖</b>\n`;
    if (tomorrowEvents.length > 0) {
        tomorrowEvents.forEach(e => msg += `• ${e}\n`);
    } else {
        msg += `• គ្មានកម្មវិធីទេ\n`;
    }
    msg += `\n`;

    msg += `✅ <b>កម្មវិធីអនុវត្តរួចរាល់សរុប៖</b> ${pastEvents.length} កម្មវិធី`;

    const success = await sendTelegramMessage(msg);
    if (success) {
        if (typeof showToast === 'function') showToast('បានផ្ញើរបាយការណ៍សរុបទៅ Telegram ជោគជ័យ!', 'success');
    } else {
        if (typeof showToast === 'function') showToast('មានបញ្ហាក្នុងការផ្ញើរបាយការណ៍!', 'error');
    }
}

async function notifyTelegramEventCancelled(caseNumber, eventName) {
    const msg = `❌ <b>ការលុបចោលកម្មវិធីសំណុំរឿង</b>\n\n📁 <b>សំណុំរឿង៖</b> ${caseNumber}\nកម្មវិធី "<b>${eventName || 'មិនស្គាល់'}</b>" ត្រូវបានលុបចេញពីប្រតិទិន។`;
    await sendTelegramMessage(msg);
}
