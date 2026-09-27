/**
 * Ravenna paste, formatted into the applications sheet.
 *
 * PASTED IN FULL? This file is 1727 lines. Scroll to the bottom of the
 * editor: the last line should read END OF FILE. If it does not, the
 * paste was cut short, and nothing will work until it is pasted again.
 *
 * This is a SEPARATE script from the Wednesday tour scheduler. It is
 * pasted into the Apps Script editor of the applications spreadsheet,
 * not the tour one, and it is the only file that project needs.
 *
 * What it is for: copying a block of applicants out of Ravenna and
 * getting them onto the sheet in the right columns, in one go, without
 * touching the grid by hand.
 *
 * The six columns filled in later by hand - PI Date: through PI Notes -
 * are never written to, on any run. A paste cannot overwrite them.
 */

/* =========================================================
 * The sheet
 * ========================================================= */

/**
 * The columns, in order.
 *
 * Only used to build the sheet from nothing, or to fall back on when row
 * 1 is empty. On a sheet that already has headings, every column is
 * found by reading row 1, so a column moved, renamed or added changes
 * nothing about where values land.
 */
const APP_COLUMNS_ = ['Name', 'First Name', 'Last Name', 'Notes:', 'PI Date:', 'AT Date:',
  'AT with:', 'AT uploaded', 'AT Notes', 'PI Notes', 'Core Submitted', 'App. Type',
  'App. Grade', 'Gender', 'School', 'Grades Attended'];

/**
 * Hers, filled in by hand after the applicant is on the sheet.
 *
 * Nothing in this file writes to these, and no pasted column can be
 * pointed at one. They are not offered in the dialog at all.
 */
const APP_BY_HAND_ = ['PI Date:', 'AT Date:', 'AT with:', 'AT uploaded', 'AT Notes', 'PI Notes'];

/** Whether a heading, boiled down, is one of the names a column goes by. */
function aliasHit_(names, key) {
  for (let i = 0; i < names.length; i++) {
    if (headKey_(names[i]) === key) return true;
  }
  return false;
}

/** Ravenna's own headings, and the other names each column goes by. */
const APP_ALIASES_ = [
  ['First Name', ['first', 'first name', 'firstname', 'given name', 'student first name',
    'applicant first name', 'child first name', 'legal first name', 'preferred first name']],
  ['Last Name', ['last', 'last name', 'lastname', 'surname', 'family name',
    'student last name', 'applicant last name', 'child last name', 'legal last name']],
  ['Name', ['name', 'student', 'student name', 'applicant', 'applicant name', 'full name',
    'child', 'child name', 'candidate', 'candidate name', 'applicant full name',
    'legal name', 'student full name', 'child full name', 'name last first',
    'name (last, first)', 'applicant/student', 'student/applicant']],
  ['App. Grade', ['app grade', 'app. grade', 'application grade', 'entry grade',
    'entering grade', 'grade applying for', 'applying for', 'applying for grade',
    'applying grade', 'admit grade', 'grade level', 'grade', 'entry year',
    'grade applying to', 'applying to grade', 'applying']],
  ['App. Type', ['app type', 'app. type', 'application type', 'applicant type', 'type',
    'admission type', 'candidate type', 'inquiry type', 'division', 'applying to',
    'division applying to', 'school applying to', 'applying to school', 'program',
    'programme', 'division and grades']],
  ['Core Submitted', ['core submitted', 'core app submitted', 'core application submitted',
    'core application', 'core app', 'core', 'application submitted', 'submitted',
    'date submitted', 'core status', 'application status', 'status']],
  ['Gender', ['gender', 'sex', 'student gender', 'child gender', 'gender identity']],
  ['School', ['school', 'current school', 'present school', 'school name', 'sending school',
    'current school name', 'previous school', 'school attending']],
  ['Grades Attended', ['grades attended', 'grade attended', 'years attended',
    'grades at current school', 'grade range', 'attended', 'grades completed',
    'years at current school', 'grades enrolled', 'enrolled grades']],
  ['Notes:', ['notes', 'note', 'notes:', 'comments', 'comment', 'remarks']]
];

/* =========================================================
 * Small helpers
 * ========================================================= */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function trim_(v) { return String(v == null ? '' : v).trim(); }
function norm_(v) { return String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, ' '); }
function alert_(msg) { SpreadsheetApp.getUi().alert(msg); }

/**
 * A heading, boiled down to the part that identifies it.
 *
 * The punctuation is what differs between one sheet and the next: "App.
 * Grade" and "App Grade" are the same column, and so are "Notes:" and
 * "Notes". Stops, colons, stars and a trailing bracketed aside all come
 * off, so a heading is matched on its words.
 */
function headKey_(v) {
  return norm_(v).replace(/\s*\([^()]*\)\s*$/, '')
    .replace(/[*:.]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Where each column sits on a sheet, read off its own row 1.
 *
 * Her headings win over the list above, so a sheet that says "App Grade"
 * without the full stop, or carries a column this file has never heard
 * of, still works. Falls back to the order above only when row 1 is
 * empty.
 */
function appHeaderIndex_(sheet) {
  const width = Math.max(sheet.getLastColumn(), APP_COLUMNS_.length);
  const row = sheet.getRange(1, 1, 1, width).getValues()[0];
  const map = {};
  const order = [];
  row.forEach(function (cell, i) {
    const key = trim_(cell);
    if (!key) return;
    if (map[key] === undefined) map[key] = i;
    if (order.indexOf(key) === -1) order.push(key);
  });
  if (!order.length) {
    APP_COLUMNS_.forEach(function (h, i) { map[h] = i; order.push(h); });
  }
  return { map: map, order: order, width: width };
}

/** The sheet's own name for a column, so "App. Grade" finds "App Grade". */
function appColumnNamed_(headers, want) {
  if (headers.map[want] !== undefined) return want;
  const key = headKey_(want);
  for (let i = 0; i < headers.order.length; i++) {
    if (headKey_(headers.order[i]) === key) return headers.order[i];
  }
  return '';
}

function isByHand_(header) {
  const key = headKey_(header);
  for (let i = 0; i < APP_BY_HAND_.length; i++) {
    if (headKey_(APP_BY_HAND_[i]) === key) return true;
  }
  return false;
}

/* =========================================================
 * Which tab
 *
 * The sheet already exists and this script does not know what she called
 * the tab, so it looks for the one whose row 1 reads like applications
 * and offers the rest in a dropdown behind it.
 * ========================================================= */

function appTabs_() {
  // The landing tab is where a paste arrives, never where it goes.
  return ss_().getSheets().filter(function (s) {
    return s.getName() !== PASTE_TAB_;
  }).map(function (s) {
    const headers = appHeaderIndex_(s);
    let hits = 0;
    APP_COLUMNS_.forEach(function (want) {
      if (appColumnNamed_(headers, want)) hits++;
    });
    return {
      name: s.getName(),
      hits: hits,
      rows: Math.max(s.getLastRow() - 1, 0),
      fits: hits >= 4
    };
  });
}

/** The tab a paste should go to unless she says otherwise. */
function bestAppTab_() {
  const tabs = appTabs_();
  let best = null;
  tabs.forEach(function (t) {
    if (!best || t.hits > best.hits) best = t;
  });
  if (best && best.fits) return best.name;
  const active = ss_().getActiveSheet();
  return active ? active.getName() : (tabs.length ? tabs[0].name : '');
}

/* =========================================================
 * Reading a paste
 * ========================================================= */

/**
 * One line of a paste, split into cells.
 *
 * Copying a table out of a browser gives tabs, which is the ordinary
 * case and the only one that is never ambiguous. The two fallbacks are
 * for a paste that lost its tabs on the way: runs of spaces, then
 * commas, respecting quotes.
 */
function splitLine_(line, how) {
  if (how === 'tab') return line.split('\t');
  if (how === 'spaces') return line.split(/\s{2,}/);
  const out = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (ch === '"') {
      if (quoted && line.charAt(i + 1) === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cell); cell = '';
    } else {
      cell += ch;
    }
  }
  out.push(cell);
  return out;
}

function delimiterOf_(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('\t') !== -1) return 'tab';
  }
  for (let i = 0; i < lines.length; i++) {
    if (/\S\s{2,}\S/.test(lines[i])) return 'spaces';
  }
  return lines[0].indexOf(',') !== -1 ? 'comma' : 'tab';
}

/** A pasted block as a grid of trimmed cells. A blank line is not a row. */
function pasteGrid_(text) {
  const lines = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n')
    .filter(function (l) { return trim_(l) !== ''; });
  if (!lines.length) return { rows: [], how: 'tab' };
  const how = delimiterOf_(lines);
  return {
    how: how,
    rows: lines.map(function (l) {
      return splitLine_(l, how).map(function (c) {
        return trim_(String(c).replace(/^"([\s\S]*)"$/, '$1'));
      });
    })
  };
}

/**
 * Printed in the dialog, large, so which version is running is never a
 * guess. Bump it on every change that goes to her, or it is worse than
 * useless: it says the fix is in when it is not.
 */
