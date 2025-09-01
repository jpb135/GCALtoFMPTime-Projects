// ─────────────────────────────────────────────────────────────────────────────
// 🔁 DAILY CLIENT SYNC FROM FILEMAKER TO UID_Map SHEET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a smart daily time-based trigger to sync clients at 3PM local time.
 * Uses smart sync to prevent multiple syncs per day when deployed as library.
 */
function createDailyClientSyncTrigger() {
  return createSmartDailyClientSyncTrigger();
}

/**
 * Main client sync function - now uses smart sync with timestamp checking.
 * Prevents multiple syncs per day when deployed to multiple users.
 */
function syncClientsToUIDSheet() {
  return smartSyncClientsToUIDSheet();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use syncClientsToUIDSheet() which now includes smart sync
 */
function syncClientsToUIDSheetLegacy() {
  try {
    Logger.log('👥 Syncing clients to UID_Map sheet (legacy mode)...');

    // STEP 1: Load Sheet ID from Secret Manager
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const secretResponse = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      }
    });
    const raw = JSON.parse(secretResponse.getContentText());
    const secrets = JSON.parse(Utilities.newBlob(Utilities.base64Decode(raw.payload.data)).getDataAsString());
    const sheetId = secrets['clientMatch'];

    // STEP 2: Get FileMaker token + query for active clients
    const { token, fmConfig } = getFileMakerToken();
    const findUrl = `${fmConfig.host}/fmi/data/vLatest/databases/${fmConfig.db}/layouts/systemgoogle_activeClient/_find`;
    const queryPayload = {
      query: [{ "Active Inactive": "Active" }],
      limit: "90000"
    };

    const response = UrlFetchApp.fetch(findUrl, {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(queryPayload),
      muteHttpExceptions: true
    });

    logoutFileMakerToken(token, fmConfig);

    if (response.getResponseCode() !== 200) {
      throw new Error('❌ FileMaker client query failed: ' + response.getContentText());
    }

    const data = JSON.parse(response.getContentText());
    const clients = data.response.data;

    // STEP 3: Write results to UID_Map sheet
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('UID_Map');
    sheet.clearContents();
    sheet.appendRow(['First Name', 'Last Name', 'UID_Client_PK']);

    clients.forEach(record => {
      const first = record.fieldData['First Name'];
      const last = record.fieldData['Last Name'];
      const uid = record.fieldData['UID Client'];
      if (first && last && uid) {
        sheet.appendRow([first, last, uid]);
      }
    });

    Logger.log(`✅ Synced ${clients.length} clients to sheet.`);

  } catch (err) {
    Logger.log(`❌ Error syncing clients to sheet: ${err.message}`);
    // sendSyncFailureEmail("FM Client Sync", err);
  }
}
