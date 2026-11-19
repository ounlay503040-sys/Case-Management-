/* Unit tests for js/letters-core.js — run:
   ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron.exe tests/letters-core.test.js */
'use strict';
const assert = require('assert');
const L = require('../js/letters-core.js');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log('  ✓ ' + name); }
    catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}

console.log('Khmer numbers');
test('latin → khmer digits', () => assert.strictEqual(L.khNum('070 503 040'), '០៧០ ៥០៣ ០៤០'));
test('khmer → latin digits', () => assert.strictEqual(L.latinNum('២០២៦'), '2026'));
test('count words', () => { assert.strictEqual(L.khCountWords(3), '៣ (បី)'); assert.strictEqual(L.khCountWords('5'), '៥ (ប្រាំ)'); });

console.log('Dates');
test('ISO date', () => assert.strictEqual(L.khDate('2026-07-09'), 'ថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦'));
test('two-digit day, every month name', () => {
    const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    months.forEach((m, i) => assert.strictEqual(L.khDate(`2026-${String(i + 1).padStart(2, '0')}-21`), `ថ្ងៃទី២១ ខែ${m} ឆ្នាំ២០២៦`));
});
test('day-first date and Khmer digits', () => { assert.strictEqual(L.khDate('09/07/2026'), 'ថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦'); assert.strictEqual(L.khDate('២០២៦-០៧-០៩'), 'ថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦'); });
test('empty or invalid date → empty', () => { assert.strictEqual(L.khDate(''), ''); assert.strictEqual(L.khDate('2026-02-30'), ''); assert.strictEqual(L.khDate(null), ''); });
test('full date with weekday (README example)', () => assert.strictEqual(L.khDateFull('2026-05-13'), 'ថ្ងៃពុធ ទី១៣ ខែឧសភា ឆ្នាំ២០២៦'));
test('full date — Monday 16 Nov 2026', () => assert.strictEqual(L.khDateFull('2026-11-16'), 'ថ្ងៃចន្ទ ទី១៦ ខែវិច្ឆិកា ឆ្នាំ២០២៦'));
test('full date — every weekday', () => {
    const want = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    for (let i = 0; i < 7; i++) assert.ok(L.khDateFull(`2026-11-${15 + i}`).startsWith('ថ្ងៃ' + want[i] + ' '));
});
test('leap day', () => assert.strictEqual(L.khDate('2028-02-29'), 'ថ្ងៃទី២៩ ខែកុម្ភៈ ឆ្នាំ២០២៨'));

console.log('Times');
test('invite time afternoon', () => assert.strictEqual(L.khTimeInvite('13:00'), '១:០០ នាទីរសៀល'));
test('invite time morning', () => assert.strictEqual(L.khTimeInvite('09:30'), '៩:៣០ នាទីព្រឹក'));
test('invite time noon', () => assert.strictEqual(L.khTimeInvite('12:00'), '១២:០០ នាទីថ្ងៃត្រង់'));
test('report time start/end', () => { assert.strictEqual(L.khTimeReport('14:00'), '២ និង ០០ នាទីរសៀល'); assert.strictEqual(L.khTimeReport('17:00'), '៥ និង ០០ នាទីរសៀល'); });
test('report time morning', () => assert.strictEqual(L.khTimeReport('08:05'), '៨ និង ០៥ នាទីព្រឹក'));
test('bad time → empty', () => { assert.strictEqual(L.khTimeInvite(''), ''); assert.strictEqual(L.khTimeReport('25:00'), ''); });

console.log('Names and separators');
test('3 people → ", " " និង" ""', () => assert.deepStrictEqual(L.withSeps([{}, {}, {}]).map(x => x.sep), [', ', ' និង', '']));
test('4 people', () => assert.deepStrictEqual(L.withSeps([{}, {}, {}, {}]).map(x => x.sep), [', ', ', ', ' និង', '']));
test('1 person', () => assert.deepStrictEqual(L.withSeps([{}]).map(x => x.sep), ['']));

