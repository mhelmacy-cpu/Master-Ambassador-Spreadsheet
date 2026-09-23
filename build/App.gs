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
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Homeroom', 'Split', 'Grade', 'Advisor',
  'Borough', 'Gender', 'Student Email', 'Parent 1 Name', 'Parent 1 Email',
  'Parent 2 Name', 'Parent 2 Email', 'Active'];
HEADERS[SHEETS.PROSPECTIVE] = ['Tour Date', 'Name', 'School', 'Grade', 'Gender', 'Borough',
  'Route', 'Tour Guides', 'Notes'];
HEADERS[SHEETS.TRACKER] = ['Tour Date', 'Ambassador', 'Job', 'Prospective Student(s)', 'Route', 'Notes'];
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active'];
HEADERS[SHEETS.ELIGIBILITY] = ['Ambassador', 'Panelist', 'Lobby Greeter', 'Table Greeter', 'Tour Guide'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Initials', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.BELL] = ['Day', 'Homeroom', 'Split', 'Start', 'End', 'What / Teacher / Room'];
HEADERS[SHEETS.ROUTES] = ['Route', 'Direction', 'Humanities Teacher', 'Language', 'Itinerary'];
HEADERS[SHEETS.SETTINGS] = ['Setting', 'Value'];

const JOBS = {
  PANELIST: 'Panelist',
  LOBBY: 'Lobby Greeter',
  TABLE: 'Table Greeter',
  GUIDE: 'Tour Guide'
};

const YES_NO = ['Yes', 'No'];
const SPLITS = ['A', 'B', 'C'];
const PODS = ['MMS', 'DJM', 'AOS', 'CCM', 'EEL', 'MSB', 'CJM', 'RSS'];
const GRADES = ['5', '6', '7', '8'];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Other'];
const BOROUGHS = ['M', 'B', 'Q', 'X', 'S', 'J'];
const BOROUGH_NAMES = { M: 'Manhattan', B: 'Brooklyn', Q: 'Queens', X: 'Bronx', S: 'Staten Island', J: 'New Jersey' };

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
  ['Max Families Per Route', '1']
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
  Object.keys(SHEETS).forEach(function (k) { sheet_(SHEETS[k]); });

  setupAmbassadors_();
  setupProspective_();
  setupTracker_();
  setupJobs_();
  setupEligibility_();
  setupTeachers_();
  setupBellSchedule_();
  setupRoutes_();
  setupSettings_();

  const order = [SHEETS.PROSPECTIVE, SHEETS.TRACKER, SHEETS.AMBASSADORS, SHEETS.ELIGIBILITY,
    SHEETS.JOBS, SHEETS.TEACHERS, SHEETS.ROUTES, SHEETS.BELL, SHEETS.SETTINGS];
  order.forEach(function (name, i) {
    const s = ss_().getSheetByName(name);
    if (s) ss_().setActiveSheet(s).moveActiveSheet(i + 1);
  });
  ss_().setActiveSheet(ss_().getSheetByName(SHEETS.PROSPECTIVE));

  alert_('Setup complete.\n\n' +
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
  if (s.getLastRow() < 2) {
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
  const last = Math.max(s.getLastRow(), 2);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Homeroom') + 1, PODS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Split') + 1, SPLITS);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Grade') + 1, GRADES);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Gender') + 1, GENDERS, true);
  dropdown_(s, last, col_(SHEETS.AMBASSADORS, 'Borough') + 1, BOROUGHS);
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
  note_(s, SHEETS.AMBASSADORS, 'Student Email',
    'Their lrei.org address. Without it they never get told they are on duty.');
  s.autoResizeColumns(1, h.length);
}

function setupProspective_() {
  const s = sheet_(SHEETS.PROSPECTIVE);
  const h = HEADERS[SHEETS.PROSPECTIVE];
  const last = Math.max(s.getLastRow(), 2);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Grade') + 1, GRADES, true);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Gender') + 1, GENDERS, true);
  dropdown_(s, last, col_(SHEETS.PROSPECTIVE, 'Borough') + 1, BOROUGHS, true);
  s.getRange(2, col_(SHEETS.PROSPECTIVE, 'Tour Date') + 1, Math.max(last - 1, 200), 1)
    .setNumberFormat('yyyy-mm-dd');
  note_(s, SHEETS.PROSPECTIVE, 'Tour Date', 'The Wednesday they are visiting.');
  note_(s, SHEETS.PROSPECTIVE, 'Route', 'Filled in by Staff This Wednesday Tour - do not type here.');
  note_(s, SHEETS.PROSPECTIVE, 'Tour Guides', 'Filled in by Staff This Wednesday Tour - do not type here.');
  s.autoResizeColumns(1, h.length);
}

