/**
 * Pulls calendar events, transforms them into FileMaker payloads,
 * and sends them in one batch. Enhanced with comprehensive error handling.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} detailed processing results with success/failure counts
 */
function processCalendarEvents(startDate, endDate) {
  // Use enhanced error handling version
  return processCalendarEventsWithErrorHandling(startDate, endDate);
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use processCalendarEvents() which now includes error handling
 */
function processCalendarEventsLegacy(startDate, endDate) {
  try {
    // Load all mappings
    const clientMap       = loadClientMappingFromSheet();
    const judgeMap        = loadJudgeMapFromSheet();
    const otherEventTypes = loadOtherEventTypesFromSheet();
    const courtEventTypes = loadEventVocabularyFromSheet(); // All event vocabulary from sheet
    const currentUserId   = getCurrentUserId(); // Get current user's ID

    // Fetch events
    const events = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate);
    const matchedPayloads = [];

    // Build payloads
    events.forEach(event => {
      const title = event.getTitle();
      const start = event.getStartTime();
      const end   = event.getEndTime();

      if (event.isAllDayEvent() || !_isSameDay(start, end)) return;

      const match   = matchClientFromTitle(title, clientMap);
      if (!match) return;

      const duration   = _calculateRoundedDuration(start, end);
      const dateString = formatDateForFileMaker(start);
      const summary    = generateSummaryFromTitle(title, judgeMap, otherEventTypes, courtEventTypes, match);

      matchedPayloads.push({
        fieldData: {
          UID_Client_fk: match.uid,
          Body:          title,
          Date:          dateString,
          Time:          duration,
          Summary:       summary,
          UID_User_fk:   currentUserId
        }
      });
    });

    Logger.log(`📌 Prepared ${matchedPayloads.length} records to send to FileMaker.`);

    // Send them all, counting successes
    let successCount = 0;
    matchedPayloads.forEach(payload => {
      const res = createFileMakerRecord(payload);
      Logger.log(`✅ Created record: ${res.recordId}`);
      successCount++;
    });

    return successCount;

  } catch (e) {
    // Wrap and re-throw so caller can catch once
    throw new Error(`Calendar-to-FileMaker sync failed: ${e.message}`);
  }
}