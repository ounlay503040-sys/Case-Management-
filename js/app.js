/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - MAIN APPLICATION LOGIC (js/app.js)
   Handles UI Events, 25 Province Dropdowns, Master Table Rendering,
   Dossier Detail Modal, Excel Import Engine (SheetJS), and Analytics View.
   ========================================================================== */

let currentPage = 1;
const ITEMS_PER_PAGE = 10;
window.filteredCasesCache = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check for empty localStorage (Task 0.5 - Import backup if empty)
    if (localStorage.length === 0) {
        if (confirm('រកមិនឃើញទិន្នន័យ (គ្មានទិន្នន័យក្នុងប្រព័ន្ធទេ)។\nតើអ្នកចង់នាំចូលទិន្នន័យពីឯកសារ Backup (.json) ឥឡូវនេះទេ?')) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = window.handleImportAllData;
            input.click();
            return;
        }
    }

    // Case Type Theme Toggling
    const modalContent = document.querySelector('#case-modal .modal-dialog');
    const caseTypeRadios = document.querySelectorAll('input[name="caseType"]');
    if (caseTypeRadios) {
        caseTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (modalContent) {
                    if (e.target.value === 'assisting') {
                        modalContent.classList.add('theme-assisting');
                        modalContent.classList.remove('theme-personal');
                    } else {
                        modalContent.classList.add('theme-personal');
                        modalContent.classList.remove('theme-assisting');
                    }
                }
            });
        });
    }

    // DevTools Shortcut for Admins (Ctrl+Shift+Alt+D)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
            const role = localStorage.getItem('nadr_auth_user_role') || sessionStorage.getItem('nadr_auth_user_role') || '';
            if (role.toLowerCase().includes('admin') || role.includes('គ្រប់គ្រង')) {
                if (window.electronAPI && window.electronAPI.toggleDevTools) {
                    window.electronAPI.toggleDevTools();
                }
            }
        }
    });

    const quickEntryCard = document.querySelector('.quick-entry-card');
    const quickCaseTypeRadios = document.querySelectorAll('input[name="quickCaseType"]');
    if (quickCaseTypeRadios) {
        quickCaseTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (quickEntryCard) {
                    if (e.target.value === 'assisting') {
                        quickEntryCard.classList.add('theme-assisting');
                        quickEntryCard.classList.remove('theme-personal');
                    } else {
                        quickEntryCard.classList.add('theme-personal');
                        quickEntryCard.classList.remove('theme-assisting');
                    }
                }
            });
        });
    }
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
    switchView('dashboard-view');
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
    if (document.getElementById('case-party-c-location')) document.getElementById('case-party-c-location').innerHTML = optHTML;
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
    
    let dateStr = '';
    if (typeof currentLang !== 'undefined' && currentLang === 'km') {
        const days = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
        const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();
        
        let hours = now.getHours();
        let ampm = hours >= 12 ? 'រសៀល' : 'ព្រឹក';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // ថ្ងៃអាទិត្យ ទី១៦ ខែសីហា ឆ្នាំ២០២៦ ម៉ោង 10:14:36 PM
        // To use Khmer numbers for the date (optional but nice):
        const kmDigits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
        const toKmNum = (numStr) => String(numStr).split('').map(d => /[0-9]/.test(d) ? kmDigits[parseInt(d)] : d).join('');
        
        dateStr = `ថ្ងៃ${dayName} ទី${toKmNum(day)} ខែ${monthName} ឆ្នាំ${toKmNum(year)} ម៉ោង ${hours}:${minutes}:${seconds} ${ampm}`;
    } else {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        dateStr = now.toLocaleDateString('en-US', options);
    }
    
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
    if (typeof renderUpcomingEventsTable === 'function') {
        renderUpcomingEventsTable();
    }
    if (typeof renderProfileView === 'function') {
        renderProfileView();
    }
}

/**
 * Render Upcoming Events Table in Calendar View
 */

let currentUpcomingEventFilter = 'all';
let upcomingEventSearchQuery = '';

window.filterUpcomingEvents = function(filter) {
    currentUpcomingEventFilter = filter;
    renderUpcomingEventsTable();
};

window.searchUpcomingEvents = function(query) {
    upcomingEventSearchQuery = query || '';
    renderUpcomingEventsTable();
};

function renderUpcomingEventsTable() {
    const tbody = document.getElementById('upcoming-events-tbody');
    const summaryContainer = document.getElementById('upcoming-events-summary');
    const showingTextEl = document.getElementById('upcoming-events-showing-text');
    if (!tbody) return;

    // Filter all cases with scheduled events (supporting all event data formats)
    const allEventsList = (typeof casesData !== 'undefined' ? casesData : [])
        .filter(c => (typeof checkCaseHasEvent === 'function') ? checkCaseHasEvent(c) : (c.caseEvent || c.caseEventDate || c.hasEvent || c.eventDate))
        .map(c => {
            const evt = (typeof getCaseEventDetails === 'function') ? getCaseEventDetails(c) : {
                date: c.caseEventDate || c.eventDate || '',
                time: c.caseEventTime || c.eventTime || '08:30',
                desc: c.caseEventTitle || c.eventDesc || (typeof c.caseEvent === 'string' ? c.caseEvent : 'ប្រជុំសម្រុះសម្រួល')
            };
            const eventDate = evt.date || c.caseEventDate || c.eventDate || '';
            const eventTime = evt.time || c.caseEventTime || c.eventTime || '08:30';
            const eventDesc = evt.desc || c.caseEventTitle || c.eventDesc || (typeof c.caseEvent === 'string' ? c.caseEvent : '') || 'ប្រជុំសម្រុះសម្រួល';
            return {
                ...c,
                caseEventDate: eventDate,
                caseEventTime: eventTime,
                caseEvent: eventDesc
            };
        })
        .filter(c => c.caseEventDate && String(c.caseEventDate).trim() !== '')
        .sort((a, b) => {
            const dateA = new Date(`${a.caseEventDate}T${a.caseEventTime || '00:00'}`);
            const dateB = new Date(`${b.caseEventDate}T${b.caseEventTime || '00:00'}`);
            return dateA - dateB;
        });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    let upcomingCount = 0;
    let pastCount = 0;

    allEventsList.forEach(c => {
        if (c.caseEventDate === todayStr) todayCount++;
        else if (c.caseEventDate > todayStr) upcomingCount++;
        else pastCount++;
    });

    // Apply Filter & Search
    const filteredEvents = allEventsList.filter(c => {
        let matchesFilter = true;
        if (currentUpcomingEventFilter === 'today') matchesFilter = (c.caseEventDate === todayStr);
        else if (currentUpcomingEventFilter === 'upcoming') matchesFilter = (c.caseEventDate > todayStr);
        else if (currentUpcomingEventFilter === 'past') matchesFilter = (c.caseEventDate < todayStr);

        let matchesSearch = true;
        if (upcomingEventSearchQuery.trim()) {
            const q = upcomingEventSearchQuery.toLowerCase().trim();
            const caseNo = (c.caseNumber || '').toLowerCase();
            const partyA = (c.partyA_name || '').toLowerCase();
            const partyB = (c.partyB_name || '').toLowerCase();
            const loc = (c.disputeLocation || '').toLowerCase();
            const evt = (c.caseEvent || '').toLowerCase();
            matchesSearch = caseNo.includes(q) || partyA.includes(q) || partyB.includes(q) || loc.includes(q) || evt.includes(q);
        }

        return matchesFilter && matchesSearch;
    });

    // Update Showing text
    if (showingTextEl) {
        showingTextEl.innerHTML = `បង្ហាញកម្មវិធីចំនួន <strong>${filteredEvents.length}</strong> នៃ <strong>${allEventsList.length}</strong> សរុប`;
    }

    // Update Summary Filter Pills
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <button type="button" onclick="filterUpcomingEvents('all')" class="btn-filter-pill ${currentUpcomingEventFilter === 'all' ? 'active' : ''}" style="padding: 5px 12px; border-radius: 20px; border: 1px solid ${currentUpcomingEventFilter === 'all' ? '#1e293b' : '#cbd5e1'}; background: ${currentUpcomingEventFilter === 'all' ? '#1e293b' : '#f1f5f9'}; color: ${currentUpcomingEventFilter === 'all' ? '#fff' : '#475569'}; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s;">
                សរុប: ${allEventsList.length}
            </button>
            <button type="button" onclick="filterUpcomingEvents('today')" class="btn-filter-pill ${currentUpcomingEventFilter === 'today' ? 'active' : ''}" style="padding: 5px 12px; border-radius: 20px; border: 1px solid #86efac; background: ${currentUpcomingEventFilter === 'today' ? '#16a34a' : '#dcfce7'}; color: ${currentUpcomingEventFilter === 'today' ? '#fff' : '#15803d'}; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s;">
                🟢 ដល់ថ្ងៃប្រជុំ: ${todayCount}
            </button>
            <button type="button" onclick="filterUpcomingEvents('upcoming')" class="btn-filter-pill ${currentUpcomingEventFilter === 'upcoming' ? 'active' : ''}" style="padding: 5px 12px; border-radius: 20px; border: 1px solid #93c5fd; background: ${currentUpcomingEventFilter === 'upcoming' ? '#2563eb' : '#eff6ff'}; color: ${currentUpcomingEventFilter === 'upcoming' ? '#fff' : '#1d4ed8'}; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s;">
                🔵 បានរៀបចំ: ${upcomingCount}
            </button>
            <button type="button" onclick="filterUpcomingEvents('past')" class="btn-filter-pill ${currentUpcomingEventFilter === 'past' ? 'active' : ''}" style="padding: 5px 12px; border-radius: 20px; border: 1px solid #fca5a5; background: ${currentUpcomingEventFilter === 'past' ? '#e11d48' : '#fff1f2'}; color: ${currentUpcomingEventFilter === 'past' ? '#fff' : '#be123c'}; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s;">
                🔴 ផុតថ្ងៃ: ${pastCount}
            </button>
        `;
    }

    if (filteredEvents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 32px;"><div style="font-size: 28px; margin-bottom: 6px;">📅</div><div style="font-weight: 600;">មិនមានកម្មវិធីសំណុំរឿងត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ</div></td></tr>`;
        return;
    }

    let html = '';
    filteredEvents.forEach(c => {
        let rowClass = '';
        let statusBadgeHTML = '';

        if (c.caseEventDate === todayStr) {
            rowClass = 'event-row-today';
            statusBadgeHTML = `<span class="event-badge event-badge-today" style="white-space: nowrap;"><span class="pulse-dot"></span> ដល់ថ្ងៃប្រជុំ</span>`;
        } else if (c.caseEventDate > todayStr) {
            rowClass = 'event-row-upcoming';
            statusBadgeHTML = `<span class="event-badge event-badge-upcoming" style="white-space: nowrap;"><i class="fa-regular fa-calendar-check"></i> បានរៀបចំ</span>`;
        } else {
            rowClass = 'event-row-past';
            statusBadgeHTML = `<span class="event-badge event-badge-past" style="white-space: nowrap;"><i class="fa-solid fa-clock-rotate-left"></i> ផុតថ្ងៃ</span>`;
        }

        const statusColor = typeof getStatusColor === 'function' ? getStatusColor(c.status) : '#334155';

        // Column 8: Outcome representation (NO Delete Button here!)
        let outcomeHTML = '';
        if (c.eventOutcome === 'settled') {
            outcomeHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
                    <span style="display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 700; background: #dcfce7; color: #166534; border: 1px solid #86efac;">
                        ✅ ព្រមព្រៀង
                    </span>
                    <button onclick="event.stopPropagation(); openOutcomeModal('${c.id}')" title="កែប្រែលទ្ធផល" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px 5px; font-size: 12px; border-radius: 4px;" class="btn-outcome-edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            `;
        } else if (c.eventOutcome === 'unsuccessful') {
            outcomeHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
                    <span style="display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 700; background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;">
                        ❌ មិនជោគជ័យ
                    </span>
                    <button onclick="event.stopPropagation(); openOutcomeModal('${c.id}')" title="កែប្រែលទ្ធផល" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px 5px; font-size: 12px; border-radius: 4px;" class="btn-outcome-edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            `;
        } else if (c.eventOutcome === 'shelved') {
            outcomeHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
                    <span style="display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 700; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">
                        📁 តម្កល់
                    </span>
                    <button onclick="event.stopPropagation(); openOutcomeModal('${c.id}')" title="កែប្រែលទ្ធផល" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px 5px; font-size: 12px; border-radius: 4px;" class="btn-outcome-edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            `;
        } else if (c.eventOutcome === 'continued') {
            outcomeHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">
                    <span style="display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;">
                        🔄 បន្តប្រជុំ
                    </span>
                    <button onclick="event.stopPropagation(); openOutcomeModal('${c.id}')" title="កែប្រែលទ្ធផល" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px 5px; font-size: 12px; border-radius: 4px;" class="btn-outcome-edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            `;
        } else {
            outcomeHTML = `
                <button onclick="event.stopPropagation(); openOutcomeModal('${c.id}')" class="btn btn-sm" style="background: #f0fdf4; color: #166534; border: 1px solid #86efac; font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; margin: 0 auto;" title="កត់ត្រាលទ្ធផលកម្មវិធី">
                    <i class="fa-solid fa-clipboard-check text-success"></i>
                    <span>កត់ត្រាលទ្ធផល</span>
                </button>
            `;
        }

        // Column 9: Edit / Delete Event Actions (New Column!)
        const actionsHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;" onclick="event.stopPropagation();">
                <button class="btn btn-sm" onclick="openCalendarEventModal('${c.caseEventDate}', '${c.id}')" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-size: 12px; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" title="កែប្រែកម្មវិធី">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteEvent('${c.id}')" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; font-size: 12px; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" title="លុបកម្មវិធី">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        html += `<tr class="${rowClass}" style="cursor: pointer;" onclick="openViewModal('${c.id}')" title="ចុចដើម្បីមើលលម្អិត">
            <td style="text-align: center; font-weight: 700; white-space: nowrap;">
                <div style="display: flex; align-items: center; justify-content: center;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${statusColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 0 4px ${statusColor}80;">
                        ${c.originalListNo || '-'}
                    </div>
                </div>
            </td>
            <td style="white-space: nowrap;">
                <div style="white-space: nowrap; line-height: 1.4;">
                    <div style="font-weight: 600; font-size: 13px; color: #1e293b;">
                        <i class="fa-regular fa-calendar-days text-primary"></i> ${c.caseEventDate}
                    </div>
                    <div style="font-size: 11.5px; color: #64748b; font-weight: 500; margin-top: 2px;">
                        <i class="fa-regular fa-clock"></i> ម៉ោង ${c.caseEventTime || '08:00'}
                    </div>
                </div>
            </td>
            <td style="white-space: nowrap;"><span class="case-number-tag">${c.caseNumber}</span></td>
            <td style="font-weight: 600; color: var(--text-color);">${c.caseEvent}</td>
            <td>
                <div style="font-size: 12.5px; line-height: 1.4;">
                    <strong style="color: #1e40af;">${c.partyA_name}</strong>
                    <span style="color: #94a3b8; font-weight: bold; margin: 0 4px;">vs</span>
                    <strong style="color: #b91c1c;">${c.partyB_name}</strong>
                </div>
            </td>
            <td style="white-space: nowrap;"><span style="font-size: 12.5px; color: #475569;"><i class="fa-solid fa-location-dot text-danger"></i> ${c.disputeLocation || 'មិនមាន'}</span></td>
            <td class="text-center" style="white-space: nowrap;">${statusBadgeHTML}</td>
            <td class="text-center" style="white-space: nowrap;">${outcomeHTML}</td>
            <td class="text-center" style="white-space: nowrap; background: rgba(239, 246, 255, 0.4); border-left: 1px solid #dbeafe;">${actionsHTML}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
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
    document.querySelectorAll('.view-section.fullscreen-overlay').forEach(sec => {
        if (typeof window.restoreMaximizedSection === 'function') {
            window.restoreMaximizedSection(sec);
        }
    });
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
        el.classList.remove('active');
        if (typeof el.blur === 'function') el.blur();
    });
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
        if (!isNavigatingHistory && typeof openAddModal === 'function') {
            setTimeout(() => openAddModal(), 60);
        }
    } else if (viewId === 'reports-view') {
        if (typeof renderMasterTableHeader === 'function') renderMasterTableHeader();
        if (typeof generateReport === 'function') setTimeout(() => generateReport(true), 50);
    } else if (viewId === 'profile-view') {
        if (typeof renderProfileView === 'function') renderProfileView();
    } else if (viewId === 'settings-view') {
        if (typeof applyRBAC === 'function') applyRBAC();
        const activeTabBtn = document.querySelector('#settings-view .tab-btn.active');
        if (activeTabBtn) activeTabBtn.click();
    } else if (viewId === 'strategic-plan-view') {
        if (typeof renderStrategicPlanView === 'function') renderStrategicPlanView();
    }
    else if (viewId === 'calendar-view') {
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderUpcomingEventsTable === 'function') renderUpcomingEventsTable();
    }
    if (window.innerWidth <= 768) { const sidebar = document.getElementById('sidebar'); if (sidebar) sidebar.classList.remove('open'); }
    if (typeof isNavigatingHistory !== 'undefined' && !isNavigatingHistory) {
        if (currentHistoryIndex < navigationHistory.length - 1) { navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1); }
        if (navigationHistory[currentHistoryIndex] !== viewId) { navigationHistory.push(viewId); currentHistoryIndex++; }
    }
    if (typeof updateBreadcrumb === 'function') updateBreadcrumb(viewId);
    if (typeof updateNavButtons === 'function') updateNavButtons();
}

/**
 * Render Dashboard Summary Cards
 */
function renderDashboardStats() {
    const personalCases = casesData.filter(c => (c.caseType || 'personal') === 'personal');
    const assistingCases = casesData.filter(c => c.caseType === 'assisting');

    const stats = getCaseStatistics(personalCases);
    const assistingStats = getCaseStatistics(assistingCases);
    
    // --- PERSONAL CASES STATS ---
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

    // Update Circular Percentage Badges
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

    // --- ASSISTING CASES STATS ---
    const aTotEl = document.getElementById('stat-total-assisting');
    const aActEl = document.getElementById('stat-active-assisting');
    const aSetEl = document.getElementById('stat-settle-assisting');
    const aCloEl = document.getElementById('stat-close-assisting');
    const aPenEl = document.getElementById('stat-pending-assisting');

    if (aTotEl) aTotEl.innerText = assistingStats.total;
    if (aActEl) aActEl.innerText = assistingStats.active;
    if (aSetEl) aSetEl.innerText = assistingStats.settle;
    if (aCloEl) aCloEl.innerText = assistingStats.close;
    if (aPenEl) aPenEl.innerText = assistingStats.pending;

    const aTot = assistingStats.total || 0;
    const aActPct = aTot > 0 ? Math.round((assistingStats.active / aTot) * 100) : 0;
    const aSetPct = aTot > 0 ? Math.round((assistingStats.settle / aTot) * 100) : 0;
    const aCloPct = aTot > 0 ? Math.round((assistingStats.close / aTot) * 100) : 0;
    const aPenPct = aTot > 0 ? Math.round((assistingStats.pending / aTot) * 100) : 0;

    const aActPctEl = document.getElementById('stat-active-assisting-pct');
    const aSetPctEl = document.getElementById('stat-settle-assisting-pct');
    const aCloPctEl = document.getElementById('stat-close-assisting-pct');
    const aPenPctEl = document.getElementById('stat-pending-assisting-pct');

    if (aActPctEl) aActPctEl.innerText = `${aActPct}%`;
    if (aSetPctEl) aSetPctEl.innerText = `${aSetPct}%`;
    if (aCloPctEl) aCloPctEl.innerText = `${aCloPct}%`;
    if (aPenPctEl) aPenPctEl.innerText = `${aPenPct}%`;

    const aActDonut = document.getElementById('stat-active-assisting-donut');
    const aSetDonut = document.getElementById('stat-settle-assisting-donut');
    const aCloDonut = document.getElementById('stat-close-assisting-donut');
    const aPenDonut = document.getElementById('stat-pending-assisting-donut');

    if (aActDonut) aActDonut.style.background = `conic-gradient(#2563eb 0%, #2563eb ${aActPct}%, #e2e8f0 ${aActPct}%, #e2e8f0 100%)`;
    if (aSetDonut) aSetDonut.style.background = `conic-gradient(#10b981 0%, #10b981 ${aSetPct}%, #e2e8f0 ${aSetPct}%, #e2e8f0 100%)`;
    if (aCloDonut) aCloDonut.style.background = `conic-gradient(#ef4444 0%, #ef4444 ${aCloPct}%, #e2e8f0 ${aCloPct}%, #e2e8f0 100%)`;
    if (aPenDonut) aPenDonut.style.background = `conic-gradient(#f59e0b 0%, #f59e0b ${aPenPct}%, #e2e8f0 ${aPenPct}%, #e2e8f0 100%)`;

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

    // --- ASSISTING BREAKDOWN ---
    const aActGrpEl = document.getElementById('h-stat-active-assisting-total');
    const aActSub1El = document.getElementById('h-stat-active-assisting-sub1');
    const aActSub2El = document.getElementById('h-stat-active-assisting-sub2');
    const aCloGrpEl = document.getElementById('h-stat-closed-assisting-total');
    const aCloSub1El = document.getElementById('h-stat-closed-assisting-sub1');
    const aCloSub2El = document.getElementById('h-stat-closed-assisting-sub2');
    const aNoSetR1El = document.getElementById('h-stat-nosettle-assisting-r1');
    const aNoSetR2El = document.getElementById('h-stat-nosettle-assisting-r2');

    if (aActGrpEl) aActGrpEl.innerText = assistingStats.activeGroupTotal || 0;
    if (aActSub1El) aActSub1El.innerText = assistingStats.active || 0;
    if (aActSub2El) aActSub2El.innerText = assistingStats.pending || 0;
    if (aCloGrpEl) aCloGrpEl.innerText = assistingStats.closedGroupTotal || 0;
    if (aCloSub1El) aCloSub1El.innerText = assistingStats.settle || 0;
    if (aCloSub2El) aCloSub2El.innerText = assistingStats.close || 0;
    if (aNoSetR1El) aNoSetR1El.innerText = assistingStats.noSettleReason1 || 0;
    if (aNoSetR2El) aNoSetR2El.innerText = assistingStats.noSettleReason2 || 0;

    updateDashboardSharedSections();
}

window.currentDashboardTab = 'personal';

function updateDashboardSharedSections() {
    const personalCases = casesData.filter(c => (c.caseType || 'personal') === 'personal');
    const assistingCases = casesData.filter(c => c.caseType === 'assisting');
    const targetCases = window.currentDashboardTab === 'assisting' ? assistingCases : personalCases;
    
    const stats = getCaseStatistics(targetCases);
    stats.rawCases = targetCases;
    
    renderDashboardExtendedStats(stats);
    if (typeof initOrUpdateCharts === 'function') {
        initOrUpdateCharts(stats);
    }
}

/**
 * Render Extended Dashboard Statistics (Section 4 & 5 - Request 3)
 */
