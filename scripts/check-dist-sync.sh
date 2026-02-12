#!/usr/bin/env bash
set -euo pipefail

staged=0
range=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged)
      staged=1
      shift
      ;;
    --range)
      range="${2:-}"
      shift 2
      ;;
    *)
      echo "Uso: $0 [--staged] [--range <git-range>]"
      exit 2
      ;;
  esac
done

if [[ "$staged" -eq 1 ]]; then
  diff_cmd=(git diff --cached --name-only)
else
  if [[ -n "$range" ]]; then
    diff_cmd=(git diff --name-only "$range")
  else
    diff_cmd=(git diff --name-only HEAD)
  fi
fi

mapfile -t changed_files < <("${diff_cmd[@]}")

has_dist_changes=0
has_source_changes=0

for file in "${changed_files[@]}"; do
  [[ "$file" == frontend/dist/* ]] && has_dist_changes=1
  [[ "$file" == frontend/src/* ]] && has_source_changes=1
done

if [[ "$has_dist_changes" -eq 1 && "$has_source_changes" -eq 0 ]]; then
  echo "❌ Detectados cambios en frontend/dist sin cambios en frontend/src."
  echo "Regenera dist desde fuentes (por ejemplo: npm run build:frontend)."
  exit 1
fi

echo "✅ Verificación dist/src OK"
