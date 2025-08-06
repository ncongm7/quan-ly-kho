Đây là tài liệu hướng dẫn chi tiết các bước để nâng cấp Hệ Thống Quản Lý Kho, bao gồm việc thêm các trang chức năng mới (Bán Hàng, Dashboard) và tái cấu trúc code để dễ dàng quản lý và mở rộng trong tương lai.
Mục Lục
Tổng Quan về Cấu Trúc Mới
Cấu trúc File Frontend
Cấu trúc Google Sheets (Backend)
Cấu trúc API (Apps Script)
Bước 1: Tái Cấu Trúc Frontend
Tạo các file HTML riêng biệt
Tạo file CSS và JavaScript chung
Bước 2: Xây Dựng Trang Bán Hàng (banhang.html)
Giao diện và Chức năng
Luồng hoạt động
Bước 3: Xây Dựng Trang Tổng Quan - Dashboard (dashboard.html)
Ý tưởng và Bố cục
Các thành phần chính
Bước 4: Nâng Cấp Backend (Google Apps Script)
Thêm các action mới cho API
Code hoàn chỉnh
Bước 5: Code Hoàn Chỉnh cho Frontend
index.html (Trang chủ/Menu)
nhaphang.html (Giao diện mới)
banhang.html
dashboard.html
style.css (File CSS chung)
script.js (File JavaScript chung)
Hướng Dẫn Triển Khai và Sử Dụng
1. Tổng Quan về Cấu Trúc Mới
Để hệ thống chuyên nghiệp và dễ bảo trì, chúng ta sẽ không dùng một file HTML duy nhất nữa mà sẽ tách ra thành nhiều file.
Cấu trúc File Frontend
Generated code CÓ PHÙ HỢP( REPONSIVE) VỚI MỌI LOẠI THIẾT BỊ 
/ (Thư mục dự án)
|-- index.html          (Trang chủ, đóng vai trò là menu chính)
|-- nhaphang.html       (Trang Nhập hàng, giao diện bạn đang có)
|-- banhang.html        (Trang Bán hàng với chức năng quét mã vạch)
|-- dashboard.html      (Trang Tổng quan, báo cáo, biểu đồ)
|-- assets/
|   |-- style.css       (File CSS chung cho tất cả các trang)
|   |-- script.js       (File JavaScript chung chứa các hàm dùng lại)
----------------------------------
Cấu trúc Google Sheets (Backend)
Chúng ta sẽ thêm sheet BÁN (MỚI) để ghi lại lịch sử bán hàng.
DANH MUC SAN PHAM: (Không đổi)
NHẬP: (Không đổi)
BÁN (MỚI):
Cột A: Ngày Bán
Cột B: Mã Vạch Đã Bán
Cột C: Tên Sản Phẩm
Cột D: Ghi Chú
DANH SACH BARCODE: Thêm cột mới Trạng Thái.
Cột A: Mã Vạch
Cột B: Mã Sản Phẩm
Cột C: Tên Sản Phẩm
Cột D: Ngày Nhập
Cột E: Trạng Thái (Ví dụ: "Trong Kho", "Đã Bán")
TỔNG HÀNG: (Không đổi)
Cấu trúc API (Apps Script)
Backend sẽ được mở rộng để xử lý các yêu cầu mới:
action=sellBarcode: Xử lý khi quét bán một sản phẩm.
action=getDashboardData: Lấy dữ liệu tổng hợp cho trang Dashboard.
2. Bước 1: Tái Cấu Trúc Frontend
Tạo các file HTML rỗng: index.html, nhaphang.html, banhang.html, dashboard.html.
Tạo thư mục assets.
Trong assets, tạo 2 file rỗng: style.css và script.js.
Di chuyển code HTML của bạn từ file cũ vào file nhaphang.html.
Tách phần CSS ra file assets/style.css và phần JavaScript ra file assets/script.js.
Trong mỗi file HTML, thêm các dòng sau vào trong thẻ <head> để liên kết các file chung:
Generated html
<link rel="stylesheet" href="assets/style.css">
<script src="assets/script.js" defer></script>
-----------------------------------------------
Html
3. Bước 2: Xây Dựng Trang Bán Hàng (banhang.html)--  CÓ THỂ SỬ DỤNG LẠI FILE GENERCODE.HTML NMA PHẢI SỬA LẠI 1 SỐ NỘI DUNG 
Đây là trang cốt lõi của tính năng mới.
Giao diện và Chức năng
Một khung hiển thị camera lớn chiếm gần hết màn hình.
Một khu vực hiển thị kết quả quét: "Sẵn sàng quét...", "Đã bán sản phẩm [Tên SP]", "Lỗi: Mã vạch đã được bán".
Một nút "Quét lại" sau khi quét thành công.
SỬ DỤNG LẠI FILE GENERCODE.HTML NMA PHẢI SỬA LẠI 1 SỐ NỘI DUNG 
---------------------------------------------------------
Luồng hoạt động
Người dùng mở trang banhang.html. Camera tự động khởi động.
Người dùng quét mã vạch trên một thùng hàng.
JavaScript trên trang lấy được mã vạch (ví dụ: MD-01-016).
Gửi yêu cầu POST đến API với action=sellBarcode và barcode=MD-01-016.

