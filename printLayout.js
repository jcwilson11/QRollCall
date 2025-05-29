function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QR Tools')
    .addItem('Generate QR Grid','populateQRGrid')
    .addToUi();
}

function populateQRGrid() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const src     = ss.getSheetByName('372K');
  if (!src) return;
  
  // recreate destination
  const dstName = 'QR Labels';
  let dst = ss.getSheetByName(dstName);
  if (dst) ss.deleteSheet(dst);
  dst = ss.insertSheet(dstName);

  // parameters
  const perRow = 5;
  const qrSize = 300;     // ← pixel width/height for the QR cell
  const labelHeight = 30; // px for the label row

  // pull IDs & labels
  const lastRow = src.getLastRow();
  const ids    = src.getRange(2, 4, lastRow - 1).getValues();
  const labels = src.getRange(2, 5, lastRow - 1).getValues();
  const total  = ids.length;

  for (let i = 0; i < total; i++) {
    const group    = Math.floor(i / perRow);
    const position = i % perRow;
    const imgRow   = group * 2 + 1;
    const lblRow   = imgRow + 1;
    const col      = position + 1;

    // 1) write the QR formula with size=qrSize
    const enc = encodeURIComponent(ids[i][0].toString());
    dst.getRange(imgRow, col)
       .setFormula(`=IMAGE("https://quickchart.io/qr?text=${enc}&size=${qrSize}",1)`);

    // 2) write the label
    dst.getRange(lblRow, col).setValue(labels[i][0]);
  }

  // 3) resize all image‐rows & label‐rows, and columns
  const numGroups = Math.ceil(total / perRow);
  for (let g = 0; g < numGroups; g++) {
    const imgRow = g * 2 + 1;
    const lblRow = imgRow + 1;
    dst.setRowHeight(imgRow, qrSize);
    dst.setRowHeight(lblRow, labelHeight);
  }
  // columns 1–perRow to qrSize px
  for (let c = 1; c <= perRow; c++) {
    dst.setColumnWidth(c, qrSize);
  }
}

