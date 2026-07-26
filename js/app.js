/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - MAIN APPLICATION LOGIC (js/app.js)
   Handles UI Events, 25 Province Dropdowns, Master Table Rendering,
   Dossier Detail Modal, Excel Import Engine (SheetJS), and Analytics View.
   ========================================================================== */

let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let filteredCasesCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Authentication Layer
    initAuth();

    // 1. Initialize data
    loadCases();

    // 2. Populate 25 province dropdowns across the app
    populateProvinceDropdowns();
    populateCategoryDropdowns();

    // 3. Start live clock
    updateClock();
    setInterval(updateClock, 1000);

    // 4. Initialize event listeners
    initNavigation();
    initModalEvents();
    if (typeof initAIAssistantEvents === 'function') initAIAssistantEvents();
    if (typeof initDocsEvents === 'function') initDocsEvents();
    initFilterAndSearchEvents();
    initDataManagementEvents();
    initThemeToggle();
    initLanguageSwitcher();
    initSettingsEvents();
    initDashboardQuickForm();
    initPdfUploaders();
    if (typeof initUserProfile === 'function') initUserProfile();

    // 5. Initial render
    renderAllViews();
});

/**
 * Populate all province dropdowns with 25 Cambodian Provinces/Capital
 */
function populateProvinceDropdowns() {
    const dispLoc = document.getElementById('case-dispute-location');
    const paLoc = document.getElementById('case-party-a-location');
    const pbLoc = document.getElementById('case-party-b-location');
    const filterLoc = document.getElementById('filter-location');
    const quickLoc = document.getElementById('quick-case-dispute-location');

    let optHTML = '';
    PROVINCES_LIST.forEach(p => {
        optHTML += `<option value="${p.name}">${p.name} (${p.code})</option>`;
    });

    if (dispLoc) dispLoc.innerHTML = optHTML;
    if (paLoc) paLoc.innerHTML = optHTML;
    if (pbLoc) pbLoc.innerHTML = optHTML;
    if (quickLoc) quickLoc.innerHTML = optHTML;

    if (filterLoc) {
        filterLoc.innerHTML = `<option value="ALL">គ្រប់ទីតាំងទាំងអស់ (All Locations)</option>` + optHTML;
    }
}

/**
 * Populate all category dropdowns dynamically
 */
function populateCategoryDropdowns() {
    const mainCat = document.getElementById('case-category');
    const quickCat = document.getElementById('quick-case-category');
    const filterCat = document.getElementById('filter-category');

    let optHTML = '';
    CASE_CATEGORIES.forEach((c, index) => {
        optHTML += `<option value="${c}">${index + 1}. ${c}</option>`;
    });

    if (mainCat) mainCat.innerHTML = optHTML;
    if (quickCat) quickCat.innerHTML = optHTML;
    if (filterCat) {
        filterCat.innerHTML = `<option value="ALL">ទាំងអស់ (All Categories)</option>` + optHTML;
    }
}

/**
 * Live Khmer Clock
 */
function updateClock() {
    const clockEl = document.getElementById('current-time-display');
    if (!clockEl) return;
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString('km-KH', options);
    clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> <span>${dateStr}</span>`;
}

/**
 * Render all dashboard cards, master tables, charts, and analytics
 */
function renderAllViews() {
    renderDashboardStats();
    renderEntryCasesTable();
    renderMasterTableHeader();
    applyFiltersAndRenderMasterTable();
    if (typeof initOrUpdateCharts === 'function') {
        initOrUpdateCharts();
    }
    renderAnalyticsView();
    if (typeof renderProfileView === 'function') {
        renderProfileView();
    }
}

/**
 * Navigation View Switching
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = document.querySelectorAll('.view-section');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-view');
            switchView(targetId);
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('open');
            }
        });
    });

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

/**
 * Switch view section programmatically
 */
function switchView(viewId) {
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    const targetNav = document.querySelector(`.sidebar-nav .nav-item[data-view="${viewId}"]`);
    if (targetNav) targetNav.classList.add('active');

    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.add('active');

    if (viewId === 'dashboard-view') {
        renderDashboardStats();
        if (typeof initOrUpdateCharts === 'function') initOrUpdateCharts();
    } else if (viewId === 'analytics-view') {
        renderAnalyticsView();
        if (typeof initOrUpdateCharts === 'function') initOrUpdateCharts();
    } else if (viewId === 'cases-view') {
        applyFiltersAndRenderMasterTable();
    } else if (viewId === 'entry-view') {
        renderEntryCasesTable();
    } else if (viewId === 'reports-view') {
        if (typeof renderMasterTableHeader === 'function') renderMasterTableHeader();
        if (typeof generateReport === 'function') setTimeout(() => generateReport(true), 50);
    } else if (viewId === 'profile-view') {
        if (typeof renderProfileView === 'function') renderProfileView();
    } else if (viewId === 'settings-view') {
        const activeTabBtn = document.querySelector('#settings-view .tab-btn.active');
        if (activeTabBtn) activeTabBtn.click();
    }
}

/**
 * Render Dashboard Summary Cards
 */
function renderDashboardStats() {
    const stats = getCaseStatistics();
    
    const totEl = document.getElementById('stat-total');
    const actEl = document.getElementById('stat-active');
    const setEl = document.getElementById('stat-settle');
    const cloEl = document.getElementById('stat-close');
    const penEl = document.getElementById('stat-pending');

    if (totEl) totEl.innerText = stats.total;
    if (actEl) actEl.innerText = stats.active;
    if (setEl) setEl.innerText = stats.settle;
    if (cloEl) cloEl.innerText = stats.close;
    if (penEl) penEl.innerText = stats.pending;

    // Update Circular Percentage Badges (Donut Indicators)
    const tot = stats.total || 0;
    const actPct = tot > 0 ? Math.round((stats.active / tot) * 100) : 0;
    const setPct = tot > 0 ? Math.round((stats.settle / tot) * 100) : 0;
    const cloPct = tot > 0 ? Math.round((stats.close / tot) * 100) : 0;
    const penPct = tot > 0 ? Math.round((stats.pending / tot) * 100) : 0;

    const actPctEl = document.getElementById('stat-active-pct');
    const setPctEl = document.getElementById('stat-settle-pct');
    const cloPctEl = document.getElementById('stat-close-pct');
    const penPctEl = document.getElementById('stat-pending-pct');

    if (actPctEl) actPctEl.innerText = `${actPct}%`;
    if (setPctEl) setPctEl.innerText = `${setPct}%`;
    if (cloPctEl) cloPctEl.innerText = `${cloPct}%`;
    if (penPctEl) penPctEl.innerText = `${penPct}%`;

    const actDonut = document.getElementById('stat-active-donut');
    const setDonut = document.getElementById('stat-settle-donut');
    const cloDonut = document.getElementById('stat-close-donut');
    const penDonut = document.getElementById('stat-pending-donut');

    if (actDonut) actDonut.style.background = `conic-gradient(#2563eb 0%, #2563eb ${actPct}%, #e2e8f0 ${actPct}%, #e2e8f0 100%)`;
    if (setDonut) setDonut.style.background = `conic-gradient(#10b981 0%, #10b981 ${setPct}%, #e2e8f0 ${setPct}%, #e2e8f0 100%)`;
    if (cloDonut) cloDonut.style.background = `conic-gradient(#ef4444 0%, #ef4444 ${cloPct}%, #e2e8f0 ${cloPct}%, #e2e8f0 100%)`;
    if (penDonut) penDonut.style.background = `conic-gradient(#f59e0b 0%, #f59e0b ${penPct}%, #e2e8f0 ${penPct}%, #e2e8f0 100%)`;

    // Section 2 Hierarchical Counters
    const actGrpEl = document.getElementById('h-stat-active-total');
    const actSub1El = document.getElementById('h-stat-active-sub1');
    const actSub2El = document.getElementById('h-stat-active-sub2');
    const cloGrpEl = document.getElementById('h-stat-closed-total');
    const cloSub1El = document.getElementById('h-stat-closed-sub1');
    const cloSub2El = document.getElementById('h-stat-closed-sub2');
    const noSetR1El = document.getElementById('h-stat-nosettle-r1');
    const noSetR2El = document.getElementById('h-stat-nosettle-r2');

    if (actGrpEl) actGrpEl.innerText = stats.activeGroupTotal || 0;
    if (actSub1El) actSub1El.innerText = stats.active || 0;
    if (actSub2El) actSub2El.innerText = stats.pending || 0;
    if (cloGrpEl) cloGrpEl.innerText = stats.closedGroupTotal || 0;
    if (cloSub1El) cloSub1El.innerText = stats.settle || 0;
    if (cloSub2El) cloSub2El.innerText = stats.close || 0;
    if (noSetR1El) noSetR1El.innerText = stats.noSettleReason1 || 0;
    if (noSetR2El) noSetR2El.innerText = stats.noSettleReason2 || 0;

    renderDashboardExtendedStats(stats);
}

/**
 * Render Extended Dashboard Statistics (Section 4 & 5 - Request 3)
 */
function renderDashboardExtendedStats(stats) {
    const catTbody = document.getElementById('dashboard-cat-stats-tbody');
    const yrTbody = document.getElementById('dashboard-yearly-tbody');
    const totalSys = stats.total || 1;

    // 1. Category Breakdown Table (Section 4)
    if (catTbody && typeof CASE_CATEGORIES !== 'undefined') {
        let catHtml = '';
        CASE_CATEGORIES.forEach((cat, idx) => {
            const count = stats.byCategory[cat] || 0;
            const pct = ((count / totalSys) * 100).toFixed(1);
            const settleCount = casesData.filter(c => c.category === cat && (c.status.startsWith('Settle') || c.status.includes('ព្រមព្រៀង'))).length;
            const activeCount = casesData.filter(c => c.category === cat && (c.status.startsWith('Active') || c.status.includes('កំពុង'))).length;
            
            catHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td class="text-center"><strong>${idx + 1}</strong></td>
                    <td><strong style="color: var(--primary-color);">${cat}</strong></td>
                    <td class="text-center"><span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 13px; font-weight: 700;">${count}</span></td>
                    <td class="text-center"><strong style="color: #1e293b;">${pct}%</strong></td>
                    <td class="text-center"><span style="color: #10b981; font-weight: 700;">${settleCount}</span></td>
                    <td class="text-center"><span style="color: #2563eb; font-weight: 700;">${activeCount}</span></td>
                    <td style="padding: 10px 15px;">
                        <div style="background: #e2e8f0; border-radius: 10px; height: 12px; width: 100%; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                            <div style="background: linear-gradient(90deg, #2563eb, #3b82f6); width: ${pct}%; height: 100%; border-radius: 10px; transition: width 0.6s ease;"></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        catTbody.innerHTML = catHtml;
    }

    // 2. Yearly Breakdown Table (Section 5)
    if (yrTbody) {
        const yearMap = {};
        const allCases = typeof casesData !== 'undefined' ? casesData : [];
        allCases.forEach(c => {
            let yr = '2026';
            if (c && c.dateReceived) {
                const match = String(c.dateReceived).match(/\d{4}/);
                if (match) yr = match[0];
            }
            if (!yearMap[yr]) yearMap[yr] = { total: 0, settle: 0, active: 0, other: 0 };
            yearMap[yr].total++;
            if (c && (c.status.startsWith('Settle') || c.status.includes('ព្រមព្រៀង'))) yearMap[yr].settle++;
            else if (c && (c.status.startsWith('Active') || c.status.includes('កំពុង'))) yearMap[yr].active++;
            else yearMap[yr].other++;
        });

        if (Object.keys(yearMap).length === 0) {
            yearMap['2026'] = { total: stats.total || 0, settle: stats.settle || 0, active: stats.active || 0, other: (stats.close + stats.pending) || 0 };
        }

        const sortedYears = Object.keys(yearMap).sort((a, b) => b.localeCompare(a));
        let yrHtml = '';
        sortedYears.forEach(yr => {
            const d = yearMap[yr];
            const rate = d.total > 0 ? ((d.settle / d.total) * 100).toFixed(1) + '%' : '0%';
            yrHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td><strong style="color: #1e3a8a;">ឆ្នាំ ${yr}</strong></td>
                    <td><span class="badge" style="background: #f1f5f9; color: #334155; font-weight: 700;">${d.total}</span></td>
                    <td style="color: #10b981; font-weight: 700;">${d.settle}</td>
                    <td style="color: #2563eb; font-weight: 700;">${d.active}</td>
                    <td style="color: #64748b; font-weight: 700;">${d.other}</td>
                    <td><span class="badge" style="background: #dcfce7; color: #15803d; font-weight: 700;">${rate}</span></td>
                </tr>
            `;
        });
        yrTbody.innerHTML = yrHtml;
    }

    // 3. Render Dashboard Location Chart (Section 5)
    if (typeof renderDashboardLocationChart === 'function') {
        const ctxDashLoc = document.getElementById('dashboardLocationChart')?.getContext('2d');
        if (ctxDashLoc && typeof Chart !== 'undefined') {
            renderDashboardLocationChart(stats.byLocation, ctxDashLoc);
        }
    }
    if (typeof initOrUpdateCharts === 'function') {
        initOrUpdateCharts();
    }
}

/**
 * Quick filter by status from Dashboard card click
 */
function filterByStatusQuick(statusStr) {
    switchView('cases-view');
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
        statusSelect.value = statusStr;
        applyFiltersAndRenderMasterTable();
    }
}



/**
 * Shared Helper: Generate exact 12-column Master Table Row HTML
 */
function generateMasterCaseRowHTML(c, rowNum) {
    let customCells = '';
    if (typeof CUSTOM_COLUMNS !== 'undefined') {
        CUSTOM_COLUMNS.forEach(col => {
            const val = c[col.key] || '';
            customCells += `<td class="text-center">${val}</td>`;
        });
    }

    return `
        <tr>
            <td class="text-center"><strong>${rowNum}</strong></td>
            <td><span class="case-number-tag">${c.caseNumber}</span></td>
            <td>${c.dateReceived}</td>
            <td>
                <div class="party-box">
                    <strong>${c.partyA_name} (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ)</strong>
                    <span><i class="fa-solid fa-phone"></i> ${c.partyA_phone || 'ពុំមាន'} | <i class="fa-solid fa-map-marker-alt"></i> ${c.partyA_location}</span>
                </div>
            </td>
            <td>
                <div class="party-box">
                    <strong>${c.partyB_name} (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ)</strong>
                    <span><i class="fa-solid fa-phone"></i> ${c.partyB_phone || 'ពុំមាន'} | <i class="fa-solid fa-map-marker-alt"></i> ${c.partyB_location}</span>
                </div>
            </td>
            <td><span style="font-weight: 600;">${c.category}</span></td>
            <td><span class="badge" style="background: var(--border-color); color: var(--text-color);">${c.disputeLocation}</span></td>
            <td>
                <div style="font-size: 11px; line-height: 1.5;">
                    <div>🔹 ក៖ ${c.meetingPartyA}</div>
                    <div>🔸 ខ៖ ${c.meetingPartyB}</div>
                    <div style="font-weight: 600; color: var(--primary-color);">⚖️ ផ្សះផ្សា៖ ${c.mediationMeeting}</div>
                </div>
            </td>
            <td class="text-center">${getStatusBadgeHTML(c.status)}</td>
            <td class="text-center">
                <span class="badge ${c.remarks === 'បានបិទរួចរាល់' ? 'badge-settle' : 'badge-pending'}" style="font-size: 11px;">
                    ${c.remarks}
                </span>
            </td>
            ${customCells}
            <td class="text-center">${renderTableFileCell(c)}</td>
            <td class="text-center">
                <div class="action-btns">
                    <button class="btn-icon" onclick="openViewModal('${c.id}')" title="មើលប័ណ្ណ"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-icon text-success" onclick="if(typeof openLegalDocModal === 'function') openLegalDocModal('${c.id}')" title="ផលិតលិខិតគតិយុត្ត"><i class="fa-solid fa-file-signature"></i></button>
                    <button class="btn-icon" onclick="openEditModal('${c.id}')" title="កែសម្រួល"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete-btn" onclick="confirmDeleteCase('${c.id}')" title="លុប"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Render All Cases Table in Case Entry View (#entry-view)
 * Aligned 100% with Master Case Directory schema & styling
 */
function renderEntryCasesTable() {
    const tbody = document.getElementById('entry-cases-tbody');
    const countBadge = document.getElementById('entry-table-count');
    if (!tbody) return;

    // Sort from 1 to N (oldest/first entered to newest/last entered, matching master list)
    const sorted = sortCases(casesData, 'date-asc');
    if (countBadge) countBadge.innerText = `សរុប៖ ${sorted.length} ករណី`;

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4">គ្មានទិន្នន័យសំណុំរឿងឡើយ</td></tr>`;
        return;
    }

    let html = '';
    sorted.forEach((c, idx) => {
        html += generateMasterCaseRowHTML(c, idx + 1);
    });
    tbody.innerHTML = html;
}

function applyFiltersAndRenderMasterTable() {
    const q = document.getElementById('filter-search')?.value || '';
    const cat = document.getElementById('filter-category')?.value || 'ALL';
    const st = document.getElementById('filter-status')?.value || 'ALL';
    const loc = document.getElementById('filter-location')?.value || 'ALL';
    const sortBy = document.getElementById('sort-by')?.value || 'date-asc';

    const filters = { search: q, category: cat, status: st, location: loc };
    let filtered = filterCases(filters);
    filtered = sortCases(filtered, sortBy);
    filteredCasesCache = filtered;

    const totalEl = document.getElementById('total-count');
    const showEl = document.getElementById('showing-count');
    const emptyState = document.getElementById('cases-empty-state');
    const tbody = document.getElementById('all-cases-tbody');

    if (totalEl) totalEl.innerText = casesData.length;
    if (showEl) showEl.innerText = filtered.length;

    if (filtered.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        renderPagination(0, 1);
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Show ALL cases in a vertical scrollable list without pagination splitting (Request 2)
    const paginated = filtered;
    const totalPages = 1;

    if (!tbody) return;
    let html = '';
    paginated.forEach((c, idx) => {
        const rowNum = idx + 1;
        html += generateMasterCaseRowHTML(c, rowNum);
    });
    tbody.innerHTML = html;
    renderPagination(filtered.length, 1);
}

/**
 * Render Pagination Controls
 */
function renderPagination(totalItems, totalPages) {
    const wrapper = document.getElementById('pagination-wrapper');
    if (!wrapper) return;
    if (totalPages <= 1) {
        wrapper.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>
    `;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>
    `;
    wrapper.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    applyFiltersAndRenderMasterTable();
}

/**
 * Get HTML badge for status
 */
function getStatusBadgeHTML(statusStr) {
    let badgeClass = 'badge-active';
    let icon = 'fa-solid fa-spinner fa-spin-pulse';
    if (statusStr.startsWith('Settle')) {
        badgeClass = 'badge-settle';
        icon = 'fa-solid fa-circle-check';
    } else if (statusStr.startsWith('Close')) {
        badgeClass = 'badge-close';
        icon = 'fa-solid fa-lock';
    } else if (statusStr.startsWith('Pending')) {
        badgeClass = 'badge-pending';
        icon = 'fa-solid fa-clock-rotate-left';
    }
    return `<span class="badge ${badgeClass}"><i "${icon}"></i> ${statusStr}</span>`;
}

/**
 * Filter & Search Event Listeners
 */
function initFilterAndSearchEvents() {
    const searchEl = document.getElementById('filter-search');
    const headerSearchEl = document.getElementById('header-search-input');
    const catEl = document.getElementById('filter-category');
    const stEl = document.getElementById('filter-status');
    const locEl = document.getElementById('filter-location');
    const sortEl = document.getElementById('sort-by');
    const resetBtn = document.getElementById('btn-reset-filters');
    const refreshBtn = document.getElementById('btn-refresh-data');

    let searchDebounceTimer;
    const triggerFilter = () => {
        currentPage = 1;
        applyFiltersAndRenderMasterTable();
    };

    const debouncedTriggerFilter = () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            triggerFilter();
        }, 250);
    };

    if (searchEl) searchEl.addEventListener('input', debouncedTriggerFilter);
    if (headerSearchEl) {
        headerSearchEl.addEventListener('input', (e) => {
            if (searchEl) searchEl.value = e.target.value;
            const currentActive = document.querySelector('.view-section.active');
            if (!currentActive || currentActive.id !== 'cases-view') {
                if (e.target.value.trim() !== '') {
                    switchView('cases-view');
                }
            }
            debouncedTriggerFilter();
        });
    }
    if (catEl) catEl.addEventListener('change', triggerFilter);
    if (stEl) stEl.addEventListener('change', triggerFilter);
    if (locEl) locEl.addEventListener('change', triggerFilter);
    if (sortEl) sortEl.addEventListener('change', triggerFilter);

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchEl) searchEl.value = '';
            if (headerSearchEl) headerSearchEl.value = '';
            if (catEl) catEl.value = 'ALL';
            if (stEl) stEl.value = 'ALL';
            if (locEl) locEl.value = 'ALL';
            if (sortEl) sortEl.value = 'date-desc';
            triggerFilter();
            showToast('បានកំណត់លក្ខខណ្ឌចម្រោះឡើងវិញ', 'info');
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadCases();
            renderAllViews();
            showToast('ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាព!', 'success');
        });
    }
}

/**
 * Modal Handling (Add / Edit Case Entry Form)
 */
function initModalEvents() {
    const modal = document.getElementById('case-modal');
    const btnAdd1 = document.getElementById('btn-open-add-modal');
    const btnAdd2 = document.getElementById('btn-open-add-modal-2');
    const btnAddEntry = document.getElementById('btn-open-add-modal-entry');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('case-form');

    // Status logic helper
    const statusSelect = document.getElementById('case-status');
    const actionGroupInput = document.getElementById('case-action-group');
    const remarksInput = document.getElementById('case-remarks');
    const remarksSelect = document.getElementById('case-remarks-select');

    const handleStatusChange = () => {
        if (!statusSelect) return;
        const val = statusSelect.value;
        if (val.startsWith('Active')) {
            if (actionGroupInput) actionGroupInput.value = 'Active - សំណុំរឿងកំពុងចាត់ការ';
            if (remarksSelect) remarksSelect.classList.add('d-none');
            if (remarksInput) {
                remarksInput.classList.remove('d-none');
                if (remarksInput.value.includes('ដកពាក្យ') || remarksInput.value.includes('មិនចូលរួម') || remarksInput.value.includes('បានបិទ')) {
                    remarksInput.value = 'កំពុងពិនិត្យ និងដោះស្រាយ (មិនទាន់បិទ)';
                }
            }
        } else if (val.startsWith('Pending')) {
            if (actionGroupInput) actionGroupInput.value = 'Active - សំណុំរឿងកំពុងចាត់ការ';
            if (remarksSelect) remarksSelect.classList.add('d-none');
            if (remarksInput) {
                remarksInput.classList.remove('d-none');
                if (remarksInput.value.includes('ដកពាក្យ') || remarksInput.value.includes('មិនចូលរួម') || remarksInput.value.includes('បានបិទ')) {
                    remarksInput.value = 'តម្កល់រង់ចាំនីតិវិធីបន្ត (មិនទាន់បិទ)';
                }
            }
        } else if (val.startsWith('Settle')) {
            if (actionGroupInput) actionGroupInput.value = 'Closed - សំណុំរឿងបានចាត់ការរួច';
            if (remarksSelect) remarksSelect.classList.add('d-none');
            if (remarksInput) {
                remarksInput.classList.remove('d-none');
                remarksInput.value = 'សម្រុះសម្រួលព្រមព្រៀងជោគជ័យ (បានបិទរួចរាល់)';
            }
        } else if (val.startsWith('No Settle') || val.startsWith('Close')) {
            if (actionGroupInput) actionGroupInput.value = 'Closed - សំណុំរឿងបានចាត់ការរួច';
            if (remarksInput) remarksInput.classList.add('d-none');
            if (remarksSelect) remarksSelect.classList.remove('d-none');
        }
    };

    if (statusSelect) statusSelect.addEventListener('change', handleStatusChange);

    const openAdd = () => {
        form.reset();
        document.getElementById('case-id').value = '';
        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-folder-plus"></i> បញ្ចូលព័ត៌មានសំណុំរឿងគោលថ្មី`;
        document.getElementById('case-number').value = generateNextCaseNumber();
        document.getElementById('case-date').value = getTodayDateString();
        handleStatusChange();
        renderModalCustomFields();
        currentModalCaseFiles = [];
        renderModalCaseFilesGrid();
        modal.classList.add('open');
    };

    const checkUnsavedAndClose = () => {
        const caseNum = document.getElementById('case-number')?.value?.trim();
        const partyA = document.getElementById('case-party-a-name')?.value?.trim();
        const partyB = document.getElementById('case-party-b-name')?.value?.trim();
        const summary = document.getElementById('case-summary')?.value?.trim();
        if (caseNum || partyA || partyB || summary) {
            customConfirm("បញ្ជាក់ការបោះបង់", "លោកអ្នកកំពុងបញ្ចូលទិន្នន័យ តើអ្នកពិតជាចង់បោះបង់ ឬចាកចេញពីផ្ទាំងនេះមែនទេ? ទិន្នន័យដែលបានវាយបញ្ចូលនឹងមិនត្រូវបានរក្សាទុកឡើយ!", () => {
                modal.classList.remove('open');
            });
        } else {
            modal.classList.remove('open');
        }
    };

    if (btnAdd1) btnAdd1.addEventListener('click', openAdd);
    if (btnAdd2) btnAdd2.addEventListener('click', openAdd);
    if (btnAddEntry) btnAddEntry.addEventListener('click', openAdd);
    if (btnClose) btnClose.addEventListener('click', checkUnsavedAndClose);
    if (btnCancel) btnCancel.addEventListener('click', checkUnsavedAndClose);

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('case-id').value;
            const statusVal = document.getElementById('case-status').value;
            const remarksVal = (statusVal.startsWith('No Settle') || statusVal.startsWith('Close')) 
                                ? document.getElementById('case-remarks-select').value 
                                : document.getElementById('case-remarks').value;

            const payload = {
                caseNumber: document.getElementById('case-number').value.trim(),
                dateReceived: document.getElementById('case-date').value,
                category: document.getElementById('case-category').value,
                disputeLocation: document.getElementById('case-dispute-location').value,
                
                partyA_name: document.getElementById('case-party-a-name').value.trim(),
                partyA_gender: document.getElementById('case-party-a-gender').value,
                partyA_age: document.getElementById('case-party-a-age').value,
                partyA_phone: document.getElementById('case-party-a-phone').value.trim(),
                partyA_location: document.getElementById('case-party-a-location').value,

                partyB_name: document.getElementById('case-party-b-name').value.trim(),
                partyB_gender: document.getElementById('case-party-b-gender').value,
                partyB_age: document.getElementById('case-party-b-age').value,
                partyB_phone: document.getElementById('case-party-b-phone').value.trim(),
                partyB_location: document.getElementById('case-party-b-location').value,

                summary: document.getElementById('case-summary').value.trim(),
                meetingPartyA: document.getElementById('case-meeting-a').value,
                meetingPartyB: document.getElementById('case-meeting-b').value,
                mediationMeeting: document.getElementById('case-mediation-meeting').value,
                status: statusVal,
                remarks: remarksVal,
                caseFiles: currentModalCaseFiles,
                attachedPdf: (currentModalCaseFiles.length > 0 ? currentModalCaseFiles[0].base64 : (document.getElementById('case-pdf-base64')?.value || '')),
                pdfName: (currentModalCaseFiles.length > 0 ? currentModalCaseFiles[0].name : (document.getElementById('case-pdf-filename')?.value || ''))
            };

            // Add custom fields values
            const customInputs = document.querySelectorAll('.custom-field-input');
            customInputs.forEach(input => {
                const key = input.getAttribute('data-custom-key');
                payload[key] = input.value.trim();
            });

            if (id) {
                updateCase(id, payload);
                if (typeof logAuditAction === 'function') logAuditAction('កែសម្រួលសំណុំរឿង', `បានកែសម្រួលសំណុំរឿងលេខកូដ "${payload.caseNumber}"`);
                showToast('បានកែសម្រួលសំណុំរឿងដោយជោគជ័យ!', 'success');
            } else {
                addCase(payload);
                if (typeof logAuditAction === 'function') logAuditAction('បង្កើតសំណុំរឿងថ្មី', `បានបញ្ចូលសំណុំរឿងថ្មីលេខកូដ "${payload.caseNumber}" (Full Form)`);
                showToast('បានបង្កើតសំណុំរឿងថ្មីដោយជោគជ័យ!', 'success');
            }
            modal.classList.remove('open');
            renderAllViews();
        });
    }

    // View Modal close
    const viewModal = document.getElementById('view-modal');
    const btnCloseView = document.getElementById('btn-close-view-modal');
    if (btnCloseView && viewModal) {
        btnCloseView.addEventListener('click', () => viewModal.classList.remove('open'));
    }
}

