// ─────────────────────────────────────────────────────────────────────────────
// 🧪 Test Sample Calendar Events
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test the unified system with your specific sample calendar events
 * This validates the exact scenarios you'll encounter in production
 */
function testSpecificSampleEvents() {
  Logger.log('🧪 Testing Specific Sample Calendar Events...\n');
  
  const sampleEvents = [
    {
      title: 'Brown - 1814 Motion',
      expectedClient: 'Brown',
      expectedEvent: 'Motion (Court)',
      expectedCourtroom: '1814',
      expectedDescription: 'Court event with Cook County judge lookup'
    },
    {
      title: 'Alshabkhoun - 1802 Status', 
      expectedClient: 'Alshabkhoun',
      expectedEvent: 'Status (Court)',
      expectedCourtroom: '1802',
      expectedDescription: 'Court event with Cook County judge lookup'
    },
    {
      title: 'Tumpa - Zoom Conference',
      expectedClient: 'Tumpa',
      expectedEvent: 'Zoom Conference',
      expectedCourtroom: 'None',
      expectedDescription: 'Video conference with client'
    },
    {
      title: 'Stanner - Trust Execution Office',
      expectedClient: 'Stanner', 
      expectedEvent: 'Estate Planning Office OR Office Meeting',
      expectedCourtroom: 'None',
      expectedDescription: 'Should match Trust/Execution keywords'
    },
    {
      title: 'Erickson - RON Trust Execution',
      expectedClient: 'Erickson',
      expectedEvent: 'Estate Planning Remote',
      expectedCourtroom: 'None', 
      expectedDescription: 'Remote execution with BlueNotary'
    },
    {
      title: 'Benau - TC',
      expectedClient: 'Benau',
      expectedEvent: 'Telephone Conference',
      expectedCourtroom: 'None',
      expectedDescription: 'Telephone conference with client'
    }
  ];
  
  let successCount = 0;
  let issueCount = 0;
  
  // First, test if we can load the unified events
  Logger.log('📊 Loading unified event vocabulary...');
  let unifiedEvents;
  try {
    unifiedEvents = loadUnifiedEventVocabulary();
    Logger.log(`✅ Loaded ${unifiedEvents.length} unified events`);
  } catch (error) {
    Logger.log(`❌ Failed to load unified events: ${error.message}`);
    return;
  }
  
  // Test each sample event
  sampleEvents.forEach((sample, index) => {
    Logger.log(`\n📋 Test ${index + 1}: "${sample.title}"`);
    Logger.log(`   Expected: ${sample.expectedDescription}`);
    
    try {
      // Step 1: Test client detection
      let clientMatch = null;
      try {
        const clientMap = loadClientMappingFromSheet();
        clientMatch = matchClientFromTitle(sample.title, clientMap);
        
        if (clientMatch) {
          Logger.log(`   👤 Client: Found "${clientMatch.matchedName}" → UID: ${clientMatch.uid}`);
        } else {
          Logger.log(`   👤 Client: No match found for "${sample.expectedClient}"`);
          // This might be expected if client isn't in the mapping sheet
        }
      } catch (error) {
        Logger.log(`   👤 Client detection error: ${error.message}`);
      }
      
      // Step 2: Test event matching (with cleaned title)
      let cleanTitle = sample.title;
      if (clientMatch) {
        cleanTitle = sample.title.replace(new RegExp(clientMatch.matchedName, 'gi'), '').trim();
        cleanTitle = cleanTitle.replace(/^-\s*/, '').trim(); // Remove leading dash
      }
      Logger.log(`   🧹 Clean title: "${cleanTitle}"`);
      
      const eventMatch = findUnifiedEventMatch(cleanTitle, unifiedEvents);
      if (eventMatch) {
        Logger.log(`   🎯 Event: "${eventMatch.matchedKeyword}" → ${eventMatch.category}`);
        Logger.log(`   📝 Template: "${eventMatch.description}"`);
      } else {
        Logger.log(`   ⚠️ Event: No match found in unified vocabulary`);
        issueCount++;
      }
      
      // Step 3: Test courtroom detection
      const courtroomInfo = detectCookCountyCourtroom(sample.title);
      if (courtroomInfo) {
        Logger.log(`   🏛️ Courtroom: ${courtroomInfo.courtroom} → Judge: ${courtroomInfo.judge}`);
      } else {
        Logger.log(`   🏛️ Courtroom: None detected (expected for non-court events)`);
      }
      
      // Step 4: Test full summary generation
      try {
        const finalSummary = generateUnifiedSummary(sample.title, clientMatch);
        Logger.log(`   📄 Final: "${finalSummary}"`);
        
        // Basic validation
        if (finalSummary && finalSummary !== sample.title) {
          Logger.log(`   ✅ Summary generated successfully`);
          successCount++;
        } else {
          Logger.log(`   ⚠️ Summary unchanged - might need attention`);
          issueCount++;
        }
      } catch (error) {
        Logger.log(`   ❌ Summary generation failed: ${error.message}`);
        issueCount++;
      }
      
    } catch (error) {
      Logger.log(`   ❌ Test failed: ${error.message}`);
      issueCount++;
    }
  });
  
  // Summary
  Logger.log(`\n📊 Test Results Summary:`);
  Logger.log(`   ✅ Successful: ${successCount}/${sampleEvents.length}`);
  Logger.log(`   ⚠️ Issues: ${issueCount}`);
  
  if (issueCount === 0) {
    Logger.log(`🎯 All sample events processed successfully!`);
  } else {
    Logger.log(`🔧 ${issueCount} issues found - review above for details`);
  }
  
  return { successful: successCount, issues: issueCount, total: sampleEvents.length };
}

