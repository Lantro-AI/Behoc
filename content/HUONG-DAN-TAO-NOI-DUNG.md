# Bé Học — Hướng dẫn tạo nội dung (FILE DUY NHẤT)

> Gộp mọi quy tắc + bộ prompt để sản xuất nội dung bài học lớp 3, chương trình
> GDPT 2018, bộ **Kết nối tri thức với cuộc sống**, năm học 2025–2026. App **tự viết**, **không chép
> nguyên văn SGK**. Mục tiêu: nội dung đúng chuẩn + tốn ít credit nhất.
>
> Cách dùng nhanh: đọc §1–§5 một lần để nắm; mỗi đợt tạo bài chỉ cần **§6 (prompt)**.
> Để **§3 (khuôn)** + **phần LEAN ở §4** trong Project để khỏi dán lại.

---

## §1. Kiến trúc nội dung (khớp thực tế app)

- App = **1 file `index.html` thuần JS** (KHÔNG React/TS). Backend Supabase.
- **Tác giả** nội dung = JSON trong repo: `content/{mon}/lop3/bai-XX.json`
  (nguồn sự thật, có lịch sử Git, 0 phí).
- **Đồng bộ** = script đẩy câu hỏi+đáp án vào Supabase `question_bank` (1 lần/lô).
- Khi học: **lý thuyết** đọc từ JSON repo · **câu hỏi** chấm ở Supabase
  (`be_submit_lesson`, ẩn đáp án) → giữ chống gian lận.
- Supabase chỉ giữ: tiến độ, ví 💎, bản sao câu hỏi để chấm. **Không đổi cấu trúc
  Supabase khi chưa hỏi.**

## §2. Nguyên tắc tiết kiệm credit

1. Toán — phép tính thuần **sinh bằng code** (`supabase/seed-topics-full.js`); AI chỉ
   viết lý thuyết + toán có lời văn + hình học/khái niệm.
2. Mỗi lô **3–5 bài / 1 chat mới** (`/clear` giữa các việc ở Claude Code).
3. Để **khuôn + quy tắc (bản LEAN)** trong Project; KHÔNG nhét cả SGK vào Project.
4. Ép AI **chỉ xuất JSON**, cấm lời dẫn/tóm tắt (chữ thừa vẫn tính tiền).
5. Làm **mục lục cả năm trước**, rồi viết bài theo mục lục (tránh trùng, tránh viết lại).
6. **Kiểm lỗi bằng script** (ajv), không nhờ AI "kiểm giùm".
7. ≥200 bài → **Batch API + prompt caching** (batch −50%, cache −~90% phần lặp;
   kiểm giá hiện hành ở docs.claude.com). `tin cậy: cơ chế cao, giá cần xem lại`.

## §3. Khuôn dữ liệu bài học (tóm tắt — bản đầy đủ sinh từ Prompt A)

Một **bài** (`bai-XX.json`):
```
id, mon, lop(=3), chuong, bai, ten_bai,
muc_tieu: [chuỗi...],
ly_thuyet: [ {tieu_de, noi_dung} , ... ],   // ~2 khối
cau_hoi:   [ <câu>, ... ],                   // ~8 câu
phan_thuong                                   // tùy chọn
```
Một **câu** (`cau_hoi[]`):
```
id, loai, de, lua_chon?(mảng), dap_an, giai_thich(≤25 từ), do_kho(1–3)
```
Quy ước `dap_an` theo `loai`:
- `trac_nghiem` / `dung_sai`: chỉ số đáp án đúng trong `lua_chon` (0-based).
- `dien_khuyet`: chuỗi/số cần điền.
- `noi_cap`: mảng cặp `[[trái,phải],...]` đúng.
- `sap_xep`: mảng thứ tự đúng.
- `tu_luan_ngan`: đáp án mẫu (để tự đối chiếu, không auto-chấm).

## §4. Quy tắc viết nội dung

### 4.1 Đối tượng & ngôn ngữ
- Trẻ 8 tuổi (lớp 3). Mỗi câu ≤ 15 từ, thuần Việt, đơn giản.
- Giọng vui, khích lệ; không hù dọa, không tiêu cực.
- Ví dụ gần gũi đời sống Việt Nam (chợ, trường, gia đình, con vật quen thuộc).

### 4.2 Nguồn & bản quyền
- Theo GDPT 2018, bộ Kết nối tri thức với cuộc sống, lớp 3, năm 2025–2026.
- **TỰ VIẾT**, không chép nguyên văn SGK. Bám đúng mục tiêu bài; không vượt phạm vi lớp 3.

### 4.3 Cân bằng mỗi bài
- 8 câu: 3 dễ (do_kho 1) · 3 vừa (2) · 2 khó (3).
- Trộn ≥ 3 loại câu; không lặp ý. `giai_thich` ≤ 25 từ, lời trẻ hiểu.

### 4.4 Riêng từng môn
- **Toán:** phép tính thuần sinh bằng code (không để AI chế số). AI viết lý thuyết,
  toán lời văn, hình học/khái niệm.
- **Tiếng Việt:** chính tả, vần, từ loại, câu, đọc hiểu ngắn; tiếng phổ thông.
- **Tiếng Anh:** từ vựng + mẫu câu cơ bản, luôn kèm nghĩa tiếng Việt.
- **TNXH:** sự vật/hiện tượng quen thuộc; tránh số liệu khó nhớ.