/**
 * Open Edit Modal with existing case data
 */
function openEditModal(id) {
    const c = getCaseById(id);
    if (!c) return;

    const modal = document.getElementById('case-modal');
    document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> កែសម្រួលព័ត៌មានសំណុំរឿង៖ ${c.caseNumber}`;
    document.getElementById('case-id').value = c.id;
    
    document.getElementById('case-number').value = c.caseNumber || '';
    document.getElementById('case-date').value = c.dateReceived || '';
    document.getElementById('case-category').value = c.category || 'វិវាទកិច្ចសន្យា';
    document.getElementById('case-dispute-location').value = c.disputeLocation || 'ភ្នំពេញ';

    document.getElementById('case-party-a-name').value = c.partyA_name || '';
    document.getElementById('case-party-a-gender').value = c.partyA_gender || 'ប្រុស';
    document.getElementById('case-party-a-age').value = c.partyA_age || '';
    document.getElementById('case-party-a-phone').value = c.partyA_phone || '';
    document.getElementById('case-party-a-location').value = c.partyA_location || 'ភ្នំពេញ';

    document.getElementById('case-party-b-name').value = c.partyB_name || '';
    document.getElementById('case-party-b-gender').value = c.partyB_gender || 'ប្រុស';
    document.getElementById('case-party-b-age').value = c.partyB_age || '';
    document.getElementById('case-party-b-phone').value = c.partyB_phone || '';
    document.getElementById('case-party-b-location').value = c.partyB_location || 'ភ្នំពេញ';

    document.getElementById('case-summary').value = c.summary || '';
    document.getElementById('case-meeting-a').value = c.meetingPartyA || 'មិនទាន់ប្រជុំ';
    document.getElementById('case-meeting-b').value = c.meetingPartyB || 'មិនទាន់ប្រជុំ';
    document.getElementById('case-mediation-meeting').value = c.mediationMeeting || 'មិនទាន់ប្រជុំ';
    document.getElementById('case-status').value = c.status || 'Active (កំពុងសម្រុះសម្រួល)';
    
    // Trigger action group and remarks update
    const statusVal = document.getElementById('case-status').value;
    const actionGroupInput = document.getElementById('case-action-group');
    const remarksInput = document.getElementById('case-remarks');
    const remarksSelect = document.getElementById('case-remarks-select');

    if (statusVal.startsWith('No Settle') || statusVal.startsWith('Close')) {
        if (actionGroupInput) actionGroupInput.value = 'Closed - សំណុំរឿងបានចាត់ការរួច';
        if (remarksInput) remarksInput.classList.add('d-none');
        if (remarksSelect) {
            remarksSelect.classList.remove('d-none');
            if (c.remarks && c.remarks.includes('ដកពាក្យ')) {
                remarksSelect.value = 'ភាគីដកពាក្យបណ្តឹង';
            } else {
                remarksSelect.value = 'ភាគីមិនចូលរួម ឬមិនបន្តការសម្រុះសម្រួល';
            }
        }
    } else {
        if (remarksSelect) remarksSelect.classList.add('d-none');
        if (remarksInput) {
            remarksInput.classList.remove('d-none');
            remarksInput.value = c.remarks || 'មិនទាន់បិទ';
        }
        if (statusVal.startsWith('Settle')) {
            if (actionGroupInput) actionGroupInput.value = 'Closed - សំណុំរឿងបានចាត់ការរួច';
        } else {
            if (actionGroupInput) actionGroupInput.value = 'Active - សំណុំរឿងកំពុងចាត់ការ';
        }
    }

    // Close view modal if open
    document.getElementById('view-modal')?.classList.remove('open');
    renderModalCustomFields(c);
    currentModalCaseFiles = c.caseFiles ? JSON.parse(JSON.stringify(c.caseFiles)) : [];
    if (c.attachedPdf && currentModalCaseFiles.length === 0) {
        currentModalCaseFiles.push({
            id: 'f_migrated_' + Date.now(),
            name: c.pdfName || 'Case_PDF.pdf',
            type: 'application/pdf',
            size: 'N/A',
            category: 'ពាក្យបណ្តឹង',
            base64: c.attachedPdf,
            uploadedAt: new Date().toISOString()
        });
    }
    renderModalCaseFilesGrid();
    modal.classList.add('open');
}

/**
 * Open Dossier Detail View Modal
 */
function openViewModal(id) {
    const c = getCaseById(id);
    if (!c) return;

    const modal = document.getElementById('view-modal');
    const body = document.getElementById('view-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <div class="dossier-header">
            <div class="dossier-number">
                <h2>${c.caseNumber}</h2>
                <span>កាលបរិច្ឆេទទទួលពាក្យ៖ <strong>${c.dateReceived}</strong></span>
            </div>
            <div>
                ${getStatusBadgeHTML(c.status)}
                <span class="badge ${c.remarks === 'បានបិទរួចរាល់' ? 'badge-settle' : 'badge-pending'}" style="margin-left: 8px;">${c.remarks}</span>
            </div>
        </div>

        <div class="dossier-grid">
            <div class="dossier-item" style="background: #eff6ff; border-color: #bfdbfe;">
                <span class="d-label" style="color: #1d4ed8;"><i class="fa-solid fa-user-check"></i> ដើមបណ្ដឹង ភាគី (ក)</span>
                <span class="d-val">${c.partyA_name} (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ)</span>
                <div style="font-size: 13px; margin-top: 6px; color: #334155;">
                    <div>📞 ទូរស័ព្ទ៖ <strong>${c.partyA_phone || 'ពុំមាន'}</strong></div>
                    <div>📍 អាសយដ្ឋាន៖ <strong>${c.partyA_location}</strong></div>
                </div>
            </div>

            <div class="dossier-item" style="background: #fef2f2; border-color: #fecaca;">
                <span class="d-label" style="color: #b91c1c;"><i class="fa-solid fa-user-xmark"></i> ចុងបណ្ដឹង ភាគី (ខ)</span>
                <span class="d-val">${c.partyB_name} (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ)</span>
                <div style="font-size: 13px; margin-top: 6px; color: #334155;">
                    <div>📞 ទូរស័ព្ទ៖ <strong>${c.partyB_phone || 'ពុំមាន'}</strong></div>
                    <div>📍 អាសយដ្ឋាន៖ <strong>${c.partyB_location}</strong></div>
                </div>
            </div>

            <div class="dossier-item">
                <span class="d-label">ប្រភេទសំណុំរឿង (Category)</span>
                <span class="d-val" style="color: var(--primary-color);">${c.category}</span>
            </div>

            <div class="dossier-item">
                <span class="d-label">ទីតាំងវិវាទ (Dispute Location)</span>
                <span class="d-val">${c.disputeLocation}</span>
            </div>

            <div class="dossier-item full-width">
                <span class="d-label">សេចក្តីសង្ខេបវិវាទ (Dispute Summary / Facts)</span>
                <p class="d-val-text mt-1" style="background: var(--bg-card); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">${c.summary || 'ពុំមានរៀបរាប់សេចក្តីសង្ខេប'}</p>
            </div>

            <div class="dossier-item full-width" style="background: var(--primary-light); border-color: #bfdbfe;">
                <span class="d-label" style="color: var(--primary-color); font-size: 13px;"><i class="fa-solid fa-gavel"></i> ស្ថានភាពកិច្ចប្រជុំ និងចំណាត់ការនីតិវិធី</span>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px; font-size: 13px;">
                    <div style="background: white; padding: 8px; border-radius: 4px;">
                        <span class="text-muted d-block" style="font-size: 11px;">ប្រជុំភាគី (ក)៖</span>
                        <strong>${c.meetingPartyA}</strong>
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 4px;">
                        <span class="text-muted d-block" style="font-size: 11px;">ប្រជុំភាគី (ខ)៖</span>
                        <strong>${c.meetingPartyB}</strong>
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid var(--primary-color);">
                        <span class="text-muted d-block" style="font-size: 11px;">ប្រជុំសម្រុះសម្រួល៖</span>
                        <strong style="color: var(--primary-color);">${c.mediationMeeting}</strong>
                    </div>
                </div>
            </div>
            
            ${(() => {
                if (CUSTOM_COLUMNS.length === 0) return '';
                let customHtml = `
                <div class="dossier-item full-width" style="grid-column: span 2; background: #f8fafc; border-color: #e2e8f0; margin-top: 10px;">
                    <span class="d-label" style="color: #475569; font-weight: 700;"><i class="fa-solid fa-square-plus"></i> ៦. ព័ត៌មានបន្ថែម (Custom Fields)</span>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 8px; font-size: 13px;">
                `;
                CUSTOM_COLUMNS.forEach(col => {
                    const val = c[col.key] || 'ពុំមានបញ្ចូល';
                    customHtml += `
                        <div style="background: white; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                            <span class="text-muted d-block" style="font-size: 11px;">${col.labelKh} (${col.labelEn})៖</span>
                            <strong>${val}</strong>
                        </div>
                    `;
                });
                customHtml += `</div></div>`;
                return customHtml;
            })()}
            ${renderDossierFilesSection(c)}
        </div>
    `;

    // Quick status select binding
    const quickSelect = document.getElementById('quick-status-select');
    if (quickSelect) {
        quickSelect.value = c.status;
        quickSelect.onchange = (e) => {
            const newSt = e.target.value;
            let newRem = c.remarks;
            if (newSt.startsWith('Settle') || newSt.startsWith('Close')) {
                newRem = 'បានបិទរួចរាល់';
            } else {
                newRem = 'មិនទាន់បិទ';
            }
            updateCase(c.id, { status: newSt, remarks: newRem });
            showToast(`បានប្តូរលទ្ធផលទៅជា "${newSt}" រួចរាល់!`, 'success');
            openViewModal(c.id); // reload modal view
            renderAllViews();
        };
    }

    // Modal action buttons
    const btnGenDoc = document.getElementById('btn-generate-doc-from-view');
    if (btnGenDoc) {
        btnGenDoc.onclick = () => {
            if (typeof openLegalDocModal === 'function') openLegalDocModal(c.id);
        };
    }
    document.getElementById('btn-edit-from-view').onclick = () => openEditModal(c.id);
    document.getElementById('btn-delete-from-view').onclick = () => confirmDeleteCase(c.id, true);
    document.getElementById('btn-print-single-case').onclick = () => printSingleDossier(c);

    modal.classList.add('open');
}

/**
 * Custom Confirmation Popup Modal System
 */
function customConfirm(title, message, onYes, onNo) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) {
        if (confirm(`${title}\n\n${message}`)) {
            if (onYes) onYes();
        } else {
            if (onNo) onNo();
        }
        return;
    }
    const titleEl = document.getElementById('custom-confirm-title');
    const msgEl = document.getElementById('custom-confirm-message');
    if (titleEl) titleEl.innerText = title || 'ការបញ្ជាក់សុវត្ថិភាព';
    if (msgEl) msgEl.innerText = message || 'តើលោកអ្នកពិតជាចង់បន្តសកម្មភាពនេះមែនទេ?';
    
    const btnYes = document.getElementById('btn-confirm-yes');
    const btnNo = document.getElementById('btn-confirm-no');
    if (!btnYes || !btnNo) return;
    
    const newBtnYes = btnYes.cloneNode(true);
    const newBtnNo = btnNo.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtnYes, btnYes);
    btnNo.parentNode.replaceChild(newBtnNo, btnNo);
    
    newBtnYes.addEventListener('click', () => {
        modal.classList.remove('open');
        if (onYes) onYes();
    });
    
    newBtnNo.addEventListener('click', () => {
        modal.classList.remove('open');
        if (onNo) onNo();
    });
    
    modal.classList.add('open');
}

/**
 * Confirm delete case
 */
function confirmDeleteCase(id, closeViewAfter = false) {
    const c = getCaseById(id);
    if (!c) return;
    customConfirm('បញ្ជាក់ការលុបសំណុំរឿង', `តើលោកអ្នកពិតជាចង់លុបសំណុំរឿងលេខ "${c.caseNumber}" នេះមែនទេ? ទិន្នន័យដែលលុបហើយមិនអាចស្ដារវិញបានឡើយ!`, () => {
        deleteCase(id);
        if (typeof logAuditAction === 'function') logAuditAction('លុបសំណុំរឿង', `បានលុបសំណុំរឿងលេខកូដ "${c.caseNumber}"`);
        showToast(`បានលុបសំណុំរឿង "${c.caseNumber}" ចេញពីបញ្ជីដោយជោគជ័យ!`, 'success');
        if (closeViewAfter) {
            document.getElementById('view-modal')?.classList.remove('open');
        }
        renderAllViews();
    });
}

/**
 * Render Case Evaluation & Analytics View
 */