const APP_VERSION_ = 'v11';

const APP_MAP_KEY_ = 'ravennaColumnMap';

/** The corrections she has made before, so the same report maps itself next time. */
function learnedMap_() {
  try {
    const raw = PropertiesService.getDocumentProperties().getProperty(APP_MAP_KEY_);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function rememberMap_(columns) {
  try {
    const map = learnedMap_();
    let changed = false;
    columns.forEach(function (c) {
      if (!c.header) return;
      if (map[norm_(c.header)] === c.target) return;
      map[norm_(c.header)] = c.target;
      changed = true;
    });
    if (changed) {
      PropertiesService.getDocumentProperties().setProperty(APP_MAP_KEY_, JSON.stringify(map));
    }
  } catch (err) {
    // Remembering is a convenience. Not being allowed to is not an error.
  }
}

function forgetMap_() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty(APP_MAP_KEY_);
  } catch (err) {
    // Nothing stored is the state we were after anyway.
  }
}

/**
 * Which column of the sheet a pasted heading feeds, or '' for none.
 *
 * Her own corrections come first, then Ravenna's headings as this file
 * knows them, then the sheet's own row 1 in case a heading matches it
 * outright.
 */
function targetFor_(header, headers) {
  const raw = norm_(header);
  if (!raw) return { target: '', source: 'none' };
  const learned = learnedMap_();
  if (learned[raw] !== undefined) {
    const kept = learned[raw] && appColumnNamed_(headers, learned[raw]) ? learned[raw] : '';
    return { target: kept, source: 'remembered' };
  }
  const key = headKey_(header);
  for (let i = 0; i < APP_ALIASES_.length; i++) {
    if (!aliasHit_(APP_ALIASES_[i][1], key)) continue;
    const named = appColumnNamed_(headers, APP_ALIASES_[i][0]);
    if (named && !isByHand_(named)) return { target: named, source: 'heading' };
  }
  for (let i = 0; i < headers.order.length; i++) {
    if (headKey_(headers.order[i]) === key && !isByHand_(headers.order[i])) {
      return { target: headers.order[i], source: 'heading' };
    }
  }
  return { target: '', source: 'none' };
}

/* =========================================================
 * Working a column out from what is in it
 *
 * The headings do most of the work. This is for the rest: a column
 * Ravenna has renamed, or a paste made without its heading row. A
 * column whose values are all Male and Female is the gender column
 * whatever it is called, so the script says so rather than leaving her
 * to point at it.
 *
 * Only ever applied to a column the headings could not place, only to a
 * sheet column nothing else is going to, and always shown as read from
 * the values so she knows to give it a second look.
 * ========================================================= */

const GENDER_WORDS_ = ['m', 'f', 'male', 'female', 'boy', 'girl', 'man', 'woman', 'nb',
  'enby', 'nonbinary', 'non binary', 'non-binary', 'other', 'x'];

function isGenderWord_(v) {
  return !(v instanceof Date) && GENDER_WORDS_.indexOf(norm_(v)) !== -1;
}

/** One year: 6, 6th, Grade 6, K, PK, PreK, TK. */
const ONE_GRADE_ = '(pre-?k|p-?k|t-?k|k|\\d{1,2}(st|nd|rd|th)?)';

/**
 * A span of years: 1-5, 1st-5th, K-5, 1-4th, PK through 4.
 *
 * A range is always what they have already done, never what they are
 * applying to, so it is Grades Attended and it is checked first.
 */
function isGradeRange_(v) {
  if (v instanceof Date) return false;
  return new RegExp('^' + ONE_GRADE_ + '\\s*(-|to|through|thru)\\s*' + ONE_GRADE_ + '$', 'i')
    .test(trim_(v));
}

/**
 * The grade being applied to: a single year and nothing else.
 *
 * 6 means applying to 6th. A range is what they have already done, and a
 * division with its years after it is the application type, so both are
 * ruled out rather than swept in here.
 */
function isAppliedGrade_(v) {
  if (v instanceof Date) return false;
  const t = trim_(v);
  if (!t || isGradeRange_(t) || isAppType_(t)) return false;
  return new RegExp('^(grade\\s*)?' + ONE_GRADE_ + '(\\s*grade)?$', 'i').test(t);
}

/**
 * The application type: the division, and the grades that division
 * takes. "Middle School, 5,6" and "Lower School, 1,2,3,4" are both this.
 *
 * The division has to come first for this to count, so a school called
 * "Brooklyn Middle School" is a school and not an application type.
 */
const DIVISION_ = '(lower|middle|upper|high|primary|elementary|senior|junior)\\s+school';

function isAppType_(v) {
  if (v instanceof Date) return false;
  const t = trim_(v);
  if (!t) return false;
  return new RegExp('^' + DIVISION_ + '\\s*[,:]', 'i').test(t) ||
    new RegExp('^' + DIVISION_ + '$', 'i').test(t);
}

/** "Rivera, Sam" - a surname, a comma, a first name. */
function isFlippedName_(v) {
  return /^[A-Za-z][A-Za-z'.\- ]+,\s*[A-Za-z]/.test(trim_(v));
}

/* Two words that are not a person: an application type reads like a name
 * until you look at the words. */
const NOT_PEOPLE_ = ['new', 'returning', 'student', 'students', 'applicant', 'transfer',
  'reapplicant', 're-applicant', 'inquiry', 'sibling', 'legacy', 'yes', 'no', 'none',
  'active', 'inactive', 'complete', 'incomplete', 'submitted', 'pending', 'grade',
  'school', 'lower', 'middle', 'upper', 'male', 'female'];

/**
 * A person's name, flipped or not.
 *
 * "Rivera, Samuel (Sam)" and "Samuel (Sam) Rivera" are both names, so a
 * name column is recognised whichever way round Ravenna writes it. A
 * value carrying a digit, a school word, or one of the application words
 * above is not somebody's name.
 */
function isPersonName_(v) {
  if (v instanceof Date) return false;
  const t = trim_(v);
  if (!t || /\d/.test(t) || isSchoolish_(t)) return false;
  if (isFlippedName_(t)) return true;
  const words = stripBrackets_(t).split(/\s+/).filter(function (w) { return w !== ''; });
  if (words.length < 2 || words.length > 5) return false;
  for (let i = 0; i < words.length; i++) {
    if (!/^[A-Za-z][A-Za-z'.-]*$/.test(words[i])) return false;
    if (NOT_PEOPLE_.indexOf(norm_(words[i])) !== -1) return false;
  }
  return true;
}

function isSchoolish_(v) {
  if (v instanceof Date) return false;
  return /\b(school|academy|prep|preparatory|collegiate|montessori|friends|lycee|yeshiva)\b/i
    .test(trim_(v)) || /^(ps|is|ms|jhs)\s*\d+/i.test(trim_(v));
}

/**
 * A submitted date, with the time Ravenna staples to it taken off.
 *
 * Ravenna hands back "2026-09-14 14:32:00", which is a timestamp and not
 * what she wants to read down a column. The day is kept as a real date,
 * so the column sorts and formats as a date rather than as text, and
 * anything this does not recognise is left exactly as it came.
 */
function readSubmitted_(v) {
  if (v instanceof Date) return v;
  const t = trim_(v);
  if (!t) return '';
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ,]|$)/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[T ,]|$)/.exec(t);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})(?:[T ,]|$)/.exec(t);
  if (m) return new Date(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return t;
}

function isDateish_(v) { return readSubmitted_(v) instanceof Date; }

/** A date as she would write it. */
function dateText_(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}

/* The three columns that are all about grades in one way or another.
 * A heading is the least reliable thing about these, and getting them
 * the wrong way round is the mistake hardest to spot on the sheet
 * afterwards, so the values are allowed to overrule a heading here. */
const GRADE_FAMILY_ = ['App. Type', 'Grades Attended', 'App. Grade'];

/** Which of the three a column's values say it is, or '' if they do not say. */
function gradeFamilyFromValues_(values) {
  if (!values.length) return '';
  let type = 0;
  let range = 0;
  let one = 0;
  values.forEach(function (v) {
    if (isAppType_(v)) type++;
    else if (isGradeRange_(v)) range++;
    else if (isAppliedGrade_(v)) one++;
  });
  const n = values.length;
  if (type / n >= 0.6) return 'App. Type';
  if (range / n >= 0.6) return 'Grades Attended';
  if (one / n >= 0.6) return 'App. Grade';
  return '';
}

/**
 * Which column these values look like, or '' if they look like nothing.
 *
 * Wants a clear majority rather than a single match, so one stray value
 * cannot carry a column, and hands back '' the moment the sheet column
 * it would pick is already spoken for.
 */