function renderDashboardExtendedStats(stats) {
    const targetCases = stats.rawCases || (typeof casesData !== 'undefined' ? casesData : []);
    const catTbody = document.getElementById('dashboard-cat-stats-tbody');
    const yrTbody = document.getElementById('dashboard-yearly-tbody');
    const totalSys = stats.total || 1;

    // 1. Category Breakdown Table (Section 4)
    if (catTbody && typeof CASE_CATEGORIES !== 'undefined') {
        let catHtml = '';
        CASE_CATEGORIES.forEach((cat, idx) => {
            const count = stats.byCategory[cat] || 0;
            const pct = ((count / totalSys) * 100).toFixed(1);
            const settleCount = targetCases.filter(c => c.category === cat && (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង')))).length;
            const activeCount = targetCases.filter(c => c.category === cat && (c.status.startsWith('Active') || c.status.includes('កំពុង'))).length;
            
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
        const allCases = targetCases;
        allCases.forEach(c => {
            let yr = '2026';
            if (c && c.dateReceived) {
                const match = String(c.dateReceived).match(/\d{4}/);
                if (match) yr = match[0];
            }
            if (!yearMap[yr]) yearMap[yr] = { total: 0, settle: 0, active: 0, other: 0 };
            yearMap[yr].total++;
            if (c && (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង')))) yearMap[yr].settle++;
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

function formatExcelDate(d) {
    if (!d) return '-';
    if (!isNaN(d) && parseFloat(d) > 20000 && parseFloat(d) < 90000) {
        const serial = parseFloat(d);
        const utc_days = Math.floor(serial - 25569);
        const date_info = new Date(utc_days * 86400 * 1000);
        return String(date_info.getDate()).padStart(2, '0') + '/' + 
               String(date_info.getMonth() + 1).padStart(2, '0') + '/' + 
               date_info.getFullYear();
    }
    return d;
}

function getStatusColor(statusStr) {
    if (!statusStr) return '#94a3b8';
    if (statusStr.startsWith('Settle')) return '#22c55e'; // green
    if (statusStr.startsWith('Close') || statusStr.includes('មិនព្រមព្រៀង')) return '#ef4444'; // red
    if (statusStr.startsWith('Pending')) return '#f59e0b'; // yellow
    return '#3b82f6'; // blue for active
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

    const statusColor = getStatusColor(c.status);
    const rowNumHtml = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${statusColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 0 4px ${statusColor}80;">
                ${c.originalListNo || '-'}
            </div>
        </div>
    `;

    return `
        <tr onclick="toggleRowHighlight(this, '${statusColor}')" ondblclick="openViewModal('${c.id}')" style="cursor: pointer;" title="ចុចមួយដងដើម្បីជ្រើសរើស ចុចពីរដងដើម្បីមើលប័ណ្ណ">
            <td class="text-center freeze-col-1" style="font-weight: bold; color: #64748b;">${rowNum}</td>
            <td class="text-center freeze-col-2" style="white-space: normal; word-wrap: break-word;">${rowNumHtml}</td>
            <td class="text-center freeze-col-3">
                ${c.folderLink ? `<a href="javascript:void(0)" onclick="window.electronAPI ? window.electronAPI.openFolder('${c.folderLink.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}') : window.open('${c.folderLink.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')" title="បើក Folder" class="btn-icon" style="color:#0ea5e9; text-decoration:none;"><i class="fa-solid fa-folder-open"></i></a>` : '<span class="text-muted" style="font-size:11px;">-</span>'}
            </td>

            <td class="freeze-col-4"><span class="case-number-tag" style="white-space: normal; word-wrap: break-word;">${c.caseNumber}</span></td>
            <td class="freeze-col-5">${formatExcelDate(c.dateReceived)}</td>
            <td class="text-center" style="white-space: normal; word-wrap: break-word;">${getStatusBadgeHTML(c.status)}</td>
            <td class="text-center" style="white-space: nowrap;">${generatePhaseBadge(c.casePhases)}</td>
            <td style="white-space: normal; word-wrap: break-word;">
                <span style="font-size: 12px; font-weight: 600; color: #1e40af;">${c.caseEvent || '-'}</span>
            </td>
            <td>
                <span style="font-size: 12px; font-weight: 600; color: #b91c1c;">${c.caseEventDate || '-'}</span>
            </td>
            <td>
                <div class="party-box" style="max-width: 250px; white-space: normal; word-wrap: break-word;">
                    <strong title="${c.partyA_name}" style="color: #1e40af;">${c.partyA_name}</strong>
                    <span><i class="fa-solid fa-map-marker-alt"></i> ${c.partyA_location}</span>
                </div>
            </td>
            <td>
                <div class="party-box" style="max-width: 250px; white-space: normal; word-wrap: break-word;">
                    <strong title="${c.partyB_name}" style="color: #b91c1c;">${c.partyB_name}</strong>
                    <span><i class="fa-solid fa-map-marker-alt"></i> ${c.partyB_location}</span>
                </div>
            </td>
            <td>
                <div class="party-box" style="max-width: 120px; white-space: normal; word-wrap: break-word;">
                    <strong title="${c.partyC_name || ''}">${c.partyC_name || '-'}</strong>
                </div>
            </td>
            <td><span style="font-weight: 600;">${t_val(c.category)}</span></td>
            <td><span class="badge" style="background: var(--border-color); color: var(--text-color); white-space: normal;">${t_val(c.disputeLocation)}</span><br><small style="color: #64748b; white-space: normal;">${c.disputeAddress || ''}</small></td>
            
            <td class="text-center" style="white-space: normal; word-wrap: break-word;">
                <span class="badge ${c.remarks === 'បានបិទរួចរាល់' ? 'badge-settle' : 'badge-pending'}" style="font-size: 11px;">
                    ${c.remarks}
                </span>
            </td>
            <td class="text-center" style="white-space: nowrap; min-width: 150px;">
                <div class="action-btns" style="display: flex; gap: 4px; justify-content: center; flex-wrap: nowrap;">
                    <button type="button" class="btn-icon system-action-btn" data-action="view" data-id="${c.id}" title="មើលប័ណ្ណ"><i class="fa-solid fa-eye" style="pointer-events: none;"></i></button>
                    <button type="button" class="btn-icon text-success system-action-btn" data-action="legal" data-id="${c.id}" title="ផលិតលិខិតគតិយុត្ត"><i class="fa-solid fa-file-signature" style="pointer-events: none;"></i></button>
                    <button type="button" class="btn-icon text-info system-action-btn" data-action="telegram" data-id="${c.id}" title="ចែករំលែកទៅ Telegram"><i class="fab fa-telegram-plane" style="pointer-events: none;"></i></button>
                    <button type="button" class="btn-icon system-action-btn" data-action="clone" data-id="${c.id}" title="ចម្លងសំណុំរឿង (Clone)" style="color: #f59e0b;"><i class="fa-solid fa-copy" style="pointer-events: none;"></i></button>
                    <button type="button" class="btn-icon system-action-btn" data-action="edit" data-id="${c.id}" title="កែសម្រួល"><i class="fa-solid fa-pen" style="pointer-events: none;"></i></button>
                    <button type="button" class="btn-icon delete-btn system-action-btn" data-action="delete" data-id="${c.id}" title="លុប"><i class="fa-solid fa-trash" style="pointer-events: none;"></i></button>
                </div>
            </td>
        </tr>
    `;
}

// BULLETPROOF EVENT DELEGATION FOR ACTION BUTTONS
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.system-action-btn');
    if (!btn) return;
    
    // Completely stop this click from bubbling to the row's ondblclick or anything else
    e.preventDefault();
    e.stopPropagation();
    
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    
    if (action === 'view') {
        if(typeof openViewModal === 'function') openViewModal(id);
    } else if (action === 'legal') {
        if(typeof openLegalDocModal === 'function') openLegalDocModal(id);
    } else if (action === 'telegram') {
        if(typeof shareCaseToTelegram === 'function') shareCaseToTelegram(id);
    } else if (action === 'clone') {
        if(typeof window.cloneCaseToForm === 'function') window.cloneCaseToForm(id);
    } else if (action === 'edit') {
        if(typeof openEditModal === 'function') openEditModal(id);
    } else if (action === 'delete') {
        if(typeof confirmDeleteCase === 'function') confirmDeleteCase(id);
    }
}, true); // Use capture phase to intercept before any other listener (like row listeners) can act on it!

/**
 * Render All Cases Table in Case Entry View (#entry-view)
 * Aligned 100% with Master Case Directory schema & styling
 */
function renderEntryCasesTable() {
    const tbody = document.getElementById('entry-cases-tbody');
    const countBadge = document.getElementById('entry-table-count');
    if (!tbody) return;

    // Sort from 1 to N (oldest/first entered to newest/last entered, matching master list)
    const sorted = sortCases(casesData, 'default');
    if (countBadge) countBadge.innerText = `សរុប៖ ${sorted.length} ករណី`;

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4">គ្មានទិន្នន័យសំណុំរឿងឡើយ</td></tr>`;
        return;
    }

    const personalCases = sorted.filter(c => c.caseType !== 'assisting');
    const assistingCases = sorted.filter(c => c.caseType === 'assisting');

    let html = '';
    
    // Header for Personal
    html += `<tr class="section-header"><td colspan="16" style="background:#f1f5f9; font-weight:bold; color:#0f172a; padding:10px; text-align: left;"><i class="fa-solid fa-user-tie"></i> ផ្នែក ក. សំណុំរឿងផ្ទាល់ខ្លួន (${personalCases.length} ករណី)</td></tr>`;
    if (personalCases.length === 0) {
        html += `<tr><td colspan="16" class="text-center text-muted py-2">គ្មានទិន្នន័យ</td></tr>`;
    } else {
        personalCases.forEach((c) => {
            html += generateMasterCaseRowHTML(c, c.originalListNo);
        });
    }

    // Header for Assisting
    html += `<tr class="section-header"><td colspan="16" style="background:#fff7ed; font-weight:bold; color:#9a3412; padding:10px; text-align: left;"><i class="fa-solid fa-user-group"></i> ផ្នែក ខ. សំណុំរឿងអម (${assistingCases.length} ករណី)</td></tr>`;
    if (assistingCases.length === 0) {
        html += `<tr><td colspan="16" class="text-center text-muted py-2">គ្មានទិន្នន័យ</td></tr>`;
    } else {
        assistingCases.forEach((c) => {
            html += generateMasterCaseRowHTML(c, c.originalListNo);
        });
    }
    
    tbody.innerHTML = html;
}

// MASTER CASES DATA & INTERNATIONAL STANDARD CONTROLLER
let currentMtTypeFilter = 'all'; // 'all', 'personal', 'assisting'
let currentSchedFilter = 'all';  // 'all', 'scheduled', 'unscheduled'
let selectedMasterCaseId = null;

function normalizeCaseStatus(statusStr, isDraft) {
    if (isDraft) return 'draft';
    if (!statusStr) return 'mediating';
    const s = String(statusStr).toLowerCase();
    if (s.includes('settle') && !s.includes('no')) return 'settled';
    if (s.includes('ព្រមព្រៀង') && !s.includes('មិន')) return 'settled';
    if (s.includes('pending') || s.includes('តម្កល់') || s.includes('shelved')) return 'shelved';
    if (s.includes('no settle') || s.includes('close') || s.includes('unsuccessful') || s.includes('មិនជោគជ័យ') || s.includes('មិនព្រមព្រៀង') || s.includes('បិទ')) return 'unsuccessful';
    return 'mediating';
}

function normalizeCasePhase(phaseStr, statusNormalized) {
    if (phaseStr) {
        const p = String(phaseStr).toLowerCase();
        if (p.includes('1') || p.includes('១') || p.includes('phase1')) return 'phase1';
        if (p.includes('3') || p.includes('៣') || p.includes('phase3')) return 'phase3';
        return 'phase2';
    }
    if (statusNormalized === 'settled' || statusNormalized === 'unsuccessful') return 'phase3';
    return 'phase2';
}

function checkCaseHasEvent(c) {
    if (!c) return false;
    if (c.hasEvent === true) return true;
    if (c.caseEvent && (c.caseEventDate || c.caseEvent.date || c.caseEventTitle || c.caseEvent.title)) return true;
    if (c.caseEventDate && String(c.caseEventDate).trim() !== '') return true;
    if (c.eventDate && String(c.eventDate).trim() !== '') return true;
    return false;
}

function getCaseEventDetails(c) {
    const date = c.eventDate || c.caseEventDate || (c.caseEvent && c.caseEvent.date) || '';
    const time = c.eventTime || c.caseEventTime || (c.caseEvent && c.caseEvent.time) || '';
    const desc = c.eventDesc || c.caseEventTitle || (c.caseEvent && (c.caseEvent.title || c.caseEvent.type)) || 'ប្រជុំសម្រុះសម្រួល';
    return { date, time, desc };
}

function getCaseAmountDisplay(c) {
    if (c.amount) return c.amount;
    if (c.claimAmount && String(c.claimAmount).trim() !== '') {
        const curr = c.claimCurrency || 'USD';
        const num = Number(String(c.claimAmount).replace(/[^0-9.]/g, ''));
        return !isNaN(num) && num > 0 ? `${num.toLocaleString()} ${curr}` : `${c.claimAmount} ${curr}`;
    }
    return '-';
}

function filterMasterType(type) {
    currentMtTypeFilter = type;
    document.querySelectorAll('.mt-type-tab').forEach(t => {
        t.className = 'mt-type-tab px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer';
    });
    const activeBtn = document.getElementById(`mt-tab-${type}`);
    if (activeBtn) {
        if (type === 'assisting') {
            activeBtn.className = 'mt-type-tab px-3 py-1.5 rounded-lg bg-purple-700 text-white font-bold transition flex items-center gap-1 shadow-sm cursor-pointer';
        } else {
            activeBtn.className = 'mt-type-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold transition flex items-center gap-1 shadow-sm cursor-pointer';
        }
    }
    renderMasterTable();
}

function filterEventSchedule(type) {
    currentSchedFilter = type;
    document.querySelectorAll('.sched-filter-tab').forEach(t => {
        t.className = 'sched-filter-tab px-3 py-1 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition flex items-center gap-1 cursor-pointer';
    });
    const activeBtn = document.getElementById(`tab-sched-${type === 'scheduled' ? 'yes' : (type === 'unscheduled' ? 'no' : 'all')}`);
    if (activeBtn) {
        if (type === 'scheduled') {
            activeBtn.className = 'sched-filter-tab px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold transition flex items-center gap-1 shadow-sm cursor-pointer';
        } else if (type === 'unscheduled') {
            activeBtn.className = 'sched-filter-tab px-3 py-1 rounded-lg bg-amber-600 text-white font-bold transition flex items-center gap-1 shadow-sm cursor-pointer';
        } else {
            activeBtn.className = 'sched-filter-tab px-3 py-1 rounded-lg bg-slate-800 text-white font-bold transition cursor-pointer';
        }
    }
    renderMasterTable();
}

function filterMasterData() {
    renderMasterTable();
}

function selectMasterCaseRow(caseId, event) {
    if (selectedMasterCaseId === caseId) {
        selectedMasterCaseId = null;
    } else {
        selectedMasterCaseId = caseId;
    }
    renderMasterTable();
}

function openCaseProfile(caseId) {
    if (typeof openViewModal === 'function') {
        openViewModal(caseId);
    }
}

function openNewCaseModal() {
    if (typeof openAddModal === 'function') {
        openAddModal();
    }
}

function cloneCaseFromNo(caseNo) {
    const found = (casesData || []).find(c => String(c.caseNumber || c.caseNo) === String(caseNo) || String(c.id) === String(caseNo));
    if (found && typeof window.cloneCaseToForm === 'function') {
        window.cloneCaseToForm(found.id);
    } else if (typeof window.cloneCaseToForm === 'function') {
        window.cloneCaseToForm(caseNo);
    }
}

function openQuickNoteModal(caseId) {
    const c = (casesData || []).find(item => String(item.id) === String(caseId));
    if (!c) return;
    const currentNote = c.note || c.summary || c.remarks || '';
    const newNote = prompt('កែសម្រួល / បញ្ចូលកំណត់ចំណាំរហ័សសម្រាប់សំណុំរឿង ' + (c.caseNumber || c.id) + '៖', currentNote);
    if (newNote !== null) {
        c.note = newNote;
        c.summary = newNote;
        c.lastActionDate = new Date().toISOString().split('T')[0];
        if (typeof saveCases === 'function') saveCases();
        renderMasterTable();
        if (typeof showToast === 'function') showToast('បានរក្សាទុកកំណត់ចំណាំសំណុំរឿងរួចរាល់', 'success');
    }
}

function openEditEventModal(caseId) {
    const c = (casesData || []).find(item => String(item.id) === String(caseId));
    if (c && typeof openCalendarEventModal === 'function') {
        const evtDate = c.eventDate || c.caseEventDate || (c.caseEvent && c.caseEvent.date) || new Date().toISOString().split('T')[0];
        openCalendarEventModal(evtDate, c.id);
    } else if (typeof openEditModal === 'function') {
        openEditModal(caseId);
    }
}

function openAddEventModal() {
    if (typeof openCalendarModal === 'function') {
        openCalendarModal();
    } else if (typeof openCalendarEventModal === 'function') {
        openCalendarEventModal(new Date().toISOString().split('T')[0]);
    }
}

function exportMasterTableExcel() {
    if (typeof exportReportToExcel === 'function') {
        exportReportToExcel();
    } else if (typeof showToast === 'function') {
        showToast('📥 កំពុងរៀបចំទាញចេញទិន្នន័យជាឯកសារ Excel...', 'info');
    }
}

function renderMasterTable() {
    const tbody = document.getElementById('master-cases-tbody');
    if (!tbody) {
        applyFiltersAndRenderLegacyTable();
        return;
    }

    const data = casesData || [];

    // 1. Update Summary Table (7 Columns with Personal / Assisting splits) & Tab Badges
    const totalCases = data.length;
    let personalCases = 0;
    let assistingCases = 0;

    let medTotal = 0, medPersonal = 0, medAssisting = 0;
    let setTotal = 0, setPersonal = 0, setAssisting = 0;
    let shvTotal = 0, shvPersonal = 0, shvAssisting = 0;
    let clsTotal = 0, clsPersonal = 0, clsAssisting = 0;
    let scheduledCount = 0;

    data.forEach(c => {
        const isAssisting = c.caseType === 'assisting';
        if (isAssisting) assistingCases++;
        else personalCases++;

        const st = normalizeCaseStatus(c.status, c.isDraft);
        if (st === 'settled') {
            setTotal++;
            if (isAssisting) setAssisting++; else setPersonal++;
        } else if (st === 'shelved') {
            shvTotal++;
            if (isAssisting) shvAssisting++; else shvPersonal++;
        } else if (st === 'unsuccessful') {
            clsTotal++;
            if (isAssisting) clsAssisting++; else clsPersonal++;
        } else {
            medTotal++;
            if (isAssisting) medAssisting++; else medPersonal++;
        }

        if (checkCaseHasEvent(c)) scheduledCount++;
    });
    const unscheduledCount = totalCases - scheduledCount;

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    // Summary Table (PDF 11-Subcolumn Standard)
    setEl('sum-total-all', totalCases);
    setEl('sum-total-personal', personalCases);
    setEl('sum-total-assisting', assistingCases);

    setEl('sum-med-total', medTotal);
    setEl('sum-med-personal', medPersonal);
    setEl('sum-med-assisting', medAssisting);

    setEl('sum-set-total', setTotal);
    setEl('sum-set-personal', setPersonal);
    setEl('sum-set-assisting', setAssisting);

    setEl('sum-shv-total', shvTotal);
    setEl('sum-shv-personal', shvPersonal);
    setEl('sum-shv-assisting', shvAssisting);

    setEl('sum-cls-total', clsTotal);
    setEl('sum-cls-personal', clsPersonal);
    setEl('sum-cls-assisting', clsAssisting);

    // Filter Tab Counters
    setEl('count-tab-all', totalCases);
    setEl('count-tab-personal', personalCases);
    setEl('count-tab-assisting', assistingCases);
    setEl('count-sched-yes', scheduledCount);
    setEl('count-sched-no', unscheduledCount);

    // 2. Read Search & Filter Controls
    const query = (document.getElementById('mt-search')?.value || document.getElementById('filter-search')?.value || '').trim().toLowerCase();
    const catFilter = document.getElementById('mt-filter-cat')?.value || 'all';
    const provFilter = document.getElementById('mt-filter-prov')?.value || 'all';
    const statusFilter = document.getElementById('mt-filter-status')?.value || 'all';
    const hlFilter = document.getElementById('mt-filter-highlight')?.value || 'all';

    // 3. Filter Dataset
    const filtered = data.filter(c => {
        const matchType = (currentMtTypeFilter === 'all') || (currentMtTypeFilter === 'assisting' ? (c.caseType === 'assisting') : (c.caseType !== 'assisting'));
        
        const normStatus = normalizeCaseStatus(c.status, c.isDraft);
        let matchStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'draft') matchStatus = !!c.isDraft;
            else matchStatus = !c.isDraft && (normStatus === statusFilter);
        }

        const cat = (c.category || '').toLowerCase();
        const matchCat = (catFilter === 'all') || cat.includes(catFilter.toLowerCase());

        const loc = ((c.disputeLocation || '') + ' ' + (c.locationProvince || '') + ' ' + (c.disputeAddress || '')).toLowerCase();
        const matchProv = (provFilter === 'all') || loc.includes(provFilter.toLowerCase());

        let matchHl = true;
        if (hlFilter === 'priority') matchHl = !!c.isPriority;
        else if (hlFilter !== 'all') matchHl = (c.highlight === hlFilter);

        const hasEvt = checkCaseHasEvent(c);
        let matchSched = true;
        if (currentSchedFilter === 'scheduled') matchSched = hasEvt;
        else if (currentSchedFilter === 'unscheduled') matchSched = !hasEvt;

        const pA = (c.partyA_name || c.party1 || '').toLowerCase();
        const pB = (c.partyB_name || c.party2 || '').toLowerCase();
        const pC = (c.partyC_name || c.party3 || '').toLowerCase();
        const cNo = (c.caseNumber || c.caseNo || '').toLowerCase();
        const summ = (c.summary || c.note || c.remarks || '').toLowerCase();

        const matchSearch = query === '' ||
            cNo.includes(query) ||
            pA.includes(query) ||
            pB.includes(query) ||
            pC.includes(query) ||
            cat.includes(query) ||
            loc.includes(query) ||
            summ.includes(query);

        return matchType && matchStatus && matchCat && matchProv && matchHl && matchSched && matchSearch;
    });

    window.filteredCasesCache = filtered;

    // 4. Update Showing Count
    const countEl = document.getElementById('mt-showing-count');
    if (countEl) countEl.innerHTML = `បង្ហាញសំណុំរឿងទាំងអស់ចំនួន <strong>${filtered.length}</strong> នៃ <strong>${totalCases}</strong> សំណុំរឿងសរុប`;

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="py-10 text-center text-slate-400">
                    <div class="text-3xl mb-1">🔍</div>
                    <div class="font-medium text-xs">រកមិនឃើញសំណុំរឿងត្រូវនឹងលក្ខខណ្ឌចម្រាញ់ឡើយ</div>
                </td>
            </tr>
        `;
        return;
    }

    // 5. Render Rows
    filtered.forEach((item, index) => {
        const tr = document.createElement('tr');
        const isSelected = (selectedMasterCaseId === item.id);
        const normStatus = normalizeCaseStatus(item.status, item.isDraft);

        let statusRowClass = 'status-mediating';
        let circleBadgeClass = 'bg-blue-600 text-white ring-2 ring-blue-200 shadow-xs';

        if (normStatus === 'unsuccessful') {
            statusRowClass = 'status-unsuccessful';
            circleBadgeClass = 'bg-rose-600 text-white ring-2 ring-rose-200 shadow-xs';
        } else if (normStatus === 'settled') {
            statusRowClass = 'status-settled';
            circleBadgeClass = 'bg-emerald-600 text-white ring-2 ring-emerald-200 shadow-xs';
        } else if (normStatus === 'shelved') {
            statusRowClass = 'status-shelved';
            circleBadgeClass = 'bg-amber-600 text-white ring-2 ring-amber-200 shadow-xs';
        } else if (normStatus === 'draft') {
            statusRowClass = 'status-draft';
            circleBadgeClass = 'bg-slate-600 text-white ring-2 ring-slate-200 shadow-xs';
        }

        tr.className = `master-case-row ${statusRowClass} ${isSelected ? 'row-selected font-semibold' : ''}`;
        tr.onclick = (e) => selectMasterCaseRow(item.id, e);
        tr.ondblclick = (e) => {
            e.stopPropagation();
            openCaseProfile(item.id);
        };
        tr.title = "ចុច ១ ដងដើម្បីដិតពណ៌ • ចុច ២ ដង (Double Click) ដើម្បីបើកមើល Profile សំណុំរឿង";

        const listNo = item.originalListNo || (index + 1);
        const caseNumber = item.caseNumber || item.caseNo || `NADR-${item.id}`;
        const cleanCaseNumber = String(caseNumber).replace(/^#+/, '');
        const filingDate = item.filingDate || item.dateReceived || '-';
        const category = item.category || 'វិវាទដីធ្លី';
        const party1 = item.partyA_name || item.party1 || 'ភាគី ក';
        const party2 = item.partyB_name || item.party2 || 'ភាគី ខ';
        const party3 = item.partyC_name || item.party3 || '';
        const location = item.disputeLocation || item.locationProvince || item.location || 'ភ្នំពេញ';
        const amountDisplay = getCaseAmountDisplay(item);

        const folderUrl = String(item.folderLink || item.driveLink || '').trim();
        let folderBtn = '';
        if (folderUrl) {
            folderBtn = `<button type="button" onclick="event.stopPropagation(); openLinkedCaseFolder('${item.id}')" title="បើក Folder៖ ${folderUrl.replace(/"/g, '&quot;')}" class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-200 shadow-2xs transition cursor-pointer">
                <i class="fa-solid fa-folder-open text-xs"></i>
            </button>`;
        } else {
            folderBtn = `<button type="button" onclick="event.stopPropagation(); openCaseFolderLinkInput('${item.id}')" onmouseenter="showFolderUnlinkedTooltip(this)" onmouseleave="hideFolderUnlinkedTooltip()" title="Folder មិនទាន់បានភ្ជាប់ Link — ចុចដើម្បីភ្ជាប់" class="folder-unlinked-btn inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-600 hover:text-amber-800 border border-dashed border-amber-300 transition cursor-pointer">
                <i class="fa-regular fa-folder-open text-xs"></i>
            </button>`;
        }

        const normPhase = normalizeCasePhase(item.phase, normStatus);
        let stageBadge = '';
        if (normPhase === 'phase1') {
            stageBadge = `
                <div class="row-zoom-target-center">
                    <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        <span>① ដំណាក់កាល១</span>
                    </div>
                    <div class="text-[10.5px] text-slate-500 font-medium leading-tight mt-0.5">(ត្រៀមរៀបចំ)</div>
                </div>
            `;
        } else if (normPhase === 'phase2') {
            stageBadge = `
                <div class="row-zoom-target-center">
                    <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        <span>② ដំណាក់កាល២</span>
                    </div>
                    <div class="text-[10.5px] text-slate-500 font-medium leading-tight mt-0.5">(សម្រុះសម្រួល)</div>
                </div>
            `;
        } else {
            stageBadge = `
                <div class="row-zoom-target-center">
                    <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>③ ដំណាក់កាល៣</span>
                    </div>
                    <div class="text-[10.5px] text-slate-500 font-medium leading-tight mt-0.5">(ក្រោយប្រជុំ/បិទ)</div>
                </div>
            `;
        }

        let statusBadge = '';
        if (normStatus === 'draft') {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-white/95 text-slate-700 border border-slate-400 shadow-2xs">📝 សំណុំរឿងព្រាង</span>';
        } else if (normStatus === 'settled') {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-white/95 text-emerald-800 border border-emerald-500 shadow-2xs">🟢 ព្រមព្រៀង</span>';
        } else if (normStatus === 'shelved') {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-white/95 text-amber-800 border border-amber-500 shadow-2xs">🟡 តម្កល់</span>';
        } else if (normStatus === 'unsuccessful') {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-white/95 text-rose-800 border border-rose-500 shadow-2xs">🔴 បិទសំណុំរឿង</span>';
        } else {
            statusBadge = '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-white/95 text-blue-800 border border-blue-500 shadow-2xs">🔵 កំពុងសម្រុះសម្រួល</span>';
        }

        let catColor = 'bg-white/95 text-blue-800 border-blue-200';
        if (category.includes('ដីធ្លី')) catColor = 'bg-white/95 text-emerald-800 border-emerald-200';
        else if (category.includes('កិច្ចសន្យា')) catColor = 'bg-white/95 text-amber-800 border-amber-300';
        else if (category.includes('ពាណិជ្ជកម្ម')) catColor = 'bg-white/95 text-purple-800 border-purple-200';
        else if (category.includes('គ្រួសារ')) catColor = 'bg-white/95 text-pink-800 border-pink-200';

        const hasEvt = checkCaseHasEvent(item);
        const evt = getCaseEventDetails(item);

        let lastDateDisplay = item.lastActionDate || item.dateReceived || filingDate;
        const todayStr = new Date().toISOString().split('T')[0];
        if (item.lastActionDate === todayStr) {
            lastDateDisplay = '<span class="text-blue-700 font-bold">ថ្ងៃនេះ</span>';
        }

        const noteText = item.note || item.summary || item.remarks || '';

        tr.innerHTML = `
            <!-- 1. ល.រ ក្នុងបញ្ជី (Freeze ទី១) -->
            <td class="py-2 px-1.5 text-center align-middle whitespace-nowrap freeze-col-1">
                <div class="row-zoom-target-center">
                    <span class="w-7 h-7 rounded-full font-bold text-[12px] inline-flex items-center justify-center ${circleBadgeClass}">
                        ${listNo}
                    </span>
                    <div class="mt-1 leading-none">
                        ${item.caseType === 'assisting' ? 
                            '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">👥 អម</span>' : 
                            '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/95 text-slate-700 border border-slate-300">👤 ផ្ទាល់ខ្លួន</span>'
                        }
                    </div>
                </div>
            </td>

            <!-- 2. ទៅកាន់ Folder (Freeze ទី២) -->
            <td class="py-2 px-1.5 text-center align-middle whitespace-nowrap freeze-col-folder">
                <div class="row-zoom-target-center">
                    ${folderBtn}
                </div>
            </td>

            <!-- 3. លេខសំណុំរឿង (Freeze ទី៣) -->
            <td class="py-2 px-2.5 align-middle whitespace-nowrap freeze-col-2">
                <div class="row-zoom-target">
                    <div class="flex items-center gap-1.5 leading-tight">
                        <button type="button" onclick="event.stopPropagation(); openCaseProfile('${item.id}')" class="font-mono font-bold text-slate-900 hover:text-blue-700 text-[13px] hover:underline flex items-center gap-1 cursor-pointer" title="មើល Profile សំណុំរឿង">
                            <span>${cleanCaseNumber}</span>
                        </button>
                        ${item.isPriority ? '<span title="សំណុំរឿងអាទិភាព" class="text-amber-500 text-[11px]">⭐</span>' : ''}
                    </div>
                    <div class="flex items-center gap-1.5 mt-1 leading-none">
                        <span class="text-[11px] text-slate-500 font-mono font-medium">${filingDate}</span>
                        ${hasEvt ? '<span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="បានដាក់កម្មវិធីរួច">📅</span>' : ''}
                    </div>
                </div>
            </td>

            <!-- 4. ប្រភេទវិវាទ (Freeze ទី៤) -->
            <td class="py-2 px-2.5 align-middle whitespace-nowrap freeze-col-3">
                <div class="row-zoom-target">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold border shadow-2xs truncate max-w-full ${catColor}" title="${category}">
                        ${category}
                    </span>
                </div>
            </td>

            <!-- 5. សមាសភាពភាគី (ក vs ខ / គ) (Freeze ទី៥) -->
            <td class="py-2 px-3 align-middle freeze-col-4">
                <div class="space-y-1.5 leading-snug row-zoom-target">
                    <div class="font-bold text-blue-950 flex items-start gap-1.5" title="ភាគី ក៖ ${party1}">
                        <span class="px-1.5 py-0.5 mt-0.5 rounded bg-blue-100 text-blue-800 text-[9.5px] font-extrabold shrink-0">ក</span>
                        <span class="text-[12px] font-semibold leading-snug break-words">${party1}</span>
                    </div>
                    <div class="text-rose-900 flex items-start gap-1.5 font-medium" title="ភាគី ខ៖ ${party2}${party3 ? ' | ភាគី គ៖ ' + party3 : ''}">
                        <span class="px-1.5 py-0.5 mt-0.5 rounded bg-rose-100 text-rose-800 text-[9.5px] font-extrabold shrink-0">ខ</span>
                        <span class="text-[12px] font-semibold text-rose-950 leading-snug break-words">${party2}</span>
                        ${party3 ? `<span class="px-1.5 py-0.5 mt-0.5 rounded bg-purple-100 text-purple-800 text-[9.5px] font-bold shrink-0" title="${party3}">+គ</span>` : ''}
                    </div>
                </div>
            </td>

            <!-- 6. ទីតាំង & ទំហំវិវាទ (Scrollable) -->
            <td class="py-2 px-3 align-middle whitespace-nowrap leading-tight">
                <div class="row-zoom-target space-y-1">
                    <div class="flex items-center gap-1 text-slate-800 font-semibold truncate text-[12px]" title="${location}">
                        <span class="text-rose-500 text-[11px]">📍</span>
                        <span class="truncate">${location}</span>
                    </div>
                    <div class="text-[11.5px] text-slate-700 font-mono font-bold truncate" title="${amountDisplay}">
                        💰 ${amountDisplay}
                    </div>
                </div>
            </td>

            <!-- 7. ដំណាក់កាលចាត់ការ (Scrollable) -->
            <td class="py-2 px-2 text-center align-middle whitespace-nowrap">
                ${stageBadge}
            </td>

            <!-- 8. លទ្ធផល (Scrollable) -->
            <td class="py-2 px-2 text-center align-middle whitespace-nowrap">
                <div class="row-zoom-target-center">
                    ${statusBadge}
                </div>
            </td>

            <!-- 9. កម្មវិធីសំណុំរឿង (Scrollable) -->
            <td class="py-1.5 px-2.5 text-center align-middle border-x border-slate-200/60">
                ${hasEvt ? `
                    <div class="h-[48px] px-2.5 py-1 rounded-lg bg-white/95 border border-indigo-200 shadow-2xs flex flex-col justify-center text-left leading-tight row-zoom-target">
                        <div class="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                            <span class="flex items-center gap-1 truncate">
                                <span>📅</span>
                                <span class="font-mono">${evt.date}</span>
                            </span>
                            <button type="button" onclick="event.stopPropagation(); openEditEventModal('${item.id}')" class="text-[10.5px] text-indigo-600 hover:text-indigo-900 font-bold hover:underline shrink-0 cursor-pointer">
                                កែប្រែ
                            </button>
                        </div>
                        <div class="text-[11.5px] font-medium text-slate-800 truncate mt-0.5" title="${evt.desc}">
                            ${evt.desc}
                        </div>
                    </div>
                ` : `
                    <div class="h-[48px] px-2.5 py-1 rounded-lg bg-white/70 border border-dashed border-slate-300 flex flex-col items-center justify-center leading-tight row-zoom-target-center">
                        <div class="text-[10.5px] text-amber-800 font-semibold">⚠️ មិនទាន់ដាក់កម្មវិធី</div>
                        <button type="button" onclick="event.stopPropagation(); openEditEventModal('${item.id}')" class="mt-0.5 text-[10.5px] text-indigo-700 hover:text-indigo-950 font-bold hover:underline cursor-pointer">
                            + ដាក់កាលវិភាគ
                        </button>
                    </div>
                `}
            </td>

            <!-- 10. កំណត់ចំណាំ (Scrollable) -->
            <td class="py-1.5 px-2.5 align-middle">
                <div class="h-[48px] px-2.5 py-1 rounded-lg bg-white/95 border border-slate-200 hover:border-blue-400 shadow-2xs flex flex-col justify-center leading-tight row-zoom-target cursor-pointer" onclick="event.stopPropagation(); openQuickNoteModal('${item.id}')" title="${noteText ? noteText : 'ចុចដើម្បីវាយបញ្ចូលបរិយាយកំណត់ចំណាំដោយសេរី'}">
                    <div class="flex items-center justify-between text-[11px] text-indigo-950 font-bold">
                        <span class="truncate">📝 បរិយាយចំណាំ</span>
                        <span class="font-mono text-slate-500 text-[10.5px] shrink-0">${lastDateDisplay}</span>
                    </div>
                    <div class="text-[11.5px] text-slate-700 truncate mt-0.5 font-medium">
                        ${noteText ? noteText : '<span class="text-slate-400 italic font-normal">+ ចុចវាយកំណត់ចំណាំ...</span>'}
                    </div>
                </div>
            </td>

            <!-- 11. សកម្មភាព (Fit Compact) -->
            <td class="py-2 px-1 text-center align-middle whitespace-nowrap border-l border-slate-200/60">
                <div class="inline-flex items-center justify-center gap-[3px] row-zoom-target-center">
                    <button type="button" onclick="event.stopPropagation(); openCaseProfile('${item.id}')" title="មើល Profile សំណុំរឿងលម្អិត" class="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 flex items-center justify-center transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); cloneCaseFromNo('${item.id}')" title="ចម្លងសំណុំរឿង (Clone)" class="w-6 h-6 rounded-md bg-white hover:bg-amber-100 text-amber-700 border border-slate-200 flex items-center justify-center transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); if (typeof openLegalDocModal === 'function') openLegalDocModal('${item.id}');" title="ផលិតលិខិតផ្លូវការ" class="w-6 h-6 rounded-md bg-white hover:bg-indigo-100 text-indigo-700 border border-slate-200 flex items-center justify-center transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); if (typeof openEditModal === 'function') openEditModal('${item.id}');" title="កែសម្រួល" class="w-6 h-6 rounded-md bg-white hover:bg-emerald-100 text-emerald-700 border border-slate-200 flex items-center justify-center transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button type="button" onclick="event.stopPropagation(); if (typeof confirmDeleteCase === 'function') confirmDeleteCase('${item.id}');" title="លុប" class="w-6 h-6 rounded-md bg-white hover:bg-rose-100 text-rose-700 border border-slate-200 flex items-center justify-center transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function applyFiltersAndRenderMasterTable() {
    renderMasterTable();
}

// Global exports
window.renderMasterTable = renderMasterTable;
window.applyFiltersAndRenderMasterTable = renderMasterTable;
window.filterMasterType = filterMasterType;
window.filterEventSchedule = filterEventSchedule;
window.filterMasterData = filterMasterData;
window.selectMasterCaseRow = selectMasterCaseRow;
window.openCaseProfile = openCaseProfile;
window.openNewCaseModal = openNewCaseModal;
window.cloneCaseFromNo = cloneCaseFromNo;
window.openQuickNoteModal = openQuickNoteModal;
window.openEditEventModal = openEditEventModal;
window.openAddEventModal = openAddEventModal;
window.exportMasterTableExcel = exportMasterTableExcel;

function showFolderUnlinkedTooltip(el) {
    if (!el) return;
    let tip = document.getElementById('nadr-floating-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'nadr-floating-tooltip';
        document.body.appendChild(tip);
    }
    tip.innerHTML = '⚠️ Folder មិនទាន់បានភ្ជាប់ Link (ចុចដើម្បីភ្ជាប់)';
    const rect = el.getBoundingClientRect();
    const top = Math.max(8, rect.top + (rect.height / 2) - 16);
    const left = Math.min(window.innerWidth - 290, rect.right + 10);
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.classList.add('visible');
}
window.showFolderUnlinkedTooltip = showFolderUnlinkedTooltip;

function hideFolderUnlinkedTooltip() {
    const tip = document.getElementById('nadr-floating-tooltip');
    if (tip) tip.classList.remove('visible');
}
window.hideFolderUnlinkedTooltip = hideFolderUnlinkedTooltip;

function openLinkedCaseFolder(id) {
    const c = (typeof getCaseById === "function") ? getCaseById(id) : (casesData || []).find(item => item.id === id);
    if (!c) return;
    const folderUrl = String(c.folderLink || c.driveLink || '').trim();
    if (!folderUrl) { openCaseFolderLinkInput(id); return; }
    if (window.electronAPI && !/^https?:/i.test(folderUrl)) {
        window.electronAPI.openFolder(folderUrl);
    } else {
        window.open(folderUrl, '_blank');
    }
}
window.openLinkedCaseFolder = openLinkedCaseFolder;

function openCaseFolderLinkInput(id) {
    hideFolderUnlinkedTooltip();
    if (typeof openEditModal === 'function') openEditModal(id);
    if (typeof switchCaseTab === 'function') switchCaseTab('facts');
    setTimeout(() => {
        const input = document.getElementById('intake-drive-link');
        if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
            input.classList.add('folder-link-focus-pulse');
            setTimeout(() => input.classList.remove('folder-link-focus-pulse'), 2200);
        }
    }, 100);
}
window.openCaseFolderLinkInput = openCaseFolderLinkInput;

/**
 * Render Pagination Controls (Backward-compatible stub)
 */
function renderPagination(totalItems, totalPages) {
    const wrapper = document.getElementById('pagination-wrapper');
    if (wrapper) wrapper.innerHTML = '';
}

function changePage(page) {
    currentPage = page;
    renderMasterTable();
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
    return `<span class="badge ${badgeClass}"><i class="${icon}"></i> ${t_val(statusStr)}</span>`;
}

/**
 * Filter & Search Event Listeners
 */
function initFilterAndSearchEvents() {
    const searchEl = document.getElementById('mt-search') || document.getElementById('filter-search');
    const headerSearchEl = document.getElementById('header-search-input');
    const catEl = document.getElementById('mt-filter-cat') || document.getElementById('filter-category');
    const stEl = document.getElementById('mt-filter-status') || document.getElementById('filter-status');
    const provEl = document.getElementById('mt-filter-prov') || document.getElementById('filter-location');
    const hlEl = document.getElementById('mt-filter-highlight');

    let searchDebounceTimer;
    const triggerFilter = () => {
        renderMasterTable();
    };

    const debouncedTriggerFilter = () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            triggerFilter();
        }, 200);
    };

    if (searchEl) searchEl.addEventListener('input', debouncedTriggerFilter);
    if (headerSearchEl) {
        headerSearchEl.addEventListener('input', (e) => {
            const mtSearch = document.getElementById('mt-search');
            if (mtSearch) mtSearch.value = e.target.value;
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
    if (provEl) provEl.addEventListener('change', triggerFilter);
    if (hlEl) hlEl.addEventListener('change', triggerFilter);

    // --- Dashboard Tabs Logic ---
    const dashTabPersonal = document.getElementById('dash-tab-personal');
    const dashTabAssisting = document.getElementById('dash-tab-assisting');
    const dashContentPersonal = document.getElementById('dash-content-personal');
    const dashContentAssisting = document.getElementById('dash-content-assisting');

    if (dashTabPersonal && dashTabAssisting && dashContentPersonal && dashContentAssisting) {
        dashTabPersonal.addEventListener('click', () => {
            // Update Tab Styles (CSS handles the rest via .active)
            dashTabPersonal.classList.add('active');
            dashTabAssisting.classList.remove('active');
            
            // Show/Hide Content
            dashContentPersonal.style.display = 'block';
            dashContentAssisting.style.display = 'none';

            window.currentDashboardTab = 'personal';
            if (typeof updateDashboardSharedSections === 'function') updateDashboardSharedSections();
        });

        dashTabAssisting.addEventListener('click', () => {
            // Update Tab Styles (CSS handles the rest via .active)
            dashTabAssisting.classList.add('active');
            dashTabPersonal.classList.remove('active');
            
            // Show/Hide Content
            dashContentPersonal.style.display = 'none';
            dashContentAssisting.style.display = 'block';

            window.currentDashboardTab = 'assisting';
            if (typeof updateDashboardSharedSections === 'function') updateDashboardSharedSections();
        });
    }
    // -------------------------------
    const refreshBtn = document.getElementById('btn-refresh-cases') || document.getElementById('refresh-btn') || document.getElementById('btn-refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadCases();
            renderAllViews();
            showToast('ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាព!', 'success');
        });
    }

    const btnShareStatsTg = document.getElementById('btn-share-stats-telegram');
    if (btnShareStatsTg && !btnShareStatsTg.dataset.tgBound) {
        btnShareStatsTg.dataset.tgBound = '1';
        btnShareStatsTg.addEventListener('click', () => {
            if (typeof window.shareStatsToTelegram === 'function') {
                window.shareStatsToTelegram();
            }
        });
    }
}

/**
 * Modal Handling (Add / Edit Case Entry Form)
 */
/* ==========================================================================
   NADR CMS PRO - 3-TAB MODAL CONTROLLER & DISPUTE PARTIES HUB (v1.1.82)
   ========================================================================== */

const cambodiaProvinces = [
  ["ភ្នំពេញ", "រាជធានីភ្នំពេញ (Phnom Penh)"],
  ["កណ្តាល", "ខេត្តកណ្តាល (Kandal)"],
  ["កំពង់ចាម", "ខេត្តកំពង់ចាម (Kampong Cham)"],
  ["កំពង់ឆ្នាំង", "ខេត្តកំពង់ឆ្នាំង (Kampong Chhnang)"],
  ["កំពង់ស្ពឺ", "ខេត្តកំពង់ស្ពឺ (Kampong Speu)"],
  ["កំពង់ធំ", "ខេត្តកំពង់ធំ (Kampong Thom)"],
  ["កំពត", "ខេត្តកំពត (Kampot)"],
  ["កែប", "ខេត្តកែប (Kep)"],
  ["កោះកុង", "ខេត្តកោះកុង (Koh Kong)"],
  ["ក្រចេះ", "ខេត្តក្រចេះ (Kratie)"],
  ["តាកែវ", "ខេត្តតាកែវ (Takeo)"],
  ["ត្បូងឃ្មុំ", "ខេត្តត្បូងឃ្មុំ (Tboung Khmum)"],
  ["បន្ទាយមានជ័យ", "ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)"],
  ["បាត់ដំបង", "ខេត្តបាត់ដំបង (Battambang)"],
  ["ប៉ៃលិន", "ខេត្តប៉ៃលិន (Pailin)"],
  ["ពោធិ៍សាត់", "ខេត្តពោធិ៍សាត់ (Pursat)"],
  ["ព្រះវិហារ", "ខេត្តព្រះវិហារ (Preah Vihear)"],
  ["ព្រះសីហនុ", "ខេត្តព្រះសីហនុ (Preah Sihanouk)"],
  ["ព្រៃវែង", "ខេត្តព្រៃវែង (Prey Veng)"],
  ["មណ្ឌលគិរី", "ខេត្តមណ្ឌលគិរី (Mondulkiri)"],
  ["រតនគិរី", "ខេត្តរតនគិរី (Ratanakiri)"],
  ["សៀមរាប", "ខេត្តសៀមរាប (Siem Reap)"],
  ["ស្ទឹងត្រែង", "ខេត្តស្ទឹងត្រែង (Stung Treng)"],
  ["ស្វាយរៀង", "ខេត្តស្វាយរៀង (Svay Rieng)"],
  ["ឧត្តរមានជ័យ", "ខេត្តឧត្តរមានជ័យ (Oddar Meanchey)"]
];

let currentWizardStep = 1;
let currentCaseAssignmentType = 'personal';
let caseIntakeMode = 'fresh';
let isLegacyOpen = false;

// Unified Party Data Arrays
let claimants = [];
let respondents = [];
let thirdParties = [];

/**
 * Switch Wizard Step (Next / Prev)
 */
function navWizardStep(dir) {
  if (dir > 0) {
    if (currentWizardStep === 1) {
      const code = document.getElementById('intake-case-code')?.value?.trim();
      if (!code) {
        if (typeof showToast === 'function') showToast('សូមបញ្ចូលលេខសំណុំរឿង!', 'error');
        document.getElementById('intake-case-code')?.focus();
        return;
      }
    } else if (currentWizardStep === 2) {
      const cName = (claimants[0]?.type === 'company' ? claimants[0]?.comName : claimants[0]?.name) || '';
      const rName = (respondents[0]?.type === 'company' ? respondents[0]?.comName : respondents[0]?.name) || '';
      if (!cName.trim()) {
        if (typeof showToast === 'function') showToast('សូមបញ្ចូលឈ្មោះភាគី «ក» (ដើមចោទ)!', 'error');
        return;
      }
      if (!rName.trim()) {
        if (typeof showToast === 'function') showToast('សូមបញ្ចូលឈ្មោះភាគី «ខ» (ចុងចោទ)!', 'error');
        return;
      }
    }
  }

  currentWizardStep += dir;
  if (currentWizardStep < 1) currentWizardStep = 1;
  if (currentWizardStep > 3) currentWizardStep = 3;
  updateWizardUI();
}
window.navWizardStep = navWizardStep;

/**
 * Switch Tab by Key ('general' | 'parties' | 'facts')
 */
function switchCaseTab(tabKey) {
  if (tabKey === 'general') currentWizardStep = 1;
  else if (tabKey === 'parties') currentWizardStep = 2;
  else if (tabKey === 'facts') currentWizardStep = 3;
  updateWizardUI();
}
window.switchCaseTab = switchCaseTab;

/**
 * Update UI for Wizard Steps & Stepper Tabs (Sleek Executive Highlights)
 */
function updateWizardUI() {
  const tabs = ['general', 'parties', 'facts'];
  tabs.forEach((key, i) => {
    const panel = document.getElementById(`tab-panel-${key}`);
    const wrap = document.getElementById(`step-wrap-${i+1}`);
    const stepNum = i + 1;

    if (panel) {
      if (stepNum === currentWizardStep) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }

    if (wrap) {
      wrap.classList.remove('active', 'completed', 'pending');
      if (stepNum === currentWizardStep) {
        wrap.classList.add('active');
        wrap.style.zIndex = '10';
      } else if (stepNum < currentWizardStep) {
        wrap.classList.add('completed');
        wrap.style.zIndex = String(4 - i);
      } else {
        wrap.classList.add('pending');
        wrap.style.zIndex = String(4 - i);
      }
    }
  });

  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');
  const btnSubmit = document.getElementById('btn-wizard-submit');

  if (btnPrev && btnNext && btnSubmit) {
    if (currentWizardStep === 1) {
      btnPrev.classList.add('hidden');
      btnNext.classList.remove('hidden');
      btnSubmit.classList.add('hidden');
    } else if (currentWizardStep === 2) {
      btnPrev.classList.remove('hidden');
      btnNext.classList.remove('hidden');
      btnSubmit.classList.add('hidden');
    } else if (currentWizardStep === 3) {
      btnPrev.classList.remove('hidden');
      btnNext.classList.add('hidden');
      btnSubmit.classList.remove('hidden');
    }
  }
}
window.updateWizardUI = updateWizardUI;

/**
 * Toggle Assignment Type (Personal vs Assisting)
 */
function setCaseAssignmentType(type) {
  currentCaseAssignmentType = type;
  const btnP = document.getElementById('btn-case-personal');
  const btnA = document.getElementById('btn-case-assisting');
  const boxA = document.getElementById('box-assisting-details');

  if (type === 'personal') {
    if (btnP) btnP.className = 'case-assign-btn active-personal';
    if (btnA) btnA.className = 'case-assign-btn inactive';
    if (boxA) boxA.classList.add('hidden');
  } else {
    if (btnA) btnA.className = 'case-assign-btn active-assisting';
    if (btnP) btnP.className = 'case-assign-btn inactive';
    if (boxA) boxA.classList.remove('hidden');
  }
}
window.setCaseAssignmentType = setCaseAssignmentType;

/**
 * Toggle Legacy Section Accordion
 */
function toggleLegacySection() {
  isLegacyOpen = !isLegacyOpen;
  const box = document.getElementById('legacy-status-box');
  const chevron = document.getElementById('legacy-chevron');
  if (box && chevron) {
    if (isLegacyOpen) {
      box.classList.remove('hidden');
      chevron.style.transform = 'rotate(180deg)';
      caseIntakeMode = 'legacy';
    } else {
      box.classList.add('hidden');
      chevron.style.transform = 'rotate(0deg)';
      caseIntakeMode = 'fresh';
    }
    updateLinkageBadges();
  }
}
window.toggleLegacySection = toggleLegacySection;

/**
 * Helper to update Horizontal Workflow Stage Cards (Step 1, Step 2, Step 3)
 */
function updateWorkflowStageCards(activeStage) {
  [1, 2, 3].forEach(stepNum => {
    const pill = document.getElementById(`pill-step-${stepNum}`);
    if (!pill) return;
    const icon = pill.querySelector('div:first-child');
    const title = pill.querySelector('.font-bold');
    const sub = pill.querySelector('.truncate:last-child');

    if (stepNum === activeStage) {
      if (activeStage === 1) {
        pill.className = 'p-2.5 rounded-xl border-2 border-blue-400 bg-white text-blue-900 shadow-sm flex items-center gap-2.5 transition';
        if (icon) icon.className = 'w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm';
        if (title) title.className = 'font-bold text-xs truncate text-blue-900';
        if (sub) sub.className = 'text-[11px] text-blue-700/80 truncate';
      } else if (activeStage === 2) {
        pill.className = 'p-2.5 rounded-xl border-2 border-amber-400 bg-white text-amber-900 shadow-sm flex items-center gap-2.5 transition';
        if (icon) icon.className = 'w-7 h-7 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm';
        if (title) title.className = 'font-bold text-xs truncate text-amber-900';
        if (sub) sub.className = 'text-[11px] text-amber-700/80 truncate';
      } else if (activeStage === 3) {
        pill.className = 'p-2.5 rounded-xl border-2 border-emerald-400 bg-white text-emerald-900 shadow-sm flex items-center gap-2.5 transition';
        if (icon) icon.className = 'w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm';
        if (title) title.className = 'font-bold text-xs truncate text-emerald-900';
        if (sub) sub.className = 'text-[11px] text-emerald-700/80 truncate';
      }
    } else {
      pill.className = 'p-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 flex items-center gap-2.5 transition';
      if (icon) icon.className = 'w-7 h-7 rounded-lg bg-slate-200 text-slate-600 font-bold flex items-center justify-center flex-shrink-0 text-xs';
      if (title) title.className = 'font-bold text-xs truncate text-slate-600';
      if (sub) sub.className = 'text-[11px] text-slate-400 truncate';
    }
  });
}

/**
 * Phase Select Change Handler
 */
function handlePhaseSelectChange() {
  const phaseSelect = document.getElementById('legacy-phase');
  const phaseBadge = document.getElementById('intake-phase-badge');
  if (!phaseSelect || !phaseBadge) return;

  const pVal = phaseSelect.value;
  if (pVal === 'phase1') {
    phaseBadge.textContent = 'ដំណាក់កាល១ (ត្រៀមរៀបចំ)';
    phaseBadge.className = 'font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs';
    updateWorkflowStageCards(1);
  } else if (pVal === 'phase2') {
    phaseBadge.textContent = 'ដំណាក់កាល២ (កិច្ចសម្រុះសម្រួល)';
    phaseBadge.className = 'font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs';
    updateWorkflowStageCards(2);
  } else if (pVal === 'phase3') {
    phaseBadge.textContent = 'ដំណាក់កាល៣ (ក្រោយប្រជុំ / បិទបញ្ចប់)';
    phaseBadge.className = 'font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs';
    updateWorkflowStageCards(3);
  }
}
window.handlePhaseSelectChange = handlePhaseSelectChange;

/**
 * Update Linkage Badges based on outcome
 */
function updateLinkageBadges() {
  const phaseBadge = document.getElementById('intake-phase-badge');
  const statusBadge = document.getElementById('intake-status-badge');
  if (!phaseBadge || !statusBadge) return;

  if (caseIntakeMode === 'fresh') {
    phaseBadge.textContent = 'ដំណាក់កាល១ (ត្រៀមរៀបចំ)';
    phaseBadge.className = 'font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs';
    statusBadge.textContent = 'Active (កំពុងចាត់ការ)';
    statusBadge.className = 'font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs';
    updateWorkflowStageCards(1);
  } else {
    const out = document.getElementById('legacy-outcome')?.value || 'mediating';
    const phaseSelect = document.getElementById('legacy-phase');
    if (out === 'settled') {
      if (phaseSelect) phaseSelect.value = 'phase3';
      phaseBadge.textContent = 'ដំណាក់កាល៣ (ក្រោយប្រជុំ)';
      phaseBadge.className = 'font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs';
      statusBadge.textContent = 'Settle (សម្រុះសម្រួលជោគជ័យ)';
      statusBadge.className = 'font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs';
      updateWorkflowStageCards(3);
    } else if (out.startsWith('unsuccessful')) {
      if (phaseSelect) phaseSelect.value = 'phase3';
      phaseBadge.textContent = 'ដំណាក់កាល៣ (ក្រោយប្រជុំ)';
      phaseBadge.className = 'font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-300 shadow-2xs';
      statusBadge.textContent = 'Closed (មិនជោគជ័យ)';
      statusBadge.className = 'font-bold text-rose-700 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs';
      updateWorkflowStageCards(3);
    } else if (out === 'shelved') {
      if (phaseSelect) phaseSelect.value = 'phase2';
      phaseBadge.textContent = 'ដំណាក់កាល២ (កិច្ចសម្រុះសម្រួល)';
      phaseBadge.className = 'font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs';
      statusBadge.textContent = 'Pending (តម្កល់)';
      statusBadge.className = 'font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs';
      updateWorkflowStageCards(2);
    } else if (out === 'mediating') {
      if (phaseSelect) phaseSelect.value = 'phase2';
      phaseBadge.textContent = 'ដំណាក់កាល២ (កិច្ចសម្រុះសម្រួល)';
      phaseBadge.className = 'font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-300 shadow-2xs';
      statusBadge.textContent = 'Active (កំពុងសម្រុះសម្រួល)';
      statusBadge.className = 'font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs';
      updateWorkflowStageCards(2);
    }
  }
}
window.updateLinkageBadges = updateLinkageBadges;

/**
 * Populate Clone Case Dropdown with available cases
 */
function populateCloneCaseDropdown() {
  const cloneSelect = document.getElementById('select-clone-case');
  if (!cloneSelect) return;

  let optionsHTML = '<option value="">-- ចម្លងទិន្នន័យ (Clone)... --</option>';
  if (Array.isArray(casesData)) {
    casesData.forEach(c => {
      const code = c.caseNumber || 'គ្មានលេខ';
      const pA = c.partyA_name || '';
      const pB = c.partyB_name || '';
      const rawParties = pA ? (pB ? `${pA} vs ${pB}` : pA) : (pB || 'គ្មានភាគី');
      const parties = rawParties.length > 22 ? rawParties.substring(0, 20) + '…' : rawParties;
      optionsHTML += `<option value="${c.id}">#${code} (${parties})</option>`;
    });
  }
  cloneSelect.innerHTML = optionsHTML;
}
window.populateCloneCaseDropdown = populateCloneCaseDropdown;

/**
 * Execute Clone Case Direct
 */
function executeCloneCaseDirect(val) {
  if (!val) return;
  const c = typeof getCaseById === 'function' ? getCaseById(val) : (casesData || []).find(item => item.id === val);
  if (!c) return;

  const codeEl = document.getElementById('intake-case-code');
  if (codeEl) {
    codeEl.value = (c.caseNumber ? c.caseNumber + '-ចម្លង' : generateNextCaseNumber());
  }

  if (document.getElementById('intake-dispute-type')) {
    document.getElementById('intake-dispute-type').value = c.category || 'វិវាទដីធ្លី';
  }
  if (document.getElementById('intake-amount')) {
    document.getElementById('intake-amount').value = c.claimAmount || '';
  }
  if (document.getElementById('intake-currency')) {
    document.getElementById('intake-currency').value = c.claimCurrency || '$ USD';
  }
  if (document.getElementById('intake-loc-house')) {
    document.getElementById('intake-loc-house').value = c.locationHouse || '';
  }
  if (document.getElementById('intake-loc-commune')) {
    document.getElementById('intake-loc-commune').value = c.locationCommune || '';
  }
  if (document.getElementById('intake-loc-province')) {
    document.getElementById('intake-loc-province').value = c.locationProvince || c.disputeLocation || 'ភ្នំពេញ';
  }
  if (document.getElementById('intake-facts')) {
    document.getElementById('intake-facts').value = c.facts || c.summary || '';
  }
  if (document.getElementById('intake-claims')) {
    document.getElementById('intake-claims').value = c.claims || c.claimsRequests || '';
  }
  if (document.getElementById('intake-drive-link')) {
    document.getElementById('intake-drive-link').value = c.driveLink || c.folderLink || '';
  }

  setCaseAssignmentType(c.caseType === 'assisting' ? 'assisting' : 'personal');
  if (c.caseType === 'assisting' && document.getElementById('intake-lead-officer')) {
    document.getElementById('intake-lead-officer').value = c.leadOfficer || '';
  }

  // Populate parties
  if (Array.isArray(c.claimants) && c.claimants.length > 0) {
    claimants = JSON.parse(JSON.stringify(c.claimants));
  } else {
    claimants = [{
      id: 1, type: 'individual', name: c.partyA_name || '', gender: c.partyA_gender || 'ប្រុស',
      dob: '', idNo: c.partyA_idNo || '', idDate: '', phone: c.partyA_phone || '',
      address: c.partyA_address || '', province: c.partyA_location || 'ភ្នំពេញ',
      comName: '', comRegNo: '', comAddress: '', comPhone: '',
      hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
    }];
  }

  if (Array.isArray(c.respondents) && c.respondents.length > 0) {
    respondents = JSON.parse(JSON.stringify(c.respondents));
  } else {
    respondents = [{
      id: 1, type: 'individual', name: c.partyB_name || '', gender: c.partyB_gender || 'ប្រុស',
      dob: '', idNo: c.partyB_idNo || '', idDate: '', phone: c.partyB_phone || '',
      address: c.partyB_address || '', province: c.partyB_location || 'កណ្តាល',
      comName: '', comRegNo: '', comAddress: '', comPhone: '',
      hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
    }];
  }

  if (Array.isArray(c.thirdParties) && c.thirdParties.length > 0) {
    thirdParties = JSON.parse(JSON.stringify(c.thirdParties));
  } else {
    thirdParties = [];
  }

  renderAllPartyCards();
  switchCaseTab('general');
  if (typeof showToast === 'function') {
    showToast(`បានចម្លងទិន្នន័យពីសំណុំរឿង #${c.caseNumber} រួចរាល់!`, 'success');
  }
  document.getElementById('select-clone-case').value = '';
}
window.executeCloneCaseDirect = executeCloneCaseDirect;

/**
 * Render All Party Cards (Claimants, Respondents, Third Parties)
 */
function renderAllPartyCards() {
  renderPartyGroup('claimant', claimants, document.getElementById('container-claimants'));
  renderPartyGroup('respondent', respondents, document.getElementById('container-respondents'));
  renderThirdPartyGroup();
  updatePartyBadgeCounts();
}
window.renderAllPartyCards = renderAllPartyCards;

/**
 * Update Party Badges
 */
function updatePartyBadgeCounts() {
  const c = claimants.length;
  const r = respondents.length;
  const t = thirdParties.length;
  const badgeK = document.getElementById('count-badge-k');
  const badgeKh = document.getElementById('count-badge-kh');
  const badgeKo = document.getElementById('count-badge-ko');
  const badgeTotal = document.getElementById('badge-total-parties');

  if (badgeK) badgeK.textContent = `ភាគី ក: ${c}`;
  if (badgeKh) badgeKh.textContent = `ភាគី ខ: ${r}`;
  if (badgeKo) badgeKo.textContent = `ភាគី គ: ${t}`;
  if (badgeTotal) badgeTotal.textContent = `${c + r + t} ភាគី`;
}
window.updatePartyBadgeCounts = updatePartyBadgeCounts;

/**
 * Add Party Card
 */
function addPartyCard(role) {
  const list = (role === 'claimant' ? claimants : (role === 'respondent' ? respondents : thirdParties));
  const newId = list.length + 1;
  const item = {
    id: newId,
    type: 'individual',
    name: '',
    gender: 'ប្រុស',
    dob: '',
    idNo: '',
    idDate: '',
    phone: '',
    address: '',
    province: 'ភ្នំពេញ',
    comName: '',
    comRegNo: '',
    comAddress: '',
    comPhone: '',
    hasRep: false,
    repRole: 'មេធាវី',
    repName: '',
    repPhone: '',
    repId: '',
    repDocDate: ''
  };

  if (role === 'claimant') claimants.push(item);
  else if (role === 'respondent') respondents.push(item);
  else thirdParties.push({ ...item, thirdPartyRole: 'អ្នកធានា (Guarantor)' });

  renderAllPartyCards();
}
window.addPartyCard = addPartyCard;

/**
 * Remove Party Card
 */
function removePartyCard(role, index) {
  if (role === 'claimant') {
    if (claimants.length <= 1) return;
    claimants.splice(index, 1);
  } else if (role === 'respondent') {
    if (respondents.length <= 1) return;
    respondents.splice(index, 1);
  } else {
    thirdParties.splice(index, 1);
  }
  renderAllPartyCards();
}
window.removePartyCard = removePartyCard;

/**
 * Toggle Party Type (individual vs company)
 */
function togglePartyType(role, index, type) {
  const list = role === 'claimant' ? claimants : (role === 'respondent' ? respondents : thirdParties);
  if (list[index]) {
    list[index].type = type;
    renderAllPartyCards();
  }
}
window.togglePartyType = togglePartyType;

/**
 * Toggle Legal Representative
 */
function togglePartyRep(role, index) {
  const list = role === 'claimant' ? claimants : (role === 'respondent' ? respondents : thirdParties);
  if (list[index]) {
    list[index].hasRep = !list[index].hasRep;
    renderAllPartyCards();
  }
}
window.togglePartyRep = togglePartyRep;

/**
 * Update Party Value in memory
 */
function updatePartyValue(role, index, field, value) {
  const list = role === 'claimant' ? claimants : (role === 'respondent' ? respondents : thirdParties);
  if (list[index]) {
    list[index][field] = value;
  }
}
window.updatePartyValue = updatePartyValue;

/**
 * Render Party Group (Claimants / Respondents)
 */
function renderPartyGroup(role, list, container) {
  if (!container) return;
  container.innerHTML = '';
  const prefix = role === 'claimant' ? 'ក' : 'ខ';
  const color = role === 'claimant' ? 'emerald' : 'rose';

  list.forEach((party, idx) => {
    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border border-${color}-200 bg-white shadow-sm space-y-3`;

    let provOptions = cambodiaProvinces.map(p => 
      `<option value="${p[0]}" ${party.province === p[0] ? 'selected' : ''}>${p[1]}</option>`
    ).join('');

    const deleteBtn = list.length > 1 ? `
      <button type="button" onclick="removePartyCard('${role}', ${idx})" class="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition">
        ✕ លុបភាគី ${prefix}.${idx + 1}
      </button>
    ` : '';

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-${color}-100 text-${color}-800 font-bold text-xs flex items-center justify-center">
            ${prefix}.${idx + 1}
          </span>
          <span class="font-bold text-slate-800 text-xs">
            ${role === 'claimant' ? (idx === 0 ? 'ដើមចោទចម្បង / ភាគីស្នើសុំទី១' : `សហដើមចោទ ទី ${idx + 1}`) : (idx === 0 ? 'ចុងចោទចម្បង / កូនបំណុល' : `សហចុងចោទ ទី ${idx + 1}`)}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
            <button type="button" onclick="togglePartyType('${role}', ${idx}, 'individual')" class="px-2.5 py-1 rounded-md ${party.type === 'individual' ? `bg-${color}-600 text-white font-bold` : 'text-slate-600'}">
              👤 រូបវន្តបុគ្គល
            </button>
            <button type="button" onclick="togglePartyType('${role}', ${idx}, 'company')" class="px-2.5 py-1 rounded-md ${party.type === 'company' ? `bg-${color}-600 text-white font-bold` : 'text-slate-600'}">
              🏢 នីតិបុគ្គល
            </button>
          </div>
          ${deleteBtn}
        </div>
      </div>

      ${party.type === 'individual' ? `
        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-800 mb-1">គោត្តនាម និងនាម (ឈ្មោះខ្មែរ) *</label>
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'name', this.value)" value="${party.name || ''}" placeholder="ឧ. សេង វិបុល" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-semibold">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">ភេទ</label>
              <select onchange="updatePartyValue('${role}', ${idx}, 'gender', this.value)" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs">
                <option value="ប្រុស" ${party.gender === 'ប្រុស' ? 'selected' : ''}>ប្រុស (Male)</option>
                <option value="ស្រី" ${party.gender === 'ស្រី' ? 'selected' : ''}>ស្រី (Female)</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">ថ្ងៃខែឆ្នាំកំណើត (DOB)</label>
              <input type="date" oninput="updatePartyValue('${role}', ${idx}, 'dob', this.value)" value="${party.dob || ''}" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs">
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">លេខអត្តសញ្ញាណប័ណ្ណ (ID Card)</label>
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'idNo', this.value)" value="${party.idNo || ''}" placeholder="ឧ. ០១០៥៨៤៧២៩" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">ថ្ងៃចេញអត្តសញ្ញាណប័ណ្ណ</label>
              <input type="date" oninput="updatePartyValue('${role}', ${idx}, 'idDate', this.value)" value="${party.idDate || ''}" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs">
            </div>
            <div>
              <label class="block font-bold text-slate-800 mb-1">លេខទូរស័ព្ទទំនាក់ទំនង *</label>
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'phone', this.value)" value="${party.phone || ''}" placeholder="ឧ. 012 889 900" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono">
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">អាសយដ្ឋានបច្ចុប្បន្ន (សម្រាប់ផ្ញើលិខិត) *</label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'address', this.value)" value="${party.address || ''}" placeholder="ផ្ទះលេខ, ផ្លូវ, ភូមិ, ឃុំ/សង្កាត់, ក្រុង/ស្រុក/ខណ្ឌ" class="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs">
              <select onchange="updatePartyValue('${role}', ${idx}, 'province', this.value)" class="px-3 py-2 rounded-lg border border-blue-300 bg-white text-xs font-semibold text-blue-900">
                ${provOptions}
              </select>
            </div>
          </div>
        </div>
      ` : `
        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-800 mb-1">ឈ្មោះស្ថាប័ន / ក្រុមហ៊ុន / ធនាគារ *</label>
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'comName', this.value)" value="${party.comName || ''}" placeholder="ឧ. ធនាគារ អេស៊ីលីដា ភីអិលស៊ី" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">លេខចុះបញ្ជីពាណិជ្ជកម្ម</label>
              <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'comRegNo', this.value)" value="${party.comRegNo || ''}" placeholder="ឧ. 00012845 / 2018" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono">
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'comAddress', this.value)" value="${party.comAddress || ''}" placeholder="អាសយដ្ឋានទីស្នាក់ការកណ្តាល" class="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs">
            <select onchange="updatePartyValue('${role}', ${idx}, 'province', this.value)" class="px-3 py-2 rounded-lg border border-blue-300 bg-white text-xs font-semibold text-blue-900">
              ${provOptions}
            </select>
          </div>
        </div>
      `}

      <div class="pt-2 border-t border-slate-100">
        <label class="flex items-center gap-2 cursor-pointer text-xs">
          <input type="checkbox" onchange="togglePartyRep('${role}', ${idx})" ${party.hasRep ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded">
          <span class="font-bold text-slate-700">☑ មានអ្នកតំណាងស្របច្បាប់ / មេធាវី សម្រាប់ភាគី ${prefix}.${idx + 1}</span>
        </label>

        ${party.hasRep ? `
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 space-y-2.5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">តួនាទីអ្នកតំណាង</label>
                <select onchange="updatePartyValue('${role}', ${idx}, 'repRole', this.value)" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs">
                  <option value="មេធាវី" ${party.repRole === 'មេធាវី' ? 'selected' : ''}>មេធាវីតំណាងដោយអាណត្តិ</option>
                  <option value="អ្នកតំណាងស្របច្បាប់" ${party.repRole === 'អ្នកតំណាងស្របច្បាប់' ? 'selected' : ''}>អ្នកតំណាងស្របច្បាប់</option>
                  <option value="អាណាព្យាបាល" ${party.repRole === 'អាណាព្យាបាល' ? 'selected' : ''}>អាណាព្យាបាល</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">ឈ្មោះអ្នកតំណាង *</label>
                <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'repName', this.value)" value="${party.repName || ''}" placeholder="ឧ. មេធាវី ឈាន សុខុម" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">លេខទូរស័ព្ទ *</label>
                <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'repPhone', this.value)" value="${party.repPhone || ''}" placeholder="ឧ. 012 334 455" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">លេខអត្តសញ្ញាណប័ណ្ណ / ប័ណ្ណមេធាវី</label>
                <input type="text" oninput="updatePartyValue('${role}', ${idx}, 'repId', this.value)" value="${party.repId || ''}" placeholder="ឧ. ប័ណ្ណមេធាវីលេខ ៨៤៥" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs">
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">យោងលិខិតប្រគល់សិទ្ធិចុះថ្ងៃទី</label>
                <input type="date" oninput="updatePartyValue('${role}', ${idx}, 'repDocDate', this.value)" value="${party.repDocDate || ''}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs">
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Render Third Party Group
 */
