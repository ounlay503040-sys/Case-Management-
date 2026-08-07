/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - REPORT GENERATOR LAYER (js/reports.js)
   Handles generating official Cambodian reports, Excel export matching Master Table 100%, and Printing
   ========================================================================== */

let currentReportData = [];
let currentReportType = 'master-list';

document.addEventListener('DOMContentLoaded', () => {
    initReportEvents();
});

function initReportEvents() {
    const btnGen = document.getElementById('btn-generate-report');
    const btnPrint = document.getElementById('btn-print-report');
    const btnExcel = document.getElementById('btn-export-excel');
    const btnWord = document.getElementById('btn-export-word');

    if (btnGen) {
        btnGen.addEventListener('click', () => {
            generateReport();
        });
    }

    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            const paper = document.getElementById('report-content');
            const printArea = document.getElementById('print-area');
            if (paper && printArea) {
                printArea.innerHTML = paper.innerHTML;
            }
            window.print();
        });
    }

    if (btnExcel) {
        btnExcel.addEventListener('click', () => {
            exportReportToExcel();
        });
    }

    if (btnWord) {
        btnWord.addEventListener('click', () => {
            exportReportToWord();
        });
    }
}

/**
 * Generate official administrative report
 */
function generateReport(silent = false) {
    const type = document.getElementById('report-type')?.value || 'master-list';
    const monthYearVal = document.getElementById('report-month-year')?.value || '';
    let startDate = document.getElementById('report-start-date')?.value || '';
    let endDate = document.getElementById('report-end-date')?.value || '';
    const statusFilter = document.getElementById('report-filter-status')?.value || 'ALL';

    if (monthYearVal) {
        const [yyyy, mm] = monthYearVal.split('-');
        if (yyyy && mm) {
            const lastDay = new Date(parseInt(yyyy), parseInt(mm), 0).getDate();
            startDate = `${yyyy}-${mm}-01`;
            endDate = `${yyyy}-${mm}-${lastDay.toString().padStart(2, '0')}`;
        }
    }

    currentReportType = type;

    // Filter data
    let filtered = casesData.filter(c => {
        if (startDate && c.dateReceived < startDate) return false;
        if (endDate && c.dateReceived > endDate) return false;
        if (statusFilter !== 'ALL' && c.status !== statusFilter && !c.status.startsWith(statusFilter)) return false;
        return true;
    });

    // Sort by date received
    filtered = sortCases(filtered, 'date-asc');
    currentReportData = filtered;

    // Show paper and hide placeholder
    const placeholder = document.getElementById('report-placeholder');
    const paper = document.getElementById('report-content');
    const btnPrint = document.getElementById('btn-print-report');
    const btnExcel = document.getElementById('btn-export-excel');
    const btnWord = document.getElementById('btn-export-word');

    if (placeholder) placeholder.style.display = 'none';
    if (paper) paper.style.display = 'block';
    if (btnPrint) btnPrint.disabled = false;
    if (btnExcel) btnExcel.disabled = false;
    if (btnWord) btnWord.disabled = false;

    // Avoid duplicate Kingdom header for reports that render their own custom headers
    const officialHeader = paper?.querySelector('.official-report-header');
    const officialFooter = paper?.querySelector('.official-report-footer');
    if (type === 'monthly-progress' || type === 'official-tracking') {
        if (officialHeader) officialHeader.style.display = 'none';
        if (officialFooter) officialFooter.style.display = 'none';
    } else {
        if (officialHeader) officialHeader.style.display = 'block';
        if (officialFooter) officialFooter.style.display = 'flex';
    }

    // Populate header info
    const titleEl = document.getElementById('report-header-title');
    const subEl = document.getElementById('report-header-subtitle');
    const genDateEl = document.getElementById('report-generated-date');
    const sigDateEl = document.getElementById('sig-current-date');

    const todayStr = new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'long', day: 'numeric' });
    if (genDateEl) genDateEl.innerText = `កាលបរិច្ឆេទបង្កើត៖ ${todayStr}`;
    if (sigDateEl) sigDateEl.innerText = `រាជធានីភ្នំពេញ, ${todayStr}`;

    let titleText = 'របាយការណ៍បញ្ជីសំណុំរឿង';
    if (type === 'monthly-progress') titleText = 'របាយការណ៍វឌ្ឍនភាពចំណាត់ការសំណុំរឿងប្រចាំខែ (Monthly Progress Report - ទម្រង់គំរូ PDF)';
    else if (type === 'official-tracking') titleText = 'របាយការណ៍បញ្ជីតាមដានលទ្ធផលដោះស្រាយវិវាទ (Official Tracking)';
    else if (type === 'summary') titleText = 'របាយការណ៍សង្ខេបស្ថិតិទូទៅ';
    else if (type === 'by-status') titleText = 'របាយការណ៍បែងចែកតាមលទ្ធផល';
    else if (type === 'by-category') titleText = 'របាយការណ៍បែងចែកតាមប្រភេទវិវាទ';

    if (titleEl) titleEl.innerText = titleText;
    if (subEl) {
        if (monthYearVal) {
            const [y, m] = monthYearVal.split('-');
            subEl.innerText = `ប្រចាំខែទី ${m} ឆ្នាំ ${y}`;
        } else if (startDate && endDate) {
            subEl.innerText = `ចាប់ពីថ្ងៃទី ${startDate} ដល់ ${endDate}`;
        } else {
            subEl.innerText = `គិតត្រឹមថ្ងៃទី ${todayStr}`;
        }
    }

    // Render body based on type
    const bodyEl = document.getElementById('report-dynamic-body');
    if (!bodyEl) return;

    if (filtered.length === 0) {
        bodyEl.innerHTML = `<div class="text-center py-4" style="color: #666; font-size: 14pt;">ពុំមានទិន្នន័យសំណុំរឿងស្របតាមលក្ខខណ្ឌចម្រោះឡើយ!</div>`;
        return;
    }

    if (type === 'monthly-progress') {
        bodyEl.innerHTML = renderMonthlyProgressReportHTML(filtered);
    } else if (type === 'master-list') {
        bodyEl.innerHTML = renderMasterTableHTML(filtered);
    } else if (type === 'official-tracking') {
        bodyEl.innerHTML = renderOfficialTrackingReportHTML(filtered);
    } else if (type === 'summary') {
        bodyEl.innerHTML = renderSummaryReportHTML(filtered);
    } else if (type === 'by-status') {
        bodyEl.innerHTML = renderByStatusHTML(filtered);
    } else if (type === 'by-category') {
        bodyEl.innerHTML = renderByCategoryHTML(filtered);
    }

    if (!silent) {
        showToast(`បានបង្កើតរបាយការណ៍ដែលមាន ${filtered.length} សំណុំរឿងរួចរាល់!`, 'success');
    }
}

