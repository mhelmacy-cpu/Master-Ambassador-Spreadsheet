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
    'child', 'child name', 'candidate', 'candidate name', 'applicant full name']],
  ['App. Grade', ['app grade', 'app. grade', 'application grade', 'entry grade',
    'entering grade', 'grade applying for', 'applying for', 'applying for grade',
    'applying grade', 'admit grade', 'grade level', 'grade', 'entry year']],
  ['App. Type', ['app type', 'app. type', 'application type', 'applicant type', 'type',
    'admission type', 'candidate type', 'inquiry type']],
  ['Core Submitted', ['core submitted', 'core app submitted', 'core application submitted',
    'core application', 'core app', 'core', 'application submitted', 'submitted',
    'date submitted', 'core status', 'application status', 'status']],
  ['Gender', ['gender', 'sex', 'student gender', 'child gender', 'gender identity']],
  ['School', ['school', 'current school', 'present school', 'school name', 'sending school',
    'current school name', 'previous school', 'school attending']],
  ['Grades Attended', ['grades attended', 'grade attended', 'years attended',
    'grades at current school', 'grade range', 'attended']],
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
 * The three name cells, from whatever the paste gave.
 *
 * What the paste carries is kept. Only the blanks are worked out, so a
 * Ravenna report that already has a first and a last column is never
 * second-guessed.
 */
