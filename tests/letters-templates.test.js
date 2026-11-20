/* Fills every template in templates/letters — run:
   ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron.exe tests/letters-templates.test.js [outDir]
   1. all 29 templates with tests/fixtures/sample_data.json
   2. the 4 party combinations (J/N) and a 3-person party, through buildLetterData */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const engine = require('../lib/letter-engine.js');
const L = require('../js/letters-core.js');

const outDir = process.argv[2] || '';
if (outDir) fs.mkdirSync(outDir, { recursive: true });
let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log('  ✓ ' + name); }
    catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + e.message + (e.details ? '\n      ' + e.details.join('\n      ') : '')); }
}
const templates = engine.listTemplates();
const save = (name, buf) => { if (outDir) fs.writeFileSync(path.join(outDir, name + '.docx'), buf); };

console.log('1. sample_data.json → all templates');
test('29 templates found', () => assert.strictEqual(Object.keys(templates).length, 29));
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_data.json'), 'utf8'));
Object.entries(templates).forEach(([id, p]) => test(id, () => {
    const r = engine.renderTemplate(p, sample);
    assert.ok(!r.text.includes('{{'), 'placeholder left');
    assert.deepStrictEqual(r.missing, [], 'no value for: ' + r.missing.join(', '));
    save('sample_' + id, r.buffer);
}));

console.log('\n2. case data → letters');
const settings = { mediator_title: 'លោក', mediator_name: 'ឡាយ អូន', mediator_gender: 'ប្រុស', mediator_pronoun: 'ខ្ញុំបាទ', mediator_phone: '070 503 040', sg_honorific: 'ឯកឧត្តម', sg_name: 'យ៉ម ផារ៉ូត', lunar_year: 'ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០' };
const bank = { type: 'company', comName: 'ធនាគារ ហត្ថា ម.ក', comBranch: 'សាខាខណ្ឌដង្កោ', comAddress: 'ភូមិបុរីកម្មករ សង្កាត់ជើងឯក ខណ្ឌដង្កោ', province: 'ភ្នំពេញ', comPhone: '081 752 051', hasRep: true, repRole: 'មេធាវី', repName: 'មាឃ វ៉ុន', repId: '2197', repFirm: 'ក្រុមមេធាវី ដឺហ្វ្លេក' };
const mfi = { type: 'company', comName: 'គ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុ ប្រាសាក់', comBranch: 'សាខាកំពង់ស្ពឺ', comAddress: 'ភូមិទី១ សង្កាត់រកាធំ ក្រុងច្បារមន', province: 'កំពង់ស្ពឺ', comPhone: '023 999 111', hasRep: true, repRole: 'អ្នកតំណាងស្របច្បាប់', repName: 'ហ៊ី ភាព', repGender: 'ប្រុស' };
const person = (name, gender, extra) => Object.assign({ type: 'individual', name, gender, nationality: 'ខ្មែរ', phone: '012 345 678', address: 'ភូមិពេជ្រចិន្តា ឃុំពេជ្រចិន្តា ស្រុកភ្នំព្រឹក', province: 'បាត់ដំបង' }, extra);
const base = { caseNumber: '1212', filingDate: '2026-07-09', assignedDate: '2026-07-10', assignmentLetterNo: '2098/26 រប.អ.ដ.ក.', applicationDate: '2026-06-29', category: 'វិវាទជំពាក់ប្រាក់', disputeSubject: 'កិច្ចសន្យាខ្ចីប្រាក់', locationCommune: 'ភូមិពេជ្រចិន្តា ឃុំពេជ្រចិន្តា ស្រុកភ្នំព្រឹក', locationProvince: 'បាត់ដំបង', meetingPartyACount: '1', meetingPartyBCount: '1', mediationMeetingCount: '3', mediationMeetingDate: '2026-11-16', status: 'Settle (ព្រមព្រៀង)' };
const three = [person('លឹម សុផាត', 'ប្រុស', { dob: '1992-07-12' }), person('លឹម ថានី', 'ស្រី', { dob: '1995-09-19' }), person('វ៉ុន ថន', 'ប្រុស', { dob: '1949-02-21' })];
const cases = {
    'J-vs-N': { claimants: [bank], respondents: [person('លឹម សុផាត', 'ប្រុស')] },
    'J-vs-J': { claimants: [bank], respondents: [mfi] },
    'N-vs-N': { claimants: [person('គ្រុយ គឹមស៊', 'ប្រុស', { address: 'ភូមិស្វាយតាមេឃ ឃុំកោះធំខ ស្រុកកោះធំ', province: 'កណ្តាល' })], respondents: [person('សៅ ហេង', 'ស្រី')] },
    'N-vs-J': { claimants: [person('គ្រុយ គឹមស៊', 'ប្រុស')], respondents: [mfi] },
    'J-vs-3N': { claimants: [bank], respondents: three, thirdParties: [Object.assign(person('បូ ប៊ិន', 'ប្រុស'), { thirdPartyRole: 'សាក្សី / ភាគីបន្ទាប់បន្សំ', position: 'មេភូមិអូរអង្គំ' })] }
};
const extras = { meetingDate: '2026-11-16', meetingTime: '13:00', timeStart: '14:00', timeEnd: '17:00', round: '2', meeting_title: 'សម្រុះសម្រួលផ្សះផ្សាវិវាទ លើកទី២' };
const expected = { 'J-vs-N': ['INV-*-A-J', 'INV-*-B-N-J'], 'J-vs-J': ['INV-*-A-J', 'INV-*-B-J-J'], 'N-vs-N': ['INV-*-A-N', 'INV-*-B-N-N'], 'N-vs-J': ['INV-*-A-N', 'INV-*-B-J-N'], 'J-vs-3N': ['INV-*-A-J', 'INV-*-B-N-J'] };