function renderThirdPartyGroup() {
  const container = document.getElementById('container-thirdparties');
  if (!container) return;
  container.innerHTML = '';

  if (thirdParties.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 text-center text-purple-800">
        <p class="text-xs font-semibold mb-1">មិនទាន់មាន ភាគី «គ» នៅក្នុងសំណុំរឿងនេះទេ</p>
        <p class="text-[11px] text-purple-600 mb-2">ប្រសិនបើសំណុំរឿងមានអ្នកធានា ម្ចាស់ដីជាប់ព្រំ ឬភាគីទី៣ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបន្ថែម</p>
        <button type="button" onclick="addPartyCard('thirdparty')" class="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs shadow-sm hover:bg-purple-700 transition">
          + បន្ថែម ភាគី «គ» ឥឡូវនេះ
        </button>
      </div>
    `;
    return;
  }

  thirdParties.forEach((party, idx) => {
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl border border-purple-200 bg-white shadow-sm space-y-3";

    let provOptions = cambodiaProvinces.map(p => 
      `<option value="${p[0]}" ${party.province === p[0] ? 'selected' : ''}>${p[1]}</option>`
    ).join('');

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
            គ.${idx + 1}
          </span>
          <span class="font-bold text-purple-950 text-xs">ភាគីពាក់ព័ន្ធទី ${idx + 1} (តតិយជន)</span>
          <select onchange="updatePartyValue('thirdparty', ${idx}, 'thirdPartyRole', this.value)" class="text-[11px] px-2 py-0.5 rounded border border-purple-300 bg-purple-50 font-semibold text-purple-900">
            <option value="អ្នកធានា (Guarantor)" ${party.thirdPartyRole === 'អ្នកធានា (Guarantor)' ? 'selected' : ''}>អ្នកធានា (Guarantor)</option>
            <option value="ម្ចាស់ដីជាប់ព្រំ (Adjacent Landowner)" ${party.thirdPartyRole === 'ម្ចាស់ដីជាប់ព្រំ (Adjacent Landowner)' ? 'selected' : ''}>ម្ចាស់ដីជាប់ព្រំ (Adjacent Landowner)</option>
            <option value="អាជ្ញាធរមូលដ្ឋាន (Local Authority)" ${party.thirdPartyRole === 'អាជ្ញាធរមូលដ្ឋាន (Local Authority)' ? 'selected' : ''}>អាជ្ញាធរមូលដ្ឋាន (Local Authority)</option>
            <option value="សាក្សី / ភាគីបន្ទាប់បន្សំ" ${party.thirdPartyRole === 'សាក្សី / ភាគីបន្ទាប់បន្សំ' ? 'selected' : ''}>សាក្សី / ភាគីបន្ទាប់បន្សំ</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
            <button type="button" onclick="togglePartyType('thirdparty', ${idx}, 'individual')" class="px-2.5 py-1 rounded-md ${party.type === 'individual' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600'}">
              👤 រូបវន្តបុគ្គល
            </button>
            <button type="button" onclick="togglePartyType('thirdparty', ${idx}, 'company')" class="px-2.5 py-1 rounded-md ${party.type === 'company' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600'}">
              🏢 នីតិបុគ្គល
            </button>
          </div>
          <button type="button" onclick="removePartyCard('thirdparty', ${idx})" class="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition">
            ✕ លុប គ.${idx + 1}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block font-bold text-slate-800 mb-1">ឈ្មោះ ភាគី «គ» *</label>
          <input type="text" oninput="updatePartyValue('thirdparty', ${idx}, 'name', this.value)" value="${party.name || ''}" placeholder="ឧ. លោក ហ៊ន សុជាតិ (អ្នកធានា)" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">លេខទូរស័ព្ទ</label>
          <input type="text" oninput="updatePartyValue('thirdparty', ${idx}, 'phone', this.value)" value="${party.phone || ''}" placeholder="ឧ. 011 223 344" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">លេខអត្តសញ្ញាណប័ណ្ណ</label>
          <input type="text" oninput="updatePartyValue('thirdparty', ${idx}, 'idNo', this.value)" value="${party.idNo || ''}" placeholder="ឧ. ០៣០៥៩៨១២៤" class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono">
        </div>
      </div>

      <div>
        <label class="block font-semibold text-slate-700 mb-1">អាសយដ្ឋានបច្ចុប្បន្ន</label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="text" oninput="updatePartyValue('thirdparty', ${idx}, 'address', this.value)" value="${party.address || ''}" placeholder="ផ្ទះលេខ, ភូមិ, ឃុំ/សង្កាត់, ស្រុក/ខណ្ឌ" class="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs">
          <select onchange="updatePartyValue('thirdparty', ${idx}, 'province', this.value)" class="px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-semibold text-purple-900">
            ${provOptions}
          </select>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Open Add Modal for New Case
 */
function openAddModal() {
  const form = document.getElementById('case-form') || document.getElementById('form-new-case');
  if (form) form.reset();

  const caseIdInput = document.getElementById('case-id');
  if (caseIdInput) caseIdInput.value = '';

  const titleEl = document.getElementById('modal-title');
  if (titleEl) {
    titleEl.innerHTML = `<span>បញ្ចូលព័ត៌មានសំណុំរឿងគោលថ្មី (Master Case Registration)</span>`;
  
  // Set next list number in intake-list-no
  const nextListNum = (typeof casesData !== 'undefined' && casesData.length > 0) 
    ? Math.max(...casesData.map(c => parseInt(c.originalListNo) || 0)) + 1 
    : 1;
  const listNoInput = document.getElementById('intake-list-no');
  if (listNoInput) listNoInput.value = nextListNum;
  const hiddenListNoInput = document.getElementById('case-list-no');
  if (hiddenListNoInput) hiddenListNoInput.value = nextListNum;
  }

  // Next Case Number
  const nextCode = typeof generateNextCaseNumber === 'function' ? generateNextCaseNumber() : `NADR-${new Date().getFullYear()}-001`;
  const codeEl = document.getElementById('intake-case-code');
  if (codeEl) codeEl.value = nextCode;

  // Dates to today
  const today = new Date().toISOString().split('T')[0];
  const filingEl = document.getElementById('intake-filing-date');
  const assignedEl = document.getElementById('intake-assigned-date');
  const receivedEl = document.getElementById('intake-received-date');
  if (filingEl) filingEl.value = today;
  if (assignedEl) assignedEl.value = today;
  if (receivedEl) receivedEl.value = today;

  // Assignment & Legacy defaults
  setCaseAssignmentType('personal');
  caseIntakeMode = 'fresh';
  isLegacyOpen = false;
  const legacyBox = document.getElementById('legacy-status-box');
  if (legacyBox) legacyBox.classList.add('hidden');
  const legacyChevron = document.getElementById('legacy-chevron');
  if (legacyChevron) legacyChevron.style.transform = 'rotate(0deg)';
  
  const legacyPhase = document.getElementById('legacy-phase');
  if (legacyPhase) legacyPhase.value = 'phase1';
  const legacyOutcome = document.getElementById('legacy-outcome');
  if (legacyOutcome) legacyOutcome.value = 'mediating';
  updateLinkageBadges();

  // Reset Parties
  claimants = [{
    id: 1, type: 'individual', name: '', gender: 'ប្រុស', dob: '', idNo: '', idDate: '',
    phone: '', address: '', province: 'ភ្នំពេញ', comName: '', comRegNo: '', comAddress: '',
    comPhone: '', hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
  }];
  respondents = [{
    id: 1, type: 'individual', name: '', gender: 'ប្រុស', dob: '', idNo: '', idDate: '',
    phone: '', address: '', province: 'កណ្តាល', comName: '', comRegNo: '', comAddress: '',
    comPhone: '', hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
  }];
  thirdParties = [];

  renderAllPartyCards();
  switchCaseTab('general');
  populateCloneCaseDropdown();

  const claimsInput = document.getElementById('intake-claims');
  if (claimsInput) claimsInput.value = '';
  const submitLabel = document.querySelector('#btn-wizard-submit .btn-submit-label');
  if (submitLabel) submitLabel.textContent = 'បង្កើតសំណុំរឿង';

  const modal = document.getElementById('case-modal');
  if (modal) modal.classList.add('open');
}
window.openAddModal = openAddModal;

/**
 * Open Edit Modal with existing case data
 */
function openEditModal(id) {
  const c = typeof getCaseById === 'function' ? getCaseById(id) : (casesData || []).find(item => item.id === id);
  if (!c) return;

  const modal = document.getElementById('case-modal');
  const titleEl = document.getElementById('modal-title');
  if (titleEl) {
    titleEl.innerHTML = `<span>កែសម្រួលព័ត៌មានសំណុំរឿង៖ <strong class="text-amber-300 font-mono">${c.caseNumber}</strong></span>`;
  
  // Set current list number in intake-list-no
  const editListNoInput = document.getElementById('intake-list-no');
  if (editListNoInput) editListNoInput.value = c.originalListNo || '';
  const editHiddenListNoInput = document.getElementById('case-list-no');
  if (editHiddenListNoInput) editHiddenListNoInput.value = c.originalListNo || '';
  }

  const caseIdInput = document.getElementById('case-id');
  if (caseIdInput) caseIdInput.value = c.id;

  const codeEl = document.getElementById('intake-case-code');
  if (codeEl) codeEl.value = c.caseNumber || '';

  // Dates
  const filingEl = document.getElementById('intake-filing-date');
  const assignedEl = document.getElementById('intake-assigned-date');
  const receivedEl = document.getElementById('intake-received-date');
  if (filingEl) filingEl.value = c.filingDate || c.dateReceived || '';
  if (assignedEl) assignedEl.value = c.assignedDate || c.dateReceived || '';
  if (receivedEl) receivedEl.value = c.receivedDate || c.dateReceived || '';

  // Category, amount, currency
  if (document.getElementById('intake-dispute-type')) {
    document.getElementById('intake-dispute-type').value = c.category || 'វិវាទដីធ្លី';
  }
  if (document.getElementById('intake-amount')) {
    document.getElementById('intake-amount').value = c.claimAmount || '';
  }
  if (document.getElementById('intake-currency')) {
    document.getElementById('intake-currency').value = c.claimCurrency || '$ USD';
  }

  // Location
  if (document.getElementById('intake-loc-house')) {
    document.getElementById('intake-loc-house').value = c.locationHouse || '';
  }
  if (document.getElementById('intake-loc-commune')) {
    document.getElementById('intake-loc-commune').value = c.locationCommune || '';
  }
  if (document.getElementById('intake-loc-province')) {
    document.getElementById('intake-loc-province').value = c.locationProvince || c.disputeLocation || 'ភ្នំពេញ';
  }

  // Facts, claims & link
  if (document.getElementById('intake-facts')) {
    document.getElementById('intake-facts').value = c.facts || c.summary || '';
  }
  if (document.getElementById('intake-claims')) {
    document.getElementById('intake-claims').value = c.claims || c.claimsRequests || '';
  }
  if (document.getElementById('intake-drive-link')) {
    document.getElementById('intake-drive-link').value = c.driveLink || c.folderLink || '';
  }

  // Assignment type
  setCaseAssignmentType(c.caseType === 'assisting' ? 'assisting' : 'personal');
  if (c.caseType === 'assisting' && document.getElementById('intake-lead-officer')) {
    document.getElementById('intake-lead-officer').value = c.leadOfficer || '';
  }

  // Legacy Status & Outcome Mapping
  caseIntakeMode = 'legacy';
  const legacyOutcome = document.getElementById('legacy-outcome');
  if (legacyOutcome) {
    if (c.legacyOutcome) {
      legacyOutcome.value = c.legacyOutcome;
    } else {
      const s = c.status || '';
      const r = c.remarks || '';
      if (s.startsWith('Settle')) {
        legacyOutcome.value = 'settled';
      } else if (s.startsWith('Close') || s.startsWith('No Settle')) {
        if (r.includes('ដកពាក្យ')) legacyOutcome.value = 'unsuccessful_withdrawn';
        else if (r.includes('មិនចូលរួម')) legacyOutcome.value = 'unsuccessful_no_show';
        else legacyOutcome.value = 'unsuccessful_no_agreement';
      } else if (s.startsWith('Pending')) {
        legacyOutcome.value = 'shelved';
      } else {
        legacyOutcome.value = 'mediating';
      }
    }
  }

  const legacyPhase = document.getElementById('legacy-phase');
  if (legacyPhase) {
    if (c.legacyPhase) legacyPhase.value = c.legacyPhase;
    else if ((c.status || '').startsWith('Settle') || (c.status || '').startsWith('Close')) legacyPhase.value = 'phase3';
    else legacyPhase.value = 'phase2';
  }

  updateLinkageBadges();

  // Populate Claimants
  if (Array.isArray(c.claimants) && c.claimants.length > 0) {
    claimants = JSON.parse(JSON.stringify(c.claimants));
  } else {
    claimants = [{
      id: 1,
      type: 'individual',
      name: c.partyA_name || '',
      gender: c.partyA_gender || 'ប្រុស',
      dob: c.partyA_dob || '',
      idNo: c.partyA_idNo || '',
      idDate: '',
      phone: c.partyA_phone || '',
      address: c.partyA_address || '',
      province: c.partyA_location || c.disputeLocation || 'ភ្នំពេញ',
      comName: '', comRegNo: '', comAddress: '', comPhone: '',
      hasRep: !!c.partyA_repName,
      repRole: c.partyA_repRole || 'មេធាវី',
      repName: c.partyA_repName || '',
      repPhone: c.partyA_repPhone || '',
      repId: '', repDocDate: ''
    }];
  }

  // Populate Respondents
  if (Array.isArray(c.respondents) && c.respondents.length > 0) {
    respondents = JSON.parse(JSON.stringify(c.respondents));
  } else {
    respondents = [{
      id: 1,
      type: 'individual',
      name: c.partyB_name || '',
      gender: c.partyB_gender || 'ប្រុស',
      dob: c.partyB_dob || '',
      idNo: c.partyB_idNo || '',
      idDate: '',
      phone: c.partyB_phone || '',
      address: c.partyB_address || '',
      province: c.partyB_location || c.disputeLocation || 'កណ្តាល',
      comName: '', comRegNo: '', comAddress: '', comPhone: '',
      hasRep: !!c.partyB_repName,
      repRole: c.partyB_repRole || 'មេធាវី',
      repName: c.partyB_repName || '',
      repPhone: c.partyB_repPhone || '',
      repId: '', repDocDate: ''
    }];
  }

  // Populate Third Parties
  if (Array.isArray(c.thirdParties) && c.thirdParties.length > 0) {
    thirdParties = JSON.parse(JSON.stringify(c.thirdParties));
  } else if (c.partyC_name) {
    thirdParties = [{
      id: 1,
      type: 'individual',
      name: c.partyC_name || '',
      gender: c.partyC_gender || 'ប្រុស',
      dob: '', idNo: '', idDate: '',
      phone: c.partyC_phone || '',
      address: c.partyC_address || '',
      province: c.partyC_location || 'ភ្នំពេញ',
      thirdPartyRole: c.partyC_role || 'អ្នកធានា (Guarantor)',
      comName: '', comRegNo: '', comAddress: '', comPhone: '',
      hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
    }];
  } else {
    thirdParties = [];
  }

  const submitLabel = document.querySelector('#btn-wizard-submit .btn-submit-label');
  if (submitLabel) submitLabel.textContent = 'រក្សាទុកការកែសម្រួល';

  renderAllPartyCards();
  switchCaseTab('general');
  populateCloneCaseDropdown();

  if (modal) modal.classList.add('open');
}
window.openEditModal = openEditModal;

/**
 * Close Modal Confirmation
 */
function closeCaseModal() {
  const modal = document.getElementById('case-modal');
  if (!modal) return;
  const caseNum = document.getElementById('intake-case-code')?.value?.trim();
  const facts = document.getElementById('intake-facts')?.value?.trim();
  const claims = document.getElementById('intake-claims')?.value?.trim();
  const hasClaimant = claimants.some(c => (c.name || c.comName || '').trim().length > 0);
  const hasRespondent = respondents.some(r => (r.name || r.comName || '').trim().length > 0);

  if (hasClaimant || hasRespondent || facts || claims) {
    if (typeof customConfirm === 'function') {
      customConfirm("បញ្ជាក់ការបោះបង់", "លោកអ្នកកំពុងបញ្ចូលទិន្នន័យ តើអ្នកពិតជាចង់បោះបង់ ឬចាកចេញពីផ្ទាំងនេះមែនទេ? ទិន្នន័យដែលបានវាយបញ្ចូលនឹងមិនត្រូវបានរក្សាទុកឡើយ!", () => {
        modal.classList.remove('open');
      }, null, 'បោះបង់ការបញ្ចូល', 'បន្តកែសម្រួល');
    } else {
      if (confirm("លោកអ្នកកំពុងបញ្ចូលទិន្នន័យ តើអ្នកពិតជាចង់បោះបង់ ឬចាកចេញពីផ្ទាំងនេះមែនទេ?")) {
        modal.classList.remove('open');
      }
    }
  } else {
    modal.classList.remove('open');
  }
}
window.closeCaseModal = closeCaseModal;

/**
 * Handle Case Form Submission
 */
function handleCaseSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const caseCodeEl = document.getElementById('intake-case-code');
  const caseNumber = caseCodeEl ? caseCodeEl.value.trim() : '';
  if (!caseNumber) {
    if (typeof showToast === 'function') showToast('សូមបញ្ចូលលេខសំណុំរឿង!', 'error');
    switchCaseTab('general');
    if (caseCodeEl) caseCodeEl.focus();
    return;
  }

  const claimantPrimary = claimants[0] || {};
  const cName = (claimantPrimary.type === 'company' ? claimantPrimary.comName : claimantPrimary.name) || '';
  if (!cName.trim()) {
    if (typeof showToast === 'function') showToast('សូមបញ្ចូលឈ្មោះភាគី «ក» (ដើមចោទ)!', 'error');
    switchCaseTab('parties');
    return;
  }

  const respondentPrimary = respondents[0] || {};
  const rName = (respondentPrimary.type === 'company' ? respondentPrimary.comName : respondentPrimary.name) || '';
  if (!rName.trim()) {
    if (typeof showToast === 'function') showToast('សូមបញ្ចូលឈ្មោះភាគី «ខ» (ចុងចោទ)!', 'error');
    switchCaseTab('parties');
    return;
  }

  const editId = document.getElementById('case-id')?.value;
  const filingDate = document.getElementById('intake-filing-date')?.value || new Date().toISOString().split('T')[0];
  const assignedDate = document.getElementById('intake-assigned-date')?.value || filingDate;
  const receivedDate = document.getElementById('intake-received-date')?.value || filingDate;
  const category = document.getElementById('intake-dispute-type')?.value || 'វិវាទដីធ្លី';
  const claimAmount = document.getElementById('intake-amount')?.value || '';
  const claimCurrency = document.getElementById('intake-currency')?.value || '$ USD';
  const locationHouse = document.getElementById('intake-loc-house')?.value || '';
  const locationCommune = document.getElementById('intake-loc-commune')?.value || '';
  const locationProvince = document.getElementById('intake-loc-province')?.value || 'ភ្នំពេញ';
  const disputeLocation = locationProvince;
  const leadOfficer = currentCaseAssignmentType === 'assisting' ? (document.getElementById('intake-lead-officer')?.value || '') : '';
  const legacyPhase = document.getElementById('legacy-phase')?.value || 'phase1';
  const legacyOutcome = document.getElementById('legacy-outcome')?.value || 'mediating';
  const facts = document.getElementById('intake-facts')?.value || '';
  const claims = document.getElementById('intake-claims')?.value || '';
  const driveLink = document.getElementById('intake-drive-link')?.value || '';

  // Determine status & remarks
  let status = 'Active (កំពុងសម្រុះសម្រួល)';
  let remarks = 'មិនទាន់បិទ';

  if (legacyOutcome === 'settled') {
    status = 'Settle (ព្រមព្រៀង)';
    remarks = 'ព្រមព្រៀង';
  } else if (legacyOutcome === 'unsuccessful_withdrawn') {
    status = 'Close (មិនព្រមព្រៀង)';
    remarks = 'ភាគីដកពាក្យ';
  } else if (legacyOutcome === 'unsuccessful_no_show') {
    status = 'Close (មិនព្រមព្រៀង)';
    remarks = 'ភាគីមិនចូលរួម';
  } else if (legacyOutcome === 'unsuccessful_no_agreement') {
    status = 'Close (មិនព្រមព្រៀង)';
    remarks = 'មិនព្រមព្រៀង';
  } else if (legacyOutcome === 'shelved') {
    status = 'Pending (តម្កល់)';
    remarks = 'តម្កល់ទុក';
  } else if (legacyOutcome === 'mediating') {
    status = 'Active (កំពុងសម្រុះសម្រួល)';
    remarks = 'កំពុងសម្រុះសម្រួល';
  }

  // Combined names for table backward compatibility
  const partyA_name = claimants.map(c => (c.type === 'company' ? c.comName : c.name) || '').filter(Boolean).join(', ');
  const partyA_gender = claimantPrimary.gender || 'ប្រុស';
  const partyA_phone = claimantPrimary.phone || '';
  const partyA_location = claimantPrimary.province || locationProvince;
  const partyA_address = claimantPrimary.address || '';
  const partyA_idNo = claimantPrimary.idNo || '';

  const partyB_name = respondents.map(r => (r.type === 'company' ? r.comName : r.name) || '').filter(Boolean).join(', ');
  const partyB_gender = respondentPrimary.gender || 'ប្រុស';
  const partyB_phone = respondentPrimary.phone || '';
  const partyB_location = respondentPrimary.province || locationProvince;
  const partyB_address = respondentPrimary.address || '';
  const partyB_idNo = respondentPrimary.idNo || '';

  const thirdPrimary = thirdParties[0] || {};
  const partyC_name = thirdParties.map(t => (t.type === 'company' ? t.comName : t.name) || '').filter(Boolean).join(', ');
  const partyC_gender = thirdPrimary.gender || 'ប្រុស';
  const partyC_phone = thirdPrimary.phone || '';
  const partyC_location = thirdPrimary.province || '';
  const partyC_address = thirdPrimary.address || '';
  const partyC_role = thirdPrimary.thirdPartyRole || '';

  const inputListNo = document.getElementById('intake-list-no')?.value;
  const parsedListNo = (inputListNo && !isNaN(parseInt(inputListNo))) ? parseInt(inputListNo) : null;

  const casePayload = {
    caseNumber,
    ...(parsedListNo !== null ? { originalListNo: parsedListNo } : {}),
    caseType: currentCaseAssignmentType,
    leadOfficer,
    filingDate,
    assignedDate,
    receivedDate,
    dateReceived: receivedDate,
    category,
    claimAmount,
    claimCurrency,
    locationHouse,
    locationCommune,
    locationProvince,
    disputeLocation,
    legacyPhase,
    legacyOutcome,
    status,
    remarks,
    facts,
    summary: facts,
    claims,
    claimsRequests: claims,
    driveLink,
    folderLink: driveLink,
    claimants: JSON.parse(JSON.stringify(claimants)),
    respondents: JSON.parse(JSON.stringify(respondents)),
    thirdParties: JSON.parse(JSON.stringify(thirdParties)),
    partyA_name,
    partyA_gender,
    partyA_phone,
    partyA_location,
    partyA_address,
    partyA_idNo,
    partyB_name,
    partyB_gender,
    partyB_phone,
    partyB_location,
    partyB_address,
    partyB_idNo,
    partyC_name,
    partyC_gender,
    partyC_phone,
    partyC_location,
    partyC_address,
    partyC_role
  };

  if (editId) {
    if (typeof updateCase === 'function') updateCase(editId, casePayload);
    if (typeof showToast === 'function') showToast(`បានកែសម្រួលសំណុំរឿង #${caseNumber} ដោយជោគជ័យ!`, 'success');
  } else {
    if (typeof addCase === 'function') addCase(casePayload);
    if (typeof showToast === 'function') showToast(`បានបញ្ចូលសំណុំរឿងថ្មី #${caseNumber} ដោយជោគជ័យ!`, 'success');
  }

  const modal = document.getElementById('case-modal');
  if (modal) modal.classList.remove('open');

  const shouldSwitchToCases = !editId && document.getElementById('entry-view')?.classList.contains('active') && typeof switchView === 'function';

  // Refresh Views
  if (typeof renderAllViews === 'function') {
    renderAllViews();
  } else {
    if (typeof renderMasterTable === 'function') renderMasterTable();
    if (typeof renderDashboardStats === 'function') renderDashboardStats();
    if (typeof renderUpcomingEvents === 'function') renderUpcomingEvents();
    if (typeof renderStrategyAnalytics === 'function') renderStrategyAnalytics();
  }

  // If creating a new case from the Case Entry menu, switch cleanly to Master Cases view
  if (shouldSwitchToCases) {
    switchView('cases-view');
  }
}
window.handleCaseSubmit = handleCaseSubmit;

