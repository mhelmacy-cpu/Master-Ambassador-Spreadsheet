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
 * Language is blank for fifth grade, which rotates through all three
 * rather than picking one, and for the three eighth graders who take no
 * language at all. Nothing is guessed in either case: a language period
 * with no language on file is reported back for a human to forward
 * rather than mailed to whichever teacher seemed likeliest. Typing the
 * language into the Ambassadors sheet is all it takes to make those
 * send themselves.
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
  { name: 'Aeon Anjargolian', email: '34AeonA@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: '' },
  { name: 'Alexander Rogoff', email: '34AlexanderR@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: '' },
  { name: 'Archimedes Gutmann', email: '34ArchimedesG@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: '' },
  { name: 'Isabella Dike', email: '34IsabellaD@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: '' },
  { name: 'Olivia Lee', email: '34OliviaL@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'A', language: '' },
  { name: 'Rhea Kaiser', email: '34RheaK@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'B', language: '' },
  { name: 'Roger Sierant', email: '34RogerS@lrei.org', grade: '5', pod: 'MMS', advisor: 'Mo', split: 'B', language: '' },
  { name: 'Ellis Ahmed', email: '34EllisA@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'A', language: '' },
  { name: 'Ezra Fisher', email: '34EzraF@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: '' },
  { name: 'Matteo Keklikian', email: '34MatteoK@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: '' },
  { name: 'McKenna Rodzevicius', email: '34McKennaR@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'A', language: '' },
  { name: 'Perla Dunn', email: '34PerlaD@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: '' },
  { name: 'Tobik Maczka', email: '34TobikM@lrei.org', grade: '5', pod: 'MMS', advisor: 'Molly', split: 'B', language: '' },
  { name: 'Aiden Tedder', email: '34AidenT@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'A', language: '' },
  { name: 'Edie Gerson', email: '34EdieG@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: '' },
  { name: 'Joakim Leon-McCool', email: '34JoakimL@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: '' },
  { name: 'Liv Feldman', email: '34LivF@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: '' },
  { name: 'Luka Cuparic', email: '34LukaC@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'B', language: '' },
  { name: 'Miles Titus', email: '34MilesT@lrei.org', grade: '5', pod: 'MMS', advisor: 'Sherezada', split: 'A', language: '' }
];

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
