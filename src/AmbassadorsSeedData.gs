/**
 * The ambassadors to start the year with, as confirmed by the office:
 * 31 students, one row each.
 * Each tuple: [Full Name, Grade, Borough, Parent 1 Name, Parent 1 Email,
 * Parent 2 Name, Parent 2 Email, Notes (optional)]
 *
 * Last year's eighth graders have been taken off - they are in the High
 * School now and are not on the Middle School roster this tool works
 * from. Grades here are the grade each student was in when the list was
 * written, so they run a year behind; Sync Homerooms overwrites them
 * with the current grade from the roster.
 */
const AMBASSADOR_SEED_TUPLES_ = [
  ['Aurelia Walker', '5th', 'B', 'Sophia James', 'sjames20002000@yahoo.com', 'Michael Walker', 'michaelowalker14@gmail.com'],
  ['Lev David', '5th', 'J', 'Boaz David', 'boaz@humanb.com', 'Brooke David', 'brooke@brookedavid.com'],
  ['Laura Sandoval', '5th', 'B', 'Ali Heron', 'aliandgustavo@gmail.com', 'Gustavo Sandoval', 'gussand@gmail.com'],
  ['Tessa Fung', '5th', 'M', 'Samantha Dinerman', 'sammibess@gmail.com', 'William Fung', 'wfung@hsrcorp.com'],
  ['Camille Bedeau', '5th', 'B', 'Kevin Bedeau', 'bedeau.kevin@gmail.com', 'Theresa Bedeau', 'bedeau.theresa@gmail.com'],
  ['Avery Griffiths', '5th', 'M', 'Eksupar Griffiths', 'eksupar@gmail.com', 'Randy Griffiths', 'randydann@gmail.com'],
  ['Jordan Gary', '5th', 'M', 'Erin Gary', 'eringary@icloud.com', 'Kelvin Gary', 'kelvin.gary@gmail.com'],
  ['Ozzy Gutmann', '5th', 'B', 'Jen Gutmann', 'jenandrobby@gutmann.nyc', 'Robby Gutmann', 'robby@gutmann.nyc'],
  ['Skylar Bruno', '5th', 'B', 'Jason Bruno', 'brunojason826@gmail.com', 'Sherleen Petion-Bruno', 'spetion@gmail.com'],
  ['Sadie Imperioli', '5th', 'B', 'Christopher Imperioli', 'cmi0222@gmail.com', 'Ryann Imperioli', 'rimperioli@lrei.org'],
  ['Jane Moss', '5th', 'B', 'Brian Moss', 'bmoss@coventryadvisors.com', 'Jennifer Sagum', 'jennifer.sagum@gmail.com'],
  ['George Orlofsky', '5th', 'M', 'Thalassa Balanis', 'tbalanis@gmail.com', 'Sam Orlofsky', 'samorlofsky1@gmail.com'],
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
  ['Aksel Ozturk', '7th', 'J', 'Cigdem Ozturk', 'cigdem@ipmus.com', 'Mustafa Ozturk', 'mdozturk@yahoo.com'],
  ['Sanai Parikh', '7th', 'M', 'Kalai Murugesan', 'neal322@gmail.com', 'Neal Parikh', 'neal322@gmail.com'],
  ['Irie Bocchino', '7th', 'M', 'A.J. Bocchino', 'ajbocchino1@gmail.com', 'Phoebe Washburn', 'phowashburn@gmail.com'],
  ['Felix Lopez', '7th', 'M', 'Mike Lopez', 'mlopez762@gmail.com', "Natalie Sanz '00", 'Natalie@sanzmanagement.com'],
  ['Steevens Jean', '7th', 'B', 'Steevens Jean', 'steevensjean@live.com', 'Yessenia Jean', 'msyesseniamartinez@gmail.com'],
  ['Jessa Shankman', '7th', 'M', 'Kira Shalom', 'kshalom@gmail.com', 'Peter Shankman', 'peter@shankman.com'],
  ['Pascale Destin', '7th', 'B', 'Mark Anthony Destin', 'destinmark@gmail.com', 'Starr Blackshere-Destin', 'starr.blackshere@gmail.com'],
  ['Cecilia Melzer', '7th', 'M', 'Isabel Melzer', 'isabelmelzer1@gmail.com', 'Thiago Melzer', 'tmelzer@gmail.com'],
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
