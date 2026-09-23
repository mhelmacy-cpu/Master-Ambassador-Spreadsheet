/**
 * Wednesday tours: everything that decides or does something.
 *
 * Pairs with Data.gs, which holds the school data and nothing else.
 * Apps Script puts both files in one shared namespace, so they can call
 * each other freely.
 *
 * The workflow this supports, start to finish:
 *   1. Type the visiting students onto Prospective Students.
 *   2. Run "Staff This Wednesday Tour". It pairs each visitor with two
 *      guides, gives each pair a route, and picks the greeters. It does
 *      NOT pick panelists - it lists who is still free so you can.
 *   3. Emails go out on their own: teachers Monday 11am and Wednesday
 *      7:45am, students Monday 3:30pm, Tuesday noon and Wednesday 7:45am.
 */

/* =========================================================
 * Configuration
 * ========================================================= */

const SHEETS = {
  AMBASSADORS: 'Ambassadors',
  PROSPECTIVE: 'Prospective Students',
  TRACKER: 'Tour Tracker',
  JOBS: 'Jobs',
  ELIGIBILITY: 'Eligibility',
  TEACHERS: 'Teachers',
  BELL: 'Bell Schedule',
  ROUTES: 'Tour Routes',
  BUDDIES: '5th Grade Buddies',
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Homeroom', 'Split', 'Grade', 'Advisor',
  'Borough', 'Gender', 'Race (Presenting)', 'Student Email', 'Parent 1 Name', 'Parent 1 Email',
  'Parent 2 Name', 'Parent 2 Email', 'Light', 'Active'];
HEADERS[SHEETS.PROSPECTIVE] = ['Tour Date', 'Name', 'School', 'Grade', 'Gender', 'Race', 'Borough',
  'Class Visit', 'Route', 'Tour Guides', 'Class Buddy', 'Notes'];
HEADERS[SHEETS.TRACKER] = ['Tour Date', 'Ambassador', 'Job', 'Prospective Student(s)', 'Route', 'Notes'];
const CLASS_VISIT_WITH_GUIDE = 'With tour guide';
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active'];
HEADERS[SHEETS.ELIGIBILITY] = ['Ambassador', 'Panelist', 'Lobby Greeter', 'Table Greeter', 'Tour Guide'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Initials', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.BELL] = ['Day', 'Homeroom', 'Split', 'Start', 'End', 'What / Teacher / Room'];
HEADERS[SHEETS.ROUTES] = ['Route', 'Direction', 'Humanities Teacher', 'Language', 'Itinerary'];
HEADERS[SHEETS.BUDDIES] = ['Student', 'Gender', 'Language', 'Teacher', 'Room', 'Can Host a Visitor'];
HEADERS[SHEETS.SETTINGS] = ['Setting', 'Value'];

const JOBS = {
  PANELIST: 'Panelist',
  LOBBY: 'Lobby Greeter',
  TABLE: 'Table Greeter',
  GUIDE: 'Tour Guide',
  BUDDY: 'Class Buddy'
};

const YES_NO = ['Yes', 'No'];
const SPLITS = ['A', 'B', 'C'];
const PODS = ['MMS', 'DJM', 'AOS', 'CCM', 'EEL', 'MSB', 'CJM', 'RSS'];
const GRADES = ['5', '6', '7', '8'];
// The Middle School starts at fifth. A rising fifth grader is in fourth,
// and there is no fourth grade here, so nobody below this can ever guide.
const LOWEST_GRADE_ = 5;
const HIGHEST_GRADE_ = 8;
const GENDERS = ['Female', 'Male', 'Non-binary', 'Other'];

/* Both of these are dropdowns that allow anything, so the list is a
 * starting point rather than a limit - type a value that is not on it
 * and it is kept, not rejected. */
const PRESENTING_OPTIONS = ['White presenting', 'Student of color'];

/* Green goes on a tour without asking. Yellow is offered the same way but
 * held back at the point of saving, for a second look first. */
const LIGHT_OPTIONS = ['Green', 'Yellow'];
const RACE_OPTIONS = ['White', 'African American', 'Asian'];
const BOROUGHS = ['M', 'B', 'Q', 'X', 'S', 'J'];
const BOROUGH_NAMES = { M: 'Manhattan', B: 'Brooklyn', Q: 'Queens', X: 'Bronx', S: 'Staten Island', J: 'New Jersey' };

/** The class-visit choices offered for a rising 5th grader. */
function classVisitOptions_() {
  const out = [CLASS_VISIT_WITH_GUIDE];
  Object.keys(FIFTH_LANGUAGE_CLASSES_).forEach(function (k) {
    out.push('5th grade ' + FIFTH_LANGUAGE_CLASSES_[k].language);
  });
  return out;
}

const DEFAULT_SETTINGS = [
  ['Sender Display Name', 'LREI Middle School Tours'],
  ['Reply-To Email', ''],
  ['Tour Start Time', '8:30'],
  ['Tour End Time', '9:25'],
  ['Ambassadors Report To', 'the cafeteria'],
  ['Ambassadors Report At', '8:25 AM'],
  ['Lobby Greeters Needed', '3'],
  ['Table Greeters Needed', '2'],
  ['Tour Guides Per Visiting Student', '2'],
  ['Guide Grades for Rising 5', '6 and 6'],
  ['Guide Grades for Rising 6', '5 and 6'],
  ['Guide Grades for Rising 7', '6 and 7'],
  ['Guide Grades for Rising 8', '7 and 8'],
  ['Visitor Races Needing a Student of Color Guide', 'African American, Black'],
  ['Max Families Per Route', '1'],
  ['Class Visit Handoff Time', '9:06'],
  ['Wait For', 'Maren']
];

const HANDLER_TEACHER_EMAILS = 'sendTeacherEmailsForNextTour';
const HANDLER_STUDENT_EMAILS = 'sendStudentEmailsForNextTour';

/* =========================================================
 * Small helpers
 * ========================================================= */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  const s = ss_().getSheetByName(name);
  if (s) return s;
  const made = ss_().insertSheet(name);
  const headers = HEADERS[name];
  if (headers) {
    made.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#a8322a').setFontColor('#ffffff');
    made.setFrozenRows(1);
  }
  return made;
}

/**
 * Where each column actually sits, read off the sheet's own header row
 * rather than assumed from the list above. A column inserted, moved or
 * renamed then shifts nothing: the values still come from the right
 * place. Falls back to the expected order only when row 1 is empty.
 */
const HEADER_CACHE_ = {};

/* Other names the same column goes by, so a sheet that says "Homeroom Pod"
 * or "Email" still lines up. */
const HEADER_ALIASES_ = {
  'Grade': ['Applying For', 'Applying For Grade', 'Entry Grade', 'Apply Grade'],
  'Homeroom': ['Homeroom Pod', 'Pod', 'HR', 'Homeroom/Advisory'],
  'Student Email': ['Email', 'Student email address', 'LREI Email'],
  'Split': ['Split Group', 'A/B', 'Section'],
  'Advisor': ['Adviser', 'Advisory', 'Teacher'],
  'Prospective Student(s)': ['Prospective Student', 'Visiting Student', 'Visitor'],
  'Tour Date': ['Date'],
  'Name': ['Student Name', 'Full Name']
};

function headerIndex_(name) {
  if (HEADER_CACHE_[name]) return HEADER_CACHE_[name];
  const s = sheet_(name);
  const width = Math.max(s.getLastColumn(), HEADERS[name].length);
  const row = s.getRange(1, 1, 1, width).getValues()[0];
  const map = {};
  row.forEach(function (cell, i) {
    const key = trim_(cell);
    if (key && map[key] === undefined) map[key] = i;
  });
  // Nothing in row 1: assume the order this script creates.
  if (!Object.keys(map).length) {
    HEADERS[name].forEach(function (h, i) { map[h] = i; });
  }
  // Fill any gap from a column that goes by another name.
  Object.keys(HEADER_ALIASES_).forEach(function (want) {
    if (map[want] !== undefined) return;
    HEADER_ALIASES_[want].forEach(function (alt) {
      if (map[want] === undefined && map[alt] !== undefined) map[want] = map[alt];
    });
  });
  HEADER_CACHE_[name] = map;
  return map;
}

/** Every data row of a sheet, at its real width. */
function rows_(name) {
  const s = sheet_(name);
  const last = s.getLastRow();
  if (last < 2) return [];
  const width = Math.max(s.getLastColumn(), HEADERS[name].length);
  return s.getRange(2, 1, last - 1, width).getValues();
}

/** Where a column is, or -1 if the sheet does not have it. Never throws. */
function optionalCol_(name, header) {
  const map = headerIndex_(name);
  return map[header] === undefined ? -1 : map[header];
}

/** A cell from a row by column name, or '' where the sheet lacks that column. */
function cell_(row, name, header) {
  const i = optionalCol_(name, header);
  return i === -1 ? '' : row[i];
}

function col_(name, header) {
  const map = headerIndex_(name);
  if (map[header] === undefined) {
    throw new Error('The ' + name + ' sheet has no column headed "' + header + '". ' +
      'Check the spelling in row 1 - it has to match exactly.');
  }
  return map[header];
}

/** An empty row the same width as the sheet really is. */
function blankRow_(name) {
  const s = sheet_(name);
  const width = Math.max(s.getLastColumn(), HEADERS[name].length);
  const row = [];
  for (let i = 0; i < width; i++) row.push('');
  return row;
}

function norm_(v) { return String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, ' '); }
function trim_(v) { return String(v == null ? '' : v).trim(); }

/** "6B", "6 B", "b" -> "B". The office writes the grade in front of it. */
function splitLetter_(v) {
  const m = /([A-Ca-c])\s*$/.exec(trim_(v));
  return m ? m[1].toUpperCase() : '';
}

function fullName_(first, last) { return (trim_(first) + ' ' + trim_(last)).trim(); }

function splitName_(full) {
  const parts = trim_(full).split(' ');
  return { first: parts.shift() || '', last: parts.join(' ') };
}

function escapeHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "8:30" / "1:25 PM" / a Date -> minutes past midnight. */
function toMinutes_(value) {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  const s = trim_(value);
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(s);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || '').toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  // A bare hour under 8 in the bell schedule means the afternoon.
  if (!ampm && h < 8) h += 12;
  return h * 60 + min;
}

