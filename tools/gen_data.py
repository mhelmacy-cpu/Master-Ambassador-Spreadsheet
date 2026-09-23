#!/usr/bin/env python3
"""Generates build/Data.gs from data/school-data.json. Plain ASCII only."""
import json, sys

d = json.load(open('data/school-data.json'))
P = []
def w(s=''): P.append(s)

def q(s):
    s = ' '.join(str(s).split())
    assert all(ord(c) < 127 for c in s), repr(s)
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"

w('/**')
w(' * All the school data the scheduler runs on. Nothing in this file makes')
w(' * a decision - it is only what the other file reads.')
w(' *')
w(' * Sources: the office\'s MS-Alpha_by_Grade workbook (roster, splits,')
w(' * advisors), the 2026-27 MS Schedule PDF (bell schedule), and the')
w(' * admissions office\'s own tour route sheet.')
w(' */')
w()

w('/* ---------- Ambassadors: names only. Everything else is typed in. ---------- */')
w()
w('const AMBASSADOR_NAMES_ = [')
for a in d['ambassadors']:
    w('  %s,' % q(a['name']))
P[-1] = P[-1].rstrip(',')
w('];')
w()

w('/* ---------- How to read the bell schedule ---------- */')
w()
w('/*')
for line in d['scheduleModel']['rule']:
    for chunk in [line[i:i+68] for i in range(0, len(line), 68)]:
        w(' * ' + chunk)
    w(' *')
w(' */')
w()
w('const POD_LETTER_ = %s;' % json.dumps(d['scheduleModel']['podColumnLetter']).replace('"', "'").replace(',', ', ').replace(':', ': '))
w('const GRADE_PODS_ = %s;' % json.dumps(d['scheduleModel']['gradePods']).replace('"', "'").replace(',', ', ').replace(':', ': '))
w('const POD_GRADE_ = {};')
w("Object.keys(GRADE_PODS_).forEach(function (g) {")
w("  GRADE_PODS_[g].forEach(function (p) { POD_GRADE_[p] = g; });")
w('});')
w()
w('const LANGUAGE_ROOMS_ = { M207: %s, M208: %s, M209: %s };' % (q('French'), q('Mandarin'), q('Spanish')))
w()

w('/* ---------- Teachers ---------- */')
w()
w('const TEACHER_INITIALS_ = {')
for n, i in d['teacherInitials'].items():
    w('  %s: %s,' % (q(n), q(i)))
P[-1] = P[-1].rstrip(',')
w('};')
w()
w('const EXTRA_TEACHERS_ = [')
for t in d['extraTeachers']:
    w('  { name: %s, initials: %s, note: %s },' % (q(t['name']), q(t['initials']), q(t['note'])))
P[-1] = P[-1].rstrip(',')
w('];')
w()

w('/* ---------- The 2026-27 roster: 143 students ---------- */')
w()
w('const MS_ROSTER_ = [')
for s in d['students']:
    w('  { name: %s, email: %s, grade: %s, pod: %s, advisor: %s, split: %s },' % (
        q(s['name']), q(s['email']), q(s['grade']), q(s['pod']), q(s['advisor']), q(s['split'])))
P[-1] = P[-1].rstrip(',')
w('];')
w()

w('/* ---------- The seven walking tour routes ---------- */')
w()
w('const TOUR_ROUTES_ = [')
for r in d['tourRoutes']:
    itin = r['itinerary'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n')
    assert all(ord(c) < 127 for c in itin)
    w('  { route: %s, direction: %s, humanities: %s, language: %s,' % (
        q(r['route']), q(r['direction']), q(r['humanities']), q(r['language'])))
    w("    itinerary: '%s' }," % itin)
P[-1] = P[-1].rstrip(',')
w('];')
w()

w('/* ---------- The bell schedule: 5 days, 8 pods, 403 blocks ---------- */')
w()
w('const SCHEDULE_DAYS_ = [%s];' % ', '.join(q(x) for x in ['Monday','Tuesday','Wednesday','Thursday','Friday']))
w()
w('const BELL_SCHEDULE_ = {')
days = ['Monday','Tuesday','Wednesday','Thursday','Friday']
pods = ['MMS','DJM','AOS','CCM','EEL','MSB','CJM','RSS']
for di, day in enumerate(days):
    w('  %s: {' % q(day))
    for pi, pod in enumerate(pods):
        ents = d['bellSchedule'][day][pod]
        body = ', '.join('[%s, %s, %s]' % (q(e[0]), q(e[1]), q(e[2])) for e in ents)
        w('    %s: [%s]%s' % (q(pod), body, '' if pi == len(pods) - 1 else ','))
    w('  }%s' % ('' if di == len(days) - 1 else ','))
w('};')
w()

out = '\n'.join(P) + '\n'
bad = sorted({c for c in out if ord(c) > 126})
if bad:
    print('ERROR: non-ASCII %s' % bad, file=sys.stderr); sys.exit(1)
open('build/Data.gs', 'w').write(out)
print('build/Data.gs  %.1f KB' % (len(out) / 1024))