Object.entries(cases).forEach(([label, parties]) => {
    const c = Object.assign({}, base, parties);
    const g = L.caseGroups(c);
    ['INFO', 'MED'].forEach(kind => {
        const ids = [L.pickInviteTemplate(kind, 'A', g.A.type), L.pickInviteTemplate(kind, 'B', g.others[0].type, g.A.type)];
        ids.forEach((id, i) => test(`${label} ${kind}: ${id}`, () => {
            assert.strictEqual(id, expected[label][i].replace('*', kind));
            const { data } = L.buildLetterData(id, c, settings, extras);
            const r = engine.renderTemplate(templates[id], data);
            assert.ok(!r.text.includes('{{'));
            assert.ok(r.text.includes('១២១២/២៦ សវ ចុះថ្ងៃទី៩ ខែកក្កដា ឆ្នាំ២០២៦'), 'case number line');
            assert.ok(r.text.includes('ថ្ងៃទី១៦ ខែវិច្ឆិកា ឆ្នាំ២០២៦ វេលាម៉ោង ១:០០ នាទីរសៀល'), 'meeting line');
            // the template's own fixed text (e.g. the ornament "3") is not ours to change: check only the filled values
            const vals = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(vals) : (v && typeof v === 'object') ? Object.values(v).flatMap(vals) : [];
            const filled = vals(data).join(' | ');
            assert.ok(!/[0-9]/.test(filled), 'latin digits in filled values: ' + (filled.match(/.{0,20}[0-9].{0,20}/) || [''])[0]);
            if (label === 'J-vs-3N' && i === 1) assert.ok(r.text.includes('ឈ្មោះ លឹម សុផាត ភេទប្រុស សញ្ជាតិខ្មែរ កើតថ្ងៃទី១២ ខែកក្កដា ឆ្នាំ១៩៩២, ឈ្មោះ លឹម ថានី ភេទស្រី សញ្ជាតិខ្មែរ កើតថ្ងៃទី១៩ ខែកញ្ញា ឆ្នាំ១៩៩៥ និងឈ្មោះ វ៉ុន ថន'), '3 names joined');
            save(`${label}_${id}`, r.buffer);
        }));
    });
});

// Every other template, for the 3-person case
const c3 = Object.assign({}, base, cases['J-vs-3N']);
Object.keys(templates).filter(id => !/^INV-\w+-[AB]-/.test(id)).forEach(id => test(`J-vs-3N ${id}`, () => {
    const { data } = L.buildLetterData(id, c3, settings, Object.assign({ kind: /MED/.test(id) ? 'MED' : 'INFO' }, extras));
    const r = engine.renderTemplate(templates[id], data);
    assert.ok(!r.text.includes('{{'));
    if (id === 'RPT-MED') assert.ok(r.text.includes('ផ្សះផ្សាវិវាទ (លើកទី២)នាថ្ងៃចន្ទ ទី១៦ ខែវិច្ឆិកា ឆ្នាំ២០២៦ វេលាម៉ោង ២ និង ០០ នាទីរសៀល'));
    if (id === 'RPT-MED') assert.ok(r.text.includes('លោកស្រី លឹម ថានី ជាភាគីម្ខាងទៀត ហៅកាត់ថា សហភាគី “ខ”'));
    if (id === 'REQ-CLOSE') assert.ok(r.text.includes('សរុបចំនួន ៥ លើក ក្នុងនោះមានកិច្ចប្រជុំផ្តល់ព័ត៌មានចំនួន ២ លើក'));
    if (id === 'INV-MED-W') assert.ok(r.text.includes('ឈ្មោះ បូ ប៊ិន ភេទប្រុស សញ្ជាតិខ្មែរ ជាមេភូមិអូរអង្គំ'));
    if (id === 'DOC-ATTEND') assert.ok(r.text.includes('១លោក ឡាយ អូនប្រុសមន្ត្រីសម្រុះសម្រួលដោះស្រាយវិវាទអ.ដ.ក.០៧០ ៥០៣ ០៤០២'));
    if (id === 'MIN-SETTLE') assert.ok(r.text.includes(L.DOTS + ' (ហៅកាត់ថា ភាគី “ក”)'));
    save(`J-vs-3N_${id}`, r.buffer);
}));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
