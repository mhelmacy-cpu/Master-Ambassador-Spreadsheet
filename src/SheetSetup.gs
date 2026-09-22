/**
 * One-time (and re-runnable) setup: creates every sheet, headers,
 * validation, and sample rows so the workbook is usable immediately.
 */

function setupSpreadsheet() {
  Object.values(SHEETS).forEach(name => getOrCreateSheet(name));

  setupAmbassadorsSheet_();
  setupJobsSheet_();
  setupToursSheet_();
  setupTouringStudentsSheet_();
  setupAssignmentsSheet_();
  setupTeachersSheet_();
  setupSettingsSheet_();
  syncAmbassadorHomerooms();
  rebuildEligibilityMatrix();
  refreshDashboard();

  // Order the tabs logically.
  const order = [SHEETS.DASHBOARD, SHEETS.TOURS, SHEETS.TOURING_STUDENTS, SHEETS.ASSIGNMENTS,
    SHEETS.AMBASSADORS, SHEETS.ELIGIBILITY, SHEETS.JOBS, SHEETS.TEACHERS, SHEETS.SETTINGS];
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
  if (sheet.getLastRow() < 2) {
    const advisorNames = getAllAdvisorNames_();
    sheet.getRange(2, 1, advisorNames.length, 1).setValues(advisorNames.map(n => [n]));
    sheet.getRange(2, 3, advisorNames.length, 1).setValue('Advisor — add email + room; from 2026-27 MS Homeroom/Advisories.');
  }
  sheet.autoResizeColumns(1, 3);
}

function setupJobsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.JOBS);
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 3, 3).setValues([
      ['Front Desk Greeter', 'Greets visiting families at the main entrance.', 'Yes'],
      ['Tour Guide', 'Leads prospective families on a walking tour of the school.', 'Yes'],
      ['Classroom Helper', 'Assists a visiting student inside a classroom for the day.', 'Yes']
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
  applyTeacherDropdown_(sheet, lastRow, colNum_(headers, 'Teacher'));
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
  sheet.autoResizeColumns(1, headers.length);
}

function setupTouringStudentsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.TOURING_STUDENTS);
  sheet.autoResizeColumns(1, HEADERS[SHEETS.TOURING_STUDENTS].length);
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

function setupSettingsSheet_() {
  const sheet = getOrCreateSheet(SHEETS.SETTINGS);
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
  }
  sheet.autoResizeColumns(1, 2);
}

function applyDropdown_(sheet, lastRow, col, values) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
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
