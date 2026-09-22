/**
 * The school data this runs on: the ambassador roster, the
 * Middle School homeroom/advisory roster, the 7 walking tour routes,
 * and the weekly bell schedule.
 *
 * Bundled file - it holds what used to be several separate script
 * files. Apps Script puts every .gs file in one shared namespace, so
 * merging them changes nothing about how the code runs; it just means
 * far less to paste. Each section below starts with a banner.
 */

/* ==========================================================
 * AmbassadorsSeedData
 * ========================================================== */

/**
 * Real starter roster, parsed from the school's master ambassador list.
 * Each tuple: [Full Name, Grade, Borough, Parent 1 Name, Parent 1 Email,
 * Parent 2 Name, Parent 2 Email, Notes (optional)]
 *
 * Blake Glenn intentionally appears twice (once per borough) - that's how
 * the source list pairs him with tours from either borough, not a data
 * error.
 */

const AMBASSADOR_SEED_TUPLES_ = [
  ['Aurelia Walker', '5th', 'B', 'Sophia James', 'sjames20002000@yahoo.com', 'Michael Walker', 'michaelowalker14@gmail.com'],
  ['Lev David', '5th', 'J', 'Boaz David', 'boaz@humanb.com', 'Brooke David', 'brooke@brookedavid.com'],
  ['Laura Sandoval', '5th', 'B', 'Ali Heron', 'aliandgustavo@gmail.com', 'Gustavo Sandoval', 'gussand@gmail.com'],
  ['Tessa Fung', '5th', 'M', 'Samantha Dinerman', 'sammibess@gmail.com', 'William Fung', 'wfung@hsrcorp.com'],
  ['Camille Bedeau', '5th', 'B', 'Kevin Bedeau', 'bedeau.kevin@gmail.com', 'Theresa Bedeau', 'bedeau.theresa@gmail.com'],
  ['Avery Griffiths', '5th', 'M', 'Eksupar Griffiths', 'eksupar@gmail.com', 'Randy Griffiths', 'randydann@gmail.com'],
  ['Charlie Pinsky', '5th', 'M', 'David Pinsky', 'david.z.pinsky@gmail.com', 'Amanda Schreiber', 'amanda.j.schreiber@gmail.com'],
  ['Jordan Gary', '5th', 'M', 'Erin Gary', 'eringary@icloud.com', 'Kelvin Gary', 'kelvin.gary@gmail.com'],
  ['Ozzy Gutmann', '5th', 'B', 'Jen Gutmann', 'jenandrobby@gutmann.nyc', 'Robby Gutmann', 'robby@gutmann.nyc'],
  ['Skylar Bruno', '5th', 'B', 'Jason Bruno', 'brunojason826@gmail.com', 'Sherleen Petion-Bruno', 'spetion@gmail.com'],
  ['Sadie Imperioli', '5th', 'B', 'Christopher Imperioli', 'cmi0222@gmail.com', 'Ryann Imperioli', 'rimperioli@lrei.org'],
  ['Jane Moss', '5th', 'B', 'Brian Moss', 'bmoss@coventryadvisors.com', 'Jennifer Sagum', 'jennifer.sagum@gmail.com'],
  ['George Orlofsky', '5th', 'M', 'Thalassa Balanis', 'tbalanis@gmail.com', 'Sam Orlofsky', 'samorlofsky1@gmail.com'],
  ['Toby Imberman', '5th', 'M', 'Matthew Imberman', 'mimberman@gmail.com', 'Sari Imberman', 'sari.imberman@gmail.com'],
  ['Sachin Gopal', '5th', 'M', 'Arvind Gopal', 'arvgop@gmail.com', 'Karen Sumberg', 'ksumberg@gmail.com'],
  ['Julian Lopez', '5th', 'M', 'Mike Lopez', 'mlopez762@gmail.com', "Natalie Sanz '00", 'Natalie@sanzmanagement.com'],
  ['Sadie Toussant', '5th', 'B', 'Amanda Silverman', 'amanda.silverman@ledecompany.com', 'Tyson Toussant', 'tyson@bionicyarn.com'],
  ['Caper Helliker', '6th', 'M', 'Kevin Helliker', 'kevinphelliker@gmail.com', 'Clover Lalehzar', 'cloverlalehzar@gmail.com'],
  ['Charlotte Schwartz', '6th', 'M', 'Cindy Schwartz', 'cindyjillschwartz@gmail.com', 'Daniel Schwartz', 'danieljschwartz@gmail.com'],
  ['Diego Ocotl', '6th', 'Q', 'Veronica Gomez', 'chinapoblana@gmail.com', 'Gerardo Ocotl', 'gerardo.ocotl@gmail.com'],
  ['Logan Lai', '6th', 'M', "Pinky Fung '02", 'fungpinky@gmail.com', 'Shannon Lai', 'shannonlai80s@gmail.com'],
  ['Emilio Hernandez', '6th', 'J', 'Luis Hernandez', 'lhernandez@lrei.org', 'Tasha Hernandez', 'thernandez@lrei.org'],
  ['Ama Bediako Whyte', '6th', 'Q', 'Afia Bediako', 'afiabe@gmail.com', '', ''],
  ['Michelle Denson', '6th', 'B', 'Annie Denson', 'annemariedenson@gmail.com', 'Lawrence Denson', 'lawrence.denson@gmail.com'],
  ['Afia-Kusiwaa Twumasi', '6th', 'Q', 'Nana Serwah Adom', 'nana.adon11@gmail.com', 'Kwame Twumasi', 'twumasiakwame@gmail.com'],
  ['Blake Glenn', '6th', 'M', 'Paula Davis', 'Pauladavis018@gmail.com', 'William Glenn', 'wglenn31186@Gmail.com'],
  ['Reagan Rhau', '6th', 'B', 'Hernandez Rhau', 'hrhau@hotmail.com', 'Karen Rhau', 'karen.rhau@gmail.com'],
  ['Blake Glenn', '6th', 'B', 'Paula Davis', 'Pauladavis018@gmail.com', 'William Glenn', 'wglenn31186@Gmail.com'],
  ['Miro Tavakoli', '6th', 'M', 'Sefaat Kavak', 'sefaat@gmail.com', 'Sorosh Tavakoli', 'sorosh.tavakoli@gmail.com'],
  ['Solomon Pearce', '6th', 'M', 'Jonathan Pearce', 'jrpearce@deloitte.com', 'Desiree van Rensburg', 'desiree@thevrps.com'],
  ['Aksel Ozturk', '7th', 'J', 'Cigdem Ozturk', 'cigdem@ipmus.com', 'Mustafa Ozturk', 'mdozturk@yahoo.com'],
  ['Sanai Parikh', '7th', 'M', 'Kalai Murugesan', 'neal322@gmail.com', 'Neal Parikh', 'neal322@gmail.com'],
  ['Irie Bocchino', '7th', 'M', 'A.J. Bocchino', 'ajbocchino1@gmail.com', 'Phoebe Washburn', 'phowashburn@gmail.com'],
  ['Felix Lopez', '7th', 'M', 'Mike Lopez', 'mlopez762@gmail.com', "Natalie Sanz '00", 'Natalie@sanzmanagement.com'],
  ['Steevens Jean', '7th', 'B', 'Steevens Jean', 'steevensjean@live.com', 'Yessenia Jean', 'msyesseniamartinez@gmail.com'],
  ['Jessa Shankman', '7th', 'M', 'Kira Shalom', 'kshalom@gmail.com', 'Peter Shankman', 'peter@shankman.com'],
  ['Pascale Destin', '7th', 'B', 'Mark Anthony Destin', 'destinmark@gmail.com', 'Starr Blackshere-Destin', 'starr.blackshere@gmail.com'],
  ['Jackson Atienza', '7th', 'Q', 'Michelle Atienza', 'matienza@lrei.org', 'Rethier Atienza', 'rethier.atienza@gmail.com'],
  ['Cecilia Melzer', '7th', 'M', 'Isabel Melzer', 'isabelmelzer1@gmail.com', 'Thiago Melzer', 'tmelzer@gmail.com'],
  ['Leo Sabag', '7th', 'M', 'Sovina Doan', 'sovina@erezsabag.com', 'Erez Sabag', 'info@erezsabag.com'],
  ['Kay Chisling', '7th', 'M', 'Brian Chisling', 'bchisling1@gmail.com', 'Pamela Chisling', 'pamela.chisling@gmail.com'],
  ['Elliott Crawford', '8th', 'M', 'Kate Crawford', 'kate@katecrawford.net', 'Jason Schultz', 'lawgeek@gmail.com'],
  ['Kadin Khorasani', '8th', 'M', 'Cindy Khorasani', 'ckhorasani@gmail.com', 'Hooman Khorasani', 'hooman.khorasani@gmail.com'],
  ['Pia Tejada', '8th', 'B', 'Nicole LePage-Tejada', 'nicolelepage@gmail.com', 'Justin Tejada', 'justintejada1@gmail.com'],
  ['Stella Malfait', '8th', 'B', 'Min Lew', 'mintylewmin@gmail.com', 'Koen Malfait', 'koenmalfaitrsca@gmail.com'],
  ['Willa Sullivan', '8th', 'M', 'Margaret (Bensfield) Sullivan', 'margaret.b.sullivan@gmail.com', 'Teddy Sullivan', 'tedsullivan29@gmail.com'],
  ['Anike Maathey', '8th', 'B', 'Nsenga Bansfield', 'themaatheys@gmail.com', 'Richard Maathey', 'richm14@gmail.com'],
  ['Antonia Jones', '8th', 'B', 'Adrian Jones', 'awjonesnyc@gmail.com', 'Allison Silverman', 'allisonsilvermanjones@gmail.com'],
  ['Hannah Small', '8th', 'B', 'Lunie Small', 'lunie.small@gmail.com', 'Ramel Small', 'ramel.small36@gmail.com'],
  ['Lazer Grover-Scher', '8th', 'M', 'Allison Grover', 'algrover78@gmail.com', 'Susie Scher', 'susie.scher@mac.com'],
  ['Scarlett Zahedi', '8th', 'B', 'Amanda Field', 'amandakfield@gmail.com', 'Caveh Zahedi', 'cavehzahedi@gmail.com'],
  ['Hal Cohen', '8th', 'M', 'Cristi Andrews', 'candrewscohen@gmail.com', 'David Oliver Cohen', 'davidolivercohen@gmail.com', 'Flagged "**" in the source list - meaning unspecified, check with the office.']
];

