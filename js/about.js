/* ==========================================================================
   NADR CMS Pro — "អំពីកម្មវិធី និងការណែនាំ" page
   App information plus short how-to guides for the main features.
   ========================================================================== */
(function () {
    'use strict';
    const GUIDES = [
        { icon: 'fa-key', title: 'ការចូលប្រើ និងពាក្យសម្ងាត់', steps: [
            'កម្មវិធីនេះសម្រាប់មន្ត្រីម្នាក់ប្រើ។ ពេលបើក គ្រាន់តែវាយពាក្យសម្ងាត់ ហើយចុច «ចូលប្រព័ន្ធ»។',
            'ការប្រើលើកដំបូង កម្មវិធីនឹងសុំឈ្មោះ ម.ស.វ. និងឱ្យកំណត់ពាក្យសម្ងាត់ (យ៉ាងតិច ៤ តួ)។',
            'ដើម្បីប្តូរពាក្យសម្ងាត់ ឬឈ្មោះ៖ ចុចលើកាតឈ្មោះនៅខាងក្រោមមីនុយ ដើម្បីបើកទំព័រ «គណនីរបស់ខ្ញុំ»។',
            'ប៊ូតុង 🔒 នៅក្បែរឈ្មោះ សម្រាប់ចាក់សោកម្មវិធីពេលចាកចេញពីកុំព្យូទ័រ។'
        ] },
        { icon: 'fa-folder-plus', title: 'បញ្ចូលសំណុំរឿងថ្មី', steps: [
            'ចុចមីនុយ «បញ្ចូលសំណុំរឿងថ្មី» ឬប៊ូតុង ➕ ពណ៌មាស នៅទំព័របញ្ជីសំណុំរឿង។',
            'បំពេញតាម ៤ ជំហាន៖ ព័ត៌មានទូទៅ → ភាគីវិវាទ → អង្គហេតុ & ឯកសារ → ចំណាត់ការ & លទ្ធផល។ ចុច «បន្ទាប់» ដើម្បីទៅជំហានបន្ទាប់។',
            'បើមិនទាន់មានព័ត៌មានគ្រប់ ចុច «រក្សាទុកជាព្រាង» ហើយមកបំពេញបន្តពេលក្រោយ។',
            'នៅជំហានចុងក្រោយ ចុច «បង្កើតសំណុំរឿង» ដើម្បីរក្សាទុក។'
        ] },
        { icon: 'fa-table-list', title: 'បញ្ជីសំណុំរឿង និងព័ត៌មានលម្អិត', steps: [
            'ប្រើប្រអប់ស្វែងរក និងតម្រង (ស្ថានភាព ប្រភេទវិវាទ ខេត្ត) ដើម្បីរកសំណុំរឿងបានលឿន។',
            'ចុចពីរដងលើជួរណាមួយ ដើម្បីបើកព័ត៌មានលម្អិតសំណុំរឿង។',
            'ប៊ូតុងខាងក្រោមទំព័រសំណុំរឿង៖ 🖨 បោះពុម្ព, Telegram, 📄 បង្កើតលិខិត, ចម្លង, 🗑 លុប និង ✏ កែសម្រួល។ ដាក់កណ្តុរលើប៊ូតុង ដើម្បីមើលឈ្មោះ។'
        ] },
        { icon: 'fa-file-word', title: 'បង្កើតលិខិតពីគម្រូ Word', steps: [
            'ជាមុន ទៅ «ការកំណត់ → ព័ត៌មានសម្រាប់លិខិត» បំពេញឈ្មោះ ភេទ លេខទូរស័ព្ទ ម.ស.វ. ហើយចុចរក្សាទុក។',
            'បើកសំណុំរឿង ហើយរំកិលចុះដល់ផ្នែក «លិខិត»។ ចុចលិខិតដែលចង់បាន បំពេញថ្ងៃ ម៉ោង ហើយចុចបង្កើត។',
            'លើកដំបូង កម្មវិធីនឹងសុំឱ្យជ្រើស Folder សំណុំរឿង។ លិខិតនឹងរក្សាទុកក្នុង Folder រងតាមដំណាក់កាល (1-ត្រៀម, 2-ប្រជុំដោះស្រាយ, 3-ក្រោយការប្រជុំ) ហើយបើកក្នុង Word ដើម្បីពិនិត្យមុនបោះពុម្ព។',
            'កម្មវិធីមិនសរសេរជាន់លើលិខិតចាស់ទេ — វាបន្ថែម (2), (3) ទៅឈ្មោះ File។',
            'បើខ្វះព័ត៌មាន កម្មវិធីនឹងប្រាប់ជាភាសាខ្មែរ៖ ចុច «បំពេញឥឡូវ» ឬ «បង្កើតដោយទុកចន្លោះទទេ»។'
        ] },
        { icon: 'fa-calendar-days', title: 'កាលវិភាគប្រជុំ', steps: [
            'បង្ហាញកិច្ចប្រជុំទាំងអស់តាមប្រតិទិនប្រចាំខែ។ ប្រើ «ខែមុន / ខែបន្ទាប់» ដើម្បីប្តូរខែ។',
            'ចុចលើកិច្ចប្រជុំក្នុងប្រតិទិន ដើម្បីមើលព័ត៌មានលម្អិតនៃកិច្ចប្រជុំនោះ។'
        ] },
        { icon: 'fa-file-invoice', title: 'របាយការណ៍', steps: [
            'ជ្រើសប្រភេទរបាយការណ៍ ខែ/ឆ្នាំ និងលទ្ធផល — របាយការណ៍នឹងបង្កើតខ្លួនឯងភ្លាម។',
            'ប៊ូតុងលើក្បាលទំព័រ៖ PDF (ក្រហម), Word (ខៀវ), Excel (បៃតង) និង Telegram។'
        ] },
        { icon: 'fa-database', title: 'ទិន្នន័យ និងការបម្រុងទុក (Backup)', steps: [
            'ទិន្នន័យទាំងអស់រក្សាទុកក្នុងកុំព្យូទ័រនេះ មិនបញ្ជូនទៅណាទេ។',
            'សូមចុច «ទាញយក Backup សរុប» ជាប្រចាំ (យ៉ាងហោចណាស់ម្តងក្នុងមួយសប្តាហ៍) ហើយរក្សាទុក File នោះក្នុង USB ឬ Drive។',
            'ដើម្បីស្តារទិន្នន័យវិញ ប្រើប៊ូតុង «ស្ដារទិន្នន័យពី Backup (.json)»។',
            'មុនដំឡើងកំណែថ្មីនៃកម្មវិធី សូមធ្វើ Backup ជាមុនសិន។'
        ] },
        { icon: 'fa-magnifying-glass-plus', title: 'ទំហំអក្សរ ពេញអេក្រង់ និងពណ៌ងងឹត', steps: [
            'គ្រប់ទំព័រមានប៊ូតុង − ៨០% + នៅលើក្បាលទំព័រ៖ ចុច + ដើម្បីពង្រីកអក្សរ ចុច − ដើម្បីបង្រួម ចុចលើលេខភាគរយ ដើម្បីត្រឡប់ ១០០%។',
            'ប៊ូតុង ⛶ ពង្រីកផ្ទាំងនោះពេញអេក្រង់។ ចុចម្តងទៀត ឬចុច Esc ដើម្បីត្រឡប់។',
            'ប៊ូតុង 🌙 នៅលើរបារខាងលើ សម្រាប់ប្តូរពណ៌ភ្លឺ / ងងឹត។',
            'ប៊ូតុង 🔴 🟡 🟢 នៅជ្រុងខាងលើស្តាំ៖ បិទ, បង្រួមចុះ, ពង្រីកបង្អួច។'
        ] }
    ];

    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function render() {
        const body = document.getElementById('about-body');
        if (!body || body.__done) return;
        body.__done = true;
        body.innerHTML = `
            <div class="ab-hero">
                <img src="images/nadr-logo-round.webp" alt="">
                <div>
                    <div class="ab-name">កម្មវិធីគ្រប់គ្រងសំណុំរឿង ម.ស.វ.</div>
                    <div class="ab-app">NADR CMS PRO</div>
                    <div class="ab-org">អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ (អ.ដ.ក.)</div>
                </div>
            </div>
            <div class="ab-facts">
                <div class="ab-fact"><i class="fa-solid fa-code-branch"></i><span>កំណែ</span><b id="ab-version">—</b></div>
                <div class="ab-fact"><i class="fa-solid fa-user-gear"></i><span>អភិវឌ្ឍន៍ដោយ</span><b>លោក ឡាយ អូន</b></div>
                <div class="ab-fact"><i class="fa-solid fa-hard-drive"></i><span>ទីតាំងទិន្នន័យ</span><b>រក្សាទុកក្នុងកុំព្យូទ័រនេះ</b></div>
                <div class="ab-fact"><i class="fa-solid fa-box-archive"></i><span>Folder Backup ស្វ័យប្រវត្តិ</span><b id="ab-backup">—</b></div>
            </div>
            <p class="ab-intro">កម្មវិធីនេះជួយ ម.ស.វ. គ្រប់គ្រងសំណុំរឿងដោះស្រាយវិវាទ៖ ចុះបញ្ជីសំណុំរឿង តាមដានកិច្ចប្រជុំ បង្កើតលិខិតពីគម្រូ Word ផ្លូវការ និងចេញរបាយការណ៍ប្រចាំខែ។ ចុចលើប្រធានបទខាងក្រោម ដើម្បីមើលរបៀបប្រើ។</p>
            <div class="ab-guides">
                ${GUIDES.map((g, i) => `
                <details class="ab-guide"${i === 0 ? ' open' : ''}>
                    <summary><span class="ab-gi"><i class="fa-solid ${g.icon}"></i></span><span class="ab-gt">${esc(g.title)}</span><i class="fa-solid fa-chevron-down ab-chev"></i></summary>
                    <ol>${g.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
                </details>`).join('')}
            </div>
            <p class="ab-copy"><i class="fa-regular fa-copyright"></i> រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៦</p>`;
        const api = window.electronAPI || {};
        const kh = s => String(s).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[d]);
        if (api.getAppVersion) api.getAppVersion().then(v => { const e = document.getElementById('ab-version'); if (e) e.textContent = kh(v); }).catch(() => {});
        if (api.getBackupFolder) api.getBackupFolder().then(p => { const e = document.getElementById('ab-backup'); if (e) e.textContent = p; }).catch(() => {});
    }

    document.addEventListener('click', e => {
        const nav = e.target.closest && e.target.closest('.nav-item[data-view="about-view"]');
        if (nav) setTimeout(render, 0);
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
