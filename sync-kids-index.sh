#!/bin/bash
# 🌒 Script para mantener public/kids/index.html sincronizado con public/index.html
# Ejecutar antes de cada commit que modifique public/index.html
# (también puedes ponerlo en un git pre-commit hook)
set -e
cd "$(dirname "$0")"
cp public/index.html public/kids/index.html
echo "✅ public/kids/index.html sincronizado con public/index.html"
echo "   MD5: $(md5sum public/kids/index.html | awk '{print $1}')"
