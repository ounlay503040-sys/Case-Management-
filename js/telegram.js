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
        // Check notifications on load
        checkAndSendTelegramNotifications();
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

    // Get tomorrow's date string YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let hasChanges = false;

    if (typeof casesData !== 'undefined') {
        casesData.forEach(c => {
            // Check if there is an event tomorrow
            if (c.caseEvent && c.caseEventDate === tomorrowStr) {
                // Check if we already notified for THIS specific date
                if (c.notifiedEventDate !== tomorrowStr) {
                    
                    const msg = `🔔 <b>ការរំលឹកកម្មវិធីសំណុំរឿង (ថ្ងៃស្អែក)</b>\n\n📁 <b>សំណុំរឿង៖</b> ${c.caseNumber}\n⚖️ <b>ប្រភេទវិវាទ៖</b> ${c.category}\n🗓 <b>កម្មវិធី៖</b> ${c.caseEvent}\n📍 <b>ទីតាំង៖</b> ${c.disputeLocation}\n\n🧑 <b>ភាគីក៖</b> ${c.partyA_name} (${c.partyA_phone || 'គ្មានលេខ'})\n🧑 <b>ភាគីខ៖</b> ${c.partyB_name} (${c.partyB_phone || 'គ្មានលេខ'})`;

                    sendTelegramMessage(msg).then(success => {
                        if (success) {
                            c.notifiedEventDate = tomorrowStr;
                            hasChanges = true;
                            // Save periodically or after success
                            if (typeof saveCases === 'function') {
                                saveCases();
                            }
                        }
                    });
                }
            }
        });
    }
}
