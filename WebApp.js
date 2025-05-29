/**
 * WebApp.gs
 *
 * Container-bound script for the attendance scanner web app,
 * now supporting explicit “in” vs “out” modes.
 */

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('372K')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * recordScan(scannedId, mode)
 * Modes: 'in' forces check-in, 'out' forces check-out, anything else toggles.
 * Will not overwrite if already in the requested state.
 */
function recordScan(scannedId, mode) {
  const SHEET      = '372K';
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const sheet      = ss.getSheetByName(SHEET);
  if (!sheet) throw new Error(`Sheet "${SHEET}" not found.`);

  // Hard-coded cols
  const ID_COL     = 4; // D
  const STATUS_COL = 6; // F
  const IN_COL     = 7; // G
  const OUT_COL    = 8; // H
  const SCAN_COL   = 9; // I

  // 1) find the student row
  const lastRow = sheet.getLastRow();
  const found   = sheet
    .getRange(2, ID_COL, lastRow - 1, 1)
    .createTextFinder(scannedId)
    .matchEntireCell(true)
    .findNext();
  if (!found) {
    return { success:false, message:`ID not found: ${scannedId}` };
  }
  const row = found.getRow();

  // Mirror the scan trigger
  sheet.getRange(row, SCAN_COL).setValue(scannedId);

  // 2) read current state
  const currState = sheet.getRange(row, STATUS_COL).getValue() === 1 ? 'in' : 'out';

  // 3) decide what to do
  const ts = Utilities.formatDate(new Date(),
    ss.getSpreadsheetTimeZone(),
    'yyyy-MM-dd h:mm:ss a');

  // if mode === 'in' and already in, or 'out' and already out → no change
  if (mode === 'in' && currState === 'in') {
    return { success:true, unchanged:true, id:scannedId, state:'in', message:`ID ${scannedId} already checked IN` };
  }
  if (mode === 'out' && currState === 'out') {
    return { success:true, unchanged:true, id:scannedId, state:'out', message:`ID ${scannedId} already checked OUT` };
  }

  // 4) perform the change
  let newState = currState;
  if (mode === 'in' || mode === 'out') {
    newState = mode;
  } else {
    // toggle
    newState = (currState === 'in' ? 'out' : 'in');
  }
  // write status
  sheet.getRange(row, STATUS_COL).setValue(newState === 'in' ? 1 : 0);
  // write timestamp in the correct column
  sheet.getRange(row, newState === 'in' ? IN_COL : OUT_COL).setValue(ts);

  return {
    success:   true,
    unchanged: false,
    id:        scannedId,
    state:     newState,
    timestamp: ts
  };
}


/**
 * getPresentCount()
 * returns number of rows in col F === 1
 */
function getPresentCount() {
  const SHEET  = '372K';
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = ss.getSheetByName(SHEET);
  if (!sheet) throw new Error(`Sheet "${SHEET}" not found.`);

  const statusVals = sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).getValues();
  return statusVals.flat().filter(v => v === 1).length;
}

/**
 * resetAttendance()
 * (unchanged)
 */
function resetAttendance() {
  const SHEET      = '372K';
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const sheet      = ss.getSheetByName(SHEET);
  if (!sheet) throw new Error(`Sheet "${SHEET}" not found.`);

  const FIRST      = 2;
  const LAST       = sheet.getLastRow();
  const COUNT      = LAST - FIRST + 1;
  if (COUNT < 1) return;

  const STATUS_COL = 6;
  const IN_COL     = 7;
  const OUT_COL    = 8;
  const SCAN_COL   = 9;

  sheet.getRange(FIRST, STATUS_COL, COUNT, 1).setValue(0);
  sheet.getRange(FIRST, IN_COL,     COUNT, 1).clearContent();
  sheet.getRange(FIRST, OUT_COL,    COUNT, 1).clearContent();
  sheet.getRange(FIRST, SCAN_COL,   COUNT, 1).clearContent();
}