/**
 * Save Draft
 */
function handleSaveDraft() {
  handleCaseSubmit();
}
window.handleSaveDraft = handleSaveDraft;

/**
 * Reset Form
 */
function resetFormPreview() {
  const form = document.getElementById('case-form') || document.getElementById('form-new-case');
  if (form) form.reset();
  currentWizardStep = 1;
  updateWizardUI();
  const today = new Date().toISOString().split('T')[0];
  const filing = document.getElementById('intake-filing-date');
  if (filing) filing.value = today;
  claimants = [{
    id: 1, type: 'individual', name: '', gender: 'ប្រុស', dob: '', idNo: '', idDate: '',
    phone: '', address: '', province: 'ភ្នំពេញ', comName: '', comRegNo: '', comAddress: '',
    comPhone: '', hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
  }];
  respondents = [{
    id: 1, type: 'individual', name: '', gender: 'ប្រុស', dob: '', idNo: '', idDate: '',
    phone: '', address: '', province: 'កណ្តាល', comName: '', comRegNo: '', comAddress: '',
    comPhone: '', hasRep: false, repRole: 'មេធាវី', repName: '', repPhone: '', repId: '', repDocDate: ''
  }];
  thirdParties = [];
  renderAllPartyCards();
}
window.resetFormPreview = resetFormPreview;

/**
 * Preview Official Documents
 */
function previewDoc(type) {
  const code = document.getElementById('intake-case-code')?.value || 'NADR-2026-001';
  const date = document.getElementById('intake-filing-date')?.value || new Date().toISOString().split('T')[0];
  const dType = document.getElementById('intake-dispute-type')?.value || 'វិវាទដីធ្លី';
  const amt = document.getElementById('intake-amount')?.value || '0';
  const curr = document.getElementById('intake-currency')?.value || '$ USD';
  const facts = document.getElementById('intake-facts')?.value || 'ពុំទាន់មានអង្គហេតុសង្ខេប';

  const claimantsHtml = claimants.map((c, i) => `<div><strong>ក.${i+1}៖</strong> ${c.type === 'company' ? c.comName : c.name || 'ពុំទាន់ដាក់ឈ្មោះ'} (ទូរស័ព្ទ៖ ${c.phone || '-'}, ${c.province || 'ភ្នំពេញ'})</div>`).join('');
  const respondentsHtml = respondents.map((r, i) => `<div><strong>ខ.${i+1}៖</strong> ${r.type === 'company' ? r.comName : r.name || 'ពុំទាន់ដាក់ឈ្មោះ'} (ទូរស័ព្ទ៖ ${r.phone || '-'}, ${r.province || 'កណ្តាល'})</div>`).join('');
  const thirdHtml = thirdParties.length > 0 ? thirdParties.map((t, i) => `<div><strong>គ.${i+1} (${t.thirdPartyRole})៖</strong> ${t.type === 'company' ? t.comName : t.name || '-'} (ទូរស័ព្ទ៖ ${t.phone || '-'}, ${t.province || 'ភ្នំពេញ'})</div>`).join('') : '';

  const titleEl = document.getElementById('doc-preview-title');
  const contentEl = document.getElementById('doc-preview-content');
  if (!titleEl || !contentEl) return;

  const royalHeader = `
    <div class="text-center font-bold space-y-1 mb-4" style="line-height:1.6;">
      <div style="font-size:14px; font-weight:800;">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div style="font-size:12px; font-weight:700;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
      <div style="font-size:16px;">***</div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; font-size:12px;">
      <div><strong>អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ (អ.ដ.ក.)</strong><br>សំណុំរឿងលេខ៖ <strong>${code}</strong></div>
      <div>ថ្ងៃចុះបញ្ជី៖ ${date}</div>
    </div>
  `;

  if (type === 'invitation' || type === 'summons_b') {
    titleEl.innerHTML = '<span>✉️</span> គំរូលិខិតកោះអញ្ជើញចូលរួមប្រជុំសម្រុះសម្រួល (Summons / Invitation Letter)';
    contentEl.innerHTML = `
      ${royalHeader}
      <div class="p-3 bg-white rounded-lg border border-slate-200 space-y-1 mb-3">
        <div class="font-bold text-slate-800">សូមគោរពអញ្ជើញ៖</div>
        ${respondentsHtml}
      </div>
      <p style="margin-bottom:8px;"><strong>កម្មវត្ថុ៖</strong> អញ្ជើញចូលរួមប្រជុំសម្រុះសម្រួលផ្សះផ្សាវិវាទករណី <strong>«${dType}»</strong> តាមពាក្យបណ្តឹងរបស់៖</p>
      <div class="p-2.5 bg-slate-50 rounded border border-slate-200 mb-3">${claimantsHtml}</div>
      ${thirdHtml ? `<div class="p-2.5 bg-purple-50 rounded border border-purple-200 mb-3">${thirdHtml}</div>` : ''}
      <p style="margin-bottom:8px;"><strong>អង្គហេតុសង្ខេប៖</strong> ${facts}</p>
      <p style="margin-bottom:16px;">កិច្ចប្រជុំនឹងប្រព្រឹត្តទៅនៅសាលប្រជុំ អាជ្ញាធរជាតិដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ (អ.ដ.ក.)។ សូមអញ្ជើញចូលរួមឱ្យបានទៀងទាត់ពេលវេលា និងភ្ជាប់មកជាមួយនូវឯកសារពាក់ព័ន្ធ។</p>
      <div style="display:flex; justify-content:flex-end; margin-top:24px; text-align:center;">
        <div>
          <div>ធ្វើនៅរាជធានីភ្នំពេញ, ថ្ងៃទី....... ខែ....... ឆ្នាំ២០២...</div>
          <div style="font-weight:700; margin-top:8px;">មន្ត្រីសម្រុះសម្រួលវិវាទ</div>
          <div style="margin-top:60px;">(ហត្ថលេខា និងត្រា)</div>
        </div>
      </div>
    `;
  } else if (type === 'settlement') {
    titleEl.innerHTML = '<span>📝</span> គំរូកំណត់ហេតុបញ្ចប់វិវាទ (Settlement Agreement)';
    contentEl.innerHTML = `
      ${royalHeader}
      <div class="text-center font-bold text-sm my-3 text-emerald-900" style="font-size:15px;">កំណត់ហេតុព្រមព្រៀងបញ្ចប់វិវាទជាស្ថាពរ</div>
      <p>សំណុំរឿងលេខ៖ <strong>${code}</strong> | ប្រភេទវិវាទ៖ <strong>${dType}</strong> | ទំហំទឹកប្រាក់៖ <strong>${amt} ${curr}</strong></p>
      <div class="space-y-1 p-2.5 bg-white rounded border border-slate-200 my-2">
        <div class="font-bold text-emerald-800">ភាគី «ក» (ដើមបណ្តឹង)៖</div>
        ${claimantsHtml}
      </div>
      <div class="space-y-1 p-2.5 bg-white rounded border border-slate-200 my-2">
        <div class="font-bold text-rose-800">ភាគី «ខ» (ចុងចម្លើយ)៖</div>
        ${respondentsHtml}
      </div>
      <p class="font-bold mt-3">ខ្លឹមសារនៃកិច្ចព្រមព្រៀង៖</p>
      <p style="text-indent:24px; line-height:1.8;">ភាគីទាំងពីរបានពិភាក្សា និងព្រមព្រៀងគ្នាបញ្ចប់វិវាទដោយស្ម័គ្រចិត្ត ដោយគ្មានការបង្ខិតបង្ខំពីបុគ្គលណាម្នាក់ឡើយ។ ភាគីទាំងអស់សន្យាអនុវត្តតាមកិច្ចសន្យាព្រមព្រៀងនេះឱ្យបានត្រឹមត្រូវជាស្ថាពរ។</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:30px; text-align:center;">
        <div><strong>ស្នាមមេដៃភាគី «ក»</strong><div style="margin-top:60px;">..................................</div></div>
        <div><strong>ស្នាមមេដៃភាគី «ខ»</strong><div style="margin-top:60px;">..................................</div></div>
      </div>
    `;
  } else if (type === 'meeting') {
    titleEl.innerHTML = '<span>📊</span> កំណត់ហេតុនៃកិច្ចប្រជុំសម្រុះសម្រួល (Meeting Minutes)';
    contentEl.innerHTML = `
      ${royalHeader}
      <div class="text-center font-bold text-sm my-3 text-blue-900">កំណត់ហេតុនៃកិច្ចប្រជុំសម្រុះសម្រួលផ្សះផ្សាវិវាទ</div>
      <p>សំណុំរឿងលេខ៖ <strong>${code}</strong> | ប្រភេទវិវាទ៖ <strong>${dType}</strong></p>
      <div class="p-2.5 bg-white rounded border border-slate-200 my-2">${claimantsHtml}</div>
      <div class="p-2.5 bg-white rounded border border-slate-200 my-2">${respondentsHtml}</div>
      <p><strong>អង្គហេតុ និងដំណើរការប្រជុំ៖</strong> ${facts}</p>
      <div style="display:flex; justify-content:flex-end; margin-top:30px; text-align:center;">
        <div><strong>អ្នកកត់ត្រាកំណត់ហេតុ</strong><div style="margin-top:60px;">(ហត្ថលេខា)</div></div>
      </div>
    `;
  } else {
    titleEl.innerHTML = '<span>📁</span> របាយការណ៍បិទបញ្ចប់សំណុំរឿង (Closing Report)';
    contentEl.innerHTML = `
      ${royalHeader}
      <div class="text-center font-bold text-sm my-3 text-slate-900">របាយការណ៍សង្ខេបស្តីពីការបិទបញ្ចប់សំណុំរឿង</div>
      <p>សំណុំរឿងលេខ៖ <strong>${code}</strong> | ប្រភេទវិវាទ៖ <strong>${dType}</strong> (${amt} ${curr})</p>
      <div class="p-2.5 bg-slate-50 rounded border border-slate-200 my-2">${claimantsHtml}</div>
      <div class="p-2.5 bg-slate-50 rounded border border-slate-200 my-2">${respondentsHtml}</div>
      <p><strong>សេចក្តីសន្និដ្ឋាននៃចំណាត់ការ៖</strong> ដំណើរការសម្រុះសម្រួលត្រូវបានអនុវត្តតាមនីតិវិធីនៃច្បាប់ និងក្របខ័ណ្ឌការងាររបស់ អ.ដ.ក. រួចរាល់។</p>
      <div style="display:flex; justify-content:flex-end; margin-top:30px; text-align:center;">
        <div><strong>ប្រធានក្រុមចាត់ការ</strong><div style="margin-top:60px;">(ហត្ថលេខា)</div></div>
      </div>
    `;
  }

  const modalDoc = document.getElementById('modal-doc-preview');
  if (modalDoc) modalDoc.classList.remove('hidden');
}
window.previewDoc = previewDoc;

/**
 * Close Document Preview Modal
 */
function closeDocPreview() {
  const modalDoc = document.getElementById('modal-doc-preview');
  if (modalDoc) modalDoc.classList.add('hidden');
}
window.closeDocPreview = closeDocPreview;

/**
 * Print Document Preview
 */
function printDocPreview() {
  const content = document.getElementById('doc-preview-content');
  if (!content) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="km">
    <head>
      <meta charset="UTF-8">
      <title>បោះពុម្ពឯកសារ</title>
      <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Kantumruy Pro', sans-serif; padding: 40px; font-size: 13px; line-height: 1.8; color: #000; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .mb-4 { margin-bottom: 16px; }
        .p-3 { padding: 12px; }
        .border { border: 1px solid #ccc; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${content.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
}
window.printDocPreview = printDocPreview;

/**
 * Initialize Modal Events
 */
function initModalEvents() {
  const btnAdd1 = document.getElementById('btn-open-add-modal');
  const btnAdd2 = document.getElementById('btn-open-add-modal-2');
  const btnAddEntry = document.getElementById('btn-open-add-modal-entry');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('case-form') || document.getElementById('form-new-case');

  if (btnAdd1) btnAdd1.addEventListener('click', window.openAddModal);
  if (btnAdd2) btnAdd2.addEventListener('click', window.openAddModal);
  if (btnAddEntry) btnAddEntry.addEventListener('click', window.openAddModal);

  if (form) {
    form.addEventListener('submit', window.handleCaseSubmit);
  }

  // Dossier Detail View Modal close
  const viewModal = document.getElementById('view-modal');
  const btnCloseView = document.getElementById('btn-close-view-modal');
  if (btnCloseView && viewModal) {
    btnCloseView.addEventListener('click', () => viewModal.classList.remove('open'));
  }
}
window.initModalEvents = initModalEvents;


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
        <div style="background-color: #f8fafc; margin: -20px; padding: 20px;">
            <!-- Profile Header -->
            <div style="background: white; padding: 24px; border-bottom: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${c.caseNumber}</h2>
                    <div style="display: flex; gap: 12px; align-items: center; font-size: 14px; color: #64748b; flex-wrap: wrap;">
                        <span><i class="fa-solid fa-calendar-days"></i> ទទួលពាក្យ៖ <span style="font-weight:600; color:#334155;">${c.dateReceived}</span></span>
                        <span><i class="fa-solid fa-tag"></i> <span style="font-weight:600; color:#334155;">${c.category}</span></span>
                        <span><i class="fa-solid fa-location-dot"></i> <span style="font-weight:600; color:#334155;">${c.disputeLocation}</span></span>
                        ${c.folderLink ? `<a href="javascript:void(0)" onclick="window.electronAPI ? window.electronAPI.openFolder('${c.folderLink.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}') : window.open('${c.folderLink.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')" class="btn btn-sm" style="background:#f0f9ff; color:#0ea5e9; border:1px solid #bae6fd; text-decoration:none; padding:4px 10px; font-size:12px; border-radius:6px;"><i class="fa-solid fa-folder-open"></i> បើក Folder</a>` : ''}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    ${getStatusBadgeHTML(c.status)}
                    <span class="badge ${c.remarks === 'បានបិទរួចរាល់' ? 'badge-settle' : 'badge-pending'}" style="font-size: 12px;">${c.remarks}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Party A Card -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                    <h4 style="color: #2563eb; font-weight: 700; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px;">
                        <i class="fa-solid fa-user-shield"></i> ដើមបណ្ដឹង ភាគី "ក"
                    </h4>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ឈ្មោះ</label>
                        <div style="font-size: 15px; font-weight: 600; color: #334155;">${c.partyA_name} (${c.partyA_gender}, ${c.partyA_age || '?'} ឆ្នាំ)</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">លេខទូរស័ព្ទ</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyA_phone || 'ពុំមាន'}</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">មេធាវីតំណាង</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyA_lawyer_name ? `${c.partyA_lawyer_name} (${c.partyA_lawyer_phone || ''})` : 'គ្មានមេធាវីតំណាង'}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">អាសយដ្ឋាន</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyA_location} ${c.partyA_address ? ' - ' + c.partyA_address : ''}</div>
                    </div>
                    ${c.partyA_additional_names ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ភាគីបន្ថែម</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyA_additional_names}</div>
                        ${c.partyA_additional_addresses ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">🏠 ${c.partyA_additional_addresses}</div>` : ''}
                    </div>` : ''}
                </div>

                <!-- Party B Card -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                    <h4 style="color: #ef4444; font-weight: 700; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #fef2f2; padding-bottom: 8px;">
                        <i class="fa-solid fa-user-xmark"></i> ចុងបណ្ដឹង ភាគី "ខ"
                    </h4>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ឈ្មោះ</label>
                        <div style="font-size: 15px; font-weight: 600; color: #334155;">${c.partyB_name} (${c.partyB_gender}, ${c.partyB_age || '?'} ឆ្នាំ)</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">លេខទូរស័ព្ទ</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyB_phone || 'ពុំមាន'}</div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">មេធាវីតំណាង</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyB_lawyer_name ? `${c.partyB_lawyer_name} (${c.partyB_lawyer_phone || ''})` : 'គ្មានមេធាវីតំណាង'}</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">អាសយដ្ឋាន</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyB_location} ${c.partyB_address ? ' - ' + c.partyB_address : ''}</div>
                    </div>
                    ${c.partyB_additional_names ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ភាគីបន្ថែម</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyB_additional_names}</div>
                        ${c.partyB_additional_addresses ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">🏠 ${c.partyB_additional_addresses}</div>` : ''}
                    </div>` : ''}
                </div>
            </div>

            ${c.partyC_name ? `
            <!-- Party C Card -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <h4 style="color: #475569; font-weight: 700; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
                    <i class="fa-solid fa-users"></i> អ្នកពាក់ព័ន្ធ / តតិយជន ភាគី "គ"
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ឈ្មោះ</label>
                        <div style="font-size: 15px; font-weight: 600; color: #334155;">${c.partyC_name} (${c.partyC_gender || 'ប្រុស'}, ${c.partyC_age || '?'} ឆ្នាំ)</div>
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">លេខទូរស័ព្ទ</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyC_phone || 'ពុំមាន'}</div>
                    </div>
                    <div style="grid-column: span 2;">
                        <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">អាសយដ្ឋាន</label>
                        <div style="font-size: 14px; color: #334155;">${c.partyC_location || ''} ${c.partyC_address ? ' - ' + c.partyC_address : ''}</div>
                    </div>
                </div>
                ${c.partyC_additional_names ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
                    <label style="font-size: 12px; color: #64748b; font-weight: 600; display: block;">ភាគីបន្ថែម</label>
                    <div style="font-size: 14px; color: #334155;">${c.partyC_additional_names}</div>
                    ${c.partyC_additional_addresses ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">🏠 ${c.partyC_additional_addresses}</div>` : ''}
                </div>` : ''}
            </div>
            ` : ''}

            <!-- Dispute Summary -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <h4 style="color: #1e293b; font-weight: 700; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-file-lines text-primary"></i> អង្គហេតុសង្ខេប (Dispute Summary)
                </h4>
                <p style="font-size: 14.5px; line-height: 1.7; color: #475569; margin: 0; white-space: pre-wrap; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">${c.facts || c.summary || 'ពុំមានរៀបរាប់សេចក្តីសង្ខេប'}</p>
            </div>
            ${(c.claims || c.claimsRequests) ? `
            <!-- Claims & Requests -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <h4 style="color: #047857; font-weight: 700; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-scale-balanced"></i> ការទាមទារ និងសំណូមពរ (Claims &amp; Requests)
                </h4>
                <p style="font-size: 14.5px; line-height: 1.7; color: #334155; margin: 0; white-space: pre-wrap; background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">${c.claims || c.claimsRequests}</p>
            </div>` : ''}

            <!-- Phase Tracker Injected Here -->
            ${typeof generatePhaseTrackerHTML === 'function' ? generatePhaseTrackerHTML(c, true) : ''}
            
            ${(() => {
                if (CUSTOM_COLUMNS.length === 0) return '';
                let customHtml = `
                <!-- Custom Fields -->
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px;">
                    <h4 style="color: #475569; font-weight: 700; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-square-plus"></i> ព័ត៌មានបន្ថែម (Custom Fields)
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 13px;">
                `;
                CUSTOM_COLUMNS.forEach(col => {
                    const val = c[col.key] || 'ពុំមានបញ្ចូល';
                    customHtml += `
                        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">${col.labelKh} (${col.labelEn})</span>
                            <strong style="color: #334155;">${val}</strong>
                        </div>
                    `;
                });
                customHtml += `</div></div>`;
                return customHtml;
            })()}

            <!-- Attached Files -->
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                ${renderDossierFilesSection(c)}
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
    const btnGenDoc = document.getElementById('btn-generate-doc-from-view');
    if (btnGenDoc) {
        btnGenDoc.onclick = () => {
            if (typeof openLegalDocModal === 'function') openLegalDocModal(c.id);
        };
    }
    const btnTelegram = document.getElementById('btn-telegram-from-view');
    if (btnTelegram) {
        btnTelegram.onclick = () => shareCaseToTelegram(c.id);
    }
    const btnClone = document.getElementById('btn-clone-from-view');
    if (btnClone) {
        btnClone.onclick = () => {
            document.getElementById('btn-close-view-modal').click();
            cloneCaseToForm(c.id);
        };
    }
    document.getElementById('btn-edit-from-view').onclick = () => openEditModal(c.id);
    document.getElementById('btn-delete-from-view').onclick = () => confirmDeleteCase(c.id, true);
    document.getElementById('btn-print-single-case').onclick = () => printSingleDossier(c);

    modal.classList.add('open');
}

/**
 * Share Case to Telegram via Bot API
 */
window.shareCaseToTelegram = async function(id) {
    const c = getCaseById(id);
    if (!c) return;

    let text = `📂 <b>ព័ត៌មានសំណុំរឿង NADR</b>\n\n`;
    if (c.caseType === 'assisting') {
        text = `📂 <b>[សំណុំរឿងអម] ព័ត៌មានសំណុំរឿង NADR</b>\n\n`;
    }
    text += `🔹 លេខសំណុំរឿង៖ <b>${c.caseNumber}</b>\n`;
    text += `🔹 កាលបរិច្ឆេទ៖ ${c.dateReceived}\n`;
    text += `🔹 ប្រភេទ៖ ${t_val(c.category)}\n`;
    text += `🔹 ភាគី (ក)៖ ${c.partyA_name || ''} ${c.partyA_phone ? '📞 ' + formatPhoneNumberWithTelecom(c.partyA_phone) : ''}\n`;
    text += `🔹 ភាគី (ខ)៖ ${c.partyB_name || ''} ${c.partyB_phone ? '📞 ' + formatPhoneNumberWithTelecom(c.partyB_phone) : ''}\n`;
    text += `🔹 ទីតាំងវិវាទ៖ ${t_val(c.disputeLocation)}\n`;
    text += `🔹 ស្ថានភាព៖ ${t_val(c.status)}\n\n`;
    
    if (c.summary) {
        let formattedSummary = c.summary.replace(/\b\d{4,}(?:\.\d+)?\b|\b\d+\.\d+\b/g, m => {
            if (m.match(/^20[0-9]{2}$/)) return m; // ignore years like 2024
            let parts = m.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join('.');
        });
        text += `📝 <b>សេចក្តីសង្ខេប៖</b>\n${formattedSummary}\n`;
    }

    if (typeof sendTelegramMessage === 'function') {
        const success = await sendTelegramMessage(text);
        if (success) {
            if (typeof showToast === 'function') showToast('បានផ្ញើព័ត៌មានសំណុំរឿងនេះទៅ Telegram ជោគជ័យ!', 'success');
        } else {
            if (typeof showToast === 'function') showToast('ការបញ្ជូនទៅ Telegram បរាជ័យ! សូមពិនិត្យមើលការកំណត់ Bot Token។', 'error');
        }
    } else {
        if (typeof showToast === 'function') showToast('ប្រព័ន្ធ Telegram មិនត្រូវបានភ្ជាប់ទេ។', 'error');
    }
};

/**
 * Share Statistics to Telegram
 */
function escapeTelegramHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.shareStatsToTelegram = async function() {
    const tgBtn = document.getElementById('btn-share-stats-telegram');
    const tgSettings = (typeof getTelegramSettings === 'function')
        ? getTelegramSettings()
        : { token: localStorage.getItem('nadr_tg_token') || '', chatid: localStorage.getItem('nadr_tg_chatid') || '' };

    if (!tgSettings.token || !tgSettings.chatid) {
        if (typeof showToast === 'function') {
            showToast('សូមបញ្ចូល Telegram Bot Token និង Chat ID នៅក្នុង «ការកំណត់» ជាមុនសិន!', 'warning');
        }
        if (typeof customConfirm === 'function') {
            customConfirm(
                'មិនទាន់ភ្ជាប់ Telegram Bot',
                'លោកអ្នកមិនទាន់បានបញ្ចូល Telegram Bot Token និង Chat ID ទេ។ តើចង់បើកផ្ទាំង «ការកំណត់» ដើម្បីភ្ជាប់ឥឡូវនេះទេ?',
                () => {
                    if (typeof switchView === 'function') switchView('settings-view');
                    setTimeout(() => {
                        const tokenInput = document.getElementById('setting-tg-token');
                        if (tokenInput) { tokenInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); tokenInput.focus(); }
                    }, 180);
                },
                null,
                'បើកការកំណត់'
            );
        }
        return false;
    }

    const allCases = Array.isArray(casesData) ? casesData : [];
    let targetCases = [];
    let title = '';

    const dashTabAssisting = document.getElementById('dash-tab-assisting');
    if (window.currentDashboardTab === 'assisting' || (dashTabAssisting && dashTabAssisting.classList.contains('active'))) {
        targetCases = allCases.filter(c => c.caseType === 'assisting');
        title = `🔹 <b>របាយការណ៍ស្ថិតិ៖ សំណុំរឿងអម (Assisting Cases)</b>\n`;
    } else {
        targetCases = allCases.filter(c => (c.caseType || 'personal') === 'personal');
        title = `🔹 <b>របាយការណ៍ស្ថិតិ៖ សំណុំរឿងផ្ទាល់ខ្លួន (Personal Cases)</b>\n`;
    }

    const todayStr = (typeof getTodayDateString === 'function') ? getTodayDateString() : new Date().toISOString().split('T')[0];
    let text = `📊 <b>របាយការណ៍ស្ថិតិសំណុំរឿង NADR</b>\n`;
    text += `📅 <b>កាលបរិច្ឆេទ៖</b> ${escapeTelegramHtml(todayStr)}\n\n`;
    text += title;
    text += generateStatsTextForTelegram(targetCases);
    text += `\n<i>✨ បញ្ជូនពីប្រព័ន្ធ CMS Pro (Telegram Bot Integration)</i>`;

    const origBtnHtml = tgBtn ? tgBtn.innerHTML : '';
    if (tgBtn) {
        tgBtn.disabled = true;
        tgBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>កំពុងផ្ញើ...</span>';
    }
    if (typeof showToast === 'function') showToast('កំពុងបញ្ជូនរបាយការណ៍ស្ថិតិទៅ Telegram...', 'info');

    try {
        if (typeof sendTelegramMessage === 'function') {
            const success = await sendTelegramMessage(text);
            if (success) {
                if (typeof showToast === 'function') showToast('បានផ្ញើរបាយការណ៍ស្ថិតិទៅ Telegram ជោគជ័យ!', 'success');
                return true;
            } else {
                const errDetail = (window.lastTelegramError && window.lastTelegramError !== 'MISSING_CONFIG') ? ` (${window.lastTelegramError})` : '';
                if (typeof showToast === 'function') showToast(`ការបញ្ជូនទៅ Telegram បរាជ័យ${errDetail}! សូមពិនិត្យ Bot Token, Chat ID និងអ៊ីនធឺណិត។`, 'error');
                return false;
            }
        } else {
            if (typeof showToast === 'function') showToast('ប្រព័ន្ធ Telegram មិនត្រូវបានភ្ជាប់ទេ។', 'error');
            return false;
        }
    } finally {
        if (tgBtn) {
            tgBtn.disabled = false;
            tgBtn.innerHTML = origBtnHtml;
        }
    }
};

