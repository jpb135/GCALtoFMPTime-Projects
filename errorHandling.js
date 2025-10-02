// ─────────────────────────────────────────────────────────────────────────────
// 🚨 ERROR HANDLING & LOGGING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send email notification for critical errors (mirrors Gmail system approach)
 * @param {string} errorType - Category of error (TIMEOUT, PROCESSING_ERROR, etc.)
 * @param {string} errorDetails - Detailed error information
 * @param {string} userEmail - Optional specific user email
 */
function sendErrorNotification(errorType, errorDetails, userEmail = null) {
  try {
    // ONLY send to developer - never to users
    const adminEmail = 'john@bransfield.net';
    const userEmailForLogging = userEmail || Session.getActiveUser().getEmail();
    const subject = `🚨 Calendar Integration Error: ${errorType}`;
    
    const body = `Critical error in Calendar-FileMaker integration:

ERROR TYPE: ${errorType}
USER: ${userEmailForLogging}
TIMESTAMP: ${new Date().toLocaleString()}
DETAILS: ${errorDetails}

RECOMMENDED ACTIONS:
${getRecommendedActions(errorType)}

System Status: Requires attention
Next Steps: Review logs and consider system optimization

- Calendar Integration System`;

    // Send ONLY to administrator/developer
    MailApp.sendEmail(adminEmail, subject, body);
    
    console.log(`✅ Error notification sent for: ${errorType}`);
    
  } catch (notificationError) {
    console.error(`❌ Failed to send error notification: ${notificationError.message}`);
  }
}

/**
 * Get recommended actions based on error type
 * @param {string} errorType 
 * @returns {string}
 */
function getRecommendedActions(errorType) {
  const actions = {
    'TIMEOUT': '- Consider reducing date range for processing\n- Check for large calendar volumes\n- Monitor FileMaker server response times\n- Contact administrator if persistent',
    'PROCESSING_ERROR': '- Check system logs for details\n- Verify all services are accessible\n- Retry processing if transient\n- Contact administrator for persistent issues',
    'SECRET_MANAGER_ERROR': '- Verify Secret Manager permissions\n- Check OAuth token expiration\n- Ensure project access is configured\n- Contact administrator',
    'FILEMAKER_ERROR': '- Check FileMaker server connectivity\n- Verify database credentials\n- Ensure layout exists and is accessible\n- Contact database administrator',
    'CALENDAR_ERROR': '- Verify calendar permissions\n- Check OAuth scopes configuration\n- Ensure calendar exists and is accessible\n- Re-authorize if needed',
    'SHEETS_ERROR': '- Verify Google Sheets permissions\n- Check sheet IDs in Secret Manager\n- Ensure sheets exist and tabs are named correctly\n- Contact administrator'
  };
  
  return actions[errorType] || '- Check system logs\n- Verify connectivity\n- Retry if needed\n- Contact administrator';
}

/**
 * Enhanced timeout detection and handling
 * @param {Error} error - The caught error
 * @param {number} startTime - Processing start time in milliseconds
 * @param {number} itemCount - Number of items being processed
 * @returns {boolean} - True if timeout was handled
 */
function handlePotentialTimeout(error, startTime, itemCount = 0) {
  const runtime = (new Date().getTime() - startTime) / 1000; // seconds
  const isTimeout = runtime > 300 || // 5 minutes (leave buffer before 6-minute limit)
                    error.message.includes('timeout') || 
                    error.message.includes('exceeded maximum execution time');
  
  if (isTimeout) {
    const timeoutDetails = `
Processing Time: ${Math.round(runtime)} seconds
Items Attempted: ${itemCount}
Average per Item: ${itemCount > 0 ? Math.round(runtime/itemCount) : 'N/A'} seconds
Timeout Threshold: 360 seconds (6 minutes)

PERFORMANCE DATA:
- Calendar Events: ${itemCount} events
- Processing Speed: ${runtime > 0 ? Math.round(itemCount/runtime*60) : 0} events/minute
- Bottleneck: Likely FileMaker API calls or data loading

IMMEDIATE SOLUTIONS:
- Reduce date range for processing
- Process in smaller batches
- Check FileMaker server performance
- Consider optimizing data loading`;

    sendErrorNotification('TIMEOUT', timeoutDetails);
    
    console.error(`⏰ TIMEOUT DETECTED: ${Math.round(runtime)} seconds runtime`);
    console.error('💡 RECOMMENDATION: Reduce processing volume or optimize performance');
    
    return true;
  }
  
  return false;
}

