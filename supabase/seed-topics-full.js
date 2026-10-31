#!/usr/bin/env node
/* Sinh ngân hàng câu hỏi GẮN THEO TỪNG CHẶNG (topic) cho 3 môn (20 chặng/môn)
   + câu hỏi game Nhà Thông Thái scale theo lớp 1,2,4,5.
   - Toán số học: sinh bằng vòng lặp, tự tính đáp án (RNG cố định để tái lập).
   - Toán khái niệm / Tiếng Anh / Tiếng Việt: viết tay, đáp án rõ ràng.
   Xuất: seed-topics-full.sql (gắn topic_id qua subselect theo order_index).
   Cột: subject_code, grade, type, question, options(jsonb), answer_index, difficulty, active, topic_order */
"use strict";
const fs = require("fs");

// RNG cố định (mulberry32) để mỗi lần chạy ra cùng bộ câu
let _s = 20260101 >>> 0;
function rnd(){ _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function ri(n){ return Math.floor(rnd()*n); }

const R = [];
// subject, topicOrder (null nếu là câu game theo lớp), grade, q, opts[3], ans, diff, check(num|null)
function add(subject, topicOrder, grade, q, opts, ans, diff, check){
  R.push({ subject, topicOrder, grade, q, opts, ans, diff, check });
}
// tạo 3 lựa chọn số gồm đáp án đúng ở vị trí ngẫu nhiên
function numOpts(correct, spread){
  const set = new Set([correct]); let guard = 0;
  while(set.size < 3 && guard++ < 60){ const d = correct + (ri(2*spread+1) - spread); if(d >= 0 && !set.has(d)) set.add(d); }
  let k = 1; while(set.size < 3){ if(!set.has(correct+k)) set.add(correct+k); k++; }
  const arr = [...set];
  // trộn
  for(let i=arr.length-1;i>0;i--){ const j=ri(i+1); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return { opts: arr.map(String), ans: arr.indexOf(correct) };
}
function mathQ(subject, topicOrder, grade, text, correct, spread, diff){
  const o = numOpts(correct, spread); add(subject, topicOrder, grade, text, o.opts, o.ans, diff, correct);
}

/* ===================================================================
   TOÁN — 20 chặng (topic_order 1..20)
   =================================================================== */
// 1 Đếm số 1–5
for(let i=0;i<5;i++){ const n=1+ri(5); mathQ("math",1,3,`Đếm số chấm: ${"●".repeat(n)}`, n, 2, 1); }
// 2 Đếm số 6–10
for(let i=0;i<5;i++){ const n=6+ri(5); mathQ("math",2,3,`Có mấy ngôi sao? ${"★".repeat(n)}`, n, 2, 1); }
// 3 Nhận biết chữ số
add("math",3,3,"Chữ số nào là 'bảy'?",["6","7","8"],1,1,null);
add("math",3,3,"Chữ số nào là 'chín'?",["7","8","9"],2,1,null);
add("math",3,3,"Số 'mười' viết là?",["10","100","1"],0,1,null);
add("math",3,3,"Số nào đứng ngay sau số 4?",["3","5","6"],1,1,null);
add("math",3,3,"Số 'không' viết là?",["0","1","10"],0,1,null);
// 4 So sánh lớn – bé
for(let i=0;i<5;i++){ const a=1+ri(20), b=1+ri(20); const bigger=Math.max(a,b), eq=a===b; add("math",4,3,`Số nào lớn hơn: ${a} hay ${b}?`, eq?[`${a}`,`${b}`,"Bằng nhau"]:[`${a}`,`${b}`,"Không biết"], eq?2:(a>b?0:1), 1, null); }
// 5 Nhiều hơn – ít hơn
add("math",5,3,"3 quả táo và 5 quả cam — bên nào nhiều hơn?",["Táo","Cam","Bằng nhau"],1,1,null);
add("math",5,3,"7 cái kẹo và 7 cái bánh — so sánh?",["Kẹo nhiều hơn","Bằng nhau","Bánh nhiều hơn"],1,1,null);
add("math",5,3,"Có 8 con gà, 2 con vịt. Gà nhiều hơn vịt mấy con?",["4","6","10"],1,2,6);
add("math",5,3,"Lan có 4 bút, Hà có 9 bút. Ai ít hơn?",["Lan","Hà","Bằng nhau"],0,1,null);
// 6 Phép cộng trong 5
for(let i=0;i<6;i++){ const a=ri(5), b=ri(6-a); mathQ("math",6,3,`${a} + ${b} = ?`, a+b, 2, 1); }
// 7 Phép cộng trong 10
for(let i=0;i<6;i++){ const a=1+ri(9); const b=ri(10-a+1); mathQ("math",7,3,`${a} + ${b} = ?`, a+b, 2, 1); }
// 8 Phép trừ trong 5
for(let i=0;i<6;i++){ const a=1+ri(5); const b=ri(a+1); mathQ("math",8,3,`${a} − ${b} = ?`, a-b, 2, 1); }
// 9 Phép trừ trong 10
for(let i=0;i<6;i++){ const a=1+ri(10); const b=ri(a+1); mathQ("math",9,3,`${a} − ${b} = ?`, a-b, 2, 1); }
// 10 Số liền trước – liền sau
for(let i=0;i<3;i++){ const n=2+ri(18); mathQ("math",10,3,`Số liền sau của ${n} là?`, n+1, 2, 1); }
for(let i=0;i<3;i++){ const n=2+ri(18); mathQ("math",10,3,`Số liền trước của ${n} là?`, n-1, 2, 1); }
// 11 Đếm số 11–20
for(let i=0;i<5;i++){ const n=11+ri(10); mathQ("math",11,3,`Số gồm 1 chục và ${n-10} đơn vị là?`, n, 2, 2); }
// 12 Hình tròn – vuông – tam giác
add("math",12,3,"Hình có 3 cạnh là hình gì?",["Hình tròn","Hình tam giác","Hình vuông"],1,1,null);
add("math",12,3,"Hình có 4 cạnh bằng nhau là?",["Hình vuông","Hình tròn","Tam giác"],0,1,null);
add("math",12,3,"Hình không có góc, không có cạnh là?",["Hình vuông","Tam giác","Hình tròn"],2,1,null);
add("math",12,3,"Bánh xe có dạng hình gì?",["Tròn","Vuông","Tam giác"],0,1,null);
add("math",12,3,"Hình vuông có mấy cạnh?",["3","4","5"],1,1,null);
// 13 Dài hơn – ngắn hơn
add("math",13,3,"Bút chì 15cm và bút mực 12cm — cái nào dài hơn?",["Bút chì","Bút mực","Bằng nhau"],0,1,null);
add("math",13,3,"Đoạn A dài 8cm, đoạn B dài 8cm — so sánh?",["A dài hơn","Bằng nhau","B dài hơn"],1,1,null);
add("math",13,3,"Con rắn 2m và cái thước 1m — cái nào ngắn hơn?",["Con rắn","Cái thước","Bằng nhau"],1,1,null);
// 14 Cao hơn – thấp hơn
add("math",14,3,"Cây cao 3m, nhà cao 5m — cái nào cao hơn?",["Cây","Nhà","Bằng nhau"],1,1,null);
add("math",14,3,"Bạn An 120cm, bạn Bo 115cm — ai thấp hơn?",["An","Bo","Bằng nhau"],1,1,null);
add("math",14,3,"Núi và đồi — thường cái nào cao hơn?",["Đồi","Núi","Bằng nhau"],1,1,null);
// 15 Nặng hơn – nhẹ hơn
add("math",15,3,"1kg sắt và 1kg bông — cái nào nặng hơn?",["Sắt","Bông","Bằng nhau"],2,2,null);
add("math",15,3,"Con voi và con mèo — con nào nặng hơn?",["Voi","Mèo","Bằng nhau"],0,1,null);
add("math",15,3,"Túi 5kg gạo và túi 3kg gạo — túi nào nhẹ hơn?",["5kg","3kg","Bằng nhau"],1,1,null);
// 16 Xem giờ đúng
add("math",16,3,"Kim giờ chỉ 8, kim phút chỉ 12 — mấy giờ?",["8 giờ","12 giờ","20 giờ"],0,1,null);
add("math",16,3,"7 giờ tối còn gọi là mấy giờ?",["17 giờ","19 giờ","21 giờ"],1,2,null);
add("math",16,3,"Kim phút chỉ số 6 nghĩa là?",["Đúng giờ","30 phút","15 phút"],1,2,null);
add("math",16,3,"Một giờ có bao nhiêu phút?",["30","60","100"],1,1,60);
// 17 Thứ tự trong tuần
add("math",17,3,"Ngày sau Thứ Hai là?",["Chủ Nhật","Thứ Ba","Thứ Tư"],1,1,null);
add("math",17,3,"Ngày trước Thứ Sáu là?",["Thứ Năm","Thứ Bảy","Thứ Tư"],0,1,null);
add("math",17,3,"Hai ngày cuối tuần là?",["Thứ Hai, Ba","Thứ Bảy, Chủ Nhật","Thứ Năm, Sáu"],1,1,null);
add("math",17,3,"Một tuần có mấy ngày?",["5","6","7"],2,1,7);
// 18 Cộng có nhớ
for(let i=0;i<6;i++){ const a=5+ri(45), b=5+ri(45); mathQ("math",18,3,`${a} + ${b} = ?`, a+b, 4, 2); }
// 19 Trừ có nhớ
for(let i=0;i<6;i++){ const a=30+ri(60); const b=5+ri(a-5); mathQ("math",19,3,`${a} − ${b} = ?`, a-b, 4, 2); }
// 20 Ôn tập tổng hợp
mathQ("math",20,3,"12 + 9 = ?", 21, 3, 2);
mathQ("math",20,3,"20 − 7 = ?", 13, 3, 2);
mathQ("math",20,3,"6 × 3 = ?", 18, 4, 2);
add("math",20,3,"Hình vuông có mấy cạnh?",["3","4","5"],1,1,null);
add("math",20,3,"Một tuần có mấy ngày?",["5","6","7"],2,1,null);
mathQ("math",20,3,"Số liền sau của 19 là?", 20, 2, 1);

/* ===================================================================
   TIẾNG ANH — 20 chặng
   =================================================================== */
const E = {
 1:[["'Hello' nghĩa là?",["Xin chào","Tạm biệt","Cảm ơn"],0],["'Goodbye' nghĩa là?",["Xin chào","Tạm biệt","Xin lỗi"],1],["Gặp nhau buổi sáng chào?",["Good morning","Good night","Goodbye"],0],["Trước khi đi ngủ chào?",["Good morning","Good night","Hello"],1]],
 2:[["Chữ cái đầu bảng chữ cái là?",["A","B","C"],0],["Chữ nào đứng sau B?",["A","C","D"],1],["'Apple' bắt đầu bằng chữ?",["A","E","O"],0],["Chữ nào là nguyên âm?",["B","A","C"],1]],
 3:[["Chữ nào đứng sau H?",["I","G","K"],0],["'Lion' bắt đầu bằng chữ?",["L","N","M"],0],["Chữ nào đứng giữa K và M?",["J","L","N"],1],["'Monkey' bắt đầu bằng?",["N","M","H"],1]],
 4:[["Chữ nào đứng sau O?",["P","N","R"],0],["'Sun' bắt đầu bằng chữ?",["S","T","U"],0],["Chữ nào là nguyên âm?",["P","U","T"],1],["Chữ nào đứng trước U?",["T","S","R"],0]],
 5:[["Chữ cuối bảng chữ cái là?",["X","Y","Z"],2],["'Zoo' bắt đầu bằng chữ?",["Z","Y","X"],0],["Chữ nào đứng sau V?",["W","U","Y"],0],["'Yellow' bắt đầu bằng?",["Y","Z","W"],0]],
 6:[["'One' là số?",["1","2","3"],0],["'Three' là số?",["2","3","4"],1],["Số 5 tiếng Anh là?",["four","five","six"],1],["'Two' là số?",["1","2","3"],1]],
 7:[["'Seven' là số?",["6","7","8"],1],["Số 10 tiếng Anh là?",["ten","nine","eight"],0],["'Six' là số?",["5","6","7"],1],["'Nine' là số?",["8","9","10"],1]],
 8:[["'Red' là màu?",["Đỏ","Xanh","Vàng"],0],["'Blue' là màu?",["Xanh dương","Đỏ","Đen"],0],["Màu vàng tiếng Anh?",["green","yellow","black"],1],["'Green' là màu?",["Xanh lá","Tím","Trắng"],0]],
 9:[["'Dog' nghĩa là?",["Con chó","Con mèo","Con cá"],0],["'Cat' nghĩa là?",["Con mèo","Con chó","Con chim"],0],["'Bird' nghĩa là?",["Con chim","Con cá","Con voi"],0],["'Fish' nghĩa là?",["Con cá","Con ếch","Con rùa"],0]],
 10:[["'Apple' nghĩa là?",["Quả táo","Quả cam","Quả chuối"],0],["'Banana' nghĩa là?",["Chuối","Cam","Nho"],0],["'Orange' nghĩa là?",["Cam","Táo","Dứa"],0],["'Grape' nghĩa là?",["Nho","Dưa","Xoài"],0]],
 11:[["'Mother' nghĩa là?",["Mẹ","Bố","Anh"],0],["'Father' nghĩa là?",["Mẹ","Bố","Em"],1],["'Sister' nghĩa là?",["Chị/em gái","Anh trai","Ông"],0],["'Brother' nghĩa là?",["Chị gái","Anh/em trai","Bà"],1]],
 12:[["'Hand' nghĩa là?",["Bàn tay","Bàn chân","Đầu"],0],["'Head' nghĩa là?",["Đầu","Tai","Mũi"],0],["'Eye' nghĩa là?",["Mắt","Tai","Tay"],0],["'Nose' nghĩa là?",["Mũi","Miệng","Tai"],0]],
 13:[["'This' dùng cho vật ở?",["Gần","Xa","Số nhiều"],0],["'That' dùng cho vật ở?",["Gần","Xa","Không có"],1],["'This is a pen.' nghĩa là?",["Đây là cái bút","Kia là cái bút","Đó là sách"],0],["Chỉ vật ở xa dùng từ?",["This","That","Here"],1]],
 14:[["'I like cats.' nghĩa là?",["Tôi thích mèo","Tôi có mèo","Tôi thấy mèo"],0],["'like' nghĩa là?",["Thích","Ghét","Có"],0],["'I like milk.' — milk là?",["Sữa","Nước","Bánh"],0],["Nói 'Tôi thích táo':",["I like apples","I have apples","I see apples"],0]],
 15:[["'Monday' là thứ?",["Thứ Hai","Chủ Nhật","Thứ Sáu"],0],["'Sunday' là ngày?",["Chủ Nhật","Thứ Bảy","Thứ Hai"],0],["'Friday' là thứ?",["Thứ Năm","Thứ Sáu","Thứ Bảy"],1],["Một tuần tiếng Anh có mấy ngày?",["5","6","7"],2]],
 16:[["'Sunny' là thời tiết?",["Nắng","Mưa","Tuyết"],0],["'Rainy' là thời tiết?",["Mưa","Nắng","Gió"],0],["'Hot' nghĩa là?",["Nóng","Lạnh","Mát"],0],["'Cold' nghĩa là?",["Lạnh","Nóng","Ấm"],0]],
 17:[["'Ball' nghĩa là?",["Quả bóng","Búp bê","Ô tô"],0],["'Doll' nghĩa là?",["Búp bê","Gấu","Diều"],0],["'Car' (đồ chơi) nghĩa là?",["Ô tô","Tàu","Máy bay"],0],["'Kite' nghĩa là?",["Con diều","Quả bóng","Robot"],0]],
 18:[["'Rice' nghĩa là?",["Cơm","Bánh mì","Thịt"],0],["'Milk' nghĩa là?",["Sữa","Nước","Trà"],0],["'Bread' nghĩa là?",["Bánh mì","Cơm","Mì"],0],["'Egg' nghĩa là?",["Trứng","Cá","Rau"],0]],
 19:[["'I am a student.' nghĩa là?",["Tôi là học sinh","Tôi là cô giáo","Tôi có sách"],0],["'She is happy.' nghĩa là?",["Cô ấy vui","Cô ấy buồn","Cô ấy mệt"],0],["Điền: 'I ___ seven.' (Tôi 7 tuổi)",["am","is","are"],0],["'It is a dog.' nghĩa là?",["Nó là con chó","Nó là con mèo","Đây là chó"],0]],
 20:[["'Thank you' nghĩa là?",["Cảm ơn","Xin lỗi","Tạm biệt"],0],["Số 8 tiếng Anh là?",["eight","nine","seven"],0],["'Blue' là màu?",["Xanh dương","Đỏ","Vàng"],0],["'Cat' nghĩa là?",["Con mèo","Con chó","Con cá"],0],["'Mother' nghĩa là?",["Mẹ","Bố","Chị"],0]]
};
for(const [ord, arr] of Object.entries(E)) arr.forEach(([q,opts,ans],i)=> add("eng", +ord, 3, q, opts, ans, (i%3)+1, null));

/* ===================================================================
   TIẾNG VIỆT — 20 chặng
   =================================================================== */
const V = {
 1:[["Bảng chữ cái tiếng Việt bắt đầu bằng chữ?",["a","b","o"],0],["Chữ nào đứng sau chữ 'a'?",["ă","o","m"],0],["Chữ cái đầu tiên là?",["a","ê","i"],0],["Có bao nhiêu chữ cái cơ bản được học đầu tiên trong nhóm nguyên âm 'a'?",["a, ă, â","b, c, d","m, n, p"],0]],
 2:[["Chữ nào là nguyên âm?",["a","b","c"],0],["Nhóm nguyên âm nào đúng?",["a, ă, â","b, c, d","h, k, l"],0],["'ă' là loại chữ?",["Nguyên âm","Phụ âm","Dấu"],0],["Từ 'ba' có nguyên âm nào?",["a","o","e"],0]],
 3:[["Chữ nào là phụ âm?",["b","a","o"],0],["'bò' bắt đầu bằng phụ âm?",["b","c","d"],0],["'cá' bắt đầu bằng phụ âm?",["b","c","d"],1],["'dê' bắt đầu bằng phụ âm?",["b","c","d"],2]],
 4:[["'đá' bắt đầu bằng chữ?",["đ","d","g"],0],["'gà' bắt đầu bằng phụ âm?",["đ","g","h"],1],["'hoa' bắt đầu bằng phụ âm?",["g","h","đ"],1],["Chữ 'đ' khác chữ 'd' ở?",["Có gạch ngang","Giống hệt","Có dấu"],0]],
 5:[["Ghép 'b' với 'a' được?",["ba","bo","be"],0],["'bà' gồm 'ba' và dấu?",["huyền","sắc","hỏi"],0],["Ghép 'm' với 'e' được?",["me","ma","mo"],0],["Tiếng 'cá' gồm 'ca' và dấu?",["sắc","huyền","nặng"],0]],
 6:[["Dấu sắc trong 'má' là dấu?",["/","\\","~"],0],["'bà' mang dấu gì?",["sắc","huyền","ngã"],1],["Thêm dấu sắc vào 'ma' được?",["má","mà","mả"],0],["Thêm dấu huyền vào 'ba' được?",["bá","bà","bả"],1]],
 7:[["'mã' mang dấu gì?",["hỏi","ngã","nặng"],1],["'mạ' mang dấu gì?",["hỏi","ngã","nặng"],2],["'mả' mang dấu gì?",["hỏi","ngã","nặng"],0],["Thêm dấu nặng vào 'ca' được?",["cạ","cả","cã"],0]],
 8:[["'bàn' chứa vần?",["an","ăn","ân"],0],["'chăn' chứa vần?",["an","ăn","ân"],1],["'sân' chứa vần?",["an","ăn","ân"],2],["Vần 'an' có trong từ nào?",["bàn","chân","chăn"],0]],
 9:[["'con' chứa vần?",["on","ôn","ơn"],0],["'chồn' chứa vần?",["on","ôn","ơn"],1],["'sơn' chứa vần?",["on","ôn","ơn"],2],["Vần 'ôn' có trong từ?",["con","chồn","sơn"],1]],
 10:[["'hoa' chứa vần?",["oa","oe","oi"],0],["'khoe' chứa vần?",["oa","oe","oi"],1],["Vần 'oa' có trong từ?",["hoa","khoe","hoi"],0],["'xòe' chứa vần?",["oa","oe"," oi"],1]],
 11:[["Từ nào chỉ con vật?",["con mèo","cái bàn","màu đỏ"],0],["'quả cam' là từ chỉ?",["đồ vật/trái cây","hoạt động","màu sắc"],0],["Đọc từ: 'b-a = ?'",["ba","bà","bá"],0],["Từ nào có nghĩa?",["mẹ","xzy","qpr"],0]],
 12:[["Câu nào đúng?",["Bé đi học.","Đi bé học.","Học bé đi."],0],["Cuối câu kể đặt dấu gì?",["dấu chấm","dấu phẩy","dấu hỏi"],0],["'Mẹ nấu cơm.' có mấy tiếng?",["2","3","4"],1],["Đọc câu: 'Gà gáy.' nói về?",["con gà","con mèo","cái bàn"],0]],
 13:[["Chữ thường của 'A' là?",["a","ă","â"],0],["Chữ 'b' là chữ?",["thường","hoa","số"],0],["Viết chữ thường của 'M'?",["m","n","w"],0],["Chữ nào viết thường?",["h","H","B"],0]],
 14:[["Chữ hoa của 'a' là?",["A","Ă","Â"],0],["Đầu câu phải viết chữ?",["hoa","thường","số"],0],["Tên riêng 'lan' viết đúng là?",["Lan","lan","LAN"],0],["Chữ nào viết hoa?",["B","b","m"],0]],
 15:[["Từ chỉ sự vật là?",["cái ghế","chạy","đỏ"],0],["Từ nào chỉ đồ vật?",["quyển sách","nhảy","xanh"],0],["'con chó' chỉ?",["sự vật","hoạt động","tính chất"],0],["Từ nào KHÔNG chỉ sự vật?",["bàn","ghế","hát"],2]],
 16:[["Từ chỉ hoạt động là?",["chạy","cái bàn","màu đỏ"],0],["Từ nào chỉ hoạt động?",["đọc","sách","xanh"],0],["'nhảy' là từ chỉ?",["hoạt động","sự vật","màu sắc"],0],["Từ nào KHÔNG chỉ hoạt động?",["ăn","ngủ","bàn"],2]],
 17:[["Từ chỉ màu sắc là?",["đỏ","chạy","bàn"],0],["Từ nào chỉ màu sắc?",["xanh","ăn","ghế"],0],["'vàng' là từ chỉ?",["màu sắc","hoạt động","sự vật"],0],["Từ nào KHÔNG chỉ màu sắc?",["đỏ","tím","chạy"],2]],
 18:[["Câu nào hoàn chỉnh?",["Em bé ngủ.","Em bé","Ngủ"],0],["Sắp thành câu đúng: 'học / Em / bài'",["Em học bài.","Học bài Em.","Bài Em học."],0],["Câu hỏi kết thúc bằng dấu?",["chấm hỏi","chấm","phẩy"],0],["'Bé ăn cơm' thiếu dấu gì cuối câu?",["dấu chấm","dấu phẩy","không thiếu"],0]],
 19:[["Kể chuyện theo tranh cần nói theo thứ tự?",["trước - sau","lộn xộn","ngược"],0],["Mở đầu chuyện thường là?",["Ngày xửa ngày xưa","Hết","Vì vậy"],0],["Nhân vật trong 'Rùa và Thỏ' là?",["Rùa và Thỏ","Mèo và Chó","Gà và Vịt"],0],["Thỏ thua Rùa vì?",["ngủ quên","chạy nhanh","bị ngã"],0]],
 20:[["Từ nào chỉ sự vật?",["cái bàn","chạy","đỏ"],0],["'bà' mang dấu gì?",["huyền","sắc","hỏi"],0],["Đầu câu viết chữ?",["hoa","thường","số"],0],["Từ nào chỉ hoạt động?",["hát","ghế","xanh"],0],["Chữ nào là nguyên âm?",["a","b","c"],0]]
};
for(const [ord, arr] of Object.entries(V)) arr.forEach(([q,opts,ans],i)=> add("viet", +ord, 3, q, opts, ans, (i%3)+1, null));

/* ===================================================================
   CÂU HỎI GAME "NHÀ THÔNG THÁI" — scale theo lớp 1,2,4,5 (topic_order=null)
   =================================================================== */
// Toán theo lớp (tự tính)
function mathByGrade(g, n){
  for(let i=0;i<n;i++){
    let a,b,op,res;
    if(g===1){ a=1+ri(9); b=ri(10-a+1); if(ri(2)&&a>=b){op="−";res=a-b;}else{op="+";res=a+b;} }
    else if(g===2){ if(ri(2)){a=10+ri(80);b=1+ri(a-1); if(ri(2)){op="+";res=a+b;}else{op="−";res=a-b;}} else {a=2+ri(4);b=2+ri(4);op="×";res=a*b;} }
    else if(g===4){ if(ri(2)){a=2+ri(10);b=2+ri(9);op="×";res=a*b;} else {b=2+ri(8);res=1+ri(9);a=b*res;op="÷";} }
    else { if(ri(2)){a=11+ri(40);b=2+ri(10);op="×";res=a*b;} else {b=2+ri(9);res=2+ri(20);a=b*res;op="÷";} }
    mathQ("math", null, g, `${a} ${op} ${b} = ?`, res, res>40?8:3, g<=2?1:2);
  }
}
mathByGrade(1,8); mathByGrade(2,8); mathByGrade(4,8); mathByGrade(5,8);
// Tiếng Anh / Tiếng Việt theo lớp (vài câu để game lớp khác có nội dung)
add("eng",null,2,'"Hello" nghĩa là?',["Xin chào","Tạm biệt","Cảm ơn"],0,1,null);
add("eng",null,2,'"Cat" nghĩa là?',["Con mèo","Con chó","Con cá"],0,1,null);
add("eng",null,4,'"Beautiful" nghĩa là?',["Xấu","Đẹp","Nhanh"],1,2,null);
add("eng",null,4,'Quá khứ của "go"?',["goed","went","gone"],1,2,null);
add("eng",null,5,'"Although" gần nghĩa với?',["Mặc dù","Bởi vì","Nếu"],0,2,null);
add("eng",null,5,'Số nhiều của "child"?',["childs","children","childes"],1,2,null);
add("viet",null,2,"Từ nào chỉ sự vật?",["cái bàn","chạy","đỏ"],0,1,null);
add("viet",null,4,"Từ nào là động từ?",["chạy","đẹp","bàn"],0,2,null);
add("viet",null,5,"Từ nào là quan hệ từ?",["và","chạy","đỏ"],0,2,null);

/* ===================================================================
   KIỂM TRA
   =================================================================== */
const errs=[];
R.forEach((x,i)=>{
  const tag=`#${i+1} [${x.subject}/t${x.topicOrder}] ${x.q}`;
  if(!Array.isArray(x.opts)||x.opts.length!==3) errs.push(tag+" — cần 3 lựa chọn");
  if(new Set(x.opts.map(s=>String(s).trim())).size!==3) errs.push(tag+" — lựa chọn trùng");
  if(!(x.ans>=0&&x.ans<=2)) errs.push(tag+" — ans ngoài 0..2");
  if(x.check!=null && parseFloat(String(x.opts[x.ans]).replace(/[^\d.\-]/g,""))!==x.check) errs.push(tag+` — đáp án ${x.opts[x.ans]} ≠ ${x.check}`);
  if(![1,2,3,4].includes(x.diff)) errs.push(tag+" — difficulty lạ");
});
if(errs.length){ console.error("❌ LỖI ("+errs.length+"):\n"+errs.slice(0,40).join("\n")); process.exit(1); }

/* ===================================================================
   XUẤT SQL (gắn topic_id qua subselect theo order_index)
   =================================================================== */
function esc(s){ return String(s).replace(/'/g,"''"); }
const rows = R.map(x=>{
  const opts = esc(JSON.stringify(x.opts));
  const topic = x.topicOrder==null ? "null"
    : `(select id from topics where subject_code='${x.subject}' and order_index=${x.topicOrder})`;
  const diff = Math.min(3, x.diff); // question_bank.difficulty giữ 1..3
  return `  ('${x.subject}',${x.grade},'mcq','${esc(x.q)}','${opts}'::jsonb,${x.ans},${diff},true,${topic})`;
});
const sql =
`-- Ngân hàng câu hỏi topic-linked (3 môn) + câu game theo lớp. Tổng: ${R.length} câu.
-- Xóa câu cũ của 3 môn này để nạp lại sạch (tránh trùng khi chạy nhiều lần):
delete from question_bank where subject_code in ('math','viet','eng');
insert into question_bank (subject_code,grade,type,question,options,answer_index,difficulty,active,topic_id) values
${rows.join(",\n")};
`;
fs.writeFileSync(__dirname + "/seed-topics-full.sql", sql);

const stat={};
R.forEach(x=>{ const k=x.subject+(x.topicOrder==null?"(game)":"(bài)"); stat[k]=(stat[k]||0)+1; });
console.log("✅ Hợp lệ. Tổng:", R.length);
console.log("Phân bố:", JSON.stringify(stat,null,0));
console.log("Đã ghi: supabase/seed-topics-full.sql");