function setupTracker_() {
  const s = sheet_(SHEETS.TRACKER);
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

function setupJobs_() {
  const s = sheet_(SHEETS.JOBS);
  if (s.getLastRow() < 2) {
    s.getRange(2, 1, 4, 3).setValues([
      [JOBS.PANELIST, 'Speaks on the student panel. Chosen by hand, not by the staffing command.', 'Yes'],
      [JOBS.LOBBY, 'Greets visiting families as they arrive in the lobby.', 'Yes'],
      [JOBS.TABLE, 'Staffs the welcome and sign-in table.', 'Yes'],
      [JOBS.GUIDE, 'Walks a prospective student round the building on a set route.', 'Yes']
    ]);
  }
  dropdown_(s, Math.max(s.getLastRow(), 2), 3, YES_NO);
  s.autoResizeColumns(1, 3);
}

function setupEligibility_() {
  const s = sheet_(SHEETS.ELIGIBILITY);
  const h = HEADERS[SHEETS.ELIGIBILITY];
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
  if (s.getLastRow() < 2) {
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
  if (s.getLastRow() < 2) {
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
  if (s.getLastRow() < 2) {
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
  if (s.getLastRow() < 2) {
    s.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
  }
  note_(s, SHEETS.SETTINGS, 'Value',
    'Reply-To Email: leave blank and replies come back to whoever sends. ' +
    'Set it to an admissions address to collect replies there instead.');
  s.autoResizeColumns(1, 2);
}

function dropdown_(sheet, lastRow, col, values, allowOther) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(!!allowOther).build();
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
      email: trim_(r[col_(N, 'Student Email')]),
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
      borough: trim_(r[col_(N, 'Borough')]).toUpperCase()
    });
  });
  return out;
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
    const candidates = pool.filter(function (a) {
      if (used[a.name] || !canDo(a, JOBS.GUIDE)) return false;
      if (!a.grade || !a.gender) return false;
      if (v.grade && a.grade !== v.grade) return false;
      if (v.gender && norm_(a.gender) !== norm_(v.gender)) return false;
      return true;
    });
    // Same borough first, then whoever has done least.
    candidates.sort(function (a, b) {
      const ba = (v.borough && a.borough === v.borough) ? 0 : 1;
      const bb = (v.borough && b.borough === v.borough) ? 0 : 1;
      if (ba !== bb) return ba - bb;
      return fairness(a, b);
    });
    const chosen = candidates.slice(0, perVisitor);
    chosen.forEach(function (a) { used[a.name] = JOBS.GUIDE; });

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
      guides: chosen.map(function (a) { return a.name; }),
      route: route,
      short: Math.max(0, perVisitor - chosen.length),
      why: shortfallReason_(v, pool, used, canDo, all.length)
    };
  });

  /* ---- greeters ---- */
  const crew = function (job, count) {
    const ranked = pool.filter(function (a) { return !used[a.name] && canDo(a, job); }).sort(fairness);
    const chosen = ranked.slice(0, count).map(function (a) { return a.name; });
    chosen.forEach(function (n) { used[n] = job; });
    let why = '';
    if (chosen.length < count) {
      if (!all.length) why = 'the Ambassadors sheet is empty';
      else if (!pool.length) why = 'nobody is marked Active - put Yes in the Active column';
      else why = 'everyone eligible is already on another job';
    }
    return {
      job: job, chosen: chosen, needed: count,
      short: Math.max(0, count - chosen.length), why: why
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

  return {
    date: dateKey_(dateVal),
    dateLabel: longDate_(dateVal),
    pairs: pairs,
    greeters: greeters,
    free: free,
    warnings: setupWarnings_(all, visitors)
  };
}

/** Why a visitor could not be given a full pair, in plain words. */
function shortfallReason_(v, pool, used, canDo, total) {
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
  const gradeOk = left.filter(function (a) { return !v.grade || a.grade === v.grade; });
  if (!gradeOk.length) {
    return 'nobody left in grade ' + v.grade +
      (noDetails ? ' (' + noDetails + ' ambassador(s) have no grade or gender filled in)' : '');
  }
  const bothOk = gradeOk.filter(function (a) { return !v.gender || norm_(a.gender) === norm_(v.gender); });
  if (!bothOk.length) return 'nobody left in grade ' + v.grade + ' of that gender';
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
  missing('grade', 'Grade - they can never be picked as a guide');
  missing('gender', 'Gender - they can never be picked as a guide');
  missing('split', 'Split - their teacher cannot be worked out');
  missing('pod', 'Homeroom');
  missing('email', 'Student Email - they will not be told they are on duty');
  missing('advisor', 'Advisor - their advisor will not be told');

  const noTeacherEmail = rows_(SHEETS.TEACHERS).filter(function (r) {
    return trim_(r[0]) && !trim_(r[2]);
  }).length;
  if (noTeacherEmail) w.push(noTeacherEmail + ' teacher(s) have no email address on the Teachers sheet.');

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
    p.guides.forEach(function (g) {
      const row = blankRow_(N);
      row[col_(N, 'Tour Date')] = dateVal;
      row[col_(N, 'Ambassador')] = g;
      row[col_(N, 'Job')] = JOBS.GUIDE;
      row[col_(N, 'Prospective Student(s)')] = p.visitor.name;
      row[col_(N, 'Route')] = p.route;
      out.push(row);
    });
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
    psheet.getRange(p.visitor.row, col_(P, 'Tour Guides') + 1).setValue(p.guides.join(', '));
  });

  return { written: out.length, plan: plan };
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

  Object.keys(seen).forEach(function (key) {
    const jobs = seen[key].jobs;
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

  return {
    advisorsSent: advisorsSent, teachersSent: teachersSent,
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
    'function render(p){busy(false);document.getElementById("save").disabled=false;' +
    'var h="<div class=\'out\'><h3>"+esc(p.dateLabel)+"</h3><table><tr><th>Visiting student</th>' +
    '<th>Guides</th><th>Route</th></tr>";' +
    'p.pairs.forEach(function(x){h+="<tr><td>"+esc(x.visitor.name)+' +
    '(x.visitor.school?" <span class=\'muted\'>("+esc(x.visitor.school)+")</span>":"")+"</td><td>"+' +
    '(x.guides.length?esc(x.guides.join(", ")):"<b>none found</b>")+' +
    '(x.short?" <span class=\'muted\'>short "+x.short+(x.why?" - "+esc(x.why):"")+"</span>":"")+' +
    '"</td><td>"+esc(x.route||"-")+"</td></tr>";});' +
    'h+="</table>";' +
    'p.greeters.forEach(function(c){h+="<h3>"+esc(c.job)+" ("+c.chosen.length+" of "+c.needed+")</h3><div>"+' +
    '(c.chosen.length?esc(c.chosen.join(", ")):"<b>none available</b>")+' +
    '(c.why?" <span class=\'muted\'>- "+esc(c.why)+"</span>":"")+"</div>";});' +
    'h+="</div>";' +
    'if(p.free.length){h+="<div class=\'free\'><b>Still free - pick your panelists from these "+p.free.length+"</b><br>"+' +
    'esc(p.free.map(function(f){return f.name+" ("+(f.tours||0)+")";}).join(", "))+' +
    '"<br><span class=\'muted\'>The number is how many jobs they have done, fewest first.</span></div>";}' +
    'if(p.warnings.length){h+="<div class=\'warn\'><b>Worth fixing first</b><ul>"+' +
    'p.warnings.map(function(w){return "<li>"+esc(w)+"</li>";}).join("")+"</ul></div>";}' +
    'document.getElementById("out").innerHTML=h;}' +
    'function doSave(){document.getElementById("save").disabled=true;' +
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
    'else{h+="<b>"+r.advisorsSent+"</b> advisor email(s) and <b>"+r.teachersSent+' +
    '"</b> class-teacher email(s) sent for "+esc(r.date)+".";}}' +
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

function api_planTour(dateStr) { return planTour(dateStr); }
function api_commitTour(dateStr) { return commitTour(dateStr); }
function api_sendEmails(which, dateStr) {
  return which === 'students' ? sendStudentEmails(dateStr) : sendTeacherEmails(dateStr);
}
