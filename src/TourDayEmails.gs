/**
 * Per-tour emails, sent once a tour's Staff This Tour slate is
 * confirmed, and again by the Monday/Tuesday/Wednesday reminders.
 * Four audiences:
 * A) Each ambassador - their own job(s) and times, plus where and when
 *    to report.
 * B) Their advisor - which advisee(s) are out and when.
 * C) The teacher whose class they walk out of, from the bell schedule.
 * D) Each teacher receiving touring visitors - the headcount only, no
 *    student names and no pod code, per instruction.
 */

/**
 * How to refer to the tour date in an email sent today.
 *
 * The same message goes out Monday at 2pm, Tuesday at 8am and
 * Wednesday at 7:30am, so a fixed "Today" would be wrong on two of the
 * three. This says Today, Tomorrow, or the weekday, according to when
 * it is actually being sent.
 */
function whenLabel_(tourDate) {
  const tour = toDate_(tourDate);
  if (!tour) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(tour.getFullYear(), tour.getMonth(), tour.getDate());
  const daysOut = Math.round((target - today) / 86400000);
  const tz = ss_().getSpreadsheetTimeZone();
  const dayName = Utilities.formatDate(target, tz, 'EEEE');
  const shortDate = Utilities.formatDate(target, tz, 'MMM d');

  if (daysOut === 0) return 'today (' + dayName + ', ' + shortDate + ')';
  if (daysOut === 1) return 'tomorrow (' + dayName + ', ' + shortDate + ')';
  return dayName + ', ' + shortDate;
}

/** Title-case version for subject lines. */
function whenLabelForSubject_(tourDate) {
  const label = whenLabel_(tourDate);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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
    teacher: colNum_(headers, 'Ambassador Advisor') - 1,
    touringStudent: colNum_(headers, 'Touring Student') - 1,
    status: colNum_(headers, 'Status') - 1
  };

  const tourRows = rows.filter(r => r[cols.tourId] === tourId && String(r[cols.status]).trim() !== 'Cancelled');
  if (tourRows.length === 0) {
    throw new Error('No assignments found for this tour yet - use "Staff This Tour..." first.');
  }

  const senderName = getSetting('Email Sender Name', 'Tour & Ambassador Program');
  const teacherEmails = getTeacherEmailMap_();
  const ambassadorEmails = getAmbassadorStudentEmailMap_();
  const ambassadorByName = {};
  getAmbassadorDirectory_().forEach(a => { ambassadorByName[normalizeName_(a.name)] = a; });

  const when = whenLabel_(tourRows[0][cols.date]);
  const whenSubject = whenLabelForSubject_(tourRows[0][cols.date]);
  const reportTo = getSetting('Ambassadors Report To', 'the cafeteria');
  const reportAt = getSetting('Ambassadors Report At', '8:25 AM');
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
      "<p>You're on the schedule for the tour " + when + ':</p>' +
      '<ul>' + listHtml + '</ul>' +
      '<p><b>Please come to ' + escapeHtml_(reportTo) + ' at ' + escapeHtml_(reportAt) + '.</b></p>' +
      '<p>Thanks for being an ambassador!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Your Tour Duty - ' + whenSubject, htmlBody: html, name: senderName });
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
      '<p>Your advisee(s) will be out for ambassador duty ' + when + ':</p>' +
      '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">' +
      '<tr style="background:#4a86e8;color:#fff;">' +
      '<th style="padding:4px 8px;">Advisee</th><th style="padding:4px 8px;">Time</th><th style="padding:4px 8px;">Job</th></tr>' +
      rowsHtml + '</table>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Advisee Ambassador Duty - ' + whenSubject, htmlBody: html, name: senderName });
    teachersMissingSent++;
  });

  // ---------- B2: the teacher whose class they are actually missing ----------
  // The advisor round above is pastoral; this one is the class the student
  // walks out of, worked out from their pod's bell schedule at the tour's time.
  const classTeacherResult = sendMissedClassEmails_(tourRows, cols, ambassadorByName, when, whenSubject, senderName);

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
      ' sitting in on your class ' + when +
      (tourEndLabel ? ', wrapping up around ' + tourEndLabel : '') + '.</p>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({
      to: email,
      subject: 'Student Visitor' + (count === 1 ? '' : 's') + ' in Your Class - ' + whenSubject,
      htmlBody: html, name: senderName });
    receivingSent++;
  });

  return {
    ambassadorsSent: ambassadorsSent, ambassadorsSkipped: ambassadorsSkipped,
    teachersMissingSent: teachersMissingSent, teachersMissingSkipped: teachersMissingSkipped,
    receivingSent: receivingSent, receivingSkipped: receivingSkipped,
    unmatchedStudents: unmatchedStudents,
    classTeachersSent: classTeacherResult.sent,
    classTeachersNeedsCheck: classTeacherResult.needsCheck
  };
}