function generateStatsTextForTelegram(casesArray) {
    const s = (typeof getCaseStatistics === 'function') ? getCaseStatistics(casesArray) : null;
    const total = s ? s.total : casesArray.length;
    const settle = s ? s.settle : casesArray.filter(c => c.status && (c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង')))).length;
    const active = s ? s.active : casesArray.filter(c => c.status && (c.status.startsWith('Active') || c.status.includes('កំពុងសម្រុះសម្រួល'))).length;
    const close = s ? s.close : casesArray.filter(c => c.status && (c.status.startsWith('Close') || c.status.startsWith('No Settle') || c.status.includes('មិនព្រមព្រៀង') || c.status.includes('បិទ'))).length;
    const pending = s ? s.pending : casesArray.filter(c => c.status && (c.status.startsWith('Pending') || c.status.includes('តម្កល់'))).length;

    let text = `📑 <b>១. ស្ថិតិសង្ខេប និងលទ្ធផលចំណាត់ការ</b>\n`;
    text += `• សំណុំរឿងសរុប៖ <b>${total}</b> ករណី\n`;
    text += `• កំពុងចាត់ការ (Active)៖ <b>${active}</b> ករណី\n`;
    text += `• ព្រមព្រៀង (Settle)៖ <b>${settle}</b> ករណី\n`;
    text += `• បានបិទបញ្ចប់ (Closed)៖ <b>${close}</b> ករណី\n`;
    text += `• បានតម្កល់ (Pending)៖ <b>${pending}</b> ករណី\n\n`;

    const activeGroupTotal = active + pending;
    const closedGroupTotal = settle + close;
    
    text += `📈 <b>២. លទ្ធផលចំណាត់ការសំណុំរឿងរួម</b>\n`;
    text += `• សំណុំរឿង Active (កំពុងចាត់ការ)៖ <b>${activeGroupTotal}</b> ករណី\n`;
    text += `   - Active (កំពុងសម្រុះសម្រួល)៖ <b>${active}</b> ករណី\n`;
    text += `   - Pending (តម្កល់)៖ <b>${pending}</b> ករណី\n`;
    text += `• សំណុំរឿង Closed (បិទបញ្ចប់)៖ <b>${closedGroupTotal}</b> ករណី\n`;
    text += `   - Settle (ព្រមព្រៀង)៖ <b>${settle}</b> ករណី\n`;
    text += `   - No Settle (មិនព្រមព្រៀង)៖ <b>${close}</b> ករណី\n\n`;

    // 3. Categories breakdown
    text += `📋 <b>៣. ស្ថិតិតាមប្រភេទវិវាទ</b>\n`;
    let categories = {};
    casesArray.forEach(c => {
        let cat = (typeof t_val === 'function' ? t_val(c.category) : c.category) || 'ផ្សេងៗ';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const sortedCats = Object.keys(categories).sort((a,b) => categories[b] - categories[a]);
    sortedCats.forEach(cat => {
        const count = categories[cat];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        text += `• ${escapeTelegramHtml(cat)}៖ ${count} (${pct}%)\n`;
    });
    text += `\n`;

    // 4. Provinces breakdown
    text += `🗺 <b>៤. ស្ថិតិតាមទីតាំង (ខេត្ត/រាជធានី)</b>\n`;
    let provinces = {};
    casesArray.forEach(c => {
        let loc = (typeof t_val === 'function' ? t_val(c.disputeLocation) : c.disputeLocation) || 'ផ្សេងៗ';
        provinces[loc] = (provinces[loc] || 0) + 1;
    });
    
    const sortedProvinces = Object.keys(provinces).sort((a,b) => provinces[b] - provinces[a]);
    sortedProvinces.slice(0, 5).forEach(loc => { // Top 5
        const count = provinces[loc];
        text += `• ${escapeTelegramHtml(loc)}៖ ${count} ករណី\n`;
    });
    
    return text;
}



/**
 * Custom Confirmation Popup Modal System
 */
function customConfirm(title, message, onYes, onNo, yesText = 'យល់ព្រម', noText = 'បោះបង់') {
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
    
    btnYes.innerHTML = `<i class="fa-solid fa-check"></i> ${yesText}`;
    btnNo.innerHTML = `<i class="fa-solid fa-xmark"></i> ${noText}`;
    
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
    }, null, 'យល់ព្រមលុប');
}

/**
 * Render Case Evaluation & Analytics View
 */
function renderAnalyticsView() {
    const stats = getCaseStatistics();
    const totalCases = stats.total || (typeof casesData !== 'undefined' ? casesData.length : 0);

    // 1. សម្រុះសម្រួលជោគជ័យ (Settle)
    const countSettle = stats.settle;

    // 2. មិនជោគជ័យ (បូកសរុបពី៖ ភាគីដកពាក្យ, ភាគីមិនចូលរួម, និង ភាគីមិនព្រមព្រៀង)
    const countUnsettled = stats.close;

    // សរុបចាត់ការរួច (Total Resolved)
    const totalResolved = countSettle + countUnsettled;
    const resolvedRate = totalCases > 0 ? ((totalResolved / totalCases) * 100).toFixed(1) : '0.0';

    // 3. កំពុងសម្រុះសម្រួល (Active)
    const countActive = stats.active;

    // 4. តម្កល់ (Pending)
    const countPending = stats.pending;

    // សរុបកំពុងចាត់ការ (Total Ongoing)
    const totalOngoing = countActive + countPending;
    const ongoingRate = totalCases > 0 ? ((totalOngoing / totalCases) * 100).toFixed(1) : '0.0';

    // Card 1 Elements (អត្រាចាត់ការរួចរាល់មានសរុប)
    const resRateEl = document.getElementById('eval-resolved-rate');
    const resCasesEl = document.getElementById('eval-resolved-cases');
    const resTotalLabelEl = document.getElementById('eval-resolved-total-label');
    const resBarEl = document.getElementById('eval-resolved-bar');
    const cntSettleEl = document.getElementById('eval-count-settle');
    const cntUnsettledEl = document.getElementById('eval-count-unsettled');

    if (resRateEl) resRateEl.innerText = `${resolvedRate} %`;
    if (resCasesEl) resCasesEl.innerText = `${totalResolved} សំណុំរឿង`;
    if (resTotalLabelEl) resTotalLabelEl.innerText = `(${totalResolved} នៃ ${totalCases} សំណុំរឿងសរុប)`;
    if (resBarEl) resBarEl.style.width = `${Math.min(100, parseFloat(resolvedRate))}%`;
    if (cntSettleEl) cntSettleEl.innerText = `${countSettle} សំណុំរឿង`;
    if (cntUnsettledEl) cntUnsettledEl.innerText = `${countUnsettled} សំណុំរឿង`;

    // Card 2 Elements (អត្រាកំពុងចាត់ការមានសរុប)
    const ongRateEl = document.getElementById('eval-ongoing-rate');
    const ongCasesEl = document.getElementById('eval-ongoing-cases');
    const ongTotalLabelEl = document.getElementById('eval-ongoing-total-label');
    const ongBarEl = document.getElementById('eval-ongoing-bar');
    const cntActiveEl = document.getElementById('eval-count-active');
    const cntPendingEl = document.getElementById('eval-count-pending');

    if (ongRateEl) ongRateEl.innerText = `${ongoingRate} %`;
    if (ongCasesEl) ongCasesEl.innerText = `${totalOngoing} សំណុំរឿង`;
    if (ongTotalLabelEl) ongTotalLabelEl.innerText = `(${totalOngoing} នៃ ${totalCases} សំណុំរឿងសរុប)`;
    if (ongBarEl) ongBarEl.style.width = `${Math.min(100, parseFloat(ongoingRate))}%`;
    if (cntActiveEl) cntActiveEl.innerText = `${countActive} សំណុំរឿង`;
    if (cntPendingEl) cntPendingEl.innerText = `${countPending} សំណុំរឿង`;

    // 3. Dynamic Strategic Recommendation Box (Full-width Card)
    const rateNum = parseFloat(resolvedRate);
    const recBox = document.getElementById('eval-strategic-recommendation-box');
    const concEl = document.getElementById('eval-conclusion-text');

    if (recBox) {
        if (rateNum >= 55) {
            // ករណីទី៣៖ ចាប់ពី ៥៥% ឡើងទៅ (៥៥% - ១០០%)
            recBox.className = 'card-panel mb-4 eval-rec-card eval-rec-success';
            recBox.innerHTML = `
                <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #bbf7d0; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: #065f46; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                                ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ
                            </h4>
                            <span style="font-size: 12.5px; color: #166534; font-weight: 600;">ផ្អែកលើអត្រាចាត់ការរួចរាល់មានសរុបបច្ចុប្បន្ន (${resolvedRate}%)</span>
                        </div>
                    </div>
                    <div>
                        <span class="badge" style="background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-medal"></i> ចំណាត់ការសំណុំរឿងល្អ
                        </span>
                    </div>
                </div>
                <div class="eval-rec-body">
                    <div style="font-size: 14.5px; font-weight: 700; color: #15803d; margin-bottom: 12px; line-height: 1.6;">
                        + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកមានចំណាត់ការសំណុំរឿងបានល្អប្រសើរ ស្របតាមគោលដៅកំណត់ (ចាប់ពី ៥៥% ឡើងទៅ)។ សូមបន្តរក្សាប្រសិទ្ធភាពការងារនេះ តាមរយៈការអនុវត្តដូចខាងក្រោម៖
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                        <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">បន្តតាមដាន និងដោះស្រាយសំណុំរឿងដែលកំពុងសម្រុះសម្រួលនៅសល់ តាមកាលវិភាគកំណត់ឱ្យបានទៀងទាត់</span>
                        </div>
                        <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ពិនិត្យជម្រះសំណុំរឿងតម្កល់ដែលនៅសល់ និងពង្រឹងគុណភាពនៃការផ្សះផ្សាដើម្បីបង្កើនអត្រាសម្រុះសម្រួលជោគជ័យឱ្យកាន់តែខ្ពស់</span>
                        </div>
                    </div>
                </div>
            `;
            if (concEl) concEl.innerHTML = `អត្រាចាត់ការរួចរាល់បច្ចុប្បន្នគឺ <strong>${resolvedRate}%</strong> (${totalResolved}/${totalCases} សំណុំរឿង) ដែលស្ថិតក្នុងកម្រិត <strong>"ចំណាត់ការសំណុំរឿងល្អ"</strong> ស្របតាមគោលដៅកំណត់។`;
        } else if (rateNum >= 30) {
            // ករណីទី១៖ ចន្លោះពី ៣០% - ៥៤% (រួមបញ្ចូលចន្លោះ ៤០% - ៥០%)
            recBox.className = 'card-panel mb-4 eval-rec-card eval-rec-warning';
            recBox.innerHTML = `
                <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #fde68a; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: #92400e; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                                ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ
                            </h4>
                            <span style="font-size: 12.5px; color: #b45309; font-weight: 600;">ផ្អែកលើអត្រាចាត់ការរួចរាល់មានសរុបបច្ចុប្បន្ន (${resolvedRate}%)</span>
                        </div>
                    </div>
                    <div>
                        <span class="badge" style="background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-circle-exclamation"></i> ចំណាត់ការសំណុំរឿងមិនល្អ
                        </span>
                    </div>
                </div>
                <div class="eval-rec-body">
                    <div style="font-size: 14.5px; font-weight: 700; color: #b45309; margin-bottom: 12px; line-height: 1.6;">
                        + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគួរមានចំណាត់ការសំណុំរឿងឱ្យល្អជាងនេះ ទើបល្អ ដោយព្យាយាមរក្សាអត្រាចាត់ការរួចក្នុងចន្លោះចាប់ពី ៥៥% ឡើងទៅ តាមរយៈការអនុវត្តដូចខាងក្រោម៖
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                        <div style="background: white; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-arrow-right text-warning" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ពិនិត្យលទ្ធភាព ជំរុញដាក់កម្មវិធីប្រជុំដោះស្រាយឱ្យបានលឿន ចំពោះសំណុំរឿងដែលកំពុងសម្រុះសម្រួល</span>
                        </div>
                        <div style="background: white; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-arrow-right text-warning" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ពិនិត្យមើលសំណុំរឿងដែលមិនមានលទ្ធភាពអាចជោគជ័យ ឬភាគីមិនចូលរួម ត្រូវធ្វើរបាយការណ៍បិទសំណុំរឿងឱ្យបានទាន់ពេលវេលា</span>
                        </div>
                        <div style="background: white; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-arrow-right text-warning" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ពិនិត្យសំណុំរឿងដែលបានតម្កល់ឡើងវិញ ដើម្បីសម្រេចបន្តនីតិវិធី ឬធ្វើរបាយការណ៍បិទបញ្ចប់ កុំឱ្យកកស្ទះសំណុំរឿង</span>
                        </div>
                    </div>
                </div>
            `;
            if (concEl) concEl.innerHTML = `អត្រាចាត់ការរួចរាល់បច្ចុប្បន្នគឺ <strong>${resolvedRate}%</strong> (${totalResolved}/${totalCases} សំណុំរឿង) ដែលស្ថិតក្នុងកម្រិត <strong>"ចំណាត់ការសំណុំរឿងមិនល្អ"</strong> (ចន្លោះ ៣០% - ៥៤%)។ ស្ថាប័នគួរជំរុញនីតិវិធីបន្ថែមដើម្បីឈានទៅដល់ ៥៥% ឡើងទៅ។`;
        } else {
            // ករណីទី២៖ ចន្លោះពី ០% - ២៩%
            recBox.className = 'card-panel mb-4 eval-rec-card eval-rec-danger';
            recBox.innerHTML = `
                <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #fecaca; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            <i class="fa-solid fa-circle-radiation"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: #991b1b; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                                ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ
                            </h4>
                            <span style="font-size: 12.5px; color: #b91c1c; font-weight: 600;">ផ្អែកលើអត្រាចាត់ការរួចរាល់មានសរុបបច្ចុប្បន្ន (${resolvedRate}%)</span>
                        </div>
                    </div>
                    <div>
                        <span class="badge" style="background: #fee2e2; color: #dc2626; border: 1.5px solid #fca5a5; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> ចំណាត់ការសំណុំរឿងខ្សោយខ្លាំង
                        </span>
                    </div>
                </div>
                <div class="eval-rec-body">
                    <div style="font-size: 14.5px; font-weight: 700; color: #dc2626; margin-bottom: 12px; line-height: 1.6;">
                        + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគួរមានចំណាត់ការសំណុំរឿងឱ្យបានសកម្ម និងម៉ឺងម៉ាត់ជាងនេះជាបន្ទាន់ ទើបល្អ ដោយព្យាយាមបង្កើនអត្រាចាត់ការរួចឱ្យឆ្លងផុតកម្រិត ៤០% ក្នុងដំណាក់កាលដំបូង និងឈានទៅរក្សាកម្រិតចាប់ពី ៥៥% ឡើងទៅ តាមរយៈការអនុវត្តដូចខាងក្រោម៖
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                        <div style="background: white; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-angles-right text-danger" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ធ្វើបច្ចុប្បន្នភាព និងពិនិត្យសំណុំរឿងកំពុងសម្រុះសម្រួល និងសំណុំរឿងតម្កល់ទាំងអស់ជាបន្ទាន់ ដើម្បីរកមូលហេតុពិតប្រាកដនៃការកកស្ទះ</span>
                        </div>
                        <div style="background: white; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-angles-right text-danger" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">រៀបចំផែនការសកម្មភាពបន្ទាន់ប្រចាំសប្តាហ៍ ដោយកំណត់ចំនួនសំណុំរឿងដែលត្រូវដាក់កម្មវិធីប្រជុំដោះស្រាយឱ្យបានច្បាស់លាស់</span>
                        </div>
                        <div style="background: white; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-angles-right text-danger" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ពិនិត្យ និងស្រង់ចេញនូវសំណុំរឿងដែលអូសបន្លាយពេលយូរ ភាគីមិនចូលរួម ឬសំណុំរឿងតម្កល់ដែលគ្មានលទ្ធភាពផ្សះផ្សា ដើម្បីរៀបចំរបាយការណ៍បិទសំណុំរឿងជាបន្ទាន់</span>
                        </div>
                        <div style="background: white; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <i class="fa-solid fa-angles-right text-danger" style="margin-top: 3px; font-size: 14px;"></i>
                            <span style="font-size: 13.5px; color: #1f2937; line-height: 1.6; font-weight: 500;">ទំនាក់ទំនងទៅកាន់ភាគីវិវាទជាមុន (Pre-mediation) ដើម្បីផ្តល់ព័ត៌មានពីអត្ថប្រយោជន៍នៃការដោះស្រាយ ជំរុញការចូលរួម និងកាត់បន្ថយករណីភាគីមិនព្រមព្រៀង</span>
                        </div>
                    </div>
                </div>
            `;
            if (concEl) concEl.innerHTML = `អត្រាចាត់ការរួចរាល់បច្ចុប្បន្នគឺ <strong>${resolvedRate}%</strong> (${totalResolved}/${totalCases} សំណុំរឿង) ដែលស្ថិតក្នុងកម្រិត <strong>"ចំណាត់ការសំណុំរឿងខ្សោយខ្លាំង"</strong> (ចន្លោះ ០% - ២៩%)។ ចាំបាច់ត្រូវចាត់វិធានការបន្ទាន់តាមអនុសាសន៍។`;
        }
    }

    // renderLocationChart removed as requested
    renderAnalyticsTables(stats);
}
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
            const setCount = catCases.filter(c => c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))).length;
            const noSetCount = catCases.filter(c => c.status.startsWith('Close') || c.status.includes('បិទ') || (c.mediationMeeting && c.mediationMeeting.includes('មិនព្រមព្រៀង'))).length;
            const penCount = catCases.filter(c => c.status.startsWith('Pending') || c.status.includes('តម្កល់') || c.status.includes('ផ្អាក')).length;
            
            const actPct = catLen > 0 ? ((actCount / catLen) * 100).toFixed(0) : 0;
            const setPct = catLen > 0 ? ((setCount / catLen) * 100).toFixed(0) : 0;
            const noSetPct = catLen > 0 ? ((noSetCount / catLen) * 100).toFixed(0) : 0;
            const penPct = catLen > 0 ? ((penCount / catLen) * 100).toFixed(0) : 0;

            pctHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='white';">
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${idx + 1}</td>
                    <td style="text-align: left; padding: 10px 16px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">${cat}</td>
                    <td style="padding: 10px; font-weight: 800; background: #f8fafc; border-right: 1px solid #e2e8f0;">${sysPct}%</td>
                    <td style="padding: 10px; color: #2563eb; font-weight: 700; border-right: 1px solid #e2e8f0;">${actPct}%</td>
                    <td style="padding: 10px; color: #10b981; font-weight: 700; border-right: 1px solid #e2e8f0;">${setPct}%</td>
                    <td style="padding: 10px; color: #ef4444; font-weight: 700; border-right: 1px solid #e2e8f0;">${noSetPct}%</td>
                    <td style="padding: 10px; color: #d97706; font-weight: 700;">${penPct}%</td>
                </tr>
            `;
        });
        pctTbody.innerHTML = pctHtml;

        if (pctTfoot) {
            const totActPct = totalSys > 0 ? ((stats.active / totalSys) * 100).toFixed(0) : 0;
            const totSetPct = totalSys > 0 ? ((stats.settle / totalSys) * 100).toFixed(0) : 0;
            const totNoSetPct = totalSys > 0 ? ((stats.close / totalSys) * 100).toFixed(0) : 0;
            const totPenPct = totalSys > 0 ? ((stats.pending / totalSys) * 100).toFixed(0) : 0;
            pctTfoot.innerHTML = `
                <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1;">
                    <td colspan="2" style="padding: 12px 16px; text-align: left; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; font-size: 13px; font-weight: normal; color: #1e3a8a; border-right: 1px solid #cbd5e1;">
                        <i class="fa-solid fa-calculator" style="margin-right: 6px; color: #2563eb;"></i> សរុបមធ្យម (Total Average)
                    </td>
                    <td style="padding: 12px; font-weight: 800; color: #1e293b; background: #e2e8f0; border-right: 1px solid #cbd5e1;">100%</td>
                    <td style="padding: 12px; font-weight: 800; color: #2563eb; border-right: 1px solid #cbd5e1;">${totActPct}%</td>
                    <td style="padding: 12px; font-weight: 800; color: #10b981; border-right: 1px solid #cbd5e1;">${totSetPct}%</td>
                    <td style="padding: 12px; font-weight: 800; color: #ef4444; border-right: 1px solid #cbd5e1;">${totNoSetPct}%</td>
                    <td style="padding: 12px; font-weight: 800; color: #d97706;">${totPenPct}%</td>
                </tr>
            `;
        }
    }

    // 2. Assessment Evaluation Matrix Table (Table 3 - Excel Template)
    if (evalTbody && typeof CASE_CATEGORIES !== 'undefined') {
        const evalBaselineMap = typeof EVAL_BASELINE_MAP !== 'undefined' ? EVAL_BASELINE_MAP : {};

        const getBadge = (val) => {
            if (!val || val === '-' || val === 'undefined') return `<span style="color: #94a3b8; font-weight: 700;">-</span>`;
            if (val === 'ច្រើនណាស់') return `<span class="badge" style="background: #fef08a; color: #854d0e; border: 1px solid #facc15; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-fire text-warning"></i> ច្រើនណាស់</span>`;
            if (val === 'ច្រើន') return `<span class="badge" style="background: #fef9c3; color: #a16207; border: 1px solid #fde047; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-arrow-trend-up"></i> ច្រើន</span>`;
            if (val === 'ល្មម') return `<span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">= ល្មម</span>`;
            if (val === 'តិច') return `<span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-arrow-trend-down"></i> តិច</span>`;
            if (val === 'ល្អណាស់') return `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> ល្អណាស់</span>`;
            if (val === 'ល្អ') return `<span class="badge" style="background: #fef9c3; color: #a16207; border: 1px solid #fde047; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check"></i> ល្អ</span>`;
            if (val === 'ល្អបង្គួរ') return `<span class="badge" style="background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-thumbs-up"></i> ល្អបង្គួរ</span>`;
            if (val === 'មធ្យម') return `<span class="badge" style="background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">មធ្យម</span>`;
            if (val === 'មិនល្អ') return `<span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> មិនល្អ</span>`;
            if (val.includes('លឿនណាស់')) return `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-bolt text-success"></i> ${val}</span>`;
            if (val.includes('លឿន')) return `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check text-success"></i> ${val}</span>`;
            if (val.includes('យឺត')) return `<span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-triangle-exclamation text-danger"></i> ${val}</span>`;
            return `<span class="badge" style="background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 12px; font-weight: 700;">${val}</span>`;
        };

        let evalHtml = '';
        CASE_CATEGORIES.forEach((cat, idx) => {
            const b = evalBaselineMap[cat] || (typeof DEFAULT_EXCEL_EVAL_BASELINE !== 'undefined' ? DEFAULT_EXCEL_EVAL_BASELINE[cat] : null) || { total: 'ល្មម', active: '-', settle: 'ល្អ', close: '-', pending: '-', time: 'មធ្យម' };
            const vTotal = b.total || b.count || '-';
            const vActive = b.active || b.resp || '-';
            const vSettle = b.settle || b.nego || '-';
            const vClose = b.close || b.emp || '-';
            const vPending = b.pending || b.spirit || '-';
            const vTime = b.time || '-';

            evalHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='white';">
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${idx + 1}</td>
                    <td style="text-align: left; padding: 10px 16px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0;"><i class="fa-regular fa-folder text-primary" style="margin-right: 6px;"></i> ${cat}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(vTotal)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(vActive)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(vSettle)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(vClose)}</td>
                    <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${getBadge(vPending)}</td>
                    <td style="padding: 10px;">${getBadge(vTime)}</td>
                </tr>
            `;
        });
        evalTbody.innerHTML = evalHtml;

        if (evalTfoot) {
            evalTfoot.innerHTML = `
                <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1;">
                    <td colspan="2" style="padding: 12px 16px; text-align: left; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; font-size: 13px; font-weight: normal; color: #0f172a; border-right: 1px solid #cbd5e1;">
                        <i class="fa-solid fa-calculator" style="margin-right: 6px; color: #2563eb;"></i> សរុប (Overall Assessment)
                    </td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្មម')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អ')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អណាស់')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('ល្អ')}</td>
                    <td style="padding: 12px; border-right: 1px solid #cbd5e1;">${getBadge('មិនល្អ')}</td>
                    <td style="padding: 12px;">${getBadge('យឺត')}</td>
                </tr>
            `;
        }
    }
    renderOutcomePercentageRecommendations(stats);
    renderEvaluationMatrixInterpretation(stats);
}

/**
 * PART 1: Dynamic Strategic Recommendations for Outcome Percentage Analysis
 */
function renderOutcomePercentageRecommendations(stats) {
    const el = document.getElementById('eval-percentage-recommendation-box');
    if (!el) return;

    const totalSys = stats.total || (typeof casesData !== 'undefined' ? casesData.length : 1);
    const totSetPct = totalSys > 0 ? ((stats.settle / totalSys) * 100) : 0;
    const totClosePct = totalSys > 0 ? ((stats.close / totalSys) * 100) : 0;
    const totActPct = totalSys > 0 ? ((stats.active / totalSys) * 100) : 0;
    const totPenPct = totalSys > 0 ? ((stats.pending / totalSys) * 100) : 0;

    // Benchmark targets:
    // 1. ព្រមព្រៀង >= 35%
    // 2. មិនព្រមព្រៀង/បិទ >= 20%
    // 3. កំពុងសម្រុះសម្រួល <= 35%
    // 4. តម្កល់ <= 15%
    const isSettleGood = totSetPct >= 35;
    const isCloseGood = totClosePct >= 20;
    const isActiveGood = totActPct <= 35;
    const isPendingGood = totPenPct <= 15;

    const isAllTargetsMet = isSettleGood && isCloseGood && isActiveGood && isPendingGood;

    // Scan individual categories to find specific category names
    const highPendingCats = [];
    const highActiveCats = [];
    const lowSettleCats = [];

    if (typeof CASE_CATEGORIES !== 'undefined' && typeof casesData !== 'undefined') {
        CASE_CATEGORIES.forEach(cat => {
            const catCases = casesData.filter(c => c.category === cat);
            const catLen = catCases.length;
            if (catLen > 0) {
                const penCount = catCases.filter(c => c.status.startsWith('Pending') || c.status.includes('តម្កល់') || c.status.includes('ផ្អាក')).length;
                const actCount = catCases.filter(c => c.status.startsWith('Active') || (c.status.includes('កំពុង') && !c.status.includes('តម្កល់'))).length;
                const setCount = catCases.filter(c => c.status.startsWith('Settle') || (c.status.includes('ព្រមព្រៀង') && !c.status.includes('មិនព្រមព្រៀង'))).length;

                const pPct = (penCount / catLen) * 100;
                const aPct = (actCount / catLen) * 100;
                const sPct = (setCount / catLen) * 100;

                if (pPct > 15) highPendingCats.push(cat);
                if (aPct > 35) highActiveCats.push(cat);
                if (sPct < 35) lowSettleCats.push(cat);
            }
        });
    }

    if (!isAllTargetsMet) {
        // ករណីទី១៖ មិនទាន់គ្រប់គោលដៅទាំង ៤
        const resolvedTotalPct = totSetPct + totClosePct;
        const isCritical = resolvedTotalPct < 30;
        const themeColor = isCritical ? '#dc2626' : '#d97706';
        const badgeBg = isCritical ? '#fee2e2' : '#fef3c7';
        const badgeBorder = isCritical ? '#fca5a5' : '#fcd34d';
        const badgeText = isCritical ? 'សមាមាត្រលទ្ធផលខ្សោយខ្លាំង' : 'សមាមាត្រលទ្ធផលតាមប្រភេទវិវាទមិនទាន់ល្អ';
        const cardClass = isCritical ? 'eval-rec-card eval-rec-danger' : 'eval-rec-card eval-rec-warning';
        const iconName = isCritical ? 'fa-circle-radiation' : 'fa-triangle-exclamation';

        // Build dynamic action items
        const items = [];

        // 1. បើអត្រាតម្កល់ > 15%
        if (!isPendingGood || totPenPct > 15) {
            const catText = highPendingCats.length ? highPendingCats.join(', ') : 'វិវាទដីធ្លី, វិវាទកិច្ចសន្យា';
            items.push({
                icon: 'fa-arrow-right',
                text: `<strong>[អត្រាតម្កល់លើសកម្រិត (${totPenPct.toFixed(0)}% > ១៥%)]៖</strong> ពិនិត្យសើរើសំណុំរឿងដែលបាន «តម្កល់» លើសកម្រិត (១៥%) ជាពិសេសលើប្រភេទវិវាទដែលមានអត្រាតម្កល់ខ្ពស់ (ដូចជា <strong>${catText}</strong>) ដើម្បីទាញយកមកសម្រុះសម្រួលបន្ត ឬធ្វើរបាយការណ៍បិទបញ្ចប់។`
            });
        }

        // 2. បើអត្រាបិទ/មិនព្រមព្រៀង < 20%
        if (!isCloseGood || totClosePct < 20) {
            items.push({
                icon: 'fa-arrow-right',
                text: `<strong>[អត្រាបិទសំណុំរឿងទាប (${totClosePct.toFixed(0)}% < ២០%)]៖</strong> ពន្លឿនការធ្វើរបាយការណ៍បិទសំណុំរឿងឱ្យបានចាប់ពី ២០% ឡើងទៅ ចំពោះសំណុំរឿងដែលភាគីមិនចូលរួម ភាគីដកពាក្យ ឬមិនអាចព្រមព្រៀងគ្នា ជាជាងទុកក្នុងស្ថានភាពតម្កល់ ឬកំពុងសម្រុះសម្រួលយូរ។`
            });
        }

        // 3. បើអត្រាកំពុងសម្រុះសម្រួល > 35%
        if (!isActiveGood || totActPct > 35) {
            const catText = highActiveCats.length ? highActiveCats.join(', ') : 'វិវាទជំពាក់ប្រាក់, វិវាទដីធ្លី';
            items.push({
                icon: 'fa-arrow-right',
                text: `<strong>[អត្រាកំពុងសម្រុះសម្រួលនៅខ្ពស់ (${totActPct.toFixed(0)}% > ៣៥%)]៖</strong> ជំរុញដាក់កម្មវិធីប្រជុំដោះស្រាយឱ្យបានលឿនលើប្រភេទវិវាទដែលមានអត្រា «កំពុងសម្រុះសម្រួល» ខ្ពស់លើស ៣៥% (ដូចជា <strong>${catText}</strong>) ដើម្បីបំប្លែងទៅជាលទ្ធផលព្រមព្រៀង ឬបិទបញ្ចប់។`
            });
        }

        // 4. បើអត្រាព្រមព្រៀង < 35%
        if (!isSettleGood || totSetPct < 35) {
            const catText = lowSettleCats.length ? lowSettleCats.join(', ') : 'វិវាទពាណិជ្ជកម្ម, វិវាទមត៌ក';
            items.push({
                icon: 'fa-arrow-right',
                text: `<strong>[អត្រាព្រមព្រៀងទាបជាងស្តង់ដារ (${totSetPct.toFixed(0)}% < ៣៥%)]៖</strong> ពង្រឹងបច្ចេកទេសសម្រុះសម្រួល និងការទំនាក់ទំនងជាមុនជាមួយភាគីវិវាទ លើប្រភេទវិវាទដែលមានអត្រាព្រមព្រៀងទាបជាង ៣៥% (ដូចជា <strong>${catText}</strong>) ដើម្បីជំរុញអត្រាព្រមព្រៀងឱ្យសម្រេចបានចាប់ពី ៣៥% ឡើងទៅ។`
            });
        }

        // Fallback
        if (items.length === 0) {
            items.push({
                icon: 'fa-arrow-right',
                text: `បន្តតាមដាន និងរក្សាអត្រាព្រមព្រៀងឱ្យបានលើសពី ៣៥% និងអត្រាបិទសំណុំរឿងឱ្យបានលើសពី ២០% ដើម្បីធានាសមតុល្យចំណាត់ការល្អ។`
            });
        }

        let itemsHtml = items.map(item => `
            <div style="background: white; border: 1px solid ${badgeBorder}; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <i class="fa-solid ${item.icon}" style="margin-top: 4px; font-size: 14px; color: ${themeColor};"></i>
                <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">${item.text}</span>
            </div>
        `).join('');

        el.className = `card-panel mb-4 ${cardClass}`;
        el.innerHTML = `
            <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid ${badgeBorder}; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: ${badgeBg}; color: ${themeColor}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="fa-solid ${iconName}"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: ${themeColor}; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                            ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ (តាមប្រភេទវិវាទ)
                        </h4>
                        <span style="font-size: 12.5px; color: #64748b; font-weight: 600;">ផ្អែកលើជួរ «សរុបមធ្យម» នៃតារាងវិភាគតាមប្រភេទវិវាទនីមួយៗ (ព្រមព្រៀង ${totSetPct.toFixed(0)}% | បិទ ${totClosePct.toFixed(0)}% | កំពុងសម្រុះសម្រួល ${totActPct.toFixed(0)}% | តម្កល់ ${totPenPct.toFixed(0)}%)</span>
                    </div>
                </div>
                <div>
                    <span class="badge" style="background: ${badgeBg}; color: ${themeColor}; border: 1.5px solid ${badgeBorder}; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid ${iconName}"></i> ${badgeText}
                    </span>
                </div>
            </div>
            <div class="eval-rec-body">
                <div style="font-size: 14.5px; font-weight: 700; color: ${themeColor}; margin-bottom: 12px; line-height: 1.6;">
                    + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគួរកែសម្រួលចំណាត់ការសំណុំរឿងតាមប្រភេទវិវាទឱ្យបានល្អជាងនេះ ទើបល្អ ដោយព្យាយាមរក្សាអត្រាព្រមព្រៀងចាប់ពី ៣៥% ឡើងទៅ និងអត្រាបិទសំណុំរឿងចាប់ពី ២០% ឡើងទៅ (ក្នុងក្រុមចាត់ការរួចរាល់) ព្រមទាំងគ្រប់គ្រងអត្រាកំពុងសម្រុះសម្រួលក្នុងកម្រិត ៣៥% និងអត្រាតម្កល់ក្នុងកម្រិត ១៥% តាមរយៈការអនុវត្តដូចខាងក្រោម៖
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    } else {
        // ករណីទី២៖ គ្រប់គោលដៅទាំង ៤
        el.className = 'card-panel mb-4 eval-rec-card eval-rec-success';
        el.innerHTML = `
            <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #bbf7d0; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: #065f46; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                            ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ (តាមប្រភេទវិវាទ)
                        </h4>
                        <span style="font-size: 12.5px; color: #166534; font-weight: 600;">ផ្អែកលើជួរ «សរុបមធ្យម» នៃតារាងវិភាគតាមប្រភេទវិវាទនីមួយៗ (សម្រេចបានតាមគោលដៅស្តង់ដារ)</span>
                    </div>
                </div>
                <div>
                    <span class="badge" style="background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-medal"></i> សមាមាត្រលទ្ធផលតាមប្រភេទវិវាទល្អ
                    </span>
                </div>
            </div>
            <div class="eval-rec-body">
                <div style="font-size: 14.5px; font-weight: 700; color: #15803d; margin-bottom: 12px; line-height: 1.6;">
                    + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគ្រប់គ្រងសមាមាត្រលទ្ធផលសំណុំរឿងតាមប្រភេទវិវាទបានល្អប្រសើរ ស្របតាមគោលដៅស្តង់ដារ (ព្រមព្រៀង ≥ ៣៥%, បិទ ≥ ២០%, កំពុងសម្រុះសម្រួល ≤ ៣៥%, និងតម្កល់ ≤ ១៥%)។ សូមបន្តរក្សាប្រសិទ្ធភាពនេះតាមរយៈការអនុវត្តដូចខាងក្រោម៖
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                        <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">បន្តរក្សាល្បឿននៃការដោះស្រាយលើប្រភេទវិវាទដែលមានសមាមាត្រសំណុំរឿងច្រើនជាងគេ ដើម្បីកុំឱ្យអត្រាកំពុងសម្រុះសម្រួលកើនលើស ៣៥%។</span>
                    </div>
                    <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                        <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">ត្រួតពិនិត្យសំណុំរឿងតម្កល់ជាប្រចាំ ដើម្បីរក្សាអត្រាតម្កល់ឱ្យស្ថិតក្រោម ១៥% ជានិច្ច។</span>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * PART 2: Dynamic Strategic Recommendations for Evaluation Matrix Table
 */
function renderEvaluationMatrixInterpretation(stats) {
    const el = document.getElementById('eval-matrix-recommendation-box') || document.getElementById('analytics-interpretation-content');
    if (!el) return;

    // Check footer values in EVAL_BASELINE_MAP or default values
    const evalBaselineMap = typeof EVAL_BASELINE_MAP !== 'undefined' ? EVAL_BASELINE_MAP : {};
    
    // Overall Assessment values matching Excel template
    // In template: total: 'ល្មម', active: 'ល្អ', settle: 'ល្អណាស់', close: 'ល្អ', pending: 'មិនល្អ', time: 'យឺត'
    const overallTotal = 'ល្មម';
    const overallActive = 'ល្អ';
    const overallSettle = 'ល្អណាស់';
    const overallClose = 'ល្អ';
    const overallPending = 'មិនល្អ';
    const overallTime = 'យឺត';

    // Count of 'មិនល្អ' and check if time is 'យឺត'
    const overallParts = [overallActive, overallSettle, overallClose, overallPending];
    const poorCount = overallParts.filter(p => p === 'មិនល្អ').length;
    const isSlow = overallTime.includes('យឺត');
    const hasIssues = poorCount > 0 || isSlow;

    // Categories with specific traits
    const highVolCats = [];
    const slowCats = [];
    const poorPendingCats = [];
    const poorSettleCats = [];

    if (typeof CASE_CATEGORIES !== 'undefined') {
        CASE_CATEGORIES.forEach(cat => {
            const b = evalBaselineMap[cat] || (typeof DEFAULT_EXCEL_EVAL_BASELINE !== 'undefined' ? DEFAULT_EXCEL_EVAL_BASELINE[cat] : null);
            if (b) {
                const totalVal = b.total || b.count || '';
                const timeVal = b.time || '';
                const pendingVal = b.pending || b.spirit || '';
                const activeVal = b.active || b.resp || '';
                const settleVal = b.settle || b.nego || '';
                const closeVal = b.close || b.emp || '';

                if (totalVal === 'ច្រើន' || totalVal === 'ច្រើនណាស់') highVolCats.push(cat);
                if (timeVal.includes('យឺត')) slowCats.push(cat);
                if (pendingVal === 'មិនល្អ' || pendingVal === 'មធ្យម' || activeVal === 'មិនល្អ' || activeVal === 'មធ្យម') poorPendingCats.push(cat);
                if (settleVal === 'មិនល្អ' || settleVal === 'មធ្យម' || closeVal === 'មិនល្អ' || closeVal === 'មធ្យម') poorSettleCats.push(cat);
            }
        });
    }

    if (hasIssues) {
        // ករណីទី១៖ មាន «មិនល្អ» ឬ រយៈពេល «យឺត»
        const isCritical = poorCount >= 2;
        const themeColor = isCritical ? '#dc2626' : '#d97706';
        const badgeBg = isCritical ? '#fee2e2' : '#fef3c7';
        const badgeBorder = isCritical ? '#fca5a5' : '#fcd34d';
        const badgeText = isCritical ? 'ប្រសិទ្ធភាព និងល្បឿនចំណាត់ការសំណុំរឿងមិនល្អខ្លាំង' : 'ប្រសិទ្ធភាព និងល្បឿនចំណាត់ការសំណុំរឿងមិនទាន់ល្អ';
        const cardClass = isCritical ? 'eval-rec-card eval-rec-danger' : 'eval-rec-card eval-rec-warning';
        const iconName = isCritical ? 'fa-circle-radiation' : 'fa-triangle-exclamation';

        const items = [];

        // 1. បើមានប្រភេទវិវាទដែលមានបរិមាណ «ច្រើន» ឬ «ច្រើនណាស់»
        if (highVolCats.length > 0) {
            items.push({
                icon: 'fa-folder-tree',
                text: `<strong>[ប្រភេទវិវាទមានសំណុំរឿងច្រើន]៖</strong> រៀបចំផែនការការងារប្រចាំសប្តាហ៍ ដោយផ្តល់អាទិភាពដោះស្រាយមុនគេលើប្រភេទវិវាទដែលអ្នកមានសំណុំរឿងច្រើន (<strong>${highVolCats.join(', ')}</strong>) ដើម្បីកាត់បន្ថយការកកស្ទះសំណុំរឿងក្នុងដៃរបស់អ្នក។`
            });
        }

        // 2. បើរយៈពេលដោះស្រាយស្ថិតក្នុងកម្រិត «យឺត»
        if (isSlow || slowCats.length > 0) {
            const catText = slowCats.length ? slowCats.join(', ') : 'វិវាទដីធ្លី, វិវាទគ្រួសារ, វិវាទជំពាក់ប្រាក់';
            items.push({
                icon: 'fa-clock',
                text: `<strong>[រយៈពេលដោះស្រាយយឺត]៖</strong> ពន្លឿននីតិវិធីចាត់ការលើប្រភេទវិវាទដែលមានរយៈពេលដោះស្រាយ «យឺត» (<strong>${catText}</strong>) ដោយកំណត់ថ្ងៃណាត់ជួបភាគី ថ្ងៃប្រមូលឯកសារ និងថ្ងៃដាក់កម្មវិធីប្រជុំឱ្យបានលឿន កាត់បន្ថយការពន្យារពេលប្រជុំច្រើនដង។`
            });
        }

        // 3. បើផ្នែក «តម្កល់» ឬ «កំពុងសម្រុះសម្រួល» ទទួលបាន «មិនល្អ / ល្មមបង្គួរ»
        if (overallPending === 'មិនល្អ' || poorPendingCats.length > 0) {
            const catText = poorPendingCats.length ? poorPendingCats.join(', ') : 'វិវាទដីធ្លី, វិវាទកិច្ចសន្យា, វិវាទពាណិជ្ជកម្ម';
            items.push({
                icon: 'fa-folder-closed',
                text: `<strong>[ផ្នែកតម្កល់/កំពុងសម្រុះសម្រួលនៅមានបញ្ហា]៖</strong> ពិនិត្យសើរើសំណុំរឿងដែលអ្នកបានតម្កល់ទុក ឬកំពុងសម្រុះសម្រួលយូរ (<strong>${catText}</strong>) ដើម្បីកោះហៅភាគីមកដោះស្រាយបញ្ចប់ ឬធ្វើរបាយការណ៍បិទសំណុំរឿងភ្លាមប្រសិនបើភាគីមិនសហការ។`
            });
        }

        // 4. បើផ្នែក «ព្រមព្រៀង» ឬ «មិនព្រមព្រៀង» ទទួលបាន «មិនល្អ / ល្មមបង្គួរ»
        if (poorSettleCats.length > 0 || highVolCats.length > 0) {
            const catText = poorSettleCats.length ? poorSettleCats.join(', ') : 'វិវាទពាណិជ្ជកម្ម, វិវាទមត៌ក';
            items.push({
                icon: 'fa-handshake',
                text: `<strong>[ពង្រឹងគុណភាពផ្សះផ្សា និងការបិទសំណុំរឿង]៖</strong> សិក្សាអង្គហេតុឱ្យស៊ីជម្រៅ និងទំនាក់ទំនងពិគ្រោះយោបល់ជាមួយភាគីវិវាទជាមុន (Pre-mediation) មុនពេលដាក់ប្រជុំ ដើម្បីបង្កើនលទ្ធភាពព្រមព្រៀង និងត្រូវធ្វើរបាយការណ៍បិទឱ្យទាន់ពេលវេលាចំពោះសំណុំរឿងដែលអស់លទ្ធភាពផ្សះផ្សា (<strong>${catText}</strong>)។`
            });
        }

        let itemsHtml = items.map(item => `
            <div style="background: white; border: 1px solid ${badgeBorder}; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <i class="fa-solid ${item.icon}" style="margin-top: 4px; font-size: 14px; color: ${themeColor};"></i>
                <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">${item.text}</span>
            </div>
        `).join('');

        el.className = `card-panel mt-4 mb-4 ${cardClass}`;
        el.innerHTML = `
            <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid ${badgeBorder}; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: ${badgeBg}; color: ${themeColor}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="fa-solid ${iconName}"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: ${themeColor}; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                            ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ (ផ្អែកតាមតារាង Evaluation Matrix)
                        </h4>
                        <span style="font-size: 12.5px; color: #64748b; font-weight: 600;">លទ្ធផលវាយតម្លៃរួម៖ សរុប [ល្មម] | កំពុងសម្រុះសម្រួល [ល្អ] | ព្រមព្រៀង [ល្អណាស់] | មិនព្រមព្រៀង [ល្អ] | តម្កល់ [មិនល្អ] | រយៈពេល [យឺត]</span>
                    </div>
                </div>
                <div>
                    <span class="badge" style="background: ${badgeBg}; color: ${themeColor}; border: 1.5px solid ${badgeBorder}; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid ${iconName}"></i> ${badgeText}
                    </span>
                </div>
            </div>
            <div class="eval-rec-body">
                <div style="font-size: 14.5px; font-weight: 700; color: ${themeColor}; margin-bottom: 12px; line-height: 1.6;">
                    + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគួរពង្រឹងចំណាត់ការសំណុំរឿងតាមប្រភេទវិវាទ និងពន្លឿនរយៈពេលដោះស្រាយរបស់អ្នកឱ្យបានល្អជាងនេះ ទើបល្អ ដោយផ្តោតការកែលម្អលើផ្នែកដែលទទួលបានចំណាត់ថ្នាក់ «មិនល្អ» និងរយៈពេលដោះស្រាយ «យឺត» តាមរយៈការអនុវត្តដូចខាងក្រោម៖
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    ${itemsHtml}
                </div>

                <!-- Matrix Summary Banner with Strategic Plan Link -->
                <div style="margin-top: 16px; padding: 14px 18px; background: white; border-radius: 10px; border: 1px dashed #cbd5e1; font-size: 13.5px; color: #1e3a8a; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong style="font-size: 13.5px;"><i class="fa-solid fa-chart-line text-primary"></i> សន្ទស្សន៍សរុប (Overall Assessment):</strong>
                        <span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; padding: 3px 8px; border-radius: 10px; font-weight: 700;">សរុប [ល្មម]</span>
                        <span class="badge" style="background: #fef9c3; color: #a16207; border: 1px solid #fde047; padding: 3px 8px; border-radius: 10px; font-weight: 700;">កំពុងសម្រុះសម្រួល [ល្អ]</span>
                        <span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 3px 8px; border-radius: 10px; font-weight: 700;">ព្រមព្រៀង [ល្អណាស់]</span>
                        <span class="badge" style="background: #fef9c3; color: #a16207; border: 1px solid #fde047; padding: 3px 8px; border-radius: 10px; font-weight: 700;">មិនព្រមព្រៀង [ល្អ]</span>
                        <span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 3px 8px; border-radius: 10px; font-weight: 700;">តម្កល់ [មិនល្អ]</span>
                        <span class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 3px 8px; border-radius: 10px; font-weight: 700;">រយៈពេល [យឺត]</span>
                    </div>
                    
                </div>
            </div>
        `;
    } else {
        // ករណីទី២៖ គ្រប់ផ្នែកទទួលបាន «ល្អ / ល្អណាស់» និងរយៈពេល «លឿន / លឿនណាស់»
        el.className = 'card-panel mt-4 mb-4 eval-rec-card eval-rec-success';
        el.innerHTML = `
            <div class="eval-rec-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #bbf7d0; padding-bottom: 14px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: normal; color: #065f46; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif;">
                            ការវាយតម្លៃលទ្ធផល និងអនុសាសន៍យុទ្ធសាស្ត្រ (ផ្អែកតាមតារាង Evaluation Matrix)
                        </h4>
                        <span style="font-size: 12.5px; color: #166534; font-weight: 600;">លទ្ធផលវាយតម្លៃរួម៖ គ្រប់ផ្នែកសម្រេចបានកម្រិតល្អប្រសើរ និងលឿន</span>
                    </div>
                </div>
                <div>
                    <span class="badge" style="background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; padding: 6px 14px; border-radius: 20px; font-size: 13.5px; font-weight: normal; font-family: 'Khmer OS Muol Light', 'Khmer OS Muol', 'Moul', sans-serif; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-medal"></i> ប្រសិទ្ធភាព និងល្បឿនចំណាត់ការសំណុំរឿងល្អប្រសើរ
                    </span>
                </div>
            </div>
            <div class="eval-rec-body">
                <div style="font-size: 14.5px; font-weight: 700; color: #15803d; margin-bottom: 12px; line-height: 1.6;">
                    + អនុសាសន៍សម្រាប់អ្នក៖ អ្នកគ្រប់គ្រងសំណុំរឿងតាមប្រភេទវិវាទ និងរយៈពេលដោះស្រាយបានល្អប្រសើរ ទាំងគុណភាពនៃការផ្សះផ្សា និងល្បឿននៃការចាត់ការ។ សូមបន្តរក្សាប្រសិទ្ធភាពការងាររបស់អ្នកតាមរយៈការអនុវត្តដូចខាងក្រោម៖
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                        <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">បន្តអនុវត្តតាមកាលវិភាគដោះស្រាយសំណុំរឿងឱ្យបានទៀងទាត់ ដើម្បីរក្សាល្បឿនដោះស្រាយក្នុងកម្រិត «លឿន» គ្រប់ប្រភេទវិវាទ។</span>
                    </div>
                    <div style="background: white; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                        <i class="fa-solid fa-circle-check text-success" style="margin-top: 3px; font-size: 15px;"></i>
                        <span style="font-size: 13.5px; color: #1f2937; line-height: 1.7; font-weight: 500;">បន្តយកចិត្តទុកដាក់លើប្រភេទវិវាទដែលអ្នកមានសំណុំរឿងច្រើន ដើម្បីធានាថាអត្រាសម្រុះសម្រួលជោគជ័យនៅតែខ្ពស់ និងមិនមានសំណុំរឿងតម្កល់កកស្ទះ។</span>
                    </div>
                </div>
            </div>
        `;
    }
}
/**
 * Strategic Plan View Initialization & Render (Request 5)
 */
function renderStrategicPlanView() {
    initStrategicPlanTabs();
    
    const activeTab = document.querySelector('#strategic-plan-view .strat-tab-btn.active');
    const targetId = activeTab ? activeTab.getAttribute('data-target') : 'strat-tab-plan';
    
    if (targetId === 'strat-tab-strategy') {
        renderStrategicRecommendations();
    } else {
        renderActionPlans();
    }
}

let strategicPlanTabsInitialized = false;
function initStrategicPlanTabs() {
    if (strategicPlanTabsInitialized) return;
    const tabBtns = document.querySelectorAll('#strategic-plan-view .strat-tab-btn');
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
        const isDarkInit = document.documentElement.classList.contains('dark-theme');
    btn.innerHTML = isDarkInit ? `<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>` : `<i class="fa-solid fa-moon"></i>`;

    btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = '#f1f5f9';
                b.style.color = '#475569';
                b.style.boxShadow = 'none';
            });
            btn.classList.add('active');
            btn.style.background = '#2563eb';
            btn.style.color = '#ffffff';
            btn.style.boxShadow = '0 2px 6px rgba(37,99,235,0.2)';

            const targetId = btn.getAttribute('data-target');
            document.querySelectorAll('#strategic-plan-view .strat-tab-content').forEach(content => {
                content.style.display = 'none';
            });
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.style.display = 'block';

            if (targetId === 'strat-tab-strategy') {
                renderStrategicRecommendations();
            } else if (targetId === 'strat-tab-plan') {
                renderActionPlans();
            }
        });
    });
    strategicPlanTabsInitialized = true;
}

/**
 * Action Plans Management (localStorage: nadr_strategic_action_plans)
 */
function getActionPlans() {
    const stored = localStorage.getItem('nadr_strategic_action_plans');
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { }
    }
    const defaultPlans = [
        { id: 1, target: 'យុទ្ធសាស្ត្រអត្រាព្រមព្រៀង (Settle Rate)', action: 'ពង្រឹងនីតិវិធីប្រជុំសម្រុះសម្រួលកម្រិតមូលដ្ឋានឱ្យបានយ៉ាងតិច ២ លើក មុននឹងសម្រេចបិទ ឬតម្កល់', date: '២០២៦-០៨-១៥', status: 'កំពុងអនុវត្ត' },
        { id: 2, target: 'យុទ្ធសាស្ត្រកំពុងសម្រុះសម្រួល (Active Rate)', action: 'ចុះពិនិត្យទីតាំង និងវាស់វែងជាក់ស្តែងលើករណីវិវាទដីធ្លីដែលកកស្ទះលើសពី ២០ ថ្ងៃ', date: '២០២៦-០៨-២០', status: 'កំពុងអនុវត្ត' },
        { id: 3, target: 'យុទ្ធសាស្ត្រតម្កល់/ផ្អាក (Pending Rate)', action: 'ទំនាក់ទំនងភាគីទាំងពីរឡើងវិញដើម្បីពិនិត្យលទ្ធភាពផ្សះផ្សាលើករណីដែលបានផ្អាកបណ្តោះអាសន្ន', date: '២០២៦-០៨-៣០', status: 'សម្រេចបានរួចរាល់' }
    ];
    localStorage.setItem('nadr_strategic_action_plans', JSON.stringify(defaultPlans));
    return defaultPlans;
}

function renderActionPlans() {
    const tbody = document.getElementById('action-plan-tbody');
    if (!tbody) return;

    const plans = getActionPlans();
    if (plans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">ពុំទាន់មានផែនការសកម្មភាពនៅឡើយ សូមចុចប៊ូតុង «បន្ថែមផែនការថ្មី»</td></tr>`;
        return;
    }

    let html = '';
    plans.forEach((p, idx) => {
        let statusBadge = '';
        if (p.status === 'សម្រេចបានរួចរាល់') {
            statusBadge = `<span class="badge" style="background: #dcfce7; color: #15803d; padding: 4px 10px; font-weight: 700; border-radius: 20px;"><i class="fa-solid fa-check-circle"></i> ${p.status}</span>`;
        } else if (p.status === 'ពន្យារពេល/បន្ត') {
            statusBadge = `<span class="badge" style="background: #fef9c3; color: #a16207; padding: 4px 10px; font-weight: 700; border-radius: 20px;"><i class="fa-solid fa-clock"></i> ${p.status}</span>`;
        } else {
            statusBadge = `<span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; font-weight: 700; border-radius: 20px;"><i class="fa-solid fa-spinner fa-spin" style="animation-duration: 3s;"></i> ${p.status}</span>`;
        }

        html += `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;">
                <td style="padding: 12px; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td style="padding: 12px; font-weight: 700; color: #1e3a8a;">${p.target}</td>
                <td style="padding: 12px; color: #334155; line-height: 1.6;">${p.action}</td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: #475569;">${p.date || '-'}</td>
                <td style="padding: 12px; text-align: center; cursor: pointer;" onclick="toggleActionPlanStatus(${p.id})" title="ចុចដើម្បីប្តូរស្ថានភាព">${statusBadge}</td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn-action edit" onclick="editActionPlan(${p.id})" title="កែសម្រួល" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 10px; border-radius: 6px; margin-right: 4px; cursor: pointer;"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action delete" onclick="deleteActionPlan(${p.id})" title="លុបចោល" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function openNewActionPlanModal() {
    document.getElementById('plan-modal-id').value = '';
    document.getElementById('plan-modal-action').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('plan-modal-date').value = today;
    document.getElementById('plan-modal-status').value = 'កំពុងអនុវត្ត';
    document.getElementById('action-plan-modal').classList.add('active');
}

function closeActionPlanModal() {
    document.getElementById('action-plan-modal').classList.remove('active');
}

function editActionPlan(id) {
    const plans = getActionPlans();
    const p = plans.find(item => item.id === id);
    if (!p) return;

    document.getElementById('plan-modal-id').value = p.id;
    document.getElementById('plan-modal-target').value = p.target;
    document.getElementById('plan-modal-action').value = p.action;
    document.getElementById('plan-modal-date').value = p.date || '';
    document.getElementById('plan-modal-status').value = p.status || 'កំពុងអនុវត្ត';
    document.getElementById('action-plan-modal').classList.add('active');
}

function saveActionPlan() {
    const idVal = document.getElementById('plan-modal-id').value;
    const target = document.getElementById('plan-modal-target').value;
    const action = document.getElementById('plan-modal-action').value.trim();
    const date = document.getElementById('plan-modal-date').value;
    const status = document.getElementById('plan-modal-status').value;

    if (!action) {
        showToast('សូមបញ្ចូលសកម្មភាពផែនការការងារ!', 'warning');
        return;
    }

    let plans = getActionPlans();
    if (idVal) {
        const idx = plans.findIndex(item => item.id === parseInt(idVal));
        if (idx !== -1) {
            plans[idx] = { id: parseInt(idVal), target, action, date, status };
        }
    } else {
        const newId = plans.length > 0 ? Math.max(...plans.map(item => item.id || 0)) + 1 : 1;
        plans.push({ id: newId, target, action, date, status });
    }

    localStorage.setItem('nadr_strategic_action_plans', JSON.stringify(plans));
    closeActionPlanModal();
    renderActionPlans();
    showToast('បានរក្សាទុកផែនការសកម្មភាពដោយជោគជ័យ!', 'success');
}

function deleteActionPlan(id) {
    if (!confirm('តើអ្នកពិតជាចង់លុបផែនការសកម្មភាពនេះមែនឬទេ?')) return;
    let plans = getActionPlans();
    plans = plans.filter(item => item.id !== id);
    localStorage.setItem('nadr_strategic_action_plans', JSON.stringify(plans));
    renderActionPlans();
    showToast('បានលុបផែនការសកម្មភាពរួចរាល់!', 'success');
}

function toggleActionPlanStatus(id) {
    let plans = getActionPlans();
    const idx = plans.findIndex(item => item.id === id);
    if (idx !== -1) {
        const current = plans[idx].status;
        if (current === 'កំពុងអនុវត្ត') plans[idx].status = 'សម្រេចបានរួចរាល់';
        else if (current === 'សម្រេចបានរួចរាល់') plans[idx].status = 'ពន្យារពេល/បន្ត';
        else plans[idx].status = 'កំពុងអនុវត្ត';
        localStorage.setItem('nadr_strategic_action_plans', JSON.stringify(plans));
        renderActionPlans();
        showToast('បានប្តូរស្ថានភាពផែនការទៅជា៖ ' + plans[idx].status, 'info');
    }
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
                    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { raw: false });

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

window.handleImportAllData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data !== 'object' || Array.isArray(data)) {
                throw new Error('ទម្រង់ JSON មិនត្រឹមត្រូវ។ ត្រូវការ Object នៃ LocalStorage។');
            }

            const keys = Object.keys(data);
            if (keys.length === 0) {
                alert('មិនមានទិន្នន័យក្នុងឯកសារនេះទេ។');
                return;
            }

            if (confirm(`អ្នកកំពុងនាំចូលទិន្នន័យទាំងអស់ពី Backup ដែលមានចំនួន ${keys.length} ផ្នែក។\nតើអ្នកពិតជាចង់សរសេរជាន់លើទិន្នន័យបច្ចុប្បន្នមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ!`)) {
                localStorage.clear();
                for (const [key, value] of Object.entries(data)) {
                    localStorage.setItem(key, value);
                }
                alert('ការនាំចូលទទួលបានជោគជ័យ! កម្មវិធីនឹងចាប់ផ្តើមឡើងវិញ។');
                location.reload();
            }
        } catch (error) {
            console.error('Import All Error:', error);
            alert('មានបញ្ហាក្នុងការអានឯកសារ JSON: ' + error.message);
        }
        event.target.value = ''; // Reset input
    };
    reader.readAsText(file);
};

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
            }, null, 'យល់ព្រមលុប');
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
    }, null, 'លុបទាំងអស់');
};

/**
 * Theme Toggle
 */
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    
    const isDarkInit = document.documentElement.classList.contains('dark-theme');
    btn.innerHTML = isDarkInit ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' : '<i class="fa-solid fa-moon"></i>';
    
    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-theme');
        localStorage.setItem('nadr_app_theme', document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light');
        const isDark = document.documentElement.classList.contains('dark-theme');
        btn.innerHTML = isDark ? '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>' : '<i class="fa-solid fa-moon"></i>';
        showToast(isDark ? 'បានប្តូរទៅ Dark Mode 🌙' : 'បានប្តូរទៅ Light Mode ☀️', 'info');
        
        if (typeof initOrUpdateCharts === 'function') {
            initOrUpdateCharts();
        }
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
        if (overlay) overlay.style.display = 'none';
        updateSidebarUser(savedName, savedRole);
    } else {
        if (overlay) overlay.style.display = 'flex';
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
            const usernameInput = document.getElementById('login-username') ? document.getElementById('login-username').value.trim() : 'admin';
            const password = document.getElementById('login-password').value.trim();
            const remember = document.getElementById('login-remember') ? document.getElementById('login-remember').checked : false;

            if (errorMsg) errorMsg.classList.add('d-none');

            // 1. Fetch valid users from LocalStorage
            let adminUsers = null;
            try {
                adminUsers = JSON.parse(localStorage.getItem('nadr_admin_users'));
            } catch (e) {
                console.error("JSON parse error for admin users:", e);
                adminUsers = null;
            }
            if (!Array.isArray(adminUsers) || adminUsers.length === 0 || !adminUsers.some(u => u.username === 'admin' && u.password)) {
                // Seed from default if missing, empty, or corrupted (missing admin or password)
                adminUsers = [
                    { username: 'admin', password: 'admin123', name: 'គណនីរដ្ឋបាល (Admin)', role: 'Super Admin (អ្នកគ្រប់គ្រងកម្មវិធី)', status: 'Active', phone: '012 345 678', email: 'admin@nadr.gov.kh' },
                    { username: 'nadr', password: '123', name: 'មន្ត្រីសម្របសម្រួល', role: 'NADR Officer (មន្ត្រីធម្មតា)', status: 'Active', phone: '012 000 000', email: 'officer@nadr.gov.kh' },
                    { username: 'user', password: 'user', name: 'អ្នកមើលការខុសត្រូវ', role: 'Viewer (ត្រឹមមើល)', status: 'Active', phone: '012 111 111', email: 'viewer@nadr.gov.kh' }
                ];
                localStorage.setItem('nadr_admin_users', JSON.stringify(adminUsers));
                // Update global variable as well
                if (typeof ADMIN_USERS !== 'undefined') {
                    ADMIN_USERS = adminUsers;
                }
            }
            
            // For now, if there is no username input field, just match password against any user
            let foundUser = null;
            if (document.getElementById('login-username')) {
                foundUser = adminUsers.find(u => u.username === usernameInput && u.password && u.password === password);
            } else {
                foundUser = adminUsers.find(u => u.password && u.password === password);
            }

            if (!foundUser) {
                if (errorMsg) {
                    errorMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមពិនិត្យម្តងទៀត។</span>';
                    errorMsg.classList.remove('d-none');
                }
                if (pwdInput) {
                    pwdInput.value = '';
                    pwdInput.focus();
                }
                return;
            }

            // Save state
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('nadr_auth_logged_in', 'true');
            storage.setItem('nadr_auth_username', foundUser.username);
            storage.setItem('nadr_auth_user_name', foundUser.name);
            storage.setItem('nadr_auth_user_role', foundUser.role);

            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '';
                }, 400);
            }
            updateSidebarUser(foundUser.name, foundUser.role);
            if (typeof logAuditAction === 'function') logAuditAction('ចូលប្រព័ន្ធ', `បានចូលប្រើប្រព័ន្ធក្នុងនាម ${foundUser.name} (${foundUser.role})`);

            // Hotfix: Force password change if using weak password
            const weakPasswords = ['admin', '123', 'admin123', 'nadr', 'nadr2026', 'user', '1234', 'password'];
            if (weakPasswords.includes(foundUser.password)) {
                setTimeout(() => {
                    const modal = document.getElementById('change-password-modal');
                    if (modal) {
                        modal.classList.add('show');
                        modal.style.display = 'block';
                    }
                }, 1000);
            }

            showToast('ចូលប្រព័ន្ធជោគជ័យ! សូមស្វាគមន៍មកកាន់ CMS Pro', 'success');
        });
    }

window.saveHotfixPassword = function() {
    const newPwd = document.getElementById('hotfix-new-password').value.trim();
    const confirmPwd = document.getElementById('hotfix-confirm-password').value.trim();
    
    if (newPwd.length < 8) {
        alert('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ!');
        return;
    }
    const weakList = ['admin', '123', 'admin123', 'nadr', 'nadr2026', 'password', '12345678'];
    if (weakList.includes(newPwd)) {
        alert('ពាក្យសម្ងាត់នេះខ្សោយពេក ងាយស្រួលទាយ។ សូមជ្រើសរើសពាក្យសម្ងាត់ផ្សេង!');
        return;
    }
    if (newPwd !== confirmPwd) {
        alert('ការបញ្ជាក់ពាក្យសម្ងាត់មិនផ្ទៀងផ្ទាត់គ្នាទេ!');
        return;
    }
    
    const loggedUser = localStorage.getItem('nadr_auth_username');
    let adminUsers = null;
    try {
        adminUsers = JSON.parse(localStorage.getItem('nadr_admin_users'));
    } catch (e) {
        console.error("JSON parse error for admin users:", e);
        adminUsers = null;
    }
    if (!adminUsers) return;
    let u = adminUsers.find(x => x.username === loggedUser);
    if (u) {
        // TODO(task-3): hash this password. Task 3 migration will hash this plaintext password. Do not delete it and restore default.
        u.password = newPwd;
        localStorage.setItem('nadr_admin_users', JSON.stringify(adminUsers));
        if (typeof ADMIN_USERS !== 'undefined') ADMIN_USERS = adminUsers;
        
        const modal = document.getElementById('change-password-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
        alert('ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!');
    }
};

    // 4. Logout click
    const doLogout = () => {
        customConfirm('បញ្ជាក់ការចាកចេញ', 'តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធ (Logout) មែនទេ?', () => {
            localStorage.removeItem('nadr_auth_logged_in');
            sessionStorage.removeItem('nadr_auth_logged_in');
            if (typeof logAuditAction === 'function') logAuditAction('ចាកចេញពីប្រព័ន្ធ', 'បានចាកចេញពីប្រព័ន្ធ (Logout)');
            
            if (overlay) overlay.style.display = 'flex';
            const pwd = document.getElementById('login-password');
            if (pwd) pwd.value = '';
            if (errorMsg) errorMsg.classList.add('d-none');
            
            showToast('បានចាកចេញពីប្រព័ន្ធដោយសុវត្ថិភាព', 'info');
        }, null, 'ចាកចេញ');
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
    if (typeof applyRBAC === 'function') applyRBAC();
}

/**
 * Role-Based Access Control (RBAC) Enforcement
 * Limits Officer accounts to only see and edit Evaluation Criteria and Strategies in Settings.
 */
function applyRBAC() {
    const role = localStorage.getItem('nadr_auth_user_role') || sessionStorage.getItem('nadr_auth_user_role') || '';
    const isAdmin = role.toLowerCase().includes('admin') || role.includes('រដ្ឋបាល') || role.includes('អ្នកគ្រប់គ្រង');
    
    // In Settings view, control tab visibility
    const adminTabs = ['tab-org', 'tab-categories', 'tab-columns', 'tab-admins', 'tab-audit'];
    adminTabs.forEach(tabId => {
        const btn = document.querySelector(`#settings-view .tab-btn[data-tab="${tabId}"]`);
        if (btn) {
            btn.style.display = isAdmin ? 'flex' : 'none';
        }
    });

    // Check if an officer is currently on a restricted tab or if no active tab is set
    if (!isAdmin) {
        const activeBtn = document.querySelector('#settings-view .tab-btn.active');
        if (!activeBtn || adminTabs.includes(activeBtn.getAttribute('data-tab'))) {
            const evalBtn = document.querySelector('#settings-view .tab-btn[data-tab="tab-eval-matrix"]');
            if (evalBtn) evalBtn.click();
        }
    }

    // Show/hide role notice banner in Settings view
    let noticeEl = document.getElementById('rbac-officer-notice');
    if (!noticeEl) {
        const settingsCard = document.querySelector('#settings-view .settings-card');
        if (settingsCard) {
            noticeEl = document.createElement('div');
            noticeEl.id = 'rbac-officer-notice';
            noticeEl.style.cssText = 'background: #fffbeb; border-bottom: 1px solid #fef3c7; padding: 14px 20px; font-size: 13.5px; color: #b45309; display: none; align-items: center; gap: 12px; font-weight: 600;';
            noticeEl.innerHTML = '<i class="fa-solid fa-lock" style="font-size: 18px; color: #f59e0b; flex-shrink: 0;"></i> <div><span style="display: block; font-weight: 800; font-size: 14px; margin-bottom: 2px;">ការកំណត់សិទ្ធិមន្ត្រី (Officer Access Control)</span><span>គណនីរបស់អ្នកជា "មន្ត្រី"៖ អ្នកមានសិទ្ធិចូលប្រើប្រាស់ និងកែសម្រួលបានតែមុខងារ "លក្ខណៈវិនិច្ឆ័យវាយតម្លៃ" និង "យុទ្ធសាស្ត្រ" ប៉ុណ្ណោះ។ មុខងាររដ្ឋបាលផ្សេងទៀតត្រូវបានកម្រិតសិទ្ធិ។</span></div>';
            settingsCard.insertBefore(noticeEl, settingsCard.firstChild);
        }
    }
    if (noticeEl) {
        noticeEl.style.display = isAdmin ? 'none' : 'flex';
    }
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