function buildAmbassadorSeedRows_() {
  const headers = HEADERS[SHEETS.AMBASSADORS];
  return AMBASSADOR_SEED_TUPLES_.map(tuple => {
    const [fullName, grade, borough, p1Name, p1Email, p2Name, p2Email, notes] = tuple;
    const { first, last } = splitFullName_(fullName);
    return headers.map(h => {
      switch (h) {
        case 'First Name': return first;
        case 'Last Name': return last;
        case 'Grade': return grade || '';
        case 'Borough': return borough || '';
        case 'Parent 1 Name': return p1Name || '';
        case 'Parent 1 Email': return p1Email || '';
        case 'Parent 2 Name': return p2Name || '';
        case 'Parent 2 Email': return p2Email || '';
        case 'Teacher': return '';
        case 'Student Email': return '';
        case 'Active': return 'Yes';
        case 'Notes': return notes || '';
        default: return '';
      }
    });
  });
}

/* ==========================================================
 * HomeroomSeedData
 * ========================================================== */

/**
 * 2026-27 Middle School Homeroom/Advisories, transcribed from the
 * school's official roster PDF. Used to auto-fill each ambassador's
 * Grade, Homeroom Pod, and Teacher (=Advisor) by exact name match.
 *
 * Row counts were cross-checked against the "Total:" figures printed on
 * each homeroom page of the source PDF (CJM 21, RSS 19, EEL 18, MSB 17,
 * AOS 17, CCM 16, DJM 16, MMS 19 = 143 total Middle School students).
 */

