/**
 * Configuration, shared helpers, and first-run sheet setup.
 *
 * Bundled file - it holds what used to be several separate script
 * files. Apps Script puts every .gs file in one shared namespace, so
 * merging them changes nothing about how the code runs; it just means
 * far less to paste. Each section below starts with a banner.
 */

/* ==========================================================
 * Constants
 * ========================================================== */

/**
 * Central configuration: sheet names, headers, statuses.
 * Keep this as the single source of truth so setup and every
 * other module stay in sync.
 */

const SHEETS = {
  AMBASSADORS: 'Ambassadors',
  JOBS: 'Jobs',
  ELIGIBILITY: 'Eligibility',
  TOURS: 'Tours',
  TOUR_ROUTES: 'Tour Routes',
  TOURING_STUDENTS: 'Touring Students',
  ASSIGNMENTS: 'Assignments',
  TEACHERS: 'Teachers',
  BELL_SCHEDULE: 'Bell Schedule',
  MEETINGS: 'Meetings',
  LOCKER_SLIPS: 'Locker Slips',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Student Email', 'Grade', 'Homeroom Pod',
  'Split', 'Advisor', 'Language', 'Borough', 'Gender',
  'Parent 1 Name', 'Parent 1 Email', 'Parent 2 Name', 'Parent 2 Email', 'Active',
  'Total Tours', 'Jobs Breakdown', 'Last Tour Date', 'Notes'];
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active'];
HEADERS[SHEETS.TOURS] = ['Tour ID', 'Date', 'Start Time', 'End Time', 'Visiting School / Group', 'Contact Name', 'Contact Email', 'Grade Level', '# of Visitors', 'Jobs Filled', 'Roles Filled', 'Status', 'Notes'];
HEADERS[SHEETS.TOUR_ROUTES] = ['Route', 'Direction', 'Humanities Teacher', 'Language', 'Itinerary'];
HEADERS[SHEETS.TOURING_STUDENTS] = ['Tour ID', 'First Name', 'Last Name', 'Grade', 'Borough', 'Gender', 'Route', 'School', 'Allergies / Medical Notes', 'Chaperone Name', 'Chaperone Contact', 'Notes'];
HEADERS[SHEETS.ASSIGNMENTS] = ['Assignment ID', 'Tour ID', 'Date', 'Start Time', 'End Time', 'Job', 'Ambassador', 'Ambassador Advisor', 'Touring Student', 'Status', 'Notes'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Initials', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.BELL_SCHEDULE] = ['Day', 'Homeroom Pod', 'Start', 'End', 'What / Teacher / Room', 'Teacher Initials'];
HEADERS[SHEETS.MEETINGS] = ['Meeting ID', 'Date', 'Start Time', 'End Time', 'Students', 'Purpose', 'Location', 'Classes Missed', 'Status', 'Notes'];
HEADERS[SHEETS.SETTINGS] = ['Setting', 'Value'];

const TOUR_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
const ASSIGNMENT_STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Cancelled'];
const YES_NO = ['Yes', 'No'];

const BOROUGH_CODES = ['M', 'B', 'Q', 'X', 'S', 'J'];
const BOROUGH_NAMES = { M: 'Manhattan', B: 'Brooklyn', Q: 'Queens', X: 'Bronx', S: 'Staten Island', J: 'New Jersey' };
const BOROUGH_LEGEND = BOROUGH_CODES.map(c => c + ' = ' + BOROUGH_NAMES[c]).join('\n');

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Other'];

// The language a student takes, and which room that class meets in. The
// schedule prints the language period as all three options at once
// ("French - M207 Mandarin - M208 Spanish - M209"), so this column is
// what turns that into one class and one teacher to email.
const LANGUAGE_OPTIONS = ['French', 'Mandarin', 'Spanish'];
const LANGUAGE_ROOMS_ = { French: 'M207', Mandarin: 'M208', Spanish: 'M209' };

// A few pods split in half for some periods, with the two halves swapping
// subjects. The schedule names both halves but never which one a given
// student is in, so this column supplies it. Blank is fine - the tool then
// reports both options instead of guessing.
const SPLIT_OPTIONS = ['1', '2'];

const TOUR_JOBS = { PANELIST: 'Panelist', LOBBY_GREETER: 'Lobby Greeter', TABLE_GREETER: 'Table Greeter', TOUR_GUIDE: 'Tour Guide' };

const DEFAULT_SETTINGS = [
  ['School Name', 'Our School'],
  ['Email Sender Name', 'Tour & Ambassador Program'],
  ['Weekly Email Day', 'Monday'],
  ['Weekly Email Hour (0-23)', '6'],
  ['Weekly Email Lookahead Days', '7'],
  ['Dashboard "Starting Soon" Window (minutes)', '15'],
  ['Tour Start Time', '08:30'],
  ['Tour End Time', '09:25'],
  ['Ambassadors Report To', 'the cafeteria'],
  ['Ambassadors Report At', '8:25 AM'],
  ['Lobby Greeters Needed', '3'],
  ['Table Greeters Needed', '2'],
  ['Panelists Needed', '5'],
  ['Tour Guides Per Visiting Student', '2'],
  ['Max Families Per Route', '1']
];

/** How many ambassadors each event-wide role needs, from Settings. */
function jobsNeeded_() {
  const needed = {};
  needed[TOUR_JOBS.LOBBY_GREETER] = Number(getSetting('Lobby Greeters Needed', 3)) || 3;
  needed[TOUR_JOBS.TABLE_GREETER] = Number(getSetting('Table Greeters Needed', 2)) || 2;
  needed[TOUR_JOBS.PANELIST] = Number(getSetting('Panelists Needed', 5)) || 5;
  return needed;
}

const HANDLER_WEEKLY_EMAIL = 'sendWeeklyTeacherEmails';
const HANDLER_DASHBOARD_REFRESH = 'refreshDashboard';
const HANDLER_TOUR_REMINDERS = 'sendUpcomingTourReminders';

/* ==========================================================
 * Utils
 * ========================================================== */

/**
 * Shared helpers used across every module.
 */

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Returns the sheet, creating it with the configured headers if missing. */
function getOrCreateSheet(name) {
  const spreadsheet = ss_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  const headers = HEADERS[name];
  if (headers) {
    ensureHeaders_(sheet, headers);
  }
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  const current = range.getValues()[0];
  const matches = headers.every((h, i) => current[i] === h);
  if (!matches) {
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  }
}

/** Reads a sheet into {headers, rows, index(name)->colNumber (1-based)}. */
function readSheet(name) {
  const sheet = getOrCreateSheet(name);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h] = i; });
  return { sheet, headers, rows, colIndex };
}

