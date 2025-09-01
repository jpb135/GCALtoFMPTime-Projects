// ─────────────────────────────────────────────────────────────────────────────
// 🧠 SMART CLIENT SYNC - PREVENTS MULTIPLE DAILY SYNCS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Smart client sync that checks if already updated today
 * Prevents multiple users from syncing the same day
 */
function smartSyncClientsToUIDSheet() {
  try {
    Logger.log('🧠 Smart client sync: Checking if update needed...');
    
    // Check if already synced today
    if (isClientDataFreshToday()) {
      Logger.log('✅ Client data already synced today. Skipping sync.');
      return {
        status: 'SKIPPED',
        message: 'Client data already current for today',
        lastSync: getLastSyncTimestamp()
      };
    }
    
    Logger.log('🔄 Client data needs update. Starting sync...');
    
    // Perform the sync
    const syncResult = syncClientsToUIDSheetWithTimestamp();
    
    Logger.log(`✅ Smart sync completed: ${syncResult.clientCount} clients`);
    
    return {
      status: 'SUCCESS',
      clientCount: syncResult.clientCount,
      syncTime: new Date().toISOString()
    };
    
  } catch (error) {
    Logger.log(`❌ Smart sync failed: ${error.message}`);
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Check if client data has been synced today
 * @returns {boolean} true if data is fresh for today
 */
function isClientDataFreshToday() {
  try {
    const lastSync = getLastSyncTimestamp();
    
    if (!lastSync) {
      Logger.log('📅 No previous sync found. Update needed.');
      return false;
    }
    
    const today = new Date();
    const syncDate = new Date(lastSync);
    
    // Check if sync was today
    const isSameDay = 
      today.getFullYear() === syncDate.getFullYear() &&
      today.getMonth() === syncDate.getMonth() &&
      today.getDate() === syncDate.getDate();
    
    Logger.log(`📅 Last sync: ${lastSync} | Same day: ${isSameDay}`);
    
    return isSameDay;
    
  } catch (error) {
    Logger.log(`❌ Error checking sync freshness: ${error.message}`);
    return false; // If we can't check, assume we need to sync
  }
}

/**
 * Get the last sync timestamp from the sheet
 * @returns {string|null} ISO timestamp or null if never synced
 */
function getLastSyncTimestamp() {
  try {
    // Load sheet ID
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
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('UID_Map');
    
    // Check if sync timestamp is stored in cell A1 (above headers)
    const timestampCell = sheet.getRange('A1').getValue();
    
    if (timestampCell && timestampCell instanceof Date) {
      return timestampCell.toISOString();
    } else if (timestampCell && typeof timestampCell === 'string') {
      return timestampCell;
    }
    
    return null;
    
  } catch (error) {
    Logger.log(`❌ Error getting last sync timestamp: ${error.message}`);
    return null;
  }
}

/**
 * Sync clients and record timestamp
 * @returns {Object} sync results with client count
 */
function syncClientsToUIDSheetWithTimestamp() {
  try {
    Logger.log('👥 Syncing clients to UID_Map sheet with timestamp...');

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

    // STEP 3: Write results to UID_Map sheet with timestamp
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('UID_Map');
    sheet.clearContents();
    
    // Row 1: Sync timestamp
    sheet.getRange('A1').setValue(new Date());
    sheet.getRange('B1').setValue(`Last sync: ${clients.length} clients`);
    
    // Row 2: Headers
    sheet.getRange('A2:C2').setValues([['First Name', 'Last Name', 'UID_Client_PK']]);

    // Row 3+: Client data
    let row = 3;
    clients.forEach(record => {
      const first = record.fieldData['First Name'];
      const last = record.fieldData['Last Name'];
      const uid = record.fieldData['UID Client'];
      if (first && last && uid) {
        sheet.getRange(row, 1, 1, 3).setValues([[first, last, uid]]);
        row++;
      }
    });

    Logger.log(`✅ Synced ${clients.length} clients to sheet with timestamp.`);
    
    return { clientCount: clients.length };

  } catch (err) {
    Logger.log(`❌ Error syncing clients to sheet: ${err.message}`);
    throw err;
  }
}

/**
 * Create smart daily trigger that uses timestamp checking
 */
function createSmartDailyClientSyncTrigger() {
  // Check if trigger already exists
  const triggers = ScriptApp.getProjectTriggers();
  const existingTrigger = triggers.find(trigger => 
    trigger.getHandlerFunction() === 'smartSyncClientsToUIDSheet'
  );
  
  if (existingTrigger) {
    Logger.log('✅ Smart sync trigger already exists. No action needed.');
    return { status: 'EXISTS', trigger: existingTrigger };
  }
  
  // Create new smart trigger
  const trigger = ScriptApp.newTrigger('smartSyncClientsToUIDSheet')
    .timeBased()
    .atHour(15) // 3 PM
    .everyDays(1)
    .create();
  
  Logger.log('✅ Smart daily client sync trigger created.');
  
  return { status: 'CREATED', trigger: trigger };
}

// Note: loadClientMappingFromSheetSmart() function moved to clientMap.js to avoid duplicates