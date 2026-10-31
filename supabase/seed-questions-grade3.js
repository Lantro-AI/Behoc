#!/usr/bin/env node
/* Sinh ngân hàng câu hỏi lớp 3 (Toán + Tiếng Anh) — chương trình tích hợp, cả HK1+HK2.
   Mỗi câu: 3 lựa chọn, 1 đúng. Toán có trường `check` (số) để tự kiểm đáp án.
   Xuất: ngan-hang-cau-hoi-lop3.csv  +  seed-questions-grade3.sql
   Cột CSV: subject_code,grade,type,question,option_a,option_b,option_c,answer_index,difficulty,active */
"use strict";
const fs = require("fs");

// Q(subject, sem, topic, difficulty, question, [a,b,c], ansIndex, checkNumber?)
const R = [];
function Q(subject, sem, topic, diff, q, opts, ans, check) {
  R.push({ subject, sem, topic, diff, q, opts, ans, check });
}

/* ============================ TOÁN — HK1 ============================ */
// Bảng nhân/chia 6,7,8,9
Q("math","HK1","Bảng nhân 6",1,"6 × 4 = ?",["24","20","28"],0,24);
Q("math","HK1","Bảng nhân 7",1,"7 × 5 = ?",["30","35","40"],1,35);
Q("math","HK1","Bảng nhân 8",2,"8 × 7 = ?",["54","56","64"],1,56);
Q("math","HK1","Bảng nhân 9",2,"9 × 6 = ?",["54","56","45"],0,54);
Q("math","HK1","Bảng chia 6",1,"36 : 6 = ?",["5","6","7"],1,6);
Q("math","HK1","Bảng chia 7",2,"49 : 7 = ?",["6","7","8"],1,7);
Q("math","HK1","Bảng chia 8",2,"64 : 8 = ?",["7","8","9"],1,8);
Q("math","HK1","Bảng chia 9",2,"81 : 9 = ?",["8","9","7"],1,9);
// Nhân/chia trong phạm vi 100
Q("math","HK1","Nhân số có 2 chữ số với số có 1 chữ số",2,"23 × 3 = ?",["69","66","63"],0,69);
Q("math","HK1","Nhân số có 2 chữ số với số có 1 chữ số",2,"14 × 5 = ?",["60","70","75"],1,70);
Q("math","HK1","Chia số có 2 chữ số cho số có 1 chữ số",2,"84 : 4 = ?",["21","22","24"],0,21);
Q("math","HK1","Chia có dư",3,"29 : 5 = ? (dư bao nhiêu)",["dư 3","dư 4","dư 5"],1,null);
// Gấp - giảm một số lần
Q("math","HK1","Gấp một số lên nhiều lần",2,"Gấp 7 lên 4 lần được bao nhiêu?",["28","21","11"],0,28);
Q("math","HK1","Giảm một số đi nhiều lần",2,"Giảm 48 đi 6 lần được bao nhiêu?",["6","8","42"],1,8);
// Tìm thành phần chưa biết
Q("math","HK1","Tìm thừa số chưa biết",2,"x × 4 = 32. x = ?",["6","7","8"],2,8);
Q("math","HK1","Tìm số bị chia",2,"x : 5 = 6. x = ?",["11","30","35"],1,30);
Q("math","HK1","Tìm số hạng chưa biết",1,"x + 25 = 40. x = ?",["15","25","65"],0,15);
// So sánh - làm tròn (giới thiệu)
Q("math","HK1","So sánh số trong phạm vi 1000",1,"Số nào lớn nhất?",["789","798","780"],1,798);
Q("math","HK1","So sánh biểu thức",2,"6 × 7 ... 45. Dấu đúng là?",["<",">","="],0,null);
// Chu vi
Q("math","HK1","Chu vi hình tam giác",2,"Tam giác có 3 cạnh 4cm, 5cm, 6cm. Chu vi là?",["14cm","15cm","16cm"],1,15);
Q("math","HK1","Chu vi hình tứ giác",2,"Tứ giác 4 cạnh đều 5cm. Chu vi là?",["15cm","20cm","25cm"],1,20);
Q("math","HK1","Góc vuông",1,"Hình nào có 4 góc vuông?",["Hình chữ nhật","Hình tam giác","Hình tròn"],0,null);
// Đo lường
Q("math","HK1","Đơn vị đo độ dài",1,"1 dm = ? cm",["10","100","1"],0,10);
Q("math","HK1","Đơn vị đo độ dài",2,"1 m = ? cm",["10","100","1000"],1,100);
Q("math","HK1","Đổi đơn vị đo độ dài",3,"3 dm 5 cm = ? cm",["35","305","8"],0,35);
Q("math","HK1","Đơn vị đo khối lượng",1,"1 kg = ? g",["100","1000","10"],1,1000);
Q("math","HK1","Đơn vị đo dung tích",1,"1 lít = ? ml",["100","1000","10"],1,1000);
// Xem giờ
Q("math","HK1","Xem đồng hồ",2,"Kim giờ chỉ số 3, kim phút chỉ số 12. Mấy giờ?",["3 giờ","12 giờ","15 giờ"],0,null);
Q("math","HK1","Xem đồng hồ",2,"9 giờ 30 phút còn gọi là?",["9 giờ rưỡi","9 giờ kém","8 giờ rưỡi"],0,null);