function getCurrentAuthUser() {
    let admins = JSON.parse(localStorage.getItem('nadr_admin_users')) || ADMIN_USERS;
    const authUsername = localStorage.getItem('nadr_auth_username') || sessionStorage.getItem('nadr_auth_username');
    const authName = localStorage.getItem('nadr_auth_user_name') || sessionStorage.getItem('nadr_auth_user_name');
    
    let found = null;
    let foundIdx = -1;
    if (authUsername) {
        foundIdx = admins.findIndex(u => u.username.toLowerCase() === authUsername.toLowerCase());
        if (foundIdx >= 0) found = admins[foundIdx];
    }
    if (!found && authName) {
        foundIdx = admins.findIndex(u => u.name.trim() === authName.trim() || u.name.includes(authName) || authName.includes(u.name));
        if (foundIdx >= 0) found = admins[foundIdx];
    }
    if (!found) {
        // Fallback check by role
        const authRole = localStorage.getItem('nadr_auth_user_role') || sessionStorage.getItem('nadr_auth_user_role') || '';
        if (authRole.toLowerCase().includes('admin') || authRole.includes('រដ្ឋបាល') || authRole.includes('គ្រប់គ្រង')) {
            foundIdx = admins.findIndex(u => u.username.toLowerCase() === 'admin');
            if (foundIdx < 0) foundIdx = 0;
            found = admins[foundIdx];
        } else {
            foundIdx = admins.findIndex(u => u.username.toLowerCase() === 'user' || u.role.includes('មន្ត្រី') || u.role.includes('Officer'));
            if (foundIdx < 0) foundIdx = admins.length - 1;
            found = admins[foundIdx];
        }
    }
    if (found) {
        if (!found.phone) found.phone = found.username === 'admin' ? '012 345 678' : '098 765 432';
        if (!found.email) found.email = `${found.username}@nadr.gov.kh`;
        if (!found.avatar) found.avatar = localStorage.getItem(`nadr_avatar_${found.username}`) || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=0D8ABC&color=fff`;
    } else {
        found = { username: 'user', name: authName || 'មន្ត្រីសម្របសម្រួល', role: 'Case Officer (មន្ត្រីសម្រុះសម្រួល)', phone: '098 765 432', email: 'officer@nadr.gov.kh', password: 'user', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authName || 'មន្ត្រី')}&background=0D8ABC&color=fff` };
        foundIdx = 2;
    }
    return { user: found, index: foundIdx, admins };
}

function renderProfileView() {
    const { user: currUser } = getCurrentAuthUser();
    const pName = currUser.name;
    const pRole = currUser.role;
    const pPhone = currUser.phone || '012 345 678';
    const pEmail = currUser.email || `${currUser.username}@nadr.gov.kh`;
    const pAvatar = currUser.avatar || localStorage.getItem(`nadr_avatar_${currUser.username}`) || `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=0D8ABC&color=fff`;
    const pUsername = currUser.username || 'user';

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
    const inUsername = document.getElementById('profile-view-username');
    const inName = document.getElementById('profile-view-fullname');
    const inRole = document.getElementById('profile-view-role');
    const inPhone = document.getElementById('profile-view-phone');
    const inEmail = document.getElementById('profile-view-email');

    if (inUsername) inUsername.value = `${pUsername} / NADR-ID`;
    if (inName) inName.value = pName;
    if (inRole) {
        inRole.value = pRole;
        // Restrict role modification for non-admin officers
        const isAdmin = pRole.toLowerCase().includes('admin') || pRole.includes('រដ្ឋបាល') || pRole.includes('គ្រប់គ្រង');
        inRole.readOnly = !isAdmin;
        inRole.style.backgroundColor = !isAdmin ? 'var(--bg-main)' : '';
    }
    if (inPhone) inPhone.value = pPhone;
    if (inEmail) inEmail.value = pEmail;

    // Security & Access Level Box update based on role
    const secBox = document.getElementById('profile-security-box');
    if (secBox) {
        const isAdmin = pRole.toLowerCase().includes('admin') || pRole.includes('រដ្ឋបាល') || pRole.includes('គ្រប់គ្រង');
        secBox.innerHTML = isAdmin ? `
            <li><strong>កម្រិតសិទ្ធិ៖</strong> អគ្គនាយករដ្ឋបាល (Super Administrator)</li>
            <li><strong>ការអនុញ្ញាត៖</strong> បញ្ចូល កែសម្រួល លុប និងបោះពុម្ពទិន្នន័យទាំងអស់</li>
            <li><strong>ស្ថានភាពសុវត្ថិភាព៖</strong> ការពារដោយលេខកូដសម្ងាត់ ២ ជាន់ (Active)</li>
            <li><strong>ការចូលប្រើចុងក្រោយ៖</strong> <span id="profile-view-last-login">ថ្ងៃនេះ, ម៉ោង ០៨:៣០ ព្រឹក</span></li>
        ` : `
            <li><strong>កម្រិតសិទ្ធិ៖</strong> មន្ត្រីសម្រុះសម្រួល (Case Officer)</li>
            <li><strong>ការអនុញ្ញាត៖</strong> បញ្ចូល កែសម្រួល លុប និងបោះពុម្ពទិន្នន័យសំណុំរឿង</li>
            <li><strong>ដែនកំណត់៖</strong> មិនមានសិទ្ធិចូលប្រើប្រាស់ផ្ទាំងការកំណត់ប្រព័ន្ធ (Settings)</li>
            <li><strong>ស្ថានភាពសុវត្ថិភាព៖</strong> ការពារដោយលេខកូដសម្ងាត់ (Active)</li>
        `;
    }

    // Quick Stats
    const cases = typeof getCasesData === 'function' ? getCasesData() : [];
    const statCases = document.getElementById('profile-stat-cases');
    const statReports = document.getElementById('profile-stat-reports');
    if (statCases) statCases.textContent = cases.length || '0';
    if (statReports) statReports.textContent = cases.length > 0 ? '12' : '0';
}

function saveUserProfileView() {
    const { user: currUser, index: foundIdx, admins } = getCurrentAuthUser();
    const inputName = document.getElementById('profile-view-fullname');
    const inputRole = document.getElementById('profile-view-role');
    const inputPhone = document.getElementById('profile-view-phone');
    const inputEmail = document.getElementById('profile-view-email');
    const inputPass = document.getElementById('profile-view-password');

    if (inputName && inputName.value.trim()) {
        currUser.name = inputName.value.trim();
        localStorage.setItem('nadr_user_profile_name', currUser.name);
    }
    if (inputRole && inputRole.value.trim() && !inputRole.readOnly) {
        currUser.role = inputRole.value.trim();
        localStorage.setItem('nadr_user_profile_role', currUser.role);
    }
    if (inputPhone) {
        currUser.phone = inputPhone.value.trim() || '012 345 678';
        localStorage.setItem('nadr_user_profile_phone', currUser.phone);
    }
    if (inputEmail) {
        currUser.email = inputEmail.value.trim() || `${currUser.username}@nadr.gov.kh`;
        localStorage.setItem('nadr_user_profile_email', currUser.email);
    }

    if (inputPass && inputPass.value.trim()) {
        currUser.password = inputPass.value.trim();
        inputPass.value = '';
    }

    if (foundIdx >= 0 && admins[foundIdx]) {
        admins[foundIdx] = currUser;
    } else {
        admins.push(currUser);
    }
    ADMIN_USERS = admins;
    localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));

    // Update logged in session info
    const isLocal = localStorage.getItem('nadr_auth_logged_in') === 'true';
    const storage = isLocal ? localStorage : sessionStorage;
    storage.setItem('nadr_auth_user_name', currUser.name);
    storage.setItem('nadr_auth_user_role', currUser.role);
    if (currUser.username) storage.setItem('nadr_auth_username', currUser.username);

    updateSidebarUser(currUser.name, currUser.role);
    initUserProfile();
    renderProfileView();
    if (typeof logAuditAction === 'function') {
        logAuditAction('កែសម្រួលប្រវត្តិរូប', `បានកែសម្រួលព័ត៌មានគណនី៖ ${currUser.name} (${currUser.username})`);
    }
    showToast('ព័ត៌មានប្រវត្តិរូបត្រូវបានរក្សាទុកជោគជ័យ! (Profile Updated)', 'success');
}

