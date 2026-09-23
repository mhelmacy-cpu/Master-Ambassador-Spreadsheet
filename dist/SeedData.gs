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
        case 'Advisor': return '';
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
 * The 2026-27 Middle School roster, from the office's own
 * MS-Alpha_by_Grade workbook: one record per student, 143 in all.
 *
 * Every field here is something the tool would otherwise have to guess:
 *
 *   pod       the homeroom column the bell schedule is keyed on
 *   advisor   who hears "your advisee is out for a tour"
 *   split     A, B or C - which half (or third) of the pod the student
 *             is in for the periods that split. The bell schedule names
 *             both halves but never who is in which, so this is the
 *             answer to that.
 *   language  French, Mandarin or Spanish. The schedule prints the
 *             language period as all three at once, so this is what
 *             turns it into one class and one teacher.
 *
 * Two honest gaps, both left blank rather than guessed:
 *
 * 1. Fifth grade does not have a fixed language - MMS rotates through
 *    all three. The rotation below is the first one only (Sept 8 to
 *    Oct 2), which is as far as the workbook was filled in. After Oct 2
 *    these are stale: update them on the Ambassadors sheet when the
 *    office sets the next rotation, or re-run Sync Homerooms once this
 *    file is updated.
 * 2. Three eighth graders take no language at all, so theirs is blank
 *    on purpose.
 */

