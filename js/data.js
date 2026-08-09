/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - DATA LAYER (js/data.js) - NADR MASTER REVAMP
   Handles 25 Provinces, 8 Categories, 4 Statuses, 3 Meeting Progress options,
   Local Storage CRUD, Mock Data, and Excel/JSON Data Import Engine.
   ========================================================================== */

// 1. បញ្ជី ២៥ រាជធានី-ខេត្ត ជាមួយអក្សរកាត់ (Provinces & Capital List)
const DEFAULT_PROVINCES = [
    { code: 'PNH', name: 'ភ្នំពេញ' },
    { code: 'BMC', name: 'បន្ទាយមានជ័យ' },
    { code: 'BAT', name: 'បាត់ដំបង' },
    { code: 'KPC', name: 'កំពង់ចាម' },
    { code: 'KCH', name: 'កំពង់ឆ្នាំង' },
    { code: 'KPS', name: 'កំពង់ស្ពឺ' },
    { code: 'KPT', name: 'កំពង់ធំ' },
    { code: 'KOT', name: 'កំពត' },
    { code: 'KDL', name: 'កណ្ដាល' },
    { code: 'KKG', name: 'កោះកុង' },
    { code: 'KIE', name: 'ក្រចេះ' },
    { code: 'MDK', name: 'មណ្ឌលគិរី' },
    { code: 'OMC', name: 'ឧត្ដរមានជ័យ' },
    { code: 'SHV', name: 'ព្រះសីហនុ' },
    { code: 'PRV', name: 'ព្រះវិហារ' },
    { code: 'PST', name: 'ពោធិ៍សាត់' },
    { code: 'PVG', name: 'ព្រៃវែង' },
    { code: 'RTK', name: 'រតនគិរី' },
    { code: 'SRP', name: 'សៀមរាប' },
    { code: 'STR', name: 'ស្ទឹងត្រែង' },
    { code: 'SVR', name: 'ស្វាយរៀង' },
    { code: 'TAK', name: 'តាកែវ' },
    { code: 'TKM', name: 'ត្បូងឃ្មុំ' },
    { code: 'PLN', name: 'ប៉ៃលិន' },
    { code: 'KEP', name: 'កែប' }
];
let PROVINCES_LIST = JSON.parse(localStorage.getItem('nadr_provinces')) || [...DEFAULT_PROVINCES];

// 2. ប្រភេទសំណុំរឿង ៨ ប្រភេទ (8 Case Categories)
const DEFAULT_CATEGORIES = [
    'វិវាទកិច្ចសន្យា',
    'វិវាទក្នុងគ្រួសារ',
    'វិវាទជំពាក់ប្រាក់',
    'វិវាទដីធ្លី',
    'វិវាទពាណិជ្ជកម្ម',
    'វិវាទមត៌ក',
    'វិវាទអចលនវត្ថុ',
    'វិវាទការងារ'
];
let CASE_CATEGORIES = JSON.parse(localStorage.getItem('nadr_categories')) || [...DEFAULT_CATEGORIES];

// Custom Columns Schema
let CUSTOM_COLUMNS = JSON.parse(localStorage.getItem('nadr_custom_columns')) || [];

// Organization & Audit Logs Schema
let ORG_SETTINGS = JSON.parse(localStorage.getItem('nadr_org_settings')) || {
    nameKm: 'អាជ្ញាធរជាតិដោះស្រាយវិវាទ (អ.ដ.វ.)',
    nameEn: 'National Authority for Dispute Resolution (NADR)',
    casePrefix: 'NADR-2026-'
};

let AUDIT_LOGS = JSON.parse(localStorage.getItem('nadr_audit_logs')) || [
    { timestamp: new Date().toLocaleString('km-KH'), user: 'Admin', action: 'ចូលប្រព័ន្ធ (Login)', details: 'បានចូលប្រើប្រព័ន្ធគ្រប់គ្រងសំណុំរឿង NADR' }
];

function logAuditAction(action, details) {
    const entry = {
        timestamp: new Date().toLocaleString('km-KH'),
        user: document.getElementById('header-user-name')?.innerText || 'Admin',
        action: action,
        details: details
    };
    AUDIT_LOGS.unshift(entry);
    if (AUDIT_LOGS.length > 100) AUDIT_LOGS = AUDIT_LOGS.slice(0, 100);
    localStorage.setItem('nadr_audit_logs', JSON.stringify(AUDIT_LOGS));
    if (typeof renderAuditLogs === 'function') renderAuditLogs();
}


// 3. លទ្ធផលសំណុំរឿង ៤ ស្ថានភាព (4 Case Statuses)
const CASE_STATUSES = [
    'Active (កំពុងសម្រុះសម្រួល)',
    'Settle (ព្រមព្រៀង)',
    'Close (បិទ)',
    'Pending (តម្កល់)'
];

// ៤ & ៥. កិច្ចប្រជុំប្រមូលព័ត៌មាន ភាគី ក & ខ (3 Options for Information Gathering)
const MEETING_INFO_OPTIONS = [
    'មិនទាន់ប្រជុំ',
    'ភាគីមិនចូលរួម',
    'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់'
];

// ៦. ប្រជុំសម្រុះសម្រួល (5 Options for Mediation Meeting)
const MEDIATION_MEETING_OPTIONS = [
    'មិនទាន់ប្រជុំ',
    'ភាគីមិនចូលរួម',
    'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)',
    'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
    'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)'
];

