#!/usr/bin/env python3
"""
Merges the modular files in src/ into the four bundles in dist/ that get
pasted into the Apps Script editor.

Apps Script puts every .gs file in one shared namespace, so merging them
changes nothing about how the code runs - it just means four files to
paste instead of twenty-one. Edit src/, run this, paste dist/.

    python3 tools/bundle.py
"""
import re, os, shutil, sys

SRC, OUT = 'src/', 'dist/'

BUNDLES = {
    'Core.gs': (
        'Configuration, shared helpers, and first-run sheet setup.',
        ['Constants.gs', 'Utils.gs', 'SheetSetup.gs'],
    ),
    'SeedData.gs': (
        'The school data this runs on: the ambassador roster, the\n'
        ' * Middle School homeroom/advisory roster, the 7 walking tour routes,\n'
        ' * and the weekly bell schedule.',
        ['AmbassadorsSeedData.gs', 'HomeroomSeedData.gs', 'TourRoutesSeedData.gs', 'BellScheduleSeedData.gs'],
    ),
    'Logic.gs': (
        'Everything that decides something: eligibility, scheduling,\n'
        ' * conflict checks, staffing suggestions, tallies, and the live dashboard.',
        ['Eligibility.gs', 'Tours.gs', 'TouringStudents.gs', 'Assignments.gs', 'AmbassadorStats.gs',
         'TourStaffing.gs', 'HomeroomSync.gs', 'AmbassadorsImport.gs', 'StudentSchedule.gs', 'TeacherInitials.gs', 'Dashboard.gs'],
    ),
    'Menu.gs': (
        'Menu wiring, the bridges the dialogs call, email sending, and\n'
        ' * the automatic triggers.',
        ['Code.gs', 'EmailService.gs', 'TourDayEmails.gs', 'Triggers.gs'],
    ),
}

LEADING_COMMENT = re.compile(r'\s*(/\*\*.*?\*/)\s*\n', re.S)


def build():
    os.makedirs(OUT, exist_ok=True)
    bundled = set()
    for out_name, (blurb, files) in BUNDLES.items():
        parts = [
            '/**',
            ' * %s' % blurb,
            ' *',
            ' * Bundled file - it holds what used to be several separate script',
            ' * files. Apps Script puts every .gs file in one shared namespace, so',
            ' * merging them changes nothing about how the code runs; it just means',
            ' * far less to paste. Each section below starts with a banner.',
            ' */',
            '',
        ]
        for f in files:
            raw = open(SRC + f, encoding='utf-8').read()
            bundled.add(f)
            m = LEADING_COMMENT.match(raw)
            own_header, body = (m.group(1), raw[m.end():]) if m else ('', raw.lstrip('\n'))
            parts += ['/* ==========================================================',
                      ' * %s' % f[:-3],
                      ' * ========================================================== */', '']
            if own_header:
                parts += [own_header, '']
            parts += [body.rstrip(), '']
        open(OUT + out_name, 'w', encoding='utf-8').write('\n'.join(parts).rstrip() + '\n')
        print('%-14s <- %2d files' % (out_name, len(files)))

    missed = {f for f in os.listdir(SRC) if f.endswith('.gs')} - bundled
    if missed:
        print('ERROR: src files missing from every bundle: %s' % sorted(missed), file=sys.stderr)
        return 1

    # The dialogs and the manifest are pasted as-is, so ship them alongside.
    shutil.rmtree(OUT + 'ui', ignore_errors=True)
    shutil.copytree(SRC + 'ui', OUT + 'ui')
    shutil.copy(SRC + 'appsscript.json', OUT + 'appsscript.json')

    # Smart quotes and emoji get mangled on the way into the editor, so the
    # pasted output has to stay plain ASCII.
    for root, _, files in os.walk(OUT):
        for f in files:
            path = os.path.join(root, f)
            non_ascii = sorted({c for c in open(path, encoding='utf-8').read() if ord(c) > 126})
            if non_ascii:
                print('ERROR: %s has non-ASCII characters %s' % (path, non_ascii), file=sys.stderr)
                return 1
    print('All src files bundled, output is plain ASCII.')
    return 0


if __name__ == '__main__':
    sys.exit(build())