/**
 * Retry logic for transient failures
 * @param {Function} operation - Function to retry
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delayMs - Delay between retries (default: 1000ms)
 * @returns {any} - Result of successful operation
 */
function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} retry attempts failed`);
        throw error; // Re-throw the last error
      }
      
      // Wait before retry
      Utilities.sleep(delayMs);
      delayMs *= 2; // Exponential backoff
    }
  }
}

/**
 * Enhanced error categorization and structured logging
 * @param {Error} error - The error to categorize
 * @param {string} context - Where the error occurred
 * @returns {Object} - Structured error information
 */
function categorizeError(error, context = '') {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context: context,
    message: error.message,
    stack: error.stack,
    category: 'UNKNOWN',
    severity: 'MEDIUM',
    retryable: false
  };
  
  // Categorize based on error message patterns
  if (error.message.includes('timeout') || error.message.includes('execution time')) {
    errorInfo.category = 'TIMEOUT';
    errorInfo.severity = 'HIGH';
    errorInfo.retryable = false;
  } else if (error.message.includes('Secret Manager') || error.message.includes('OAuth')) {
    errorInfo.category = 'SECRET_MANAGER_ERROR';
    errorInfo.severity = 'HIGH';
    errorInfo.retryable = true;
  } else if (error.message.includes('FileMaker') || error.message.includes('authentication')) {
    errorInfo.category = 'FILEMAKER_ERROR';
    errorInfo.severity = 'HIGH';
    errorInfo.retryable = true;
  } else if (error.message.includes('Calendar') || error.message.includes('getEvents')) {
    errorInfo.category = 'CALENDAR_ERROR';
    errorInfo.severity = 'HIGH';
    errorInfo.retryable = true;
  } else if (error.message.includes('Sheets') || error.message.includes('Spreadsheet')) {
    errorInfo.category = 'SHEETS_ERROR';
    errorInfo.severity = 'HIGH';
    errorInfo.retryable = true;
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    errorInfo.category = 'NETWORK_ERROR';
    errorInfo.severity = 'MEDIUM';
    errorInfo.retryable = true;
  } else {
    errorInfo.category = 'PROCESSING_ERROR';
    errorInfo.severity = 'MEDIUM';
    errorInfo.retryable = false;
  }
  
  return errorInfo;
}

/**
 * Structured error logging with context
 * @param {Error} error - The error to log
 * @param {string} context - Context where error occurred
 * @param {Object} additionalData - Additional context data
 */
function logStructuredError(error, context = '', additionalData = {}) {
  const errorInfo = categorizeError(error, context);
  
  // Add additional context
  errorInfo.additionalData = additionalData;
  errorInfo.user = Session.getActiveUser().getEmail();
  
  // Log with structured format
  console.error('🚨 STRUCTURED ERROR LOG:');
  console.error(`   Category: ${errorInfo.category}`);
  console.error(`   Severity: ${errorInfo.severity}`);
  console.error(`   Context: ${errorInfo.context}`);
  console.error(`   Message: ${errorInfo.message}`);
  console.error(`   User: ${errorInfo.user}`);
  console.error(`   Retryable: ${errorInfo.retryable}`);
  
  if (Object.keys(additionalData).length > 0) {
    console.error(`   Additional Data: ${JSON.stringify(additionalData)}`);
  }
  
  // Send notification for high-severity errors
  if (errorInfo.severity === 'HIGH') {
    sendErrorNotification(errorInfo.category, `${errorInfo.message}\n\nContext: ${context}\nAdditional: ${JSON.stringify(additionalData)}`);
  }
  
  return errorInfo;
}

/**
 * Graceful degradation - continue processing despite partial failures
 * @param {Array} items - Items to process
 * @param {Function} processor - Function to process each item
 * @param {Object} options - Processing options
 * @returns {Object} - Results with success/failure counts
 */
function processWithGracefulDegradation(items, processor, options = {}) {
  const results = {
    total: items.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    results: []
  };
  
  const maxFailures = options.maxFailures || Math.ceil(items.length * 0.5); // Allow 50% failure rate
  const stopOnExcessiveFailures = options.stopOnExcessiveFailures !== false;
  
  for (let i = 0; i < items.length; i++) {
    try {
      const result = processor(items[i], i);
      
      // Check if processor returned null (skip) vs actual result
      if (result === null) {
        results.results.push({ index: i, status: 'skipped' });
        results.skipped++;
      } else {
        results.results.push({ index: i, status: 'success', data: result });
        results.successful++;
      }
      
    } catch (error) {
      // Only count real errors as failures, not skipped events
      if (!error.message.includes('Event filtered out')) {
        const errorInfo = categorizeError(error, `Processing item ${i}`);
        results.errors.push({ index: i, error: errorInfo });
        results.results.push({ index: i, status: 'failed', error: errorInfo });
        results.failed++;
        
        console.error(`❌ Item ${i} failed: ${error.message}`);
        
        // Stop if too many failures
        if (stopOnExcessiveFailures && results.failed > maxFailures) {
          console.error(`🛑 STOPPING: Excessive failures (${results.failed}/${results.total})`);
          sendErrorNotification('PROCESSING_ERROR', 
            `Excessive failures during processing: ${results.failed}/${results.total} items failed`);
          break;
        }
      } else {
        // Filtered events (all-day, multi-day) are just skipped
        results.skipped++;
        results.results.push({ index: i, status: 'skipped', reason: error.message });
      }
    }
  }
  
  // Log summary
  console.log(`📊 Processing complete: ${results.successful}/${results.total} successful, ${results.skipped} non-client events, ${results.failed} failed`);
  
  return results;
}

/**
 * Enhanced processCalendarEvents with comprehensive error handling
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {Object} - Detailed processing results
 */
function processCalendarEventsWithErrorHandling(startDate, endDate) {
  const startTime = new Date().getTime();
  
  try {
    console.log('🔄 ENHANCED CALENDAR PROCESSING WITH ERROR HANDLING...');
    
    // Load all mappings with retry logic (using unified system)
    const clientMap = retryOperation(() => loadClientMappingFromSheet(), 3, 1000);
    const judgeMap = retryOperation(() => loadJudgeMapFromSheet(), 3, 1000);
    const unifiedEvents = retryOperation(() => loadUnifiedEventVocabulary(), 3, 1000);
    const currentUserId = getCurrentUserId(); // Get current user's ID

    // Ensure client data is fresh (trigger smart sync if needed)
    console.log('🔄 Checking client data freshness...');
    const syncResult = smartSyncClientsToUIDSheet();
    console.log(`📊 Client sync status: ${syncResult.status}`);

    // Fetch events with error handling
    const events = retryOperation(() => CalendarApp.getDefaultCalendar().getEvents(startDate, endDate), 2, 500);
    
    console.log(`📅 Found ${events.length} calendar events to process`);
    
    // Log all found calendar events
    console.log('📋 CALENDAR EVENTS FOUND:');
    console.log('========================');
    events.forEach((event, index) => {
      const title = event.getTitle();
      const start = event.getStartTime();
      const end = event.getEndTime();
      const isAllDay = event.isAllDayEvent();
      const duration = ((end - start) / (1000 * 60 * 60)).toFixed(2); // hours
      
      console.log(`Event ${index + 1}: "${title}"`);
      console.log(`  - Date/Time: ${start.toLocaleString()}`);
      console.log(`  - Duration: ${duration} hours`);
      console.log(`  - All Day: ${isAllDay}`);
    });
    console.log('========================\n');
    
    // Early timeout warning
    if (events.length > 50) {
      console.log(`⚠️ Large batch detected (${events.length} events). Monitor for timeout.`);
      sendErrorNotification('PROCESSING_WARNING', 
        `Processing ${events.length} calendar events. Monitor for completion.`);
    }

    // Track unmatched events for summary
    const unmatchedEvents = [];
    
    // Process events with graceful degradation
    const processingResults = processWithGracefulDegradation(events, (event, index) => {
      // Check timeout periodically
      const currentRuntime = (new Date().getTime() - startTime) / 1000;
      if (currentRuntime > 240) { // 4 minutes - early warning
        throw new Error(`Approaching timeout limit at event ${index}: ${currentRuntime}s runtime`);
      }
      
      const title = event.getTitle();
      const start = event.getStartTime();
      const end = event.getEndTime();

      if (event.isAllDayEvent() || !_isSameDay(start, end)) {
        throw new Error('Event filtered out: all-day or multi-day event');
      }

      const match = matchClientFromTitle(title, clientMap);
      // Process all events, even without client matches
      const duration = _calculateRoundedDuration(start, end);
      const dateString = formatDateForFileMaker(start);
      const summary = generateUnifiedSummary(title, match);

      if (!match) {
        // Track unmatched events but still process them
        unmatchedEvents.push({
          title: title,
          date: start.toLocaleString(),
          duration: duration,
          summary: summary
        });
        console.log(`  ℹ️ Processing non-client event: "${title}" → "${summary}"`);
      }

      const fieldData = {
        Body: title,
        Date: dateString,
        Time: duration,
        Summary: summary,
        UID_User_fk: currentUserId
      };
      
      // Only include client field if there's a match
      if (match) {
        fieldData.UID_Client_fk = match.uid;
      }
      
      const payload = {
        fieldData: fieldData
      };

      // Create FileMaker record with retry
      const fileMakerResult = retryOperation(() => createFileMakerRecord(payload), 2, 1000);
      
      console.log(`✅ Processed: ${title} → ${summary}`);
      return { recordId: fileMakerResult.recordId, payload: payload };
    });

    const endTime = new Date().getTime();
    const totalRuntime = Math.round((endTime - startTime) / 1000);

    console.log('📊 PROCESSING COMPLETE:');
    console.log(`   Events Found: ${events.length}`);
    console.log(`   Successfully Processed: ${processingResults.successful}`);
    console.log(`   Non-Client Events Processed: ${unmatchedEvents.length}`);
    console.log(`   Failed (errors): ${processingResults.failed}`);
    console.log(`   Total Runtime: ${totalRuntime} seconds`);
    
    // Log unmatched events summary (informational only, not an error)
    if (unmatchedEvents.length > 0) {
      console.log('\nℹ️ NON-CLIENT EVENTS PROCESSED:');
      console.log('=====================================');
      unmatchedEvents.forEach((event, index) => {
        console.log(`${index + 1}. "${event.title}"`);
        console.log(`   Date: ${event.date}`);
        console.log(`   Duration: ${event.duration} hours`);
        console.log(`   Summary: ${event.summary}`);
      });
      console.log(`\nTotal non-client events: ${unmatchedEvents.length}`);
      console.log('Note: These events were processed successfully with blank client field');
      console.log('=====================================\n');
    } else {
      console.log('\n✅ All events were client-related and processed!\n');
    }

    return {
      status: processingResults.failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
      eventsFound: events.length,
      successful: processingResults.successful,
      nonClientEventsProcessed: unmatchedEvents.length, // Changed from 'skipped' to reflect that we process all events
      failed: processingResults.failed,
      runtimeSeconds: totalRuntime,
      errors: processingResults.errors,
      unmatchedEvents: unmatchedEvents
    };

  } catch (error) {
    const wasTimeoutHandled = handlePotentialTimeout(error, startTime, events ? events.length : 0);
    
    if (!wasTimeoutHandled) {
      logStructuredError(error, 'processCalendarEvents', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
    }

    return {
      status: 'ERROR',
      error: error.message,
      runtimeSeconds: Math.round((new Date().getTime() - startTime) / 1000)
    };
  }
}

/**
 * Enhanced FileMaker error handling specifically for error 1708 and data validation issues
 * 
 * @param {Error} error - The FileMaker error
 * @param {Object} eventData - The event data that caused the error
 * @returns {Object} Enhanced error information with diagnostic details
 */
function handleFileMakerError(error, eventData = null) {
  try {
    const errorMessage = error.message || '';
    let errorAnalysis = {
      errorType: 'UNKNOWN_FILEMAKER_ERROR',
      originalError: errorMessage,
      diagnostics: {},
      recommendations: [],
      canRetry: false
    };
    
    // Parse FileMaker error codes from response
    let filemakerErrorCode = null;
    const codeMatch = errorMessage.match(/"code":"(\d+)"/);
    if (codeMatch) {
      filemakerErrorCode = codeMatch[1];
    }
    
    Logger.log(`🔍 FileMaker error analysis - Code: ${filemakerErrorCode}`);
    
    switch (filemakerErrorCode) {
      case '1708':
        errorAnalysis = analyzeError1708(errorMessage, eventData);
        break;
      case '504':
        // Duplicate record - this is actually expected behavior
        errorAnalysis.errorType = 'DUPLICATE_RECORD';
        errorAnalysis.canRetry = false;
        errorAnalysis.recommendations = ['This is normal - FileMaker prevents duplicate records'];
        Logger.log('ℹ️ FileMaker 504 error - duplicate record prevention (expected behavior)');
        break;
      case '401':
        errorAnalysis.errorType = 'AUTHENTICATION_ERROR';
        errorAnalysis.recommendations = ['Check FileMaker credentials', 'Verify server connectivity'];
        break;
      default:
        errorAnalysis.errorType = 'FILEMAKER_ERROR';
        errorAnalysis.recommendations = ['Check FileMaker server logs', 'Verify database layout configuration'];
    }
    
    // Log detailed diagnostics for error 1708
    if (filemakerErrorCode === '1708') {
      Logger.log('🚨 FILEMAKER ERROR 1708 DETECTED - Parameter value is invalid');
      Logger.log('📊 Event data analysis:');
      if (eventData && eventData.fieldData) {
        Object.keys(eventData.fieldData).forEach(field => {
          const value = eventData.fieldData[field];
          Logger.log(`   ${field}: "${typeof value === 'string' ? value.substring(0, 100) : value}${typeof value === 'string' && value.length > 100 ? '...' : ''}"`);
          Logger.log(`   ${field} type: ${typeof value}, length: ${typeof value === 'string' ? value.length : 'N/A'}`);
        });
      }
      
      sendErrorNotification('FILEMAKER_1708_ERROR', 
        `Error 1708 encountered with event data: ${JSON.stringify(eventData, null, 2)}\n\nError: ${errorMessage}`);
    }
    
    return errorAnalysis;
    
  } catch (analysisError) {
    Logger.log(`❌ Error analyzing FileMaker error: ${analysisError.message}`);
    return {
      errorType: 'ERROR_ANALYSIS_FAILED',
      originalError: error.message,
      analysisError: analysisError.message,
      canRetry: false
    };
  }
}

/**
 * Specific analysis for FileMaker error 1708 "Parameter value is invalid"
 * 
 * @param {string} errorMessage - Full error message
 * @param {Object} eventData - Event data that caused the error
 * @returns {Object} Detailed error analysis
 */
function analyzeError1708(errorMessage, eventData) {
  const analysis = {
    errorType: 'PARAMETER_VALIDATION_ERROR',
    originalError: errorMessage,
    diagnostics: {
      probableField: null,
      issues: [],
      dataLength: {},
      containsHtml: false,
      containsSpecialChars: false
    },
    recommendations: [
      'Apply data sanitization before sending to FileMaker',
      'Check for HTML content in event descriptions',
      'Verify field length limits',
      'Remove special characters and Unicode'
    ],
    canRetry: true // Can retry with sanitized data
  };
  
  if (eventData && eventData.fieldData) {
    // Analyze each field for potential issues
    Object.keys(eventData.fieldData).forEach(field => {
      const value = eventData.fieldData[field];
      if (typeof value === 'string') {
        analysis.diagnostics.dataLength[field] = value.length;
        
        // Check for HTML content
        if (value.includes('<') && value.includes('>')) {
          analysis.diagnostics.containsHtml = true;
          analysis.diagnostics.issues.push(`${field} contains HTML tags`);
        }
        
        // Check for problematic characters
        if (/[^\x20-\x7E]/.test(value)) {
          analysis.diagnostics.containsSpecialChars = true;
          analysis.diagnostics.issues.push(`${field} contains non-printable characters`);
        }
        
        // Check for excessive length
        if (value.length > 500) {
          analysis.diagnostics.issues.push(`${field} exceeds recommended length (${value.length} chars)`);
        }
        
        // If this field has the most issues, it's probably the culprit
        if (analysis.diagnostics.issues.length > 0) {
          analysis.diagnostics.probableField = field;
        }
      }
    });
  }
  
  return analysis;
}

/**
 * Update the getRecommendedActions function to include FileMaker 1708 specific guidance
 */
function getRecommendedActions(errorType) {
  const actions = {
    'TIMEOUT': '- Consider reducing date range for processing\n- Check for large calendar volumes\n- Monitor FileMaker server response times\n- Contact administrator if persistent',
    'PROCESSING_ERROR': '- Check system logs for details\n- Verify all services are accessible\n- Retry processing if transient\n- Contact administrator for persistent issues',
    'SECRET_MANAGER_ERROR': '- Verify Secret Manager permissions\n- Check OAuth token expiration\n- Ensure project access is configured\n- Contact administrator',
    'FILEMAKER_ERROR': '- Check FileMaker server connectivity\n- Verify database credentials\n- Ensure layout exists and is accessible\n- Contact database administrator',
    'FILEMAKER_1708_ERROR': '- Apply data sanitization to event data\n- Remove HTML tags from calendar descriptions\n- Truncate long field values\n- Replace special characters with ASCII equivalents\n- Check for Unicode characters outside printable range\n- Contact developer if persistent after sanitization',
    'CALENDAR_ERROR': '- Verify calendar permissions\n- Check OAuth scopes configuration\n- Ensure calendar exists and is accessible\n- Re-authorize if needed',
    'SHEETS_ERROR': '- Verify Google Sheets permissions\n- Check sheet IDs in Secret Manager\n- Ensure sheets exist and tabs are named correctly\n- Contact administrator'
  };
  
  return actions[errorType] || '- Check system logs\n- Verify connectivity\n- Retry if needed\n- Contact administrator';
}