function timeLabel_(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function toDate_(value) {
  if (value instanceof Date) return value;
  const s = trim_(value);
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function sameDay_(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey_(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

const WEEKDAYS_ = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_ = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

function longDate_(d) {
  return WEEKDAYS_[d.getDay()] + ', ' + MONTHS_[d.getMonth()] + ' ' + d.getDate();
}

function setting_(key, fallback) {
  const data = rows_(SHEETS.SETTINGS);
  for (let i = 0; i < data.length; i++) {
    if (trim_(data[i][0]) === key) {
      const v = trim_(data[i][1]);
      if (v !== '') return v;
    }
  }
  return fallback;
}

function toast_(msg) {
  try { ss_().toast(msg, 'Wednesday Tours', 6); } catch (err) { /* headless */ }
}

function alert_(msg) { SpreadsheetApp.getUi().alert(msg); }

/* =========================================================
 * First-time setup
 * ========================================================= */

function setupSpreadsheet() {
  // Only a workbook with nothing in it yet gets its tabs arranged and its
  // columns sized. Run this again later and it fills gaps without
  // touching a single thing already there.
  const before = ss_().getSheetByName(SHEETS.AMBASSADORS);
  const firstRun = !before || before.getLastRow() < 2;
  Object.keys(SHEETS).forEach(function (k) { sheet_(SHEETS[k]); });

  // These are added to a sheet however old it is, because they are new
  // columns rather than formatting. Nothing else about the sheet changes.
  const added = [];
  if (ensureColumn_(SHEETS.AMBASSADORS, 'Race (Presenting)', PRESENTING_OPTIONS)) {
    added.push('Race (Presenting) on Ambassadors');
  }
  if (ensureColumn_(SHEETS.PROSPECTIVE, 'Race', RACE_OPTIONS)) {
    added.push('Race on Prospective Students');
  }
  if (ensureColumn_(SHEETS.BUDDIES, 'Gender', GENDERS)) {
    added.push('Gender on 5th Grade Buddies');
  }
  if (ensureColumn_(SHEETS.AMBASSADORS, 'Light', LIGHT_OPTIONS)) {
    added.push('Light on Ambassadors');
  }

  setupAmbassadors_();
  setupProspective_();
  setupTracker_();
  setupBuddies_();
  setupJobs_();
  setupEligibility_();
  setupTeachers_();
  setupBellSchedule_();
  setupRoutes_();
  setupSettings_();

  if (firstRun) {
    const order = [SHEETS.PROSPECTIVE, SHEETS.TRACKER, SHEETS.AMBASSADORS, SHEETS.ELIGIBILITY,
        SHEETS.JOBS, SHEETS.BUDDIES, SHEETS.TEACHERS, SHEETS.ROUTES, SHEETS.BELL, SHEETS.SETTINGS];
    order.forEach(function (name, i) {
      const s = ss_().getSheetByName(name);
      if (s) ss_().setActiveSheet(s).moveActiveSheet(i + 1);
    });
    ss_().setActiveSheet(ss_().getSheetByName(SHEETS.PROSPECTIVE));
  }

  alert_((added.length ? 'Added: ' + added.join(', ') + '.\n\n' : '') +
    (firstRun ? 'Setup complete.' :
    'Setup checked over. Everything already there was left exactly as it was - ' +
    'no columns resized, no formatting changed.') + '\n\n' +
    'Three things to fill in before anything can send:\n\n' +
    '1. Ambassadors - the 31 names are there. Add Homeroom, Split, Grade, ' +
    'Advisor, Borough, Gender and Student Email.\n' +
    '2. Teachers - the names and initials are there. Add each email address. ' +
    'Nothing emails a teacher without one.\n' +
    '3. Settings - check the sender name and reply-to.\n\n' +
    'Then type your visitors onto Prospective Students and run ' +
    '"Staff This Wednesday Tour".');
}

function setupAmbassadors_() {
  const s = sheet_(SHEETS.AMBASSADORS);
  const h = HEADERS[SHEETS.AMBASSADORS];
  const fresh = s.getLastRow() < 2;
  if (fresh) {
    const rows = AMBASSADOR_NAMES_.map(function (n) {
      const p = splitName_(n);
      const row = blankRow_(SHEETS.AMBASSADORS);
      row[col_(SHEETS.AMBASSADORS, 'First Name')] = p.first;
      row[col_(SHEETS.AMBASSADORS, 'Last Name')] = p.last;
      row[col_(SHEETS.AMBASSADORS, 'Active')] = 'Yes';
      return row;
    });
    s.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  if (!fresh) return;   // an existing sheet keeps its own formatting
  const last = Math.max(s.getLastRow(), 2);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Homeroom') + 1, PODS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Split') + 1, SPLITS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Grade') + 1, GRADES);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Gender') + 1, GENDERS, true);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Borough') + 1, BOROUGHS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Light') + 1, LIGHT_OPTIONS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Active') + 1, YES_NO);

  note_(s, SHEETS.AMBASSADORS, 'Split',
    'A, B or C - the group the office lists them in (5A, 6C and so on: just the letter).\n\n' +
    'This is what decides which class they are missing. Half the week runs in ' +
    'split groups and half in homeroom groups, and the two do not line up, so ' +
    'their homeroom alone gives the wrong teacher for more than half of them.');
  note_(s, SHEETS.AMBASSADORS, 'Homeroom',
    'MMS, DJM, AOS, CCM, EEL, MSB, CJM or RSS.\n' +
    'Used for the periods that run in homeroom groups rather than split groups.');
  note_(s, SHEETS.AMBASSADORS, 'Advisor',
    'First name as the office writes it - Carrie, Chantilly, Mo. ' +
    'They get the "your advisee is out" email, so the name must match the ' +
    'Teachers sheet.');
  note_(s, SHEETS.AMBASSADORS, 'Borough',
    Object.keys(BOROUGH_NAMES).map(function (c) { return c + ' = ' + BOROUGH_NAMES[c]; }).join('\n'));
  note_(s, SHEETS.AMBASSADORS, 'Race (Presenting)',
    'WP or SOC is fine - so are W, White, White presenting, POC and ' +
    'Student of color. They all read correctly.\n\n' +
    'Anything filled in that is not white presenting counts as a student ' +
    'of color. Blank means they are left out of the balancing.');
  note_(s, SHEETS.AMBASSADORS, 'Light',
    'Green or blank: put on a tour like anyone else.\n\n' +
    'Yellow: check with me first. They are still picked in the normal way, ' +
    'but the tour cannot be saved until you have said yes to each of them.');
  note_(s, SHEETS.AMBASSADORS, 'Student Email',
    'Their lrei.org address. Without it they never get told they are on duty.');
  s.autoResizeColumns(1, h.length);
}

function setupProspective_() {
  const s = sheet_(SHEETS.PROSPECTIVE);
  const h = HEADERS[SHEETS.PROSPECTIVE];
  if (s.getLastRow() > 1) return;
  const last = Math.max(s.getLastRow(), 2);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Grade') + 1, GRADES, true);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Gender') + 1, GENDERS, true);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Borough') + 1, BOROUGHS, true);
  s.getRange(2, col_(SHEETS.PROSPECTIVE, 'Tour Date') + 1, Math.max(last - 1, 200), 1)
    .setNumberFormat('yyyy-mm-dd');
  note_(s, SHEETS.PROSPECTIVE, 'Tour Date', 'The Wednesday they are visiting.');
  note_(s, SHEETS.PROSPECTIVE, 'Grade',
    'The grade they are APPLYING FOR, not the one they are in now.\n' +
    'A student applying for 7th is in 6th at the moment, so they get one ' +
    'guide in 6th and one in 7th. Rising 5th graders get two 6th graders, ' +
    'since there is no grade below that here.');
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Class Visit') + 1, classVisitOptions_(), true);
  note_(s, SHEETS.PROSPECTIVE, 'Class Visit',
    'Where this visitor spends the end of the morning.\n\n' +
    'Leave blank or choose "' + CLASS_VISIT_WITH_GUIDE + '" and they go to class ' +
    'with one of their guides, as usual.\n\n' +
    'For a rising 5th grader you can instead pick one of the 5th grade ' +
    'language classes. A 5th grader from that class collects them from the ' +
    'guides and walks them down to the cafeteria at the end.');
  note_(s, SHEETS.PROSPECTIVE, 'Class Buddy', 'Filled in by Staff This Wednesday Tour - do not type here.');
  note_(s, SHEETS.PROSPECTIVE, 'Route', 'Filled in by Staff This Wednesday Tour - do not type here.');
  note_(s, SHEETS.PROSPECTIVE, 'Tour Guides', 'Filled in by Staff This Wednesday Tour - do not type here.');
  s.autoResizeColumns(1, h.length);
}

function setupTracker_() {
  const s = sheet_(SHEETS.TRACKER);
  if (s.getLastRow() > 1) return;
  const last = Math.max(s.getLastRow(), 2);
  s.getRange(2, col_(SHEETS.TRACKER, 'Tour Date') + 1, Math.max(last - 1, 200), 1)
    .setNumberFormat('yyyy-mm-dd');
  note_(s, SHEETS.TRACKER, 'Prospective Student(s)',
    'Who this ambassador guided. Blank for greeters and panelists.');
  note_(s, SHEETS.TRACKER, 'Job',
    'Staffing writes the guides and greeters. Add panelists here yourself - ' +
    'type the row and they are counted like any other job.');
  s.autoResizeColumns(1, HEADERS[SHEETS.TRACKER].length);
}

/**
 * The 5th graders who can host a visiting student in their own class.
 *
 * Fifth grade rotates through the three languages roughly every four
 * weeks, so this sheet is meant to be edited: when the rotation turns
 * over, change the Language column and the visits follow it.
 */
function setupBuddies_() {
  const s = sheet_(SHEETS.BUDDIES);
  const fresh = s.getLastRow() < 2;
  if (fresh) {
    const rows = FIFTH_LANGUAGE_STUDENTS_.map(function (st) {
      const c = FIFTH_LANGUAGE_CLASSES_[st.lang] || {};
      return [st.name, '', c.language || '', c.teacher || '', c.room || '', st.canHost ? 'Yes' : 'No'];
    });
    s.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  if (!fresh) return;
  const last = Math.max(s.getLastRow(), 2);
  dropdown_(s, last, col_(SHEETS.BUDDIES, 'Gender') + 1, GENDERS, true);
  note_(s, SHEETS.BUDDIES, 'Gender',
    'A visiting girl is offered a girl to sit with, and a boy a boy, wherever ' +
    'the class has one free. It is a preference, not a rule - a class with ' +
    'nobody of that gender still hosts rather than turning the visitor away, ' +
    'and the preview says when that happened.');
  dropdown_(s, last, col_(SHEETS.BUDDIES, 'Language') + 1,
    Object.keys(FIFTH_LANGUAGE_CLASSES_).map(function (k) { return FIFTH_LANGUAGE_CLASSES_[k].language; }), true);
  dropdown_(s, last, col_(SHEETS.BUDDIES, 'Can Host a Visitor') + 1, YES_NO);
  note_(s, SHEETS.BUDDIES, 'Language',
    'Fifth grade rotates through all three languages, so this changes every ' +
    'few weeks. Update it here when the rotation turns over and the class ' +
    'visits follow - the Teacher and Room should change with it.');
  note_(s, SHEETS.BUDDIES, 'Can Host a Visitor',
    'Yes means this student can have a visiting student join them in class. ' +
    'They collect the visitor from the tour guides and walk them down to the ' +
    'cafeteria at the end.');
  s.autoResizeColumns(1, HEADERS[SHEETS.BUDDIES].length);
}

function setupJobs_() {
  const s = sheet_(SHEETS.JOBS);
  const fresh = s.getLastRow() < 2;
  if (fresh) {
    s.getRange(2, 1, 4, 3).setValues([
      [JOBS.PANELIST, 'Speaks on the student panel. Chosen by hand, not by the staffing command.', 'Yes'],
      [JOBS.LOBBY, 'Greets visiting families as they arrive in the lobby.', 'Yes'],
      [JOBS.TABLE, 'Staffs the welcome and sign-in table.', 'Yes'],
      [JOBS.GUIDE, 'Walks a prospective student round the building on a set route.', 'Yes'],
      [JOBS.BUDDY, 'A 5th grader hosting a visiting student in their own class after the tour.', 'Yes']
    ]);
  }
  if (!fresh) return;
  dropdown_(s, Math.max(s.getLastRow(), 2), 3, YES_NO);
  s.autoResizeColumns(1, 3);
}

function setupEligibility_() {
  const s = sheet_(SHEETS.ELIGIBILITY);
  const h = HEADERS[SHEETS.ELIGIBILITY];
  const fresh = s.getLastRow() < 2;
  const names = rows_(SHEETS.AMBASSADORS)
    .map(function (r) { return fullName_(r[0], r[1]); })
    .filter(function (n) { return n !== ''; });
  const existing = {};
  rows_(SHEETS.ELIGIBILITY).forEach(function (r, i) { existing[norm_(r[0])] = i + 2; });
  const add = names.filter(function (n) { return !existing[norm_(n)]; });
  if (add.length) {
    const start = s.getLastRow() + 1;
    s.getRange(start, 1, add.length, h.length).setValues(add.map(function (n) {
      return [n, 'Yes', 'Yes', 'Yes', 'Yes'];
    }));
  }
  if (!fresh) return;
  const last = Math.max(s.getLastRow(), 2);
  for (let c = 2; c <= h.length; c++) dropdown_(s, last, c, YES_NO);
  note_(s, SHEETS.ELIGIBILITY, 'Ambassador',
    'One row per ambassador, refreshed whenever you run setup or staffing. ' +
    'Set a job to No and they are never offered for it.');
  s.autoResizeColumns(1, h.length);
}

function setupTeachers_() {
  const s = sheet_(SHEETS.TEACHERS);
  const h = HEADERS[SHEETS.TEACHERS];
  const fresh = s.getLastRow() < 2;
  if (fresh) {
    const seen = {};
    const rows = [];
    Object.keys(TEACHER_INITIALS_).forEach(function (name) {
      seen[name] = true;
      rows.push([name, TEACHER_INITIALS_[name], '', 'From the 2026-27 schedule.']);
    });
    EXTRA_TEACHERS_.forEach(function (t) {
      if (!seen[t.name]) { seen[t.name] = true; rows.push([t.name, t.initials, '', t.note]); }
    });
    // Some advisors teach nothing that appears in the schedule grid, so they
    // carry no initials. They still need a row, or their advisees' advisor
    // can never be emailed.
    const advisors = {};
    MS_ROSTER_.forEach(function (st) { if (st.advisor) advisors[st.advisor] = true; });
    Object.keys(advisors).sort().forEach(function (name) {
      if (!seen[name]) {
        seen[name] = true;
        rows.push([name, '', '', 'Advisor. Teaches nothing that shows on the schedule, so no initials.']);
      }
    });
    s.getRange(2, 1, rows.length, h.length).setValues(rows);
  }
  if (!fresh) return;
  note_(s, SHEETS.TEACHERS, 'Initials',
    'How this teacher appears on the Bell Schedule (CB, LH, SdB). The World ' +
    'Language teachers and Art are keyed by room instead - those blocks print ' +
    'no initials at all, so the room is the only handle.\n' +
    'Several sets of initials for one person: separate with commas.');
  note_(s, SHEETS.TEACHERS, 'Teacher Email',
    'Required. A teacher with no address here is reported back to you instead ' +
    'of being emailed, so nobody is silently missed.');
  s.autoResizeColumns(1, h.length);
}

function setupBellSchedule_() {
  const s = sheet_(SHEETS.BELL);
  const fresh = s.getLastRow() < 2;
  if (fresh) {
    const rows = [];
    SCHEDULE_DAYS_.forEach(function (day) {
      PODS.forEach(function (pod) {
        (BELL_SCHEDULE_[day][pod] || []).forEach(function (e) {
          rows.push([day, pod, splitLetterOf_(e[2]), e[0], e[1], e[2]]);
        });
      });
    });
    s.getRange(2, 1, rows.length, HEADERS[SHEETS.BELL].length).setValues(rows);
  }
  if (!fresh) return;
  note_(s, SHEETS.BELL, 'Split',
    'Filled in where the block belongs to a split group rather than the whole ' +
    'homeroom - that is what the section letter in "Math A" or "Science C" means. ' +
    'Blank means the whole homeroom attends together.');
  note_(s, SHEETS.BELL, 'What / Teacher / Room',
    'Read off the 2026-27 schedule. Correct anything here and the lookups ' +
    'follow this sheet, not the code.');
  s.setColumnWidth(col_(SHEETS.BELL, 'What / Teacher / Room') + 1, 420);
  s.autoResizeColumns(1, 5);
}

function setupRoutes_() {
  const s = sheet_(SHEETS.ROUTES);
  if (s.getLastRow() > 1) return;
  {
    const rows = TOUR_ROUTES_.map(function (r) {
      return [r.route, r.direction, r.humanities, r.language, r.itinerary];
    });
    s.getRange(2, 1, rows.length, 5).setValues(rows);
    s.getRange(2, 5, rows.length, 1).setWrap(true).setVerticalAlignment('top');
    s.setRowHeights(2, rows.length, 180);
    s.setColumnWidth(5, 520);
  }
  s.autoResizeColumns(1, 4);
}

function setupSettings_() {
  const s = sheet_(SHEETS.SETTINGS);
  if (s.getLastRow() > 1) return;
  // Plain text, or Sheets reads "6 and 6" style values as dates and the
  // grades come back as a day and a year.
  s.getRange(2, 2, Math.max(DEFAULT_SETTINGS.length, 200), 1).setNumberFormat('@');
  s.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
  note_(s, SHEETS.SETTINGS, 'Value',
    'Visitor Races Needing a Student of Color Guide: a visitor whose Race ' +
    'is on this list always gets at least one student of color among their ' +
    'guides. Two is fine. Everyone else carries no race constraint at all - ' +
    'two white-presenting guides for a white visitor is fine, and the other ' +
    'races are left open.\n\n' +
    'Reply-To Email: leave blank and replies come back to whoever sends. ' +
    'Set it to an admissions address to collect replies there instead.\n\n' +
    'Guide Grades for Rising N: which grade each of a visitor\'s guides comes ' +
    'from, one per guide, written as "6 and 7".\n\n' +
    'A rising 5th grader gets two 6th graders - they are in 4th now, and there ' +
    'is no 4th grade here, so nothing below 5th is ever asked for whatever ' +
    'this says.');
  s.autoResizeColumns(1, 2);
}

/**
 * Makes sure a sheet has a column, adding it on the end if it does not.
 *
 * Only ever adds: an existing column is left exactly where it is, and
 * nothing else on the sheet is touched. The new header copies the
 * formatting of the one beside it so it matches the rest of the row.
 */
function ensureColumn_(name, header, options) {
  const s = sheet_(name);
  if (headerIndex_(name)[header] !== undefined) return false;
  const at = Math.max(s.getLastColumn(), 1) + 1;
  s.getRange(1, at).setValue(header);
  try {
    s.getRange(1, at - 1).copyFormatToRange(s, at, at, 1, 1);
  } catch (err) {
    // A sheet with nothing to copy from is fine; the header still lands.
  }
  delete HEADER_CACHE_[name];
  if (options) dropdown_(s, Math.max(s.getLastRow(), 2), at, options, true);
  return true;
}

function dropdown_(sheet, lastRow, col, values, allowOther) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(true).build();
  sheet.getRange(2, col, Math.max(lastRow - 1, 200), 1).setDataValidation(rule);
}

