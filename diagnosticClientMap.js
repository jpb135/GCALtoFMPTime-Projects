/**
 * DIAGNOSTIC: Debug client sheet loading to identify header detection issue
 * This will show us exactly what's in the first few rows of the sheet
 */
function diagnoseClientSheetStructure() {
  try {
    console.log('🔍 DIAGNOSING CLIENT SHEET STRUCTURE...');
    
    // Load the sheet ID from Secret Manager
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
    const secrets = JSON.parse(decoded);

    const sheetId = secrets['clientMatch'];
    console.log(`📋 Opening sheet ID: ${sheetId}`);
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName('UID_Map');
    
    if (!sheet) {
      console.error('❌ UID_Map sheet not found!');
      // List all sheet names
      const allSheets = spreadsheet.getSheets().map(s => s.getName());
      console.log('📋 Available sheets:', allSheets);
      return;
    }
    
    const rows = sheet.getDataRange().getValues();
    console.log(`📊 Sheet has ${rows.length} rows total`);
    
    // Show first 5 rows with detailed analysis
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      console.log(`\n🔍 ROW ${i}:`);
      console.log(`   Length: ${row.length} columns`);
      
      for (let j = 0; j < Math.min(5, row.length); j++) {
        const cell = row[j];
        const cellType = typeof cell;
        const cellValue = cell === null ? 'NULL' : cell === undefined ? 'UNDEFINED' : cell.toString();
        const trimmed = cellValue.trim ? cellValue.trim() : cellValue;
        
        console.log(`   Col ${j}: [${cellType}] "${cellValue}" → trimmed: "${trimmed}"`);
        
        // Check for exact matches with expected headers
        if (i === 0) { // First row header check
          if (j === 0 && trimmed === 'First Name') console.log('     ✅ MATCHES: First Name');
          if (j === 1 && trimmed === 'Last Name') console.log('     ✅ MATCHES: Last Name');  
          if (j === 2 && trimmed === 'UID_Client_PK') console.log('     ✅ MATCHES: UID_Client_PK');
        }
      }
    }
    
    // Test our current header detection logic
    console.log('\n🧪 TESTING CURRENT HEADER DETECTION:');
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const row = rows[i];
      const match = (row[0] === 'First Name' || 
                    (row.length >= 2 && row[1] === 'Last Name') || 
                    (row.length >= 3 && row[2] === 'UID_Client_PK'));
      console.log(`   Row ${i}: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    console.log('\n✅ Diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

/**
 * DIAGNOSTIC: Test the exact header matching conditions
 */
function testHeaderMatching() {
  const testHeaders = [
    ['First Name', 'Last Name', 'UID_Client_PK'],
    [' First Name ', ' Last Name ', ' UID_Client_PK '], // with spaces
    ['First Name\t', 'Last Name\t', 'UID_Client_PK\t'], // with tabs
    ['', '', ''], // empty
    ['John', 'Smith', '1234'] // data row
  ];
  
  console.log('🧪 TESTING HEADER MATCHING CONDITIONS:');
  
  testHeaders.forEach((row, index) => {
    const match = (row[0] === 'First Name' || 
                  (row.length >= 2 && row[1] === 'Last Name') || 
                  (row.length >= 3 && row[2] === 'UID_Client_PK'));
    
    console.log(`\nTest ${index}: [${row.map(c => `"${c}"`).join(', ')}]`);
    console.log(`Result: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    // Individual checks
    console.log(`  Col 0 === 'First Name': ${row[0] === 'First Name'}`);
    console.log(`  Col 1 === 'Last Name': ${row[1] === 'Last Name'}`);  
    console.log(`  Col 2 === 'UID_Client_PK': ${row[2] === 'UID_Client_PK'}`);
  });
}