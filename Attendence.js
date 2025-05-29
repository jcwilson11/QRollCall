/**
 * Attendance.gs
 *
 * Bound script for on-sheet scanning + manual “clear” trigger.
 */
function onEdit(e) {
  const SHEET_NAME = '372K';   // your tab name
  const CLEAR_CELL = 'L1';     // cell where typing “clear” resets
  const SCAN_COL   = 9;        // I
  const ID_COL     = 4;        // D
  const STATUS_COL = 6;        // F
  const IN_COL     = 7;        // G
  const OUT_COL    = 8;        // H

  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  // 1) On-demand reset
  if (
    e.range.getA1Notation() === CLEAR_CELL &&
    String(e.range.getValue()).toLowerCase() === 'clear'
  ) {
    resetAttendance();               // defined in WebApp.gs
    sheet.getRange(CLEAR_CELL).clear();
    return;
  }

  // 2) Only process scans typed into column I
  if (e.range.getColumn() !== SCAN_COL) return;

  const scannedId = String(e.range.getValue()).trim();
  if (!scannedId) return;

  // 3) Find the student row by ID in column D
  const lastRow = sheet.getLastRow();
  const idRange = sheet.getRange(2, ID_COL, lastRow - 1, 1);
  const found   = idRange
    .createTextFinder(scannedId)
    .matchEntireCell(true)
    .findNext();

  if (!found) {
    e.range.clear();
    return;
  }

  // 4) Toggle their Attendance status
  const row        = found.getRow();
  const statusCell = sheet.getRange(row, STATUS_COL);
  const current    = statusCell.getValue();
  const nextStatus = current == 1 ? 0 : 1;
  statusCell.setValue(nextStatus);

  // 5) Write timestamp in the correct column
  const ts = Utilities.formatDate(
    new Date(),
    sheet.getParent().getSpreadsheetTimeZone(),
    'yyyy-MM-dd h:mm:ss a'
  );
  const stampCol = nextStatus === 1 ? IN_COL : OUT_COL;
  sheet.getRange(row, stampCol).setValue(ts);

  // 6) Clear the scan-in cell
  e.range.clear();
}
