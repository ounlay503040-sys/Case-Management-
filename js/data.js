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
const STORAGE_KEY = 'nadr_master_cases_data_v2';

// 8. ទិន្នន័យគំរូសំណុំរឿងគោល NADR ចំនួន ១០ ករណី (Mock Data matching Master Excel)
const mockCasesData = [
    {
        id: 'case-nadr-001',
        caseNumber: 'NADR-2026-001',
        dateReceived: '2026-07-25',
        partyA_name: 'សុខ ចាន់ដារ៉ា',
        partyA_gender: 'ប្រុស',
        partyA_age: 45,
        partyA_phone: '012 345 678',
        partyA_location: 'ភ្នំពេញ',
        partyB_name: 'ម៉ៅ សារ៉ាត់',
        partyB_gender: 'ប្រុស',
        partyB_age: 48,
        partyB_phone: '098 765 432',
        partyB_location: 'ភ្នំពេញ',
        category: 'វិវាទដីធ្លី',
        disputeLocation: 'ភ្នំពេញ',
        summary: 'វិវាទព្រំប្រទល់ដីឡូតិ៍ទំហំ ៥ម៉ែត្រ x ២០ម៉ែត្រ នៅសង្កាត់ទួលសង្កែ ខណ្ឌឫស្សីកែវ ដោយភាគី ខ បានសាងសង់របងរំលោភចូលដីភាគី ក អស់ ០.៥ ម៉ែត្រ។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
        status: 'Settle (ព្រមព្រៀង)',
        officer: 'ឯកឧត្តម បណ្ឌិត សុខ សុវណ្ណ',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-07-25',
        updatedAt: '2026-07-25'
    },
    {
        id: 'case-nadr-002',
        caseNumber: 'NADR-2026-002',
        dateReceived: '2026-07-20',
        partyA_name: 'កែវ សុជាតា',
        partyA_gender: 'ស្រី',
        partyA_age: 38,
        partyA_phone: '092 111 222',
        partyA_location: 'បាត់ដំបង',
        partyB_name: 'ចាន់ ប៊ុនធឿន',
        partyB_gender: 'ប្រុស',
        partyB_age: 42,
        partyB_phone: '016 333 444',
        partyB_location: 'បាត់ដំបង',
        category: 'វិវាទជំពាក់ប្រាក់',
        disputeLocation: 'បាត់ដំបង',
        summary: 'វិវាទបំណុលប្រាក់កម្ចីចំនួន ១៥,០០០ ដុល្លារអាមេរិក ដោយគ្មានការប្រាក់ សម្រាប់ធ្វើដើមទុនរកស៊ី ប៉ុន្តែដល់កំណត់ ៣ ឆ្នាំហើយ ភាគី ខ ពុំទាន់បានសងប្រាក់ត្រឡប់មកវិញ។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)',
        status: 'Active (កំពុងសម្រុះសម្រួល)',
        officer: 'លោកជំទាវ ចាន់ សុជាតា',
        remarks: 'មិនទាន់បិទ',
        createdAt: '2026-07-20',
        updatedAt: '2026-07-24'
    },
    {
        id: 'case-nadr-003',
        caseNumber: 'NADR-2026-003',
        dateReceived: '2026-07-15',
        partyA_name: 'ហេង វិសាល',
        partyA_gender: 'ប្រុស',
        partyA_age: 52,
        partyA_phone: '077 888 999',
        partyA_location: 'សៀមរាប',
        partyB_name: 'ក្រុមហ៊ុន អប្សរា ខនស្ត្រាក់សិន',
        partyB_gender: 'ប្រុស',
        partyB_age: 40,
        partyB_phone: '012 555 666',
        partyB_location: 'ភ្នំពេញ',
        category: 'វិវាទកិច្ចសន្យា',
        disputeLocation: 'សៀមរាប',
        summary: 'វិវាទលើការអនុវត្តកិច្ចសន្យាសាងសង់សណ្ឋាគារ ដោយក្រុមហ៊ុនទទួលម៉ៅការ (ភាគី ខ) ធ្វើការយឺតយ៉ាវជាងកាលវិភាគកំណត់ ៦ ខែ និងខុសបច្ចេកទេសមួយចំនួន។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'ភាគីមិនចូលរួម',
        mediationMeeting: 'មិនទាន់ប្រជុំ',
        status: 'Active (កំពុងសម្រុះសម្រួល)',
        officer: 'លោក មាស វិបុល',
        remarks: 'មិនទាន់បិទ',
        createdAt: '2026-07-15',
        updatedAt: '2026-07-22'
    },
    {
        id: 'case-nadr-004',
        caseNumber: 'NADR-2026-004',
        dateReceived: '2026-07-10',
        partyA_name: 'អ៊ុំ សុគន្ធា',
        partyA_gender: 'ស្រី',
        partyA_age: 60,
        partyA_phone: '015 777 888',
        partyA_location: 'កណ្ដាល',
        partyB_name: 'អ៊ុំ សារឹម',
        partyB_gender: 'ប្រុស',
        partyB_age: 55,
        partyB_phone: '088 999 0000',
        partyB_location: 'កណ្ដាល',
        category: 'វិវាទមត៌ក',
        disputeLocation: 'កណ្ដាល',
        summary: 'វិវាទទាមទារបែងចែកដីមរតកពីឪពុកម្តាយទំហំ ២ ហិកតា នៅស្រុកកណ្តាលស្ទឹង រវាងបងប្អូនបង្កើតទាំង ២ នាក់ ដោយភាគី ខ កាន់កាប់ដីទាំងមូលតែម្នាក់ឯង។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
        status: 'Settle (ព្រមព្រៀង)',
        officer: 'ឯកឧត្តម បណ្ឌិត សុខ សុវណ្ណ',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-07-10',
        updatedAt: '2026-07-18'
    },
    {
        id: 'case-nadr-005',
        caseNumber: 'NADR-2026-005',
        dateReceived: '2026-07-05',
        partyA_name: 'លី ប៊ុនថៃ',
        partyA_gender: 'ប្រុស',
        partyA_age: 35,
        partyA_phone: '010 123 456',
        partyA_location: 'ព្រះសីហនុ',
        partyB_name: 'តាំង គីមស្រ៊ុន',
        partyB_gender: 'ប្រុស',
        partyB_age: 39,
        partyB_phone: '086 654 321',
        partyB_location: 'ព្រះសីហនុ',
        category: 'វិវាទពាណិជ្ជកម្ម',
        disputeLocation: 'ព្រះសីហនុ',
        summary: 'វិវាទក្នុងការបែងចែកភាគលាភ និងការដកខ្លួនចេញពីភាគហ៊ុនក្រុមហ៊ុននាំចូលគ្រឿងសមុទ្រ ដោយភាគី ខ មិនព្រមទូទាត់ប្រាក់ដើម និងភាគលាភជូនភាគី ក។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)',
        status: 'Close (បិទ)',
        officer: 'លោកជំទាវ ចាន់ សុជាតា',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-07-05',
        updatedAt: '2026-07-16'
    },
    {
        id: 'case-nadr-006',
        caseNumber: 'NADR-2026-006',
        dateReceived: '2026-06-28',
        partyA_name: 'ព្រំ សុខា',
        partyA_gender: 'ប្រុស',
        partyA_age: 41,
        partyA_phone: '093 222 333',
        partyA_location: 'កំពង់ចាម',
        partyB_name: 'រោងចក្រ ហ្គាម៉ិន តិច',
        partyB_gender: 'ប្រុស',
        partyB_age: 50,
        partyB_phone: '023 444 555',
        partyB_location: 'កំពង់ចាម',
        category: 'វិវាទការងារ',
        disputeLocation: 'កំពង់ចាម',
        summary: 'វិវាទទាមទារប្រាក់បំណាច់អតីតភាពការងារ និងប្រាក់សំណងជំងឺចិត្ត ករណីថៅកែរោងចក្របញ្ឈប់ពីការងារដោយគ្មានកំហុស និងគ្មានការជូនដំណឹងជាមុន។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
        status: 'Settle (ព្រមព្រៀង)',
        officer: 'លោក មាស វិបុល',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-06-28',
        updatedAt: '2026-07-08'
    },
    {
        id: 'case-nadr-007',
        caseNumber: 'NADR-2026-007',
        dateReceived: '2026-06-20',
        partyA_name: 'ឈុន សុភ័ក្ត្រ',
        partyA_gender: 'ស្រី',
        partyA_age: 33,
        partyA_phone: '017 999 111',
        partyA_location: 'ភ្នំពេញ',
        partyB_name: 'ជា វណ្ណៈ',
        partyB_gender: 'ប្រុស',
        partyB_age: 36,
        partyB_phone: '012 888 222',
        partyB_location: 'ភ្នំពេញ',
        category: 'វិវាទក្នុងគ្រួសារ',
        disputeLocation: 'ភ្នំពេញ',
        summary: 'វិវាទលើការបែងចែកទ្រព្យសម្បត្តិរួម និងសិទ្ធិចិញ្ចឹមកូន ក្រោយពេលលែងលះគ្នា ដោយភាគីទាំងពីរពុំទាន់ឯកភាពគ្នាលើផ្ទះ ១ ខ្នង នៅខណ្ឌសែនសុខ។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'ភាគីមិនចូលរួម',
        mediationMeeting: 'មិនទាន់ប្រជុំ',
        status: 'Pending (តម្កល់)',
        officer: 'លោកជំទាវ ចាន់ សុជាតា',
        remarks: 'មិនទាន់បិទ',
        createdAt: '2026-06-20',
        updatedAt: '2026-07-01'
    },
    {
        id: 'case-nadr-008',
        caseNumber: 'NADR-2026-008',
        dateReceived: '2026-06-15',
        partyA_name: 'វង្ស សុវណ្ណរាជ',
        partyA_gender: 'ប្រុស',
        partyA_age: 47,
        partyA_phone: '099 555 777',
        partyA_location: 'បន្ទាយមានជ័យ',
        partyB_name: 'សួន សម្បត្តិ',
        partyB_gender: 'ប្រុស',
        partyB_age: 53,
        partyB_phone: '085 444 333',
        partyB_location: 'បន្ទាយមានជ័យ',
        category: 'វិវាទអចលនវត្ថុ',
        disputeLocation: 'បន្ទាយមានជ័យ',
        summary: 'វិវាទលើការទិញលក់ផ្ទះល្វែង ១ ខ្នង នៅក្រុងប៉ោយប៉ែត ដោយភាគី ក បានបង់ប្រាក់គ្រប់ចំនួនរួចរាល់ ប៉ុន្តែភាគី ខ មិនព្រមផ្ទេរសិទ្ធិកាន់កាប់ប្លង់រឹងជូន។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)',
        status: 'Active (កំពុងសម្រុះសម្រួល)',
        officer: 'ឯកឧត្តម បណ្ឌិត សុខ សុវណ្ណ',
        remarks: 'មិនទាន់បិទ',
        createdAt: '2026-06-15',
        updatedAt: '2026-06-30'
    },
    {
        id: 'case-nadr-009',
        caseNumber: 'NADR-2026-009',
        dateReceived: '2026-06-05',
        partyA_name: 'សន ស្រីល័ក្ខណ៍',
        partyA_gender: 'ស្រី',
        partyA_age: 29,
        partyA_phone: '011 234 567',
        partyA_location: 'កំពត',
        partyB_name: 'បែន សុខហេង',
        partyB_gender: 'ប្រុស',
        partyB_age: 34,
        partyB_phone: '070 876 543',
        partyB_location: 'កំពត',
        category: 'វិវាទជំពាក់ប្រាក់',
        disputeLocation: 'កំពត',
        summary: 'វិវាទបំណុលប្រាក់ថ្លៃទិញផលដំណាំទុរេន ចំនួន ៨,៥០០ ដុល្លារ ដោយភាគី ខ បានសន្យាសងក្នុងរយៈពេល ១ ខែ តែបច្ចុប្បន្នហួសកំណត់ ៤ ខែហើយ។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
        status: 'Settle (ព្រមព្រៀង)',
        officer: 'លោក មាស វិបុល',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-06-05',
        updatedAt: '2026-06-25'
    },
    {
        id: 'case-nadr-010',
        caseNumber: 'NADR-2026-010',
        dateReceived: '2026-05-20',
        partyA_name: 'ប៉ែន ប៊ុនស្រ៊ន',
        partyA_gender: 'ប្រុស',
        partyA_age: 58,
        partyA_phone: '012 900 800',
        partyA_location: 'ស្វាយរៀង',
        partyB_name: 'គឹម សៀងហៃ',
        partyB_gender: 'ប្រុស',
        partyB_age: 49,
        partyB_phone: '097 800 7000',
        partyB_location: 'ស្វាយរៀង',
        category: 'វិវាទដីធ្លី',
        disputeLocation: 'ស្វាយរៀង',
        summary: 'វិវាទលើការប្រើប្រាស់ផ្លូវសាធារណៈចូលភូមិ ដោយភាគី ខ បានធ្វើស្រះចិញ្ចឹមត្រី និងដាក់របងបិទផ្លូវរំលោភលើដីចំណីផ្លូវ ធ្វើឱ្យប៉ះពាល់ដល់ការធ្វើដំណើររបស់ភាគី ក និងអ្នកភូមិ។',
        meetingPartyA: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        meetingPartyB: 'បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់',
        mediationMeeting: 'បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)',
        status: 'Settle (ព្រមព្រៀង)',
        officer: 'ឯកឧត្តម បណ្ឌិត សុខ សុវណ្ណ',
        remarks: 'បានបិទរួចរាល់',
        createdAt: '2026-05-20',
        updatedAt: '2026-06-10'
    }
];

