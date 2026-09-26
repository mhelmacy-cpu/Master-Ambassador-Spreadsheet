/**
 * Ravenna paste, formatted into the applications sheet.
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
    'applying to', 'grade applying to', 'grades applying to', 'applying to grade',
    'division', 'division applying to', 'school applying to', 'applying']],
  ['App. Type', ['app type', 'app. type', 'application type', 'applicant type', 'type',
    'admission type', 'candidate type', 'inquiry type']],
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
  return ss_().getSheets().map(function (s) {
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

function isGenderWord_(v) { return GENDER_WORDS_.indexOf(norm_(v)) !== -1; }

/** One year: 6, 6th, Grade 6, K, PK, PreK, TK. */
const ONE_GRADE_ = '(pre-?k|p-?k|t-?k|k|\\d{1,2}(st|nd|rd|th)?)';

/**
 * A span of years: 1-5, 1st-5th, K-5, 1-4th, PK through 4.
 *
 * A range is always what they have already done, never what they are
 * applying to, so it is Grades Attended and it is checked first.
 */
function isGradeRange_(v) {
  return new RegExp('^' + ONE_GRADE_ + '\\s*(-|to|through|thru)\\s*' + ONE_GRADE_ + '$', 'i')
    .test(trim_(v));
}

/**
 * The grade being applied to.
 *
 * A single number is the plain case: 6 means applying to 6th. Ravenna
 * also writes it as a division and the years within it, "Middle School,
 * 5,6" or "Lower School, 1,2", which is the same column said the long
 * way. A range is not this, which is why it is ruled out first.
 */
