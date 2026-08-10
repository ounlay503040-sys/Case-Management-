/**
 * ==========================================================================
 * NADR - CMS PRO: OFFICIAL LEGAL DOCUMENT GENERATOR (js/docs.js)
 * Generates 5 official Cambodian legal templates with royal header:
 * 1. Invitation Letter (លិខិតកោះអញ្ជើញ)
 * 2. Meeting Report (របាយការណ៍កិច្ចប្រជុំ)
 * 3. Settlement Agreement (កំណត់ហេតុព្រមព្រៀង)
 * 4. Case Analysis Report (របាយការណ៍វិភាគអង្គហេតុ)
 * 5. Case Closure Notice (សេចក្តីជូនដំណឹងបិទសំណុំរឿង)
 * ==========================================================================
 */

let currentDocCaseId = null;

function initDocsEvents() {
    const docTypeSelect = document.getElementById('doc-type-select');
    const btnPreviewDoc = document.getElementById('btn-preview-doc');
    const btnPrintDoc = document.getElementById('btn-print-doc');
    const btnCloseDocModal = document.getElementById('btn-close-doc-modal');
    const docModal = document.getElementById('legal-doc-modal');

    if (btnCloseDocModal) {
        btnCloseDocModal.addEventListener('click', () => {
            if (docModal) docModal.classList.remove('active');
        });
    }

    if (btnPreviewDoc) {
        btnPreviewDoc.addEventListener('click', () => {
            renderDocumentPreview();
        });
    }

    if (docTypeSelect) {
        docTypeSelect.addEventListener('change', () => {
            renderDocumentPreview();
        });
    }

    if (btnPrintDoc) {
        btnPrintDoc.addEventListener('click', () => {
            printLegalDocument();
        });
    }
}

/**
 * Open Legal Document Generator Modal for a specific case
 */
function openLegalDocModal(id) {
    currentDocCaseId = id;
    const docModal = document.getElementById('legal-doc-modal');
    const caseItem = casesData.find(c => c.id === id || c.caseNumber === id);
    
    if (!caseItem) {
        showToast('រកមិនឃើញសំណុំរឿងនេះទេ!', 'error');
        return;
    }

    // Populate modal header subtitle
    const subtitleEl = document.getElementById('doc-modal-case-subtitle');
    if (subtitleEl) {
        subtitleEl.innerHTML = `លេខសំណុំរឿង៖ <b>${caseItem.caseNumber}</b> | ភាគី៖ <b>${caseItem.partyA_name || ''}</b> និង <b>${caseItem.partyB_name || ''}</b>`;
    }

    // Default dates and fields
    const docDateInput = document.getElementById('doc-custom-date');
    const docOfficerInput = document.getElementById('doc-custom-officer');
    const docRoomInput = document.getElementById('doc-custom-room');

    if (docDateInput) docDateInput.value = caseItem.date || getTodayDateString();
    if (docOfficerInput) docOfficerInput.value = localStorage.getItem('nadr_auth_user_name') || 'មន្ត្រីសម្របសម្រួល NADR';
    if (docRoomInput) docRoomInput.value = 'សាលសះជាលេខ ០១ (អគាររដ្ឋបាល NADR)';

    if (docModal) docModal.classList.add('active');
    renderDocumentPreview();
}

/**
 * Render the document HTML preview inside the modal preview pane
 */