const HOMEROOM_DATA_ = [
  { grade: '8', pod: 'CJM', advisors: {
    'Chris': ['Banks Bauer', 'Damien Sandelowsky Weinryt', 'Elias Cuaron', 'Irie Bocchino', 'Lorne Mitchell', 'Sanai Parikh', 'Sophia Pena'],
    'Janet': ['Delphine Lefleur', 'Jackson Atienza', 'Leonie Sabag', 'Naoki Umehara', 'Ori Cunningham', 'Rhys Quarfordt', 'Zaida Richardson'],
    'Momii': ['Cyrus Dancy', 'Ethan Bruno', 'Felix Lopez', 'Humphrey Squadron', 'Kay Chisling', 'Logan Vouvalides', 'Paloma White']
  }},
  { grade: '8', pod: 'RSS', advisors: {
    'Rohan': ['Aksel Ozturk', 'Cecilia Melzer', 'Christopher Dike', 'Joseph Corwin', 'Margo Moss', 'Wylie Schwarz', 'Zay Casey'],
    'Susannah': ['Jessa Shankman', 'Kayla Gary', 'Nicholas Johnson', 'Ricky Rodriguez', 'Soraya Ghavidel'],
    'Suzanne': ['Emersyn Barile', 'Frank Durst', 'Harriet (Hattie) Owens', 'Leleanna Supan', 'Marcel McAlpin', 'Pascale Destin', 'Steevens Jean']
  }},
  { grade: '7', pod: 'EEL', advisors: {
    'Eliza': ['Afia-Kusiwaa Twumasi', 'Anthony Rosen', 'Eva Ladd-Greene', 'Oscar Morales', 'Solomon Pearce', 'Teo Linville Kendall'],
    'Elizabeth': ['Brixton Chaffee', 'Leo Askill-Ryan', 'Logan Lai', 'Lulu De Guzman-Schaffer', 'Pierce Shea', 'Seren Kaiser'],
    'Luis': ['Blake Glenn', 'Caper Helliker', 'Charlotte Schwartz', 'Isabella Westlake', 'Julien Kelly-Green', 'Michelle Denson']
  }},
  { grade: '7', pod: 'MSB', advisors: {
    'Mary Katherine': ['Alia Vinet', 'Alma Bradley', 'Diego Ocotl', 'Emilio Hernandez', 'Gabriel Maczka', 'Kazuma Matsumoto'],
    'Brendan': ['Ama Bediako Whyte', 'Arlo Berg', 'August (Gus) Gordon', 'Emma Cobert', 'Luca Amoia', 'Mika Bocchino'],
    'Sabrina': ['Alejandrina (Ale) Chapman', 'Daschel McMahon', 'Larkin Bagley', 'Malcolm Vincent-Gravenhise', 'Reagan Rhau']
  }},
  { grade: '6', pod: 'AOS', advisors: {
    'Amanda': ['Clemente Perez', 'Edward Dickerson', 'Ethan Akuffo Djan', 'Piper Bess', 'Sebastian Block'],
    'Oliver': ['Benjamin Rogoff', 'Camille Bedeau', 'Eleanor Owens', 'Laura Sandoval', 'Ocea Currie', 'Toby Imberman'],
    'Sharyn': ['Cara "Cici" Cohen', 'Liam Silverstein', 'Malcolm Mensch', 'Milo Dowling Anderson', 'Sachin Gopal', 'Tessa Fung']
  }},
  { grade: '6', pod: 'CCM', advisors: {
    'Carrie': ['Jane Moss', 'Julian Lopez', 'Marlow Meshberg', 'Sadie Imperioli'],
    'Chantilly': ['Avery Griffiths', 'Axel Peters', 'Cassidy Handler', 'George McNulty', 'Gus McKay', 'Skylar Bruno'],
    'Marco': ['August Jones', 'Aurelia Walker', 'Elias "Eli" Fernandez', 'Frances Cooper', 'Hugh Nottingham', 'Jordan Gary']
  }},
  { grade: '6', pod: 'DJM', advisors: {
    'Dan': ['Ashur Valdez', 'Curtis Rosenberg', 'Harper Yun-Dea', 'Jacob Sagner-Washington', 'Oscar Gutmann', 'Saviour Boxill'],
    'Jeremiah': ['Charli Cooper', 'Errol Grant', 'Jackson Terranova', 'Lev David', 'Penelope Lansdale'],
    'Mala': ['Alice Chen', 'George Orlofsky', 'Leo Nachum', 'Mateo Moran', 'Sadie Toussant']
  }},
  { grade: '5', pod: 'MMS', advisors: {
    'Mo': ['Aeon Anjargolian', 'Alexander Rogoff', 'Archimedes Gutmann', 'Isabella Dike', 'Olivia Lee', 'Rhea Kaiser', 'Roger Sierant'],
    'Molly': ['Ellis Ahmed', 'Ezra Fisher', 'Matteo Keklikian', 'McKenna Rodzevicius', 'Perla Dunn', 'Tobik Maczka'],
    'Sherezada': ['Aiden Tedder', 'Edie Gerson', 'Joakim Leon-McCool', 'Liv Feldman', 'Luka Cuparic', 'Miles Titus']
  }}
];

