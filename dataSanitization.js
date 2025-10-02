// ─────────────────────────────────────────────────────────────────────────────
// 🧹 DATA SANITIZATION FOR FILEMAKER INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize calendar event data to prevent FileMaker error 1708 "Parameter value is invalid"
 * 
 * This function addresses common issues that cause FileMaker validation errors:
 * - HTML tags in event titles/descriptions (from Zoom, Teams, etc.)
 * - Excessive string lengths (>500 characters)
 * - Special characters that FileMaker cannot process
 * - Invalid Unicode characters outside printable ASCII range
 * 
 * @param {Object} eventData - Raw event data object with fieldData
 * @returns {Object} Sanitized event data safe for FileMaker
 */
function sanitizeEventDataForFileMaker(eventData) {
  try {
    Logger.log('🧹 Sanitizing event data for FileMaker...');
    
    // Create a deep copy to avoid modifying original data
    const sanitizedData = JSON.parse(JSON.stringify(eventData));
    
    if (sanitizedData.fieldData) {
      // Sanitize each field in fieldData
      Object.keys(sanitizedData.fieldData).forEach(field => {
        const originalValue = sanitizedData.fieldData[field];
        
        if (typeof originalValue === 'string') {
          const sanitizedValue = sanitizeStringForFileMaker(originalValue, field);
          
          if (sanitizedValue !== originalValue) {
            Logger.log(`🔧 Sanitized field "${field}": "${originalValue.substring(0, 50)}..." → "${sanitizedValue.substring(0, 50)}..."`);
          }
          
          sanitizedData.fieldData[field] = sanitizedValue;
        }
      });
    }
    
    return sanitizedData;
    
  } catch (error) {
    Logger.log(`❌ Error sanitizing event data: ${error.message}`);
    // Return original data if sanitization fails - better than blocking the entire process
    return eventData;
  }
}

/**
 * Sanitize individual string values for FileMaker compatibility
 * 
 * @param {string} value - Original string value
 * @param {string} fieldName - Field name for specific handling
 * @returns {string} Sanitized string
 */
function sanitizeStringForFileMaker(value, fieldName = '') {
  if (!value || typeof value !== 'string') {
    return value || '';
  }
  
  let sanitized = value;
  
  // Step 1: Remove HTML tags (common in Zoom/Teams invitations)
  sanitized = stripHtmlTags(sanitized);
  
  // Step 2: Clean up whitespace and line breaks
  sanitized = normalizeWhitespace(sanitized);
  
  // Step 3: Remove/replace problematic characters
  sanitized = replaceProblematicCharacters(sanitized);
  
  // Step 4: Enforce length limits based on field type
  sanitized = enforceFieldLengthLimits(sanitized, fieldName);
  
  // Step 5: Ensure only printable ASCII characters
  sanitized = ensurePrintableAscii(sanitized);
  
  return sanitized.trim();
}

/**
 * Strip HTML tags while preserving important content like URLs
 * 
 * @param {string} text - Text potentially containing HTML
 * @returns {string} Text with HTML removed
 */
function stripHtmlTags(text) {
  if (!text) return '';
  
  // Extract URLs before stripping HTML to preserve them
  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  const urls = text.match(urlPattern) || [];
  
  // Remove HTML tags
  let cleaned = text
    .replace(/<[^>]*>/g, ' ')                    // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')                     // Replace non-breaking spaces
    .replace(/&amp;/g, '&')                      // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // If we found URLs, make sure they're still accessible
  if (urls.length > 0) {
    // Add URLs at the end if they're not already present
    urls.forEach(url => {
      if (!cleaned.includes(url)) {
        cleaned += ` ${url}`;
      }
    });
  }
  
  return cleaned;
}

/**
 * Normalize whitespace and line breaks
 * 
 * @param {string} text - Text with potentially problematic whitespace
 * @returns {string} Text with normalized whitespace
 */
function normalizeWhitespace(text) {
  if (!text) return '';
  
  return text
    .replace(/[\r\n\t]+/g, ' ')               // Replace line breaks and tabs with spaces
    .replace(/\s{2,}/g, ' ')                  // Replace multiple spaces with single space
    .trim();
}

/**
 * Replace characters that commonly cause FileMaker issues
 * 
 * @param {string} text - Text with potentially problematic characters
 * @returns {string} Text with safe character replacements
 */
