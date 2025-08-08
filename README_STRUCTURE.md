# Cấu Trúc Hệ Thống Quản Lý Kho - Đã Tách Riêng File

## 📁 Cấu Trúc Thư Mục

```
xt-kho/
├── assets/
│   ├── js/
│   │   ├── common.js          # JavaScript chung cho toàn hệ thống
│   │   ├── import.js          # JavaScript cho chức năng nhập hàng
│   │   ├── sales.js           # JavaScript cho chức năng bán hàng
│   │   └── dashboard.js       # JavaScript cho chức năng dashboard
│   ├── style.css              # CSS chung cho toàn hệ thống
│   ├── nhaphang.js            # File cũ (có thể xóa)
│   └── script.js              # File cũ (có thể xóa)
├── google-apps-script-nhaphang.js  # Backend cho nhập hàng
├── google-apps-scripts-ban-hang.js # Backend cho bán hàng
├── google-script-banhang-real.js   # Backend thực tế cho bán hàng
├── google-script-dashboard.js      # Backend cho dashboard
├── index.html                 # Trang chủ
├── nhaphang.html             # Trang nhập hàng
├── banhang.html              # Trang bán hàng
├── dashboard.html            # Trang dashboard
└── README_STRUCTURE.md       # File này
```

## 🔧 Mô Tả Các File JavaScript

### 1. `assets/js/common.js`
**Chức năng:** File JavaScript chung cho toàn hệ thống
- **API Configuration:** Cấu hình URL cho các API
- **API Communication:** Hàm giao tiếp với Google Apps Script
- **UI Functions:** Các hàm hiển thị thông báo, loading, status
- **Utility Functions:** Hàm format, navigation, test connection
- **Barcode Functions:** Hàm tạo và in mã vạch PDF
- **Initialization:** Khởi tạo chung cho tất cả trang

### 2. `assets/js/import.js`
**Chức năng:** JavaScript riêng cho trang nhập hàng
- **Import Logic:** Xử lý logic nhập hàng và tạo mã vạch
- **Form Handling:** Xử lý form nhập hàng
- **Barcode Display:** Hiển thị danh sách mã vạch đã tạo
- **Print Functions:** In mã vạch thường và PDF
- **Page Initialization:** Khởi tạo trang nhập hàng

### 3. `assets/js/sales.js`
**Chức năng:** JavaScript riêng cho trang bán hàng
- **Scanner Management:** Quản lý camera quét mã vạch
- **Barcode Processing:** Xử lý mã vạch quét được
- **Manual Input:** Xử lý nhập mã vạch thủ công
- **Sales History:** Quản lý lịch sử bán hàng
- **Page Initialization:** Khởi tạo trang bán hàng

### 4. `assets/js/dashboard.js`
**Chức năng:** JavaScript riêng cho trang dashboard
- **Data Loading:** Tải dữ liệu dashboard từ API
- **Display Management:** Cập nhật hiển thị dashboard
- **Page Initialization:** Khởi tạo trang dashboard
- **Placeholder:** Tạm thời để trống (theo yêu cầu user)

## 📋 Cách Sử Dụng

### Trang Nhập Hàng (`nhaphang.html`)
```html
<script src="assets/js/common.js"></script>
<script src="assets/js/import.js"></script>
```

### Trang Bán Hàng (`banhang.html`)
```html
<script src="assets/js/common.js"></script>
<script src="assets/js/sales.js"></script>
```

### Trang Dashboard (`dashboard.html`)
```html
<script src="assets/js/common.js"></script>
<script src="assets/js/dashboard.js"></script>
```

### Trang Chủ (`index.html`)
```html
<script src="assets/js/common.js"></script>
```

## 🎯 Lợi Ích Của Việc Tách File

1. **Dễ Bảo Trì:** Mỗi chức năng có file riêng, dễ sửa đổi
2. **Tái Sử Dụng:** Code chung trong `common.js` có thể dùng cho nhiều trang
3. **Hiệu Suất:** Chỉ load JavaScript cần thiết cho từng trang
4. **Tổ Chức:** Code được sắp xếp logic theo chức năng
5. **Debug:** Dễ dàng tìm và sửa lỗi trong từng file

## 🔄 Cập Nhật Từ Code Cũ

### File Cũ → File Mới
- `assets/nhaphang.js` → `assets/js/common.js` + `assets/js/import.js`
- `assets/script.js` → `assets/js/common.js` + `assets/js/sales.js`
- Code dashboard → `assets/js/dashboard.js`

### Thay Đổi Trong HTML
- Cập nhật đường dẫn script trong tất cả file HTML
- Xóa code JavaScript inline trong HTML
- Sử dụng các hàm từ file JavaScript đã tách

## ⚠️ Lưu Ý

1. **Thứ Tự Load:** `common.js` phải load trước các file khác
2. **API URLs:** Cấu hình API trong `common.js` cần đúng
3. **Functions:** Các hàm được định nghĩa trong file tương ứng
4. **Dependencies:** Kiểm tra dependencies giữa các file

## 🚀 Bước Tiếp Theo

1. Test tất cả chức năng sau khi tách file
2. Xóa các file JavaScript cũ không còn sử dụng
3. Cập nhật documentation nếu cần
4. Thêm tính năng mới vào file tương ứng 