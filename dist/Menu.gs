/**
 * Menu wiring, the bridges the dialogs call, email sending, and
 * the automatic triggers.
 *
 * Bundled file - it holds what used to be several separate script
 * files. Apps Script puts every .gs file in one shared namespace, so
 * merging them changes nothing about how the code runs; it just means
 * far less to paste. Each section below starts with a banner.
 */

/* ==========================================================
 * Code
 * ========================================================== */

/**
 * Menu wiring and entry points called from the HTML dialogs.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tour & Ambassador Scheduler')
    .addItem('First-Time Setup', 'setupSpreadsheet')
    .addSeparator()
    .addItem('Schedule a Tour...', 'showAddTourDialog')
    .addItem('Generate Wednesday Tours...', 'showGenerateWednesdayToursDialog')
    .addItem('Add Touring Student...', 'showAddTouringStudentDialog')
    .addItem('Assign Ambassador...', 'showAssignAmbassadorDialog')
    .addItem('Staff This Tour...', 'showStaffTourDialog')
    .addSeparator()
    .addItem('Schedule a Meeting with Student(s)...', 'showScheduleMeetingDialog')
    .addSeparator()
    .addItem('Import / Update Ambassadors...', 'showImportAmbassadorsDialog')
    .addItem('Sync Homerooms / Advisors', 'syncAmbassadorHomeroomsFromMenu_')
    .addSeparator()
    .addItem('Rebuild Eligibility Matrix', 'rebuildEligibilityMatrix')
    .addItem('Refresh Dashboard Now', 'refreshDashboard')
    .addSeparator()
    .addItem('Send Tour Day Emails...', 'showSendTourDayEmailsDialog')
    .addItem('Send Weekly Teacher Emails Now', 'sendWeeklyTeacherEmailsFromMenu_')
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Automation')
      .addItem('Turn ON weekly teacher emails', 'enableWeeklyEmailTrigger')
      .addItem('Turn OFF weekly teacher emails', 'disableWeeklyEmailTrigger')
      .addSeparator()
      .addItem('Turn ON dashboard auto-refresh (10 min)', 'enableDashboardAutoRefresh')
      .addItem('Turn OFF dashboard auto-refresh', 'disableDashboardAutoRefresh'))
    .addToUi();
}

function showAddTourDialog() {
  showDialog_('ui/AddTourDialog', 'Schedule a Tour', 480, 520);
}

function showGenerateWednesdayToursDialog() {
  showDialog_('ui/GenerateWednesdayToursDialog', 'Generate Wednesday Tours', 460, 380);
}

function showAddTouringStudentDialog() {
  showDialog_('ui/AddTouringStudentDialog', 'Add Touring Student', 480, 560);
}

function showAssignAmbassadorDialog() {
  showDialog_('ui/AssignAmbassadorDialog', 'Assign Ambassador', 480, 560);
}

function showImportAmbassadorsDialog() {
  showDialog_('ui/ImportAmbassadorsDialog', 'Import / Update Ambassadors', 640, 560);
}

function showStaffTourDialog() {
  showDialog_('ui/StaffTourDialog', 'Staff This Tour', 640, 600);
}

function showSendTourDayEmailsDialog() {
  showDialog_('ui/SendTourDayEmailsDialog', 'Send Tour Day Emails', 520, 420);
}

function showScheduleMeetingDialog() {
  showDialog_('ui/ScheduleMeetingDialog', 'Schedule a Meeting with Student(s)', 620, 640);
}

/* ---- Data providers for the dialogs (google.script.run) ---- */

function api_getTours() {
  return listTours();
}

function api_getJobs() {
  const { rows } = readSheet(SHEETS.JOBS);
  const headers = HEADERS[SHEETS.JOBS];
  const nameCol = colNum_(headers, 'Job Name') - 1;
  const activeCol = colNum_(headers, 'Active') - 1;
  return rows.filter(r => r[nameCol] && String(r[activeCol]).trim().toLowerCase() === 'yes').map(r => r[nameCol]);
}

function api_getAssignableAmbassadors(job, dateStr, startTime, endTime) {
  return getAssignableAmbassadors(job, dateStr, startTime, endTime);
}

function api_addTour(data) {
  return addTour(data);
}

function api_addTouringStudent(data) {
  return addTouringStudent(data);
}

