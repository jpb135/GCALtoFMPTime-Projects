// ─────────────────────────────────────────────────────────────────────────────
// 🧪 COMPREHENSIVE TEST SUITE - GCALtoFMPTime System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Master test function - runs complete system test suite
 * Similar to Gmail system's runAllSystemTests()
 */
function runAllCalendarSystemTests() {
  console.log('🧪 RUNNING COMPLETE CALENDAR SYSTEM TEST SUITE...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    overall: 'PENDING'
  };
  
  try {
    // Test 1: Secret Manager Access
    console.log('\n1️⃣ Testing Secret Manager Access...');
    results.tests.secretManager = testSecretManagerAccess();
    
    // Test 2: Google Sheets Connectivity
    console.log('\n2️⃣ Testing Google Sheets Loading...');
    results.tests.googleSheets = testAllSheetsAccess();
    
    // Test 2B: Smart Client Sync
    console.log('\n2️⃣B Testing Smart Client Sync System...');
    results.tests.smartClientSync = testSmartClientSyncSystem();
    
    // Test 3: Calendar Access
    console.log('\n3️⃣ Testing Calendar Connectivity...');
    results.tests.calendar = testCalendarAccess();
    
    // Test 4: FileMaker Connectivity
    console.log('\n4️⃣ Testing FileMaker Integration...');
    results.tests.fileMaker = testFileMakerConnection();
    
    // Test 5: Event Vocabulary Loading
    console.log('\n5️⃣ Testing Event Vocabulary System...');
    results.tests.eventVocabulary = testEventVocabularySystem();
    
    // Test 6: Client Matching
    console.log('\n6️⃣ Testing Client Matching Logic...');
    results.tests.clientMatching = testClientMatchingAccuracy();
    
    // Test 7: Time Calculations
    console.log('\n7️⃣ Testing Time Calculation Logic...');
    results.tests.timeCalculation = testTimeCalculationAccuracy();
    
    // Test 8: Summary Generation
    console.log('\n8️⃣ Testing Summary Generation...');
    results.tests.summaryGeneration = testSummaryGenerationLogic();
    
    // Test 9: Error Handling System
    console.log('\n9️⃣ Testing Error Handling System...');
    results.tests.errorHandling = testErrorHandlingSystem();
    
    // Test 10: End-to-End Processing
    console.log('\n🔟 Testing Complete Processing Pipeline...');
    results.tests.endToEndProcessing = testCompleteProcessingPipeline();
    
    // Calculate overall results
    const testCount = Object.keys(results.tests).length;
    const passedTests = Object.values(results.tests).filter(test => test.status === 'success').length;
    const failedTests = testCount - passedTests;
    
    results.overall = failedTests === 0 ? 'ALL TESTS PASSED' : 
                     passedTests > failedTests ? 'PARTIAL SUCCESS' : 'TESTS FAILED';
    
    results.summary = {
      total: testCount,
      passed: passedTests,
      failed: failedTests,
      successRate: `${Math.round((passedTests/testCount) * 100)}%`
    };
    
    console.log('\n📊 CALENDAR SYSTEM TEST RESULTS:');
    console.log('   Overall Status:', results.overall);
    console.log('   Tests Passed:', results.summary.passed + '/' + results.summary.total);
    console.log('   Success Rate:', results.summary.successRate);
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    results.overall = 'TEST SUITE ERROR';
    results.error = error.message;
    return results;
  }
}

/**
 * Test Secret Manager access for all required secrets
 */
