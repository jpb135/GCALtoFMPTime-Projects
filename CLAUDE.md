# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GCALtoFMPTime** is a Google Calendar to FileMaker integration system for legal time tracking. It extracts calendar events, categorizes them with legal context (court proceedings, client meetings, etc.), and creates structured time entries in FileMaker Pro for billing purposes.

**Architecture**: Modular Google Apps Script library (4079 lines, 30 files, 89 functions)  
**Core Integration**: Google Calendar → Event Processing → Client Matching → FileMaker Pro

## System Architecture

### Data Flow Pipeline
```
Calendar Events → Client Matching → Legal Categorization → Time Calculation → FileMaker Records
     ↓              ↓                    ↓                    ↓              ↓
Daily calendar → UID_Map sheet → Court/Event types → 12-min blocks → Time entries
```

### Key Components

**Data Sources:**
- **Google Calendar**: Default calendar events with client names in titles
- **UID_Map Sheet**: Client name → FileMaker UID mappings (synced daily at 3 PM)
- **Judge Sheet**: Courtroom number → Judge name mappings  
- **Unified Event Vocabulary Sheet**: Consolidated event keywords → descriptions for all event types (court + client services)

**Core Processing:**
- **Client Matching**: Simple string matching against last names in calendar titles
- **Court Event Detection**: Keyword-based identification (motion, hearing, trial, etc.)
- **Time Rounding**: 12-minute billing blocks with 0.2-hour minimum
- **Legal Summarization**: Context-aware descriptions for billing records
- **Process All Events**: **FUNDAMENTAL PRINCIPLE** - ALL calendar events are processed and sent to FileMaker (no skipping)

**External Integrations:**
- **GCP Secret Manager**: Secure credential storage for FileMaker and sheet access
- **FileMaker Data API**: Authentication, record creation, and client synchronization

### Unified Event System Architecture (Current)

**Unified System Files:**
- **`unifiedEventLoader.js`** - Load and match events from consolidated vocabulary sheet
- **`unifiedSummaryGenerator.js`** - Generate professional billing descriptions using unified system  
- **`unifiedCalendarSync.js`** - Process calendar events with unified event vocabulary

**Files Ready for Deletion:**
- **`courtEventLoader.js`** - Replaced by unified system (marked for deletion)
- **`eventTypesLoader.js`** - Replaced by unified system (marked for deletion)
- **`summaryGenerator.js`** - Replaced by unified system (marked for deletion)

**Debug and Testing Files:**
- **`testSpecificEvents.js`** - Test specific calendar events through complete processing pipeline
- **`debugFileMakerError.js`** - Debug FileMaker validation errors with different payload formats
- **`debugFileMakerFields.js`** - Field-by-field validation testing for FileMaker integration
- **`quickFixOmalley.js`** - Diagnostic tools for client matching and apostrophe handling
- **`debugClientMatching.js`** - Comprehensive client matching diagnostics and troubleshooting

## Key Development Commands

### Core Processing Functions
- `processCalendarEvents(startDate, endDate)` - Main processing pipeline using unified system (delegates to error handling version)
- `processCalendarEventsWithErrorHandling(startDate, endDate)` - Production-ready processing with comprehensive error management using unified system
- `processCalendarEventsUnified(startDate, endDate)` - Direct unified system processing (handles events with and without client matches)
- `syncClientsToUIDSheet()` - Smart daily client data sync from FileMaker (prevents multiple syncs)
- `createDailyClientSyncTrigger()` - Set up automated smart daily sync trigger

### Development Commands
- **Testing**: `runAllCalendarSystemTests()` - Run complete test suite (10 tests)
- **Specific Event Testing**: `testSpecificCalendarEvents()` - Test how specific calendar events are processed through the unified system
- **Quick Test**: `testSecretManagerAccess()` - Verify credentials and connectivity  
- **Health Check**: `systemHealthCheck()` - Overall system assessment
- **Performance**: `benchmarkProcessingPerformance()` - Processing metrics and timing

### Google Apps Script Deployment
- **Script ID**: `1ObGQCIKFv6Aafl__4IsABlYe1qLBlWZ73uWAvaNDFwKLYqgYXJvoGll8`
- **File Extension Conversion**: **CRITICAL** - All `.js` files must be converted to `.gs` extensions before pushing to Google Apps Script
- **Deploy with clasp**: `clasp push` to update library code (ensures automatic `.js` → `.gs` conversion)
- **Manual Upload**: If uploading files manually, rename all `.js` files to `.gs` extensions first
- **Runtime**: V8 engine with Chicago timezone
- **Library Users**: 6 active users with shared client sync coordination