// ៧. កំណត់ចំណាំ (2 Options for Remarks)
const REMARKS_OPTIONS = [
    'បានបិទរួចរាល់',
    'មិនទាន់បិទ'
];

// LocalStorage Key
const STORAGE_KEY = 'nadr_master_cases_data_v3_empty';

// 8. ទិន្នន័យគំរូសំណុំរឿងគោល NADR ចំនួន ១០ ករណី (Mock Data matching Master Excel)
const mockCasesData = [];

let casesData = [];

/**
 * Initialize and load cases from LocalStorage or seed Mock Data
 */
function loadCases() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            casesData = JSON.parse(stored);
            
            // Auto-fix corrupted Excel serial dates in existing data
            let needsSave = false;
            casesData.forEach(c => {
                if (c.dateReceived && !isNaN(c.dateReceived) && parseFloat(c.dateReceived) > 20000 && parseFloat(c.dateReceived) < 90000) {
                    const serial = parseFloat(c.dateReceived);
                    const utc_days = Math.floor(serial - 25569);
                    const date_info = new Date(utc_days * 86400 * 1000);
                    c.dateReceived = String(date_info.getDate()).padStart(2, '0') + '/' + 
                                     String(date_info.getMonth() + 1).padStart(2, '0') + '/' + 
                                     date_info.getFullYear();
                    needsSave = true;
                }
            });
            if (needsSave) saveCases();
            
        } else {
            casesData = [...mockCasesData];
            saveCases();
        }
    } catch (e) {
        console.error('Error loading NADR cases:', e);
        casesData = [...mockCasesData];
    }
}

/**
 * Save current casesData array to LocalStorage
 */
function saveCases() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(casesData));
    } catch (e) {
        console.error('Error saving NADR cases:', e);
    }
}

/**
 * Add a new case
 */
function addCase(newCase) {
    const caseObj = {
        id: 'case-nadr-' + Date.now() + '-' + Math.floor(Math.random()*1000),
        caseNumber: newCase.caseNumber || generateNextCaseNumber(),
        dateReceived: newCase.dateReceived || getTodayDateString(),
        partyA_name: newCase.partyA_name || '',
        partyA_gender: newCase.partyA_gender || 'ប្រុស',
        partyA_age: newCase.partyA_age || '',
        partyA_phone: newCase.partyA_phone || '',
        partyA_location: newCase.partyA_location || 'ភ្នំពេញ',
        partyB_name: newCase.partyB_name || '',
        partyB_gender: newCase.partyB_gender || 'ប្រុស',
        partyB_age: newCase.partyB_age || '',
        partyB_phone: newCase.partyB_phone || '',
        partyB_location: newCase.partyB_location || 'ភ្នំពេញ',
        category: newCase.category || 'វិវាទកិច្ចសន្យា',
        disputeLocation: newCase.disputeLocation || 'ភ្នំពេញ',
        summary: newCase.summary || '',
        caseEvent: newCase.caseEvent || '',
        caseEventDate: newCase.caseEventDate || '',
        caseEventTime: newCase.caseEventTime || '',
        notifiedEventDate: newCase.notifiedEventDate || '',
        notifiedOneHour: newCase.notifiedOneHour || false,
        meetingPartyA: newCase.meetingPartyA || 'មិនទាន់ប្រជុំ',
        meetingPartyB: newCase.meetingPartyB || 'មិនទាន់ប្រជុំ',
        mediationMeeting: newCase.mediationMeeting || 'មិនទាន់ប្រជុំ',
        status: newCase.status || 'Active (កំពុងសម្រុះសម្រួល)',
        remarks: newCase.remarks || 'មិនទាន់បិទ',
        createdAt: getTodayDateString(),
        updatedAt: getTodayDateString()
    };
    casesData.unshift(caseObj);
    saveCases();
    return caseObj;
}

/**
 * Update existing case by id
 */
function updateCase(id, updatedFields) {
    const index = casesData.findIndex(c => c.id === id);
    if (index !== -1) {
        casesData[index] = {
            ...casesData[index],
            ...updatedFields,
            updatedAt: getTodayDateString()
        };
        saveCases();
        return casesData[index];
    }
    return null;
}

/**
 * Delete case by id
 */
function deleteCase(id) {
    const c = getCaseById(id);
    if (!c) return false;

    // Call external APIs if necessary
    if (c.googleEventId && typeof deleteFromGoogleCalendar === 'function') {
        deleteFromGoogleCalendar(c.googleEventId);
    }
    if (c.caseEvent && typeof notifyTelegramEventCancelled === 'function') {
        notifyTelegramEventCancelled(c.caseNumber, c.caseEvent);
    }

    const initialLength = casesData.length;
    casesData = casesData.filter(caseObj => caseObj.id !== id);
    if (casesData.length !== initialLength) {
        saveCases();
        return true;
    }
    return false;
}

/**
 * Get single case by ID
 */
function getCaseById(id) {
    return casesData.find(c => c.id === id) || null;
}

/**
 * Auto-generate next Case Number (e.g., NADR-2026-011)
 */
