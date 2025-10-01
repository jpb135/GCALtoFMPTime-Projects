/**
 * Debug FileMaker error 1708 by testing individual field values
 * This will help identify which specific field is causing the validation error
 */
function debugFileMakerFieldValidation() {
  console.log('🔍 DEBUGGING FILEMAKER FIELD VALIDATION...');
  console.log('Testing O\'Malley event field by field...');
  
  try {
    const currentUserId = getCurrentUserId();
    console.log(`🔐 Current User ID: ${currentUserId}`);
    
    // Test with minimal payload first
    const minimalTest = {
      fieldData: {
        Body: "Test Event",
        Date: "10/01/2025",
        Time: 1.0,
        Summary: "Test summary"
      }
    };
    
    console.log('\n🧪 Test 1: Minimal payload (no client, no user)');
    console.log('📤 Payload:', JSON.stringify(minimalTest, null, 2));
    
    try {
      const result1 = createFileMakerRecord(minimalTest);
      console.log(`✅ SUCCESS: Minimal payload works - Record ID ${result1.recordId}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
    
    // Test adding user ID
    const withUserTest = {
      fieldData: {
        Body: "Test Event",
        Date: "10/01/2025", 
        Time: 1.0,
        Summary: "Test summary",
        UID_User_fk: currentUserId
      }
    };
    
    console.log('\n🧪 Test 2: With User ID');
    console.log('📤 Payload:', JSON.stringify(withUserTest, null, 2));
    
    try {
      const result2 = createFileMakerRecord(withUserTest);
      console.log(`✅ SUCCESS: With User ID works - Record ID ${result2.recordId}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
    
    // Test adding empty client
    const withEmptyClientTest = {
      fieldData: {
        UID_Client_fk: "",
        Body: "Test Event",
        Date: "10/01/2025",
        Time: 1.0, 
        Summary: "Test summary",
        UID_User_fk: currentUserId
      }
    };
    
    console.log('\n🧪 Test 3: With Empty Client');
    console.log('📤 Payload:', JSON.stringify(withEmptyClientTest, null, 2));
    
    try {
      const result3 = createFileMakerRecord(withEmptyClientTest);
      console.log(`✅ SUCCESS: With Empty Client works - Record ID ${result3.recordId}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
    
    // Test the exact O'Malley payload
    const omalleyTest = {
      fieldData: {
        UID_Client_fk: "",
        Body: "O'Malley - 1802 Status",
        Date: "10/01/2025",
        Time: 1.0,
        Summary: "Appeared before Judge Delgado to report on status of Estate Administration",
        UID_User_fk: currentUserId
      }
    };
    
    console.log('\n🧪 Test 4: Exact O\'Malley payload');
    console.log('📤 Payload:', JSON.stringify(omalleyTest, null, 2));
    
    try {
      const result4 = createFileMakerRecord(omalleyTest);
      console.log(`✅ SUCCESS: O'Malley payload works - Record ID ${result4.recordId}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      
      // Let's also test with different date formats
      console.log('\n🧪 Test 4b: O\'Malley with different date format');
      const omalleyDateTest = { ...omalleyTest };
      omalleyDateTest.fieldData.Date = "2025-10-01";
      
      try {
        const result4b = createFileMakerRecord(omalleyDateTest);
        console.log(`✅ SUCCESS: Different date format works - Record ID ${result4b.recordId}`);
      } catch (error2) {
        console.log(`❌ FAILED: Different date format also fails: ${error2.message}`);
      }
    }
    
    console.log('\n📋 ANALYSIS COMPLETE');
    console.log('Check results above to identify which field is causing the validation error');
    
  } catch (error) {
    console.error(`❌ Debug function failed: ${error.message}`);
  }
}

/**
 * Quick test function
 */
function testFileMakerValidation() {
  return debugFileMakerFieldValidation();
}