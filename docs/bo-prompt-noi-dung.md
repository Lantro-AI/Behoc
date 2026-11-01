# Bé Học — Bộ prompt sản xuất nội dung (tối ưu credit)

> Mục tiêu: tạo nội dung bài học theo chương trình GDPT 2018, bộ **{{BỘ_SÁCH}}**
> (lớp 3, năm học 2025–2026) với chi phí AI thấp nhất. App **tự viết** nội dung,
> **không chép nguyên văn SGK**.

## Kiến trúc nội dung (ĐÃ CHỈNH theo thực tế app)

- App hiện là **1 file `index.html` thuần JS** (không React/TS).
- **Tác giả** nội dung dưới dạng JSON trong repo: `content/{mon}/lop3/bai-XX.json`
  (rẻ, có lịch sử Git).
- **Script đồng bộ** đẩy câu hỏi + đáp án vào Supabase `question_bank`
  (1 lần mỗi lô, gần như 0 credit).
- Web: **lý thuyết** đọc từ JSON repo · **câu hỏi** chấm ở Supabase
  (`be_submit_lesson`) → giữ chống gian lận.
- Supabase chỉ giữ: tiến độ, ví 💎, và bản sao câu hỏi để chấm.

## 7 cách cắt credit (áp dụng)

1. Toán: bài tính toán **sinh bằng code** (đã có `seed-topics-full.js`), AI chỉ viết
   lý thuyết + bài toán lời văn.
2. Mỗi lô 3–5 bài trong **1 chat mới** (`/clear` giữa các việc trong Claude Code).
3. Để **khuôn JSON + quy tắc** trong Project (2 file ngắn), không dán lại mỗi lần.
   KHÔNG đưa cả cuốn SGK vào Project.
4. Ép AI **chỉ xuất JSON**, không giải thích.
5. Làm **mục lục cả năm trước**, rồi mới viết từng bài theo mục lục.
6. **Kiểm lỗi bằng script** (ajv), không nhờ AI "kiểm giùm".
7. ≥200 bài: chuyển **Batch API + prompt caching** (batch −50% giá, cache −~90% phần
   lặp; xem giá hiện hành trên docs.claude.com).

---

# A. Chốt khuôn dữ liệu — chạy 1 lần, model **Opus**

> Format: xuất 3 khối thuần văn bản, không lời dẫn. Dán kèm 1 mẫu dữ liệu hiện có.

```
Vai trò: kiến trúc sư dữ liệu cho app học tiểu học "Bé Học".
Stack THẬT: frontend 1 file index.html thuần JS (KHÔNG React/TS). Backend Supabase.
Câu hỏi hiện lưu ở bảng question_bank dạng: {question, options(jsonb 3 lựa chọn),
answer_index, difficulty, topic_id}. Chỉ mới hỗ trợ trắc nghiệm.

Nhiệm vụ: chuẩn hóa thành KHUÔN BÀI HỌC dùng chung cho mọi môn (Toán, Tiếng Việt,
Tiếng Anh, TNXH), lưu thành file JSON trong repo content/{mon}/lop3/bai-XX.json.

Yêu cầu khuôn:
- 6 loại câu: trac_nghiem, dien_khuyet, noi_cap, sap_xep, dung_sai, tu_luan_ngan
- Trường bài: id, mon, lop, chuong, bai, ten_bai, muc_tieu[], ly_thuyet[], cau_hoi[], phan_thuong
- Mỗi câu: id, loai, de, lua_chon?(mảng), dap_an, giai_thich(≤25 từ), do_kho(1-3)
  (dap_an: trac_nghiem/dung_sai = chỉ số; dien_khuyet = chuỗi; noi_cap = mảng cặp;
   sap_xep = thứ tự đúng; tu_luan_ngan = đáp án mẫu để tự đối chiếu)
- Tương thích ngược: map được dữ liệu question_bank cũ (trac_nghiem).

Xuất ra ĐÚNG 3 khối, không giải thích:
(1) JSON Schema (ajv draft-07) cho 1 bài học.
(2) 1 @typedef JSDoc ngắn để tra cứu trong index.html.
(3) 1 file ví dụ bai-01.json hoàn chỉnh (Toán lớp 3), đủ 6 loại câu.
```

---

# B. Mục lục cả năm — mỗi môn 1 lần, model **Sonnet**

> Format: chỉ 1 bảng, không lời dẫn. Làm rẻ, làm trước khi viết bài.

```
Lập mục lục môn {{MÔN}} lớp 3 theo chương trình GDPT 2018, bộ {{BỘ_SÁCH}},
năm học 2025–2026. Chia cả năm (HK1 + HK2).
Xuất 1 bảng cột: chuong | bai | ma_bai | ten_bai | muc_tieu(≤15 từ) | so_tiet | hoc_ky.
ma_bai dạng {mon}-l3-b01, b02... Chỉ bảng, không lời dẫn, không ghi chú.
```
> `{{MÔN}}` = Toán | Tiếng Việt | Tiếng Anh | TNXH. Lưu kết quả vào
> `content/{mon}/lop3/_muc-luc.md` để dán vào prompt C.

