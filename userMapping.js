/**
 * Loads user mappings from CentralClientList Google Sheet UserMapping tab
 * Expected columns: UID_User_fk | FirstName | LastName | EmailAddress
 * 
 * @returns {Object} Object mapping email addresses to user data
 */
function loadUserMappingFromSheet() {
  try {
    Logger.log('👤 Loading user mappings from CentralClientList sheet...');
    
    // Use the CentralClientList Google Sheet ID directly
    const centralClientListId = '1-WN4rojrqXH3unBM45UL07lF9C_XnTq3pdcu0tdA7D0';
    
    // Read from the UserMapping tab
    const sheet = SpreadsheetApp.openById(centralClientListId).getSheetByName('UserMapping');
    const values = sheet.getDataRange().getValues();
    
    const userMap = {};
    
    // Skip header row, process data rows
    // Expected columns: UID_User_fk | FirstName | LastName | EmailAddress
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const uid = row[0];           // UID_User_fk
      const firstName = row[1];     // FirstName
      const lastName = row[2];      // LastName
      const email = row[3];         // EmailAddress
      
      if (email && uid && firstName && lastName) {
        userMap[email.toLowerCase()] = {
          uid: parseInt(uid),
          firstName: firstName,
          lastName: lastName,
          email: email,
          fullName: `${firstName} ${lastName}`
        };
      }
    }
    
    Logger.log(`✅ Loaded ${Object.keys(userMap).length} user mappings from CentralClientList sheet`);
    return userMap;
    
  } catch (error) {
    Logger.log(`❌ Error loading user mappings from CentralClientList sheet: ${error.message}`);
    Logger.log('🔄 Using fallback user mappings');
    return getFallbackUserMappings();
  }
}

/**
 * Fallback user mappings in case CentralClientList sheet is unavailable
 * Data matches the UserMapping tab in CentralClientList sheet
 * 
 * @returns {Object} Default user mappings with full data structure
 */
function getFallbackUserMappings() {
  return {
    'tom@bransfield.net': { uid: 1, firstName: 'Tom', lastName: 'Bransfield', email: 'tom@bransfield.net', fullName: 'Tom Bransfield' },
    'mary@bransfield.net': { uid: 2, firstName: 'Mary', lastName: 'Bransfield', email: 'mary@bransfield.net', fullName: 'Mary Bransfield' },
    'colleen@bransfield.net': { uid: 3, firstName: 'Colleen', lastName: 'Bransfield', email: 'colleen@bransfield.net', fullName: 'Colleen Bransfield' },
    'john@bransfield.net': { uid: 4, firstName: 'John', lastName: 'Bransfield', email: 'john@bransfield.net', fullName: 'John Bransfield' },
    'kate@bransfield.net': { uid: 84, firstName: 'Kate', lastName: 'Resch', email: 'kate@bransfield.net', fullName: 'Kate Resch' },
    'charlie@bransfield.net': { uid: 87, firstName: 'Charlie', lastName: 'Loeb', email: 'charlie@bransfield.net', fullName: 'Charlie Loeb' }
  };
}

/**
 * Maps user email to their corresponding user data
 * 
 * @param {string} userEmail - The email of the current user
 * @returns {Object|null} The user data object or null if not found
 */
function getUserDataFromEmail(userEmail) {
  const userMappings = loadUserMappingFromSheet();
  
  // First try exact email match
  if (userMappings[userEmail.toLowerCase()]) {
    return userMappings[userEmail.toLowerCase()];
  }
  
  // Then try partial matches for email patterns
  for (const [emailPattern, userData] of Object.entries(userMappings)) {
    if (userEmail.toLowerCase().includes(emailPattern.toLowerCase())) {
      return userData;
    }
  }
  
  Logger.log(`⚠️ No user mapping found for email: ${userEmail}`);
  return null;
}

/**
 * Maps user email to their corresponding user ID (backward compatibility)
 * 
 * @param {string} userEmail - The email of the current user
 * @returns {number|null} The user ID or null if not found
 */
function getUserIdFromEmail(userEmail) {
  const userData = getUserDataFromEmail(userEmail);
  return userData ? userData.uid : null;
}

/**
 * Gets the current user's data based on their email
 * 
 * @returns {Object|null} The user data object or null if not found
 */
function getCurrentUserData() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log(`👤 Current user email: ${userEmail}`);
    
    const userData = getUserDataFromEmail(userEmail);
    if (userData) {
      Logger.log(`✅ Mapped user ${userEmail} to: ${userData.fullName} (ID: ${userData.uid})`);
    }
    
    return userData;
  } catch (error) {
    Logger.log(`❌ Error getting current user data: ${error.message}`);
    return null;
  }
}

/**
 * Gets the current user's ID based on their email (backward compatibility)
 * 
 * @returns {number|null} The user ID or null if not found
 */
function getCurrentUserId() {
  const userData = getCurrentUserData();
  return userData ? userData.uid : null;
}