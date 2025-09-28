/**
 * DEBUG FUNCTIONS - Client Matching Diagnostics
 * Run these to figure out why "Kogut" events aren't being processed
 */

/**
 * Test client matching for specific calendar title
 * @param {string} testTitle - The exact calendar event title to test
 */
function debugSpecificTitle(testTitle) {
  console.log('🔍 DEBUGGING SPECIFIC TITLE:', testTitle);
  
  try {
    // Load actual client data
    const clientMap = loadClientMappingFromSheet();
    console.log(`📋 Loaded ${Object.keys(clientMap).length} clients total`);
    
    // Show first 10 clients for reference
    console.log('📝 First 10 client names loaded:');
    Object.keys(clientMap).slice(0, 10).forEach(name => {
      console.log(`   "${name}" → ${clientMap[name]}`);
    });
    
    // Check if Kogut is in the list
    const kogutVariations = ['kogut', 'Kogut', 'KOGUT'];
    console.log('\n🎯 Checking for Kogut variations:');
    kogutVariations.forEach(variation => {
      const lowerVar = variation.toLowerCase();
      if (clientMap[lowerVar]) {
        console.log(`   ✅ FOUND: "${lowerVar}" → ${clientMap[lowerVar]}`);
      } else {
        console.log(`   ❌ NOT FOUND: "${lowerVar}"`);
      }
    });
    
    // Test the actual matching function
    console.log('\n🧪 Testing matchClientFromTitle function:');
    const match = matchClientFromTitle(testTitle, clientMap);
    if (match) {
      console.log(`   ✅ MATCH FOUND: "${match.name}" → ${match.uid}`);
    } else {
      console.log(`   ❌ NO MATCH for title: "${testTitle}"`);
    }
    
    // Manual search for partial matches
    console.log('\n🔍 Manual search for "kogut" in all client names:');
    const lowerTitle = testTitle.toLowerCase();
    Object.keys(clientMap).forEach(clientName => {
      if (lowerTitle.includes(clientName) || clientName.includes('kogut')) {
        console.log(`   🎯 Potential match: "${clientName}" in "${testTitle}"`);
      }
    });
    
    return {
      clientsLoaded: Object.keys(clientMap).length,
      matchFound: match,
      clientMap: clientMap
    };
    
  } catch (error) {
    console.error('❌ Error in debugSpecificTitle:', error.message);
    return { error: error.message };
  }
}

/**
 * Show all clients containing "kogut" (case insensitive)
 */
function findAllKogutClients() {
  console.log('🔍 SEARCHING FOR ALL KOGUT CLIENTS...');
  
  try {
    const clientMap = loadClientMappingFromSheet();
    const kogutClients = [];
    
    Object.keys(clientMap).forEach(clientName => {
      if (clientName.toLowerCase().includes('kogut')) {
        kogutClients.push({
          name: clientName,
          uid: clientMap[clientName]
        });
      }
    });
    
    console.log(`📋 Found ${kogutClients.length} clients with "kogut":`);
    kogutClients.forEach(client => {
      console.log(`   "${client.name}" → ${client.uid}`);
    });
    
    return kogutClients;
    
  } catch (error) {
    console.error('❌ Error finding Kogut clients:', error.message);
    return { error: error.message };
  }
}

/**
 * Test today's calendar events and show processing details
 */
function debugTodaysEvents() {
  console.log('📅 DEBUGGING TODAY\'S CALENDAR EVENTS...');
  
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24*60*60*1000);
    
    // Load mappings
    const clientMap = loadClientMappingFromSheet();
    
    // Get today's events
    const events = CalendarApp.getDefaultCalendar().getEvents(today, tomorrow);
    console.log(`📅 Found ${events.length} calendar events for today`);
    
    events.forEach((event, index) => {
      const title = event.getTitle();
      const start = event.getStartTime();
      const end = event.getEndTime();
      
      console.log(`\n📌 Event ${index + 1}: "${title}"`);
      console.log(`   ⏰ Time: ${start.toTimeString()} - ${end.toTimeString()}`);
      
      // Check if all-day or multi-day
      if (event.isAllDayEvent()) {
        console.log('   ⚠️ SKIPPED: All-day event');
        return;
      }
      
      if (!_isSameDay(start, end)) {
        console.log('   ⚠️ SKIPPED: Multi-day event');
        return;
      }
      
      // Test client matching
      const match = matchClientFromTitle(title, clientMap);
      if (match) {
        console.log(`   ✅ CLIENT MATCH: "${match.name}" → ${match.uid}`);
        
        // Show what the summary would be
        try {
          const summary = generateUnifiedSummary(title, match);
          console.log(`   📝 SUMMARY: "${summary}"`);
          
          const duration = _calculateRoundedDuration(start, end);
          console.log(`   ⏱️ DURATION: ${duration} hours`);
          
        } catch (summaryError) {
          console.log(`   ❌ Error generating summary: ${summaryError.message}`);
        }
      } else {
        console.log('   ❌ NO CLIENT MATCH - Event would be skipped');
        
        // Show what client names we tried to match against
        const lowerTitle = title.toLowerCase();
        console.log('   🔍 Checking against client names...');
        let foundAny = false;
        Object.keys(clientMap).slice(0, 5).forEach(clientName => {
          if (lowerTitle.includes(clientName)) {
            console.log(`   🎯 Would match: "${clientName}"`);
            foundAny = true;
          }
        });
        if (!foundAny) {
          console.log('   📝 No client name substrings found in title');
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging today\'s events:', error.message);
  }
}

/**
 * Quick test for specific calendar title - call this with your exact event title
 */
function quickTest(eventTitle) {
  console.log(`🧪 QUICK TEST: "${eventTitle}"`);
  return debugSpecificTitle(eventTitle);
}