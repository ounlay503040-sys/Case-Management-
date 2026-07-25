/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - CHARTS & ANALYTICS LAYER (js/charts.js)
   Handles Chart.js rendering for Status breakdown, 8 Categories, and Top Locations
   ========================================================================== */

let statusChartInstance = null;
let categoryChartInstance = null;
let locationChartInstance = null;

/**
 * Initialize or update Dashboard and Analytics charts
 */
function initOrUpdateCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js library is not loaded!');
        return;
    }

    const stats = getCaseStatistics();
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#1f2937' : '#e2e8f0';

    // 1. Status Doughnut Chart (4 Statuses)
    const ctxStatus = document.getElementById('statusChart')?.getContext('2d');
    if (ctxStatus) {
        if (statusChartInstance) statusChartInstance.destroy();

        statusChartInstance = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Active (កំពុងចាត់ការ)', 'Settle (ព្រមព្រៀង)', 'Close (បិទ)', 'Pending (តម្កល់)'],
                datasets: [{
                    data: [stats.active, stats.settle, stats.close, stats.pending],
                    backgroundColor: [
                        '#3b82f6', // Active - Blue
                        '#10b981', // Settle - Green
                        '#64748b', // Close - Slate
                        '#f59e0b'  // Pending - Amber
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#111827' : '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 12, weight: '600' },
                            padding: 14,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        bodyFont: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 13 },
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const tot = stats.total || 1;
                                const pct = ((val / tot) * 100).toFixed(1);
                                return ` ${context.label}: ${val} ករណី (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }

    // 2. Category Horizontal Bar Chart (8 Categories)
    const ctxCat = document.getElementById('categoryChart')?.getContext('2d');
    if (ctxCat) {
        if (categoryChartInstance) categoryChartInstance.destroy();

        const catLabels = Object.keys(stats.byCategory);
        const catData = Object.values(stats.byCategory);

        categoryChartInstance = new Chart(ctxCat, {
            type: 'bar',
            data: {
                labels: catLabels,
                datasets: [{
                    label: 'ចំនួនសំណុំរឿង',
                    data: catData,
                    backgroundColor: 'rgba(37, 99, 235, 0.85)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: '#1e40af'
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars for long Khmer category names
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 13 },
                        callbacks: {
                            label: (ctx) => ` ចំនួន៖ ${ctx.raw} ករណី`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: textColor, font: { family: "'Kantumruy Pro', sans-serif" } },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor, font: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 12, weight: '500' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

/**
 * Render Location Chart for Analytics View
 */
function renderLocationChart(byLocationObj) {
    const ctxLoc = document.getElementById('locationChart')?.getContext('2d');
    if (!ctxLoc || typeof Chart === 'undefined') return;

    if (locationChartInstance) locationChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#1f2937' : '#e2e8f0';

    // Sort top 7 locations
    const entries = Object.entries(byLocationObj).filter(e => e[1] > 0);
    entries.sort((a, b) => b[1] - a[1]);
    const topEntries = entries.slice(0, 7);
    
    const labels = topEntries.map(e => e[0]);
    const data = topEntries.map(e => e[1]);

    locationChartInstance = new Chart(ctxLoc, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['គ្មានទិន្នន័យ'],
            datasets: [{
                label: 'ចំនួនសំណុំរឿង',
                data: data.length > 0 ? data : [0],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(59, 130, 246, 0.85)',
                    'rgba(245, 158, 11, 0.85)',
                    'rgba(139, 92, 246, 0.85)',
                    'rgba(236, 72, 153, 0.85)',
                    'rgba(20, 184, 166, 0.85)',
                    'rgba(100, 116, 139, 0.85)'
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    bodyFont: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 13 },
                    callbacks: {
                        label: (ctx) => ` ចំនួន៖ ${ctx.raw} ករណី`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: textColor, font: { family: "'Kantumruy Pro', sans-serif" } },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, font: { family: "'Kantumruy Pro', 'Battambang', sans-serif", size: 12, weight: '600' } },
                    grid: { display: false }
                }
            }
        }
    });
}
