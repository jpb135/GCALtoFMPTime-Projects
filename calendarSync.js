/**
 * Main calendar synchronization module - uses unified event vocabulary system.
 * Pulls calendar events, transforms them into FileMaker payloads, and sends them in batches.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} detailed processing results with success/failure counts
 */
function processCalendarEvents(startDate, endDate) {
  // Use unified system for all calendar processing
  return processCalendarEventsUnified(startDate, endDate);
}