let casesData = [
    {
        "id": "case-1",
        "caseNumber": "51",
        "dateReceived": "2024-07-01",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "ព្រះសីហនុ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ឈ ហេង",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពង់ចាម",
        "partyB_name": "ណឹម ម៉េង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "75ha",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "ភាគីមិនចូលរួម",
        "mediationMeeting": "ភាគីមិនចូលរួម",
        "status": "Close (បិទ)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-2",
        "caseNumber": "57",
        "dateReceived": "2024-07-01",
        "category": "វិវាទក្នុងគ្រួសារ",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "នួន សុនសៀងហេង (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "នួន សុន, លី មុយនួន, សុនស្រីល័ក្ខណ៍",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "200000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-3",
        "caseNumber": "130",
        "dateReceived": "2024-07-18",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "សេង សុផារិទ្ធ (ប)មេធាវីតំណាងឈ្មោះ KANG DONG HYUN (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "Royal Skyland ក្រុមហ៊ុន មីង ហូ ជីទួន អ៊ិនវេសម៊ិន (ខេមបូឌា(ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "112000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Close (បិទ)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-4",
        "caseNumber": "157",
        "dateReceived": "2024-08-13",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ហេង អំម៉ារ៉ា(ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ខាំ វណ្ណា(ប)ទៀង សោភ័ណ(ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "32100",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Close (បិទ)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-5",
        "caseNumber": "166",
        "dateReceived": "2024-08-23",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ច្រឹក សុខុម (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ស៊្រុន គឹមហៀប (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "15535",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-6",
        "caseNumber": "200",
        "dateReceived": "2024-09-19",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ស៊ីណា វណ្ឌី (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ស៊ីណា លីម៉េង(ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "40000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-7",
        "caseNumber": "244",
        "dateReceived": "2024-10-24",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "បាត់ដំបង",
        "officer": "ឡាយ អូន",
        "partyA_name": "សុខ ហុងលី (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "យ៉ែម ស៊ីន (ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "បាត់ដំបង",
        "summary": "8800",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-8",
        "caseNumber": "301",
        "dateReceived": "2024-11-19",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ ហ្វាមិលី",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ស៊ិន គឹមថៃ (ប) ស្រេង សុខុម (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "46000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Close (បិទ)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-9",
        "caseNumber": "320",
        "dateReceived": "2024-11-22",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ជិន សុវណ្ណារី (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "គឹម ឈុនអៀង (ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "190000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-10",
        "caseNumber": "322",
        "dateReceived": "2024-11-26",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពង់ឆ្នាំង",
        "officer": "ឡាយ អូន",
        "partyA_name": "ណាត ស៊ីនិត (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ដេង ប៊ុនលីន (ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "98000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "ភាគីមិនចូលរួម",
        "mediationMeeting": "ភាគីមិនចូលរួម",
        "status": "Pending (តម្កល់)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-11",
        "caseNumber": "379",
        "dateReceived": "2024-12-17",
        "category": "វិវាទមត៌ក",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ពេជ្រ វណ្ណា (ប) ជុំ ផល្លី (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ស៊ីវ ផល្លីន (ស) ពេជ្រ រតនា (ប)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "ភាគីមិនចូលរួម",
        "mediationMeeting": "ភាគីមិនចូលរួម",
        "status": "Close (បិទ)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-12",
        "caseNumber": "396",
        "dateReceived": "2024-12-26",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "សៀមរាប",
        "officer": "ឡាយ អូន",
        "partyA_name": "ហែម វានីរី (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "សៀមរាប",
        "partyB_name": "យូ ធុល (ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "សៀមរាប",
        "summary": "500000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "ភាគីមិនចូលរួម",
        "mediationMeeting": "ភាគីមិនចូលរួម",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-13",
        "caseNumber": "22",
        "dateReceived": "2025-01-08",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ងួន សារ៉ាំង (ប) មាស សុវណ្ណនី (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ជាង អ៊ីង (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "3850000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-14",
        "caseNumber": "57",
        "dateReceived": "2025-01-27",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "មណ្ឌលគិរី",
        "officer": "ឡាយ អូន",
        "partyA_name": "ប្លាន ដុះ ភ្លឺន ព្យិន ញែវ ម៉ៅ តំណាងជនជាតិដើមភាគតិចព្នង សរុប៧៥ គ្រួសារ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "មណ្ឌលគិរី",
        "partyB_name": "ឈាង ប៉ាកសួរ",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "720ha",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-15",
        "caseNumber": "88",
        "dateReceived": "2025-02-10",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពង់ចាម",
        "officer": "ឡាយ អូន",
        "partyA_name": "ប្រៃសនីយ តំណាងដោយមេធាវី អ៊ិត ភុំ (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពង់ចាម",
        "partyB_name": "វែន ចន្ធូ (ស), ថាន់ ចន្ធា, ចាន់ សុខុម, វែន ចន្ធា",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពង់ចាម",
        "summary": "277000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-16",
        "caseNumber": "114",
        "dateReceived": "2025-02-14",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "សៀមរាប",
        "officer": "ឡាយ អូន",
        "partyA_name": "គឹមយាត ដារ៉ារិទ្ធ (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "សៀមរាប",
        "partyB_name": "មុត ចាន់ឌី (ស) ប៉ិច សុធារី (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "សៀមរាប",
        "summary": "160000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-17",
        "caseNumber": "130",
        "dateReceived": "2025-02-18",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ឆៅ ពៅប៉ូលីន (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "អារ៉ាខាវ៉ា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "13000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-18",
        "caseNumber": "148",
        "dateReceived": "2025-02-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធានាគារសហពាណិជ្ជ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "សឺន វិសុទ្ធ (ប) ងន់ លីដា (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "28383.9",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-19",
        "caseNumber": "175",
        "dateReceived": "2025-03-07",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធានាគារសហពាណិជ្ជ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ហ៊ុំ រតនា (ប) ស៊ឹម គង្គា (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "40550",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-20",
        "caseNumber": "182",
        "dateReceived": "2025-03-14",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កណ្ដាល",
        "officer": "វិនាថ",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "ហ៊ុយ ប្រុស (ប) ឈុន ជាតិធី (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "258243.64",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-21",
        "caseNumber": "183",
        "dateReceived": "2025-03-14",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កណ្ដាល",
        "officer": "វិនាថ, ប៊ុនណន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "ពិន ពៅ (ប) លន់ សុភ័ក្រ្ត (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "59529.12",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-22",
        "caseNumber": "230",
        "dateReceived": "2025-03-31",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "យ៉ុន សំអាត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "1070",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-23",
        "caseNumber": "276",
        "dateReceived": "2025-04-07",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "ថា សុធា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "660",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-24",
        "caseNumber": "323",
        "dateReceived": "2025-04-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ប៉ៃលិន",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ប៉ៃលិន",
        "partyB_name": "ស្នា ប៊ុនធឿន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ប៉ៃលិន",
        "summary": "179456.35",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-25",
        "caseNumber": "324",
        "dateReceived": "2025-04-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ប៉ៃលិន",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ប៉ៃលិន",
        "partyB_name": "គីម បូរិន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ប៉ៃលិន",
        "summary": "80591",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-26",
        "caseNumber": "325",
        "dateReceived": "2025-04-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ប៉ៃលិន",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ប៉ៃលិន",
        "partyB_name": "សោម ប៉ិម",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ប៉ៃលិន",
        "summary": "31500",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-27",
        "caseNumber": "326",
        "dateReceived": "2025-04-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "បាត់ដំបង",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "បាត់ដំបង",
        "partyB_name": "អឿន ចាន់នី",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "បាត់ដំបង",
        "summary": "180000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-28",
        "caseNumber": "327",
        "dateReceived": "2025-04-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ប៊ុនណន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ឡោក ចិត្ត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "180432.23",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-29",
        "caseNumber": "455",
        "dateReceived": "2025-05-21",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "គឹម សុខអេង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "45963.85",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-30",
        "caseNumber": "462",
        "dateReceived": "2025-05-21",
        "category": "វិវាទពាណិជ្ជកម្ម",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "លី បូរ៉ា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "សុខ លីហួត, សុខ លីហួរ, ក្រុមហ៊ុន W.B. LPG",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "7500000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-31",
        "caseNumber": "451",
        "dateReceived": "2025-05-21",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ពោធិ៍សាត់",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ពោធិ៍សាត់",
        "partyB_name": "សុខ វណ្ណី, ឡុង ចាន់នឿន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ពោធិ៍សាត់",
        "summary": "31000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-32",
        "caseNumber": "452",
        "dateReceived": "2025-05-26",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ពោធិ៍សាត់",
        "officer": "ប៊ុនណន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ពោធិ៍សាត់",
        "partyB_name": "ប្រាក់ វិត្ថា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ពោធិ៍សាត់",
        "summary": "107996.39",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-33",
        "caseNumber": "453",
        "dateReceived": "2025-05-21",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ពោធិ៍សាត់",
        "officer": "ប៊ុនណន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ពោធិ៍សាត់",
        "partyB_name": "ថាច់ សុបរមី\r\nអ៊ឹម ឡៃវ័ន្ត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ពោធិ៍សាត់",
        "summary": "57801.33",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-34",
        "caseNumber": "454",
        "dateReceived": "2025-05-21",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ពោធិ៍សាត់",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ពោធិ៍សាត់",
        "partyB_name": "យ៉ោម បុប្ផា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ពោធិ៍សាត់",
        "summary": "93173.73",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-35",
        "caseNumber": "555",
        "dateReceived": "2025-06-16",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "គៅ ហុង",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "យស អូន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "157",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-36",
        "caseNumber": "556",
        "dateReceived": "2025-06-16",
        "category": "វិវាទពាណិជ្ជកម្ម",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "គុណ គីមពៅ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "គីម វ៉ាន់សេត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "95810",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-37",
        "caseNumber": "502",
        "dateReceived": "2025-06-11",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ខុង លីស៊ីអាណា\r\nជា ចន្ថា\r\nចាន់ សុខហ៊ូ\r\nសេង ទីឡេត",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "គង់ ផល្លី\r\nគុណ សៅលី\r\nគង់ សុភក្រ",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "1ha",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-38",
        "caseNumber": "573",
        "dateReceived": "2025-06-23",
        "category": "វិវាទក្នុងគ្រួសារ",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "សុខ ម៉ាទេពីន",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "សុខ ប៊ុន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "20000000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-39",
        "caseNumber": "654",
        "dateReceived": "2025-07-08",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "Prince Bank",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ឈិន សុខខេង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "309389.5",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-40",
        "caseNumber": "628",
        "dateReceived": "2025-07-07",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ចាន់ រតនា, ជា សុវណ្ណ",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "441023.35",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-41",
        "caseNumber": "667",
        "dateReceived": "2025-07-07",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពត",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពត",
        "partyB_name": "យ៉ែម ស៊ីណា, ស៊ន គីមលី",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពត",
        "summary": "80818.04",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-42",
        "caseNumber": "712",
        "dateReceived": "2025-07-07",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ជៀវ សុភា, ឡេង រដ្ឋារ៉ា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-43",
        "caseNumber": "719",
        "dateReceived": "2025-07-22",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ អម្រឹត",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ភិន សុខម៉េង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "75000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (មិនព្រមព្រៀង)",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-44",
        "caseNumber": "722",
        "dateReceived": "2025-07-22",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "សៀមរាប",
        "officer": "ឡាយ អូន",
        "partyA_name": "BRED BANK",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "សៀមរាប",
        "partyB_name": "ប៊ុន ចាន់ធូ, ប៊ុន ហាក់",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "សៀមរាប",
        "summary": "276563.35",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-45",
        "caseNumber": "751",
        "dateReceived": "2025-07-30",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "មណ្ឌលគិរី",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "មណ្ឌលគិរី",
        "partyB_name": "ហន ដានី, អាន ឌីគង់ហ៊ាង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "មណ្ឌលគិរី",
        "summary": "143189.44",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-46",
        "caseNumber": "810",
        "dateReceived": "2025-08-04",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "ទ្រី ហាក់, លន់ ម៉ាលីស",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ស៊ឹម សារ៉េត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-47",
        "caseNumber": "811",
        "dateReceived": "2025-08-04",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "ទ្រី ហាក់, លន់ ម៉ាលីស",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ផូ ស៊ីថា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-48",
        "caseNumber": "789",
        "dateReceived": "2025-08-04",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ឌីន ច័ន្ទធី, តាំង គឹមសេង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពង់ស្ពឺ",
        "summary": "378300",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-49",
        "caseNumber": "848",
        "dateReceived": "2025-08-08",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ត្បូងឃ្មុំ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ត្បូងឃ្មុំ",
        "partyB_name": "មាន ប៊ុនធឿន, ទេស លាងហឿន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ត្បូងឃ្មុំ",
        "summary": "315200",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-50",
        "caseNumber": "850",
        "dateReceived": "2025-08-08",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពង់ស្ពឺ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពង់ស្ពឺ",
        "partyB_name": "ហួត សូរិយា, ខៀវ ចន្ធី, ធឿន ចាន់សុភា, ឈុំ សុខុម",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពង់ស្ពឺ",
        "summary": "361728.07",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-51",
        "caseNumber": "912",
        "dateReceived": "2025-08-13",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា (ខណ្ឌមានជ័យ)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ម៉ុង សុខលីដា, ម៉ុម វ៉ារិន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "295000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-52",
        "caseNumber": "913",
        "dateReceived": "2025-08-13",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អេស៊ីលីដា (ខណ្ឌមានជ័យ)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ប៉ិច វណ្ណៈ, ស៊ូ គុណផានិត, ប៉ិច ម៉េងហុង,",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "193793.92",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-53",
        "caseNumber": "983",
        "dateReceived": "2025-09-02",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "BRED BANK",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ហួត ប្រសិទ្ធ, វេង សុផាន់ថារិទ្ធ/ ជោគជ័យ ហ្វាននាន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "1200000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-54",
        "caseNumber": "1155",
        "dateReceived": "2025-10-16",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ Acleda",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "គឹម សុខអេង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "1850000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-55",
        "caseNumber": "239",
        "dateReceived": "2025-03-31",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "អ៊ូ ចាន់ត្រា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ស្ទឹងត្រែង",
        "summary": "909.77",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-56",
        "caseNumber": "294",
        "dateReceived": "2025-04-10",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "យុន សុផាត/ ថាំង សុភា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "1514.08",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-57",
        "caseNumber": "295",
        "dateReceived": "2025-04-10",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "អេស្អារី ម៉ាណាន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "960.97",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-58",
        "caseNumber": "296",
        "dateReceived": "2025-04-10",
        "category": "វិវាទអចលនវត្ថុ",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "បុរីមនោរម្យ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កណ្ដាល",
        "partyB_name": "ធាង សុធារ៉ា/ធាង សិទ្ធត",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "841.75",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-59",
        "caseNumber": "1476",
        "dateReceived": "2025-12-31",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពង់ស្ពឺ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ដោយ ស្រី",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពង់ស្ពឺ",
        "partyB_name": "ធនាគារ ABA សាខាស្រុកឧដុង្គ",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពង់ស្ពឺ",
        "summary": "55000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-60",
        "caseNumber": "55",
        "dateReceived": "2026-01-23",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ជ័យ វិរៈ និង គុជ ម៉ារីដា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ក្រុមហ៊ុន ចៀន ឈឹង ថៃគ្រុប",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "46945",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "ភាគីមិនចូលរួម",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-61",
        "caseNumber": "105",
        "dateReceived": "2026-02-05",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ពោធិ៍សាត់",
        "officer": "ឡាយ អូន",
        "partyA_name": "ឆយ ហ៊ន",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ពោធិ៍សាត់",
        "partyB_name": "រី វឌី/ស្លូញ ញាញ់",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ពោធិ៍សាត់",
        "summary": "46945",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-62",
        "caseNumber": "154",
        "dateReceived": "2026-02-12",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អ៊ូរី/ ឆាយ សុភត្រា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ណយ ចន្ទពិសី",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "6816.94",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-63",
        "caseNumber": "245",
        "dateReceived": "2026-02-27",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "ព្រៃវែង",
        "officer": "ឡាយ អូន",
        "partyA_name": "ហ៊ិន សាវ៉ាត",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "មៀច សារត់",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ព្រៃវែង",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-64",
        "caseNumber": "287",
        "dateReceived": "2026-03-04",
        "category": "វិវាទកិច្ចសន្យា",
        "disputeLocation": "បន្ទាយមានជ័យ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធានាគារ ABA/ វ៉ា កុម្ភៈ",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "បន្ទាយមានជ័យ",
        "partyB_name": "គឹម រចនាធីតាវត្តី/ ម៉េត ប៊ុនណេរ",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "បន្ទាយមានជ័យ",
        "summary": "154772.8",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-65",
        "caseNumber": "009",
        "dateReceived": "2026-04-01",
        "category": "វិវាទកិច្ចសន្យា",
        "disputeLocation": "កណ្ដាល",
        "officer": "ឡាយ អូន",
        "partyA_name": "ជិន សុវណ្ណារី (ស) តំណាងដោយមេធាវី ផន ស៊ីន",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "ឆាយ សុវណ្ណ តំណាងដោយមេធាវី ហេង ពូង",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កណ្ដាល",
        "summary": "55000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-66",
        "caseNumber": "657",
        "dateReceived": "2026-05-06",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "បន្ទាយមានជ័យ",
        "officer": "ឡាយ អូន",
        "partyA_name": "កាំង គឹមអេង (ប)/ ជ័យ ជីវ័ន្ត (ស)",
        "partyA_gender": "ស្រី",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "បន្ទាយមានជ័យ",
        "partyB_name": "ឃឹម ស៊ីមន (ស)",
        "partyB_gender": "ស្រី",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "បន្ទាយមានជ័យ",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "បានប្រមូលព័ត៌មានភាគីម្ខាងទៀតរួចរាល់",
        "mediationMeeting": "បានប្រជុំសម្រុះសម្រួលរួចរាល់ (ព្រមព្រៀង)",
        "status": "Settle (ព្រមព្រៀង)",
        "remarks": "បានបិទរួចរាល់"
    },
    {
        "id": "case-67",
        "caseNumber": "845",
        "dateReceived": "2026-05-29",
        "category": "វិវាទដីធ្លី",
        "disputeLocation": "កំពត",
        "officer": "ឡាយ អូន",
        "partyA_name": "ងី គឹមឌី (ប)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពត",
        "partyB_name": "ទៀង ស៊ីប៉ូ (ប)",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពត",
        "summary": "ពុំមានបញ្ជាក់",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-68",
        "caseNumber": "927",
        "dateReceived": "2026-05-25",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "កំពង់ចាម",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ អ៊ូរី (ជាម ស្រេន)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "កំពង់ចាម",
        "partyB_name": "ដាំ ស្រស់/ យ៉ាត យឿន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "កំពង់ចាម",
        "summary": "12000",
        "meetingPartyA": "បានប្រមូលព័ត៌មានភាគីស្នើសុំរួចរាល់",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-69",
        "caseNumber": "1010",
        "dateReceived": "2026-06-16",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "គ្រឹះស្ថានមីក្រូ. បង្គាខែភីថល អ៊ឹង ធារ៉ា",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "នង សម្បត្តិ/ ជ័យ លក្ខិណា",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "10000",
        "meetingPartyA": "មិនទាន់ប្រជុំ",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Pending (តម្កល់)",
        "remarks": "មិនទាន់បិទ"
    },
    {
        "id": "case-70",
        "caseNumber": "1212",
        "dateReceived": "2026-06-29",
        "category": "វិវាទជំពាក់ប្រាក់",
        "disputeLocation": "ភ្នំពេញ",
        "officer": "ឡាយ អូន",
        "partyA_name": "ធនាគារ ហត្ថា ម.ក (មាឃ វ៉ុន មេធាវី)",
        "partyA_gender": "ប្រុស",
        "partyA_age": "35",
        "partyA_phone": "",
        "partyA_location": "ភ្នំពេញ",
        "partyB_name": "លឹម សុផាត, លឹម ផានី, ម៉ៅ ធីម, វ៉ុន ថន, យស ធី, សុខ លឿន",
        "partyB_gender": "ប្រុស",
        "partyB_age": "35",
        "partyB_phone": "",
        "partyB_location": "ភ្នំពេញ",
        "summary": "45000",
        "meetingPartyA": "មិនទាន់ប្រជុំ",
        "meetingPartyB": "មិនទាន់ប្រជុំ",
        "mediationMeeting": "មិនទាន់ប្រជុំ",
        "status": "Active (កំពុងសម្រុះសម្រួល)",
        "remarks": "មិនទាន់បិទ"
    }
];

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
        officer: newCase.officer || 'មន្ត្រីសម្របសម្រួល',
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
            const matchOff = c.officer?.toLowerCase().includes(q);
            if (!matchNum && !matchPA && !matchPB && !matchSum && !matchOff) {
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
        byLocation: {},
        byOfficer: {}
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

        // Officer counts
        const off = c.officer || 'មន្ត្រីផ្សេងៗ';
        stats.byOfficer[off] = (stats.byOfficer[off] || 0) + 1;
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

        const off = row['មន្ត្រីសម្របសម្រួល'] || row['មន្ត្រីទទួលបន្ទុក'] || row['Officer'] || 'មន្ត្រីសម្របសម្រួល';
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
                officer: String(off),
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