function targetFromValues_(values, headers, taken) {
  if (!values.length) return '';
  const share = function (test) {
    let n = 0;
    values.forEach(function (v) { if (test(v)) n++; });
    return n / values.length;
  };
  const free = function (want) {
    const named = appColumnNamed_(headers, want);
    return named && !isByHand_(named) && !taken[named] ? named : '';
  };
  if (share(isGenderWord_) >= 0.6) return free('Gender');
  if (share(isAppType_) >= 0.6) return free('App. Type');
  if (share(isGradeRange_) >= 0.6) return free('Grades Attended');
  if (share(isAppliedGrade_) >= 0.6) return free('App. Grade');
  if (share(isDateish_) >= 0.6) return free('Core Submitted');
  if (share(isPersonName_) >= 0.6) return free('Name');
  if (share(isSchoolish_) >= 0.5) return free('School');
  return '';
}

/**
 * Whether the first line of a paste is headings rather than an applicant.
 *
 * Headings are what Ravenna puts at the top, but she may well have
 * selected the rows without them. Two recognised headings on the line is
 * enough to call it.
 */
function looksLikeHeaders_(row, headers) {
  let known = 0;
  row.forEach(function (c) { if (targetFor_(c, headers).target) known++; });
  return known >= 2;
}

/* =========================================================
 * Names
 *
 * The one thing she was redoing by hand every time. Ravenna can give a
 * single name, two columns, or "Rivera, Sam"; the sheet wants all three
 * of Name, First Name and Last Name. Whichever of the three the paste
 * carries is kept as it came, and the missing ones are worked out from
 * it.
 * ========================================================= */

const NAME_SUFFIXES_ = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'];

/* Parts of a surname that are written before it and belong with it:
 * "van der Berg" is a last name, not a middle name and a last name. */
const NAME_PARTICLES_ = ['van', 'von', 'de', 'del', 'della', 'der', 'den', 'di', 'da',
  'dos', 'du', 'la', 'le', 'ten', 'ter', 'bin', 'ibn', 'al', 'st', 'st.'];

/**
 * Capitalisation, left well alone unless the paste is shouting.
 *
 * Reports often come out in capitals. A word that is ALL CAPS is put
 * back into ordinary case; a word already in mixed case is somebody's
 * own spelling of their own name - McDonald, DeShawn, van der Berg - and
 * is never touched.
 */
function fixCase_(name) {
  return String(name).split(/(\s+)/).map(function (word) {
    if (!/[A-Za-z]/.test(word)) return word;
    if (word !== word.toUpperCase()) return word;
    if (word.replace(/[^A-Za-z]/g, '').length < 2) return word;
    return word.toLowerCase()
      .replace(/(^|[^A-Za-z])([a-z])/g, function (m, pre, ch) { return pre + ch.toUpperCase(); })
      .replace(/^Mc([a-z])/, function (m, ch) { return 'Mc' + ch.toUpperCase(); });
  }).join('');
}

/** "Rivera, Sam" and "Rivera, Sam, Jr." put back into reading order. */
function unflipName_(whole) {
  const w = trim_(whole);
  if (w.indexOf(',') === -1) return w;
  const parts = w.split(',').map(trim_).filter(function (p) { return p !== ''; });
  if (parts.length < 2) return parts.join(' ');
  const surname = parts[0];
  const rest = parts.slice(1);
  let suffix = '';
  if (NAME_SUFFIXES_.indexOf(norm_(rest[rest.length - 1])) !== -1 && rest.length > 1) {
    suffix = rest.pop();
  }
  return trim_(rest.join(' ') + ' ' + surname + (suffix ? ' ' + suffix : ''));
}

/**
 * A whole name split into a first and a last.
 *
 * The first word is the first name. The last name is the last word, and
 * anything in front of it that is part of it: a particle like "van der",
 * and a suffix after it. Middle names stay in Name and go into neither.
 */
function splitName_(whole) {
  const words = trim_(whole).split(/\s+/).filter(function (w) { return w !== ''; });
  if (!words.length) return { first: '', last: '' };
  if (words.length === 1) return { first: words[0], last: '' };
  let end = words.length - 1;
  let suffix = '';
  if (NAME_SUFFIXES_.indexOf(norm_(words[end])) !== -1 && end > 1) {
    suffix = words[end];
    end--;
  }
  let start = end;
  while (start > 1 && NAME_PARTICLES_.indexOf(norm_(words[start - 1])) !== -1) start--;
  const last = words.slice(start, end + 1).join(' ') + (suffix ? ' ' + suffix : '');
  return { first: words[0], last: trim_(last) };
}

/**
 * Things in brackets that are plainly a note rather than a name.
 *
 * Ravenna's name field collects both. Anything on this list, or with a
 * digit in it, or longer than two words, is left where it is.
 */
const NOT_A_NAME_ = ['sibling', 'siblings', 'legacy', 'transfer', 'transferring', 'deferred',
  'waitlist', 'waitlisted', 'reapplicant', 're-applicant', 'reapply', 'returning', 'new',
  'applied', 'inquiry', 'international', 'boarding', 'day', 'faculty', 'staff', 'alum',
  'alumni', 'twin', 'twins', 'tbd', 'n/a', 'na', 'none', 'unknown', 'deceased'];

/**
 * The name in brackets, which is the name they actually go by.
 *
 * Ravenna carries a preferred name inside the name field, as
 * "Samuel (Sam)" or Samuel "Sam". That is the name the child answers to
 * and the one the office uses, so it is what goes in First Name.
 *
 * Only something that reads like a name is taken: one or two words, all
 * letters, nothing on the list of notes above. A bracket holding
 * "(sibling)" or "(2026)" is not a name and is passed over, so a note in
 * the same field cannot end up as a child's first name.
 */
function preferredName_(text) {
  const t = String(text == null ? '' : text);
  const m = /\(([^)]*)\)|\[([^\]]*)\]|"([^"]*)"/.exec(t);
  if (!m) return '';
  const inside = trim_(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
  if (!inside || inside.length > 24) return '';
  if (NOT_A_NAME_.indexOf(norm_(inside)) !== -1) return '';
  const words = inside.split(/\s+/);
  if (words.length > 2) return '';
  for (let i = 0; i < words.length; i++) {
    if (!/^[A-Za-z][A-Za-z'.-]*$/.test(words[i])) return '';
  }
  return fixCase_(inside);
}

/** A name with any bracketed aside taken out of it. */
function stripBrackets_(text) {
  return trim_(String(text == null ? '' : text)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*\[[^\]]*\]\s*/g, ' ')
    .replace(/\s*"[^"]*"\s*/g, ' ')
    .replace(/\s+/g, ' '));
}

/**
 * The three name cells, from whatever the paste gave.
 *
 * What the paste carries is kept. Only the blanks are worked out, so a
 * Ravenna report that already has a first and a last column is never
 * second-guessed.
 *
 * A name in brackets wins for First Name: "Rivera, Samuel (Sam)" is
 * Sam Rivera, filed under Sam. The brackets stay in the Name column, so
 * the name on the application is still on the sheet, and First Name and
 * Last Name hold the name and nothing else.
 */
function readNames_(whole, first, last) {
  let f = fixCase_(trim_(first));
  let l = fixCase_(trim_(last));
  let n = fixCase_(unflipName_(whole));
  if (!n && (f || l)) n = trim_(f + ' ' + l);

  // Whichever field carries it, the bracket is read the same way.
  const pref = preferredName_(f) || preferredName_(n);

  if (n && (!f || !l)) {
    const halves = splitName_(stripBrackets_(n));
    if (!f) f = halves.first;
    if (!l) l = halves.last;
  }
  const given = stripBrackets_(f);
  return {
    name: n,
    first: pref || given,
    last: stripBrackets_(l),
    preferred: pref && norm_(pref) !== norm_(given) ? pref : '',
    given: given
  };
}

/* =========================================================
 * The paste, read but not written
 * ========================================================= */

/**
 * What a paste would put on the sheet.
 *
 * Returns every pasted column and what it was taken to mean, every
 * applicant exactly as they would be written, and everything it could
 * not work out. `overrides` is her own answer for a column, by position,
 * and always beats the heading.
 */
function readPaste_(tab, text, overrides) {
  const grid = pasteGrid_(text);
  if (!grid.rows.length) {
    throw new Error('Nothing in the box yet. Copy the applicants out of Ravenna and paste ' +
      'them in.');
  }
  return readGrid_(tab, grid.rows, overrides);
}

/**
 * The same reading, from rows rather than from a block of text.
 *
 * Rows come either from a paste into the box or from the cells of the
 * landing tab. Everything after this point is the same, because by here
 * a paste is a grid whichever way it arrived.
 */
