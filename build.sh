#!/usr/bin/env bash
# Chèn cấu hình Supabase (public) vào js/config.js lúc Netlify build.
set -euo pipefail

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_ANON_KEY:-}" ]]; then
  echo "❌ Thiếu biến môi trường SUPABASE_URL và/hoặc SUPABASE_ANON_KEY trên Netlify." >&2
  echo "   Site settings → Environment variables → thêm 2 biến này rồi deploy lại." >&2
  exit 1
fi

# dùng | làm phân cách để không đụng ký tự / trong URL/key
sed -i \
  -e "s|__SUPABASE_URL__|${SUPABASE_URL}|g" \
  -e "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" \
  js/config.js

echo "✅ Đã chèn cấu hình Supabase vào js/config.js"