function handleProfilePhotoUploadView(event) {
    const file = event.target.files[0];
    if (!file) return;
    const { user: currUser, index: foundIdx, admins } = getCurrentAuthUser();
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        currUser.avatar = base64;
        localStorage.setItem(`nadr_avatar_${currUser.username}`, base64);
        localStorage.setItem('nadr_user_profile_avatar', base64);
        if (foundIdx >= 0 && admins[foundIdx]) {
            admins[foundIdx].avatar = base64;
            ADMIN_USERS = admins;
            localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
        }
        initUserProfile();
        renderProfileView();
        showToast('បានអាប់ឡូតរូបថតប្រវត្តិរូបថ្មីរួចរាល់!', 'success');
    };
    reader.readAsDataURL(file);
}

function resetProfileAvatarView() {
    const { user: currUser, index: foundIdx, admins } = getCurrentAuthUser();
    localStorage.removeItem(`nadr_avatar_${currUser.username}`);
    localStorage.removeItem('nadr_user_profile_avatar');
    delete currUser.avatar;
    if (foundIdx >= 0 && admins[foundIdx]) {
        delete admins[foundIdx].avatar;
        ADMIN_USERS = admins;
        localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
    }
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
                const msgEn = currentLang === 'en' ? 'Language switched to English' : 'បានប្តូរទៅភាសាអង់គ្លេស';
                showToast(msgEn, 'success');
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
    { username: 'admin', password: 'admin123', name: 'គណនីរដ្ឋបាល (Admin)', role: 'Super Admin (អ្នកគ្រប់គ្រងកម្មវិធី)', status: 'Active', phone: '012 345 678', email: 'admin@nadr.gov.kh' },
    { username: 'nadr', password: 'nadr', name: 'មន្ត្រីជាន់ខ្ពស់ NADR', role: 'Super Admin (អ្នកគ្រប់គ្រងកម្មវិធី)', status: 'Active', phone: '011 222 333', email: 'nadr@nadr.gov.kh' },
    { username: 'user', password: 'user', name: 'មន្ត្រីសម្របសម្រួល', role: 'Case Officer (មន្ត្រីសម្រុះសម្រួល)', status: 'Active', phone: '098 765 432', email: 'officer@nadr.gov.kh' }
];

// Ensure all users have required properties
ADMIN_USERS.forEach(u => { 
    if (!u.status) u.status = 'Active';
    if (!u.phone) u.phone = u.username.toLowerCase() === 'admin' ? '012 345 678' : '098 765 432';
    if (!u.email) u.email = `${u.username}@nadr.gov.kh`;
});

// Automatically upgrade legacy '123' password to 'admin123' for the admin account in localStorage
let legacyAdmin = ADMIN_USERS.find(u => u.username.toLowerCase() === 'admin');
if (legacyAdmin && legacyAdmin.password === '123') {
    legacyAdmin.password = 'admin123';
    localStorage.setItem('nadr_admin_users', JSON.stringify(ADMIN_USERS));
}

/**
 * Dynamic Evaluation Matrix Baseline Map loaded from localStorage
 */
const DEFAULT_EXCEL_EVAL_BASELINE = {
    'វិវាទកិច្ចសន្យា': { total: 'ច្រើន', active: '-', settle: 'ល្អ', close: '-', pending: 'មិនល្អ', time: 'លឿនណាស់' },
    'វិវាទក្នុងគ្រួសារ': { total: 'ល្មម', active: '-', settle: 'ល្អណាស់', close: '-', pending: '-', time: 'យឺត' },
    'វិវាទគ្រួសារ': { total: 'ល្មម', active: '-', settle: 'ល្អណាស់', close: '-', pending: '-', time: 'យឺត' },
    'វិវាទជំពាក់ប្រាក់': { total: 'តិច', active: 'ល្អ', settle: 'ល្អណាស់', close: 'ល្អ', pending: 'ល្អបង្គួរ', time: 'យឺត' },
    'វិវាទដីធ្លី': { total: 'ច្រើនណាស់', active: 'ល្អ', settle: 'ល្អ', close: 'ល្អ', pending: 'មិនល្អ', time: 'យឺត' },
    'វិវាទពាណិជ្ជកម្ម': { total: 'ល្មម', active: '-', settle: 'ល្អបង្គួរ', close: '-', pending: 'មិនល្អ', time: 'យឺត' },
    'វិវាទមត៌ក': { total: 'តិច', active: '-', settle: '-', close: 'មិនល្អ', pending: '-', time: 'លឿន' },
    'វិវាទមរតក': { total: 'តិច', active: '-', settle: '-', close: 'មិនល្អ', pending: '-', time: 'លឿន' },
    'វិវាទអចលនវត្ថុ': { total: 'ច្រើនណាស់', active: '-', settle: 'ល្អណាស់', close: 'ល្អបង្គួរ', pending: 'ល្អបង្គួរ', time: 'យឺត' },
    'វិវាទការងារ': { total: 'តិច', active: 'ល្អណាស់', settle: 'ល្អ', close: 'ល្អ', pending: 'ល្អ', time: 'លឿន' }
};

let EVAL_BASELINE_MAP = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem('nadr_eval_baseline_map'));
        if (saved && typeof saved === 'object') {
            const firstKey = Object.keys(saved)[0];
            if (firstKey && (saved[firstKey].total !== undefined || saved[firstKey].active !== undefined)) {
                return Object.assign({}, DEFAULT_EXCEL_EVAL_BASELINE, saved);
            }
        }
    } catch (e) {
        console.warn('Error reading eval baseline map from localStorage:', e);
    }
    return Object.assign({}, DEFAULT_EXCEL_EVAL_BASELINE);
})();

function initSettingsEvents() {
    const tabs = document.querySelectorAll('#settings-view .tab-btn');
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const paneId = tab.getAttribute('data-tab');
            const role = localStorage.getItem('nadr_auth_user_role') || sessionStorage.getItem('nadr_auth_user_role') || '';
            const isAdmin = role.toLowerCase().includes('admin') || role.includes('រដ្ឋបាល') || role.includes('អ្នកគ្រប់គ្រង');
            const adminTabs = ['tab-org', 'tab-categories', 'tab-columns', 'tab-admins', 'tab-audit'];
            
            if (!isAdmin && adminTabs.includes(paneId)) {
                showToast('ការពារសិទ្ធិ៖ មុខងារនេះសម្រាប់តែអ្នកគ្រប់គ្រងកម្មវិធី (Admin) ប៉ុណ្ណោះ!', 'warning');
                return;
            }

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

            const panes = document.querySelectorAll('#settings-view .settings-tab-pane');
            panes.forEach(pane => {
                pane.style.display = pane.id === paneId ? 'block' : 'none';
            });

            // Update universal pane header title, desc, icon
            const titleEl = document.getElementById('settings-current-title');
            const descEl = document.getElementById('settings-current-desc');
            const iconEl = document.getElementById('settings-current-icon');
            if (titleEl && tab.getAttribute('data-title')) titleEl.textContent = tab.getAttribute('data-title');
            if (descEl && tab.getAttribute('data-desc')) descEl.textContent = tab.getAttribute('data-desc');
            if (iconEl && tab.getAttribute('data-icon')) {
                iconEl.innerHTML = `<i class="fa-solid ${tab.getAttribute('data-icon')}"></i>`;
                if (tab.getAttribute('data-color')) iconEl.style.color = tab.getAttribute('data-color');
            }

            // Automatically exit fit screen when switching tabs if needed
            const card = document.getElementById('main-settings-card');
            if (card && card.classList.contains('fit-screen')) {
                // Keep in fit screen or let user toggle
            }

            if (paneId === 'tab-eval-matrix') {
                renderSettingsEvalMatrix();
                if (typeof loadEvalThresholds === 'function') loadEvalThresholds();
            } else if (paneId === 'tab-strategies') {
                if (typeof loadResolutionStrategies === 'function') loadResolutionStrategies();
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

    // Universal Fit Screen Settings Toggle
    const fitBtn = document.getElementById('btn-toggle-fit-settings');
    if (fitBtn && !fitBtn._hasHandler) {
        fitBtn._hasHandler = true;
        fitBtn.addEventListener('click', () => {
            const card = document.getElementById('main-settings-card');
            const icon = document.getElementById('fit-settings-icon');
            const txt = document.getElementById('fit-settings-text');
            if (card) {
                card.classList.toggle('fit-screen');
                const isFit = card.classList.contains('fit-screen');
                if (icon) icon.className = isFit ? 'fa-solid fa-minimize' : 'fa-solid fa-maximize';
                if (txt) txt.textContent = isFit ? 'បង្រួមវិញ (Normal View)' : 'ពង្រីកពេញអេក្រង់ (Fit Screen)';
            }
        });
    }

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



    // Initial renders
    renderSettingsProvinces();
    renderSettingsCategories();
    renderSettingsColumns();
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
    }, null, 'លុប');
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
    }, null, 'លុប');
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
    }, null, 'លុប');
};

/**
 * Render Settings Evaluation Matrix Tab (Tab 7)
 */
function renderSettingsEvalMatrix() {
    const tbody = document.getElementById('settings-eval-matrix-tbody');
    if (!tbody || typeof CASE_CATEGORIES === 'undefined') return;

    const totalValues = ['ច្រើនណាស់', 'ច្រើន', 'ល្មម', 'តិច', '-'];
    const optValues = ['ល្អណាស់', 'ល្អ', 'ល្អបង្គួរ', 'មធ្យម', 'មិនល្អ', '-'];
    const timeValues = ['លឿនណាស់', 'លឿន', 'មធ្យម', 'យឺត', 'យឺត (> ៣០ ថ្ងៃ)', 'យឺត (> ៤៥ ថ្ងៃ)', 'លឿន (< ១៥ ថ្ងៃ)', '-'];

    const getSelectHTML = (currVal, opts, className) => {
        let h = `<select class="form-control ${className}" style="font-size: 12px; padding: 4px 8px; height: auto; font-weight: 600; border-radius: 6px;">`;
        opts.forEach(o => {
            h += `<option value="${o}" ${currVal === o ? 'selected' : ''}>${o}</option>`;
        });
        h += `</select>`;
        return h;
    };

    let html = '';
    CASE_CATEGORIES.forEach((cat, idx) => {
        const b = EVAL_BASELINE_MAP[cat] || (typeof DEFAULT_EXCEL_EVAL_BASELINE !== 'undefined' ? DEFAULT_EXCEL_EVAL_BASELINE[cat] : null) || { total: 'ល្មម', active: '-', settle: 'ល្អ', close: '-', pending: '-', time: 'មធ្យម' };
        const vTotal = b.total || b.count || '-';
        const vActive = b.active || b.resp || '-';
        const vSettle = b.settle || b.nego || '-';
        const vClose = b.close || b.emp || '-';
        const vPending = b.pending || b.spirit || '-';
        const vTime = b.time || '-';

        html += `
            <tr data-cat="${cat}">
                <td style="font-weight: 700;">${idx + 1}</td>
                <td style="text-align: left; font-weight: 700; color: #065f46;">${cat}</td>
                <td>${getSelectHTML(vTotal, totalValues, 'eval-sel-total')}</td>
                <td>${getSelectHTML(vActive, optValues, 'eval-sel-active')}</td>
                <td>${getSelectHTML(vSettle, optValues, 'eval-sel-settle')}</td>
                <td>${getSelectHTML(vClose, optValues, 'eval-sel-close')}</td>
                <td>${getSelectHTML(vPending, optValues, 'eval-sel-pending')}</td>
                <td>${getSelectHTML(vTime, timeValues, 'eval-sel-time')}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

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
        totalGuidance: '[លក្ខណៈវិនិច្ឆ័យ៖ ល្អណាស់ >=៥០ ករណី/ខែ | មធ្យម ១០-២៥ ករណី | មិនល្អ <១០ ករណី]\n១. ពង្រឹងយន្តការទទួលពាក្យបណ្ដឹងនៅគ្រប់មូលដ្ឋាន និងធ្វើទំនើបកម្មប្រព័ន្ធបែងចែកសំណុំរឿងរហ័ស (AI Dispatch) ដល់មន្ត្រីជំនាញ。\n២. បង្កើនការផ្សព្វផ្សាយជាសាធារណៈអំពីអត្ថប្រយោជន៍នៃការដោះស្រាយវិវាទក្រៅប្រព័ន្ធតុលាការ ដើម្បីលើកកម្ពស់ទំនុកចិត្តប្រជាពលរដ្ឋ。\n៣. រៀបចំកិច្ចសហការស្អិតរមួតជាមួយអាជ្ញាធរដែនដី និងរដ្ឋបាលឃុំ-សង្កាត់ ក្នុងការសម្របសម្រួល និងទទួលសំណុំរឿងពីមូលដ្ឋានផ្ទាល់។',
        settleLow: '[លក្ខណៈវិនិច្ឆ័យ៖ ល្អណាស់ >=៥០% | ល្អ ៣០-៥០% | មធ្យម ២០-៣០% | មិនល្អ <២០%]\n១. លើកកម្ពស់បច្ចេកទេសចរចា និងចិត្តសាស្ត្រវិវាទដល់មន្ត្រីសម្រុះសម្រួល តាមរយៈវគ្គបណ្តុះបណ្តាលជាក់ស្តែង និងការចែករំលែកបទពិសោធន៍。\n២. រៀបចំកិច្ចប្រជុំត្រួតពិនិត្យ និងវិភាគចំណុចខ្វែងគំនិតគ្នាមុនពេលបើកសម័យប្រជុំផ្សះផ្សា ដើម្បីកំណត់ចំណុចរួមឱ្យបានច្បាស់លាស់。\n៣. ចុះសិក្សាស្រាវជ្រាវដល់ទីតាំងវិវាទផ្ទាល់ និងជួបប្រាស្រ័យជាមួយគូភាគីដាច់ដោយឡែក ដើម្បីស្វែងយល់ពីជំហរ និងមូលហេតុពិតប្រាកដ។',
        activeHigh: '[លក្ខណៈវិនិច្ឆ័យ៖ ល្អណាស់ <=២០% | ល្អ ២០-៣៥% | មធ្យម ៣៥-៥០% | មិនល្អ >៥០%]\n១. រៀបចំកាលវិភាគប្រជុំសម្រុះសម្រួលឱ្យបានជាប់លាប់ និងកំណត់កាលបរិច្ឆេទគោលដៅដោះស្រាយបញ្ចប់សម្រាប់សំណុំរឿងនីមួយៗ。\n២. ចាត់ចែងបន្ថែមមន្ត្រីជំនួយការ ឬអ្នកច្បាប់ជំនាញក្នុងសំណុំរឿងដែលមានភាពស្មុគស្មាញខ្ពស់ (ដូចជាវិវាទដីធ្លី និងកិច្ចសន្យាពាណិជ្ជកម្ម)។\n៣. ដាក់ចេញប្រព័ន្ធតាមដាន (Red Flag Alert) លើសំណុំរឿងដែលដំណើរការលើសពី ៣០ ថ្ងៃ ដើម្បីជួយអន្តរាគមន៍ដោះស្រាយទាន់ពេលវេលា។',
        closeHigh: '[លក្ខណៈវិនិច្ឆ័យ៖ ល្អណាស់ <=១៥% | ល្អ ១៥-២៥% | មធ្យម ២៥-៤០% | មិនល្អ >៤០%]\n១. ធ្វើការវិភាគស៊ីជម្រៅលើមូលហេតុដែលនាំឱ្យបរាជ័យក្នុងការផ្សះផ្សា (មិនព្រមព្រៀង) ដើម្បីចងក្រងជាករណីសិក្សា និងកែលម្អយុទ្ធសាស្ត្រ。\n២. ផ្តល់ការពន្យល់ណែនាំអំពីនីតិវិធីផ្លូវច្បាប់បន្ត និងផលវិបាកនៃការបន្តវិវាទដល់គូភាគី ដើម្បីបញ្ចៀសអំពើហិង្សា និងរក្សាភាពស្ងប់ស្ងាត់。\n៣. បង្កើនយន្តការសហការជាមួយស្ថាប័នពាក់ព័ន្ធ និងអាជ្ញាធរមានសមត្ថកិច្ច ក្នុងការបន្តគ្រប់គ្រងសភាពការណ៍ និងរក្សាសន្តិសុខសង្គម។',
        pendingHigh: '[លក្ខណៈវិនិច្ឆ័យ៖ ល្អណាស់ <=១០% | ល្អ ១០-២០% | មធ្យម ២០-៣០% | មិនល្អ >៣០%]\n១. ធ្វើសវនកម្ម និងពិនិត្យឡើងវិញជាប្រចាំនូវសំណុំរឿងដែលតម្កល់លើសពី ១៥ ថ្ងៃ និងធ្វើការទំនាក់ទំនងទៅភាគីដើម្បីសួរនាំជំហរថ្មី。\n២. កំណត់នីតិវិធីរដ្ឋបាលច្បាស់លាស់៖ ប្រសិនបើភាគីមិនទាក់ទងមកវិញ ឬបោះបង់ការតវ៉ាក្នុងរយៈពេលកំណត់ ត្រូវអនុវត្តនីតិវិធីបិទបញ្ជីសំណុំរឿង。\n៣. បង្កើតក្រុមការងារពិសេស (Task Force) ដើរពិនិត្យ និងជំរុញការដោះស្រាយសំណុំរឿងចាស់ៗដែលកកស្ទះ ដើម្បីសម្អាតបញ្ជីទិន្នន័យ។'
    };
    let strats = JSON.parse(localStorage.getItem('nadr_resolution_strategies')) || def;
    if (!strats.totalGuidance || !strats.totalGuidance.includes('លក្ខណៈវិនិច្ឆ័យ')) {
        strats = def;
        localStorage.setItem('nadr_resolution_strategies', JSON.stringify(def));
    }
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
    }, null, 'កំណត់');
};

window.saveEvalMatrixSetting = function() {
    const tbody = document.getElementById('settings-eval-matrix-tbody');
    if (!tbody) return;
    if (typeof saveEvalThresholds === 'function') saveEvalThresholds();
    const rows = tbody.querySelectorAll('tr[data-cat]');
    const newMap = {};
    rows.forEach(r => {
        const cat = r.getAttribute('data-cat');
        const total = r.querySelector('.eval-sel-total') ? r.querySelector('.eval-sel-total').value : (r.querySelector('.eval-sel-count') ? r.querySelector('.eval-sel-count').value : '-');
        const active = r.querySelector('.eval-sel-active') ? r.querySelector('.eval-sel-active').value : (r.querySelector('.eval-sel-resp') ? r.querySelector('.eval-sel-resp').value : '-');
        const settle = r.querySelector('.eval-sel-settle') ? r.querySelector('.eval-sel-settle').value : (r.querySelector('.eval-sel-nego') ? r.querySelector('.eval-sel-nego').value : '-');
        const close = r.querySelector('.eval-sel-close') ? r.querySelector('.eval-sel-close').value : (r.querySelector('.eval-sel-emp') ? r.querySelector('.eval-sel-emp').value : '-');
        const pending = r.querySelector('.eval-sel-pending') ? r.querySelector('.eval-sel-pending').value : (r.querySelector('.eval-sel-spirit') ? r.querySelector('.eval-sel-spirit').value : '-');
        const time = r.querySelector('.eval-sel-time') ? r.querySelector('.eval-sel-time').value : '-';
        newMap[cat] = { total, active, settle, close, pending, time };
    });
    EVAL_BASELINE_MAP = newMap;
    localStorage.setItem('nadr_eval_baseline_map', JSON.stringify(EVAL_BASELINE_MAP));
    if (typeof renderAllViews === 'function') renderAllViews();
    showToast('បានរក្សាទុកលក្ខណៈវិនិច្ឆ័យវាយតម្លៃវិវាទដោយជោគជ័យ!', 'success');
};

window.resetEvalMatrixSetting = function() {
    customConfirm('កំណត់ទៅលក្ខខណ្ឌដើម', 'តើលោកអ្នកពិតជាចង់កំណត់លក្ខណៈវិនិច្ឆ័យវាយតម្លៃវិវាទទាំងអស់ទៅជាលក្ខខណ្ឌស្ដង់ដារគំរូ Excel ដើមវិញមែនទេ?', () => {
        localStorage.removeItem('nadr_eval_thresholds');
        if (typeof loadEvalThresholds === 'function') loadEvalThresholds();
        EVAL_BASELINE_MAP = JSON.parse(JSON.stringify(DEFAULT_EXCEL_EVAL_BASELINE));
        localStorage.setItem('nadr_eval_baseline_map', JSON.stringify(EVAL_BASELINE_MAP));
        renderSettingsEvalMatrix();
        if (typeof renderAllViews === 'function') renderAllViews();
        showToast('បានកំណត់លក្ខណៈវិនិច្ឆ័យវាយតម្លៃទៅជាស្ដង់ដារគំរូ Excel ដើមវិញរួចរាល់!', 'info');
    }, null, 'កំណត់');
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
    }, null, 'សម្អាតទិន្នន័យ');
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
        <th class="text-center freeze-col-1" style="width: 50px;">ល.រ</th>
        <th class="text-center freeze-col-2" style="width: 50px;">ល.រ ក្នុងបញ្ជី</th>
        <th class="text-center freeze-col-3" style="width: 90px;">ទៅកាន់ Folder</th>
        <th class="freeze-col-4" style="width: 90px;" data-i18n="table.caseCode">លេខកូដសំណុំរឿង</th>
        <th class="freeze-col-5" style="width: 110px;" data-i18n="table.date">កាលបរិច្ឆេទ</th>
        <th style="width: 90px;" class="text-center" data-i18n="table.status">លទ្ធផលសំណុំរឿង</th>
        <th style="width: 170px;" class="text-center">ចំណាត់ការសំណុំរឿង</th>
        <th style="width: 100px;">កម្មវិធី (Event)</th>
        <th style="width: 120px;">កាលបរិច្ឆេទកម្មវិធី</th>
        <th style="min-width: 180px;">ភាគី (ក) ភាគីស្នើសុំ</th>
        <th style="min-width: 180px;">ភាគី (ខ) ភាគីម្ខាងទៀត</th>
        <th style="width: 120px;">ភាគី (គ) អ្នកពាក់ព័ន្ធ</th>
        <th style="width: 140px;" data-i18n="table.category">ប្រភេទវិវាទ</th>
        <th style="width: 120px;" data-i18n="table.location">ទីតាំងវិវាទ</th>
        <th style="width: 80px;" class="text-center" data-i18n="table.remarks">កំណត់ចំណាំ</th>
    `;

    CUSTOM_COLUMNS.forEach(col => {
        html += `<th style="min-width: 120px;" class="text-center">${currentLang === 'km' ? col.labelKh : col.labelEn}</th>`;
    });

    html += `<th style="width: 150px;" class="text-center" data-i18n="table.actions">សកម្មភាព</th>`;
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
                caseType: document.querySelector('input[name="quickCaseType"]:checked') ? document.querySelector('input[name="quickCaseType"]:checked').value : 'personal',
                dateReceived: document.getElementById('quick-case-date').value,
                caseEvent: document.getElementById('quick-case-event') ? document.getElementById('quick-case-event').value : '',
                caseEventDate: document.getElementById('quick-case-event-date') ? document.getElementById('quick-case-event-date').value : '',
                caseEventTime: document.getElementById('quick-case-event-time') ? document.getElementById('quick-case-event-time').value : '',
                category: document.getElementById('quick-case-category').value,
                disputeLocation: document.getElementById('quick-case-dispute-location').value,
                folderLink: document.getElementById('quick-case-folder-link') ? document.getElementById('quick-case-folder-link').value.trim() : '',
                
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

                partyC_name: document.getElementById('quick-case-party-c-name') ? document.getElementById('quick-case-party-c-name').value.trim() : '',

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
    }, null, 'លុប');
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
    if (title) title.innerHTML = `<div style="background: rgba(255,255,255,0.2); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><i class="fa-solid fa-folder-open" style="color: #fbbf24; font-size: 20px;"></i></div> <span>Folder ឯកសារសំណុំរឿង៖ <strong style="color:#bfdbfe;">${c.caseNumber}</strong></span>`;
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
            <div class="text-center text-muted" style="grid-column: 1 / -1; padding: 40px 20px; font-style: italic; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px;">
                <div style="background: #f1f5f9; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 30px; color: #94a3b8;"></i>
                </div>
                <h5 style="color: #475569; font-weight: 700; font-size: 15px; margin-bottom: 8px;">ពុំទាន់មានឯកសារ ឬរូបភាពនៅក្នុង Folder សំណុំរឿង "${c.caseNumber}" នេះឡើយ។</h5>
                <p style="color: #94a3b8; font-size: 13px;">សូមជ្រើសរើសឯកសារនៅរបារខាងលើ ដើម្បីបញ្ចូលចូលក្នុង Folder នេះ!</p>
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
    }, null, 'លុប');
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

/* ==========================================================================
   CALENDAR & SCHEDULE LOGIC
   ========================================================================== */
let currentCalDate = new Date();

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-month-year');
    if (!grid || !title) return;

    // Reset grid to just headers with distinct colors for each day
    grid.innerHTML = `
        <div class="calendar-header-day" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border-bottom: 3px solid #ef4444;">អាទិត្យ</div>
        <div class="calendar-header-day" style="background: rgba(245, 158, 11, 0.1); color: #d97706; border-bottom: 3px solid #f59e0b;">ច័ន្ទ</div>
        <div class="calendar-header-day" style="background: rgba(168, 85, 247, 0.1); color: #9333ea; border-bottom: 3px solid #a855f7;">អង្គារ</div>
        <div class="calendar-header-day" style="background: rgba(132, 204, 22, 0.1); color: #65a30d; border-bottom: 3px solid #84cc16;">ពុធ</div>
        <div class="calendar-header-day" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; border-bottom: 3px solid #22c55e;">ព្រហស្បតិ៍</div>
        <div class="calendar-header-day" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; border-bottom: 3px solid #3b82f6;">សុក្រ</div>
        <div class="calendar-header-day" style="background: rgba(15, 23, 42, 0.1); color: #334155; border-bottom: 3px solid #475569;">សៅរ៍</div>
    `;

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth(); // 0-11
    
    // Khmer Month Names
    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    title.innerText = `${khmerMonths[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Map events by date (YYYY-MM-DD) supporting all event data formats
    const eventsMap = {};
    casesData.forEach(c => {
        const hasEvt = (typeof checkCaseHasEvent === 'function') ? checkCaseHasEvent(c) : (c.caseEvent && c.caseEventDate);
        if (hasEvt) {
            const evt = (typeof getCaseEventDetails === 'function') ? getCaseEventDetails(c) : { date: c.caseEventDate, time: c.caseEventTime, desc: c.caseEvent };
            const d = evt.date || c.caseEventDate;
            if (d && String(d).trim() !== '') {
                if (!eventsMap[d]) eventsMap[d] = [];
                eventsMap[d].push({
                    ...c,
                    caseEventDate: d,
                    caseEventTime: evt.time || c.caseEventTime || '08:30',
                    caseEvent: evt.desc || c.caseEvent || 'ប្រជុំសម្រុះសម្រួល'
                });
            }
        }
    });

    const todayStr = getTodayDateString();

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const cell = createCalendarCell(d, true, false, null);
        grid.appendChild(cell);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = (dStr === todayStr);
        const evts = eventsMap[dStr] || [];
        const cell = createCalendarCell(i, false, isToday, evts, dStr);
        grid.appendChild(cell);
    }

    // Next month filler days
    const totalCellsRendered = firstDay + daysInMonth;
    const remainingCells = 42 - totalCellsRendered; // 6 rows of 7
    for (let i = 1; i <= remainingCells; i++) {
        const cell = createCalendarCell(i, true, false, null);
        grid.appendChild(cell);
    }
}

function createCalendarCell(dayNum, isOtherMonth, isToday, events, dateStr) {
    const div = document.createElement('div');
    const hasEvents = events && events.length > 0;
    div.className = 'calendar-day' + (isOtherMonth ? ' other-month' : '') + (isToday ? ' today' : '') + (hasEvents ? ' has-events' : '');
    
    const numDiv = document.createElement('div');
    numDiv.className = 'day-num';
    numDiv.innerText = dayNum;
    div.appendChild(numDiv);

    if (events && events.length > 0) {
        const today = getTodayDateString();
        events.forEach(c => {
            const evt = document.createElement('div');
            evt.className = 'calendar-event-item';
            
            if (dateStr < today) {
                // Past event
                evt.style.backgroundColor = '#f1f5f9';
                evt.style.color = '#64748b';
                evt.style.borderLeft = '3px solid #cbd5e1';
                evt.innerHTML = `<strong>${c.caseNumber}</strong><br><span style="text-decoration: line-through;">${c.caseEvent}</span> <i class="fa-solid fa-check-circle text-success" style="float:right;"></i>`;
            } else {
                // Future or today event
                if (c.caseEvent.includes('ទីតាំង')) evt.classList.add('evt-location');
                if (c.caseEvent.includes('សម្រុះសម្រួល')) evt.classList.add('evt-mediation');
                evt.innerHTML = `<strong>${c.caseNumber}</strong><br>${c.caseEvent}`;
            }
            
            evt.onclick = (e) => {
                e.stopPropagation(); // prevent opening the general day modal
                openEventResultModal(c.id);
            };
            div.appendChild(evt);
        });
    }

    if (!isOtherMonth && dateStr) {
        div.onclick = () => openCalendarEventModal(dateStr);
    }

    return div;
}

// Calendar Navigation
document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('btn-next-month')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendar();
});

// Sync renderAllViews to include calendar
const originalRenderAllViewsCal = renderAllViews;
renderAllViews = function() {
    originalRenderAllViewsCal();
    if (typeof renderCalendar === 'function') renderCalendar();
};

// Calendar Event Modal Logic
function openCalendarEventModal(dateStr, caseIdToSelect = null) {
    document.getElementById('cal-modal-date').value = dateStr;
    const caseSelect = document.getElementById('cal-modal-case');
    
    // Create Custom Dropdown Container if not exists
    let customSelect = document.getElementById('custom-cal-modal-case');
    if (!customSelect) {
        customSelect = document.createElement('div');
        customSelect.id = 'custom-cal-modal-case';
        customSelect.className = 'custom-select-wrapper';
        caseSelect.parentNode.insertBefore(customSelect, caseSelect);
        caseSelect.style.display = 'none'; // Hide native select
        
        // Add minimal CSS for the custom select
        if (!document.getElementById('custom-select-style')) {
            const style = document.createElement('style');
            style.id = 'custom-select-style';
            style.innerHTML = `
                .custom-select-wrapper { position: relative; width: 100%; user-select: none; }
                .custom-select-trigger { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 15px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
                .custom-select-trigger:focus { outline: 2px solid var(--primary-color); }
                .custom-select-options { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 5px; max-height: 250px; overflow-y: auto; z-index: 9999; display: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .custom-select-options.open { display: block; }
                .custom-select-option { padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                .custom-select-option:last-child { border-bottom: none; }
                .custom-select-option:hover { background: #f8fafc; }
                .custom-select-option.selected { background: #eff6ff; }
                .custom-select-circle { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; color: #fff; flex-shrink: 0; }
            `;
            document.head.appendChild(style);
        }
    }

    // Populate Options
    caseSelect.innerHTML = '<option value="">-- ជ្រើសរើសសំណុំរឿង --</option>';
    
    let customOptionsHTML = `<div class="custom-select-option" data-value="">-- ជ្រើសរើសសំណុំរឿង --</div>`;
    
    casesData.forEach(c => {
        const shortStatus = c.status.split(' ')[0];
        const statusColor = typeof getStatusColor === 'function' ? getStatusColor(c.status) : '#334155';
        const listNo = c.originalListNo || '-';
        
        const optionText = `[${shortStatus}] លេខ ${c.caseNumber} - ${c.partyA_name} vs ${c.partyB_name}`;
        caseSelect.innerHTML += `<option value="${c.id}">${listNo} ${optionText}</option>`;
        
        customOptionsHTML += `
            <div class="custom-select-option" data-value="${c.id}">
                <div class="custom-select-circle" style="background-color: ${statusColor}; box-shadow: 0 0 4px ${statusColor}80;">${listNo}</div>
                <div>${optionText}</div>
            </div>
        `;
    });

    // Render Custom Dropdown
    customSelect.innerHTML = `
        <div class="custom-select-trigger" tabindex="0">
            <span class="custom-select-label">-- ជ្រើសរើសសំណុំរឿង --</span>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <div class="custom-select-options">${customOptionsHTML}</div>
    `;

    const trigger = customSelect.querySelector('.custom-select-trigger');
    const optionsContainer = customSelect.querySelector('.custom-select-options');
    const label = customSelect.querySelector('.custom-select-label');

    // Toggle dropdown
    trigger.onclick = () => {
        optionsContainer.classList.toggle('open');
    };
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            optionsContainer.classList.remove('open');
        }
    }, { once: false });

    // Handle Option Selection function
    const selectOption = (val) => {
        caseSelect.value = val;
        optionsContainer.classList.remove('open');
        
        // Update Label
        const selectedOpt = customSelect.querySelector(`.custom-select-option[data-value="${val}"]`);
        if (selectedOpt) {
            label.innerHTML = selectedOpt.innerHTML;
            
            // Remove selection class from all
            customSelect.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
            selectedOpt.classList.add('selected');
        } else {
            label.innerHTML = '-- ជ្រើសរើសសំណុំរឿង --';
        }
        
        // Dispatch change event to native select just in case
        caseSelect.dispatchEvent(new Event('change'));
    };

    // Attach click events to custom options
    customSelect.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.onclick = () => {
            selectOption(opt.getAttribute('data-value'));
        };
    });

    if (caseIdToSelect) {
        selectOption(caseIdToSelect);
        const c = getCaseById(caseIdToSelect);
        if (c) {
            document.getElementById('cal-modal-event').value = c.caseEvent || '';
            document.getElementById('cal-modal-time').value = c.caseEventTime || '08:00';
        }
    } else {
        selectOption(''); // Reset selection
        document.getElementById('cal-modal-event').value = '';
        document.getElementById('cal-modal-time').value = '08:00';
    }

    document.getElementById('calendar-event-modal').classList.add('open');
    setTimeout(() => { if (typeof calFormStateManager !== 'undefined' && calFormStateManager) calFormStateManager.reset(); }, 100);
}

document.getElementById('btn-close-calendar-modal')?.addEventListener('click', () => {
    document.getElementById('calendar-event-modal').classList.remove('open');
});
document.getElementById('btn-cancel-calendar-modal')?.addEventListener('click', () => {
    document.getElementById('calendar-event-modal').classList.remove('open');
});

document.getElementById('btn-save-calendar-event')?.addEventListener('click', () => {
    const dateStr = document.getElementById('cal-modal-date').value;
    const timeStr = document.getElementById('cal-modal-time').value;
    const caseId = document.getElementById('cal-modal-case').value;
    const eventType = document.getElementById('cal-modal-event').value;

    if (!caseId || !eventType || !timeStr) {
        showToast('សូមជ្រើសរើសសំណុំរឿង, កម្មវិធី និងម៉ោង!', 'error');
        return;
    }

    const c = getCaseById(caseId);
    if (c) {
        c.caseEvent = eventType;
        c.caseEventDate = dateStr;
        c.caseEventTime = timeStr;
        c.notifiedEventDate = ''; // Reset notification flag when date changes
        c.notifiedOneHour = false; // Reset 1 hour notification flag
        c.notifiedNow = false; // Reset now notification flag
        
        // Sync with case meeting properties (7.1, 7.2, 7.3)
        if (eventType.includes('៧.១')) {
            c.meetingPartyADate = dateStr;
            if (!c.meetingPartyA || c.meetingPartyA === 'មិនទាន់ប្រជុំ') c.meetingPartyA = 'បានប្រជុំប្រមូលព័ត៌មានភាគីរួច';
        } else if (eventType.includes('៧.២')) {
            c.meetingPartyBDate = dateStr;
            if (!c.meetingPartyB || c.meetingPartyB === 'មិនទាន់ប្រជុំ') c.meetingPartyB = 'បានប្រជុំប្រមូលព័ត៌មានភាគីរួច';
        } else if (eventType.includes('៧.៣')) {
            c.mediationMeetingDate = dateStr;
            if (!c.mediationMeeting || c.mediationMeeting === 'មិនទាន់ប្រជុំ') c.mediationMeeting = 'បានប្រជុំសម្រុះសម្រួល (កំពុងបន្ត)';
        }

        saveCases();
        showToast('បានកំណត់កម្មវិធីដោយជោគជ័យ!', 'success');
        document.getElementById('calendar-event-modal').classList.remove('open');
        renderAllViews();
        
        // Trigger Google Calendar Sync
        if (typeof syncToGoogleCalendar === 'function') {
            syncToGoogleCalendar(c);
        }
        // Trigger Telegram Notification
        if (typeof notifyTelegramEventUpdate === 'function') {
            notifyTelegramEventUpdate(c);
            showToast('បានធ្វើបច្ចុប្បន្នភាពទៅកាន់ Telegram រួចរាល់', 'info');
        }
    }
});

document.getElementById('btn-clear-calendar-event')?.addEventListener('click', () => {
    const caseId = document.getElementById('cal-modal-case').value;
    if (!caseId) {
        showToast('សូមជ្រើសរើសសំណុំរឿងដើម្បីលុបកម្មវិធី!', 'error');
        return;
    }

    const c = getCaseById(caseId);
    if (c) {
        if (!c.caseEvent && !c.caseEventDate) {
            showToast('សំណុំរឿងនេះមិនមានកម្មវិធីទេ!', 'warning');
            return;
        }
        
        customConfirm('បញ្ជាក់ការលុបកម្មវិធី', 'តើលោកអ្នកពិតជាចង់លុបកម្មវិធីនេះមែនទេ?', () => {
            const oldGoogleEventId = c.googleEventId;
            const oldEventName = c.caseEvent;

            c.caseEvent = '';
            c.caseEventDate = '';
            c.caseEventTime = '';
            c.notifiedEventDate = '';
            c.notifiedOneHour = false;
            c.googleEventId = ''; // Clear ID

            saveCases();
            showToast('បានលុបកម្មវិធីចេញពីប្រតិទិនដោយជោគជ័យ!', 'success');
            document.getElementById('calendar-event-modal').classList.remove('open');
            renderAllViews();

            if (oldGoogleEventId && typeof deleteFromGoogleCalendar === 'function') {
                deleteFromGoogleCalendar(oldGoogleEventId);
            }
            if (typeof notifyTelegramEventCancelled === 'function') {
                notifyTelegramEventCancelled(c.caseNumber, oldEventName);
                showToast('បានធ្វើបច្ចុប្បន្នភាពការលុបទៅកាន់ Telegram', 'info');
            }
        }, null, 'លុប');
    }
});
// Initialize Calendar view hook
document.querySelector('a[data-view="calendar-view"]')?.addEventListener('click', () => {
    setTimeout(renderCalendar, 100);
});

// Setup Maximize/Minimize functionality for all views
window.addEventListener('load', () => {
    // Inject fullscreen CSS dynamically to avoid cache issues
    if (!document.getElementById('fullscreen-dynamic-style')) {
        const style = document.createElement('style');
        style.id = 'fullscreen-dynamic-style';
        style.innerHTML = `
            .fullscreen-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: auto !important;
                height: auto !important;
                z-index: 9500 !important;
                background: var(--bg-main, #f8fafc) !important;
                overflow-y: auto !important;
                padding: 24px !important;
                margin: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                display: block !important;
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        const titleBoxes = document.querySelectorAll('.view-section .section-title-box');
        titleBoxes.forEach(box => {
            let actionDiv = box.querySelector('.section-actions');
            if (!actionDiv) {
                actionDiv = document.createElement('div');
                actionDiv.className = 'section-actions';
                box.appendChild(actionDiv);
            }
            
            const maxBtn = document.createElement('button');
            maxBtn.className = 'btn btn-outline';
            maxBtn.innerHTML = '<i class="fa-solid fa-expand"></i> ពង្រីក (Maximize)';
            maxBtn.style.marginLeft = '10px';
            
            maxBtn.onclick = function() {
                const section = this.closest('.view-section');
                if (section && typeof window.toggleSectionMaximize === 'function') {
                    window.toggleSectionMaximize(section.id, this);
                }
            };
            
            actionDiv.appendChild(maxBtn);
        });
    }, 500);
});

window.restoreMaximizedSection = function(section, btnEl) {
    if (!section) return;
    section.classList.remove('fullscreen-overlay');
    section.style.zoom = '';
    const scrollArea = document.getElementById('main-scroll-area');
    const restoreParent = (section.__origParent && document.body.contains(section.__origParent))
        ? section.__origParent
        : (scrollArea || document.querySelector('.main-content'));
    if (restoreParent) {
        if (section.__origNextSibling && section.__origNextSibling.parentNode === restoreParent) {
            restoreParent.insertBefore(section, section.__origNextSibling);
        } else {
            restoreParent.appendChild(section);
        }
    }
    const targetBtn = btnEl || section.__maxBtn;
    if (targetBtn) {
        targetBtn.innerHTML = '<i class="fa-solid fa-expand"></i> <span>ពង្រីក (Maximize)</span>';
    }
    if (typeof applyZoom === 'function') applyZoom();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
};

window.toggleSectionMaximize = function(sectionId, btnEl) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const isFullscreen = section.classList.contains('fullscreen-overlay');
    if (isFullscreen) {
        window.restoreMaximizedSection(section, btnEl);
    } else {
        const scrollArea = document.getElementById('main-scroll-area');
        section.__origParent = (section.parentNode && section.parentNode !== document.body)
            ? section.parentNode
            : scrollArea;
        section.__origNextSibling = section.nextSibling;
        section.__maxBtn = btnEl || section.__maxBtn;
        section.classList.add('fullscreen-overlay');
        document.body.appendChild(section);
        section.style.zoom = (typeof currentZoom !== 'undefined' ? String(currentZoom) : '0.8');
        if (section.__maxBtn) {
            section.__maxBtn.innerHTML = '<i class="fa-solid fa-compress"></i> <span>បង្រួម (Minimize)</span>';
        }
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
};

// --- ZOOM CONTROLS ---
let currentZoom = parseFloat(localStorage.getItem('nadr_app_zoom')) || 0.8;

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level-display');
    if (display) {
        display.innerText = Math.round(currentZoom * 100) + '%';
    }
}

function applyZoom() {
    localStorage.setItem('nadr_app_zoom', currentZoom);
    updateZoomDisplay();
    
    // Always apply zoom to the scroll area ONLY, so the sidebar and top header remain at 100%
    const scrollArea = document.getElementById('main-scroll-area');
    if (scrollArea) {
        scrollArea.style.zoom = currentZoom;
    }
    document.querySelectorAll('.view-section.fullscreen-overlay').forEach(sec => {
        sec.style.zoom = currentZoom;
    });
}

function zoomIn() {
    if (currentZoom < 1.5) {
        currentZoom += 0.1;
        // Fix floating point math
        currentZoom = Math.round(currentZoom * 10) / 10;
        applyZoom();
    }
}

function zoomOut() {
    if (currentZoom > 0.5) {
        currentZoom -= 0.1;
        // Fix floating point math
        currentZoom = Math.round(currentZoom * 10) / 10;
        applyZoom();
    }
}

// Initialize zoom on load
document.addEventListener('DOMContentLoaded', () => {
    applyZoom();
});

let navigationHistory = [];
let currentHistoryIndex = -1;
let isNavigatingHistory = false;

function updateBreadcrumb(viewId) {
    const breadcrumbPath = document.getElementById('breadcrumb-path');
    if (!breadcrumbPath) return;
    const targetNav = document.querySelector('.sidebar-nav .nav-item[data-view="' + viewId + '"]');
    let title = 'ទំព័រដើម';
    if (targetNav) title = targetNav.innerText.trim();
    const isEn = (localStorage.getItem('nadr_app_lang') === 'en');
    const homeText = isEn ? 'Home' : 'ទំព័រដើម';
    breadcrumbPath.innerText = homeText + ' > ' + title;
}

function updateNavButtons() {
    const btnBack = document.getElementById('btn-nav-back');
    const btnForward = document.getElementById('btn-nav-forward');
    if(btnBack) btnBack.disabled = currentHistoryIndex <= 0;
    if(btnForward) btnForward.disabled = currentHistoryIndex >= navigationHistory.length - 1;
}

function navigateBack() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        isNavigatingHistory = true;
        switchView(navigationHistory[currentHistoryIndex], false);
        isNavigatingHistory = false;
        updateNavButtons();
    }
}