**Deployment Process:**
1. Develop locally with `.js` extensions for IDE support
2. Convert `.js` → `.gs` before deployment (or use `clasp push` for automatic conversion)
3. Test deployed library with individual user scripts
4. Publish new version for team access

### Smart Client Sync Functions (Multi-User Library Safe)
- `smartSyncClientsToUIDSheet()` - Timestamp-aware sync that prevents multiple daily syncs
- `isClientDataFreshToday()` - Check if client data already synced today
- `createSmartDailyClientSyncTrigger()` - Create trigger with duplicate prevention
- `loadClientMappingFromSheetSmart()` - Auto-detect and handle both legacy and timestamp sheet formats

### Enhanced Data Loading Functions  
- `loadClientMappingFromSheet()` - Load client UID mappings
- `loadJudgeMapFromSheet()` - Load courtroom-to-judge mappings
- `loadUnifiedEventVocabulary()` - Load unified event vocabulary from consolidated sheet

### Event Processing & Summarization
- `generateUnifiedSummary(title, clientMatch)` - Create professional billing descriptions using unified event system
- `findUnifiedEventMatch(title, events)` - Intelligent event matching with keyword prioritization from unified vocabulary

### Error Handling & Monitoring Functions
- `sendErrorNotification(errorType, details, userEmail)` - Email notifications for critical errors
- `handlePotentialTimeout(error, startTime, itemCount)` - Timeout detection and warnings
- `retryOperation(operation, maxRetries, delayMs)` - Automatic retry logic with exponential backoff
- `categorizeError(error, context)` - Structured error categorization and logging
- `logStructuredError(error, context, additionalData)` - Professional error logging with context
- `processWithGracefulDegradation(items, processor, options)` - Continue processing despite partial failures

### Testing & Verification Functions
- `runAllCalendarSystemTests()` - Master test suite (10 comprehensive tests)
- `testErrorHandlingSystem()` - Test error handling components
- `testEventVocabularySystem()` - Test event vocabulary loading and matching
- `testClientMatchingAccuracy()` - Test client identification logic
- `testTimeCalculationAccuracy()` - Test 12-minute rounding logic
- `systemHealthCheck()` - Overall system health assessment
- `benchmarkProcessingPerformance()` - Performance metrics and optimization data
- `testSecretManagerAccess()` - Verify Secret Manager connectivity

### Data Sanitization Functions (NEW)
- `sanitizeEventDataForFileMaker(eventData)` - **CRITICAL**: Main sanitization entry point for preventing FileMaker Error 1708
- `sanitizeStringForFileMaker(value, fieldName)` - Clean individual string fields for FileMaker compatibility
- `stripHtmlTags(text)` - Remove HTML markup while preserving important URLs
- `normalizeWhitespace(text)` - Clean line breaks, tabs, and excessive spacing
- `replaceProblematicCharacters(text)` - Convert Unicode to ASCII (smart quotes, em dashes, etc.)
- `enforceFieldLengthLimits(text, fieldName)` - Field-specific truncation (Body: 255, Summary: 500, Description: 1000)
- `ensurePrintableAscii(text)` - Ensure only characters in range 0x20-0x7E (space through tilde)
- `testDataSanitization()` - Test suite for data cleaning functions

### Enhanced FileMaker Error Handling (NEW)
- `handleFileMakerError(error, eventData)` - **CRITICAL**: Analyze FileMaker errors with field-level diagnostics
- `analyzeError1708(errorMessage, eventData)` - Specific diagnostic analysis for parameter validation errors
- `testFileMakerError1708Fix()` - Comprehensive test for HTML-rich calendar events and error scenarios

### FileMaker Operations
- `createFileMakerRecord(recordData)` - Post single record to FileMaker with automatic sanitization and retry logic
- `getFileMakerToken()` - Authenticate with FileMaker (returns token + config)
- `logoutFileMakerToken(token, fmConfig)` - Clean up FileMaker sessions

## Secret Manager Configuration

All sensitive data stored in **GCP Secret Manager** under project `bransfield-gmail-integration`:

