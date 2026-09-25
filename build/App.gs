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
 *   3. Emails go out on their own: teachers Tuesday 8:30am and Wednesday
 *      7:45am, students Tuesday noon and Wednesday 7:45am.
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
  APART: 'Keep Apart',
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Homeroom', 'Split', 'Grade', 'Advisor',
  'Borough', 'Gender', 'Race (Presenting)', 'Light', 'Strength', 'Active',
  'Signed Up', 'Confirmed', 'Jobs Done',
  'Student Email', 'Parent 1 Name', 'Parent 1 Email', 'Parent 2 Name', 'Parent 2 Email'];

/** Everything about reaching a family rather than about a tour. Kept to the right. */
const CONTACT_COLUMNS_ = ['Student Email', 'Parent 1 Name', 'Parent 1 Email',
  'Parent 2 Name', 'Parent 2 Email'];

/** Written by the script after a tour is staffed or confirmed. */
const COUNT_COLUMNS_ = ['Signed Up', 'Confirmed', 'Jobs Done'];
HEADERS[SHEETS.PROSPECTIVE] = ['Tour Date', 'Name', 'School', 'Grade', 'Gender', 'Race', 'Borough',
  'Full Pay', 'Well Connected', 'Class Visit', 'Route', 'Tour Guides', 'Class Buddy', 'Notes'];
HEADERS[SHEETS.APART] = ['Ambassador', 'And', 'Notes'];
HEADERS[SHEETS.TRACKER] = ['Tour Date', 'Ambassador', 'Job', 'Prospective Student(s)', 'Route',
  'Showed Up', 'Notes'];
const CLASS_VISIT_WITH_GUIDE = 'With tour guide';
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active', 'Out of Class From', 'Out of Class To'];
HEADERS[SHEETS.ELIGIBILITY] = ['Ambassador', 'Panelist', 'Lobby Greeter', 'Table Greeter', 'Tour Guide'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Initials', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.BELL] = ['Day', 'Grade', 'Homeroom', 'Split', 'Start', 'End',
  'What / Teacher / Room'];
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

/**
 * How long each job actually keeps somebody out of class.
 *
 * This is what a teacher wants to know, and it is not the length of the
 * period they are missing - a greeter is back well before the bell. The
 * Jobs sheet holds the real values and can be edited there; these are
 * only what a new sheet starts with.
 */
const JOB_HOURS_ = {};
JOB_HOURS_[JOBS.PANELIST] = ['8:25 AM', '9:05 AM'];
JOB_HOURS_[JOBS.LOBBY] = ['8:25 AM', '8:55 AM'];
JOB_HOURS_[JOBS.TABLE] = ['8:25 AM', '8:55 AM'];
JOB_HOURS_[JOBS.GUIDE] = ['8:25 AM', '9:05 AM'];
JOB_HOURS_[JOBS.BUDDY] = ['9:05 AM', '9:25 AM'];

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
/**
 * How much of a showing an ambassador gives a family.
 *
 * Nothing to do with the Light, which is about whether they can be
 * trusted with the job at all. This is who she would put in front of a
 * family she especially wants to land.
 */
const STRENGTH_OPTIONS = ['High', 'Medium', 'Low'];
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
  ['Guide Grades for Rising 6', '6 and 6 or 8'],
  ['Guide Grades for Rising 7', '6 and 7'],
  ['Guide Grades for Rising 8', '7 and 8'],
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

/** Headings that appear more than once on a sheet, which is always a trap. */
function duplicateHeaders_(name) {
  const s = sheet_(name);
  const width = Math.max(s.getLastColumn(), HEADERS[name].length);
  const row = s.getRange(1, 1, 1, width).getValues()[0];
  const seen = {};
  const dupes = [];
  row.forEach(function (cell) {
    const key = trim_(cell);
    if (!key) return;
    if (seen[key] && dupes.indexOf(key) === -1) dupes.push(key);
    seen[key] = true;
  });
  return dupes;
}

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
/**
 * Sheet reads, remembered for the length of one run.
 *
 * Every trip to a sheet is a round trip, and the schedule lookup alone
 * used to re-read all 400 bell schedule rows once per ambassador. These
 * are all pure reads within a single run, so the first one pays and the
 * rest are free. Anything that writes calls clearReadCache_().
 */
let READ_CACHE_ = {};

function cached_(key, make) {
  if (READ_CACHE_[key] === undefined) READ_CACHE_[key] = make();
  return READ_CACHE_[key];
}

function clearReadCache_() { READ_CACHE_ = {}; }

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
function isYes_(v) { return norm_(v) === 'yes'; }

/**
 * 3 High, 2 Medium, 1 Low. A blank counts as Medium: not somebody she
 * has picked out, but not somebody to keep away from a family either.
 */
function strengthRank_(v) {
  const t = norm_(v);
  if (t === 'high') return 3;
  if (t === 'low') return 1;
  return 2;
}

/**
 * What the script read off the sheet for one guide, in their own words.
 *
 * Printed under every pair, so a cell that says something other than
 * what she thinks it says is visible at the moment it matters instead
 * of being noticed weeks later.
 */
function guideRead_(a) {
  return a.name + ': ' + (trim_(a.gender) || 'no gender') + ', ' +
    (trim_(a.presenting) || 'no race') + ', ' + (trim_(a.borough) || 'no borough');
}

/** A family worth putting her strongest ambassadors in front of. */
function isPriorityVisitor_(v) { return !!(v.fullPay || v.wellConnected); }

/** Why this family counts as one, in words, or '' when they do not. */
function priorityWhy_(v) {
  const why = [];
  if (v.fullPay) why.push('full pay');
  if (v.wellConnected) why.push('well connected');
  return why.join(', ');
}

function capitalize_(v) { const t = trim_(v); return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

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

/**
 * A setting, as text.
 *
 * Sheets keeps a time cell as a Date on 30 December 1899, so a cell
 * reading 9:25 comes back as "Sat Dec 30 1899 09:25:00 GMT-0500" the
 * moment anything prints it - which is how a tour route ended up
 * telling a guide to come back in 1899. A time is handed back as a
 * plain label; a real date is left alone, since that is somebody
 * meaning a date.
 */
function setting_(key, fallback) {
  const raw = settingRaw_(key);
  if (raw instanceof Date) {
    if (raw.getFullYear() <= 1900) {
      return timeLabel_(raw.getHours() * 60 + raw.getMinutes());
    }
    return trim_(raw);
  }
  const v = trim_(raw);
  return v === '' ? fallback : v;
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
  clearReadCache_();
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
  if (ensureJobHourColumns_()) {
    added.push('Out of Class From/To on Jobs');
  }
  if (ensureColumn_(SHEETS.AMBASSADORS, 'Strength', STRENGTH_OPTIONS)) {
    added.push('Strength on Ambassadors');
  }
  if (ensureColumn_(SHEETS.PROSPECTIVE, 'Full Pay', YES_NO)) {
    added.push('Full Pay on Prospective Students');
  }
  if (ensureColumn_(SHEETS.PROSPECTIVE, 'Well Connected', YES_NO)) {
    added.push('Well Connected on Prospective Students');
  }
  COUNT_COLUMNS_.forEach(function (h) {
    if (ensureColumn_(SHEETS.AMBASSADORS, h)) added.push(h + ' on Ambassadors');
  });
  if (ensureColumn_(SHEETS.TRACKER, 'Showed Up', YES_NO)) {
    added.push('Showed Up on Tour Tracker');
  }
  if (ensureBellGrade_()) {
    added.push('Grade on Bell Schedule');
  }
  if (tidyAmbassadorColumns_()) {
    added.push('contact details moved to the right of the Ambassadors sheet');
  }
  refreshCounts_();
  clearReadCache_();               // columns just changed under it

  setupAmbassadors_();
  setupProspective_();
  setupTracker_();
  setupBuddies_();
  setupJobs_();
  setupKeepApart_();
  setupEligibility_();
  setupTeachers_();
  const toppedUp = topUpTeachers_();
  if (toppedUp) added.push(toppedUp + ' teacher initials filled in');
  setupBellSchedule_();
  setupRoutes_();
  setupSettings_();

  if (firstRun) {
    const order = [SHEETS.PROSPECTIVE, SHEETS.TRACKER, SHEETS.AMBASSADORS, SHEETS.ELIGIBILITY,
        SHEETS.JOBS, SHEETS.APART, SHEETS.BUDDIES, SHEETS.TEACHERS, SHEETS.ROUTES,
        SHEETS.BELL, SHEETS.SETTINGS];
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
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Strength') + 1, STRENGTH_OPTIONS, true);
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
  note_(s, SHEETS.AMBASSADORS, 'Strength',
    'How good a showing this one gives a family. High means put them in front of ' +
    'anyone. A visitor marked Full Pay or Well Connected is given High guides first, ' +
    'where the grade and gender rules still allow it. Leave it blank and they are ' +
    'treated as Medium.');
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
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Full Pay') + 1, YES_NO, true);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Well Connected') + 1, YES_NO, true);
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
  note_(s, SHEETS.PROSPECTIVE, 'Full Pay',
    'Yes on either this or Well Connected and their guides are picked from the ' +
    'High Strength ambassadors first. It never overrides the grade, gender or ' +
    'race rules - it only decides who is chosen among the ones who already fit.');
  note_(s, SHEETS.PROSPECTIVE, 'Race',
    'WP or SOC is fine, so are White, African American, Asian and the rest.\n\n' +
    'A visitor who is a student of color is given one guide who is too, and ' +
    'one who is white presenting. No pair is two students of color unless ' +
    'there is no other way to fill it.');
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
  if (!fresh) return;
  const rows = [
    [JOBS.PANELIST, 'Speaks on the student panel. Chosen by hand, not by the staffing command.', 'Yes'],
    [JOBS.LOBBY, 'Greets visiting families as they arrive in the lobby.', 'Yes'],
    [JOBS.TABLE, 'Staffs the welcome and sign-in table.', 'Yes'],
    [JOBS.GUIDE, 'Walks a prospective student round the building on a set route.', 'Yes'],
    [JOBS.BUDDY, 'A 5th grader hosting a visiting student in their own class after the tour.', 'Yes']
  ].map(function (r) {
    const hours = JOB_HOURS_[r[0]] || ['', ''];
    return r.concat([hours[0], hours[1]]);
  });
  s.getRange(2, 4, rows.length, 2).setNumberFormat('@');
  s.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  dropdown_(s, Math.max(s.getLastRow(), 2), 3, YES_NO);
  note_(s, SHEETS.JOBS, 'Out of Class From',
    'When this job takes somebody out of class, and when they are back. This is what ' +
    'the teacher email says - not the length of the period they are missing.');
  s.autoResizeColumns(1, 5);
}

/**
 * The out-of-class window for each job, from the Jobs sheet, falling
 * back to the defaults where a cell is blank or the sheet predates the
 * columns.
 */
function jobHours_() {
  return cached_('jobHours', function () {
    const N = SHEETS.JOBS;
    const out = {};
    Object.keys(JOB_HOURS_).forEach(function (j) {
      out[norm_(j)] = { from: JOB_HOURS_[j][0], to: JOB_HOURS_[j][1] };
    });
    rows_(N).forEach(function (r) {
      const job = trim_(r[col_(N, 'Job Name')]);
      if (!job) return;
      const from = timeCell_(cell_(r, N, 'Out of Class From'));
      const to = timeCell_(cell_(r, N, 'Out of Class To'));
      if (!from && !to) return;
      const have = out[norm_(job)] || { from: '', to: '' };
      out[norm_(job)] = { from: from || have.from, to: to || have.to };
    });
    return out;
  });
}

/** A time cell, however Sheets chose to store it. */
function timeCell_(v) {
  if (v instanceof Date) return timeLabel_(v.getHours() * 60 + v.getMinutes());
  return trim_(v);
}

/** The whole time somebody is away, across every job they are doing. */
function awayMinutes_(jobNames) {
  const hours = jobHours_();
  let from = null;
  let to = null;
  jobNames.forEach(function (j) {
    const h = hours[norm_(j)];
    if (!h) return;
    const a = toMinutes_(h.from);
    const b = toMinutes_(h.to);
    if (a != null && (from === null || a < from)) from = a;
    if (b != null && (to === null || b > to)) to = b;
  });
  if (from === null || to === null) return null;
  return { from: from, to: to };
}

function awayWindow_(jobNames) {
  const w = awayMinutes_(jobNames);
  return w ? timeLabel_(w.from) + ' - ' + timeLabel_(w.to) : '';
}

/**
 * Every ambassador has a row on Eligibility, new ones included.
 *
 * She adds a name to the Ambassadors sheet and expects it to turn up
 * here, so this runs at the start of staffing as well as at setup.
 * Rows already there are never touched: a No she has set stays set.
 */
/**
 * Pairs who are never put together: not in one guide pair, not on one
 * greeting crew.
 *
 * First names are enough, because that is how she thinks of them and
 * how she typed the list. A name is matched against the Ambassadors
 * sheet at the moment of staffing, so new ambassadors are covered
 * without anything here changing.
 *
 * Panelists are exempt: she picks those herself.
 */
const KEEP_APART_SEED_ = [
  ['Laura', 'Oscar'],
  ['Mika', 'Emma'],
  ['Logan', 'Kayla'],
  ['Logan', 'Margo'],
  ['Margo', 'Kayla'],
  ['Sanai', 'Logan'],
  ['Sanai', 'Margo'],
  ['Reagan', 'Afia'],
  ['Reagan', 'Ama'],
  ['Ama', 'Afia'],
  ['Michelle', 'Reagan'],
  ['Michelle', 'Afia'],
  ['Michelle', 'Ama']
];

function setupKeepApart_() {
  const s = sheet_(SHEETS.APART);
  if (s.getLastRow() > 1) return;
  const rows = KEEP_APART_SEED_.map(function (p) { return [p[0], p[1], '']; });
  s.getRange(2, 1, rows.length, 3).setValues(rows);
  note_(s, SHEETS.APART, 'Ambassador',
    'Two ambassadors who are never put together: never the same pair of tour guides, ' +
    'never the same greeting crew. They can both work on the same tour, as long as ' +
    'they are not side by side - two of them may guide, with different families. ' +
    'First names are enough unless two ambassadors share one, in which case write ' +
    'the full name. Panelists are not affected, since you pick those by hand.');
  s.autoResizeColumns(1, 3);
}