console.log('Template choice (README section 2)');
const pick = L.pickInviteTemplate;
test('J vs N', () => { assert.strictEqual(pick('MED', 'A', 'J'), 'INV-MED-A-J'); assert.strictEqual(pick('MED', 'B', 'N', 'J'), 'INV-MED-B-N-J'); });
test('J vs J', () => { assert.strictEqual(pick('INFO', 'A', 'J'), 'INV-INFO-A-J'); assert.strictEqual(pick('INFO', 'B', 'J', 'J'), 'INV-INFO-B-J-J'); });
test('N vs N', () => { assert.strictEqual(pick('INFO', 'A', 'N'), 'INV-INFO-A-N'); assert.strictEqual(pick('INFO', 'B', 'N', 'N'), 'INV-INFO-B-N-N'); });
test('N vs J', () => { assert.strictEqual(pick('MED', 'A', 'N'), 'INV-MED-A-N'); assert.strictEqual(pick('MED', 'B', 'J', 'N'), 'INV-MED-B-J-N'); });
test('witness', () => { assert.strictEqual(pick('INFO', 'W'), 'INV-INFO-W'); assert.strictEqual(pick('MED', 'W'), 'INV-MED-W'); });
test('bad kind throws', () => assert.throws(() => pick('XX', 'A', 'J')));