/* ============================ TOÁN — HK2 ============================ */
// Số trong phạm vi 10 000 / 100 000
Q("math","HK2","Đọc viết số đến 10 000",1,"Số 'bốn nghìn hai trăm' viết là?",["4200","4020","4002"],0,4200);
Q("math","HK2","Cấu tạo số",2,"6035 gồm mấy nghìn?",["6 nghìn","60 nghìn","3 nghìn"],0,null);
Q("math","HK2","So sánh số đến 10 000",2,"Số nào bé nhất?",["3999","4001","3909"],2,3909);
Q("math","HK2","Số liền sau",1,"Số liền sau của 5999 là?",["5998","6000","6001"],1,6000);
// Cộng trừ trong phạm vi 10 000
Q("math","HK2","Cộng trong phạm vi 10 000",2,"3245 + 1523 = ?",["4768","4668","4778"],0,4768);
Q("math","HK2","Cộng có nhớ",3,"2758 + 1346 = ?",["4004","4104","4094"],1,4104);
Q("math","HK2","Trừ trong phạm vi 10 000",2,"5678 − 2345 = ?",["3333","3433","3343"],0,3333);
Q("math","HK2","Trừ có nhớ",3,"6204 − 1538 = ?",["4666","4766","4676"],0,4666);
// Nhân chia nhiều chữ số với số 1 chữ số
Q("math","HK2","Nhân số có 3 chữ số",2,"123 × 3 = ?",["369","366","379"],0,369);
Q("math","HK2","Nhân có nhớ",3,"214 × 4 = ?",["856","846","866"],0,856);
Q("math","HK2","Chia số có 3 chữ số",2,"936 : 3 = ?",["312","322","302"],0,312);
Q("math","HK2","Chia có dư",3,"725 : 6 = ? (thương)",["120","121","122"],1,121);
// Làm tròn số
Q("math","HK2","Làm tròn đến hàng chục",2,"Làm tròn 47 đến hàng chục được?",["40","50","45"],1,50);
Q("math","HK2","Làm tròn đến hàng trăm",3,"Làm tròn 362 đến hàng trăm được?",["300","400","360"],1,400);
// Diện tích - chu vi
Q("math","HK2","Chu vi hình chữ nhật",2,"HCN dài 6cm rộng 4cm. Chu vi = ?",["20cm","24cm","10cm"],0,20);
Q("math","HK2","Diện tích hình chữ nhật",3,"HCN dài 6cm rộng 4cm. Diện tích = ?",["24 cm²","20 cm²","10 cm²"],0,24);
Q("math","HK2","Diện tích hình vuông",2,"Hình vuông cạnh 5cm. Diện tích = ?",["25 cm²","20 cm²","10 cm²"],0,25);
Q("math","HK2","Chu vi hình vuông",2,"Hình vuông cạnh 5cm. Chu vi = ?",["20cm","25cm","10cm"],0,20);
// Phân số (một phần mấy)
Q("math","HK2","Một phần mấy",1,"Chia cái bánh thành 4 phần bằng nhau, lấy 1 phần là?",["1/2","1/4","1/3"],1,null);
Q("math","HK2","So sánh phần",2,"Phần nào lớn hơn?",["1/2","1/4","1/3"],0,null);
// Tiền Việt Nam
Q("math","HK2","Tiền Việt Nam",2,"2 tờ 5000 đồng là bao nhiêu?",["5000đ","10000đ","15000đ"],1,10000);
Q("math","HK2","Tiền Việt Nam",3,"Mua vở 8000đ, đưa 10000đ, thối lại?",["1000đ","2000đ","3000đ"],1,2000);
// Tháng - năm
Q("math","HK2","Tháng trong năm",1,"Một năm có bao nhiêu tháng?",["10","12","11"],1,12);
Q("math","HK2","Ngày trong tuần",1,"Một tuần có mấy ngày?",["5","6","7"],2,7);
Q("math","HK2","Tháng có bao nhiêu ngày",3,"Tháng 2 (năm thường) có bao nhiêu ngày?",["28","30","31"],0,28);
// Thống kê / khả năng
Q("math","HK2","Khả năng xảy ra",2,"Tung đồng xu, khả năng ra mặt ngửa là?",["Chắc chắn","Có thể","Không thể"],1,null);