function note_(sheet, sheetName, header, text) {
  sheet.getRange(1, col_(sheetName, header) + 1).setNote(text);
}

/* =========================================================
 * Reading the bell schedule
 *
 * Every student sits in two groups that cut across each other: their
 * homeroom, which is their advisory, and their split (A/B/C), which runs
 * across the whole grade. Roughly half the week happens in each.
 *
 * A block carrying a section letter - "Math A", "Art B", "Science C" -
 * belongs to the SPLIT group that letter names, wherever it is drawn.
 * A block with no letter - "Hum DR M211" - belongs to the homeroom.
 *
 * What hides this is that each homeroom column carries exactly one letter
 * all week (DJM=A, AOS=B, CCM=C, EEL=A, MSB=B, CJM=A, RSS=B), so the
 * column reads like the homeroom until you meet a student whose split is
 * not their column's letter - which is more than half of them.
 * ========================================================= */

const ROOM_RE_ = /^(M\d{3}|L\d{3}|TSAC|PAPAS|Charlton|Thompson|Auditorium)$/;

/* Words in a block that are never a teacher's initials. "MS" is absent on
 * purpose - it is Marco Sanchez, not "MS Meeting", which is skipped by
 * phrase where blocks are read. */
const NOT_INITIALS_ = ['Hum', 'Math', 'Science', 'PE', 'Art', 'Music', 'Choices', 'Lunch', 'Recess',
  'Morning', 'Homeroom', 'Meeting', 'IWP', 'Majors', 'Electives', 'Affinity', 'Groups', 'Olympic',
  'Teams', 'Dance', 'Drama', 'Instrumental', 'Portfolio', 'Vocal', 'Room', 'Modern', 'Band',
  'Animation', 'Ensemble', 'Movement', 'Lab', 'Storytelling', 'Mix', 'Up', 'Ceramics', 'Photography',
  'Production', 'French', 'Mandarin', 'Spanish', 'A', 'B', 'C', 'As', 'Bs', 'Cs', 'CAP', 'Period',
  'Activity', 'Bring', 'the', 'and', 'to', 'with'];

const NON_CLASS_RE_ = /Morning Homeroom|MS Meeting|Lunch|Recess|IWP/;

/** The split letter a block belongs to, or '' when the whole homeroom attends. */
function splitLetterOf_(text) {
  const t = trim_(text);
  let m = /\(split ([A-C])\)\s*$/.exec(t);
  if (m) return m[1];
  m = /^(?:Hum|Math|Science|PE|Art|Music|Choices)\s+([A-C])s?\b/.exec(t);
  return m ? m[1] : '';
}

/** The block text with any "(split A)" marker taken off. */
function cleanBlock_(text) {
  return trim_(String(text).replace(/\s*\(split [A-C]\)\s*$/, ''));
}

function roomsIn_(text) {
  const out = [];
  trim_(text).split(/[\s(),:+\/]+/).forEach(function (tok) {
    if (ROOM_RE_.test(tok) && out.indexOf(tok) === -1) out.push(tok);
  });
  return out;
}

/**
 * Teacher handles in a block: initials where there are any, room codes
 * where there are not. World Language and Art print no initials at all,
 * so the room is what identifies the teacher.
 */
function initialsIn_(text) {
  const out = [];
  trim_(text).split(/[\s(),:]+/).forEach(function (tok) {
    if (!tok || ROOM_RE_.test(tok) || NOT_INITIALS_.indexOf(tok) !== -1) return;
    tok.split(/[+\/]/).forEach(function (part) {
      if (/^[A-Z][A-Za-z]{0,3}$/.test(part) && NOT_INITIALS_.indexOf(part) === -1 &&
          out.indexOf(part) === -1) out.push(part);
    });
  });
  return out.length ? out : roomsIn_(text);
}

/** initials (upper case) -> {name, email}, from the Teachers sheet. */
function teachersByInitials_() {
  const map = {};
  rows_(SHEETS.TEACHERS).forEach(function (r) {
    const name = trim_(r[0]);
    if (!name) return;
    trim_(r[1]).split(',').forEach(function (raw) {
      const key = trim_(raw).toUpperCase();
      if (key) map[key] = { name: name, email: trim_(r[2]) };
    });
  });
  return map;
}

/** advisor name (normalised) -> email, from the Teachers sheet. */
function teachersByName_() {
  const map = {};
  rows_(SHEETS.TEACHERS).forEach(function (r) {
    const name = trim_(r[0]);
    if (name) map[norm_(name)] = { name: name, email: trim_(r[2]) };
  });
  return map;
}

/**
 * The bell schedule, preferring the sheet so hand corrections stick and
 * falling back to Data.gs before setup has run.
 */
function bellSchedule_() {
  const out = {};
  const add = function (day, pod, split, start, end, what) {
    if (!day || !pod) return;
    if (!out[day]) out[day] = {};
    if (!out[day][pod]) out[day][pod] = [];
    out[day][pod].push({ split: split, start: start, end: end, what: what });
  };
  const sheet = ss_().getSheetByName(SHEETS.BELL);
  if (sheet && sheet.getLastRow() > 1) {
    rows_(SHEETS.BELL).forEach(function (r) {
      add(trim_(r[0]), trim_(r[1]), splitLetter_(r[2]), r[3], r[4], trim_(r[5]));
    });
    return out;
  }
  SCHEDULE_DAYS_.forEach(function (day) {
    PODS.forEach(function (pod) {
      (BELL_SCHEDULE_[day][pod] || []).forEach(function (e) {
        add(day, pod, splitLetterOf_(e[2]), e[0], e[1], e[2]);
      });
    });
  });
  return out;
}

/**
 * What a student is missing between two times, and who teaches it.
 *
 * Lettered blocks are matched on the student's split, across every
 * homeroom column in their grade. Unlettered blocks are matched on their
 * own homeroom. Anything the schedule genuinely leaves open comes back
 * with needsYou set rather than being guessed at.
 */
function classesMissed_(pod, split, grade, dateVal, startMin, endMin) {
  const day = WEEKDAYS_[dateVal.getDay()];
  const schedule = bellSchedule_();
  if (!schedule[day]) return [];

  const myGrade = grade || POD_GRADE_[pod] || '';
  const columns = GRADE_PODS_[myGrade] || (pod ? [pod] : []);
  const mySplit = splitLetter_(split);
  const byInitials = teachersByInitials_();
  const found = [];

  columns.forEach(function (column) {
    (schedule[day][column] || []).forEach(function (b) {
      const s = toMinutes_(b.start);
      const e = toMinutes_(b.end);
      if (s == null || e == null || !(s < endMin && startMin < e)) return;
      if (NON_CLASS_RE_.test(b.what)) return;

      const letter = splitLetter_(b.split) || splitLetterOf_(b.what);
      if (letter) {
        // A split-group block. Only this student's own letter counts.
        if (!mySplit) {
          if (column !== pod) return;            // no split on file: fall back to their column
        } else if (letter !== mySplit) {
          return;
        }
      } else if (column !== pod) {
        return;                                   // homeroom block belonging to another homeroom
      }

      const what = cleanBlock_(b.what);
      const teachers = [];
      const unresolved = [];
      initialsIn_(what).forEach(function (i) {
        const hit = byInitials[i.toUpperCase()];
        if (hit && hit.email) teachers.push(hit);
        else unresolved.push(i);
      });

      found.push({
        what: what,
        start: timeLabel_(s),
        end: timeLabel_(e),
        teachers: teachers,
        unresolved: unresolved,
        // A student with no split on file, on a lettered block, is a guess
        // we refuse to make.
        needsYou: (!!letter && !mySplit) || isOpenChoice_(what)
      });
    });
  });

  found.sort(function (a, b) { return toMinutes_(a.start) - toMinutes_(b.start); });
  return found;
}

/** Blocks the schedule never resolves to one class for one student. */
function isOpenChoice_(text) {
  const t = trim_(text);
  if (/Majors|Electives/.test(t)) return true;
  // The language period prints all three options at once.
  return /\bFrench\b/.test(t) && /\bMandarin\b/.test(t) && /\bSpanish\b/.test(t);
}

/* =========================================================
 * Who is available, and what they have done
 * ========================================================= */

/** Every ambassador row as an object, whether or not it is filled in. */
function ambassadors_() {
  const N = SHEETS.AMBASSADORS;
  return rows_(N).map(function (r) {
    return {
      name: fullName_(r[col_(N, 'First Name')], r[col_(N, 'Last Name')]),
      pod: trim_(r[col_(N, 'Homeroom')]).toUpperCase(),
      split: splitLetter_(r[col_(N, 'Split')]),
      grade: trim_(r[col_(N, 'Grade')]).replace(/[^0-9]/g, ''),
      advisor: trim_(r[col_(N, 'Advisor')]),
      borough: trim_(r[col_(N, 'Borough')]).toUpperCase(),
      gender: trim_(r[col_(N, 'Gender')]),
      presenting: trim_(cell_(r, N, 'Race (Presenting)')),
      email: trim_(r[col_(N, 'Student Email')]),
      light: trim_(cell_(r, N, 'Light')),
      active: norm_(r[col_(N, 'Active')]) === 'yes'
    };
  }).filter(function (a) { return a.name !== ''; });
}

