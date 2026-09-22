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
