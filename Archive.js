/**
 * archiveDailyAttendance()
 *
 * At day’s end, snapshots each student into “Attendance History” with:
 *   Date, ID, Name, Grade,
 *   ScannedIn, ScannedOut, DurationMin, Present, AvgDurationMin
 * and logs daily totals + averages in “Daily Summary”.
 */
function archiveDailyAttendance() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('372K');
  if (!sheet) throw new Error('Sheet "372K" not found.');

  // —————————————————————
  // 1) Prepare Attendance History
  let hist = ss.getSheetByName('Attendance History');
  if (!hist) {
    hist = ss.insertSheet('Attendance History');
    hist.appendRow([
      'Date','ID','Name','Grade',
      'ScannedIn','ScannedOut','DurationMin','Present','AvgDurationMin'
    ]);
  }

  // 2) Prepare Daily Summary
  let summ = ss.getSheetByName('Daily Summary');
  if (!summ) {
    summ = ss.insertSheet('Daily Summary');
    summ.appendRow([
      'Date',
      'PresentCount',
      'AbsentCount',
      'AvgDurationMin',
      'AvgScanInTime',
      'AvgScanOutTime'
    ]);
  }

  // —————————————————————
  // 3) Read tracker data (cols A–H on 372K)
  const START_ROW = 2;
  const numRows   = sheet.getLastRow() - START_ROW + 1;
  if (numRows < 1) return;
  const data = sheet.getRange(START_ROW, 1, numRows, 8).getValues();

  const today = Utilities.formatDate(
    new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd'
  );

  let presentCount = 0;
  let absentCount  = 0;
  const durations  = [];
  const inSecs     = [];
  const outSecs    = [];

  // —————————————————————
  // 4) Loop through each student
  data.forEach(row => {
    const name    = row[0];       // A
    const grade   = row[2];       // C
    const id      = row[3];       // D
    const inStr   = row[6];       // G
    const outStr  = row[7];       // H
    const present = inStr !== '';
    if (present) presentCount++; else absentCount++;

    // compute today’s duration
    let duration = '';
    if (inStr && outStr) {
      const dIn  = new Date(inStr);
      const dOut = new Date(outStr);
      duration = (dOut - dIn) / 1000 / 60;  // minutes
      durations.push(duration);
      inSecs.push(dIn.getHours()*3600 + dIn.getMinutes()*60 + dIn.getSeconds());
      outSecs.push(dOut.getHours()*3600 + dOut.getMinutes()*60 + dOut.getSeconds());
    }

    // 5) Compute running average for this student
    //   — pull existing history rows for that ID
    const histRows = hist.getLastRow() > 1
      ? hist.getRange(2, 2, hist.getLastRow() - 1, 8).getValues()
      : [];
    const pastDurations = histRows
      .filter(r => String(r[0]) === String(id) && r[5] !== '')
      .map(r => parseFloat(r[5]));
    // include today’s if present
    if (duration !== '') pastDurations.push(duration);
    const avgDuration = pastDurations.length
      ? pastDurations.reduce((a,b)=>a+b,0) / pastDurations.length
      : '';

    // 6) Append to Attendance History
    hist.appendRow([
      today,
      id,
      name,
      grade,
      inStr,
      outStr,
      duration,
      present ? 1 : 0,
      avgDuration
    ]);
  });

  // —————————————————————
  // 7) Compute overall daily stats
  const avgDur    = durations.length ? sum(durations)/durations.length : 0;
  const avgInTime = inSecs.length    ? formatTimeFromSeconds(sum(inSecs)/inSecs.length)   : '';
  const avgOutTime= outSecs.length   ? formatTimeFromSeconds(sum(outSecs)/outSecs.length) : '';

  summ.appendRow([
    today,
    presentCount,
    absentCount,
    avgDur,
    avgInTime,
    avgOutTime
  ]);
}

// —————————————————————
// Helpers
function sum(arr) { return arr.reduce((a,b)=>a+b, 0); }

function formatTimeFromSeconds(secFloat) {
  const total = Math.round(secFloat);
  let hrs  = Math.floor(total/3600);
  let mins = Math.floor((total%3600)/60);
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12 || 12;
  const mm = mins < 10 ? '0'+mins : mins;
  return `${hrs}:${mm} ${ampm}`;
}
