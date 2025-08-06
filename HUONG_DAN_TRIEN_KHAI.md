# 🚀 Hướng Dẫn Triển Khai Hệ Thống Quản Lý Kho

## 📋 Tổng Quan Hệ Thống

Hệ thống này sử dụng mô hình **mini-fullstack** với:
- **Frontend**: Trang web HTML/CSS/JavaScript
- **Backend**: Google Apps Script (API)
- **Database**: Google Sheets

## 🛠️ Bước 1: Chuẩn Bị Google Sheets

### 1.1 Cấu trúc Google Sheets hiện tại
Dựa trên screenshot của bạn, Google Sheets đã có các sheet:
- `DANH MUC SAN PHAM` - Danh mục sản phẩm
- `NHẬP` - Lịch sử nhập hàng  
- `BÁN` - Lịch sử bán hàng
- `TỔNG HÀNG` - Tổng hợp kho
- `DANH SACH BARCODE` - Danh sách mã vạch

### 1.2 Cập nhật cấu trúc sheet DANH MUC SAN PHAM
Đảm bảo sheet có cấu trúc:
```
A1: Tên Sản phẩm
B1: Mã Sản Phẩm
```

Ví dụ dữ liệu:
```
A2: MÀI DAO
B2: MD-01

A3: VÒI PHUN SƯƠNG  
B3: VP-01

A4: KẸP INOX
B4: KI-01
```

### 1.3 Tạo sheet DANH SACH BARCODE (nếu chưa có)
Sheet này sẽ được tạo tự động bởi Google Apps Script với cấu trúc:
```
A1: Mã Vạch
B1: Mã Sản Phẩm  
C1: Tên Sản Phẩm
D1: Ngày Nhập
```

## 🔧 Bước 2: Tạo Google Apps Script

### 2.1 Truy cập Google Apps Script
1. Mở [script.google.com](https://script.google.com)
2. Đăng nhập bằng tài khoản Google của bạn
3. Click "New project"

### 2.2 Cấu hình project
1. Đổi tên project thành "Hệ Thống Quản Lý Kho"
2. Xóa code mặc định trong editor
3. Copy toàn bộ nội dung từ file `google-apps-script.js` vào editor

### 2.3 Cập nhật SPREADSHEET_ID
1. Mở Google Sheets của bạn
2. Copy ID từ URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Thay thế `YOUR_SPREADSHEET_ID_HERE` trong code bằng ID thực

### 2.4 Lưu và chạy setup
1. Click "Save" (Ctrl+S)
2. Chạy hàm `setupInitialStructure()` để tạo cấu trúc ban đầu
3. Chạy hàm `testConnection()` để kiểm tra kết nối

## 🌐 Bước 3: Deploy Web App

### 3.1 Deploy
1. Click "Deploy" > "New deployment"
2. Chọn "Web app"
3. Cấu hình:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click "Deploy"
5. Copy URL Web App được tạo ra

### 3.2 Cấp quyền
1. Click "Authorize access"
2. Chọn tài khoản Google
3. Click "Advanced" > "Go to [Project Name] (unsafe)"
4. Click "Allow"

## 💻 Bước 4: Cấu hình Frontend

### 4.1 Cập nhật URL trong index.html
1. Mở file `index.html`
2. Tìm dòng: `const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';`
3. Thay thế bằng URL Web App từ bước 3.1

### 4.2 Test hệ thống
1. Mở file `index.html` trong trình duyệt
2. Kiểm tra kết nối với Google Sheets
3. Thử chọn sản phẩm và nhập hàng

## 📱 Bước 5: Sử Dụng Hệ Thống

### 5.1 Quy trình nhập hàng
1. **Chọn sản phẩm**: Từ dropdown (dữ liệu lấy từ sheet DANH MUC SAN PHAM)
2. **Nhập số lượng**: Số thùng cần nhập
3. **Nhấn nút**: "Nhập Hàng & Tạo Mã Vạch"
4. **Hệ thống tự động**:
   - Ghi vào sheet NHẬP
   - Tạo mã vạch mới
   - Ghi vào sheet DANH SACH BARCODE
5. **In mã vạch**: Hệ thống hỏi có muốn in không

### 5.2 Logic tạo mã vạch
- **Format**: `[Mã SP]-[Số thứ tự 3 chữ số]`
- **Ví dụ**: MD-01-001, MD-01-002, MD-01-003...
- **Tự động tăng**: Tìm số lớn nhất hiện tại và tăng dần

## 🔍 Bước 6: Kiểm Tra và Debug

### 6.1 Kiểm tra logs
1. Mở Google Apps Script
2. Click "Executions" để xem logs
3. Kiểm tra lỗi nếu có

### 6.2 Test các chức năng
1. **GET /getProducts**: Lấy danh sách sản phẩm
2. **POST /importProducts**: Nhập hàng và tạo mã vạch
3. **In mã vạch**: Tạo PDF để in

### 6.3 Xử lý lỗi thường gặp
- **Lỗi CORS**: Đã được xử lý trong code
- **Lỗi quyền truy cập**: Kiểm tra quyền Google Sheets
- **Lỗi sheet không tồn tại**: Chạy `setupInitialStructure()`

## 📊 Bước 7: Tùy Chỉnh và Mở Rộng

### 7.1 Tùy chỉnh giao diện
- Chỉnh sửa CSS trong `index.html`
- Thay đổi màu sắc, font chữ
- Thêm logo công ty

### 7.2 Thêm tính năng
- **Quét mã vạch**: Tích hợp camera
- **Báo cáo**: Thống kê nhập/xuất
- **Cảnh báo**: Hết hàng, quá hạn
- **Export**: Xuất dữ liệu ra Excel

### 7.3 Tối ưu hiệu suất
- **Cache**: Lưu danh sách sản phẩm
- **Batch**: Xử lý nhiều sản phẩm cùng lúc
- **Validation**: Kiểm tra dữ liệu đầu vào

## 🚨 Lưu Ý Quan Trọng

### Bảo mật
- URL Web App có thể truy cập công khai
- Không lưu thông tin nhạy cảm
- Backup dữ liệu thường xuyên

### Giới hạn Google Apps Script
- **Quota**: 20,000 requests/ngày
- **Execution time**: 6 phút/request
- **File size**: 50MB/project

### Backup và khôi phục
- Export Google Apps Script code
- Backup Google Sheets
- Lưu URL Web App

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Google Apps Script
2. Xem console trong trình duyệt (F12)
3. Kiểm tra quyền truy cập Google Sheets
4. Test từng bước theo hướng dẫn

## 🎉 Hoàn Thành

Sau khi hoàn thành tất cả bước, bạn sẽ có:
- ✅ Hệ thống quản lý kho hoạt động
- ✅ Tự động tạo mã vạch
- ✅ Giao diện web đẹp mắt
- ✅ Tích hợp với Google Sheets
- ✅ Khả năng in mã vạch

**Chúc bạn triển khai thành công! 🚀** 