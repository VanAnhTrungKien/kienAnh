# Thiệp cưới · Lê Thị Vân Anh & Nguyễn Trung Kiên

Thiệp cưới online dạng static (HTML/CSS/JS), thiết kế theo mẫu **Minimalism Xanh**.

## Xem thiệp

- Mở trực tiếp `index.html` bằng trình duyệt.
- Hoặc chạy local server:

```bash
python -m http.server 4173
```

Mở `http://localhost:4173`.

- Mở thẳng vào thiệp (bỏ qua bìa): `index.html?open=1`

## Tạo link mời riêng

Mở `tao-thiep.html` để nhập tên khách/cặp đôi và tạo link gửi riêng. Link có dạng `index.html?guest=...`; tên sẽ hiện ở dòng “Thân mời” trên bìa thiệp.

- Local: `http://localhost:4173/tao-thiep.html`
- Online: `https://vananhtrungkien.github.io/kienAnh/tao-thiep.html`

## Nhận xác nhận tham dự bằng Google Sheet

GitHub Pages chỉ host file tĩnh, nên phần nhận RSVP dùng Google Apps Script làm backend miễn phí.

1. Tạo một Google Sheet mới.
2. Vào **Extensions → Apps Script**, dán nội dung `google-apps-script/Code.gs` vào `Code.gs`, bấm **Save**.
3. Chạy hàm `setup()` một lần và cấp quyền cho Google.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy **Web app URL**.
5. Dán URL vào `assets/js/config.js`:

```js
window.WEDDING_ENDPOINTS = {
  rsvp: "https://script.google.com/macros/s/.../exec",
  guestbook: "https://script.google.com/macros/s/.../exec"
};
```

Sau khi gửi thử, Google Sheet sẽ có các tab `RSVP`, `Wishes` và `Tổng hợp`. Tab `Tổng hợp` hiển thị tổng phản hồi, tổng số người tham dự và số lời chúc.

## Nội dung

- **Lễ vu quy:** 07:00, Chủ Nhật ngày 06/12/2026 (tức 28/10 năm Bính Ngọ), tại tư gia nhà gái — Xóm 2, thôn Thượng, xã Phật Tích, tỉnh Bắc Ninh.
- **Bữa cơm thân mật:** 16:30, Thứ Bảy ngày 05/12/2026 (tức 27/10 năm Bính Ngọ), tại tư gia nhà gái.

## Cấu trúc

```text
index.html
assets/
  css/style.css
  js/main.js
  js/photos.js
  fonts/
  img/
```

## Ghi chú

- Ảnh cưới đã được tối ưu WebP; toàn bộ ảnh nằm trong `assets/img/`.
- Album carousel hiển thị đủ 36 ảnh trong `assets/img` (đã bỏ các ảnh ghép), sắp xếp ảnh vest/váy cưới trước, ảnh quần áo thường sau. Chạm vào ảnh ở giữa để xem lớn.
- Sổ lưu bút và xác nhận tham dự đang lưu trên thiết bị của khách (localStorage).
- Hộp quà mừng sẽ hiển thị khi điền thông tin ngân hàng trong `assets/js/main.js`.