### 4.5 Kỹ thuật
- Chỉ xuất JSON hợp lệ theo schema; không markdown, không lời dẫn.
- `id` câu duy nhất trong bài; `dap_an` đúng định dạng từng loại.

> --- BẢN LEAN (dán vào Project cùng với schema) -------------------------------
> Trẻ 8 tuổi, ≤15 từ/câu, thuần Việt, ví dụ đời sống VN. Tự viết, không chép SGK,
> không vượt lớp 3. Mỗi bài: 2 lý thuyết + 8 câu (3 dễ/3 vừa/2 khó), trộn ≥3 trong
> 6 loại (trac_nghiem, dung_sai, dien_khuyet, noi_cap, sap_xep, tu_luan_ngan).
> giai_thich ≤25 từ. Toán: không tự chế số phép tính thuần. Chỉ xuất JSON đúng schema.
> ------------------------------------------------------------------------------

---

## §5. Thứ tự làm

1. **A** chốt khuôn (Opus, 1 lần) → lưu schema vào Project.
2. **E** viết script validate + sync; chuyển dữ liệu cũ sang khuôn.
3. **D** dựng 6 renderer (ưu tiên dung_sai, dien_khuyet).
4. **B** mục lục từng môn (Sonnet) → lưu `content/{mon}/lop3/_muc-luc.md`.
5. **C** tạo bài hàng loạt, 3–5 bài/chat, kiểm bằng script.
6. ≥200 bài → Batch API + caching.

---

## §6. Bộ prompt (đã tối ưu — ngắn gọn, chỉ xuất kết quả)

### A — Chốt khuôn · **Opus** · 1 lần
```
Kiến trúc sư dữ liệu app "Bé Học" (frontend index.html thuần JS; backend Supabase).
question_bank hiện: {question, options[3], answer_index, difficulty, topic_id} — chỉ trắc nghiệm.
Chuẩn hóa thành KHUÔN bài học JSON (content/{mon}/lop3/bai-XX.json) dùng chung mọi môn.
• 6 loại: trac_nghiem, dung_sai, dien_khuyet, noi_cap, sap_xep, tu_luan_ngan
• Bài: id,mon,lop,chuong,bai,ten_bai,muc_tieu[],ly_thuyet[],cau_hoi[],phan_thuong
• Câu: id,loai,de,lua_chon?,dap_an,giai_thich(≤25 từ),do_kho(1–3)
• Tương thích ngược trac_nghiem cũ.
Xuất 3 khối, KHÔNG giải thích: (1) JSON Schema ajv draft-07; (2) @typedef JSDoc; (3) bai-01.json mẫu Toán lớp 3 đủ 6 loại.
```

### B — Mục lục cả năm · **Sonnet** · 1 lần/môn
```
Mục lục môn {{MÔN}} lớp 3, GDPT 2018, bộ Kết nối tri thức với cuộc sống, năm 2025–2026, cả năm (HK1+HK2).
Bảng: chuong | bai | ma_bai | ten_bai | muc_tieu(≤15 từ) | so_tiet | hoc_ky
ma_bai = {mon}-l3-b01, b02… Chỉ xuất bảng.
```

### C — Tạo bài · **Sonnet/Haiku** · lặp (để schema+LEAN trong Project)
```
Dùng schema + quy tắc trong Project.
Tạo bài: {{MÃ_BÀI_1}},{{MÃ_BÀI_2}},{{MÃ_BÀI_3}} (mục tiêu ở mục lục cuối prompt).
Mỗi bài: 2 lý thuyết + 8 câu (3 dễ/3 vừa/2 khó), ≥3 loại. Toán không tự chế số phép tính thuần.
Xuất: 1 mảng JSON hợp lệ, không markdown/giải thích.
{{dán 3–5 dòng mục lục}}
```

### D — Renderer loại câu · **Claude Code** · mỗi loại 1 việc
```
Viết hàm render loại "{{LOAI}}" trong js/lesson-render.js (vanilla JS).
Chỉ sửa: js/lesson-render.js (+ CSS .q/.opts trong index.html nếu cần).
Vào: object LessonQuestion. Ra: phần tử DOM + callback thu lựa chọn {id,choice}.
KHÔNG lộ đáp án (chấm ở server). Không đọc file khác. Xong: liệt kê file đã sửa.
```

### E — Script kiểm tra + đồng bộ · **Claude Code** · 1 lần
```
1) scripts/validate-content.mjs (chỉ ajv): quét content/**/*.json, kiểm JSON Schema,
   báo lỗi theo file+đường dẫn trường, tạo content/{mon}/lop3/index.json.
2) scripts/sync-content.mjs: UPSERT câu hỏi vào Supabase question_bank qua REST
   (service key đọc từ biến môi trường, KHÔNG hardcode), map loai→cấu trúc hiện có.
Chỉ sửa scripts/. Không đổi cấu trúc Supabase. Xong: liệt kê file đã tạo.
```
> Thêm bài sau này (0 credit): chép JSON vào `content/` → `node scripts/validate-content.mjs`
> → `node scripts/sync-content.mjs` → `git push`.

---

## §7. Ràng buộc chung (cũng nằm trong CLAUDE.md)
- Không đổi cấu trúc Supabase khi chưa hỏi.
- Không tạo file ngoài thư mục được chỉ định trong từng việc.
- App không tự cộng 💎/sao — chỉ qua RPC server.
- Giao diện tiếng Việt, phù hợp trẻ 8 tuổi.
- Mỗi việc chỉ đọc đúng file được nêu; không tự quét cả repo (tốn credit).