function generateNextCaseNumber() {
    const prefix = ORG_SETTINGS?.casePrefix || `NADR-${new Date().getFullYear()}-`;
    let maxNum = 0;
    casesData.forEach(c => {
        if (c.caseNumber && c.caseNumber.startsWith(prefix)) {
            const numPart = parseInt(c.caseNumber.replace(prefix, ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    });
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Filter cases based on search query, category, status, and location
 */
function filterCases(filters = {}) {
    return casesData.filter(c => {
        // Search query (matches caseNumber, partyA_name, partyB_name, summary, officer)
        if (filters.search && filters.search.trim() !== '') {
            const q = filters.search.toLowerCase().trim();
            const matchNum = c.caseNumber?.toLowerCase().includes(q);
            const matchPA = c.partyA_name?.toLowerCase().includes(q);
            const matchPB = c.partyB_name?.toLowerCase().includes(q);
            const matchSum = c.summary?.toLowerCase().includes(q);
            if (!matchNum && !matchPA && !matchPB && !matchSum) {
                return false;
            }
        }
        // Category Filter
        if (filters.category && filters.category !== '' && filters.category !== 'ALL') {
            if (c.category !== filters.category) return false;
        }
        // Status Filter
        if (filters.status && filters.status !== '' && filters.status !== 'ALL') {
            if (filters.status.startsWith('No Settle') || filters.status.startsWith('Close')) {
                if (!c.status.startsWith('No Settle') && !c.status.startsWith('Close') && !c.status.includes('មិនព្រមព្រៀង')) return false;
            } else if (c.status !== filters.status && !c.status.startsWith(filters.status.split(' ')[0])) {
                return false;
            }
        }
        // Location Filter
        if (filters.location && filters.location !== '' && filters.location !== 'ALL') {
            if (c.disputeLocation !== filters.location) return false;
        }
        // Date Range Filter
        if (filters.startDate && filters.startDate !== '') {
            if (c.dateReceived < filters.startDate) return false;
        }
        if (filters.endDate && filters.endDate !== '') {
            if (c.dateReceived > filters.endDate) return false;
        }
        // Event Filter
        if (filters.event && filters.event !== 'ALL') {
            if (filters.event === 'HAS_EVENT') {
                if (!c.caseEvent || c.caseEvent === '') return false;
            } else if (filters.event === 'NO_EVENT') {
                if (c.caseEvent && c.caseEvent !== '') return false;
            } else {
                if (c.caseEvent !== filters.event) return false;
            }
        }
        return true;
    });
}

/**
 * Sort cases by specific field
 */
function sortCases(casesArray, sortBy = 'date-asc') {
    const sorted = [...casesArray];
    sorted.sort((a, b) => {
        switch (sortBy) {
            case 'date-asc':
                return a.dateReceived.localeCompare(b.dateReceived) || a.caseNumber.localeCompare(b.caseNumber, undefined, {numeric: true});
            case 'date-desc':
                return b.dateReceived.localeCompare(a.dateReceived) || b.caseNumber.localeCompare(a.caseNumber, undefined, {numeric: true});
            case 'number-asc':
                return a.caseNumber.localeCompare(b.caseNumber, undefined, {numeric: true});
            case 'number-desc':
                return b.caseNumber.localeCompare(a.caseNumber, undefined, {numeric: true});
            default:
                return a.dateReceived.localeCompare(b.dateReceived) || a.caseNumber.localeCompare(b.caseNumber, undefined, {numeric: true});
        }
    });
    return sorted;
}

/**
 * Calculate statistical breakdown for Dashboard and Analytics
 */
function getCaseStatistics(customData = null) {
    const data = customData || casesData;
    const stats = {
        total: data.length,
        active: 0,
        settle: 0,
        close: 0,
        pending: 0,
        activeGroupTotal: 0,
        closedGroupTotal: 0,
        noSettleReason1: 0,
        noSettleReason2: 0,
        settleRate: 0,
        byCategory: {},
        byLocation: {}
    };

    // Initialize category counts
    CASE_CATEGORIES.forEach(cat => { stats.byCategory[cat] = 0; });
    PROVINCES_LIST.forEach(p => { stats.byLocation[p.name] = 0; });

    data.forEach(c => {
        // Status counts & Hierarchical groups
        if (c.status.startsWith('Active')) {
            stats.active++;
            stats.activeGroupTotal++;
        } else if (c.status.startsWith('Pending')) {
            stats.pending++;
            stats.activeGroupTotal++;
        } else if (c.status.startsWith('Settle')) {
            stats.settle++;
            stats.closedGroupTotal++;
        } else if (c.status.startsWith('Close') || c.status.startsWith('No Settle') || c.status.includes('មិនព្រមព្រៀង')) {
            stats.close++;
            stats.closedGroupTotal++;
            if (c.remarks && c.remarks.includes('ដកពាក្យបណ្តឹង')) {
                stats.noSettleReason1++;
            } else {
                stats.noSettleReason2++;
            }
        }

        // Category counts
        if (stats.byCategory[c.category] !== undefined) {
            stats.byCategory[c.category]++;
        } else {
            stats.byCategory[c.category] = 1;
        }

        // Location counts
        if (stats.byLocation[c.disputeLocation] !== undefined) {
            stats.byLocation[c.disputeLocation]++;
        } else {
            stats.byLocation[c.disputeLocation] = 1;
        }
    });

    // Calculate Settle Success Rate (%)
    const resolvedTotal = stats.settle + stats.close;
    if (stats.total > 0) {
        stats.settleRate = ((stats.settle / stats.total) * 100).toFixed(1);
    }

    return stats;
}

/**
 * Export current database as JSON backup
 */
function exportBackupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(casesData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `NADR_Master_Backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('បានទាញយកឯកសារ Backup (.json) ដោយជោគជ័យ!', 'success');
}

/**
 * Import backup JSON file
 */
function importBackupJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData) && importedData.length > 0) {
                casesData = importedData;
                saveCases();
                if (typeof renderAllViews === 'function') {
                    renderAllViews();
                }
                showToast(`បានបញ្ចូលទិន្នន័យពី Backup ចំនួន ${casesData.length} សំណុំរឿងដោយជោគជ័យ!`, 'success');
            } else {
                showToast('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវ ឬគ្មានទិន្នន័យ!', 'error');
            }
        } catch (err) {
            showToast('បរាជ័យក្នុងការអានឯកសារ JSON Backup!', 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * Import from Excel rows (SheetJS JSON object array)
 */
function importFromExcelRows(excelRows) {
    if (!Array.isArray(excelRows) || excelRows.length === 0) {
        showToast('គ្មានទិន្នន័យក្នុងឯកសារ Excel ទេ!', 'error');
        return 0;
    }

    let addedCount = 0;
    excelRows.forEach(row => {
        // Try to map column names flexibly (supporting Khmer and English headers)
        const caseNum = row['លេខកូដសំណុំរឿង'] || row['លេខកូដ'] || row['Case Code'] || row['Case Number'] || generateNextCaseNumber();
        const dateRec = row['កាលបរិច្ឆេទ'] || row['ថ្ងៃ ខែ ឆ្នាំ'] || row['Date'] || getTodayDateString();
        
        const paName = row['ឈ្មោះភាគី (ក)'] || row['ភាគី ក'] || row['ដើមបណ្ដឹង'] || row['Plaintiff'] || 'ភាគី ក';
        const paGender = row['ភេទភាគី (ក)'] || row['ភេទ (ក)'] || 'ប្រុស';
        const paAge = row['អាយុភាគី (ក)'] || row['អាយុ (ក)'] || '';
        const paPhone = row['ទូរស័ព្ទភាគី (ក)'] || row['លេខទូរស័ព្ទ (ក)'] || '';
        const paLoc = row['ទីតាំងភាគី (ក)'] || row['អាសយដ្ឋានភាគី (ក)'] || 'ភ្នំពេញ';

        const pbName = row['ឈ្មោះភាគី (ខ)'] || row['ភាគី ខ'] || row['ចុងបណ្ដឹង'] || row['Defendant'] || 'ភាគី ខ';
        const pbGender = row['ភេទភាគី (ខ)'] || row['ភេទ (ខ)'] || 'ប្រុស';
        const pbAge = row['អាយុភាគី (ខ)'] || row['អាយុ (ខ)'] || '';
        const pbPhone = row['ទូរស័ព្ទភាគី (ខ)'] || row['លេខទូរស័ព្ទ (ខ)'] || '';
        const pbLoc = row['ទីតាំងភាគី (ខ)'] || row['អាសយដ្ឋានភាគី (ខ)'] || 'ភ្នំពេញ';

        const cat = row['ប្រភេទសំណុំរឿង'] || row['ប្រភេទវិវាទ'] || row['Category'] || 'វិវាទកិច្ចសន្យា';
        const dispLoc = row['ទីតាំងវិវាទ'] || row['Dispute Location'] || 'ភ្នំពេញ';
        const sum = row['សេចក្តីសង្ខេបវិវាទ'] || row['សេចក្តីសង្ខេប'] || row['Summary'] || 'នាំចូលពីឯកសារ Excel គោល';

        const meetA = row['ប្រជុំភាគី (ក)'] || row['កិច្ចប្រជុំប្រមូលព័ត៌មាន ភាគី "ក"'] || 'មិនទាន់ប្រជុំ';
        const meetB = row['ប្រជុំភាគី (ខ)'] || row['កិច្ចប្រជុំប្រមូលព័ត៌មាន ភាគី "ខ"'] || 'មិនទាន់ប្រជុំ';
        const medMeet = row['ប្រជុំសម្រុះសម្រួល'] || row['ចំណាត់ការសម្រុះសម្រួល'] || 'មិនទាន់ប្រជុំ';
        
        let st = row['លទ្ធផលសំណុំរឿង'] || row['លទ្ធផល'] || row['Status'] || 'Active (កំពុងសម្រុះសម្រួល)';
        if (st === 'Active') st = 'Active (កំពុងសម្រុះសម្រួល)';
        else if (st === 'Settle') st = 'Settle (ព្រមព្រៀង)';
        else if (st === 'Close') st = 'Close (បិទ)';
        else if (st === 'Pending') st = 'Pending (តម្កល់)';

        const rem = row['កំណត់ចំណាំ'] || row['Remarks'] || 'មិនទាន់បិទ';

        // Check if caseNumber already exists to avoid exact duplicates
        const exists = casesData.some(c => c.caseNumber === caseNum);
        if (!exists) {
            casesData.unshift({
                id: 'case-nadr-import-' + Date.now() + '-' + Math.floor(Math.random()*10000),
                caseNumber: String(caseNum),
                dateReceived: String(dateRec).substring(0, 10),
                partyA_name: String(paName),
                partyA_gender: String(paGender),
                partyA_age: paAge,
                partyA_phone: String(paPhone),
                partyA_location: String(paLoc),
                partyB_name: String(pbName),
                partyB_gender: String(pbGender),
                partyB_age: pbAge,
                partyB_phone: String(pbPhone),
                partyB_location: String(pbLoc),
                category: String(cat),
                disputeLocation: String(dispLoc),
                summary: String(sum),
                meetingPartyA: String(meetA),
                meetingPartyB: String(meetB),
                mediationMeeting: String(medMeet),
                status: String(st),
                                remarks: String(rem),
                createdAt: getTodayDateString(),
                updatedAt: getTodayDateString()
            });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveCases();
        if (typeof renderAllViews === 'function') {
            renderAllViews();
        }
        showToast(`បានទាញយក និងបញ្ចូលទិន្នន័យពី Excel ចំនួន ${addedCount} សំណុំរឿងថ្មីដោយជោគជ័យ!`, 'success');
    } else {
        showToast('ពុំមានទិន្នន័យថ្មីត្រូវបានបញ្ចូលទេ (អាចដោយសារលេខកូដសំណុំរឿងស្ទួន)!', 'info');
    }
    return addedCount;
}

/**
 * Reset data to initial 10 NADR mock cases
 */
function resetToMockData() {
    casesData = [...mockCasesData];
    saveCases();
}

/**
 * Helper: Get today's date as YYYY-MM-DD
 */
function getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Generate and download Sample Excel Template for Case Entry (.xlsx)
 */
function generateExcelTemplate() {
    if (typeof XLSX === 'undefined') {
        alert('សូមអភ័យទោស បណ្ណាល័យ SheetJS (XLSX) មិនទាន់បានផ្ទុកទេ! សូមពិនិត្យការភ្ជាប់អ៊ីនធឺណិត។');
        return;
    }

    const templateRows = [
        {
            "លេខកូដសំណុំរឿង": "NADR-2026-001",
            "កាលបរិច្ឆេទ": "2026-07-26",
            "ឈ្មោះភាគី ក (ដើមបណ្តឹង)": "សុខ សុវត្ថិ",
            "ភេទ ក": "ប្រុស",
            "អាយុ ក": 45,
            "ទូរស័ព្ទ ក": "012345678",
            "ខេត្ត ក": "ភ្នំពេញ",
            "ឈ្មោះភាគី ខ (ចុងបណ្តឹង)": "ចាន់ សុខា",
            "ភេទ ខ": "ប្រុស",
            "អាយុ ខ": 50,
            "ទូរស័ព្ទ ខ": "098765432",
            "ខេត្ត ខ": "ភ្នំពេញ",
            "ប្រភេទវិវាទ": "វិវាទដីធ្លី",
            "ទីតាំងវិវាទ": "ភ្នំពេញ",
            "សេចក្តីសង្ខេប": "វិវាទព្រំប្រទល់ដី និងរបងផ្ទះ",
            "ប្រជុំភាគី ក": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
            "ប្រជុំភាគី ខ": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
            "ប្រជុំសម្រុះសម្រួល": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
            "លទ្ធផលសំណុំរឿង": "Active (កំពុងសម្រុះសម្រួល)",
            "កំណត់ចំណាំ": "កំពុងពិនិត្យ និងដោះស្រាយ (មិនទាន់បិទ)"
        },
        {
            "លេខកូដសំណុំរឿង": "NADR-2026-002",
            "កាលបរិច្ឆេទ": "2026-07-26",
            "ឈ្មោះភាគី ក (ដើមបណ្តឹង)": "ម៉ែន ស្រីពៅ",
            "ភេទ ក": "ស្រី",
            "អាយុ ក": 35,
            "ទូរស័ព្ទ ក": "016111222",
            "ខេត្ត ក": "កណ្តាល",
            "ឈ្មោះភាគី ខ (ចុងបណ្តឹង)": "កែវ វាសនា",
            "ភេទ ខ": "ប្រុស",
            "អាយុ ខ": 38,
            "ទូរស័ព្ទ ខ": "017333444",
            "ខេត្ត ខ": "កណ្តាល",
            "ប្រភេទវិវាទ": "វិវាទកិច្ចសន្យា",
            "ទីតាំងវិវាទ": "កណ្តាល",
            "សេចក្តីសង្ខេប": "វិវាទកិច្ចសន្យាខ្ចីប្រាក់ និងខុសសន្យា",
            "ប្រជុំភាគី ក": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
            "ប្រជុំភាគី ខ": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
            "ប្រជុំសម្រុះសម្រួល": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
            "លទ្ធផលសំណុំរឿង": "Settle (ព្រមព្រៀង)",
            "កំណត់ចំណាំ": "សម្រុះសម្រួលព្រមព្រៀងជោគជ័យ (បានបិទរួចរាល់)"
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
        { wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
        { wch: 18 }, { wch: 14 }, { wch: 35 },
        { wch: 30 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'គំរូតារាងបញ្ជីសំណុំរឿង');
    XLSX.writeFile(workbook, 'CMS_Case_Entry_Template.xlsx');
}

// ===========================================================================
// I18N DICTIONARY — BILINGUAL LANGUAGE SUPPORT (ខ្មែរ / English)
// ===========================================================================

let currentLang = localStorage.getItem('nadr_app_lang') || 'km';

const I18N = {
    // ------------ Sidebar Navigation ------------
    'nav.main': { km: 'មេនុយទូទៅ (MAIN)', en: 'MAIN MENU' },
    'nav.entry': { km: 'បញ្ចូលសំណុំរឿង', en: 'Case Entry' },
    'entry.title': { km: 'បញ្ជាក់ និងបញ្ចូលសំណុំរឿងថ្មី (Case Intake & Registration Center)', en: 'Case Intake & Registration Center' },
    'entry.subtitle': { km: 'ទទួលពាក្យបណ្តឹង ចាត់បែងចែកលេខកូដ និងបញ្ចូលទិន្នន័យសំណុំរឿងវិវាទចូលក្នុងប្រព័ន្ធ NADR', en: 'Receive complaints, assign case numbers, and register dispute records into NADR system' },
    'nav.dashboard': { km: 'ផ្ទាំងស្ថិតិសង្ខេប', en: 'Dashboard' },
    'nav.cases': { km: 'បញ្ជីសំណុំរឿង', en: 'Case List' },
    'nav.analytics': { km: 'វិភាគវាយតម្លៃចំណាត់ការ', en: 'Analytics & Assessment' },
    'nav.admin': { km: 'រដ្ឋបាល & ទិន្នន័យ (ADMIN)', en: 'ADMIN & DATA' },
    'nav.reports': { km: 'ផលិតរបាយការណ៍', en: 'Report Generator' },
    'nav.data': { km: 'ទាញទិន្នន័យចូល & បម្រុង', en: 'Import & Backup' },
    'nav.settings': { km: 'ការកំណត់ប្រព័ន្ធ', en: 'System Settings' },
    'sidebar.subtitle': { km: 'អាជ្ញាធរជាតិដោះស្រាយវិវាទ', en: 'National Authority for Dispute Resolution' },

    // ------------ Top Header ------------
    'header.search': { km: 'ស្វែងរកលេខកូដសំណុំរឿង ឬឈ្មោះភាគី ក/ខ...', en: 'Search case code or party name...' },
    'header.addCase': { km: 'បង្កើតសំណុំរឿងថ្មី', en: 'New Case' },
    'header.logout': { km: 'ចាកចេញ (Logout)', en: 'Logout' },

    // ------------ Dashboard Section ------------
    'dashboard.title': { km: 'ផ្ទាំងស្ថិតិសង្ខេបទូទៅ', en: 'General Statistics Dashboard' },
    'dashboard.subtitle': { km: 'តាមដានស្ថានភាពសំណុំរឿង និងលំហូរដោះស្រាយវិវាទប្រចាំស្ថាប័ន', en: 'Track case statuses and institutional dispute resolution workflows' },
    'dashboard.refresh': { km: 'ធ្វើបច្ចុប្បន្នភាព', en: 'Refresh' },
    'dashboard.section1': { km: '១. ស្ថិតិសង្ខេបតាមស្ថានភាពកាត (៥ ស្ថានភាព - ដូចក្នុងរូប)', en: '1. Summary Statistics by Status (5 Statuses)' },
    'dashboard.section2': { km: '២. លទ្ធផលចំណាត់ការសំណុំរឿងរួម', en: '2. Overall Case Disposition Results' },
    'dashboard.total': { km: 'សរុបសំណុំរឿង', en: 'Total Cases' },
    'dashboard.active': { km: 'កំពុងចាត់ការ', en: 'Active' },
    'dashboard.settle': { km: 'ព្រមព្រៀង', en: 'Settled' },
    'dashboard.noSettle': { km: 'មិនព្រមព្រៀង', en: 'Not Settled' },
    'dashboard.pending': { km: 'តម្កល់', en: 'Pending' },

    // ------------ Cases View ------------
    'cases.title': { km: 'បញ្ជីសំណុំរឿង (Master Case Directory)', en: 'Master Case Directory' },
    'cases.subtitle': { km: 'រក្សាទុក ស្វែងរក និងគ្រប់គ្រងសំណុំរឿងទាំងអស់ ក្នុងស្ថាប័ន NADR', en: 'Store, search, and manage all cases at NADR' },
    'cases.filter.all': { km: 'ទាំងអស់', en: 'All' },
    'cases.filter.active': { km: 'Active', en: 'Active' },
    'cases.filter.settle': { km: 'Settle', en: 'Settled' },
    'cases.filter.noSettle': { km: 'No Settle', en: 'Not Settled' },
    'cases.filter.pending': { km: 'Pending', en: 'Pending' },
    'cases.addNew': { km: 'បន្ថែមសំណុំរឿង', en: 'Add Case' },

    // ------------ Table Headers ------------
    'table.no': { km: 'ល.រ', en: 'No.' },
    'table.caseCode': { km: 'លេខកូដ', en: 'Case Code' },
    'table.partyA': { km: 'ឈ្មោះភាគី ក', en: 'Party A' },
    'table.partyB': { km: 'ឈ្មោះភាគី ខ', en: 'Party B' },
    'table.category': { km: 'ប្រភេទសំណុំរឿង', en: 'Category' },
    'table.location': { km: 'ទីតាំងវិវាទ', en: 'Dispute Location' },
    'table.date': { km: 'កាលបរិច្ឆេទ', en: 'Date Received' },
    'table.status': { km: 'លទ្ធផល', en: 'Status' },
    'table.remarks': { km: 'កំណត់ចំណាំ', en: 'Remarks' },
    'table.actions': { km: 'សកម្មភាព', en: 'Actions' },

    // ------------ Modal: Case Entry Form ------------
    'modal.addTitle': { km: 'បញ្ចូលព័ត៌មានសំណុំរឿងគោល', en: 'Enter Case Information' },
    'modal.editTitle': { km: 'កែសម្រួលសំណុំរឿង', en: 'Edit Case' },
    'modal.section1': { km: '១. ព័ត៌មានទូទៅនៃសំណុំរឿង', en: '1. General Case Info' },
    'modal.section2': { km: '២. អត្តសញ្ញាណភាគី ក (ដើមបណ្តឹង)', en: '2. Party A (Complainant)' },
    'modal.section3': { km: '៣. អត្តសញ្ញាណភាគី ខ (ចុងបណ្តឹង)', en: '3. Party B (Respondent)' },
    'modal.section4': { km: '៤. សេចក្តីសង្ខេប និងវឌ្ឍនភាពសំណុំរឿង', en: '4. Case Summary & Progress' },
    'modal.section5': { km: '៥. លទ្ធផល និងចំណាត់ការសំណុំរឿង', en: '5. Case Result & Disposition' },
    'modal.save': { km: 'រក្សាទុកសំណុំរឿង', en: 'Save Case' },
    'modal.cancel': { km: 'បោះបង់ (Cancel)', en: 'Cancel' },

    // ------------ Form Labels ------------
    'form.caseCode': { km: 'លេខកូដសំណុំរឿង (Case Code)', en: 'Case Code' },
    'form.dateReceived': { km: 'កាលបរិច្ឆេទទទួល (Date Received)', en: 'Date Received' },
    'form.category': { km: 'ប្រភេទសំណុំរឿង (៨ ប្រភេទ)', en: 'Case Category (8 Types)' },
    'form.disputeLocation': { km: 'ទីតាំងវិវាទ (២៥ រាជធានី-ខេត្ត ជាមួយលេខកូដ)', en: 'Dispute Location (25 Provinces)' },
    'form.partyName': { km: 'ឈ្មោះ', en: 'Name' },
    'form.gender': { km: 'ភេទ', en: 'Gender' },
    'form.age': { km: 'អាយុ (ឆ្នាំ)', en: 'Age (years)' },
    'form.phone': { km: 'ទូរស័ព្ទ', en: 'Phone' },
    'form.address': { km: 'អាសយដ្ឋាន', en: 'Address' },
    'form.summary': { km: 'សេចក្តីសង្ខេបសំណុំរឿង', en: 'Case Summary' },
    'form.meetingA': { km: 'ប្រជុំភាគី ក', en: 'Meeting Party A' },
    'form.meetingB': { km: 'ប្រជុំភាគី ខ', en: 'Meeting Party B' },
    'form.mediation': { km: 'ប្រជុំសម្រុះសម្រួល (ដោះស្រាយវិវាទ)', en: 'Mediation Meeting' },
    'form.actionGroup': { km: 'ចំណាត់ការរួម (Action Group)', en: 'Action Group' },
    'form.status': { km: 'លទ្ធផលសំណុំរឿង (៤ ស្ថានភាព)', en: 'Case Status (4 Types)' },
    'form.remarks': { km: 'កំណត់ចំណាំ / មូលហេតុ (Remarks / Sub-reason)', en: 'Remarks / Sub-reason' },

    // ------------ View Modal (Dossier) ------------
    'view.title': { km: 'ប័ណ្ណព័ត៌មាន និងចំណាត់ការសំណុំរឿងគោល', en: 'Case Information Card & Disposition' },
    'view.quickStatus': { km: 'ប្តូរលទ្ធផលរហ័ស៖', en: 'Quick Status Update:' },
    'view.print': { km: 'បោះពុម្ពប័ណ្ណ', en: 'Print Card' },
    'view.edit': { km: 'កែសម្រួល', en: 'Edit' },
    'view.delete': { km: 'លុប', en: 'Delete' },
    'view.genDoc': { km: 'ផលិតលិខិតគតិយុត្ត (5 Docs)', en: 'Generate Legal Docs (5)' },

    // ------------ Analytics View ------------
    'analytics.title': { km: 'វិភាគវាយតម្លៃចំណាត់ការសំណុំរឿង', en: 'Case Disposition Analytics' },
    'analytics.subtitle': { km: 'ផ្ទាំងវិភាគការអនុវត្តន៍ បង្ហាញដោយតារាង និងក្រាហ្វិក', en: 'Performance analytics with charts and graphs' },

    // ------------ Reports View ------------
    'reports.title': { km: 'ផលិតរបាយការណ៍ និងការវិភាគ', en: 'Report Generation & Analysis' },
    'reports.subtitle': { km: 'បង្កើតរបាយការណ៍ និងនាំចេញទិន្នន័យស្ថាប័ន', en: 'Generate reports and export institutional data' },

    // ------------ Data Management View ------------
    'dataMgmt.title': { km: 'ទាញទិន្នន័យចូល & បម្រុងសុវត្ថិភាព', en: 'Data Import & Security Backup' },
    'dataMgmt.subtitle': { km: 'នាំចូល នាំចេញ ឬបម្រុងទុកទិន្នន័យក្នុងទម្រង់ JSON/Excel', en: 'Import, export, or backup data in JSON/Excel format' },
    'dataMgmt.exportJSON': { km: 'នាំចេញ JSON', en: 'Export JSON' },
    'dataMgmt.importJSON': { km: 'នាំចូល JSON', en: 'Import JSON' },
    'dataMgmt.exportExcel': { km: 'នាំចេញ Excel', en: 'Export Excel' },
    'dataMgmt.importExcel': { km: 'នាំចូល Excel', en: 'Import Excel' },
    'dataMgmt.clearAll': { km: 'លុបទិន្នន័យទាំងអស់', en: 'Clear All Data' },
    'dataMgmt.downloadTemplate': { km: 'ទាញយកគម្រូបញ្ចូលទិន្នន័យ Excel', en: 'Download Excel Template' },

    // ------------ AI Assistant ------------
    'ai.title': { km: 'AI ជំនួយការស្វ័យប្រវត្តិ (Smart Case Extraction)', en: 'AI Smart Case Extraction' },
    'ai.hint': { km: 'ទាញយកអត្តសញ្ញាណភាគី ក/ខ និងសេចក្តីសង្ខេប', en: 'Extract Party A/B identity & case summary' },
    'ai.placeholder': { km: 'វាយ ឬ Paste អត្ថបទពាក្យបណ្តឹង / កំណត់ហេតុនៅទីនេះ ដើម្បីឱ្យ AI វិភាគទាញយកអត្តសញ្ញាណភាគី និងទីតាំងស្វ័យប្រវត្តិ...', en: 'Type or paste complaint/notes here for AI auto-extraction of party details...' },
    'ai.upload': { km: 'Upload ឯកសារ (.txt, .doc...)', en: 'Upload File (.txt, .doc...)' },
    'ai.generate': { km: '✨ AI Generate អត្តសញ្ញាណសំណុំរឿង', en: '✨ AI Generate Case Details' },

    // ------------ Login Screen ------------
    'login.title': { km: 'សូមចូលគណនី', en: 'Sign In' },
    'login.subtitle': { km: 'ប្រព័ន្ធគ្រប់គ្រងសំណុំរឿង NADR-CMS Pro', en: 'NADR Case Management System (CMS Pro)' },
    'login.username': { km: 'ឈ្មោះអ្នកប្រើប្រាស់ (Username)', en: 'Username' },
    'login.password': { km: 'ពាក្យសម្ងាត់ (Password)', en: 'Password' },
    'login.btn': { km: 'ចូលប្រព័ន្ធ', en: 'Sign In' },

    // ------------ Legal Docs Modal ------------
    'docs.title': { km: 'ផលិតលិខិតបទដ្ឋានគតិយុត្តផ្លូវការ (Official Legal Documents)', en: 'Official Legal Document Generator' },
    'docs.selectType': { km: 'ប្រភេទលិខិតគតិយុត្ត (៥ ទម្រង់ផ្លូវការ)៖', en: 'Document Type (5 Official Formats):' },
    'docs.date': { km: 'កាលបរិច្ឆេទលិខិត / កិច្ចប្រជុំ៖', en: 'Document / Meeting Date:' },
    'docs.room': { km: 'ទីតាំង / សាលកិច្ចប្រជុំ៖', en: 'Location / Meeting Room:' },
    'docs.officer': { km: 'មន្ត្រីសម្របសម្រួល / ជំនាញទទួលបន្ទុក៖', en: 'Mediator / Officer in Charge:' },
    'docs.notes': { km: 'ខ្លឹមសារកែសម្រួល / លក្ខខណ្ឌព្រមព្រៀង / ចំណាំ៖', en: 'Custom Content / Agreement Terms / Notes:' },
    'docs.preview': { km: 'ធ្វើបច្ចុប្បន្នភាពគំរូ', en: 'Refresh Preview' },
    'docs.print': { km: 'បោះពុម្ព (Print / PDF)', en: 'Print / Save PDF' },

    // ------------ Misc / Common ------------
    'common.male': { km: 'ប្រុស', en: 'Male' },
    'common.female': { km: 'ស្រី', en: 'Female' },
    'common.loading': { km: 'កំពុងផ្ទុក...', en: 'Loading...' },
    'common.noData': { km: 'មិនមានទិន្នន័យ', en: 'No data available' },
    'common.confirm': { km: 'បញ្ជាក់', en: 'Confirm' },
    'common.yes': { km: 'បាទ/ចាស', en: 'Yes' },
    'common.no': { km: 'ទេ', en: 'No' },
    'sidebar.officer': { km: 'មន្ត្រីសម្របសម្រួល', en: 'Mediation Officer' },
    'sidebar.office': { km: 'ការិយាល័យរដ្ឋបាល NADR', en: 'NADR Admin Office' },
};

/**
 * Get translated text by key for the current language
 * @param {string} key - I18N dictionary key
 * @returns {string}
 */
function t(key) {
    const entry = I18N[key];
    if (!entry) return key;
    return entry[currentLang] || entry['km'] || key;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyLanguage(lang) {
    currentLang = lang || currentLang;
    localStorage.setItem('nadr_app_lang', currentLang);

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = val;
        } else {
            el.textContent = val;
        }
    });

    // Update all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });

    // Update language button active state
    const btnKm = document.getElementById('btn-lang-km');
    const btnEn = document.getElementById('btn-lang-en');
    if (btnKm && btnEn) {
        if (currentLang === 'km') {
            btnKm.classList.add('active');
            btnEn.classList.remove('active');
        } else {
            btnEn.classList.add('active');
            btnKm.classList.remove('active');
        }
    }
}