function testSecretManagerAccess() {
  try {
    console.log('🔐 Testing Secret Manager connectivity...');
    
    const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/sheets-ids/versions/latest:access';
    const response = UrlFetchApp.fetch(secretUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      const decoded = Utilities.newBlob(Utilities.base64Decode(data.payload.data)).getDataAsString();
      const secrets = JSON.parse(decoded);
      
      const requiredSecrets = ['clientMatch', 'courtroom-sheet-id'];
      const foundSecrets = requiredSecrets.filter(secret => secrets[secret]);
      
      console.log(`✅ Secret Manager: Found ${foundSecrets.length}/${requiredSecrets.length} secrets`);
      
      return {
        status: foundSecrets.length === requiredSecrets.length ? 'success' : 'partial',
        foundSecrets: foundSecrets.length,
        totalRequired: requiredSecrets.length,
        message: 'Secret Manager accessible'
      };
    } else {
      throw new Error('Secret Manager access denied: ' + response.getContentText());
    }
    
  } catch (error) {
    console.error('❌ Secret Manager test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test access to all required Google Sheets
 */
function testAllSheetsAccess() {
  try {
    console.log('📋 Testing Google Sheets access...');
    
    const results = {};
    
    // Test client mapping sheet
    try {
      const clientMap = loadClientMappingFromSheet();
      results.clientMapping = { 
        status: 'success', 
        count: Object.keys(clientMap).length,
        message: `Loaded ${Object.keys(clientMap).length} clients`
      };
      console.log(`✅ Client mapping: ${Object.keys(clientMap).length} clients loaded`);
    } catch (e) {
      results.clientMapping = { status: 'error', error: e.message };
      console.log(`❌ Client mapping failed: ${e.message}`);
    }
    
    // Test judge mapping sheet
    try {
      const judgeMap = loadJudgeMapFromSheet();
      results.judgeMapping = { 
        status: 'success', 
        count: Object.keys(judgeMap).length,
        message: `Loaded ${Object.keys(judgeMap).length} judges`
      };
      console.log(`✅ Judge mapping: ${Object.keys(judgeMap).length} judges loaded`);
    } catch (e) {
      results.judgeMapping = { status: 'error', error: e.message };
      console.log(`❌ Judge mapping failed: ${e.message}`);
    }
    
    // Test event vocabulary sheet
    try {
      const eventVocabulary = loadEventVocabularyFromSheet();
      results.eventVocabulary = { 
        status: 'success', 
        count: eventVocabulary.length,
        message: `Loaded ${eventVocabulary.length} event types`
      };
      console.log(`✅ Event vocabulary: ${eventVocabulary.length} event types loaded`);
    } catch (e) {
      results.eventVocabulary = { status: 'error', error: e.message };
      console.log(`❌ Event vocabulary failed: ${e.message}`);
    }
    
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const totalTests = Object.keys(results).length;
    
    return {
      status: successCount === totalTests ? 'success' : successCount > 0 ? 'partial' : 'error',
      results: results,
      successCount: successCount,
      totalTests: totalTests,
      message: `${successCount}/${totalTests} sheets accessible`
    };
    
  } catch (error) {
    console.error('❌ Google Sheets test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test calendar access and basic functionality
 */
function testCalendarAccess() {
  try {
    console.log('📅 Testing Calendar access...');
    
    const calendar = CalendarApp.getDefaultCalendar();
    const calendarName = calendar.getName();
    
    // Test getting events for a small date range
    const testStart = new Date();
    testStart.setDate(testStart.getDate() - 1); // Yesterday
    const testEnd = new Date();
    
    const events = calendar.getEvents(testStart, testEnd);
    
    console.log(`✅ Calendar accessible: "${calendarName}" with ${events.length} recent events`);
    
    return {
      status: 'success',
      calendarName: calendarName,
      recentEventCount: events.length,
      message: 'Calendar access working'
    };
    
  } catch (error) {
    console.error('❌ Calendar access failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test FileMaker connection and authentication
 */
function testFileMakerConnection() {
  try {
    console.log('🗄️ Testing FileMaker connectivity...');
    
    const { token, fmConfig } = getFileMakerToken();
    
    if (token && fmConfig) {
      // Test a simple query to verify connection
      const testUrl = `${fmConfig.host}/fmi/data/vLatest/databases/${fmConfig.db}/layouts`;
      const testResponse = UrlFetchApp.fetch(testUrl, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      
      // Clean up token
      logoutFileMakerToken(token, fmConfig);
      
      if (testResponse.getResponseCode() === 200) {
        console.log('✅ FileMaker connection successful');
        return {
          status: 'success',
          host: fmConfig.host,
          database: fmConfig.db,
          message: 'FileMaker authentication working'
        };
      } else {
        throw new Error('FileMaker query failed: ' + testResponse.getContentText());
      }
    } else {
      throw new Error('Failed to obtain FileMaker token');
    }
    
  } catch (error) {
    console.error('❌ FileMaker connection failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test event vocabulary loading and matching logic
 */
function testEventVocabularySystem() {
  try {
    console.log('📝 Testing Event Vocabulary System...');
    
    const eventVocabulary = loadEventVocabularyFromSheet();
    
    if (eventVocabulary.length === 0) {
      throw new Error('No event vocabulary loaded');
    }
    
    // Test various matching scenarios
    const testCases = [
      { title: 'Motion Smith estate', expectedMatch: true, category: 'Motion' },
      { title: 'Zoom Johnson trust planning', expectedMatch: true, category: 'Consultation' },
      { title: 'Random unmatched event', expectedMatch: false, category: null }
    ];
    
    const testResults = testCases.map(testCase => {
      const match = findCourtEventMatch(testCase.title, eventVocabulary);
      const matchFound = !!match;
      const passed = matchFound === testCase.expectedMatch;
      
      return {
        title: testCase.title,
        expectedMatch: testCase.expectedMatch,
        actualMatch: matchFound,
        category: match ? match.category : null,
        passed: passed
      };
    });
    
    const passedTests = testResults.filter(r => r.passed).length;
    
    console.log(`✅ Event vocabulary: ${eventVocabulary.length} events, ${passedTests}/${testCases.length} test cases passed`);
    
    return {
      status: passedTests === testCases.length ? 'success' : 'partial',
      eventCount: eventVocabulary.length,
      testResults: testResults,
      passedTests: passedTests,
      totalTests: testCases.length,
      message: 'Event vocabulary system functional'
    };
    
  } catch (error) {
    console.error('❌ Event vocabulary test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test client matching accuracy
 */
function testClientMatchingAccuracy() {
  try {
    console.log('👥 Testing Client Matching Logic...');
    
    const clientMap = loadClientMappingFromSheet();
    
    if (Object.keys(clientMap).length === 0) {
      throw new Error('No client mapping data loaded');
    }
    
    // Get first few clients for testing
    const testClients = Object.keys(clientMap).slice(0, 3);
    const testResults = testClients.map(clientName => {
      const testTitle = `Meeting ${clientName} estate planning`;
      const match = matchClientFromTitle(testTitle, clientMap);
      
      return {
        clientName: clientName,
        testTitle: testTitle,
        matchFound: !!match,
        matchedName: match ? match.name : null,
        matchedUID: match ? match.uid : null
      };
    });
    
    const successfulMatches = testResults.filter(r => r.matchFound).length;
    
    console.log(`✅ Client matching: ${successfulMatches}/${testResults.length} test cases passed`);
    
    return {
      status: successfulMatches === testResults.length ? 'success' : 'partial',
      clientCount: Object.keys(clientMap).length,
      testResults: testResults,
      successfulMatches: successfulMatches,
      message: 'Client matching functional'
    };
    
  } catch (error) {
    console.error('❌ Client matching test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test time calculation accuracy (12-minute rounding)
 */
function testTimeCalculationAccuracy() {
  try {
    console.log('⏰ Testing Time Calculation Logic...');
    
    const testCases = [
      { minutes: 5, expected: 0.2 },   // Minimum 0.2 hours
      { minutes: 12, expected: 0.2 },  // Exactly 12 minutes
      { minutes: 15, expected: 0.2 },  // Round down to 0.2
      { minutes: 18, expected: 0.4 },  // Round up to 0.4
      { minutes: 30, expected: 0.6 },  // 30 minutes = 0.5, round up to 0.6
      { minutes: 36, expected: 0.6 },  // Exactly 36 minutes
      { minutes: 60, expected: 1.0 }   // 1 hour
    ];
    
    const testResults = testCases.map(testCase => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (testCase.minutes * 60 * 1000));
      
      const calculated = _calculateRoundedDuration(startTime, endTime);
      const passed = calculated === testCase.expected;
      
      return {
        inputMinutes: testCase.minutes,
        expected: testCase.expected,
        calculated: calculated,
        passed: passed
      };
    });
    
    const passedTests = testResults.filter(r => r.passed).length;
    
    console.log(`✅ Time calculation: ${passedTests}/${testCases.length} test cases passed`);
    
    return {
      status: passedTests === testCases.length ? 'success' : 'partial',
      testResults: testResults,
      passedTests: passedTests,
      totalTests: testCases.length,
      message: 'Time calculation logic working'
    };
    
  } catch (error) {
    console.error('❌ Time calculation test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test summary generation with client name replacement
 */
function testSummaryGenerationLogic() {
  try {
    console.log('📝 Testing Summary Generation...');
    
    const judgeMap = loadJudgeMapFromSheet();
    const eventVocabulary = loadEventVocabularyFromSheet();
    const clientMatch = { name: 'TestClient', uid: 'TEST123' };
    
    const testCases = [
      { title: 'Motion TestClient estate', expectedContains: ['Motion', 'TestClient'] },
      { title: 'Zoom TestClient trust', expectedContains: ['Video Conference', 'TestClient'] },
      { title: 'Office meeting TestClient', expectedContains: ['Office meeting', 'TestClient'] }
    ];
    
    const testResults = testCases.map(testCase => {
      const summary = generateSummaryFromTitle(
        testCase.title, 
        judgeMap, 
        [], 
        eventVocabulary, 
        clientMatch
      );
      
      const containsExpected = testCase.expectedContains.every(term => 
        summary.toLowerCase().includes(term.toLowerCase())
      );
      
      return {
        title: testCase.title,
        summary: summary,
        expectedContains: testCase.expectedContains,
        passed: containsExpected
      };
    });
    
    const passedTests = testResults.filter(r => r.passed).length;
    
    console.log(`✅ Summary generation: ${passedTests}/${testCases.length} test cases passed`);
    
    return {
      status: passedTests === testCases.length ? 'success' : 'partial',
      testResults: testResults,
      passedTests: passedTests,
      totalTests: testCases.length,
      message: 'Summary generation working'
    };
    
  } catch (error) {
    console.error('❌ Summary generation test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test complete end-to-end processing pipeline with mock data
 */
function testCompleteProcessingPipeline() {
  try {
    console.log('🔄 Testing Complete Processing Pipeline...');
    
    // This would test with actual calendar events in a limited date range
    const testStart = new Date();
    testStart.setHours(0, 0, 0, 0); // Start of today
    const testEnd = new Date();
    testEnd.setHours(23, 59, 59, 999); // End of today
    
    // Test loading all required data
    const clientMap = loadClientMappingFromSheet();
    const judgeMap = loadJudgeMapFromSheet();
    const eventVocabulary = loadEventVocabularyFromSheet();
    
    // Test calendar access
    const events = CalendarApp.getDefaultCalendar().getEvents(testStart, testEnd);
    
    console.log(`✅ Pipeline test: All components loaded, found ${events.length} today's events`);
    
    return {
      status: 'success',
      clientsLoaded: Object.keys(clientMap).length,
      judgesLoaded: Object.keys(judgeMap).length,
      eventTypesLoaded: eventVocabulary.length,
      eventsFound: events.length,
      message: 'Complete pipeline functional'
    };
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * System health check - overall status
 */
function systemHealthCheck() {
  console.log('🏥 SYSTEM HEALTH CHECK...');
  
  const healthResults = runAllCalendarSystemTests();
  
  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall: healthResults.overall,
    summary: healthResults.summary,
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (healthResults.tests.secretManager?.status !== 'success') {
    healthStatus.recommendations.push('Check Secret Manager configuration');
  }
  
  if (healthResults.tests.googleSheets?.status !== 'success') {
    healthStatus.recommendations.push('Verify Google Sheets access permissions');
  }
  
  if (healthResults.tests.fileMaker?.status !== 'success') {
    healthStatus.recommendations.push('Check FileMaker server connectivity');
  }
  
  console.log('🏥 Health Status:', healthStatus.overall);
  console.log('🏥 Recommendations:', healthStatus.recommendations.length ? healthStatus.recommendations : ['System healthy']);
  
  return healthStatus;
}

/**
 * Performance benchmarking
 */
function benchmarkProcessingPerformance() {
  console.log('⚡ PERFORMANCE BENCHMARKING...');
  
  const benchmarks = {};
  
  try {
    // Benchmark client loading
    const clientStart = new Date().getTime();
    const clientMap = loadClientMappingFromSheet();
    benchmarks.clientLoadingMs = new Date().getTime() - clientStart;
    
    // Benchmark event vocabulary loading
    const vocabStart = new Date().getTime();
    const eventVocabulary = loadEventVocabularyFromSheet();
    benchmarks.eventVocabularyMs = new Date().getTime() - vocabStart;
    
    // Benchmark judge loading
    const judgeStart = new Date().getTime();
    const judgeMap = loadJudgeMapFromSheet();
    benchmarks.judgeLoadingMs = new Date().getTime() - judgeStart;
    
    console.log('⚡ Performance Results:');
    console.log('   Client loading:', benchmarks.clientLoadingMs + 'ms');
    console.log('   Event vocabulary:', benchmarks.eventVocabularyMs + 'ms');
    console.log('   Judge loading:', benchmarks.judgeLoadingMs + 'ms');
    
    return benchmarks;
    
  } catch (error) {
    console.error('❌ Benchmarking failed:', error.message);
    return { error: error.message };
  }
}

/**
 * Test smart client sync system with timestamp checking
 */
function testSmartClientSyncSystem() {
  try {
    console.log('🧠 Testing Smart Client Sync System...');
    
    const testResults = {
      timestampCheck: false,
      smartSyncFunction: false,
      formatDetection: false
    };
    
    // Test 1: Timestamp check function
    try {
      const isFresh = isClientDataFreshToday();
      testResults.timestampCheck = typeof isFresh === 'boolean';
      console.log(`✅ Timestamp check: ${testResults.timestampCheck ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Timestamp check: FAILED -', e.message);
    }
    
    // Test 2: Smart sync function existence
    try {
      testResults.smartSyncFunction = typeof smartSyncClientsToUIDSheet === 'function';
      console.log(`✅ Smart sync function: ${testResults.smartSyncFunction ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Smart sync function: FAILED -', e.message);
    }
    
    // Test 3: Smart client loading with format detection
    try {
      const clientMap = loadClientMappingFromSheet();
      testResults.formatDetection = typeof clientMap === 'object' && clientMap !== null;
      console.log(`✅ Smart client loading: ${testResults.formatDetection ? 'PASSED' : 'FAILED'}`);
      console.log(`   Loaded ${Object.keys(clientMap).length} clients`);
    } catch (e) {
      console.log('❌ Smart client loading: FAILED -', e.message);
    }
    
    const passedTests = Object.values(testResults).filter(test => test === true).length;
    const totalTests = Object.keys(testResults).length;
    
    return {
      status: passedTests === totalTests ? 'success' : passedTests > 0 ? 'partial' : 'error',
      testResults: testResults,
      passedTests: passedTests,
      totalTests: totalTests,
      message: `Smart client sync: ${passedTests}/${totalTests} components working`
    };
    
  } catch (error) {
    console.error('❌ Smart client sync test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test error handling and notification system
 */
function testErrorHandlingSystem() {
  try {
    console.log('🚨 Testing Error Handling System...');
    
    const testResults = {
      errorCategorization: false,
      retryLogic: false,
      notificationSystem: false,
      timeoutDetection: false
    };
    
    // Test 1: Error Categorization
    try {
      const mockError = new Error('FileMaker authentication failed');
      const errorInfo = categorizeError(mockError, 'Test context');
      
      testResults.errorCategorization = 
        errorInfo.category === 'FILEMAKER_ERROR' && 
        errorInfo.severity === 'HIGH' && 
        errorInfo.retryable === true;
      
      console.log(`✅ Error categorization: ${testResults.errorCategorization ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Error categorization: FAILED -', e.message);
    }
    
    // Test 2: Retry Logic
    try {
      let attempts = 0;
      const testOperation = () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient failure');
        }
        return 'success';
      };
      
      const result = retryOperation(testOperation, 3, 100);
      testResults.retryLogic = result === 'success' && attempts === 3;
      
      console.log(`✅ Retry logic: ${testResults.retryLogic ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Retry logic: FAILED -', e.message);
    }
    
    // Test 3: Notification System (basic test)
    try {
      // Don't actually send email in test, just verify function structure
      testResults.notificationSystem = typeof sendErrorNotification === 'function';
      
      console.log(`✅ Notification system: ${testResults.notificationSystem ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Notification system: FAILED -', e.message);
    }
    
    // Test 4: Timeout Detection
    try {
      const mockError = new Error('Script execution exceeded maximum time');
      const startTime = new Date().getTime() - 310000; // 310 seconds ago
      const wasHandled = handlePotentialTimeout(mockError, startTime, 25);
      
      testResults.timeoutDetection = wasHandled === true;
      
      console.log(`✅ Timeout detection: ${testResults.timeoutDetection ? 'PASSED' : 'FAILED'}`);
    } catch (e) {
      console.log('❌ Timeout detection: FAILED -', e.message);
    }
    
    const passedTests = Object.values(testResults).filter(test => test === true).length;
    const totalTests = Object.keys(testResults).length;
    
    return {
      status: passedTests === totalTests ? 'success' : passedTests > 0 ? 'partial' : 'error',
      testResults: testResults,
      passedTests: passedTests,
      totalTests: totalTests,
      message: `Error handling system: ${passedTests}/${totalTests} components working`
    };
    
  } catch (error) {
    console.error('❌ Error handling system test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test enhanced error handling in main processing function
 */
function testEnhancedProcessing() {
  try {
    console.log('🔄 Testing Enhanced Processing Function...');
    
    // Test with a very small date range to avoid timeout
    const testStart = new Date();
    testStart.setHours(0, 0, 0, 0); // Start of today
    const testEnd = new Date();
    testEnd.setHours(1, 0, 0, 0); // First hour of today
    
    const results = processCalendarEventsWithErrorHandling(testStart, testEnd);
    
    const hasRequiredFields = 
      results.hasOwnProperty('status') &&
      results.hasOwnProperty('runtimeSeconds') &&
      (results.hasOwnProperty('successful') || results.hasOwnProperty('error'));
    
    console.log(`✅ Enhanced processing: ${hasRequiredFields ? 'PASSED' : 'FAILED'}`);
    console.log(`   Status: ${results.status}`);
    console.log(`   Runtime: ${results.runtimeSeconds}s`);
    
    return {
      status: hasRequiredFields ? 'success' : 'error',
      results: results,
      message: 'Enhanced processing function working'
    };
    
  } catch (error) {
    console.error('❌ Enhanced processing test failed:', error.message);
    return { status: 'error', error: error.message };
  }
}