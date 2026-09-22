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
      .addItem('Turn OFF dashboard auto-refresh', 'disableDashboardAutoRefresh')
      .addSeparator()
      .addItem('Turn ON tour reminders (Mon/Tue PM, Wed AM)', 'enableTourReminders')
      .addItem('Turn OFF tour reminders', 'disableTourReminders'))
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