function readGrid_(tab, gridRows, overrides) {
  const sheet = ss_().getSheetByName(tab);
  if (!sheet) throw new Error('This spreadsheet has no tab called "' + tab + '".');
  const headers = appHeaderIndex_(sheet);
  const grid = { rows: gridRows };

  const hasHeaders = looksLikeHeaders_(grid.rows[0], headers);
  const headerRow = hasHeaders ? grid.rows[0] : [];
  const dataRows = hasHeaders ? grid.rows.slice(1) : grid.rows;
  const width = grid.rows.reduce(function (w, r) { return Math.max(w, r.length); }, 0);
  const picked = overrides || {};

  const columns = [];
  for (let i = 0; i < width; i++) {
    const header = trim_(headerRow[i] || '');
    let sample = '';
    for (let r = 0; r < dataRows.length && !sample; r++) {
      const raw = dataRows[r][i];
      sample = raw instanceof Date ? dateText_(raw) : trim_(raw || '');
    }
    const chosen = picked[String(i)];
    const read = targetFor_(header, headers);
    columns.push({
      index: i,
      header: header,
      sample: sample,
      target: chosen === undefined ? read.target : chosen,
      source: chosen === undefined ? read.source : 'yours'
    });
  }

  const valuesIn = function (i) {
    const out = [];
    dataRows.forEach(function (r) {
      const raw = r[i];
      if (raw instanceof Date) { out.push(raw); return; }
      const v = trim_(raw || '');
      if (v) out.push(v);
    });
    return out;
  };

  // "Middle School, 5,6" is an application type whatever the column it
  // arrived in was called, and "1-5" is what they have already done. So
  // among those three, and only those three, the values overrule the
  // heading. Her own choice for a column is never overruled.
  const familyName = {};
  const inFamily = {};
  GRADE_FAMILY_.forEach(function (want) {
    const named = appColumnNamed_(headers, want);
    if (!named || isByHand_(named)) return;
    familyName[want] = named;
    inFamily[named] = true;
  });
  columns.forEach(function (c) {
    if (!c.target || !inFamily[c.target] || picked[String(c.index)] !== undefined) return;
    const says = gradeFamilyFromValues_(valuesIn(c.index));
    if (!says || !familyName[says] || familyName[says] === c.target) return;
    c.target = familyName[says];
    c.source = 'values';
  });

  // Anything the headings did not place, worked out from its own values.
  const taken = {};
  columns.forEach(function (c) { if (c.target) taken[c.target] = true; });
  columns.forEach(function (c) {
    if (c.target || picked[String(c.index)] !== undefined) return;
    const guess = targetFromValues_(valuesIn(c.index), headers, taken);
    if (!guess) return;
    c.target = guess;
    c.source = 'values';
    taken[guess] = true;
  });

  const warnings = [];
  const warn = function (m) { if (warnings.indexOf(m) === -1) warnings.push(m); };

  const unplacedNow = columns.filter(function (c) {
    return !c.target && (c.header || c.sample);
  }).length;
  if (!hasHeaders) {
    warn(unplacedNow ?
      'There is no heading row, so the columns had to be worked out from the values ' +
      'themselves, and ' + unplacedNow + ' could not be. Set those under "Check the ' +
      'columns" below.' :
      'There is no heading row, so the columns were worked out from the values ' +
      'themselves. Worth a glance under "Check the columns" below before you add them.');
  }
  columns.forEach(function (c) {
    if (c.target || !c.header || !c.sample) return;
    warn('Column "' + c.header + '" was left out. Nothing here knows what it is, so set ' +
      'it under "Check the columns" below if it belongs on the sheet.');
  });
  const seen = {};
  columns.forEach(function (c) {
    if (!c.target) return;
    if (seen[c.target]) {
      warn('Two columns are both going to ' + c.target + ', so the later one wins. Send ' +
        'one of them to "leave this out" under "Check the columns" below if that is wrong.');
    }
    seen[c.target] = true;
  });

  // The columns actually being filled, in the sheet's own order.
  const filling = headers.order.filter(function (h) { return seen[h]; });
  const nameCol = appColumnNamed_(headers, 'Name');
  const firstCol = appColumnNamed_(headers, 'First Name');
  const lastCol = appColumnNamed_(headers, 'Last Name');
  const dateCol = appColumnNamed_(headers, 'Core Submitted');
  [nameCol, firstCol, lastCol].forEach(function (h) {
    if (h && filling.indexOf(h) === -1 && (seen[nameCol] || seen[firstCol] || seen[lastCol])) {
      filling.push(h);
    }
  });
  filling.sort(function (a, b) { return headers.map[a] - headers.map[b]; });

  /**
   * The value a column feeds, for one row.
   *
   * A cell pasted onto the landing tab can already hold a real date, and
   * turning that into text here would lose it: what a date prints as is
   * not a shape anything reads back. So a date is carried through as a
   * date, and everything else as trimmed text.
   */
  const at = function (row, target) {
    let v = '';
    if (!target) return v;
    columns.forEach(function (c) {
      if (c.target !== target) return;
      const raw = row[c.index];
      if (raw instanceof Date) { v = raw; return; }
      if (trim_(raw || '')) v = trim_(raw);
    });
    return v;
  };

  const people = [];
  const unnamed = [];
  dataRows.forEach(function (row, n) {
    const names = readNames_(at(row, nameCol), at(row, firstCol), at(row, lastCol));
    if (!names.name) {
      if (row.some(function (c) { return trim_(c) !== ''; })) unnamed.push(n + (hasHeaders ? 2 : 1));
      return;
    }
    // `row` is what gets written, `shown` is what the dialog prints. They
    // differ only where a cell is a real date rather than text.
    const out = {};
    const shown = {};
    filling.forEach(function (h) {
      let v;
      if (h === nameCol) v = names.name;
      else if (h === firstCol) v = names.first;
      else if (h === lastCol) v = names.last;
      else if (h === dateCol) v = readSubmitted_(at(row, h));
      else v = at(row, h);
      out[h] = v;
      shown[h] = v instanceof Date ? dateText_(v) : v;
    });
    if (firstCol && lastCol && !names.last) {
      warn(names.name + ' is one word, so Last Name was left blank.');
    }
    people.push({
      name: names.name,
      row: out,
      shown: shown,
      preferred: names.preferred,
      given: names.given
    });
  });

  if (unnamed.length) {
    warn('Line' + (unnamed.length > 1 ? 's ' : ' ') + unnamed.join(', ') + ' had no name, ' +
      'so ' + (unnamed.length > 1 ? 'they were' : 'it was') + ' left out.');
  }
  if (!people.length && dataRows.length) {
    warn('No name was found in any line. Under "Check the columns" below, point a column ' +
      'at Name, or at First Name and Last Name.');
  }

  // Each applicant goes to the tab whose band covers their grade. The
  // tab chosen in the dialog is only the fallback, for anyone whose
  // grade no tab covers.
  const bands = gradeTabs_();
  const gradeColName = appColumnNamed_(headers, 'App. Grade');
  people.forEach(function (x) {
    const wanted = tabForGrade_(gradeNumber_(x.row[gradeColName]), bands);
    x.to = wanted || tab;
    x.routed = wanted !== '';
  });

  // Already there, checked on the tab each one is actually going to,
  // since the same name on a different band is a different applicant.
  const seenOn = {};
  const alreadyOn = function (name) {
    if (seenOn[name]) return seenOn[name];
    const found = {};
    const sh = ss_().getSheetByName(name);
    if (sh) {
      const hd = appHeaderIndex_(sh);
      const col = appColumnNamed_(hd, 'Name');
      if (col && sh.getLastRow() > 1) {
        sh.getRange(2, hd.map[col] + 1, sh.getLastRow() - 1, 1).getValues()
          .forEach(function (r) {
            const n = trim_(r[0]);
            if (n) found[norm_(n)] = true;
          });
      }
    }
    seenOn[name] = found;
    return found;
  };
  const twice = {};
  people.forEach(function (x) {
    const key = norm_(x.name) + ' -> ' + norm_(x.to);
    if (alreadyOn(x.to)[norm_(x.name)]) x.duplicate = 'already on ' + x.to;
    else if (twice[key]) x.duplicate = 'listed twice in this paste';
    twice[key] = true;
  });

  // Where each batch lands, and the row it would start at.
  const perTab = {};
  const tabOrder = [];
  people.forEach(function (x) {
    if (x.duplicate) return;
    if (!perTab[x.to]) { perTab[x.to] = 0; tabOrder.push(x.to); }
    perTab[x.to]++;
  });
  const destinations = tabOrder.map(function (name) {
    const sh = ss_().getSheetByName(name);
    return {
      tab: name,
      count: perTab[name],
      startRow: sh ? nextFreeRow_(sh) : 2,
      routed: people.some(function (x) { return x.to === name && x.routed; })
    };
  });
  if (bands.length && people.some(function (x) { return !x.routed; })) {
    warn('Some have no grade this spreadsheet has a tab for, so they are going to ' +
      tab + '. The tab name is what says which grades it holds, as in "5-8th".');
  }
  if (!bands.length) {
    warn('No tab is named after a grade band, so everyone is going to ' + tab + '. ' +
      'Name a tab "5-8th" or "1-4th" and applicants sort themselves between them.');
  }

  const wentBy = people.filter(function (x) { return x.preferred; })
    .map(function (x) { return x.preferred + ', not ' + x.given; });

  return {
    tab: tab,
    columns: columns,
    placed: columns.filter(function (c) { return c.target; }).length,
    unplaced: columns.filter(function (c) {
      return !c.target && (c.header || c.sample);
    }).length,
    fromValues: columns.filter(function (c) { return c.source === 'values'; }).length,
    targets: [''].concat(headers.order.filter(function (h) { return !isByHand_(h); })),
    byHand: headers.order.filter(isByHand_),
    fields: filling,
    people: people,
    destinations: destinations,
    wentBy: wentBy,
    adding: people.filter(function (p) { return !p.duplicate; }).length,
    warnings: warnings
  };
}