console.log('Case data');
const person = (name, gender, extra) => Object.assign({ type: 'individual', name, gender, nationality: 'ខ្មែរ', address: 'ភូមិពេជ្រចិន្តា ឃុំពេជ្រចិន្តា ស្រុកភ្នំព្រឹក', province: 'បាត់ដំបង' }, extra);
const bank = { type: 'company', comName: 'ធនាគារ ហត្ថា ម.ក', comBranch: 'សាខាខណ្ឌដង្កោ', comAddress: 'ភូមិបុរីកម្មករ សង្កាត់ជើងឯក ខណ្ឌដង្កោ', province: 'ភ្នំពេញ', comPhone: '081 752 051', hasRep: true, repRole: 'មេធាវី', repName: 'មាឃ វ៉ុន', repId: '2197', repFirm: 'ក្រុមមេធាវី ដឺហ្វ្លេក' };
const baseCase = { caseNumber: '1212', filingDate: '2026-07-09', assignedDate: '2026-07-10', assignmentLetterNo: '2098/26 រប.អ.ដ.ក.', category: 'វិវាទជំពាក់ប្រាក់', disputeSubject: 'កិច្ចសន្យាខ្ចីប្រាក់' };
const settings = { mediator_title: 'លោក', mediator_name: 'ឡាយ អូន', mediator_phone: '070 503 040', lunar_year: 'ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០' };
test('case number and date', () => { const { data } = L.buildLetterData('INV-INFO-A-J', Object.assign({ claimants: [bank], respondents: [person('ក', 'ប្រុស')] }, baseCase), settings, {}); assert.strictEqual(data.case_no, '១២១២/២៦'); assert.strictEqual(data.case_date, 'ថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦'); });
test('company: name + branch, lawyer, Khmer phone', () => {
    const { data } = L.buildLetterData('INV-MED-A-J', Object.assign({ claimants: [bank], respondents: [person('លឹម សុផាត', 'ប្រុស')] }, baseCase), settings, { meetingDate: '2026-11-16', meetingTime: '13:00' });
    assert.strictEqual(data.recipient_org_name, 'ធនាគារ ហត្ថា ម.ក សាខាខណ្ឌដង្កោ');
    assert.strictEqual(data.recipient_representative, 'មេធាវី មាឃ វ៉ុន អត្តលេខ២១៩៧ នៅក្រុមមេធាវី ដឺហ្វ្លេក');
    assert.strictEqual(data.recipient_phone, '០៨១ ៧៥២ ០៥១');
    assert.strictEqual(data.recipient_address, 'ភូមិបុរីកម្មករ សង្កាត់ជើងឯក ខណ្ឌដង្កោ រាជធានីភ្នំពេញ');
    assert.strictEqual(data.meeting_time, '១:០០ នាទីរសៀល');
});
test('3 people, same address → shared address, seps', () => {
    const c = Object.assign({ claimants: [bank], respondents: [person('លឹម សុផាត', 'ប្រុស', { dob: '1992-07-12' }), person('លឹម ថានី', 'ស្រី'), person('វ៉ុន ថន', 'ប្រុស')] }, baseCase);
    const { data } = L.buildLetterData('INV-MED-B-N-J', c, settings, {});
    assert.deepStrictEqual(data.recipient_persons.map(p => p.sep), [', ', ' និង', '']);
    assert.ok(data.recipient_persons.every(p => p.address === ''));
    assert.strictEqual(data.recipient_address, 'ភូមិពេជ្រចិន្តា ឃុំពេជ្រចិន្តា ស្រុកភ្នំព្រឹក ខេត្តបាត់ដំបង');
    assert.strictEqual(data.recipient_persons[0].dob, 'ថ្ងៃទី១២ ខែកក្កដា ឆ្នាំ១៩៩២');
    assert.strictEqual(data.recipient_honorific, 'លោក-លោកស្រី');
    assert.strictEqual(data.applicant_org_name, 'ធនាគារ ហត្ថា ម.ក សាខាខណ្ឌដង្កោ');
});
test('people at different addresses → address on each person', () => {
    const c = Object.assign({ claimants: [person('ក', 'ប្រុស'), person('ខ', 'ស្រី', { address: 'ភូមិស្វាយតាមេឃ ឃុំកោះធំខ ស្រុកកោះធំ', province: 'កណ្តាល' })], respondents: [bank] }, baseCase);
    const { data } = L.buildLetterData('INV-INFO-A-N', c, settings, {});
    assert.strictEqual(data.recipient_address, '');
    assert.strictEqual(data.recipient_persons[1].address, 'ភូមិស្វាយតាមេឃ ឃុំកោះធំខ ស្រុកកោះធំ ខេត្តកណ្តាល');
});
test('one woman → លោកស្រី', () => { const { data } = L.buildLetterData('INV-INFO-A-N', Object.assign({ claimants: [person('ក', 'ស្រី')], respondents: [bank] }, baseCase), settings, {}); assert.strictEqual(data.recipient_honorific, 'លោកស្រី'); });
test('content parts are left blank with dots', () => {
    const { data } = L.buildLetterData('RPT-MED', Object.assign({ claimants: [bank], respondents: [person('ក', 'ប្រុស')] }, baseCase), settings, {});
    assert.strictEqual(data.issue_summary, L.DOTS);
    assert.strictEqual(data.meeting_outcome, L.DOTS);
    assert.deepStrictEqual(data.party_options[0].options, [{ no: '១', text: '......' }]);
    assert.deepStrictEqual(data.facts, [{ text: '......' }]);
    assert.strictEqual(data.withdrawal_clause_no, '២');
});
test('issue dates left for handwriting', () => {
    const { data } = L.buildLetterData('REQ-CLOSE', Object.assign({ claimants: [bank], respondents: [person('ក', 'ប្រុស')] }, baseCase), settings, { meetingDate: '2026-11-16' });
    assert.strictEqual(data.issue_lunar_date, 'ថ្ងៃ                    ខែ                ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០');
    assert.strictEqual(data.issue_date, 'ថ្ងៃទី          ខែ          ឆ្នាំ២០២៦');
});
test('ខ and គ are two groups; witnesses separate', () => {
    const c = Object.assign({ claimants: [bank], respondents: [person('ក', 'ប្រុស')], thirdParties: [Object.assign(person('អ្នកធានា', 'ស្រី'), { thirdPartyRole: 'អ្នកធានា' }), Object.assign(person('បូ ប៊ិន', 'ប្រុស'), { thirdPartyRole: 'សាក្សី / ភាគីបន្ទាប់បន្សំ', position: 'មេភូមិអូរអង្គំ' })] }, baseCase);
    const g = L.caseGroups(c);
    assert.strictEqual(g.others.length, 2); assert.strictEqual(g.others[1].label, 'គ'); assert.strictEqual(g.witnesses.length, 1);
    const { data } = L.buildLetterData('INV-INFO-B-N-J', c, settings, { recipient: 'B1' });
    assert.strictEqual(data.recipient_persons[0].name, 'អ្នកធានា');
    const w = L.buildLetterData('INV-MED-W', c, settings, {}).data;
    assert.strictEqual(w.witness_name, 'បូ ប៊ិន'); assert.strictEqual(w.witness_position, 'មេភូមិអូរអង្គំ'); assert.strictEqual(w.witness_honorific, 'លោក');
});
test('missing fields are listed in Khmer', () => {
    const { data } = L.buildLetterData('INV-INFO-A-J', { caseNumber: '5', claimants: [Object.assign({}, bank, { hasRep: false })], respondents: [] }, {}, {});
    const miss = L.missingFields(['recipient_representative', 'meeting_date', 'facts', 'issue_date', 'mediator_name'], data);
    assert.deepStrictEqual(miss.map(m => m.key), ['recipient_representative', 'meeting_date', 'mediator_name']);
    assert.ok(/[ក-៿]/.test(miss[0].label));
});
test('dialog values override computed ones', () => { const { data } = L.buildLetterData('DOC-ATTEND', baseCase, settings, { meeting_title: 'ផ្តល់ព័ត៌មាន ភាគីស្នើសុំ' }); assert.strictEqual(data.meeting_title, 'ផ្តល់ព័ត៌មាន ភាគីស្នើសុំ'); });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
