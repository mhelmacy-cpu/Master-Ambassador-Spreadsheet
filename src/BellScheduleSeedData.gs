/**
 * 2026-27 Middle School bell schedule, transcribed from
 * 2026-27_MS_Schedule_FINAL (updated 9/2026), one entry per pod per
 * time block per day.
 *
 * Read this the way the source grid is drawn: the left ruler is the
 * clock (5-minute rows), and each block's top and bottom edge are that
 * period's real start and end time.
 *
 * Two honest caveats, both surfaced in the UI rather than hidden:
 * 1. Lettered sections (Math A/B/C, Science A/B/C, Choices A/B/C), the
 *    language choice (French/Mandarin/Spanish) and Majors/Electives are
 *    parallel groups. The source names the groups, never which student
 *    is in which one, so those are shown as options to confirm.
 * 2. Entries marked 'verify' were ambiguous in the source grid. Fix any
 *    of them directly on the Bell Schedule sheet - the code reads that
 *    sheet, not this file, once setup has run once.
 */

const BELL_SCHEDULE_ = {
  'Monday': {
    'MMS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:15','French - M207 Mandarin - M208 Spanish - M209'], ['10:15','11:00','Hum MN M212'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','PE LH TSAC'], ['12:40','13:25','Science SA M310'], ['13:25','14:10','Math A Hum MD MN M311 M212'], ['14:10','14:45','Hum A Math MN MD M212 M311']],
    'DJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math A CB M311'], ['10:10','11:00','Music A CN M103'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:15','Hum DR M211 (long block - verify)'], ['13:15','14:05','(unclear from PDF - verify locally): B'], ['14:05','14:45','B PE A LH TSAC']],
    'AOS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','PE B LH TSAC'], ['10:10','11:00','Math B CB M311'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:15','Hum AG M209 (long block - verify)'], ['13:15','14:10','French - M207 Mandarin - M208 Spanish - M209'], ['14:10','14:45','Music B CN M103']],
    'CCM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Science C OC M310 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:40','Hum MS M212 (long block - verify)'], ['13:40','14:45','Math C CB M310 (long block - verify)']],
    'EEL': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum ES M107 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','PE A LH TSAC (long block - verify)'], ['13:25','14:10','Math A CK M308'], ['14:10','14:50','French Mandarin Spanish'], ['14:50','15:10','(unclear from PDF - verify locally): IWP']],
    'MSB': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum SdB M108 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','(unclear from PDF - verify locally): 7/8 Dance Drama - Instrumental Portfolio Portfolio Vocal'], ['12:45','13:25','Math B CK M308'], ['13:25','14:10','PE B LH TSAC'], ['14:10','14:45','- M207 - M208 - M209']],
    'CJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math A CK M308'], ['10:10','11:00','PE A BR TSAC'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','7/8 Majors (student choice - confirm which)'], ['12:45','13:40','Hum As SMR+SC M107+M108'], ['13:40','14:25','Science A LL/EZ M307']],
    'RSS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Science B LL/EZ M307 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','PE B BR Charlton (long block - verify)'], ['13:25','14:10','Hum Bs SMR+SC M107+M108'], ['14:10','14:45','Math B CK M308']]
  },
  'Tuesday': {
    'MMS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Choices LA M211 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','PE LH TSAC'], ['12:40','13:35','Music CN M103'], ['13:35','14:15','Hum MN M212']],
    'DJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math A CB M311'], ['10:10','11:00','Electives (student choice - confirm which)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:15','Hum DR M211 (long block - verify)'], ['13:15','14:10','Science A OC M310']],
    'AOS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Thompson - M212 - Auditorium - L104 - M103 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:05','Hum AG M209 (long block - verify)'], ['13:05','13:55','Choices B LA M211'], ['13:55','14:30','Math B CB M311']],
    'CCM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Art C M306 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:05','Hum MS M212 (long block - verify)'], ['13:05','13:55','Math C CB M311'], ['13:55','14:40','PE C LH TSAC'], ['14:40','15:05','(unclear from PDF - verify locally): IWP']],
    'EEL': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math A CK M308'], ['10:10','11:00','French Mandarin Spanish'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','Hum ES M107 (long block - verify)'], ['13:25','14:10','Science A LL/EZ M307']],
    'MSB': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','- M207 - M208 - M209 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','Electives (student choice - confirm which)'], ['12:45','13:15','Hum SdB M108'], ['13:15','14:00','Hum Bs ES+SdB M107 M108'], ['14:00','14:30','Math B CK M308']],
    'CJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum SMR M107 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','Lab - PAPAS - M108 - M107 - Art Room - L104 - M103'], ['12:45','13:25','PE A BR TSAC'], ['13:25','14:15','French Mandarin Spanish'], ['14:15','14:50','(unclear from PDF - verify locally): CAP'], ['14:50','15:10','(unclear from PDF - verify locally): IWP']],
    'RSS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum SC M108 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','Math B CK M308 (long block - verify)'], ['13:25','14:00','- M207 - M208 - M209']]
  },
  'Wednesday': {
    'MMS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum MN M212 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','Math MD M311'], ['12:40','13:25','Hum Science A MN SA M212 M310'], ['13:25','14:00','Hum A SA MN M310 M212']],
    'DJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','PE A LH TSAC'], ['10:10','11:00','Electives (student choice - confirm which)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','Hum DR M211'], ['12:40','13:25','B Art A M306'], ['13:25','13:50','(unclear from PDF - verify locally): B']],
    'AOS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math B CB M311'], ['10:10','11:00','- PAPAS - M212 - Auditorium - L104 - M103'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','Hum AG M209'], ['12:40','13:25','PE B LH TSAC'], ['13:25','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','14:40','Affinity Groups / Olympic Teams']],
    'CCM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['9:30','12:40','Hum MS M212 (long block - verify)'], ['12:40','13:50','Math C CB M311 (long block - verify)'], ['13:50','14:40','Affinity Groups / Olympic Teams']],
    'EEL': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','French Mandarin Spanish (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','Math A CK M308 (long block - verify)'], ['13:25','14:15','Hum As ES+SdB M107 M108'], ['14:15','14:50','(unclear from PDF - verify locally): Teams'], ['14:50','15:10','(unclear from PDF - verify locally): IWP']],
    'MSB': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math B CK M308'], ['10:10','11:00','- M207 - M208 - M209'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:00','(unclear from PDF - verify locally): 7/8 Dance Drama - Instrumental Portfolio Portfolio Vocal (long block - verify)'], ['13:00','13:40','Science B LL/EZ M307']],
    'CJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum SMR M107 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','7/8 Majors (student choice - confirm which)'], ['12:45','13:25','French Mandarin Spanish'], ['13:25','14:00','PE A BR TSAC']],
    'RSS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum SC M108 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','- M207 - M208 - M209 (long block - verify)'], ['13:25','14:00','Math B CK M308']]
  },
  'Thursday': {
    'MMS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:15','French - M207 Mandarin - M208 Spanish - M209'], ['10:15','11:00','Music CN M103'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:45','Math MD M311'], ['12:45','13:35','(unclear from PDF - verify locally): Art M306'], ['13:35','14:15','Hum MN M212']],
    'DJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Science A OC M310 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:05','Hum DR M211 (long block - verify)'], ['13:05','13:55','Math A CB M311'], ['13:55','14:30','PE A LH TSAC']],
    'AOS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math B CB M311'], ['10:10','11:00','PE B LH TSAC'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:15','Hum AG M209 (long block - verify)'], ['13:15','14:10','Science B OC M310']],
    'CCM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:15','Music C CN M103'], ['10:15','11:00','Art C M306'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:05','Hum MS M212 (long block - verify)'], ['13:05','13:55','PE C LH TSAC'], ['13:55','14:40','Choices C LA M211'], ['14:40','15:05','(unclear from PDF - verify locally): IWP']],
    'EEL': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math A CK M308'], ['10:10','11:00','Choices A LA M107'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:50','Hum ES M107 (long block - verify)'], ['13:50','14:30','French Mandarin Spanish']],
    'MSB': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','PE B LH TSAC'], ['10:10','11:00','Math B CK M308'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:55','Electives (student choice - confirm which)'], ['12:55','13:50','Hum SdB M108'], ['13:50','14:30','- M207 - M208 - M209']],
    'CJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','French Mandarin Spanish (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','Lab - PAPAS - M108 - M107 - Art Room - L104 - M103'], ['12:45','13:25','Choices A LA M308'], ['13:25','14:10','Math A CK M308'], ['14:10','14:50','Hum SMR M107'], ['14:50','15:10','(unclear from PDF - verify locally): IWP']],
    'RSS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Choices B LA M107'], ['10:10','11:00','- M207 - M208 - M209'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','14:00','Science B LL/EZ M307 (long block - verify)'], ['14:00','14:45','Hum SC M108']]
  },
  'Friday': {
    'MMS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Hum MN M212 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','Math MD M311'], ['12:40','13:30','PE LH TSAC'], ['13:30','14:00','(unclear from PDF - verify locally): Art M306']],
    'DJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Math A CB M311 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:25','Art A M306 (long block - verify)'], ['13:25','14:00','Science A OC M310']],
    'AOS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','Science B OC M310 (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','12:40','French - M207 Mandarin - M208 Spanish - M209'], ['12:40','13:25','Math B CB M311'], ['13:25','14:00','Music B CN M103']],
    'CCM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','PE C LH TSAC (long block - verify)'], ['11:00','11:30','Lunch'], ['11:30','12:00','Recess'], ['12:00','13:25','Science C OC M310 (long block - verify)'], ['13:25','14:15','Math C CB M311'], ['14:15','14:40','(unclear from PDF - verify locally): Activity']],
    'EEL': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','PE A LH TSAC'], ['10:10','11:00','Math A CK M308'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','14:05','Hum ES M107 (long block - verify)'], ['14:05','14:50','(unclear from PDF - verify locally): Period'], ['14:50','15:10','(unclear from PDF - verify locally): IWP']],
    'MSB': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','10:10','Math B CK M308'], ['10:10','11:00','Science B LL/EZ M307'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:00','(unclear from PDF - verify locally): 7/8 Dance Drama - Instrumental Portfolio Portfolio Vocal (long block - verify)'], ['13:00','13:40','Hum SdB M108']],
    'CJM': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','French Mandarin Spanish (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','12:45','7/8 Majors (student choice - confirm which)'], ['12:45','13:25','Math A CK M308'], ['13:25','14:00','Science A LL/EZ M307']],
    'RSS': [['8:15','9:00','Morning Homeroom'], ['9:00','9:30','MS Meeting'], ['9:30','11:00','- M207 - M208 - M209 (long block - verify)'], ['11:00','11:30','Recess'], ['11:30','12:00','Lunch'], ['12:00','13:25','Science B LL/EZ M307 (long block - verify)'], ['13:25','14:00','Math B CK M308']]
  }
};

const SCHEDULE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/** Flattened rows for the Bell Schedule reference sheet: [Day, Pod, Start, End, What]. */
function buildBellScheduleRows_() {
  const rows = [];
  SCHEDULE_DAYS.forEach(day => {
    Object.keys(BELL_SCHEDULE_[day]).forEach(pod => {
      BELL_SCHEDULE_[day][pod].forEach(e => rows.push([day, pod, e[0], e[1], e[2]]));
    });
  });
  return rows;
}