/**
 * The list, with each name resolved to somebody on the Ambassadors
 * sheet. A name that matches nobody, or matches two people, is reported
 * rather than guessed at.
 */
function keepApart_() {
  return cached_('keepApart', function () {
    const N = SHEETS.APART;
    const people = ambassadors_();
    const byFull = {};
    const byFirst = {};
    people.forEach(function (a) {
      byFull[norm_(a.name)] = a.name;
      // "Afia" has to find Afia-Kusiwaa Twumasi, so a double first name
      // is indexed whole and in pieces.
      const first = norm_(a.name.split(' ')[0]);
      const keys = [first].concat(first.split('-'));
      keys.forEach(function (k) {
        if (!k) return;
        const list = byFirst[k] = byFirst[k] || [];
        if (list.indexOf(a.name) === -1) list.push(a.name);
      });
    });

    const pairs = [];
    const unknown = [];
    const ambiguous = [];
    const resolve = function (raw) {
      const key = norm_(raw);
      if (!key) return '';
      if (byFull[key]) return byFull[key];
      const hits = byFirst[key] || [];
      if (hits.length === 1) return hits[0];
      if (hits.length > 1) {
        if (ambiguous.indexOf(trim_(raw)) === -1) ambiguous.push(trim_(raw));
        return '';
      }
      if (unknown.indexOf(trim_(raw)) === -1) unknown.push(trim_(raw));
      return '';
    };

    rows_(N).forEach(function (r) {
      const a = resolve(r[col_(N, 'Ambassador')]);
      const b = resolve(r[col_(N, 'And')]);
      if (!a || !b || norm_(a) === norm_(b)) return;
      pairs.push([a, b]);
    });

    const apart = {};
    pairs.forEach(function (p) {
      apart[norm_(p[0]) + '|' + norm_(p[1])] = true;
      apart[norm_(p[1]) + '|' + norm_(p[0])] = true;
    });
    return { apart: apart, pairs: pairs, unknown: unknown, ambiguous: ambiguous };
  });
}

/** True if these two are on the list. */
function keptApart_(a, b) {
  return keepApart_().apart[norm_(a) + '|' + norm_(b)] === true;
}

/**
 * True if giving this person this job would put them on a crew with
 * somebody they are kept apart from.
 *
 * Crews work as a group, so this looks at everyone already given that
 * job. Guides are handled separately, pair by pair: two of them may
 * both guide, as long as they are not guiding the same family.
 * Panelists are never checked.
 */
function apartClash_(name, job, used) {
  if (job === JOBS.PANELIST) return false;
  const list = keepApart_().apart;
  if (!Object.keys(list).length) return false;
  return Object.keys(used).some(function (other) {
    return used[other] === job && keptApart_(name, other);
  });
}

function setupEligibility_() {
  const s = sheet_(SHEETS.ELIGIBILITY);
  const h = HEADERS[SHEETS.ELIGIBILITY];
  const fresh = s.getLastRow() < 2;
  const A = SHEETS.AMBASSADORS;
  const names = rows_(A)
    .map(function (r) {
      return fullName_(r[col_(A, 'First Name')], r[col_(A, 'Last Name')]);
    })
    .filter(function (n) { return n !== ''; });
  const existing = {};
  rows_(SHEETS.ELIGIBILITY).forEach(function (r, i) { existing[norm_(r[0])] = i + 2; });
  const add = [];
  names.forEach(function (n) {
    if (existing[norm_(n)]) return;
    existing[norm_(n)] = true;          // a name twice on the sheet gets one row
    add.push(n);
  });
  if (add.length) {
    const start = s.getLastRow() + 1;
    s.getRange(start, 1, add.length, h.length).setValues(add.map(function (n) {
      return [n, 'Yes', 'Yes', 'Yes', 'Yes'];
    }));
    // No dropdown call here: the validation laid down at setup already
    // covers 200 rows, and re-applying it would tread on anything she
    // has set by hand since.
    delete READ_CACHE_.eligibility;
  }
  if (!fresh) return;
  const last = Math.max(s.getLastRow(), 2);
  for (let c = 2; c <= h.length; c++) dropdown_(s, last, c, YES_NO);
  note_(s, SHEETS.ELIGIBILITY, 'Ambassador',
    'One row per ambassador, refreshed whenever you run setup or staffing. ' +
    'Set a job to No and they are never offered for it.');
  s.autoResizeColumns(1, h.length);
}

/**
 * Initials learned since her Teachers sheet was made.
 *
 * Only ever adds: a set of initials she has typed is never replaced,
 * and a teacher already on the sheet keeps their row, their email and
 * their note. Without this, every initial we work out together would
 * have to be retyped by hand.
 */
