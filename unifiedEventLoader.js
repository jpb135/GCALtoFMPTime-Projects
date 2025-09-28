// ─────────────────────────────────────────────────────────────────────────────
// 🎯 Unified Event Vocabulary Loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads unified event vocabulary from the new consolidated sheet.
 * Replaces the dual-sheet approach with a single, organized vocabulary.
 * @returns {Array} list of { category, keywords, description }
 */
function loadUnifiedEventVocabulary() {
  try {
    // Direct access to unified events sheet
    const sheetId = '1dvuh7CzamgBlQmCT2ysQOfS-eRMei7GVcV8M-blaWTw';
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Event Types');
    const rows = sheet.getDataRange().getValues();

    const events = [];
    for (let i = 1; i < rows.length; i++) {
      const [category, keywords, description] = rows[i];
      if (category && keywords && description) {
        events.push({
          category: category.trim(),
          keywords: keywords.split('|').map(k => k.trim().toLowerCase()),
          description: description.trim(),
          isCourtEvent: category.toLowerCase() === 'court'
        });
      }
    }

    Logger.log(`🎯 Loaded ${events.length} unified event types.`);
    return events;

  } catch (e) {
    Logger.log(`❌ Failed to load unified event vocabulary: ${e.message}`);
    return getUnifiedEventFallback();
  }
}

/**
 * Fallback unified events if sheet loading fails
 * @returns {Array} basic event definitions
 */
function getUnifiedEventFallback() {
  return [
    { category: 'Telephone Conference', keywords: ['telephone call', 'tc', 'cc', 'conference call', 'call'], description: 'Telephone conference with {Client First Name} {Client Last Name}', isCourtEvent: false },
    { category: 'Zoom Conference', keywords: ['zoom conference', 'zoom', 'zc', 'zoom video conference', 'video conference', 'video'], description: 'Video conference with {Client First Name} {Client Last Name}', isCourtEvent: false },
    { category: 'Office Meeting', keywords: ['office meeting', 'office', 'meeting', 'om'], description: 'Office meeting with {Client First Name} {Client Last Name}', isCourtEvent: false },
    { category: 'Court', keywords: ['motion'], description: 'Appeared before Judge {Judge Last Name} on initial presentation of Motion', isCourtEvent: true },
    { category: 'Court', keywords: ['hearing'], description: 'Appeared before Judge {Judge Last Name} for hearing on Motion', isCourtEvent: true },
    { category: 'Court', keywords: ['open'], description: 'Appeared before Judge {Judge Last Name} to open Estate, have heirship determined, and have representative appointed', isCourtEvent: true },
    { category: 'Court', keywords: ['close'], description: 'Appeared before Judge {Judge Last Name} to present Final Report and Receipts and Approvals from interested parties and to request that the representative be discharged and estate closed.', isCourtEvent: true },
    { category: 'Court', keywords: ['status'], description: 'Appeared before Judge {Judge Last Name} to report on status of Estate Administration', isCourtEvent: true }
  ];
}

/**
 * Find matching event from unified vocabulary using improved keyword matching
 * @param {string} title - Calendar event title (with client name already removed)
 * @param {Array} events - Unified event vocabulary
 * @returns {Object|null} matching event or null
 */
function findUnifiedEventMatch(title, events) {
  const loweredTitle = title.toLowerCase();
  
  // Find all possible matches
  const matches = [];
  
  for (const event of events) {
    for (const keyword of event.keywords) {
      if (loweredTitle.includes(keyword)) {
        matches.push({
          ...event,
          matchedKeyword: keyword,
          keywordLength: keyword.length
        });
      }
    }
  }
  
  if (matches.length === 0) {
    return null;
  }
  
  // If multiple matches, prefer longer/more specific keywords
  matches.sort((a, b) => b.keywordLength - a.keywordLength);
  
  Logger.log(`🎯 Event match: "${matches[0].matchedKeyword}" → ${matches[0].category}`);
  return matches[0];
}

/**
 * Detect Cook County courtroom and judge information
 * @param {string} title - Calendar event title
 * @returns {Object|null} courtroom info { courtroom, judge } or null
 */
function detectCookCountyCourtroom(title) {
  // Look for 4-digit courtroom numbers (Cook County only)
  const courtroomMatch = title.match(/\b(\d{4})\b/);
  
  if (courtroomMatch) {
    const courtroomNumber = courtroomMatch[1];
    
    try {
      // Load judge mapping
      const judgeMap = loadJudgeMapFromSheet();
      const judgeName = judgeMap[courtroomNumber];
      
      if (judgeName) {
        Logger.log(`🏛️ Cook County courtroom ${courtroomNumber} → ${judgeName}`);
        return {
          courtroom: courtroomNumber,
          judge: judgeName.replace('Judge ', '') // Remove "Judge " prefix for template
        };
      } else {
        Logger.log(`🏛️ Cook County courtroom ${courtroomNumber} → No judge mapping found`);
        return {
          courtroom: courtroomNumber,
          judge: '____'
        };
      }
    } catch (e) {
      Logger.log(`❌ Failed to load judge mapping: ${e.message}`);
      return {
        courtroom: courtroomNumber,
        judge: '____'
      };
    }
  }
  
  // No 4-digit courtroom found - not Cook County or no courtroom specified
  return null;
}

/**
 * Generate final billing description using unified event system
 * @param {Object} eventMatch - Matched event from unified vocabulary
 * @param {Object} clientMatch - Client information { firstName, lastName, uid }
 * @param {string} title - Original calendar title for courtroom detection
 * @returns {string} final billing description
 */
function generateUnifiedBillingDescription(eventMatch, clientMatch, title) {
  let description = eventMatch.description;
  
  // Replace client name placeholders
  if (clientMatch) {
    description = description
      .replace('{Client First Name}', clientMatch.firstName || clientMatch.matchedName)
      .replace('{Client Last Name}', clientMatch.lastName || '');
  } else {
    // No client match - use generic placeholders or remove client references
    description = description
      .replace('{Client First Name}', '[Client]')
      .replace('{Client Last Name}', '');
  }
  
  // For court events, handle judge name replacement
  if (eventMatch.isCourtEvent) {
    const courtroomInfo = detectCookCountyCourtroom(title);
    const judgeText = courtroomInfo ? courtroomInfo.judge : '____';
    description = description.replace('{Judge Last Name}', judgeText);
  }
  
  Logger.log(`📝 Generated description: "${description}"`);
  return description;
}