/**
 * HTML: Monthly Progress Report matching the user's PDF exact 12-column structure
 */
function renderMonthlyProgressReportHTML(dataArray) {
    const officerName = localStorage.getItem('nadr_user_profile_name') || document.getElementById('header-user-name')?.innerText || 'ឡាយ អូន';
    const monthYearVal = document.getElementById('report-month-year')?.value || '';
    const now = monthYearVal ? new Date(monthYearVal + '-01') : new Date();
    const monthsKm = ['មករា', 'កុមភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const monthStr = `${monthsKm[now.getMonth()]} (${now.toLocaleDateString('en-US', { month: 'long' })})`;
    const todayStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear().toString().slice(2)}`;

    let totCount = dataArray.length;
    let settleCount = 0;
    let activeCount = 0;
    let invCount = 0;

    dataArray.forEach(c => {
        if (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))) {
            settleCount++;
        } else if (c.status.startsWith('Active') || c.status.includes('កំពុង')) {
            activeCount++;
        } else {
            invCount++;
        }
    });

    let html = `
        <div style="font-family: inherit; margin-bottom: 20px; position: relative;">
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 13pt; font-weight: normal; color: #1e3a8a; margin: 0 0 4px 0;">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                <h4 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 11pt; font-weight: normal; color: #1e3a8a; margin: 0 0 15px 0;">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
                <div style="font-family: inherit; font-size: 16pt; font-weight: normal; color: #ca8a04; margin-bottom: 15px;">❧</div>
                <h2 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 12.5pt; font-weight: normal; color: #0f172a; margin: 0 0 8px 0; line-height: 1.6;">របាយការណ៍វឌ្ឍនភាពចំណាត់ការសំណុំរឿងរបស់ ម.ស.វ. ឈ្មោះ <span contenteditable="true" style="color: #dc2626; font-weight: normal; border-bottom: 1px dashed #dc2626; padding: 0 4px;">${officerName}</span></h2>
                <p style="font-size: 10.5pt; font-weight: 700; color: #334155; margin: 0;">ប្រចាំខែ <span style="color: #2563eb;">${monthStr}</span> <span style="font-weight: normal; color: #64748b;">( គិតត្រឹមថ្ងៃទី ${todayStr} )</span></p>
            </div>

            <!-- Top Right Summary Table matching PDF -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <table style="border-collapse: collapse; font-size: 9.5pt; text-align: center; border: 2px solid #0f172a; background: #fff;" border="1">
                    <thead>
                        <tr style="background: #ffedd5; font-weight: 800; color: #0f172a;">
                            <th style="padding: 6px 12px; border: 1px solid #0f172a;">សំណុំរឿងសរុប</th>
                            <th style="padding: 6px 12px; border: 1px solid #0f172a;">បញ្ចប់ព្រមព្រៀង</th>
                            <th style="padding: 6px 12px; border: 1px solid #0f172a;">សើបអង្កេត/បិទ</th>
                            <th style="padding: 6px 12px; border: 1px solid #0f172a;">កំពុងចំណាត់ការ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="font-weight: 800; font-size: 11pt; color: #1e293b;">
                            <td style="padding: 6px 12px; border: 1px solid #0f172a; color: #2563eb;">${totCount}</td>
                            <td style="padding: 6px 12px; border: 1px solid #0f172a; color: #16a34a;">${settleCount}</td>
                            <td style="padding: 6px 12px; border: 1px solid #0f172a; color: #64748b;">${invCount}</td>
                            <td style="padding: 6px 12px; border: 1px solid #0f172a; color: #d97706;">${activeCount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; font-family: inherit;" border="1">
            <thead>
                <tr style="background: #fcd34d; color: #0f172a; text-align: center; font-weight: 800; border: 1px solid #ca8a04;">
                    <th rowspan="2" style="padding: 8px 4px; width: 30px; border: 1px solid #ca8a04; vertical-align: middle;">ល.រ</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 95px; border: 1px solid #ca8a04; vertical-align: middle;">បច្ចុប្បន្នភាព</th>
                    <th colspan="2" style="padding: 6px; border: 1px solid #ca8a04; background: #fcd34d;">ព័ត៌មានសំណុំរឿង</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 170px; border: 1px solid #ca8a04; vertical-align: middle;">ព័ត៌មានភាគីដាក់ពាក្យ</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 170px; border: 1px solid #ca8a04; vertical-align: middle;">ព័ត៌មានភាគីម្ខាងទៀត</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 110px; border: 1px solid #ca8a04; vertical-align: middle;">កម្មវត្ថុ និងទីតាំងវិវាទ</th>
                    <th colspan="3" style="padding: 6px; border: 1px solid #ca8a04; background: #fcd34d;">អំពីចំណាត់ការសំណុំរឿង</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 70px; border: 1px solid #ca8a04; vertical-align: middle;">មសវ អម<br>(តាមលិខិតចាត់តាំង)</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 85px; border: 1px solid #ca8a04; vertical-align: middle;">កត់ចំណាំ/បញ្ហា<br>ប្រឈម/សំណូមពរ</th>
                </tr>
                <tr style="background: #fcd34d; color: #0f172a; text-align: center; font-weight: 700; border: 1px solid #ca8a04;">
                    <th style="padding: 6px; width: 65px; border: 1px solid #ca8a04;">លេខចុះបញ្ជី</th>
                    <th style="padding: 6px; width: 75px; border: 1px solid #ca8a04;">កាលបរិច្ឆេទ<br>ចុះបញ្ជី</th>
                    <th style="padding: 6px; width: 105px; border: 1px solid #ca8a04;">កិច្ចប្រជុំប្រមូលព័ត៌មាន<br>ភាគី "ក"</th>
                    <th style="padding: 6px; width: 105px; border: 1px solid #ca8a04;">កិច្ចប្រជុំប្រមូលព័ត៌មាន<br>ភាគី "ខ"</th>
                    <th style="padding: 6px; width: 115px; border: 1px solid #ca8a04;">កិច្ចប្រជុំសម្រុះសម្រួល</th>
                </tr>
            </thead>
            <tbody>
                <!-- Section A: Directly Responsible Cases -->
                <tr style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 10.5pt; border: 1px solid #0284c7;">
                    <td colspan="12" style="padding: 10px 12px; text-align: left; border: 1px solid #0284c7;">
                        ក. សំណុំរឿងទទួលបន្ទុកផ្ទាល់
                    </td>
                </tr>
    `;

    dataArray.forEach((c, idx) => {
        let statusText = c.status;
        let rowBg = '#ffffff';
        if (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))) {
            statusText = 'ព្រមព្រៀងបញ្ចប់វិវាទ';
            rowBg = '#dcfce7'; // Pastel Green
        } else if (c.status.startsWith('Close') || c.status.includes('បិទ') || c.status.includes('មិនព្រមព្រៀង')) {
            statusText = 'បិទសំណុំរឿង';
            rowBg = '#ffedd5'; // Light peach/orange matching PDF row 1
        } else if (c.status.startsWith('Active') || c.status.includes('កំពុង')) {
            statusText = 'កំពុងសម្រុះសម្រួល';
            rowBg = '#93c5fd'; // Solid blue matching Image 1
        } else {
            statusText = 'សើបអង្កេត / តម្កល់';
            rowBg = '#f1f5f9'; // Gray
        }

        html += `
            <tr style="background-color: ${rowBg}; vertical-align: middle; border: 1px solid #cbd5e1;">
                <td style="padding: 6px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${idx + 1}</td>
                <td style="padding: 6px; text-align: center; font-weight: 700; color: #1e3a8a; border: 1px solid #cbd5e1;">${statusText}</td>
                <td style="padding: 6px; text-align: center; font-weight: 700; color: #1d4ed8; border: 1px solid #cbd5e1;">${c.caseNumber}</td>
                <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">${c.dateReceived}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">
                    ${c.partyA_name}
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">
                    ${c.partyB_name}
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">
                    <strong style="color: #1e3a8a;">${c.category}</strong><br>
                    <span style="font-size: 8.5pt; color: #475569;">${c.disputeLocation || '-'}</span>
                </td>
                <td style="padding: 6px; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.meetingPartyA || 'បានប្រមូលព័ត៌មានភាគីសន្និដ្ឋានរួចរាល់'}</td>
                <td style="padding: 6px; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.meetingPartyB || 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់'}</td>
                <td style="padding: 6px; font-size: 8.5pt; font-weight: 600; color: #1d4ed8; border: 1px solid #cbd5e1;">${c.mediationMeeting || 'បានប្រជុំសម្រុះសម្រួលរួចរាល់'}</td>
                <td style="padding: 6px; text-align: center; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.assistingOfficer || 'គ្មាន'}</td>
                <td style="padding: 6px; text-align: center; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.remarks || 'គ្មាន'}</td>
            </tr>
        `;
    });

    html += `
                <!-- Section B: Assisting Officer Cases -->
                <tr style="background: #fcd34d; color: #854d0e; font-weight: 800; font-size: 10.5pt; border: 1px solid #ca8a04;">
                    <td colspan="12" style="padding: 10px 12px; text-align: left; border: 1px solid #ca8a04;">
                        ខ. សំណុំរឿងអមជាមួយថ្នាក់ដឹកនាំ និងឬជាមួយ ម.ស.វ.
                    </td>
                </tr>
                <tr style="background: #ffffff; height: 40px;">
                    <td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td>
                </tr>
                <tr style="background: #ffffff; height: 40px;">
                    <td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td>
                </tr>
                <tr style="background: #ffffff; height: 40px;">
                    <td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td><td style="border: 1px solid #cbd5e1;"></td>
                </tr>
            </tbody>
        </table>
    `;

    return html;
}

/**
 * HTML: Official Tracking Report (matching Screenshot 2 - 11 columns with color-coded rows)
 */
function renderOfficialTrackingReportHTML(dataArray) {
    let html = `
        <div style="text-align: center; margin-bottom: 20px; font-family: inherit;">
            <h3 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 14pt; font-weight: normal; color: #1e3a8a; margin: 0 0 4px 0;">ព្រះរាជាណាចក្រកម្ពុជា</h3>
            <h4 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 12pt; font-weight: normal; color: #1e3a8a; margin: 0 0 10px 0;">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
            <div style="font-family: inherit; font-size: 16pt; font-weight: normal; color: #ca8a04; margin-bottom: 15px;">❧</div>
            <h2 style="font-family: 'Khmer OS Muol Light', 'Muol Light', serif; font-size: 13pt; font-weight: normal; color: #0f172a; margin: 0 0 6px 0;">តារាងតាមដានលទ្ធផលនៃការដោះស្រាយវិវាទ (Official Case Tracking & Outcome Report)</h2>
            <p style="font-size: 10pt; color: #475569; margin: 0;">អាជ្ញាធរជាតិដោះស្រាយវិវាទ - អគ្គលេខាធិការដ្ឋាន</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 15px; font-family: inherit;" border="1">
            <thead>
                <tr style="background: #fde047; color: #1e293b; text-align: center; font-weight: 800; border: 1px solid #ca8a04;">
                    <th rowspan="2" style="padding: 8px 4px; width: 35px; border: 1px solid #ca8a04; vertical-align: middle;">ល.រ</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 110px; border: 1px solid #ca8a04; vertical-align: middle;">លេខកូដសំណុំរឿង & ថ្ងៃខែ</th>
                    <th rowspan="2" style="padding: 8px 6px; border: 1px solid #ca8a04; vertical-align: middle;">ដើមបណ្ដឹង (ភាគី ក)</th>
                    <th rowspan="2" style="padding: 8px 6px; border: 1px solid #ca8a04; vertical-align: middle;">ចុងបណ្ដឹង (ភាគី ខ)</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 110px; border: 1px solid #ca8a04; vertical-align: middle;">ប្រភេទវិវាទ</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 80px; border: 1px solid #ca8a04; vertical-align: middle;">ទីតាំងវិវាទ</th>
                    <th colspan="3" style="padding: 6px 0; border: 1px solid #ca8a04; background: #facc15;">ដំណើរការនីតិវិធីសម្រុះសម្រួល (Procedure & Action)</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 100px; border: 1px solid #ca8a04; vertical-align: middle;">លទ្ធផល (Status)</th>
                    <th rowspan="2" style="padding: 8px 6px; width: 90px; border: 1px solid #ca8a04; vertical-align: middle;">កំណត់សម្គាល់</th>
                </tr>
                <tr style="background: #fef08a; color: #1e293b; text-align: center; font-weight: 700; border: 1px solid #ca8a04;">
                    <th style="padding: 6px; width: 110px; border: 1px solid #ca8a04;">ជួបភាគី ក</th>
                    <th style="padding: 6px; width: 110px; border: 1px solid #ca8a04;">ជួបភាគី ខ</th>
                    <th style="padding: 6px; width: 140px; border: 1px solid #ca8a04;">កិច្ចប្រជុំសម្រុះសម្រួល</th>
                </tr>
            </thead>
            <tbody>
    `;

    const categories = typeof CASE_CATEGORIES !== 'undefined' ? CASE_CATEGORIES : Array.from(new Set(dataArray.map(c => c.category || 'ផ្សេងៗ')));
    let overallIndex = 0;
    let totSettle = 0;
    let totActive = 0;
    let totClose = 0;
    let totPending = 0;

    categories.forEach((cat, catIdx) => {
        const catCases = dataArray.filter(c => c.category === cat);
        if (catCases.length > 0) {
            html += `
                <tr style="background: linear-gradient(90deg, #e0f2fe, #f0f9ff); color: #0369a1; font-weight: 800; font-size: 10.5pt; border: 1px solid #0284c7;">
                    <td colspan="11" style="padding: 10px 12px; text-align: left; border: 1px solid #0284c7;">
                        <i class="fa-solid fa-folder-open" style="margin-right: 6px;"></i> ${catIdx + 1}. ${cat} (សរុប៖ <span style="color: #d97706;">${catCases.length}</span> ករណី)
                    </td>
                </tr>
            `;

            catCases.forEach((c) => {
                overallIndex++;
                if (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))) totSettle++;
                else if (c.status.startsWith('Active') || c.status.includes('កំពុង')) totActive++;
                else if (c.status.startsWith('Pending') || c.status.includes('តម្កល់')) totPending++;
                else totClose++;

                let rowBg = '#ffffff';
                if (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))) rowBg = '#dcfce7';
                else if (c.status.startsWith('Active') || c.status.includes('កំពុង')) rowBg = '#93c5fd';
                else if (c.status.startsWith('Pending') || c.status.includes('តម្កល់')) rowBg = '#ffedd5';
                else if (c.status.startsWith('Close') || c.status.includes('បិទ') || c.status.includes('មិនព្រមព្រៀង')) rowBg = '#ffedd5';
                else if (overallIndex % 2 === 1) rowBg = '#fef9c3';

                html += `
                    <tr style="background-color: ${rowBg}; vertical-align: middle; border: 1px solid #cbd5e1; transition: background 0.2s;">
                        <td style="padding: 6px; text-align: center; font-weight: 700; border: 1px solid #cbd5e1;">${overallIndex}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">
                            <strong style="color: #1d4ed8; font-size: 10pt;">${c.caseNumber}</strong><br>
                            <span style="font-size: 8.5pt; color: #475569;">📅 ${c.dateReceived}</span>
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1;">
                            <strong style="color: #0f172a;">${c.partyA_name}</strong> (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ)<br>
                            <span style="font-size: 8.5pt; color: #475569;">📞 ${c.partyA_phone || 'ពុំមាន'} | 📍 ${c.partyA_location}</span>
                        </td>
                        <td style="padding: 6px; border: 1px solid #cbd5e1;">
                            <strong style="color: #0f172a;">${c.partyB_name}</strong> (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ)<br>
                            <span style="font-size: 8.5pt; color: #475569;">📞 ${c.partyB_phone || 'ពុំមាន'} | 📍 ${c.partyB_location}</span>
                        </td>
                        <td style="padding: 6px; font-weight: 600; color: #1e3a8a; border: 1px solid #cbd5e1;">${c.category}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #cbd5e1;">${c.disputeLocation}</td>
                        <td style="padding: 6px; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.meetingPartyA || 'ពុំទាន់ជួប'}</td>
                        <td style="padding: 6px; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.meetingPartyB || 'ពុំទាន់ជួប'}</td>
                        <td style="padding: 6px; font-size: 8.5pt; font-weight: 600; color: #1d4ed8; border: 1px solid #cbd5e1;">${c.mediationMeeting || 'រង់ចាំកិច្ចប្រជុំ'}</td>
                        <td style="padding: 6px; text-align: center; font-weight: 800; border: 1px solid #cbd5e1; color: ${c.status.startsWith('Settle') ? '#15803d' : (c.status.startsWith('Active') ? '#1d4ed8' : '#b91c1c')};">${c.status}</td>
                        <td style="padding: 6px; text-align: center; font-size: 8.5pt; border: 1px solid #cbd5e1;">${c.remarks || '-'}</td>
                    </tr>
                `;
            });
        }
    });

    html += `
            </tbody>
            <tfoot style="background: #f8fafc; font-weight: 800; border: 2px solid #0f172a; color: #0f172a;">
                <tr>
                    <td colspan="9" style="padding: 10px 15px; text-align: right; border: 1px solid #cbd5e1;">សរុបលទ្ធផលរួម (Total Summary)៖</td>
                    <td colspan="2" style="padding: 10px; text-align: left; border: 1px solid #cbd5e1; font-size: 9pt;">
                        <span style="color: #2563eb;">កំពុងដោះស្រាយ៖ ${totActive}</span> | 
                        <span style="color: #16a34a;">ព្រមព្រៀង៖ ${totSettle}</span> | 
                        <span style="color: #d97706;">តម្កល់៖ ${totPending}</span> | 
                        <span style="color: #dc2626;">មិនព្រមព្រៀង/បិទ៖ ${totClose}</span>
                    </td>
                </tr>
            </tfoot>
        </table>
    `;
    return html;
}

/**
 * HTML: Master Table matching Master Excel columns
 */
function renderMasterTableHTML(dataArray) {
    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 15px;" border="1">
            <thead>
                <tr style="background-color: #f1f5f9; text-align: center; font-weight: 700;">
                    <th style="padding: 8px 4px; width: 30px;">ល.រ</th>
                    <th style="padding: 8px 6px; width: 110px;">លេខកូដសំណុំរឿង</th>
                    <th style="padding: 8px 6px; width: 80px;">កាលបរិច្ឆេទ</th>
                    <th style="padding: 8px 6px;">ដើមបណ្ដឹង ភាគី (ក)</th>
                    <th style="padding: 8px 6px;">ចុងបណ្ដឹង ភាគី (ខ)</th>
                    <th style="padding: 8px 6px; width: 110px;">ប្រភេទវិវាទ</th>
                    <th style="padding: 8px 6px; width: 80px;">ទីតាំង</th>
                    <th style="padding: 8px 6px;">ចំណាត់ការសម្រុះសម្រួល</th>
                    <th style="padding: 8px 6px; width: 100px;">លទ្ធផល</th>
                    <th style="padding: 8px 6px; width: 80px;">កំណត់ចំណាំ</th>
                </tr>
            </thead>
            <tbody>
    `;

    dataArray.forEach((c, index) => {
        html += `
            <tr style="vertical-align: top;">
                <td style="padding: 6px; text-align: center;">${index + 1}</td>
                <td style="padding: 6px; font-weight: 700; color: #2563eb; text-align: center;">${c.caseNumber}</td>
                <td style="padding: 6px; text-align: center;">${c.dateReceived}</td>
                <td style="padding: 6px;">
                    <strong>${c.partyA_name}</strong> (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ)<br>
                    <span style="font-size: 9pt; color: #555;">📞 ${c.partyA_phone || 'ពុំមាន'} | 📍 ${c.partyA_location}</span>
                </td>
                <td style="padding: 6px;">
                    <strong>${c.partyB_name}</strong> (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ)<br>
                    <span style="font-size: 9pt; color: #555;">📞 ${c.partyB_phone || 'ពុំមាន'} | 📍 ${c.partyB_location}</span>
                </td>
                <td style="padding: 6px;">${c.category}</td>
                <td style="padding: 6px; text-align: center;">${c.disputeLocation}</td>
                <td style="padding: 6px; font-size: 9pt;">
                    <div>🔹 ក៖ ${c.meetingPartyA}</div>
                    <div>🔸 ខ៖ ${c.meetingPartyB}</div>
                    <div style="font-weight: 700; color: #2563eb; margin-top: 2px;">⚖️ ${c.mediationMeeting}</div>
                </td>
                <td style="padding: 6px; text-align: center; font-weight: 700; color: ${c.status.startsWith('Settle') ? '#10b981' : (c.status.startsWith('Active') ? '#2563eb' : '#64748b')};">${c.status}</td>
                <td style="padding: 6px; text-align: center; font-size: 9.5pt;">${c.remarks}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;
    return html;
}

/**
 * HTML: Summary report
 */
function renderSummaryReportHTML(dataArray) {
    const stats = getCaseStatistics(dataArray);
    let html = `
        <div style="margin-top: 20px; font-size: 12pt;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #f8fafc;">
                    <h4 style="margin-bottom: 10px; color: #2563eb;">ស្ថិតិតាមលទ្ធផលសំណុំរឿង</h4>
                    <ul style="list-style: none; padding: 0; line-height: 1.8;">
                        <li>🔹 Active (កំពុងសម្រុះសម្រួល)៖ <strong>${stats.active}</strong> ករណី</li>
                        <li>🟢 Settle (ព្រមព្រៀង)៖ <strong>${stats.settle}</strong> ករណី</li>
                        <li>🔘 Close (បិទ)៖ <strong>${stats.close}</strong> ករណី</li>
                        <li>🟡 Pending (តម្កល់)៖ <strong>${stats.pending}</strong> ករណី</li>
                        <li style="border-top: 1px dashed #ccc; margin-top: 6px; padding-top: 6px;">អត្រាផ្សះផ្សាជោគជ័យ៖ <strong style="color: #10b981;">${stats.settleRate} %</strong></li>
                    </ul>
                </div>
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #f8fafc;">
                    <h4 style="margin-bottom: 10px; color: #2563eb;">ស្ថិតិតាមទីតាំងវិវាទ (Top Provinces)</h4>
                    <ul style="list-style: none; padding: 0; line-height: 1.8;">
    `;

    Object.entries(stats.byLocation)
        .filter(e => e[1] > 0)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([loc, cnt]) => {
            html += `<li>📍 ${loc}៖ <strong>${cnt}</strong> ករណី</li>`;
        });

    html += `
                    </ul>
                </div>
            </div>
            ${renderMasterTableHTML(dataArray)}
        </div>
    `;
    return html;
}

/**
 * HTML: Group by status
 */
function renderByStatusHTML(dataArray) {
    const groups = {
        'Active (កំពុងសម្រុះសម្រួល)': [],
        'Settle (ព្រមព្រៀង)': [],
        'Close (បិទ)': [],
        'Pending (តម្កល់)': []
    };

    dataArray.forEach(c => {
        if (c.status.startsWith('Active')) groups['Active (កំពុងសម្រុះសម្រួល)'].push(c);
        else if (c.status.startsWith('Settle')) groups['Settle (ព្រមព្រៀង)'].push(c);
        else if (c.status.startsWith('Close')) groups['Close (បិទ)'].push(c);
        else if (c.status.startsWith('Pending')) groups['Pending (តម្កល់)'].push(c);
    });

    let html = `<div style="margin-top: 15px;">`;
    Object.entries(groups).forEach(([stName, arr]) => {
        if (arr.length > 0) {
            html += `
                <h3 style="margin-top: 24px; margin-bottom: 10px; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px;">
                    📌 លទ្ធផល៖ ${stName} (${arr.length} ករណី)
                </h3>
                ${renderMasterTableHTML(arr)}
            `;
        }
    });
    html += `</div>`;
    return html;
}

/**
 * HTML: Group by category
 */
function renderByCategoryHTML(dataArray) {
    const groups = {};
    CASE_CATEGORIES.forEach(cat => { groups[cat] = []; });

    dataArray.forEach(c => {
        if (groups[c.category]) {
            groups[c.category].push(c);
        } else {
            groups[c.category] = [c];
        }
    });

    let html = `<div style="margin-top: 15px;">`;
    Object.entries(groups).forEach(([catName, arr]) => {
        if (arr.length > 0) {
            html += `
                <h3 style="margin-top: 24px; margin-bottom: 10px; color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px;">
                    ⚖️ ប្រភេទវិវាទ៖ ${catName} (${arr.length} ករណី)
                </h3>
                ${renderMasterTableHTML(arr)}
            `;
        }
    });
    html += `</div>`;
    return html;
}

/**
 * EXCEL EXPORT - Renders content to Excel (.xls) compatible HTML
 */
function exportReportToExcel() {
    const paper = document.getElementById('report-content');
    if (!paper || paper.style.display === 'none') {
        showToast('សូមបង្កើតរបាយការណ៍ជាមុនសិន មុននឹងទាញយកជា Excel!', 'warning');
        return;
    }

    const clone = paper.cloneNode(true);
    
    // Remove elements that were dynamically hidden
    const hiddens = clone.querySelectorAll('[style*="display: none"]');
    hiddens.forEach(el => el.remove());
    
    // Format tables for Excel rendering
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
        table.setAttribute('border', '1');
        table.setAttribute('cellpadding', '4');
        table.setAttribute('cellspacing', '0');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.borderColor = '#000000';
    });

    const ths = clone.querySelectorAll('th');
    ths.forEach(th => {
        th.style.border = '1px solid #000000';
    });
    const tds = clone.querySelectorAll('td');
    tds.forEach(td => {
        td.style.border = '1px solid #000000';
    });

    const titleEl = document.getElementById('report-header-title');
    const fileNameText = titleEl ? titleEl.innerText.replace(/[^a-zA-Z0-9ក-ឤ០-៩]/g, '_') : 'NADR_Report';

    const excelHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                @page {
                    mso-page-orientation: landscape;
                    margin: 0.5in 0.5in 0.5in 0.5in;
                }
                body { font-family: 'Khmer OS Battambang', sans-serif; font-size: 10pt; }
                table { border-collapse: collapse; white-space: nowrap; }
                td, th { white-space: nowrap; vertical-align: middle; }
                h1, h2, h3, h4, th { font-family: 'Khmer OS Muol Light', serif; }
            </style>
        </head>
        <body>
            ${clone.innerHTML}
        </body>
        </html>
    `;

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameText}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('បានទាញយកទិន្នន័យជា Excel រួចរាល់!', 'success');
}

/**
 * Export All Cases to CSV (UTF-8 with BOM for Khmer support)
 */
function exportReportToCSV() {
    if (typeof XLSX === 'undefined') {
        showToast('បណ្ណាល័យ SheetJS ពុំត្រូវបានផ្ទុកទេ! សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត។', 'error');
        return;
    }
    const dataToExport = casesData;
    if (dataToExport.length === 0) {
        showToast('គ្មានទិន្នន័យដើម្បីបញ្ចេញជា CSV ទេ!', 'error');
        return;
    }
    const excelRows = dataToExport.map((c, index) => ({
        'ល.រ': index + 1,
        'លេខកូដសំណុំរឿង': c.caseNumber,
        'កាលបរិច្ឆេទ': c.dateReceived,
        'ឈ្មោះភាគី (ក)': c.partyA_name,
        'ទូរស័ព្ទភាគី (ក)': c.partyA_phone,
        'ឈ្មោះភាគី (ខ)': c.partyB_name,
        'ទូរស័ព្ទភាគី (ខ)': c.partyB_phone,
        'ប្រភេទសំណុំរឿង': c.category,
        'ទីតាំងវិវាទ': c.disputeLocation,
        'សេចក្តីសង្ខេបវិវាទ': c.summary,
        'លទ្ធផលសំណុំរឿង': c.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NADR_All_Cases_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('បានទាញយកទិន្នន័យទាំងអស់ជាឯកសារ CSV រួចរាល់!', 'success');
}

/**
 * Export current report to Word (.doc) with Khmer font support and proper table formatting
 */
function exportReportToWord() {
    const paper = document.getElementById('report-content');
    if (!paper || paper.style.display === 'none') {
        showToast('សូមបង្កើតរបាយការណ៍ជាមុនសិន មុននឹងទាញយកជាឯកសារ Word!', 'warning');
        return;
    }
    
    const clone = paper.cloneNode(true);
    
    // Remove elements that were dynamically hidden
    const hiddens = clone.querySelectorAll('[style*="display: none"]');
    hiddens.forEach(el => el.remove());
    
    // Format tables for Word rendering
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
        table.setAttribute('border', '1');
        table.setAttribute('cellpadding', '6');
        table.setAttribute('cellspacing', '0');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.borderColor = '#000000';
    });

    const ths = clone.querySelectorAll('th');
    ths.forEach(th => {
        th.style.backgroundColor = '#fcd34d';
        th.style.color = '#000000';
        th.style.fontWeight = 'bold';
        th.style.border = '1px solid #000000';
        th.style.padding = '8px';
    });

    const tds = clone.querySelectorAll('td');
    tds.forEach(td => {
        td.style.border = '1px solid #000000';
        td.style.padding = '6px';
    });

    const contentHTML = clone.innerHTML;
    const titleEl = document.getElementById('report-header-title');
    const fileNameText = titleEl ? titleEl.innerText.replace(/[^a-zA-Z0-9ក-ឤ០-៩]/g, '_') : 'NADR_Report';
    
    const wordDocHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${titleEl ? titleEl.innerText : 'របាយការណ៍'}</title>
            <style>
                @page WordSection1 {
                    size: 841.9pt 595.3pt; /* A4 Landscape */
                    mso-page-orientation: landscape;
                    margin: 0.5in 0.5in 0.5in 0.5in;
                    mso-header-margin: 0.5in;
                    mso-footer-margin: 0.5in;
                    mso-paper-source: 0;
                }
                div.WordSection1 { page: WordSection1; }
                body {
                    font-family: 'Khmer OS Battambang', 'Khmer OS Content', 'Arial Unicode MS', sans-serif;
                    font-size: 11pt;
                    line-height: 1.6;
                    color: #0f172a;
                }
                h1, h2, h3, h4, th {
                    font-family: 'Khmer OS Muol Light', 'Muol Light', 'Khmer OS Battambang', serif;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }
                th, td {
                    border: 1px solid #000000;
                    padding: 6px 8px;
                }
                .official-report-header {
                    text-align: center;
                    margin-bottom: 25px;
                }
                .kingdom-title h3 {
                    font-size: 14pt;
                    color: #1e3a8a;
                    margin: 0 0 4px 0;
                }
                .kingdom-title h4 {
                    font-size: 12pt;
                    color: #1e3a8a;
                    margin: 0 0 10px 0;
                }
                .title-underline {
                    width: 80px;
                    height: 2px;
                    background: #ca8a04;
                    margin: 0 auto 15px auto;
                }
                .report-main-title h2 {
                    font-size: 13pt;
                    color: #0f172a;
                    margin: 0 0 6px 0;
                }
                .report-main-title p {
                    font-size: 11pt;
                    color: #475569;
                    margin: 0;
                }
                .official-report-footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                    width: 100%;
                }
                .signature-box {
                    text-align: center;
                    width: 45%;
                    display: inline-block;
                    vertical-align: top;
                }
                .right-sig {
                    float: right;
                }
                .left-sig {
                    float: left;
                }
                .signature-space {
                    height: 80px;
                }
            </style>
        </head>
        <body>
            <div class="WordSection1">
                ${contentHTML}
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob(['\ufeff', wordDocHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileNameText}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('បានទាញយករបាយការណ៍ជាឯកសារ Word ដោយជោគជ័យ!', 'success');
}
