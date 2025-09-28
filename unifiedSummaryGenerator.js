// ─────────────────────────────────────────────────────────────────────────────
// 📝 Unified Summary Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate professional billing summary using unified event vocabulary.
 * Replaces the old dual-sheet approach with streamlined processing.
 * 
 * Processing Order:
 * 1. Client detection (already done by caller)
 * 2. Event keyword matching from unified vocabulary  
 * 3. Cook County courtroom detection (4-digit numbers only)
 * 4. Template-based description generation
 * 
 * @param {string} title - Calendar event title
 * @param {Object} clientMatch - Client match info { firstName, lastName, uid, matchedName }
 * @returns {string} professional billing description
 */
function generateUnifiedSummary(title, clientMatch) {
  try {
    Logger.log(`🎯 Processing unified summary for: "${title}"`);
    
    // Step 1: Remove client name from title for cleaner event matching
    let cleanTitle = title;
    if (clientMatch && clientMatch.matchedName) {
      // Remove the matched client name to avoid interference with event detection
      const clientNameRegex = new RegExp(clientMatch.matchedName, 'gi');
      cleanTitle = title.replace(clientNameRegex, '').trim();
      Logger.log(`🧹 Cleaned title: "${cleanTitle}"`);
    }
    
    // Step 2: Load unified event vocabulary
    const unifiedEvents = loadUnifiedEventVocabulary();
    
    // Step 3: Find matching event type
    const eventMatch = findUnifiedEventMatch(cleanTitle, unifiedEvents);
    
    if (!eventMatch) {
      Logger.log(`⚠️ No event match found for: "${cleanTitle}"`);
      // Fallback: use original title or generic description
      if (clientMatch) {
        return `Meeting with ${clientMatch.firstName || clientMatch.matchedName} ${clientMatch.lastName || ''}`;
      } else {
        return title; // Keep original title if no client and no event match
      }
    }
    
    // Step 4: Generate final description using templates
    const finalDescription = generateUnifiedBillingDescription(eventMatch, clientMatch, title);
    
    Logger.log(`✅ Final unified summary: "${finalDescription}"`);
    return finalDescription;
    
  } catch (error) {
    Logger.log(`❌ Unified summary generation failed: ${error.message}`);
    // Safe fallback
    return clientMatch 
      ? `Meeting with ${clientMatch.firstName || clientMatch.matchedName} ${clientMatch.lastName || ''}`
      : title;
  }
}

/**
 * Test function for unified summary generation
 * Run this to validate the new approach with sample data
 */
function testUnifiedSummaryGeneration() {
  Logger.log('🧪 Testing Unified Summary Generation...');
  
  const testCases = [
    // Court events with Cook County courtroom
    {
      title: 'Motion Smith 1234',
      client: { firstName: 'John', lastName: 'Smith', matchedName: 'Smith' },
      expected: 'Motion hearing with Cook County courtroom lookup'
    },
    
    // Court events without courtroom
    {
      title: 'Hearing Johnson DuPage',
      client: { firstName: 'Mary', lastName: 'Johnson', matchedName: 'Johnson' },
      expected: 'Court hearing with ____ placeholder'
    },
    
    // Client services
    {
      title: 'Office Meeting Wilson',
      client: { firstName: 'Robert', lastName: 'Wilson', matchedName: 'Wilson' },
      expected: 'Office meeting with client name'
    },
    
    // Telephone conference
    {
      title: 'CC Brown estate planning',
      client: { firstName: 'Susan', lastName: 'Brown', matchedName: 'Brown' },
      expected: 'Telephone conference with client name'
    },
    
    // Zoom conference
    {
      title: 'Zoom Davis trust review',
      client: { firstName: 'Michael', lastName: 'Davis', matchedName: 'Davis' },
      expected: 'Video conference with client name'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    Logger.log(`\n📋 Test Case ${index + 1}: "${testCase.title}"`);
    
    try {
      const result = generateUnifiedSummary(testCase.title, testCase.client);
      Logger.log(`   Result: "${result}"`);
      Logger.log(`   Expected: ${testCase.expected}`);
      
      // Basic validation
      if (testCase.client) {
        const hasClientName = result.includes(testCase.client.firstName) || result.includes(testCase.client.lastName);
        Logger.log(`   ✅ Contains client name: ${hasClientName}`);
      }
      
    } catch (error) {
      Logger.log(`   ❌ Test failed: ${error.message}`);
    }
  });
  
  Logger.log('\n🎯 Unified summary testing complete!');
}

/**
 * Compare old vs new summary generation for validation
 * @param {string} title - Calendar event title
 * @param {Object} clientMatch - Client match information
 */
function compareOldVsNewSummary(title, clientMatch) {
  Logger.log(`\n🔄 Comparing old vs new summary for: "${title}"`);
  
  try {
    // Old approach (if available)
    let oldSummary = "Old system not available";
    try {
      // This would call the existing summary generator if you want to compare
      // oldSummary = generateSummaryFromTitle(title, judgeMap, otherEventTypes, courtEventTypes, clientMatch);
    } catch (e) {
      oldSummary = `Old system error: ${e.message}`;
    }
    
    // New unified approach
    const newSummary = generateUnifiedSummary(title, clientMatch);
    
    Logger.log(`   📰 Old: "${oldSummary}"`);
    Logger.log(`   🎯 New: "${newSummary}"`);
    
    return { old: oldSummary, new: newSummary };
    
  } catch (error) {
    Logger.log(`   ❌ Comparison failed: ${error.message}`);
    return null;
  }
}