/**
 * Emails the teacher whose class each ambassador walks out of, worked
 * out from their pod's bell schedule at the tour's time.
 *
 * A parallel-group period (Math A/B/C, the language choice, Choices)
 * has several possible teachers and the schedule never says which one
 * this student has, so nobody is emailed on a guess - those come back
 * in needsCheck for a human to forward. Same for initials with no
 * matching row on the Teachers sheet.
 */
function sendMissedClassEmails_(tourRows, cols, ambassadorByName, when, whenSubject, senderName) {
  const byTeacherEmail = {};   // email -> {name, students: [{student, what, start, end}]}
  const needsCheck = [];

  tourRows.forEach(r => {
    const name = r[cols.ambassador];
    const ambassador = ambassadorByName[normalizeName_(name)];
    if (!ambassador || !ambassador.homeroomPod) return;

    const dateVal = toDate_(r[cols.date]);
    const startMin = timeToMinutes_(formatTime_(r[cols.start]));
    const endMin = timeToMinutes_(formatTime_(r[cols.end]));
    if (!dateVal || startMin == null || endMin == null) return;

    const blocks = findMissedClass_(ambassador.homeroomPod, dateVal, startMin, endMin,
      { split: ambassador.split, language: ambassador.language });
    if (!blocks) return;

    blocks.forEach(block => {
      if (block.ambiguous) {
        const options = block.teachers.map(t => t.name + ' (' + t.initials + ')')
          .concat(block.unresolved.map(i => i + ' - not on the Teachers sheet'));
        needsCheck.push(name + ' misses "' + block.what + '" (' + block.start + '-' + block.end +
          '), which splits into parallel groups. Could be: ' +
          (options.length ? options.join(' / ') : 'no teacher identified') +
          '. Nobody was emailed - forward it yourself once you know which group they are in.');
        return;
      }
      if (block.teachers.length === 0) {
        needsCheck.push(name + ' misses "' + block.what + '" (' + block.start + '-' + block.end + ')' +
          (block.unresolved.length
            ? ', taught by ' + block.unresolved.join('/') + ' - add those initials and an email on the Teachers sheet.'
            : ' - no teacher initials on that Bell Schedule row.'));
        return;
      }
      block.teachers.forEach(t => {
        if (!byTeacherEmail[t.email]) byTeacherEmail[t.email] = { name: t.name, students: [] };
        byTeacherEmail[t.email].students.push({
          student: name, what: block.what, start: block.start, end: block.end, job: r[cols.job]
        });
      });
    });
  });

  let sent = 0;
  Object.keys(byTeacherEmail).forEach(email => {
    const entry = byTeacherEmail[email];
    const rowsHtml = entry.students.map(s =>
      '<tr><td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(s.student) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + s.start + '-' + s.end + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(s.what) + '</td>' +
      '<td style="padding:4px 8px;border:1px solid #ddd;">' + escapeHtml_(s.job) + '</td></tr>').join('');
    const html = '<p>Hi ' + escapeHtml_(entry.name) + ',</p>' +
      '<p>The student(s) below will be out of your class ' + when +
      ' for a school tour:</p>' +
      '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">' +
      '<tr style="background:#4a86e8;color:#fff;">' +
      '<th style="padding:4px 8px;">Student</th><th style="padding:4px 8px;">Time</th>' +
      '<th style="padding:4px 8px;">Class</th><th style="padding:4px 8px;">Tour Job</th></tr>' +
      rowsHtml + '</table>' +
      '<p>Thank you!<br>' + escapeHtml_(senderName) + '</p>';
    MailApp.sendEmail({ to: email, subject: 'Student Out of Your Class - ' + whenSubject,
      htmlBody: html, name: senderName });
    sent++;
  });

  return { sent: sent, needsCheck: needsCheck };
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
