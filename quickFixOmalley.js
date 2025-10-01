/**
 * Quick diagnostic: Check if O'Malley should be found in client database
 */
function checkOmalleyInClientDatabase() {
  console.log('🔍 CHECKING O\'MALLEY IN CLIENT DATABASE...');
  
  try {
    const clientMap = loadClientMappingFromSheet();
    console.log(`📋 Loaded ${Object.keys(clientMap).length} clients total`);
    
    // Check for O'Malley variations
    const omalleyVariations = [
      'omalley', 'o\'malley', 'O\'Malley', 'Omalley', 'OMALLEY'
    ];
    
    console.log('\n🎯 Checking for O\'Malley variations:');
    omalleyVariations.forEach(variation => {
      const lowerVar = variation.toLowerCase();
      if (clientMap[lowerVar]) {
        console.log(`   ✅ FOUND: "${lowerVar}" → ${clientMap[lowerVar]}`);
      } else {
        console.log(`   ❌ NOT FOUND: "${lowerVar}"`);
      }
    });
    
    // Check if any client names contain "malley"
    console.log('\n🔍 Searching for names containing "malley":');
    let found = false;
    Object.keys(clientMap).forEach(clientName => {
      if (clientName.toLowerCase().includes('malley')) {
        console.log(`   🎯 Found: "${clientName}" → ${clientMap[clientName]}`);
        found = true;
      }
    });
    
    if (!found) {
      console.log('   ❌ No clients found containing "malley"');
    }
    
    // Test the actual matching function
    console.log('\n🧪 Testing matchClientFromTitle function:');
    const match = matchClientFromTitle("O'Malley - 1802 Status", clientMap);
    if (match) {
      console.log(`   ✅ MATCH FOUND: "${match.matchedName}" → ${match.uid}`);
    } else {
      console.log(`   ❌ NO MATCH for "O'Malley - 1802 Status"`);
      console.log('   💡 This confirms O\'Malley is correctly identified as non-client event');
    }
    
    return {
      totalClients: Object.keys(clientMap).length,
      omalleyFound: !!match,
      matchDetails: match
    };
    
  } catch (error) {
    console.error(`❌ Error checking O'Malley: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Test if the issue is apostrophe-related
 */
function testApostropheHandling() {
  console.log('\n🧪 TESTING APOSTROPHE HANDLING...');
  
  const testTitles = [
    "O'Malley - 1802 Status",
    "OMalley - 1802 Status", 
    "O Malley - 1802 Status"
  ];
  
  testTitles.forEach(title => {
    console.log(`\n📝 Testing: "${title}"`);
    try {
      const summary = generateUnifiedSummary(title, null);
      console.log(`   Summary: "${summary}"`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  });
}