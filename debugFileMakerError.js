/**
 * Debug FileMaker error 1708 for non-client events
 * Test what happens when we send null vs empty string vs missing field
 */
function debugFileMakerNullClient() {
  console.log('🔍 DEBUGGING FILEMAKER NULL CLIENT ISSUE...');
  
  const testPayloads = [
    {
      name: "Null Client ID",
      fieldData: {
        UID_Client_fk: null,
        Body: "Test Event - Null Client",
        Date: "12/29/2024", 
        Time: 0.4,
        Summary: "Test event with null client",
        UID_User_fk: getCurrentUserId()
      }
    },
    {
      name: "Empty String Client ID", 
      fieldData: {
        UID_Client_fk: "",
        Body: "Test Event - Empty Client",
        Date: "12/29/2024",
        Time: 0.4, 
        Summary: "Test event with empty client",
        UID_User_fk: getCurrentUserId()
      }
    },
    {
      name: "Missing Client Field",
      fieldData: {
        Body: "Test Event - No Client Field",
        Date: "12/29/2024",
        Time: 0.4,
        Summary: "Test event without client field",
        UID_User_fk: getCurrentUserId()
      }
    }
  ];
  
  testPayloads.forEach((test, index) => {
    console.log(`\n🧪 Test ${index + 1}: ${test.name}`);
    console.log('📤 Payload:', JSON.stringify(test, null, 2));
    
    try {
      const result = createFileMakerRecord(test);
      console.log(`✅ SUCCESS: Record created with ID ${result.recordId}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      
      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(error.message.replace('FileMaker record creation failed: ', ''));
        console.log(`   Error Code: ${errorData.messages[0].code}`);
        console.log(`   Error Message: ${errorData.messages[0].message}`);
      } catch (parseError) {
        console.log('   Could not parse error details');
      }
    }
  });
  
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('Based on test results, update the unified system to use the working approach');
}

/**
 * Quick fix: Update error handling to use working client ID format
 */
function getWorkingClientIdFormat() {
  console.log('🔧 Testing which client ID format works...');
  return debugFileMakerNullClient();
}