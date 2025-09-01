// ─────────────────────────────────────────────────────────────────────────────
// 🏢 Load Other Non-Court Event Types from Sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads non-court calendar event types with keyword match and descriptions.
 * @returns {Array} list of { category, keywords, description }
 */
function loadOtherEventTypesFromSheet() {
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
    Logger.log('📦 Raw Decoded Secret:');
    Logger.log(decoded);

    const sheetMap = JSON.parse(decoded);
    const sheetId = sheetMap["Calendar_Events_OtherThanCourt"];
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("EventTypes");
    const rows = sheet.getDataRange().getValues();

    const eventTypes = [];
    for (let i = 1; i < rows.length; i++) {
      const [category, keywords, description] = rows[i];
      if (category && keywords && description) {
        eventTypes.push({
          category,
          keywords: keywords.split(',').map(s => s.trim().toLowerCase()),
          description
        });
      }
    }

    Logger.log(`📋 Loaded ${eventTypes.length} other event types.`);
    return eventTypes;

  } catch (e) {
    Logger.log(`❌ Failed to load other event types: ${e.message}`);
    return [];
  }
}