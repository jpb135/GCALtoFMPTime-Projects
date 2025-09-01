function loadClientMappingFromSheet() {
  // Use smart client loading that handles timestamp format
  return loadClientMappingFromSheetSmart();
}

function loadClientMappingFromSheetLegacy() {
  try {
    // 🔐 Load the sheet ID from Secret Manager
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
    Logger.log("📦 Raw Decoded Secret:\n" + decoded);
    const secrets = JSON.parse(decoded);

    const sheetId = secrets['clientMatch'];
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('UID_Map');
    const rows = sheet.getDataRange().getValues();

    const clientMap = {};

    for (let i = 1; i < rows.length; i++) {
      const [firstName, lastName, uid] = rows[i];
      if (lastName && uid) {
        const key = lastName.toLowerCase().trim();
        clientMap[key] = uid;
      }
    }

    Logger.log(`✅ Loaded ${Object.keys(clientMap).length} clients from sheet.`);
    return clientMap;

  } catch (error) {
    Logger.log('❌ Failed to load client map from sheet: ' + error.message);
    return {};
  }
}

/**
 * Smart client loading that handles both legacy and timestamp formats
 * Automatically detects sheet format and processes accordingly
 */
function loadClientMappingFromSheetSmart() {
  try {
    Logger.log('🔄 Starting smart client loading...');
    
    // Step 1: Get OAuth token
    const token = ScriptApp.getOAuthToken();
    if (!token) {
      throw new Error('Failed to obtain OAuth token');
    }
    Logger.log('✅ OAuth token obtained');
    
    // Step 2: Load the sheet ID from Secret Manager
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    Logger.log('🔐 Fetching secrets from Secret Manager...');
    
    const secretResponse = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    if (secretResponse.getResponseCode() !== 200) {
      throw new Error(`Secret Manager returned ${secretResponse.getResponseCode()}: ${secretResponse.getContentText()}`);
    }
    
    const rawData = JSON.parse(secretResponse.getContentText());
    const decoded = Utilities.newBlob(Utilities.base64Decode(rawData.payload.data)).getDataAsString();
    const secrets = JSON.parse(decoded);
    Logger.log('✅ Secrets loaded from Secret Manager');

    // Step 3: Access Google Sheet
    const sheetId = secrets['clientMatch'];
    Logger.log(`📋 Opening Google Sheet: ${sheetId}`);
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName('UID_Map');
    
    if (!sheet) {
      throw new Error('UID_Map sheet not found');
    }
    Logger.log('✅ Google Sheet accessed successfully');
    
    const rows = sheet.getDataRange().getValues();
    Logger.log(`📊 Loaded ${rows.length} rows from sheet`);

    const clientMap = {};

    if (rows.length < 2) {
      Logger.log('⚠️ UID_Map sheet appears to be empty');
      return clientMap;
    }

    // Auto-detect format: look for header row
    let headerRow = -1;
    let startRow = 1; // Default to row 1 (legacy format)

    // Check first few rows for headers - require ALL headers to be present
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (row.length >= 3 &&
          row[0] === 'First Name' && 
          row[1] === 'Last Name' && 
          row[2] === 'UID_Client_PK') {
        headerRow = i;
        startRow = i + 1;
        Logger.log(`✅ Found complete header row at index ${i}`);
        break;
      }
    }

    Logger.log(`📋 Detected format - Header row: ${headerRow}, Data starts: ${startRow}`);
    
    // Handle case where headers weren't found
    if (headerRow === -1) {
      Logger.log('⚠️ No header row found - using legacy format (start from row 1)');
      startRow = 1; // Skip assumed header row
    }

    // Process client data
    for (let i = startRow; i < rows.length; i++) {
      const [firstName, lastName, uid] = rows[i];
      if (lastName && uid) {
        const key = lastName.toLowerCase().trim();
        clientMap[key] = uid;
      }
    }

    Logger.log(`✅ Smart-loaded ${Object.keys(clientMap).length} clients from sheet.`);
    return clientMap;

  } catch (error) {
    Logger.log('❌ Failed to smart-load client map from sheet: ' + error.message);
    return {};
  }
}
function matchClientFromTitle(title, clientMap) {
  const lowerTitle = title.toLowerCase();
  for (const name in clientMap) {
    if (lowerTitle.includes(name)) {
      return { name, uid: clientMap[name] };
    }
  }
  return null;
}