/**
 * Test specific event keyword matching to debug issues
 */
function testEventKeywordMatching() {
  Logger.log('🔍 Testing Event Keyword Matching...\n');
  
  const testTitles = [
    'Motion',
    'Status', 
    'Zoom Conference',
    'Trust Execution Office',
    'Trust Execution',
    'RON Trust Execution',
    'RON',
    'TC',
    'Office'
  ];
  
  const unifiedEvents = loadUnifiedEventVocabulary();
  
  testTitles.forEach(title => {
    Logger.log(`\n🧪 Testing: "${title}"`);
    const match = findUnifiedEventMatch(title, unifiedEvents);
    
    if (match) {
      Logger.log(`   ✅ Match: "${match.matchedKeyword}" → ${match.category}`);
      Logger.log(`   📝 Description: "${match.description}"`);
    } else {
      Logger.log(`   ❌ No match found`);
      
      // Show what keywords are available
      Logger.log(`   🔍 Available keywords containing similar terms:`);
      unifiedEvents.forEach(event => {
        event.keywords.forEach(keyword => {
          if (keyword.includes(title.toLowerCase()) || title.toLowerCase().includes(keyword)) {
            Logger.log(`      - "${keyword}" (${event.category})`);
          }
        });
      });
    }
  });
}

/**
 * Test courtroom detection specifically
 */
function testCourtroomDetection() {
  Logger.log('🏛️ Testing Courtroom Detection...\n');
  
  const testTitles = [
    'Brown - 1814 Motion',
    'Alshabkhoun - 1802 Status',
    'Smith - Motion DuPage', 
    'Johnson - Hearing Will County',
    'Wilson - Status', // No courtroom
    'Davis - 9999 Motion' // Invalid courtroom
  ];
  
  testTitles.forEach(title => {
    Logger.log(`\n🧪 Testing: "${title}"`);
    const result = detectCookCountyCourtroom(title);
    
    if (result) {
      Logger.log(`   ✅ Courtroom: ${result.courtroom}`);
      Logger.log(`   👨‍⚖️ Judge: ${result.judge}`);
    } else {
      Logger.log(`   ❌ No Cook County courtroom detected`);
    }
  });
}