/** name -> {Job: count}, plus a total, read off the Tour Tracker. */
function jobHistory_() {
  const N = SHEETS.TRACKER;
  const hist = {};
  rows_(N).forEach(function (r) {
    const who = norm_(r[col_(N, 'Ambassador')]);
    const job = trim_(r[col_(N, 'Job')]);
    if (!who || !job) return;
    if (!hist[who]) hist[who] = { total: 0, byJob: {} };
    hist[who].total += 1;
    hist[who].byJob[job] = (hist[who].byJob[job] || 0) + 1;
  });
  return hist;
}

/** name -> {Job: true}, read off the Eligibility sheet. Missing row = eligible. */
function eligibility_() {
  const N = SHEETS.ELIGIBILITY;
  const map = {};
  rows_(N).forEach(function (r) {
    const who = norm_(r[col_(N, 'Ambassador')]);
    if (!who) return;
    map[who] = {};
    [JOBS.PANELIST, JOBS.LOBBY, JOBS.TABLE, JOBS.GUIDE].forEach(function (job) {
      map[who][job] = norm_(r[col_(N, job)]) !== 'no';
    });
  });
  return map;
}

function activeJobs_() {
  const on = {};
  rows_(SHEETS.JOBS).forEach(function (r) {
    if (norm_(r[2]) !== 'no') on[trim_(r[0])] = true;
  });
  return on;
}

/**
 * Which grade each of a visitor's guides comes from, in order.
 *
 * The Grade on Prospective Students is the grade being applied for, so a
 * visitor applying for seventh is in sixth now. They get one guide in
 * their own grade, who is going through what they are going through, and
 * one in the grade they are about to enter, who can say what it is like.
 *
 * Fifth is the exception: a rising fifth grader is in fourth, and there
 * is no fourth grade here, so both guides are sixth graders.
 *
 * Each of these is a row on the Settings sheet - one grade per guide,
 * in order. Two guides and one grade listed means both come from it.
 */
function guideGradesFor_(applyingForGrade, howMany) {
  const g = gradeNumber_(applyingForGrade);
  const want = howMany || 2;
  const out = [];
  if (!g) return out;
  const n = Number(g);
  const list = gradeList_(settingRaw_('Guide Grades for Rising ' + g));
  for (let i = 0; i < want; i++) {
    if (list.length) { out.push(list[Math.min(i, list.length - 1)]); continue; }
    // No setting to go on. Their own grade and the one above it - except at
    // the bottom, where the grade below does not exist here, so both guides
    // come from the year above instead.
    if (n <= LOWEST_GRADE_) { out.push(String(LOWEST_GRADE_ + 1)); continue; }
    out.push(i === 0 ? String(n - 1) : String(Math.min(n, HIGHEST_GRADE_)));
  }
  // Whatever the setting says, never ask for a grade this school does not
  // have. A rising fifth grader is never given a fourth grader.
  return out.map(function (x) {
    const v = Number(x);
    if (!v || v < LOWEST_GRADE_) return String(LOWEST_GRADE_ + 1);
    if (v > HIGHEST_GRADE_) return String(HIGHEST_GRADE_);
    return String(v);
  });
}

/** "6th", 6, " 7 " -> "6". A date is not a grade, so it gives nothing. */
function gradeNumber_(value) {
  if (value instanceof Date) return '';
  const digits = trim_(value).replace(/[^0-9]/g, '');
  return digits.length <= 2 ? digits : '';
}

/**
 * "6 and 7" -> ['6', '7'].
 *
 * A Date here means Sheets has reinterpreted the cell - "6, 7" reads to
 * it as the 7th of June - so the value is refused rather than mined for
 * digits, which is how a grade once came out as 2026.
 */
function gradeList_(raw) {
  if (raw instanceof Date) return [];
  return trim_(raw).split(/[^0-9]+/)
    .filter(function (x) { return x !== '' && x.length <= 2; });
}

/** A setting's value as it really is, Date and all. */
function settingRaw_(key) {
  const data = rows_(SHEETS.SETTINGS);
  for (let i = 0; i < data.length; i++) {
    if (trim_(data[i][0]) === key) return data[i][1];
  }
  return '';
}

/** Visitors on a given tour date. */
function prospectiveFor_(dateVal) {
  const N = SHEETS.PROSPECTIVE;
  const out = [];
  rows_(N).forEach(function (r, i) {
    const d = toDate_(r[col_(N, 'Tour Date')]);
    const name = trim_(r[col_(N, 'Name')]);
    if (!name || !sameDay_(d, dateVal)) return;
    out.push({
      row: i + 2,
      name: name,
      school: trim_(r[col_(N, 'School')]),
      grade: trim_(r[col_(N, 'Grade')]).replace(/[^0-9]/g, ''),
      gender: trim_(r[col_(N, 'Gender')]),
      race: trim_(cell_(r, N, 'Race')),
      classVisit: trim_(cell_(r, N, 'Class Visit')),
      borough: trim_(r[col_(N, 'Borough')]).toUpperCase()
    });
  });
  return out;
}

/** The 5th graders available to host, from the Buddies sheet. */
function buddies_() {
  const N = SHEETS.BUDDIES;
  return rows_(N).map(function (r) {
    return {
      name: trim_(r[col_(N, 'Student')]),
      gender: trim_(cell_(r, N, 'Gender')),
      language: trim_(r[col_(N, 'Language')]),
      teacher: trim_(r[col_(N, 'Teacher')]),
      room: trim_(r[col_(N, 'Room')]),
      canHost: norm_(r[col_(N, 'Can Host a Visitor')]) === 'yes'
    };
  }).filter(function (b) { return b.name !== ''; });
}

/** "5th grade Mandarin" -> "mandarin". Blank for a guide visit. */
function classVisitLanguage_(choice) {
  const c = norm_(choice);
  if (!c || c === norm_(CLASS_VISIT_WITH_GUIDE)) return '';
  return c.replace(/^5th grade\s*/, '').replace(/\s*class$/, '');
}

/* =========================================================
 * Staffing a Wednesday tour
 *
 * Guides are matched on grade and gender, which are requirements, and on
 * borough, which is a preference. Greeters are picked purely on who has
 * done least. Panelists are not picked at all - the office does that, so
 * the plan ends with everyone still free.
 * ========================================================= */

function planTour(dateStr) {
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');

  const visitors = prospectiveFor_(dateVal);
  if (!visitors.length) {
    throw new Error('No visiting students listed for ' + longDate_(dateVal) +
      '. Add them to Prospective Students first, with that date in the Tour Date column.');
  }

  const all = ambassadors_();
  const elig = eligibility_();
  const hist = jobHistory_();
  const jobsOn = activeJobs_();
  const pool = all.filter(function (a) { return a.active; });

  const used = {};                       // name -> job already given on this tour
  const canDo = function (a, job) {
    if (jobsOn[job] === undefined ? false : !jobsOn[job]) return false;
    const e = elig[norm_(a.name)];
    return !e || e[job] !== false;
  };
  const fairness = function (a, b) {
    const ha = (hist[norm_(a.name)] || {}).total || 0;
    const hb = (hist[norm_(b.name)] || {}).total || 0;
    if (ha !== hb) return ha - hb;
    return a.name < b.name ? -1 : 1;
  };

  /* ---- guides, two per visitor ---- */
  const perVisitor = Number(setting_('Tour Guides Per Visiting Student', '2')) || 2;
  const maxPerRoute = Number(setting_('Max Families Per Route', '1')) || 1;
  const routes = rows_(SHEETS.ROUTES).map(function (r) { return trim_(r[0]); }).filter(Boolean);
  const routeUse = {};

  const pairs = visitors.map(function (v) {
    const wantGrades = guideGradesFor_(v.grade, perVisitor);
    const needsSoC = needsSoCGuide_(v.race);
    // Each guide comes from its own grade, so the places are filled one
    // at a time rather than taken off a single ranked list.
    const chosen = [];
    const missing = [];
    wantGrades.forEach(function (wantGrade, slot) {
      let candidates = pool.filter(function (a) {
        if (used[a.name] || !canDo(a, JOBS.GUIDE)) return false;
        if (!a.grade || !a.gender) return false;
        if (v.grade && a.grade !== wantGrade) return false;
        return true;
      });

      /* Two things a pair owes the visitor, each satisfied by one guide
       * rather than both:
       *
       *   gender  at least one guide of the visitor's own gender, so a
       *           girl is never given two boys and a boy never two girls.
       *           Two of her own is fine.
       *   race    at least one student of color, where the visitor's race
       *           calls for it. Two is fine.
       *
       * Each is preferred while places remain and required on the last
       * place, so a pair cannot be completed still owing one. A candidate
       * who settles both is taken first, which keeps the last place from
       * being asked for two things at once. */
      const owedGender = !!v.gender &&
        !chosen.some(function (x) { return norm_(x.gender) === norm_(v.gender); });
      const owedSoC = needsSoC &&
        !chosen.some(function (x) { return isStudentOfColor_(x.presenting); });
      const owedCount = (owedGender ? 1 : 0) + (owedSoC ? 1 : 0);
      const settles = function (a) {
        return (owedGender && norm_(a.gender) === norm_(v.gender) ? 1 : 0) +
               (owedSoC && isStudentOfColor_(a.presenting) ? 1 : 0);
      };
      const lastPlace = slot === wantGrades.length - 1;
      if (lastPlace && owedCount) {
        const settlesAll = candidates.filter(function (a) { return settles(a) === owedCount; });
        if (settlesAll.length) candidates = settlesAll;
        else {
          const settlesSome = candidates.filter(function (a) { return settles(a) > 0; });
          if (settlesSome.length) candidates = settlesSome;
        }
      }
      // Whoever settles most of what is still owed, then same borough,
      // then whoever has done fewest jobs.
      candidates.sort(function (a, b) {
        if (owedCount) {
          const sa = settles(a), sb = settles(b);
          if (sa !== sb) return sb - sa;
        }
        const ba = (v.borough && a.borough === v.borough) ? 0 : 1;
        const bb = (v.borough && b.borough === v.borough) ? 0 : 1;
        if (ba !== bb) return ba - bb;
        return fairness(a, b);
      });
      if (candidates.length) {
        used[candidates[0].name] = JOBS.GUIDE;
        chosen.push(candidates[0]);
      } else {
        missing.push(wantGrade);
      }
    });

    let route = '';
    for (let i = 0; i < routes.length; i++) {
      if ((routeUse[routes[i]] || 0) < maxPerRoute) {
        route = routes[i];
        routeUse[route] = (routeUse[route] || 0) + 1;
        break;
      }
    }

    return {
      visitor: v,
      guides: chosen.map(function (a) {
        return a.name + ' (grade ' + a.grade + ')';
      }),
      guideNames: chosen.map(function (a) { return a.name; }),
      wantGrades: wantGrades,
      needsSoC: needsSoC,
      guideMix: traitMix_(chosen.map(function (a) { return a.name; }), pool, 'presenting'),
      route: route,
      socShortfall: needsSoC && chosen.length > 0 &&
        !chosen.some(function (a) { return isStudentOfColor_(a.presenting); }),
      genderShortfall: !!v.gender && chosen.length > 0 &&
        !chosen.some(function (a) { return norm_(a.gender) === norm_(v.gender); }),
      short: Math.max(0, perVisitor - chosen.length),
      why: !wantGrades.length
        ? 'no usable Grade on this visitor - put the grade they are applying for ' +
          '(a number) in the Grade column, or nobody can be matched to them'
        : (missing.length ? guideMissReason_(v, missing, pool, used, canDo, all.length) : '')
    };
  });

  /* ---- 5th grade class visits ---- */
  const buddyPool = buddies_().filter(function (b) { return b.canHost; });
  const buddyUsed = {};
  const handoff = setting_('Class Visit Handoff Time', '9:06');
  const tourEnd = setting_('Tour End Time', '9:25');

  pairs.forEach(function (p) {
    const want = classVisitLanguage_(p.visitor.classVisit);
    if (!want) return;
    const inClass = buddyPool.filter(function (b) {
      return !buddyUsed[b.name] && norm_(b.language) === want;
    });
    if (!inClass.length) {
      p.buddyProblem = buddyPool.filter(function (b) { return norm_(b.language) === want; }).length
        ? 'every 5th grader in that class is already hosting someone'
        : 'no 5th grader on the Buddies sheet is in that class and marked Can Host';
      return;
    }
    // A visiting girl is offered a girl and a boy a boy, where the class has
    // one free. A preference, not a rule: these classes are small, and one
    // with nobody of that gender still hosts rather than turning them away.
    inClass.sort(function (a, b) {
      if (p.visitor.gender) {
        const ga = norm_(a.gender) === norm_(p.visitor.gender) ? 0 : 1;
        const gb = norm_(b.gender) === norm_(p.visitor.gender) ? 0 : 1;
        if (ga !== gb) return ga - gb;
      }
      const ha = (hist[norm_(a.name)] || {}).total || 0;
      const hb = (hist[norm_(b.name)] || {}).total || 0;
      if (ha !== hb) return ha - hb;
      return a.name < b.name ? -1 : 1;
    });
    const pick = inClass[0];
    buddyUsed[pick.name] = true;
    p.buddy = pick;
    p.buddyGenderMiss = !!p.visitor.gender && !!pick.gender &&
      norm_(pick.gender) !== norm_(p.visitor.gender);
    p.buddyGenderUnknown = !!p.visitor.gender && !pick.gender;
    p.handoff = timeLabelOrRaw_(handoff) + ' - bring ' + p.visitor.name + ' to ' + pick.name +
      ' in ' + pick.room + ' (' + pick.teacher + ', ' + pick.language + '). Tour guides are ' +
      'finished and can go back to class. ' + pick.name + ' brings ' + p.visitor.name +
      ' down to the cafeteria at ' + timeLabelOrRaw_(tourEnd) + '.';
  });

  /* ---- greeters ---- */
  /**
   * Picks a crew as evenly split by gender as the people available allow.
   *
   * Everyone eligible is put in a queue per gender, each ordered by who
   * has done fewest jobs. Each place then goes to whichever queue has
   * been drawn on least so far, so three places across two genders come
   * out 2-1 rather than 3-0, and two places come out 1-1. Where only one
   * gender is left the crew simply fills from it rather than going short.
   */
  const crew = function (job, count) {
    const available = pool.filter(function (a) { return !used[a.name] && canDo(a, job); }).sort(fairness);
    const picked = [];
    while (picked.length < count) {
      let best = null;
      let bestKey = null;
      available.forEach(function (a) {
        if (picked.indexOf(a) !== -1) return;
        // How many already on this crew share each trait. Lower is better,
        // so a trait is only doubled up once every other option is gone.
        const key = [
          picked.filter(function (x) { return sameTrait_(x.presenting, a.presenting); }).length,
          picked.filter(function (x) { return sameTrait_(x.gender, a.gender); }).length
        ];
        if (best === null ||
            key[0] < bestKey[0] ||
            (key[0] === bestKey[0] && key[1] < bestKey[1])) {
          best = a; bestKey = key;
        }
      });
      if (best === null) break;
      picked.push(best);
    }
    const chosen = picked.map(function (a) { return a.name; });
    chosen.forEach(function (n) { used[n] = job; });
    let why = '';
    if (chosen.length < count) {
      if (!all.length) why = 'the Ambassadors sheet is empty';
      else if (!pool.length) why = 'nobody is marked Active - put Yes in the Active column';
      else why = 'everyone eligible is already on another job';
    }
    return {
      job: job, chosen: chosen, needed: count,
      short: Math.max(0, count - chosen.length), why: why,
      mix: genderMix_(chosen, pool),
      raceMix: traitMix_(chosen, pool, 'presenting')
    };
  };
  const greeters = [
    crew(JOBS.LOBBY, Number(setting_('Lobby Greeters Needed', '3')) || 3),
    crew(JOBS.TABLE, Number(setting_('Table Greeters Needed', '2')) || 2)
  ];

  /* ---- who is left, for the panel ---- */
  const free = pool.filter(function (a) { return !used[a.name] && canDo(a, JOBS.PANELIST); })
    .sort(fairness)
    .map(function (a) {
      const h = hist[norm_(a.name)] || { total: 0 };
      return { name: a.name, grade: a.grade, tours: h.total };
    });

  const everyone = [];
  pairs.forEach(function (p) { p.guideNames.forEach(function (g) { everyone.push(g); }); });
  greeters.forEach(function (c) { c.chosen.forEach(function (n) { everyone.push(n); }); });

  // Anyone on a yellow light who has ended up with a job.
  const byName = {};
  all.forEach(function (a) { byName[norm_(a.name)] = a; });
  const needConfirm = [];
  pairs.forEach(function (p) {
    p.guideNames.forEach(function (g) {
      const a = byName[norm_(g)];
      if (a && norm_(a.light) === 'yellow') {
        needConfirm.push({ name: g, job: JOBS.GUIDE, withWhom: p.visitor.name });
      }
    });
  });
  greeters.forEach(function (c) {
    c.chosen.forEach(function (n) {
      const a = byName[norm_(n)];
      if (a && norm_(a.light) === 'yellow') needConfirm.push({ name: n, job: c.job, withWhom: '' });
    });
  });

  return {
    date: dateKey_(dateVal),
    dateLabel: longDate_(dateVal),
    pairs: pairs,
    greeters: greeters,
    free: free,
    needConfirm: needConfirm,
    overallMix: genderMix_(everyone, pool),
    overallRaceMix: traitMix_(everyone, pool, 'presenting'),
    assignedCount: everyone.length,
    warnings: setupWarnings_(all, visitors)
  };
}