function api_assignAmbassador(data) {
  return assignAmbassador(data);
}

function api_importAmbassadors(text) {
  return importAmbassadors(text);
}

function api_suggestStaffingForTour(tourId) {
  return suggestStaffingForTour(tourId);
}

function api_confirmTourStaffing(tourId, selections) {
  return confirmTourStaffing(tourId, selections);
}

function api_getRouteAvailability(tourId) {
  return getRouteAvailability(tourId);
}

function api_generateWednesdayTours(startDateStr, weeks) {
  return generateWednesdayTours(startDateStr, weeks);
}

function api_sendTourDayEmails(tourId) {
  return sendTourDayEmails(tourId);
}

function api_getAllMsStudents() {
  return getAllMsStudents();
}

function api_lookupStudentsAtTime(studentNames, dateStr, startTime, endTime) {
  return lookupStudentsAtTime(studentNames, dateStr, startTime, endTime);
}

function api_scheduleMeeting(data) {
  return scheduleMeeting(data);
}

/* ==========================================================
 * EmailService
 * ========================================================== */

/**
 * Weekly email to teachers listing which of their students are
 * scheduled for ambassador duty (so teachers know when to expect
 * them out of class).
 */

function sendWeeklyTeacherEmails() {
  const lookaheadDays = Number(getSetting('Weekly Email Lookahead Days', 7)) || 7;
  const schoolName = getSetting('School Name', 'Our School');
  const senderName = getSetting('Email Sender Name', 'Tour & Ambassador Program');

  const tz = ss_().getSpreadsheetTimeZone();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today.getTime() + lookaheadDays * 86400000);

  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const dateCol = colNum_(headers, 'Date') - 1;
  const startCol = colNum_(headers, 'Start Time') - 1;
  const endCol = colNum_(headers, 'End Time') - 1;
  const jobCol = colNum_(headers, 'Job') - 1;
  const ambassadorCol = colNum_(headers, 'Ambassador') - 1;
  const teacherCol = colNum_(headers, 'Ambassador Teacher') - 1;
  const tourCol = colNum_(headers, 'Tour ID') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  const upcoming = rows.filter(r => {
    if (!r[ambassadorCol] || !r[teacherCol]) return false;
    if (String(r[statusCol]).trim() === 'Cancelled') return false;
    const d = toDate_(r[dateCol]);
    return d && d >= today && d < rangeEnd;
  });

  const byTeacher = {};
  upcoming.forEach(r => {
    const teacher = r[teacherCol];
    if (!byTeacher[teacher]) byTeacher[teacher] = [];
    byTeacher[teacher].push({
      date: r[dateCol],
      start: combineDateAndTime_(r[dateCol], r[startCol]),
      end: combineDateAndTime_(r[dateCol], r[endCol]),
      job: r[jobCol],
      ambassador: r[ambassadorCol],
      tour: r[tourCol]
    });
  });

  const teacherEmails = getTeacherEmailMap_();
  let sent = 0;
  const skipped = [];

  Object.keys(byTeacher).forEach(teacher => {
    const email = teacherEmails[normalizeName_(teacher)];
    if (!email) { skipped.push(teacher); return; }

    const items = byTeacher[teacher].sort((a, b) => a.start - b.start);
    const rangeLabel = Utilities.formatDate(today, tz, 'MMM d') + ' - ' + Utilities.formatDate(new Date(rangeEnd.getTime() - 86400000), tz, 'MMM d');
    const subject = 'Ambassador Schedule This Week (' + rangeLabel + ') - ' + teacher;

    const rowsHtml = items.map(it =>
      '<tr>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + formatDate_(it.date) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + formatTime_(it.start) + '-' + formatTime_(it.end) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(it.ambassador) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(it.job) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(it.tour) + '</td>' +
      '</tr>').join('');

    const htmlBody =
      '<p>Hi ' + escapeHtml_(teacher) + ',</p>' +
      "<p>Here is this week's ambassador schedule for your student(s) at " + escapeHtml_(schoolName) + '. ' +
      'Please expect them to step out of class at the times below.</p>' +
      '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">' +
      '<tr style="background:#4a86e8;color:#fff;">' +
      '<th style="padding:4px 8px;border:1px solid #ddd;">Date</th>' +
      '<th style="padding:4px 8px;border:1px solid #ddd;">Time</th>' +
      '<th style="padding:4px 8px;border:1px solid #ddd;">Student</th>' +
      '<th style="padding:4px 8px;border:1px solid #ddd;">Job</th>' +
      '<th style="padding:4px 8px;border:1px solid #ddd;">Tour</th>' +
      '</tr>' + rowsHtml + '</table>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: senderName
    });
    sent++;
  });

  if (skipped.length > 0) {
    Logger.log('Weekly ambassador email: no address found for teacher(s): ' + skipped.join(', ') +
      '. Add them to the Teachers sheet.');
  }

  return { sent: sent, skipped: skipped };
}