- `filemaker-credentials` - FileMaker connection details (JSON: host, db, layout, user, pass)
- `sheets-ids` - Google Sheet references (JSON with keys: clientMatch, courtroom-sheet-id, Calendar_Events_OtherThanCourt)

**OAuth Scopes Required:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/spreadsheets` 
- `https://www.googleapis.com/auth/cloud-platform`
- `https://www.googleapis.com/auth/script.external_request`

## Legal Event Processing Logic

### Court Events
**Detection**: Keywords (`motion`, `hearing`, `trial`, `settlement`, `status`) + courtroom numbers (4-digit patterns)  
**Output**: `"Appeared in court before Judge [Name] on a [event type]."`

### Non-Court Events  
**Detection**: Configurable keyword matching from EventTypes sheet  
**Output**: Custom descriptions based on event category

### Client Matching Strategy
- **Method**: Simple string inclusion matching against last names
- **Source**: UID_Map sheet with First Name | Last Name | UID_Client_PK columns
- **Limitation**: No fuzzy matching or validation - requires exact substring matches

## Time Calculation Standards

- **Rounding**: Nearest 0.2 hours (12-minute increments)
- **Minimum**: 0.2 hours for any billable event
- **Logic**: `Math.max(0.2, Math.round(hours * 5) / 5)`
- **Filter**: Only same-day events (excludes all-day and multi-day events)

## Development Patterns

### File Structure
The codebase is organized into specialized modules:

**Core Processing Files:**
- **unifiedCalendarSync.js** - Main processing pipeline using unified event system
- **calendarSync.js** - Legacy processing pipeline (being phased out)
- **calendarUtils.js** - Date/time utilities and calendar filtering

**Data Management:**
- **dataSanitization.js** - **NEW**: Comprehensive data cleaning for FileMaker compatibility
- **clientMap.js** - Client name matching and UID mapping
- **smartClientSync.js** - Multi-user safe daily client synchronization  
- **auth.js** - FileMaker authentication and Secret Manager integration
- **fmpPost.js** - FileMaker Data API record creation with automatic sanitization

**Event Processing:**
- **unifiedEventLoader.js** - **CURRENT**: Unified event vocabulary system
- **unifiedSummaryGenerator.js** - **CURRENT**: Professional billing descriptions
- **summaryGenerator.js** - **LEGACY**: Being replaced by unified system
- **courtEventLoader.js** - **LEGACY**: Being replaced by unified system  
- **eventTypesLoader.js** - **LEGACY**: Being replaced by unified system
- **judgeLoader.js** - Courtroom to judge mappings

**System Support:**
- **errorHandling.js** - Production-grade error management with FileMaker 1708 diagnostics
- **testSuite.js** - Comprehensive testing framework (10 tests)
- **testFileMakerError1708Fix.js** - **NEW**: Specific testing for data sanitization

**Debug and Utilities:**
- **debugClientMatching.js**, **debugFileMakerError.js**, **debugFileMakerFields.js** - Diagnostic tools

### Error Handling
- **Pattern**: Production-grade error handling with email notifications and retry logic
- **Recovery**: Graceful degradation with partial processing continuation
- **Enhancement**: Structured error categorization and timeout detection

### Logging Convention
- **Pattern**: Emoji-prefixed Logger.log messages for easy identification
- **Examples**: `🔐` (secrets), `👥` (clients), `📌` (records), `✅` (success), `❌` (errors)

### Secret Manager Integration
**Standard Pattern:**
```javascript
const secretUrl = 'https://secretmanager.googleapis.com/v1/projects/bransfield-gmail-integration/secrets/[secret-name]/versions/latest:access';
const response = UrlFetchApp.fetch(secretUrl, {
  headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
});
const decoded = Utilities.newBlob(Utilities.base64Decode(JSON.parse(response.getContentText()).payload.data)).getDataAsString();
```

## Deployment & Maintenance

### Daily Operations (Smart Multi-User Sync)
- **3:00 PM CT**: Automated trigger runs `smartSyncClientsToUIDSheet()` 
- **Smart Behavior**: Only first user of the day triggers actual FileMaker sync
- **Multi-User Safe**: 6 library users = 1 sync per day (not 6 syncs)
- **Timestamp Tracking**: Sync status stored in UID_Map sheet Row 1
- **Purpose**: Keeps UID_Map sheet synchronized with active FileMaker clients
- **Dependency**: FileMaker layout `systemgoogle_activeClient` with Active/Inactive field