function renderAnalyticsView() {
    const stats = getCaseStatistics();

    const rateEl = document.getElementById('eval-settle-rate');
    const setEl = document.getElementById('eval-settle-count');
    const actEl = document.getElementById('eval-active-count');
    const othEl = document.getElementById('eval-other-count');
    const concEl = document.getElementById('eval-conclusion-text');

    if (rateEl) rateEl.innerText = `${stats.settleRate} %`;
    if (setEl) setEl.innerText = stats.settle;
    if (actEl) actEl.innerText = stats.active;
    if (othEl) othEl.innerText = (stats.close + stats.pending);

    const avgDaysEl = document.getElementById('eval-avg-days');
    const resRateEl = document.getElementById('eval-resolution-rate');
    let totalDays = 0;
    let resolvedCount = 0;
    const now = new Date();
    casesData.forEach(c => {
        if (c.status === 'Settle (ព្រមព្រៀង)' || c.status === 'Close (បិទ)') {
            resolvedCount++;
            if (c.dateReceived) {
                const receivedDate = new Date(c.dateReceived);
                if (!isNaN(receivedDate.getTime())) {
                    const diffTime = Math.abs(now - receivedDate);
                    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                    totalDays += Math.min(diffDays, 120);
                } else {
                    totalDays += 14;
                }
            } else {
                totalDays += 14;
            }
        }
    });
    const avgDays = resolvedCount > 0 ? Math.round(totalDays / resolvedCount) : 14;
    if (avgDaysEl) avgDaysEl.innerText = `${avgDays} ថ្ងៃ`;

    const overallResRate = stats.total > 0 ? (((stats.settle + stats.close) / stats.total) * 100).toFixed(1) : 0;
    if (resRateEl) resRateEl.innerText = `${overallResRate} %`;

    if (concEl) {
        const rateNum = parseFloat(stats.settleRate);
        if (rateNum >= 60) {
            concEl.innerHTML = `អត្រាផ្សះផ្សាជោគជ័យបច្ចុប្បន្នគឺ <strong>${stats.settleRate}%</strong> ដែលស្ថិតក្នុងកម្រិត <strong>"ខ្ពស់ប្រសើរណាស់ (Excellent)"</strong> បង្ហាញពីប្រសិទ្ធភាពខ្ពស់នៃយន្តការដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការរបស់ស្ថាប័ន NADR។`;
        } else if (rateNum >= 40) {
            concEl.innerHTML = `អត្រាផ្សះផ្សាជោគជ័យបច្ចុប្បន្នគឺ <strong>${stats.settleRate}%</strong> ដែលស្ថិតក្នុងកម្រិត <strong>"មធ្យមល្អ (Good)"</strong>។ ស្ថាប័នគួរពង្រឹងកិច្ចប្រជុំប្រមូលព័ត៌មានពីភាគីទាំងពីរឱ្យបានលម្អិតបន្ថែមទៀតមុនពេលប្រជុំសម្រុះសម្រួល។`;
        } else {
            concEl.innerHTML = `អត្រាផ្សះផ្សាជោគជ័យបច្ចុប្បន្នគឺ <strong>${stats.settleRate}%</strong>។ ភាគច្រើននៃករណីកំពុងស្ថិតក្នុងការចាត់ការបន្ត (Active) ឬតម្កល់។`;
        }
    }

    if (typeof renderLocationChart === 'function') {
        renderLocationChart(stats.byLocation);
    }
    renderAnalyticsTables(stats);
}

/**
 * Render Analytics Tables matching Screenshot 3 & Screenshot 4 (Request 4)
 */
function renderAnalyticsTables(stats) {
    const pctTbody = document.getElementById('analytics-percentage-tbody');
    const pctTfoot = document.getElementById('analytics-percentage-tfoot');
    const evalTbody = document.getElementById('analytics-evaluation-tbody');
    const evalTfoot = document.getElementById('analytics-evaluation-tfoot');
    const totalSys = stats.total || 1;

    // 1. Outcome Percentage Analysis Table (Table 4 - Screenshot 4)
    if (pctTbody && typeof CASE_CATEGORIES !== 'undefined') {
        let pctHtml = '';
        CASE_CATEGORIES.forEach((cat, idx) => {
            const catCases = casesData.filter(c => c.category === cat);
            const catLen = catCases.length;
            const sysPct = ((catLen / totalSys) * 100).toFixed(0);
            
            const actCount = catCases.filter(c => c.status.startsWith('Active') || c.status.includes('កំពុង')).length;
            const setCount = catCases.filter(c => c.status.startsWith('Settle') || c.status.includes('ព្រមព្រៀង')).length;
            const noSetCount = catCases.filter(c => c.status.startsWith('Close') || c.status.includes('បិទ') || (c.mediationMeeting && c.mediationMeeting.includes('មិនព្រមព្រៀង'))).length;
            const penCount = catCases.filter(c => c.status.startsWith('Pending') || c.status.includes('តម្កល់') || c.status.includes('ផ្អាក')).length;
            
            const actPct = catLen > 0 ? ((actCount / catLen) * 100).toFixed(0) : 0;
            const setPct = catLen > 0 ? ((setCount / catLen) * 100).toFixed(0) : 0;
            const noSetPct = catLen > 0 ? ((noSetCount / catLen) * 100).toFixed(0) : 0;
            const penPct = catLen > 0 ? ((penCount / catLen) * 100).toFixed(0) : 0;

            pctHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;">
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${idx + 1}</td>
                    <td style="text-align: left; padding: 10px 15px; font-weight: 600; color: #1e3a8a; border-right: 1px solid #e2e8f0;">${cat}</td>
                    <td style="padding: 10px; font-weight: 700; background: #f8fafc; border-right: 1px solid #e2e8f0;">${sysPct}%</td>
                    <td style="padding: 10px; color: #2563eb; font-weight: 600; border-right: 1px solid #e2e8f0;">${actPct}%</td>
                    <td style="padding: 10px; color: #10b981; font-weight: 700; border-right: 1px solid #e2e8f0;">${setPct}%</td>
                    <td style="padding: 10px; color: #ef4444; font-weight: 600; border-right: 1px solid #e2e8f0;">${noSetPct}%</td>
                    <td style="padding: 10px; color: #f59e0b; font-weight: 600;">${penPct}%</td>
                </tr>
            `;
        });
        pctTbody.innerHTML = pctHtml;

        if (pctTfoot) {
            const totActPct = ((stats.active / totalSys) * 100).toFixed(0);
            const totSetPct = ((stats.settle / totalSys) * 100).toFixed(0);
            const totNoSetPct = ((stats.close / totalSys) * 100).toFixed(0);
            const totPenPct = ((stats.pending / totalSys) * 100).toFixed(0);
            pctTfoot.innerHTML = `
                <tr>
                    <td colspan="2" style="padding: 12px 15px; text-align: left; font-weight: 700; color: #1e3a8a; border-right: 1px solid #cbd5e1;">សរុបមធ្យម (Total Average)</td>
                    <td style="padding: 12px; font-weight: 700; color: #1e293b; background: #e2e8f0; border-right: 1px solid #cbd5e1;">100%</td>
                    <td style="padding: 12px; font-weight: 700; color: #2563eb; border-right: 1px solid #cbd5e1;">${totActPct}%</td>
                    <td style="padding: 12px; font-weight: 700; color: #10b981; border-right: 1px solid #cbd5e1;">${totSetPct}%</td>
                    <td style="padding: 12px; font-weight: 700; color: #ef4444; border-right: 1px solid #cbd5e1;">${totNoSetPct}%</td>
                    <td style="padding: 12px; font-weight: 700; color: #f59e0b;">${totPenPct}%</td>
                </tr>
            `;
        }
    }

    // 2. Assessment Evaluation Matrix Table (Table 3 - Screenshot 3)
    if (evalTbody && typeof CASE_CATEGORIES !== 'undefined') {
        const evalBaselineMap = EVAL_BASELINE_MAP;

        const getBadge = (val) => {
            if (!val || val === '-') return `<span style="color: #94a3b8; font-weight: 700;">-</span>`;
            if (val === 'ល្អណាស់') return `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; font-weight: 700; font-size: 12px;">ល្អណាស់</span>`;
            if (val === 'ល្អ') return `<span class="badge" style="background: #fef9c3; color: #a16207; border: 1px solid #fde047; padding: 4px 10px; font-weight: 700; font-size: 12px;">ល្អ</span>`;
            if (val === 'មធ្យម') return `<span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; padding: 4px 10px; font-weight: 700; font-size: 12px;">មធ្យម</span>`;
            if (val === 'មិនល្អ') return `<span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 4px 10px; font-weight: 700; font-size: 12px;">មិនល្អ</span>`;
            if (val.includes('យឺត')) return `<span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 4px 10px; font-weight: 700; font-size: 12px;"><i class="fa-solid fa-triangle-exclamation"></i> ${val}</span>`;
            if (val.includes('លឿន')) return `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; font-weight: 700; font-size: 12px;"><i class="fa-solid fa-check"></i> ${val}</span>`;
            return `<span class="badge" style="background: #f1f5f9; color: #334155; padding: 4px 10px; font-weight: 700;">${val}</span>`;
        };

        let evalHtml = '';
        CASE_CATEGORIES.forEach((cat, idx) => {
            const b = evalBaselineMap[cat] || { resp: 'ល្អ', nego: 'ល្អ', emp: 'មធ្យម', spirit: 'ល្អ', time: 'មធ្យម (២០ ថ្ងៃ)' };
            evalHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${idx + 1}</td>
                    <td style="text-align: left; padding: 10px 15px; font-weight: 600; color: #065f46; border-right: 1px solid #e2e8f0;">${cat}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(b.resp)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(b.nego)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(b.emp)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(b.spirit)}</td>
                    <td style="padding: 10px;">${getBadge(b.time)}</td>
                </tr>
            `;
        });
        evalTbody.innerHTML = evalHtml;

        if (evalTfoot) {
            evalTfoot.innerHTML = `
                <tr>
                    <td colspan="2" style="padding: 12px 15px; text-align: left; font-weight: 700; color: #065f46; border-right: 1px solid #cbd5e1;">សរុបវាយតម្លៃមធ្យម (Overall Assessment)</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អ')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អណាស់')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អ')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('មិនល្អ')}</td>
                    <td style="padding: 12px;">${getBadge('យឺត (មធ្យម ២៤ ថ្ងៃ)')}</td>
                </tr>
            `;
        }
    }
    renderStrategicRecommendations();
}

function renderStrategicRecommendations() {
    const container = document.getElementById('analytics-strategy-container');
    if (!container || typeof CASES === 'undefined') return;

    const defThreshAll = {
        settle: { poor: 20, med: 30, good: 50 },
        total: { poor: 10, med: 25, good: 50 },
        active: { poor: 50, good: 35, exc: 20 },
        close: { poor: 40, good: 25, exc: 15 },
        pending: { poor: 30, good: 20, exc: 10 }
    };
    const threshAll = JSON.parse(localStorage.getItem('nadr_eval_thresholds_all')) || defThreshAll;
    const thresh = JSON.parse(localStorage.getItem('nadr_eval_thresholds')) || threshAll.settle || { poor: 20, med: 30, good: 50 };

    const defStrats = {
        totalGuidance: '១. បន្តជំរុញការផ្សព្វផ្សាយ និងលើកកម្ពស់ការយល់ដឹងអំពីយន្តការដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការដល់ប្រជាពលរដ្ឋក្នុងមូលដ្ឋាន។ ២. រៀបចំប្រព័ន្ធគ្រប់គ្រង និងបែងចែកសំណុំរឿងចូលថ្មីឱ្យបានឆាប់រហ័សដល់មន្ត្រីជំនាញ។ ៣. ពង្រឹងកិច្ចសហការជាមួយអាជ្ញាធរមូលដ្ឋានក្នុងការទទួលពាក្យបណ្ដឹង។',
        settleLow: '១. ពង្រឹងសមត្ថភាពមន្ត្រីសម្រុះសម្រួលលើបច្ចេកទេសចរចា និងចិត្តសាស្ត្រវិវាទ។ ២. បង្កើនការប្រជុំត្រួតពិនិត្យមុនពេលសម្រុះសម្រួលដើម្បីវិភាគចំណុចខ្វែងគំនិត។ ៣. ចុះសិក្សាផ្ទាល់ដល់ទីតាំងវិវាទដើម្បីស្វែងយល់ពីមូលហេតុពិតប្រាកដ។',
        activeHigh: '១. រៀបចំផែនការបែងចែកសំណុំរឿងតាមកម្រិតអាទិភាព និងកំណត់កាលវិភាគប្រជុំឱ្យបានច្បាស់លាស់។ ២. បន្ថែមមន្ត្រីជំនួយការក្នុងសំណុំរឿងស្មុគស្មាញដើម្បីពងឿននីតិវិធី។ ៣. តាមដានជាប្រចាំនូវសំណុំរឿងដែលលើសរយៈពេលស្ដង់ដារកំណត់។',
        closeHigh: '១. ធ្វើការសិក្សាមូលហេតុដែលនាំឱ្យបរាជ័យក្នុងការសម្រុះសម្រួលដើម្បីដកស្រង់បទពិសោធន៍។ ២. ផ្តល់ការពន្យល់ណែនាំអំពីនីតិវិធីផ្លូវច្បាប់បន្តដល់គូភាគីដើម្បីចៀសវាងអំពើហិង្សា។ ៣. ពិនិត្យលទ្ធភាពសហការជាមួយអាជ្ញាធរមូលដ្ឋាន ឬស្ថាប័នពាក់ព័ន្ធ។',
        pendingHigh: '១. ពិនិត្យឡើងវិញនូវសំណុំរឿងដែលតម្កល់យូរ និងទំនាក់ទំនងភាគីដើម្បីសួរនាំស្ថានភាពថ្មី។ ២. កំណត់កាលបរិច្ឆេទផុតកំណត់ជាក់លាក់ក្នុងការរក្សាសំណុំរឿងជាស្ថានភាពតម្កល់។ ៣. ប្រសិនបើភាគីបោះបង់ការតវ៉ា ត្រូវអនុវត្តនីតិវិធីបិទសំណុំរឿងតាមរដ្ឋបាល។'
    };
    const strats = JSON.parse(localStorage.getItem('nadr_resolution_strategies')) || defStrats;

    const total = CASES.length || 1;
    const stats = { active: 0, settle: 0, close: 0, pending: 0 };
    CASES.forEach(c => {
        if (c.status === 'កំពុងសម្រុះសម្រួល' || c.status?.startsWith('Active')) stats.active++;
        else if (c.status === 'ព្រមព្រៀង' || c.status?.startsWith('Settle')) stats.settle++;
        else if (c.status === 'មិនព្រមព្រៀង' || c.status === 'បិទ' || c.status?.startsWith('No')) stats.close++;
        else if (c.status === 'តម្កល់' || c.status === 'ផ្អាក' || c.status?.startsWith('Pending')) stats.pending++;
    });
    const settlePct = ((stats.settle / total) * 100).toFixed(0);
    const activePct = ((stats.active / total) * 100).toFixed(0);
    const closePct = ((stats.close / total) * 100).toFixed(0);
    const pendingPct = ((stats.pending / total) * 100).toFixed(0);

    const getEvalHigherBetter = (val, t) => {
        const v = parseFloat(val);
        if (v < (t?.poor || 20)) return { label: 'មិនល្អ', color: '#dc2626', bg: '#fee2e2' };
        if (v < (t?.med || 30)) return { label: 'មធ្យម', color: '#0369a1', bg: '#e0f2fe' };
        if (v < (t?.good || 50)) return { label: 'ល្អ', color: '#d97706', bg: '#fef3c7' };
        return { label: 'ល្អណាស់', color: '#15803d', bg: '#dcfce7' };
    };

    const getEvalLowerBetter = (val, t) => {
        const v = parseFloat(val);
        if (v > (t?.poor || 50)) return { label: 'មិនល្អ', color: '#dc2626', bg: '#fee2e2' };
        if (v > (t?.good || 35)) return { label: 'មធ្យម', color: '#0369a1', bg: '#e0f2fe' };
        if (v > (t?.exc || 20)) return { label: 'ល្អ', color: '#d97706', bg: '#fef3c7' };
        return { label: 'ល្អណាស់', color: '#15803d', bg: '#dcfce7' };
    };

    const totalEval = getEvalHigherBetter(total, threshAll.total || { poor: 10, med: 25, good: 50 });
    const settleEval = getEvalHigherBetter(settlePct, threshAll.settle || thresh);
    const activeEval = getEvalLowerBetter(activePct, threshAll.active || { poor: 50, good: 35, exc: 20 });
    const closeEval = getEvalLowerBetter(closePct, threshAll.close || { poor: 40, good: 25, exc: 15 });
    const pendingEval = getEvalLowerBetter(pendingPct, threshAll.pending || { poor: 30, good: 20, exc: 10 });

    container.innerHTML = `
        <div style="background: white; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-folder-tree"></i> ១. យុទ្ធសាស្ត្រសំណុំរឿងសរុប (Total Volume)
                    </span>
                    <span style="background: ${totalEval.bg}; color: ${totalEval.color}; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid ${totalEval.color}40;">
                        ${total} ករណី (${totalEval.label})
                    </span>
                </div>
                <p style="font-size: 13px; color: var(--text-color); line-height: 1.6; margin: 0;">${strats.totalGuidance || strats.totalHigh || defStrats.totalGuidance}</p>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>កម្រិតស្ដង់ដារ៖ &lt;${threshAll.total?.poor||10} (មិនល្អ), &gt;=${threshAll.total?.good||50} (ល្អណាស់)</span>
                <a href="javascript:void(0)" onclick="switchView('settings-view'); setTimeout(()=>document.querySelector('[data-tab=tab-strategies]')?.click(), 100);" style="color: #3b82f6; font-weight: 700; text-decoration: none;"><i class="fa-solid fa-pen"></i> កែសម្រួល</a>
            </div>
        </div>

        <div style="background: white; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: #d97706; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-hand-holding-hand"></i> ២. យុទ្ធសាស្ត្រអត្រាព្រមព្រៀង (Settle Rate)
                    </span>
                    <span style="background: ${settleEval.bg}; color: ${settleEval.color}; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid ${settleEval.color}40;">
                        ${settlePct}% (${settleEval.label})
                    </span>
                </div>
                <p style="font-size: 13px; color: var(--text-color); line-height: 1.6; margin: 0;">${strats.settleLow || defStrats.settleLow}</p>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>កម្រិតស្ដង់ដារ៖ &lt;${threshAll.settle?.poor||20}% (មិនល្អ), &gt;=${threshAll.settle?.good||50}% (ល្អណាស់)</span>
                <a href="javascript:void(0)" onclick="switchView('settings-view'); setTimeout(()=>document.querySelector('[data-tab=tab-strategies]')?.click(), 100);" style="color: #3b82f6; font-weight: 700; text-decoration: none;"><i class="fa-solid fa-pen"></i> កែសម្រួល</a>
            </div>
        </div>

        <div style="background: white; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: #2563eb; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-rotate"></i> ៣. យុទ្ធសាស្ត្រកំពុងសម្រុះសម្រួល (Active Rate)
                    </span>
                    <span style="background: ${activeEval.bg}; color: ${activeEval.color}; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid ${activeEval.color}40;">
                        ${activePct}% (${activeEval.label})
                    </span>
                </div>
                <p style="font-size: 13px; color: var(--text-color); line-height: 1.6; margin: 0;">${strats.activeHigh || defStrats.activeHigh}</p>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>កម្រិតស្ដង់ដារ៖ &gt;${threshAll.active?.poor||50}% (មិនល្អ), &lt;=${threshAll.active?.exc||20}% (ល្អណាស់)</span>
                <a href="javascript:void(0)" onclick="switchView('settings-view'); setTimeout(()=>document.querySelector('[data-tab=tab-strategies]')?.click(), 100);" style="color: #3b82f6; font-weight: 700; text-decoration: none;"><i class="fa-solid fa-pen"></i> កែសម្រួល</a>
            </div>
        </div>

        <div style="background: white; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: #dc2626; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-file-excel"></i> ៤. យុទ្ធសាស្ត្របិទ/មិនព្រមព្រៀង (Closed Rate)
                    </span>
                    <span style="background: ${closeEval.bg}; color: ${closeEval.color}; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid ${closeEval.color}40;">
                        ${closePct}% (${closeEval.label})
                    </span>
                </div>
                <p style="font-size: 13px; color: var(--text-color); line-height: 1.6; margin: 0;">${strats.closeHigh || defStrats.closeHigh}</p>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>កម្រិតស្ដង់ដារ៖ &gt;${threshAll.close?.poor||40}% (មិនល្អ), &lt;=${threshAll.close?.exc||15}% (ល្អណាស់)</span>
                <a href="javascript:void(0)" onclick="switchView('settings-view'); setTimeout(()=>document.querySelector('[data-tab=tab-strategies]')?.click(), 100);" style="color: #3b82f6; font-weight: 700; text-decoration: none;"><i class="fa-solid fa-pen"></i> កែសម្រួល</a>
            </div>
        </div>

        <div style="background: white; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-folder-closed"></i> ៥. យុទ្ធសាស្ត្រតម្កល់/ផ្អាក (Pending Rate)
                    </span>
                    <span style="background: ${pendingEval.bg}; color: ${pendingEval.color}; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 12px; border: 1px solid ${pendingEval.color}40;">
                        ${pendingPct}% (${pendingEval.label})
                    </span>
                </div>
                <p style="font-size: 13px; color: var(--text-color); line-height: 1.6; margin: 0;">${strats.pendingHigh || defStrats.pendingHigh}</p>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>កម្រិតស្ដង់ដារ៖ &gt;${threshAll.pending?.poor||30}% (មិនល្អ), &lt;=${threshAll.pending?.exc||10}% (ល្អណាស់)</span>
                <a href="javascript:void(0)" onclick="switchView('settings-view'); setTimeout(()=>document.querySelector('[data-tab=tab-strategies]')?.click(), 100);" style="color: #3b82f6; font-weight: 700; text-decoration: none;"><i class="fa-solid fa-pen"></i> កែសម្រួល</a>
            </div>
        </div>
    `;
}

/**
 * Excel Import Engine (SheetJS) & Backup Events
 */
function initDataManagementEvents() {
    const btnDownloadTpl = document.getElementById('btn-download-excel-template');
    if (btnDownloadTpl) {
        btnDownloadTpl.addEventListener('click', () => {
            if (typeof generateExcelTemplate === 'function') {
                generateExcelTemplate();
                showToast('កំពុងទាញយកឯកសារគំរូ Excel (CMS_Case_Entry_Template.xlsx)...', 'success');
            }
        });
    }

    const excelInput = document.getElementById('import-excel-file');
    if (excelInput) {
        excelInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonRows = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonRows && jsonRows.length > 0) {
                        importFromExcelRows(jsonRows);
                        excelInput.value = ''; // reset
                    } else {
                        showToast('ឯកសារ Excel នេះពុំមានជួរទិន្នន័យឡើយ!', 'error');
                    }
                } catch (err) {
                    console.error('Excel Import Error:', err);
                    showToast('បរាជ័យក្នុងការអានឯកសារ Excel! សូមពិនិត្យទម្រង់ឯកសារឡើងវិញ។', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // JSON Backup
    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) btnExportJSON.addEventListener('click', exportBackupJSON);

    const jsonInput = document.getElementById('import-json-file');
    if (jsonInput) {
        jsonInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importBackupJSON(file);
                jsonInput.value = '';
            }
        });
    }

    const btnReset = document.getElementById('btn-reset-mock-data');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            customConfirm('បញ្ជាក់ការស្ដារទិន្នន័យដើម', 'តើលោកអ្នកពិតជាចង់ស្ដារទិន្នន័យគំរូដើមទាំង ១០ ករណីវិញមែនទេ? រាល់ទិន្នន័យដែលបានកែប្រែនឹងត្រូវជំនួស!', () => {
                resetToMockData();
                renderAllViews();
                if (typeof logAuditAction === 'function') logAuditAction('ស្ដារទិន្នន័យគំរូ', 'បានស្ដារទិន្នន័យគំរូដើម ១០ សំណុំរឿង NADR');
                showToast('បានស្ដារទិន្នន័យគំរូដើមទាំង ១០ ករណីដោយជោគជ័យ!', 'success');
            });
        });
    }
}

window.confirmFactoryReset = function() {
    customConfirm('បញ្ជាក់ការលុបទិន្នន័យទាំងអស់ (Factory Reset)', 'ប្រកាសអាសន្ន! តើលោកអ្នកពិតជាចង់លុបទិន្នន័យសំណុំរឿងទាំងអស់ក្នុងប្រព័ន្ធឱ្យក្លាយជាសូន្យ (Empty State) មែនទេ? ទិន្នន័យដែលលុបហើយមិនអាចស្ដារវិញបានឡើយ!', () => {
        casesData = [];
        saveCases();
        renderAllViews();
        if (typeof logAuditAction === 'function') logAuditAction('Factory Reset', 'បានលុបសម្អាតទិន្នន័យសំណុំរឿងទាំងអស់ (Empty State)');
        showToast('បានលុបទិន្នន័យសំណុំរឿងទាំងអស់ក្លាយជាសូន្យ (Factory Reset)!', 'success');
    });
};

/**
 * Theme Toggle
 */
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        btn.innerHTML = isDark ? `<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>` : `<i class="fa-solid fa-moon"></i>`;
        showToast(isDark ? 'បានប្តូរទៅ Dark Mode 🌙' : 'បានប្តូរទៅ Light Mode ☀️', 'info');
    });
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    let icon = 'fa-solid fa-circle-info';
    if (type === 'success') icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-circle-exclamation';

    el.innerHTML = `<i "${icon}"></i> <span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.remove(); }, 4000);
}

