// ============================================================================
// BÉ HỌC — cấu hình Supabase (giá trị PUBLIC, an toàn để commit).
//   SUPABASE_URL      : https://<PROJECT_REF>.supabase.co
//   SUPABASE_ANON_KEY : anon/public key (được RLS bảo vệ — KHÔNG phải service key)
// TUYỆT ĐỐI KHÔNG đặt service_role key hay SUPABASE_ACCESS_TOKEN ở đây.
// Khi deploy, 2 giá trị dưới sẽ được điền tự động.
// ============================================================================
window.BE_CONFIG = {
  SUPABASE_URL: "https://mbzscobzwfmglswkvijp.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ienNjb2J6d2ZtZ2xzd2t2aWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODk0NzgsImV4cCI6MjA5NTM2NTQ3OH0.y7_no70SMIfFxxv5sLiFU8Avu4Wz7goDPpv56hcJSVc"
};
