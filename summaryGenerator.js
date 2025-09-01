// ─────────────────────────────────────────────────────────────────────────────
// 🧠 Generate Natural Language Summary of Event Title
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a descriptive sentence summarizing the calendar event.
 * Prioritizes event vocabulary from Google Sheet, falls back to other event types.
 * @param {string} title 
 * @param {Object} judgeMap 
 * @param {Array} otherEventTypes 
 * @param {Array} courtEventTypes - Optional event vocabulary from sheet (loaded externally)
 * @param {Object} clientMatch - Optional client match object with name info
 * @returns {string}
 */
function generateSummaryFromTitle(title, judgeMap, otherEventTypes, courtEventTypes = null, clientMatch = null) {
  const courtroomMatch = title.match(/\b(\d{4})\b/);
  let courtEventMatch = null;
  
  // 🏛 Try to match court events from Google Sheet first
  if (courtEventTypes && Array.isArray(courtEventTypes)) {
    courtEventMatch = findCourtEventMatch(title, courtEventTypes);
  }
  
  // Fallback to legacy hardcoded keywords if no sheet data
  if (!courtEventMatch && !courtEventTypes) {
    const legacyKeywords = ['motion', 'open', 'close', 'settle', 'hearing', 'voucher', 'vouchers', 'status'];
    const typeMatch = legacyKeywords.find(k => title.toLowerCase().includes(k));
    if (typeMatch) {
      courtEventMatch = { keyword: typeMatch, billing: `${typeMatch} proceeding` };
    }
  }

  // 🏛 Court event processing
  if (courtEventMatch || courtroomMatch) {
    let judgePart = '';
    if (courtroomMatch && judgeMap[courtroomMatch[1]]) {
      judgePart = ` before ${judgeMap[courtroomMatch[1]]}`;
    }

    // Use professional billing description if available
    if (courtEventMatch && courtEventMatch.billing) {
      let billingDescription = courtEventMatch.billing;
      
      // Replace [client] placeholder with actual client name if available
      if (clientMatch && clientMatch.name) {
        billingDescription = billingDescription.replace(/\[client\]/g, clientMatch.name);
      }
      
      return `${billingDescription}${judgePart}.`;
    }

    // Legacy format for backward compatibility
    const eventPart = courtEventMatch ? ` on a ${courtEventMatch.keyword}` : '';
    return `Appeared in court${judgePart}${eventPart}.`;
  }

  // 🏢 Non-court events
  if (Array.isArray(otherEventTypes)) {
    for (let matcher of otherEventTypes) {
      if (matcher.keywords.some(term => title.toLowerCase().includes(term))) {
        return matcher.description;
      }
    }
  }

  // 🪵 Default fallback
  return `Calendar event: ${title}`;
}
