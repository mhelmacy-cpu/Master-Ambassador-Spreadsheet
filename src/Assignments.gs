/**
 * Assigning ambassadors to tours/jobs - the master schedule.
 * Enforces: ambassador is Active, ambassador is Eligible for the job,
 * and no double-booking (overlapping time on the same date).
 */

function assignAmbassador(data) {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const ambassadorHeaders = HEADERS[SHEETS.AMBASSADORS];

  if (!data.tourId) throw new Error('A tour must be selected.');
  if (!data.job) throw new Error('A job must be selected.');
  if (!data.ambassador) throw new Error('An ambassador must be selected.');

  const dateVal = toDate_(data.date);
  if (!dateVal) throw new Error('A valid date is required.');

  const start = combineDateAndTime_(dateVal, data.startTime);
  const end = combineDateAndTime_(dateVal, data.endTime);
  if (!start || !end || end <= start) throw new Error('End time must be after start time.');

  // Active check.
  const { rows: ambassadorRows } = readSheet(SHEETS.AMBASSADORS);
  const firstCol = colNum_(ambassadorHeaders, 'First Name') - 1;
  const lastCol = colNum_(ambassadorHeaders, 'Last Name') - 1;
  const activeCol = colNum_(ambassadorHeaders, 'Active') - 1;
  const teacherCol = colNum_(ambassadorHeaders, 'Teacher') - 1;
  const ambassadorRow = ambassadorRows.find(r => fullName_(r[firstCol], r[lastCol]) === data.ambassador);
  if (!ambassadorRow) throw new Error('Ambassador not found on the Ambassadors sheet.');
  if (String(ambassadorRow[activeCol]).trim().toLowerCase() !== 'yes') {
    throw new Error(data.ambassador + ' is marked inactive and cannot be scheduled.');
  }

  // Eligibility check.
  if (!isEligible_(data.ambassador, data.job)) {
    throw new Error(data.ambassador + ' is not marked eligible for "' + data.job + '". ' +
      'Update the Eligibility sheet first if this is intentional.');
  }

  // Conflict check: no overlapping assignment for this ambassador.
  const { rows: assignmentRows } = readSheet(SHEETS.ASSIGNMENTS);
  const aCols = assignmentCols_();
  const conflict = assignmentRows.find(r => {
    if (r[aCols.ambassador] !== data.ambassador) return false;
    if (String(r[aCols.status]).trim() === 'Cancelled') return false;
    if (toISODate(r[aCols.date]) !== toISODate(dateVal)) return false;
    const existingStart = combineDateAndTime_(r[aCols.date], r[aCols.start]);
    const existingEnd = combineDateAndTime_(r[aCols.date], r[aCols.end]);
    return rangesOverlap_(start, end, existingStart, existingEnd);
  });
  if (conflict) {
    throw new Error(data.ambassador + ' is already scheduled for ' +
      formatTime_(conflict[aCols.start]) + '-' + formatTime_(conflict[aCols.end]) + ' that day.');
  }

  const sheet = getOrCreateSheet(SHEETS.ASSIGNMENTS);
  const idCol = colNum_(headers, 'Assignment ID') - 1;
  const existingIds = assignmentRows.map(r => r[idCol]);
  const assignmentId = nextId_('ASN', existingIds);

  const row = headers.map(h => {
    switch (h) {
      case 'Assignment ID': return assignmentId;
      case 'Tour ID': return data.tourId;
      case 'Date': return dateVal;
      case 'Start Time': return start;
      case 'End Time': return end;
      case 'Job': return data.job;
      case 'Ambassador': return data.ambassador;
      case 'Ambassador Teacher': return ambassadorRow[teacherCol] || '';
      case 'Touring Student': return data.touringStudent || '';
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
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), ASSIGNMENT_STATUSES);

  refreshDashboard();
  return assignmentId;
}

/** Column index map for the Assignments sheet, for code that scans many rows in a loop. */
function assignmentCols_() {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  return {
    date: colNum_(headers, 'Date') - 1,
    start: colNum_(headers, 'Start Time') - 1,
    end: colNum_(headers, 'End Time') - 1,
    ambassador: colNum_(headers, 'Ambassador') - 1,
    status: colNum_(headers, 'Status') - 1
  };
}

function isAmbassadorBusy_(assignmentRows, cols, ambassadorName, dateVal, start, end) {
  return assignmentRows.some(r => {
    if (r[cols.ambassador] !== ambassadorName) return false;
    if (String(r[cols.status]).trim() === 'Cancelled') return false;
    if (toISODate(r[cols.date]) !== toISODate(dateVal)) return false;
    const existingStart = combineDateAndTime_(r[cols.date], r[cols.start]);
    const existingEnd = combineDateAndTime_(r[cols.date], r[cols.end]);
    return rangesOverlap_(start, end, existingStart, existingEnd);
  });
}

/** Ambassadors eligible+active for a job, annotated with a conflict flag for the given date/time. */
function getAssignableAmbassadors(job, dateStr, startTime, endTime) {
  const candidates = getEligibleActiveAmbassadors(job);
  if (!dateStr || !startTime || !endTime) return candidates.map(name => ({ name, busy: false }));

  const dateVal = toDate_(dateStr);
  const start = combineDateAndTime_(dateVal, startTime);
  const end = combineDateAndTime_(dateVal, endTime);
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const cols = assignmentCols_();

  return candidates.map(name => ({
    name,
    busy: isAmbassadorBusy_(rows, cols, name, dateVal, start, end)
  }));
}
