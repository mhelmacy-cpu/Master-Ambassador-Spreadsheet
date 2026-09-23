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
  const teacherCol = colNum_(headers, 'Ambassador Advisor') - 1;
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