/**
 * Writes the paste onto the sheet.
 *
 * Reads the box again rather than trusting what the dialog was shown, so
 * what lands is what the preview was built from. Anyone already on the
 * sheet is skipped rather than written twice, and the columns she fills
 * in by hand are not in `filling` at all, so they are left as they are.
 */
function writePaste_(tab, text, overrides, starts) {
  return writeRead_(tab, readPaste_(tab, text, overrides), starts);
}

/** Writes rows that came from the landing tab rather than from the box. */
function writeGrid_(tab, gridRows, overrides, starts) {
  return writeRead_(tab, readGrid_(tab, gridRows, overrides), starts);
}

/**
 * Where the next batch should start on a tab.
 *
 * Not the last row with anything on it, which is what a sheet reports:
 * a legend, a total or a stray note below the list would push the batch
 * past it and leave a gap. This is the row after the last applicant, by
 * which is the last row carrying a name.
 */
function nextFreeRow_(sheet) {
  const headers = appHeaderIndex_(sheet);
  const nameCol = appColumnNamed_(headers, 'Name');
  const last = sheet.getLastRow();
  if (!nameCol || last < 2) return Math.max(last + 1, 2);
  const names = sheet.getRange(2, headers.map[nameCol] + 1, last - 1, 1).getValues();
  for (let i = names.length - 1; i >= 0; i--) {
    if (trim_(names[i][0])) return i + 3;
  }
  return 2;
}

/** Whether every cell in a block is empty, so writing there destroys nothing. */
function blockIsEmpty_(sheet, row, count, width) {
  if (row + count - 1 > sheet.getMaxRows()) return true;
  const values = sheet.getRange(row, 1, count, width).getValues();
  return values.every(function (r) {
    return r.every(function (c) { return c === '' || c === null; });
  });
}

/**
 * Writes the applicants, each to the tab their grade puts them on.
 *
 * A paste can hold both bands at once, so this writes a batch per tab
 * rather than one batch, and reads each tab for its own column order, so
 * two tabs laid out differently both come out right.
 *
 * `starts` is her own answer for where a tab's batch should begin. Where
 * the rows there are not empty they are pushed down rather than written
 * over, so naming a row can never cost her anything already on the
 * sheet.
 */
function writeRead_(tab, p, starts) {
  const fresh = p.people.filter(function (x) { return !x.duplicate; });
  if (!fresh.length) {
    throw new Error(p.people.length ?
      'Every one of them is on their sheet already. Nothing to add.' :
      'No applicants were found in the paste. Check the columns below.');
  }
  const want = starts || {};

  const byTab = {};
  const order = [];
  fresh.forEach(function (x) {
    const name = x.to || tab;
    if (!byTab[name]) { byTab[name] = []; order.push(name); }
    byTab[name].push(x);
  });

  const done = [];
  order.forEach(function (name) {
    const sheet = ss_().getSheetByName(name);
    if (!sheet) throw new Error('This spreadsheet has no tab called "' + name + '".');
    const headers = appHeaderIndex_(sheet);
    const width = Math.max(sheet.getLastColumn(), APP_COLUMNS_.length);

    const out = byTab[name].map(function (x) {
      const row = [];
      for (let i = 0; i < width; i++) row.push('');
      Object.keys(x.row).forEach(function (h) {
        if (isByHand_(h)) return;
        const at = headers.map[appColumnNamed_(headers, h) || h];
        if (at !== undefined && x.row[h] !== '') row[at] = x.row[h];
      });
      return row;
    });

    let startRow = Number(want[name]);
    if (!startRow || startRow < 2) startRow = nextFreeRow_(sheet);

    // Room to write at all.
    if (startRow + out.length - 1 > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(),
        startRow + out.length - 1 - sheet.getMaxRows());
    }
    // Something already there: push it down instead of over it.
    let pushed = false;
    if (!blockIsEmpty_(sheet, startRow, out.length, width)) {
      sheet.insertRowsBefore(startRow, out.length);
      pushed = true;
    }

    const range = sheet.getRange(startRow, 1, out.length, width);
    range.setValues(out);
    plainText_(range);

    // A cell holding a real date is formatted as one, so the column reads
    // and sorts as dates instead of as text. Only the rows just written.
    const dateAt = {};
    out.forEach(function (row) {
      row.forEach(function (cell, i) { if (cell instanceof Date) dateAt[i] = true; });
    });
    Object.keys(dateAt).forEach(function (i) {
      sheet.getRange(startRow, Number(i) + 1, out.length, 1).setNumberFormat('M/d/yyyy');
    });

    done.push({
      tab: name,
      added: out.length,
      startRow: startRow,
      pushed: pushed,
      names: byTab[name].map(function (x) { return x.name; })
    });
  });

  rememberMap_(p.columns);

  return {
    added: fresh.length,
    skipped: p.people.length - fresh.length,
    tab: done.map(function (d) { return d.tab; }).join(', '),
    startRow: done[0].startRow,
    names: fresh.map(function (x) { return x.name; }),
    landed: done,
    warnings: p.warnings
  };
}

/* =========================================================
 * How the rows look
 *
 * A copy out of Ravenna is a copy out of a web page, so it arrives
 * carrying the web page with it: a link comes in blue and underlined,
 * a table cell brings its own border, and a heading brings its own
 * size. None of that is wanted on the sheet, so every row this writes
 * is set back to plain text as it lands.
 * ========================================================= */

const APP_FONT_ = 'Lato';
const APP_FONT_SIZE_ = 12;

/** Lato 12, black, no underline, no border. */
function plainText_(range) {
  range.setFontFamily(APP_FONT_)
    .setFontSize(APP_FONT_SIZE_)
    .setFontColor('#000000')
    .setFontLine('none');
  range.setBorder(false, false, false, false, false, false);
}

/**
 * The same treatment for rows that are already there.
 *
 * For the applicants pasted in by hand before this existed, which came
 * in underlined and bordered and have stayed that way. Row 1 is left
 * alone, since the headings are meant to look different.
 */
function tidyFormatting() {
  const sheet = ss_().getActiveSheet();
  const last = sheet.getLastRow();
  if (last < 2) {
    alert_('There is nothing below the headings on "' + sheet.getName() + '" to tidy.');
    return;
  }
  const width = Math.max(sheet.getLastColumn(), APP_COLUMNS_.length);
  plainText_(sheet.getRange(2, 1, last - 1, width));
  alert_('Rows 2 to ' + last + ' of "' + sheet.getName() + '" are now ' + APP_FONT_ + ' ' +
    APP_FONT_SIZE_ + ', black, with no underline and no border.\n\n' +
    'The headings in row 1 were left as they are.');
}

/* =========================================================
 * Which sheet an applicant belongs on
 *
 * The applications are kept on a tab per grade band, "5-8th" and the
 * rest. Those names already say which grades they hold, so the name is
 * the setting: there is nothing to fill in, and renaming a tab or adding
 * one is all it takes for this to follow.
 *
 * An applicant goes to the tab whose band covers the grade they are
 * applying to. Where no tab covers it, or the grade is missing, they go
 * to the one chosen in the dialog and the dialog says so.
 * ========================================================= */

/**
 * A grade as a number, so bands can be compared.
 *
 * K is 0 and everything before it is below that, which keeps the order
 * right without a special case anywhere else. Spelled out or
 * abbreviated, both are read.
 */
function gradeNumber_(v) {
  const t = norm_(v);
  if (!t) return null;
  if (/^(pre[-\s]?k|p-?k|t-?k|transitional)/.test(t)) return -1;
  if (/^(k(\b|$)|kindergarten)/.test(t)) return 0;
  const m = /(\d{1,2})/.exec(t);
  return m ? Number(m[1]) : null;
}

/**
 * The grades a tab holds, read out of its own name.
 *
 * "5-8th" is five to eight, "1-4" is one to four, "K-4" starts at
 * kindergarten. A division name is taken too, since a tab called Middle
 * School means the same thing. A name that says nothing about grades
 * takes nobody automatically, which is right for a tab like Notes.
 */