function navigateForward() {
    if (currentHistoryIndex < navigationHistory.length - 1) {
        currentHistoryIndex++;
        isNavigatingHistory = true;
        switchView(navigationHistory[currentHistoryIndex], false);
        isNavigatingHistory = false;
        updateNavButtons();
    }
}

class FormStateManager {
    constructor(formId, toolbarId) {
        this.form = document.getElementById(formId);
        this.toolbar = document.getElementById(toolbarId);
        this.history = [];
        this.currentIndex = -1;
        this.isRestoring = false;
        
        if (!this.form || !this.toolbar) return;
        
        this.btnUndo = this.toolbar.querySelector('.btn-undo');
        this.btnRedo = this.toolbar.querySelector('.btn-redo');
        
        if (this.btnUndo) this.btnUndo.addEventListener('click', () => this.undo());
        if (this.btnRedo) this.btnRedo.addEventListener('click', () => this.redo());
        
        this.form.addEventListener('input', this.debounce(() => this.saveState(), 500));
        this.form.addEventListener('change', () => this.saveState());
        
        this.saveState();
    }
    
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    saveState() {
        if (this.isRestoring) return;
        const state = {};
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(el => {
            if (el.id || el.name) {
                const key = el.id || el.name;
                if (el.type === 'checkbox' || el.type === 'radio') {
                    state[key] = el.checked;
                } else {
                    state[key] = el.value;
                }
            }
        });
        const stateStr = JSON.stringify(state);
        if (this.currentIndex >= 0 && this.history[this.currentIndex] === stateStr) return;
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        this.history.push(stateStr);
        this.currentIndex++;
        this.updateButtons();
    }
    
    restoreState(index) {
        if (index < 0 || index >= this.history.length) return;
        this.isRestoring = true;
        const state = JSON.parse(this.history[index]);
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(el => {
            if (el.id || el.name) {
                const key = el.id || el.name;
                if (state.hasOwnProperty(key)) {
                    if (el.type === 'checkbox' || el.type === 'radio') {
                        el.checked = state[key];
                    } else {
                        el.value = state[key];
                    }
                }
            }
        });
        this.currentIndex = index;
        this.updateButtons();
        setTimeout(() => { this.isRestoring = false; }, 100);
    }
    
    undo() { if (this.currentIndex > 0) this.restoreState(this.currentIndex - 1); }
    
    redo() { if (this.currentIndex < this.history.length - 1) this.restoreState(this.currentIndex + 1); }
    
    updateButtons() {
        if (this.btnUndo) this.btnUndo.disabled = this.currentIndex <= 0;
        if (this.btnRedo) this.btnRedo.disabled = this.currentIndex >= this.history.length - 1;
    }
    
    reset() {
        this.history = [];
        this.currentIndex = -1;
        this.saveState();
    }
}

let caseFormStateManager;
let calFormStateManager;

document.addEventListener('DOMContentLoaded', () => {
    caseFormStateManager = new FormStateManager('case-form', 'ur-toolbar-case');
    calFormStateManager = new FormStateManager('calendar-event-modal', 'ur-toolbar-cal');
    
    const btnBack = document.getElementById('btn-nav-back');
    const btnForward = document.getElementById('btn-nav-forward');
    if (btnBack) btnBack.addEventListener('click', navigateBack);
    if (btnForward) btnForward.addEventListener('click', navigateForward);
});

// TELECOM AUTO-DETECT LOGIC
const TELECOM_PREFIXES = {
    'Cellcard': ['011', '012', '017', '061', '076', '077', '078', '079', '085', '089', '092', '095', '099'],
    'Smart': ['010', '015', '016', '069', '070', '081', '086', '087', '093', '096', '098'],
    'Metfone': ['031', '060', '066', '067', '068', '071', '088', '090', '097']
};

function formatPhoneNumberWithTelecom(phoneStr) {
    if (!phoneStr) return '';
    phoneStr = String(phoneStr);
    
    // Split by slash, comma, or " និង "
    let parts = phoneStr.split(/[\/\,]|និង/);
    let resultParts = parts.map(part => {
        let cleanPhone = part.replace(/\s*\([a-zA-Z\s]+\)$/, '').trim();
        let digits = cleanPhone.replace(/[\s-]/g, '');
        let khmerToEng = { '០':'0', '១':'1', '២':'2', '៣':'3', '៤':'4', '៥':'5', '៦':'6', '៧':'7', '៨':'8', '៩':'9' };
        let engDigits = digits.replace(/[០-៩]/g, m => khmerToEng[m]);
        if (engDigits.length >= 3) {
            let prefix = engDigits.substring(0, 3);
            let network = null;
            for (const [net, prefixes] of Object.entries(TELECOM_PREFIXES)) {
                if (prefixes.includes(prefix)) {
                    network = net;
                    break;
                }
            }
            if (network) {
                return `${cleanPhone} (${network})`;
            }
        }
        return cleanPhone;
    });
    
    return resultParts.filter(Boolean).join(' / ');
}

document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = [
        'case-party-a-phone', 
        'case-party-b-phone', 
        'case-party-c-phone'
    ];
    
    phoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() {
                this.value = formatPhoneNumberWithTelecom(this.value);
            });
        }
    });
});



window.openOutcomeModal = function(id) {
    const c = (typeof casesData !== 'undefined' ? casesData : []).find(x => x.id === id) || (typeof getCaseById === 'function' ? getCaseById(id) : null);
    if (!c) return;

    const caseIdInput = document.getElementById('outcome-event-case-id');
    const caseInfoEl = document.getElementById('outcome-case-info');
    const partiesInfoEl = document.getElementById('outcome-parties-info');
    const notesEl = document.getElementById('outcome-notes');

    if (caseIdInput) caseIdInput.value = id;
    if (caseInfoEl) caseInfoEl.textContent = `សំណុំរឿងលេខ៖ #${c.caseNumber} (${c.caseEvent || 'កិច្ចប្រជុំ'})`;
    if (partiesInfoEl) partiesInfoEl.textContent = `ភាគី៖ ${c.partyA_name || ''} vs ${c.partyB_name || ''}`;

    const choice = c.eventOutcome || 'settled';
    const radios = document.getElementsByName('outcome-choice');
    radios.forEach(r => {
        r.checked = (r.value === choice);
    });

    const sub = document.getElementById('unsuccessful-sub-options');
    if (sub) {
        sub.style.display = (choice === 'unsuccessful') ? 'flex' : 'none';
        if (c.unsuccessfulReason) {
            const subRadios = document.getElementsByName('unsuccessful-reason');
            subRadios.forEach(sr => {
                sr.checked = (sr.value === c.unsuccessfulReason);
            });
        }
    }

    if (notesEl) notesEl.value = c.eventNotes || '';

    const modal = document.getElementById('event-outcome-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.closeOutcomeModal = function() {
    const modal = document.getElementById('event-outcome-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.handleSaveOutcomeForm = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('outcome-event-case-id')?.value;
    const c = (typeof casesData !== 'undefined' ? casesData : []).find(x => x.id === id) || (typeof getCaseById === 'function' ? getCaseById(id) : null);
    if (!c) return;

    const radios = document.getElementsByName('outcome-choice');
    let selectedOutcome = 'settled';
    for (const r of radios) {
        if (r.checked) {
            selectedOutcome = r.value;
            break;
        }
    }

    let reason = null;
    let outcomeLabelKh = 'សម្រុះសម្រួលជោគជ័យ (ព្រមព្រៀង)';
    if (selectedOutcome === 'unsuccessful') {
        const subRadios = document.getElementsByName('unsuccessful-reason');
        for (const sr of subRadios) {
            if (sr.checked) {
                reason = sr.value;
                break;
            }
        }
        outcomeLabelKh = 'មិនជោគជ័យ';
        if (reason === 'no-agreement') outcomeLabelKh += ' (ភាគីមិនព្រមព្រៀង)';
        else if (reason === 'no-show') outcomeLabelKh += ' (ភាគីមិនចូលរួម)';
        else if (reason === 'withdrawn') outcomeLabelKh += ' (សុំដកពាក្យបណ្តឹង)';
    } else if (selectedOutcome === 'shelved') {
        outcomeLabelKh = 'តម្កល់សំណុំរឿង';
    } else if (selectedOutcome === 'continued') {
        outcomeLabelKh = 'បន្តកាលបរិច្ឆេទប្រជុំលើកក្រោយ';
    }

    const notes = (document.getElementById('outcome-notes')?.value || '').trim();

    // Store in case
    c.eventOutcome = selectedOutcome;
    c.unsuccessfulReason = reason;
    c.eventNotes = notes;
    c.eventOutcomeDate = new Date().toISOString().split('T')[0];

    // Log to event history
    if (!c.eventHistory) c.eventHistory = [];
    c.eventHistory.push({
        eventName: c.caseEvent,
        eventDate: c.caseEventDate,
        result: outcomeLabelKh,
        details: notes,
        loggedAt: new Date().toISOString()
    });

    // Update main status based on mediation outcome
    if (selectedOutcome === 'settled') {
        c.status = 'Settle (ព្រមព្រៀង)';
        c.remarks = 'បានបិទរួចរាល់';
    } else if (selectedOutcome === 'unsuccessful') {
        c.status = 'Close (មិនជោគជ័យ)';
        c.remarks = outcomeLabelKh;
    } else if (selectedOutcome === 'shelved') {
        c.status = 'Pending (តម្កល់)';
        c.remarks = 'តម្កល់សំណុំរឿង';
    } else if (selectedOutcome === 'continued') {
        c.status = 'Active (កំពុងសម្រុះសម្រួល)';
        c.remarks = 'បន្តនីតិវិធី';
    }

    if (typeof saveCases === 'function') saveCases();
    if (typeof renderUpcomingEventsTable === 'function') renderUpcomingEventsTable();
    if (typeof renderAnalyticsView === 'function') renderAnalyticsView();
    if (typeof renderDashboardStats === 'function') renderDashboardStats();
    if (typeof applyFiltersAndRenderMasterTable === 'function') applyFiltersAndRenderMasterTable();

    if (typeof logAuditAction === 'function') {
        logAuditAction('កត់ត្រាលទ្ធផលកម្មវិធី', `បានកត់ត្រាលទ្ធផលកម្មវិធីសម្រាប់សំណុំរឿង ${c.caseNumber} (${outcomeLabelKh})`);
    }
    if (typeof showToast === 'function') showToast('បានកត់ត្រាលទ្ធផលកម្មវិធីដោយជោគជ័យ!', 'success');

    closeOutcomeModal();
};

// Backward-compatible alias
window.openEventResultModal = function(id) {
    window.openOutcomeModal(id);
};

// Delete Event Logic with Modal
let pendingDeleteEventId = null;

window.confirmDeleteEvent = function(id) {
    const c = (typeof casesData !== 'undefined' ? casesData : []).find(x => x.id === id) || (typeof getCaseById === 'function' ? getCaseById(id) : null);
    if (!c) return;
    pendingDeleteEventId = id;
    const promptEl = document.getElementById('delete-event-prompt-text');
    if (promptEl) {
        promptEl.textContent = `តើអ្នកពិតជាចង់លុបកម្មវិធីសំណុំរឿងលេខ #${c.caseNumber} (${c.partyA_name || ''}) មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`;
    }
    const modal = document.getElementById('event-delete-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    } else {
        if (confirm(`តើអ្នកពិតជាចង់លុបកម្មវិធីសំណុំរឿងលេខ #${c.caseNumber} មែនទេ?`)) {
            executeDeleteEvent(id);
        }
    }
};

window.closeDeleteEventModal = function() {
    const modal = document.getElementById('event-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
    pendingDeleteEventId = null;
};

window.executeDeleteEvent = function(id) {
    const caseId = id || pendingDeleteEventId;
    const c = (typeof casesData !== 'undefined' ? casesData : []).find(x => x.id === caseId) || (typeof getCaseById === 'function' ? getCaseById(caseId) : null);
    if (c) {
        let oldEvent = c.caseEvent;
        c.caseEvent = '';
        c.caseEventDate = '';
        c.caseEventTime = '';
        c.eventOutcome = null;
        c.unsuccessfulReason = null;
        
        if (oldEvent && oldEvent.includes('7.1')) c.meetingPartyA = 'មិនទាន់ប្រជុំ';
        else if (oldEvent && oldEvent.includes('7.2')) c.meetingPartyB = 'មិនទាន់ប្រជុំ';
        else if (oldEvent && oldEvent.includes('7.3')) c.mediationMeeting = 'មិនទាន់ប្រជុំ';

        if (typeof saveCases === 'function') saveCases();
        if (typeof showToast === 'function') showToast('បានលុបកម្មវិធីសំណុំរឿងដោយជោគជ័យ!', 'success');
        if (typeof renderUpcomingEventsTable === 'function') renderUpcomingEventsTable();
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderDashboardStats === 'function') renderDashboardStats();
    }
    closeDeleteEventModal();
};

// deleteEventWithoutResult replaced above

window.switchPhaseTab = function(caseId, phaseNum) {
    document.querySelectorAll('#phase-tracker-container-' + caseId + ' .phase-step').forEach((el, index) => {
        el.className = 'phase-step';
        if (index + 1 < phaseNum) el.classList.add('completed');
        if (index + 1 == phaseNum) el.classList.add('active');
    });
    
    document.querySelectorAll('#phase-tracker-container-' + caseId + ' .phase-content-panel').forEach(el => {
        el.classList.remove('active');
    });
    
    const panel = document.getElementById('phase-panel-' + phaseNum + '-' + caseId);
    if (panel) panel.classList.add('active');
    
    const select = document.getElementById('ph_current_' + caseId);
    if (select) select.value = phaseNum;
};

window.savePhaseData = function(caseId, isModal) {
    const cIndex = window.filteredCasesCache.findIndex(x => x.id === caseId) !== -1 ? window.filteredCasesCache.findIndex(x => x.id === caseId) : (typeof casesData !== 'undefined' ? casesData.findIndex(x => x.id === caseId) : -1);
    const c = window.filteredCasesCache[cIndex] || casesData[cIndex];
    if (!c) return;
    
    const phases = {
        currentPhase: parseInt(document.getElementById('ph_current_' + caseId).value),
        p1_1: document.getElementById('ph_1_1_' + caseId)?.value || '',
        p1_2_1: document.getElementById('ph_1_2_1_' + caseId)?.value || '',
        p1_2_2_type: document.getElementById('ph_1_2_2_type_' + caseId)?.value || '',
        p1_2_2: document.getElementById('ph_1_2_2_' + caseId)?.value || '',
        p1_2_3_type: document.getElementById('ph_1_2_3_type_' + caseId)?.value || '',
        p1_2_3: document.getElementById('ph_1_2_3_' + caseId)?.value || '',
        p1_3: document.getElementById('ph_1_3_' + caseId)?.value || '',
        
        p2_1: document.getElementById('ph_2_1_' + caseId)?.value || '',
        p2_2: document.getElementById('ph_2_2_' + caseId)?.value || '',
        p2_3: document.getElementById('ph_2_3_' + caseId)?.value || '',
        p2_4: document.getElementById('ph_2_4_' + caseId)?.value || '',
        p2_5: document.getElementById('ph_2_5_' + caseId)?.value || '',
        p2_6: document.getElementById('ph_2_6_' + caseId)?.value || '',
        
        p3_1: document.getElementById('ph_3_1_' + caseId)?.value || '',
        p3_2: document.getElementById('ph_3_2_' + caseId)?.value || '',
        p3_3: document.getElementById('ph_3_3_' + caseId)?.value || '',
        p3_4: document.getElementById('ph_3_4_' + caseId)?.value || ''
    };
    
    c.casePhases = phases;
    
    const syncStatus = document.getElementById('ph_sync_status_' + caseId)?.checked;
    if (syncStatus) {
        if (phases.currentPhase === 3 && (phases.p3_1 || phases.p3_4)) {
            c.status = 'Completed';
        } else if (phases.currentPhase >= 1) {
            c.status = 'Active';
        }
    }
    
    saveCasesToLocalStorage();
    
    if (typeof logAuditAction === 'function') logAuditAction('កែប្រែចំណាត់ការ', 'បានធ្វើបច្ចុប្បន្នភាពវគ្គចំណាត់ការសំណុំរឿង លេខ ' + c.caseNumber);
    if (typeof showToast === 'function') showToast('រក្សាទុកចំណាត់ការសំណុំរឿងបានជោគជ័យ!', 'success');
    
    applyFiltersAndRenderMasterTable();
    if (typeof openViewModal === 'function' && document.getElementById('view-modal') && document.getElementById('view-modal').style.display !== 'none') openViewModal(caseId);
    if (typeof openEditModal === 'function' && document.getElementById('case-modal') && document.getElementById('case-modal').style.display !== 'none') openEditModal(caseId);
};

function generatePhaseBadge(phases) {
    if (!phases) return '<span class="badge bg-secondary">មិនទាន់កំណត់</span>';
    
    let p = parseInt(phases.currentPhase) || 1;
    
    let p1_progress = 0;
    if(phases.p1_1) p1_progress++;
    if(phases.p1_2_1) p1_progress++;
    if(phases.p1_2_2) p1_progress++;
    if(phases.p1_2_3) p1_progress++;
    if(phases.p1_4) p1_progress++;
    
    let p2_progress = 0;
    if(phases.p2_1) p2_progress++;
    if(phases.p2_2) p2_progress++;
    if(phases.p2_3) p2_progress++;
    if(phases.p2_4) p2_progress++;
    if(phases.p2_5) p2_progress++;
    if(phases.p2_6) p2_progress++;
    
    let p3_progress = 0;
    if(phases.p3_1) p3_progress++;
    if(phases.p3_2) p3_progress++;
    if(phases.p3_3) p3_progress++;
    if(phases.p3_4) p3_progress++;
    
    let html = '<div style="display: flex; align-items: center; justify-content: center; gap: 3px;">';
    
    let p1_color = p >= 1 ? '#10b981' : '#cbd5e1';
    html += `<div style="width: 16px; height: 16px; border-radius: 50%; background: ${p1_color}; color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>`;
    for(let i=0; i<4; i++) {
        let c = (p > 1 || (p == 1 && p1_progress > i+1)) ? '#10b981' : '#e2e8f0';
        html += `<div style="width: 5px; height: 5px; border-radius: 50%; background: ${c}; flex-shrink: 0;"></div>`;
    }
    
    let p2_color = p >= 2 ? '#3b82f6' : '#cbd5e1';
    html += `<div style="width: 16px; height: 16px; border-radius: 50%; background: ${p2_color}; color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>`;
    for(let i=0; i<5; i++) {
        let c = (p > 2 || (p == 2 && p2_progress > i+1)) ? '#3b82f6' : '#e2e8f0';
        html += `<div style="width: 5px; height: 5px; border-radius: 50%; background: ${c}; flex-shrink: 0;"></div>`;
    }
    
    let p3_color = p >= 3 ? '#8b5cf6' : '#cbd5e1';
    html += `<div style="width: 16px; height: 16px; border-radius: 50%; background: ${p3_color}; color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>`;
    for(let i=0; i<3; i++) {
        let c = (p == 3 && p3_progress > i+1) ? '#8b5cf6' : '#e2e8f0';
        html += `<div style="width: 5px; height: 5px; border-radius: 50%; background: ${c}; flex-shrink: 0;"></div>`;
    }
    
    html += '</div>';
    
    let phaseText = p == 1 ? '១. ត្រៀមរៀបចំ' : (p == 2 ? '២. សម្រុះសម្រួល' : '៣. ក្រោយប្រជុំ');
    let textColor = p == 1 ? '#10b981' : (p == 2 ? '#3b82f6' : '#8b5cf6');
    html += `<div style="font-size: 11px; font-weight: bold; color: ${textColor}; margin-top: 6px;">${phaseText}</div>`;
    
    return html;
}

function generatePhaseTrackerHTML(c, isModal = false) {
    const caseId = c.id;
    const phases = c.casePhases || { currentPhase: 1 };
    const p = parseInt(phases.currentPhase) || 1;
    
    const stepperHTML = `<div class="phase-stepper" style="display: flex; align-items: flex-start; justify-content: space-between; position: relative; margin-bottom: 30px; margin-top: 10px; width: 100%;">
        <div style="position: absolute; top: 15px; left: 2%; right: 2%; height: 2px; background: #e2e8f0; z-index: 1;"></div>
        
        <!-- Phase 1 -->
        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; width: 80px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${p >= 1 ? '#10b981' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px; border: 2px solid white; box-shadow: 0 0 0 2px ${p >= 1 ? '#10b981' : '#cbd5e1'};">1</div>
            <div style="font-size: 11px; font-weight: bold; color: ${p >= 1 ? '#10b981' : '#64748b'}; text-align: center;">១. ត្រៀមរៀបចំ</div>
        </div>
        
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>1||(p==1&&phases.p1_1)?'#10b981':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>1||(p==1&&phases.p1_2_1)?'#10b981':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>1||(p==1&&phases.p1_2_2)?'#10b981':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>1||(p==1&&phases.p1_2_3)?'#10b981':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>1||(p==1&&phases.p1_4)?'#10b981':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        
        <!-- Phase 2 -->
        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; width: 80px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${p >= 2 ? '#3b82f6' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px; border: 2px solid white; box-shadow: 0 0 0 2px ${p >= 2 ? '#3b82f6' : '#cbd5e1'};">2</div>
            <div style="font-size: 11px; font-weight: bold; color: ${p >= 2 ? '#3b82f6' : '#64748b'}; text-align: center;">២. សម្រុះសម្រួល</div>
        </div>

        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_1)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_2)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_3)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_4)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_5)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${p>2||(p==2&&phases.p2_6)?'#3b82f6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>

        <!-- Phase 3 -->
        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; width: 80px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${p >= 3 ? '#8b5cf6' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px; border: 2px solid white; box-shadow: 0 0 0 2px ${p >= 3 ? '#8b5cf6' : '#cbd5e1'};">3</div>
            <div style="font-size: 11px; font-weight: bold; color: ${p >= 3 ? '#8b5cf6' : '#64748b'}; text-align: center;">៣. ក្រោយប្រជុំ</div>
        </div>
        
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${(p==3&&phases.p3_1)?'#8b5cf6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${(p==3&&phases.p3_2)?'#8b5cf6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${(p==3&&phases.p3_3)?'#8b5cf6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        <div style="z-index: 2; width: 10px; height: 10px; border-radius: 50%; background: ${(p==3&&phases.p3_4)?'#8b5cf6':'#e2e8f0'}; margin-top: 11px; border: 2px solid white;"></div>
        
        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; width: 40px;">
             <div style="width: 32px; height: 32px; border-radius: 50%; background: ${(p==3&&phases.p3_4)?'#8b5cf6':'#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px; border: 2px solid white; box-shadow: 0 0 0 2px ${(p==3&&phases.p3_4)?'#8b5cf6':'#cbd5e1'};"><i class="fa-solid fa-flag-checkered"></i></div>
             <div style="font-size: 11px; font-weight: bold; color: ${(p==3&&phases.p3_4)?'#8b5cf6':'#64748b'}; text-align: center;">បញ្ចប់</div>
        </div>
    </div>`;

    const inputsHTML = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
        <!-- Panel 1 -->
        <div id="phase-panel-1-${caseId}" class="phase-content-panel ${p === 1 ? 'active' : ''}" style="display: ${p === 1 ? 'block' : 'none'};">
            <div class="row g-3">
                <div class="col-md-12">
                    <label class="form-label" style="font-size: 13px;">១.១ សិក្សាវិភាគសំណុំរឿង</label>
                    <input type="text" class="form-control form-control-sm" id="ph_1_1_${caseId}" value="${phases.p1_1 || ''}">
                </div>
                <div class="col-md-12"><label class="form-label" style="font-size: 13px; color: #475569; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 10px;">១.២ ការប្រមូលព័ត៌មានសំណុំរឿង</label></div>
                
                <div class="col-md-12">
                    <label class="form-label" style="font-size: 13px;">១.២.១ ការចុះប្រមូលព័ត៌មាន ឬសិក្សាសំណុំរឿងនៅទីតាំងវិវាទ</label>
                    <input type="text" class="form-control form-control-sm" id="ph_1_2_1_${caseId}" value="${phases.p1_2_1 || ''}">
                </div>
                
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">១.២.២ ការប្រជុំផ្តល់ព័ត៌មានភាគីស្នើសុំ</label>
                    <div class="input-group input-group-sm">
                        <select class="form-select" id="ph_1_2_2_type_${caseId}" style="max-width: 120px;">
                            <option value="">ជ្រើសរើស...</option>
                            <option value="ប្រជុំផ្ទាល់" ${phases.p1_2_2_type === 'ប្រជុំផ្ទាល់' ? 'selected' : ''}>ប្រជុំផ្ទាល់</option>
                            <option value="តាមអនឡាញ" ${phases.p1_2_2_type === 'តាមអនឡាញ' ? 'selected' : ''}>តាមអនឡាញ</option>
                        </select>
                        <input type="text" class="form-control" id="ph_1_2_2_${caseId}" value="${phases.p1_2_2 || ''}" placeholder="លទ្ធផលចូល...">
                    </div>
                </div>
                
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">១.២.៣ ការប្រជុំផ្តល់ព័ត៌មានភាគីម្ខាងទៀត</label>
                    <div class="input-group input-group-sm">
                        <select class="form-select" id="ph_1_2_3_type_${caseId}" style="max-width: 120px;">
                            <option value="">ជ្រើសរើស...</option>
                            <option value="ប្រជុំផ្ទាល់" ${phases.p1_2_3_type === 'ប្រជុំផ្ទាល់' ? 'selected' : ''}>ប្រជុំផ្ទាល់</option>
                            <option value="តាមអនឡាញ" ${phases.p1_2_3_type === 'តាមអនឡាញ' ? 'selected' : ''}>តាមអនឡាញ</option>
                        </select>
                        <input type="text" class="form-control" id="ph_1_2_3_${caseId}" value="${phases.p1_2_3 || ''}" placeholder="លទ្ធផលចូល...">
                    </div>
                </div>

                <div class="col-md-12">
                    <label class="form-label" style="font-size: 13px;">១.៤ ផ្សេងៗ</label>
                    <input type="text" class="form-control form-control-sm" id="ph_1_3_${caseId}" value="${phases.p1_3 || ''}">
                </div>
            </div>
        </div>
        
        <!-- Panel 2 -->
        <div id="phase-panel-2-${caseId}" class="phase-content-panel ${p === 2 ? 'active' : ''}" style="display: ${p === 2 ? 'block' : 'none'};">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.១ ការសម្រុះសម្រួលលើកទី១</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_1_${caseId}" value="${phases.p2_1 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.២ ការសម្រុះសម្រួលលើកទី២</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_2_${caseId}" value="${phases.p2_2 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.៣ ការសម្រុះសម្រួលលើកទី៣</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_3_${caseId}" value="${phases.p2_3 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.៤ ការសម្រុះសម្រួលលើកទី៤</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_4_${caseId}" value="${phases.p2_4 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.៥ ការសម្រុះសម្រួលលើកទី៥</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_5_${caseId}" value="${phases.p2_5 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">២.៦ ផ្សេងៗ</label>
                    <input type="text" class="form-control form-control-sm" id="ph_2_6_${caseId}" value="${phases.p2_6 || ''}">
                </div>
            </div>
        </div>
        
        <!-- Panel 3 -->
        <div id="phase-panel-3-${caseId}" class="phase-content-panel ${p === 3 ? 'active' : ''}" style="display: ${p === 3 ? 'block' : 'none'};">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">៣.១ ការធ្វើរបាយការណ៍/សំណើសុំបិទសំណុំរឿង</label>
                    <input type="text" class="form-control form-control-sm" id="ph_3_1_${caseId}" value="${phases.p3_1 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">៣.២ ភាគីប្តឹងតវ៉ា</label>
                    <input type="text" class="form-control form-control-sm" id="ph_3_2_${caseId}" value="${phases.p3_2 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">៣.៣ ការសម្រុះសម្រួលឡើងវិញ</label>
                    <input type="text" class="form-control form-control-sm" id="ph_3_3_${caseId}" value="${phases.p3_3 || ''}">
                </div>
                <div class="col-md-6">
                    <label class="form-label" style="font-size: 13px;">៣.៤ ការចេញរូបមន្តអនុវត្ត</label>
                    <input type="text" class="form-control form-control-sm" id="ph_3_4_${caseId}" value="${phases.p3_4 || ''}">
                </div>
            </div>
        </div>
    </div>
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <div>
            <input type="checkbox" id="ph_sync_status_${caseId}" checked> 
            <label for="ph_sync_status_${caseId}" style="font-size: 12px; color: #64748b; cursor: pointer;">ធ្វើបច្ចុប្បន្នភាព លទ្ធផលសំណុំរឿង ស្វ័យប្រវត្តិ (Active/Completed)</label>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="savePhaseData('${caseId}', ${isModal})"><i class="fa-solid fa-save"></i> រក្សាទុកចំណាត់ការ</button>
    </div>
    `;

    return `
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px;" id="phase-tracker-container-${caseId}">
            <h4 style="color: #1e293b; font-weight: 700; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="fa-solid fa-tasks text-primary"></i> វគ្គចំណាត់ការសំណុំរឿង (Case Action Phases)</span>
                <select id="ph_current_${caseId}" onchange="switchPhaseTab('${caseId}', this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 13px;">
                    <option value="1" ${p===1 ? 'selected':''}>ស្ថិតក្នុងវគ្គទី ១ (ត្រៀមរៀបចំ)</option>
                    <option value="2" ${p===2 ? 'selected':''}>ស្ថិតក្នុងវគ្គទី ២ (សម្រុះសម្រួល)</option>
                    <option value="3" ${p===3 ? 'selected':''}>ស្ថិតក្នុងវគ្គទី ៣ (ក្រោយប្រជុំ)</option>
                </select>
            </h4>
            ${stepperHTML}
            ${inputsHTML}
        </div>
    `;
}