/* ============================ TIẾNG ANH — HK1 ============================ */
// Greetings & introductions
Q("eng","HK1","Greetings",1,'"Hello" nghĩa là?',["Xin chào","Tạm biệt","Cảm ơn"],0,null);
Q("eng","HK1","Greetings",1,'"Goodbye" nghĩa là?',["Xin chào","Tạm biệt","Xin lỗi"],1,null);
Q("eng","HK1","Introductions",2,'"What is your name?" nghĩa là?',["Bạn tên gì?","Bạn bao nhiêu tuổi?","Bạn khỏe không?"],0,null);
Q("eng","HK1","Introductions",2,'"I ___ Nam." (Tôi là Nam)',["am","is","are"],0,null);
Q("eng","HK1","How are you",2,'"How are you?" nghĩa là?',["Bạn tên gì?","Bạn khỏe không?","Bạn ở đâu?"],1,null);
// Numbers 1-20
Q("eng","HK1","Numbers",1,'Số "eight" là?',["6","8","9"],1,null);
Q("eng","HK1","Numbers",1,'Số "twelve" là?',["12","20","2"],0,null);
Q("eng","HK1","Numbers",2,'Số 15 trong tiếng Anh là?',["fifty","fifteen","five"],1,null);
Q("eng","HK1","Numbers",2,'"twenty" là số?',["12","20","2"],1,null);
// Colors
Q("eng","HK1","Colors",1,'"Red" là màu gì?',["Đỏ","Xanh","Vàng"],0,null);
Q("eng","HK1","Colors",1,'"Blue" là màu gì?',["Xanh dương","Đỏ","Đen"],0,null);
Q("eng","HK1","Colors",2,'Màu vàng tiếng Anh là?',["green","yellow","white"],1,null);
Q("eng","HK1","Colors",2,'"Green" là màu gì?',["Xanh lá","Tím","Nâu"],0,null);
// School things
Q("eng","HK1","School things",1,'"Book" nghĩa là?',["Quyển sách","Cái bút","Cái bàn"],0,null);
Q("eng","HK1","School things",1,'"Pen" nghĩa là?',["Cái bút","Quyển vở","Cái ghế"],0,null);
Q("eng","HK1","School things",2,'"Pencil" nghĩa là?',["Bút chì","Bút mực","Thước kẻ"],0,null);
Q("eng","HK1","School things",2,'"Ruler" nghĩa là?',["Cục tẩy","Thước kẻ","Cặp sách"],1,null);
Q("eng","HK1","Classroom",2,'"Teacher" nghĩa là?',["Giáo viên","Học sinh","Bạn bè"],0,null);
// Family
Q("eng","HK1","Family",1,'"Mother" nghĩa là?',["Mẹ","Bố","Anh"],0,null);
Q("eng","HK1","Family",1,'"Father" nghĩa là?',["Mẹ","Bố","Em"],1,null);
Q("eng","HK1","Family",2,'"Sister" nghĩa là?',["Chị/em gái","Anh/em trai","Ông"],0,null);
Q("eng","HK1","Family",2,'"Brother" nghĩa là?',["Chị gái","Anh/em trai","Bà"],1,null);
// This/That
Q("eng","HK1","This/That",2,'"This is a book." — "this" dùng cho vật?',["Ở xa","Ở gần","Số nhiều"],1,null);
Q("eng","HK1","This/That",3,'"___ is a cat." (đây là con mèo, ở gần)',["This","That","These"],0,null);
// Toys & body
Q("eng","HK1","Toys",1,'"Ball" nghĩa là?',["Quả bóng","Búp bê","Ô tô"],0,null);
Q("eng","HK1","Toys",2,'"Doll" nghĩa là?',["Búp bê","Gấu bông","Diều"],0,null);
Q("eng","HK1","Body",1,'"Hand" nghĩa là?',["Bàn tay","Bàn chân","Cái đầu"],0,null);
Q("eng","HK1","Body",2,'"Head" nghĩa là?',["Cái đầu","Cái tai","Cái mũi"],0,null);
Q("eng","HK1","Body",2,'"Eyes" nghĩa là?',["Đôi mắt","Đôi tai","Bàn tay"],0,null);

