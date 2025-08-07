# Cập Nhật Hệ Thống Bán Hàng

## Những Thay Đổi Đã Thực Hiện

### 1. Sửa Lỗi Điền Dữ Liệu Sai Cột

**Vấn đề cũ:**
- Dữ liệu bị điền sai cột trong sheet "BÁN"
- Tên sản phẩm bị điền vào cột "Số Lượng" thay vì "Tên Sản phẩm"

**Giải pháp:**
- Sửa lại thứ tự dữ liệu trong hàm `addBarcodeToSales()`:
  ```javascript
  const newRow = [
      Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss"), // A: Ngày Bán
      product[2], // B: Tên Sản phẩm
      1, // C: Số Lượng
      "Bán tự động qua Web App" // D: Ghi Chú
  ];
  ```

### 2. Cập Nhật Trạng Thái Sản Phẩm

**Tính năng mới:**
- Sau khi bán sản phẩm, trạng thái tự động chuyển từ "Trong Kho" thành "Đã Bán"
- Thêm hàm `updateProductStatus()` để cập nhật cột E trong sheet "DANH SACH BARCODE"

**Code mới:**
```javascript
function updateProductStatus(barcodeSheet, rowNumber) {
    // Cập nhật trạng thái từ "Trong Kho" thành "Đã Bán"
    barcodeSheet.getRange(rowNumber, 5).setValue("Đã Bán");
}
```

### 3. Cải Thiện Logic Tìm Kiếm Sản Phẩm

**Thay đổi:**
- Thay thế `find()` bằng vòng lặp `for` để lấy được vị trí dòng
- Cần vị trí dòng để cập nhật trạng thái sản phẩm

### 4. Cập Nhật Response API

**Response mới:**
```json
{
    "success": true,
    "message": "Đã bán sản phẩm thành công",
    "product": "RƠ LƯỠI",
    "barcode": "RL-001"
}
```

### 5. Cải Thiện Giao Diện

**Thay đổi:**
- Hiển thị thông tin chi tiết hơn: tên sản phẩm + mã vạch
- Thêm thông báo "Bán tự động qua Web App" trong ghi chú
- Cập nhật cả quét mã vạch và nhập thủ công

## Cách Triển Khai

### Bước 1: Cập Nhật Google Apps Script
1. Mở Google Apps Script project
2. Thay thế toàn bộ code bằng nội dung từ file `google-apps-scripts-ban-hang.js`
3. Deploy lại Web App

### Bước 2: Cập Nhật HTML
1. Thay thế file `banhang.html` bằng phiên bản mới
2. Đảm bảo URL Web App đúng

### Bước 3: Test Hệ Thống
1. Thử bán sản phẩm có trạng thái "Trong Kho"
2. Kiểm tra dữ liệu trong sheet "BÁN" có đúng cột không
3. Kiểm tra trạng thái sản phẩm có chuyển thành "Đã Bán" không

## Cấu Trúc Dữ Liệu

### Sheet "BÁN" (SALES)
| Cột A | Cột B | Cột C | Cột D |
|-------|-------|-------|-------|
| Ngày Bán | Tên Sản phẩm | Số Lượng | Ghi Chú |
| 07/08/2025 22:20:41 | RƠ LƯỠI | 1 | Bán tự động qua Web App |

### Sheet "DANH SACH BARCODE"
| Cột A | Cột B | Cột C | Cột D | Cột E |
|-------|-------|-------|-------|-------|
| Mã Vạch | Mã Sản Phẩm | Tên Sản Phẩm | Ngày Nhập | Trạng Thái |
| RL-001 | RL | RƠ LƯỠI | 07/08/2025 | Đã Bán |

## Lưu Ý Quan Trọng

1. **Backup dữ liệu:** Luôn backup Google Sheet trước khi test
2. **Quyền truy cập:** Đảm bảo Web App có quyền chỉnh sửa Google Sheet
3. **Test từng bước:** Test với 1-2 sản phẩm trước khi sử dụng production
4. **Kiểm tra trạng thái:** Chỉ bán được sản phẩm có trạng thái "Trong Kho"

## Troubleshooting

### Nếu dữ liệu vẫn sai cột:
- Kiểm tra thứ tự cột trong sheet "BÁN" có đúng không
- Đảm bảo header row đúng thứ tự: Ngày Bán, Tên Sản phẩm, Số Lượng, Ghi Chú

### Nếu trạng thái không cập nhật:
- Kiểm tra quyền truy cập của Web App
- Kiểm tra tên sheet "DANH SACH BARCODE" có đúng không
- Kiểm tra cột E có phải là cột Trạng Thái không

### Nếu không tìm thấy sản phẩm:
- Kiểm tra mã vạch có đúng không
- Kiểm tra trạng thái sản phẩm có phải "Trong Kho" không
- Kiểm tra SPREADSHEET_ID có đúng không 