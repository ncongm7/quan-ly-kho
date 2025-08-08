# HƯỚNG DẪN DEPLOY GOOGLE APPS SCRIPT RIÊNG BIỆT

## 📋 Tổng Quan

Sau khi tách riêng các file Google Apps Script, bạn có thể deploy từng chức năng một cách độc lập. Điều này giúp:
- **Quản lý dễ dàng hơn**: Mỗi script chỉ xử lý một chức năng cụ thể
- **Bảo trì đơn giản**: Sửa lỗi hoặc cập nhật không ảnh hưởng đến các chức năng khác
- **Hiệu suất tốt hơn**: Mỗi script nhẹ hơn và load nhanh hơn
- **Bảo mật**: Có thể cấp quyền khác nhau cho từng script

## 📁 Các File Đã Tách Riêng

### 1. `google-apps-script-nhaphang-deploy.js`
- **Chức năng**: Xử lý nhập hàng và quản lý sản phẩm
- **API Endpoints**:
  - `GET /?action=getProducts` - Lấy danh sách sản phẩm
  - `POST /` với `action=importProducts` - Nhập hàng mới
- **Sheets sử dụng**: `DANH MUC SAN PHAM`, `NHẬP`, `DANH SACH BARCODE`

### 2. `google-apps-script-banhang-deploy.js`
- **Chức năng**: Xử lý bán hàng qua mã vạch
- **API Endpoints**:
  - `POST /` với `action=sellBarcode` - Bán sản phẩm theo mã vạch
- **Sheets sử dụng**: `BÁN`, `DANH SACH BARCODE`

### 3. `google-apps-script-dashboard-deploy.js`
- **Chức năng**: Cung cấp dữ liệu cho dashboard
- **API Endpoints**:
  - `POST /` với `action=getDashboardData` - Lấy dữ liệu thống kê
- **Sheets sử dụng**: `NHẬP`, `BÁN`, `DANH SACH BARCODE`

## 🚀 Cách Deploy Từng Script

### Bước 1: Tạo Google Apps Script Project Mới

1. Truy cập [Google Apps Script](https://script.google.com/)
2. Click **"New project"**
3. Đặt tên project (ví dụ: "Kho-Nhap-Hang", "Kho-Ban-Hang", "Kho-Dashboard")

### Bước 2: Copy Code Vào Project

1. Mở file tương ứng trong thư mục dự án
2. Copy toàn bộ nội dung
3. Paste vào file `Code.gs` trong Google Apps Script editor
4. Lưu lại (Ctrl+S)

### Bước 3: Deploy Web App

1. Click **"Deploy"** → **"New deployment"**
2. Chọn **"Web app"**
3. Cấu hình:
   - **Execute as**: `Me` (hoặc tài khoản có quyền truy cập spreadsheet)
   - **Who has access**: `Anyone` (hoặc `Anyone with Google Account` nếu muốn bảo mật hơn)
4. Click **"Deploy"**
5. Copy URL được tạo ra

### Bước 4: Cập Nhật Frontend

Sau khi có URL mới, cập nhật file `assets/js/common.js`:

```javascript
const API_CONFIG = {
    IMPORT_URL: "URL_MOI_CUA_NHAP_HANG",
    SALES_URL: "URL_MOI_CUA_BAN_HANG", 
    DASHBOARD_URL: "URL_MOI_CUA_DASHBOARD"
};
```

## 🔧 Cấu Hình Chi Tiết

### Cho Script Nhập Hàng
```javascript
// Trong google-apps-script-nhaphang-deploy.js
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';
const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    BARCODES: 'DANH SACH BARCODE'
};
```

### Cho Script Bán Hàng
```javascript
// Trong google-apps-script-banhang-deploy.js
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';
const SHEETS = {
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};
```

### Cho Script Dashboard
```javascript
// Trong google-apps-script-dashboard-deploy.js
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';
const SHEETS = {
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};
```

## 🛠️ Hàm Setup

Mỗi script đều có hàm `setupSheets()` để tạo các sheet cần thiết:

1. Mở Google Apps Script editor
2. Chọn hàm `setupSheets` từ dropdown
3. Click **"Run"**
4. Chấp nhận quyền truy cập khi được yêu cầu

## 🔍 Kiểm Tra Hoạt Động

### Test Script Nhập Hàng
```bash
# Test GET products
curl "URL_NHAP_HANG?action=getProducts"

# Test POST import
curl -X POST "URL_NHAP_HANG" \
  -H "Content-Type: application/json" \
  -d '{"action":"importProducts","maSP":"TEST","tenSP":"Sản phẩm test","soLuong":1}'
```

### Test Script Bán Hàng
```bash
# Test POST sell
curl -X POST "URL_BAN_HANG" \
  -H "Content-Type: application/json" \
  -d '{"action":"sellBarcode","barcode":"TEST-001"}'
```

### Test Script Dashboard
```bash
# Test POST dashboard data
curl -X POST "URL_DASHBOARD" \
  -H "Content-Type: application/json" \
  -d '{"action":"getDashboardData","range":"today"}'
```

## ⚠️ Lưu Ý Quan Trọng

1. **Quyền truy cập**: Đảm bảo tài khoản deploy có quyền đọc/ghi spreadsheet
2. **SPREADSHEET_ID**: Kiểm tra ID spreadsheet đã đúng chưa
3. **CORS**: Đã được cấu hình sẵn trong các file deploy. Nếu vẫn gặp lỗi CORS, kiểm tra:
   - Đã thêm hàm `doOptions()` để xử lý preflight request
   - Đã thêm headers CORS trong `createJsonResponse()`
   - Deploy lại script sau khi sửa đổi
4. **Rate Limiting**: Google Apps Script có giới hạn 20 requests/phút cho free tier
5. **Logging**: Sử dụng `Logger.log()` để debug trong Google Apps Script editor

## 🔄 Cập Nhật Script

Khi cần cập nhật script:
1. Sửa code trong editor
2. Lưu lại (Ctrl+S)
3. Tạo deployment mới hoặc cập nhật deployment cũ
4. URL sẽ giữ nguyên nếu update deployment cũ

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Google Apps Script editor
2. Xác nhận quyền truy cập spreadsheet
3. Test từng endpoint riêng biệt
4. Kiểm tra cấu hình CORS nếu cần 