function getTeacherEmailMap_() {
  const { rows } = readSheet(SHEETS.TEACHERS);
  const headers = HEADERS[SHEETS.TEACHERS];
  const nameCol = colNum_(headers, 'Teacher Name') - 1;
  const emailCol = colNum_(headers, 'Teacher Email') - 1;
  const map = {};
  rows.forEach(r => {
    if (r[nameCol] && r[emailCol]) map[normalizeName_(r[nameCol])] = r[emailCol];
  });
  return map;
}

function escapeHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendWeeklyTeacherEmailsFromMenu_() {
  const result = sendWeeklyTeacherEmails();
  let msg = 'Sent ' + result.sent + ' email(s) to teachers.';
  if (result.skipped.length > 0) {
    msg += '\n\nNo email on file for: ' + result.skipped.join(', ') + '. Add them to the Teachers sheet and re-run.';
  }
  SpreadsheetApp.getUi().alert(msg);
}

/* ==========================================================
 * TourDayEmails
 * ========================================================== */

/**
 * Per-tour emails, sent once a tour's Staff This Tour slate is
 * confirmed. Three separate audiences:
 * A) Each participating ambassador - their own job(s)/time(s).
 * B) Each ambassador's Teacher - which of their student(s) will be
 * pulled out, when, for what job (same idea as the weekly digest,
 * scoped to just this one tour).
 * C) Each teacher whose class is receiving touring visitors (the
 * grade-matched Tour Guide's own class, per the staffing algorithm)
 * - just the headcount, no student names, per instruction.
 */

