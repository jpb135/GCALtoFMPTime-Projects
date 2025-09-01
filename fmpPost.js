function createFileMakerRecord(recordData) {
  const { token, fmConfig } = getFileMakerToken();

  const createUrl = `${fmConfig.host}/fmi/data/vLatest/databases/${fmConfig.db}/layouts/${fmConfig.layout}/records`;
  const createResponse = UrlFetchApp.fetch(createUrl, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(recordData),
    muteHttpExceptions: true
  });

  logoutFileMakerToken(token, fmConfig);

  const createData = JSON.parse(createResponse.getContentText());

  if (createResponse.getResponseCode() === 200 && createData.messages[0].code === '0') {
    return { recordId: createData.response.recordId };
  } else {
    throw new Error('FileMaker record creation failed: ' + createResponse.getContentText());
  }
}
