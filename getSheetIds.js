/**
 * Helper function to retrieve Google Sheet IDs from Secret Manager
 * Run this to get the sheet ID where you need to add "meeting" as a keyword
 */
function getEventTypesSheetId() {
  try {
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const response = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      }
    });

    const decoded = Utilities.newBlob(Utilities.base64Decode(JSON.parse(response.getContentText()).payload.data)).getDataAsString();
    const sheetMap = JSON.parse(decoded);
    
    const eventTypesSheetId = sheetMap["Calendar_Events_OtherThanCourt"];
    
    Logger.log('📋 EventTypes Sheet Information:');
    Logger.log('Sheet ID: ' + eventTypesSheetId);
    Logger.log('Direct URL: https://docs.google.com/spreadsheets/d/' + eventTypesSheetId + '/edit');
    Logger.log('Tab Name: EventTypes');
    Logger.log('');
    Logger.log('🎯 To add "meeting" as a keyword:');
    Logger.log('1. Open the sheet URL above');
    Logger.log('2. Go to the "EventTypes" tab');
    Logger.log('3. Add a new row with:');
    Logger.log('   - Category: Client Services');
    Logger.log('   - Keywords: meeting');
    Logger.log('   - Description: Client meeting and consultation');
    
    return {
      sheetId: eventTypesSheetId,
      url: 'https://docs.google.com/spreadsheets/d/' + eventTypesSheetId + '/edit',
      tabName: 'EventTypes'
    };

  } catch (error) {
    Logger.log('❌ Error retrieving sheet ID: ' + error.message);
    return null;
  }
}

/**
 * Display all available sheet IDs for reference
 */
function getAllSheetIds() {
  try {
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const response = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      }
    });

    const decoded = Utilities.newBlob(Utilities.base64Decode(JSON.parse(response.getContentText()).payload.data)).getDataAsString();
    const sheetMap = JSON.parse(decoded);
    
    Logger.log('📚 All Available Sheet IDs:');
    for (const [key, sheetId] of Object.entries(sheetMap)) {
      Logger.log(`${key}: ${sheetId}`);
      Logger.log(`URL: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
      Logger.log('');
    }
    
    return sheetMap;

  } catch (error) {
    Logger.log('❌ Error retrieving sheet IDs: ' + error.message);
    return null;
  }
}