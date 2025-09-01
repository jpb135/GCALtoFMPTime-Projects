/** 
 * ─────────────────────────────────────────────────────
 * 🗂️ README – Calendar to FileMaker Integration Library
 * ─────────────────────────────────────────────────────
 * 
 * 🔹 Project Name: GCalToFMP
 * 🔹 Purpose: Extracts events from Google Calendar, categorizes them,
 *             summarizes them, maps to FileMaker clients, and pushes
 *             structured data into FileMaker.
 * 
 * 🔹 Key Functionalities:
 *    - Loads client mappings from a central Google Sheet (UID_Map)
 *    - Loads courtroom to judge mappings from Judge sheet
 *    - Loads non-court event types from EventTypes sheet
 *    - Categorizes and summarizes calendar event titles
 *    - Formats and sends records to FileMaker via Data API
 *    - Daily trigger updates UID_Map from FileMaker
 * 
 * 🔹 Core Files:
 *    - `clientMap.gs` → Loads and matches client records
 *    - `judgeMap.gs` → Loads courtroom → judge mappings
 *    - `eventTypesMap.gs` → Loads other calendar event types
 *    - `summaryGenerator.gs` → Natural language summarization logic
 *    - `calendarSync.gs` → Extracts and posts calendar events
 *    - `filemakerAPI.gs` → Handles authentication and POSTs to FileMaker
 *    - `secrets.gs` → Loads shared Google Sheet IDs from Secret Manager
 *    - `README.gs` → Project overview and guidance
 * 
 * 🔹 Daily Maintenance Trigger:
 *    `syncClientsToUIDSheet` → updates the UID_Map sheet from FileMaker
 * 
 * 🔹 Logging & Error Handling:
 *    - Summary logs via `Logger.log`
 *    - Errors optionally emailed to admin (see below)
 * 
 * 🔹 Administrator:
 *    - John Bransfield (john@bransfield.net)
 * 
 */