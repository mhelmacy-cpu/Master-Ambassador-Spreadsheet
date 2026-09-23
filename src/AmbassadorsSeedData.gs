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