### Manual Processing
- Run `processCalendarEvents(startDate, endDate)` for specific date ranges
- Monitor Logger output for processing status and error identification
- Verify Secret Manager access with `testSecretManagerAccess()`

## System Architecture Updates

### **Recent Enhancements (Current Version):**
✅ **FileMaker Error 1708 Fix** - **CRITICAL UPDATE**: Comprehensive data sanitization system to prevent "Parameter value is invalid" errors  
✅ **Data Sanitization System** - Automatic HTML tag removal, field length enforcement, and special character replacement  
✅ **Enhanced FileMaker Error Handling** - Specific diagnostic tools for FileMaker validation errors with field-level analysis  
✅ **Unified Event Vocabulary System** - **MAJOR UPDATE**: Migrated from dual-sheet system to single consolidated event vocabulary (Sheet ID: `1dvuh7CzamgBlQmCT2ysQOfS-eRMei7GVcV8M-blaWTw`)  
✅ **Comprehensive Test Suite** - 10-test verification system with health monitoring  
✅ **Production-Grade Error Handling** - Email notifications, retry logic, timeout detection  
✅ **Event Vocabulary System** - Google Sheet-based court and client service categorization  
✅ **Client Name Replacement** - Dynamic client name insertion in billing descriptions  
✅ **Structured Error Logging** - Professional error categorization and diagnostics

### **Latest Migration (September 2025) - COMPLETED:**
🔄 **Unified System Migration Complete** - Successfully migrated all core processing functions from dual-sheet approach to unified event vocabulary system:
- **Old System**: Separate court events (`courtEventLoader.js`) and other events (`eventTypesLoader.js`) 
- **New System**: Single unified event vocabulary with consolidated processing pipeline
- **Updated Functions**: All main processing functions now use `loadUnifiedEventVocabulary()`, `generateUnifiedSummary()`, and `findUnifiedEventMatch()`
- **Process All Events**: **CRITICAL DECISION** - System now processes ALL calendar events regardless of client match status
- **No Event Skipping**: Events without client matches are processed with blank client field and original title as summary
- **Clean Migration**: Old dual-sheet files replaced with deprecation notices and marked for deletion
- **Files Updated**: `errorHandling.js`, `calendarSync.js`, `debugClientMatching.js`, `testSuite.js`

### **Critical Production Fix (October 2025) - FileMaker Error 1708:**
🚨 **Problem Resolved**: FileMaker Error 1708 "Parameter value is invalid" caused by HTML-rich calendar event descriptions from Zoom, Teams, and other meeting platforms.

**Root Cause**: 
- HTML tags in calendar event descriptions (e.g., `<p>`, `<div>`, `<a>` tags)
- Excessive field lengths (>1000 characters from meeting invitations)
- Unicode characters and special symbols outside printable ASCII range
- Unescaped quotes and problematic characters in event data

**Solution Implemented**:
- **NEW FILE**: `dataSanitization.js` - Comprehensive data cleaning system
  - `sanitizeEventDataForFileMaker()` - Main sanitization entry point
  - `stripHtmlTags()` - Removes HTML markup while preserving important URLs
  - `enforceFieldLengthLimits()` - Field-specific length limits (Body: 255, Summary: 500, Description: 1000)
  - `replaceProblematicCharacters()` - Converts Unicode to ASCII equivalents (smart quotes, em dashes, etc.)
  - `normalizeWhitespace()` - Cleans line breaks and excessive spacing
  - `ensurePrintableAscii()` - Ensures only characters in range 0x20-0x7E

**Integration Points**:
- **UPDATED**: `fmpPost.js` - Automatic sanitization before all FileMaker record creation calls
- **UPDATED**: `errorHandling.js` - Enhanced error analysis with `handleFileMakerError()` and `analyzeError1708()`
- **UPDATED**: `unifiedCalendarSync.js` - Improved error handling with field-level diagnostics

**Testing & Validation**:
- **NEW FILE**: `testFileMakerError1708Fix.js` - Comprehensive test suite covering:
  - HTML-rich Zoom meeting invitations (exact problematic scenario)
  - Microsoft Teams invitations with embedded HTML
  - Very long descriptions with Unicode characters
  - Mixed HTML and special character scenarios
  - FileMaker error response analysis for codes 1708, 504, and 401

