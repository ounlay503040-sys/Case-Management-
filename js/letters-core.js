/* ==========================================================================
   NADR CMS Pro — Letters core (pure functions, no DOM, no Node APIs)
   Used by the page (window.LettersCore) and by the main process / tests
   (module.exports). Builds the data object for a {{...}} letter template.
   ========================================================================== */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.LettersCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------- Khmer numbers, dates and times ---------- */
    const KH_DIGITS = '០១២៣៤៥៦៧៨៩';
    const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const KH_WEEKDAYS = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const KH_WORDS = ['សូន្យ', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន', 'ដប់',
        'ដប់មួយ', 'ដប់ពីរ', 'ដប់បី', 'ដប់បួន', 'ដប់ប្រាំ', 'ដប់ប្រាំមួយ', 'ដប់ប្រាំពីរ', 'ដប់ប្រាំបី', 'ដប់ប្រាំបួន', 'ម្ភៃ'];

    /** Latin digits → Khmer digits. Anything else is left as it is. */
    const khNum = v => String(v == null ? '' : v).replace(/[0-9]/g, d => KH_DIGITS[d]);
    /** Khmer digits → Latin digits. */
    const latinNum = v => String(v == null ? '' : v).replace(/[០-៩]/g, d => String(KH_DIGITS.indexOf(d)));
    /** 3 → "៣ (បី)" */
    const khCountWords = n => { const i = parseInt(latinNum(n), 10); return isNaN(i) ? '' : (KH_WORDS[i] ? `${khNum(i)} (${KH_WORDS[i]})` : khNum(i)); };

    /** "2026-07-09" (or a Date) → {y, m, d} — no time zone shifts. */
    function parseDay(v) {
        if (!v) return null;
        if (v instanceof Date) return isNaN(v) ? null : { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() };
        const s = latinNum(v).trim();
        let r = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
        if (r) return valid(+r[1], +r[2], +r[3]);
        r = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s); // 09/07/2026 (day first)
        if (r) return valid(+r[3], +r[2], +r[1]);
        return null;
        function valid(y, m, d) {
            const t = new Date(Date.UTC(y, m - 1, d));
            return (t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d) ? { y, m, d } : null;
        }
    }
    /** → "ថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦" */
    function khDate(v) {
        const p = parseDay(v); if (!p) return '';
        return `ថ្ងៃទី${khNum(p.d)} ខែ${KH_MONTHS[p.m - 1]} ឆ្នាំ${khNum(p.y)}`;
    }
    /** → "ថ្ងៃពុធ ទី១៣ ខែឧសភា ឆ្នាំ២០២៦" */
    function khDateFull(v) {
        const p = parseDay(v); if (!p) return '';
        const wd = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
        return `ថ្ងៃ${KH_WEEKDAYS[wd]} ទី${khNum(p.d)} ខែ${KH_MONTHS[p.m - 1]} ឆ្នាំ${khNum(p.y)}`;
    }
    function parseTime(v) {
        const r = /^\s*(\d{1,2})[:.h](\d{2})/.exec(latinNum(v || ''));
        if (!r) return null;
        const h = +r[1], m = +r[2];
        return (h > 23 || m > 59) ? null : { h, m };
    }
    const dayPart = h => h < 12 ? 'ព្រឹក' : h === 12 ? 'ថ្ងៃត្រង់' : h < 18 ? 'រសៀល' : 'ល្ងាច';
    const pad2 = n => String(n).padStart(2, '0');
    /** Invitation letters: "13:00" → "១:០០ នាទីរសៀល" */
    function khTimeInvite(v) {
        const t = parseTime(v); if (!t) return '';
        return `${khNum(t.h % 12 || 12)}:${khNum(pad2(t.m))} នាទី${dayPart(t.h)}`;
    }
    /** Reports and minutes: "14:00" → "២ និង ០០ នាទីរសៀល" */
    function khTimeReport(v) {
        const t = parseTime(v); if (!t) return '';
        return `${khNum(t.h % 12 || 12)} និង ${khNum(pad2(t.m))} នាទី${dayPart(t.h)}`;
    }

    /* ---------- Constants ---------- */
    const DOTS = '................................................................';
    const SHORT_DOTS = '......';
    const NADR_ADDRESS = 'អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ ក្នុងបរិវេណបណ្ឌិត្យសភាភូមិន្ទយុត្តិធម៌កម្ពុជា ដែលស្ថិតនៅមហាវិថីឈ្នះឈ្នះ ភូមិព្រែកតារ័ត្ន សង្កាត់ព្រែកតាសេក ខណ្ឌជ្រោយចង្វារ រាជធានីភ្នំពេញ';

    /** Free-text parts the mediator writes in Word: never written by the program. */
    const CONTENT_FIELDS = ['facts', 'negotiation_results', 'close_reason', 'options', 'party_options', 'meeting_results',
        'meeting_outcome', 'final_conclusion', 'issue_summary', 'agreement_terms', 'mission_background', 'mission_purpose',
        'mission_expected_result', 'result_text', 'conclusion_text', 'coop_reason', 'party_a_description', 'party_b_description'];
    /** Tags that only show a phrase when they have a value ({{#x}}...{{/x}}): empty is fine. */
    const OPTIONAL_FIELDS = ['recipient_address', 'applicant_address', 'witness_position', 'dispute_location',
        'envelope1_phone', 'envelope2_phone', 'issue_lunar_date', 'issue_date'];

    /** Khmer names of the fields, for the "missing information" list. */
    const FIELD_LABELS = {
        mediator_title: 'ងារ ម.ស.វ. (ការកំណត់)', mediator_name: 'ឈ្មោះ ម.ស.វ. (ការកំណត់)', mediator_gender: 'ភេទ ម.ស.វ. (ការកំណត់)',
        mediator_pronoun: 'សព្វនាម ម.ស.វ. (ការកំណត់)', mediator_pronoun_short: 'សព្វនាមខ្លី', mediator_phone: 'ទូរសព្ទ ម.ស.វ. (ការកំណត់)',
        sg_honorific: 'ងារអគ្គលេខាធិការ (ការកំណត់)', sg_name: 'ឈ្មោះអគ្គលេខាធិការ (ការកំណត់)', meeting_location: 'ទីតាំងប្រជុំ',
        case_no: 'លេខសំណុំរឿង', case_date: 'ថ្ងៃចុះបញ្ជីសំណុំរឿង', dispute_subject: 'កម្មវត្ថុវិវាទ', dispute_location: 'ទីតាំងវិវាទ',
        assignment_letter_no: 'លេខលិខិតចាត់តាំង', assignment_letter_date: 'ថ្ងៃចាត់តាំង', application_date: 'ថ្ងៃភាគី «ក» ដាក់ពាក្យ',
        parties_designation: 'ឈ្មោះគូភាគី', applicant_short_names: 'ឈ្មោះភាគីស្នើសុំ', respondent_short_names: 'ឈ្មោះភាគីម្ខាងទៀត',
        recipient_org_name: 'ឈ្មោះស្ថាប័នអ្នកទទួល', recipient_representative: 'អ្នកតំណាងស្ថាប័នអ្នកទទួល', recipient_persons: 'ឈ្មោះអ្នកទទួល',
        recipient_phone: 'ទូរសព្ទអ្នកទទួល', recipient_honorific: 'ងារអ្នកទទួល', recipient_address: 'អាសយដ្ឋានអ្នកទទួល',
        applicant_org_name: 'ឈ្មោះស្ថាប័នភាគីស្នើសុំ', applicant_representative: 'អ្នកតំណាងភាគីស្នើសុំ', applicant_persons: 'ឈ្មោះភាគីស្នើសុំ',
        applicant_phone: 'ទូរសព្ទភាគីស្នើសុំ', applicant_address: 'អាសយដ្ឋានភាគីស្នើសុំ',
        witness_name: 'ឈ្មោះសាក្សី', witness_gender: 'ភេទសាក្សី', witness_nationality: 'សញ្ជាតិសាក្សី', witness_address: 'អាសយដ្ឋានសាក្សី', witness_honorific: 'ងារសាក្សី',
        meeting_date: 'ថ្ងៃប្រជុំ', meeting_time: 'ម៉ោងប្រជុំ', meeting_date_full: 'ថ្ងៃប្រជុំ', meeting_time_start: 'ម៉ោងចាប់ផ្តើម',
        meeting_time_end: 'ម៉ោងបញ្ចប់', meeting_round: 'លើកទីនៃកិច្ចប្រជុំ', meeting_title: 'ចំណងជើងកិច្ចប្រជុំ', meeting_kind: 'ប្រភេទកិច្ចប្រជុំ',
        attendees: 'អ្នកចូលរួម', mediators: 'ម.ស.វ. ដឹកនាំ',
        meetings_total: 'ចំនួនកិច្ចប្រជុំសរុប', info_meetings_count: 'ចំនួនកិច្ចប្រជុំផ្តល់ព័ត៌មាន', mediation_meetings_count: 'ចំនួនកិច្ចប្រជុំសម្រុះសម្រួល',
        last_mediation_no: 'លើកទីនៃកិច្ចប្រជុំសម្រុះសម្រួលចុងក្រោយ', last_mediation_date: 'ថ្ងៃប្រជុំសម្រុះសម្រួលចុងក្រោយ', mediation_meetings: 'បញ្ជីកិច្ចប្រជុំសម្រុះសម្រួល',
        minutes_no: 'លេខកំណត់ហេតុ', minutes_date: 'ថ្ងៃកំណត់ហេតុ', minutes_pages: 'ចំនួនទំព័រកំណត់ហេតុ', copies_count: 'ចំនួនច្បាប់ចម្លង',
        party_a_label: 'ឈ្មោះហៅកាត់ភាគី «ក»', party_b_label: 'ឈ្មោះហៅកាត់ភាគី «ខ»', party_a_signer: 'អ្នកចុះហត្ថលេខាភាគី «ក»', party_b_signer: 'អ្នកចុះហត្ថលេខាភាគី «ខ»',
        withdrawal_clause_no: 'លេខប្រការដកពាក្យបណ្តឹង', room_purpose: 'គោលបំណងប្រើបន្ទប់',
        authority_addressee: 'អាជ្ញាធរដែលត្រូវផ្ញើជូន', authority_short: 'ងារអាជ្ញាធរខ្លី', hall_name: 'ឈ្មោះសាលប្រជុំ', invited_participants: 'សមាសភាពដែលសុំអញ្ជើញ',
        mission_place: 'ទីកន្លែងបេសកកម្ម', mission_schedule: 'កាលវិភាគបេសកកម្ម', mission_members: 'សមាសភាពបេសកកម្ម', mission_cases_count: 'ចំនួនសំណុំរឿងក្នុងបេសកកម្ម',
        intro_letter_no: 'លេខលិខិតឧទ្ទេសនាម', intro_letter_date: 'ថ្ងៃលិខិតឧទ្ទេសនាម', mission_letter_no: 'លេខលិខិតបេសកកម្ម', mission_letter_date: 'ថ្ងៃលិខិតបេសកកម្ម',
        mission_cases_ref: 'សំណុំរឿងក្នុងបេសកកម្ម', mission_members_text: 'សមាសភាពបេសកកម្ម', mission_period: 'រយៈពេលបេសកកម្ម', mission_case_results: 'លទ្ធផលសំណុំរឿងនីមួយៗ',
        report_signer_name: 'អ្នកចុះហត្ថលេខារបាយការណ៍', grantors: 'អ្នកប្រគល់សិទ្ធិ', grantor_address: 'អាសយដ្ឋានអ្នកប្រគល់សិទ្ធិ', grantor_pronoun: 'សព្វនាមអ្នកប្រគល់សិទ្ធិ',
        grantor_names: 'ឈ្មោះអ្នកប្រគល់សិទ្ធិ', grantee_name: 'ឈ្មោះអ្នកទទួលសិទ្ធិ', grantee_gender: 'ភេទអ្នកទទួលសិទ្ធិ', grantee_dob: 'ថ្ងៃកំណើតអ្នកទទួលសិទ្ធិ',
        grantee_id_no: 'លេខអត្តសញ្ញាណប័ណ្ណអ្នកទទួលសិទ្ធិ', grantee_address: 'អាសយដ្ឋានអ្នកទទួលសិទ្ធិ', counterparty_name: 'ឈ្មោះភាគីម្ខាងទៀត',
        envelope1_recipient: 'អ្នកទទួលស្រោមសំបុត្រទី១', envelope1_address: 'អាសយដ្ឋានស្រោមសំបុត្រទី១', envelope2_recipient: 'អ្នកទទួលស្រោមសំបុត្រទី២', envelope2_address: 'អាសយដ្ឋានស្រោមសំបុត្រទី២'
    };

    /* ---------- Template catalogue ---------- */
    const TEMPLATES = [
        // stage: 1 = ត្រៀម, 2 = ប្រជុំដោះស្រាយ, 3 = ក្រោយការប្រជុំ, 0 = current stage
        { id: 'INV-INFO', group: 'invite', stage: 1, name: 'លិខិតអញ្ជើញផ្តល់ព័ត៌មាន', short: 'លិខិតអញ្ជើញ (ផ្តល់ព័ត៌មាន)', kind: 'INFO', dynamic: true },
        { id: 'INV-INFO-W', group: 'invite', stage: 1, name: 'លិខិតអញ្ជើញសាក្សី (ផ្តល់ព័ត៌មាន)', short: 'លិខិតអញ្ជើញសាក្សី (ផ្តល់ព័ត៌មាន)', kind: 'INFO', role: 'W' },
        { id: 'RPT-INFO-A', group: 'report', stage: 1, name: 'របាយការណ៍សាកសួរភាគីប្រមូលព័ត៌មាន ភាគីស្នើសុំ', short: 'របាយការណ៍ប្រជុំផ្តល់ព័ត៌មាន', kind: 'INFO', role: 'A' },
        { id: 'RPT-INFO-B', group: 'report', stage: 1, name: 'របាយការណ៍សាកសួរភាគីប្រមូលព័ត៌មាន ភាគីម្ខាងទៀត', short: 'របាយការណ៍ប្រជុំផ្តល់ព័ត៌មាន', kind: 'INFO', role: 'B' },
        { id: 'INV-MED', group: 'invite', stage: 2, name: 'លិខិតអញ្ជើញសម្រុះសម្រួល', short: 'លិខិតអញ្ជើញ (សម្រុះសម្រួល)', kind: 'MED', dynamic: true },
        { id: 'INV-MED-W', group: 'invite', stage: 2, name: 'លិខិតអញ្ជើញសាក្សី (សម្រុះសម្រួល)', short: 'លិខិតអញ្ជើញសាក្សី (សម្រុះសម្រួល)', kind: 'MED', role: 'W' },
        { id: 'RPT-MED', group: 'report', stage: 2, name: 'របាយការណ៍ប្រជុំសម្រុះសម្រួលផ្សះផ្សាវិវាទ', short: 'របាយការណ៍ប្រជុំ', kind: 'MED' },
        { id: 'MIN-SETTLE', group: 'minutes', stage: 2, name: 'កំណត់ហេតុព្រមព្រៀងបញ្ចប់វិវាទ', short: 'កំណត់ហេតុព្រមព្រៀងបញ្ចប់វិវាទ' },
        { id: 'MIN-COPY', group: 'minutes', stage: 2, name: 'សេចក្តីចម្លងយថាភូតនៃកំណត់ហេតុ', short: 'សេចក្តីចម្លងយថាភូត' },
        { id: 'RPT-RESULT', group: 'report', stage: 3, name: 'របាយការណ៍លទ្ធផលនៃការសម្រុះសម្រួល', short: 'របាយការណ៍លទ្ធផល' },
        { id: 'REQ-CLOSE', group: 'request', stage: 3, name: 'សំណើសុំបិទបញ្ចប់សំណុំរឿង', short: 'សំណើសុំបិទបញ្ចប់សំណុំរឿង' },
        { id: 'REQ-ROOM', group: 'request', stage: 0, name: 'សំណើសុំប្រើប្រាស់បន្ទប់ប្រជុំ', short: 'សំណើសុំប្រើបន្ទប់ប្រជុំ' },
        { id: 'REQ-MISSION', group: 'request', stage: 0, name: 'សំណើសុំចុះបេសកកម្ម', short: 'សំណើសុំចុះបេសកកម្ម' },
        { id: 'RPT-MISSION', group: 'report', stage: 0, name: 'របាយការណ៍លទ្ធផលចុះបេសកកម្ម', short: 'របាយការណ៍បេសកកម្ម' },
        { id: 'COOP-HALL', group: 'request', stage: 0, name: 'សំណើសុំកិច្ចសហការ ប្រើប្រាស់សាលប្រជុំ', short: 'សំណើសុំប្រើសាលប្រជុំ' },
        { id: 'COOP-HALL-PARTICIPANTS', group: 'request', stage: 0, name: 'សំណើសុំកិច្ចសហការ ប្រើសាលប្រជុំ និងអញ្ជើញសមាសភាព', short: 'សំណើសុំប្រើសាលប្រជុំ និងអញ្ជើញសមាសភាព' },
        { id: 'DOC-ATTEND', group: 'other', stage: 0, name: 'បញ្ជីសម្រង់វត្តមានអ្នកចូលរួម', short: 'បញ្ជីវត្តមាន' },
        { id: 'DOC-POA', group: 'other', stage: 0, name: 'លិខិតប្រគល់សិទ្ធិ', short: 'លិខិតប្រគល់សិទ្ធិ' },
        { id: 'DOC-ENVELOPE', group: 'other', stage: 0, name: 'ឈ្មោះលើស្រោមសំបុត្រ', short: 'ស្រោមសំបុត្រ' }
    ];

    /**
     * Invitation template from the meeting kind and the people involved.
     * kind: 'INFO'|'MED', role: 'A'|'B'|'W', recipientType / applicantType: 'J'|'N'
     */
    function pickInviteTemplate(kind, role, recipientType, applicantType) {
        if (!/^(INFO|MED)$/.test(kind)) throw new Error('ប្រភេទប្រជុំមិនត្រឹមត្រូវ: ' + kind);
        if (role === 'W') return `INV-${kind}-W`;
        if (role === 'A') return `INV-${kind}-A-${recipientType}`;
        if (role === 'B') return `INV-${kind}-B-${recipientType}-${applicantType}`;
        throw new Error('តួនាទីអ្នកទទួលមិនត្រឹមត្រូវ: ' + role);
    }

    /* ---------- Parties ---------- */
    const clean = v => String(v == null ? '' : v).replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
    const isCompany = p => p && p.type === 'company';
    const typeOf = list => (list && list.length && isCompany(list[0])) ? 'J' : 'N';
    const provinceLabel = p => { p = clean(p); if (!p) return ''; return p === 'ភ្នំពេញ' ? 'រាជធានីភ្នំពេញ' : (/^(ខេត្ត|រាជធានី)/.test(p) ? p : 'ខេត្ត' + p); };
    function fullAddress(addr, province) {
        addr = clean(addr); const prov = provinceLabel(province);
        if (!prov) return addr;
        const bare = prov.replace(/^(ខេត្ត|រាជធានី)/, '');
        if (addr && addr.includes(bare)) return addr;
        return [addr, prov].filter(Boolean).join(' ');
    }
    const honorificOf = g => g === 'ស្រី' ? 'លោកស្រី' : 'លោក';
    function groupHonorific(people) {
        const gs = new Set(people.map(p => p.gender === 'ស្រី' ? 'f' : 'm'));
        return gs.size > 1 ? 'លោក-លោកស្រី' : (gs.has('f') ? 'លោកស្រី' : 'លោក');
    }
    /** ", " … " និង" before the last … "" for the last */
    function withSeps(items, mid = ', ', last = ' និង') {
        return items.map((it, i) => Object.assign({}, it, { sep: i === items.length - 1 ? '' : i === items.length - 2 ? last : mid }));
    }
    const joinNames = (names, last = ' និង ') => names.length <= 1 ? (names[0] || '') : names.slice(0, -1).join(', ') + last + names[names.length - 1];
    const uniq = a => [...new Set(a.filter(Boolean))];

    function orgName(p) { return clean([p.comName, p.comBranch].filter(Boolean).join(' ')); }
    function representative(p) {
        if (!p || !p.hasRep || !clean(p.repName)) return '';
        const name = clean(p.repName);
        if ((p.repRole || 'មេធាវី') === 'មេធាវី') {
            const id = clean(p.repId);
            const idTxt = !id ? '' : (/^[\d០-៩\s/-]+$/.test(id) ? ` អត្តលេខ${id}` : ` ${id}`);
            const firm = clean(p.repFirm);
            return `${/^មេធាវី/.test(name) ? name : 'មេធាវី ' + name}${idTxt}${firm ? ' នៅ' + firm : ''}`;
        }
        return `ឈ្មោះ ${name} ភេទ${p.repGender || 'ប្រុស'} សញ្ជាតិខ្មែរ`;
    }
    /** A group of parties (ក, ខ or គ) → the fields a letter needs about it. */
    function describeGroup(list, label) {
        list = (list || []).filter(p => clean(isCompany(p) ? p.comName : p.name));
        const type = typeOf(list);
        const warnings = [];
        const out = { type, label, count: list.length, warnings };
        if (!list.length) return out;
        if (type === 'J') {
            const orgs = list.filter(isCompany);
            if (orgs.length < list.length) warnings.push(`ភាគី «${label}» មានទាំងនីតិបុគ្គល និងរូបវន្តបុគ្គល៖ លិខិតប្រើតែនីតិបុគ្គល`);
            const first = orgs[0];
            out.org_name = joinNames(orgs.map(orgName));
            out.address = fullAddress(first.comAddress || first.address, first.province);
            out.representative = representative(first);
            out.phone = uniq(orgs.map(o => clean(o.comPhone) || clean(o.repPhone) || clean(o.phone))).join(' / ');
            out.short_names = joinNames(orgs.map(o => clean(o.comName)));
            out.signer = clean(first.repName).replace(/^មេធាវី\s*/, '') || '';
            out.attendees = [{ title: first.hasRep && clean(first.repName) ? (first.repGender === 'ស្រី' ? 'លោកស្រី' : 'លោក') : '', name: clean(first.repName) || orgName(first), role: '' }];
            out.recipient_title = 'លោក-លោកស្រី ជាប្រធាន' + out.org_name;
        } else {
            const people = list.filter(p => !isCompany(p));
            if (people.length < list.length) warnings.push(`ភាគី «${label}» មានទាំងរូបវន្តបុគ្គល និងនីតិបុគ្គល៖ លិខិតប្រើតែរូបវន្តបុគ្គល`);
            const addrs = people.map(p => fullAddress(p.address, p.province));
            const same = uniq(addrs).length === 1;
            out.persons = withSeps(people.map((p, i) => ({
                name: clean(p.name), gender: p.gender || 'ប្រុស', nationality: clean(p.nationality) || 'ខ្មែរ',
                dob: khDate(p.dob), address: same ? '' : addrs[i]
            })));
            out.address = same ? addrs[0] : '';
            out.phone = uniq(people.map(p => clean(p.phone))).join(' / ');
            out.honorific = groupHonorific(people);
            out.short_names = 'ឈ្មោះ ' + joinNames(people.map(p => clean(p.name)));
            out.signer = joinNames(people.map(p => clean(p.name)));
            out.attendees = people.map(p => ({ title: honorificOf(p.gender), name: clean(p.name), role: '' }));
            out.recipient_title = out.short_names;
            out.firstPerson = people[0];
        }
        return out;
    }
    const isWitness = p => /សាក្សី/.test(p && p.thirdPartyRole || '');
    /** ក = claimants; ខ = respondents; គ = third parties that are not witnesses; witnesses on their own. */
    function caseGroups(c) {
        c = c || {};
        const third = Array.isArray(c.thirdParties) ? c.thirdParties : [];
        const A = describeGroup(c.claimants && c.claimants.length ? c.claimants : legacyParty(c, 'A'), 'ក');
        const others = [describeGroup(c.respondents && c.respondents.length ? c.respondents : legacyParty(c, 'B'), 'ខ')];
        const g = describeGroup(third.filter(p => !isWitness(p)), 'គ');
        if (g.count) others.push(g);
        const witnesses = third.filter(isWitness).filter(p => clean(p.name));
        return { A, others, witnesses };
    }
    function legacyParty(c, k) {
        const name = c[`party${k}_name`]; if (!name) return [];
        return [{ type: 'individual', name, gender: c[`party${k}_gender`], phone: c[`party${k}_phone`], address: c[`party${k}_address`], province: c[`party${k}_location`] }];
    }

    /* ---------- Case → letter data ---------- */
    const yy = p => p ? String(p.y).slice(-2) : '';
    function caseNo(c) {
        const n = clean(c.caseNumber || c.caseNo);
        if (!n) return '';
        if (/[/]/.test(n)) return khNum(n);
        const p = parseDay(c.filingDate || c.dateReceived || c.receivedDate);
        return khNum(p ? `${n}/${yy(p)}` : n);
    }
    function disputeLocation(c) {
        return fullAddress([c.locationHouse, c.locationCommune].map(clean).filter(Boolean).join(' '), c.locationProvince || c.disputeLocation);
    }
    function disputeSubject(c) {
        const s = clean(c.disputeSubject);
        return s || clean(c.category).replace(/^វិវាទ/, '');
    }
    const roleText = (label, isApplicant, count) => `${isApplicant ? 'ភាគីស្នើសុំ' : 'ភាគីម្ខាងទៀត'} ហៅកាត់ថា ${count > 1 ? 'សហភាគី' : 'ភាគី'} “${label}”`;
    function attendeesOf(groups) {
        return groups.flatMap(g => (g.attendees || []).map(a => Object.assign({}, a, { role: roleText(g.label, g.label === 'ក', g.count) })));
    }
    function issueDates(settings, year) {
        return {
            issue_lunar_date: `ថ្ងៃ                    ខែ                ${settings.lunar_year || ''}`.trimEnd(),
            issue_date: `ថ្ងៃទី          ខែ          ឆ្នាំ${khNum(year)}`
        };
    }
    const blankList = keys => [Object.assign({ no: '១', text: SHORT_DOTS }, keys || {})];
    const count = v => { const n = parseInt(latinNum(v), 10); return isNaN(n) ? 0 : n; };

    /**
     * Build the data for one template.
     * @param {string} templateId  e.g. 'INV-MED-B-N-J', 'RPT-MED'
     * @param {object} c           the case record
     * @param {object} settings    letter settings (see letters.js)
     * @param {object} extras      values from the small dialog: meetingDate (ISO), meetingTime ('13:00'),
     *                             timeStart, timeEnd, round, recipient ('B0', 'B1'), witnessIndex, meetingTitle, …
     *                             Any template field name given here overrides the computed value.
     * @returns {{data: object, warnings: string[]}}
     */
    function buildLetterData(templateId, c, settings, extras) {
        c = c || {}; settings = settings || {}; extras = extras || {};
        const s = Object.assign({ mediator_pronoun_short: 'ខ្ញុំ', meeting_location: NADR_ADDRESS }, settings);
        const groups = caseGroups(c);
        const A = groups.A;
        const recIdx = Math.max(0, parseInt(String(extras.recipient || 'B0').replace(/\D/g, ''), 10) || 0);
        const B = groups.others[recIdx] || groups.others[0];
        const warnings = [].concat(A.warnings || [], B.warnings || []);
        const today = new Date();
        const meetDay = parseDay(extras.meetingDate);
        const year = meetDay ? meetDay.y : today.getFullYear();
        const medCount = count(c.mediationMeetingCount);
        const infoCount = count(c.meetingPartyACount) + count(c.meetingPartyBCount);
        const settled = /^Settle/.test(c.status || '');

        const d = {
            // settings
            mediator_title: s.mediator_title, mediator_name: s.mediator_name, mediator_gender: s.mediator_gender,
            mediator_pronoun: s.mediator_pronoun, mediator_pronoun_short: s.mediator_pronoun_short, mediator_phone: khNum(s.mediator_phone),
            sg_honorific: s.sg_honorific, sg_name: s.sg_name, meeting_location: s.meeting_location || NADR_ADDRESS,
            ...issueDates(s, year),
            // case
            case_no: caseNo(c), case_date: khDate(c.filingDate || c.dateReceived),
            dispute_subject: disputeSubject(c), dispute_location: disputeLocation(c),
            assignment_letter_no: khNum(clean(c.assignmentLetterNo)), assignment_letter_date: khDate(c.assignedDate),
            application_date: khDate(c.applicationDate || c.filingDate),
            applicant_short_names: A.short_names || '', respondent_short_names: groups.others.map(g => g.short_names).filter(Boolean).join(' និង'),
            parties_designation: [A.short_names && `ភាគីស្នើសុំ ${A.short_names} ហៅកាត់ថា ${A.count > 1 ? 'សហភាគី' : 'ភាគី'} “ក”`]
                .concat(groups.others.filter(g => g.short_names).map(g => `ភាគីម្ខាងទៀត ${g.short_names} ហៅកាត់ថា ${g.count > 1 ? 'សហភាគី' : 'ភាគី'} “${g.label}”`))
                .filter(Boolean).join(' និង'),
            // meeting (from the dialog)
            meeting_date: khDate(extras.meetingDate), meeting_date_full: khDateFull(extras.meetingDate),
            meeting_time: khTimeInvite(extras.meetingTime), meeting_time_start: khTimeReport(extras.timeStart || extras.meetingTime),
            meeting_time_end: khTimeReport(extras.timeEnd),
            meeting_round: khNum(extras.round || (medCount ? medCount : 1)),
            // counts for the closing request
            meetings_total: khNum(infoCount + medCount), info_meetings_count: khNum(infoCount), mediation_meetings_count: khNum(medCount),
            last_mediation_no: khNum(medCount || ''), last_mediation_date: khDate(c.mediationMeetingDate),
            mediation_meetings: medCount ? [{ no: khNum(medCount), date: khDate(c.mediationMeetingDate), time: '', place: 'បន្ទប់ប្រជុំសម្រុះសម្រួលផ្សះផ្សាវិវាទនៃ អ.ដ.ក.' }] : [],
            mediators: [{ title: s.mediator_title, name: s.mediator_name }],
            // minutes
            minutes_no: `       /${khNum(String(year).slice(-2))} កពវ.អ.ដ.ក.`, minutes_date: `ថ្ងៃទី       ខែ       ឆ្នាំ${khNum(year)}`,
            party_a_label: `${A.count > 1 ? 'សហភាគី' : 'ភាគី'} “ក”`, party_b_label: `${B.count > 1 ? 'សហភាគី' : 'ភាគី'} “ខ”`,
            party_a_signer: A.signer || '', party_b_signer: B.signer || '',
            copies_count: khCountWords(3), minutes_pages: '',
            // attendance list / envelopes / other
            meeting_title: extras.meetingTitle || '',
            envelope1_recipient: A.recipient_title || '', envelope1_address: A.address || (A.persons && A.persons[0] && A.persons[0].address) || '', envelope1_phone: A.phone || '',
            envelope2_recipient: B.recipient_title || '', envelope2_address: B.address || (B.persons && B.persons[0] && B.persons[0].address) || '', envelope2_phone: B.phone || '',
            mission_members: [{ no: '១', title: s.mediator_title, name: s.mediator_name, position: 'មន្ត្រីសម្រុះសម្រួលដោះស្រាយវិវាទ' }],
            mission_members_text: [s.mediator_title, s.mediator_name].filter(Boolean).join(' '),
            mission_cases_count: '១', mission_cases_ref: [{ case_no: caseNo(c), case_date: khDate(c.filingDate || c.dateReceived) }],
            mission_case_results: [{ letter: 'ក', meeting_date: khDate(extras.meetingDate), meeting_kind: '', case_no: caseNo(c), case_date: khDate(c.filingDate || c.dateReceived),
                dispute_subject: disputeSubject(c), dispute_location: disputeLocation(c), result_text: '', conclusion_text: '', requests: blankList({}).map(x => ({ text: x.text })) }],
            mission_schedule: [{ day: '', activity: '' }],
            report_signer_name: s.mediator_name,
            invited_participants: [{ no: '១', text: SHORT_DOTS }],
            meeting_kind: extras.meeting_kind || (extras.kind === 'MED' ? 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ' : extras.kind === 'INFO' ? 'ប្រមូលព័ត៌មាន' : ''),
            grantor_pronoun: 'ខ្ញុំ'
        };

        // Recipient / applicant for invitations
        const id = String(templateId || '');
        let rec = null;
        if (/^INV-\w+-A-/.test(id)) rec = A;
        else if (/^INV-\w+-B-/.test(id)) rec = B;
        if (rec) {
            if (rec.type === 'J') Object.assign(d, { recipient_org_name: rec.org_name, recipient_address: rec.address, recipient_representative: rec.representative, recipient_phone: rec.phone });
            else Object.assign(d, { recipient_persons: rec.persons || [], recipient_address: rec.address, recipient_phone: rec.phone, recipient_honorific: rec.honorific });
        }
        if (/^INV-\w+-B-/.test(id)) {
            if (A.type === 'J') Object.assign(d, { applicant_org_name: A.org_name, applicant_address: A.address, applicant_representative: A.representative, applicant_phone: A.phone });
            else Object.assign(d, { applicant_persons: A.persons || [], applicant_address: A.address, applicant_phone: A.phone });
        }
        // Witness
        if (/-W$/.test(id)) {
            const w = groups.witnesses[parseInt(extras.witnessIndex, 10) || 0] || {};
            Object.assign(d, {
                witness_name: clean(w.name), witness_gender: w.name ? (w.gender || 'ប្រុស') : '', witness_nationality: w.name ? (clean(w.nationality) || 'ខ្មែរ') : '',
                witness_position: clean(w.position), witness_address: w.name ? fullAddress(w.address, w.province) : '', witness_honorific: w.name ? honorificOf(w.gender) : ''
            });
        }
        // Report attendees
        if (id === 'RPT-INFO-A') d.attendees = attendeesOf([A]);
        else if (id === 'RPT-INFO-B') d.attendees = attendeesOf([B]);
        else d.attendees = attendeesOf([A].concat(groups.others));
        // Power of attorney: grantors are people of the chosen group (default ខ)
        if (id === 'DOC-POA') {
            const G = extras.grantorGroup === 'A' ? A : B;
            const ppl = (G.persons || []).map(p => ({ name: p.name, gender: p.gender, dob: p.dob, id_no: '' }));
            const src = (G === A ? (c.claimants || []) : (c.respondents || [])).filter(p => !isCompany(p) && clean(p.name));
            ppl.forEach((p, i) => { p.id_no = khNum(clean(src[i] && src[i].idNo)); });
            d.grantors = withSeps(ppl, ' និងខ្ញុំ', ' និងខ្ញុំ');
            d.grantor_address = G.address || (G.persons && G.persons[0] && G.persons[0].address) || '';
            d.grantor_pronoun = ppl.length > 1 ? 'យើងខ្ញុំ' : (ppl[0] && ppl[0].gender === 'ស្រី' ? 'នាងខ្ញុំ' : 'ខ្ញុំ');
            d.grantor_names = joinNames(ppl.map(p => p.name), ' និង ');
            d.counterparty_name = (G === A ? B : A).short_names ? (G === A ? B : A).short_names.replace(/^ឈ្មោះ /, '') : '';
        }
        if (settled === false && id === 'MIN-SETTLE') warnings.push('សំណុំរឿងនេះមិនទាន់កត់ស្ថានភាព «ព្រមព្រៀង» ទេ');

        // Values typed in the dialog win over computed ones (template field names only)
        Object.keys(extras).forEach(k => { if (/^[a-z][a-z0-9_]*$/.test(k) && k.includes('_') && extras[k] != null && extras[k] !== '') d[k] = extras[k]; });

        // Free-text parts: always left for the mediator to write in Word
        fillContentBlanks(d);
        d.withdrawal_clause_no = khNum(d.agreement_terms.length + 1);
        return { data: khmerizeDigits(d), warnings: uniq(warnings) };
    }

    function fillContentBlanks(d) {
        const str = ['close_reason', 'meeting_outcome', 'final_conclusion', 'issue_summary', 'mission_background', 'mission_purpose',
            'mission_expected_result', 'coop_reason', 'party_a_description', 'party_b_description'];
        str.forEach(k => { if (!clean(d[k])) d[k] = DOTS; });
        const list = (k, item) => { if (!Array.isArray(d[k]) || !d[k].length) d[k] = [item]; };
        list('facts', { text: SHORT_DOTS });
        list('negotiation_results', { no: '១', text: SHORT_DOTS });
        list('options', { no: '១', text: SHORT_DOTS });
        list('agreement_terms', { no: '១', text: SHORT_DOTS });
        list('party_options', null);
        if (!d.party_options[0]) d.party_options = ['ក', 'ខ'].map(l => ({ party_label: l, options: [{ no: '១', text: SHORT_DOTS }] }));
        list('meeting_results', { no: '១', summary: SHORT_DOTS, points: [{ text: SHORT_DOTS }] });
        (d.mission_case_results || []).forEach(r => {
            if (!clean(r.result_text)) r.result_text = DOTS;
            if (!clean(r.conclusion_text)) r.conclusion_text = DOTS;
            if (!Array.isArray(r.requests) || !r.requests.length) r.requests = [{ text: SHORT_DOTS }];
        });
    }
    /** All numbers in the letter as Khmer digits. */
    function khmerizeDigits(v) {
        if (typeof v === 'string') return khNum(v);
        if (Array.isArray(v)) return v.map(khmerizeDigits);
        if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach(k => { o[k] = khmerizeDigits(v[k]); }); return o; }
        return v;
    }

    /**
     * Which needed fields are still empty.
     * @param {Array} tags  structured tags of the template (strings and {loopName: [...]}) from the inspector
     */
    function missingFields(tags, data) {
        const out = [];
        (tags || []).forEach(t => {
            const key = typeof t === 'string' ? t : Object.keys(t)[0];
            if (CONTENT_FIELDS.includes(key) || OPTIONAL_FIELDS.includes(key) || out.some(m => m.key === key)) return;
            const v = data[key];
            const empty = v == null || (typeof v === 'string' && !clean(v)) || (Array.isArray(v) && !v.length);
            if (empty) out.push({ key, label: FIELD_LABELS[key] || key });
        });
        return out;
    }

    return {
        khNum, latinNum, khCountWords, parseDay, khDate, khDateFull, khTimeInvite, khTimeReport,
        DOTS, SHORT_DOTS, NADR_ADDRESS, CONTENT_FIELDS, OPTIONAL_FIELDS, FIELD_LABELS, TEMPLATES,
        pickInviteTemplate, withSeps, describeGroup, caseGroups, caseNo, buildLetterData, missingFields, khmerizeDigits
    };
});
