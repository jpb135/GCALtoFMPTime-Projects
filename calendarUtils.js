// ─────────────────────────────────────────────────────────────────────────────
// 📅 Calendar Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if two Date objects fall on the same calendar day.
 * @param {Date} start 
 * @param {Date} end 
 * @returns {boolean}
 */
function _isSameDay(start, end) {
  if (!start || !end) return false;
  return start.toDateString() === end.toDateString();
}

/**
 * Formats a Date object to ISO string (yyyy-MM-dd) in script timezone.
 * @param {Date} dateObj 
 * @returns {string}
 */
function _formatDate(dateObj) {
  return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Calculates and rounds a time duration to the nearest 0.2 hour (12-minute block).
 * Applies a minimum value of 0.2 hours.
 * @param {Date} start 
 * @param {Date} end 
 * @returns {number}
 */
function _calculateRoundedDuration(start, end) {
  const ms = end - start;
  const hours = ms / 1000 / 60 / 60;
  return Math.max(0.2, Math.round(hours * 5) / 5);
}

/**
 * Escapes characters in a string so it can be safely used in a RegExp.
 * @param {string} str 
 * @returns {string}
 */
function _escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Attempts to find a matching client name from the event title.
 * @param {string} title 
 * @param {Object} clientMap - keyed by lowercase last name
 * @returns {{uid: string, matchedName: string}|null}
 */
function _matchClientFromTitle(title, clientMap) {
  for (const nameKey in clientMap) {
    const regex = new RegExp(`${_escapeRegExp(nameKey)}`, 'i');
    if (regex.test(title)) {
      return { uid: clientMap[nameKey], matchedName: nameKey };
    }
  }
  return null;
}

/**
 * Converts a date to MM/DD/YYYY format for FileMaker ingestion.
 * @param {Date|string} input 
 * @returns {string}
 */
function formatDateForFileMaker(input) {
  const date = (typeof input === 'string') ? new Date(input) : input;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
