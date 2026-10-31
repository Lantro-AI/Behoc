// ============================================================================
// BÉ HỌC — cấu hình Supabase (giá trị PUBLIC, an toàn để commit).
//   SUPABASE_URL      : https://<PROJECT_REF>.supabase.co
//   SUPABASE_ANON_KEY : anon/public key (được RLS bảo vệ — KHÔNG phải service key)
// TUYỆT ĐỐI KHÔNG đặt service_role key hay SUPABASE_ACCESS_TOKEN ở đây.
// Khi deploy, 2 giá trị dưới sẽ được điền tự động.
// ============================================================================
window.BE_CONFIG = {
  SUPABASE_URL: "__SUPABASE_URL__",
  SUPABASE_ANON_KEY: "__SUPABASE_ANON_KEY__"
};