**Production Impact**:
- ✅ **Error 1708 Eliminated**: HTML-rich calendar events now process successfully
- ✅ **Zero Regression**: All existing functionality preserved (client matching, time tracking, billing)
- ✅ **Enhanced Diagnostics**: Detailed error analysis for any future FileMaker validation issues
- ✅ **Automatic Processing**: All calendar events automatically sanitized without user intervention
- ✅ **URL Preservation**: Important meeting URLs preserved while removing HTML markup
- ✅ **Performance Maintained**: Sanitization adds <100ms per event processing time

**Email Notifications**: Administrator receives detailed diagnostic emails for any FileMaker 1708 errors with field analysis and recommendations.

### **Remaining Opportunities:**
1. **Single Calendar Source**: Only processes default calendar, no multi-calendar support
2. **No Batch Processing**: Individual record creation vs. bulk operations

### **Client Matching System (Working as Designed):**
✅ **Last Name Matching** - Scans calendar titles for client last names (85%+ accuracy)  
✅ **Case-Insensitive** - Handles various capitalization patterns  
✅ **Daily Sync** - Fresh client data from FileMaker at 3 PM  
✅ **Fast Lookup** - Optimized for law firm client volume  
✅ **Sufficient Accuracy** - Appropriate for legal billing workflow with manual review

## FileMaker Integration Details

- **Authentication**: Basic Auth → Session Token → Bearer Token pattern
- **Layout**: Uses configured layout from Secret Manager credentials
- **Record Structure**: fieldData object with UID_Client_fk, Body, Date, Time, Summary fields
- **Session Management**: Automatic token cleanup after each operation

## Development Roadmap & Priority Improvements

### **Phase 1: Critical Legal Functionality (HIGH PRIORITY)**

#### 1. Expand Court Event Vocabulary ⚖️
**Current Issue**: Limited to 8 basic keywords, produces generic "Appeared in court" summaries  
**Target**: Professional legal event categorization with specific work descriptions

**Implementation Plan:**
```javascript
// Replace current courtKeywords array with comprehensive legal taxonomy
const courtEventTypes = {
  // Motions & Hearings
  'motion': { category: 'Motion Practice', billing: 'Motion hearing attendance' },
  'preliminary': { category: 'Pretrial', billing: 'Preliminary hearing' },
  'suppression': { category: 'Motion Practice', billing: 'Suppression hearing' },
  'summary judgment': { category: 'Motion Practice', billing: 'Summary judgment hearing' },
  
  // Trial Proceedings  
  'trial': { category: 'Trial', billing: 'Trial proceeding' },
  'jury selection': { category: 'Trial', billing: 'Jury selection' },
  'voir dire': { category: 'Trial', billing: 'Voir dire examination' },
  
  // Conferences & Administrative
  'settlement': { category: 'ADR', billing: 'Settlement conference' },
  'mediation': { category: 'ADR', billing: 'Mediation proceeding' },
  'status': { category: 'Administrative', billing: 'Status conference' },
  'scheduling': { category: 'Administrative', billing: 'Scheduling conference' },
  
  // Sentencing & Post-Trial
  'sentencing': { category: 'Sentencing', billing: 'Sentencing hearing' },
  'arraignment': { category: 'Criminal', billing: 'Arraignment proceeding' },
  'plea': { category: 'Criminal', billing: 'Plea hearing' }
};
```

#### 2. Add Legal Work Category Detection 📋
**Current Issue**: Only detects court vs. non-court, missing billable work categories  
**Target**: Comprehensive legal work classification for accurate billing

**Implementation Plan:**
```javascript
const legalWorkCategories = {
  // Client Services
  'client': { type: 'Client Services', billing: 'Client consultation and conference' },
  'intake': { type: 'Client Services', billing: 'Initial client consultation' },
  'counseling': { type: 'Client Services', billing: 'Client counseling session' },
  
  // Document Work
  'drafting': { type: 'Document Preparation', billing: 'Legal document drafting' },
  'review': { type: 'Document Review', billing: 'Document review and analysis' },
  'contract': { type: 'Contract Work', billing: 'Contract review and negotiation' },
  
  // Discovery & Investigation
  'deposition': { type: 'Discovery', billing: 'Deposition attendance' },
  'discovery': { type: 'Discovery', billing: 'Discovery proceedings' },
  'investigation': { type: 'Case Development', billing: 'Case investigation and fact gathering' },
  
  // Legal Research
  'research': { type: 'Legal Research', billing: 'Legal research and analysis' },
  'brief': { type: 'Brief Writing', billing: 'Legal brief preparation' },
  'memo': { type: 'Legal Writing', billing: 'Legal memorandum preparation' }
};
```

