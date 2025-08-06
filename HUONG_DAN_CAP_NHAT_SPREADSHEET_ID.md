# 🔧 Hướng Dẫn Cập Nhật SPREADSHEET_ID

## ❌ Vấn Đề Hiện Tại:
- Frontend: Lỗi `testConnection is not defined` ✅ ĐÃ SỬA
- Backend: SPREADSHEET_ID chưa được cập nhật ❌ CẦN SỬA

## 📋 Bước 1: Lấy SPREADSHEET_ID

1. **Mở Google Sheets của bạn**
2. **Copy URL từ thanh địa chỉ**
3. **URL có dạng:** `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

**Ví dụ:**
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```
→ SPREADSHEET_ID = `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## 🔧 Bước 2: Cập Nhật Google Apps Script

1. **Mở [script.google.com](https://script.google.com)**
2. **Mở project "Hệ Thống Quản Lý Kho"**
3. **Tìm dòng 15 trong file `google-apps-script.js`:**
```javascript
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // THAY ĐỔI THÀNH ID THỰC TẾ CỦA BẠN
```
4. **Thay thế bằng ID thực tế của bạn:**
```javascript
const SPREADSHEET_ID = 'YOUR_ACTUAL_SPREADSHEET_ID_HERE';
```

## 🚀 Bước 3: Deploy Lại

1. **Click "Deploy" > "Manage deployments"**
2. **Click "Edit" (biểu tượng bút chì)**
3. **Click "Deploy"**
4. **Copy URL mới (nếu có)**

## ✅ Bước 4: Test

1. **Mở file `index.html`**
2. **Click nút "🔍 Test Kết Nối"**
3. **Kiểm tra console (F12) để xem kết quả**

## 🐛 Nếu Vẫn Lỗi:

### Lỗi "Không tìm thấy sheet":
- Đảm bảo Google Sheets có sheet tên "DANH MUC SAN PHAM"
- Chạy hàm `setupInitialStructure()` trong Google Apps Script

### Lỗi CORS:
- Đảm bảo Google Apps Script đã deploy với quyền "Anyone"
- Kiểm tra CORS headers trong code

### Lỗi 404:
- Kiểm tra URL Google Apps Script có đúng không
- Đảm bảo đã deploy thành công

## 📞 Hỗ Trợ:

Nếu vẫn gặp vấn đề, hãy:
1. Kiểm tra console browser (F12)
2. Kiểm tra logs trong Google Apps Script
3. Chia sẻ thông báo lỗi cụ thể 