function topUpTeachers_() {
  const N = SHEETS.TEACHERS;
  const s = sheet_(N);
  if (s.getLastRow() < 2) return 0;
  const iCol = col_(N, 'Initials');
  const nCol = col_(N, 'Teacher Name');
  const data = rows_(N);
  const at = {};
  data.forEach(function (r, i) {
    const name = trim_(r[nCol]);
    if (name) at[norm_(name)] = i;
  });

  const known = {};
  Object.keys(TEACHER_INITIALS_).forEach(function (n) { known[n] = TEACHER_INITIALS_[n]; });
  EXTRA_TEACHERS_.forEach(function (t) { if (!known[t.name]) known[t.name] = t.initials; });

  const column = data.map(function (r) { return [r[iCol]]; });
  const add = [];
  let changed = 0;
  Object.keys(known).forEach(function (name) {
    const want = String(known[name]).split(',').map(trim_).filter(Boolean);
    const i = at[norm_(name)];
    if (i === undefined) {
      add.push([name, known[name], '', 'Added when the schedule was checked.']);
      return;
    }
    const have = String(column[i][0]).split(',').map(trim_).filter(Boolean);
    const missing = want.filter(function (code) {
      return !have.some(function (x) { return norm_(x) === norm_(code); });
    });
    if (!missing.length) return;
    column[i] = [have.concat(missing).join(', ')];
    changed++;
  });

  if (changed) s.getRange(2, iCol + 1, column.length, 1).setValues(column);
  if (add.length) {
    s.getRange(s.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
  }
  if (changed || add.length) clearReadCache_();
  return changed + add.length;
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
          rows.push([day, POD_GRADE_[pod] || '', pod, splitLetterOf_(e[2]),
            e[0], e[1], e[2]]);
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
  note_(s, SHEETS.BELL, 'Grade',
    'Which grade that homeroom belongs to, filled in from the homeroom so the ' +
    'two can never disagree.');
  s.setColumnWidth(col_(SHEETS.BELL, 'What / Teacher / Room') + 1, 420);
  s.autoResizeColumns(1, 6);
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
/**
 * The two out-of-class columns on a Jobs sheet that was made before
 * they existed, filled in for the jobs we know about. Anything she has
 * added herself is left blank for her to fill.
 */
/**
 * Contact details to the right of everything about tours.
 *
 * moveColumns carries the values, the formatting and the validation
 * with them, so nothing is retyped and nothing is lost. It runs only
 * when a column is not already where it belongs, so running setup
 * again does nothing.
 */
function tidyAmbassadorColumns_() {
  const N = SHEETS.AMBASSADORS;
  const s = sheet_(N);
  let moved = 0;
  CONTACT_COLUMNS_.forEach(function (header) {
    const width = s.getLastColumn();
    const at = optionalCol_(N, header);
    if (at === -1) return;
    if (at + 1 === width) return;            // already the rightmost
    s.moveColumns(s.getRange(1, at + 1, 1, 1), width + 1);
    delete HEADER_CACHE_[N];
    moved++;
  });
  if (moved) clearReadCache_();
  return moved;
}

/**
 * The three count columns, written from the Tour Tracker.
 *
 * Signed Up is everything she has given them, which is the number to
 * look at before a tour. Confirmed is what she has since ticked off,
 * which is the one that counts afterwards. Jobs Done breaks the
 * confirmed ones out by job.
 */
function refreshCounts_() {
  const N = SHEETS.AMBASSADORS;
  const s = sheet_(N);
  const data = rows_(N);
  if (!data.length) return 0;
  const cols = COUNT_COLUMNS_.map(function (h) { return optionalCol_(N, h); });
  if (cols.some(function (c) { return c === -1; })) return 0;

  delete READ_CACHE_.jobHistory;
  const hist = jobHistory_();
  const first = Math.min.apply(null, cols);
  const last = Math.max.apply(null, cols);
  const width = last - first + 1;
  const block = data.map(function (r) {
    const name = fullName_(r[col_(N, 'First Name')], r[col_(N, 'Last Name')]);
    const h = hist[norm_(name)] || { signedUp: 0, confirmed: 0, byJobDone: {} };
    const row = [];
    for (let i = 0; i < width; i++) row.push(r[first + i]);
    row[cols[0] - first] = h.signedUp;
    row[cols[1] - first] = h.confirmed;
    row[cols[2] - first] = jobBreakdown_(h.byJobDone);
    return row;
  });
  s.getRange(2, first + 1, block.length, width).setValues(block);
  return block.length;
}

/** The Grade column on a Bell Schedule made before it existed. */
function ensureBellGrade_() {
  const N = SHEETS.BELL;
  if (!ensureColumn_(N, 'Grade')) return false;
  const s = sheet_(N);
  const at = col_(N, 'Grade');
  const data = rows_(N);
  if (data.length) {
    s.getRange(2, at + 1, data.length, 1).setValues(data.map(function (r) {
      return [POD_GRADE_[trim_(r[col_(N, 'Homeroom')])] || ''];
    }));
  }
  clearReadCache_();
  return true;
}

function ensureJobHourColumns_() {
  const N = SHEETS.JOBS;
  const a = ensureColumn_(N, 'Out of Class From');
  const b = ensureColumn_(N, 'Out of Class To');
  if (!a && !b) return false;
  const s = sheet_(N);
  const from = col_(N, 'Out of Class From') + 1;
  const to = col_(N, 'Out of Class To') + 1;
  const data = rows_(N);
  if (data.length) {
    s.getRange(2, from, data.length, 1).setNumberFormat('@');
    s.getRange(2, to, data.length, 1).setNumberFormat('@');
  }
  data.forEach(function (r, i) {
    const hours = JOB_HOURS_[trim_(r[col_(N, 'Job Name')])];
    if (!hours) return;
    if (a) s.getRange(i + 2, from).setValue(hours[0]);
    if (b) s.getRange(i + 2, to).setValue(hours[1]);
  });
  return true;
}

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
  return cached_('teacherInitials', function () {
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
  });
}

/** advisor name (normalised) -> email, from the Teachers sheet. */
function teachersByName_() {
  return cached_('teacherNames', function () {
    const map = {};
    rows_(SHEETS.TEACHERS).forEach(function (r) {
      const name = trim_(r[0]);
      if (name) map[norm_(name)] = { name: name, email: trim_(r[2]) };
    });
    return map;
  });
}

/**
 * The bell schedule, preferring the sheet so hand corrections stick and
 * falling back to Data.gs before setup has run.
 */
function bellSchedule_() {
  return cached_('bell', function () {
    const out = {};
    const add = function (day, pod, split, start, end, what) {
      if (!day || !pod) return;
      if (!out[day]) out[day] = {};
      if (!out[day][pod]) out[day][pod] = [];
      out[day][pod].push({ split: split, start: start, end: end, what: what });
    };
    const sheet = ss_().getSheetByName(SHEETS.BELL);
    if (sheet && sheet.getLastRow() > 1) {
      // By header name, so a column added to the left of these moves
      // nothing that reads them.
      const N = SHEETS.BELL;
      rows_(N).forEach(function (r) {
        add(trim_(r[col_(N, 'Day')]), trim_(r[col_(N, 'Homeroom')]),
          splitLetter_(r[col_(N, 'Split')]), r[col_(N, 'Start')], r[col_(N, 'End')],
          trim_(r[col_(N, 'What / Teacher / Room')]));
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
  });
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
  return cached_('ambassadors', function () {
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
      strength: trim_(cell_(r, N, 'Strength')),
        active: norm_(r[col_(N, 'Active')]) === 'yes'
      };
    }).filter(function (a) { return a.name !== ''; });
  });
}

/** name -> {Job: count}, plus a total, read off the Tour Tracker. */
/**
 * What each ambassador has done, from the Tour Tracker.
 *
 *   signed up   given the job, whether or not the day has happened
 *   confirmed   she has since ticked them as having turned up
 *   total       what fairness counts: everything except a no-show,
 *               so a child she pulled on the day is still first in
 *               line next time rather than being charged for it
 */
function jobHistory_() {
  return cached_('jobHistory', function () {
    const N = SHEETS.TRACKER;
    const hist = {};
    rows_(N).forEach(function (r) {
      const who = norm_(r[col_(N, 'Ambassador')]);
      const job = trim_(r[col_(N, 'Job')]);
      if (!who || !job) return;
      const showed = norm_(cell_(r, N, 'Showed Up'));
      if (!hist[who]) {
        hist[who] = { total: 0, signedUp: 0, confirmed: 0, byJob: {}, byJobDone: {} };
      }
      const h = hist[who];
      h.signedUp += 1;
      h.byJob[job] = (h.byJob[job] || 0) + 1;
      if (showed === 'no') return;
      h.total += 1;
      if (showed === 'yes') {
        h.confirmed += 1;
        h.byJobDone[job] = (h.byJobDone[job] || 0) + 1;
      }
    });
    return hist;
  });
}

/** "2 Tour Guide, 1 Lobby Greeter", commonest first. */
function jobBreakdown_(byJob) {
  return Object.keys(byJob || {}).sort(function (a, b) {
    if (byJob[a] !== byJob[b]) return byJob[b] - byJob[a];
    return a < b ? -1 : 1;
  }).map(function (j) { return byJob[j] + ' ' + j; }).join(', ');
}

/** name -> {Job: true}, read off the Eligibility sheet. Missing row = eligible. */
function eligibility_() {
  return cached_('eligibility', function () {
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
  });
}

function activeJobs_() {
  return cached_('activeJobs', function () {
    const on = {};
    rows_(SHEETS.JOBS).forEach(function (r) {
      if (norm_(r[2]) !== 'no') on[trim_(r[0])] = true;
    });
    return on;
  });
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
/**
 * Which grade each of a visitor's guides comes from, one entry per
 * guide, each entry the grades that will do in order of preference.
 *
 * Most tours are rising 6th graders, so that pair is the one that has
 * to bend: the first place is a 6th grader, and the second is another
 * 6th grader where there is one and an 8th grader where there is not.
 */
const BUILT_IN_GUIDE_GRADES_ = {
  '5': [['6'], ['6']],
  '6': [['6'], ['6', '8']],
  '7': [['6'], ['7']],
  '8': [['7'], ['8']]
};

function guideGradesFor_(applyingForGrade, howMany) {
  const g = gradeNumber_(applyingForGrade);
  const want = howMany || 2;
  const out = [];
  // No grade on the visitor: an empty slot means any grade will do.
  // A blank column is her leaving that rule out, not a reason to send
  // the family round with nobody.
  if (!g) {
    for (let i = 0; i < want; i++) out.push([]);
    return out;
  }
  const n = Number(g);
  const list = gradeList_(settingRaw_('Guide Grades for Rising ' + g));
  const fallback = BUILT_IN_GUIDE_GRADES_[g] || [];
  for (let i = 0; i < want; i++) {
    if (list.length) { out.push(list[Math.min(i, list.length - 1)]); continue; }
    if (fallback.length) { out.push(fallback[Math.min(i, fallback.length - 1)]); continue; }
    // Nothing to go on at all: their own grade and the one above it.
    out.push([String(i === 0 ? Math.max(n - 1, LOWEST_GRADE_) : Math.min(n, HIGHEST_GRADE_))]);
  }
  // Whatever the setting says, never ask for a grade this school does not
  // have. A rising fifth grader is never given a fourth grader.
  return out.map(function (slot) {
    const kept = [];
    slot.forEach(function (x) {
      let v = Number(x);
      if (!v) return;
      if (v < LOWEST_GRADE_) v = LOWEST_GRADE_ + 1;
      if (v > HIGHEST_GRADE_) v = HIGHEST_GRADE_;
      if (kept.indexOf(String(v)) === -1) kept.push(String(v));
    });
    return kept.length ? kept : [String(LOWEST_GRADE_ + 1)];
  });
}

/**
 * Swaps out any grade there is simply nobody in.
 *
 * A setting can ask for a grade the school has no ambassadors in - the
 * default for a rising 6th grader asks for a 5th grader, and there are
 * none. Rather than leave that place empty, it moves up to the nearest
 * grade that does have somebody. So a rising 5th grader gets two 6th
 * graders whatever the setting has been changed to.
 */
/**
 * The same list, with any grade nobody is in swapped for the nearest
 * grade somebody is in. A slot that already names a grade with people
 * in it is left exactly as it is.
 */
function usableGrades_(wanted, pool) {
  const have = {};
  pool.forEach(function (a) { if (a.grade) have[a.grade] = true; });
  if (!Object.keys(have).length) return wanted;
  return wanted.map(function (slot) {
    if (!slot.length) return slot;          // any grade will do
    const kept = slot.filter(function (g) { return have[g]; });
    if (kept.length) return kept;
    const g = slot[0];
    for (let up = Number(g) + 1; up <= HIGHEST_GRADE_; up++) {
      if (have[String(up)]) return [String(up)];
    }
    for (let down = Number(g) - 1; down >= LOWEST_GRADE_; down--) {
      if (have[String(down)]) return [String(down)];
    }
    return slot;
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
/**
 * "6 and 6 or 8" -> [['6'], ['6', '8']].
 *
 * One entry per guide, split on "and". Inside an entry, "or" lists
 * grades that will do, best first: a rising 6th grader wants two 6th
 * graders, and takes an 8th grader for the second place when the 6th
 * grade is used up.
 */
function gradeList_(raw) {
  if (raw instanceof Date) return [];
  return trim_(raw).split(/\band\b|,|;|\+|&/i)
    .map(function (part) {
      return String(part).split(/[^0-9]+/)
        .filter(function (x) { return x !== '' && x.length <= 2; });
    })
    .filter(function (slot) { return slot.length > 0; });
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
      fullPay: isYes_(cell_(r, N, 'Full Pay')),
      wellConnected: isYes_(cell_(r, N, 'Well Connected')),
      borough: trim_(r[col_(N, 'Borough')]).toUpperCase()
    });
  });
  return out;
}

/** The 5th graders available to host, from the Buddies sheet. */
function buddies_() {
  return cached_('buddies', function () {
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
  });
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

/**
 * What is already staffed for this date, so a second run can leave it be.
 *
 * Someone signs up on the Tuesday and only the new visitor needs a pair
 * and a route. Re-planning from scratch would reshuffle everybody, after
 * the routes are printed and the ambassadors have been told.
 */
function staffedAlready_(dateVal) {
  const out = { guides: {}, route: {}, buddy: {}, crew: {}, busy: {}, any: false };
  assignmentsOn_(dateVal).forEach(function (a) {
    out.busy[a.name] = a.job;
    out.any = true;
    const key = norm_(a.visitor);
    if (a.job === JOBS.GUIDE) {
      (out.guides[key] = out.guides[key] || []).push(a.name);
      if (a.route) out.route[key] = a.route;
    } else if (a.job === JOBS.BUDDY) {
      out.buddy[key] = a.name;
    } else {
      (out.crew[a.job] = out.crew[a.job] || []).push(a.name);
    }
  });
  return out;
}

/** The Tour Tracker note for a class visit. */
function buddyHandoff_(p, buddy, handoff, tourEnd) {
  return timeLabelOrRaw_(handoff) + ' - bring ' + p.visitor.name + ' to ' + buddy.name +
    ' in ' + buddy.room + ' (' + buddy.teacher + ', ' + buddy.language + '). Tour guides are ' +
    'finished and can go back to class. ' + buddy.name + ' brings ' + p.visitor.name +
    ' down to the cafeteria at ' + timeLabelOrRaw_(tourEnd) + '.';
}

function planTour(dateStr, keepExisting) {
  clearReadCache_();
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');

  const visitors = prospectiveFor_(dateVal);
  if (!visitors.length) {
    throw new Error('No visiting students listed for ' + longDate_(dateVal) +
      '. Add them to Prospective Students first, with that date in the Tour Date column.');
  }

  // A name typed onto the Ambassadors sheet since the last run gets its
  // Eligibility row now, rather than being quietly left out.
  setupEligibility_();

  const all = ambassadors_();
  const elig = eligibility_();
  const hist = jobHistory_();
  const jobsOn = activeJobs_();
  const pool = all.filter(function (a) { return a.active; });

  // Anything already on the tracker for this date, when she is topping up
  // rather than starting over. Those people keep their jobs and are not
  // free to be given another.
  const kept = keepExisting ? staffedAlready_(dateVal) : null;

  const used = {};                       // name -> job already given on this tour
  if (kept) {
    Object.keys(kept.busy).forEach(function (n) { used[n] = kept.busy[n]; });
  }
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
  if (kept) {
    Object.keys(kept.route).forEach(function (k) {
      const r = kept.route[k];
      routeUse[r] = (routeUse[r] || 0) + 1;
    });
  }

  const byAmbName = {};
  all.forEach(function (a) { byAmbName[norm_(a.name)] = a; });

  // A family marked Full Pay or Well Connected is paired before the
  // others, so the High ambassadors are still there to give them. The
  // list is put back in sheet order afterwards.
  const order = visitors.map(function (v, i) { return { v: v, i: i }; });
  order.sort(function (a, b) {
    const pa = isPriorityVisitor_(a.v) ? 0 : 1;
    const pb = isPriorityVisitor_(b.v) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.i - b.i;
  });

  const pairs = order.map(function (entry) {
    const v = entry.v;
    const wantGrades = usableGrades_(guideGradesFor_(v.grade, perVisitor), pool);
    const needsSoC = needsSoCGuide_(v.race);

    // Already paired on a previous run: left exactly as it is.
    const had = kept && kept.guides[norm_(v.name)];
    if (had && had.length) {
      const asAmb = had.map(function (n) {
        return byAmbName[norm_(n)] || { name: n, grade: '', gender: '', presenting: '' };
      });
      return {
        visitor: v, kept: true, order: entry.i,
        guides: asAmb.map(function (a) {
          return a.name + (a.grade ? ' (grade ' + a.grade + ')' : '');
        }),
        guideNames: asAmb.map(function (a) { return a.name; }),
        wantGrades: wantGrades, needsSoC: needsSoC,
        guideMix: traitMix_(asAmb.map(function (a) { return a.name; }), pool, 'presenting'),
        guideRead: asAmb.map(guideRead_).join('  |  '),
        priority: priorityWhy_(v),
        strengths: asAmb.map(function (a) {
          return a.name + ' (' + (trim_(a.strength) || 'no strength set') + ')';
        }).join(', '),
        weakGuide: false,
        route: kept.route[norm_(v.name)] || '', routeShared: false,
        socMet: needsSoC ? asAmb.filter(function (a) {
          return isStudentOfColor_(a.presenting);
        }).map(function (a) { return a.name; }).join(' and ') : '',
        genderMet: v.gender ? asAmb.filter(function (a) {
          return norm_(a.gender) === norm_(v.gender);
        }).map(function (a) { return a.name; }).join(' and ') : '',
        socShortfall: false, genderShortfall: false,
        short: Math.max(0, perVisitor - asAmb.length), why: ''
      };
    }
    // Each guide comes from its own grade, so the places are filled one
    // at a time rather than taken off a single ranked list.
    const chosen = [];
    const missing = [];
    // Every grade this pair will accept anywhere, for the case where a
    // place would otherwise go empty. One guide from the year below
    // beats one guide and a gap.
    const anyGrade = [];
    wantGrades.forEach(function (slot) {
      slot.forEach(function (g) { if (anyGrade.indexOf(g) === -1) anyGrade.push(g); });
    });

    wantGrades.forEach(function (wantGrade, slot) {
      const freeIn = function (grades) {
        return pool.filter(function (a) {
          if (used[a.name] || !canDo(a, JOBS.GUIDE)) return false;
          if (!a.grade || !a.gender) return false;
          if (v.grade && grades.indexOf(a.grade) === -1) return false;
          // Kept apart means not in the same pair. Two of them may both
          // guide, as long as they are walking different families.
          if (chosen.some(function (x) { return keptApart_(a.name, x.name); })) return false;
          return true;
        });
      };
      // A slot may name more than one grade, best first: a rising 6th
      // grader takes a 6th grader while there is one and an 8th grader
      // after that. Only if the whole slot is empty does it widen to
      // what the other place would have taken.
      let candidates = [];
      for (let i = 0; i < wantGrade.length && !candidates.length; i++) {
        candidates = freeIn([wantGrade[i]]);
      }
      if (!candidates.length) candidates = freeIn(anyGrade);

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
      const haveSoC = chosen.some(function (x) { return isStudentOfColor_(x.presenting); });
      const owedGender = !!v.gender &&
        !chosen.some(function (x) { return norm_(x.gender) === norm_(v.gender); });
      const owedSoC = needsSoC && !haveSoC;
      const owedCount = (owedGender ? 1 : 0) + (owedSoC ? 1 : 0);
      const settles = function (a) {
        return (owedGender && norm_(a.gender) === norm_(v.gender) ? 1 : 0) +
               (owedSoC && isStudentOfColor_(a.presenting) ? 1 : 0);
      };
      // A pair should not be two students of color. Once one is on it, the
      // other place goes to somebody who is not, unless that would leave it
      // empty.
      const avoid = function (a) { return haveSoC && isStudentOfColor_(a.presenting); };

      // A family she especially wants: High first, Medium fine, and no
      // Low unless there is nobody else who fits at all.
      const priority = isPriorityVisitor_(v);
      const tooWeak = function (a) { return priority && strengthRank_(a.strength) === 1; };

      // Best available, relaxing only as far as it has to.
      const narrow = function (list, test) {
        const kept = list.filter(test);
        return kept.length ? kept : list;
      };
      // Best case first: somebody who settles everything still owed and
      // breaks nothing.
      candidates = narrow(candidates, function (a) {
        return settles(a) === owedCount && !avoid(a) && !tooWeak(a);
      });
      // Then gender, which is not negotiable. A girl is never given two
      // boys while any girl is free, even if taking her means a second
      // student of color or a Low on the pair.
      candidates = narrow(candidates, function (a) {
        return !owedGender || norm_(a.gender) === norm_(v.gender);
      });
      candidates = narrow(candidates, function (a) { return !avoid(a) && !tooWeak(a); });
      candidates = narrow(candidates, function (a) { return !tooWeak(a); });
      candidates = narrow(candidates, function (a) { return !avoid(a); });

      candidates.sort(function (a, b) {
        if (owedGender) {
          const ga = norm_(a.gender) === norm_(v.gender) ? 0 : 1;
          const gb = norm_(b.gender) === norm_(v.gender) ? 0 : 1;
          if (ga !== gb) return ga - gb;
        }
        if (owedCount) {
          const sa = settles(a), sb = settles(b);
          if (sa !== sb) return sb - sa;
        }
        const aa = avoid(a) ? 1 : 0, ab = avoid(b) ? 1 : 0;
        if (aa !== ab) return aa - ab;
        if (priority) {
          const ra = strengthRank_(a.strength), rb = strengthRank_(b.strength);
          if (ra !== rb) return rb - ra;
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

    // Routes go out in order, up to Max Families Per Route each. Once
    // every route has had its share the list starts again at route 1
    // rather than leaving somebody without one - two families on the
    // same route is better than a blank where the route should be.
    let route = '';
    let routeShared = false;
    for (let cap = maxPerRoute; !route && cap <= maxPerRoute * (visitors.length + 1);
         cap += maxPerRoute) {
      for (let i = 0; i < routes.length; i++) {
        if ((routeUse[routes[i]] || 0) < cap) {
          route = routes[i];
          routeShared = cap > maxPerRoute;
          routeUse[route] = (routeUse[route] || 0) + 1;
          break;
        }
      }
    }

    return {
      visitor: v,
      order: entry.i,
      guides: chosen.map(function (a) {
        return a.name + ' (grade ' + a.grade + ')';
      }),
      guideNames: chosen.map(function (a) { return a.name; }),
      wantGrades: wantGrades,
      needsSoC: needsSoC,
      guideMix: traitMix_(chosen.map(function (a) { return a.name; }), pool, 'presenting'),
      guideRead: chosen.map(guideRead_).join('  |  '),
      priority: priorityWhy_(v),
      strengths: chosen.map(function (a) {
        return a.name + ' (' + (trim_(a.strength) || 'no strength set') + ')';
      }).join(', '),
      weakGuide: isPriorityVisitor_(v) &&
        chosen.some(function (a) { return strengthRank_(a.strength) === 1; }),
      route: route,
      routeShared: routeShared,
      socMet: needsSoC ? chosen.filter(function (a) {
        return isStudentOfColor_(a.presenting);
      }).map(function (a) { return a.name; }).join(' and ') : '',
      socShortfall: needsSoC && chosen.length > 0 &&
        !chosen.some(function (a) { return isStudentOfColor_(a.presenting); }),
      genderMet: v.gender ? chosen.filter(function (a) {
        return norm_(a.gender) === norm_(v.gender);
      }).map(function (a) { return a.name; }).join(' and ') : '',
      genderShortfall: !!v.gender && chosen.length > 0 &&
        !chosen.some(function (a) { return norm_(a.gender) === norm_(v.gender); }),
      short: Math.max(0, perVisitor - chosen.length),
      anyGrade: !v.grade,
      why: missing.length
        ? guideMissReason_(v, missing, pool, used, canDo, all.length,
            chosen.map(function (a) { return a.name; }))
        : ''
    };
  });

  // Back into the order she typed them in, whatever order they were
  // paired in.
  pairs.sort(function (a, b) { return a.order - b.order; });

  /* ---- 5th grade class visits ---- */
  const buddyPool = buddies_().filter(function (b) { return b.canHost; });
  const buddyUsed = {};
  const handoff = setting_('Class Visit Handoff Time', '9:06');
  const tourEnd = setting_('Tour End Time', '9:25');

  if (kept) {
    Object.keys(kept.buddy).forEach(function (k) { buddyUsed[kept.buddy[k]] = true; });
  }

  pairs.forEach(function (p) {
    const want = classVisitLanguage_(p.visitor.classVisit);
    if (!want) return;
    const hadBuddy = kept && kept.buddy[norm_(p.visitor.name)];
    if (hadBuddy) {
      const b = buddyPool.filter(function (x) { return norm_(x.name) === norm_(hadBuddy); })[0];
      if (b) {
        p.buddy = b;
        p.buddyKept = true;
        p.handoff = buddyHandoff_(p, b, handoff, tourEnd);
        return;
      }
    }
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
    p.handoff = buddyHandoff_(p, pick, handoff, tourEnd);
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
    const available = pool.filter(function (a) {
      return !used[a.name] && canDo(a, job) && !apartClash_(a.name, job, used);
    }).sort(fairness);
    // Whoever is on this crew already stays on it, and only the gap is filled.
    const picked = ((kept && kept.crew[job]) || []).map(function (n) {
      return byAmbName[norm_(n)] || { name: n, grade: '', gender: '', presenting: '' };
    });
    const keptCount = picked.length;
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
      // The ones already on this crew count too, not only people who
      // were given the job earlier in the run.
      if (picked.some(function (x) { return keptApart_(x.name, best.name); })) {
        const i = available.indexOf(best);
        if (i !== -1) available.splice(i, 1);
        continue;
      }
      picked.push(best);
    }
    const chosen = picked.map(function (a) { return a.name; });
    chosen.forEach(function (n) { used[n] = job; });
    const added = chosen.slice(keptCount);
    let why = '';
    if (chosen.length < count) {
      if (!all.length) why = 'the Ambassadors sheet is empty';
      else if (!pool.length) why = 'nobody is marked Active - put Yes in the Active column';
      else why = 'everyone eligible is already on another job';
    }
    return {
      job: job, chosen: chosen, needed: count, added: added, keptCount: keptCount,
      short: Math.max(0, count - chosen.length), why: why,
      mix: genderMix_(chosen, pool),
      raceMix: traitMix_(chosen, pool, 'presenting')
    };
  };
  const greeters = [
    crew(JOBS.LOBBY, Number(setting_('Lobby Greeters Needed', '3')) || 3),
    crew(JOBS.TABLE, Number(setting_('Table Greeters Needed', '2')) || 2)
  ];

  /* ---- who is left, for the panel ----
   *
   * The panel is hers to pick, so this only offers the people who are
   * free to be picked. Anyone already saved as a panelist for this date
   * is in the list too, ticked, so the list is what the panel is rather
   * than what is left over.
   */
  const onPanel = {};
  assignmentsOn_(dateVal).forEach(function (a) {
    if (a.job === JOBS.PANELIST) onPanel[norm_(a.name)] = true;
  });
  const free = pool.filter(function (a) {
    if (onPanel[norm_(a.name)]) return true;
    return !used[a.name] && canDo(a, JOBS.PANELIST);
  }).sort(fairness).map(function (a) {
    const h = hist[norm_(a.name)] || { total: 0 };
    return {
      name: a.name, grade: a.grade, tours: h.total,
      onPanel: !!onPanel[norm_(a.name)],
      yellow: norm_(a.light) === 'yellow'
    };
  });

  const everyone = [];
  pairs.forEach(function (p) { p.guideNames.forEach(function (g) { everyone.push(g); }); });
  greeters.forEach(function (c) { c.chosen.forEach(function (n) { everyone.push(n); }); });

  // Anyone on a yellow light who has ended up with a job.
  const byName = {};
  all.forEach(function (a) { byName[norm_(a.name)] = a; });
  const needConfirm = [];
  // Only the ones this run is adding. She approved the rest already.
  pairs.forEach(function (p) {
    if (p.kept) return;
    p.guideNames.forEach(function (g) {
      const a = byName[norm_(g)];
      if (a && norm_(a.light) === 'yellow') {
        needConfirm.push({ name: g, job: JOBS.GUIDE, withWhom: p.visitor.name });
      }
    });
  });
  greeters.forEach(function (c) {
    (c.added || c.chosen).forEach(function (n) {
      const a = byName[norm_(n)];
      if (a && norm_(a.light) === 'yellow') needConfirm.push({ name: n, job: c.job, withWhom: '' });
    });
  });

  return {
    date: dateKey_(dateVal),
    dateLabel: longDate_(dateVal),
    keptAnything: !!(kept && kept.any),
    newPairs: pairs.filter(function (p) { return !p.kept; }).length,
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
 * Whether this visitor is a student of color, and so should have one
 * guide who is too.
 *
 * Read exactly as the ambassadors' column is: anything filled in that is
 * not white presenting. SOC, POC, African American, Asian and the
 * spelled-out forms all count; WP, W and White do not; blank is unknown
 * and carries no requirement.
 */
function needsSoCGuide_(visitorRace) {
  return isStudentOfColor_(visitorRace);
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
function guideMissReason_(v, missing, pool, used, canDo, total, withWhom) {
  withWhom = withWhom || [];
  if (!total) return 'the Ambassadors sheet is empty';
  if (!pool.length) return 'no ambassador is marked Active - put Yes in the Active column';
  const parts = missing.map(function (slot) {
    const grades = [].concat(slot);
    if (!grades.length) return 'nobody eligible is free';
    const label = 'grade ' + grades.join(' or ');
    const inGrade = pool.filter(function (a) { return grades.indexOf(a.grade) !== -1; });
    if (!inGrade.length) return 'no ' + label + ' ambassador on the sheet at all';
    const free = inGrade.filter(function (a) { return !used[a.name] && canDo(a, JOBS.GUIDE); });
    if (!free.length) return 'every ' + label + ' ambassador is already assigned';
    const allClash = withWhom.length && free.every(function (a) {
      return withWhom.some(function (n) { return keptApart_(a.name, n); });
    });
    if (allClash) {
      return 'every ' + label + ' ambassador left is kept apart from ' + withWhom.join(' and ');
    }

    const noDetails = free.filter(function (a) { return !a.grade || !a.gender; }).length;
    if (noDetails) return noDetails + ' ' + label + ' ambassador(s) have no Gender filled in';
    return 'no ' + label + ' ambassador available';
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
  const slots = wantGrades && wantGrades.length ? wantGrades : [[v.grade]];
  const want = [];
  slots.forEach(function (slot) {
    [].concat(slot).forEach(function (g) { if (want.indexOf(g) === -1) want.push(g); });
  });
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

  // A blank Race cell reads as neither, so that ambassador can never
  // satisfy the student of color rule and never trips the two-of-them
  // rule either. Worth saying out loud, because it looks like nothing.
  const noRace = active.filter(function (a) { return !a.presenting; });
  if (noRace.length) {
    w.push(noRace.length + ' active ambassador(s) have nothing in Race (Presenting), so ' +
      'they count as neither: ' + noRace.slice(0, 8).map(function (a) { return a.name; }).join(', ') +
      (noRace.length > 8 ? ' and ' + (noRace.length - 8) + ' more' : '') + '.');
  }

  // Two columns with the same heading: the script reads the first, she
  // types in the other, and the values never arrive.
  const twice = duplicateHeaders_(SHEETS.AMBASSADORS);
  if (twice.length) {
    w.push('The Ambassadors sheet has two columns headed ' + twice.join(', ') +
      '. Only the leftmost is read, so anything typed in the other is ignored. ' +
      'Delete or rename the spare.');
  }

  const apart = keepApart_();
  if (apart.unknown.length) {
    w.push('Keep Apart names nobody on the Ambassadors sheet: ' +
      apart.unknown.join(', ') + '. Those pairs are being ignored - check the spelling.');
  }
  if (apart.ambiguous.length) {
    w.push('Keep Apart says ' + apart.ambiguous.join(', ') +
      ', and more than one ambassador goes by that name. Write the full name, or ' +
      'those pairs are ignored.');
  }

  const buddyNoGender = buddies_().filter(function (b) { return b.canHost && !b.gender; }).length;
  if (buddyNoGender && visitors.some(function (v) { return classVisitLanguage_(v.classVisit); })) {
    w.push(buddyNoGender + ' of the 5th graders who can host have no Gender on the ' +
      '5th Grade Buddies sheet, so a visiting girl cannot be matched with a girl.');
  }

  const noTeacherEmail = rows_(SHEETS.TEACHERS).filter(function (r) {
    return trim_(r[0]) && !trim_(r[2]);
  }).length;
  if (noTeacherEmail) w.push(noTeacherEmail + ' teacher(s) have no email address on the Teachers sheet.');

  const SUGGESTED_ = { '5': '6 and 6', '6': '6 and 6', '7': '6 and 7', '8': '7 and 8' };
  const spoiled = [];
  ['5', '6', '7', '8'].forEach(function (g) {
    if (settingRaw_('Guide Grades for Rising ' + g) instanceof Date) spoiled.push(g);
  });
  if (spoiled.length) {
    w.push('Google Sheets has turned ' + (spoiled.length === 1 ? 'one of the "Guide Grades" ' +
      'settings' : 'the "Guide Grades" settings') + ' into a date, because "6, 7" reads to ' +
      'it as the 7th of June. Nothing is broken - those tours are still being paired ' +
      'correctly - but to put it right: select column B on Settings, Format > Number > ' +
      'Plain text, then retype ' +
      spoiled.map(function (g) {
        return 'Rising ' + g + ' as "' + SUGGESTED_[g] + '"';
      }).join(', ') + '.');
  }

  // A slot that would go unfilled because the school has nobody in the
  // grades it asks for. A slot naming several grades is only a problem
  // when every one of them is empty, and a slot naming none at all - a
  // visitor with no Grade on file - asks for nothing in particular.
  const needed = {};
  visitors.forEach(function (v) {
    usableGrades_(guideGradesFor_(v.grade, 2), active).forEach(function (slot) {
      const grades = [].concat(slot).filter(Boolean);
      if (!grades.length) return;
      if (grades.some(function (g) {
        return active.some(function (a) { return a.grade === g; });
      })) return;
      needed[grades.join(' or ')] = true;
    });
  });
  Object.keys(needed).sort().forEach(function (label) {
    w.push('No grade ' + label + ' ambassador is on the sheet, and a visitor this week ' +
      'needs one. Put one on the Ambassadors sheet, or change "Guide Grades for ' +
      'Rising ..." on Settings.');
  });

  // Nothing here about a visitor with no Grade, Gender, Race or Borough.
  // A blank column is her leaving that rule out on purpose, and the
  // staffing dialog already says so on the visitor's own row.
  return w;
}

/** Writes a plan to the Tour Tracker and back onto Prospective Students. */
function commitTour(dateStr, keepExisting, panelists) {
  const plan = planTour(dateStr, keepExisting);
  clearReadCache_();               // the tracker is about to change
  const dateVal = toDate_(plan.date);
  const N = SHEETS.TRACKER;
  const tracker = sheet_(N);

  // Starting this date over: clear out what the command put there before.
  // Panelists are hers, put in by hand, so they are never touched - and
  // when she is topping up, nothing is cleared at all.
  if (!keepExisting) {
    const mine = {};
    [JOBS.GUIDE, JOBS.BUDDY, JOBS.LOBBY, JOBS.TABLE].forEach(function (j) { mine[j] = true; });
    const existing = rows_(N);
    for (let i = existing.length - 1; i >= 0; i--) {
      if (!sameDay_(toDate_(existing[i][col_(N, 'Tour Date')]), dateVal)) continue;
      if (!mine[trim_(existing[i][col_(N, 'Job')])]) continue;
      tracker.deleteRow(i + 2);
    }
  }

  // A row already on the tracker is never written twice.
  const seenRow = {};
  rows_(N).forEach(function (r) {
    if (!sameDay_(toDate_(r[col_(N, 'Tour Date')]), dateVal)) return;
    seenRow[norm_(r[col_(N, 'Ambassador')]) + '|' + norm_(r[col_(N, 'Job')]) + '|' +
      norm_(r[col_(N, 'Prospective Student(s)')])] = true;
  });
  const fresh = function (row) {
    const key = norm_(row[col_(N, 'Ambassador')]) + '|' + norm_(row[col_(N, 'Job')]) + '|' +
      norm_(row[col_(N, 'Prospective Student(s)')]);
    if (seenRow[key]) return false;
    seenRow[key] = true;
    return true;
  };

  const out = [];
  plan.pairs.forEach(function (p) {
    (p.guideNames || p.guides).forEach(function (g) {
      const row = blankRow_(N);
      row[col_(N, 'Tour Date')] = dateVal;
      row[col_(N, 'Ambassador')] = g;
      row[col_(N, 'Job')] = JOBS.GUIDE;
      row[col_(N, 'Prospective Student(s)')] = p.visitor.name;
      row[col_(N, 'Route')] = p.route;
      if (fresh(row)) out.push(row);
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
    if (fresh(row)) out.push(row);
  });
  plan.greeters.forEach(function (c) {
    c.chosen.forEach(function (n) {
      const row = blankRow_(N);
      row[col_(N, 'Tour Date')] = dateVal;
      row[col_(N, 'Ambassador')] = n;
      row[col_(N, 'Job')] = c.job;
      if (fresh(row)) out.push(row);
    });
  });
  if (out.length) {
    tracker.getRange(tracker.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);
    tracker.getRange(2, col_(N, 'Tour Date') + 1, tracker.getLastRow() - 1, 1)
      .setNumberFormat('yyyy-mm-dd');
  }

  const panel = savePanel_(dateVal, panelists, plan);
  refreshCounts_();

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

  return { written: out.length, panel: panel, plan: plan };
}

/**
 * The panel she ticked, written to the tracker.
 *
 * She picks the panel herself, so this only records it - but recording
 * it is what puts those ambassadors in the Tuesday and Wednesday
 * emails along with everybody else, which is the whole point.
 *
 * Only the names she was offered are hers to take off again. Anyone
 * typed straight onto the tracker who is not on the Ambassadors sheet
 * is left alone, because the dialog never showed them.
 */
function savePanel_(dateVal, names, plan) {
  if (!names) return null;
  const N = SHEETS.TRACKER;
  const tracker = sheet_(N);
  const want = {};
  (names || []).forEach(function (n) { if (trim_(n)) want[norm_(n)] = trim_(n); });

  const offered = {};
  (plan.free || []).forEach(function (f) { offered[norm_(f.name)] = true; });

  let removed = 0;
  const have = {};
  const existing = rows_(N);
  for (let i = existing.length - 1; i >= 0; i--) {
    const r = existing[i];
    if (!sameDay_(toDate_(r[col_(N, 'Tour Date')]), dateVal)) continue;
    if (trim_(r[col_(N, 'Job')]) !== JOBS.PANELIST) continue;
    const who = norm_(r[col_(N, 'Ambassador')]);
    if (want[who]) { have[who] = true; continue; }
    if (!offered[who]) continue;          // never offered, so not hers to lose
    tracker.deleteRow(i + 2);
    removed++;
  }

  const add = [];
  Object.keys(want).forEach(function (k) {
    if (have[k]) return;
    const row = blankRow_(N);
    row[col_(N, 'Tour Date')] = dateVal;
    row[col_(N, 'Ambassador')] = want[k];
    row[col_(N, 'Job')] = JOBS.PANELIST;
    add.push(row);
  });
  if (add.length) {
    tracker.getRange(tracker.getLastRow() + 1, 1, add.length, add[0].length).setValues(add);
    tracker.getRange(2, col_(N, 'Tour Date') + 1, tracker.getLastRow() - 1, 1)
      .setNumberFormat('yyyy-mm-dd');
  }
  return { added: add.length, removed: removed, total: Object.keys(want).length };
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
/**
 * Who walks the visitor to class, and who is finished.
 *
 * Both guides come out of the same period, so if that period is the
 * same class for both they simply take the visitor in together. Where
 * they are in different classes only one can, so one takes the visitor
 * and the other goes back alone.
 */
function handbackPlan_(page, dateVal) {
  const names = page.guides.map(function (g) { return g.replace(/\s*\(.*$/, ''); });
  if (names.length < 2) return { takers: names, others: [] };

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
    return { takers: names, others: [] };
  }
  return { takers: [names[0]], others: names.slice(1) };
}

/**
 * The last thing on one guide's sheet, written to that guide.
 *
 * Short sentences, one instruction each, and it always ends by saying
 * they are done - the question a 12 year old holding this actually has.
 */
function handbackFor_(page, name, dateVal) {
  const endsAt = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));
  const wait = setting_('Wait For', 'Maren');
  const plan = handbackPlan_(page, dateVal);
  const takes = plan.takers.indexOf(name) !== -1;
  if (takes) {
    const withWhom = plan.takers.filter(function (n) { return n !== name; });
    return (withWhom.length ? 'You and ' + withWhom.join(' and ') + ' take ' : 'Take ') +
      page.visitor.name + ' to class with you. At ' + endsAt + ' walk them down to the ' +
      'cafeteria and wait there with them until ' + wait + ' comes back. Then you are done.';
  }
  return plan.takers.join(' and ') + ' is taking ' + page.visitor.name +
    ' to class. Go back to your own class. You are done.';
}

/** The guides' line on a sheet that ends in a 5th grade class visit. */
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
  const wait = setting_('Wait For', 'Maren');
  const endsAt = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));
  return 'Introduce yourself to ' + page.visitor.name + ' and tell them what you are ' +
    'working on. At ' + endsAt + ' take them down to the cafeteria and wait with them ' +
    'until ' + wait + ' gets back.';
}

/**
 * A bold paragraph.
 *
 * A Document paragraph has no setBold of its own - bold lives on the
 * text inside it, which editAsText() reaches.
 */
function appendBold_(body, text) {
  const p = body.appendParagraph(text);
  p.editAsText().setBold(true);
  return p;
}

/** One line on a route sheet, double spaced so it can be read while walking. */
function say_(body, text, bold) {
  const p = body.appendParagraph(text);
  p.setLineSpacing(2);
  if (bold) p.editAsText().setBold(true);
  return p;
}

/**
 * A printable sheet for every guide, in route order.
 *
 * Each guide gets their own copy of their own route, so the stack comes
 * off the printer route 1, route 1, route 2, route 2 and can be handed
 * out without sorting. The sheet is addressed to that one guide and
 * tells them, in order, only what they have to do.
 */
function routeSheetPages_(dateVal) {
  const out = [];
  routeSheetData_(dateVal).forEach(function (page) {
    const names = page.guides.map(function (g) { return g.replace(/\s*\(.*$/, ''); });
    if (!names.length) {
      out.push({ page: page, guide: '', others: [] });
      return;
    }
    names.forEach(function (n) {
      out.push({
        page: page, guide: n,
        others: names.filter(function (x) { return x !== n; })
      });
    });
  });
  // Route order, then by visitor, so the two copies of a route sit together.
  out.sort(function (a, b) {
    const ra = Number(a.page.routeNo) || 999;
    const rb = Number(b.page.routeNo) || 999;
    if (ra !== rb) return ra - rb;
    if (a.page.visitor.name !== b.page.visitor.name) {
      return a.page.visitor.name < b.page.visitor.name ? -1 : 1;
    }
    return a.guide < b.guide ? -1 : 1;
  });
  return out;
}

function buildRouteSheets(dateStr) {
  clearReadCache_();
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const sheets = routeSheetPages_(dateVal);
  if (!sheets.length) {
    throw new Error('No visiting students listed for ' + longDate_(dateVal) + '.');
  }

  const handoffAt = timeLabelOrRaw_(setting_('Class Visit Handoff Time', '9:06'));
  const reportAt = timeLabelOrRaw_(setting_('Ambassadors Report At', '8:25 AM'));
  const reportTo = setting_('Ambassadors Report To', 'the cafeteria');
  const title = 'Tour Routes - ' + longDate_(dateVal);
  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.clear();

  sheets.forEach(function (sheet, i) {
    const page = sheet.page;
    if (i > 0) body.appendPageBreak();

    body.appendParagraph(sheet.guide ? sheet.guide.toUpperCase() : page.visitor.name.toUpperCase())
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);

    say_(body, 'Route ' + (page.routeNo || '-') +
      (page.direction ? ' (' + page.direction + ')' : '') + '   -   ' + longDate_(dateVal));

    const about = [];
    if (page.visitor.school) about.push('from ' + page.visitor.school);
    if (page.visitor.grade) about.push('applying for grade ' + page.visitor.grade);
    say_(body, 'You are taking: ' + page.visitor.name +
      (about.length ? ' (' + about.join(', ') + ')' : ''), true);
    if (sheet.others.length) {
      say_(body, 'With you: ' + sheet.others.join(' and '));
    } else if (!sheet.guide) {
      say_(body, 'No tour guide has been assigned yet.', true);
    }
    say_(body, 'Be in ' + reportTo + ' at ' + reportAt + '.');
    if (page.buddy) {
      say_(body, 'Class visit at the end: ' + page.buddyName + ' - ' +
        page.buddy.language + ' with ' + page.buddy.teacher + ' in ' + page.buddy.room + '.');
    }

    say_(body, 'YOUR WALK', true);

    // The walk itself. The last two lines of every route are about
    // handing the visitor back, which the sheet says in its own words
    // below, to this guide rather than to both of them.
    const closing = /Bring visitors to class|Bring visitor down to cafeteria/;
    page.lines.forEach(function (line) {
      if (closing.test(line)) return;
      say_(body, line);
    });

    if (page.buddy) {
      say_(body, handoffAt + '   ' + handoffForGuides_(page), true);
        say_(body, 'FOR ' + page.buddyName.toUpperCase(), true);
      say_(body, handoffForBuddy_(page));
    } else if (sheet.guide) {
      say_(body, handoffAt + '   ' + handbackFor_(page, sheet.guide, dateVal), true);
    }
  });

  doc.saveAndClose();
  return { url: doc.getUrl(), name: title, pages: sheets.length };
}

/* =========================================================
 * Locker slips
 *
 * What the student email says, on paper: one slip per ambassador, to
 * go on lockers the afternoon before. They come out as a Google Doc,
 * several to a page, each slip in its own bordered box so the page
 * cuts into strips.
 *
 * The date is always written out in full. A slip that said "tomorrow"
 * would be wrong the moment it outlived the day it was printed, and
 * these sit on a locker overnight.
 *
 * The 5th grade class-visit buddies are not included, the same as the
 * emails - they hear about it in person, and their instructions are
 * already printed on the visitor's route sheet.
 * ========================================================= */

function lockerSlipData_(dateVal) {
  const assignments = assignmentsOn_(dateVal);
  const amb = {};
  ambassadors_().forEach(function (a) { amb[norm_(a.name)] = a; });

  const grouped = {};
  assignments.forEach(function (a) {
    if (a.job === JOBS.BUDDY) return;
    (grouped[a.name] = grouped[a.name] || []).push(a);
  });

  return Object.keys(grouped).sort().map(function (name) {
    const who = amb[norm_(name)];
    return {
      name: name,
      // Homeroom and advisor go on the slip because that is how a pile
      // of them gets sorted before it reaches the lockers.
      where: who ? [who.pod, who.advisor].filter(Boolean).join(' - ') : '',
      jobs: grouped[name].map(function (j) {
        // Same as the email: the route is on the sheet they are handed.
        return j.job + (j.visitor ? ' for ' + j.visitor : '');
      })
    };
  });
}

function buildLockerSlips(dateStr) {
  clearReadCache_();
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const slips = lockerSlipData_(dateVal);
  if (!slips.length) {
    throw new Error('Nothing is staffed for ' + longDate_(dateVal) +
      ' yet. Run "Staff This Wednesday Tour..." first.');
  }

  // Five lines, because it is read in a corridor on the way past.
  const reportTo = setting_('Ambassadors Report To', 'the cafeteria')
    .replace(/^the\s+/i, '');
  const reportAt = timeLabelOrRaw_(setting_('Ambassadors Report At', '8:25 AM'));
  const endTime = timeLabelOrRaw_(setting_('Tour End Time', '9:25'));

  const title = 'Locker Slips - ' + longDate_(dateVal);
  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.clear();

  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Print and cut along the boxes.');

  slips.forEach(function (slip) {
    const cell = body.appendTable([['']]).getCell(0, 0);
    cell.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10).setPaddingRight(10);

    const head = cell.getChild(0).asParagraph();
    head.setText(slip.name.toUpperCase() + (slip.where ? '   (' + slip.where + ')' : ''));
    head.editAsText().setBold(true);

    cell.appendParagraph(longDate_(dateVal));
    slip.jobs.forEach(function (j) { cell.appendParagraph(j); });
    cell.appendParagraph(capitalize_(reportTo) + ' ' + reportAt + '. Back in class by ' +
      endTime + '.');

    body.appendParagraph('');
  });

  doc.saveAndClose();
  return { url: doc.getUrl(), name: title, slips: slips.length };
}

/* =========================================================
 * Confirming a tour, afterwards
 *
 * Being given a job and turning up are not the same thing. She pulls
 * children on the day, tours get cancelled, and the count that matters
 * at the end of the year is the one she has ticked off herself.
 *
 * So the Tour Tracker carries a Showed Up column, and the Ambassadors
 * sheet carries both numbers: Signed Up, which is what to look at
 * before a tour, and Confirmed, which is what counts after it.
 * ========================================================= */

function confirmList_(dateVal) {
  const N = SHEETS.TRACKER;
  const out = [];
  rows_(N).forEach(function (r, i) {
    if (!sameDay_(toDate_(r[col_(N, 'Tour Date')]), dateVal)) return;
    const name = trim_(r[col_(N, 'Ambassador')]);
    if (!name) return;
    out.push({
      row: i + 2,
      name: name,
      job: trim_(r[col_(N, 'Job')]),
      visitor: trim_(r[col_(N, 'Prospective Student(s)')]),
      showed: trim_(cell_(r, N, 'Showed Up'))
    });
  });
  out.sort(function (a, b) {
    if (a.job !== b.job) return a.job < b.job ? -1 : 1;
    return a.name < b.name ? -1 : 1;
  });
  return out;
}

function api_loadConfirm(dateStr) {
  clearReadCache_();
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const rows = confirmList_(dateVal);
  if (!rows.length) {
    throw new Error('Nothing was staffed for ' + longDate_(dateVal) + '.');
  }
  return {
    date: dateKey_(dateVal),
    dateLabel: longDate_(dateVal),
    rows: rows,
    // Nothing ticked off yet means this is the first time through, and
    // everybody starts ticked. After that her own answers come back.
    fresh: !rows.some(function (r) { return r.showed; })
  };
}

/**
 * Writes the answers back, in one pass over the column.
 *
 * Anyone she did not tick is a No rather than a blank, so "not yet
 * confirmed" and "did not turn up" stay different things.
 */
function api_saveConfirm(dateStr, showedRows, happened) {
  clearReadCache_();
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const N = SHEETS.TRACKER;
  const s = sheet_(N);
  const at = optionalCol_(N, 'Showed Up');
  if (at === -1) {
    throw new Error('The Tour Tracker has no "Showed Up" column. Run First-Time Setup once.');
  }
  const yes = {};
  (showedRows || []).forEach(function (r) { yes[Number(r)] = true; });

  const data = rows_(N);
  const column = data.map(function (r) { return [r[at]]; });
  let showed = 0;
  let missed = 0;
  confirmList_(dateVal).forEach(function (r) {
    const ok = happened !== false && yes[r.row] === true;
    column[r.row - 2] = [ok ? 'Yes' : 'No'];
    if (ok) showed++; else missed++;
  });
  s.getRange(2, at + 1, column.length, 1).setValues(column);
  clearReadCache_();
  refreshCounts_();
  return { showed: showed, missed: missed, date: longDate_(dateVal), happened: happened !== false };
}

/* =========================================================
 * Writing an email to whoever she chooses
 *
 * Not the automatic reminders: this is her, at her desk, wanting to
 * write to six teachers or to one family. She picks the people, types
 * what she wants to say, and gets a Gmail draft to open, read and send
 * herself. Nothing here ever sends on its own.
 * ========================================================= */

const AUDIENCES_ = {
  teachers: 'Teachers',
  students: 'Ambassadors',
  both: 'Ambassadors and their parents',
  parents: 'Parents only'
};

/**
 * Who she can pick from, for one audience.
 *
 * A parents-only list is still labelled by the child, because that is
 * who she knows them by - the addresses underneath are the parents'.
 */
function emailPeople_(kind) {
  const out = [];
  if (kind === 'teachers') {
    const N = SHEETS.TEACHERS;
    rows_(N).forEach(function (r, i) {
      const name = trim_(r[col_(N, 'Teacher Name')]);
      const email = trim_(r[col_(N, 'Teacher Email')]);
      if (!name) return;
      out.push({
        id: 't' + i, label: name, sub: email || 'no email on the Teachers sheet',
        emails: email ? [email] : []
      });
    });
    return out;
  }

  const N = SHEETS.AMBASSADORS;
  rows_(N).forEach(function (r, i) {
    const name = fullName_(r[col_(N, 'First Name')], r[col_(N, 'Last Name')]);
    if (!name) return;
    const student = trim_(r[col_(N, 'Student Email')]);
    const parents = [
      trim_(cell_(r, N, 'Parent 1 Email')),
      trim_(cell_(r, N, 'Parent 2 Email'))
    ].filter(Boolean);
    const parentNames = [
      trim_(cell_(r, N, 'Parent 1 Name')),
      trim_(cell_(r, N, 'Parent 2 Name'))
    ].filter(Boolean);

    let emails = [];
    let sub = '';
    if (kind === 'students') {
      emails = student ? [student] : [];
      sub = student || 'no student email';
    } else if (kind === 'parents') {
      emails = parents;
      sub = parents.length
        ? (parentNames.length ? parentNames.join(', ') + ' - ' : '') + parents.join(', ')
        : 'no parent email';
    } else {
      emails = (student ? [student] : []).concat(parents);
      sub = emails.length ? emails.join(', ') : 'no addresses';
    }
    out.push({
      id: 'a' + i, label: name, sub: sub, emails: emails,
      grade: trim_(r[col_(N, 'Grade')]),
      active: norm_(r[col_(N, 'Active')]) === 'yes'
    });
  });
  return out;
}

function api_emailPeople(kind) {
  clearReadCache_();
  if (!AUDIENCES_[kind]) throw new Error('Pick who the email is going to first.');
  const people = emailPeople_(kind);
  if (!people.length) throw new Error('Nobody is on that sheet yet.');
  return { kind: kind, label: AUDIENCES_[kind], people: people };
}

/**
 * Opens Gmail with the message already in it.
 *
 * This deliberately touches no mail-reading service. The moment one is
 * named anywhere in this file, Apps Script asks for access to her whole
 * mailbox and refuses to run anything at all until she grants it - and
 * a school account may not be allowed to. A compose link is only a URL:
 * it opens a compose window with the addresses, the subject and the
 * text already in it, and she sends it from there.
 *
 * Long address lists outgrow what a URL can carry, so the addresses
 * come back as text to copy as well, and the dialog says which to use.
 */
function api_composeEmail(kind, ids, subject, body, useBcc) {
  clearReadCache_();
  if (!AUDIENCES_[kind]) throw new Error('Pick who the email is going to first.');
  if (!trim_(subject)) throw new Error('Give the email a subject first.');
  const want = {};
  (ids || []).forEach(function (id) { want[id] = true; });

  const chosen = emailPeople_(kind).filter(function (p) { return want[p.id]; });
  if (!chosen.length) throw new Error('Tick at least one person.');

  const to = [];
  const noAddress = [];
  chosen.forEach(function (p) {
    if (!p.emails.length) { noAddress.push(p.label); return; }
    p.emails.forEach(function (e) { if (to.indexOf(e) === -1) to.push(e); });
  });
  if (!to.length) {
    throw new Error('None of the people you ticked have an email address on the sheet.');
  }

  const list = to.join(', ');
  const text = String(body == null ? '' : body);
  const url = 'https://mail.google.com/mail/?view=cm&fs=1' +
    (useBcc === false ? '&to=' : '&bcc=') + encodeURIComponent(to.join(',')) +
    '&su=' + encodeURIComponent(trim_(subject)) +
    '&body=' + encodeURIComponent(text);

  return {
    url: url,
    // A URL much over 2000 characters is refused by the browser, so a
    // long list is copied across by hand instead.
    tooLong: url.length > 1900,
    addresses: to.length, people: chosen.length, list: list,
    bcc: useBcc !== false, noAddress: noAddress
  };
}

/* =========================================================
 * The roster
 *
 * One line per ambassador on duty: their name, what they are doing,
 * whose class they walk out of and who their advisor is. It goes out
 * with the emails, so the office has on paper what the emails only say
 * one person at a time.
 * ========================================================= */

function tourRoster_(dateVal) {
  const amb = {};
  ambassadors_().forEach(function (a) { amb[norm_(a.name)] = a; });
  const fallbackFrom = toMinutes_(setting_('Tour Start Time', '8:30'));
  const fallbackTo = toMinutes_(setting_('Tour End Time', '9:25'));

  const grouped = {};
  assignmentsOn_(dateVal).forEach(function (a) {
    // The 5th grade buddies are told in person, so they are not on here.
    if (a.job === JOBS.BUDDY) return;
    (grouped[a.name] = grouped[a.name] || []).push(a);
  });

  return Object.keys(grouped).sort().map(function (name) {
    const jobs = grouped[name];
    const who = amb[norm_(name)];
    const role = jobs.map(function (j) {
      return j.job + (j.visitor ? ' for ' + j.visitor : '') +
        (j.route ? ' (route ' + j.route + ')' : '');
    }).join('; ');

    let teacher = '';
    if (who && (who.pod || who.split)) {
      const win = awayMinutes_(jobs.map(function (j) { return j.job; })) ||
        { from: fallbackFrom, to: fallbackTo };
      const seen = {};
      const names = [];
      classesMissed_(who.pod, who.split, who.grade, dateVal, win.from, win.to)
        .forEach(function (b) {
          if (b.needsYou) { names.push(b.what + ' (needs you)'); return; }
          b.teachers.forEach(function (t) {
            if (seen[norm_(t.name)]) return;
            seen[norm_(t.name)] = true;
            names.push(t.name);
          });
          b.unresolved.forEach(function (i) { names.push(i + ' (no email on file)'); });
        });
      teacher = names.join(', ');
    }

    return {
      name: name,
      role: role,
      teacher: teacher,
      advisor: who ? who.advisor : ''
    };
  });
}

function buildTourRoster(dateStr) {
  clearReadCache_();
  const dateVal = dateStr instanceof Date ? dateStr : toDate_(dateStr);
  if (!dateVal) throw new Error('Pick a tour date first.');
  const rows = tourRoster_(dateVal);
  if (!rows.length) throw new Error('Nothing is staffed for ' + longDate_(dateVal) + ' yet.');

  const title = 'Tour Roster - ' + longDate_(dateVal);
  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.clear();
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(rows.length + ' ambassadors on duty.');

  const table = [['Student', 'Role', 'Class teacher', 'Advisor']];
  rows.forEach(function (r) {
    table.push([r.name, r.role, r.teacher, r.advisor]);
  });
  body.appendTable(table);

  doc.saveAndClose();
  return { url: doc.getUrl(), name: title, rows: rows.length };
}

/**
 * The roster, mailed to whoever is running this.
 *
 * It goes with every send - the manual button, test or real, and the
 * automatic teacher send on Tuesday and Wednesday morning - so there is
 * always a copy of who was doing what that day.
 */
function mailTourRoster_(dateVal) {
  let r = null;
  try {
    r = buildTourRoster(dateVal);
  } catch (err) {
    return null;
  }
  const to = previewAddress_();
  if (!to) return r;
  const html = '<div style="' + MAIL_STYLE_ + '">' +
    '<p>Who is on duty ' + escapeHtml_(longDate_(dateVal)) + ', with the teacher whose ' +
    'class they leave and their advisor:</p>' +
    '<p><a href="' + r.url + '">' + escapeHtml_(r.name) + '</a></p></div>';
  MailApp.sendEmail({
    to: to,
    subject: r.name,
    htmlBody: html,
    name: setting_('Sender Display Name', 'LREI Middle School Tours')
  });
  return r;
}

/* =========================================================
 * Emails
 *
 * Teachers and advisors hear twice: Tuesday 8:30am and Wednesday 7:45am.
 * Students hear twice: Tuesday noon and Wednesday 7:45am. The same
 * wording serves all of them, so it never says a flat
 * "today" - it works that out from the day it is actually sent.
 * ========================================================= */

/**
 * The day a test run is pretending it is, so she can read the Tuesday
 * wording and the Wednesday wording without waiting for either.
 */
let PRETEND_TODAY_ = null;

function whenLabel_(tourDate) {
  const today = PRETEND_TODAY_ ? new Date(PRETEND_TODAY_.getTime()) : new Date();
  today.setHours(0, 0, 0, 0);
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

/* ---------- test copies ----------
 *
 * A test run sends every message to her instead of to the school, with
 * the address it would really have gone to printed at the top. Nothing
 * else about the message changes, so what she reads is what they would
 * have read. It works through mailOptions_, which every message passes
 * through, so no send can get past it by accident.
 */
let PREVIEW_TO_ = '';
let TEST_LABEL_ = '';

/**
 * While testing, one copy per kind rather than one per person.
 *
 * She is reading these to check the wording, and thirty of the same
 * message buries the one thing that differs. Everything else about the
 * run is unchanged - who would be skipped for want of an address is
 * still worked out for all of them, and still reported.
 */
let SAMPLE_SEEN_ = null;

function sampleAllows_(kind) {
  if (!SAMPLE_SEEN_) return true;
  if (SAMPLE_SEEN_[kind]) return false;
  SAMPLE_SEEN_[kind] = true;
  return true;
}

/** Where test copies go: the Settings address if there is one, else whoever is running this. */
function previewAddress_() {
  const set = setting_('Preview Email To', '');
  if (set) return set;
  return Session.getEffectiveUser().getEmail();
}

/** Runs fn with every send redirected to one address. */
function asTest_(address, fn) {
  PREVIEW_TO_ = trim_(address);
  try {
    return fn();
  } finally {
    PREVIEW_TO_ = '';
  }
}

function mailOptions_(to, subject, html) {
  if (PREVIEW_TO_) {
    html = '<div style="' + MAIL_STYLE_ + 'background:#fbf0ee;border:1px solid #a8322a;' +
      'padding:8px 10px;margin-bottom:14px;"><b>Test copy' +
      (TEST_LABEL_ ? ' of the ' + escapeHtml_(TEST_LABEL_) + ' send' : '') +
      '.</b> The real one goes to ' + escapeHtml_(to) + '.</div>' + html;
    subject = '[TEST' + (TEST_LABEL_ ? ' - ' + TEST_LABEL_ : '') + '] ' + subject;
    to = PREVIEW_TO_;
  }
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
  clearReadCache_();
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
  const hours = jobHours_();

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
    // Back in class when their own last job ends, not when the tour does.
    let backAt = null;
    jobs.forEach(function (j) {
      const h = hours[norm_(j.job)];
      const m = h ? toMinutes_(h.to) : null;
      if (m != null && (backAt === null || m > backAt)) backAt = m;
    });
    const backBy = backAt === null ? timeLabelOrRaw_(endTime) : timeLabel_(backAt);

    // No route number here. They are given their route on paper on the
    // morning, and a number in an email the day before only confuses them.
    const items = jobs.map(function (j) {
      let line = escapeHtml_(j.job);
      if (j.visitor) line += ' for ' + escapeHtml_(j.visitor);
      return '<li>' + line + '</li>';
    }).join('');

    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(name.split(' ')[0]) + ',</p>' +
      '<p>You are on the tour schedule for ' + escapeHtml_(when.body) + ':</p>' +
      '<ul>' + items + '</ul>' +
      '<p><b>Please come to ' + escapeHtml_(reportTo) + ' at ' + escapeHtml_(reportAt) + '.</b></p>' +
      '<p>You will be back in class by ' + escapeHtml_(backBy) + '. ' +
      'Your teachers already know you are out.</p>' +
      '<p>Thank you for doing this.<br>' +
      escapeHtml_(setting_('Sender Display Name', 'LREI Middle School Tours')) + '</p></div>';

    if (!sampleAllows_('student:' + jobs.map(function (j) { return j.job; }).sort().join('+'))) return;
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
  clearReadCache_();
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
    // Which class they miss depends on how long their own job keeps them
    // out. A panelist is back at 9:05 and should not be reported absent
    // from a period that starts after that.
    const win = awayMinutes_(jobs.map(function (j) { return j.job; })) ||
      { from: startMin, to: endMin };
    const blocks = classesMissed_(who.pod, who.split, who.grade, dateVal, win.from, win.to);
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
          // What the teacher is owed is when their student is gone, which
          // is the job's own window - a greeter is back before the bell.
          away: awayWindow_(jobs.map(function (j) { return j.job; })) ||
            (b.start + ' - ' + b.end),
          guiding: guiding
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
    if (!sampleAllows_('advisor')) return;
    MailApp.sendEmail(mailOptions_(email, 'Advisee on Tour Duty - ' + when.subject, html));
    advisorsSent++;
  });

  let teachersSent = 0;
  Object.keys(byTeacher).forEach(function (email) {
    const e = byTeacher[email];
    const anyGuiding = e.rows.some(function (r) { return r.guiding; });
    const body = e.rows.map(function (r) {
      return '<tr><td style="' + TD_ + '">' + escapeHtml_(r.student) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.away) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.what) + '</td>' +
        '<td style="' + TD_ + '">' + escapeHtml_(r.job) + '</td></tr>';
    }).join('');
    const html = '<div style="' + MAIL_STYLE_ + '">' +
      '<p>Hi ' + escapeHtml_(e.name) + ',</p>' +
      '<p>The student(s) below will be out of your class ' + escapeHtml_(when.body) +
      ' for a Middle School tour:</p>' +
      '<table style="' + TABLE_STYLE_ + '">' +
      '<tr><th style="' + TH_ + '">Student</th><th style="' + TH_ + '">Out of class</th>' +
      '<th style="' + TH_ + '">Class</th><th style="' + TH_ + '">Tour job</th></tr>' +
      body + '</table>' +
      (anyGuiding
        ? '<p>The tour guides bring their visiting student back to class with them ' +
          'before the end of the period, so please expect a visitor as well.</p>'
        : '') +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p></div>';
    if (!sampleAllows_('class teacher')) return;
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
    if (!sampleAllows_('host teacher')) return;
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
function sendTeacherEmailsForNextTour() {
  const r = sendTeacherEmails(null);
  const on = nextTourDate_();
  // Once a send day, with the round that knows about teachers and advisors.
  if (on) r.roster = mailTourRoster_(on);
  return r;
}

/* =========================================================
 * Automatic sends
 * ========================================================= */

const REMINDER_SLOTS_ = [
  { handler: HANDLER_TEACHER_EMAILS, day: 'TUESDAY', hour: 8, minute: 30, label: 'Teachers, Tuesday 8:30 AM' },
  { handler: HANDLER_TEACHER_EMAILS, day: 'WEDNESDAY', hour: 7, minute: 45, label: 'Teachers, Wednesday 7:45 AM' },
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
    'A tour with nothing staffed is skipped, so staff it before Tuesday morning.');
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
    .addItem('Print Locker Slips...', 'showLockerSlipDialog')
    .addItem('Confirm a Tour Afterwards...', 'showConfirmDialog')
    .addSeparator()
    .addItem('Write an Email...', 'showWriteDialog')
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
  '.panel{display:flex;flex-wrap:wrap;gap:4px 14px;margin:8px 0;}' +
  '.panel label{display:flex;align-items:center;gap:6px;font-weight:normal;margin:0;' +
  'width:calc(50% - 14px);cursor:pointer;}' +
  '.panel input{width:15px;height:15px;cursor:pointer;}' +
  'label.opt{display:flex;align-items:flex-start;gap:8px;font-weight:normal;' +
  'margin:12px 0 0;cursor:pointer;line-height:1.45;}' +
  'label.opt input{width:16px;height:16px;margin-top:1px;flex:none;cursor:pointer;}' +
  'label.opt b{font-weight:bold;}' +
  'select{font:inherit;padding:6px;border:1px solid #bbb;border-radius:4px;}' +
  'textarea{font-family:inherit;}' +
  '.panel .yel{color:#8a5a12;font-size:11px;}' +
  '.muted{color:#777;}';

function showStaffDialog() {
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Staff this Wednesday tour</h2>' +
    '<p class="sub">Pairs each visiting student with two guides and a route, then picks the greeters. ' +
    'Panelists are left for you.</p>' +
    '<label for="d">Tour date</label>' +
    '<input type="date" id="d" value="' + nextWednesday() + '">' +
    '<label class="opt"><input type="checkbox" id="keep" checked>' +
    '<span><b>Keep what is already assigned.</b> Only students with no guides yet are ' +
    'staffed, for someone who signed up late. Untick to start this date over.' +
    '</span></label>' +
    '<div style="margin-top:12px;">' +
    '<button id="preview" onclick="doPreview()">Preview</button>' +
    '<button id="save" class="ghost" onclick="doSave()" disabled>Save to Tour Tracker</button>' +
    '</div><div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function busy(b){document.getElementById("preview").disabled=b;}' +
    'function doPreview(){busy(true);document.getElementById("out").innerHTML="<p class=\'muted\'>Working...</p>";' +
    'google.script.run.withSuccessHandler(render).withFailureHandler(fail)' +
    '.api_planTour(document.getElementById("d").value,' +
    'document.getElementById("keep").checked);}' +
    'function fail(e){busy(false);document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";}' +
    'function render(p){busy(false);' +
    'var h="<div class=\'out\'><h3>"+esc(p.dateLabel)+"</h3><table><tr><th>Visiting student</th>' +
    '<th>Guides</th><th>Route</th></tr>";' +
    'if(p.keptAnything){h+="<p class=\'muted\'>"+(p.newPairs?p.newPairs+" student(s) staffed now; ":' +
    '"nothing new to staff; ")+"everything else is left exactly as it was.</p>";}' +
    'p.pairs.forEach(function(x){h+="<tr><td>"+esc(x.visitor.name)+' +
    '(x.visitor.grade?" <span class=\'muted\'>grade "+esc(x.visitor.grade)+"</span>":"")+' +
    '(x.visitor.race?" <span class=\'muted\'>"+esc(x.visitor.race)+"</span>":"")+' +
    '(x.priority?" <b class=\'yel\'>"+esc(x.priority)+"</b>":"")+' +
    '(x.visitor.school?" <span class=\'muted\'><br>("+esc(x.visitor.school)+")</span>":"")+"</td><td>"+' +
    '(x.guides.length?esc(x.guides.join(", ")):"<b>none found</b>")+' +
    '(x.anyGrade?"<br><span class=\'muted\'>no grade on this visitor, so any grade was ' +
    'used</span>":(x.wantGrades&&x.wantGrades.length?"<br><span class=\'muted\'>looking for ' +
    'grade "+esc(x.wantGrades.map(function(g){return [].concat(g).join(" or ");}).join(" + "))+' +
    '"</span>":""))+' +
    '(x.guideRead?"<br><span class=\'muted\'>"+esc(x.guideRead)+"</span>":"")+' +
    '(x.priority&&x.strengths?"<br><span class=\'muted\'>"+esc(x.strengths)+"</span>":"")+' +
    '(x.weakGuide?"<br><b>a Low ambassador was the only one who fit</b>":"")+' +
    '(x.buddy?"<br><span class=\'muted\'>class visit: "+esc(x.buddy.name)+' +
    '(x.buddy.gender?" ("+esc(x.buddy.gender)+")":"")+" - "+esc(x.buddy.language)+' +
    '", "+esc(x.buddy.teacher)+", "+esc(x.buddy.room)+"</span>":"")+' +
    '(x.buddyGenderMiss?"<br><span class=\'muted\'>no "+esc(x.visitor.gender)+' +
    '" was free in that class, so this is the closest fit</span>":"")+' +
    '(x.buddyGenderUnknown?"<br><span class=\'muted\'>no Gender on file for that 5th grader</span>":"")+' +
    '(x.buddyProblem?"<br><b>class visit not assigned - "+esc(x.buddyProblem)+"</b>":"")+' +
    '(x.socMet?"<br><span class=\'muted\'>student of color on the pair: "+esc(x.socMet)+' +
    '"</span>":"")+' +
    '(x.socShortfall?"<br><b>needs a student of color, and none was free</b>":"")+' +
    '(x.genderMet?"<br><span class=\'muted\'>same gender as the visitor: "+esc(x.genderMet)+' +
    '"</span>":"")+' +
    '(x.genderShortfall?"<br><b>nobody of the visitor\'s own gender was free</b>":"")+' +
    '(x.short?" <span class=\'muted\'>short "+x.short+(x.why?" - "+esc(x.why):"")+"</span>":"")+' +
    '(x.kept?"<br><span class=\'muted\'>already assigned - left alone</span>":"")+' +
    '"</td><td>"+esc(x.route||"-")+' +
    '(x.routeShared?"<br><span class=\'muted\'>shared - every route was already ' +
    'taken</span>":"")+"</td></tr>";});' +
    'h+="</table>";' +
    'p.greeters.forEach(function(c){h+="<h3>"+esc(c.job)+" ("+c.chosen.length+" of "+c.needed+")"+' +
    '(c.keptCount?" <span class=\'muted\'>"+c.keptCount+" already assigned</span>":"")+"</h3><div>"+' +
    '(c.chosen.length?esc(c.chosen.join(", ")):"<b>none available</b>")+' +
    '(c.mix?" <span class=\'muted\'>("+esc(c.mix)+")</span>":"")+' +
    '(c.raceMix?"<br><span class=\'muted\'>"+esc(c.raceMix)+"</span>":"")+' +
    '(c.why?" <span class=\'muted\'>- "+esc(c.why)+"</span>":"")+"</div>";});' +
    'if(p.overallMix){h+="<h3>Everyone assigned ("+p.assignedCount+")</h3><div class=\'muted\'>"+' +
    'esc(p.overallMix)+(p.overallRaceMix?"<br>"+esc(p.overallRaceMix):"")+"</div>";}' +
    'h+="</div>";' +
    'if(p.free.length){window.__free=p.free;' +
    'h+="<div class=\'free\'><b>Your panel - tick who you want</b>' +
    '<div class=\'panel\'>"+p.free.map(function(f,i){' +
    'return "<label><input type=\'checkbox\' class=\'pan\' value=\'"+i+"\'"+' +
    '(f.onPanel?" checked":"")+"> "+esc(f.name)+" <span class=\'muted\'>"+(f.grade?"gr "+' +
    'esc(f.grade)+", ":"")+(f.tours||0)+"</span>"+(f.yellow?" <b class=\'yel\'>check ' +
    'first</b>":"")+"</label>";}).join("")+"</div>"+' +
    '"<span class=\'muted\'>The number is how many jobs they have done, fewest first. ' +
    'Whoever is ticked when you save is put on the Tour Tracker, so they get the same ' +
    'emails as everybody else.</span></div>";}' +
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
    '" row(s) written to the Tour Tracker, and the routes and guides filled in on ' +
    'Prospective Students."+(r.panel?"<br>Panel: "+r.panel.total+" ambassador(s)"+' +
    '(r.panel.added?", "+r.panel.added+" added":"")+(r.panel.removed?", "+r.panel.removed+' +
    '" taken off":"")+".":"")+"</div>";})' +
    '.withFailureHandler(fail).api_commitTour(document.getElementById("d").value,' +
    'document.getElementById("keep").checked,panelPicked());}' +
    'function panelPicked(){var out=[];var f=window.__free||[];' +
    'var boxes=document.querySelectorAll("input.pan");' +
    'for(var i=0;i<boxes.length;i++){if(boxes[i].checked){' +
    'var k=Number(boxes[i].value);if(f[k]){out.push(f[k].name);}}}' +
    'return out;}' +
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
    '<label class="opt"><input type="checkbox" id="test" checked>' +
    '<span><b>Test.</b> Nothing goes to students or teachers. One copy of each kind ' +
    'comes to you instead - one per job, one advisor, one class teacher - for the ' +
    'Tuesday send and the Wednesday send, so you can read each as it will arrive.' +
    '</span></label>' +
    '<div style="margin-top:12px;">' +
    '<button onclick="go(\'students\')">Send to students</button>' +
    '<button onclick="go(\'teachers\')">Send to teachers and advisors</button>' +
    '</div><div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function go(which){document.getElementById("out").innerHTML="<p class=\'muted\'>Sending...</p>";' +
    'google.script.run.withSuccessHandler(done).withFailureHandler(function(e){' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";})' +
    '.api_sendEmails(which,document.getElementById("d").value,' +
    'document.getElementById("test").checked);}' +
    'function done(r){var h="<div class=\'free\'>";' +
    'if(r.testTo){h+="<b>Test only.</b> Everything below went to "+esc(r.testTo)+' +
    '" and nowhere else"+(r.testDays&&r.testDays.length>1?", once for each send: "+' +
    'esc(r.testDays.join(" and ")):"")+". One of each kind, not one per person.<br>";}' +
    'if(r.note){h+=esc(r.note);}else{' +
    'if(r.sent!=null){h+="<b>"+r.sent+"</b> student email(s) sent for "+esc(r.date)+".";}' +
    'else{h+="<b>"+r.advisorsSent+"</b> advisor email(s), <b>"+r.teachersSent+' +
    '"</b> class-teacher email(s)"+(r.hostsSent?" and <b>"+r.hostsSent+"</b> host-teacher email(s)":"")+' +
    '" sent for "+esc(r.date)+".";}}' +
    'h+="</div>";' +
    'if(r.skipped&&r.skipped.length){h+="<div class=\'warn\'><b>No Student Email on file, so not sent:</b><br>"+' +
    'esc(r.skipped.join(", "))+"</div>";}' +
    'if(r.roster){h+="<div class=\'free\'><b>Who is on duty</b><br><a href=\'"+r.roster.url+' +
    '"\' target=\'_blank\'>"+esc(r.roster.name)+"</a> - "+r.roster.rows+' +
    '" ambassador(s), with their teacher and advisor. A copy is in your inbox.</div>";}' +
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
    '<p class="sub">One page per tour guide, in route order - route 1, route 1, route 2, ' +
    'route 2 - so the stack comes off the printer ready to hand out. Opens as a Google ' +
    'Doc you can edit before printing.</p>' +
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
    '" sheet(s) ready, one per guide.</b><br><a href=\'"+r.url+"\' target=\'_blank\'>Open "+esc(r.name)+' +
    '"</a><br><span class=\'muted\'>It is in your Drive. File &rsaquo; Print when you are happy with it.</span></div>";})' +
    '.withFailureHandler(function(e){document.getElementById("go").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";})' +
    '.api_buildRouteSheets(document.getElementById("d").value);}' +
    '<\/script>';
  dialog_(html, 'Print Tour Routes', 600, 460);
}

function showWriteDialog() {
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Write an email</h2>' +
    '<p class="sub">Pick who it goes to, type it, and it opens in Gmail with everything ' +
    'filled in for you to read over and send. Nothing is sent from here.</p>' +
    '<label for="kind">Who it goes to</label>' +
    '<select id="kind" onchange="load()">' +
    '<option value="">Choose...</option>' +
    '<option value="teachers">Teachers</option>' +
    '<option value="students">Ambassadors</option>' +
    '<option value="both">Ambassadors and their parents</option>' +
    '<option value="parents">Parents only</option>' +
    '</select>' +
    '<div id="who"></div>' +
    '<div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function fail(e){document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";}' +
    'function load(){var k=document.getElementById("kind").value;' +
    'document.getElementById("out").innerHTML="";' +
    'if(!k){document.getElementById("who").innerHTML="";return;}' +
    'document.getElementById("who").innerHTML="<p class=\'muted\'>Loading...</p>";' +
    'google.script.run.withSuccessHandler(show).withFailureHandler(fail).api_emailPeople(k);}' +
    'function show(p){window.__kind=p.kind;' +
    'var h="<label>"+esc(p.label)+" <span class=\'muted\'>("+p.people.length+")</span></label>";' +
    'h+="<div style=\'margin-bottom:6px;\'><button class=\'ghost\' onclick=\'all(true)\'>Tick all</button>' +
    '<button class=\'ghost\' onclick=\'all(false)\'>Untick all</button>' +
    '<button class=\'ghost\' onclick=\'onlyActive()\'>Active only</button></div>";' +
    'h+="<div class=\'panel\' style=\'max-height:220px;overflow:auto;\'>";' +
    'p.people.forEach(function(x){' +
    'h+="<label><input type=\'checkbox\' class=\'who\' value=\'"+esc(x.id)+"\'"+' +
    '(x.active===false?" data-idle=\'1\'":"")+"> "+esc(x.label)+' +
    '"<span class=\'muted\'> "+esc(x.sub)+"</span></label>";});' +
    'h+="</div>";' +
    'h+="<label for=\'subj\'>Subject</label><input id=\'subj\' type=\'text\' ' +
    'style=\'width:100%;font:inherit;padding:6px;border:1px solid #bbb;border-radius:4px;\'>";' +
    'h+="<label for=\'body\'>Message</label><textarea id=\'body\' rows=\'8\' ' +
    'style=\'width:100%;font:inherit;padding:6px;border:1px solid #bbb;border-radius:4px;\'></textarea>";' +
    'h+="<label class=\'opt\'><input type=\'checkbox\' id=\'bcc\' checked><span>' +
    '<b>Everyone in Bcc.</b> They cannot see each other\'s addresses. Untick to put them ' +
    'all in the To line.</span></label>";' +
    'h+="<div style=\'margin-top:12px;\'><button onclick=\'make()\'>Open it in Gmail</button></div>";' +
    'document.getElementById("who").innerHTML=h;}' +
    'function all(on){var b=document.querySelectorAll("input.who");' +
    'for(var i=0;i<b.length;i++){b[i].checked=on;}}' +
    'function onlyActive(){var b=document.querySelectorAll("input.who");' +
    'for(var i=0;i<b.length;i++){b[i].checked=!b[i].getAttribute("data-idle");}}' +
    'function make(){var ids=[],b=document.querySelectorAll("input.who");' +
    'for(var i=0;i<b.length;i++){if(b[i].checked){ids.push(b[i].value);}}' +
    'document.getElementById("out").innerHTML="<p class=\'muted\'>Getting it ready...</p>";' +
    'google.script.run.withSuccessHandler(function(r){' +
    'var h="<div class=\'free\'><b>Ready.</b> "+r.people+" person/people, "+' +
    'r.addresses+" address(es), in "+(r.bcc?"Bcc":"To")+".";' +
    'if(!r.tooLong){h+="<br><a href=\'"+r.url+"\' target=\'_blank\'>Open it in Gmail</a>' +
    '<br><span class=\'muted\'>It opens with everything filled in. Read it over and ' +
    'send it yourself.</span>";}' +
    'else{h+="<br><span class=\'muted\'>Too many addresses to carry in a link, so copy ' +
    'them across:</span>";}' +
    'h+="<br><br><b>The addresses</b><br><textarea rows=\'3\' readonly ' +
    'style=\'width:100%;font:inherit;padding:6px;\' onclick=\'this.select()\'>"+' +
    'esc(r.list)+"</textarea></div>";' +
    'if(r.noAddress&&r.noAddress.length){h+="<div class=\'warn\'><b>No address on file, ' +
    'so left out:</b><br>"+esc(r.noAddress.join(", "))+"</div>";}' +
    'document.getElementById("out").innerHTML=h;}).withFailureHandler(fail)' +
    '.api_composeEmail(window.__kind,ids,document.getElementById("subj").value,' +
    'document.getElementById("body").value,document.getElementById("bcc").checked);}' +
    '<\/script>';
  dialog_(html, 'Write an Email', 640, 680);
}

function showConfirmDialog() {
  const next = nextTourDate_();
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Confirm a tour afterwards</h2>' +
    '<p class="sub">Tick whoever turned up and did their job. Anyone left unticked is ' +
    'recorded as not having worked, so their count stays where it was.</p>' +
    '<label for="d">Tour date</label>' +
    '<input type="date" id="d" value="' + (next ? dateKey_(next) : nextWednesday()) + '">' +
    '<div style="margin-top:12px;"><button id="load" onclick="load()">Load that tour</button></div>' +
    '<div id="out"></div>' +
    '<script>' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}' +
    'function load(){document.getElementById("load").disabled=true;' +
    'document.getElementById("out").innerHTML="<p class=\'muted\'>Loading...</p>";' +
    'google.script.run.withSuccessHandler(show).withFailureHandler(fail)' +
    '.api_loadConfirm(document.getElementById("d").value);}' +
    'function fail(e){document.getElementById("load").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";}' +
    'function show(p){document.getElementById("load").disabled=false;window.__rows=p.rows;' +
    'var h="<div class=\'out\'><h3>"+esc(p.dateLabel)+"</h3><div class=\'panel\'>";' +
    'p.rows.forEach(function(r,i){' +
    'var on=p.fresh?true:r.showed!=="No";' +
    'h+="<label><input type=\'checkbox\' class=\'did\' value=\'"+i+"\'"+(on?" checked":"")+"> "+' +
    'esc(r.name)+" <span class=\'muted\'>"+esc(r.job)+(r.visitor?" - "+esc(r.visitor):"")+' +
    '"</span></label>";});' +
    'h+="</div></div>";' +
    'h+="<label class=\'opt\'><input type=\'checkbox\' id=\'cancelled\'>' +
    '<span><b>The tour did not happen.</b> Everyone is recorded as not having worked, ' +
    'whatever is ticked above.</span></label>";' +
    'h+="<div style=\'margin-top:12px;\'><button onclick=\'save()\'>Save</button>' +
    '<button class=\'ghost\' onclick=\'all(true)\'>Tick all</button>' +
    '<button class=\'ghost\' onclick=\'all(false)\'>Untick all</button></div>";' +
    'document.getElementById("out").innerHTML=h;}' +
    'function all(on){var b=document.querySelectorAll("input.did");' +
    'for(var i=0;i<b.length;i++){b[i].checked=on;}}' +
    'function save(){var out=[],b=document.querySelectorAll("input.did");' +
    'for(var i=0;i<b.length;i++){if(b[i].checked){out.push(window.__rows[Number(b[i].value)].row);}}' +
    'document.getElementById("out").innerHTML="<p class=\'muted\'>Saving...</p>";' +
    'google.script.run.withSuccessHandler(function(r){' +
    'document.getElementById("out").innerHTML="<div class=\'free\'><b>Saved.</b> "+' +
    '(r.happened?r.showed+" worked, "+r.missed+" did not.":"Tour recorded as not having ' +
    'happened - "+r.missed+" row(s) marked.")+"<br>The counts on the Ambassadors sheet ' +
    'are up to date.</div>";}).withFailureHandler(fail)' +
    '.api_saveConfirm(document.getElementById("d").value,out,' +
    '!document.getElementById("cancelled").checked);}' +
    '<\/script>';
  dialog_(html, 'Confirm a Tour', 620, 620);
}

function showLockerSlipDialog() {
  const next = nextTourDate_();
  const html =
    '<style>' + DIALOG_CSS_ + '</style>' +
    '<h2>Print locker slips</h2>' +
    '<p class="sub">One slip per ambassador, saying what their email says. Opens as a ' +
    'Google Doc - print it, then cut along the boxes. The 5th grade class-visit buddies ' +
    'are not included; you tell them in person.</p>' +
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
    'document.getElementById("out").innerHTML="<div class=\'free\'><b>"+r.slips+' +
    '" slip(s) ready.</b><br><a href=\'"+r.url+"\' target=\'_blank\'>Open "+esc(r.name)+' +
    '"</a><br><span class=\'muted\'>It is in your Drive. File &rsaquo; Print, then cut.</span></div>";})' +
    '.withFailureHandler(function(e){document.getElementById("go").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+"</b></div>";})' +
    '.api_buildLockerSlips(document.getElementById("d").value);}' +
    '<\/script>';
  dialog_(html, 'Print Locker Slips', 600, 460);
}

function api_buildLockerSlips(dateStr) { return buildLockerSlips(dateStr); }
function api_buildRouteSheets(dateStr) { return buildRouteSheets(dateStr); }
function api_planTour(dateStr, keep) { return planTour(dateStr, keep); }
function api_commitTour(dateStr, keep, panelists) {
  return commitTour(dateStr, keep, panelists);
}
/**
 * One test click gives her every version that will really go out.
 *
 * The same message is sent on two days and reads differently on each -
 * "tomorrow" on the Tuesday, "today" on the Wednesday - so a test that
 * only showed one of them would not be a test of what happens.
 */
/**
 * Which day each send goes out, as a date in the tour's own week.
 *
 * The day number comes from here rather than from ScriptApp.WeekDay,
 * whose values are enum objects and never equal to what getDay()
 * returns - comparing the two is always false, and the search for the
 * day walks backwards for ever.
 */
const WEEKDAY_NUMBER_ = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6
};

function sendDaysFor_(handler, dateVal) {
  const days = [];
  REMINDER_SLOTS_.forEach(function (slot) {
    if (slot.handler !== handler) return;
    const want = WEEKDAY_NUMBER_[slot.day];
    if (want === undefined) return;
    // The nearest such weekday on or before the tour.
    const d = new Date(dateVal.getTime());
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7 && d.getDay() !== want; i++) {
      d.setDate(d.getDate() - 1);
    }
    if (d.getDay() !== want) return;
    days.push({ when: d, label: slot.label });
  });
  days.sort(function (a, b) { return a.when - b.when; });
  return days;
}

function api_sendEmails(which, dateStr, test) {
  const students = which === 'students';
  const run = function () {
    return students ? sendStudentEmails(dateStr) : sendTeacherEmails(dateStr);
  };
  if (!test) {
    const r = run();
    const on = dateStr ? toDate_(dateStr) : nextTourDate_();
    if (on) r.roster = mailTourRoster_(on);
    return r;
  }

  const to = previewAddress_();
  if (!to) throw new Error('Could not work out your email address to send the test to.');
  const dateVal = dateStr ? toDate_(dateStr) : nextTourDate_();
  const days = dateVal
    ? sendDaysFor_(students ? HANDLER_STUDENT_EMAILS : HANDLER_TEACHER_EMAILS, dateVal)
    : [];
  if (!days.length) days.push({ when: null, label: '' });

  let out = null;
  days.forEach(function (day) {
    PRETEND_TODAY_ = day.when;
    TEST_LABEL_ = day.label;
    SAMPLE_SEEN_ = {};                 // one of each per day, not one per person
    try {
      const r = asTest_(to, run);
      if (!out) {
        out = r;
      } else {
        ['sent', 'advisorsSent', 'teachersSent', 'hostsSent'].forEach(function (k) {
          if (typeof r[k] === 'number') out[k] = (out[k] || 0) + r[k];
        });
      }
    } finally {
      PRETEND_TODAY_ = null;
      TEST_LABEL_ = '';
      SAMPLE_SEEN_ = null;
    }
  });
  out.testTo = to;
  out.testDays = days.map(function (d) { return d.label; }).filter(Boolean);
  out.sampled = true;
  if (dateVal) out.roster = mailTourRoster_(dateVal);
  return out;
}