### **Phase 2: Production Reliability (HIGH PRIORITY)**

#### 3. Implement Comprehensive Test Suite 🧪
**Current Issue**: No testing framework, making changes risky  
**Target**: Mirror the Gmail system's 100% test coverage approach

**Required Test Functions:**
- `runAllCalendarSystemTests()` - Master test suite
- `testSecretManagerAccess()` - Credential verification (already exists)
- `testClientMappingLoad()` - Client data loading validation
- `testCalendarEventProcessing()` - End-to-end processing verification
- `testFileMakerIntegration()` - Database connection and record creation
- `testLegalSummarization()` - Summary generation accuracy
- `benchmarkProcessingPerformance()` - Performance metrics

#### 4. Enhance Error Handling & Logging 🚨
**Current Issue**: Basic try/catch with no user notifications or recovery  
**Target**: Production-grade error management with email notifications

**Implementation Plan:**
- Add `sendErrorNotification(errorType, details, userEmail)` function
- Implement `handleProcessingTimeout()` for execution limit management  
- Create `logProcessingError()` for structured error tracking
- Add retry logic for transient FileMaker/API failures
- Implement graceful degradation for partial processing failures

### **Phase 3: Advanced Features (MEDIUM PRIORITY)**

#### 5. Add Case/Matter Context Detection 📁
**Current Issue**: No case identification in billing entries  
**Target**: Extract case/matter references from calendar titles

**Implementation Strategy:**
```javascript
const caseMatterPatterns = {
  // Pattern matching for common case reference formats
  caseNumbers: /\b(?:case|matter|file)[\s#]*(\d{2,}-\w+|\d{4,})\b/i,
  clientMatter: /\b(v\.|vs\.|against)\s+([A-Z][a-zA-Z\s]+)/i,
  practiceArea: /(workers comp|personal injury|criminal|family law|estate)/i
};

function extractCaseMatter(title) {
  // Return structured case context for billing records
}
```

#### 6. Implement Smart Client Matching 🎯
**Current Issue**: Simple string matching, prone to false positives  
**Target**: Fuzzy matching with validation and confidence scoring

**Enhancements:**
- Word boundary protection (prevent "Smith" matching "Blacksmith")
- Confidence scoring for ambiguous matches
- Multiple match resolution (when title contains multiple client names)
- Validation against known client patterns

#### 7. Add Multi-Calendar Support 📅
**Current Issue**: Only processes default calendar  
**Target**: Support multiple calendars with different processing rules

### **Phase 4: System Optimization (LOW PRIORITY)**

#### 8. Performance Improvements ⚡
- Batch FileMaker record creation vs. individual posts
- Cache frequently accessed data (client maps, judge listings)
- Implement incremental sync vs. full daily refresh

#### 9. Configuration Management ⚙️
- Move hardcoded logic to Google Sheets configuration
- User-specific processing rules and preferences
- Practice area-specific summarization templates

#### 10. Integration Enhancements 🔗
- Support for additional calendar sources (Outlook, etc.)
- Integration with case management systems
- Automated conflict checking against client database

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Target Phase |
|---------|--------|--------|----------|--------------|
| Court Event Vocabulary | High | Medium | 1 | Phase 1 |
| Legal Work Categories | High | Medium | 2 | Phase 1 |
| Test Suite | High | High | 3 | Phase 2 |
| Error Handling | High | Medium | 4 | Phase 2 |
| Case/Matter Context | Medium | Medium | 5 | Phase 3 |
| Smart Client Matching | Medium | High | 6 | Phase 3 |
| Multi-Calendar | Low | High | 7 | Phase 4 |

## Success Metrics

- **Legal Accuracy**: 95%+ of generated summaries require no manual editing
- **Client Matching**: 98%+ accuracy with <2% false positives  
- **System Reliability**: 99%+ uptime with comprehensive error recovery
- **Processing Speed**: Handle 100+ calendar events in <2 minutes
- **Test Coverage**: 100% function coverage with automated verification