/**
 * Whether at least one of this visitor's guides must be a student of
 * colour, so they meet somebody who reflects them.
 *
 * Set on the Settings sheet, as a list of the races it applies to. A
 * visitor whose race is not on that list carries no constraint at all -
 * two white-presenting guides for a white visitor is fine, and the other
 * races are left open.
 */
function needsSoCGuide_(visitorRace) {
  const race = norm_(visitorRace);
  if (!race) return false;
  return String(setting_('Visitor Races Needing a Student of Color Guide', ''))
    .split(',')
    .map(function (x) { return norm_(x); })
    .filter(Boolean)
    .some(function (x) { return race === x || race.indexOf(x) !== -1 || x.indexOf(race) !== -1; });
}

/* The Race (Presenting) column gets written all sorts of ways - the full
 * words, or WP and SOC, or just W. All of these read the same. */
const WHITE_PRESENTING_ = ['wp', 'w', 'white', 'white presenting', 'whitepresenting',
  'white-presenting', 'white present', 'caucasian'];
const STUDENT_OF_COLOR_ = ['soc', 'poc', 's of c', 'student of color', 'student of colour',
  'students of color', 'of color', 'of colour', 'color', 'colour', 'studentofcolor'];

function isWhitePresenting_(presenting) {
  return WHITE_PRESENTING_.indexOf(norm_(presenting)) !== -1;
}

/** Anything filled in that is not white presenting counts as a student of color. */
function isStudentOfColor_(presenting) {
  const v = norm_(presenting);
  return v !== '' && !isWhitePresenting_(v);
}

/** A value in that column that matches neither list - most likely a typo. */
function unrecognisedPresenting_(presenting) {
  const v = norm_(presenting);
  return v !== '' && !isWhitePresenting_(v) && STUDENT_OF_COLOR_.indexOf(v) === -1;
}

/** Two blank traits do not count as a match, or blanks would all clump. */
function sameTrait_(a, b) {
  const x = norm_(a), y = norm_(b);
  return x !== '' && x === y;
}

/** "2 Female, 1 Male" for a list of names. */
function traitMix_(names, pool, field) {
  const by = {};
  names.forEach(function (n) {
    const a = pool.filter(function (x) { return x.name === n; })[0];
    const v = (a && trim_(a[field])) || 'not given';
    by[v] = (by[v] || 0) + 1;
  });
  return Object.keys(by).sort().map(function (v) { return by[v] + ' ' + v; }).join(', ');
}

function genderMix_(names, pool) { return traitMix_(names, pool, 'gender'); }

/** Which grade could not be filled, and why, in plain words. */
function guideMissReason_(v, missing, pool, used, canDo, total) {
  if (!total) return 'the Ambassadors sheet is empty';
  if (!pool.length) return 'no ambassador is marked Active - put Yes in the Active column';
  const parts = missing.map(function (g) {
    const inGrade = pool.filter(function (a) { return a.grade === g; });
    if (!inGrade.length) return 'no grade ' + g + ' ambassador on the sheet at all';
    const free = inGrade.filter(function (a) { return !used[a.name] && canDo(a, JOBS.GUIDE); });
    if (!free.length) return 'every grade ' + g + ' ambassador is already assigned';

    const noDetails = free.filter(function (a) { return !a.grade || !a.gender; }).length;
    if (noDetails) return noDetails + ' grade ' + g + ' ambassador(s) have no Gender filled in';
    return 'no grade ' + g + ' ambassador available';
  });
  return parts.join('; ');
}

/** Why a visitor could not be given a full pair, in plain words. */
function shortfallReason_(v, pool, used, canDo, total, wantGrades) {
  if (!total) return 'the Ambassadors sheet is empty';
  if (!pool.length) {
    return 'no ambassador is marked Active - put Yes in the Active column';
  }
  const left = pool.filter(function (a) { return !used[a.name] && canDo(a, JOBS.GUIDE); });
  if (!left.length) {
    const noDetails = pool.filter(function (a) { return !a.grade || !a.gender; }).length;
    if (noDetails === pool.length) {
      return 'every ambassador is missing Grade or Gender, so none can be matched';
    }
    return 'everyone eligible is already assigned';
  }
  const noDetails = left.filter(function (a) { return !a.grade || !a.gender; }).length;
  const want = wantGrades && wantGrades.length ? wantGrades : [v.grade];
  const label = 'grade ' + want.join(' or ');
  const gradeOk = left.filter(function (a) { return !v.grade || want.indexOf(a.grade) !== -1; });
  if (!gradeOk.length) {
    return 'nobody left in ' + label +
      (noDetails ? ' (' + noDetails + ' ambassador(s) have no grade or gender filled in)' : '');
  }
  const bothOk = gradeOk.filter(function (a) { return !v.gender || norm_(a.gender) === norm_(v.gender); });
  if (!bothOk.length) return 'nobody left in ' + label + ' of that gender';
  return '';
}

/** Anything missing that will bite later, checked before you commit. */
function setupWarnings_(all, visitors) {
  const w = [];
  const active = all.filter(function (a) { return a.active; });
  if (!all.length) {
    w.push('The Ambassadors sheet has no names on it. Run First-Time Setup, or type them in.');
    return w;
  }
  if (!active.length) {
    w.push('None of the ' + all.length + ' ambassadors is marked Active. Put Yes in the ' +
      'Active column - a blank there means "not available", so nobody can be picked.');
    return w;
  }
  const missing = function (field, label) {
    const n = active.filter(function (a) { return !a[field]; }).length;
    if (n) w.push(n + ' active ambassador(s) have no ' + label + '.');
  };
  missing('presenting', 'Race (Presenting) - they are left out of the balancing');
  const odd = {};
  active.forEach(function (a) {
    if (unrecognisedPresenting_(a.presenting)) odd[trim_(a.presenting)] = true;
  });
  if (Object.keys(odd).length) {
    w.push('Race (Presenting) has value(s) I do not recognise: ' +
      Object.keys(odd).map(function (x) { return '"' + x + '"'; }).join(', ') +
      '. Anything that is not white presenting is counted as a student of color, ' +
      'so check those are not typos. WP, W, White and White presenting all read as ' +
      'white presenting; SOC, POC and Student of color all read as a student of color.');
  }
  missing('grade', 'Grade - they can never be picked as a guide');
  missing('gender', 'Gender - they can never be picked as a guide');
  missing('split', 'Split - their teacher cannot be worked out');
  missing('pod', 'Homeroom');
  missing('email', 'Student Email - they will not be told they are on duty');
  missing('advisor', 'Advisor - their advisor will not be told');

  const buddyNoGender = buddies_().filter(function (b) { return b.canHost && !b.gender; }).length;
  if (buddyNoGender && visitors.some(function (v) { return classVisitLanguage_(v.classVisit); })) {
    w.push(buddyNoGender + ' of the 5th graders who can host have no Gender on the ' +
      '5th Grade Buddies sheet, so a visiting girl cannot be matched with a girl.');
  }

  const noTeacherEmail = rows_(SHEETS.TEACHERS).filter(function (r) {
    return trim_(r[0]) && !trim_(r[2]);
  }).length;
  if (noTeacherEmail) w.push(noTeacherEmail + ' teacher(s) have no email address on the Teachers sheet.');

  ['5', '6', '7', '8'].forEach(function (g) {
    const raw = settingRaw_('Guide Grades for Rising ' + g);
    if (raw instanceof Date) {
      w.push('Settings: "Guide Grades for Rising ' + g + '" has been turned into a date by ' +
        'Google Sheets. Format column B of Settings as Plain text (Format > Number > ' +
        'Plain text), then retype it as "6 and 7". Until then that grade falls back to ' +
        'the grade below and the grade itself.');
    }
  });

  const needed = {};
  visitors.forEach(function (v) {
    guideGradesFor_(v.grade, 2).forEach(function (g) { if (g) needed[g] = true; });
  });
  Object.keys(needed).sort().forEach(function (g) {
    if (!active.filter(function (a) { return a.grade === g; }).length) {
      w.push('No grade ' + g + ' ambassador is on the sheet, but a visitor this week needs one. ' +
        'Change "Guide Grades for Rising ..." on Settings, or that place stays empty.');
    }
  });

  visitors.forEach(function (v) {
    if (!v.grade) w.push('Visitor "' + v.name + '" has no Grade, so guides cannot be grade-matched.');
    if (!v.gender) w.push('Visitor "' + v.name + '" has no Gender, so guides cannot be gender-matched.');
  });
  return w;
}

