// ─────────────────────────────────────────────────────────────────────────────
// 👨‍⚖️ Load Judge Mapping from Google Sheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads courtroom-to-judge mapping from the 'Judge' tab.
 * @returns {Object} mapping courtroom numbers to judge names
 */
function loadJudgeMapFromSheet() {
  try {
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const secretResponse = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      }
    });

    const rawData = JSON.parse(secretResponse.getContentText());
    const decoded = Utilities.newBlob(Utilities.base64Decode(rawData.payload.data)).getDataAsString();
    Logger.log('📦 Raw Decoded Secret:');
    Logger.log(decoded);

    const sheetMap = JSON.parse(decoded);
    const sheetId = sheetMap['courtroom-sheet-id'];
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Judge');
    const rows = sheet.getDataRange().getValues();

    const map = {};
    for (let i = 1; i < rows.length; i++) {
      const [first, last, courtroom] = rows[i];
      if (courtroom && first && last) {
        map[courtroom.toString()] = `Judge ${last}`;
      }
    }

    Logger.log(`👨‍⚖️ Loaded ${Object.keys(map).length} judge entries.`);
    return map;

  } catch (e) {
    Logger.log(`❌ Failed to load judge map: ${e.message}`);
    return {};
  }
}