/* ============================ TIẾNG ANH — HK2 ============================ */
// Animals
Q("eng","HK2","Animals",1,'"Dog" nghĩa là?',["Con chó","Con mèo","Con cá"],0,null);
Q("eng","HK2","Animals",1,'"Cat" nghĩa là?',["Con mèo","Con chó","Con chim"],0,null);
Q("eng","HK2","Animals",2,'"Bird" nghĩa là?',["Con chim","Con cá","Con thỏ"],0,null);
Q("eng","HK2","Animals",2,'"Fish" nghĩa là?',["Con cá","Con ếch","Con rùa"],0,null);
Q("eng","HK2","Animals",2,'"Elephant" nghĩa là?',["Con voi","Con hổ","Con khỉ"],0,null);
// Food & drink
Q("eng","HK2","Food",1,'"Rice" nghĩa là?',["Cơm","Bánh mì","Thịt"],0,null);
Q("eng","HK2","Food",1,'"Milk" nghĩa là?',["Sữa","Nước","Trà"],0,null);
Q("eng","HK2","Food",2,'"Bread" nghĩa là?',["Bánh mì","Cơm","Mì"],0,null);
Q("eng","HK2","Food",2,'"Apple" nghĩa là?',["Quả táo","Quả cam","Quả chuối"],0,null);
Q("eng","HK2","Food",2,'"Water" nghĩa là?',["Nước","Sữa","Nước cam"],0,null);
// Can / can't (abilities)
Q("eng","HK2","Can",2,'"I can swim." nghĩa là?',["Tôi biết bơi","Tôi muốn bơi","Tôi thích bơi"],0,null);
Q("eng","HK2","Can",3,'"She ___ sing." (Cô ấy biết hát)',["can","is","do"],0,null);
Q("eng","HK2","Can",2,'"run" nghĩa là?',["Chạy","Nhảy","Bơi"],0,null);
// Clothes
Q("eng","HK2","Clothes",1,'"Shirt" nghĩa là?',["Áo sơ mi","Quần","Giày"],0,null);
Q("eng","HK2","Clothes",2,'"Shoes" nghĩa là?',["Đôi giày","Cái mũ","Cái áo"],0,null);
Q("eng","HK2","Clothes",2,'"Hat" nghĩa là?',["Cái mũ","Cái áo","Đôi tất"],0,null);
// Weather
Q("eng","HK2","Weather",1,'"Sunny" là thời tiết?',["Nắng","Mưa","Tuyết"],0,null);
Q("eng","HK2","Weather",2,'"Rainy" là thời tiết?',["Mưa","Nắng","Gió"],0,null);
Q("eng","HK2","Weather",2,'"Hot" nghĩa là?',["Nóng","Lạnh","Mát"],0,null);
// Feelings
Q("eng","HK2","Feelings",1,'"Happy" nghĩa là?',["Vui","Buồn","Giận"],0,null);
Q("eng","HK2","Feelings",2,'"Sad" nghĩa là?',["Buồn","Vui","Sợ"],0,null);
Q("eng","HK2","Feelings",2,'"Hungry" nghĩa là?',["Đói","Khát","Mệt"],0,null);
// House / rooms
Q("eng","HK2","House",2,'"Kitchen" là phòng?',["Nhà bếp","Phòng ngủ","Phòng tắm"],0,null);
Q("eng","HK2","House",2,'"Bedroom" là phòng?',["Phòng ngủ","Nhà bếp","Phòng khách"],0,null);
// Days & likes
Q("eng","HK2","Days",2,'"Monday" là thứ mấy?',["Thứ Hai","Chủ Nhật","Thứ Sáu"],0,null);
Q("eng","HK2","Days",2,'"Sunday" là ngày nào?',["Chủ Nhật","Thứ Bảy","Thứ Hai"],0,null);
Q("eng","HK2","Likes",2,'"I like apples." nghĩa là?',["Tôi thích táo","Tôi có táo","Tôi ăn táo"],0,null);
Q("eng","HK2","Likes",3,'"Do you like milk?" — trả lời khẳng định đúng?',["Yes, I do.","Yes, I am.","Yes, I like."],0,null);

