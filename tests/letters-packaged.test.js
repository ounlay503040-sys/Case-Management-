// The installed app has no project node_modules: the letter engine must load and
// inspect every template using only vendor/docxlibs. (Caught a missing "lodash".)
// Run: ELECTRON_RUN_AS_NODE=1 electron.exe tests/letters-packaged.test.js
const path = require('path'), Module = require('module');
Module._nodeModulePaths = () => [];
Module.globalPaths.length = 0;
const eng = require(path.join(__dirname, '..', 'lib', 'letter-engine.js'));
const t = eng.listTemplates();
let pass = 0, fail = 0;
for (const id of Object.keys(t)) {
    try { eng.inspectTemplate(t[id]); pass++; } catch (e) { fail++; console.log('FAIL', id, e.message.split('\n')[0]); }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
