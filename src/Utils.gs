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