function sendTourDayEmails(tourId) {
  const tour = getTourById_(tourId);
  if (!tour) throw new Error('Tour not found.');

  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const cols = {
    tourId: colNum_(headers, 'Tour ID') - 1,
    date: colNum_(headers, 'Date') - 1,
    start: colNum_(headers, 'Start Time') - 1,
    end: colNum_(headers, 'End Time') - 1,
    job: colNum_(headers, 'Job') - 1,
    ambassador: colNum_(headers, 'Ambassador') - 1,
    teacher: colNum_(headers, 'Ambassador Teacher') - 1,
    touringStudent: colNum_(headers, 'Touring Student') - 1,
    status: colNum_(headers, 'Status') - 1
  };

  const tourRows = rows.filter(r => r[cols.tourId] === tourId && String(r[cols.status]).trim() !== 'Cancelled');
  if (tourRows.length === 0) {
    throw new Error('No assignments found for this tour yet - use "Staff This Tour..." first.');
  }

  const schoolName = getSetting('School Name', 'Our School');
  const senderName = getSetting('Email Sender Name', 'Tour & Ambassador Program');
  const teacherEmails = getTeacherEmailMap_();
  const ambassadorEmails = getAmbassadorStudentEmailMap_();
  const ambassadorByName = {};
  getAmbassadorDirectory_().forEach(a => { ambassadorByName[normalizeName_(a.name)] = a; });

  const dateLabel = formatDate_(tourRows[0][cols.date]);
  const tourEndLabel = tour.endTime ? formatTime_(combineDateAndTime_(toDate_(tour.date), tour.endTime)) : '';

  // ---------- A: participating ambassadors ----------
  const byAmbassador = {};
  tourRows.forEach(r => { (byAmbassador[r[cols.ambassador]] = byAmbassador[r[cols.ambassador]] || []).push(r); });

  let ambassadorsSent = 0;
  const ambassadorsSkipped = [];
  Object.keys(byAmbassador).forEach(name => {
    const email = ambassadorEmails[normalizeName_(name)];
    if (!email) { ambassadorsSkipped.push(name); return; }
    const items = byAmbassador[name].sort((a, b) => a[cols.start] - b[cols.start]);
    const listHtml = items.map(r => '<li>' + escapeHtml_(r[cols.job]) + ' - ' +
      formatTime_(r[cols.start]) + '-' + formatTime_(r[cols.end]) + '</li>').join('');
    const html = '<p>Hi ' + escapeHtml_(String(name).split(' ')[0]) + ',</p>' +
      "<p>You're on the schedule for the tour on " + dateLabel + ' at ' + escapeHtml_(schoolName) + ':</p>' +
      '<ul>' + listHtml + '</ul>' +
      '<p>Thanks for being an ambassador!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Your Tour Duty - ' + dateLabel, htmlBody: html, name: senderName });
    ambassadorsSent++;
  });

  // ---------- B: teachers missing a student ----------
  const byTeacher = {};
  tourRows.forEach(r => {
    if (!r[cols.teacher]) return;
    (byTeacher[r[cols.teacher]] = byTeacher[r[cols.teacher]] || []).push(r);
  });

  let teachersMissingSent = 0;
  const teachersMissingSkipped = [];
  Object.keys(byTeacher).forEach(teacher => {
    const email = teacherEmails[normalizeName_(teacher)];
    if (!email) { teachersMissingSkipped.push(teacher); return; }
    const items = byTeacher[teacher].sort((a, b) => a[cols.start] - b[cols.start]);
    const rowsHtml = items.map(r =>
      '<tr><td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(r[cols.ambassador]) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + formatTime_(r[cols.start]) + '-' + formatTime_(r[cols.end]) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(r[cols.job]) + '</td></tr>').join('');
    const html = '<p>Hi ' + escapeHtml_(teacher) + ',</p>' +
      '<p>Your student(s) will be out for ambassador duty on ' + dateLabel + ':</p>' +
      '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">' +
      '<tr style="background:#4a86e8;color:#fff;">' +
      '<th style="padding:4px 8px;">Student</th><th style="padding:4px 8px;">Time</th><th style="padding:4px 8px;">Job</th></tr>' +
      rowsHtml + '</table>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Ambassador Duty Today - ' + dateLabel, htmlBody: html, name: senderName });
    teachersMissingSent++;
  });

  // ---------- C: teachers receiving touring visitors (count only) ----------
  const touringStudents = listTouringStudentsForTour(tourId);
  const tsHeaders = HEADERS[SHEETS.TOURING_STUDENTS];
  const tsFirstCol = colNum_(tsHeaders, 'First Name') - 1;
  const tsLastCol = colNum_(tsHeaders, 'Last Name') - 1;
  const tsGradeCol = colNum_(tsHeaders, 'Grade') - 1;
  const studentGradeByName = {};
  touringStudents.forEach(r => {
    studentGradeByName[normalizeName_(fullName_(r[tsFirstCol], r[tsLastCol]))] = parseGradeNum_(r[tsGradeCol]);
  });

  const guideRowsByStudent = {};
  tourRows.forEach(r => {
    if (r[cols.job] !== TOUR_JOBS.TOUR_GUIDE || !r[cols.touringStudent]) return;
    (guideRowsByStudent[r[cols.touringStudent]] = guideRowsByStudent[r[cols.touringStudent]] || []).push(r);
  });

  const receivingCounts = {}; // "Pod|Teacher" -> headcount
  const unmatchedStudents = [];
  Object.keys(guideRowsByStudent).forEach(student => {
    const grade = studentGradeByName[normalizeName_(student)];
    const classGuideRow = guideRowsByStudent[student].find(r => {
      const a = ambassadorByName[normalizeName_(r[cols.ambassador])];
      return a && grade != null && a.grade === grade;
    });
    if (!classGuideRow) { unmatchedStudents.push(student); return; }
    const a = ambassadorByName[normalizeName_(classGuideRow[cols.ambassador])];
    const key = (a.homeroomPod || '?') + '|' + (a.teacher || '?');
    receivingCounts[key] = (receivingCounts[key] || 0) + 1;
  });

  let receivingSent = 0;
  const receivingSkipped = [];
  Object.keys(receivingCounts).forEach(key => {
    const parts = key.split('|');
    const pod = parts[0], teacher = parts[1];
    if (!teacher || teacher === '?') { receivingSkipped.push(pod + ' (no advisor on file)'); return; }
    const email = teacherEmails[normalizeName_(teacher)];
    if (!email) { receivingSkipped.push(teacher); return; }
    const count = receivingCounts[key];
    const html = '<p>Hi ' + escapeHtml_(teacher) + ',</p>' +
      '<p>Heads up - expect ' + count + ' prospective student visitor' + (count === 1 ? '' : 's') +
      " sitting in on your class (" + escapeHtml_(pod) + ") during today's tour, " + dateLabel +
      (tourEndLabel ? ' (wrapping up around ' + tourEndLabel + ')' : '') + '.</p>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Prospective Family Visit Today - ' + dateLabel, htmlBody: html, name: senderName });
    receivingSent++;
  });

  return {
    ambassadorsSent: ambassadorsSent, ambassadorsSkipped: ambassadorsSkipped,
    teachersMissingSent: teachersMissingSent, teachersMissingSkipped: teachersMissingSkipped,
    receivingSent: receivingSent, receivingSkipped: receivingSkipped,
    unmatchedStudents: unmatchedStudents
  };
}

