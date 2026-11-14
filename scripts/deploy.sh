#!/usr/bin/env bash
# Publica a prévia no GitHub Pages (branch gh-pages). Uso: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."
SITE_URL=https://twyck.github.io/astor-preview npx vite build
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy prévia ASTOR"
git push -q -f https://github.com/Twyck/astor-preview.git gh-pages
rm -rf .git
echo "Publicado: https://twyck.github.io/astor-preview/ (leva ~1 min para atualizar)"
