function getFileMakerToken() {
  const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/filemaker-credentials/versions/latest:access';
  const secretResponse = UrlFetchApp.fetch(secretUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  const secretData = JSON.parse(secretResponse.getContentText());
  const fmConfig = JSON.parse(Utilities.newBlob(Utilities.base64Decode(secretData.payload.data)).getDataAsString());

  const authUrl = `${fmConfig.host}/fmi/data/vLatest/databases/${fmConfig.db}/sessions`;
  const authResponse = UrlFetchApp.fetch(authUrl, {
    method: 'post',
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(fmConfig.user + ':' + fmConfig.pass),
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  const authData = JSON.parse(authResponse.getContentText());

  if (authResponse.getResponseCode() !== 200 || !authData.response || !authData.response.token) {
    throw new Error('❌ Failed to authenticate with FileMaker: ' + authResponse.getContentText());
  }

  Logger.log('🔑 Obtained FileMaker token successfully.');
  return {
    token: authData.response.token,
    fmConfig
  };
}

function logoutFileMakerToken(token, fmConfig) {
  const logoutUrl = `${fmConfig.host}/fmi/data/vLatest/databases/${fmConfig.db}/sessions/${token}`;
  const logoutResponse = UrlFetchApp.fetch(logoutUrl, {
    method: 'delete',
    headers: {
      Authorization: 'Bearer ' + token
    },
    muteHttpExceptions: true
  });

  Logger.log('🚪 Logged out of FileMaker session.');
}