function isAppliedGrade_(v) {
  const t = trim_(v);
  if (!t || isGradeRange_(t)) return false;
  if (new RegExp('^(grade\\s*)?' + ONE_GRADE_ + '(\\s*grade)?$', 'i').test(t)) return true;
  const division = '(lower|middle|upper|high|primary|elementary|senior|junior)\\s+school';
  return new RegExp('^' + division + '\\s*[,:]', 'i').test(t) ||
    new RegExp('^' + division + '$', 'i').test(t);
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
  const sheet = ss_().getSheetByName(tab);
  if (!sheet) throw new Error('This spreadsheet has no tab called "' + tab + '".');
  const headers = appHeaderIndex_(sheet);
  const grid = pasteGrid_(text);
  if (!grid.rows.length) {
    throw new Error('Nothing in the box yet. Copy the applicants out of Ravenna and paste ' +
      'them in.');
  }

  const hasHeaders = looksLikeHeaders_(grid.rows[0], headers);
  const headerRow = hasHeaders ? grid.rows[0] : [];
  const dataRows = hasHeaders ? grid.rows.slice(1) : grid.rows;
  const width = grid.rows.reduce(function (w, r) { return Math.max(w, r.length); }, 0);
  const picked = overrides || {};

  const columns = [];
  for (let i = 0; i < width; i++) {
    const header = trim_(headerRow[i] || '');
    let sample = '';
    for (let r = 0; r < dataRows.length && !sample; r++) sample = trim_(dataRows[r][i] || '');
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

  // Anything the headings did not place, worked out from its own values.
  const taken = {};
  columns.forEach(function (c) { if (c.target) taken[c.target] = true; });
  columns.forEach(function (c) {
    if (c.target || picked[String(c.index)] !== undefined) return;
    const values = [];
    dataRows.forEach(function (r) {
      const v = trim_(r[c.index] || '');
      if (v) values.push(v);
    });
    const guess = targetFromValues_(values, headers, taken);
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

  const at = function (row, target) {
    let v = '';
    if (!target) return v;
    columns.forEach(function (c) {
      if (c.target === target && trim_(row[c.index] || '')) v = trim_(row[c.index]);
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

  // Anyone already on the sheet, and anyone listed twice in the paste.
  const already = {};
  if (nameCol && sheet.getLastRow() > 1) {
    sheet.getRange(2, headers.map[nameCol] + 1, sheet.getLastRow() - 1, 1).getValues()
      .forEach(function (r) {
        const n = trim_(r[0]);
        if (n) already[norm_(n)] = true;
      });
  }
  const twice = {};
  people.forEach(function (p) {
    const key = norm_(p.name);
    if (already[key]) p.duplicate = 'already on the sheet';
    else if (twice[key]) p.duplicate = 'listed twice in this paste';
    twice[key] = true;
  });

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
function writePaste_(tab, text, overrides) {
  const p = readPaste_(tab, text, overrides);
  const fresh = p.people.filter(function (x) { return !x.duplicate; });
  if (!fresh.length) {
    throw new Error(p.people.length ?
      'Every one of them is on the sheet already. Nothing to add.' :
      'No applicants were found in the paste. Check the columns below.');
  }
  const sheet = ss_().getSheetByName(tab);
  const headers = appHeaderIndex_(sheet);
  const width = Math.max(sheet.getLastColumn(), APP_COLUMNS_.length);

  const out = fresh.map(function (x) {
    const row = [];
    for (let i = 0; i < width; i++) row.push('');
    Object.keys(x.row).forEach(function (h) {
      if (isByHand_(h)) return;
      const i = headers.map[h];
      if (i !== undefined && x.row[h] !== '') row[i] = x.row[h];
    });
    return row;
  });

  const startRow = sheet.getLastRow() + 1;
  if (startRow + out.length - 1 > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), startRow + out.length - 1 - sheet.getMaxRows());
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

  rememberMap_(p.columns);

  return {
    added: fresh.length,
    skipped: p.people.length - fresh.length,
    names: fresh.map(function (x) { return x.name; }),
    startRow: startRow,
    tab: tab,
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
    .addItem('Paste from Ravenna...', 'showPasteDialog')
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
  '.pasterow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 6px;}' +
  '.hint{margin-top:6px;font-size:12px;color:#8a5a12;min-height:16px;}' +
  'textarea:focus{outline:2px solid #a8322a;outline-offset:1px;}';

function showPasteDialog() {
  const tabs = appTabs_();
  const best = bestAppTab_();
  const options = tabs.map(function (t) {
    return '<option value="' + t.name.replace(/"/g, '&quot;') + '"' +
      (t.name === best ? ' selected' : '') + '>' + t.name.replace(/</g, '&lt;') +
      ' (' + t.rows + ' row' + (t.rows === 1 ? '' : 's') + ')</option>';
  }).join('');

  const html =
    '<style>' + PASTE_CSS_ + '</style>' +
    '<h2>Paste from Ravenna</h2>' +
    '<p class="sub">Copy the applicants out of Ravenna and paste them below. The rows ' +
    'appear as soon as you do, sorted into your columns, with the names worked out. ' +
    'Read them over and press Add. Nothing reaches the sheet until you do.</p>' +
    '<label for="tab">Add them to</label>' +
    '<select id="tab" onchange="read()">' + options + '</select>' +
    '<label for="paste">Paste here</label>' +
    '<div class="pasterow">' +
    '<button class="ghost" onclick="pasteIn()">Paste from the clipboard</button>' +
    '<span class="muted">or click the box and press Cmd+V (Ctrl+V on Windows)</span>' +
    '</div>' +
    '<textarea id="paste" rows="5" placeholder="Click here, then press Cmd+V"></textarea>' +
    '<div id="hint" class="hint"></div>' +
    '<div id="out"></div>' +
    '<script>' +
    'var OVER={},SEQ=0,TIMER=null,COLS=false;' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")' +
    '.replace(/>/g,"&gt;").replace(/"/g,"&quot;");}' +
    'function fail(e){document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+' +
    'esc(e.message)+"</b></div>";}' +
    'function read(){var t=document.getElementById("paste").value;' +
    'if(!t.replace(/\\s/g,"")){document.getElementById("out").innerHTML="";return;}' +
    'var mine=++SEQ;' +
    'google.script.run.withSuccessHandler(function(p){if(mine===SEQ){show(p);}})' +
    '.withFailureHandler(function(e){if(mine===SEQ){fail(e);}})' +
    '.api_readPaste(document.getElementById("tab").value,t,OVER);}' +
    'function later(){clearTimeout(TIMER);TIMER=setTimeout(read,350);}' +
    'function remap(i,v){OVER[i]=v;COLS=true;read();}' +
    'function showCols(){COLS=!COLS;read();}' +

    // What it worked out, then the rows, then the button. The column
    // controls stay shut unless something needs her.
    'function show(p){var h="";' +
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

    'if(p.people.length){h+="<div class=\'scroll\'><table><tr>";' +
    'p.fields.forEach(function(f){h+="<th>"+esc(f)+"</th>";});' +
    'h+="<th></th></tr>";' +
    'p.people.forEach(function(x){h+="<tr"+(x.duplicate?" class=\'dupe\'":"")+">";' +
    'p.fields.forEach(function(f){var v=esc((x.shown&&x.shown[f])||"");' +
    'if(x.preferred&&f.indexOf("First")===0&&!x.duplicate){v="<b class=\'pref\'>"+v+"</b>";}' +
    'h+="<td>"+v+"</td>";});' +
    'h+="<td class=\'muted\'>"+esc(x.duplicate||"")+"</td></tr>";});' +
    'h+="</table></div>";}' +

    'if(p.warnings.length){h+="<div class=\'warn\'><b>Worth a look:</b><ul>";' +
    'p.warnings.forEach(function(w){h+="<li>"+esc(w)+"</li>";});h+="</ul></div>";}' +

    'if(p.adding){h+="<div style=\'margin-top:14px;\'><button class=\'big\' id=\'add\' ' +
    'onclick=\'add()\'>Add "+p.adding+" to "+esc(p.tab)+"</button>";' +
    'h+="<button class=\'ghost\' onclick=\'clearAll()\'>Clear</button></div>";}' +

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

    'function clearAll(){document.getElementById("paste").value="";OVER={};COLS=false;' +
    'document.getElementById("out").innerHTML="";}' +
    'function add(){document.getElementById("add").disabled=true;' +
    'google.script.run.withSuccessHandler(function(r){' +
    'var h="<div class=\'free\'><b>"+r.added+" added to "+esc(r.tab)+"</b>, from row "+' +
    'r.startRow+".<br>"+esc(r.names.join(", "));' +
    'if(r.skipped){h+="<br><span class=\'muted\'>"+r.skipped+" skipped as already there.' +
    '</span>";}' +
    'h+="<br><br><span class=\'muted\'>Paste the next lot in above whenever you are ready.' +
    '</span></div>";' +
    'document.getElementById("paste").value="";OVER={};COLS=false;SEQ++;' +
    'document.getElementById("out").innerHTML=h;' +
    'var b2=document.getElementById("paste");b2.focus();})' +
    '.withFailureHandler(function(e){var b=document.getElementById("add");' +
    'if(b){b.disabled=false;}fail(e);})' +
    '.api_writePaste(document.getElementById("tab").value,' +
    'document.getElementById("paste").value,OVER);}' +

    // Pasting is the whole command, so pasting is what sets it going.
    'function say(m){document.getElementById("hint").innerHTML=m||"";}' +
    'function takeIt(t){if(!t||!t.replace(/\\s/g,"")){' +
    'say("There was nothing on the clipboard. Copy the applicants out of Ravenna first.");' +
    'return;}var b=document.getElementById("paste");b.value=t;say("");read();}' +

    // A button can only reach the clipboard where the browser allows it,
    // which inside a Sheets dialog it often does not. When it cannot, the
    // box is put in front of her ready for the keys rather than failing.
    'function pasteIn(){' +
    'if(navigator.clipboard&&navigator.clipboard.readText){' +
    'navigator.clipboard.readText().then(takeIt,byHand);return;}byHand();}' +
    'function byHand(){var b=document.getElementById("paste");b.focus();b.select();' +
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
    'box.addEventListener("input",later);' +
    'box.addEventListener("focus",function(){say("");});' +
    'box.focus();' +
    '<\/script>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(820).setHeight(720), 'Paste from Ravenna');
}

function api_readPaste(tab, text, overrides) { return readPaste_(tab, text, overrides); }
function api_writePaste(tab, text, overrides) { return writePaste_(tab, text, overrides); }