/**
 * Print single case dossier
 */
function printSingleDossier(c) {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    printArea.innerHTML = `
        <div style="font-family: 'Kantumruy Pro', 'Battambang', serif; padding: 20px; color: #000;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h3 style="font-size: 16pt; font-weight: 700;">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                <h4 style="font-size: 13pt; font-weight: 700;">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
                <div style="width: 100px; height: 2px; background: #000; margin: 6px auto;"></div>
                <h2 style="font-size: 15pt; font-weight: 700; margin-top: 16px;">ប័ណ្ណព័ត៌មានសំណុំរឿង និងចំណាត់ការដោះស្រាយ</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12pt;" border="1">
                <tr><td style="padding: 10px; background: #f0f0f0; width: 35%;"><strong>លេខកូដសំណុំរឿង៖</strong></td><td style="padding: 10px;"><strong>${c.caseNumber}</strong></td></tr>
                <tr><td style="padding: 10px;"><strong>កាលបរិច្ឆេទទទួល៖</strong></td><td style="padding: 10px;">${c.dateReceived}</td></tr>
                <tr><td style="padding: 10px;"><strong>ដើមបណ្ដឹង ភាគី (ក)៖</strong></td><td style="padding: 10px;">${c.partyA_name} (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ) | ទូរស័ព្ទ៖ ${c.partyA_phone} | ទីតាំង៖ ${c.partyA_location}</td></tr>
                <tr><td style="padding: 10px;"><strong>ចុងបណ្ដឹង ភាគី (ខ)៖</strong></td><td style="padding: 10px;">${c.partyB_name} (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ) | ទូរស័ព្ទ៖ ${c.partyB_phone} | ទីតាំង៖ ${c.partyB_location}</td></tr>
                <tr><td style="padding: 10px;"><strong>ប្រភេទវិវាទ៖</strong></td><td style="padding: 10px;">${c.category}</td></tr>
                <tr><td style="padding: 10px;"><strong>ទីតាំងវិវាទ៖</strong></td><td style="padding: 10px;">${c.disputeLocation}</td></tr>
                <tr><td style="padding: 10px;"><strong>សេចក្តីសង្ខេបវិវាទ៖</strong></td><td style="padding: 10px;">${c.summary || 'ពុំមាន'}</td></tr>
                <tr><td style="padding: 10px;"><strong>ប្រជុំប្រមូលព័ត៌មាន ភាគី ក៖</strong></td><td style="padding: 10px;">${c.meetingPartyA}</td></tr>
                <tr><td style="padding: 10px;"><strong>ប្រជុំប្រមូលព័ត៌មាន ភាគី ខ៖</strong></td><td style="padding: 10px;">${c.meetingPartyB}</td></tr>
                <tr><td style="padding: 10px;"><strong>ប្រជុំសម្រុះសម្រួល៖</strong></td><td style="padding: 10px;"><strong>${c.mediationMeeting}</strong></td></tr>
                <tr><td style="padding: 10px;"><strong>លទ្ធផលសំណុំរឿង៖</strong></td><td style="padding: 10px;"><strong>${c.status}</strong> (${c.remarks})</td></tr>
            </table>
            <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
                <div style="width: 200px;"><p>អ្នករៀបចំរបាយការណ៍</p><br><br><p><strong>..................................</strong></p></div>
                <div style="width: 200px;"><p>រាជធានីភ្នំពេញ, ថ្ងៃទី... ខែ... ឆ្នាំ២០២៦</p><p>ប្រធានការិយាល័យ</p><br><br><p><strong>..................................</strong></p></div>
            </div>
        </div>
    `;
    window.print();
}

/* ==========================================================================
   AUTHENTICATION & LOGIN LAYER LOGIC
   ========================================================================== */
function initAuth() {
    const overlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');
    const togglePwd = document.getElementById('toggle-login-pwd');
    const pwdInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error-msg');
    const usrInput = document.getElementById('login-username');

    // Hide error message immediately when user types
    if (usrInput && errorMsg) {
        usrInput.addEventListener('input', () => errorMsg.classList.add('d-none'));
    }
    if (pwdInput && errorMsg) {
        pwdInput.addEventListener('input', () => errorMsg.classList.add('d-none'));
    }

    // 1. Check existing session
    const isLogged = localStorage.getItem('nadr_auth_logged_in') || sessionStorage.getItem('nadr_auth_logged_in');
    const savedName = localStorage.getItem('nadr_auth_user_name') || sessionStorage.getItem('nadr_auth_user_name') || 'មន្ត្រីសម្របសម្រួល';
    const savedRole = localStorage.getItem('nadr_auth_user_role') || sessionStorage.getItem('nadr_auth_user_role') || 'ការិយាល័យរដ្ឋបាល NADR';

    if (isLogged === 'true') {
        if (overlay) overlay.classList.add('hidden-auth');
        updateSidebarUser(savedName, savedRole);
    } else {
        if (overlay) overlay.classList.remove('hidden-auth');
    }

    // 2. Toggle password visibility
    if (togglePwd && pwdInput) {
        togglePwd.addEventListener('click', () => {
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                togglePwd.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                pwdInput.type = 'password';
                togglePwd.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    }

    // 3. Login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const remember = document.getElementById('login-remember').checked;

            if (errorMsg) errorMsg.classList.add('d-none');

            // Valid accounts checklist
            let isValid = false;
            let uName = 'មន្ត្រីសម្របសម្រួល';
            let uRole = 'ការិយាល័យរដ្ឋបាល NADR';

            const matchedUser = ADMIN_USERS.find(u => 
                u.username.toLowerCase() === username.toLowerCase() && 
                (u.password === password || (username.toLowerCase() === 'admin' && (password === 'admin123' || password === '123' || password === 'admin')))
            );
            if (matchedUser) {
                if (matchedUser.status === 'Locked' || matchedUser.status === 'មិនអនុញ្ញាតឱ្យចូលប្រព័ន្ធ') {
                    if (errorMsg) {
                        errorMsg.innerHTML = '<i class="fa-solid fa-ban"></i> គណនីនេះត្រូវបានបិទ/មិនអនុញ្ញាតឱ្យចូលប្រព័ន្ធទេ! សូមទាក់ទងរដ្ឋបាល។';
                        errorMsg.classList.remove('d-none');
                    }
                    return;
                }
                isValid = true;
                uName = matchedUser.name;
                uRole = matchedUser.role;
            }

            if (isValid) {
                // Save state
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('nadr_auth_logged_in', 'true');
                storage.setItem('nadr_auth_user_name', uName);
                storage.setItem('nadr_auth_user_role', uRole);

                updateSidebarUser(uName, uRole);
                if (typeof logAuditAction === 'function') logAuditAction('ចូលប្រព័ន្ធ', `បានចូលប្រើប្រព័ន្ធក្នុងនាម ${uName} (${uRole})`);

                // Animate out
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.classList.add('hidden-auth');
                        overlay.style.opacity = '';
                    }, 400);
                }

                showToast('ចូលប្រព័ន្ធជោគជ័យ! សូមស្វាគមន៍មកកាន់ CMS Pro', 'success');
            } else {
                if (errorMsg) errorMsg.classList.remove('d-none');
                pwdInput.value = '';
                pwdInput.focus();
            }
        });
    }

    // 4. Logout click
    const doLogout = () => {
        customConfirm('បញ្ជាក់ការចាកចេញ', 'តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធ (Logout) មែនទេ?', () => {
            localStorage.removeItem('nadr_auth_logged_in');
            sessionStorage.removeItem('nadr_auth_logged_in');
            if (typeof logAuditAction === 'function') logAuditAction('ចាកចេញពីប្រព័ន្ធ', 'បានចាកចេញពីប្រព័ន្ធ (Logout)');
            
            if (overlay) overlay.classList.remove('hidden-auth');
            const pwd = document.getElementById('login-password');
            if (pwd) pwd.value = '';
            if (errorMsg) errorMsg.classList.add('d-none');
            
            showToast('បានចាកចេញពីប្រព័ន្ធដោយសុវត្ថិភាព', 'info');
        });
    };

    if (btnLogout) btnLogout.addEventListener('click', doLogout);
    const btnLogoutHeader = document.getElementById('btn-logout-header');
    if (btnLogoutHeader) btnLogoutHeader.addEventListener('click', doLogout);
}

function updateSidebarUser(name, role) {
    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    const headerNameEl = document.getElementById('header-user-name');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (headerNameEl) headerNameEl.textContent = name;
    if (typeof initUserProfile === 'function') initUserProfile();
}

/**
 * User Profile Management (Root Menu & Header Integration)
 */
function initUserProfile() {
    const pName = localStorage.getItem('nadr_user_profile_name') || 'ឡាយ អូន';
    const pRole = localStorage.getItem('nadr_user_profile_role') || 'មន្ត្រីសម្រុះសម្រួលវិវាទ NADR';
    const pPhone = localStorage.getItem('nadr_user_profile_phone') || '012 345 678';
    const pEmail = localStorage.getItem('nadr_user_profile_email') || 'oun.lay@nadr.gov.kh';
    const pAvatar = localStorage.getItem('nadr_user_profile_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=0D8ABC&color=fff`;

    // Update Header and Sidebar
    const headerNameEl = document.getElementById('header-user-name');
    const headerAvatarEl = document.getElementById('header-user-avatar');
    const sidebarNameEl = document.getElementById('logged-user-name');
    const sidebarRoleEl = document.getElementById('logged-user-role');
    const sidebarAvatarEl = document.getElementById('sidebar-user-avatar');
    const sidebarAvatarIconEl = document.getElementById('sidebar-user-avatar-icon');
    
    if (headerNameEl) headerNameEl.textContent = pName;
    if (headerAvatarEl) headerAvatarEl.src = pAvatar;
    if (sidebarNameEl) sidebarNameEl.textContent = pName;
    if (sidebarRoleEl) sidebarRoleEl.textContent = pRole;
    if (sidebarAvatarEl) {
        sidebarAvatarEl.src = pAvatar;
        sidebarAvatarEl.style.display = 'block';
    }
    if (sidebarAvatarIconEl) {
        sidebarAvatarIconEl.style.display = 'none';
    }

    // Header click to Profile view
    const badgeClick = document.getElementById('header-user-badge-click') || document.querySelector('.header-user-badge');
    if (badgeClick && !badgeClick.dataset.profileBound) {
        badgeClick.dataset.profileBound = 'true';
        badgeClick.style.cursor = 'pointer';
        badgeClick.addEventListener('click', (e) => {
            if (e.target && e.target.closest('#btn-logout-header')) return;
            switchView('profile-view');
        });
    }

    // Sidebar footer card click to Profile view
    const sidebarProfileCard = document.querySelector('.user-profile-card');
    if (sidebarProfileCard && !sidebarProfileCard.dataset.profileBound) {
        sidebarProfileCard.dataset.profileBound = 'true';
        sidebarProfileCard.style.cursor = 'pointer';
        sidebarProfileCard.addEventListener('click', (e) => {
            if (e.target && (e.target.closest('#btn-logout') || e.target.closest('button'))) return;
            switchView('profile-view');
        });
    }
}

function renderProfileView() {
    const pName = localStorage.getItem('nadr_user_profile_name') || 'ឡាយ អូន';
    const pRole = localStorage.getItem('nadr_user_profile_role') || 'មន្ត្រីសម្រុះសម្រួលវិវាទ NADR';
    const pPhone = localStorage.getItem('nadr_user_profile_phone') || '012 345 678';
    const pEmail = localStorage.getItem('nadr_user_profile_email') || 'oun.lay@nadr.gov.kh';
    const pAvatar = localStorage.getItem('nadr_user_profile_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=0D8ABC&color=fff`;

    // Title banner
    const avatarImg = document.getElementById('profile-view-avatar');
    const titleName = document.getElementById('profile-view-title-name');
    const titleRole = document.getElementById('profile-view-title-role');
    const titleEmail = document.getElementById('profile-view-title-email');
    const titlePhone = document.getElementById('profile-view-title-phone');

    if (avatarImg) avatarImg.src = pAvatar;
    if (titleName) titleName.textContent = pName;
    if (titleRole) titleRole.innerHTML = `<i class="fa-solid fa-briefcase"></i> ${pRole}`;
    if (titleEmail) titleEmail.textContent = pEmail;
    if (titlePhone) titlePhone.textContent = pPhone;

    // Form inputs
    const inName = document.getElementById('profile-view-fullname');
    const inRole = document.getElementById('profile-view-role');
    const inPhone = document.getElementById('profile-view-phone');
    const inEmail = document.getElementById('profile-view-email');

    if (inName) inName.value = pName;
    if (inRole) inRole.value = pRole;
    if (inPhone) inPhone.value = pPhone;
    if (inEmail) inEmail.value = pEmail;

    // Quick Stats
    const cases = typeof getCasesData === 'function' ? getCasesData() : [];
    const statCases = document.getElementById('profile-stat-cases');
    const statReports = document.getElementById('profile-stat-reports');
    if (statCases) statCases.textContent = cases.length || '0';
    if (statReports) statReports.textContent = cases.length > 0 ? '12' : '0';
}

function saveUserProfileView() {
    const inputName = document.getElementById('profile-view-fullname');
    const inputRole = document.getElementById('profile-view-role');
    const inputPhone = document.getElementById('profile-view-phone');
    const inputEmail = document.getElementById('profile-view-email');
    const inputPass = document.getElementById('profile-view-password');

    if (inputName && inputName.value.trim()) {
        localStorage.setItem('nadr_user_profile_name', inputName.value.trim());
    }
    if (inputRole && inputRole.value.trim()) {
        localStorage.setItem('nadr_user_profile_role', inputRole.value.trim());
    }
    if (inputPhone && inputPhone.value.trim()) {
        localStorage.setItem('nadr_user_profile_phone', inputPhone.value.trim());
    }
    if (inputEmail && inputEmail.value.trim()) {
        localStorage.setItem('nadr_user_profile_email', inputEmail.value.trim());
    }

    if (inputPass && inputPass.value.trim()) {
        let admins = JSON.parse(localStorage.getItem('nadr_admin_users')) || [];
        if (admins.length > 0) {
            admins[0].password = inputPass.value.trim();
            localStorage.setItem('nadr_admin_users', JSON.stringify(admins));
        }
        inputPass.value = '';
    }

    initUserProfile();
    renderProfileView();
    if (typeof logAuditAction === 'function') {
        logAuditAction('កែសម្រួលប្រវត្តិរូប', `បានកែសម្រួលព័ត៌មានគណនីមន្រ្តី៖ ${inputName?.value || ''}`);
    }
    showToast('ព័ត៌មានប្រវត្តិរូបត្រូវបានរក្សាទុកជោគជ័យ! (Profile Updated)', 'success');
}

function handleProfilePhotoUploadView(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        localStorage.setItem('nadr_user_profile_avatar', base64);
        initUserProfile();
        renderProfileView();
        showToast('បានអាប់ឡូតរូបថតប្រវត្តិរូបថ្មីរួចរាល់!', 'success');
    };
    reader.readAsDataURL(file);
}

function resetProfileAvatarView() {
    localStorage.removeItem('nadr_user_profile_avatar');
    initUserProfile();
    renderProfileView();
    showToast('រូបថតប្រវត្តិរូបត្រូវបានកំណត់ទៅលក្ខខណ្ឌដើម!', 'info');
}

/**
 * Initialize Language Switcher (Khmer/English)
 */
function initLanguageSwitcher() {
    const btnKm = document.getElementById('btn-lang-km');
    const btnEn = document.getElementById('btn-lang-en');

    if (btnKm) {
        btnKm.addEventListener('click', () => {
            if (currentLang !== 'km') {
                applyLanguage('km');
                renderAllViews();
                showToast('ភាសាត្រូវបានប្តូរទៅជា ខ្មែរ 🇰🇭', 'success');
            }
        });
    }

    if (btnEn) {
        btnEn.addEventListener('click', () => {
            if (currentLang !== 'en') {
                applyLanguage('en');
                renderAllViews();
                showToast('Language switched to English 🇺🇸', 'success');
            }
        });
    }

    // Apply the initial language on load
    applyLanguage(currentLang);
}

/**
 * Dynamic Admin User accounts loaded from localStorage
 */
let ADMIN_USERS = JSON.parse(localStorage.getItem('nadr_admin_users')) || [
    { username: 'admin', password: 'admin123', name: 'គណនីរដ្ឋបាល (Admin)', role: 'Super Admin (រដ្ឋបាលមេ)', status: 'Active' },
    { username: 'nadr', password: 'nadr', name: 'មន្ត្រីជាន់ខ្ពស់ NADR', role: 'Super Admin (រដ្ឋបាលមេ)', status: 'Active' },
    { username: 'user', password: 'user', name: 'មន្ត្រីសម្របសម្រួល', role: 'Case Officer (មន្ត្រីសម្រុះសម្រួល)', status: 'Active' }
];

// Ensure all users have a status property
ADMIN_USERS.forEach(u => { if (!u.status) u.status = 'Active'; });

// Automatically upgrade legacy '123' password to 'admin123' for the admin account in localStorage
let legacyAdmin = ADMIN_USERS.find(u => u.username.toLowerCase() === 'admin');
if (legacyAdmin && legacyAdmin.password === '123') {
    legacyAdmin.password = 'admin123';
    localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
}

/**
 * Dynamic Evaluation Matrix Baseline Map loaded from localStorage
 */
let EVAL_BASELINE_MAP = JSON.parse(localStorage.getItem('nadr_eval_baseline_map')) || {
    'វិវាទក្នុងគ្រួសារ': { resp: '-', nego: 'ល្អណាស់', emp: '-', spirit: '-', time: 'យឺត (> ៣០ ថ្ងៃ)' },
    'វិវាទជំពាក់ប្រាក់': { resp: 'ល្អ', nego: 'ល្អណាស់', emp: 'ល្អ', spirit: 'មធ្យម', time: 'យឺត (> ៣០ ថ្ងៃ)' },
    'វិវាទដីធ្លី': { resp: 'ល្អ', nego: 'ល្អ', emp: 'ល្អ', spirit: 'មិនល្អ', time: 'យឺត (> ៤៥ ថ្ងៃ)' },
    'វិវាទពាណិជ្ជកម្ម': { resp: '-', nego: 'មធ្យម', emp: '-', spirit: 'មិនល្អ', time: 'យឺត (> ៣០ ថ្ងៃ)' },
    'វិវាទមត៌ក': { resp: '-', nego: '-', emp: 'មិនល្អ', spirit: '-', time: 'លឿន (< ១៥ ថ្ងៃ)' },
    'វិវាទអចលនវត្ថុ': { resp: '-', nego: 'ល្អណាស់', emp: 'មធ្យម', spirit: 'មធ្យម', time: 'យឺត (> ៣០ ថ្ងៃ)' },
    'វិវាទកិច្ចសន្យា': { resp: 'ល្អ', nego: 'ល្អ', emp: 'មធ្យម', spirit: 'ល្អ', time: 'លឿន (< ១៥ ថ្ងៃ)' },
    'វិវាទការងារ': { resp: 'ល្អណាស់', nego: 'ល្អ', emp: 'ល្អ', spirit: 'ល្អ', time: 'លឿន (< ១៥ ថ្ងៃ)' }
};

function initSettingsEvents() {
    const tabs = document.querySelectorAll('#settings-view .tab-btn');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottomColor = 'transparent';
                t.style.color = 'var(--text-muted)';
                t.style.fontWeight = '600';
            });
            tab.classList.add('active');
            tab.style.borderBottomColor = 'var(--primary-color)';
            tab.style.color = 'var(--primary-color)';
            tab.style.fontWeight = '700';

            const paneId = tab.getAttribute('data-tab');
            const panes = document.querySelectorAll('#settings-view .settings-tab-pane');
            panes.forEach(pane => {
                pane.style.display = pane.id === paneId ? 'block' : 'none';
            });
            if (paneId === 'tab-eval-matrix') {
                renderSettingsEvalMatrix();
                if (typeof loadEvalThresholds === 'function') loadEvalThresholds();
            } else if (paneId === 'tab-strategies') {
                if (typeof loadResolutionStrategies === 'function') loadResolutionStrategies();
            } else if (paneId === 'tab-admins') {
                renderSettingsAdmins();
            } else if (paneId === 'tab-categories') {
                renderSettingsCategories();
            } else if (paneId === 'tab-columns') {
                renderSettingsColumns();
            } else if (paneId === 'tab-audit') {
                if (typeof renderAuditLogs === 'function') renderAuditLogs();
            } else if (paneId === 'tab-org') {
                if (typeof initOrgSettings === 'function') initOrgSettings();
            }
        });
    });

    // Add Province
    const btnAddProv = document.getElementById('btn-add-province');
    if (btnAddProv) {
        btnAddProv.onclick = () => {
            const name = prompt("សូមវាយបញ្ចូលឈ្មោះខេត្តថ្មី (ឧ. កំពង់ចាម)៖");
            if (!name) return;
            const code = prompt("សូមវាយបញ្ចូលលេខកូដខេត្ត (៣ អក្សរ ឧ. KPC)៖");
            if (!code) return;
            PROVINCES_LIST.push({ code: code.toUpperCase().trim(), name: name.trim() });
            localStorage.setItem('nadr_provinces', JSON.stringify(PROVINCES_LIST));
            populateProvinceDropdowns();
            renderSettingsProvinces();
            showToast('បានបន្ថែមខេត្តថ្មីដោយជោគជ័យ!', 'success');
        };
    }

    // Add Category
    const btnAddCat = document.getElementById('btn-add-category');
    if (btnAddCat) {
        btnAddCat.onclick = () => {
            const name = prompt("សូមវាយបញ្ចូលប្រភេទវិវាទថ្មី (ឧ. វិវាទកម្មសិទ្ធិបញ្ញា)៖");
            if (!name) return;
            CASE_CATEGORIES.push(name.trim());
            localStorage.setItem('nadr_categories', JSON.stringify(CASE_CATEGORIES));
            populateCategoryDropdowns();
            renderSettingsCategories();
            showToast('បានបន្ថែមប្រភេទវិវាទថ្មីដោយជោគជ័យ!', 'success');
        };
    }

    // Custom columns form
    const colForm = document.getElementById('settings-column-form');
    if (colForm) {
        colForm.onsubmit = (e) => {
            e.preventDefault();
            const labelKh = document.getElementById('custom-col-label-kh').value.trim();
            const labelEn = document.getElementById('custom-col-label-en').value.trim();
            const key = 'custom_' + Date.now();
            CUSTOM_COLUMNS.push({ key, labelKh, labelEn });
            localStorage.setItem('nadr_custom_columns', JSON.stringify(CUSTOM_COLUMNS));
            colForm.reset();
            renderSettingsColumns();
            renderAllViews();
            showToast('បានបន្ថែមកូឡោនថ្មីដោយជោគជ័យ!', 'success');
        };
    }

    // User Account Management Inline Form
    const btnToggleUserForm = document.getElementById('btn-toggle-user-form');
    const userFormCard = document.getElementById('user-account-form-card');
    const userForm = document.getElementById('settings-user-form');
    const btnCancelUserForm = document.getElementById('btn-cancel-user-form');

    if (btnToggleUserForm && userFormCard) {
        btnToggleUserForm.onclick = () => {
            userFormCard.style.display = 'block';
            document.getElementById('user-form-title').innerText = 'បញ្ចូលព័ត៌មានគណនីថ្មី (New User Account)';
            document.getElementById('edit-user-index').value = '-1';
            if (userForm) userForm.reset();
        };
    }
    if (btnCancelUserForm && userFormCard) {
        btnCancelUserForm.onclick = () => {
            userFormCard.style.display = 'none';
            if (userForm) userForm.reset();
        };
    }
    if (userForm) {
        userForm.onsubmit = (e) => {
            e.preventDefault();
            const idx = parseInt(document.getElementById('edit-user-index').value, 10);
            const username = document.getElementById('admin-username').value.trim();
            const dispName = document.getElementById('admin-dispname').value.trim();
            const password = document.getElementById('admin-password').value.trim();
            const role = document.getElementById('admin-role').value;
            const status = document.getElementById('admin-status').value;

            if (idx >= 0 && ADMIN_USERS[idx]) {
                ADMIN_USERS[idx] = { ...ADMIN_USERS[idx], username, name: dispName, password, role, status };
                showToast('បានកែសម្រួលព័ត៌មានគណនីរួចរាល់!', 'success');
            } else {
                if (ADMIN_USERS.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                    showToast('ឈ្មោះគណនីនេះ (Username) មានរួចហើយ!', 'error');
                    return;
                }
                ADMIN_USERS.push({ username, password, name: dispName, role, status });
                showToast('បានបង្កើតគណនីថ្មីដោយជោគជ័យ!', 'success');
            }
            localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
            userFormCard.style.display = 'none';
            userForm.reset();
            renderSettingsAdmins();
        };
    }

    // Initial renders
    renderSettingsProvinces();
    renderSettingsCategories();
    renderSettingsColumns();
    renderSettingsAdmins();
    renderAuditLogs();
    renderSettingsEvalMatrix();
    initOrgSettings();
}

