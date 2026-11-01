# Bé Học — hướng dẫn cho Claude Code

App học tiểu học. Frontend **1 file `index.html` thuần JS** (KHÔNG React/TS).
Backend Supabase (auth phụ huynh, tiến độ, ví 💎, chấm điểm qua RPC).

## Ràng buộc (luôn tuân thủ)
- KHÔNG đổi cấu trúc/bảng Supabase khi chưa hỏi.
- KHÔNG tạo file ngoài thư mục được chỉ định trong từng việc.
- App KHÔNG tự cộng 💎/sao — mọi điểm thưởng qua RPC server
  (`be_complete_lesson`, `be_submit_lesson`, `be_finish_minigame`).
- Giao diện tiếng Việt, phù hợp trẻ 8 tuổi.
- Mỗi việc chỉ đọc đúng file được nêu; KHÔNG tự quét cả repo (tốn credit).

## Nội dung bài học
- Tác giả dưới dạng JSON: `content/{mon}/lop3/bai-XX.json` (nguồn sự thật, versioned).
- Chấm điểm: câu hỏi đồng bộ vào Supabase; lý thuyết đọc từ JSON repo.
- Quy tắc viết + bộ prompt: `content/HUONG-DAN-TAO-NOI-DUNG.md` (file tổng duy nhất).
- TỰ VIẾT, không chép nguyên văn SGK. Theo GDPT 2018, lớp 3, năm học 2025–2026.

## Cấu trúc thư mục
- `index.html` — toàn bộ app
- `js/` — config + (sắp tới) lesson-render.js
- `supabase/` — schema.sql, migration, seed
- `content/{mon}/lop3/` — bài học JSON + _muc-luc.md + index.json
- `scripts/` — validate-content.mjs, sync-content.mjs
- `docs/` — bộ prompt, tài liệu