/** Writes a plan to the Tour Tracker and back onto Prospective Students. */
function commitTour(dateStr) {
  const plan = planTour(dateStr);
  const dateVal = toDate_(plan.date);
  const N = SHEETS.TRACKER;
  const tracker = sheet_(N);

  // Replace anything already recorded for this date, so re-running is safe.
  const existing = rows_(N);
  for (let i = existing.length - 1; i >= 0; i--) {
    if (sameDay_(toDate_(existing[i][col_(N, 'Tour Date')]), dateVal)) tracker.deleteRow(i + 2);
  }

  const out = [];
  plan.pairs.forEach(function (p) {
    (p.guideNames || p.guides).forEach(function (g) {
      const row = blankRow_(N);
      row[col_(N, 'Tour Date')] = dateVal;
      row[col_(N, 'Ambassador')] = g;
      row[col_(N, 'Job')] = JOBS.GUIDE;
      row[col_(N, 'Prospective Student(s)')] = p.visitor.name;
      row[col_(N, 'Route')] = p.route;
      out.push(row);
    });
  });
  plan.pairs.forEach(function (p) {
    if (!p.buddy) return;
    const row = blankRow_(N);
    row[col_(N, 'Tour Date')] = dateVal;
    row[col_(N, 'Ambassador')] = p.buddy.name;
    row[col_(N, 'Job')] = JOBS.BUDDY;
    row[col_(N, 'Prospective Student(s)')] = p.visitor.name;
    row[col_(N, 'Notes')] = p.handoff;
    out.push(row);
  });
  plan.greeters.forEach(function (c) {
    c.chosen.forEach(function (n) {
      const row = blankRow_(N);
      row[col_(N, 'Tour Date')] = dateVal;
      row[col_(N, 'Ambassador')] = n;
      row[col_(N, 'Job')] = c.job;
      out.push(row);
    });
  });
  if (out.length) {
    tracker.getRange(tracker.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    tracker.getRange(2, col_(N, 'Tour Date') + 1, tracker.getLastRow() - 1, 1)
      .setNumberFormat('yyyy-mm-dd');
  }

  const P = SHEETS.PROSPECTIVE;
  const psheet = sheet_(P);
  plan.pairs.forEach(function (p) {
    psheet.getRange(p.visitor.row, col_(P, 'Route') + 1).setValue(p.route);
    psheet.getRange(p.visitor.row, col_(P, 'Tour Guides') + 1)
      .setValue((p.guideNames || p.guides).join(', '));
    const bcol = optionalCol_(P, 'Class Buddy');
    if (bcol !== -1) {
      psheet.getRange(p.visitor.row, bcol + 1)
        .setValue(p.buddy ? p.buddy.name + ' (' + p.buddy.room + ')' : '');
    }
  });

  return { written: out.length, plan: plan };
}

/* =========================================================
 * The printable route sheets
 *
 * One page per visiting student, in a Google Doc so it can be corrected
 * on the morning before it goes to the printer.
 *
 * Where a visitor has a 5th grade class visit, the last two lines of the
 * route are replaced: the guides hand over at 9:06 and are finished, and
 * the sheet itself goes with the visitor to the 5th grader, whose own
 * instructions are printed underneath.
 * ========================================================= */

function routeSheetData_(dateVal) {
  const P = SHEETS.PROSPECTIVE;
  const visitors = prospectiveFor_(dateVal);
  const assignments = assignmentsOn_(dateVal);
  const routes = {};
  rows_(SHEETS.ROUTES).forEach(function (r) {
    routes[trim_(r[0])] = { direction: trim_(r[1]), itinerary: String(r[4] || '') };
  });
  const buddyIndex = {};
  buddies_().forEach(function (b) { buddyIndex[norm_(b.name)] = b; });
  const ambIndex = {};
  ambassadors_().forEach(function (a) { ambIndex[norm_(a.name)] = a; });

  return visitors.map(function (v) {
    const mine = assignments.filter(function (a) { return norm_(a.visitor) === norm_(v.name); });
    const guides = mine.filter(function (a) { return a.job === JOBS.GUIDE; })
      .map(function (a) {
        const amb = ambIndex[norm_(a.name)];
        return a.name + (amb && amb.grade ? ' (' + amb.grade + 'th)' : '');
      });
    const buddyRow = mine.filter(function (a) { return a.job === JOBS.BUDDY; })[0];
    const buddy = buddyRow ? buddyIndex[norm_(buddyRow.name)] : null;
    const routeNo = trim_(readCell_(P, v.row, 'Route')) ||
      (mine.length ? trim_(mine[0].route) : '');
    const route = routes[routeNo] || { direction: '', itinerary: '' };
    return {
      visitor: v, guides: guides, buddy: buddy,
      buddyName: buddyRow ? buddyRow.name : '',
      routeNo: routeNo, direction: route.direction,
      lines: route.itinerary.split('\n').map(function (x) { return trim_(x); }).filter(Boolean)
    };
  });
}

function readCell_(name, row, header) {
  const i = optionalCol_(name, header);
  if (i === -1) return '';
  return sheet_(name).getRange(row, i + 1).getValue();
}

/**
 * Where each guide goes when the walking is over, and who has the visitor.
 *
 * Both guides are out of the same period, so if that period is the same
 * class for both of them they simply take the visitor in together. Where
 * they are in different classes only one can, so one takes the visitor
 * and the other is finished.
 */
function guideHandback_(page, dateVal) {
  const names = page.guides.map(function (g) { return g.replace(/\s*\(.*$/, ''); });
  if (!names.length) return '';
  const endsAt = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));
  const wait = setting_('Wait For', 'Maren');
  const takeThem = function (who) {
    return who + ': take ' + page.visitor.name + ' to class with you. At ' + endsAt +
      ' bring them down to the cafeteria and wait with them until ' + wait + ' is back.';
  };
  if (names.length === 1) return takeThem(names[0]);

  const startMin = toMinutes_(setting_('Class Visit Handoff Time', '9:06'));
  const endMin = toMinutes_(setting_('Tour End Time', '9:25'));
  const amb = {};
  ambassadors_().forEach(function (a) { amb[norm_(a.name)] = a; });
  const classOf = function (name) {
    const a = amb[norm_(name)];
    if (!a || (!a.pod && !a.split)) return '';
    const blocks = classesMissed_(a.pod, a.split, a.grade, dateVal, startMin, endMin);
    const usable = blocks.filter(function (b) { return !b.needsYou; });
    return usable.length ? usable[0].what : '';
  };
  const first = classOf(names[0]);
  const second = classOf(names[1]);

  if (first && second && norm_(first) === norm_(second)) {
    return takeThem(names.join(' and '));
  }
  return takeThem(names[0]) + '  ' + names[1] + ': go back to class. You are finished.';
}

/** "Take Nora to SPANISH with Alexander Rogoff. ..." */
function handoffForGuides_(page) {
  const b = page.buddy;
  const who = page.buddyName || (b && b.name) || '';
  const lang = b && b.language ? b.language.toUpperCase() : 'their class';
  return 'Take ' + page.visitor.name + ' to ' + lang + ' with ' + who +
    '. Give them the tour route, your name tag, the clock, and go back to your ' +
    'OWN CLASS. You are finished.';
}

/** What the 5th grader does once the sheet reaches them. */
function handoffForBuddy_(page) {
  const who = page.buddyName || (page.buddy && page.buddy.name) || '';
  const wait = setting_('Wait For', 'Maren');
  const endsAt = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));
  return who + ': introduce yourself and tell ' + page.visitor.name +
    ' what you are working on. At ' + endsAt + ' take them down to the cafeteria ' +
    'and wait with them until ' + wait + ' gets back.';
}

function buildRouteSheets(dateStr) {
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const pages = routeSheetData_(dateVal);
  if (!pages.length) {
    throw new Error('No visiting students listed for ' + longDate_(dateVal) + '.');
  }

  const handoffAt = timeLabelOrRaw_(setting_('Class Visit Handoff Time', '9:06'));
  const title = 'Tour Routes - ' + longDate_(dateVal);
  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.clear();

  pages.forEach(function (page, i) {
    if (i > 0) body.appendPageBreak();

    body.appendParagraph(page.visitor.name.toUpperCase())
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);

    const sub = [];
    if (page.visitor.school) sub.push(page.visitor.school);
    if (page.visitor.grade) sub.push('applying for grade ' + page.visitor.grade);
    body.appendParagraph(sub.join('  -  ')).setHeading(DocumentApp.ParagraphHeading.NORMAL);

    body.appendParagraph(longDate_(dateVal) +
      (page.routeNo ? '  -  Route ' + page.routeNo : '') +
      (page.direction ? ' (' + page.direction + ')' : ''));

    body.appendParagraph('Tour guides: ' + (page.guides.join(', ') || 'not assigned'));
    if (page.buddy) {
      body.appendParagraph('Class visit: ' + page.buddyName + '  -  ' +
        page.buddy.language + ', ' + page.buddy.teacher + ', ' + page.buddy.room);
    }
    body.appendParagraph('');

    // The walk itself, minus the two closing lines when there is a handoff.
    const closing = /Bring visitors to class|Bring visitor down to cafeteria/;
    page.lines.forEach(function (line) {
      if (closing.test(line)) return;
      body.appendParagraph(line);
    });

    if (page.buddy) {
      body.appendParagraph('');
      body.appendParagraph(handoffAt + '  ' + handoffForGuides_(page)).setBold(true);
      body.appendParagraph('');
      body.appendParagraph('For ' + page.buddyName)
        .setHeading(DocumentApp.ParagraphHeading.HEADING3);
      body.appendParagraph(handoffForBuddy_(page));
    } else {
      const back = guideHandback_(page, dateVal);
      if (back) {
        body.appendParagraph('');
        body.appendParagraph(handoffAt + '  ' + back).setBold(true);
      }
    }
  });

  doc.saveAndClose();
  return { url: doc.getUrl(), name: title, pages: pages.length };
}

/* =========================================================
 * Emails
 *
 * Teachers and advisors hear twice: Monday 11am and Wednesday 7:45am.
 * Students hear three times: Monday 3:30pm, Tuesday noon, Wednesday
 * 7:45am. The same wording serves all of them, so it never says a flat
 * "today" - it works that out from the day it is actually sent.
 * ========================================================= */

function whenLabel_(tourDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(tourDate.getTime()); d.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  const label = WEEKDAYS_[d.getDay()] + ', ' + MONTHS_[d.getMonth()] + ' ' + d.getDate();
  if (days === 0) return { body: 'today (' + label + ')', subject: 'Today' };
  if (days === 1) return { body: 'tomorrow (' + label + ')', subject: 'Tomorrow' };
  return { body: label, subject: label };
}

/** The soonest tour date on the Tour Tracker from today onwards. */
function nextTourDate_() {
  const N = SHEETS.TRACKER;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let best = null;
  rows_(N).forEach(function (r) {
    const d = toDate_(r[col_(N, 'Tour Date')]);
    if (!d) return;
    const x = new Date(d.getTime()); x.setHours(0, 0, 0, 0);
    if (x >= today && (!best || x < best)) best = x;
  });
  return best;
}

function assignmentsOn_(dateVal) {
  const N = SHEETS.TRACKER;
  return rows_(N).filter(function (r) {
    return trim_(r[col_(N, 'Ambassador')]) && sameDay_(toDate_(r[col_(N, 'Tour Date')]), dateVal);
  }).map(function (r) {
    return {
      name: trim_(r[col_(N, 'Ambassador')]),
      job: trim_(r[col_(N, 'Job')]),
      visitor: trim_(r[col_(N, 'Prospective Student(s)')]),
      route: trim_(r[col_(N, 'Route')])
    };
  });
}

function mailOptions_(to, subject, html) {
  const opts = {
    to: to,
    subject: subject,
    htmlBody: html,
    name: setting_('Sender Display Name', 'LREI Middle School Tours')
  };
  const reply = setting_('Reply-To Email', '');
  if (reply) opts.replyTo = reply;
  return opts;
}

const MAIL_STYLE_ = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;';
const TABLE_STYLE_ = 'border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:13px;';
const TH_ = 'padding:6px 10px;background:#a8322a;color:#fff;text-align:left;';
const TD_ = 'padding:6px 10px;border:1px solid #ddd;';

/* ---------- students ---------- */

