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

            // Assign permanent list number to older cases ONLY IF missing
            let currentNo = 1;
            for (let i = casesData.length - 1; i >= 0; i--) {
                if (!casesData[i].originalListNo) {
                    casesData[i].originalListNo = currentNo;
                    needsSave = true;
                }
                currentNo = Math.max(currentNo, casesData[i].originalListNo || 0) + 1;
            }

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
    const nextListNo = casesData.length > 0 ? Math.max(...casesData.map(c => c.originalListNo || 0)) + 1 : 1;
    const caseObj = {
        originalListNo: newCase.originalListNo ? parseInt(newCase.originalListNo) : nextListNo,
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
            case 'default':
                return (a.originalListNo || 0) - (b.originalListNo || 0);
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
            const nextListNo = casesData.length > 0 ? Math.max(...casesData.map(c => c.originalListNo || 0)) + 1 : 1;
            casesData.unshift({
                originalListNo: nextListNo,
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
    'form.meetingA': { km: '៧.១ កិច្ចប្រជុំប្រមូលព័ត៌មាន ភាគី "ក"', en: '7.1 Meeting Party A' },
    'form.meetingB': { km: '៧.២ កិច្ចប្រជុំប្រមូលព័ត៌មាន ភាគី "ខ"', en: '7.2 Meeting Party B' },
    'form.mediation': { km: '៧.៣ ប្រជុំសម្រុះសម្រួល', en: '7.3 Mediation Meeting' },
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

    // ------------ Form Dynamic Keys ------------
    'form.section6': { km: '៦. អង្គហេតុ (Dispute Summary / Facts)', en: '6. Dispute Summary & Facts' },
    'form.section7': { km: '៧. ចំណាត់ការនីតិវិធី និងលទ្ធផល', en: '7. Procedures and Results' },
    'form.section8': { km: '៨. បញ្ចូលឯកសារពាក់ព័ន្ធនឹងសំណុំរឿង (Case Documents & Evidence)', en: '8. Case Documents & Evidence Folder' },
    'form.date': { km: 'កាលបរិច្ឆេទ៖', en: 'Date:' },
    'form.count': { km: 'ចំនួនលើកនៃកិច្ចប្រជុំ៖', en: 'Number of Meetings:' },
    'form.docClass': { km: 'ចំណាត់ថ្នាក់ឯកសារ៖', en: 'Document Category:' },
    'form.docUpload': { km: 'ជ្រើសរើសឯកសារបញ្ជូល Folder (PDF, Word, Images)', en: 'Select Documents to Upload (PDF, Word, Images)' },
    'form.folderTitle': { km: '📁 បញ្ជីឯកសារក្នុង Folder សំណុំរឿងនេះ (', en: '📁 List of Documents in Case Folder (' },
    'form.folderDocs': { km: 'ឯកសារ)៖', en: 'Documents):' },
    'form.folderNote': { km: 'លោកអ្នកអាចជ្រើសរើសឯកសារបញ្ចូលបន្ថែមជាបន្តបន្ទាប់', en: 'You can select and add more documents consecutively' },
    'form.folderEmpty': { km: 'ពុំទាន់មានឯកសារ ឬរូបភាពនៅក្នុង Folder នេះឡើយ។ សូមជ្រើសរើសឯកសារខាងលើដើម្បីទាញចូល!', en: 'No documents or images in this folder yet. Please select documents above to import!' },
    'form.customFields': { km: '៦. ព័ត៌មានបន្ថែម (Custom Fields)', en: '6. Additional Info (Custom Fields)' },
    'form.btnCancel': { km: 'បោះបង់ (Cancel)', en: 'Cancel' },
    'form.btnSave': { km: 'រក្សាទុកសំណុំរឿង', en: 'Save Case' },

    // ------------ Modals ------------
    'view.modalTitle': { km: 'ប័ណ្ណព័ត៌មាន និងចំណាត់ការសំណុំរឿងគោល', en: 'Case Information Card & Disposition' },
    'view.btnGenerate': { km: 'ផលិតលិខិតគតិយុត្ត (5 Docs)', en: 'Generate Legal Docs (5)' },
    'view.btnPrint': { km: 'បោះពុម្ពប័ណ្ណ', en: 'Print Card' },
    'view.btnEdit': { km: 'កែសម្រួល', en: 'Edit' },
    'view.btnDelete': { km: 'លុប', en: 'Delete' },
    'doc.modalTitle': { km: 'ផលិតលិខិតបទដ្ឋានគតិយុត្តផ្លូវការ (Official Legal Documents)', en: 'Official Legal Document Generator' },
    'doc.selectHeader': { km: '១. ជ្រើសរើសទម្រង់ និងកែសម្រួល', en: '1. Select Template & Edit' },
    'doc.typeLabel': { km: 'ប្រភេទលិខិតគតិយុត្ត (៥ ទម្រង់ផ្លូវការ)៖', en: 'Legal Document Type (5 Official Formats):' },
    'doc.dateLabel': { km: 'កាលបរិច្ឆេទលិខិត / កិច្ចប្រជុំ៖', en: 'Document / Meeting Date:' },
    'doc.roomLabel': { km: 'ទីតាំង / សាលកិច្ចប្រជុំ៖', en: 'Location / Meeting Room:' },
    'doc.officerLabel': { km: 'មន្ត្រីសម្របសម្រួល / ជំនាញទទួលបន្ទុក៖', en: 'Mediator / Officer in Charge:' },
    'doc.notesLabel': { km: 'ខ្លឹមសារកែសម្រួល / លក្ខខណ្ឌព្រមព្រៀង / ចំណាំ៖', en: 'Custom Content / Agreement Terms / Notes:' },
    'doc.btnUpdate': { km: 'ធ្វើបច្ចុប្បន្នភាពគំរូ', en: 'Refresh Preview' },
    'doc.btnPrint': { km: 'បោះពុម្ព (Print / PDF)', en: 'Print / Save PDF' },
    'confirm.title': { km: 'បញ្ជាក់សកម្មភាព', en: 'Confirm Action' },
    'confirm.message': { km: 'តើលោកអ្នកពិតជាចង់បន្តសកម្មភាពនេះមែនទេ?', en: 'Are you sure you want to proceed with this action?' },
    'confirm.btnNo': { km: 'បោះបង់', en: 'Cancel' },
    'confirm.btnYes': { km: 'យល់ព្រម', en: 'Confirm' },
    'viewer.title': { km: 'ពិនិត្យមើលឯកសារសំណុំរឿង', en: 'Review Case Document' },
    'viewer.loading': { km: 'កំពុងរៀបចំបង្ហាញឯកសារ...', en: 'Preparing document viewer...' },
    'viewer.btnNewTab': { km: 'បើកពេញផ្ទាំង (New Tab)', en: 'Open Full Screen (New Tab)' },
    'viewer.btnDownload': { km: 'ទាញយកឯកសារ (Download)', en: 'Download Document' },
    'viewer.btnReplace': { km: 'ផ្លាស់ប្តូរឯកសារថ្មី', en: 'Replace Document' },
    'viewer.btnDelete': { km: 'លុបចេញ', en: 'Delete' },
    'viewer.btnClose': { km: 'បិទ (Close)', en: 'Close' },
    'folder.modalTitle': { km: 'Folder ឯកសារសំណុំរឿង', en: 'Case Document Folder' },
    'folder.addNew': { km: 'បន្ថែមឯកសារថ្មីចូល Folder នេះ៖', en: 'Add new documents to this folder:' },
    'folder.btnUpload': { km: 'ជ្រើសរើសឯកសារបញ្ជូល Folder', en: 'Select Documents to Upload' },
    'folder.listHeader': { km: 'ឯកសារដែលរក្សាទុករួចរាល់ក្នុង Folder (', en: 'Documents saved in Folder (' },
    'folder.listHeaderEnd': { km: ')៖', en: '):' },
    'folder.listNote': { km: 'ចុចលើប៊ូតុង "មើល" ដើម្បីបើកអាន ឬចុច "ទាញយក"', en: 'Click "View" to open or click "Download"' },
    'imgViewer.title': { km: 'ពិនិត្យរូបភាពភស្តុតាង', en: 'Review Evidence Image' },
    'imgViewer.btnDownload': { km: 'ទាញយក (Download)', en: 'Download' },
    'cal.modalTitle': { km: 'កំណត់កម្មវិធីតាមកាលវិភាគ', en: 'Schedule Calendar Event' },
    'cal.dateLabel': { km: 'កាលបរិច្ឆេទកម្មវិធី៖', en: 'Event Date:' },
    'cal.timeLabel': { km: 'ម៉ោង (Time)', en: 'Time' },
    'cal.caseLabel': { km: 'ជ្រើសរើសសំណុំរឿង', en: 'Select Case' },
    'cal.eventLabel': { km: 'កម្មវិធី (Event)', en: 'Event Type' },
    'cal.btnDelete': { km: 'លុបកម្មវិធី', en: 'Delete Event' },
    'cal.btnSave': { km: 'រក្សាទុក', en: 'Save' },
    'plan.modalTitle': { km: 'បន្ថែម/កែសម្រួលផែនការសកម្មភាពអនុវត្តការងារ', en: 'Add/Edit Action Plan' },
    'plan.targetLabel': { km: 'គោលដៅយុទ្ធសាស្ត្រពាក់ព័ន្ធ៖', en: 'Related Strategic Goal:' },
    'plan.actionLabel': { km: 'សកម្មភាពផែនការការងារ៖', en: 'Action Plan Activity:' },
    'plan.dateLabel': { km: 'កាលបរិច្ឆេទអនុវត្ត៖', en: 'Execution Date:' },
    'plan.statusLabel': { km: 'ស្ថានភាព៖', en: 'Status:' },
    'plan.btnSave': { km: 'រក្សាទុកផែនការ', en: 'Save Plan' },

    // ------------ Dropdown Options ------------
    'opt.meetNot': { km: '១. មិនទាន់ប្រជុំ', en: '1. Not yet met' },
    'opt.meetNoAttend': { km: '២. ភាគីមិនចូលរួម', en: '2. Party absent' },
    'opt.meetDone': { km: '៣. បានប្រជុំប្រមូលព័ត៌មានភាគីរួច', en: '3. Info gathering completed' },
    'opt.med1': { km: '១. មិនទាន់ប្រជុំ', en: '1. Not yet met' },
    'opt.med2': { km: '២. ភាគីមិនចូលរួម', en: '2. Party absent' },
    'opt.med3': { km: '៣. បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)', en: '3. Mediation ongoing' },
    'opt.med4': { km: '៤. បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)', en: '4. Mediation completed (Agreed)' },
    'opt.med5': { km: '៥. បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)', en: '5. Mediation completed (Disagreed)' },
    'opt.med6': { km: '៦. បានធ្វើរបាយការបិទសំណុំរឿងជាស្ថាពរ', en: '6. Final close report submitted' },
    'opt.statusActive': { km: '🔵 Active (កំពុងសម្រុះសម្រួល)', en: '🔵 Active (Mediating)' },
    'opt.statusPending': { km: '🟡 Pending (តម្កល់)', en: '🟡 Pending' },
    'opt.statusSettle': { km: '🟢 Settle (ព្រមព្រៀង)', en: '🟢 Settled' },
    'opt.statusNoSettle': { km: '🔴 No Settle (មិនព្រមព្រៀង)', en: '🔴 Not Settled' },
    'opt.statusClose': { km: '⚫ Close (បិទ)', en: '⚫ Closed' },
    'opt.rem1': { km: '១. ភាគីដកពាក្យបណ្តឹង', en: '1. Party withdrew complaint' },
    'opt.rem2': { km: '២. ភាគីមិនចូលរួម ឬមិនបន្តការសម្រុះសម្រួល', en: '2. Party absent or discontinued' },
    'opt.cat1': { km: '📄 ពាក្យបណ្តឹង', en: '📄 Complaint / Petition' },
    'opt.cat2': { km: '📋 កំណត់ហេតុប្រជុំ', en: '📋 Meeting Minutes' },
    'opt.cat3': { km: '🖼️ រូបភាពភស្តុតាង', en: '🖼️ Evidence Photos' },
    'opt.cat4': { km: '⚖️ លិខិតគតិយុត្ត / សេចក្តីសម្រេច', en: '⚖️ Legal / Resolution Docs' },
    'opt.cat5': { km: '📂 ឯកសារផ្សេងៗ', en: '📂 Other Documents' },
    'opt.doc1': { km: '១. លិខិតកោះអញ្ជើញភាគីចូលរួមសះជា', en: '1. Invitation Letter' },
    'opt.doc2': { km: '២. របាយការណ៍កិច្ចប្រជុំសម្រុះសម្រួល', en: '2. Mediation Meeting Report' },
    'opt.doc3': { km: '៣. កំណត់ហេតុព្រមព្រៀងសះជា / បញ្ចប់វិវាទ', en: '3. Settlement Agreement' },
    'opt.doc4': { km: '៤. របាយការណ៍វិភាគ និងវាយតម្លៃអង្គហេតុ', en: '4. Case Analysis Report' },
    'opt.doc5': { km: '៥. សេចក្តីជូនដំណឹងបិទបញ្ចប់ចំណាត់ការ', en: '5. Case Closure Notice' },
    'opt.cal0': { km: '-- ជ្រើសរើសកម្មវិធី --', en: '-- Select Event --' },
    'opt.cal1': { km: '១. ប្រជុំផ្តល់ព័ត៌មាន', en: '1. Information Meeting' },
    'opt.cal2': { km: '២. ចុះពិនិត្យទីតាំង', en: '2. Site Visit' },
    'opt.cal3': { km: '៣. ប្រជុំសម្រុះសម្រួល', en: '3. Mediation Meeting' },
    'opt.planT1': { km: 'យុទ្ធសាស្ត្រអត្រាព្រមព្រៀង (Settle Rate)', en: 'Settle Rate Strategy' },
    'opt.planT2': { km: 'យុទ្ធសាស្ត្រសំណុំរឿងសរុប (Total Volume)', en: 'Total Volume Strategy' },
    'opt.planT3': { km: 'យុទ្ធសាស្ត្រកំពុងសម្រុះសម្រួល (Active Rate)', en: 'Active Rate Strategy' },
    'opt.planT4': { km: 'យុទ្ធសាស្ត្របិទ/មិនព្រមព្រៀង (Closed Rate)', en: 'Closed Rate Strategy' },
    'opt.planT5': { km: 'យុទ្ធសាស្ត្រតម្កល់/ផ្អាក (Pending Rate)', en: 'Pending Rate Strategy' },
    'opt.planS1': { km: 'កំពុងអនុវត្ត', en: 'Ongoing' },
    'opt.planS2': { km: 'សម្រេចបានរួចរាល់', en: 'Completed' },
    'opt.planS3': { km: 'ពន្យារពេល/បន្ត', en: 'Postponed / Continued' },

    // ------------ Table & Report Headers ------------
    'table.no': { km: 'ល.រ', en: 'No.' },
    'table.caseCode': { km: 'លេខកូដសំណុំរឿង', en: 'Case Code' },
    'table.date': { km: 'កាលបរិច្ឆេទ', en: 'Date' },
    'table.status': { km: 'លទ្ធផលសំណុំរឿង', en: 'Status' },
    'table.partyA': { km: 'ភាគី (ក) ដើមបណ្ដឹង', en: 'Party A (Complainant)' },
    'table.partyB': { km: 'ភាគី (ខ) ចុងបណ្ដឹង', en: 'Party B (Respondent)' },
    'table.category': { km: 'ប្រភេទវិវាទ', en: 'Category' },
    'table.location': { km: 'ទីតាំងវិវាទ', en: 'Location' },
    'table.remarks': { km: 'កំណត់ចំណាំ', en: 'Remarks' },
    'table.actions': { km: 'សកម្មភាព', en: 'Actions' },
    'table.officials': { km: 'មសវ អម (តាមលិខិតចាត់តាំង)', en: 'Assisting Officials' },

    // ------------ Sidebar Missing Keys ------------
    'nav.profileTitle': { km: 'ប្រវត្តិរូបមន្ត្រី (My Profile)', en: 'My Profile' },
    'nav.profileSub': { km: 'គ្រប់គ្រងគណនី & រូបភាព', en: 'Manage Account & Avatar' },
    'nav.groupCases': { km: 'គ្រប់គ្រងសំណុំរឿង', en: 'Case Management' },
    'nav.groupAnalytics': { km: 'ស្ថិតិ និងវាយតម្លៃ', en: 'Statistics & Analytics' },
    'nav.groupSettings': { km: 'ការកំណត់', en: 'Settings' },
    'nav.calendar': { km: 'កាលវិភាគ', en: 'Calendar & Schedule' },
    'nav.strategic': { km: 'ផែនការយុទ្ធសាស្ត្រ', en: 'Strategic Plan' },

    // ------------ Cases View ------------
    'cases.title': { km: 'តារាងបញ្ជីសំណុំរឿង', en: 'Master Case Directory' },
    'cases.subtitle': { km: 'គ្រប់គ្រង ស្វែងរក និងចម្រោះទិន្នន័យសំណុំរឿងស្របតាមទម្រង់តារាង Excel គោល', en: 'Manage, search, and filter case data according to the master Excel template' },
    'cases.btnTelegram': { km: 'ផ្ញើរបាយការណ៍ទៅ Telegram', en: 'Send Report to Telegram' },
    'cases.btnExcel': { km: 'ទាញយកជា Excel', en: 'Export to Excel' },
    'cases.filterTitle': { km: 'ឧបករណ៍ចម្រោះ និងស្វែងរកទិន្នន័យ', en: 'Smart Case Filters' },
    'cases.lblSearch': { km: 'ស្វែងរកទូទៅ៖', en: 'General Search:' },
    'cases.placeholderSearch': { km: 'លេខកូដ, ឈ្មោះភាគី ក/ខ...', en: 'Case Code, Party Name...' },
    'cases.lblCategory': { km: 'ប្រភេទវិវាទ (៨ ប្រភេទ)៖', en: 'Dispute Category (8 Types):' },
    'cases.optAllCat': { km: 'ទាំងអស់ (All Categories)', en: 'All Categories' },
    'cases.lblStatus': { km: 'លទ្ធផលសំណុំរឿង៖', en: 'Case Outcome/Status:' },
    'cases.optAllStatus': { km: 'ទាំងអស់ (All Statuses)', en: 'All Statuses' },
    'cases.lblLocation': { km: 'ទីតាំងវិវាទ៖', en: 'Dispute Location:' },
    'cases.optAllLoc': { km: 'គ្រប់ទីតាំងទាំងអស់ (All Locations)', en: 'All Locations' },
    'cases.lblEvent': { km: 'កម្មវិធី (Events)៖', en: 'Events:' },
    'cases.optAllEvent': { km: 'ទាំងអស់ (All)', en: 'All' },
    'cases.optHasEvent': { km: 'មានកម្មវិធី (Has Event)', en: 'Has Event' },
    'cases.optNoEvent': { km: 'គ្មានកម្មវិធី (No Event)', en: 'No Event' },
    'cases.lblSort': { km: 'តម្រៀបតាម៖', en: 'Sort By:' },
    'cases.optSortDefault': { km: 'បញ្ចូលមុន-ក្រោយ (Default)', en: 'Default' },
    'cases.optSortDateAsc': { km: 'កាលបរិច្ឆេទចាស់ -> ថ្មី', en: 'Date: Old -> New' },
    'cases.optSortDateDesc': { km: 'កាលបរិច្ឆេទថ្មី -> ចាស់', en: 'Date: New -> Old' },
    'cases.optSortNumAsc': { km: 'លេខកូដ A -> Z', en: 'Case Code A -> Z' },
    'cases.optSortNumDesc': { km: 'លេខកូដ Z -> A', en: 'Case Code Z -> A' },
    'cases.btnReset': { km: 'កំណត់ឡើងវិញ', en: 'Reset Filters' },
    'cases.tableTitle': { km: 'បញ្ជីទិន្នន័យសំណុំរឿងសរុប (Master Table)', en: 'Master Table' },
    'cases.tableShowInfo': { km: 'បង្ហាញទិន្នន័យ៖ <strong id="showing-count" style="color: #2563eb; font-size: 14px;">០</strong> នៃ <strong id="total-count" style="color: #0f172a; font-size: 14px;">០</strong> សំណុំរឿង', en: 'Showing <strong id="showing-count" style="color: #2563eb; font-size: 14px;">០</strong> of <strong id="total-count" style="color: #0f172a; font-size: 14px;">០</strong> Cases' },
    'cases.tableVerified': { km: 'ទិន្នន័យផ្ទៀងផ្ទាត់ត្រឹមត្រូវ', en: 'Verified Data' },
    'cases.emptyTitle': { km: 'ស្វែងរកមិនឃើញទិន្នន័យសំណុំរឿងឡើយ', en: 'No Cases Found' },
    'cases.emptySub': { km: 'សូមសាកល្បងប្តូរលក្ខខណ្ឌចម្រោះ ឬបង្កើតសំណុំរឿងថ្មី', en: 'Please try changing the filter conditions or create a new case' },
    'cases.thColListNo': { km: 'ល.រ ក្នុងបញ្ជី', en: 'List No.' },
    'cases.thEvent': { km: 'កម្មវិធី (Event)', en: 'Event' },
    'cases.thEventDate': { km: 'កាលបរិច្ឆេទកម្មវិធី', en: 'Event Date' },
    'cases.thPartyC': { km: 'ភាគី (គ) អ្នកពាក់ព័ន្ធ', en: 'Party (C) Relevant' },
    'cases.thPdf': { km: 'ឯកសារ ដើម (PDF)', en: 'Source Document (PDF)' },
    
    // ------------ Calendar View ------------
    'cal.title': { km: 'កាលវិភាគ និងកម្មវិធីសំណុំរឿង (Schedule)', en: 'Schedule and Events' },
    'cal.subtitle': { km: 'តាមដាន និងរៀបចំកាលវិភាគចុះពិនិត្យទីតាំង ផ្តល់ព័ត៌មាន និងប្រជុំសម្រុះសម្រួល', en: 'Track and manage schedules for site visits, info sessions, and mediation meetings' },
    'cal.btnPrevMonth': { km: 'ខែមុន', en: 'Previous Month' },
    'cal.btnNextMonth': { km: 'ខែបន្ទាប់', en: 'Next Month' },
    'cal.eventsTitle': { km: 'បញ្ជីកម្មវិធីសំណុំរឿង (Upcoming Events)', en: 'Upcoming Events' },
    'cal.thDate': { km: 'កាលបរិច្ឆេទ', en: 'Date' },
    'cal.thCaseNum': { km: 'លេខសំណុំរឿង', en: 'Case Number' },
    'cal.thEvent': { km: 'កម្មវិធី', en: 'Event' },
    'cal.thParty': { km: 'ឈ្មោះភាគី', en: 'Party Name' },
    'cal.thLoc': { km: 'ទីតាំង', en: 'Location' },
    'cal.loading': { km: 'កំពុងទាញយកទិន្នន័យ...', en: 'Loading data...' },

    // ------------ Analytics View ------------
    'analytics.title': { km: 'វិភាគ វាយតម្លៃចំណាត់ការសំណុំរឿង (Case Evaluation & Analytics)', en: 'Case Evaluation & Analytics' },
    'analytics.subtitle': { km: 'វាយតម្លៃអត្រាជោគជ័យនៃការផ្សះផ្សា និងប្រសិទ្ធភាពការងារសម្រុះសម្រួល', en: 'Evaluate mediation success rates and work efficiency' },
    'analytics.statSuccessRate': { km: 'អត្រាជោគជ័យការផ្សះផ្សា', en: 'Mediation Success Rate' },
    'analytics.statSuccessSub': { km: 'Settle vs Total Cases', en: 'Settle vs Total Cases' },
    'analytics.statSettleCount': { km: 'ករណីសម្រុះសម្រួលជោគជ័យ', en: 'Successful Mediations' },
    'analytics.statSettleSub': { km: 'Settle (ព្រមព្រៀង)', en: 'Settle (Agreed)' },
    'analytics.statActiveCount': { km: 'ករណីកំពុងដំណើរការ', en: 'Active Cases' },
    'analytics.statActiveSub': { km: 'Active (កំពុងសម្រុះសម្រួល)', en: 'Active (Mediating)' },
    'analytics.statClosedCount': { km: 'ករណីបិទ ឬតម្កល់', en: 'Closed or Pending Cases' },
    'analytics.statClosedSub': { km: 'Close & Pending Cases', en: 'Close & Pending Cases' },
    'analytics.statAvgTime': { km: 'រយៈពេលដោះស្រាយមធ្យម', en: 'Average Resolution Time' },
    'analytics.statAvgSub': { km: 'Average Resolution Days', en: 'Average Resolution Days' },
    'analytics.statOverallRate': { km: 'អត្រាចាត់ការរួចរាល់សរុប', en: 'Overall Completion Rate' },
    'analytics.statOverallSub': { km: 'Settle + Close / Total', en: 'Settle + Close / Total' },
    'analytics.tableTitle': { km: 'តារាងការវិភាគតាមប្រភេទវិវាទនីមួយៗ/លទ្ធផល គិតជាភាគរយ (Outcome Percentage Analysis)', en: 'Outcome Percentage Analysis by Category' },
    'analytics.thCategory': { km: 'ប្រភេទវិវាទ (Dispute Category)', en: 'Dispute Category' },
    'analytics.thAnalysis': { km: 'វិភាគសំណុំរឿង (គិតជាភាគរយ %)', en: 'Case Analysis (%)' },
    'analytics.thTotal': { km: 'សរុប (%)', en: 'Total (%)' },
    'analytics.thActive': { km: 'កំពុងសម្រុះសម្រួល', en: 'Mediating' },
    'analytics.thSettle': { km: 'ព្រមព្រៀង', en: 'Agreed' },
    'analytics.thNoSettle': { km: 'មិនព្រមព្រៀង', en: 'Disagreed' },
    'analytics.thPending': { km: 'ផ្អាក / ផ្សេងៗ', en: 'Pending / Others' },
    'analytics.tableEvaluation': { km: 'វាយតម្លៃកម្រិត និងរយៈពេលដោះស្រាយ', en: 'Evaluation of Level and Resolution Time' },
    'analytics.thResp': { km: 'ទំនួលខុសត្រូវ', en: 'Responsibility' },
    'analytics.thNego': { km: 'ការចរចា', en: 'Negotiation' },
    'analytics.thCompro': { km: 'ការយោគយល់', en: 'Compromise' },
    'analytics.thSpirit': { km: 'ស្មារតី', en: 'Spirit' },
    'analytics.thDuration': { km: 'រយៈពេលដោះស្រាយ (ថ្ងៃ)', en: 'Resolution Time (Days)' },
    'analytics.interpTitle': { km: 'បកស្រាយលទ្ធផល ផ្អែកតាមតារាងវាយតម្លៃកម្រិតវិវាទ និងរយៈពេលដោះស្រាយតាមប្រភេទ (Evaluation & Resolution Matrix)', en: 'Result Interpretation based on Evaluation & Resolution Matrix' },
    'analytics.chartLocation': { km: 'អត្រាដោះស្រាយវិវាទតាមខេត្ត/រាជធានី (Top Locations)', en: 'Dispute Resolution Rate by Location' },
    'analytics.summaryTitle': { km: 'របាយការណ៍សង្ខេបវាយតម្លៃចំណាត់ការ', en: 'Action Evaluation Summary Report' },
    'analytics.summaryConclusion': { km: 'សេចក្ដីសន្និដ្ឋានប្រសិទ្ធភាពផ្សះផ្សា៖', en: 'Mediation Efficiency Conclusion:' },
    'analytics.loadingIndex': { km: 'កំពុងគណនាសន្ទស្សន៍...', en: 'Calculating index...' },
    'analytics.obsTitle': { km: 'ចំណុចសង្កេតលើកិច្ចប្រជុំប្រមូលព័ត៌មាន៖', en: 'Observations on Info Gathering Meetings:' },
    'analytics.obs1': { km: 'ការប្រមូលព័ត៌មានពី <strong>ភាគី "ក"</strong> ដើរតួនាទីយ៉ាងសំខាន់ក្នុងការកំណត់អង្គហេតុដើម។', en: 'Gathering info from <strong>Party A</strong> plays a crucial role in establishing the initial facts.' },
    'analytics.obs2': { km: 'ការចូលរួមពី <strong>ភាគី "ខ"</strong> ក្នុងកិច្ចប្រជុំសម្រុះសម្រួល មានសន្ទុះខ្ពស់ក្នុងករណីវិវាទដីធ្លី និងកិច្ចសន្យា។', en: 'Participation from <strong>Party B</strong> in mediation meetings is highly significant in land and contract disputes.' },
    'analytics.obs3': { km: 'ករណីដែលមានលទ្ធផល <strong>Settle (ព្រមព្រៀង)</strong> ភាគច្រើនបានឆ្លងកាត់កិច្ចប្រជុំសម្រុះសម្រួលចាប់ពី ១ ទៅ ២ លើកឡើងទៅ។', en: 'Cases resulting in <strong>Settle (Agreed)</strong> mostly went through 1 to 2 mediation meetings or more.' },

    'analytics.obs3': { km: 'ករណីដែលមានលទ្ធផល <strong>Settle (ព្រមព្រៀង)</strong> ភាគច្រើនបានឆ្លងកាត់កិច្ចប្រជុំសម្រុះសម្រួលចាប់ពី ១ ទៅ ២ លើកឡើងទៅ។', en: 'Cases resulting in <strong>Settle (Agreed)</strong> mostly went through 1 to 2 mediation meetings or more.' },

    // ------------ Strategic Plan View ------------
    'strat.title': { km: 'ផែនការយុទ្ធសាស្ត្រ (Strategic Resolution Plan)', en: 'Strategic Resolution Plan' },
    'strat.subtitle': { km: 'រៀបចំផែនការសកម្មភាពអនុវត្តការងារ និងពិនិត្យអនុសាសន៍យុទ្ធសាស្ត្រដោះស្រាយវិវាទ', en: 'Organize action plans and review dispute resolution strategy recommendations' },
    'strat.tabPlan': { km: 'ចំណុច ផែនការ (Action Plans)', en: 'Action Plans' },
    'strat.tabStrategy': { km: 'ចំណុច យុទ្ធសាស្ត្រ (Resolution Strategies)', en: 'Resolution Strategies' },
    'strat.planTitle': { km: 'តារាងផែនការសកម្មភាពអនុវត្តការងារតាមយុទ្ធសាស្ត្រ', en: 'Action Plan Strategy Table' },
    'strat.btnAddPlan': { km: 'បន្ថែមផែនការថ្មី', en: 'Add New Plan' },
    'strat.thGoal': { km: 'គោលដៅយុទ្ធសាស្ត្រពាក់ព័ន្ធ', en: 'Related Strategic Goal' },
    'strat.thAction': { km: 'សកម្មភាពផែនការការងារ', en: 'Action Plan Activity' },
    'strat.thStatus': { km: 'ស្ថានភាព', en: 'Status' },
    'strat.recoTitle': { km: 'អនុសាសន៍ដោះស្រាយវិវាទ ផ្អែកតាមតារាង Evaluation & Resolution Matrix', en: 'Dispute Resolution Recommendations based on Evaluation & Resolution Matrix' },
    'strat.autoSystem': { km: 'ប្រព័ន្ធវិភាគស្វ័យប្រវត្តិ', en: 'Automated Analysis System' },

    // ------------ Reports View ------------
    'reports.title': { km: 'របាយការណ៍សំណុំរឿង (Case Report Generator)', en: 'Case Report Generator' },
    'reports.subtitle': { km: 'បង្កើតរបាយការណ៍រដ្ឋបាល បោះពុម្ព (Print/PDF) និងបញ្ចេញឯកសារ Excel (.xlsx)', en: 'Generate administrative reports, print (PDF), and export to Excel (.xlsx)' },
    'reports.typeLabel': { km: 'ជ្រើសរើសប្រភេទរបាយការណ៍៖', en: 'Select Report Type:' },
    'reports.optMonthly': { km: 'តារាងរបាយការណ៍ប្រចាំខែ អ.ដ.ក.', en: 'Monthly Report Table' },
    'reports.optTracking': { km: 'របាយការណ៍បញ្ជីតាមដានលទ្ធផលដោះស្រាយវិវាទ (Official Tracking)', en: 'Dispute Resolution Results Tracking Report' },
    'reports.optMaster': { km: 'របាយការណ៍បញ្ជីសំណុំរឿង (Master Table Report)', en: 'Master Table Report' },
    'reports.optSummary': { km: 'របាយការណ៍សង្ខេបស្ថិតិទូទៅ', en: 'General Statistics Summary Report' },
    'reports.optStatus': { km: 'របាយការណ៍បែងចែកតាមលទ្ធផល (Active/Settle/Close/Pending)', en: 'Report by Outcome (Active/Settle/Close/Pending)' },
    'reports.optCategory': { km: 'របាយការណ៍បែងចែកតាមប្រភេទវិវាទទាំង ៨', en: 'Report by Dispute Category (8 Types)' },
    'reports.monthLabel': { km: 'ជ្រើសរើសខែ/ឆ្នាំ៖', en: 'Select Month/Year:' },
    'reports.monthPlaceholder': { km: 'ជ្រើសរើសខែ/ឆ្នាំ...', en: 'Select Month/Year...' },
    'reports.filterStatus': { km: 'ចម្រោះតាមលទ្ធផល៖', en: 'Filter by Outcome:' },
    'reports.btnGenerate': { km: 'បង្កើតរបាយការណ៍ (Generate)', en: 'Generate Report' },
    'reports.btnPrint': { km: 'បោះពុម្ព / Save PDF', en: 'Print / Save PDF' },
    'reports.btnWord': { km: 'ទាញយកជា Word (.doc)', en: 'Export as Word (.doc)' },
    'reports.btnExcel': { km: 'ទាញយកជា Excel (.xlsx)', en: 'Export as Excel (.xlsx)' },
    'reports.placeholderMsg': { km: 'សូមជ្រើសរើសលក្ខខណ្ឌខាងលើ រួចចុចប៊ូតុង "បង្កើតរបាយការណ៍"', en: 'Please select conditions above, then click "Generate Report"' },
    'reports.paperHeader': { km: 'ព្រះរាជាណាចក្រកម្ពុជា', en: 'Kingdom of Cambodia' },
    'reports.paperMotto': { km: 'ជាតិ សាសនា ព្រះមហាក្សត្រ', en: 'Nation, Religion, King' },
    'reports.paperTitle': { km: 'របាយការណ៍បញ្ជីសំណុំរឿង', en: 'Case List Report' },
    'reports.paperSubtitle': { km: 'គិតត្រឹមថ្ងៃទី...', en: 'As of Date...' },
    'reports.paperGenDate': { km: 'កាលបរិច្ឆេទបង្កើត៖', en: 'Generation Date:' },
    'reports.paperPreparer': { km: 'អ្នករៀបចំរបាយការណ៍', en: 'Report Preparer' },
    'reports.paperLocation': { km: 'រាជធានីភ្នំពេញ, ថ្ងៃទី..... ខែ..... ឆ្នាំ២០២៦', en: 'Phnom Penh, Date: ..... Month: ..... Year: 2026' },
    'reports.paperDirector': { km: 'ប្រធានការិយាល័យ / ប្រធានស្ថាប័ន', en: 'Office Head / Institution Head' },

    // ------------ Data Management View ------------
    'dataMgmt.title': { km: 'ទាញទិន្នន័យចូល & បម្រុងទុក (Data Import & Backup)', en: 'Data Import & Backup' },
    'dataMgmt.subtitle': { km: 'ទាញបញ្ចូលទិន្នន័យពីឯកសារ Excel គោលរបស់អ្នក និងគ្រប់គ្រងទិន្នន័យសុវត្ថិភាព', en: 'Import data from your master Excel file and manage data security' },
    'dataMgmt.importTitle': { km: 'ទាញទិន្នន័យចូលពី Excel / CSV (Import Excel)', en: 'Import from Excel / CSV' },
    'dataMgmt.importSub': { km: 'ជ្រើសរើសឯកសារ Excel (.xlsx, .xls, .csv) ដែលជាតារាងបញ្ជីសំណុំរឿងរបស់អ្នកដើម្បីទាញបញ្ចូលក្នុងកម្មវិធីស្វ័យប្រវត្តិ៖', en: 'Select your Excel (.xlsx, .xls, .csv) case list table to import automatically:' },
    'dataMgmt.templateTitle': { km: 'គំរូតារាង Excel បញ្ចូលទិន្នន័យ (Sample Template)', en: 'Sample Data Entry Excel Template' },
    'dataMgmt.templateSub': { km: 'ទាញយកទម្រង់គំរូ .xlsx នេះដើម្បីវាយបញ្ចូលទិន្នន័យឱ្យត្រូវតាមស្តង់ដារ', en: 'Download this .xlsx template to enter data according to standard format' },
    'dataMgmt.btnDownload': { km: 'ទាញយកគំរូ Excel (.xlsx)', en: 'Download Excel Template (.xlsx)' },
    'dataMgmt.dropTitle': { km: 'ចុចដើម្បីជ្រើសរើសឯកសារ Excel', en: 'Click to select Excel file' },
    'dataMgmt.dropSub': { km: 'គាំទ្រឯកសារទម្រង់ .xlsx, .xls និង .csv', en: 'Supports .xlsx, .xls, and .csv formats' },
    'dataMgmt.btnSelectFile': { km: 'ជ្រើសរើស File Excel', en: 'Select Excel File' },
    'dataMgmt.importNote': { km: '* ចំណាំ៖ ប្រព័ន្ធនឹងស្វែងរក Column លេខកូដ, ឈ្មោះភាគី ក/ខ, ប្រភេទវិវាទ, និងលទ្ធផលស្វ័យប្រវត្តិ។', en: '* Note: System will automatically find Columns for Case Code, Party A/B, Category, and Outcome.' },
    'dataMgmt.backupTitle': { km: 'គ្រប់គ្រងឯកសារ Backup (.json)', en: 'Manage Backup Files (.json)' },
    'dataMgmt.backupSub': { km: 'រក្សាទុកទិន្នន័យទាំងមូលជាឯកសារ Backup ដើម្បីការពារការបាត់បង់ ឬផ្ទេរទៅកុំព្យូទ័រផ្សេង៖', en: 'Save all data as a Backup file to prevent loss or transfer to another computer:' },
    'dataMgmt.btnExportJson': { km: 'ទាញយក Backup (.json)', en: 'Download Backup (.json)' },
    'dataMgmt.btnExportCsvAll': { km: 'ទាញយកជា CSV (All Data)', en: 'Download as CSV (All Data)' },
    'dataMgmt.exportNote': { km: 'ទាញយកទិន្នន័យទាំងអស់ជាឯកសារបម្រុងសុវត្ថិភាព ឬជាទម្រង់ Excel/CSV', en: 'Download all data as a safe backup or Excel/CSV format' },
    'dataMgmt.btnImportJson': { km: 'ស្ដារទិន្នន័យពី Backup (.json)', en: 'Restore Data from Backup (.json)' },
    'dataMgmt.importJsonNote': { km: 'ជ្រើសរើសឯកសារ .json ដើម្បីស្ដារទិន្នន័យចូលវិញ', en: 'Select a .json file to restore data' },
    'dataMgmt.btnResetMock': { km: 'ស្ដារទិន្នន័យគំរូដើម (១០ សំណុំរឿង NADR)', en: 'Restore Sample Data (10 NADR Cases)' },
    'dataMgmt.btnFactoryReset': { km: 'លុបទិន្នន័យទាំងអស់ (Factory Reset - Empty State)', en: 'Delete All Data (Factory Reset - Empty State)' },
    'dataMgmt.resetNote': { km: 'លុបទិន្នន័យទាំងស្រុង ឬស្ដារមកទិន្នន័យគំរូដើមវិញ', en: 'Completely delete data or restore sample data' },

    // ------------ Settings View ------------
    'settings.subtitle': { km: 'គ្រប់គ្រងខេត្ត ប្រភេទវិវាទ គណនីរដ្ឋបាល និងកូឡោនបន្ថែមនៃសំណុំរឿង', en: 'Manage provinces, dispute categories, admin accounts, and custom columns' },
    'settings.menuTitle': { km: 'ម៉ឺនុយការកំណត់', en: 'Settings Menu' },
    'settings.tabOrgTitle': { km: '១. កំណត់ស្ថាប័ន & លេខកូដ', en: '1. Org & Code Setup' },
    'settings.tabOrgDesc': { km: 'កំណត់ឈ្មោះស្ថាប័នសម្រាប់បោះពុម្ពរបាយការណ៍ និងក្បាលលេខកូដសំណុំរឿងស្វ័យប្រវត្តិ', en: 'Set org name for reports and auto case prefix' },
    'settings.tabOrgShort': { km: '១. ស្ថាប័ន & លេខកូដ', en: '1. Org & Code' },
    'settings.tabCatTitle': { km: '២. ប្រភេទវិវាទទាំង ៨', en: '2. Dispute Categories (8)' },
    'settings.tabCatDesc': { km: 'បន្ថែម ឬកែសម្រួលប្រភេទវិវាទក្នុងប្រព័ន្ធ', en: 'Add or edit dispute categories in the system' },
    'settings.tabCatShort': { km: '២. ប្រភេទវិវាទ (៨)', en: '2. Categories (8)' },
    'settings.tabColTitle': { km: '៣. បន្ថែមកូឡោនសំណុំរឿង', en: '3. Add Custom Columns' },
    'settings.tabColDesc': { km: 'កំណត់បង្ហាញ/លាក់ជួរឈរតារាងបញ្ជីសំណុំរឿង', en: 'Set show/hide columns in the case list table' },
    'settings.tabColShort': { km: '៣. កូឡោនតារាង', en: '3. Table Columns' },
    'settings.tabAdminTitle': { km: '៤. គ្រប់គ្រងគណនីរដ្ឋបាល', en: '4. Admin Accounts' },
    'settings.tabAdminDesc': { km: 'គ្រប់គ្រងសិទ្ធិចូលប្រព័ន្ធ និងគណនីមន្ត្រី', en: 'Manage system access and officer accounts' },
    'settings.tabAdminShort': { km: '៤. គណនីរដ្ឋបាល', en: '4. Admin Accounts' },
    'settings.tabAuditTitle': { km: '៥. កំណត់ហេតុសកម្មភាព (Audit Logs)', en: '5. Audit Logs' },
    'settings.tabAuditDesc': { km: 'ប្រវត្តិសកម្មភាព និងកត់ត្រាការប្រើប្រាស់ក្នុងប្រព័ន្ធ', en: 'Activity history and system usage logs' },
    'settings.tabAuditShort': { km: '៥. កំណត់ហេតុ (Audit)', en: '5. Audit Logs' },
    'settings.tabEvalTitle': { km: '៦. លក្ខណៈវិនិច្ឆ័យវាយតម្លៃចំណាត់ការ', en: '6. Evaluation Criteria' },
    'settings.tabEvalDesc': { km: 'តារាងស្ដង់ដារកម្រិតវិវាទ និងគោលការណ៍វាយតម្លៃ', en: 'Standard matrix for dispute level and evaluation' },
    'settings.tabEvalShort': { km: '៦. លក្ខណៈវិនិច្ឆ័យ', en: '6. Evaluation Criteria' },
    'settings.tabStratTitle': { km: '៧. យុទ្ធសាស្ត្រដោះស្រាយវិវាទ', en: '7. Resolution Strategies' },
    'settings.tabStratDesc': { km: 'កំណត់យុទ្ធសាស្ត្រ និងអនុសាសន៍តាមកម្រិតលទ្ធផល', en: 'Set strategies and recommendations by outcome' },
    'settings.tabStratShort': { km: '៧. យុទ្ធសាស្ត្រដោះស្រាយ', en: '7. Resolution Strategies' },
    'settings.tabIntTitle': { km: '៨. ការភ្ជាប់ប្រព័ន្ធ (Integrations)', en: '8. Integrations' },
    'settings.tabIntDesc': { km: 'ការជូនដំណឹងតាម Telegram និង Google Calendar', en: 'Telegram and Google Calendar Notifications' },
    'settings.tabIntShort': { km: '៨. ភ្ជាប់ប្រព័ន្ធ', en: '8. Integrations' },
    'settings.btnFitScreen': { km: 'ពង្រីកពេញអេក្រង់ (Fit Screen)', en: 'Fit Screen' },
    'settings.orgSettingsHeader': { km: 'កំណត់ព័ត៌មានស្ថាប័ន និងទម្រង់លេខកូដសំណុំរឿង (Organization & Prefix Settings)', en: 'Organization & Prefix Settings' },
    'settings.orgKh': { km: 'ឈ្មោះស្ថាប័នជាភាសាខ្មែរ៖', en: 'Organization Name (Khmer):' },
    'settings.orgEn': { km: 'ឈ្មោះស្ថាប័នជាភាសាអង់គ្លេស៖', en: 'Organization Name (English):' },
    'settings.casePrefix': { km: 'ទម្រង់ក្បាលលេខកូដសំណុំរឿង (Case Prefix Format)៖', en: 'Case Prefix Format:' },
    'settings.prefixExample': { km: 'ឧទាហរណ៍លេខដែលបង្កើត៖', en: 'Generated Example:' },
    'settings.btnSaveOrg': { km: 'រក្សាទុកការកំណត់ស្ថាប័ន', en: 'Save Org Settings' },
    'settings.catHeader': { km: 'គ្រប់គ្រងប្រភេទវិវាទសំណុំរឿង (Dispute Categories)', en: 'Dispute Categories' },
    'settings.catDesc': { km: 'បន្ថែម ឬកែសម្រួលប្រភេទវិវាទទាំង ៨ នៅក្នុងប្រព័ន្ធសម្រុះសម្រួល', en: 'Add or edit the 8 dispute categories in the mediation system' },
    'settings.btnAddCat': { km: 'បន្ថែមវិវាទថ្មី', en: 'Add New Category' },
    'settings.catThName': { km: 'ប្រភេទវិវាទ (Dispute Category Name)', en: 'Dispute Category Name' },
    'settings.colHeader': { km: 'ន្ថែមកូឡោនសំណុំរឿង (Custom Registry Columns)', en: 'Custom Registry Columns' },
    'settings.colDesc': { km: 'បន្ថែម Column ផ្ទាល់ខ្លួនទៅក្នុងបញ្ជី និង Form បញ្ចូលសំណុំរឿង', en: 'Add custom columns to the list and entry form' },
    'settings.colAddTitle': { km: 'បង្កើតកូឡោនបន្ថែមថ្មី', en: 'Create New Custom Column' },
    'settings.colLabelKh': { km: 'ឈ្មោះកូឡោន (ខ្មែរ)', en: 'Column Label (Khmer)' },
    'settings.colLabelEn': { km: 'Column Label (English)', en: 'Column Label (English)' },
    'settings.btnSaveCol': { km: 'រក្សាទុកកូឡោនថ្មី', en: 'Save New Column' },
    'settings.colListTitle': { km: 'បញ្ជីកូឡោនបន្ថែមបច្ចុប្បន្ន', en: 'Current Custom Columns List' },
    'settings.colThKh': { km: 'ឈ្មោះ (ខ្មែរ)', en: 'Label (Khmer)' },
    'settings.colThEn': { km: 'ឈ្មោះ (EN)', en: 'Label (EN)' },
    'settings.auditHeader': { km: 'កំណត់ហេតុសកម្មភាពប្រព័ន្ធ (System Audit Logs & Security History)', en: 'System Audit Logs & Security History' },
    'settings.auditDesc': { km: 'កត់ត្រាប្រវត្តិសកម្មភាពរបស់អ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ (ការបញ្ចូល កែសម្រួល លុប និងចាកចេញ)', en: 'Record user activity history (entry, edit, delete, exit)' },
    'settings.btnClearAudit': { km: 'សម្អាតកំណត់ហេតុ', en: 'Clear Audit Logs' },
    'settings.auditThDate': { km: 'កាលបរិច្ឆេទ & ម៉ោង', en: 'Date & Time' },
    'settings.auditThUser': { km: 'គណនី (User)', en: 'User Account' },
    'settings.auditThAction': { km: 'សកម្មភាព (Action)', en: 'Action' },
    'settings.auditThDetails': { km: 'ខ្លឹមសារលម្អិត (Details)', en: 'Details' },
    'settings.evalHeader': { km: 'កំណត់លក្ខណៈវិនិច្ឆ័យ ក្នុងតារាងវាយតម្លៃកម្រិតវិវាទ និងរយៈពេលដោះស្រាយ (Evaluation Matrix Settings)', en: 'Evaluation Matrix Settings' },
    'settings.evalDesc': { km: 'កំណត់លក្ខណៈវិនិច្ឆ័យស្ដង់ដារសម្រាប់ប្រភេទវិវាទទាំង ៨ នៅក្នុងមីនុយស្ថិតិ (Analytics Evaluation Matrix)', en: 'Set standard criteria for the 8 categories in Analytics Evaluation Matrix' },
    'settings.btnResetEval': { km: 'កំណត់ទៅលក្ខខណ្ឌដើម', en: 'Reset to Default' },
    'settings.btnSaveEval': { km: 'រក្សាទុកការកំណត់ (Save Matrix)', en: 'Save Matrix Settings' },
    'settings.thSettleTitle': { km: '១. បញ្ចប់ព្រមព្រៀង (Settle Rate)', en: '1. Settle Rate' },
    'settings.thTotalTitle': { km: '២. សំណុំរឿងសរុប (Total Cases/Month)', en: '2. Total Cases/Month' },
    'settings.thActiveTitle': { km: '៣. កំពុងសម្រុះសម្រួល (Active Rate)', en: '3. Active Rate' },
    'settings.thCloseTitle': { km: '៤. បិទ/មិនព្រមព្រៀង (Closed Rate)', en: '4. Closed Rate' },
    'settings.thPendingTitle': { km: '៥. តម្កល់/ផ្អាក (Pending Rate)', en: '5. Pending Rate' },
    'settings.emCat': { km: 'ប្រភេទវិវាទ (Dispute Category)', en: 'Dispute Category' },
    'settings.emResp': { km: 'ទំនួលខុសត្រូវ (Responsibility)', en: 'Responsibility' },
    'settings.emNego': { km: 'ការចរចា (Negotiation)', en: 'Negotiation' },
    'settings.emEmp': { km: 'ការយោគយល់ (Empathy)', en: 'Empathy' },
    'settings.emSpirit': { km: 'ស្មារតី (Spirit)', en: 'Spirit' },
    'settings.emTime': { km: 'រយៈពេលដោះស្រាយស្ដង់ដារ (Standard Timeframe)', en: 'Standard Timeframe' },
    'settings.stratHeader': { km: 'កំណត់យុទ្ធសាស្ត្រដោះស្រាយវិវាទលើគ្រប់ស្ថានភាពទាំង ៥ (Resolution Strategies)', en: 'Resolution Strategies across all 5 Statuses' },
    'settings.stratDesc': { km: 'កំណត់ និងកែសម្រួលយុទ្ធសាស្ត្រណែនាំសម្រាប់មន្ត្រីអនុវត្ត លើស្ថានភាព៖ សរុប, ព្រមព្រៀង, កំពុងសម្រុះសម្រួល, តម្កល់, និងបិទ', en: 'Define and adjust strategy guidelines for: Total, Agreed, Mediating, Pending, Closed' },
    'settings.btnResetStrat': { km: 'កំណត់ទៅលក្ខខណ្ឌដើម', en: 'Reset to Default' },
    'settings.btnSaveStrat': { km: 'រក្សាទុកយុទ្ធសាស្ត្រ (Save Strategies)', en: 'Save Strategies' },
    'settings.intTelegram': { km: '១. ការជូនដំណឹងតាម Telegram (Telegram Bot)', en: '1. Telegram Notifications' },
    'settings.intSaveTg': { km: 'រក្សាទុកការកំណត់ Telegram', en: 'Save Telegram Settings' },
    'settings.intTestTg': { km: 'សាកល្បងផ្ញើសារ (Test)', en: 'Test Message' },
    'settings.intGcal': { km: '២. ភ្ជាប់ Google Calendar', en: '2. Google Calendar Integration' },
    'settings.intGcalHelp': { km: 'ត្រូវការ Client ID ដើម្បីភ្ជាប់បាន។ រក្សាទុកវានៅក្នុង LocalStorage។', en: 'Client ID required to connect. Saved in LocalStorage.' },
    'settings.intSaveGcal': { km: 'រក្សាទុក Client ID', en: 'Save Client ID' },
    'settings.intAuthGcal': { km: 'ភ្ជាប់ជាមួយ Google Calendar', en: 'Connect to Google Calendar' },
    'settings.intSignout': { km: 'ផ្តាច់គណនី (Sign Out)', en: 'Sign Out' },
    'settings.intSyncBulk': { km: 'ធ្វើបច្ចុប្បន្នភាពកម្មវិធីទាំងអស់ទៅ Google Calendar (Bulk Sync)', en: 'Bulk Sync to Google Calendar' },

    // ------------ Entry View Cards ------------
    'header.loading': { km: 'កំពុងផ្ទុក...', en: 'Loading...' },
    'header.zoomOut': { km: 'បង្រួម (Zoom Out)', en: 'Zoom Out' },
    'header.zoomIn': { km: 'ពង្រីក (Zoom In)', en: 'Zoom In' },
    'header.themeToggle': { km: 'ប្តូរពណ៌ Dark/Light Mode', en: 'Toggle Dark/Light Mode' },
    'header.logout': { km: 'ចាកចេញ (Logout)', en: 'Logout' },
    
    'entry.manualTitle': { km: '១. បញ្ចូលសំណុំរឿងដោយដៃ', en: '1. Full Manual Form' },
    'entry.manualSubtitle': { km: 'ទម្រង់បញ្ចូលទិន្នន័យពេញលេញ (២០+ មុខវិជ្ជា)', en: 'Complete Data Form (20+ Fields)' },
    'entry.nadrStandard': { km: 'ស្ដង់ដារ NADR', en: 'NADR Standard' },
    'entry.partyInfo': { km: '<strong>ព័ត៌មានភាគីវិវាទ៖</strong> ឈ្មោះ អាយុ ភេទ លេខទូរស័ព្ទ និងអាសយដ្ឋានភាគី ក និងភាគី ខ', en: '<strong>Party Info:</strong> Name, Age, Gender, Phone & Address of Party A & B' },
    'entry.objectInfo': { km: '<strong>កម្មវត្ថុ និងទីតាំង៖</strong> ប្រភេទវិវាទ ទីតាំងវិវាទជាក់លាក់ និងខ្លឹមសារបណ្តឹងលម្អិត', en: '<strong>Subject & Location:</strong> Dispute Type, Specific Location & Detailed Summary' },
    'entry.procedureInfo': { km: '<strong>នីតិវិធីដោះស្រាយ៖</strong> ចំណាត់ការបច្ចុប្បន្ន កាលបរិច្ឆេទប្រជុំ និងមន្ត្រីទទួលបន្ទុក', en: '<strong>Procedures:</strong> Current Action, Meeting Dates & Assigned Officers' },
    'entry.btnOpenFull': { km: 'បើកទម្រង់បញ្ចូលសំណុំរឿងពេញលេញ', en: 'Open Full Form Entry' },
    'entry.secureData': { km: 'ទិន្នន័យត្រូវបានរក្សាទុកក្នុងប្រព័ន្ធសុវត្ថិភាពខ្ពស់', en: 'Data is securely stored in the system' },
    'entry.aiTitle': { km: '២. បញ្ចូលសំណុំរឿងរហ័ស ជាមួយ AI Extract', en: '2. Quick Entry with AI Extract' },
    'entry.aiAuto': { km: 'ទាញយកឈ្មោះ និងកាលបរិច្ឆេទស្វ័យប្រវត្តិ', en: 'Auto-extract names & dates' },
    'entry.aiPlaceholder': { km: 'បិទភ្ជាប់អត្ថបទពាក្យបណ្តឹង ឬខ្លឹមសារវិវាទនៅទីនេះ រួចចុច AI Extract...', en: 'Paste complaint or dispute summary here, then click AI Extract...' },
    'entry.aiFile': { km: 'ជ្រើសរើសឯកសារ PDF / Doc', en: 'Select PDF / Doc File' },
    'entry.aiExtractBtn': { km: '✨ ទាញទិន្នន័យ (AI Extract)', en: '✨ Extract Data (AI)' },
    'entry.lblCaseCode': { km: 'លេខកូដសំណុំរឿង', en: 'Case Code' },
    'entry.lblDate': { km: 'កាលបរិច្ឆេទទទួល', en: 'Received Date' },
    'entry.lblCategory': { km: 'ប្រភេទវិវាទ', en: 'Dispute Category' },
    'entry.lblLocation': { km: 'ទីតាំងវិវាទ', en: 'Dispute Location' },
    'entry.lblEvent': { km: 'កម្មវិធី (Event)', en: 'Event / Schedule' },
    'entry.lblEventDate': { km: 'កាលបរិច្ឆេទ', en: 'Date' },
    'entry.lblEventTime': { km: 'ម៉ោង', en: 'Time' },
    'entry.lblPartyA': { km: 'ឈ្មោះភាគី ក (ដើមបណ្តឹង)', en: 'Party A (Complainant)' },
    'entry.lblPartyB': { km: 'ឈ្មោះភាគី ខ (ចុងបណ្តឹង)', en: 'Party B (Respondent)' },
    'entry.lblPartyC': { km: 'ភាគី ត (អ្នកពាក់ព័ន្ធ)', en: 'Party C (Relevant Party)' },
    'entry.lblSummary': { km: 'សង្ខេបកម្មវត្ថុវិវាទ', en: 'Dispute Subject Summary' },
    'entry.lblFiles': { km: 'ឯកសារសំណុំរឿងភ្ជាប់ (PDF / Doc / រូបភាព)៖', en: 'Attached Case Files (PDF / Doc / Image):' },
    'entry.lblUploadFile': { km: 'ជ្រើសរើសឯកសារភ្ជាប់ (PDF, Doc, Image)', en: 'Select Attachment (PDF, Doc, Image)' },
    'entry.lblDropFiles': { km: 'អាចជ្រើសរើសពីឌីស ឬទាញទម្លាក់ទីនេះ', en: 'Choose from disk or drag & drop here' },
    'entry.btnSaveQuick': { km: 'រក្សាទុកសំណុំរឿង (Save Case)', en: 'Save Quick Case' }
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
 * Data Values Dictionary (for translating dynamic saved data like statuses, provinces, categories)
 */
const DATA_I18N = {
    // Provinces/Locations
    'ភ្នំពេញ': 'Phnom Penh', 'កណ្តាល': 'Kandal', 'តាកែវ': 'Takeo', 'កំពង់ចាម': 'Kampong Cham', 'សៀមរាប': 'Siem Reap', 'បាត់ដំបង': 'Battambang', 
    'បន្ទាយមានជ័យ': 'Banteay Meanchey', 'កំពង់ធំ': 'Kampong Thom', 'កំពង់ឆ្នាំង': 'Kampong Chhnang', 'ពោធិ៍សាត់': 'Pursat', 
    'ព្រៃវែង': 'Prey Veng', 'ស្វាយរៀង': 'Svay Rieng', 'កំពត': 'Kampot', 'កែប': 'Kep', 'ព្រះសីហនុ': 'Preah Sihanouk', 
    'កោះកុង': 'Koh Kong', 'កំពង់ស្ពឺ': 'Kampong Speu', 'ត្បូងឃ្មុំ': 'Tboung Khmum', 'ក្រចេះ': 'Kratie', 'ស្ទឹងត្រែង': 'Stung Treng', 
    'រតនគិរី': 'Ratanakiri', 'មណ្ឌលគិរី': 'Mondulkiri', 'ព្រះវិហារ': 'Preah Vihear', 'ឧត្តរមានជ័យ': 'Oddar Meanchey', 'ប៉ៃលិន': 'Pailin',
    
    // Categories
    'វិវាទដីធ្លី': 'Land Dispute',
    'វិវាទគ្រួសារ': 'Family Dispute',
    'វិវាទហិរញ្ញវត្ថុ': 'Financial Dispute',
    'វិវាទព្រហ្មទណ្ឌ': 'Criminal Dispute',
    'វិវាទការងារ': 'Labor Dispute',
    'វិវាទផ្សេងៗ': 'Other Dispute',
    
    // Gender
    'ប្រុស': 'Male',
    'ស្រី': 'Female',

    // Statuses
    'Active (កំពុងសម្រុះសម្រួល)': 'Active (Mediating)',
    'Pending (តម្កល់)': 'Pending (On Hold)',
    'Settle (ព្រមព្រៀង)': 'Settle (Agreed)',
    'No Settle (មិនព្រមព្រៀង)': 'No Settle (Disagreed)',

    // Action Groups
    'Active - សំណុំរឿងកំពុងចាត់ការ': 'Active - Case Processing',
    'Closed - សំណុំរឿងបានចាត់ការរួច': 'Closed - Case Concluded',

    // Meeting Statuses
    'មិនទាន់ប្រជុំ': 'Not yet met',
    'ភាគីមិនចូលរួម': 'Party did not attend',
    'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់': 'Gathered info from other party',
    'បានប្រជុំប្រមូលព័ត៌មានភាគីរួច': 'Meeting and Info Gathering completed',
    'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)': 'Mediation Meeting (Ongoing)',
    'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)': 'Mediation Meeting Completed (Agreed)',
    'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)': 'Mediation Meeting Completed (Disagreed)',
    'បានធ្វើរបាយការបិទសំណុំរឿងជាស្ថាពរ': 'Final Closing Report Submitted',

    // Remarks
    'ភាគីដកពាក្យបណ្តឹង': 'Party Withdrew Complaint',
    'ភាគីមិនចូលរួម ឬមិនបន្តការសម្រុះសម្រួល': 'Party did not attend or continue mediation',
    'កំពុងពិនិត្យ និងដោះស្រាយ (មិនទាន់បិទ)': 'Reviewing & Processing (Not Closed)',
    'តម្កល់រង់ចាំនីតិវិធីបន្ត (មិនទាន់បិទ)': 'Pending for further procedure (Not Closed)',
    'សម្រុះសម្រួលព្រមព្រៀងជោគជ័យ (បានបិទរួចរាល់)': 'Mediation Successful (Closed)',

    // Calendar Events
    '១. ប្រជុំផ្តល់ព័ត៌មាន': '1. Information Meeting',
    '២. ចុះពិនិត្យទីតាំង': '2. Site Visit',
    '៣. ប្រជុំសម្រុះសម្រួល': '3. Mediation Meeting',

    // Action Plan Targets
    'យុទ្ធសាស្ត្រអត្រាព្រមព្រៀង (Settle Rate)': 'Settle Rate Strategy',
    'យុទ្ធសាស្ត្រសំណុំរឿងសរុប (Total Volume)': 'Total Volume Strategy',
    'យុទ្ធសាស្ត្រកំពុងសម្រុះសម្រួល (Active Rate)': 'Active Rate Strategy',
    'យុទ្ធសាស្ត្របិទ/មិនព្រមព្រៀង (Closed Rate)': 'Closed Rate Strategy',
    'យុទ្ធសាស្ត្រតម្កល់/ផ្អាក (Pending Rate)': 'Pending Rate Strategy',

    // Action Plan Status
    'កំពុងអនុវត្ត': 'Ongoing',
    'សម្រេចបានរួចរាល់': 'Completed',
    'ពន្យារពេល/បន្ត': 'Postponed / Continued'
};

/**
 * Translate dynamic saved data values if English is selected
 * @param {string} val - The dynamic value saved in Khmer
 * @returns {string} - English translated value or original Khmer
 */
function t_val(val) {
    if (!val) return val;
    if (currentLang === 'en') {
        // Find exact match
        if (DATA_I18N[val]) return DATA_I18N[val];
        
        // Handle fallback for partial matches (like Active - ...)
        for (const [km, en] of Object.entries(DATA_I18N)) {
            if (val === km) return en;
        }
    }
    return val;
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
            el.innerHTML = val;
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
