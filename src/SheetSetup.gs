/**
 * One-time (and re-runnable) setup: creates every sheet, headers,
 * validation, and sample rows so the workbook is usable immediately.
 */

function setupSpreadsheet() {
  Object.values(SHEETS).forEach(name => getOrCreateSheet(name));

  setupAmbassadorsSheet_();
  setupJobsSheet_();
  setupToursSheet_();
  setupTourRoutesSheet_();
  setupTouringStudentsSheet_();
  setupAssignmentsSheet_();
  setupTeachersSheet_();
  setupBellScheduleSheet_();
  setupMeetingsSheet_();
  setupSettingsSheet_();
  syncAmbassadorHomerooms();
  rebuildEligibilityMatrix();
  refreshDashboard();

  // Order the tabs logically.
  const order = [SHEETS.DASHBOARD, SHEETS.TOURS, SHEETS.TOUR_ROUTES, SHEETS.TOURING_STUDENTS, SHEETS.ASSIGNMENTS,
    SHEETS.MEETINGS, SHEETS.AMBASSADORS, SHEETS.ELIGIBILITY, SHEETS.JOBS, SHEETS.TEACHERS,
    SHEETS.BELL_SCHEDULE, SHEETS.SETTINGS];
  order.forEach((name, i) => {
    const sheet = ss_().getSheetByName(name);
    if (sheet) ss_().setActiveSheet(sheet).moveActiveSheet(i + 1);
  });
  ss_().setActiveSheet(ss_().getSheetByName(SHEETS.DASHBOARD));

  toast_('Setup complete. Every sheet is ready to use.', 'Tour & Ambassador Scheduler');
  SpreadsheetApp.getUi().alert('Setup complete! All sheets, dropdowns, and the dashboard are ready. ' +
    'Add teachers and jobs first, then ambassadors, then start scheduling tours.');
}

function setupTeachersSheet_() {
  const sheet = getOrCreateSheet(SHEETS.TEACHERS);
  const headers = HEADERS[SHEETS.TEACHERS];
  if (sheet.getLastRow() < 2) {
    const rows = getAllAdvisorNames_().map(n => [
      n,
      SEEDED_TEACHER_INITIALS_[n] || '',
      '',
      'Advisor - add email + room; from 2026-27 MS Homeroom/Advisories.'
    ]).concat(EXTRA_TEACHERS_.map(t => [t.name, t.initials, '', t.note + ' Teaches but holds no advisory.']));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.getRange(1, colNum_(headers, 'Initials')).setNote(
    'The initials this teacher appears under on the Bell Schedule (e.g. CB, LH, SdB).\n' +
    'This is how the tool works out who teaches the class an ambassador is missing, ' +
    'so a blank here means that teacher never gets a heads-up email.\n' +
    'Several sets of initials for one person: separate with commas.');
  sheet.autoResizeColumns(1, headers.length);
}

function setupJobsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.JOBS);
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 4, 3).setValues([
      ['Panelist', 'Speaks on the student panel about their experience at the school.', 'Yes'],
      ['Lobby Greeter', 'Greets visiting families as they arrive in the lobby.', 'Yes'],
      ['Table Greeter', 'Staffs the welcome/sign-in table for visiting families.', 'Yes'],
      ['Tour Guide', 'Leads a prospective family on a walking tour of the school.', 'Yes']
    ]);
  }
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDropdown_(sheet, lastRow, colNum_(HEADERS[SHEETS.JOBS], 'Active'), YES_NO);
  sheet.autoResizeColumns(1, 3);
}

function setupAmbassadorsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  if (sheet.getLastRow() < 2) {
    const seedRows = buildAmbassadorSeedRows_();
    sheet.getRange(2, 1, seedRows.length, headers.length).setValues(seedRows);
  }
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Active'), YES_NO);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Borough'), BOROUGH_CODES);
  sheet.getRange(1, colNum_(headers, 'Borough')).setNote(BOROUGH_LEGEND);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Gender'), GENDER_OPTIONS, true);
  applyTeacherDropdown_(sheet, lastRow, colNum_(headers, 'Teacher'));
  const computed = 'Computed automatically - do not edit by hand. Refreshed whenever assignments change.';
  sheet.getRange(1, colNum_(headers, 'Total Tours')).setNote(computed);
  sheet.getRange(1, colNum_(headers, 'Jobs Breakdown')).setNote(computed + '\nHow many times this ambassador has done each job.');
  sheet.getRange(1, colNum_(headers, 'Last Tour Date')).setNote(computed);
  sheet.autoResizeColumns(1, headers.length);
}

