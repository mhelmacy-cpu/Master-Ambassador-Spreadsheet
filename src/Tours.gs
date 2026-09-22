/**
 * Tour scheduling: create/list tours visiting the school.
 */

function addTour(data) {
  const sheet = getOrCreateSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const { rows } = readSheet(SHEETS.TOURS);
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const existingIds = rows.map(r => r[idCol]);

  const dateVal = toDate_(data.date);
  if (!dateVal) throw new Error('A valid tour date is required.');
  const idPrefix = 'TOUR-' + Utilities.formatDate(dateVal, ss_().getSpreadsheetTimeZone(), 'yyyyMMdd');
  const tourId = nextId_(idPrefix, existingIds);

  const row = headers.map(h => {
    switch (h) {
      case 'Tour ID': return tourId;
      case 'Date': return dateVal;
      case 'Start Time': return data.startTime ? combineDateAndTime_(dateVal, data.startTime) : '';
      case 'End Time': return data.endTime ? combineDateAndTime_(dateVal, data.endTime) : '';
      case 'Visiting School / Group': return data.group || '';
      case 'Contact Name': return data.contactName || '';
      case 'Contact Email': return data.contactEmail || '';
      case 'Grade Level': return data.gradeLevel || '';
      case '# of Visitors': return data.numVisitors || '';
      case 'Status': return 'Scheduled';
      case 'Notes': return data.notes || '';
      default: return '';
    }
  });
  sheet.appendRow(row);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, colNum_(headers, 'Date')).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, colNum_(headers, 'Start Time')).setNumberFormat('h:mm AM/PM');
  sheet.getRange(lastRow, colNum_(headers, 'End Time')).setNumberFormat('h:mm AM/PM');
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), TOUR_STATUSES);
  return tourId;
}

function listTours() {
  const { rows } = readSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const dateCol = colNum_(headers, 'Date') - 1;
  const groupCol = colNum_(headers, 'Visiting School / Group') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  return rows
    .filter(r => r[idCol])
    .filter(r => String(r[statusCol]).trim() !== 'Cancelled')
    .map(r => ({
      id: r[idCol],
      label: r[idCol] + ' - ' + formatDate_(r[dateCol]) + ' - ' + r[groupCol]
    }))
    .sort((a, b) => a.id < b.id ? 1 : -1);
}

/**
 * Bulk-creates recurring Wednesday-morning tours (8:30-9:25, matching the
 * Tour Routes schedule) starting from startDateStr, one per week. Rolls
 * a non-Wednesday start date forward to the next Wednesday rather than
 * silently creating a wrong-weekday tour. Skips any week that already
 * has a non-cancelled tour on that date.
 */
function generateWednesdayTours(startDateStr, weeks) {
  const numWeeks = Math.max(1, Number(weeks) || 1);
  let start = toDate_(startDateStr);
  if (!start) throw new Error('A valid start date is required.');
  const rolledForward = start.getDay() !== 3; // 0=Sun ... 3=Wed
  while (start.getDay() !== 3) {
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  }

  const { rows } = readSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const dateCol = colNum_(headers, 'Date') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;
  const existingDates = {};
  rows.forEach(r => {
    if (String(r[statusCol]).trim() !== 'Cancelled') existingDates[toISODate(r[dateCol])] = true;
  });

  const created = [];
  const skipped = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7);
    const iso = toISODate(d);
    if (existingDates[iso]) { skipped.push(iso); continue; }
    const tourId = addTour({
      date: iso,
      startTime: '08:30',
      endTime: '09:25',
      group: 'Wednesday Morning Tours',
      notes: ''
    });
    created.push({ date: iso, tourId: tourId });
  }

  return { created: created, skipped: skipped, rolledForward: rolledForward };
}

function getTourById_(tourId) {
  const headers = HEADERS[SHEETS.TOURS];
  const { rows } = readSheet(SHEETS.TOURS);
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const row = rows.find(r => r[idCol] === tourId);
  if (!row) return null;
  return {
    id: row[idCol],
    date: row[colNum_(headers, 'Date') - 1],
    startTime: row[colNum_(headers, 'Start Time') - 1],
    endTime: row[colNum_(headers, 'End Time') - 1],
    group: row[colNum_(headers, 'Visiting School / Group') - 1]
  };
}