function readNames_(whole, first, last) {
  let f = fixCase_(trim_(first));
  let l = fixCase_(trim_(last));
  let n = fixCase_(unflipName_(whole));
  if (!n && (f || l)) n = trim_(f + ' ' + l);
  if (n && (!f || !l)) {
    const halves = splitName_(n);
    if (!f) f = halves.first;
    if (!l) l = halves.last;
  }
  return { name: n, first: f, last: l };
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

  const warnings = [];
  const warn = function (m) { if (warnings.indexOf(m) === -1) warnings.push(m); };

  if (!hasHeaders) {
    warn('The first line does not read like Ravenna headings, so it was treated as an ' +
      'applicant. Set the columns by hand above.');
  }
  columns.forEach(function (c) {
    if (c.target || !c.header || !c.sample) return;
    warn('Column "' + c.header + '" was left out. Nothing here knows what it is, so set ' +
      'it above if it belongs on the sheet.');
  });
  const seen = {};
  columns.forEach(function (c) {
    if (!c.target) return;
    if (seen[c.target]) {
      warn('Two columns are both going to ' + c.target + ', so the later one wins. Send ' +
        'one of them to "leave this out" if that is wrong.');
    }
    seen[c.target] = true;
  });

  // The columns actually being filled, in the sheet's own order.
  const filling = headers.order.filter(function (h) { return seen[h]; });
  const nameCol = appColumnNamed_(headers, 'Name');
  const firstCol = appColumnNamed_(headers, 'First Name');
  const lastCol = appColumnNamed_(headers, 'Last Name');
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
    const out = {};
    filling.forEach(function (h) {
      if (h === nameCol) out[h] = names.name;
      else if (h === firstCol) out[h] = names.first;
      else if (h === lastCol) out[h] = names.last;
      else out[h] = at(row, h);
    });
    if (firstCol && lastCol && !names.last) {
      warn(names.name + ' is one word, so Last Name was left blank.');
    }
    people.push({ name: names.name, row: out });
  });

  if (unnamed.length) {
    warn('Line' + (unnamed.length > 1 ? 's ' : ' ') + unnamed.join(', ') + ' had no name, ' +
      'so ' + (unnamed.length > 1 ? 'they were' : 'it was') + ' left out.');
  }
  if (!people.length && dataRows.length) {
    warn('No name was found in any line. Check that a column is pointed at Name, or at ' +
      'First Name and Last Name, above.');
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

  return {
    tab: tab,
    columns: columns,
    targets: [''].concat(headers.order.filter(function (h) { return !isByHand_(h); })),
    byHand: headers.order.filter(isByHand_),
    fields: filling,
    people: people,
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
      'No applicants were found in the paste. Check the columns above.');
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
  'button[disabled]{opacity:.5;cursor:default;}' +
  'table{border-collapse:collapse;width:100%;font-size:12px;margin-top:6px;}' +
  'th{background:#a8322a;color:#fff;text-align:left;padding:4px 8px;white-space:nowrap;}' +
  'td{border:1px solid #e0e0e0;padding:4px 8px;vertical-align:top;}' +
  'tr.dupe td{background:#faf6f6;color:#999;}' +
  '.scroll{max-height:240px;overflow:auto;border:1px solid #e0e0e0;border-radius:6px;' +
  'margin-top:6px;}' +
  '.scroll table{margin:0;}' +
  '.scroll th{position:sticky;top:0;}' +
  '.warn{background:#fdf3e7;border:1px solid #e8c89a;border-radius:6px;padding:10px;' +
  'margin-top:12px;}' +
  '.warn b{color:#8a5a12;}' +
  '.warn ul{margin:6px 0 0;padding-left:20px;}' +
  '.free{background:#eef5ee;border:1px solid #bcd6bf;border-radius:6px;padding:10px;' +
  'margin-top:12px;}' +
  '.mine{background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:10px;' +
  'margin-top:12px;color:#666;}' +
  '.muted{color:#777;}' +
  '.guess{color:#777;font-size:11px;}';

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
    '<p class="sub">Copy the applicants out of Ravenna, headings and all, and paste them ' +
    'here. It sorts them into your columns, works out the names, and shows you the rows ' +
    'before any of it reaches the sheet. They land in ' + APP_FONT_ + ' ' + APP_FONT_SIZE_ +
    ', black, with no underline and no border, whatever Ravenna sent along with them.</p>' +
    '<label for="tab">Add them to</label>' +
    '<select id="tab" onchange="clearOut()">' + options + '</select>' +
    '<label for="paste">What you copied</label>' +
    '<textarea id="paste" rows="7" placeholder="Paste here"></textarea>' +
    '<div style="margin-top:12px;">' +
    '<button id="go" onclick="read()">Read it</button>' +
    '<button class="ghost" onclick="document.getElementById(\'paste\').value=\'\';clearOut();">' +
    'Clear</button></div>' +
    '<div id="out"></div>' +
    '<script>' +
    'var OVER={};' +
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;")' +
    '.replace(/>/g,"&gt;").replace(/"/g,"&quot;");}' +
    'function clearOut(){OVER={};document.getElementById("out").innerHTML="";}' +
    'function fail(e){document.getElementById("go").disabled=false;' +
    'document.getElementById("out").innerHTML="<div class=\'warn\'><b>"+esc(e.message)+' +
    '"</b></div>";}' +
    'function read(){var t=document.getElementById("paste").value;' +
    'if(!t.replace(/\\s/g,"")){document.getElementById("out").innerHTML=' +
    '"<div class=\'warn\'><b>Nothing in the box yet.</b></div>";return;}' +
    'document.getElementById("go").disabled=true;' +
    'document.getElementById("out").innerHTML="<p class=\'muted\'>Reading it...</p>";' +
    'google.script.run.withSuccessHandler(show).withFailureHandler(fail)' +
    '.api_readPaste(document.getElementById("tab").value,t,OVER);}' +
    'function remap(i,v){OVER[i]=v;read();}' +
    'function show(p){document.getElementById("go").disabled=false;' +
    'var h="<label>What each column you pasted was taken to mean</label>";' +
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
    'if(c.target){h+="<div class=\'guess\'>"+(c.source==="remembered"?"remembered from ' +
    'last time":c.source==="yours"?"your choice, remembered when you add them":' +
    '"read from the heading")+"</div>";}' +
    'h+="</td></tr>";});' +
    'h+="</table></div>";' +
    'if(p.byHand&&p.byHand.length){h+="<div class=\'mine\'><b>Left alone, as always:</b> "+' +
    'esc(p.byHand.join(", "))+". No pasted column can be sent to these.</div>";}' +
    'h+="<label>"+p.people.length+" applicant"+(p.people.length===1?"":"s")+" read, "+' +
    'p.adding+" to add</label>";' +
    'if(p.people.length){' +
    'h+="<div class=\'scroll\'><table><tr>";' +
    'p.fields.forEach(function(f){h+="<th>"+esc(f)+"</th>";});' +
    'h+="<th></th></tr>";' +
    'p.people.forEach(function(x){h+="<tr"+(x.duplicate?" class=\'dupe\'":"")+">";' +
    'p.fields.forEach(function(f){h+="<td>"+esc(x.row[f]||"")+"</td>";});' +
    'h+="<td class=\'muted\'>"+esc(x.duplicate||"")+"</td></tr>";});' +
    'h+="</table></div>";}' +
    'if(p.warnings.length){h+="<div class=\'warn\'><b>Worth a look:</b><ul>";' +
    'p.warnings.forEach(function(w){h+="<li>"+esc(w)+"</li>";});h+="</ul></div>";}' +
    'if(p.adding){h+="<div style=\'margin-top:14px;\'><button id=\'add\' onclick=\'add()\'>Add "+' +
    'p.adding+" to "+esc(p.tab)+"</button></div>";}' +
    'document.getElementById("out").innerHTML=h;}' +
    'function add(){document.getElementById("add").disabled=true;' +
    'google.script.run.withSuccessHandler(function(r){' +
    'var h="<div class=\'free\'><b>"+r.added+" added to "+esc(r.tab)+"</b>, from row "+' +
    'r.startRow+".<br>"+esc(r.names.join(", "));' +
    'if(r.skipped){h+="<br><span class=\'muted\'>"+r.skipped+" skipped as already there.' +
    '</span>";}' +
    'h+="</div>";document.getElementById("out").innerHTML=h;' +
    'document.getElementById("paste").value="";OVER={};})' +
    '.withFailureHandler(function(e){document.getElementById("add").disabled=false;fail(e);})' +
    '.api_writePaste(document.getElementById("tab").value,' +
    'document.getElementById("paste").value,OVER);}' +
    '<\/script>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(820).setHeight(720), 'Paste from Ravenna');
}

function api_readPaste(tab, text, overrides) { return readPaste_(tab, text, overrides); }
function api_writePaste(tab, text, overrides) { return writePaste_(tab, text, overrides); }
