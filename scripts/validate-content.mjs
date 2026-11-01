#!/usr/bin/env node
/* Kiểm tra toàn bộ bài học trong content/ theo JSON Schema (ajv) và tạo index.json.
   Dùng: node scripts/validate-content.mjs
   Chỉ phụ thuộc: ajv. Thoát mã 1 nếu có lỗi. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const SCHEMA = path.join(CONTENT, "schema", "bai-hoc.schema.json");

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(JSON.parse(fs.readFileSync(SCHEMA, "utf8")));

/** Liệt kê mọi file bài học: content/<mon>/lop3/bai-*.json */
function lessonFiles() {
  const out = [];
  if (!fs.existsSync(CONTENT)) return out;
  for (const mon of fs.readdirSync(CONTENT)) {
    if (!fs.statSync(path.join(CONTENT, mon)).isDirectory()) continue;
    const dir = path.join(CONTENT, mon, "lop3");
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (/^bai-.*\.json$/.test(f)) out.push(path.join(dir, f));
    }
  }
  return out;
}

const files = lessonFiles();
const errors = [];
const okByMon = {};        // mon -> [{id,bai,ten_bai,so_cau,file}]
const seenIds = new Map(); // id -> file (bắt trùng id)

for (const file of files) {
  const rel = path.relative(ROOT, file);
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { errors.push(`${rel}: JSON hỏng — ${e.message}`); continue; }

  if (!validate(data)) {
    for (const e of validate.errors) errors.push(`${rel} ${e.instancePath || "/"} ${e.message}`);
    continue;
  }
  // kiểm tra bổ sung ngoài schema
  if (seenIds.has(data.id)) errors.push(`${rel}: id "${data.id}" trùng với ${seenIds.get(data.id)}`);
  seenIds.set(data.id, rel);
  const ids = new Set();
  for (const c of data.cau_hoi) {
    if (ids.has(c.id)) errors.push(`${rel}: câu id "${c.id}" bị trùng trong bài`);
    ids.add(c.id);
    // chỉ số đáp án phải nằm trong lua_chon
    if (c.loai === "trac_nghiem" && (c.dap_an < 0 || c.dap_an >= c.lua_chon.length))
      errors.push(`${rel} ${c.id}: dap_an ${c.dap_an} ngoài phạm vi lua_chon`);
    if (c.loai === "sap_xep" && c.dap_an.length !== c.lua_chon.length)
      errors.push(`${rel} ${c.id}: sap_xep dap_an phải đủ số phần tử lua_chon`);
    if (c.loai === "noi_cap" && c.dap_an.length !== c.trai.length)
      errors.push(`${rel} ${c.id}: noi_cap dap_an phải khớp số phần tử trai`);
  }
  (okByMon[data.mon] ||= []).push({ id: data.id, bai: data.bai, ten_bai: data.ten_bai, so_cau: data.cau_hoi.length, file: rel });
}

// ghi index.json mỗi môn (chỉ khi không có lỗi toàn cục của môn đó)
for (const [mon, list] of Object.entries(okByMon)) {
  list.sort((a, b) => a.bai - b.bai);
  const idxPath = path.join(CONTENT, mon, "lop3", "index.json");
  fs.writeFileSync(idxPath, JSON.stringify({ mon, lop: 3, bai: list.map(({ file, ...r }) => r) }, null, 2) + "\n");
}

console.log(`Đã kiểm ${files.length} bài.`);
if (errors.length) {
  console.error(`\n❌ ${errors.length} lỗi:\n` + errors.map(e => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("✅ Tất cả hợp lệ. Đã cập nhật index.json cho:", Object.keys(okByMon).join(", ") || "(chưa có bài)");
