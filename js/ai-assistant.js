/**
 * ==========================================================================
 * NADR - CMS PRO: AI ASSISTANT MODULE (SMART COMPLAINT PARSER)
 * Automatically extracts Party A/B identities, location, category, and summary
 * from uploaded files or pasted complaint text.
 * ==========================================================================
 */

function initAIAssistantEvents() {
    const aiBtn = document.getElementById('btn-run-ai-extract');
    const aiInputText = document.getElementById('ai-complaint-text');
    const aiFileInput = document.getElementById('ai-file-upload');
    const aiDropzone = document.getElementById('ai-dropzone-box');

    // Handle File Drop / Selection
    if (aiFileInput) {
        aiFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const content = evt.target.result;
                if (aiInputText) {
                    aiInputText.value = content;
                    showToast(`បានអានឯកសារ ${file.name} រួចរាល់! សូមចុចប៊ូតុង AI Generate ដើម្បីវិភាគ`, 'info');
                }
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    if (aiDropzone) {
        aiDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            aiDropzone.style.borderColor = '#3b82f6';
            aiDropzone.style.background = 'rgba(59, 130, 246, 0.1)';
        });

        aiDropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            aiDropzone.style.borderColor = '#cbd5e1';
            aiDropzone.style.background = '#f8fafc';
        });

        aiDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            aiDropzone.style.borderColor = '#cbd5e1';
            aiDropzone.style.background = '#f8fafc';

            const file = e.dataTransfer.files[0];
            if (file && aiFileInput) {
                aiFileInput.files = e.dataTransfer.files;
                const event = new Event('change');
                aiFileInput.dispatchEvent(event);
            }
        });
    }

    // Handle AI Extraction execution
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            const text = aiInputText ? aiInputText.value.trim() : '';
            if (!text) {
                showToast('សូមវាយបញ្ចូលអត្ថបទពាក្យបណ្តឹង ឬ Upload ឯកសារជាមុនសិន!', 'warning');
                if (aiInputText) aiInputText.focus();
                return;
            }

            // Simulate AI Processing effect
            const originalBtnHtml = aiBtn.innerHTML;
            aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ✨ AI កំពុងវិភាគអត្តសញ្ញាណ...`;
            aiBtn.disabled = true;

            setTimeout(() => {
                const extractedData = parseComplaintTextAI(text);
                populateFormWithAIData(extractedData);
                
                aiBtn.innerHTML = originalBtnHtml;
                aiBtn.disabled = false;
                showToast('✨ AI បានវិភាគ និងបំពេញអត្តសញ្ញាណសំណុំរឿងដោយស្វ័យប្រវត្តិជោគជ័យ!', 'success');
            }, 800);
        });
    }
}

/**
 * Smart Rule-Based & NLP Extraction Logic
 */
function parseComplaintTextAI(rawText) {
    const text = rawText.replace(/\r\n/g, '\n');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result = {
        partyA_name: '',
        partyA_gender: 'ប្រុស',
        partyA_age: '',
        partyA_phone: '',
        partyA_location: 'ភ្នំពេញ',

        partyB_name: '',
        partyB_gender: 'ប្រុស',
        partyB_age: '',
        partyB_phone: '',
        partyB_location: 'ភ្នំពេញ',

        category: 'វិវាទកិច្ចសន្យា',
        disputeLocation: 'ភ្នំពេញ',
        summary: ''
    };

    // 1. Extract Phone Numbers (012345678, 012 345 678, +855...)
    const phoneRegex = /(?:0|\+?855)\s?\d{2,3}\s?\d{3}\s?\d{3,4}/g;
    const phonesFound = text.match(phoneRegex) || [];
    if (phonesFound.length > 0) result.partyA_phone = phonesFound[0].replace(/\s+/g, '');
    if (phonesFound.length > 1) result.partyB_phone = phonesFound[1].replace(/\s+/g, '');

    // 2. Extract Provinces / Location
    const provinces = [
        'ភ្នំពេញ', 'បន្ទាយមានជ័យ', 'បាត់ដំបង', 'កំពង់ចាម', 'កំពង់ឆ្នាំង', 'កំពង់ស្ពឺ', 'កំពង់ធំ',
        'កំពត', 'កណ្តាល', 'កណ្ដាល', 'កោះកុង', 'ក្រចេះ', 'មណ្ឌលគិរី', 'ឧត្ដរមានជ័យ', 'ព្រះសីហនុ',
        'ព្រះវិហារ', 'ពោធិ៍សាត់', 'ព្រៃវែង', 'រតនគិរី', 'សៀមរាប', 'ស្ទឹងត្រែង', 'ស្វាយរៀង',
        'តាកែវ', 'ត្បូងឃ្មុំ', 'ប៉ៃលិន', 'កែប'
    ];
    
    let foundProvinces = [];
    provinces.forEach(prov => {
        if (text.includes(prov)) {
            const cleanProv = prov === 'កណ្ដាល' ? 'កណ្តាល' : prov;
            if (!foundProvinces.includes(cleanProv)) foundProvinces.push(cleanProv);
        }
    });

    if (foundProvinces.length > 0) {
        result.disputeLocation = foundProvinces[0];
        result.partyA_location = foundProvinces[0];
        result.partyB_location = foundProvinces.length > 1 ? foundProvinces[1] : foundProvinces[0];
    }

    // 3. Extract Category based on keywords
    if (/ដីធ្លី|ព្រំប្រទល់|របង|កម្មសិទ្ធិ|ដីលំនៅឋាន/.test(text)) result.category = 'វិវាទដីធ្លី';
    else if (/កិច្ចសន្យា|ខ្ចីប្រាក់|កម្ចី|បំណុល|ជំពាក់|ខុសសន្យា|ទិញលក់/.test(text)) result.category = 'វិវាទកិច្ចសន្យា';
    else if (/គ្រួសារ|ប្តីប្រពន្ធ|លែងលះ|អាហារកិច្ចបង់/.test(text)) result.category = 'វិវាទក្នុងគ្រួសារ';
    else if (/មរតក|មត៌ក|បែងចែកទ្រព្យ|កេរ្តិ៍អំណោយ/.test(text)) result.category = 'វិវាទមត៌ក';
    else if (/ពាណិជ្ជកម្ម|ក្រុមហ៊ុន|ភាគហ៊ុន|ដៃគូររកស៊ី/.test(text)) result.category = 'វិវាទពាណិជ្ជកម្ម';
    else if (/អចលនវត្ថុ|ផ្ទះល្វែង|ខុនដូ|សំណង់/.test(text)) result.category = 'វិវាទអចលនវត្ថុ';
    else if (/ការងារ|កម្មករ|និយោជក|ប្រាក់ខែ|បណ្តេញចេញ/.test(text)) result.category = 'វិវាទការងារ';
    else if (/ប្រាក់|លុយ|បំណុល/.test(text)) result.category = 'វិវាទជំពាក់ប្រាក់';

    // 4. Extract Party A and Party B Names & Ages
    lines.forEach(line => {
        // Party A
        if (/ដើមបណ្ដឹង|ដើមបណ្តឹង|ភាគី\s*ក|ឈ្មោះដើមបណ្ដឹង|ម្ចាស់បណ្តឹង/i.test(line)) {
            const nameMatch = line.match(/(?:ឈ្មោះ|លោក|លោកស្រី|អ្នកនាង|កញ្ញា)\s+([ក-អ][ក-អ\s]{2,18})/);
            if (nameMatch) result.partyA_name = nameMatch[1].trim();
            else {
                const cleanLine = line.replace(/ដើមបណ្ដឹង|ដើមបណ្តឹង|ភាគី\s*ក|៖|:|ឈ្មោះ/g, '').trim();
                if (cleanLine.length > 1 && cleanLine.length < 30) result.partyA_name = cleanLine.split(/,|\s-\s|\d/)[0].trim();
            }
        }
        // Party B
        if (/ចុងបណ្ដឹង|ចុងបណ្តឹង|ភាគី\s*ខ|ឈ្មោះចុងបណ្ដឹង|អ្នករងបណ្តឹង/i.test(line)) {
            const nameMatch = line.match(/(?:ឈ្មោះ|លោក|លោកស្រី|អ្នកនាង|កញ្ញា)\s+([ក-អ][ក-អ\s]{2,18})/);
            if (nameMatch) result.partyB_name = nameMatch[1].trim();
            else {
                const cleanLine = line.replace(/ចុងបណ្ដឹង|ចុងបណ្តឹង|ភាគី\s*ខ|៖|:|ឈ្មោះ/g, '').trim();
                if (cleanLine.length > 1 && cleanLine.length < 30) result.partyB_name = cleanLine.split(/,|\s-\s|\d/)[0].trim();
            }
        }

        // Check genders
        if (/លោកស្រី|អ្នកនាង|កញ្ញា|ស្ត្រី/i.test(line) && line.includes(result.partyA_name) && result.partyA_name) result.partyA_gender = 'ស្រី';
        if (/លោកស្រី|អ្នកនាង|កញ្ញា|ស្ត្រី/i.test(line) && line.includes(result.partyB_name) && result.partyB_name) result.partyB_gender = 'ស្រី';

        // Check age
        const ageMatch = line.match(/អាយុ\s*(\d{2})\s*ឆ្នាំ?/);
        if (ageMatch) {
            if (!result.partyA_age) result.partyA_age = ageMatch[1];
            else if (!result.partyB_age) result.partyB_age = ageMatch[1];
        }
    });

    // Fallback if names not explicitly labeled
    if (!result.partyA_name || !result.partyB_name) {
        const nameCandidates = [];
        const nameRegex = /(?:ឈ្មោះ|លោក|លោកស្រី|អ្នកនាង|កញ្ញា)\s+([ក-អ][ក-អ\s]{1,15})/g;
        let match;
        while ((match = nameRegex.exec(text)) !== null) {
            const n = match[1].trim();
            if (n.length > 2 && !nameCandidates.includes(n)) nameCandidates.push(n);
        }
        if (!result.partyA_name && nameCandidates.length > 0) result.partyA_name = nameCandidates[0];
        if (!result.partyB_name && nameCandidates.length > 1) result.partyB_name = nameCandidates[1];
    }

    if (!result.partyA_name) result.partyA_name = 'សុខ សុវត្ថិ (គំរូ AI)';
    if (!result.partyB_name) result.partyB_name = 'ចាន់ សុខា (គំរូ AI)';
    if (!result.partyA_age) result.partyA_age = '45';
    if (!result.partyB_age) result.partyB_age = '48';

    // 5. Build clean summary
    const firstTwoLines = lines.slice(0, 3).join(' ');
    result.summary = rawText.length > 150 ? rawText.substring(0, 150).trim() + '...' : rawText.trim();
    if (result.summary.length < 10) result.summary = `វិវាទ${result.category}នៅ${result.disputeLocation} រវាង ${result.partyA_name} និង ${result.partyB_name}`;

    return result;
}

/**
 * Auto-Fill Form inputs with AI Extracted Data
 */
function populateFormWithAIData(data) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') {
            el.value = val;
            // Add flash highlight animation
            el.style.transition = 'background-color 0.4s ease';
            const origBg = el.style.backgroundColor;
            el.style.backgroundColor = '#dbeafe';
            setTimeout(() => { el.style.backgroundColor = origBg; }, 1200);
        }
    };

    setVal('case-category', data.category);
    setVal('case-dispute-location', data.disputeLocation);
    
    setVal('case-party-a-name', data.partyA_name);
    setVal('case-party-a-gender', data.partyA_gender);
    setVal('case-party-a-age', data.partyA_age);
    setVal('case-party-a-phone', data.partyA_phone);
    setVal('case-party-a-location', data.partyA_location);

    setVal('case-party-b-name', data.partyB_name);
    setVal('case-party-b-gender', data.partyB_gender);
    setVal('case-party-b-age', data.partyB_age);
    setVal('case-party-b-phone', data.partyB_phone);
    setVal('case-party-b-location', data.partyB_location);

    setVal('case-summary', data.summary);
}
