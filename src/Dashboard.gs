/**
 * "Where are they right now" live view, built from the Assignments sheet.
 * Rewritten each time refreshDashboard() runs (menu, onEdit, or a
 * time-driven trigger) so it always reflects current time + status.
 */

function refreshDashboard() {
  refreshAmbassadorStats();
  refreshTourTallies();

  const sheet = getOrCreateSheet(SHEETS.DASHBOARD);
  sheet.clear();
  sheet.clearFormats();

  const now = new Date();
  const tz = ss_().getSpreadsheetTimeZone();
  const soonWindowMin = Number(getSetting('Dashboard "Starting Soon" Window (minutes)', 15)) || 15;

  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const dateCol = colNum_(headers, 'Date') - 1;
  const startCol = colNum_(headers, 'Start Time') - 1;
  const endCol = colNum_(headers, 'End Time') - 1;
  const jobCol = colNum_(headers, 'Job') - 1;
  const ambassadorCol = colNum_(headers, 'Ambassador') - 1;
  const teacherCol = colNum_(headers, 'Ambassador Advisor') - 1;
  const tourCol = colNum_(headers, 'Tour ID') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  const todayISO = toISODate(now);
  const todayRows = rows
    .filter(r => r[ambassadorCol] && toISODate(r[dateCol]) === todayISO && String(r[statusCol]).trim() !== 'Cancelled')
    .map(r => ({
      ambassador: r[ambassadorCol],
      teacher: r[teacherCol],
      job: r[jobCol],
      tour: r[tourCol],
      status: r[statusCol],
      start: combineDateAndTime_(r[dateCol], r[startCol]),
      end: combineDateAndTime_(r[dateCol], r[endCol])
    }))
    .sort((a, b) => a.start - b.start);

  const happeningNow = todayRows.filter(r => r.start <= now && now < r.end && r.status !== 'Completed' && r.status !== 'No-Show');
  const soonCutoff = new Date(now.getTime() + soonWindowMin * 60000);
  const startingSoon = todayRows.filter(r => r.start > now && r.start <= soonCutoff && r.status !== 'Cancelled' && r.status !== 'No-Show');

  let row = 1;
  row = writeTitle_(sheet, row, 'Live Ambassador Dashboard', '#1c4587');
  sheet.getRange(row, 1).setValue('Last refreshed: ' + Utilities.formatDate(now, tz, 'EEE, MMM d, yyyy h:mm:ss a'))
    .setFontStyle('italic').setFontColor('#666666');
  row += 2;

  row = writeSection_(sheet, row, 'Happening Now - go pull these students', happeningNow, '#cc0000', '#fce8e6');
  row += 1;
  row = writeSection_(sheet, row, 'Starting Soon (next ' + soonWindowMin + ' min)', startingSoon, '#e69138', '#fff2cc');
  row += 1;
  row = writeSection_(sheet, row, "Today's Full Schedule", todayRows, '#1c4587', '#e8f0fe');

  sheet.autoResizeColumns(1, 6);
  sheet.setColumnWidth(1, 150);
}

function writeTitle_(sheet, row, text, color) {
  sheet.getRange(row, 1).setValue(text).setFontSize(16).setFontWeight('bold').setFontColor(color);
  return row + 1;
}

function writeSection_(sheet, row, title, items, headerColor, bandColor) {
  sheet.getRange(row, 1).setValue(title).setFontSize(12).setFontWeight('bold').setFontColor(headerColor);
  row += 1;

  const tableHeaders = ['Ambassador', 'Advisor', 'Job', 'Tour', 'Start', 'End', 'Status'];
  sheet.getRange(row, 1, 1, tableHeaders.length).setValues([tableHeaders])
    .setFontWeight('bold').setBackground(headerColor).setFontColor('#ffffff');
  row += 1;

  if (items.length === 0) {
    sheet.getRange(row, 1).setValue(' - none - ').setFontStyle('italic').setFontColor('#999999');
    return row + 1;
  }

  const data = items.map(r => [r.ambassador, r.teacher, r.job, r.tour, formatTime_(r.start), formatTime_(r.end), r.status]);
  const range = sheet.getRange(row, 1, data.length, tableHeaders.length);
  range.setValues(data);
  range.setBackground(bandColor);
  return row + data.length;
}
