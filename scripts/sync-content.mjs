#!/usr/bin/env node
/* Đồng bộ câu hỏi từ content/*.json lên Supabase question_bank (để server chấm).
   Mặc định DRY-RUN (không ghi). Thêm --apply để ghi thật.
   Cần biến môi trường khi --apply:
     SUPABASE_URL          = https://<ref>.supabase.co
     SUPABASE_SERVICE_KEY  = service_role key (chỉ dùng ở máy/CI, KHÔNG commit)
   Lưu ý: question_bank hiện chỉ lưu trắc nghiệm (options/answer_index). Các loại
   dien_khuyet/noi_cap/sap_xep/tu_luan_ngan sẽ được BÁO BỎ QUA cho tới khi mở rộng
   bảng (cần hỏi trước — không tự đổi cấu trúc Supabase). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const APPLY = process.argv.includes("--apply");
const MON2SUBJECT = { toan: "math", viet: "viet", anh: "eng" }; // tnxh: chưa có topic
const SUPPORTED = new Set(["trac_nghiem", "dung_sai"]);          // loại lưu được vào question_bank hiện tại

function lessons() {
  const out = [];
  if (!fs.existsSync(CONTENT)) return out;
  for (const mon of fs.readdirSync(CONTENT)) {
    const dir = path.join(CONTENT, mon, "lop3");
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir))
      if (/^bai-.*\.json$/.test(f)) out.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  }
  return out;
}

/** Chuyển 1 câu sang hàng question_bank. null nếu loại chưa hỗ trợ. */
function toRow(c, subject_code) {
  if (c.loai === "trac_nghiem")
    return { subject_code, type: "mcq", question: c.de, options: c.lua_chon, answer_index: c.dap_an, difficulty: c.do_kho };
  if (c.loai === "dung_sai")
    return { subject_code, type: "mcq", question: c.de, options: ["Đúng", "Sai"], answer_index: c.dap_an ? 0 : 1, difficulty: c.do_kho };
  return null;
}

const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
async function api(method, pathq, body) {
  const res = await fetch(`${URL}/rest/v1/${pathq}`, {
    method, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${pathq} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
async function topicId(subject_code, order_index) {
  const r = await api("GET", `topics?select=id&subject_code=eq.${subject_code}&order_index=eq.${order_index}`);
  return r[0]?.id || null;
}

(async () => {
  if (APPLY && (!URL || !KEY)) {
    console.error("❌ Thiếu SUPABASE_URL / SUPABASE_SERVICE_KEY để --apply."); process.exit(1);
  }
  let totalRows = 0, skipped = {}, plan = [];
  for (const L of lessons()) {
    const subject_code = MON2SUBJECT[L.mon];
    if (!subject_code) { skipped[L.mon] = (skipped[L.mon] || 0) + L.cau_hoi.length; continue; }
    const rows = [];
    for (const c of L.cau_hoi) {
      if (!SUPPORTED.has(c.loai)) { skipped[c.loai] = (skipped[c.loai] || 0) + 1; continue; }
      rows.push(toRow(c, subject_code));
    }
    totalRows += rows.length;
    plan.push({ id: L.id, mon: L.mon, bai: L.bai, subject_code, rows });
  }

  console.log(`Kế hoạch đồng bộ: ${plan.length} bài, ${totalRows} câu trắc nghiệm.`);
  const skipList = Object.entries(skipped);
  if (skipList.length) console.log("Bỏ qua (loại/môn chưa hỗ trợ ở question_bank):", skipList.map(([k, n]) => `${k}=${n}`).join(", "));

  if (!APPLY) { console.log("\n(DRY-RUN) Không ghi gì. Thêm --apply để ghi thật."); return; }

  for (const p of plan) {
    const tid = await topicId(p.subject_code, p.bai);
    if (!tid) { console.warn(`⚠️ Bỏ ${p.id}: không thấy topic (${p.subject_code}, order_index=${p.bai}).`); continue; }
    // idempotent: xóa câu cũ của topic rồi chèn lại
    await api("DELETE", `question_bank?topic_id=eq.${tid}`);
    const rows = p.rows.map(r => ({ ...r, grade: 3, active: true, topic_id: tid }));
    if (rows.length) await api("POST", "question_bank", rows);
    console.log(`✓ ${p.id}: ${rows.length} câu → topic ${tid}`);
  }
  console.log("✅ Đồng bộ xong.");
})().catch(e => { console.error("❌", e.message); process.exit(1); });
