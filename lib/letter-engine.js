/* ==========================================================================
   NADR CMS Pro — Letter engine (main process / Node)
   Fills a .docx template's {{...}} placeholders with docxtemplater + pizzip.
   The template's layout, fonts and fixed text are never changed.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

// The libraries live in vendor/docxlibs (not "node_modules", so the build and git keep them).
const LIB_DIR = path.join(__dirname, '..', 'vendor', 'docxlibs');
(function addLibPath() {
    const Module = require('module');
    const cur = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean);
    if (!cur.includes(LIB_DIR)) {
        process.env.NODE_PATH = [LIB_DIR].concat(cur).join(path.delimiter);
        Module._initPaths();
    }
})();
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module.js');

const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'letters');
const OPTIONS = { delimiters: { start: '{{', end: '}}' }, paragraphLoop: true, linebreaks: true };

/** { 'INV-INFO-A-J': 'C:\\…\\01_លិខិតអញ្ជើញ\\INV-INFO-A-J_….docx', … } */
function listTemplates(dir = TEMPLATE_DIR) {
    const out = {};
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.docx$/i.test(e.name) && !e.name.startsWith('~$')) out[e.name.split('_')[0]] = p;
    });
    walk(dir);
    return out;
}

function simplify(tags) {
    const out = [];
    tags.forEach(t => {
        const v = t.subparsed ? { [t.value]: simplify(t.subparsed) } : t.value;
        if (typeof v === 'string' ? !out.includes(v) : !out.some(o => typeof o === 'object' && Object.keys(o)[0] === t.value)) out.push(v);
    });
    return out;
}
/** Structured placeholders of a template: ['case_no', {attendees: ['title','name','role']}, …] */
function inspectTemplate(templatePath) {
    const iModule = new InspectModule();
    new Docxtemplater(new PizZip(fs.readFileSync(templatePath)), Object.assign({ modules: [iModule] }, OPTIONS));
    return simplify(iModule.getAllStructuredTags());
}

/**
 * Fill a template. Returns { buffer, text, missing } — `missing` lists simple tags that had no value.
 * Throws an Error with a readable `.details` list when the template cannot be filled.
 */
function renderTemplate(templatePath, data) {
    const missing = new Set();
    let doc;
    try {
        doc = new Docxtemplater(new PizZip(fs.readFileSync(templatePath)), Object.assign({
            nullGetter(part) { if (!part.module) missing.add(part.value); return ''; }
        }, OPTIONS));
        doc.render(data);
    } catch (e) {
        const errs = (e.properties && e.properties.errors) || [];
        const err = new Error('បំពេញគម្រូមិនបាន៖ ' + path.basename(templatePath));
        err.details = errs.map(x => (x.properties && x.properties.explanation) || x.message);
        if (!err.details.length) err.details = [e.message];
        throw err;
    }
    const text = doc.getFullText();
    if (/\{\{|\}\}/.test(text)) {
        const err = new Error('នៅសល់ {{ }} ក្នុងលិខិត៖ ' + path.basename(templatePath));
        err.details = [text.slice(Math.max(0, text.indexOf('{{') - 40), text.indexOf('{{') + 60)];
        throw err;
    }
    return { buffer: doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }), text, missing: [...missing] };
}

module.exports = { TEMPLATE_DIR, LIB_DIR, listTemplates, inspectTemplate, renderTemplate };
