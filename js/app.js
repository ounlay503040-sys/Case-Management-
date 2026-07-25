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

    // 3. Start live clock
    updateClock();
    setInterval(updateClock, 1000);

    // 4. Initialize event listeners
    initNavigation();
    initModalEvents();
    initFilterAndSearchEvents();
    initDataManagementEvents();
    initThemeToggle();

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

    let optHTML = '';
    PROVINCES_LIST.forEach(p => {
        optHTML += `<option value="${p.name}">${p.name} (${p.code})</option>`;
    });

    if (dispLoc) dispLoc.innerHTML = optHTML;
    if (paLoc) paLoc.innerHTML = optHTML;
    if (pbLoc) pbLoc.innerHTML = optHTML;

    if (filterLoc) {
        filterLoc.innerHTML = `<option value="ALL">គ្រប់ទីតាំងទាំងអស់ (All Locations)</option>` + optHTML;
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
    renderRecentCasesTable();
    applyFiltersAndRenderMasterTable();
    if (typeof initOrUpdateCharts === 'function') {
        initOrUpdateCharts();
    }
    renderAnalyticsView();
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

    if (viewId === 'analytics-view') {
        renderAnalyticsView();
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
 * Render Recent Cases Table (top 5 latest)
 */
function renderRecentCasesTable() {
    const tbody = document.getElementById('recent-cases-tbody');
    if (!tbody) return;

    const sorted = sortCases(casesData, 'date-desc');
    const recent = sorted.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">គ្មានទិន្នន័យសំណុំរឿងឡើយ</td></tr>`;
        return;
    }

    let html = '';
    recent.forEach(c => {
        html += `
            <tr>
                <td><span class="case-number-tag">${c.caseNumber}</span></td>
                <td>
                    <div class="party-box">
                        <strong>ក៖ ${c.partyA_name}</strong>
                        <span>vs ខ៖ ${c.partyB_name}</span>
                    </div>
                </td>
                <td>${c.category}</td>
                <td><i class="fa-solid fa-location-dot text-muted"></i> ${c.disputeLocation}</td>
                <td>${c.dateReceived}</td>
                <td>${getStatusBadgeHTML(c.status)}</td>
                <td class="text-center">
                    <div class="action-btns">
                        <button class="btn-icon" onclick="openViewModal('${c.id}')" title="មើលប័ណ្ណព័ត៌មាន"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-icon" onclick="openEditModal('${c.id}')" title="កែសម្រួល"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/**
 * Apply filters, sort, and render Master Table with pagination
 */
function applyFiltersAndRenderMasterTable() {
    const q = document.getElementById('filter-search')?.value || '';
    const cat = document.getElementById('filter-category')?.value || 'ALL';
    const st = document.getElementById('filter-status')?.value || 'ALL';
    const loc = document.getElementById('filter-location')?.value || 'ALL';
    const sortBy = document.getElementById('sort-by')?.value || 'date-desc';

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

    // Pagination slice
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (!tbody) return;
    let html = '';
    paginated.forEach((c, idx) => {
        const rowNum = startIndex + idx + 1;
        html += `
            <tr>
                <td class="text-center">${rowNum}</td>
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
                <td class="text-center">
                    <div class="action-btns">
                        <button class="btn-icon" onclick="openViewModal('${c.id}')" title="មើលប័ណ្ណ"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-icon" onclick="openEditModal('${c.id}')" title="កែសម្រួល"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete-btn" onclick="confirmDeleteCase('${c.id}')" title="លុប"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
    renderPagination(filtered.length, totalPages);
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

    const triggerFilter = () => {
        currentPage = 1;
        applyFiltersAndRenderMasterTable();
    };

    if (searchEl) searchEl.addEventListener('input', triggerFilter);
    if (headerSearchEl) {
        headerSearchEl.addEventListener('input', (e) => {
            if (searchEl) searchEl.value = e.target.value;
            switchView('cases-view');
            triggerFilter();
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
        modal.classList.add('open');
    };

    if (btnAdd1) btnAdd1.addEventListener('click', openAdd);
    if (btnAdd2) btnAdd2.addEventListener('click', openAdd);
    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('open'));
    if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('open'));

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
                remarks: remarksVal
            };

            if (id) {
                updateCase(id, payload);
                showToast('បានកែសម្រួលសំណុំរឿងដោយជោគជ័យ!', 'success');
            } else {
                addCase(payload);
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
    document.getElementById('btn-edit-from-view').onclick = () => openEditModal(c.id);
    document.getElementById('btn-delete-from-view').onclick = () => confirmDeleteCase(c.id, true);
    document.getElementById('btn-print-single-case').onclick = () => printSingleDossier(c);

    modal.classList.add('open');
}

/**
 * Confirm delete case
 */
function confirmDeleteCase(id, closeViewAfter = false) {
    const c = getCaseById(id);
    if (!c) return;
    if (confirm(`តើលោកអ្នកពិតជាចង់លុបសំណុំរឿងលេខ "${c.caseNumber}" នេះមែនទេ? ទិន្នន័យដែលលុបហើយមិនអាចស្ដារវិញបានឡើយ!`)) {
        deleteCase(id);
        showToast(`បានលុបសំណុំរឿង "${c.caseNumber}" ចេញពីបញ្ជីដោយជោគជ័យ!`, 'success');
        if (closeViewAfter) {
            document.getElementById('view-modal')?.classList.remove('open');
        }
        renderAllViews();
    }
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
}

/**
 * Excel Import Engine (SheetJS) & Backup Events
 */
function initDataManagementEvents() {
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
            if (confirm('តើលោកអ្នកពិតជាចង់ស្ដារទិន្នន័យគំរូដើមទាំង ១០ ករណីវិញមែនទេ? រាល់ទិន្នន័យដែលបានកែប្រែនឹងត្រូវជំនួស!')) {
                resetToMockData();
                renderAllViews();
                showToast('បានស្ដារទិន្នន័យគំរូដើមទាំង ១០ ករណីដោយជោគជ័យ!', 'success');
            }
        });
    }
}

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

            if (username.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin' || password === '123456')) {
                isValid = true;
                uName = 'គណនីរដ្ឋបាល (Admin)';
                uRole = 'អគ្គលេខាធិការដ្ឋាន NADR';
            } else if (username.toLowerCase() === 'nadr' && (password === 'nadr2026' || password === 'nadr' || password === 'admin123')) {
                isValid = true;
                uName = 'មន្ត្រីជាន់ខ្ពស់ NADR';
                uRole = 'ថ្នាក់ដឹកនាំ NADR';
            } else if (username.toLowerCase() === 'user' && (password === 'user123' || password === 'user' || password === '123456')) {
                isValid = true;
                uName = 'មន្ត្រីសម្របសម្រួល';
                uRole = 'មន្ត្រីទទួលបន្ទុក';
            } else if (password === 'admin123' || password === '123456' || password === 'nadr2026' || password === username) {
                // Allow custom usernames with standard valid passwords
                isValid = true;
                uName = username;
                uRole = 'មន្ត្រីជំនាញ NADR';
            }

            if (isValid) {
                // Save state
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('nadr_auth_logged_in', 'true');
                storage.setItem('nadr_auth_user_name', uName);
                storage.setItem('nadr_auth_user_role', uRole);

                updateSidebarUser(uName, uRole);

                // Animate out
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.classList.add('hidden-auth');
                        overlay.style.opacity = '';
                    }, 400);
                }

                showToaster('ចូលប្រព័ន្ធជោគជ័យ! សូមស្វាគមន៍មកកាន់ CMS Pro', 'success');
            } else {
                if (errorMsg) errorMsg.classList.remove('d-none');
                pwdInput.value = '';
                pwdInput.focus();
            }
        });
    }

    // 4. Logout click
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធ (Logout) មែនទេ?')) {
                localStorage.removeItem('nadr_auth_logged_in');
                sessionStorage.removeItem('nadr_auth_logged_in');
                
                if (overlay) overlay.classList.remove('hidden-auth');
                const pwd = document.getElementById('login-password');
                if (pwd) pwd.value = '';
                if (errorMsg) errorMsg.classList.add('d-none');
                
                showToaster('បានចាកចេញពីប្រព័ន្ធដោយសុវត្ថិភាព', 'info');
            }
        });
    }
}

function updateSidebarUser(name, role) {
    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
}

