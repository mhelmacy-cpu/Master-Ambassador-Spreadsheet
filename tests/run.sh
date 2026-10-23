#!/bin/sh
# Every test in here, against build/Data.gs and build/App.gs. Run it from
# the repository root: sh tests/run.sh
#
# A test is one file, named for the thing it watches, and it prints what
# it checked in plain words so a failure says what broke rather than
# which assertion number. Nothing here needs a browser, a Google account
# or the internet: tests/mock.js stands in for the Apps Script services.
cd "$(dirname "$0")/.." || exit 1
fails=''
ran=0
for f in tests/t*.js; do
  ran=$((ran + 1))
  if out=$(node "$f" 2>&1); then
    :
  else
    fails="$fails $(basename "$f" .js)"
    echo "=== $f"
    echo "$out" | tail -12
  fi
done
echo "$ran test file(s) run."
if [ -n "$fails" ]; then
  echo "FAILING:$fails"
  exit 1
fi
echo "All passing."