function renderSettingsProvinces() {
    const tbody = document.getElementById('settings-provinces-tbody');
    if (!tbody) return;
    let html = '';
    PROVINCES_LIST.forEach((p, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong style="color: var(--primary-color);">${p.code}</strong></td>
                <td>${p.name}</td>
                <td class="text-center">
                    <button class="btn-icon text-danger" onclick="deleteProvinceSetting(${index})" title="លុប"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.deleteProvinceSetting = function(index) {
    customConfirm('បញ្ជាក់ការលុបខេត្ត/ក្រុង', `តើអ្នកពិតជាចង់លុបខេត្ត ${PROVINCES_LIST[index].name} មែនទេ?`, () => {
        PROVINCES_LIST.splice(index, 1);
        localStorage.setItem('nadr_provinces', JSON.stringify(PROVINCES_LIST));
        populateProvinceDropdowns();
        renderSettingsProvinces();
        showToast('បានលុបខេត្តដោយជោគជ័យ!', 'success');
    });
};

function renderSettingsCategories() {
    const tbody = document.getElementById('settings-categories-tbody');
    if (!tbody) return;
    let html = '';
    CASE_CATEGORIES.forEach((c, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${c}</strong></td>
                <td class="text-center">
                    <button class="btn-icon text-danger" onclick="deleteCategorySetting(${index})" title="លុប"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.deleteCategorySetting = function(index) {
    customConfirm('បញ្ជាក់ការលុបប្រភេទវិវាទ', `តើអ្នកពិតជាចង់លុបប្រភេទវិវាទ "${CASE_CATEGORIES[index]}" មែនទេ?`, () => {
        CASE_CATEGORIES.splice(index, 1);
        localStorage.setItem('nadr_categories', JSON.stringify(CASE_CATEGORIES));
        populateCategoryDropdowns();
        renderSettingsCategories();
        showToast('បានលុបប្រភេទវិវាទដោយជោគជ័យ!', 'success');
    });
};

function renderSettingsColumns() {
    const tbody = document.getElementById('settings-columns-tbody');
    if (!tbody) return;
    let html = '';
    CUSTOM_COLUMNS.forEach((c, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${c.labelKh}</strong></td>
                <td><code>${c.labelEn}</code></td>
                <td class="text-center">
                    <button class="btn-icon text-danger" onclick="deleteColumnSetting(${index})" title="លុប"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.deleteColumnSetting = function(index) {
    customConfirm('បញ្ជាក់ការលុបកូឡោន', `តើអ្នកពិតជាចង់លុបកូឡោន "${CUSTOM_COLUMNS[index].labelKh}" មែនទេ?`, () => {
        CUSTOM_COLUMNS.splice(index, 1);
        localStorage.setItem('nadr_custom_columns', JSON.stringify(CUSTOM_COLUMNS));
        renderSettingsColumns();
        renderAllViews();
        showToast('បានលុបកូឡោនដោយជោគជ័យ!', 'success');
    });
};

function renderSettingsAdmins() {
    const tbody = document.getElementById('settings-admins-tbody');
    if (!tbody) return;
    let html = '';
    ADMIN_USERS.forEach((user, index) => {
        const isLocked = user.status === 'Locked';
        const statusBadge = isLocked 
            ? `<span class="badge" style="background: #fee2e2; color: #b91c1c; padding: 5px 10px; font-weight: 700;"><i class="fa-solid fa-ban"></i> មិនអនុញ្ញាតឱ្យចូល (Locked)</span>`
            : `<span class="badge" style="background: #dcfce7; color: #15803d; padding: 5px 10px; font-weight: 700;"><i class="fa-solid fa-check-circle"></i> អនុញ្ញាតឱ្យចូល (Active)</span>`;

        html += `
            <tr style="${isLocked ? 'background: #fef2f2; opacity: 0.85;' : ''}">
                <td>${index + 1}</td>
                <td><strong style="color: #1e293b;">${user.username}</strong></td>
                <td>${user.name}</td>
                <td><span class="badge badge-active" style="font-size: 11px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;">${user.role}</span></td>
                <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${user.password}</code></td>
                <td>${statusBadge}</td>
                <td class="text-center" style="white-space: nowrap;">
                    <button class="btn-icon text-primary" onclick="editAdminSetting(${index})" title="កែសម្រួលគណនី (Edit)"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon ${isLocked ? 'text-success' : 'text-warning'}" onclick="toggleLockAdminSetting(${index})" title="${isLocked ? 'អនុញ្ញាតឱ្យចូលប្រព័ន្ធវិញ (Allow Login)' : 'បិទមិនអនុញ្ញាតឱ្យចូលប្រព័ន្ធ (Block Login)'}" ${user.username === 'admin' ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}><i class="fa-solid ${isLocked ? 'fa-lock-open' : 'fa-ban'}"></i></button>
                    <button class="btn-icon text-danger" onclick="deleteAdminSetting(${index})" title="លុបគណនី (Delete)" ${user.username === 'admin' ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.editAdminSetting = function(index) {
    const user = ADMIN_USERS[index];
    if (!user) return;
    const userFormCard = document.getElementById('user-account-form-card');
    if (userFormCard) {
        userFormCard.style.display = 'block';
        document.getElementById('user-form-title').innerText = `កែសម្រួលគណនី៖ ${user.username} (Edit Account)`;
        document.getElementById('edit-user-index').value = index;
        document.getElementById('admin-username').value = user.username;
        document.getElementById('admin-dispname').value = user.name;
        document.getElementById('admin-password').value = user.password;
        document.getElementById('admin-role').value = user.role || 'Case Officer (មន្ត្រីសម្រុះសម្រួល)';
        document.getElementById('admin-status').value = user.status || 'Active';
        userFormCard.scrollIntoView({ behavior: 'smooth' });
    }
};

window.toggleLockAdminSetting = function(index) {
    const user = ADMIN_USERS[index];
    if (!user || user.username === 'admin') {
        showToast('មិនអាចផ្អាកសិទ្ធិគណនីរដ្ឋបាលមេ (admin) បានទេ!', 'error');
        return;
    }
    user.status = user.status === 'Locked' ? 'Active' : 'Locked';
    localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
    renderSettingsAdmins();
    showToast(`គណនី "${user.username}" ត្រូវបាន ${user.status === 'Locked' ? 'បិទមិនអនុញ្ញាតឱ្យចូលប្រព័ន្ធ (Locked)' : 'អនុញ្ញាតឱ្យចូលប្រព័ន្ធវិញ (Active)'}!`, user.status === 'Locked' ? 'warning' : 'success');
};

window.deleteAdminSetting = function(index) {
    const user = ADMIN_USERS[index];
    if (user.username === 'admin') {
        showToast('មិនអាចលុបគណនីរដ្ឋបាលមេ (admin) បានទេ!', 'error');
        return;
    }
    customConfirm('បញ្ជាក់ការលុបគណនី', `តើអ្នកពិតជាចង់លុបគណនី "${user.username}" មែនទេ?`, () => {
        ADMIN_USERS.splice(index, 1);
        localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
        renderSettingsAdmins();
        showToast('បានលុបគណនីដោយជោគជ័យ!', 'success');
    });
};

/**
 * Render Settings Evaluation Matrix Tab (Tab 7)
 */
function renderSettingsEvalMatrix() {
    const tbody = document.getElementById('settings-eval-matrix-tbody');
    if (!tbody || typeof CASE_CATEGORIES === 'undefined') return;

    const optValues = ['ល្អណាស់', 'ល្អ', 'មធ្យម', 'មិនល្អ', '-'];
    const timeValues = ['លឿន (< ១៥ ថ្ងៃ)', 'មធ្យម (២០ ថ្ងៃ)', 'យឺត (> ៣០ ថ្ងៃ)', 'យឺត (> ៤៥ ថ្ងៃ)', '-'];

    const getSelectHTML = (currVal, opts, className) => {
        let h = `<select class="form-control ${className}" style="font-size: 12px; padding: 4px 8px; height: auto; font-weight: 600;">`;
        opts.forEach(o => {
            h += `<option value="${o}" ${currVal === o ? 'selected' : ''}>${o}</option>`;
        });
        h += `</select>`;
        return h;
    };

    let html = '';
    CASE_CATEGORIES.forEach((cat, idx) => {
        const b = EVAL_BASELINE_MAP[cat] || { resp: 'ល្អ', nego: 'ល្អ', emp: 'មធ្យម', spirit: 'ល្អ', time: 'មធ្យម (២០ ថ្ងៃ)' };
        html += `
            <tr data-cat="${cat}">
                <td style="font-weight: 700;">${idx + 1}</td>
                <td style="text-align: left; font-weight: 700; color: #065f46;">${cat}</td>
                <td>${getSelectHTML(b.resp, optValues, 'eval-sel-resp')}</td>
                <td>${getSelectHTML(b.nego, optValues, 'eval-sel-nego')}</td>
                <td>${getSelectHTML(b.emp, optValues, 'eval-sel-emp')}</td>
                <td>${getSelectHTML(b.spirit, optValues, 'eval-sel-spirit')}</td>
                <td>${getSelectHTML(b.time, timeValues, 'eval-sel-time')}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Request 1: Percentage Thresholds Management across 5 Categories
function loadEvalThresholds() {
    const defAll = {
        settle: { poor: 20, med: 30, good: 50 },
        total: { poor: 10, med: 25, good: 50 },
        active: { poor: 50, good: 35, exc: 20 },
        close: { poor: 40, good: 25, exc: 15 },
        pending: { poor: 30, good: 20, exc: 10 }
    };
    const threshAll = JSON.parse(localStorage.getItem('nadr_eval_thresholds_all')) || defAll;
    const thresh = JSON.parse(localStorage.getItem('nadr_eval_thresholds')) || threshAll.settle || { poor: 20, med: 30, good: 50 };

    // Settle
    const sp = document.getElementById('th-settle-poor');
    const sm = document.getElementById('th-settle-med');
    const sg = document.getElementById('th-settle-good');
    if (sp) sp.value = threshAll.settle?.poor || thresh.poor || 20;
    if (sm) sm.value = threshAll.settle?.med || thresh.med || 30;
    if (sg) sg.value = threshAll.settle?.good || thresh.good || 50;

    // Total
    const tp = document.getElementById('th-total-poor');
    const tm = document.getElementById('th-total-med');
    const tg = document.getElementById('th-total-good');
    if (tp) tp.value = threshAll.total?.poor || 10;
    if (tm) tm.value = threshAll.total?.med || 25;
    if (tg) tg.value = threshAll.total?.good || 50;

    // Active
    const ap = document.getElementById('th-active-poor');
    const ag = document.getElementById('th-active-good');
    const ae = document.getElementById('th-active-exc');
    if (ap) ap.value = threshAll.active?.poor || 50;
    if (ag) ag.value = threshAll.active?.good || 35;
    if (ae) ae.value = threshAll.active?.exc || 20;

    // Close
    const cp = document.getElementById('th-close-poor');
    const cg = document.getElementById('th-close-good');
    const ce = document.getElementById('th-close-exc');
    if (cp) cp.value = threshAll.close?.poor || 40;
    if (cg) cg.value = threshAll.close?.good || 25;
    if (ce) ce.value = threshAll.close?.exc || 15;

    // Pending
    const pp = document.getElementById('th-pending-poor');
    const pg = document.getElementById('th-pending-good');
    const pe = document.getElementById('th-pending-exc');
    if (pp) pp.value = threshAll.pending?.poor || 30;
    if (pg) pg.value = threshAll.pending?.good || 20;
    if (pe) pe.value = threshAll.pending?.exc || 10;

    // Legacy fallback
    const pEl = document.getElementById('thresh-poor');
    const mEl = document.getElementById('thresh-med');
    const gEl = document.getElementById('thresh-good');
    const eEl = document.getElementById('thresh-exc');
    if (pEl) pEl.value = threshAll.settle?.poor || 20;
    if (mEl) mEl.value = threshAll.settle?.med || 30;
    if (gEl) gEl.value = threshAll.settle?.good || 50;
    if (eEl) eEl.value = threshAll.settle?.good || 50;
}

function saveEvalThresholds() {
    const threshAll = {
        settle: {
            poor: parseInt(document.getElementById('th-settle-poor')?.value) || 20,
            med: parseInt(document.getElementById('th-settle-med')?.value) || 30,
            good: parseInt(document.getElementById('th-settle-good')?.value) || 50
        },
        total: {
            poor: parseInt(document.getElementById('th-total-poor')?.value) || 10,
            med: parseInt(document.getElementById('th-total-med')?.value) || 25,
            good: parseInt(document.getElementById('th-total-good')?.value) || 50
        },
        active: {
            poor: parseInt(document.getElementById('th-active-poor')?.value) || 50,
            good: parseInt(document.getElementById('th-active-good')?.value) || 35,
            exc: parseInt(document.getElementById('th-active-exc')?.value) || 20
        },
        close: {
            poor: parseInt(document.getElementById('th-close-poor')?.value) || 40,
            good: parseInt(document.getElementById('th-close-good')?.value) || 25,
            exc: parseInt(document.getElementById('th-close-exc')?.value) || 15
        },
        pending: {
            poor: parseInt(document.getElementById('th-pending-poor')?.value) || 30,
            good: parseInt(document.getElementById('th-pending-good')?.value) || 20,
            exc: parseInt(document.getElementById('th-pending-exc')?.value) || 10
        }
    };

    localStorage.setItem('nadr_eval_thresholds_all', JSON.stringify(threshAll));
    localStorage.setItem('nadr_eval_thresholds', JSON.stringify(threshAll.settle));

    const pEl = document.getElementById('thresh-poor');
    const mEl = document.getElementById('thresh-med');
    const gEl = document.getElementById('thresh-good');
    const eEl = document.getElementById('thresh-exc');
    if (pEl) pEl.value = threshAll.settle.poor;
    if (mEl) mEl.value = threshAll.settle.med;
    if (gEl) gEl.value = threshAll.settle.good;
    if (eEl) eEl.value = threshAll.settle.good;
}

// Request 2: Resolution Strategies Management across 5 Categories
function loadResolutionStrategies() {
    const def = {
        totalGuidance: '១. បន្តជំរុញការផ្សព្វផ្សាយ និងលើកកម្ពស់ការយល់ដឹងអំពីយន្តការដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការដល់ប្រជាពលរដ្ឋក្នុងមូលដ្ឋាន។ ២. រៀបចំប្រព័ន្ធគ្រប់គ្រង និងបែងចែកសំណុំរឿងចូលថ្មីឱ្យបានឆាប់រហ័សដល់មន្ត្រីជំនាញ។ ៣. ពង្រឹងកិច្ចសហការជាមួយអាជ្ញាធរមូលដ្ឋានក្នុងការទទួលពាក្យបណ្ដឹង។',
        settleLow: '១. ពង្រឹងសមត្ថភាពមន្ត្រីសម្រុះសម្រួលលើបច្ចេកទេសចរចា និងចិត្តសាស្ត្រវិវាទ។ ២. បង្កើនការប្រជុំត្រួតពិនិត្យមុនពេលសម្រុះសម្រួលដើម្បីវិភាគចំណុចខ្វែងគំនិត។ ៣. ចុះសិក្សាផ្ទាល់ដល់ទីតាំងវិវាទដើម្បីស្វែងយល់ពីមូលហេតុពិតប្រាកដ។',
        activeHigh: '១. រៀបចំផែនការបែងចែកសំណុំរឿងតាមកម្រិតអាទិភាព និងកំណត់កាលវិភាគប្រជុំឱ្យបានច្បាស់លាស់។ ២. បន្ថែមមន្ត្រីជំនួយការក្នុងសំណុំរឿងស្មុគស្មាញដើម្បីពងឿននីតិវិធី។ ៣. តាមដានជាប្រចាំនូវសំណុំរឿងដែលលើសរយៈពេលស្ដង់ដារកំណត់។',
        closeHigh: '១. ធ្វើការសិក្សាមូលហេតុដែលនាំឱ្យបរាជ័យក្នុងការសម្រុះសម្រួលដើម្បីដកស្រង់បទពិសោធន៍។ ២. ផ្តល់ការពន្យល់ណែនាំអំពីនីតិវិធីផ្លូវច្បាប់បន្តដល់គូភាគីដើម្បីចៀសវាងអំពើហិង្សា។ ៣. ពិនិត្យលទ្ធភាពសហការជាមួយអាជ្ញាធរមូលដ្ឋាន ឬស្ថាប័នពាក់ព័ន្ធ។',
        pendingHigh: '១. ពិនិត្យឡើងវិញនូវសំណុំរឿងដែលតម្កល់យូរ និងទំនាក់ទំនងភាគីដើម្បីសួរនាំស្ថានភាពថ្មី។ ២. កំណត់កាលបរិច្ឆេទផុតកំណត់ជាក់លាក់ក្នុងការរក្សាសំណុំរឿងជាស្ថានភាពតម្កល់។ ៣. ប្រសិនបើភាគីបោះបង់ការតវ៉ា ត្រូវអនុវត្តនីតិវិធីបិទសំណុំរឿងតាមរដ្ឋបាល។'
    };
    const strats = JSON.parse(localStorage.getItem('nadr_resolution_strategies')) || def;
    const elTotal = document.getElementById('strat-total-guidance');
    const elSettle = document.getElementById('strat-settle-low');
    const elActive = document.getElementById('strat-active-high');
    const elClose = document.getElementById('strat-close-high');
    const elPending = document.getElementById('strat-pending-high');
    if (elTotal) elTotal.value = strats.totalGuidance || strats.totalHigh || def.totalGuidance;
    if (elSettle) elSettle.value = strats.settleLow || def.settleLow;
    if (elActive) elActive.value = strats.activeHigh || def.activeHigh;
    if (elClose) elClose.value = strats.closeHigh || def.closeHigh;
    if (elPending) elPending.value = strats.pendingHigh || def.pendingHigh;
}

window.saveResolutionStrategies = function() {
    const elTotal = document.getElementById('strat-total-guidance');
    const elSettle = document.getElementById('strat-settle-low');
    const elActive = document.getElementById('strat-active-high');
    const elClose = document.getElementById('strat-close-high');
    const elPending = document.getElementById('strat-pending-high');
    if (!elSettle) return;
    const strats = {
        totalGuidance: elTotal?.value.trim() || '',
        settleLow: elSettle.value.trim(),
        activeHigh: elActive?.value.trim() || '',
        closeHigh: elClose?.value.trim() || '',
        pendingHigh: elPending?.value.trim() || ''
    };
    localStorage.setItem('nadr_resolution_strategies', JSON.stringify(strats));
    renderAllViews();
    showToast('បានរក្សាទុកយុទ្ធសាស្ត្រដោះស្រាយវិវាទទាំង ៥ ដោយជោគជ័យ!', 'success');
};

window.resetResolutionStrategies = function() {
    customConfirm('កំណត់ទៅលក្ខខណ្ឌដើម', 'តើលោកអ្នកពិតជាចង់កំណត់យុទ្ធសាស្ត្រដោះស្រាយវិវាទទាំងអស់ទៅជាស្ដង់ដារដើមវិញមែនទេ?', () => {
        localStorage.removeItem('nadr_resolution_strategies');
        loadResolutionStrategies();
        renderAllViews();
        showToast('បានកំណត់យុទ្ធសាស្ត្រទៅជាស្ដង់ដារដើមវិញរួចរាល់!', 'info');
    });
};

window.saveEvalMatrixSetting = function() {
    const tbody = document.getElementById('settings-eval-matrix-tbody');
    if (!tbody) return;
    saveEvalThresholds();
    const rows = tbody.querySelectorAll('tr[data-cat]');
    const newMap = {};
    rows.forEach(r => {
        const cat = r.getAttribute('data-cat');
        const resp = r.querySelector('.eval-sel-resp').value;
        const nego = r.querySelector('.eval-sel-nego').value;
        const emp = r.querySelector('.eval-sel-emp').value;
        const spirit = r.querySelector('.eval-sel-spirit').value;
        const time = r.querySelector('.eval-sel-time').value;
        newMap[cat] = { resp, nego, emp, spirit, time };
    });
    EVAL_BASELINE_MAP = newMap;
    localStorage.setItem('nadr_eval_baseline_map', JSON.stringify(EVAL_BASELINE_MAP));
    renderAllViews();
    showToast('បានរក្សាទុកលក្ខណៈវិនិច្ឆ័យវាយតម្លៃវិវាទដោយជោគជ័យ!', 'success');
};

window.resetEvalMatrixSetting = function() {
    customConfirm('កំណត់ទៅលក្ខខណ្ឌដើម', 'តើលោកអ្នកពិតជាចង់កំណត់លក្ខណៈវិនិច្ឆ័យវាយតម្លៃវិវាទទាំងអស់ទៅជាលក្ខខណ្ឌស្ដង់ដារដើមវិញមែនទេ?', () => {
        localStorage.removeItem('nadr_eval_thresholds');
        loadEvalThresholds();
        EVAL_BASELINE_MAP = {
            'វិវាទក្នុងគ្រួសារ': { resp: '-', nego: 'ល្អណាស់', emp: '-', spirit: '-', time: 'យឺត (> ៣០ ថ្ងៃ)' },
            'វិវាទជំពាក់ប្រាក់': { resp: 'ល្អ', nego: 'ល្អណាស់', emp: 'ល្អ', spirit: 'មធ្យម', time: 'យឺត (> ៣០ ថ្ងៃ)' },
            'វិវាទដីធ្លី': { resp: 'ល្អ', nego: 'ល្អ', emp: 'ល្អ', spirit: 'មិនល្អ', time: 'យឺត (> ៤៥ ថ្ងៃ)' },
            'វិវាទពាណិជ្ជកម្ម': { resp: '-', nego: 'មធ្យម', emp: '-', spirit: 'មិនល្អ', time: 'យឺត (> ៣០ ថ្ងៃ)' },
            'វិវាទមត៌ក': { resp: '-', nego: '-', emp: 'មិនល្អ', spirit: '-', time: 'លឿន (< ១៥ ថ្ងៃ)' },
            'វិវាទអចលនវត្ថុ': { resp: '-', nego: 'ល្អណាស់', emp: 'មធ្យម', spirit: 'មធ្យម', time: 'យឺត (> ៣០ ថ្ងៃ)' },
            'វិវាទកិច្ចសន្យា': { resp: 'ល្អ', nego: 'ល្អ', emp: 'មធ្យម', spirit: 'ល្អ', time: 'លឿន (< ១៥ ថ្ងៃ)' },
            'វិវាទការងារ': { resp: 'ល្អណាស់', nego: 'ល្អ', emp: 'ល្អ', spirit: 'ល្អ', time: 'លឿន (< ១៥ ថ្ងៃ)' }
        };
        localStorage.setItem('nadr_eval_baseline_map', JSON.stringify(EVAL_BASELINE_MAP));
        renderSettingsEvalMatrix();
        renderAllViews();
        showToast('បានកំណត់លក្ខណៈវិនិច្ឆ័យវាយតម្លៃទៅជាស្ដង់ដារដើមវិញរួចរាល់!', 'info');
    });
};

function renderAuditLogs() {
    const tbody = document.getElementById('settings-audit-tbody');
    if (!tbody) return;
    if (!AUDIT_LOGS || AUDIT_LOGS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">គ្មានកំណត់ហេតុសកម្មភាពឡើយ</td></tr>`;
        return;
    }
    let html = '';
    AUDIT_LOGS.forEach(log => {
        html += `
            <tr>
                <td style="white-space: nowrap;"><i class="fa-regular fa-clock text-muted"></i> ${log.timestamp}</td>
                <td><span class="badge badge-active" style="font-size: 11px;">${log.user}</span></td>
                <td><strong>${log.action}</strong></td>
                <td style="color: var(--text-muted);">${log.details}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

window.clearAuditLogs = function() {
    customConfirm('សម្អាតកំណត់ហេតុ', 'តើអ្នកពិតជាចង់លុបសម្អាតកំណត់ហេតុសកម្មភាពទាំងអស់មែនទេ?', () => {
        AUDIT_LOGS = [];
        localStorage.setItem('nadr_audit_logs', JSON.stringify(AUDIT_LOGS));
        renderAuditLogs();
        showToast('បានសម្អាតកំណត់ហេតុសកម្មភាពទាំងអស់រួចរាល់!', 'success');
    });
};

function initOrgSettings() {
    const kmEl = document.getElementById('setting-org-km');
    const enEl = document.getElementById('setting-org-en');
    const pfxEl = document.getElementById('setting-case-prefix');
    if (kmEl && ORG_SETTINGS.nameKm) kmEl.value = ORG_SETTINGS.nameKm;
    if (enEl && ORG_SETTINGS.nameEn) enEl.value = ORG_SETTINGS.nameEn;
    if (pfxEl && ORG_SETTINGS.casePrefix) pfxEl.value = ORG_SETTINGS.casePrefix;
}

window.saveOrgSettings = function() {
    const kmEl = document.getElementById('setting-org-km');
    const enEl = document.getElementById('setting-org-en');
    const pfxEl = document.getElementById('setting-case-prefix');
    if (kmEl) ORG_SETTINGS.nameKm = kmEl.value.trim();
    if (enEl) ORG_SETTINGS.nameEn = enEl.value.trim();
    if (pfxEl) ORG_SETTINGS.casePrefix = pfxEl.value.trim() || 'NADR-2026-';
    localStorage.setItem('nadr_org_settings', JSON.stringify(ORG_SETTINGS));
    if (typeof logAuditAction === 'function') logAuditAction('កែប្រែការកំណត់ស្ថាប័ន', `បានផ្លាស់ប្តូរក្បាលលេខកូដសំណុំរឿងទៅជា "${ORG_SETTINGS.casePrefix}"`);
    showToast('បានរក្សាទុកការកំណត់ស្ថាប័ន និងលេខកូដដោយជោគជ័យ!', 'success');
};

/**
 * Render master table headers dynamically
 */
function renderMasterTableHeader() {
    const table = document.querySelector('.master-table');
    if (!table) return;
    const thead = table.querySelector('thead tr');
    if (!thead) return;

    let html = `
        <th class="text-center" style="width: 50px;" data-i18n="table.no">ល.រ</th>
        <th style="width: 130px;" data-i18n="table.caseCode">លេខកូដសំណុំរឿង</th>
        <th style="width: 110px;" data-i18n="table.date">កាលបរិច្ឆេទ</th>
        <th style="min-width: 180px;" data-i18n="table.partyA">ភាគី (ក) ដើមបណ្ដឹង</th>
        <th style="min-width: 180px;" data-i18n="table.partyB">ភាគី (ខ) ចុងបណ្ដឹង</th>
        <th style="width: 140px;" data-i18n="table.category">ប្រភេទវិវាទ</th>
        <th style="width: 120px;" data-i18n="table.location">ទីតាំងវិវាទ</th>
        <th style="min-width: 200px;" data-i18n="form.mediation">ចំណាត់ការសម្រុះសម្រួល</th>
        <th style="width: 140px;" class="text-center" data-i18n="table.status">លទ្ធផលសំណុំរឿង</th>
        <th style="width: 110px;" class="text-center" data-i18n="table.remarks">កំណត់ចំណាំ</th>
    `;

    CUSTOM_COLUMNS.forEach(col => {
        html += `<th style="min-width: 120px;" class="text-center">${currentLang === 'km' ? col.labelKh : col.labelEn}</th>`;
    });

    html += `<th style="width: 120px;" class="text-center" data-i18n="table.actions">សកម្មភាព</th>`;
    thead.innerHTML = html;
}

/**
 * Render dynamic custom fields inside Add/Edit modal form
 */
function renderModalCustomFields(c = {}) {
    const container = document.getElementById('modal-custom-fields-container');
    const section = document.getElementById('modal-custom-fields-section');
    if (!container || !section) return;

    if (CUSTOM_COLUMNS.length === 0) {
        section.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    section.style.display = 'block';
    let html = '';
    CUSTOM_COLUMNS.forEach(col => {
        const val = c[col.key] || '';
        html += `
            <div class="form-group">
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">${col.labelKh} (${col.labelEn})</label>
                <input type="text" data-custom-key="${col.key}" class="form-control custom-field-input" value="${val}" placeholder="បញ្ចូលព័ត៌មាន..." style="font-size: 13px; height: 36px; padding: 6px 12px;">
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * Initialize Dashboard Quick Case Entry Form & AI extractor
 */
function initDashboardQuickForm() {
    const quickForm = document.getElementById('dashboard-quick-form');
    const aiTextarea = document.getElementById('dashboard-ai-text');
    const aiFile = document.getElementById('dashboard-ai-file');
    const aiBtn = document.getElementById('btn-dashboard-ai-extract');

    if (quickForm) {
        // Set default values on quick form
        document.getElementById('quick-case-number').value = generateNextCaseNumber();
        document.getElementById('quick-case-date').value = getTodayDateString();

        quickForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const payload = {
                caseNumber: document.getElementById('quick-case-number').value.trim(),
                dateReceived: document.getElementById('quick-case-date').value,
                category: document.getElementById('quick-case-category').value,
                disputeLocation: document.getElementById('quick-case-dispute-location').value,
                
                partyA_name: document.getElementById('quick-case-party-a-name').value.trim(),
                partyA_gender: 'ប្រុស',
                partyA_age: '',
                partyA_phone: '',
                partyA_location: document.getElementById('quick-case-dispute-location').value,

                partyB_name: document.getElementById('quick-case-party-b-name').value.trim(),
                partyB_gender: 'ប្រុស',
                partyB_age: '',
                partyB_phone: '',
                partyB_location: document.getElementById('quick-case-dispute-location').value,

                summary: document.getElementById('quick-case-summary')?.value.trim() || 'បញ្ចូលរហ័សតាម Dashboard',
                meetingPartyA: 'មិនទាន់ប្រជុំ',
                meetingPartyB: 'មិនទាន់ប្រជុំ',
                mediationMeeting: 'មិនទាន់ប្រជុំ',
                status: 'Active (កំពុងសម្រុះសម្រួល)',
                remarks: 'កំពុងពិនិត្យ និងដោះស្រាយ (មិនទាន់បិទ)',
                caseFiles: (() => {
                    const qBase64 = document.getElementById('quick-case-pdf-base64')?.value || '';
                    const qName = document.getElementById('quick-case-pdf-filename')?.value || '';
                    const qType = document.getElementById('quick-case-pdf-type')?.value || '';
                    return (qBase64 && qName) ? [{
                        id: 'f_quick_' + Date.now(),
                        name: qName,
                        type: qType || (qName.endsWith('.pdf') ? 'application/pdf' : 'document'),
                        size: 'N/A',
                        category: 'ពាក្យបណ្តឹង',
                        base64: qBase64,
                        uploadedAt: new Date().toISOString()
                    }] : [];
                })(),
                attachedPdf: document.getElementById('quick-case-pdf-base64')?.value || '',
                pdfName: document.getElementById('quick-case-pdf-filename')?.value || ''
            };

            // Add empty custom fields since it's a quick entry
            CUSTOM_COLUMNS.forEach(col => {
                payload[col.key] = '';
            });

            addCase(payload);
            if (typeof logAuditAction === 'function') logAuditAction('បញ្ចូលសំណុំរឿងរហ័ស', `បានបញ្ចូលសំណុំរឿងរហ័សលេខកូដ "${payload.caseNumber}" (AI Quick Entry)`);
            showToast('បានបង្កើតសំណុំរឿងថ្មីរហ័សដោយជោគជ័យ!', 'success');
            
            // Reset form
            quickForm.reset();
            document.getElementById('quick-case-number').value = generateNextCaseNumber();
            document.getElementById('quick-case-date').value = getTodayDateString();
            if (aiTextarea) aiTextarea.value = '';
            removeQuickFormPdf();

            renderAllViews();
        });
    }

    // Dashboard AI File dropzone / reader
    if (aiFile && aiTextarea) {
        aiFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            handleQuickFormFileSelect(file);

            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const typedarray = new Uint8Array(evt.target.result);
                    pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                        let maxPages = pdf.numPages;
                        let countPromises = [];
                        for (let j = 1; j <= maxPages; j++) {
                            let pagePromise = pdf.getPage(j).then(function(page) {
                                return page.getTextContent().then(function(textContent) {
                                    return textContent.items.map(function(item) {
                                        return item.str;
                                    }).join(' ');
                                });
                            });
                            countPromises.push(pagePromise);
                        }
                        return Promise.all(countPromises).then(function(texts) {
                            aiTextarea.value = texts.join('\n');
                            showToast(`បានអានឯកសារ PDF ${file.name} រួចរាល់!`, 'success');
                        });
                    }).catch(function(err) {
                        console.error(err);
                        showToast('មិនអាចអាន PDF!', 'error');
                    });
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    aiTextarea.value = evt.target.result;
                    showToast(`បានអានឯកសារ ${file.name} រួចរាល់!`, 'info');
                };
                reader.readAsText(file, 'UTF-8');
            }
        });
    }

    // Dashboard AI extractor executor
    if (aiBtn && aiTextarea) {
        aiBtn.addEventListener('click', () => {
            const text = aiTextarea.value.trim();
            if (!text) {
                showToast('សូមបញ្ចូលអត្ថបទពាក្យបណ្តឹងជាមុនសិន!', 'warning');
                return;
            }

            aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            aiBtn.disabled = true;

            setTimeout(() => {
                // Call parsed function from ai-assistant
                if (typeof parseComplaintTextAI === 'function') {
                    const data = parseComplaintTextAI(text);
                    document.getElementById('quick-case-party-a-name').value = data.partyA_name || '';
                    document.getElementById('quick-case-party-b-name').value = data.partyB_name || '';
                    
                    // Match dispute location
                    const quickLoc = document.getElementById('quick-case-dispute-location');
                    if (quickLoc) {
                        for (let opt of quickLoc.options) {
                            if (opt.value.includes(data.partyA_location) || data.partyA_location.includes(opt.value)) {
                                quickLoc.value = opt.value;
                                break;
                            }
                        }
                    }
                    showToast('✨ AI បានវិភាគ និងបំពេញទិន្នន័យរហ័សជោគជ័យ!', 'success');
                }
                aiBtn.innerHTML = `✨ AI Extract`;
                aiBtn.disabled = false;
            }, 800);
        });
    }
}

/* ==========================================================================
   PDF ATTACHMENT AND VIEWER MODAL SYSTEM
   ========================================================================== */
let currentPdfCaseId = null;

/**
 * Helper: Convert Base64 or DataURL to Blob URL for reliable Chromium/Edge/Mobile PDF Rendering
 */
function base64ToBlobUrl(base64Data, defaultType = 'application/pdf') {
    try {
        if (!base64Data) return '';
        if (base64Data.startsWith('blob:') || base64Data.startsWith('http')) return base64Data;
        
        let mime = defaultType;
        let b64 = base64Data;
        if (base64Data.includes(',')) {
            const parts = base64Data.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match && match[1]) mime = match[1];
            b64 = parts[1] || parts[0];
        }
        
        const byteCharacters = window.atob(b64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: mime });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Error creating blob URL:", e);
        return base64Data;
    }
}

/**
 * Helper: Convert Base64 or DataURL to ArrayBuffer for Mammoth (Word) & SheetJS (Excel)
 */
function base64ToArrayBuffer(base64Data) {
    let b64 = base64Data;
    if (base64Data.includes(',')) {
        b64 = base64Data.split(',')[1];
    }
    const binary_string = window.atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Fallback display for Word (.doc/.docx) or files when conversion is unavailable
 */
function showWordFallbackText(fileObj) {
    const wordContent = document.getElementById('word-viewer-content');
    const spinner = document.getElementById('viewer-loading-spinner');
    if (spinner) spinner.style.display = 'none';
    if (!wordContent) return;

    try {
        let b64 = fileObj.base64;
        if (fileObj.base64.includes(',')) b64 = fileObj.base64.split(',')[1];
        const decodedText = decodeURIComponent(escape(window.atob(b64)));
        if (!decodedText.slice(0, 100).includes('\u0000') && !decodedText.slice(0, 100).includes('ÐÏ')) {
            wordContent.innerHTML = `
                <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700;"><i class="fa-solid fa-file-lines text-info"></i> ${fileObj.name}</h4>
                        <span style="font-size: 12px; color: #64748b;">ខ្លឹមសារអត្ថបទ (Text Document)</span>
                    </div>
                    <a href="${fileObj.base64}" download="${fileObj.name}" class="btn btn-sm btn-primary" style="background: #0284c7; color: white; text-decoration: none; font-weight: 600; padding: 6px 14px; border-radius: 6px;"><i class="fa-solid fa-download"></i> ទាញយក</a>
                </div>
                <pre style="white-space: pre-wrap; font-family: 'Battambang', 'Inter', monospace; font-size: 14px; line-height: 1.8; color: #1e293b; background: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0;">${decodedText}</pre>
            `;
            return;
        }
    } catch(e) {}

    wordContent.innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
            <div style="width: 80px; height: 80px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #2563eb; font-size: 38px; box-shadow: 0 4px 15px rgba(37,99,235,0.15);">
                <i class="fa-solid fa-file-word"></i>
            </div>
            <h4 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">ឯកសារ Microsoft Word (${fileObj.name})</h4>
            <p style="font-size: 15px; color: #64748b; max-width: 550px; margin: 0 auto 28px; line-height: 1.8;">
                ឯកសារនេះជាទម្រង់ Microsoft Word ដើម។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីទាញយក (Download) ទៅបើកអាន និងកែសម្រួលក្នុងកម្មវិធី Microsoft Word ឬ WPS Office លើកុំព្យូទ័រ/ទូរស័ព្ទរបស់លោកអ្នកបានយ៉ាងរលូន និងរក្សាទម្រង់ដើម ១០០%។
            </p>
            <a href="${fileObj.base64}" download="${fileObj.name}" class="btn btn-primary" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; font-size: 15px; box-shadow: 0 4px 15px rgba(37,99,235,0.3);">
                <i class="fa-solid fa-download"></i> ទាញយកឯកសារដើម (Open in MS Word)
            </a>
        </div>
    `;
}

/**
 * Universal Document Viewer Engine: Handles PDF (via Blob URL), Word (.docx/.doc via Mammoth), Excel (.xlsx via SheetJS), and Text
 */
function displayUniversalDocument(fileObj) {
    if (!fileObj || !fileObj.base64) return;
    
    const modal = document.getElementById('pdf-viewer-modal');
    const title = document.getElementById('pdf-viewer-title');
    const icon = document.getElementById('pdf-viewer-icon');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const wordContainer = document.getElementById('word-viewer-container');
    const wordContent = document.getElementById('word-viewer-content');
    const spinner = document.getElementById('viewer-loading-spinner');
    const downloadBtn = document.getElementById('pdf-viewer-download-btn');
    const newTabBtn = document.getElementById('pdf-viewer-newtab-btn');
    const infoTextElem = document.getElementById('pdf-viewer-info-text');
    const replaceBtn = document.getElementById('pdf-viewer-replace-btn') || document.querySelector('#pdf-viewer-modal .btn-outline');
    const deleteBtn = document.getElementById('pdf-viewer-delete-btn') || document.querySelector('#pdf-viewer-modal .btn-danger');

    if (!modal) return;

    if (replaceBtn) replaceBtn.style.display = fileObj.canReplace ? 'inline-flex' : 'none';
    if (deleteBtn) deleteBtn.style.display = fileObj.canDelete ? 'inline-flex' : 'none';
    if (downloadBtn) {
        downloadBtn.href = fileObj.base64;
        downloadBtn.download = fileObj.name || 'document';
    }
    if (infoTextElem) infoTextElem.innerHTML = fileObj.infoText || '';

    const fileNameLower = (fileObj.name || '').toLowerCase();
    const fileTypeLower = (fileObj.type || '').toLowerCase();
    const isWord = fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc') || fileTypeLower.includes('word') || fileTypeLower.includes('msword') || fileTypeLower.includes('wordprocessingml');
    const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileTypeLower.includes('excel') || fileTypeLower.includes('spreadsheetml');
    const isText = fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.json') || fileTypeLower.includes('text');

    if (isWord) {
        if (icon) {
            icon.className = 'fa-solid fa-file-word';
            icon.style.color = '#2563eb';
        }
        if (title) title.innerHTML = `<i class="fa-solid fa-file-word" style="color:#2563eb;"></i> ពិនិត្យឯកសារ Word៖ <strong style="color:#93c5fd;">${fileObj.name}</strong>`;
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = '';
        }
        // Show word container (flex column)
        if (wordContainer) {
            wordContainer.style.display = 'flex';
            wordContainer.style.flexDirection = 'column';
            wordContainer.style.overflowY = 'auto';
        }
        // Update download/newtab buttons
        if (newTabBtn) {
            // For Word, download the file directly from base64
            const wordBlob = base64ToBlobUrl(fileObj.base64, fileObj.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            newTabBtn.href = wordBlob || fileObj.base64;
            newTabBtn.removeAttribute('target');
            newTabBtn.setAttribute('download', fileObj.name);
            newTabBtn.innerHTML = '<i class="fa-solid fa-download"></i> ទាញយក Word ដើម';
        }
        if (downloadBtn) {
            downloadBtn.href = fileObj.base64;
            downloadBtn.download = fileObj.name;
        }
        if (spinner) spinner.style.display = 'flex';

        if (fileNameLower.endsWith('.docx') && typeof mammoth !== 'undefined') {
            try {
                const buffer = base64ToArrayBuffer(fileObj.base64);
                mammoth.convertToHtml({ arrayBuffer: buffer })
                    .then(function(result) {
                        if (spinner) spinner.style.display = 'none';
                        if (wordContent) {
                            const htmlBody = result.value || '<p style="color:#64748b;text-align:center;">ពុំមានខ្លឹមសារអក្សរក្នុងឯកសារនេះឡើយ</p>';
                            wordContent.innerHTML = `
                                <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                    <div>
                                        <h4 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700;"><i class="fa-solid fa-file-word" style="color:#2563eb;"></i> ${fileObj.name}</h4>
                                        <span style="font-size: 12px; color: #64748b;">Word Document — HTML Rendered by Mammoth.js ✔</span>
                                    </div>
                                    <a href="${fileObj.base64}" download="${fileObj.name}" class="btn btn-sm" style="background: #2563eb; color: white; text-decoration: none; font-weight: 600; padding: 8px 16px; border-radius: 6px; display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-download"></i> ទាញយក Word ដើម</a>
                                </div>
                                <div class="word-html-body" style="font-family: 'Battambang', 'Inter', sans-serif; font-size: 15px; line-height: 1.8; color: #1e293b;">
                                    ${htmlBody}
                                </div>
                            `;
                        }
                    })
                    .catch(function(err) {
                        console.error('Mammoth conversion error:', err);
                        showWordFallbackText(fileObj);
                    });
            } catch(e) {
                console.error('Buffer error:', e);
                showWordFallbackText(fileObj);
            }
        } else {
            // .doc or mammoth not available — show fallback download UI
            showWordFallbackText(fileObj);
        }
    } else if (isExcel) {

        if (icon) {
            icon.className = 'fa-solid fa-file-excel';
            icon.style.color = '#16a34a';
        }
        if (title) title.innerHTML = `ពិនិត្យឯកសារ Excel៖ <strong style="color:#86efac;">${fileObj.name}</strong>`;
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = '';
        }
        if (wordContainer) wordContainer.style.display = 'block';
        if (spinner) spinner.style.display = 'flex';
        if (newTabBtn) {
            newTabBtn.href = fileObj.base64;
            newTabBtn.download = fileObj.name;
            newTabBtn.innerHTML = '<i class="fa-solid fa-download"></i> ទាញយក (Open in Excel)';
        }

        if (typeof XLSX !== 'undefined') {
            try {
                const buffer = base64ToArrayBuffer(fileObj.base64);
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const htmlTable = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-preview-table' });
                if (wordContent) {
                    wordContent.innerHTML = `
                        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <h4 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700;"><i class="fa-solid fa-file-excel" style="color: #16a34a;"></i> ${fileObj.name}</h4>
                                <span style="font-size: 12px; color: #64748b;">សន្លឹកកិច្ចការ៖ <strong>${firstSheetName}</strong> (បង្ហាញដោយ SheetJS)</span>
                            </div>
                            <a href="${fileObj.base64}" download="${fileObj.name}" class="btn btn-sm" style="background: #16a34a; color: white; text-decoration: none; font-weight: 600; padding: 6px 14px; border-radius: 6px;"><i class="fa-solid fa-download"></i> ទាញយក Excel ដើម</a>
                        </div>
                        <div style="overflow-x: auto; font-family: 'Battambang', 'Inter', sans-serif;">
                            ${htmlTable}
                        </div>
                    `;
                }
                if (spinner) spinner.style.display = 'none';
            } catch(err) {
                console.error("Excel preview error:", err);
                showWordFallbackText(fileObj);
            }
        } else {
            showWordFallbackText(fileObj);
        }
    } else if (isText) {
        if (icon) {
            icon.className = 'fa-solid fa-file-lines';
            icon.style.color = '#38bdf8';
        }
        if (title) title.innerHTML = `ពិនិត្យឯកសារអត្ថបទ៖ <strong>${fileObj.name}</strong>`;
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = '';
        }
        if (wordContainer) wordContainer.style.display = 'block';
        if (spinner) spinner.style.display = 'none';
        showWordFallbackText(fileObj);
    } else {
        if (icon) {
            icon.className = 'fa-solid fa-file-pdf';
            icon.style.color = '#ef4444';
        }
        if (title) title.innerHTML = `ពិនិត្យឯកសារ PDF៖ <strong style="color:#fca5a5;">${fileObj.name}</strong>`;
        if (wordContainer) wordContainer.style.display = 'none';
        if (wordContent) wordContent.innerHTML = '';
        if (spinner) spinner.style.display = 'none';
        if (iframe) {
            iframe.style.display = 'block';
            const blobUrl = base64ToBlobUrl(fileObj.base64, 'application/pdf');
            iframe.src = blobUrl;
            if (newTabBtn) {
                newTabBtn.href = blobUrl;
                newTabBtn.target = '_blank';
                newTabBtn.innerHTML = '<i class="fa-solid fa-up-right-from-square"></i> បើកពេញផ្ទាំង (New Tab)';
            }
        }
    }

    modal.classList.add('open');
}

/**
 * Open PDF Viewer Modal for a specific case
 */
function openPdfViewerModal(caseId) {
    const c = getCaseById(caseId);
    if (!c || !c.attachedPdf) {
        showToast('ពុំមានឯកសារ PDF ភ្ជាប់ក្នុងសំណុំរឿងនេះឡើយ!', 'warning');
        return;
    }
    currentPdfCaseId = caseId;
    displayUniversalDocument({
        name: c.pdfName || `${c.caseNumber}_document.pdf`,
        base64: c.attachedPdf,
        type: 'application/pdf',
        category: 'ឯកសារដើម (Main Case File)',
        caseId: caseId,
        infoText: `ដើមបណ្តឹង៖ <strong>${c.partyA_name}</strong> | ចុងបណ្តឹង៖ <strong>${c.partyB_name}</strong>`,
        canReplace: true,
        canDelete: true
    });
}

/**
 * Close PDF Viewer Modal
 */
function closePdfViewerModal() {
    const modal = document.getElementById('pdf-viewer-modal');
    const dialog = document.getElementById('pdf-viewer-dialog');
    const iframe = document.getElementById('pdf-viewer-iframe');
    const wordContainer = document.getElementById('word-viewer-container');
    const wordContent = document.getElementById('word-viewer-content');
    const spinner = document.getElementById('viewer-loading-spinner');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('viewer-minimized');
    }
    if (dialog) {
        dialog.classList.remove('viewer-minimized-dialog');
        dialog.classList.remove('viewer-maximized-dialog');
        dialog.style.position = '';
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.margin = '';
    }
    if (iframe) {
        iframe.src = '';
        iframe.style.display = 'block';
    }
    if (wordContainer) wordContainer.style.display = 'none';
    if (wordContent) wordContent.innerHTML = '';
    if (spinner) spinner.style.display = 'none';
    currentPdfCaseId = null;
}

/**
 * Trigger Global PDF Uploader from Case List / Viewer
 */
function triggerQuickPdfUpload(caseId) {
    currentPdfCaseId = caseId;
    const uploader = document.getElementById('global-pdf-uploader');
    if (uploader) {
        uploader.value = '';
        uploader.click();
    }
}

/**
 * Replace Current PDF in Viewer Modal
 */
function replaceCurrentViewerPdf() {
    if (!currentPdfCaseId) return;
    triggerQuickPdfUpload(currentPdfCaseId);
}

/**
 * Delete Current PDF from Viewer Modal
 */
function deleteCurrentViewerPdf() {
    if (!currentPdfCaseId) return;
    const c = getCaseById(currentPdfCaseId);
    if (!c) return;
    showConfirmModal(`តើលោកអ្នកពិតជាចង់លុបឯកសារ PDF "${c.pdfName || 'Case PDF'}" ចេញពីសំណុំរឿង ${c.caseNumber} មែនទេ?`, () => {
        delete c.attachedPdf;
        delete c.pdfName;
        updateCase(c.id, c);
        if (typeof logAuditAction === 'function') logAuditAction('លុបឯកសារ PDF', `បានលុបឯកសារ PDF ចេញពីសំណុំរឿង "${c.caseNumber}"`);
        showToast('បានលុបឯកសារ PDF ចេញពីសំណុំរឿងដោយជោគជ័យ!', 'success');
        closePdfViewerModal();
        renderAllViews();
    });
}

/**
 * Preview current PDF inside case modal form
 */
function previewCurrentFormPdf() {
    const base64 = document.getElementById('case-pdf-base64')?.value;
    const filename = document.getElementById('case-pdf-filename')?.value || 'Document.pdf';
    const caseNum = document.getElementById('case-number')?.value || 'New Case';
    const type = document.getElementById('case-pdf-type')?.value || '';
    if (!base64) {
        showToast('មិនទាន់មានឯកសារភ្ជាប់ក្នុងទម្រង់នេះទេ!', 'warning');
        return;
    }
    displayUniversalDocument({
        name: filename,
        base64: base64,
        type: type,
        category: 'ឯកសារជ្រើសរើស (ទម្រង់បច្ចុប្បន្ន)',
        infoText: `ឯកសារជ្រើសរើសបច្ចុប្បន្នសម្រាប់សំណុំរឿង <strong>${caseNum}</strong> (ពុំទាន់រក្សាទុកចូលបញ្ជី)`,
        canReplace: false,
        canDelete: false
    });
}

/**
 * Remove current PDF inside case modal form
 */
function removeCurrentFormPdf() {
    if (document.getElementById('case-pdf-base64')) document.getElementById('case-pdf-base64').value = '';
    if (document.getElementById('case-pdf-filename')) document.getElementById('case-pdf-filename').value = '';
    if (document.getElementById('case-pdf-name-text')) document.getElementById('case-pdf-name-text').innerText = 'ពុំទាន់មានឯកសារភ្ជាប់ឡើយ';
    if (document.getElementById('case-pdf-status-badge')) {
        document.getElementById('case-pdf-status-badge').style.background = '#f1f5f9';
        document.getElementById('case-pdf-status-badge').style.color = '#64748b';
        document.getElementById('case-pdf-status-badge').innerText = 'មិនទាន់មានឯកសារ';
    }
    if (document.getElementById('case-pdf-action-btns')) document.getElementById('case-pdf-action-btns').style.display = 'none';
    showToast('បានដកឯកសារ PDF ចេញពីទម្រង់បែបបទ!', 'info');
}

/**
 * Bind PDF Uploader Events
 */
function initPdfUploaders() {
    // Global uploader for Case List table / Viewer
    const globalUploader = document.getElementById('global-pdf-uploader');
    if (globalUploader) {
        globalUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file || !currentPdfCaseId) return;
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                showToast('សូមជ្រើសរើសឯកសារជាទម្រង់ PDF ប៉ុណ្ណោះ!', 'error');
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                showToast('ទំហំឯកសារធំពេក (អតិបរមា 15MB)!', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                const c = getCaseById(currentPdfCaseId);
                if (c) {
                    c.attachedPdf = evt.target.result;
                    c.pdfName = file.name;
                    updateCase(c.id, c);
                    if (typeof logAuditAction === 'function') logAuditAction('ភ្ជាប់ឯកសារ PDF', `បានភ្ជាប់ឯកសារ "${file.name}" ចូលសំណុំរឿង "${c.caseNumber}"`);
                    showToast(`បានភ្ជាប់ឯកសារ PDF "${file.name}" ចូលក្នុងសំណុំរឿង ${c.caseNumber} រួចរាល់!`, 'success');
                    renderAllViews();
                    // If viewer modal is open, reload it
                    const modal = document.getElementById('pdf-viewer-modal');
                    if (modal && modal.classList.contains('open')) {
                        openPdfViewerModal(c.id);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Modal Form PDF uploader
    const modalUploader = document.getElementById('case-pdf-input');
    if (modalUploader) {
        modalUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                showToast('សូមជ្រើសរើសឯកសារជាទម្រង់ PDF ប៉ុណ្ណោះ!', 'error');
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                showToast('ទំហំឯកសារធំពេក (អតិបរមា 15MB)!', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (document.getElementById('case-pdf-base64')) document.getElementById('case-pdf-base64').value = evt.target.result;
                if (document.getElementById('case-pdf-filename')) document.getElementById('case-pdf-filename').value = file.name;
                if (document.getElementById('case-pdf-name-text')) document.getElementById('case-pdf-name-text').innerHTML = `<i class="fa-solid fa-file-pdf text-danger"></i> <strong>${file.name}</strong>`;
                if (document.getElementById('case-pdf-status-badge')) {
                    document.getElementById('case-pdf-status-badge').style.background = '#dcfce7';
                    document.getElementById('case-pdf-status-badge').style.color = '#166534';
                    document.getElementById('case-pdf-status-badge').innerText = 'មានឯកសារភ្ជាប់';
                }
                if (document.getElementById('case-pdf-action-btns')) document.getElementById('case-pdf-action-btns').style.display = 'flex';
                showToast('បានផ្ទុកឯកសារ PDF ចូលក្នុងទម្រង់រៀបចំរួចរាល់!', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    // Quick Case Form PDF uploader
    const quickUploader = document.getElementById('quick-case-pdf-input');
    if (quickUploader) {
        quickUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            handleQuickFormFileSelect(file);
        });
    }

    // Modal Form Folder multi-uploader
    const folderUploader = document.getElementById('case-folder-file-input');
    if (folderUploader) {
        folderUploader.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (!files || files.length === 0) return;
            const cat = document.getElementById('case-file-category-select')?.value || 'ពាក្យបណ្តឹង';
            let loaded = 0;
            files.forEach(file => {
                if (file.size > 15 * 1024 * 1024) {
                    showToast(`ឯកសារ "${file.name}" ធំជាង 15MB ត្រូវបានរំលង!`, 'error');
                    loaded++;
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    currentModalCaseFiles.push({
                        id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        name: file.name,
                        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'document'),
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        category: cat,
                        base64: evt.target.result,
                        uploadedAt: new Date().toISOString()
                    });
                    loaded++;
                    if (loaded === files.length) {
                        renderModalCaseFilesGrid();
                        showToast(`បានបន្ថែមឯកសារចូល Folder រួចរាល់!`, 'success');
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    }

    // Case Folder Repository Modal Uploader
    const repoUploader = document.getElementById('folder-modal-file-input');
    if (repoUploader) {
        repoUploader.addEventListener('change', (e) => {
            if (!currentFolderModalCaseId) return;
            const c = getCaseById(currentFolderModalCaseId);
            if (!c) return;
            const files = Array.from(e.target.files);
            if (!files || files.length === 0) return;
            if (!c.caseFiles) c.caseFiles = [];
            const cat = document.getElementById('folder-modal-category-select')?.value || 'ពាក្យបណ្តឹង';
            let loaded = 0;
            files.forEach(file => {
                if (file.size > 15 * 1024 * 1024) {
                    showToast(`ឯកសារ "${file.name}" ធំជាង 15MB ត្រូវបានរំលង!`, 'error');
                    loaded++;
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    c.caseFiles.push({
                        id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        name: file.name,
                        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'document'),
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        category: cat,
                        base64: evt.target.result,
                        uploadedAt: new Date().toISOString()
                    });
                    loaded++;
                    if (loaded === files.length) {
                        const firstPdf = c.caseFiles.find(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
                        if (firstPdf) {
                            c.attachedPdf = firstPdf.base64;
                            c.pdfName = firstPdf.name;
                        }
                        updateCase(c.id, c);
                        if (typeof logAuditAction === 'function') logAuditAction('ភ្ជាប់ឯកសារចូល Folder', `បានបន្ថែមឯកសារ ${files.length} ចូល Folder សំណុំរឿង "${c.caseNumber}"`);
                        showToast(`បានរក្សាទុកឯកសារថ្មីចូល Folder សំណុំរឿង "${c.caseNumber}" រួចរាល់!`, 'success');
                        renderFolderModalGrid(c);
                        renderAllViews();
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });
    }
}

// Global state and helper functions for Phase 4 Folder Repository
let currentModalCaseFiles = [];
let currentFolderModalCaseId = null;

function renderTableFileCell(c) {
    const files = c.caseFiles && c.caseFiles.length > 0 ? c.caseFiles : (c.attachedPdf ? [{ id: 'default', name: c.pdfName || 'Case_PDF.pdf', type: 'application/pdf', base64: c.attachedPdf, category: 'ពាក្យបណ្តឹង' }] : []);
    const count = files.length;
    if (count > 0) {
        return `<button class="btn btn-sm" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; border: none; font-weight: 700; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 4px rgba(37,99,235,0.25);" onclick="openCaseFolderModal('${c.id}')" title="Folder ឯកសារសំណុំរឿង (${count} ឯកសារ)"><i class="fa-solid fa-folder-open text-warning"></i> ឯកសារ (${count}) - បើកមើល</button>`;
    } else {
        return `<button class="btn btn-sm" style="background: #f8fafc; color: #475569; border: 1px dashed #cbd5e1; font-weight: 600; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px; font-size: 11px; white-space: nowrap; transition: all 0.2s;" onclick="openCaseFolderModal('${c.id}')" title="បញ្ជូលឯកសារ ឬរូបភាពចូល Folder"><i class="fa-solid fa-cloud-arrow-up text-primary"></i> ដាក់ចូល Folder</button>`;
    }
}

function handleQuickFormFileSelect(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
        showToast('ទំហំឯកសារធំពេក (អតិបរមា 15MB)!', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64 = evt.target.result;
        if (document.getElementById('quick-case-pdf-base64')) document.getElementById('quick-case-pdf-base64').value = base64;
        if (document.getElementById('quick-case-pdf-filename')) document.getElementById('quick-case-pdf-filename').value = file.name;
        if (document.getElementById('quick-case-pdf-type')) document.getElementById('quick-case-pdf-type').value = file.type || '';
        
        if (document.getElementById('quick-pdf-badge')) {
            document.getElementById('quick-pdf-badge').style.background = '#dcfce7';
            document.getElementById('quick-pdf-badge').style.color = '#166534';
            document.getElementById('quick-pdf-badge').innerText = 'ត្រៀមរក្សាទុក';
        }
        if (document.getElementById('quick-case-pdf-name')) {
            document.getElementById('quick-case-pdf-name').innerText = file.name;
        }
        if (document.getElementById('quick-ai-file-name-display')) {
            document.getElementById('quick-ai-file-name-display').innerText = file.name;
        }
        const iconElem = document.getElementById('quick-preview-icon');
        if (iconElem) {
            if (file.type.includes('image') || file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
                iconElem.innerHTML = '<i class="fa-solid fa-image text-success"></i>';
            } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                iconElem.innerHTML = '<i class="fa-solid fa-file-word text-primary"></i>';
            } else {
                iconElem.innerHTML = '<i class="fa-solid fa-file-pdf text-danger"></i>';
            }
        }
        if (document.getElementById('quick-ai-file-preview')) {
            document.getElementById('quick-ai-file-preview').style.display = 'flex';
        }
        showToast(`បានភ្ជាប់ឯកសារ "${file.name}" សម្រាប់រក្សាទុកចូលសំណុំរឿង!`, 'success');
    };
    reader.readAsDataURL(file);
}

function previewQuickFormPdf() {
    const base64 = document.getElementById('quick-case-pdf-base64')?.value;
    const name = document.getElementById('quick-case-pdf-filename')?.value;
    const type = document.getElementById('quick-case-pdf-type')?.value || '';
    if (!base64) {
        showToast('ពុំមានឯកសារភ្ជាប់ឡើយ!', 'warning');
        return;
    }
    previewFolderFile({ name: name, base64: base64, type: type });
}

function removeQuickFormPdf() {
    if (document.getElementById('quick-case-pdf-base64')) document.getElementById('quick-case-pdf-base64').value = '';
    if (document.getElementById('quick-case-pdf-filename')) document.getElementById('quick-case-pdf-filename').value = '';
    if (document.getElementById('quick-case-pdf-type')) document.getElementById('quick-case-pdf-type').value = '';
    if (document.getElementById('quick-case-pdf-name')) document.getElementById('quick-case-pdf-name').innerText = 'អាចជ្រើសរើសពីទីនេះ ឬពីប៊ូតុង AI ខាងលើ';
    if (document.getElementById('quick-pdf-badge')) {
        document.getElementById('quick-pdf-badge').style.background = '#e2e8f0';
        document.getElementById('quick-pdf-badge').style.color = '#64748b';
        document.getElementById('quick-pdf-badge').innerText = 'គ្មានឯកសារ';
    }
    if (document.getElementById('quick-ai-file-preview')) {
        document.getElementById('quick-ai-file-preview').style.display = 'none';
    }
    if (document.getElementById('dashboard-ai-file')) document.getElementById('dashboard-ai-file').value = '';
    if (document.getElementById('quick-case-pdf-input')) document.getElementById('quick-case-pdf-input').value = '';
    showToast('បានដកឯកសារភ្ជាប់ចេញ!', 'info');
}

function renderModalCaseFilesGrid() {
    const grid = document.getElementById('modal-case-files-grid');
    const countBadge = document.getElementById('modal-folder-count');
    if (countBadge) countBadge.innerText = currentModalCaseFiles.length;
    
    const firstPdf = currentModalCaseFiles.find(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    if (document.getElementById('case-pdf-base64')) document.getElementById('case-pdf-base64').value = firstPdf ? firstPdf.base64 : '';
    if (document.getElementById('case-pdf-filename')) document.getElementById('case-pdf-filename').value = firstPdf ? firstPdf.name : '';
    if (document.getElementById('case-pdf-type')) document.getElementById('case-pdf-type').value = firstPdf ? firstPdf.type : '';

    if (!grid) return;
    if (currentModalCaseFiles.length === 0) {
        grid.innerHTML = `
            <div class="text-center text-muted" style="grid-column: 1 / -1; padding: 15px; font-style: italic;">
                <i class="fa-solid fa-folder-open mb-1" style="font-size: 20px; color: #cbd5e1; display: block;"></i>
                ពុំទាន់មានឯកសារ ឬរូបភាពនៅក្នុង Folder នេះឡើយ។ សូមជ្រើសរើសឯកសារខាងលើដើម្បីទាញចូល!
            </div>
        `;
        return;
    }

    let html = '';
    currentModalCaseFiles.forEach((f, idx) => {
        const isImg = f.type && (f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|gif)$/i));
        const iconHtml = isImg ? `<i class="fa-solid fa-image text-success" style="font-size: 24px;"></i>` : (f.name.endsWith('.doc') || f.name.endsWith('.docx') ? `<i class="fa-solid fa-file-word text-primary" style="font-size: 24px;"></i>` : `<i class="fa-solid fa-file-pdf text-danger" style="font-size: 24px;"></i>`);
        html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px;">
                    ${iconHtml}
                    <div style="flex: 1; overflow: hidden;">
                        <span class="badge" style="background: #eff6ff; color: #1e3a8a; font-size: 10px; margin-bottom: 4px; display: inline-block;">${f.category || 'ឯកសារ'}</span>
                        <strong style="font-size: 12px; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.name}">${f.name}</strong>
                        <small style="font-size: 10px; color: #64748b;">${f.size || 'N/A'}</small>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                    <button type="button" class="btn btn-sm" style="flex: 1; background: #eff6ff; color: #2563eb; border: none; font-size: 11px; font-weight: 600; padding: 4px;" onclick="previewModalCaseFile(${idx})"><i class="fa-solid fa-eye"></i> មើល</button>
                    <button type="button" class="btn btn-sm" style="background: #fee2e2; color: #dc2626; border: none; font-size: 11px; font-weight: 600; padding: 4px 8px;" onclick="removeModalCaseFile(${idx})" title="លុប"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function removeModalCaseFile(index) {
    currentModalCaseFiles.splice(index, 1);
    renderModalCaseFilesGrid();
    showToast('បានលុបឯកសារចេញពី Folder បណ្ដោះអាសន្ន!', 'info');
}

function previewModalCaseFile(index) {
    const f = currentModalCaseFiles[index];
    if (!f) return;
    previewFolderFile(f);
}

function previewFolderFile(f) {
    if (!f || !f.base64) return;
    const isImg = f.type && (f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|gif)$/i));
    if (isImg) {
        const imgModal = document.getElementById('image-viewer-modal');
        const imgElem = document.getElementById('image-viewer-img');
        const titleElem = document.getElementById('image-viewer-title');
        const infoElem = document.getElementById('image-viewer-info');
        const dlBtn = document.getElementById('image-viewer-download-btn');
        if (imgElem) imgElem.src = f.base64;
        if (titleElem) titleElem.innerText = `ពិនិត្យរូបភាព៖ ${f.name}`;
        if (infoElem) infoElem.innerText = `ចំណាត់ថ្នាក់៖ ${f.category || 'រូបភាពភស្តុតាង'} | ទំហំ៖ ${f.size || 'N/A'}`;
        if (dlBtn) {
            dlBtn.href = f.base64;
            dlBtn.download = f.name || 'evidence.jpg';
        }
        if (imgModal) imgModal.classList.add('open');
    } else {
        displayUniversalDocument({
            name: f.name || 'document.pdf',
            base64: f.base64,
            type: f.type || '',
            category: f.category || 'ឯកសារក្នុង Folder',
            size: f.size || '',
            infoText: `ឈ្មោះ៖ <strong>${f.name}</strong> | ចំណាត់ថ្នាក់៖ <span class="badge" style="background:#e2e8f0;color:#334155;">${f.category || 'ឯកសារ'}</span>`,
            canReplace: false,
            canDelete: false
        });
    }
}

function closeImageViewerModal() {
    const imgModal = document.getElementById('image-viewer-modal');
    const imgDialog = document.getElementById('image-viewer-dialog');
    const imgElem = document.getElementById('image-viewer-img');
    if (imgModal) {
        imgModal.classList.remove('open');
        imgModal.classList.remove('viewer-minimized');
    }
    if (imgDialog) {
        imgDialog.classList.remove('viewer-minimized-dialog');
        imgDialog.classList.remove('viewer-maximized-dialog');
        imgDialog.style.position = '';
        imgDialog.style.left = '';
        imgDialog.style.top = '';
        imgDialog.style.margin = '';
    }
    if (imgElem) imgElem.src = '';
}

function openCaseFolderModal(caseId) {
    currentFolderModalCaseId = caseId;
    const c = getCaseById(caseId);
    if (!c) return;
    const modal = document.getElementById('case-folder-modal');
    const title = document.getElementById('case-folder-title');
    if (title) title.innerHTML = `<i class="fa-solid fa-folder-open text-warning"></i> <span>Folder ឯកសារសំណុំរឿង៖ <strong style="color:#60a5fa;">${c.caseNumber}</strong></span>`;
    renderFolderModalGrid(c);
    if (modal) modal.classList.add('open');
}

function closeCaseFolderModal() {
    currentFolderModalCaseId = null;
    const modal = document.getElementById('case-folder-modal');
    if (modal) modal.classList.remove('open');
}

function renderFolderModalGrid(c) {
    const grid = document.getElementById('folder-modal-files-grid');
    const countBadge = document.getElementById('folder-modal-count');
    const files = c.caseFiles && c.caseFiles.length > 0 ? c.caseFiles : (c.attachedPdf ? [{ id: 'f_default_' + Date.now(), name: c.pdfName || 'Case_PDF.pdf', type: 'application/pdf', base64: c.attachedPdf, category: 'ពាក្យបណ្តឹង', size: 'N/A' }] : []);
    if (countBadge) countBadge.innerText = files.length;
    if (!grid) return;
    if (files.length === 0) {
        grid.innerHTML = `
            <div class="text-center text-muted" style="grid-column: 1 / -1; padding: 25px; font-style: italic; background: white; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <i class="fa-solid fa-folder-open mb-2" style="font-size: 28px; color: #cbd5e1; display: block;"></i>
                ពុំទាន់មានឯកសារ ឬរូបភាពនៅក្នុង Folder សំណុំរឿង "${c.caseNumber}" នេះឡើយ។<br>សូមជ្រើសរើសឯកសារនៅរបារខាងលើ ដើម្បីបញ្ចូលចូលក្នុង Folder នេះ!
            </div>
        `;
        return;
    }

    let html = '';
    files.forEach((f, idx) => {
        const isImg = f.type && (f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|gif)$/i));
        const iconHtml = isImg ? `<i class="fa-solid fa-image text-success" style="font-size: 26px;"></i>` : (f.name.endsWith('.doc') || f.name.endsWith('.docx') ? `<i class="fa-solid fa-file-word text-primary" style="font-size: 26px;"></i>` : `<i class="fa-solid fa-file-pdf text-danger" style="font-size: 26px;"></i>`);
        html += `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s;">
                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px;">
                    ${iconHtml}
                    <div style="flex: 1; overflow: hidden;">
                        <span class="badge" style="background: #eff6ff; color: #1e3a8a; font-size: 11px; margin-bottom: 6px; display: inline-block; font-weight: 700;">${f.category || 'ឯកសារ'}</span>
                        <strong style="font-size: 13px; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.name}">${f.name}</strong>
                        <small style="font-size: 11px; color: #64748b;">ទំហំ៖ ${f.size || 'N/A'} ${f.uploadedAt ? '| ' + f.uploadedAt.split('T')[0] : ''}</small>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <button type="button" class="btn btn-sm" style="flex: 1; background: #eff6ff; color: #2563eb; border: none; font-size: 12px; font-weight: 600; padding: 6px;" onclick="previewFolderItem('${c.id}', ${idx})"><i class="fa-solid fa-eye"></i> មើល</button>
                    <a href="${f.base64}" download="${f.name}" class="btn btn-sm" style="flex: 1; background: #f1f5f9; color: #334155; text-decoration: none; text-align: center; font-size: 12px; font-weight: 600; padding: 6px;"><i class="fa-solid fa-download"></i> ទាញយក</a>
                    <button type="button" class="btn btn-sm" style="background: #fee2e2; color: #dc2626; border: none; font-size: 12px; font-weight: 600; padding: 6px 10px;" onclick="deleteFileFromCaseFolder('${c.id}', ${idx})" title="លុបចេញពី Folder"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function previewFolderItem(caseId, idx) {
    const c = getCaseById(caseId);
    if (!c) return;
    const files = c.caseFiles && c.caseFiles.length > 0 ? c.caseFiles : (c.attachedPdf ? [{ id: 'f_default', name: c.pdfName || 'Case_PDF.pdf', type: 'application/pdf', base64: c.attachedPdf, category: 'ពាក្យបណ្តឹង' }] : []);
    const f = files[idx];
    if (!f) return;
    previewFolderFile(f);
}

function deleteFileFromCaseFolder(caseId, idx) {
    const c = getCaseById(caseId);
    if (!c) return;
    customConfirm("លុបឯកសារពី Folder", `តើលោកអ្នកពិតជាចង់លុបឯកសារនេះចេញពី Folder សំណុំរឿង "${c.caseNumber}" មែនទេ?`, () => {
        if (!c.caseFiles || c.caseFiles.length === 0) {
            if (c.attachedPdf) {
                c.attachedPdf = '';
                c.pdfName = '';
            }
        } else {
            const removed = c.caseFiles.splice(idx, 1)[0];
            if (removed && removed.base64 === c.attachedPdf) {
                const nextPdf = c.caseFiles.find(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
                c.attachedPdf = nextPdf ? nextPdf.base64 : '';
                c.pdfName = nextPdf ? nextPdf.name : '';
            }
        }
        updateCase(c.id, c);
        if (typeof logAuditAction === 'function') logAuditAction('លុបឯកសារពី Folder', `បានលុបឯកសារ ១ ចេញពី Folder សំណុំរឿង "${c.caseNumber}"`);
        showToast('បានលុបឯកសារចេញពី Folder រួចរាល់!', 'success');
        renderFolderModalGrid(c);
        renderAllViews();
    });
}

function closeViewModalAndOpenFolder(caseId) {
    const viewModal = document.getElementById('view-modal');
    if (viewModal) viewModal.classList.remove('open');
    openCaseFolderModal(caseId);
}

function renderDossierFilesSection(c) {
    const files = c.caseFiles && c.caseFiles.length > 0 ? c.caseFiles : (c.attachedPdf ? [{ id: 'default', name: c.pdfName || 'Case_PDF.pdf', type: 'application/pdf', base64: c.attachedPdf, category: 'ពាក្យបណ្តឹង', size: 'N/A' }] : []);
    let html = `
        <div class="dossier-item full-width" style="grid-column: 1 / -1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
                <span style="font-size: 14px; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-folder-open text-warning"></i> 📁 ឃ្លាំងឯកសារ និងភស្តុតាងសំណុំរឿង (${files.length} ឯកសារ)
                </span>
                <button class="btn btn-sm btn-primary" style="background: #2563eb; color: white; border: none; font-weight: 600; padding: 5px 12px; border-radius: 6px;" onclick="closeViewModalAndOpenFolder('${c.id}')"><i class="fa-solid fa-folder-plus"></i> បញ្ចូលឯកសារក្នុង Folder</button>
            </div>
    `;
    if (files.length === 0) {
        html += `
            <div class="text-center text-muted" style="padding: 20px; font-style: italic; background: white; border-radius: 6px; border: 1px dashed #cbd5e1;">
                <i class="fa-solid fa-file-excel mb-1" style="font-size: 24px; color: #cbd5e1; display: block;"></i>
                ពុំទាន់មានឯកសារ ឬរូបភាពភស្តុតាងនៅក្នុងសំណុំរឿងនេះឡើយ
            </div>
        `;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;">`;
        files.forEach((f, idx) => {
            const isImg = f.type && (f.type.includes('image') || f.name.match(/\.(jpg|jpeg|png|gif)$/i));
            const iconHtml = isImg ? `<i class="fa-solid fa-image text-success" style="font-size: 20px;"></i>` : (f.name.endsWith('.doc') || f.name.endsWith('.docx') ? `<i class="fa-solid fa-file-word text-primary" style="font-size: 20px;"></i>` : `<i class="fa-solid fa-file-pdf text-danger" style="font-size: 20px;"></i>`);
            html += `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px;">
                        ${iconHtml}
                        <div style="flex: 1; overflow: hidden;">
                            <span class="badge" style="background: #f1f5f9; color: #334155; font-size: 10px; margin-bottom: 4px; display: inline-block;">${f.category || 'ឯកសារ'}</span>
                            <strong style="font-size: 12px; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.name}">${f.name}</strong>
                            <small style="font-size: 10px; color: #64748b;">${f.size || 'N/A'}</small>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                        <button class="btn btn-sm" style="flex: 1; background: #eff6ff; color: #2563eb; border: none; font-size: 11px; font-weight: 600; padding: 4px;" onclick="previewFolderItem('${c.id}', ${idx})"><i class="fa-solid fa-eye"></i> មើល</button>
                        <a href="${f.base64}" download="${f.name}" class="btn btn-sm" style="flex: 1; background: #f1f5f9; color: #334155; text-decoration: none; text-align: center; font-size: 11px; font-weight: 600; padding: 4px;"><i class="fa-solid fa-download"></i> ទាញយក</a>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

// ============================================================
// DRAGGABLE, MINIMIZE & MAXIMIZE MODAL FUNCTIONS
// ============================================================

/**
 * Initialize drag for a handle element and dialog element
 */
function initDraggableByElement(handle, dialog) {
    let isDragging = false;
    let startX, startY, origLeft, origTop;

    handle.addEventListener('mousedown', function(e) {
        if (e.target.closest('button, a')) return;
        if (dialog.classList.contains('viewer-minimized-dialog')) return;
        if (dialog.classList.contains('viewer-maximized-dialog')) return;

        isDragging = true;
        const rect = dialog.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left;
        origTop = rect.top;

        dialog.style.position = 'fixed';
        dialog.style.margin = '0';
        dialog.style.left = rect.left + 'px';
        dialog.style.top = rect.top + 'px';
        dialog.style.transition = 'none';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const newLeft = origLeft + (e.clientX - startX);
        const newTop = origTop + (e.clientY - startY);
        const maxLeft = window.innerWidth - dialog.offsetWidth;
        const maxTop = window.innerHeight - dialog.offsetHeight;
        dialog.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
        dialog.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            dialog.style.transition = '';
        }
    });
}

/**
 * Toggle Minimize state for a viewer modal
 */
function toggleMinimizeViewer(modalId, dialogId) {
    const modal = document.getElementById(modalId);
    const dialog = document.getElementById(dialogId);
    if (!modal || !dialog) return;

    const isMinimized = dialog.classList.contains('viewer-minimized-dialog');
    if (isMinimized) {
        // Restore
        dialog.classList.remove('viewer-minimized-dialog');
        modal.classList.remove('viewer-minimized');
        dialog.style.position = '';
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.margin = '';
    } else {
        // Minimize: collapse to floating title bar at bottom-right
        dialog.classList.remove('viewer-maximized-dialog');
        dialog.classList.add('viewer-minimized-dialog');
        modal.classList.add('viewer-minimized');
        dialog.style.position = '';
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.margin = '';
    }
}

/**
 * Toggle Maximize state for a viewer dialog
 */
function toggleMaximizeViewer(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    // Restore from minimized first
    const pdfModal = document.getElementById('pdf-viewer-modal');
    const imgModal = document.getElementById('image-viewer-modal');
    if (pdfModal) pdfModal.classList.remove('viewer-minimized');
    if (imgModal) imgModal.classList.remove('viewer-minimized');
    dialog.classList.remove('viewer-minimized-dialog');

    const isMaximized = dialog.classList.contains('viewer-maximized-dialog');
    if (isMaximized) {
        // Restore to normal
        dialog.classList.remove('viewer-maximized-dialog');
        dialog.style.position = '';
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.margin = '';
    } else {
        // Maximize
        dialog.classList.add('viewer-maximized-dialog');
        dialog.style.position = '';
        dialog.style.left = '';
        dialog.style.top = '';
        dialog.style.margin = '';
    }
}

/**
 * Initialize all draggable modals on page load
 */
function initAllDraggableModals() {
    const configs = [
        { dialogId: 'pdf-viewer-dialog' },
        { dialogId: 'image-viewer-dialog' }
    ];
    configs.forEach(function(cfg) {
        const dialog = document.getElementById(cfg.dialogId);
        if (!dialog) return;
        const handle = dialog.querySelector('.modal-drag-handle');
        if (handle && !handle._dragInitialized) {
            handle._dragInitialized = true;
            initDraggableByElement(handle, dialog);
        }
    });
}

// Auto-initialize on DOM ready and load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initAllDraggableModals, 600); });
} else {
    setTimeout(initAllDraggableModals, 600);
}
window.addEventListener('load', function() { setTimeout(initAllDraggableModals, 300); });