function tabGradeRange_(name) {
  const t = norm_(name);
  const one = '(pre-?k|p-?k|t-?k|k|\\d{1,2})';
  const ord = '\\s*(?:st|nd|rd|th)?';

  // A band of several years: "5-8th", "1-4", "K-4", "PK through 4". The
  // guards either side keep a year in a title, like "2025-2026", out.
  const m = new RegExp('(?:^|[^0-9a-z])' + one + ord +
    '\\s*(?:-|to|through|thru)\\s*' + one + ord + '(?:[^0-9a-z]|$)').exec(t);
  if (m) {
    const lo = gradeNumber_(m[1]);
    const hi = gradeNumber_(m[2]);
    if (lo !== null && hi !== null && lo <= hi) return { lo: lo, hi: hi };
  }

  // A tab for one year only, which is a band of one: a K tab and a
  // Pre-K tab sit beside 1-4th and 5-8th and take only their own.
  if (/^pre[-\s]?k(indergarten)?$/.test(t)) return { lo: -1, hi: -1 };
  if (/^(k|kindergarten)$/.test(t)) return { lo: 0, hi: 0 };
  const single = new RegExp('^' + one + ord + '(?:\\s*grade(?:rs)?)?$').exec(t);
  if (single) {
    const g = gradeNumber_(single[1]);
    if (g !== null) return { lo: g, hi: g };
  }

  if (/\bmiddle\b/.test(t)) return { lo: 5, hi: 8 };
  if (/\blower\b/.test(t)) return { lo: -1, hi: 4 };
  if (/\bupper\b|\bhigh\b/.test(t)) return { lo: 9, hi: 12 };
  return null;
}

/** Every tab that names a grade band, with the band it names. */
function gradeTabs_() {
  const out = [];
  ss_().getSheets().forEach(function (sh) {
    const name = sh.getName();
    if (name === PASTE_TAB_) return;
    const band = tabGradeRange_(name);
    if (band) out.push({ name: name, lo: band.lo, hi: band.hi });
  });
  return out;
}

/** The tab a grade belongs on, or '' where no tab covers it. */
function tabForGrade_(grade, bands) {
  if (grade === null) return '';
  let best = '';
  let span = Infinity;
  bands.forEach(function (b) {
    if (grade < b.lo || grade > b.hi) return;
    if (b.hi - b.lo < span) { span = b.hi - b.lo; best = b.name; }
  });
  return best;
}

/* =========================================================
 * The landing tab
 *
 * A dialog is a frame inside the page, and a browser will often not let
 * anything inside one reach the clipboard. Where it also will not let
 * the keys through, there is no way to paste into the box at all, and
 * no amount of work on the dialog changes that.
 *
 * A spreadsheet cell has no such trouble: pasting into a grid is the one
 * thing Google Sheets is certain to allow. So the applicants land on a
 * tab of their own, and the command reads them from there. No clipboard,
 * no keystroke into a frame, nothing that can be refused.
 * ========================================================= */

const PASTE_TAB_ = 'Paste Here';

/** Opens the landing tab, empty, with the cursor in A1. */
function openPasteTab() {
  let sheet = ss_().getSheetByName(PASTE_TAB_);
  if (!sheet) sheet = ss_().insertSheet(PASTE_TAB_);
  sheet.clear();
  ss_().setActiveSheet(sheet);
  try { sheet.setActiveSelection('A1'); } catch (err) { /* selection is a nicety */ }
  alert_('The "' + PASTE_TAB_ + '" tab is open and empty, with the cursor in A1.\n\n' +
    'Paste your Ravenna block straight in, the ordinary way.\n\n' +
    'Then choose Admissions, then "Step 2: sort what I pasted".\n\n' +
    'This tab is only somewhere to land. Nothing is kept on it, and it is ' +
    'emptied once the rows are added.');
}

/**
 * What is sitting on the landing tab, as rows.
 *
 * A date pasted into a cell arrives as a real date and is kept as one,
 * since that is what Core Submitted wants. Everything else is taken as
 * the text it shows.
 */
function pastedRows_() {
  const sheet = ss_().getSheetByName(PASTE_TAB_);
  if (!sheet) return [];
  const last = sheet.getLastRow();
  const wide = sheet.getLastColumn();
  if (last < 1 || wide < 1) return [];
  return sheet.getRange(1, 1, last, wide).getValues().map(function (r) {
    return r.map(function (c) { return c instanceof Date ? c : trim_(c); });
  }).filter(function (r) {
    return r.some(function (c) { return c !== ''; });
  });
}

function clearPasteTab_() {
  const sheet = ss_().getSheetByName(PASTE_TAB_);
  if (sheet) sheet.clear();
}

/* =========================================================
 * Building the sheet, for a spreadsheet that has no tab yet
 * ========================================================= */

function setUpApplicationsSheet() {
  const name = 'Applications';
  let sheet = ss_().getSheetByName(name);
  if (!sheet) sheet = ss_().insertSheet(name);
  if (sheet.getLastRow() > 0 && trim_(sheet.getRange(1, 1).getValue())) {
    alert_('The ' + name + ' tab already has headings in row 1, so nothing was changed.\n\n' +
      'Paste from Ravenna reads those headings, whatever they say, so it should work as it ' +
      'is.');
    return;
  }
  sheet.getRange(1, 1, 1, APP_COLUMNS_.length).setValues([APP_COLUMNS_])
    .setFontWeight('bold').setBackground('#a8322a').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  APP_BY_HAND_.forEach(function (h) {
    sheet.getRange(1, APP_COLUMNS_.indexOf(h) + 1)
      .setNote('Yours. Paste from Ravenna never writes to this column.');
  });
  sheet.autoResizeColumns(1, APP_COLUMNS_.length);
  ss_().setActiveSheet(sheet);
  sheet.getRange(1, 1, 1, APP_COLUMNS_.length).setFontFamily(APP_FONT_).setFontSize(APP_FONT_SIZE_);
  alert_('The ' + name + ' tab is ready, with the sixteen columns in order.\n\n' +
    'PI Date: through PI Notes are yours. Nothing pasted can write to them.');
}

function forgetColumnMemory() {
  forgetMap_();
  alert_('Forgotten. The next paste is read from Ravenna\'s headings again, as if for the ' +
    'first time.');
}

/* =========================================================
 * Menu and the dialog
 * ========================================================= */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Admissions')
    .addItem('Step 1: open the paste tab', 'openPasteTab')
    .addItem('Step 2: sort what I pasted...', 'showSortPastedDialog')
    .addSeparator()
    .addItem('Paste into a box instead...', 'showPasteDialog')
    .addSeparator()
    .addItem('Tidy the formatting on this tab', 'tidyFormatting')
    .addSeparator()
    .addItem('Set up the Applications tab', 'setUpApplicationsSheet')
    .addItem('Forget my column corrections', 'forgetColumnMemory')
    .addToUi();
}

const PASTE_CSS_ =
  'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222;margin:0;padding:16px;}' +
  'h2{font-size:15px;margin:0 0 4px;}' +
  'p.sub{color:#666;margin:0 0 14px;}' +
  'label{display:block;font-weight:bold;margin:12px 0 4px;}' +
  'textarea{width:100%;font-family:Menlo,Consolas,monospace;font-size:12px;padding:8px;' +
  'border:1px solid #bbb;border-radius:4px;box-sizing:border-box;}' +
  'select{font:inherit;padding:4px;border:1px solid #bbb;border-radius:4px;max-width:210px;}' +
  'button{font:inherit;padding:8px 16px;border-radius:4px;border:1px solid #a8322a;' +
  'background:#a8322a;color:#fff;cursor:pointer;margin-right:8px;}' +
  'button.ghost{background:#fff;color:#a8322a;}' +
  'button.big{padding:11px 22px;font-weight:bold;}' +
  'button[disabled]{opacity:.5;cursor:default;}' +
  'a.plain{color:#a8322a;cursor:pointer;text-decoration:underline;}' +
  'table{border-collapse:collapse;width:100%;font-size:12px;margin-top:6px;}' +
  'th{background:#a8322a;color:#fff;text-align:left;padding:4px 8px;white-space:nowrap;}' +
  'td{border:1px solid #e0e0e0;padding:4px 8px;vertical-align:top;}' +
  'tr.dupe td{background:#faf6f6;color:#999;}' +
  'td b.pref{color:#1f6b3a;}' +
  '.scroll{max-height:230px;overflow:auto;border:1px solid #e0e0e0;border-radius:6px;' +
  'margin-top:6px;}' +
  '.scroll table{margin:0;}' +
  '.scroll th{position:sticky;top:0;}' +
  '.status{background:#eef5ee;border:1px solid #bcd6bf;border-radius:6px;padding:10px 12px;' +
  'margin-top:14px;}' +
  '.status.thin{background:#fdf3e7;border-color:#e8c89a;}' +
  '.status b{font-size:14px;}' +
  '.status .line{margin-top:4px;color:#555;}' +
  '.warn{background:#fdf3e7;border:1px solid #e8c89a;border-radius:6px;padding:10px;' +
  'margin-top:12px;}' +
  '.warn b{color:#8a5a12;}' +
  '.warn ul{margin:6px 0 0;padding-left:20px;}' +
  '.mine{background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:10px;' +
  'margin-top:12px;color:#666;}' +
  '.free{background:#eef5ee;border:1px solid #bcd6bf;border-radius:6px;padding:10px;' +
  'margin-top:12px;}' +
  '.muted{color:#777;}' +
  '.guess{color:#777;font-size:11px;}' +
  '.guess.check{color:#8a5a12;}' +
  '.ver{font-size:11px;font-weight:normal;color:#fff;background:#a8322a;border-radius:9px;' +
  'padding:2px 8px;vertical-align:middle;margin-left:6px;letter-spacing:.04em;}' +
  '.dest{background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;' +
  'margin-top:12px;}' +
  '.dest .line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:3px 0;}' +
  '.dest .to{font-weight:bold;}' +
  '.dest input{width:70px;font:inherit;padding:4px 6px;border:1px solid #bbb;' +
  'border-radius:4px;text-align:right;}' +
  '.dest .why{color:#777;font-size:11px;}' +
  '.pasterow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 6px;}' +
  '.hint{margin-top:6px;font-size:12px;color:#8a5a12;min-height:16px;}' +
  'textarea:focus{outline:2px solid #a8322a;outline-offset:1px;}';

