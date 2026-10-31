# Bé Học 🎒

App học cho trẻ em (Toán · Tiếng Việt · Tiếng Anh) — bản đồ 20 chặng/môn kiểu
Candy Crush, mini game, ví 💎, xếp hạng. Frontend tĩnh + Supabase (auth, database,
logic thưởng chạy server chống gian lận). Deploy trên Netlify.

## Kiến trúc

| Tầng | Công nghệ |
|------|-----------|
| Frontend | 1 trang `index.html` thuần (HTML/CSS/vanilla JS), không build phức tạp |
| Backend | Supabase: Auth (email/mật khẩu phụ huynh), Postgres + RLS, RPC |
| Hosting | Netlify (site tĩnh, chèn cấu hình lúc build) |

**Mô hình tài khoản:** Phụ huynh đăng ký → tạo nhiều hồ sơ bé. Nhiều gia đình
dùng chung, dữ liệu tách bằng RLS theo `auth.uid()`.

**Nguyên tắc chống gian lận:** Frontend **không bao giờ** tự cộng 💎/sao. Mọi
điểm thưởng đi qua RPC `be_complete_lesson` / `be_finish_minigame` (SECURITY
DEFINER). Client chỉ có quyền **đọc** dữ liệu của con mình.
> Giới hạn: RPC chặn sửa 💎 tay, ghi điểm trực tiếp, farm lại 💎 bài cũ, vượt
> trần ngày và đụng dữ liệu nhà khác — nhưng **chưa** kiểm được bé trả lời
> đúng/sai (client gửi số sao). Khóa hẳn cần chấm đáp án ở server (P2).

## Thiết lập

### 1. Supabase
1. Tạo project Supabase.
2. Mở SQL Editor → chạy toàn bộ `supabase/schema.sql`.
3. (Khuyến nghị khi test) Authentication → Providers → Email: tắt "Confirm email"
   để đăng ký xong vào luôn, không cần bấm link email.
4. Lấy **Project URL** và **anon public key** (Settings → API).

### 2. Netlify
1. Kết nối repo này với Netlify.
2. Site settings → Environment variables, thêm:
   - `SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
   - `SUPABASE_ANON_KEY` = anon/public key
3. Deploy. `build.sh` sẽ chèn 2 giá trị vào `js/config.js` lúc build.

### Chạy thử tại máy
Mở `index.html` bằng server tĩnh bất kỳ, sau khi điền tay 2 giá trị vào
`js/config.js` (thay `__SUPABASE_URL__` và `__SUPABASE_ANON_KEY__`).
```bash
python3 -m http.server 8080
```

## Phần thưởng (chốt theo thiết kế)
- **Bài học:** 1★ = 5💎 · 2★ = 10💎 · 3★ = 20💎. Làm lại chỉ cộng phần sao nâng
  thêm; sổ `rewarded_stars` giữ qua reset → không kiếm lại 💎 bài cũ.
- **Mini game:** 🥉 = 3💎 · 🥈 = 6💎 · 🥇 = 12💎 · trần 3 lượt thưởng/trò/ngày ·
  phá kỷ lục +10💎. Độ khó theo lớp (hệ số 0.8 → 1.2).

## Còn phải làm
- **P2:** Ngân hàng câu hỏi thật theo chương trình từng lớp; nội dung 20 chủ đề
  × 3 môn (hiện mỗi bài 1 câu demo). Chấm đáp án ở server để chống gian lận triệt để.
- **P3:** 3 mini game còn lại (Mắt Tinh, Lật Hình, Tìm Quy Luật); màn Cửa hàng 💎.