function sendStudentEmails(dateStr) {
  const dateVal = dateStr ? toDate_(dateStr) : nextTourDate_();
  if (!dateVal) return { sent: 0, skipped: [], note: 'No tour on the Tour Tracker yet.' };

  const assignments = assignmentsOn_(dateVal);
  if (!assignments.length) return { sent: 0, skipped: [], note: 'Nothing staffed for that date yet.' };

  const when = whenLabel_(dateVal);
  const byName = {};
  ambassadors_().forEach(function (a) { byName[norm_(a.name)] = a; });

  const reportTo = setting_('Ambassadors Report To', 'the cafeteria');
  const reportAt = setting_('Ambassadors Report At', '8:25 AM');
  const endTime = setting_('Tour End Time', '9:25');

  const grouped = {};
  assignments.forEach(function (a) {
    // The 5th grade buddies hear about it in person, not by email.
    if (a.job === JOBS.BUDDY) return;
    (grouped[a.name] = grouped[a.name] || []).push(a);
  });

  let sent = 0;
  const skipped = [];
  Object.keys(grouped).forEach(function (name) {
    const who = byName[norm_(name)];
    if (!who || !who.email) { skipped.push(name); return; }
    const jobs = grouped[name];
    const items = jobs.map(function (j) {
      let line = escapeHtml_(j.job);
      if (j.visitor) line += ' for ' + escapeHtml_(j.visitor);
      if (j.route) line += ' - route ' + escapeHtml_(j.route);
      return '<li>' + line + '</li>';
    }).join('');

    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(name.split(' ')[0]) + ',</p>' +
      '<p>You are on the tour schedule for ' + escapeHtml_(when.body) + ':</p>' +
      '<ul>' + items + '</ul>' +
      '<p><b>Please come to ' + escapeHtml_(reportTo) + ' at ' + escapeHtml_(reportAt) + '.</b></p>' +
      '<p>You will be back in class by ' + escapeHtml_(timeLabelOrRaw_(endTime)) + '. ' +
      'Your teachers already know you are out.</p>' +
      '<p>Thank you for doing this.<br>' +
      escapeHtml_(setting_('Sender Display Name', 'LREI Middle School Tours')) + '</p></div>';

    MailApp.sendEmail(mailOptions_(who.email, 'Your Tour Job - ' + when.subject, html));
    sent++;
  });
  return { sent: sent, skipped: skipped, date: longDate_(dateVal) };
}

function timeLabelOrRaw_(v) {
  const m = toMinutes_(v);
  return m == null ? String(v) : timeLabel_(m);
}

/* ---------- advisors and class teachers ---------- */

function sendTeacherEmails(dateStr) {
  const dateVal = dateStr ? toDate_(dateStr) : nextTourDate_();
  if (!dateVal) return { advisorsSent: 0, teachersSent: 0, needsYou: [], note: 'No tour on the Tour Tracker yet.' };

  const assignments = assignmentsOn_(dateVal);
  if (!assignments.length) {
    return { advisorsSent: 0, teachersSent: 0, needsYou: [], note: 'Nothing staffed for that date yet.' };
  }

  const when = whenLabel_(dateVal);
  const byName = {};
  ambassadors_().forEach(function (a) { byName[norm_(a.name)] = a; });
  const teacherByName = teachersByName_();
  const startMin = toMinutes_(setting_('Tour Start Time', '8:30'));
  const endMin = toMinutes_(setting_('Tour End Time', '9:25'));
  const senderName = setting_('Sender Display Name', 'LREI Middle School Tours');

  const byAdvisor = {};       // email -> {name, rows:[]}
  const byTeacher = {};       // email -> {name, rows:[]}
  const needsYou = [];
  const seen = {};

  assignments.forEach(function (a) {
    if (seen[norm_(a.name)]) { seen[norm_(a.name)].jobs.push(a); return; }
    seen[norm_(a.name)] = { jobs: [a] };
  });

  /* The language teacher whose class a visitor is joining. The 5th grader
   * hosting them is spoken to in person, so only the teacher hears. */
  const byHost = {};
  const buddyIndex = {};
  buddies_().forEach(function (b) { buddyIndex[norm_(b.name)] = b; });
  assignments.forEach(function (a) {
    if (a.job !== JOBS.BUDDY) return;
    const b = buddyIndex[norm_(a.name)];
    if (!b || !b.teacher) {
      needsYou.push(a.name + ' is hosting ' + a.visitor +
        ' but has no Teacher on the 5th Grade Buddies sheet, so nobody could be told.');
      return;
    }
    const t = teacherByName[norm_(b.teacher)];
    if (!t || !t.email) {
      needsYou.push(b.teacher + ' is hosting ' + a.visitor + ' in ' + b.room +
        ' but has no email on the Teachers sheet.');
      return;
    }
    if (!byHost[t.email]) byHost[t.email] = { name: t.name, rows: [] };
    byHost[t.email].rows.push({ visitor: a.visitor, student: a.name, room: b.room, language: b.language });
  });

  Object.keys(seen).forEach(function (key) {
    const jobs = seen[key].jobs.filter(function (j) { return j.job !== JOBS.BUDDY; });
    if (!jobs.length) return;
    const name = jobs[0].name;
    const who = byName[key];
    if (!who) { needsYou.push(name + ' is on the tracker but not on the Ambassadors sheet.'); return; }
    const jobText = jobs.map(function (j) { return j.job; }).join(', ');
    const guiding = jobs.some(function (j) { return j.job === JOBS.GUIDE; });

    /* advisor */
    if (who.advisor) {
      // An advisory shared by two people is written "Eliza/Lila". Both hear.
      who.advisor.split(/[\/,&]| and /).forEach(function (part) {
        const one = trim_(part);
        if (!one) return;
        const t = teacherByName[norm_(one)];
        if (t && t.email) {
          if (!byAdvisor[t.email]) byAdvisor[t.email] = { name: t.name, rows: [] };
          byAdvisor[t.email].rows.push({ student: name, job: jobText });
        } else {
          needsYou.push(name + "'s advisor (" + one + ') has no email on the Teachers sheet.');
        }
      });
    } else {
      needsYou.push(name + ' has no Advisor filled in.');
    }

    /* the class they walk out of */
    if (!who.pod && !who.split) {
      needsYou.push(name + ' has no Homeroom or Split, so their class cannot be worked out.');
      return;
    }
    const blocks = classesMissed_(who.pod, who.split, who.grade, dateVal, startMin, endMin);
    if (!blocks.length) { return; }
    blocks.forEach(function (b) {
      if (b.needsYou) {
        needsYou.push(name + ' misses "' + b.what + '" (' + b.start + '-' + b.end +
          '), which the schedule does not pin to one class. Nobody was emailed - forward it yourself.');
        return;
      }
      if (!b.teachers.length) {
        needsYou.push(name + ' misses "' + b.what + '" (' + b.start + '-' + b.end + ')' +
          (b.unresolved.length
            ? ', taught by ' + b.unresolved.join('/') + ' - add those initials and an email on the Teachers sheet.'
            : ' - no teacher could be identified.'));
        return;
      }
      b.teachers.forEach(function (t) {
        if (!byTeacher[t.email]) byTeacher[t.email] = { name: t.name, rows: [] };
        byTeacher[t.email].rows.push({
          student: name, job: jobText, what: b.what,
          start: b.start, end: b.end, guiding: guiding
        });
      });
    });
  });

  let advisorsSent = 0;
  Object.keys(byAdvisor).forEach(function (email) {
    const e = byAdvisor[email];
    const body = e.rows.map(function (r) {
      return '<tr><td style="' + TD_ + '">' + escapeHtml_(r.student) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.job) + '</td></tr>';
    }).join('');
    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(e.name) + ',</p>' +
      '<p>Your advisee(s) will be out on a Middle School tour ' + escapeHtml_(when.body) + ':</p>' +
      '<table style="' + TABLE_STYLE_ + '"><tr><th style="' + TH_ + '">Advisee</th>' +
      '<th style="' + TH_ + '">Job</th></tr>' + body + '</table>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p></div>';
    MailApp.sendEmail(mailOptions_(email, 'Advisee on Tour Duty - ' + when.subject, html));
    advisorsSent++;
  });

  let teachersSent = 0;
  Object.keys(byTeacher).forEach(function (email) {
    const e = byTeacher[email];
    const anyGuiding = e.rows.some(function (r) { return r.guiding; });
    const body = e.rows.map(function (r) {
      return '<tr><td style="' + TD_ + '">' + escapeHtml_(r.student) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.start) + ' - ' + escapeHtml_(r.end) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.what) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.job) + '</td></tr>';
    }).join('');
    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(e.name) + ',</p>' +
      '<p>The student(s) below will be out of your class ' + escapeHtml_(when.body) +
      ' for a Middle School tour:</p>' +
      '<table style="' + TABLE_STYLE_ + '">' +
      '<tr><th style="' + TH_ + '">Student</th><th style="' + TH_ + '">Time</th>' +
      '<th style="' + TH_ + '">Class</th><th style="' + TH_ + '">Tour job</th></tr>' +
      body + '</table>' +
      (anyGuiding
        ? '<p>The tour guides bring their visiting student back to class with them ' +
          'before the end of the period, so please expect a visitor as well.</p>'
        : '') +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p></div>';
    MailApp.sendEmail(mailOptions_(email, 'Student Out of Your Class - ' + when.subject, html));
    teachersSent++;
  });

  let hostsSent = 0;
  const handoff = timeLabelOrRaw_(setting_('Class Visit Handoff Time', '9:06'));
  const endsAt = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));
  Object.keys(byHost).forEach(function (email) {
    const e = byHost[email];
    const body = e.rows.map(function (r) {
      return '<tr><td style="' + TD_ + '">' + escapeHtml_(r.visitor) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.student) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.room) + '</td></tr>';
    }).join('');
    const many = e.rows.length > 1;
    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(e.name) + ',</p>' +
      '<p>' + (many ? 'Prospective students are' : 'A prospective student is') +
      ' joining your class ' + escapeHtml_(when.body) + ', at the end of a Middle School tour. ' +
      'Their tour guides bring them up at about ' + escapeHtml_(handoff) +
      ', and the 5th grader below walks them down to the cafeteria at ' +
      escapeHtml_(endsAt) + '.</p>' +
      '<table style="' + TABLE_STYLE_ + '">' +
      '<tr><th style="' + TH_ + '">Visiting student</th>' +
      '<th style="' + TH_ + '">Sitting with</th><th style="' + TH_ + '">Room</th></tr>' +
      body + '</table>' +
      '<p>Nothing is needed from you beyond a seat.<br>' + escapeHtml_(senderName) + '</p></div>';
    MailApp.sendEmail(mailOptions_(email,
      'Student Visitor in Your Class - ' + when.subject, html));
    hostsSent++;
  });

  return {
    advisorsSent: advisorsSent, teachersSent: teachersSent, hostsSent: hostsSent,
    needsYou: needsYou, date: longDate_(dateVal)
  };
}

/* ---------- what the triggers call ---------- */

function sendStudentEmailsForNextTour() { return sendStudentEmails(null); }
function sendTeacherEmailsForNextTour() { return sendTeacherEmails(null); }

/* =========================================================
 * Automatic sends
 * ========================================================= */

const REMINDER_SLOTS_ = [
  { handler: HANDLER_TEACHER_EMAILS, day: 'MONDAY', hour: 11, minute: 0, label: 'Teachers, Monday 11:00 AM' },
  { handler: HANDLER_TEACHER_EMAILS, day: 'WEDNESDAY', hour: 7, minute: 45, label: 'Teachers, Wednesday 7:45 AM' },
  { handler: HANDLER_STUDENT_EMAILS, day: 'MONDAY', hour: 15, minute: 30, label: 'Students, Monday 3:30 PM' },
  { handler: HANDLER_STUDENT_EMAILS, day: 'TUESDAY', hour: 12, minute: 0, label: 'Students, Tuesday 12:00 PM' },
  { handler: HANDLER_STUDENT_EMAILS, day: 'WEDNESDAY', hour: 7, minute: 45, label: 'Students, Wednesday 7:45 AM' }
];

/** The signed-in address, if the script is allowed to see it. */
function whoAmI_() {
  try {
    return Session.getEffectiveUser().getEmail() || 'whoever set this up';
  } catch (err) {
    return 'whoever set this up';
  }
}

function deleteTriggersFor_(handler) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t);
  });
}

function enableReminders() {
  deleteTriggersFor_(HANDLER_TEACHER_EMAILS);
  deleteTriggersFor_(HANDLER_STUDENT_EMAILS);
  REMINDER_SLOTS_.forEach(function (slot) {
    const b = ScriptApp.newTrigger(slot.handler).timeBased()
      .onWeekDay(ScriptApp.WeekDay[slot.day]).atHour(slot.hour);
    if (slot.minute) b.nearMinute(slot.minute);
    b.create();
  });
  alert_('Reminder emails are on.\n\n' +
    REMINDER_SLOTS_.map(function (s) { return '  ' + s.label; }).join('\n') + '\n\n' +
    'Google runs these within about fifteen minutes either side of the time, ' +
    'so treat them as "around" rather than on the dot.\n\n' +
    'They send as ' + whoAmI_() + ', because that is the account that just ' +
    'switched them on.\n\n' +
    'A tour with nothing staffed is skipped, so staff it before Monday morning.');
}

function disableReminders() {
  deleteTriggersFor_(HANDLER_TEACHER_EMAILS);
  deleteTriggersFor_(HANDLER_STUDENT_EMAILS);
  alert_('Reminder emails are off. Nothing will send on its own.');
}