function getAllAdvisorNames_() {
  const names = {};
  HOMEROOM_DATA_.forEach(section => Object.keys(section.advisors).forEach(a => { names[a] = true; }));
  return Object.keys(names).sort();
}

function buildHomeroomLookup_() {
  const map = {};
  HOMEROOM_DATA_.forEach(section => {
    Object.keys(section.advisors).forEach(advisor => {
      section.advisors[advisor].forEach(name => {
        map[normalizeName_(name)] = { grade: section.grade, pod: section.pod, advisor: advisor };
      });
    });
  });
  return map;
}

/* ==========================================================
 * TourRoutesSeedData
 * ========================================================== */

/**
 * The 7 fixed walking tour routes, transcribed from Tour_Routes_2026-2027.pdf.
 * Each runs 8:30-9:25 in parallel with the others on a tour morning, so a
 * given route can only be used by one touring student/family at a time.
 */

const TOUR_ROUTE_SEED_ = [
  {
    route: '1', direction: 'Bottom-Up', humanities: 'Elizabeth (M107)', language: 'Mandarin',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:32 Library',
      '8:34 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:38 Co-Lab',
      '8:42 7th Grade Humanities - Elizabeth (M107)',
      '8:46 Mandarin (M208) - talk about world languages',
      '8:49 Art (M306)',
      '8:53 Main Science Lab (M307) - talk about robotics',
      '8:55 Learning Center',
      '8:59 8th Grade Math (M308)',
      '9:03 6th Grade Science (M310)',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '2', direction: 'Top-Down', humanities: 'Sabrina (M108)', language: 'Spanish',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:34 8th Grade Math (M308)',
      '8:36 Learning Center',
      '8:40 6th Grade Science (M310)',
      '8:44 Main Science Lab (M307) - talk about robotics',
      '8:47 Art (M306)',
      '8:51 Spanish (M209)',
      '8:55 7th Grade Humanities - Sabrina (M108)',
      '8:57 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:59 Library',
      '9:03 Co-Lab',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '3', direction: 'Bottom-Up', humanities: 'Sabrina (M108)', language: 'Mandarin',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:32 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:36 Co-Lab',
      '8:38 Library',
      '8:42 7th Grade Humanities - Sabrina (M108)',
      '8:46 Mandarin (M208) - talk about world languages',
      '8:50 Main Science Lab (M307) - talk about robotics also',
      '8:53 Art (M306)',
      '8:57 8th Grade Math (M308)',
      '9:01 6th Grade Science (M310)',
      '9:03 Learning Center',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '4', direction: 'Top-Down', humanities: 'Elizabeth (M107)', language: 'Spanish',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:34 6th Grade Science (M310)',
      '8:38 8th Grade Math (M308)',
      '8:40 Learning Center',
      '8:43 Art (M306)',
      '8:47 Main Science Lab (M307) - talk about robotics also',
      '8:51 Spanish (M209)',
      '8:55 7th Grade Humanities - Elizabeth (M107)',
      '8:59 Co-Lab',
      '9:01 Sports Bulletin Board (next to front desk, talk about sports)',
      '9:03 Library',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '5', direction: 'Bottom-Up', humanities: 'Elizabeth (M107)', language: 'Spanish',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:34 Co-Lab',
      '8:36 Library',
      '8:38 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:42 7th Grade Humanities - Elizabeth (M107)',
      '8:46 Spanish (M209)',
      '8:49 Art (M306)',
      '8:53 Main Science Lab (M307) - talk about robotics also',
      '8:57 6th Grade Science (M310)',
      '8:59 Learning Center',
      '9:03 8th Grade Math (M308)',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '6', direction: 'Top-Down', humanities: 'Sabrina (M108)', language: 'Mandarin',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:32 Learning Center',
      '8:36 8th Grade Math (M308)',
      '8:40 6th Grade Science (M310)',
      '8:44 Main Science Lab (M307) - talk about robotics also',
      '8:47 Art (M306)',
      '8:51 Mandarin (M208) - talk about world languages',
      '8:55 7th Grade Humanities - Sabrina (M108)',
      '8:57 Library',
      '8:59 Sports Bulletin Board (next to front desk, talk about sports)',
      '9:03 Co-Lab',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  },
  {
    route: '7', direction: 'Bottom-Up', humanities: 'Sabrina (M108)', language: 'Spanish',
    itinerary: [
      '8:30 Leave cafeteria to start tour',
      '8:32 Library',
      '8:36 Co-Lab',
      '8:38 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:42 7th Grade Humanities - Sabrina (M108)',
      '8:46 Spanish (M209)',
      '8:50 Main Science Lab (M307) - talk about robotics also',
      '8:53 Art (M306)',
      '8:55 Learning Center',
      '8:59 6th Grade Science (M310)',
      '9:03 8th Grade Math (M308)',
      '9:06 Bring visitors to class - Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  }
];

const TOUR_ROUTE_NUMBERS = TOUR_ROUTE_SEED_.map(r => r.route);

/* ==========================================================
 * BellScheduleSeedData
 * ========================================================== */

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
