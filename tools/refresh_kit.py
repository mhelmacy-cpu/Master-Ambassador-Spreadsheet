#!/usr/bin/env python3
"""Puts the current build/Data.gs and build/App.gs into the paste kit page.

The kit is the page she copies the two files from. Only the two <pre>
blocks and their KB labels are touched; everything else on the page is
left exactly as it is.

    python3 tools/refresh_kit.py <paste-kit.html>
"""
import re, html, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = {'f0': 'build/Data.gs', 'f1': 'build/App.gs'}

kit = sys.argv[1] if len(sys.argv) > 1 else None
if not kit or not os.path.exists(kit):
    sys.exit('usage: refresh_kit.py <paste-kit.html>')

page = io.open(kit, encoding='utf-8').read()
total = 0

for pid, path in FILES.items():
    src = io.open(os.path.join(ROOT, path), encoding='utf-8').read()
    # Plain ASCII only: anything else corrupts on the way through a paste.
    if any(ord(c) > 126 for c in src):
        sys.exit('non-ascii in ' + path)
    esc = html.escape(src, quote=True).replace("'", '&#x27;')
    pat = re.compile(r'(<pre id="' + pid + r'" class="code" hidden>).*?(</pre>)', re.S)
    if not pat.search(page):
        sys.exit('no <pre> for ' + pid)
    page = pat.sub(lambda m: m.group(1) + esc.rstrip('\n') + '\n' + m.group(2), page, count=1)
    kb = max(1, round(len(src.encode('utf-8')) / 1024))
    total += kb
    # The size label sits in the same <article>, just above the <pre>.
    head = re.compile(r'(aria-controls="' + pid + r'".*?<span class="size">)\d+ KB(</span>)', re.S)
    page, n = head.subn(lambda m: m.group(1) + str(kb) + ' KB' + m.group(2), page, count=1)
    if not n:
        sys.exit('no size label for ' + pid)
    print('%-14s %3d KB' % (path, kb))

page, n = re.subn(r'Total \d+ KB\.', 'Total %d KB.' % total, page, count=1)
print('total %d KB%s' % (total, '' if n else ' (no total on the page)'))

io.open(kit, 'w', encoding='utf-8').write(page)
print('wrote', kit)
