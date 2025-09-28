// ─────────────────────────────────────────────────────────────────────────────
// 📅 Unified Calendar Processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process calendar events using the new unified event vocabulary approach.
 * Implements the improved processing order: client → event → location → description
 * 
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} detailed processing results with success/failure counts
 */
function processCalendarEventsUnified(startDate, endDate) {
  try {
    Logger.log('🎯 Starting unified calendar event processing...');
    
    // Load required mappings
    const clientMap = loadClientMappingFromSheet();
    const currentUserId = getCurrentUserId();
    
    // Fetch calendar events
    const events = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate);
    const matchedPayloads = [];
    const processingStats = {
      totalEvents: events.length,
      processedEvents: 0,
      clientMatches: 0,
      eventMatches: 0,
      courtEvents: 0,
      clientEvents: 0
    };
    
    Logger.log(`📊 Found ${events.length} calendar events to process`);
    
    // Process each event
    events.forEach(event => {
      const title = event.getTitle();
      const start = event.getStartTime();
      const end = event.getEndTime();
      
      // Skip all-day events and multi-day events
      if (event.isAllDayEvent() || !_isSameDay(start, end)) {
        Logger.log(`⏭️ Skipping: "${title}" (all-day or multi-day)`);
        return;
      }
      
      processingStats.processedEvents++;
      
      // Step 1: Client Detection (existing logic)
      const clientMatch = matchClientFromTitle(title, clientMap);
      if (clientMatch) {
        processingStats.clientMatches++;
        Logger.log(`👤 Client matched: "${title}" → ${clientMatch.matchedName}`);
      } else {
        Logger.log(`👤 No client match for: "${title}" - processing without client`);
      }
      
      // Step 2-4: Unified Event Processing (new approach)
      const summary = generateUnifiedSummary(title, clientMatch);
      
      // Track event types for statistics
      if (summary.includes('Appeared before Judge')) {
        processingStats.courtEvents++;
      } else {
        processingStats.clientEvents++;
      }
      
      processingStats.eventMatches++;
      
      // Create FileMaker payload
      const duration = _calculateRoundedDuration(start, end);
      const dateString = formatDateForFileMaker(start);
      
      matchedPayloads.push({
        fieldData: {
          UID_Client_fk: clientMatch ? clientMatch.uid : null, // Allow null for no client
          Body: title,
          Date: dateString,
          Time: duration,
          Summary: summary,
          UID_User_fk: currentUserId
        }
      });
      
      Logger.log(`📝 Created payload: ${summary} (${duration}h)`);
    });
    
    Logger.log(`📊 Processing Stats:`, processingStats);
    Logger.log(`📌 Prepared ${matchedPayloads.length} records for FileMaker`);
    
    // Send to FileMaker
    let successCount = 0;
    let failureCount = 0;
    
    matchedPayloads.forEach((payload, index) => {
      try {
        const result = createFileMakerRecord(payload);
        Logger.log(`✅ Record ${index + 1}: Created FileMaker record ${result.recordId}`);
        successCount++;
      } catch (error) {
        Logger.log(`❌ Record ${index + 1}: Failed to create FileMaker record: ${error.message}`);
        failureCount++;
      }
    });
    
    const finalResult = {
      status: failureCount === 0 ? 'SUCCESS' : (successCount > 0 ? 'PARTIAL' : 'FAILURE'),
      successful: successCount,
      failed: failureCount,
      totalProcessed: matchedPayloads.length,
      stats: processingStats
    };
    
    Logger.log(`🎯 Unified processing complete:`, finalResult);
    return finalResult;
    
  } catch (error) {
    Logger.log(`❌ Unified calendar processing failed: ${error.message}`);
    throw new Error(`Unified calendar processing failed: ${error.message}`);
  }
}

/**
 * Test the unified processing approach with a sample date range
 * @param {Date} testDate - Optional test date (defaults to today)
 */
function testUnifiedCalendarProcessing(testDate = null) {
  Logger.log('🧪 Testing Unified Calendar Processing...');
  
  const testStart = testDate || new Date();
  testStart.setHours(0, 0, 0, 0);
  
  const testEnd = new Date(testStart);
  testEnd.setDate(testEnd.getDate() + 1);
  
  Logger.log(`📅 Test date range: ${testStart.toDateString()} to ${testEnd.toDateString()}`);
  
  try {
    const result = processCalendarEventsUnified(testStart, testEnd);
    
    Logger.log('\n📊 Test Results:');
    Logger.log(`   Status: ${result.status}`);
    Logger.log(`   Successful: ${result.successful}`);
    Logger.log(`   Failed: ${result.failed}`);
    Logger.log(`   Total Events: ${result.stats.totalEvents}`);
    Logger.log(`   Client Matches: ${result.stats.clientMatches}`);
    Logger.log(`   Event Matches: ${result.stats.eventMatches}`);
    Logger.log(`   Court Events: ${result.stats.courtEvents}`);
    Logger.log(`   Client Events: ${result.stats.clientEvents}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
    return null;
  }
}

// Comparison function removed - no longer needed since we only use unified system