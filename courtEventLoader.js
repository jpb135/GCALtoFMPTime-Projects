// ─────────────────────────────────────────────────────────────────────────────
// ⚖️ Load Court Event Vocabulary from Google Sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads all event vocabulary with keywords, categories, and billing descriptions.
 * Includes both court events and client services (phone, zoom, office conferences).
 * @returns {Array} list of { keyword, category, priority, billing, notes }
 */
function loadEventVocabularyFromSheet() {
  try {
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const secretResponse = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      }
    });

    const decoded = Utilities.newBlob(Utilities.base64Decode(JSON.parse(secretResponse.getContentText()).payload.data)).getDataAsString();
    const sheetMap = JSON.parse(decoded);
    
    // Use same sheet as judges - just different tab
    const sheetId = sheetMap['courtroom-sheet-id'];
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('EventVocabulary');
    const rows = sheet.getDataRange().getValues();

    const courtEvents = [];
    for (let i = 1; i < rows.length; i++) {
      const [keyword, category, priority, billingDescription, notes] = rows[i];
      if (keyword && category && billingDescription) {
        courtEvents.push({
          keyword: keyword.toLowerCase().trim(),
          category: category,
          priority: priority || 50,
          billing: billingDescription,
          notes: notes || ''
        });
      }
    }

    // Sort by priority (highest first) for better matching
    courtEvents.sort((a, b) => b.priority - a.priority);

    Logger.log(`📋 Loaded ${courtEvents.length} event vocabulary entries.`);
    return courtEvents;

  } catch (e) {
    Logger.log(`❌ Failed to load event vocabulary: ${e.message}`);
    // Fallback to current hardcoded keywords
    return getDefaultCourtEvents();
  }
}

/**
 * Fallback court events if sheet loading fails
 * @returns {Array} default court event definitions
 */
function getDefaultCourtEvents() {
  return [
    { keyword: 'motion', category: 'Motion Practice', priority: 100, billing: 'Motion hearing attendance' },
    { keyword: 'hearing', category: 'General', priority: 90, billing: 'Court hearing attendance' },
    { keyword: 'trial', category: 'Trial', priority: 100, billing: 'Trial proceeding' },
    { keyword: 'settlement', category: 'ADR', priority: 80, billing: 'Settlement conference' },
    { keyword: 'status', category: 'Administrative', priority: 70, billing: 'Status conference' },
    { keyword: 'open', category: 'Administrative', priority: 60, billing: 'Court appearance' },
    { keyword: 'close', category: 'Administrative', priority: 60, billing: 'Court appearance' },
    { keyword: 'voucher', category: 'Administrative', priority: 50, billing: 'Court appearance' }
  ];
}

/**
 * Find the best matching court event from title
 * @param {string} title - Calendar event title
 * @param {Array} courtEvents - Court event types from sheet
 * @returns {Object|null} matching court event or null
 */
function findCourtEventMatch(title, courtEvents) {
  const lowered = title.toLowerCase();
  
  // Find all matches and return the highest priority one
  const matches = courtEvents.filter(event => lowered.includes(event.keyword));
  
  if (matches.length > 0) {
    // Return highest priority match
    return matches[0]; // Already sorted by priority in loadCourtEventTypesFromSheet
  }
  
  return null;
}