---

# C. Tạo bài học hàng loạt — lặp lại, model **Sonnet** (hoặc **Haiku** cho bài dễ)

> Format: để `schema` + `quy-tac.md` trong Project. Mỗi chat 3–5 bài rồi `/clear`.
> Xuất JSON thuần.

```
Theo JSON Schema và content/quy-tac-viet.md trong Project.
Tạo các bài: {{MÃ_BÀI_1}}, {{MÃ_BÀI_2}}, {{MÃ_BÀI_3}} — mục tiêu lấy từ mục lục dán dưới.
Mỗi bài:
- 2 khối lý thuyết ngắn (ly_thuyet[]).
- 8 câu hỏi: 3 dễ, 3 vừa, 2 khó; trộn ≥3 loại trong 6 loại.
- Toán: KHÔNG tự chế số cho phép tính thuần (phần đó sinh bằng code riêng); chỉ viết
  bài toán có lời văn + lý thuyết.
Ngôn ngữ cho trẻ 8 tuổi, mỗi câu ≤15 từ, ví dụ gần gũi đời sống Việt Nam.
TỰ VIẾT, không chép nguyên văn SGK. Không trùng ý giữa các câu.
Xuất: DUY NHẤT một mảng JSON hợp lệ các bài, không markdown, không lời giải thích.

[dán 3–5 dòng mục lục tương ứng]
```

---

# D. Máy hiển thị 6 loại câu — Claude Code, mỗi loại 1 việc (ĐÃ chỉnh vanilla JS)

> Ràng buộc để sẵn trong `CLAUDE.md`. Vì app là 1 file index.html, tách phần render
> bài học ra `js/lesson-render.js` cho gọn.

```
Việc: viết hàm render cho loại câu "{{LOAI}}" trong js/lesson-render.js (vanilla JS,
KHÔNG framework).
Chỉ đọc/sửa: js/lesson-render.js, và nếu cần thì phần CSS .q/.opts trong index.html.
Đầu vào: 1 object câu hỏi theo @typedef LessonQuestion (loai, de, lua_chon, do_kho).
Hàm trả về: phần tử DOM + callback thu lựa chọn của bé dạng {id, choice/answer}.
KHÔNG lộ đáp án ở client (chấm ở server). Không đọc file khác.
Làm xong liệt kê file đã sửa.
```
> Thứ tự dựng renderer: trac_nghiem (đã có) → dung_sai → dien_khuyet → noi_cap →
> sap_xep → tu_luan_ngan (tự đối chiếu, không auto-chấm).

---

# E. Script kiểm tra + đồng bộ — chạy 1 lần (Claude Code)

> Format: nêu rõ file được phép đụng. Không dùng thư viện ngoài danh sách.

```
Việc 1: viết scripts/validate-content.mjs (Node, chỉ dùng ajv):
quét content/**/*.json, kiểm theo JSON Schema, báo lỗi theo tên file + đường dẫn
trường, tạo content/{mon}/lop3/index.json liệt kê các bài hợp lệ.

Việc 2: viết scripts/sync-content.mjs:
đọc các bài JSON đã hợp lệ, UPSERT câu hỏi vào Supabase question_bank qua REST
(service key đọc từ biến môi trường, KHÔNG hardcode), map loai→cấu trúc hiện có.
In số câu đã đồng bộ theo môn/bài.

Chỉ đọc/sửa: scripts/. Không đổi cấu trúc Supabase. Làm xong liệt kê file đã tạo.
```
> Quy trình thêm bài sau này: chép JSON vào `content/` → `node scripts/validate-content.mjs`
> → `node scripts/sync-content.mjs` → `git push`. Gần như 0 credit.

---

# Thứ tự làm đề xuất

1. **A** — chốt khuôn từ dữ liệu Toán lớp 3 hiện có (Opus, 1 lần).
2. **E** — viết script validate + sync; chuyển 5 bộ câu cũ sang khuôn mới.
3. **D** — dựng đủ 6 renderer (ưu tiên dung_sai, dien_khuyet trước).
4. **B** — mục lục từng môn (Sonnet).
5. **C** — tạo nội dung hàng loạt, mỗi chat 3–5 bài, kiểm bằng script.
6. ≥200 bài → chuyển **Batch API + caching**.

# Ràng buộc chung (để trong CLAUDE.md — xem docs/CLAUDE-ràng-buộc.md)

- Không đổi cấu trúc Supabase khi chưa hỏi.
- Không tạo file ngoài thư mục được chỉ định.
- Giao diện tiếng Việt, phù hợp trẻ 8 tuổi.
- Nội dung tự viết, không chép nguyên văn SGK.
- Mỗi việc chỉ đọc đúng file được nêu; không tự quét cả repo (tốn credit).
