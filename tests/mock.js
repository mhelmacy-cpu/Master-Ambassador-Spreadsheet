/* The Apps Script services, in Node, so the whole script can be driven
 * from a terminal with no browser, no Google account and nothing to
 * click. Everything a test wants to look at afterwards is left on a
 * global: __sent for mail, __doc for a Google Doc's paragraphs, __dialogs
 * for a dialog's HTML, __reads for how many times a sheet was read.
 *
 * It is a mock, not an emulator: it does what this script actually calls
 * and nothing else. A method the script does not use is missing on
 * purpose, so a test fails loudly rather than passing against something
 * Google does not do. */

function makeMock() {
  const sheets = {};
  const order = [];

  global.__reads = 0;
  global.__sent = [];
  global.__dialogs = [];
  global.__doc = [];
  global.__docTable = null;
  global.__docTables = [];
  global.__page = {};
  global.__docName = '';
  global.__triggers = [];
  global.__alerts = [];

  /* ---------- a sheet ---------- */

  const makeSheet = function (name) {
    const grid = [];                 // grid[row][col], 0 based
    const notes = {};
    const widths = {};
    const state = { frozen: 0 };

    const at = function (r, c) {
      while (grid.length < r) grid.push([]);
      const row = grid[r - 1];
      while (row.length < c) row.push('');
      return row;
    };
    const lastRow = function () {
      let n = 0;
      grid.forEach(function (row, i) {
        if (row.some(function (v) { return v !== '' && v != null; })) n = i + 1;
      });
      return n;
    };
    const lastCol = function () {
      let n = 0;
      grid.forEach(function (row) {
        row.forEach(function (v, k) { if (v !== '' && v != null) n = Math.max(n, k + 1); });
      });
      return n;
    };

    const range = function (r, c, nr, nc) {
      const rows = nr === undefined ? 1 : nr;
      const cols = nc === undefined ? 1 : nc;
      const self = {
        // Where this range is, so moveColumns can be worked out from it.
        __r: r, __c: c, __rows: rows, __cols: cols,
        getRow: function () { return r; },
        getColumn: function () { return c; },
        getNumRows: function () { return rows; },
        getNumColumns: function () { return cols; },
        getValues: function () {
          global.__reads++;
          const out = [];
          for (let i = 0; i < rows; i++) {
            const row = [];
            for (let k = 0; k < cols; k++) {
              const line = grid[r - 1 + i] || [];
              const v = line[c - 1 + k];
              row.push(v === undefined ? '' : v);
            }
            out.push(row);
          }
          return out;
        },
        getValue: function () { return self.getValues()[0][0]; },
        setValues: function (vals) {
          vals.forEach(function (row, i) {
            row.forEach(function (v, k) {
              at(r + i, c + k)[c - 1 + k] = v;
            });
          });
          return self;
        },
        setValue: function (v) {
          at(r, c)[c - 1] = v;
          return self;
        },
        /* Formatting is recorded where a test looks at it and ignored
         * otherwise: none of it changes what the script decides. */
        setNumberFormat: function () { return self; },
        setNumberFormats: function () { return self; },
        setFontWeight: function () { return self; },
        setFontColor: function () { return self; },
        setBackground: function () { return self; },
        setFontSize: function () { return self; },
        setWrap: function () { return self; },
        setVerticalAlignment: function () { return self; },
        setHorizontalAlignment: function () { return self; },
        setDataValidation: function (rule) { self.rule = rule; return self; },
        setNote: function (text) { notes[r + ',' + c] = text; return self; },
        /* Real copyFormatToRange carries a column's look to a new one.
         * Nothing here reads formatting, so it is a no-op - but it has to
         * exist, because the script calls it in a try/catch and a missing
         * method would hide a real failure in there. */
        copyFormatToRange: function () { return self; },
        getNote: function () { return notes[r + ',' + c] || ''; },
        clearContent: function () {
          for (let i = 0; i < rows; i++) {
            for (let k = 0; k < cols; k++) at(r + i, c + k)[c - 1 + k] = '';
          }
          return self;
        }
      };
      return self;
    };

    const sheet = {
      getName: function () { return name; },
      getRange: range,
      getDataRange: function () {
        return range(1, 1, Math.max(lastRow(), 1), Math.max(lastCol(), 1));
      },
      getLastRow: lastRow,
      getLastColumn: lastCol,
      getMaxRows: function () { return Math.max(lastRow(), 1000); },
      getMaxColumns: function () { return Math.max(lastCol(), 26); },
      deleteRow: function (r) { grid.splice(r - 1, 1); return sheet; },
      /* Google's moveColumns carries the values, the formatting and the
       * validation across. Only the values live here, so only they move:
       * the column comes out and goes back in before the destination,
       * which shifts left by what was taken when it sits to the right. */
      moveColumns: function (rng, dest) {
        const from = rng.__c;
        const n = rng.__cols || 1;
        let to = dest - 1;
        if (to > from - 1) to -= n;
        grid.forEach(function (row) {
          while (row.length < from - 1 + n) row.push('');
          const cut = row.splice(from - 1, n);
          while (row.length < to) row.push('');
          row.splice.apply(row, [to, 0].concat(cut));
        });
        return sheet;
      },
      moveRows: function () { return sheet; },
      insertColumnAfter: function () { return sheet; },
      insertRowAfter: function (r) { grid.splice(r, 0, []); return sheet; },
      clear: function () { grid.length = 0; return sheet; },
      setFrozenRows: function (n) { state.frozen = n; return sheet; },
      getFrozenRows: function () { return state.frozen; },
      autoResizeColumns: function () { return sheet; },
      autoResizeColumn: function () { return sheet; },
      setColumnWidth: function (c, w) { widths[c] = w; return sheet; },
      getColumnWidth: function (c) { return widths[c] || 100; },
      setRowHeights: function () { return sheet; },
      setRowHeight: function () { return sheet; },
      hideColumns: function () { return sheet; },
      __grid: grid,
      __notes: notes,
      __widths: widths
    };
    return sheet;
  };

  /* ---------- the spreadsheet ---------- */

  const ss = {
    getName: function () { return 'Master Ambassador Spreadsheet'; },
    getId: function () { return 'mock-spreadsheet'; },
    getUrl: function () { return 'https://docs.google.com/spreadsheets/d/mock'; },
    getSheetByName: function (n) { return sheets[n] || null; },
    insertSheet: function (n) {
      sheets[n] = makeSheet(n);
      order.push(n);
      return sheets[n];
    },
    getSheets: function () { return order.map(function (n) { return sheets[n]; }); },
    setActiveSheet: function (s) { ss.__active = s; return ss; },
    moveActiveSheet: function () { return ss; },
    getActiveSheet: function () { return ss.__active || ss.getSheets()[0]; }
  };

  global.SpreadsheetApp = {
    getActiveSpreadsheet: function () { return ss; },
    getActive: function () { return ss; },
    openById: function () { return ss; },
    flush: function () {},
    newDataValidation: function () {
      const rule = { values: [], allowInvalid: true };
      const api = {
        requireValueInList: function (vals, drop) {
          rule.values = vals; rule.showDropdown = drop; return api;
        },
        setAllowInvalid: function (v) { rule.allowInvalid = v; return api; },
        build: function () { return rule; }
      };
      return api;
    },
    getUi: function () {
      const menu = {
        addItem: function () { return menu; },
        addSeparator: function () { return menu; },
        addSubMenu: function () { return menu; },
        addToUi: function () { return menu; }
      };
      return {
        createMenu: function () { return menu; },
        alert: function (msg) { global.__alerts.push(String(msg)); },
        showModalDialog: function (out, title) {
          global.__dialogs.push({ html: out && out.__html, title: title });
        }
      };
    }
  };

  /* ---------- a Google Doc ---------- */

  /* Every paragraph the script appends, in order, with whichever of its
   * looks a test asks about: the heading, bold, the font size, the line
   * spacing, and whether it is inside a table cell. A page can hold more
   * than one table: the last one stays on __docTable, as it always has,
   * and every one of them is on __docTables in the order appended. */
  function para(t, inCell) {
    const o = {
      t: t, h: '', b: false, cell: !!inCell,
      setHeading: function (x) { this.h = x; return this; },
      setLineSpacing: function (x) { this.ls = x; return this; },
      setSpacingBefore: function () { return this; },
      setSpacingAfter: function () { return this; },
      setText: function (x) { this.t = x; return this; },
      asParagraph: function () { return this; },
      editAsText: function () {
        const self = this;
        const text = {
          setBold: function (v) { self.b = (v !== false); return text; },
          setFontSize: function (n) { self.size = n; return text; },
          setForegroundColor: function (c) { self.color = c; return text; },
          setItalic: function (v) { self.i = (v !== false); return text; }
        };
        return text;
      }
    };
    global.__doc.push(o);
    return o;
  }

  function cellOf() {
    const first = para('', true);
    const cell = {
      __first: first,
      getChild: function () { return first; },
      getNumChildren: function () { return 1; },
      appendParagraph: function (t) { return para(t, true); },
      setPaddingTop: function () { return cell; },
      setPaddingBottom: function () { return cell; },
      setPaddingLeft: function () { return cell; },
      setPaddingRight: function () { return cell; },
      setBackgroundColor: function (c) { cell.bg = c; return cell; },
      setVerticalAlignment: function (v) { cell.va = v; return cell; },
      setWidth: function () { return cell; }
    };
    return cell;
  }

  global.DocumentApp = {
    ParagraphHeading: { HEADING1: 'H1', HEADING2: 'H2', HEADING3: 'H3', NORMAL: 'N' },
    VerticalAlignment: { TOP: 'top', CENTER: 'center' },
    create: function (name) {
      global.__doc = [];
      global.__page = {};
      global.__docTable = null;
      global.__docTables = [];
      global.__docName = name;
      const body = {
        clear: function () { global.__doc.length = 0; return body; },
        appendParagraph: function (t) { return para(t, false); },
        appendPageBreak: function () {
          global.__doc.push({ t: '--- PAGE BREAK ---', h: '', b: false, cell: false });
          return {};
        },
        appendTable: function (rows) {
          /* Real appendTable lays out whatever grid it is handed, so the
           * mock records every cell rather than pretending there is one. */
          const grid = (rows || [['']]).map(function (row) {
            return row.map(function (v) {
              const c = cellOf();
              if (v !== '' && v != null) c.__first.t = String(v);
              return c;
            });
          });
          const widths = [];
          const heights = [];
          const slot = { widths: widths, heights: heights };
          global.__docTables.push(slot);
          global.__docTable = slot;
          const t = {
            getCell: function (r, k) { return grid[r][k]; },
            getNumRows: function () { return grid.length; },
            getRow: function (i) {
              return {
                setMinimumHeight: function (h) {
                  heights[i] = h; global.__docTable = slot; return this;
                }
              };
            },
            setColumnWidth: function (i, w) {
              widths[i] = w; global.__docTable = slot; return t;
            },
            setBorderWidth: function () { return t; }
          };
          return t;
        },
        setPageWidth: function (w) { global.__page.width = w; return body; },
        setPageHeight: function (h) { global.__page.height = h; return body; },
        setMarginTop: function (v) { global.__page.top = v; return body; },
        setMarginBottom: function (v) { global.__page.bottom = v; return body; },
        setMarginLeft: function (v) { global.__page.left = v; return body; },
        setMarginRight: function (v) { global.__page.right = v; return body; }
      };
      return {
        getBody: function () { return body; },
        getUrl: function () {
          return 'https://docs.google.com/document/d/mock-' +
            String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        },
        getId: function () { return 'mock-doc'; },
        getName: function () { return name; },
        saveAndClose: function () {}
      };
    }
  };

  /* ---------- the rest ---------- */

  global.MailApp = {
    sendEmail: function (opts) { global.__sent.push(opts); },
    getRemainingDailyQuota: function () { return 1000; }
  };
  global.GmailApp = global.MailApp;

  global.HtmlService = {
    createHtmlOutput: function (html) {
      const out = {
        __html: html,
        setWidth: function () { return out; },
        setHeight: function () { return out; },
        setTitle: function () { return out; },
        getContent: function () { return html; }
      };
      return out;
    }
  };

  global.Session = {
    getEffectiveUser: function () { return { getEmail: function () { return 'mhelmacy@lrei.org'; } }; },
    getActiveUser: function () { return { getEmail: function () { return 'mhelmacy@lrei.org'; } }; },
    getScriptTimeZone: function () { return 'America/New_York'; }
  };

  global.ScriptApp = {
    WeekDay: {
      SUNDAY: { day: 'SUNDAY' }, MONDAY: { day: 'MONDAY' }, TUESDAY: { day: 'TUESDAY' },
      WEDNESDAY: { day: 'WEDNESDAY' }, THURSDAY: { day: 'THURSDAY' },
      FRIDAY: { day: 'FRIDAY' }, SATURDAY: { day: 'SATURDAY' }
    },
    getProjectTriggers: function () { return global.__triggers.slice(); },
    deleteTrigger: function (t) {
      const i = global.__triggers.indexOf(t);
      if (i !== -1) global.__triggers.splice(i, 1);
    },
    newTrigger: function (handler) {
      const made = { handler: handler, getHandlerFunction: function () { return handler; } };
      const api = {
        timeBased: function () { return api; },
        everyWeeks: function () { return api; },
        onWeekDay: function (d) { made.day = d; return api; },
        atHour: function (h) { made.hour = h; return api; },
        nearMinute: function (m) { made.minute = m; return api; },
        everyDays: function () { return api; },
        create: function () { global.__triggers.push(made); return made; }
      };
      return api;
    }
  };

  global.Utilities = {
    formatDate: function (d, tz, fmt) {
      const pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return String(fmt)
        .replace(/yyyy/g, d.getFullYear())
        .replace(/MM/g, pad(d.getMonth() + 1))
        .replace(/mm/g, pad(d.getMonth() + 1))
        .replace(/dd/g, pad(d.getDate()));
    },
    sleep: function () {}
  };

  global.PropertiesService = {
    getScriptProperties: function () {
      const store = {};
      return {
        getProperty: function (k) { return store[k] === undefined ? null : store[k]; },
        setProperty: function (k, v) { store[k] = String(v); return this; },
        deleteProperty: function (k) { delete store[k]; return this; }
      };
    }
  };

  return { sheets: sheets, ss: ss };
}

module.exports = { makeMock: makeMock };
