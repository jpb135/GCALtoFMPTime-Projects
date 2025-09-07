/**
 * Test function to demonstrate the enhanced logging functionality
 * This will show:
 * 1. All calendar events found
 * 2. Complete client list loaded from sheet
 * 3. Detailed matching process for each event
 * 4. Summary of unmatched events
 */
function testEnhancedLogging() {
  console.log('🧪 TESTING ENHANCED LOGGING SYSTEM');
  console.log('===================================\n');
  
  // Test with yesterday's events (adjust as needed)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Yesterday
  
  console.log(`📅 Processing events from ${startDate.toDateString()} to ${endDate.toDateString()}\n`);
  
  try {
    // Run the main processing function with enhanced logging
    const results = processCalendarEvents(startDate, endDate);
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log('=================');
    console.log(`Status: ${results.status}`);
    console.log(`Events Found: ${results.eventsFound}`);
    console.log(`Successfully Processed: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Runtime: ${results.runtimeSeconds} seconds`);
    
    if (results.errors && results.errors.length > 0) {
      console.log('\n📝 ERROR DETAILS:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error.message}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return { status: 'ERROR', error: error.message };
  }
}

/**
 * Test with a specific date range
 * @param {string} startDateStr - Start date in YYYY-MM-DD format
 * @param {string} endDateStr - End date in YYYY-MM-DD format
 */
function testWithDateRange(startDateStr, endDateStr) {
  console.log('🧪 TESTING WITH CUSTOM DATE RANGE');
  console.log('=================================\n');
  
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  console.log(`📅 Processing events from ${startDate.toDateString()} to ${endDate.toDateString()}\n`);
  
  try {
    const results = processCalendarEvents(startDate, endDate);
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { status: 'ERROR', error: error.message };
  }
}

/**
 * Test client matching only (without creating FileMaker records)
 * This is useful for debugging why certain events aren't matching
 */
function testClientMatchingOnly() {
  console.log('🧪 TESTING CLIENT MATCHING (READ-ONLY)');
  console.log('======================================\n');
  
  try {
    // Load client map
    console.log('Loading client data...');
    const clientMap = loadClientMappingFromSheet();
    
    // Get recent calendar events
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    console.log(`\n📅 Checking events from last 7 days...\n`);
    
    const events = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate);
    
    // Track matching statistics
    let matched = 0;
    let unmatched = 0;
    const unmatchedTitles = [];
    
    console.log('MATCHING RESULTS:');
    console.log('=================');
    
    events.forEach((event, index) => {
      const title = event.getTitle();
      const start = event.getStartTime();
      
      // Skip all-day events
      if (event.isAllDayEvent()) {
        console.log(`Skipping all-day event: "${title}"`);
        return;
      }
      
      // Try to match
      const match = matchClientFromTitle(title, clientMap);
      
      if (match) {
        matched++;
      } else {
        unmatched++;
        unmatchedTitles.push({
          title: title,
          date: start.toDateString()
        });
      }
    });
    
    // Summary
    console.log('\n📊 MATCHING SUMMARY:');
    console.log('===================');
    console.log(`Total Events: ${events.length}`);
    console.log(`Matched: ${matched} (${Math.round(matched/events.length * 100)}%)`);
    console.log(`Unmatched: ${unmatched} (${Math.round(unmatched/events.length * 100)}%)`);
    
    if (unmatchedTitles.length > 0) {
      console.log('\n❌ Events without client matches:');
      unmatchedTitles.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.title}" (${item.date})`);
      });
    }
    
    return {
      totalEvents: events.length,
      matched: matched,
      unmatched: unmatched,
      matchRate: Math.round(matched/events.length * 100) + '%'
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { status: 'ERROR', error: error.message };
  }
}