function showPasteDialog() { pasteDialog_(false); }
function showSortPastedDialog() { pasteDialog_(true); }

function pasteDialog_(fromTab) {
  const tabs = appTabs_();
  const best = bestAppTab_();
  const options = tabs.map(function (t) {
    return '<option value="' + t.name.replace(/"/g, '&quot;') + '"' +
      (t.name === best ? ' selected' : '') + '>' + t.name.replace(/</g, '&lt;') +
      ' (' + t.rows + ' row' + (t.rows === 1 ? '' : 's') + ')</option>';
  }).join('');

  const html =
    '<style>' + PASTE_CSS_ + '</style>' +
    '<h2>' + (fromTab ? 'Sort what you pasted' : 'Paste from Ravenna') +
    ' <span class="ver">' + APP_VERSION_ + '</span></h2>' +
    (fromTab ?
      '<p class="sub">Reading the <b>' + PASTE_TAB_ + '</b> tab. The rows below are what ' +
      'would go onto your sheet, sorted into your columns with the names worked out. Read ' +
      'them over and press Add. Nothing is written until you do, and the ' + PASTE_TAB_ +
      ' tab is emptied once it is.</p>' :
      '<p class="sub">Copy the applicants out of Ravenna and paste them below. The rows ' +
      'appear as soon as you do. If pasting here will not work, close this and use ' +
      'Step 1 and Step 2 on the Admissions menu instead, which pastes onto a tab.</p>') +
    '<label for="tab">When no tab is named for their grade, put them on</label>' +
    '<select id="tab" onchange="read(0)">' + options + '</select>' +
    (fromTab ? '' :
      '<label for="paste">Paste here</label>' +
      '<div class="pasterow">' +
      '<button class="ghost" onclick="pasteIn()">Paste from the clipboard</button>' +
      '<span class="muted">or click the box and press Cmd+V (Ctrl+V on Windows)</span>' +
      '</div>' +
      '<textarea id="paste" rows="5" placeholder="Click here, then press Cmd+V"></textarea>' +
      '<div id="hint" class="hint"></div>') +
    '<div class="pasterow">' +
    '<button onclick="read(1)">' +
    (fromTab ? 'Read the ' + PASTE_TAB_ + ' tab again' : 'Sort the rows') + '</button>' +
    '<span class="muted" id="count">' +
    (fromTab ? 'Reading the ' + PASTE_TAB_ + ' tab...' : 'Nothing in the box yet.') +
    '</span>' +
    '</div>' +
    '<div id="out"></div>' +
    '<script>' +
    'var OVER={},SEQ=0,TIMER=null,COLS=false,ROWS={};' +
    'function rowSet(el){var n=parseInt(el.value,10);' +
    'if(n>1){ROWS[el.getAttribute("data-tab")]=n;}}' +
    'var FROMTAB=' + (fromTab ? 'true' : 'false') + ';' +
    'function boxText(){var b=document.getElementById("paste");return b?b.value:"";}' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")' +
    '.replace(/>/g,"&gt;").replace(/"/g,"&quot;");}' +
    'function fail(e){document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+' +
    'esc(e.message)+"</b></div>";}' +
    'function count(m){document.getElementById("count").innerHTML=m;}' +
    'function read(pressed){var t=boxText();' +
    'if(!FROMTAB&&!t.replace(/\\s/g,"")){document.getElementById("out").innerHTML="";' +
    'count(pressed?"Nothing in the box to sort yet. Paste the applicants in first.":' +
    '"Nothing in the box yet.");return;}' +
    'var lines=t.replace(/\\s+$/,"").split("\\n").length;' +
    'var size=FROMTAB?"Reading the tab...":' +
    't.length+" characters, "+lines+" line"+(lines===1?"":"s")+".";' +
    'count(FROMTAB?"Reading the tab...":size+" Reading...");' +
    'var mine=++SEQ;' +
    'google.script.run.withSuccessHandler(function(p){if(mine!==SEQ){return;}' +
    'try{show(p);count(FROMTAB?"Read from the tab.":size);}' +
    'catch(err){count("");document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>The rows could not be drawn.</b><br>"+esc(err.message)+' +
    '"<br><span class=\'muted\'>Tell Claude this message and it can be fixed.</span></div>";}})' +
    '.withFailureHandler(function(e){if(mine===SEQ){count("");fail(e);}})' +
    '.api_readPaste(document.getElementById("tab").value,t,OVER,FROMTAB);}' +
    'function later(){clearTimeout(TIMER);TIMER=setTimeout(function(){read(0);},350);}' +
    'function remap(i,v){OVER[i]=v;COLS=true;read(0);}' +
    'function keepRows(p){if(!p.destinations){return;}' +
    'p.destinations.forEach(function(d){if(ROWS[d.tab]){d.startRow=ROWS[d.tab];}});}' +
    'function showCols(){COLS=!COLS;read(0);}' +

    // What it worked out, then the rows, then the button. The column
    // controls stay shut unless something needs her.
    'function show(p){if(!p){document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>The script sent nothing back.</b><br>It read your paste but ' +
    'could not hand the result to this window. Press Sort the rows to try again.</div>";' +
    'return;}keepRows(p);var h="";' +
    'var need=p.unplaced>0||p.fromValues>0;' +
    'if(COLS===false&&need){COLS=true;}' +
    'h+="<div class=\'status"+(p.adding?"":" thin")+"\'><b>"+p.people.length+" applicant"+' +
    '(p.people.length===1?"":"s")+" read, "+p.adding+" to add.</b>";' +
    'h+="<div class=\'line\'>"+p.placed+" of "+(p.placed+p.unplaced)+" columns sorted ' +
    'for you"+(p.unplaced?", "+p.unplaced+" it could not place":"")+". ";' +
    'h+="<a class=\'plain\' onclick=\'showCols()\'>"+(COLS?"Hide":"Check")+" the ' +
    'columns</a></div></div>";' +

    'if(p.wentBy&&p.wentBy.length){h+="<div class=\'mine\'><b>Went by the name in ' +
    'brackets:</b> "+esc(p.wentBy.join("; "))+".</div>";}' +

    'var many=p.destinations&&p.destinations.length>1;' +
    'if(p.people.length){h+="<div class=\'scroll\'><table><tr>";' +
    'if(many){h+="<th>Goes to</th>";}' +
    'p.fields.forEach(function(f){h+="<th>"+esc(f)+"</th>";});' +
    'h+="<th></th></tr>";' +
    'p.people.forEach(function(x){h+="<tr"+(x.duplicate?" class=\'dupe\'":"")+">";' +
    'if(many){h+="<td><b>"+esc(x.to||"")+"</b></td>";}' +
    'p.fields.forEach(function(f){var v=esc((x.shown&&x.shown[f])||"");' +
    'if(x.preferred&&f.indexOf("First")===0&&!x.duplicate){v="<b class=\'pref\'>"+v+"</b>";}' +
    'h+="<td>"+v+"</td>";});' +
    'h+="<td class=\'muted\'>"+esc(x.duplicate||"")+"</td></tr>";});' +
    'h+="</table></div>";}' +

    'if(p.destinations&&p.destinations.length){' +
    'h+="<div class=\'dest\'><b>Where they go</b>";' +
    'p.destinations.forEach(function(d){' +
    'h+="<div class=\'line\'><span class=\'to\'>"+d.count+" to "+esc(d.tab)+"</span>";' +
    'h+="<span>starting at row</span>";' +
    'h+="<input type=\'number\' min=\'2\' id=\'row_"+esc(d.tab)+"\' value=\'"+' +
    'd.startRow+"\' onchange=\'rowSet(this)\' data-tab=\'"+esc(d.tab)+"\'>";' +
    'h+="<span class=\'why\'>"+(d.routed?"the tab for that grade":"no tab for that grade, ' +
    'so the one chosen above")+"</span></div>";});' +
    'h+="<div class=\'why\' style=\'margin-top:6px;\'>Change a row and they start there ' +
    'instead. Anything already on those rows is pushed down, never written over.</div>";' +
    'h+="</div>";}' +
    'if(p.warnings.length){h+="<div class=\'warn\'><b>Worth a look:</b><ul>";' +
    'p.warnings.forEach(function(w){h+="<li>"+esc(w)+"</li>";});h+="</ul></div>";}' +

    'if(p.adding){h+="<div style=\'margin-top:14px;\'><button class=\'big\' id=\'add\' ' +
    'onclick=\'add()\'>Add "+p.adding+(many?"":" to "+esc(p.tab))+"</button>";' +
    'if(!FROMTAB){h+="<button class=\'ghost\' onclick=\'clearAll()\'>Clear</button>";}' +
    'h+="</div>";}' +

    'if(COLS){h+="<label>Where each column went</label>";' +
    'h+="<div class=\'scroll\'><table><tr><th>Your paste</th><th>First value</th>' +
    '<th>Goes to</th></tr>";' +
    'p.columns.forEach(function(c){' +
    'h+="<tr><td>"+(c.header?esc(c.header):"<span class=\'muted\'>column "+(c.index+1)+' +
    '"</span>")+"</td><td class=\'muted\'>"+esc(c.sample)+"</td><td>";' +
    'h+="<select onchange=\'remap("+c.index+",this.value)\'>";' +
    'p.targets.forEach(function(t){' +
    'h+="<option value=\\""+esc(t)+"\\""+(t===c.target?" selected":"")+">"+' +
    '(t?esc(t):"- leave this out -")+"</option>";});' +
    'h+="</select>";' +
    'if(c.target){h+="<div class=\'guess"+(c.source==="values"?" check":"")+"\'>"+' +
    '(c.source==="remembered"?"remembered from last time":' +
    'c.source==="yours"?"your choice, remembered when you add them":' +
    'c.source==="values"?"read from the values, worth a look":' +
    '"read from the heading")+"</div>";}' +
    'h+="</td></tr>";});' +
    'h+="</table></div>";' +
    'if(p.byHand&&p.byHand.length){h+="<div class=\'mine\'><b>Left alone, as always:</b> "+' +
    'esc(p.byHand.join(", "))+". No pasted column can be sent to these.</div>";}}' +

    'document.getElementById("out").innerHTML=h;}' +

    'function clearAll(){var b=document.getElementById("paste");if(b){b.value="";}' +
    'OVER={};COLS=false;document.getElementById("out").innerHTML="";' +
    'count(FROMTAB?"":"Nothing in the box yet.");}' +
    'function add(){document.getElementById("add").disabled=true;' +
    'google.script.run.withSuccessHandler(function(r){' +
    'var h="<div class=\'free\'><b>"+r.added+" added.</b>";' +
    'if(r.landed){r.landed.forEach(function(d){' +
    'h+="<br><b>"+d.added+" to "+esc(d.tab)+"</b>, from row "+d.startRow+' +
    '(d.pushed?" (the rows below were pushed down)":"")+": "+esc(d.names.join(", "));});}' +
    'if(r.skipped){h+="<br><span class=\'muted\'>"+r.skipped+" skipped as already there.' +
    '</span>";}' +
    'h+="<br><br><span class=\'muted\'>Paste the next lot in above whenever you are ready.' +
    '</span></div>";' +
    'var b2=document.getElementById("paste");if(b2){b2.value="";b2.focus();}' +
    'OVER={};COLS=false;ROWS={};SEQ++;count("");' +
    'document.getElementById("out").innerHTML=h;})' +
    '.withFailureHandler(function(e){var b=document.getElementById("add");' +
    'if(b){b.disabled=false;}fail(e);})' +
    '.api_writePaste(document.getElementById("tab").value,boxText(),OVER,FROMTAB,ROWS);}' +

    // Pasting is the whole command, so pasting is what sets it going.
    'function say(m){var h=document.getElementById("hint");if(h){h.innerHTML=m||"";}}' +
    'function takeIt(t){if(!t||!t.replace(/\\s/g,"")){' +
    'say("There was nothing on the clipboard. Copy the applicants out of Ravenna first.");' +
    'return;}var b=document.getElementById("paste");if(!b){return;}b.value=t;say("");read(0);}' +

    // A button can only reach the clipboard where the browser allows it,
    // which inside a Sheets dialog it often does not. When it cannot, the
    // box is put in front of her ready for the keys rather than failing.
    'function pasteIn(){' +
    'if(navigator.clipboard&&navigator.clipboard.readText){' +
    'navigator.clipboard.readText().then(takeIt,byHand);return;}byHand();}' +
    'function byHand(){var b=document.getElementById("paste");if(!b){return;}' +
    'b.focus();b.select();' +
    'say("Your browser will not let a button read the clipboard. The box below is ready ' +
    'and the cursor is in it, so press Cmd+V (or Ctrl+V) now.");}' +

    // Cmd+V anywhere in this dialog, not only inside the box. Without
    // this the keystroke goes to the spreadsheet behind the dialog when
    // the box does not happen to have the cursor.
    'document.addEventListener("paste",function(e){' +
    'var d=e.clipboardData||window.clipboardData;if(!d){return;}' +
    'var t=d.getData("text");if(!t){return;}' +
    'e.preventDefault();takeIt(t);});' +

    'var box=document.getElementById("paste");' +
    'if(box){box.addEventListener("input",later);' +
    'box.addEventListener("focus",function(){say("");});box.focus();}' +
    'if(FROMTAB){read(0);}' +
    '<\/script>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(820).setHeight(720),
    fromTab ? 'Sort what you pasted' : 'Paste from Ravenna');
}

