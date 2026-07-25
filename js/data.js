/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - DATA LAYER (js/data.js) - NADR MASTER REVAMP
   Handles 25 Provinces, 8 Categories, 4 Statuses, 3 Meeting Progress options,
   Local Storage CRUD, Mock Data, and Excel/JSON Data Import Engine.
   ========================================================================== */

// 1. បញ្ជី ២៥ រាជធានី-ខេត្ត ជាមួយអក្សរកាត់ (Provinces & Capital List)
const PROVINCES_LIST = [
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

// 2. ប្រភេទសំណុំរឿង ៨ ប្រភេទ (8 Case Categories)
const CASE_CATEGORIES = [
    'វិវាទកិច្ចសន្យា',
    'វិវាទក្នុងគ្រួសារ',
    'វិវាទជំពាក់ប្រាក់',
    'វិវាទដីធ្លី',
    'វិវាទពាណិជ្ជកម្ម',
    'វិវាទមត៌ក',
    'វិវាទអចលនវត្ថុ',
    'វិវាទការងារ'
];

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
    const initialLength = casesData.length;
    casesData = casesData.filter(c => c.id !== id);
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
    const year = new Date().getFullYear();
    const prefix = `NADR-${year}-`;
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
            if (c.status !== filters.status && !c.status.startsWith(filters.status)) return false;
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
        return true;
    });
}

/**
 * Sort cases by specific field
 */
function sortCases(casesArray, sortBy = 'date-desc') {
    const sorted = [...casesArray];
    sorted.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return b.dateReceived.localeCompare(a.dateReceived);
            case 'date-asc':
                return a.dateReceived.localeCompare(b.dateReceived);
            case 'number-asc':
                return a.caseNumber.localeCompare(b.caseNumber);
            case 'number-desc':
                return b.caseNumber.localeCompare(a.caseNumber);
            default:
                return b.dateReceived.localeCompare(a.dateReceived);
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
        settleRate: 0,
        byCategory: {},
        byLocation: {}
    };

    // Initialize category counts
    CASE_CATEGORIES.forEach(cat => { stats.byCategory[cat] = 0; });
    PROVINCES_LIST.forEach(p => { stats.byLocation[p.name] = 0; });

    data.forEach(c => {
        // Status counts
        if (c.status.startsWith('Active')) stats.active++;
        else if (c.status.startsWith('Settle')) stats.settle++;
        else if (c.status.startsWith('Close')) stats.close++;
        else if (c.status.startsWith('Pending')) stats.pending++;

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
