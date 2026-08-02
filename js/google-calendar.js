/**
 * Google Calendar Integration Logic
 */

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function getGoogleClientId() {
    return localStorage.getItem('nadr_gcal_clientid') || '';
}

function saveGoogleSettings() {
    const cid = document.getElementById('setting-gcal-clientid').value.trim();
    if (cid) {
        localStorage.setItem('nadr_gcal_clientid', cid);
        if (typeof showToast === 'function') showToast('បានរក្សាទុក Client ID រួចរាល់។', 'success');
        // Re-init GIS
        initTokenClient();
    } else {
        if (typeof showToast === 'function') showToast('សូមបញ្ចូល Client ID', 'error');
    }
}

// Load logic
window.addEventListener('load', () => {
    setTimeout(() => {
        const cid = getGoogleClientId();
        if (document.getElementById('setting-gcal-clientid')) {
            document.getElementById('setting-gcal-clientid').value = cid;
        }
    }, 1000);
});

// Callback after gapi.js is loaded
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (e) {
        console.error('Error initializing GAPI client:', e);
    }
}

// Callback after gis client is loaded
function gisLoaded() {
    initTokenClient();
}

function initTokenClient() {
    const clientId = getGoogleClientId();
    if (!clientId) return; // Wait until they configure it
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (resp) => {
                if (resp.error !== undefined) {
                    throw (resp);
                }
                // Important: Set the token for gapi client to use
                gapi.client.setToken({ access_token: resp.access_token });
                
                document.getElementById('btn-google-signout').style.display = 'inline-block';
                document.getElementById('btn-google-auth').innerHTML = '<i class="fa-brands fa-google"></i> បានភ្ជាប់ Google Calendar រួចរាល់';
                if (typeof showToast === 'function') showToast('ភ្ជាប់ Google Calendar ជោគជ័យ!', 'success');
            },
        });
        gisInited = true;
        maybeEnableButtons();
    } catch (e) {
        console.error('GIS Error:', e);
    }
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        // Ready
    }
}

// Check if loaded periodically (since we used async script tags without explicit callback to these functions)
let gcalChecks = 0;
const gcalInterval = setInterval(() => {
    if (window.gapi && !gapiInited) gapiLoaded();
    if (window.google && !gisInited) gisLoaded();
    gcalChecks++;
    if ((gapiInited && gisInited) || gcalChecks > 20) clearInterval(gcalInterval);
}, 500);

function handleAuthClick() {
    const clientId = getGoogleClientId();
    if (!clientId) {
        if (typeof showToast === 'function') showToast('សូមរក្សាទុក Google Client ID ជាមុនសិន!', 'error');
        return;
    }
    if (!tokenClient) initTokenClient();
    if (tokenClient) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            document.getElementById('btn-google-signout').style.display = 'none';
            document.getElementById('btn-google-auth').innerHTML = '<i class="fa-brands fa-google"></i> ភ្ជាប់ជាមួយ Google Calendar';
            if (typeof showToast === 'function') showToast('បានផ្តាច់គណនី Google Calendar', 'info');
        });
    }
}

/**
 * Insert event into Google Calendar
 */