Backend xử lý:
Tìm mã MD-01-016 trong sheet DANH SACH BARCODE.
Kiểm tra Trạng Thái (Cột E):
Nếu là "Trong Kho":
Cập nhật trạng thái thành "Đã Bán".
Thêm một dòng mới vào sheet BÁN(MỚI).
Trả về thông báo thành công.
Nếu là "Đã Bán":
Không làm gì cả.
Trả về thông báo lỗi "Mã vạch này đã được bán trước đó".
Nếu không tìm thấy mã:
Trả về thông báo lỗi "Mã vạch không hợp lệ".
Frontend nhận kết quả và hiển thị thông báo tương ứng cho người dùng. Camera dừng lại.
4. Bước 3: Xây Dựng Trang Tổng Quan - Dashboard (dashboard.html)
Đây là nơi cung cấp cái nhìn toàn cảnh về tình hình kinh doanh.
Ý tưởng và Bố cục
Dashboard nên trực quan, dễ hiểu với các thẻ thông tin và biểu đồ.
VÀ CÓ BẢNG HIỆN THỊ TỔNG SỐ LƯỢNG SẢN PHẨM CỦA CÁC SẢN PHẨM
Bộ lọc thời gian: Một dropdown cho phép chọn xem dữ liệu theo: "Hôm nay", "7 ngày qua", "Tháng này", "Toàn bộ thời gian".
Các thẻ số liệu chính (KPI Cards):
Tổng số sản phẩm đã nhập.
Tổng số sản phẩm đã bán.
Số lượng tồn kho hiện tại.
Doanh thu (nếu có giá bán).
Biểu đồ:
Biểu đồ cột: "Top 5 sản phẩm bán chạy nhất".
Biểu đồ đường: "Xu hướng Nhập/Bán hàng theo thời gian" (ví dụ, số lượng nhập/bán mỗi ngày trong 30 ngày qua).
Biểu đồ tròn: "Tỷ lệ tồn kho của các nhóm sản phẩm".
Luồng hoạt động
Người dùng mở trang dashboard.html.
JavaScript gửi yêu cầu GET đến API với action=getDashboardData và tham số thời gian (ví dụ: range=last7days).
Backend xử lý:
Đọc dữ liệu từ sheet NHẬP và BÁN(MỚI).
Lọc dữ liệu theo khoảng thời gian yêu cầu.
Tính toán các số liệu: tổng nhập, tổng bán, top sản phẩm...
Gửi toàn bộ dữ liệu đã xử lý về cho frontend dưới dạng JSON.
Frontend nhận dữ liệu và sử dụng một thư viện biểu đồ (như Chart.js - rất nhẹ và dễ dùng) để vẽ các biểu đồ và hiển thị các con số.
5. Bước 4: Nâng Cấp Backend (Google Apps Script)
Dưới đây là phiên bản code Apps Script đã được nâng cấp để hỗ trợ tất cả các tính năng mới.
(Bạn có thể dán code này vào thay thế hoàn toàn code cũ, sau đó triển khai lại phiên bản mới của Web App)
-----------------------------------------
KHÔNG CẦN LÀM BẢN DEMO NHÉ 