/* =========================================================
 * Menu and dialogs
 * ========================================================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Wednesday Tours')
    .addItem('First-Time Setup', 'setupSpreadsheet')
    .addSeparator()
    .addItem('Staff This Wednesday Tour...', 'showStaffDialog')
    .addItem('Print Tour Routes...', 'showRouteSheetDialog')
    .addItem('Send Emails Now...', 'showEmailDialog')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Automation')
      .addItem('Turn ON reminder emails', 'enableReminders')
      .addItem('Turn OFF reminder emails', 'disableReminders'))
    .addToUi();
}

function dialog_(html, title, width, height) {
  const out = HtmlService.createHtmlOutput(html).setWidth(width).setHeight(height);
  SpreadsheetApp.getUi().showModalDialog(out, title);
}

/** The Wednesday coming up, as yyyy-mm-dd, for pre-filling a date box. */
function nextWednesday() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
  return dateKey_(d);
}

const DIALOG_CSS_ =
  'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222;margin:0;padding:16px;}' +
  'h2{font-size:15px;margin:0 0 4px;}' +
  'p.sub{color:#666;margin:0 0 14px;}' +
  'label{display:block;font-weight:bold;margin:12px 0 4px;}' +
  'input[type=date]{font:inherit;padding:6px;border:1px solid #bbb;border-radius:4px;}' +
  'button{font:inherit;padding:8px 16px;border-radius:4px;border:1px solid #a8322a;' +
  'background:#a8322a;color:#fff;cursor:pointer;margin-right:8px;}' +
  'button.ghost{background:#fff;color:#a8322a;}' +
  'button[disabled]{opacity:.5;cursor:default;}' +
  '.out{margin-top:14px;max-height:300px;overflow:auto;border:1px solid #e0e0e0;' +
  'border-radius:6px;padding:12px;background:#fafafa;}' +
  'table{border-collapse:collapse;width:100%;font-size:12px;}' +
  'th{background:#a8322a;color:#fff;text-align:left;padding:4px 8px;}' +
  'td{border:1px solid #e0e0e0;padding:4px 8px;vertical-align:top;}' +
  'h3{font-size:13px;margin:14px 0 6px;}' +
  '.warn{background:#fdf3e7;border:1px solid #e8c89a;border-radius:6px;padding:10px;margin-top:12px;}' +
  '.warn b{color:#8a5a12;}' +
  '.check-first{background:#fff8e1;border:2px solid #e0a800;border-radius:6px;padding:12px;margin-top:12px;}' +
  '.check-first h4{margin:0 0 8px;font-size:13px;color:#8a5a12;}' +
  '.check-first ul{margin:0 0 10px;padding-left:20px;}' +
  '.check-first label{display:flex;align-items:center;gap:8px;font-weight:bold;cursor:pointer;margin:0;}' +
  '.check-first input{width:16px;height:16px;cursor:pointer;}' +
  '.free{background:#eef5ee;border:1px solid #bcd6bf;border-radius:6px;padding:10px;margin-top:12px;}' +
  '.muted{color:#777;}';

function showStaffDialog() {
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Staff this Wednesday tour</h2>' +
    '<p class="sub">Pairs each visiting student with two guides and a route, then picks the greeters. ' +
    'Panelists are left for you.</p>' +
    '<label for="d">Tour date</label>' +
    '<input type="date" id="d" value="' + nextWednesday() + '">' +
    '<div style="margin-top:14px;">' +
    '<button id="preview" onclick="doPreview()">Preview</button>' +
    '<button id="save" class="ghost" onclick="doSave()" disabled>Save to Tour Tracker</button>' +
    '</div><div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function busy(b){document.getElementById("preview").disabled=b;}' +
    'function doPreview(){busy(true);document.getElementById("out").innerHTML="<p class=\'muted\'>Working...</p>";' +
    'google.script.run.withSuccessHandler(render).withFailureHandler(fail)' +
    '.api_planTour(document.getElementById("d").value);}' +
    'function fail(e){busy(false);document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";}' +
    'function render(p){busy(false);' +
    'var h="<div class=\'out\'><h3>"+esc(p.dateLabel)+"</h3><table><tr><th>Visiting student</th>' +
    '<th>Guides</th><th>Route</th></tr>";' +
    'p.pairs.forEach(function(x){h+="<tr><td>"+esc(x.visitor.name)+' +
    '(x.visitor.grade?" <span class=\'muted\'>grade "+esc(x.visitor.grade)+"</span>":"")+' +
    '(x.visitor.race?" <span class=\'muted\'>"+esc(x.visitor.race)+(x.needsSoC?" - needs a student of color":"")+"</span>":"")+' +
    '(x.visitor.school?" <span class=\'muted\'><br>("+esc(x.visitor.school)+")</span>":"")+"</td><td>"+' +
    '(x.guides.length?esc(x.guides.join(", ")):"<b>none found</b>")+' +
    '(x.wantGrades&&x.wantGrades.length?"<br><span class=\'muted\'>looking for grade "+' +
    'esc(x.wantGrades.join(" + "))+"</span>":"")+' +
    '(x.guideMix?"<br><span class=\'muted\'>"+esc(x.guideMix)+"</span>":"")+' +
    '(x.buddy?"<br><span class=\'muted\'>class visit: "+esc(x.buddy.name)+' +
    '(x.buddy.gender?" ("+esc(x.buddy.gender)+")":"")+" - "+esc(x.buddy.language)+' +
    '", "+esc(x.buddy.teacher)+", "+esc(x.buddy.room)+"</span>":"")+' +
    '(x.buddyGenderMiss?"<br><span class=\'muted\'>no "+esc(x.visitor.gender)+' +
    '" was free in that class, so this is the closest fit</span>":"")+' +
    '(x.buddyGenderUnknown?"<br><span class=\'muted\'>no Gender on file for that 5th grader</span>":"")+' +
    '(x.buddyProblem?"<br><b>class visit not assigned - "+esc(x.buddyProblem)+"</b>":"")+' +
    '(x.socShortfall?"<br><b>no student of color was free for this pair</b>":"")+' +
    '(x.genderShortfall?"<br><b>nobody of the visitor\'s own gender was free</b>":"")+' +
    '(x.short?" <span class=\'muted\'>short "+x.short+(x.why?" - "+esc(x.why):"")+"</span>":"")+' +
    '"</td><td>"+esc(x.route||"-")+"</td></tr>";});' +
    'h+="</table>";' +
    'p.greeters.forEach(function(c){h+="<h3>"+esc(c.job)+" ("+c.chosen.length+" of "+c.needed+")</h3><div>"+' +
    '(c.chosen.length?esc(c.chosen.join(", ")):"<b>none available</b>")+' +
    '(c.mix?" <span class=\'muted\'>("+esc(c.mix)+")</span>":"")+' +
    '(c.raceMix?"<br><span class=\'muted\'>"+esc(c.raceMix)+"</span>":"")+' +
    '(c.why?" <span class=\'muted\'>- "+esc(c.why)+"</span>":"")+"</div>";});' +
    'if(p.overallMix){h+="<h3>Everyone assigned ("+p.assignedCount+")</h3><div class=\'muted\'>"+' +
    'esc(p.overallMix)+(p.overallRaceMix?"<br>"+esc(p.overallRaceMix):"")+"</div>";}' +
    'h+="</div>";' +
    'if(p.free.length){h+="<div class=\'free\'><b>Still free - pick your panelists from these "+p.free.length+"</b><br>"+' +
    'esc(p.free.map(function(f){return f.name+" ("+(f.tours||0)+")";}).join(", "))+' +
    '"<br><span class=\'muted\'>The number is how many jobs they have done, fewest first.</span></div>";}' +
    'if(p.warnings.length){h+="<div class=\'warn\'><b>Worth fixing first</b><ul>"+' +
    'p.warnings.map(function(w){return "<li>"+esc(w)+"</li>";}).join("")+"</ul></div>";}' +
    'if(p.needConfirm&&p.needConfirm.length){' +
    'h+="<div class=\'check-first\'><h4>Check these "+p.needConfirm.length+' +
    '" before saving</h4><ul>"+p.needConfirm.map(function(c){' +
    'return "<li>"+esc(c.name)+" - "+esc(c.job)+(c.withWhom?" for "+esc(c.withWhom):"")+"</li>";' +
    '}).join("")+"</ul><label><input type=\'checkbox\' id=\'okd\' onchange=\'gate()\'>' +
    'I have checked each of them and they are fine</label></div>";}' +
    'document.getElementById("out").innerHTML=h;' +
    'window.__needs=(p.needConfirm||[]).length;gate();}' +
    'function gate(){var box=document.getElementById("okd");' +
    'document.getElementById("save").disabled=!!window.__needs&&!(box&&box.checked);}' +
    'function doSave(){if(window.__needs){var b=document.getElementById("okd");' +
    'if(!b||!b.checked){return;}}document.getElementById("save").disabled=true;' +
    'google.script.run.withSuccessHandler(function(r){' +
    'document.getElementById("out").innerHTML="<div class=\'free\'><b>Saved.</b> "+r.written+' +
    '" row(s) written to the Tour Tracker, and the routes and guides filled in on Prospective Students.</div>";})' +
    '.withFailureHandler(fail).api_commitTour(document.getElementById("d").value);}' +
    '<\/script>';
  dialog_(html, 'Staff This Wednesday Tour', 640, 620);
}

function showEmailDialog() {
  const next = nextTourDate_();
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Send emails now</h2>' +
    '<p class="sub">These go out on their own on the schedule. Use this to send early, ' +
    'or to check what would go.</p>' +
    '<label for="d">Tour date</label>' +
    '<input type="date" id="d" value="' + (next ? dateKey_(next) : nextWednesday()) + '">' +
    '<div style="margin-top:14px;">' +
    '<button onclick="go(\'students\')">Send to students</button>' +
    '<button onclick="go(\'teachers\')">Send to teachers and advisors</button>' +
    '</div><div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function go(which){document.getElementById("out").innerHTML="<p class=\'muted\'>Sending...</p>";' +
    'google.script.run.withSuccessHandler(done).withFailureHandler(function(e){' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";})' +
    '.api_sendEmails(which,document.getElementById("d").value);}' +
    'function done(r){var h="<div class=\'free\'>";' +
    'if(r.note){h+=esc(r.note);}else{' +
    'if(r.sent!=null){h+="<b>"+r.sent+"</b> student email(s) sent for "+esc(r.date)+".";}' +
    'else{h+="<b>"+r.advisorsSent+"</b> advisor email(s), <b>"+r.teachersSent+' +
    '"</b> class-teacher email(s)"+(r.hostsSent?" and <b>"+r.hostsSent+"</b> host-teacher email(s)":"")+' +
    '" sent for "+esc(r.date)+".";}}' +
    'h+="</div>";' +
    'if(r.skipped&&r.skipped.length){h+="<div class=\'warn\'><b>No Student Email on file, so not sent:</b><br>"+' +
    'esc(r.skipped.join(", "))+"</div>";}' +
    'if(r.needsYou&&r.needsYou.length){h+="<div class=\'warn\'><b>Needs you - nobody was emailed for these</b><ul>"+' +
    'r.needsYou.map(function(w){return "<li>"+esc(w)+"</li>";}).join("")+"</ul></div>";}' +
    'document.getElementById("out").innerHTML=h;}' +
    '<\/script>';
  dialog_(html, 'Send Emails Now', 620, 560);
}

/* ---------- what the dialogs call ---------- */

function showRouteSheetDialog() {
  const next = nextTourDate_();
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Print tour routes</h2>' +
    '<p class="sub">One page per visiting student, with their guides, their route and ' +
    'their class visit. Opens as a Google Doc you can edit before printing.</p>' +
    '<label for="d">Tour date</label>' +
    '<input type="date" id="d" value="' + (next ? dateKey_(next) : nextWednesday()) + '">' +
    '<div style="margin-top:14px;"><button id="go" onclick="make()">Build the document</button></div>' +
    '<div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function make(){document.getElementById("go").disabled=true;' +
    'document.getElementById("out").innerHTML="<p class=\'muted\'>Building...</p>";' +
    'google.script.run.withSuccessHandler(function(r){' +
    'document.getElementById("go").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'free\'><b>"+r.pages+' +
    '" page(s) ready.</b><br><a href=\'"+r.url+"\' target=\'_blank\'>Open "+esc(r.name)+' +
    '"</a><br><span class=\'muted\'>It is in your Drive. File &rsaquo; Print when you are happy with it.</span></div>";})' +
    '.withFailureHandler(function(e){document.getElementById("go").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";})' +
    '.api_buildRouteSheets(document.getElementById("d").value);}' +
    '<\/script>';
  dialog_(html, 'Print Tour Routes', 600, 460);
}

function api_buildRouteSheets(dateStr) { return buildRouteSheets(dateStr); }
function api_planTour(dateStr) { return planTour(dateStr); }
function api_commitTour(dateStr) { return commitTour(dateStr); }
function api_sendEmails(which, dateStr) {
  return which === 'students' ? sendStudentEmails(dateStr) : sendTeacherEmails(dateStr);
}
