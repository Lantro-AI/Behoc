# Quy tắc viết nội dung Bé Học (dán vào Project, dùng chung mọi lô)

## Đối tượng & ngôn ngữ
- Trẻ 8 tuổi (lớp 3). Mỗi câu ≤ 15 từ, từ ngữ đơn giản, thuần Việt.
- Giọng vui, khích lệ. Không hù dọa, không nội dung tiêu cực.
- Ví dụ gần gũi đời sống Việt Nam (chợ, trường, gia đình, con vật quen thuộc).

## Nguồn & bản quyền
- Theo chương trình GDPT 2018, bộ {{BỘ_SÁCH}}, lớp 3, năm học 2025–2026.
- **TỰ VIẾT**, KHÔNG chép nguyên văn SGK (tránh vi phạm bản quyền).
- Bám đúng mục tiêu bài trong mục lục; không dạy vượt quá phạm vi lớp 3.

## 6 loại câu & cách ra đề
- `trac_nghiem`: 3 lựa chọn, 1 đúng; distractor hợp lý (sai kiểu trẻ hay nhầm).
- `dung_sai`: 1 mệnh đề, đáp án Đúng/Sai.
- `dien_khuyet`: 1 chỗ trống, đáp án là 1 từ/số rõ ràng.
- `noi_cap`: 3–4 cặp, nối trái–phải (vd từ–nghĩa, phép tính–kết quả).
- `sap_xep`: sắp 3–5 phần tử theo thứ tự (số tăng dần, các bước, chữ cái).
- `tu_luan_ngan`: câu trả lời ngắn + đáp án mẫu để bé tự đối chiếu (không auto-chấm).

## Cân bằng mỗi bài
- 8 câu: 3 dễ (do_kho 1), 3 vừa (do_kho 2), 2 khó (do_kho 3).
- Trộn ≥ 3 loại câu khác nhau. Không lặp ý giữa các câu.
- `giai_thich` ≤ 25 từ, nói vì sao đúng, bằng lời trẻ hiểu.

## Riêng từng môn
- **Toán:** phép tính thuần (cộng/trừ/nhân/chia, đo lường) → sinh bằng code, KHÔNG để AI chế số. AI viết: lý thuyết, bài toán có lời văn, hình học/khái niệm.
- **Tiếng Việt:** chính tả, vần, từ loại, câu, đọc hiểu ngắn. Dùng tiếng phổ thông.
- **Tiếng Anh:** từ vựng + mẫu câu cơ bản; luôn kèm nghĩa tiếng Việt.
- **TNXH:** sự vật/hiện tượng quen thuộc; tránh số liệu khó nhớ.

## Kỹ thuật
- Chỉ xuất JSON hợp lệ theo schema. Không markdown, không lời dẫn.
- `id` câu duy nhất trong bài. `dap_an` đúng định dạng từng loại.
