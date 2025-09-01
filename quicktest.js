function testSecretManagerAccess() {
  const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/filemaker-credentials/versions/latest:access';
  const secretResponse = UrlFetchApp.fetch(secretUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  const rawText = secretResponse.getContentText();
  Logger.log('📦 Raw Secret Response:');
  Logger.log(rawText);

  // Try to parse and decode, but only if safe
  try {
    const secretData = JSON.parse(rawText);
    if (!secretData.payload || !secretData.payload.data) {
      throw new Error("Missing payload.data in secret response");
    }
    const decoded = Utilities.newBlob(Utilities.base64Decode(secretData.payload.data)).getDataAsString();
    Logger.log('🔐 Decoded FileMaker Config:');
    Logger.log(decoded);
  } catch (e) {
    Logger.log('❌ Error parsing secret: ' + e.message);
  }
}