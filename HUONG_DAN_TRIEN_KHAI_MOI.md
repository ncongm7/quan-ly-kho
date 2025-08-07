# 🚀 Hướng Dẫn Triển Khai Hệ Thống Bán Hàng

## 📋 Tóm Tắt Hệ Thống

Hệ thống hoạt động theo luồng:
1. **User quét mã vạch** → HTML gửi POST request đến Web App
2. **Web App tìm sản phẩm** trong sheet "DANH SACH BARCODE"
3. **Nếu tìm thấy và còn trong kho** → thêm vào sheet "BÁN"
4. **Trả về response JSON** cho HTML
5. **HTML hiển thị thông báo** thành công/thất bại

## 🔧 Bước 1: Deploy Google Apps Script

### 1.1. Mở Google Apps Script
- Truy cập: https://script.google.com/
- Mở project hiện tại hoặc tạo mới

### 1.2. Copy Code Mới
- Xóa toàn bộ code cũ
- Copy code từ file `google-apps-scripts-ban-hang.js` vào editor

### 1.3. Deploy Web App
1. Click **Deploy** → **New deployment**
2. Chọn **Web app**
3. Cài đặt:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy URL mới** (sẽ khác URL cũ)

### 1.4. Cập Nhật URL
- Mở file `banhang.html`
- Thay thế URL cũ bằng URL mới trong tất cả các `fetch()`
- Mở file `test-webapp.html`
- Cập nhật `WEB_APP_URL`

## 🧪 Bước 2: Test Hệ Thống

### 2.1. Test Cơ Bản
1. Mở file `test-webapp.html` trong trình duyệt
2. Click **Test doGet** - Kiểm tra Web App hoạt động
3. Click **Test doPost** - Test bán sản phẩm với response JSON
4. Click **Lấy danh sách sản phẩm** - Test API

### 2.2. Test Thực Tế
1. Mở file `banhang.html`
2. Thử quét mã vạch hoặc nhập mã thủ công
3. Kiểm tra:
   - Thông báo hiển thị đúng không?
   - Google Sheet có dữ liệu mới không?
   - Trạng thái sản phẩm có cập nhật không?

## 📊 Bước 3: Kiểm Tra Logs

### 3.1. Xem Logs trong Google Apps Script
1. Mở Google Apps Script
2. Menu **Executions** (bên trái)
3. Xem logs của các lần chạy gần đây

### 3.2. Kiểm Tra Console Browser
1. Mở Developer Tools (F12)
2. Tab **Console**
3. Xem logs khi test

## 🔍 Bước 4: Xử Lý Lỗi

### Lỗi Thường Gặp:

#### ❌ CORS Error
- **Nguyên nhân**: Web App chưa được deploy đúng cách
- **Giải pháp**: Kiểm tra lại deployment và URL

#### ❌ "Không tìm thấy sheet"
- Kiểm tra tên sheet trong Google Sheet có đúng không
- Đảm bảo có các sheet: "DANH MUC SAN PHAM", "NHẬP", "BÁN", "DANH SACH BARCODE"

#### ❌ "Mã vạch không hợp lệ"
- Kiểm tra mã vạch có trong sheet "DANH SACH BARCODE" không
- Đảm bảo trạng thái là "Trong Kho"

#### ❌ "Lỗi kết nối server"
- Kiểm tra URL Web App có đúng không
- Kiểm tra internet connection

## 📝 Cấu Trúc Dữ Liệu

### Sheet "DANH SACH BARCODE"
- Cột A: Mã vạch
- Cột C: Tên sản phẩm  
- Cột E: Trạng thái ("Trong Kho" / "Đã Bán")

### Sheet "BÁN"
- Cột A: Ngày bán
- Cột B: Tên sản phẩm
- Cột C: Số lượng
- Cột D: Ghi chú

## 🔄 Luồng Hoạt Động

### 1. Quét Mã Vạch
```
User quét mã vạch → HTML gửi POST request → Web App xử lý → Trả về JSON → HTML hiển thị kết quả
```

### 2. Response JSON
```json
// Thành công
{
  "success": true,
  "message": "Đã bán sản phẩm thành công",
  "product": "Tên sản phẩm",
  "barcode": "123456789"
}

// Thất bại
{
  "success": false,
  "message": "Không tìm thấy sản phẩm hoặc sản phẩm không còn trong kho"
}
```

## ✅ Checklist Hoàn Thành

- [ ] Deploy Google Apps Script thành công
- [ ] Cập nhật URL trong HTML files
- [ ] Test doGet hoạt động
- [ ] Test doPost hoạt động với response JSON
- [ ] Test quét mã vạch thành công
- [ ] Test nhập mã thủ công thành công
- [ ] Kiểm tra thông báo hiển thị đúng
- [ ] Kiểm tra dữ liệu trong Google Sheet
- [ ] Kiểm tra cập nhật trạng thái sản phẩm

## 🎯 Kết Quả Mong Đợi

Sau khi hoàn thành, hệ thống sẽ:
- ✅ Quét mã vạch và bán sản phẩm tự động
- ✅ Hiển thị thông báo chính xác (thành công/thất bại)
- ✅ Cập nhật trạng thái từ "Trong Kho" → "Đã Bán"
- ✅ Ghi dữ liệu vào sheet "BÁN" với ngày giờ chính xác
- ✅ Trả về response JSON để HTML xử lý
- ✅ Hoạt động ổn định không bị lỗi CORS

---

**Lưu ý:** Nếu gặp vấn đề, hãy kiểm tra logs trong Google Apps Script và console browser để debug. 