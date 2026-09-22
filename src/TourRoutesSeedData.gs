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
      '8:42 7th Grade Humanities — Elizabeth (M107)',
      '8:46 Mandarin (M208) — talk about world languages',
      '8:49 Art (M306)',
      '8:53 Main Science Lab (M307) — talk about robotics',
      '8:55 Learning Center',
      '8:59 8th Grade Math (M308)',
      '9:03 6th Grade Science (M310)',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:44 Main Science Lab (M307) — talk about robotics',
      '8:47 Art (M306)',
      '8:51 Spanish (M209)',
      '8:55 7th Grade Humanities — Sabrina (M108)',
      '8:57 Sports Bulletin Board (next to front desk, talk about sports)',
      '8:59 Library',
      '9:03 Co-Lab',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:42 7th Grade Humanities — Sabrina (M108)',
      '8:46 Mandarin (M208) — talk about world languages',
      '8:50 Main Science Lab (M307) — talk about robotics also',
      '8:53 Art (M306)',
      '8:57 8th Grade Math (M308)',
      '9:01 6th Grade Science (M310)',
      '9:03 Learning Center',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:47 Main Science Lab (M307) — talk about robotics also',
      '8:51 Spanish (M209)',
      '8:55 7th Grade Humanities — Elizabeth (M107)',
      '8:59 Co-Lab',
      '9:01 Sports Bulletin Board (next to front desk, talk about sports)',
      '9:03 Library',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:42 7th Grade Humanities — Elizabeth (M107)',
      '8:46 Spanish (M209)',
      '8:49 Art (M306)',
      '8:53 Main Science Lab (M307) — talk about robotics also',
      '8:57 6th Grade Science (M310)',
      '8:59 Learning Center',
      '9:03 8th Grade Math (M308)',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:44 Main Science Lab (M307) — talk about robotics also',
      '8:47 Art (M306)',
      '8:51 Mandarin (M208) — talk about world languages',
      '8:55 7th Grade Humanities — Sabrina (M108)',
      '8:57 Library',
      '8:59 Sports Bulletin Board (next to front desk, talk about sports)',
      '9:03 Co-Lab',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
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
      '8:42 7th Grade Humanities — Sabrina (M108)',
      '8:46 Spanish (M209)',
      '8:50 Main Science Lab (M307) — talk about robotics also',
      '8:53 Art (M306)',
      '8:55 Learning Center',
      '8:59 6th Grade Science (M310)',
      '9:03 8th Grade Math (M308)',
      '9:06 Bring visitors to class — Bring the clock and tour route with you to class.',
      '9:25 Bring visitor down to cafeteria (wait with them for Maren and parents to get back downstairs)'
    ].join('\n')
  }
];

const TOUR_ROUTE_NUMBERS = TOUR_ROUTE_SEED_.map(r => r.route);
