/**
 * Test script to run GCALtoFMPTime library for two days ago
 * This will process calendar events from 2 days ago to validate the updated library
 */

function testTwoDaysAgo() {
  try {
    // Calculate date for two days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Set time to start of day (midnight)
    const startDate = new Date(twoDaysAgo);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end time to end of day (11:59:59 PM)
    const endDate = new Date(twoDaysAgo);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Testing library for date: ${twoDaysAgo.toDateString()}`);
    console.log(`Start: ${startDate.toISOString()}`);
    console.log(`End: ${endDate.toISOString()}`);
    
    // Call the main library function
    const result = processCalendarEventsWithErrorHandling(startDate, endDate);
    
    console.log('Test completed successfully!');
    console.log('Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
}

// Alternative function to test with manual date entry
function testSpecificDate(dateString) {
  try {
    // Parse the date string (format: 'YYYY-MM-DD')
    const testDate = new Date(dateString);
    
    const startDate = new Date(testDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(testDate);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Testing library for date: ${testDate.toDateString()}`);
    
    const result = processCalendarEventsWithErrorHandling(startDate, endDate);
    
    console.log('Test completed successfully!');
    console.log('Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
}