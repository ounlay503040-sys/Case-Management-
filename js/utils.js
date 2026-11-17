/* ==========================================================================
   KHMER CASE MANAGEMENT SYSTEM - UTILITIES (js/utils.js)
   Helper functions for safe math, formatting, and other common tasks
   ========================================================================== */

/**
 * Safely calculate percentage to avoid division by zero (NaN/Infinity)
 * @param {number} value - The numerator
 * @param {number} total - The denominator
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} - Formatted percentage string
 */
function safePercent(value, total, decimals = 1) {
    if (!total || total === 0) return (0).toFixed(decimals);
    return ((value / total) * 100).toFixed(decimals);
}

/**
 * Safely calculate average to avoid division by zero
 * @param {number} sum - Total sum
 * @param {number} count - Total count
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} - Formatted average string
 */
function safeAvg(sum, count, decimals = 1) {
    if (!count || count === 0) return (0).toFixed(decimals);
    return (sum / count).toFixed(decimals);
}

// Ensure globally available
window.safePercent = safePercent;
window.safeAvg = safeAvg;
