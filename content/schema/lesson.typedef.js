/**
 * Khuôn dữ liệu bài học Bé Học (dùng cho JSDoc / tra cứu trong index.html).
 * Nguồn chuẩn hóa: content/schema/bai-hoc.schema.json
 *
 * @typedef {"trac_nghiem"|"dung_sai"|"dien_khuyet"|"noi_cap"|"sap_xep"|"tu_luan_ngan"} LoaiCau
 *
 * @typedef {Object} LessonQuestion
 * @property {string}   id            - duy nhất trong bài
 * @property {LoaiCau}  loai
 * @property {string}   de            - đề bài
 * @property {string[]} [lua_chon]    - trac_nghiem (2–4) · sap_xep (các phần tử cần xếp)
 * @property {string[]} [trai]        - noi_cap: cột trái
 * @property {string[]} [phai]        - noi_cap: cột phải
 * @property {number|boolean|string|number[]} dap_an
 *   - trac_nghiem: number (chỉ số trong lua_chon, 0-based)
 *   - dung_sai:    boolean (true = Đúng)
 *   - dien_khuyet: string
 *   - noi_cap:     number[] (dap_an[i] = chỉ số trong `phai` khớp với `trai[i]`)
 *   - sap_xep:     number[] (thứ tự đúng là các chỉ số trong `lua_chon`)
 *   - tu_luan_ngan:string (đáp án mẫu, tự đối chiếu — không auto-chấm)
 * @property {string}   [giai_thich]  - ≤ 25 từ
 * @property {1|2|3}    do_kho
 *
 * @typedef {Object} LyThuyet
 * @property {string} tieu_de
 * @property {string} noi_dung
 *
 * @typedef {Object} BaiHoc
 * @property {string}          id        - vd "toan-l3-b01"
 * @property {"toan"|"viet"|"anh"|"tnxh"} mon
 * @property {3}               lop
 * @property {string}          [bo_sach]
 * @property {string}          chuong
 * @property {number}          bai
 * @property {string}          ten_bai
 * @property {string[]}        muc_tieu
 * @property {LyThuyet[]}      ly_thuyet
 * @property {LessonQuestion[]} cau_hoi
 * @property {Object|null}     [phan_thuong]
 */
export {};