/* ============================ KIỂM TRA ============================ */
const errs = [];
R.forEach((x, i) => {
  const tag = `#${i+1} [${x.subject}/${x.sem}] ${x.q}`;
  if (!Array.isArray(x.opts) || x.opts.length !== 3) errs.push(tag + " — cần đúng 3 lựa chọn");
  if (new Set(x.opts).size !== x.opts.length) errs.push(tag + " — lựa chọn trùng nhau");
  if (!(x.ans >= 0 && x.ans <= 2)) errs.push(tag + " — answer_index ngoài 0..2");
  if (x.check != null && parseFloat(String(x.opts[x.ans]).replace(/[^\d.\-]/g,"")) !== x.check)
    errs.push(tag + ` — đáp án ${x.opts[x.ans]} ≠ kết quả đúng ${x.check}`);
  if (![1,2,3].includes(x.diff)) errs.push(tag + " — difficulty phải 1..3");
});
if (errs.length) { console.error("❌ LỖI:\n" + errs.join("\n")); process.exit(1); }

/* ============================ XUẤT FILE ============================ */
function csvCell(s){ s=String(s); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
const header = "subject_code,grade,type,question,option_a,option_b,option_c,answer_index,difficulty,active";
const csvLines = [header];
const sqlVals = [];
for (const x of R) {
  csvLines.push([x.subject,3,"mcq",x.q,x.opts[0],x.opts[1],x.opts[2],x.ans,x.diff,"true"].map(csvCell).join(","));
  const opts = JSON.stringify(x.opts).replace(/'/g, "''");
  const qq = x.q.replace(/'/g, "''");
  sqlVals.push(`  ('${x.subject}',3,'mcq','${qq}','${opts}',${x.ans},${x.diff},true)`);
}
fs.writeFileSync(__dirname + "/../ngan-hang-cau-hoi-lop3.csv", csvLines.join("\n") + "\n");
const sql =
`-- Ngân hàng câu hỏi lớp 3 (Toán + Tiếng Anh) — chương trình tích hợp HK1+HK2
-- Tổng: ${R.length} câu. Chạy trên Supabase SQL Editor (hoặc import CSV qua Table Editor).
insert into question_bank (subject_code,grade,type,question,options,answer_index,difficulty,active) values
${sqlVals.join(",\n")}
on conflict do nothing;
`;
fs.writeFileSync(__dirname + "/seed-questions-grade3.sql", sql);

const byCat = {};
R.forEach(x => { const k = x.subject + "/" + x.sem; byCat[k] = (byCat[k]||0)+1; });
console.log("✅ Hợp lệ. Tổng câu:", R.length);
console.log("Phân bố:", JSON.stringify(byCat));
console.log("Đã ghi: ngan-hang-cau-hoi-lop3.csv  +  supabase/seed-questions-grade3.sql");
