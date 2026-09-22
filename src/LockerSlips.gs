/**
 * Printable locker slips: one per ambassador, saying what their tour
 * email says, for taping to lockers the morning before.
 *
 * Laid out as tall bordered bands down a single column so a printed
 * page cuts into strips. Unlike the emails, the date is always written
 * out in full - a slip saying "tomorrow" is wrong the moment it outlives
 * the day it was printed, and these sit on a locker overnight.
 */

function buildLockerSlips(tourId) {
  const tour = getTourById_(tourId);
  if (!tour) throw new Error('Tour not found.');

  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const cols = {
    tourId: colNum_(headers, 'Tour ID') - 1,
    date: colNum_(headers, 'Date') - 1,
    start: colNum_(headers, 'Start Time') - 1,
    end: colNum_(headers, 'End Time') - 1,
    job: colNum_(headers, 'Job') - 1,
    ambassador: colNum_(headers, 'Ambassador') - 1,
    touringStudent: colNum_(headers, 'Touring Student') - 1,
    status: colNum_(headers, 'Status') - 1
  };

  const tourRows = rows.filter(r => r[cols.tourId] === tourId &&
    String(r[cols.status]).trim() !== 'Cancelled');
  if (tourRows.length === 0) {
    throw new Error('No assignments found for this tour yet - use "Staff This Tour..." first.');
  }

  const senderName = getSetting('Email Sender Name', 'Tour & Ambassador Program');
  const reportTo = getSetting('Ambassadors Report To', 'the cafeteria');
  const reportAt = getSetting('Ambassadors Report At', '8:25 AM');
  const tz = ss_().getSpreadsheetTimeZone();
  const dateVal = toDate_(tourRows[0][cols.date]);
  const dateLabel = Utilities.formatDate(dateVal, tz, 'EEEE, MMMM d');

  const byAmbassador = {};
  tourRows.forEach(r => {
    (byAmbassador[r[cols.ambassador]] = byAmbassador[r[cols.ambassador]] || []).push(r);
  });

  const routeByStudent = {};
  const tsHeaders = HEADERS[SHEETS.TOURING_STUDENTS];
  const tsFirst = colNum_(tsHeaders, 'First Name') - 1;
  const tsLast = colNum_(tsHeaders, 'Last Name') - 1;
  const tsRoute = colNum_(tsHeaders, 'Route') - 1;
  listTouringStudentsForTour(tourId).forEach(r => {
    routeByStudent[normalizeName_(fullName_(r[tsFirst], r[tsLast]))] = String(r[tsRoute] || '').trim();
  });

  const slips = Object.keys(byAmbassador).sort().map(name => {
    const duties = byAmbassador[name]
      .sort((a, b) => a[cols.start] - b[cols.start])
      .map(r => {
        const student = r[cols.touringStudent];
        const route = student ? routeByStudent[normalizeName_(student)] : '';
        return '   ' + r[cols.job] + '   ' + formatTime_(r[cols.start]) + ' - ' + formatTime_(r[cols.end]) +
          (student ? '\n      with ' + student + (route ? '   (Route ' + route + ')' : '') : '');
      });

    return [
      name.toUpperCase(),
      'Tour duty ' + dateLabel,
      '',
      duties.join('\n'),
      '',
      'Please come to ' + reportTo + ' at ' + reportAt + '.',
      '',
      'Thanks for being an ambassador!  - ' + senderName
    ].join('\n');
  });

  writeLockerSlipsSheet_(slips, dateLabel);
  return { count: slips.length, date: dateLabel };
}

/** Lays the slips out as bordered bands, one per row, ready to print and cut. */
function writeLockerSlipsSheet_(slips, dateLabel) {
  const sheet = getOrCreateSheet(SHEETS.LOCKER_SLIPS);
  sheet.clear();
  sheet.clearFormats();

  sheet.getRange(1, 1).setValue('Locker slips - ' + dateLabel +
    '   (print this sheet, then cut along the lines)')
    .setFontSize(11).setFontStyle('italic').setFontColor('#666666');

  let row = 3;
  slips.forEach(text => {
    const cell = sheet.getRange(row, 1);
    cell.setValue(text)
      .setWrap(true)
      .setVerticalAlignment('middle')
      .setFontSize(12)
      .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setRowHeight(row, 150);
    sheet.setRowHeight(row + 1, 12);   // gap to cut along
    row += 2;
  });

  sheet.setColumnWidth(1, 520);
  sheet.setHiddenGridlines(true);
}

function showLockerSlipsDialog() {
  showDialog_('ui/LockerSlipsDialog', 'Print Locker Slips', 480, 380);
}

function api_buildLockerSlips(tourId) {
  return buildLockerSlips(tourId);
}
