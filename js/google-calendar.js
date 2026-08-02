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

    // Calculate end date (+1 day for full day events in Google Calendar API)
    const end = new Date(c.caseEventDate);
    end.setDate(end.getDate() + 1);
    const endDateStr = end.toISOString().split('T')[0];

    const eventBody = {
        'summary': `NADR: ${c.caseEvent} (${c.caseNumber})`,
        'location': c.disputeLocation || '',
        'description': `សំណុំរឿង៖ ${c.caseNumber}\nភាគីក៖ ${c.partyA_name}\nភាគីខ៖ ${c.partyB_name}`,
        'start': {
            'date': c.caseEventDate,
            'timeZone': 'Asia/Phnom_Penh'
        },
        'end': {
            'date': endDateStr,
            'timeZone': 'Asia/Phnom_Penh'
        }
    };

    try {
        const request = await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': eventBody
        });
        console.log('Event created: ' + request.result.htmlLink);
        if (typeof showToast === 'function') showToast('បានបញ្ជូនព្រឹត្តិការណ៍ទៅ Google Calendar រួចរាល់!', 'success');
    } catch (e) {
        console.error('Error inserting event:', e);
        if (typeof showToast === 'function') showToast('មានបញ្ហាក្នុងការបញ្ជូនទៅ Google Calendar', 'error');
    }
}
