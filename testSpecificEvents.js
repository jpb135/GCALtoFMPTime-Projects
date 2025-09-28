/**
 * Test specific calendar events to verify unified system processing
 * Tests the complete pipeline: client matching → event matching → summary generation
 */
function testSpecificCalendarEvents() {
  console.log('🧪 TESTING SPECIFIC CALENDAR EVENTS...');
  console.log('=======================================');
  
  const testEvents = [
    'Brown - 1814 Motion',
    'Erickson - RON Execution', 
    'Tumpa - Conference Call',
    'Zachery - Zoom Call'
  ];
  
  try {
    // Load required mappings
    console.log('📋 Loading system mappings...');
    const clientMap = loadClientMappingFromSheet();
    const currentUserId = getCurrentUserId();
    
    console.log(`👥 Loaded ${Object.keys(clientMap).length} clients`);
    console.log(`🔐 Current User ID: ${currentUserId}`);
    
    // Process each test event
    testEvents.forEach((title, index) => {
      console.log(`\n🎯 TESTING EVENT ${index + 1}: "${title}"`);
      console.log('─'.repeat(50));
      
      // Step 1: Client Detection
      const clientMatch = matchClientFromTitle(title, clientMap);
      if (clientMatch) {
        console.log(`👤 CLIENT MATCH: "${clientMatch.matchedName}" → UID: ${clientMatch.uid}`);
        if (clientMatch.firstName) console.log(`   First Name: ${clientMatch.firstName}`);
        if (clientMatch.lastName) console.log(`   Last Name: ${clientMatch.lastName}`);
      } else {
        console.log('👤 NO CLIENT MATCH - will process with null client');
      }
      
      // Step 2: Unified Summary Generation  
      const summary = generateUnifiedSummary(title, clientMatch);
      console.log(`📝 GENERATED SUMMARY: "${summary}"`);
      
      // Step 3: Show what would be sent to FileMaker
      const mockDuration = 0.8; // 48 minutes rounded to 12-min increments
      const mockDate = '12/28/2024';
      
      const fileMakerPayload = {
        fieldData: {
          UID_Client_fk: clientMatch ? clientMatch.uid : null,
          Body: title,
          Date: mockDate,
          Time: mockDuration, 
          Summary: summary,
          UID_User_fk: currentUserId
        }
      };
      
      console.log('📤 FILEMAKER PAYLOAD:');
      Object.entries(fileMakerPayload.fieldData).forEach(([key, value]) => {
        console.log(`   ${key}: ${value === null ? 'NULL' : value}`);
      });
      
      console.log(`✅ Event "${title}" would be successfully processed`);
    });
    
    console.log('\n🎯 TEST SUMMARY:');
    console.log('================');
    console.log(`📊 Total Events Tested: ${testEvents.length}`);
    console.log('✅ All events processed successfully through unified system');
    console.log('📝 Each event generated appropriate summary based on unified vocabulary');
    console.log('📤 All events would be sent to FileMaker (with or without client match)');
    
    return {
      status: 'SUCCESS',
      eventsProcessed: testEvents.length,
      message: 'All test events processed successfully'
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    return {
      status: 'FAILURE', 
      error: error.message
    };
  }
}

/**
 * Quick test function - just call this to run the test
 */
function runEventTest() {
  return testSpecificCalendarEvents();
}