function getAmbassadorStudentEmailMap_() {
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const emailCol = colNum_(headers, 'Student Email') - 1;
  const map = {};
  rows.forEach(r => {
    const name = fullName_(r[firstCol], r[lastCol]);
    if (name.trim() && r[emailCol]) map[normalizeName_(name)] = r[emailCol];
  });
  return map;
}

/* ==========================================================
 * Triggers
 * ========================================================== */

/**
 * Installable trigger management for the weekly teacher email
 * and (optional) periodic dashboard auto-refresh.
 */

const WEEKDAY_MAP = {
  monday: ScriptApp.WeekDay.MONDAY,
  tuesday: ScriptApp.WeekDay.TUESDAY,
  wednesday: ScriptApp.WeekDay.WEDNESDAY,
  thursday: ScriptApp.WeekDay.THURSDAY,
  friday: ScriptApp.WeekDay.FRIDAY,
  saturday: ScriptApp.WeekDay.SATURDAY,
  sunday: ScriptApp.WeekDay.SUNDAY
};

function deleteTriggersFor_(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === handlerName)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function enableWeeklyEmailTrigger() {
  deleteTriggersFor_(HANDLER_WEEKLY_EMAIL);
  const day = String(getSetting('Weekly Email Day', 'Monday')).trim().toLowerCase();
  const hour = Number(getSetting('Weekly Email Hour (0-23)', 6)) || 6;
  const weekDay = WEEKDAY_MAP[day] || ScriptApp.WeekDay.MONDAY;

  ScriptApp.newTrigger(HANDLER_WEEKLY_EMAIL)
    .timeBased()
    .onWeekDay(weekDay)
    .atHour(hour)
    .create();

  SpreadsheetApp.getUi().alert('Weekly teacher emails will now send every ' +
    capitalize_(day) + ' around ' + hour + ':00. Change "Weekly Email Day/Hour" on the Settings sheet ' +
    'and re-run this to reschedule.');
}

function disableWeeklyEmailTrigger() {
  deleteTriggersFor_(HANDLER_WEEKLY_EMAIL);
  SpreadsheetApp.getUi().alert('Weekly teacher emails are turned off.');
}

function enableDashboardAutoRefresh() {
  deleteTriggersFor_(HANDLER_DASHBOARD_REFRESH);
  ScriptApp.newTrigger(HANDLER_DASHBOARD_REFRESH)
    .timeBased()
    .everyMinutes(10)
    .create();
  SpreadsheetApp.getUi().alert('The Dashboard will now auto-refresh every 10 minutes.');
}

function disableDashboardAutoRefresh() {
  deleteTriggersFor_(HANDLER_DASHBOARD_REFRESH);
  SpreadsheetApp.getUi().alert('Dashboard auto-refresh is turned off. Use "Refresh Dashboard Now" or reopen the sheet.');
}

function capitalize_(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Lightweight onEdit: keep the dashboard current when Assignments changes. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheetName = e.range.getSheet().getName();
    if (sheetName === SHEETS.ASSIGNMENTS) {
      refreshDashboard();
    }
  } catch (err) {
    // Never let a UI-less trigger error surface to the user.
  }
}