/**
 * The preview, cut down to what can cross to the dialog.
 *
 * Whatever a script hands a dialog has to survive being turned into
 * plain data first. A cell holding a real date does not survive it, and
 * when any part of the answer cannot be converted the dialog is handed
 * nothing at all rather than a partial answer - which is why a date in
 * Core Submitted stopped the rows appearing and said nothing about it.
 *
 * So the dates stay on this side, where writing needs them, and the
 * dialog is sent the printed version and nothing else. Everything here
 * is a string, a number or an array of them, on purpose: it is the only
 * way to be sure the answer arrives.
 */
/** Rows from the landing tab when `fromTab`, otherwise from the box. */
function api_readPaste(tab, text, overrides, fromTab) {
  let p;
  if (fromTab) {
    const rows = pastedRows_();
    if (!rows.length) {
      throw new Error('The "' + PASTE_TAB_ + '" tab is empty. Choose "Step 1: open the ' +
        'paste tab", paste your applicants onto it, then come back here.');
    }
    p = readGrid_(tab, rows, overrides);
  } else {
    p = readPaste_(tab, text, overrides);
  }
  const str = function (v) { return String(v == null ? '' : v); };
  return {
    tab: str(p.tab),
    placed: Number(p.placed),
    unplaced: Number(p.unplaced),
    fromValues: Number(p.fromValues),
    adding: Number(p.adding),
    columns: p.columns.map(function (c) {
      return {
        index: Number(c.index),
        header: str(c.header),
        sample: str(c.sample),
        target: str(c.target),
        source: str(c.source)
      };
    }),
    targets: p.targets.map(str),
    byHand: p.byHand.map(str),
    fields: p.fields.map(str),
    people: p.people.map(function (x) {
      const shown = {};
      p.fields.forEach(function (f) { shown[f] = str(x.shown[f]); });
      return {
        name: str(x.name),
        shown: shown,
        duplicate: str(x.duplicate),
        preferred: str(x.preferred),
        to: str(x.to)
      };
    }),
    destinations: p.destinations.map(function (d) {
      return {
        tab: str(d.tab),
        count: Number(d.count),
        startRow: Number(d.startRow),
        routed: d.routed ? 1 : 0
      };
    }),
    wentBy: p.wentBy.map(str),
    warnings: p.warnings.map(str)
  };
}

function api_writePaste(tab, text, overrides, fromTab, starts) {
  let r;
  if (fromTab) {
    const rows = pastedRows_();
    if (!rows.length) throw new Error('The "' + PASTE_TAB_ + '" tab is empty.');
    r = writeGrid_(tab, rows, overrides, starts);
    clearPasteTab_();
  } else {
    r = writePaste_(tab, text, overrides, starts);
  }
  return {
    added: Number(r.added),
    skipped: Number(r.skipped),
    startRow: Number(r.startRow),
    tab: String(r.tab),
    names: r.names.map(function (n) { return String(n); }),
    landed: r.landed.map(function (d) {
      return {
        tab: String(d.tab),
        added: Number(d.added),
        startRow: Number(d.startRow),
        pushed: d.pushed ? 1 : 0,
        names: d.names.map(function (n) { return String(n); })
      };
    }),
    warnings: r.warnings.map(function (w) { return String(w); })
  };
}

/* =========================================================
 * END OF FILE
 *
 * If you cannot see this block at the bottom of the Apps Script editor,
 * the paste stopped early and the script will not run at all. Select
 * everything in the editor, delete it, and copy the script again.
 *
 * If it IS here and the Admissions menu still does not appear:
 *   - Save, then reload the spreadsheet tab. The menu is only built
 *     when the file opens.
 *   - Check this is the applications spreadsheet's own script project,
 *     not the tour scheduler's. Both define onOpen, and a project with
 *     two of them refuses to load anything at all.
 *   - Check nothing else is left in the editor above this file.
 * ========================================================= */