function setupToursSheet_() {
  const sheet = getOrCreateSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDateFormat_(sheet, lastRow, colNum_(headers, 'Date'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'Start Time'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'End Time'));
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), TOUR_STATUSES);
  const computed = 'Computed automatically - do not edit by hand. Refreshed whenever assignments change.';
  sheet.getRange(1, colNum_(headers, 'Jobs Filled')).setNote(computed + '\nHow many ambassador jobs are staffed on this tour.');
  sheet.getRange(1, colNum_(headers, 'Roles Filled')).setNote(computed + '\nWhich roles are covered, and how many of each.');
  sheet.autoResizeColumns(1, headers.length);
}

function setupTourRoutesSheet_() {
  const sheet = getOrCreateSheet(SHEETS.TOUR_ROUTES);
  if (sheet.getLastRow() < 2) {
    const rows = TOUR_ROUTE_SEED_.map(r => [r.route, r.direction, r.humanities, r.language, r.itinerary]);
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    sheet.getRange(2, 5, rows.length, 1).setWrap(true).setVerticalAlignment('top');
    sheet.setRowHeights(2, rows.length, 180);
    sheet.setColumnWidth(5, 500);
  }
  sheet.autoResizeColumns(1, 4);
}

function setupTouringStudentsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.TOURING_STUDENTS);
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Borough'), BOROUGH_CODES, true);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Gender'), GENDER_OPTIONS, true);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Route'), TOUR_ROUTE_NUMBERS, true);
  sheet.autoResizeColumns(1, headers.length);
}

function setupAssignmentsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.ASSIGNMENTS);
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDateFormat_(sheet, lastRow, colNum_(headers, 'Date'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'Start Time'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'End Time'));
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), ASSIGNMENT_STATUSES);
  sheet.autoResizeColumns(1, headers.length);
}

function setupBellScheduleSheet_() {
  const sheet = getOrCreateSheet(SHEETS.BELL_SCHEDULE);
  const headers = HEADERS[SHEETS.BELL_SCHEDULE];
  if (sheet.getLastRow() < 2) {
    const rows = buildBellScheduleRows_().map(r => r.concat([extractInitials_(r[4]).join(', ')]));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, colNum_(headers, 'What / Teacher / Room')).setNote(
      'Auto-transcribed from the 2026-27 MS Schedule PDF. ' +
      'Edit any row here to correct it - the lookups read this sheet, not the code.');
    sheet.getRange(1, colNum_(headers, 'Teacher Initials')).setNote(
      'Pulled out of the block text so it can be corrected by hand. ' +
      'Match these against the Initials column on the Teachers sheet.');
  }
  sheet.autoResizeColumns(1, 4);
  sheet.setColumnWidth(colNum_(headers, 'What / Teacher / Room'), 420);
  sheet.autoResizeColumns(colNum_(headers, 'Teacher Initials'), 1);
}

function setupMeetingsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.MEETINGS);
  const headers = HEADERS[SHEETS.MEETINGS];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  applyDateFormat_(sheet, lastRow, colNum_(headers, 'Date'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'Start Time'));
  applyTimeFormat_(sheet, lastRow, colNum_(headers, 'End Time'));
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), TOUR_STATUSES);
  sheet.autoResizeColumns(1, headers.length);
  sheet.setColumnWidth(colNum_(headers, 'Classes Missed'), 320);
}

function setupSettingsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.SETTINGS);
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
  }
  sheet.autoResizeColumns(1, 2);
}

function applyDropdown_(sheet, lastRow, col, values, allowInvalid) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(!!allowInvalid).build();
  sheet.getRange(2, col, Math.max(lastRow - 1, 200), 1).setDataValidation(rule);
}

function applyTeacherDropdown_(sheet, lastRow, col) {
  const teacherSheet = getOrCreateSheet(SHEETS.TEACHERS);
  const range = teacherSheet.getRange('A2:A1000');
  const rule = SpreadsheetApp.newDataValidation().requireValueInRange(range, true).setAllowInvalid(true).build();
  sheet.getRange(2, col, Math.max(lastRow - 1, 200), 1).setDataValidation(rule);
}

function applyDateFormat_(sheet, lastRow, col) {
  sheet.getRange(2, col, Math.max(lastRow - 1, 200), 1).setNumberFormat('yyyy-mm-dd');
}

function applyTimeFormat_(sheet, lastRow, col) {
  sheet.getRange(2, col, Math.max(lastRow - 1, 200), 1).setNumberFormat('h:mm AM/PM');
}