async function syncToGoogleCalendar(c) {
    if (!gapiInited || !gapi.client || !gapi.client.getToken()) {
        console.log('Google Calendar not authenticated, skipping sync.');
        return;
    }
    if (!c.caseEvent || !c.caseEventDate) return;

    // If we have a time, we use dateTime. Otherwise, full day event.
    let start, end;
    if (c.caseEventTime && c.caseEventTime !== '') {
        const dateTimeStr = `${c.caseEventDate}T${c.caseEventTime}:00+07:00`; // Assuming Phnom Penh timezone
        start = { 'dateTime': dateTimeStr, 'timeZone': 'Asia/Phnom_Penh' };
        
        // Assume 2 hours duration by default
        const endDate = new Date(`${c.caseEventDate}T${c.caseEventTime}:00`);
        endDate.setHours(endDate.getHours() + 2);
        const endDateTimeStr = endDate.toISOString().replace('.000Z', '+00:00'); // Note: it will be in UTC, so let's format locally
        
        // Better way to format end time with offset manually or just rely on new Date
        const endHour = String(endDate.getHours()).padStart(2, '0');
        const endMin = String(endDate.getMinutes()).padStart(2, '0');
        const endDateTimeStrLocal = `${c.caseEventDate}T${endHour}:${endMin}:00+07:00`;
        
        end = { 'dateTime': endDateTimeStrLocal, 'timeZone': 'Asia/Phnom_Penh' };
    } else {
        // Full day event
        const endFull = new Date(c.caseEventDate);
        endFull.setDate(endFull.getDate() + 1);
        const endDateStr = endFull.toISOString().split('T')[0];
        
        start = { 'date': c.caseEventDate, 'timeZone': 'Asia/Phnom_Penh' };
        end = { 'date': endDateStr, 'timeZone': 'Asia/Phnom_Penh' };
    }

    const eventBody = {
        'summary': `NADR: ${c.caseEvent} (${c.caseNumber})`,
        'location': c.disputeLocation || '',
        'description': `សំណុំរឿង៖ ${c.caseNumber}\nភាគីក៖ ${c.partyA_name}\nភាគីខ៖ ${c.partyB_name}`,
        'start': start,
        'end': end
    };

    try {
        let request;
        if (c.googleEventId) {
            // Update existing event
            request = await gapi.client.calendar.events.update({
                'calendarId': 'primary',
                'eventId': c.googleEventId,
                'resource': eventBody
            });
            console.log('Event updated: ' + request.result.htmlLink);
            if (typeof showToast === 'function') showToast('បានកែប្រែព្រឹត្តិការណ៍ក្នុង Google Calendar រួចរាល់!', 'success');
        } else {
            // Insert new event
            request = await gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': eventBody
            });
            console.log('Event created: ' + request.result.htmlLink);
            c.googleEventId = request.result.id;
            // Save the ID to our local storage
            if (typeof saveCases === 'function') saveCases();
            if (typeof showToast === 'function') showToast('បានបញ្ជូនព្រឹត្តិការណ៍ទៅ Google Calendar រួចរាល់!', 'success');
        }
    } catch (e) {
        console.error('Error with Google Calendar:', e);
        if (typeof showToast === 'function') showToast('មានបញ្ហាក្នុងការបញ្ជូនទៅ Google Calendar', 'error');
    }
}

/**
 * Sync all cases with events to Google Calendar
 */
async function syncAllEventsToGoogleCalendar() {
    if (!gapiInited || !gapi.client || !gapi.client.getToken()) {
        if (typeof showToast === 'function') showToast('សូមភ្ជាប់ Google Calendar ជាមុនសិន!', 'error');
        return;
    }
    
    if (typeof casesData === 'undefined' || !casesData || casesData.length === 0) {
        if (typeof showToast === 'function') showToast('មិនមានទិន្នន័យសំណុំរឿងទេ!', 'warning');
        return;
    }

    if (typeof showToast === 'function') showToast('កំពុងបញ្ជូនទិន្នន័យចាស់ៗទៅ Google Calendar...', 'info');

    let count = 0;
    for (let c of casesData) {
        if (c.caseEvent && c.caseEventDate) {
            await syncToGoogleCalendar(c);
            count++;
        }
    }

    if (typeof showToast === 'function') {
        if (count > 0) {
            showToast(`បានបញ្ជូនទិន្នន័យចំនួន ${count} ទៅ Google Calendar រួចរាល់!`, 'success');
        } else {
            showToast('មិនមានសំណុំរឿងណាដែលមានកម្មវិធីត្រូវបញ្ជូនទេ!', 'info');
        }
    }
}

/**
 * Delete event from Google Calendar
 */
async function deleteFromGoogleCalendar(eventId) {
    if (!gapiInited || !gapi.client || !gapi.client.getToken()) {
        console.log('Google Calendar not authenticated, skipping delete.');
        return;
    }
    if (!eventId) return;

    try {
        await gapi.client.calendar.events.delete({
            'calendarId': 'primary',
            'eventId': eventId
        });
        console.log('Event deleted from Google Calendar: ' + eventId);
    } catch (e) {
        console.error('Error deleting event from Google Calendar:', e);
    }
}