function colNum_(headers, name) {
  const i = headers.indexOf(name);
  if (i === -1) throw new Error('Unknown column "' + name + '"');
  return i + 1;
}

function normalizeName_(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function fullName_(first, last) {
  return String(first || '').trim() + ' ' + String(last || '').trim();
}

/** Splits "First Middle Last" into {first: "First", last: "Middle Last"}. */
function splitFullName_(name) {
  const trimmed = String(name || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(' ');
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/** Formats a Date or date-like value as yyyy-MM-dd for comparisons/IDs. */
function toISODate(value) {
  const d = toDate_(value);
  if (!d) return '';
  return Utilities.formatDate(d, ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}

function toDate_(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // "yyyy-MM-dd" (e.g. from an <input type="date">) parses as UTC midnight
  // if handed to `new Date()`, which can shift a day in non-UTC timezones.
  // Build it from local components instead.
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Combines a date value + a time value (both possibly Date objects from Sheets) into one Date. */
function combineDateAndTime_(dateValue, timeValue) {
  const d = toDate_(dateValue);
  if (!d) return null;
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (timeValue instanceof Date) {
    result.setHours(timeValue.getHours(), timeValue.getMinutes(), timeValue.getSeconds(), 0);
  } else if (typeof timeValue === 'string' && timeValue.indexOf(':') !== -1) {
    const parts = timeValue.split(':').map(Number);
    result.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  }
  return result;
}

function formatTime_(value) {
  const d = toDate_(value);
  if (!d) return '';
  return Utilities.formatDate(d, ss_().getSpreadsheetTimeZone(), 'h:mm a');
}

function formatDate_(value) {
  const d = toDate_(value);
  if (!d) return '';
  return Utilities.formatDate(d, ss_().getSpreadsheetTimeZone(), 'EEE, MMM d, yyyy');
}

/** Pulls the leading integer out of a grade string like "6th" or "6" - null if none. */
function parseGradeNum_(g) {
  const m = /(\d+)/.exec(String(g || ''));
  return m ? parseInt(m[1], 10) : null;
}

function rangesOverlap_(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function nextId_(prefix, existingIds) {
  let max = 0;
  const re = new RegExp('^' + prefix + '-(\\d+)$');
  existingIds.forEach(id => {
    const m = re.exec(id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + '-' + String(max + 1).padStart(4, '0');
}

function getSetting(key, fallback) {
  const { rows } = readSheet(SHEETS.SETTINGS);
  const row = rows.find(r => String(r[0]).trim() === key);
  return row && row[1] !== '' ? row[1] : fallback;
}

function toast_(message, title) {
  ss_().toast(message, title || 'Tour & Ambassador Scheduler', 5);
}

function showDialog_(html, title, width, height) {
  const output = HtmlService.createHtmlOutputFromFile(html).setWidth(width || 520).setHeight(height || 480);
  SpreadsheetApp.getUi().showModalDialog(output, title);
}

/* ==========================================================
 * SheetSetup
 * ========================================================== */

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
    SHEETS.BELL_SCHEDULE, SHEETS.LOCKER_SLIPS, SHEETS.SETTINGS];
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
  applyTeacherDropdown_(sheet, lastRow, colNum_(headers, 'Advisor'));
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Language'), LANGUAGE_OPTIONS, true);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Split'), SPLIT_OPTIONS, true);
  sheet.getRange(1, colNum_(headers, 'Advisor')).setNote(
    'The advisor whose advisory this student sits in. They get the ' +
    '"your advisee is out" email; the teacher whose class the student ' +
    'actually walks out of is worked out from the Bell Schedule instead.');
  sheet.getRange(1, colNum_(headers, 'Language')).setNote(
    'French, Mandarin or Spanish.\n' +
    'The schedule prints the language period as all three at once ' +
    '(French - M207 / Mandarin - M208 / Spanish - M209), so without this ' +
    'the tool cannot tell which teacher to email and hands the period ' +
    'back to you instead. Fill it in and that period sends itself.');
  sheet.getRange(1, colNum_(headers, 'Split')).setNote(
    '1 or 2, for the pods that split in half for some periods.\n' +
    'Leave blank if you do not know - the tool then reports both halves ' +
    'as options rather than guessing. Only MMS splits this year, so this ' +
    'is blank for everyone else.');
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
