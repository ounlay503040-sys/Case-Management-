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

    if (btnGen) {
        btnGen.addEventListener('click', () => {
            generateReport();
        });
    }

    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnExcel) {
        btnExcel.addEventListener('click', () => {
            exportReportToExcel();
        });
    }
}

/**
 * Generate official administrative report
 */
function generateReport() {
    const type = document.getElementById('report-type')?.value || 'master-list';
    const startDate = document.getElementById('report-start-date')?.value || '';
    const endDate = document.getElementById('report-end-date')?.value || '';
    const statusFilter = document.getElementById('report-filter-status')?.value || 'ALL';

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

    if (placeholder) placeholder.style.display = 'none';
    if (paper) paper.style.display = 'block';
    if (btnPrint) btnPrint.disabled = false;
    if (btnExcel) btnExcel.disabled = false;

    // Populate header info
    const titleEl = document.getElementById('report-header-title');
    const subEl = document.getElementById('report-header-subtitle');
    const genDateEl = document.getElementById('report-generated-date');
    const sigDateEl = document.getElementById('sig-current-date');

    const todayStr = new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'long', day: 'numeric' });
    if (genDateEl) genDateEl.innerText = `កាលបរិច្ឆេទបង្កើត៖ ${todayStr}`;
    if (sigDateEl) sigDateEl.innerText = `រាជធានីភ្នំពេញ, ${todayStr}`;

    let titleText = 'របាយការណ៍បញ្ជីសំណុំរឿងគោល ១ (Master Cases Directory)';
    if (type === 'summary') titleText = 'របាយការណ៍សង្ខេបស្ថិតិ និងលទ្ធផលដោះស្រាយវិវាទ';
    else if (type === 'by-status') titleText = 'របាយការណ៍បែងចែកតាមលទ្ធផលសំណុំរឿង';
    else if (type === 'by-category') titleText = 'របាយការណ៍បែងចែកតាមប្រភេទវិវាទទាំង ៨';

    if (titleEl) titleEl.innerText = titleText;
    
    let subText = `ចំនួនសំណុំរឿងសរុប៖ ${filtered.length} ករណី`;
    if (startDate || endDate) {
        subText += ` | គិតចាប់ពី ${startDate || 'ដើម'} ដល់ ${endDate || 'បច្ចុប្បន្ន'}`;
    }
    if (subEl) subEl.innerText = subText;

    // Render body based on type
    const bodyEl = document.getElementById('report-dynamic-body');
    if (!bodyEl) return;

    if (filtered.length === 0) {
        bodyEl.innerHTML = `<div class="text-center py-4" style="color: #666; font-size: 14pt;">ពុំមានទិន្នន័យសំណុំរឿងស្របតាមលក្ខខណ្ឌចម្រោះឡើយ!</div>`;
        return;
    }

    if (type === 'master-list') {
        bodyEl.innerHTML = renderMasterTableHTML(filtered);
    } else if (type === 'summary') {
        bodyEl.innerHTML = renderSummaryReportHTML(filtered);
    } else if (type === 'by-status') {
        bodyEl.innerHTML = renderByStatusHTML(filtered);
    } else if (type === 'by-category') {
        bodyEl.innerHTML = renderByCategoryHTML(filtered);
    }

    showToast(`បានបង្កើតរបាយការណ៍ដែលមាន ${filtered.length} សំណុំរឿងរួចរាល់!`, 'success');
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
                    <th style="padding: 8px 6px; width: 110px;">មន្ត្រីទទួលបន្ទុក</th>
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
                <td style="padding: 6px; text-align: center; font-size: 9.5pt;">${c.officer}</td>
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
 * EXCEL EXPORT matching Master Table Spreadsheet structure 100%
 */
function exportReportToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('បណ្ណាល័យ SheetJS ពុំត្រូវបានផ្ទុកទេ! សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត។', 'error');
        return;
    }

    const dataToExport = currentReportData.length > 0 ? currentReportData : casesData;
    if (dataToExport.length === 0) {
        showToast('គ្មានទិន្នន័យដើម្បីបញ្ចេញជា Excel ទេ!', 'error');
        return;
    }

    // Map each case object into exact Khmer column headers matching their Excel spreadsheet!
    const excelRows = dataToExport.map((c, index) => ({
        'ល.រ': index + 1,
        'លេខកូដសំណុំរឿង': c.caseNumber,
        'កាលបរិច្ឆេទ': c.dateReceived,
        
        'ឈ្មោះភាគី (ក)': c.partyA_name,
        'ភេទភាគី (ក)': c.partyA_gender,
        'អាយុភាគី (ក)': c.partyA_age,
        'ទូរស័ព្ទភាគី (ក)': c.partyA_phone,
        'ទីតាំងភាគី (ក)': c.partyA_location,

        'ឈ្មោះភាគី (ខ)': c.partyB_name,
        'ភេទភាគី (ខ)': c.partyB_gender,
        'អាយុភាគី (ខ)': c.partyB_age,
        'ទូរស័ព្ទភាគី (ខ)': c.partyB_phone,
        'ទីតាំងភាគី (ខ)': c.partyB_location,

        'ប្រភេទសំណុំរឿង': c.category,
        'ទីតាំងវិវាទ': c.disputeLocation,
        'សេចក្តីសង្ខេបវិវាទ': c.summary,

        'ប្រជុំភាគី (ក)': c.meetingPartyA,
        'ប្រជុំភាគី (ខ)': c.meetingPartyB,
        'ប្រជុំសម្រុះសម្រួល': c.mediationMeeting,

        'មន្ត្រីសម្របសម្រួល': c.officer,
        'លទ្ធផលសំណុំរឿង': c.status,
        'កំណត់ចំណាំ': c.remarks
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    
    // Set auto column widths for neat display in Excel
    const colWidths = [
        { wch: 6 },  // ល.រ
        { wch: 18 }, // លេខកូដ
        { wch: 14 }, // កាលបរិច្ឆេទ
        { wch: 22 }, // ឈ្មោះ ក
        { wch: 10 }, // ភេទ ក
        { wch: 10 }, // អាយុ ក
        { wch: 16 }, // ទូរស័ព្ទ ក
        { wch: 16 }, // ទីតាំង ក
        { wch: 22 }, // ឈ្មោះ ខ
        { wch: 10 }, // ភេទ ខ
        { wch: 10 }, // អាយុ ខ
        { wch: 16 }, // ទូរស័ព្ទ ខ
        { wch: 16 }, // ទីតាំង ខ
        { wch: 22 }, // ប្រភេទវិវាទ
        { wch: 16 }, // ទីតាំងវិវាទ
        { wch: 40 }, // សេចក្តីសង្ខេប
        { wch: 25 }, // ប្រជុំ ក
        { wch: 25 }, // ប្រជុំ ខ
        { wch: 28 }, // ប្រជុំសម្រុះសម្រួល
        { wch: 24 }, // មន្ត្រី
        { wch: 22 }, // លទ្ធផល
        { wch: 16 }  // កំណត់ចំណាំ
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'បញ្ជីសំណុំរឿងគោល ១');

    // Generate Excel file download
    const fileName = `NADR_Master_Case_List_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast(`បានទាញយកឯកសារ Excel (${fileName}) ស្របតាមទម្រង់ដើម ១០០% ដោយជោគជ័យ!`, 'success');
}
