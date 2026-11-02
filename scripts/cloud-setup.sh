#!/bin/sh
# Setup for a session in a cloud sandbox: dependencies, the commit hook and the
# repository's git identity. The aligner's model (271 MB) is left out: the tests
# do not need it, only a build does (scripts/aligner-fetch.mjs).
set -e
cd "$(dirname "$0")/.."

npm ci --no-audit --no-fund
git config core.hooksPath scripts/hooks
git config user.name mdd335
git config user.email 75839533+mdd335@users.noreply.github.com
