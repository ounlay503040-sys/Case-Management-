/* ==========================================================================
   NADR CMS Pro — page tools
   - Mac-style window buttons (close / minimize / maximize) for the frameless window
   - The same tool group on every page banner: zoom out, zoom level, zoom in, full screen
   - Banner and case-page buttons shown as icons; their label becomes a tooltip
   ========================================================================== */
(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const api = () => window.electronAPI || {};

    /* ---------- Tooltip (one floating bubble for every [data-tip]) ---------- */
    let tipEl = null, tipFor = null;
    function showTip(el) {
        const text = el.getAttribute('data-tip');
        if (!text) return;
        if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'pt-tip'; document.body.appendChild(tipEl); }
        tipEl.textContent = text;
        tipEl.classList.add('show');
        tipFor = el;
        const r = el.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
        let left = r.left + r.width / 2 - t.width / 2;
        left = Math.max(6, Math.min(left, window.innerWidth - t.width - 6));
        let top = r.bottom + 8;
        if (top + t.height > window.innerHeight - 4) top = r.top - t.height - 8;
        tipEl.style.left = left + 'px';
        tipEl.style.top = top + 'px';
    }
    function hideTip() { if (tipEl) tipEl.classList.remove('show'); tipFor = null; }
    document.addEventListener('mouseover', e => {
        const el = e.target.closest && e.target.closest('[data-tip]');
        if (el && el !== tipFor) showTip(el); else if (!el && tipFor) hideTip();
    });
    document.addEventListener('mousedown', hideTip, true);
    window.addEventListener('scroll', hideTip, true);

    /* ---------- Mac-style window buttons ---------- */
    function buildWindowButtons() {
        if ($('mac-controls') || !api().winClose) return;
        const box = document.createElement('div');
        box.id = 'mac-controls';
        box.className = 'mac-controls';
        box.innerHTML =
            '<button type="button" class="mac-btn mac-close" data-tip="បិទកម្មវិធី" aria-label="បិទកម្មវិធី"><svg viewBox="0 0 10 10"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5"/></svg></button>' +
            '<button type="button" class="mac-btn mac-min" data-tip="បង្រួមចុះ" aria-label="បង្រួមចុះ"><svg viewBox="0 0 10 10"><path d="M2 5h6"/></svg></button>' +
            '<button type="button" class="mac-btn mac-max" data-tip="ពង្រីកពេញអេក្រង់" aria-label="ពង្រីកពេញអេក្រង់"><svg viewBox="0 0 10 10"><path class="i-max" d="M3 7V3h4M7 3v4H3"/><path class="i-restore" d="M3.5 2.5h4v4M2.5 3.5v4h4"/></svg></button>';
        document.body.appendChild(box);
        box.querySelector('.mac-close').onclick = () => api().winClose();
        box.querySelector('.mac-min').onclick = () => api().winMinimize();
        box.querySelector('.mac-max').onclick = () => api().winToggleMaximize();
        const setMax = m => {
            box.classList.toggle('is-max', !!m);
            const b = box.querySelector('.mac-max');
            const tip = m ? 'បង្រួមទំហំបង្អួច' : 'ពង្រីកពេញអេក្រង់';
            b.setAttribute('data-tip', tip); b.setAttribute('aria-label', tip);
        };
        if (api().winIsMaximized) api().winIsMaximized().then(setMax).catch(() => {});
        if (api().onWinMaximized) api().onWinMaximized(setMax);
    }

    /* ---------- Icon buttons ---------- */
    // Turn "<i class=icon></i> Label" into an icon-only button whose label is a tooltip.
    function iconize(btn) {
        if (!btn || btn.__pt) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        const label = (btn.getAttribute('data-tip') || btn.textContent || btn.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        if (!label) return;
        btn.__pt = true;
        [...btn.childNodes].forEach(n => {
            if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement('span'); s.className = 'pt-label'; s.textContent = n.textContent.trim(); n.replaceWith(s); }
            else if (n.nodeType === 1 && n.tagName !== 'I') n.classList.add('pt-label');
        });
        btn.classList.add('pt-ibtn');
        if (btn.classList.contains('kt-btn-primary')) btn.classList.add('pt-primary');
        if (icon.classList.contains('fa-telegram-plane') || icon.classList.contains('fa-telegram')) btn.classList.add('pt-telegram');
        if (icon.classList.contains('fa-file-word')) btn.classList.add('pt-word');
        if (icon.classList.contains('fa-file-excel')) btn.classList.add('pt-excel');
        if (icon.classList.contains('fa-file-pdf') || (icon.classList.contains('fa-print') && btn.closest('#reports-view'))) btn.classList.add('pt-pdf');
        btn.setAttribute('data-tip', label);
        btn.setAttribute('aria-label', label);
        btn.removeAttribute('title');
    }

    /* ---------- Page tool group: zoom −, level, zoom +, full screen ---------- */
    const zoomNow = () => (typeof currentZoom !== 'undefined' ? currentZoom : parseFloat(localStorage.getItem('nadr_app_zoom')) || 0.8);
    function refreshZoomLabels() {
        const t = Math.round(zoomNow() * 100) + '%';
        document.querySelectorAll('.pt-zoom-val').forEach(e => { e.textContent = t; });
    }
    function setFsIcon(section) {
        const on = section.classList.contains('fullscreen-overlay');
        section.querySelectorAll('.pt-fs').forEach(b => {
            b.innerHTML = on ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
            const tip = on ? 'ត្រឡប់ទំហំធម្មតា' : 'ពង្រីកផ្ទាំងនេះពេញអេក្រង់';
            b.setAttribute('data-tip', tip); b.setAttribute('aria-label', tip);
        });
    }
    function toolGroup(section) {
        const g = document.createElement('div');
        g.className = 'pt-group';
        g.innerHTML =
            '<button type="button" class="pt-ibtn pt-zoom-out" data-tip="បង្រួមអក្សរ" aria-label="បង្រួមអក្សរ"><i class="fa-solid fa-minus"></i></button>' +
            '<span class="pt-zoom-val" data-tip="ទំហំអក្សរ (ចុចដើម្បីត្រឡប់ ១០០%)"></span>' +
            '<button type="button" class="pt-ibtn pt-zoom-in" data-tip="ពង្រីកអក្សរ" aria-label="ពង្រីកអក្សរ"><i class="fa-solid fa-plus"></i></button>' +
            '<span class="pt-sep"></span>' +
            '<button type="button" class="pt-ibtn pt-fs"><i class="fa-solid fa-expand"></i></button>';
        g.querySelector('.pt-zoom-out').onclick = () => { if (typeof zoomOut === 'function') zoomOut(); refreshZoomLabels(); };
        g.querySelector('.pt-zoom-in').onclick = () => { if (typeof zoomIn === 'function') zoomIn(); refreshZoomLabels(); };
        g.querySelector('.pt-zoom-val').onclick = () => {
            if (typeof currentZoom !== 'undefined' && typeof applyZoom === 'function') { currentZoom = 1; applyZoom(); }
            refreshZoomLabels();
        };
        g.querySelector('.pt-fs').onclick = () => toggleFullScreen(section);
        return g;
    }
    function toggleFullScreen(section) {
        hideTip();
        section.__maxBtn = null;
        if (typeof window.toggleSectionMaximize === 'function') window.toggleSectionMaximize(section.id, null);
        const on = section.classList.contains('fullscreen-overlay');
        document.documentElement.classList.toggle('pt-fullscreen', on);
        if (api().winSetFullScreen) api().winSetFullScreen(on);
        setFsIcon(section);
    }
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const s = document.querySelector('section.view-section.fullscreen-overlay');
        if (s && document.documentElement.classList.contains('pt-fullscreen')) toggleFullScreen(s);
    });

    /* ---------- Reports: file/share buttons go to the banner; the report refreshes by itself ---------- */
    function setupReports() {
        const sec = $('reports-view');
        if (!sec || sec.__ptReports) return;
        sec.__ptReports = true;
        const box = bannerActions(sec);
        if (box) ['btn-print-report', 'btn-export-word', 'btn-export-excel', 'btn-share-report-telegram'].forEach(id => {
            const b = $(id); if (!b) return;
            b.removeAttribute('style');
            b.className = 'kt-btn';
            box.appendChild(b);
        });
        let timer = null;
        const regen = () => { clearTimeout(timer); timer = setTimeout(() => { if (typeof generateReport === 'function') generateReport(true); }, 150); };
        sec.addEventListener('change', e => { if (e.target.closest('.pt-actions')) return; if (e.target.matches('select, input')) regen(); });
        sec.addEventListener('click', e => { if (e.target.closest('[data-months]')) regen(); });
    }

    /* ---------- Night mode: a round button in the title bar ---------- */
    function setupThemeButton() {
        const btn = $('theme-toggle'), right = document.querySelector('.top-header .tb-right');
        if (!btn || !right || btn.__pt) return;
        btn.__pt = true;
        btn.className = 'pt-theme';
        right.insertBefore(btn, right.firstChild);
        const sync = () => {
            const dark = document.documentElement.classList.contains('dark-theme');
            const tip = dark ? 'ប្ដូរទៅពណ៌ភ្លឺ' : 'ប្ដូរទៅពណ៌ងងឹត';
            btn.setAttribute('data-tip', tip); btn.setAttribute('aria-label', tip);
        };
        sync();
        btn.addEventListener('click', () => setTimeout(sync, 0));
    }

    function bannerActions(section) {
        const dsb = section.querySelector('.dsb-header');
        if (dsb) return dsb.querySelector('.dsb-actions');
        const head = section.querySelector('.kt-page-head, .section-title-box');
        if (!head) return null;
        let box = head.querySelector('.kt-page-actions, .section-actions');
        if (!box) { box = document.createElement('div'); box.className = 'kt-page-actions'; head.appendChild(box); }
        return box;
    }
    function setupPage(section) {
        if (section.__pt) return;
        const box = bannerActions(section);
        if (!box) return;
        section.__pt = true;
        // the old text "ពង្រីក" buttons are replaced by the tool group
        box.querySelectorAll('button').forEach(b => {
            if (b.id === 'btn-toggle-cases-maximize' || (b.querySelector('.fa-expand, .fa-compress') && !b.closest('.pt-group'))) b.remove();
        });
        box.querySelectorAll('button').forEach(iconize);
        box.classList.add('pt-actions');
        box.appendChild(toolGroup(section));
        setFsIcon(section);
    }
    function setupAll() {
        setupThemeButton();
        setupReports();
        document.querySelectorAll('section.view-section').forEach(setupPage);
        document.querySelectorAll('#view-modal .cp-actions button').forEach(iconize);
        refreshZoomLabels();
    }

    function init() {
        buildWindowButtons();
        // app.js adds its own "ពង្រីក" buttons after 500 ms; set up after that
        setTimeout(setupAll, 900);
        // keep the zoom level in step with the sidebar zoom control
        const uz = window.updateZoomDisplay;
        if (typeof uz === 'function' && !uz.__pt) {
            window.updateZoomDisplay = function () { const r = uz.apply(this, arguments); refreshZoomLabels(); return r; };
            window.updateZoomDisplay.__pt = true;
        }
        // full screen can also be left by other code (Esc etc.)
        document.addEventListener('click', () => setTimeout(() => document.querySelectorAll('section.view-section').forEach(s => s.__pt && setFsIcon(s)), 0), true);
        // the case page footer is rebuilt when a case opens
        const ov = window.openViewModal;
        if (typeof ov === 'function' && !ov.__pt) {
            window.openViewModal = function () { const r = ov.apply(this, arguments); setTimeout(() => document.querySelectorAll('#view-modal .cp-actions button').forEach(iconize), 0); return r; };
            Object.assign(window.openViewModal, ov, { __pt: true });
            try { openViewModal = window.openViewModal; } catch (e) { /* not reassignable */ }
        }
    }

    window.ptSetupPages = setupAll;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