function renderDocumentPreview() {
    const caseItem = casesData.find(c => c.id === currentDocCaseId || c.caseNumber === currentDocCaseId);
    if (!caseItem) return;

    const docTypeSelect = document.getElementById('doc-type-select');
    const previewContainer = document.getElementById('doc-preview-pane');
    if (!docTypeSelect || !previewContainer) return;

    const docType = docTypeSelect.value;
    const docDate = document.getElementById('doc-custom-date')?.value || caseItem.date;
    const officerName = document.getElementById('doc-custom-officer')?.value || 'មន្ត្រីសម្របសម្រួល';
    const roomName = document.getElementById('doc-custom-room')?.value || 'សាលសះជា ០១';
    const customNotes = document.getElementById('doc-custom-notes')?.value || caseItem.summary || 'ពុំមានបញ្ជាក់បន្ថែម';

    // Format Cambodian Date string
    const dateObj = new Date(docDate);
    const day = isNaN(dateObj.getDate()) ? '...' : dateObj.getDate();
    const monthNamesKh = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const month = isNaN(dateObj.getMonth()) ? '...' : monthNamesKh[dateObj.getMonth()];
    const year = isNaN(dateObj.getFullYear()) ? '២០២៦' : dateObj.getFullYear();
    const dateKhStr = `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;

    // Common Official Cambodian Government Header
    const govHeader = `
        <div class="official-doc-header" style="text-align: center; margin-bottom: 24px; font-family: 'Khmer OS Muol Light', 'Moul', cursive; color: #000;">
            <h3 style="font-size: 15pt; margin-bottom: 4px; font-weight: normal;">ព្រះរាជាណាចក្រកម្ពុជា</h3>
            <h4 style="font-size: 13pt; margin-bottom: 6px; font-weight: normal;">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
            <div style="width: 100px; border-bottom: 2px solid #000; margin: 0 auto 16px auto;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: left; font-family: 'Inter', 'Khmer OS Battambang', sans-serif; font-size: 10.5pt; line-height: 1.6;">
                <div>
                    <b style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 11pt;">អាជ្ញាធរជាតិដោះស្រាយវិវាទ (NADR)</b><br>
                    អគ្គលេខាធិការដ្ឋាន / ផ្នែករដ្ឋបាលសំណុំរឿង<br>
                    លេខ៖ <b style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; color: #1e3a8a;">${caseItem.caseNumber}</b> / អ.ជ.ដ.វ
                </div>
                <div style="text-align: right;">
                    រាជធានីភ្នំពេញ, ${dateKhStr}
                </div>
            </div>
        </div>
        <hr style="border: 0; border-top: 1.5px solid #000; margin-bottom: 24px;">
    `;

    let contentHtml = '';

    // ---------------------------------------------------------
    // TEMPLATE 1: INVITATION LETTER (លិខិតកោះអញ្ជើញ)
    // ---------------------------------------------------------
    if (docType === 'invitation') {
        contentHtml = `
            ${govHeader}
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 14pt; color: #1e3a8a; margin-bottom: 6px;">លិខិតកោះអញ្ជើញចូលរួមដំណោះស្រាយវិវាទ</h2>
                <span style="font-size: 11pt; font-style: italic;">(លើកទី ១ សម្រាប់ដំណាក់កាលសម្រុះសម្រួលសះជា)</span>
            </div>

            <div style="font-size: 11.5pt; line-height: 2; color: #000; text-align: justify;">
                <p><b>សូមគោរពអញ្ជើញ លោក/លោកស្រី៖</b> <span style="font-size: 12.5pt; font-weight: bold; color: #1e3a8a;">${caseItem.partyB.name}</span> (ភេទ៖ ${caseItem.partyB.gender}, អាយុ៖ ${caseItem.partyB.age || '...'} ឆ្នាំ, ទូរស័ព្ទ៖ ${caseItem.partyB.phone || '0XX XXX XXX'}) ដែលមានអាសយដ្ឋានបច្ចុប្បន្ននៅ៖ ${caseItem.partyB.location || 'រាជធានីភ្នំពេញ'} ជាភាគី <b>"ចុងបណ្តឹង"</b>។</p>
                
                <p style="text-indent: 40px;">កម្មវត្ថុ៖ អញ្ជើញចូលរួមក្នុងកិច្ចប្រជុំសម្រុះសម្រួលដោះស្រាយ<b>${caseItem.category}</b> តាមពាក្យបណ្តឹងរបស់ លោក/លោកស្រី <b>${caseItem.partyA.name}</b> (ដើមបណ្តឹង)។</p>
                
                <p style="text-indent: 40px;">សេចក្តីដូចបានជម្រាបជូនក្នុងកម្មវត្ថុខាងលើ អាជ្ញាធរជាតិដោះស្រាយវិវាទ (NADR) សូមជម្រាបជូន លោក/លោកស្រី មេត្តាជ្រាបថា ស្ថាប័នបានទទួលពាក្យបណ្តឹងចុះកាលបរិច្ឆេទ ${caseItem.date} ដែលមានខ្លឹមសារសង្ខេប៖ <i>«${caseItem.summary || customNotes}»</i>។</p>
                
                <p style="text-indent: 40px;">ដើម្បីឱ្យដំណើរការផ្សះផ្សា និងដោះស្រាយវិវាទនេះប្រព្រឹត្តទៅដោយស្មើភាព យុត្តិធម៌ និងតម្លាភាព សូម លោក/លោកស្រី អញ្ជើញមកដល់ទីស្នាក់ការអាជ្ញាធរជាតិដោះស្រាយវិវាទ នៅ៖</p>
                
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px 20px; border-radius: 8px; margin: 16px 0; font-size: 11pt; line-height: 1.8;">
                    • <b>កាលបរិច្ឆេទ៖</b> ${dateKhStr} វេលាម៉ោង <b>០៨:៣០ នាទីព្រឹក</b><br>
                    • <b>ទីតាំងកិច្ចប្រជុំ៖</b> <b>${roomName}</b><br>
                    • <b>មន្ត្រីសម្របសម្រួលទទួលបន្ទុក៖</b> លោក/លោកស្រី <b>${officerName}</b>
                </div>
                
                <p style="text-indent: 40px; color: #b91c1c;"><b>* បញ្ជាក់៖</b> ពេលអញ្ជើញមក សូមយកមកជាមួយនូវអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ ឯកសារពាក់ព័ន្ធនឹងវិវាទ (ច្បាប់ដើម ឬថតចម្លង) និងភស្តុតាងនានាដើម្បីផ្ទៀងផ្ទាត់។ ការចូលរួមរបស់លោក/លោកស្រី ជាការបង្ហាញនូវឆន្ទៈល្អក្នុងការបញ្ចៀសវិវាទផ្លូវតុលាការ។</p>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11pt;">
                <div style="width: 45%;">
                    <b>បានទទួល និងជ្រាប</b><br>
                    ភាគីចុងបណ្តឹង (ឬអ្នកតំណាង)<br><br><br><br>
                    <b>${caseItem.partyB.name}</b>
                </div>
                <div style="width: 45%;">
                    <b>អគ្គលេខាធិការដ្ឋាន NADR</b><br>
                    មន្ត្រីសម្របសម្រួលកិច្ចការ<br><br><br><br>
                    <b>${officerName}</b>
                </div>
            </div>
        `;
    }
    // ---------------------------------------------------------
    // TEMPLATE 2: MEDIATION MEETING REPORT (របាយការណ៍កិច្ចប្រជុំ)
    // ---------------------------------------------------------
    else if (docType === 'meeting-report') {
        contentHtml = `
            ${govHeader}
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 14pt; color: #1e3a8a; margin-bottom: 6px;">របាយការណ៍កិច្ចប្រជុំសម្រុះសម្រួលវិវាទ</h2>
                <span style="font-size: 11pt;">សំណុំរឿងលេខ៖ <b>${caseItem.caseNumber}</b> | ប្រភេទ៖ <b>${caseItem.category}</b></span>
            </div>

            <div style="font-size: 11.5pt; line-height: 1.9; color: #000;">
                <p>កិច្ចប្រជុំត្រូវបានរៀបចំឡើងនៅ <b>${roomName}</b> នា${dateKhStr} ក្រោមអធិបតីភាព និងការសម្របសម្រួលដោយ លោក/លោកស្រី <b>${officerName}</b> ជាមន្ត្រីជំនាញ NADR។</p>
                
                <h4 style="font-size: 12pt; margin-top: 16px; color: #1e3a8a; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px;">១. សមាសភាពចូលរួមក្នុងកិច្ចប្រជុំ៖</h4>
                <ul style="list-style-type: none; padding-left: 15px; margin-top: 8px;">
                    <li>• <b>ភាគី ក (ដើមបណ្តឹង)៖</b> លោក/លោកស្រី <b>${caseItem.partyA.name}</b> (អាយុ ${caseItem.partyA.age || '...'} ឆ្នាំ, ទូរស័ព្ទ៖ ${caseItem.partyA.phone || '...'})</li>
                    <li>• <b>ភាគី ខ (ចុងបណ្តឹង)៖</b> លោក/លោកស្រី <b>${caseItem.partyB.name}</b> (អាយុ ${caseItem.partyB.age || '...'} ឆ្នាំ, ទូរស័ព្ទ៖ ${caseItem.partyB.phone || '...'})</li>
                    <li>• <b>មន្ត្រីសម្របសម្រួល៖</b> លោក/លោកស្រី <b>${officerName}</b> និងជំនួយការការិយាល័យ។</li>
                </ul>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #1e3a8a; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px;">២. ខ្លឹមសារ និងអង្គហេតុនៃវិវាទ៖</h4>
                <p style="text-indent: 40px; text-align: justify;">${caseItem.summary || customNotes}</p>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #1e3a8a; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px;">៣. វឌ្ឍនភាព និងស្ថានភាពប្រជុំ៖</h4>
                <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 10px 16px; margin: 10px 0;">
                    • <b>ស្ថានភាពប្រជុំភាគី ក៖</b> ${caseItem.partyA.status || 'បានចូលរួមបំភ្លឺ និងផ្តល់ភស្តុតាងរួចរាល់'}<br>
                    • <b>ស្ថានភាពប្រជុំភាគី ខ៖</b> ${caseItem.partyB.status || 'បានចូលរួមបំភ្លឺ និងផ្តល់ភស្តុតាងរួចរាល់'}<br>
                    • <b>កិច្ចប្រជុំរួម (Mediation)៖</b> ${caseItem.mediationStatus || 'បានបើកកិច្ចប្រជុំចរចា និងស្វែងរកចំណុចរួម'}
                </div>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #1e3a8a; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px;">៤. លទ្ធផល និងការសម្រេចចិត្តនៃកិច្ចប្រជុំ៖</h4>
                <p style="text-indent: 40px; font-weight: bold; color: ${caseItem.status.includes('Settle') ? '#15803d' : '#1e3a8a'};">
                    បច្ចុប្បន្ន សំណុំរឿងនេះស្ថិតក្នុងស្ថានភាព៖ «${caseItem.status}» - ${caseItem.remarks || 'កំពុងបន្តនីតិវិធី'}
                </p>
                <p style="text-indent: 40px;">កំណត់សម្គាល់បន្ថែម៖ <i>«${customNotes}»</i></p>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11pt;">
                <div style="width: 30%;">
                    <b>ភាគីដើមបណ្តឹង</b><br><br><br><br>
                    <b>${caseItem.partyA.name}</b>
                </div>
                <div style="width: 30%;">
                    <b>ភាគីចុងបណ្តឹង</b><br><br><br><br>
                    <b>${caseItem.partyB.name}</b>
                </div>
                <div style="width: 30%;">
                    <b>អ្នកធ្វើរបាយការណ៍</b><br><br><br><br>
                    <b>${officerName}</b>
                </div>
            </div>
        `;
    }
    // ---------------------------------------------------------
    // TEMPLATE 3: SETTLEMENT AGREEMENT (កំណត់ហេតុព្រមព្រៀង)
    // ---------------------------------------------------------
    else if (docType === 'settlement') {
        contentHtml = `
            ${govHeader}
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 14pt; color: #15803d; margin-bottom: 6px;">កំណត់ហេតុព្រមព្រៀងសះជា និងបញ្ចប់វិវាទ</h2>
                <span style="font-size: 11pt; font-weight: bold;">(មានតម្លៃគតិយុត្តជាស្ថាពរ និងបិទបញ្ចប់ការតវ៉ា)</span>
            </div>

            <div style="font-size: 11.5pt; line-height: 2; color: #000; text-align: justify;">
                <p>នា${dateKhStr} នៅទីស្នាក់ការអាជ្ញាធរជាតិដោះស្រាយវិវាទ (សាល ${roomName}) យើងខ្ញុំជាភាគីទាំងពីរបានជួបប្រជុំពិភាក្សា និងព្រមព្រៀងគ្នាដោយស្ម័គ្រចិត្ត គ្មានការបង្ខិតបង្ខំ លើសំណុំរឿងវិវាទលេខ៖ <b>${caseItem.caseNumber}</b> ដូចខាងក្រោម៖</p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 18px; border-radius: 8px; margin: 14px 0;">
                    <b>ភាគី ក (ដើមបណ្តឹង)៖</b> លោក/លោកស្រី <b>${caseItem.partyA.name}</b> ភេទ ${caseItem.partyA.gender} អាយុ ${caseItem.partyA.age || '...'} ឆ្នាំ ទូរស័ព្ទ៖ ${caseItem.partyA.phone || '...'}<br>
                    <b>ភាគី ខ (ចុងបណ្តឹង)៖</b> លោក/លោកស្រី <b>${caseItem.partyB.name}</b> ភេទ ${caseItem.partyB.gender} អាយុ ${caseItem.partyB.age || '...'} ឆ្នាំ ទូរស័ព្ទ៖ ${caseItem.partyB.phone || '...'}
                </div>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #15803d;">ប្រការ ១. កម្មវត្ថុនៃការព្រមព្រៀង</h4>
                <p style="text-indent: 40px;">ភាគីទាំងពីរបានយល់ព្រមបញ្ចប់<b>${caseItem.category}</b> នៅទីតាំង៖ ${caseItem.location || 'ភ្នំពេញ'} ដែលមានខ្លឹមសារដើម៖ <i>«${caseItem.summary || 'វិវាទផលប្រយោជន៍ និងសិទ្ធិ'}»</i>។</p>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #15803d;">ប្រការ ២. លក្ខខណ្ឌនៃការសះជា (Settlement Terms)</h4>
                <p style="text-indent: 40px; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 15px; font-weight: 500;">
                    ${customNotes !== 'ពុំមានបញ្ជាក់បន្ថែម' ? customNotes : 'ភាគីទាំងពីរយល់ព្រមអនុវត្តតាមការសម្រុះសម្រួល បង្ហាញសាមគ្គីភាព និងលះបង់ការទាមទារបន្ថែមទាំងឡាយដើម្បីបញ្ចប់បញ្ហាដោយសន្តិវិធី។'}
                </p>

                <h4 style="font-size: 12pt; margin-top: 16px; color: #15803d;">ប្រការ ៣. សុពលភាព និងការអនុវត្ត</h4>
                <p style="text-indent: 40px;">កំណត់ហេតុនេះមានតម្លៃជាកិច្ចសន្យាស្ថាពរ ចាប់ពីថ្ងៃចុះហត្ថលេខានេះតទៅ។ ភាគីទាំងពីរព្រមព្រៀងដកពាក្យបណ្តឹង និងសន្យាមិនប្តឹងផ្តល់គ្នាទៅស្ថាប័ន ឬតុលាការណាមួយទៀតឡើយ លើអង្គហេតុដដែលនេះ។</p>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11pt;">
                <div style="width: 30%;">
                    <b>ភាគី ក (ដើមបណ្តឹង)</b><br>
                    <span style="font-size: 9.5pt; color: #64748b;">(ស្នាមមេដៃស្តាំ / ហត្ថលេខា)</span><br><br><br><br>
                    <b>${caseItem.partyA.name}</b>
                </div>
                <div style="width: 30%;">
                    <b>ភាគី ខ (ចុងបណ្តឹង)</b><br>
                    <span style="font-size: 9.5pt; color: #64748b;">(ស្នាមមេដៃស្តាំ / ហត្ថលេខា)</span><br><br><br><br>
                    <b>${caseItem.partyB.name}</b>
                </div>
                <div style="width: 30%;">
                    <b>មន្ត្រីសម្របសម្រួល NADR</b><br>
                    <span style="font-size: 9.5pt; color: #64748b;">(ហត្ថលេខា និងត្រា)</span><br><br><br><br>
                    <b>${officerName}</b>
                </div>
            </div>
        `;
    }
    // ---------------------------------------------------------
    // TEMPLATE 4: CASE ANALYSIS REPORT (របាយការណ៍វិភាគអង្គហេតុ)
    // ---------------------------------------------------------
    else if (docType === 'analysis') {
        contentHtml = `
            ${govHeader}
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 14pt; color: #4338ca; margin-bottom: 6px;">របាយការណ៍វិភាគ និងវាយតម្លៃអង្គហេតុគតិយុត្ត</h2>
                <span style="font-size: 11pt;">សម្រាប់អគ្គលេខាធិការដ្ឋានពិនិត្យ និងសម្រេច | លេខ៖ <b>${caseItem.caseNumber}</b></span>
            </div>

            <div style="font-size: 11.5pt; line-height: 1.9; color: #000;">
                <p><b>១. សេចក្តីផ្តើម៖</b> សំណុំរឿងលេខ <b>${caseItem.caseNumber}</b> ជាប្រភេទ <b>${caseItem.category}</b> កើតឡើងនៅ <b>${caseItem.location || 'រាជធានីភ្នំពេញ'}</b> ត្រូវបានទទួលចុះបញ្ជីកាលពីថ្ងៃទី ${caseItem.date}។</p>
                
                <p><b>២. ភាគីពាក់ព័ន្ធ៖</b><br>
                • <b>ដើមបណ្តឹង (ក)៖</b> ឈ្មោះ <b>${caseItem.partyA.name}</b> (${caseItem.partyA.gender}, អាយុ ${caseItem.partyA.age || '..'} ឆ្នាំ) - ស្ថានភាពប្រជុំ៖ <i>${caseItem.partyA.status || 'រួចរាល់'}</i><br>
                • <b>ចុងបណ្តឹង (ខ)៖</b> ឈ្មោះ <b>${caseItem.partyB.name}</b> (${caseItem.partyB.gender}, អាយុ ${caseItem.partyB.age || '..'} ឆ្នាំ) - ស្ថានភាពប្រជុំ៖ <i>${caseItem.partyB.status || 'រួចរាល់'}</i></p>
                
                <p><b>៣. ការវិភាគអង្គហេតុ និងចំណុចវិវាទ (Legal Issue Analysis)៖</b><br>
                <span style="display: block; background: #f8fafc; padding: 12px; border-left: 4px solid #4338ca; margin-top: 6px; text-align: justify;">
                    ${caseItem.summary || customNotes}
                </span></p>

                <p><b>៤. វាយតម្លៃកម្រិតលំបាក និងសក្តានុពលសះជា៖</b><br>
                យោងតាមការជួបប្រជុំជាមួយភាគីទាំងសងខាង មន្ត្រីជំនាញវាយតម្លៃថា សំណុំរឿងនេះមានសក្តានុពលកម្រិត៖ <b>${caseItem.status.includes('Settle') ? 'ខ្ពស់ (ងាយស្រួលសះជា)' : 'មធ្យម (ត្រូវការពេលបន្តចរចា)'}</b>។ ភាគីទាំងពីរមានបំណងចង់រក្សាតម្លៃ និងជៀសវាងការខាតបង់ពេលវេលានៅតុលាការ។</p>

                <p><b>៥. សេចក្តីសន្និដ្ឋាន និងសំណូមពរចំណាត់ការ៖</b><br>
                បច្ចុប្បន្នចំណាត់ការស្ថិតនៅ៖ <b>«${caseItem.status}»</b>។ មន្ត្រីជំនាញសូមស្នើបន្តនីតិវិធីផ្សះផ្សាតាមគោលការណ៍ឈ្នះ-ឈ្នះ។</p>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; font-size: 11pt;">
                <div style="width: 40%;">
                    <b>មន្ត្រីវិភាគ និងវាយតម្លៃសំណុំរឿង</b><br>
                    ការិយាល័យបច្ចេកទេស និងច្បាប់ NADR<br><br><br><br>
                    <b>${officerName}</b>
                </div>
            </div>
        `;
    }
    // ---------------------------------------------------------
    // TEMPLATE 5: CASE CLOSURE NOTICE (សេចក្តីជូនដំណឹងបិទសំណុំរឿង)
    // ---------------------------------------------------------
    else if (docType === 'closure') {
        contentHtml = `
            ${govHeader}
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="font-family: 'Khmer OS Muol Light', 'Moul', cursive; font-size: 14pt; color: #dc2626; margin-bottom: 6px;">សេចក្តីជូនដំណឹងបិទបញ្ចប់ចំណាត់ការសំណុំរឿង</h2>
                <span style="font-size: 11pt; font-weight: bold;">(Official Case Closure Notice)</span>
            </div>

            <div style="font-size: 11.5pt; line-height: 2; color: #000; text-align: justify;">
                <p><b>អគ្គលេខាធិការដ្ឋាននៃអាជ្ញាធរជាតិដោះស្រាយវិវាទ (NADR) សូមជម្រាបជូន លោក/លោកស្រី ជាភាគីទាំងពីរ៖</b></p>
                
                <ul style="list-style-type: none; padding-left: 20px;">
                    <li>• <b>លោក/លោកស្រី ${caseItem.partyA.name}</b> (ដើមបណ្តឹង)</li>
                    <li>• <b>លោក/លោកស្រី ${caseItem.partyB.name}</b> (ចុងបណ្តឹង)</li>
                </ul>

                <p style="text-indent: 40px;">កម្មវត្ថុ៖ ការប្រកាសបិទបញ្ចប់ជាស្ថាពរនូវចំណាត់ការលើសំណុំរឿងលេខ៖ <b>${caseItem.caseNumber}</b> ដែលជាប្រភេទ <b>${caseItem.category}</b>។</p>
                
                <p style="text-indent: 40px;">តបតាមកម្មវត្ថុខាងលើ ស្ថាប័នសូមបញ្ជាក់ថា ក្រោយពីបានអនុវត្តនីតិវិធីសម្រុះសម្រួល និងពិនិត្យយ៉ាងយកចិត្តទុកដាក់រួចមក សំណុំរឿងនេះត្រូវបានសម្រេច <b>បិទបញ្ចប់ជាស្ថាពរ (Closed Case)</b> ចាប់ពីថ្ងៃចុះកាលបរិច្ឆេទនេះតទៅ ដោយមូលហេតុ៖</p>
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 14px 20px; border-radius: 8px; margin: 16px 0; font-size: 11.5pt; font-weight: bold; color: #b91c1c; text-align: center;">
                    « លទ្ធផលស្ថាពរ៖ ${caseItem.status} - ${caseItem.remarks || 'បានបញ្ចប់នីតិវិធីផ្លូវការ'} »
                </div>
                
                <p style="text-indent: 40px;">អាស្រ័យហេតុនេះ សូមលោក/លោកស្រី ជាភាគីទាំងពីរ មេត្តាជ្រាបជាព័ត៌មាន និងគោរពអនុវត្តតាមលទ្ធផល ឬកិច្ចព្រមព្រៀងដែលបានសម្រេចដោយស្មារតីទទួលខុសត្រូវខ្ពស់។</p>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 11pt;">
                <div style="width: 45%;">
                    <b>ភាគីដើមបណ្តឹង / ចុងបណ្តឹង</b><br>
                    <span style="font-size: 9.5pt; color: #64748b;">(ទទួលដឹងឮ)</span><br><br><br><br>
                    <b>${caseItem.partyA.name} & ${caseItem.partyB.name}</b>
                </div>
                <div style="width: 45%;">
                    <b>ជំនួសមុខអគ្គលេខាធិការ NADR</b><br>
                    ប្រធានការិយាល័យរដ្ឋបាលសំណុំរឿង<br><br><br><br>
                    <b>${officerName}</b>
                </div>
            </div>
        `;
    }

    previewContainer.innerHTML = contentHtml;
}

/**
 * Print or Save PDF using browser print engine
 */
function printLegalDocument() {
    const previewContainer = document.getElementById('doc-preview-pane');
    const printArea = document.getElementById('print-area');
    if (!previewContainer || !printArea) return;

    printArea.innerHTML = `
        <div style="padding: 30px; font-family: 'Inter', 'Khmer OS Battambang', sans-serif; color: #000;">
            ${previewContainer.innerHTML}
        </div>
    `;

    window.print();
}