function replaceProblematicCharacters(text) {
  if (!text) return '';
  
  return text
    .replace(/["]/g, '"')                     // Replace smart quotes with regular quotes
    .replace(/["]/g, '"')
    .replace(/[']/g, "'")                     // Replace smart apostrophes
    .replace(/[']/g, "'")
    .replace(/[–—]/g, '-')                    // Replace em/en dashes with hyphens
    .replace(/…/g, '...')                     // Replace ellipsis
    .replace(/[^\x20-\x7E]/g, '');            // Remove non-printable ASCII characters
}

/**
 * Enforce appropriate length limits for different field types
 * 
 * @param {string} text - Text to truncate if necessary
 * @param {string} fieldName - Field name to determine appropriate limits
 * @returns {string} Text within appropriate length limits
 */
function enforceFieldLengthLimits(text, fieldName) {
  if (!text) return '';
  
  let maxLength;
  
  // Set field-specific length limits
  switch (fieldName.toLowerCase()) {
    case 'body':
    case 'title':
      maxLength = 255;  // Calendar titles should be concise
      break;
    case 'summary':
      maxLength = 500;  // Billing descriptions can be longer
      break;
    case 'description':
      maxLength = 1000; // Full descriptions can be longest
      break;
    default:
      maxLength = 255;  // Conservative default
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate intelligently at word boundaries when possible
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // If we can find a space in the last 20% of the truncated text, use it
    return truncated.substring(0, lastSpace) + '...';
  } else {
    // Otherwise, hard truncate and add ellipsis
    return truncated + '...';
  }
}

/**
 * Ensure text contains only printable ASCII characters (0x20-0x7E)
 * 
 * @param {string} text - Text to validate
 * @returns {string} Text with only printable ASCII characters
 */
function ensurePrintableAscii(text) {
  if (!text) return '';
  
  // Keep only printable ASCII characters (space through tilde)
  return text.replace(/[^\x20-\x7E]/g, '');
}

/**
 * Test the sanitization function with problematic sample data
 */
function testDataSanitization() {
  Logger.log('🧪 Testing Data Sanitization Function...\n');
  
  const testCases = [
    {
      name: 'HTML-rich Zoom invitation',
      input: {
        fieldData: {
          Body: 'Tumpa Trust No. 1 - Zoom Conference with Family',
          Summary: '<p>Event Name: Zoom Consultation One Hour</p><p></p><p>Location: This is a Zoom web conference.<br/><div style="text-align: left; color: #0E72ED;"><span><a style="display: inline-block; color: #0E72ED; text-decoration: none;" href="https://us06web.zoom.us/j/82021772336?pwd=7RlAv44YCrPvPqEJSka7mR4b73Ho3p.1">https://us06web.zoom.us/j/82021772336?pwd=7RlAv44YCrPvPqEJSka7mR4b73Ho3p.1</a></span></div><br/>Meeting ID: 82021772336<br/>Passcode: 041079'
        }
      }
    },
    {
      name: 'Very long description',
      input: {
        fieldData: {
          Body: 'Client Meeting',
          Summary: 'This is an extremely long description that exceeds normal length limits and contains repeated text. '.repeat(20)
        }
      }
    },
    {
      name: 'Special characters and Unicode',
      input: {
        fieldData: {
          Body: 'Meeting with "Smart Quotes" – Em Dash — and Unicode ™ symbols',
          Summary: 'Contains… ellipsis and other problematic characters'
        }
      }
    }
  ];
  
  testCases.forEach((testCase, index) => {
    Logger.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
    Logger.log(`   Original Body: "${testCase.input.fieldData.Body}"`);
    Logger.log(`   Original Summary: "${testCase.input.fieldData.Summary?.substring(0, 100)}..."`);
    
    const sanitized = sanitizeEventDataForFileMaker(testCase.input);
    
    Logger.log(`   Sanitized Body: "${sanitized.fieldData.Body}"`);
    Logger.log(`   Sanitized Summary: "${sanitized.fieldData.Summary?.substring(0, 100)}..."`);
    Logger.log(`   Body Length: ${sanitized.fieldData.Body?.length || 0} chars`);
    Logger.log(`   Summary Length: ${sanitized.fieldData.Summary?.length || 0} chars`);
  });
  
  Logger.log('\n✅ Data sanitization testing complete!');
}