const MS_ROSTER_ = [
  { name: 'Banks Bauer', email: '31BanksB@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'B', language: 'French' },
  { name: 'Damien Sandelowsky Weinryt', email: '31DamienS@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'B', language: 'French' },
  { name: 'Elias Cuaron', email: '31EliasC@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'A', language: 'French' },
  { name: 'Irie Bocchino', email: '31IrieB@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'A', language: 'Spanish' },
  { name: 'Lorne Mitchell', email: '31LorneM@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'B', language: 'Mandarin' },
  { name: 'Sanai Parikh', email: '31SanaiP@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'A', language: 'French' },
  { name: 'Sophia Pena', email: '31SophiaP@lrei.org', grade: '8', pod: 'CJM', advisor: 'Chris', split: 'A', language: 'Mandarin' },
  { name: 'Delphine Lefleur', email: '31DelphineL@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'B', language: 'Mandarin' },
  { name: 'Jackson Atienza', email: '31JacksonA@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'A', language: 'Mandarin' },
  { name: 'Leonie Sabag', email: '31LeonieS@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'B', language: 'Mandarin' },
  { name: 'Naoki Umehara', email: '31NaokiU@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'A', language: 'Mandarin' },
  { name: 'Ori Cunningham', email: '31OriC@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'A', language: 'Mandarin' },
  { name: 'Rhys Quarfordt', email: '31RhysQ@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'A', language: 'Mandarin' },
  { name: 'Zaida Richardson', email: '31ZaidaR@lrei.org', grade: '8', pod: 'CJM', advisor: 'Janet', split: 'B', language: 'Mandarin' },
  { name: 'Cyrus Dancy', email: '31CyrusD@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'B', language: 'Mandarin' },
  { name: 'Ethan Bruno', email: '31EthanB@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'B', language: '' },
  { name: 'Felix Lopez', email: '31FelixL@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'B', language: 'Spanish' },
  { name: 'Humphrey Squadron', email: '31HumphreyS@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'A', language: 'Spanish' },
  { name: 'Kay Chisling', email: '31KayC@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'B', language: 'French' },
  { name: 'Logan Vouvalides', email: '31LoganV@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'A', language: 'French' },
  { name: 'Paloma White', email: '31PalomaW@lrei.org', grade: '8', pod: 'CJM', advisor: 'Momii', split: 'A', language: 'Mandarin' },
  { name: 'Aksel Ozturk', email: '31AkselO@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'B', language: 'Spanish' },
  { name: 'Cecilia Melzer', email: '31CeciliaM@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'B', language: 'French' },
  { name: 'Christopher Dike', email: '31ChristopherD@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'A', language: 'Spanish' },
  { name: 'Joseph Corwin', email: '31JosephC@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'B', language: 'Mandarin' },
  { name: 'Margo Moss', email: '31MargoM@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'B', language: 'Mandarin' },
  { name: 'Wylie Schwarz', email: '31WylieS@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'B', language: 'Spanish' },
  { name: 'Zay Casey', email: '31ZayC@lrei.org', grade: '8', pod: 'RSS', advisor: 'Rohan', split: 'A', language: 'French' },
  { name: 'Jessa Shankman', email: '31JessaS@lrei.org', grade: '8', pod: 'RSS', advisor: 'Susannah', split: 'A', language: 'Spanish' },
  { name: 'Kayla Gary', email: '31KaylaG@lrei.org', grade: '8', pod: 'RSS', advisor: 'Susannah', split: 'B', language: '' },
  { name: 'Nicholas Johnson', email: '31NicholasJ@lrei.org', grade: '8', pod: 'RSS', advisor: 'Susannah', split: 'A', language: 'Spanish' },
  { name: 'Ricky Rodriguez', email: '31RickyR@lrei.org', grade: '8', pod: 'RSS', advisor: 'Susannah', split: 'A', language: 'Spanish' },
  { name: 'Soraya Ghavidel', email: '31SorayaG@lrei.org', grade: '8', pod: 'RSS', advisor: 'Susannah', split: 'B', language: '' },
  { name: 'Emersyn Barile', email: '31EmersynB@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'B', language: 'Mandarin' },
  { name: 'Frank Durst', email: '31FrankD@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'B', language: 'Mandarin' },
  { name: 'Harriet (Hattie) Owens', email: '31Harriet (Hattie)O@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'A', language: 'French' },
  { name: 'Leleanna Supan', email: '31LeleannaS@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'A', language: 'French' },
  { name: 'Marcel McAlpin', email: '31MarcelM@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'B', language: 'Mandarin' },
  { name: 'Pascale Destin', email: '31PascaleD@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'A', language: 'French' },
  { name: 'Steevens Jean', email: '31SteevensJ@lrei.org', grade: '8', pod: 'RSS', advisor: 'Suzanne', split: 'A', language: 'Spanish' },
  { name: 'Afia-Kusiwaa Twumasi', email: '32Afia-KusiwaaT@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'A', language: 'French' },
  { name: 'Anthony Rosen', email: '32AnthonyR@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'B', language: 'Mandarin' },
  { name: 'Eva Ladd-Greene', email: '32EvaL@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'A', language: 'Spanish' },
  { name: 'Oscar Morales', email: '32OscarM@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'B', language: 'Spanish' },
  { name: 'Solomon Pearce', email: '32SolomonP@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'A', language: 'French' },
  { name: 'Teo Linville Kendall', email: '32TeoL@lrei.org', grade: '7', pod: 'EEL', advisor: 'Eliza', split: 'A', language: 'Spanish' },
  { name: 'Brixton Chaffee', email: '32BrixtonC@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'A', language: 'Mandarin' },
  { name: 'Leo Askill-Ryan', email: '32LeoA@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'A', language: 'Spanish' },
  { name: 'Logan Lai', email: '32LoganL@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'A', language: 'Mandarin' },
  { name: 'Lulu De Guzman-Schaffer', email: '32LuluD@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'B', language: 'Mandarin' },
  { name: 'Pierce Shea', email: '32PierceS@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'B', language: 'Spanish' },
  { name: 'Seren Kaiser', email: '32SerenK@lrei.org', grade: '7', pod: 'EEL', advisor: 'Elizabeth', split: 'B', language: 'Spanish' },
  { name: 'Blake Glenn', email: '32BlakeG@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'B', language: 'Spanish' },
  { name: 'Caper Helliker', email: '32CaperH@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'A', language: 'French' },
  { name: 'Charlotte Schwartz', email: '32CharlotteS@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'A', language: 'French' },
  { name: 'Isabella Westlake', email: '32IsabellaW@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'B', language: 'Spanish' },
  { name: 'Julien Kelly-Green', email: '32JulienK@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'B', language: 'Spanish' },
  { name: 'Michelle Denson', email: '32MichelleD@lrei.org', grade: '7', pod: 'EEL', advisor: 'Luis', split: 'B', language: 'French' },
  { name: 'Ama Bediako Whyte', email: '32AmaB@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'B', language: 'Mandarin' },
  { name: 'Arlo Berg', email: '32ArloB@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'A', language: 'Mandarin' },
  { name: 'August (Gus) Gordon', email: '32August (Gus)G@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'A', language: 'Spanish' },
  { name: 'Emma Cobert', email: '32EmmaC@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'B', language: 'French' },
  { name: 'Luca Amoia', email: '32LucaA@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'B', language: 'Mandarin' },
  { name: 'Mika Bocchino', email: '32MikaB@lrei.org', grade: '7', pod: 'MSB', advisor: 'Brendan', split: 'A', language: 'French' },
  { name: 'Alia Vinet', email: '32AliaV@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'B', language: 'French' },
  { name: 'Alma Bradley', email: '32AlmaB@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'A', language: 'French' },
  { name: 'Diego Ocotl', email: '32DiegoO@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'B', language: 'Mandarin' },
  { name: 'Emilio Hernandez', email: '32EmilioH@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'A', language: 'Spanish' },
  { name: 'Gabriel Maczka', email: '32GabrielM@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'A', language: 'French' },
  { name: 'Kazuma Matsumoto', email: '32KazumaM@lrei.org', grade: '7', pod: 'MSB', advisor: 'Mary Katherine', split: 'B', language: 'Mandarin' },
  { name: 'Alejandrina (Ale) Chapman', email: '32Alejandrina (Ale)C@lrei.org', grade: '7', pod: 'MSB', advisor: 'Sabrina', split: 'A', language: 'Mandarin' },
  { name: 'Daschel McMahon', email: '32DaschelM@lrei.org', grade: '7', pod: 'MSB', advisor: 'Sabrina', split: 'B', language: 'French' },
  { name: 'Larkin Bagley', email: '32LarkinB@lrei.org', grade: '7', pod: 'MSB', advisor: 'Sabrina', split: 'B', language: 'Spanish' },
  { name: 'Malcolm Vincent-Gravenhise', email: '32MalcolmV@lrei.org', grade: '7', pod: 'MSB', advisor: 'Sabrina', split: 'A', language: 'Mandarin' },
  { name: 'Reagan Rhau', email: '32ReaganR@lrei.org', grade: '7', pod: 'MSB', advisor: 'Sabrina', split: 'B', language: 'Mandarin' },
  { name: 'Ashur Valdez', email: '33AshurV@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'C', language: 'French' },
  { name: 'Curtis Rosenberg', email: '33CurtisR@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'B', language: 'Spanish' },
  { name: 'Harper Yun-Dea', email: '33HarperY@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'B', language: 'Mandarin' },
  { name: 'Jacob Sagner-Washington', email: '33JacobS@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'B', language: 'Spanish' },
  { name: 'Oscar Gutmann', email: '33OscarG@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'C', language: 'French' },
  { name: 'Saviour Boxill', email: '33SaviourB@lrei.org', grade: '6', pod: 'DJM', advisor: 'Dan', split: 'B', language: 'Spanish' },
  { name: 'Charli Cooper', email: '33CharliC@lrei.org', grade: '6', pod: 'DJM', advisor: 'Jeremiah', split: 'C', language: 'Spanish' },
  { name: 'Errol Grant', email: '33ErrolG@lrei.org', grade: '6', pod: 'DJM', advisor: 'Jeremiah', split: 'A', language: 'Spanish' },
  { name: 'Jackson Terranova', email: '33JacksonT@lrei.org', grade: '6', pod: 'DJM', advisor: 'Jeremiah', split: 'C', language: 'Mandarin' },
  { name: 'Lev David', email: '33LevD@lrei.org', grade: '6', pod: 'DJM', advisor: 'Jeremiah', split: 'A', language: 'Spanish' },
  { name: 'Penelope Lansdale', email: '33PenelopeL@lrei.org', grade: '6', pod: 'DJM', advisor: 'Jeremiah', split: 'C', language: 'French' },
  { name: 'Alice Chen', email: '33AliceC@lrei.org', grade: '6', pod: 'DJM', advisor: 'Mala', split: 'B', language: 'Mandarin' },
  { name: 'George Orlofsky', email: '33GeorgeO@lrei.org', grade: '6', pod: 'DJM', advisor: 'Mala', split: 'C', language: 'French' },
  { name: 'Leo Nachum', email: '33LeoN@lrei.org', grade: '6', pod: 'DJM', advisor: 'Mala', split: 'A', language: 'Mandarin' },
  { name: 'Mateo Moran', email: '33MateoM@lrei.org', grade: '6', pod: 'DJM', advisor: 'Mala', split: 'A', language: 'Spanish' },
  { name: 'Sadie Toussant', email: '33SadieT@lrei.org', grade: '6', pod: 'DJM', advisor: 'Mala', split: 'A', language: 'Mandarin' },
  { name: 'Clemente Perez', email: '33ClementeP@lrei.org', grade: '6', pod: 'AOS', advisor: 'Amanda', split: 'B', language: 'Mandarin' },
  { name: 'Edward Dickerson', email: '33EdwardD@lrei.org', grade: '6', pod: 'AOS', advisor: 'Amanda', split: 'A', language: 'Mandarin' },
  { name: 'Ethan Akuffo Djan', email: '33EthanA@lrei.org', grade: '6', pod: 'AOS', advisor: 'Amanda', split: 'A', language: 'Mandarin' },
  { name: 'Piper Bess', email: '33PiperB@lrei.org', grade: '6', pod: 'AOS', advisor: 'Amanda', split: 'B', language: 'French' },
  { name: 'Sebastian Block', email: '33SebastianB@lrei.org', grade: '6', pod: 'AOS', advisor: 'Amanda', split: 'B', language: 'French' },
  { name: 'Benjamin Rogoff', email: '33BenjaminR@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'C', language: 'Mandarin' },
  { name: 'Camille Bedeau', email: '33CamilleB@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'C', language: 'Mandarin' },
  { name: 'Eleanor Owens', email: '33EleanorO@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'C', language: 'French' },
  { name: 'Laura Sandoval', email: '33LauraS@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'C', language: 'French' },
  { name: 'Ocea Currie', email: '33OceaC@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'B', language: 'Spanish' },
  { name: 'Toby Imberman', email: '33TobyI@lrei.org', grade: '6', pod: 'AOS', advisor: 'Oliver', split: 'B', language: 'Spanish' },
  { name: 'Cara "Cici" Cohen', email: '33Cara "Cici"C@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'B', language: 'Spanish' },
  { name: 'Liam Silverstein', email: '33LiamS@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'C', language: 'French' },
  { name: 'Malcolm Mensch', email: '33MalcolmM@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'A', language: 'Spanish' },
  { name: 'Milo Dowling Anderson', email: '33MiloD@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'B', language: 'Mandarin' },
  { name: 'Sachin Gopal', email: '33SachinG@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'C', language: 'Spanish' },
  { name: 'Tessa Fung', email: '33TessaF@lrei.org', grade: '6', pod: 'AOS', advisor: 'Sharyn', split: 'A', language: 'Mandarin' },
  { name: 'Jane Moss', email: '33JaneM@lrei.org', grade: '6', pod: 'CCM', advisor: 'Carrie', split: 'A', language: 'Spanish' },
  { name: 'Julian Lopez', email: '33JulianL@lrei.org', grade: '6', pod: 'CCM', advisor: 'Carrie', split: 'B', language: 'Spanish' },
  { name: 'Marlow Meshberg', email: '33MarlowM@lrei.org', grade: '6', pod: 'CCM', advisor: 'Carrie', split: 'C', language: 'French' },
  { name: 'Sadie Imperioli', email: '33SadieI@lrei.org', grade: '6', pod: 'CCM', advisor: 'Carrie', split: 'A', language: 'Spanish' },
  { name: 'Avery Griffiths', email: '33AveryG@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'A', language: 'Mandarin' },
  { name: 'Axel Peters', email: '33AxelP@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'C', language: 'Mandarin' },
  { name: 'Cassidy Handler', email: '33CassidyH@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'B', language: 'Spanish' },
  { name: 'George McNulty', email: '33GeorgeM@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'C', language: 'Spanish' },
  { name: 'Gus McKay', email: '33GusM@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'A', language: 'Mandarin' },
  { name: 'Skylar Bruno', email: '33SkylarB@lrei.org', grade: '6', pod: 'CCM', advisor: 'Chantilly', split: 'C', language: 'Mandarin' },
  { name: 'August Jones', email: '33AugustJ@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'B', language: 'Spanish' },
  { name: 'Aurelia Walker', email: '33AureliaW@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'B', language: 'Mandarin' },
  { name: 'Elias "Eli" Fernandez', email: '33Elias "Eli"F@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'A', language: 'French' },
  { name: 'Frances Cooper', email: '33FrancesC@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'A', language: 'Mandarin' },
  { name: 'Hugh Nottingham', email: '33HughN@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'B', language: 'Mandarin' },
  { name: 'Jordan Gary', email: '33JordanG@lrei.org', grade: '6', pod: 'CCM', advisor: 'Marco', split: 'A', language: 'Mandarin' },
  { name: 'Aeon Anjargolian', email: '34AeonA@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: 'French' },
  { name: 'Alexander Rogoff', email: '34AlexanderR@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: 'Spanish' },
  { name: 'Archimedes Gutmann', email: '34ArchimedesG@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: 'French' },
  { name: 'Isabella Dike', email: '34IsabellaD@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: 'Mandarin' },
  { name: 'Olivia Lee', email: '34OliviaL@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: 'Spanish' },
  { name: 'Rhea Kaiser', email: '34RheaK@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'B', language: 'Mandarin' },
  { name: 'Roger Sierant', email: '34RogerS@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'B', language: 'Spanish' },
  { name: 'Ellis Ahmed', email: '34EllisA@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'A', language: 'Spanish' },
  { name: 'Ezra Fisher', email: '34EzraF@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: 'French' },
  { name: 'Matteo Keklikian', email: '34MatteoK@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: 'Spanish' },
  { name: 'McKenna Rodzevicius', email: '34McKennaR@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'A', language: 'French' },
  { name: 'Perla Dunn', email: '34PerlaD@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: 'French' },
  { name: 'Tobik Maczka', email: '34TobikM@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: 'French' },
  { name: 'Aiden Tedder', email: '34AidenT@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'A', language: 'Mandarin' },
  { name: 'Edie Gerson', email: '34EdieG@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: 'Mandarin' },
  { name: 'Joakim Leon-McCool', email: '34JoakimL@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: 'Spanish' },
  { name: 'Liv Feldman', email: '34LivF@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: 'Spanish' },
  { name: 'Luka Cuparic', email: '34LukaC@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: 'Mandarin' },
  { name: 'Miles Titus', email: '34MilesT@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'A', language: 'Mandarin' }
];

/** The date the seeded fifth-grade language rotation stops being true. */
const FIFTH_GRADE_LANGUAGE_ROTATION_ENDS_ = '2026-10-02';

function getAllAdvisorNames_() {
  const names = {};
  MS_ROSTER_.forEach(s => { if (s.advisor) names[s.advisor] = true; });
  return Object.keys(names).sort();
}

function buildHomeroomLookup_() {
  const map = {};
  MS_ROSTER_.forEach(s => {
    map[normalizeName_(s.name)] = {
      grade: s.grade, pod: s.pod, advisor: s.advisor,
      split: s.split, language: s.language, email: s.email
    };
  });
  return map;
}

/**
 * The old grade/pod/advisor shape, rebuilt from the roster so the two
 * can never drift apart.
 */
const HOMEROOM_DATA_ = (function () {
  const sections = [];
  const index = {};
  MS_ROSTER_.forEach(s => {
    const key = s.grade + '|' + s.pod;
    if (!index[key]) {
      index[key] = { grade: s.grade, pod: s.pod, advisors: {} };
      sections.push(index[key]);
    }
    const advisors = index[key].advisors;
    if (!advisors[s.advisor]) advisors[s.advisor] = [];
    advisors[s.advisor].push(s.name);
  });
  return sections;
})();

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
 * 2026-27 Middle School bell schedule, read straight off
 * 2026-27_MS_Schedule_FINAL (updated 9/2026): one entry per pod, per
 * block, per day.
 *
 * How it was read: the grid's left ruler is the clock in 5-minute rows,
 * and every block's top and bottom edge is that period's real start and
 * end time. Each cell's fill boundary was measured off the page rather
 * than guessed, so the times below are the times on the schedule.
 *
 * One honest caveat, surfaced in the UI rather than hidden: some blocks
 * are parallel groups the schedule names without saying which student
 * is in which - the language choice (French M207 / Mandarin M208 /
 * Spanish M209), Majors and Electives, and the MMS blocks marked
 * '(split A)' / '(split B)'. Fill in an ambassador's
 * Language and Split on the Ambassadors sheet and the tool resolves
 * those to one class; leave them blank and it reports the options
 * instead of guessing.
 *
 * Every row is editable on the Bell Schedule sheet, and the lookups
 * read that sheet in preference to this file once setup has run.
 */

const BELL_SCHEDULE_ = {
  'Monday': {
    'MMS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','10:15','French - M207 Mandarin - M208 Spanish - M209'], ['10:15','11:00','Hum MN M212'], ['11:00','11:30','Lunch JL, SA'], ['11:30','12:00','Recess MB, CB'], ['12:00','12:45','PE LH TSAC'], ['12:45','13:30','Science SA M310'], ['13:30','14:15','Math A MD M311 (split A)'], ['13:30','14:15','Hum B MN M212 (split B)'], ['14:15','15:00','Hum A MN M212 (split A)'], ['14:15','15:00','Math B MD M311 (split B)'], ['15:00','15:10','IWP']],
    'DJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','10:15','Math A CB M311'], ['10:15','11:00','Music A CN M103'], ['11:00','11:30','Lunch JL, SA'], ['11:30','12:00','Recess MB, CB'], ['12:00','13:30','Hum DR M211'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','PE A LH TSAC'], ['15:00','15:10','IWP']],
    'AOS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','10:15','PE B LH TSAC'], ['10:15','11:00','Math B CB M311'], ['11:00','11:30','Lunch JL, SA'], ['11:30','12:00','Recess MB, CB'], ['12:00','13:30','Hum AG M209'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','Music B CN M103'], ['15:00','15:10','IWP']],
    'CCM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','11:00','Science C OC M310'], ['11:00','11:30','Lunch JL, SA'], ['11:30','12:00','Recess MB, CB'], ['12:00','13:30','Hum MS M212'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','Math C CB M310'], ['15:00','15:10','IWP']],
    'EEL': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','11:00','Hum ES M107'], ['11:00','11:30','Recess AG, DR'], ['11:30','12:00','Lunch SF, SdB'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','PE A LH TSAC'], ['13:30','14:15','Math A CK M308'], ['14:15','15:00','French - M207 Mandarin - M208 Spanish - M209'], ['15:00','15:10','IWP']],
    'MSB': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','11:00','Hum SdB M108'], ['11:00','11:30','Recess AG, DR'], ['11:30','12:00','Lunch SF, SdB'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','Math B CK M308'], ['13:30','14:15','PE B LH TSAC'], ['14:15','15:00','French - M207 Mandarin - M208 Spanish - M209'], ['15:00','15:10','IWP']],
    'CJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','10:15','Math A CK M308'], ['10:15','11:00','PE A BR TSAC'], ['11:00','11:30','Recess AG, DR'], ['11:30','12:00','Lunch SF, SdB'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','Hum As SMR+SC M107+M108'], ['13:30','15:00','Science A LL/EZ M307'], ['15:00','15:10','IWP']],
    'RSS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','MS Meeting'], ['9:30','11:00','Science B LL/EZ M307'], ['11:00','11:30','Recess AG, DR'], ['11:30','12:00','Lunch SF, SdB'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','PE B BR Charlton'], ['13:30','14:15','Hum Bs SMR+SC M107+M108'], ['14:15','15:00','Math B CK M308'], ['15:00','15:10','IWP']]
  },
  'Tuesday': {
    'MMS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math MD M311'], ['9:30','10:15','Choices LA M211'], ['10:15','11:00','5/6 Electives Dance - Thompson Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SH'], ['11:30','12:00','Recess CN, AG'], ['12:00','12:45','PE LH TSAC'], ['12:45','13:30','Music CN M103'], ['13:30','14:45','Hum MN M212'], ['14:45','15:10','IWP']],
    'DJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Choices A LA M211'], ['9:30','10:15','Math A CB M311'], ['10:15','11:00','5/6 Electives Dance - Thompson Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SH'], ['11:30','12:00','Recess CN, AG'], ['12:00','13:15','Hum DR M211'], ['13:15','14:45','Science A OC M310'], ['14:45','15:10','IWP']],
    'AOS': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science B OC M310'], ['10:15','11:00','5/6 Electives Dance - Thompson Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SH'], ['11:30','12:00','Recess CN, AG'], ['12:00','13:15','Hum AG M209'], ['13:15','14:00','Choices B LA M211'], ['14:00','14:45','Math B CB M311'], ['14:45','15:10','IWP']],
    'CCM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Music C CN M103'], ['9:30','10:15','Art C M306'], ['10:15','11:00','5/6 Electives Dance - Thompson Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SH'], ['11:30','12:00','Recess CN, AG'], ['12:00','13:15','Hum MS M212'], ['13:15','14:00','Math C CB M311'], ['14:00','14:45','PE C LH TSAC'], ['14:45','15:10','IWP']],
    'EEL': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Hum As ES+SdB M107 M108'], ['9:30','10:15','Math A CK M308'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess SdB, ES'], ['11:30','12:00','Lunch JD, BC'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','13:15','Hum ES M107'], ['13:15','14:45','Science A LL/EZ M307'], ['14:45','15:10','IWP']],
    'MSB': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science B LL/EZ M307'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess SdB, ES'], ['11:30','12:00','Lunch JD, BC'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','13:15','Hum SdB M108'], ['13:15','14:00','Hum Bs ES+SdB M107 M108'], ['14:00','14:45','Math B CK M308'], ['14:45','15:10','IWP']],
    'CJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math A CK M308'], ['9:30','11:00','Hum SMR M107'], ['11:00','11:30','Recess SdB, ES'], ['11:30','12:00','Lunch JD, BC'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','13:30','PE A BR TSAC'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','CAP'], ['15:00','15:10','IWP']],
    'RSS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','PE B BR TSAC'], ['9:30','11:00','Hum SC M108'], ['11:00','11:30','Recess SdB, ES'], ['11:30','12:00','Lunch JD, BC'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','13:30','Math B CK M308'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','CAP'], ['15:00','15:10','IWP']]
  },
  'Wednesday': {
    'MMS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','French - M207 Mandarin - M208 Spanish - M209'], ['9:30','10:15','Hum MN M212'], ['10:15','11:00','5/6 Electives Dance - PAPAS Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SA'], ['11:30','12:00','Recess OC, MB'], ['12:00','12:45','Math MD M311'], ['12:45','13:30','Hum A MN M212 (split A)'], ['12:45','13:30','Science SA M310 (split B)'], ['13:30','14:15','Science SA M310 (split A)'], ['13:30','14:15','Hum B MN M212 (split B)'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'DJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math A CB M311'], ['9:30','10:15','PE A LH TSAC'], ['10:15','11:00','5/6 Electives Dance - PAPAS Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SA'], ['11:30','12:00','Recess OC, MB'], ['12:00','12:45','Hum DR M211'], ['12:45','13:30','B Art A M306'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'AOS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Art B M306'], ['9:30','10:15','Math B CB M311'], ['10:15','11:00','5/6 Electives Dance - PAPAS Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SA'], ['11:30','12:00','Recess OC, MB'], ['12:00','12:45','Hum AG M209'], ['12:45','13:30','PE B LH TSAC'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'CCM': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science C OC M310'], ['10:15','11:00','5/6 Electives Dance - PAPAS Drama - M212 Modern Band - Auditorium Animation - L104 Vocal Ensemble - M103'], ['11:00','11:30','Lunch MS, SA'], ['11:30','12:00','Recess OC, MB'], ['12:00','12:45','Hum MS M212'], ['12:45','13:30','Math C CB M311'], ['13:30','14:15','French - M207 Mandarin - M208 Spanish - M209'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'EEL': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science A LL/EZ M307'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess SMR, DR'], ['11:30','12:00','Lunch MN, SC'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','Math A CK M308'], ['13:30','14:15','Hum As ES+SdB M107 M108'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'MSB': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Hum Bs ES+SdB M107 M108'], ['9:30','10:15','Math B CK M308'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess SMR, DR'], ['11:30','12:00','Lunch MN, SC'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','14:15','Science B LL/EZ M307'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'CJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math A CK M308'], ['9:30','11:00','Hum SMR M107'], ['11:00','11:30','Recess SMR, DR'], ['11:30','12:00','Lunch MN, SC'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','French - M207 Mandarin - M208 Spanish - M209'], ['13:30','14:15','PE A BR TSAC'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']],
    'RSS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','PE B BR TSAC'], ['9:30','11:00','Hum SC M108'], ['11:00','11:30','Recess SMR, DR'], ['11:30','12:00','Lunch MN, SC'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','French - M207 Mandarin - M208 Spanish - M209'], ['13:30','14:15','Math B CK M308'], ['14:15','15:00','Affinity Groups/Olympic Teams'], ['15:00','15:10','IWP']]
  },
  'Thursday': {
    'MMS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Science SA M310'], ['9:30','10:15','French - M207 Mandarin - M208 Spanish - M209'], ['10:15','11:00','Music CN M103'], ['11:00','11:30','Lunch MD, ES'], ['11:30','12:00','Recess SMR, SF'], ['12:00','12:45','Math MD M311'], ['12:45','13:30','Art M306'], ['13:30','14:45','Hum MN M212'], ['14:45','15:10','IWP']],
    'DJM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Music A CN M103'], ['9:30','11:00','Science A OC M310'], ['11:00','11:30','Lunch MD, ES'], ['11:30','12:00','Recess SMR, SF'], ['12:00','13:15','Hum DR M211'], ['13:15','14:00','Math A CB M311'], ['14:00','14:45','PE A LH TSAC'], ['14:45','15:10','IWP']],
    'AOS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Art B M306'], ['9:30','10:15','Math B CB M311'], ['10:15','11:00','PE B LH TSAC'], ['11:00','11:30','Lunch MD, ES'], ['11:30','12:00','Recess SMR, SF'], ['12:00','13:15','Hum AG M209'], ['13:15','14:45','Science B OC M310'], ['14:45','15:10','IWP']],
    'CCM': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math C CB M311'], ['9:30','10:15','Music C CN M103'], ['10:15','11:00','Art C M306'], ['11:00','11:30','Lunch MD, ES'], ['11:30','12:00','Recess SMR, SF'], ['12:00','13:15','Hum MS M212'], ['13:15','14:00','PE C LH TSAC'], ['14:00','14:45','Choices C LA M211'], ['14:45','15:10','IWP']],
    'EEL': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','PE A LH TSAC'], ['9:30','10:15','Math A CK M308'], ['10:15','11:00','Choices A LA M107'], ['11:00','11:30','Recess MKP, SC'], ['11:30','12:00','Lunch BC, MN'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','14:00','Hum ES M107'], ['14:00','14:45','French - M207 Mandarin - M208 Spanish - M209'], ['14:45','15:10','IWP']],
    'MSB': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Choices B LA M107'], ['9:30','10:15','PE B LH TSAC'], ['10:15','11:00','Math B CK M308'], ['11:00','11:30','Recess MKP, SC'], ['11:30','12:00','Lunch BC, MN'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','14:00','Hum SdB M108'], ['14:00','14:45','French - M207 Mandarin - M208 Spanish - M209'], ['14:45','15:10','IWP']],
    'CJM': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science A LL/EZ M307'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess MKP, SC'], ['11:30','12:00','Lunch BC, MN'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','13:30','Choices A LA M308'], ['13:30','14:15','Math A CK M308'], ['14:15','15:00','Hum SMR M107'], ['15:00','15:10','IWP']],
    'RSS': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Math B CK M308'], ['9:30','10:15','Choices B LA M107'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess MKP, SC'], ['11:30','12:00','Lunch BC, MN'], ['12:00','12:45','7/8 Electives The Movement Lab - PAPAS Storytelling - M108 Mix it Up - M107 Ceramics - Art Room Photography - L104 Music Production - M103'], ['12:45','14:15','Science B LL/EZ M307'], ['14:15','15:00','Hum SC M108'], ['15:00','15:10','IWP']]
  },
  'Friday': {
    'MMS': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Science SA M310'], ['10:15','11:00','Hum MN M212'], ['11:00','11:30','Lunch JL, MD'], ['11:30','12:00','Recess CK, LL'], ['12:00','12:45','Math MD M311'], ['12:45','13:30','PE LH TSAC'], ['13:30','14:15','Art M306'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'DJM': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Hum DR M211'], ['10:15','11:00','Math A CB M311'], ['11:00','11:30','Lunch JL, MD'], ['11:30','12:00','Recess CK, LL'], ['12:00','12:45','French - M207 Mandarin - M208 Spanish - M209'], ['12:45','13:30','Art A M306'], ['13:30','14:15','Science A OC M310'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'AOS': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Hum AG M209'], ['10:15','11:00','Science B OC M310'], ['11:00','11:30','Lunch JL, MD'], ['11:30','12:00','Recess CK, LL'], ['12:00','12:45','French - M207 Mandarin - M208 Spanish - M209'], ['12:45','13:30','Math B CB M311'], ['13:30','14:15','Music B CN M103'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'CCM': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Hum MS M212'], ['10:15','11:00','PE C LH TSAC'], ['11:00','11:30','Lunch JL, MD'], ['11:30','12:00','Recess CK, LL'], ['12:00','12:45','French - M207 Mandarin - M208 Spanish - M209'], ['12:45','13:30','Science C OC M310'], ['13:30','14:15','Math C CB M311'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'EEL': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','Science A LL/EZ M307'], ['9:30','10:15','PE A LH TSAC'], ['10:15','11:00','Math A CK M308'], ['11:00','11:30','Recess RC, CB'], ['11:30','12:00','Lunch MKP, SH'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','14:15','Hum ES M107'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'MSB': [['8:15','8:45','Morning Homeroom'], ['8:45','9:30','PE B LH TSAC'], ['9:30','10:15','Math B CK M308'], ['10:15','11:00','Science B LL/EZ M307'], ['11:00','11:30','Recess RC, CB'], ['11:30','12:00','Lunch MKP, SH'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','14:15','Hum SdB M108'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'CJM': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Hum SMR M107'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess RC, CB'], ['11:30','12:00','Lunch MKP, SH'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','Math A CK M308'], ['13:30','14:15','Science A LL/EZ M307'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']],
    'RSS': [['8:15','8:45','Morning Homeroom'], ['8:45','10:15','Hum SC M108'], ['10:15','11:00','French - M207 Mandarin - M208 Spanish - M209'], ['11:00','11:30','Recess RC, CB'], ['11:30','12:00','Lunch MKP, SH'], ['12:00','12:45','7/8 Majors Dance - PAPAS Drama - M107+M108 Instrumental - Auditorium Portfolio A - Art Room Portfolio B - L104 Vocal - M103'], ['12:45','13:30','Science B LL/EZ M307'], ['13:30','14:15','Math B CK M308'], ['14:15','15:00','Activity Period'], ['15:00','15:10','IWP']]
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
