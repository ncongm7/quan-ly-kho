/* ===== JAVASCRIPT CHO CHỨC NĂNG NHẬP HÀNG ===== */

// Biến để tránh hỏi download nhiều lần
let isDownloadPrompted = false;
// Biến để tránh gọi importAndCreate nhiều lần cùng lúc
let isImporting = false;

// ==========================================================
// HÀM NHẬP HÀNG CHÍNH
// ==========================================================

async function importAndCreate(maSP, tenSP, soLuong) {
    // Kiểm tra nếu đang nhập hàng thì bỏ qua
    if (isImporting) {
        console.log("Đang nhập hàng, bỏ qua request này...");
        return;
    }

    console.log("=== BẮT ĐẦU NHẬP HÀNG ===");
    console.log("Mã SP:", maSP, "Tên SP:", tenSP, "Số lượng:", soLuong);

    isImporting = true;
    showLoading(true);
    hideAlerts();

    // Reset flag
    isDownloadPrompted = false;

    try {
        // Gửi dữ liệu nhập hàng đến API
        console.log("Gửi dữ liệu đến backend...");
        const response = await sendToAPI(API_CONFIG.IMPORT_URL, "importProducts", {
            maSP: maSP,
            tenSP: tenSP,
            soLuong: soLuong,
        });

        if (response.status === 'success') {
            console.log("✅ Nhập hàng thành công!");
            showSuccess(response.message || `✅ Đã nhập thành công ${soLuong} thùng ${tenSP} vào hệ thống!`);

            // Hiển thị danh sách mã vạch đã tạo
            if (response.newBarcodes && response.newBarcodes.length > 0) {
                displayBarcodeList(response.newBarcodes, tenSP, maSP);
            }
        } else {
            throw new Error(response.message || 'Lỗi không xác định');
        }

        // Hỏi người dùng có muốn download PDF không (chỉ 1 lần)
        console.log("Chuẩn bị hỏi download PDF...");
        setTimeout(() => {
            if (!isDownloadPrompted) {
                console.log("Hiển thị dialog hỏi download...");
                isDownloadPrompted = true;
                if (confirm(`Bạn có muốn download PDF mã vạch cho ${soLuong} thùng ${tenSP} không?`)) {
                    console.log("Người dùng chọn download PDF");
                    generateAndDownloadBarcodes(maSP, tenSP, soLuong);
                } else {
                    console.log("Người dùng từ chối download PDF");
                }
            } else {
                console.log("Đã hỏi download rồi, bỏ qua...");
            }
        }, 1000);

    } catch (error) {
        console.error("Lỗi nhập hàng:", error);
        showError(`Lỗi khi gửi yêu cầu nhập hàng: ${error.message}`);
    } finally {
        showLoading(false);
        isImporting = false; // Reset flag
        console.log("=== KẾT THÚC NHẬP HÀNG ===");
    }
}

// ==========================================================
// HÀM HIỂN THỊ DANH SÁCH MÃ VẠCH
// ==========================================================

function displayBarcodeList(barcodes, tenSP, maSP) {
    const barcodeList = document.getElementById('barcodeList');
    const barcodeGrid = document.getElementById('barcodeGrid');

    if (!barcodeList || !barcodeGrid) return;

    // Hiển thị container
    barcodeList.style.display = 'block';

    // Tạo HTML cho danh sách mã vạch
    barcodeGrid.innerHTML = '';
    barcodes.forEach(barcode => {
        const barcodeItem = document.createElement('div');
        barcodeItem.className = 'barcode-item';
        barcodeItem.textContent = barcode;
        barcodeGrid.appendChild(barcodeItem);
    });

    // Cập nhật tiêu đề
    const title = barcodeList.querySelector('h3');
    if (title) {
        title.textContent = `📋 Danh Sách Mã Vạch Đã Tạo - ${tenSP} (${maSP})`;
    }
}

// ==========================================================
// HÀM IN MÃ VẠCH
// ==========================================================

function printBarcodes() {
    const barcodeGrid = document.getElementById('barcodeGrid');
    if (!barcodeGrid) return;

    const barcodeItems = barcodeGrid.querySelectorAll('.barcode-item');
    if (barcodeItems.length === 0) {
        showError('Không có mã vạch nào để in');
        return;
    }

    // Tạo cửa sổ in mới
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>In Mã Vạch</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px;
                    font-size: 12px;
                }
                .barcode-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .barcode-item {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                    font-family: monospace;
                    font-size: 14px;
                    background: #f9f9f9;
                }
                @media print {
                    .barcode-container {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <h2>📦 Danh Sách Mã Vạch</h2>
            <div class="barcode-container">
    `);

    barcodeItems.forEach(item => {
        printWindow.document.write(`
            <div class="barcode-item">${item.textContent}</div>
        `);
    });

    printWindow.document.write(`
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}

function printBarcodesPDF() {
    const barcodeGrid = document.getElementById('barcodeGrid');
    if (!barcodeGrid) return;

    const barcodeItems = barcodeGrid.querySelectorAll('.barcode-item');
    if (barcodeItems.length === 0) {
        showError('Không có mã vạch nào để in');
        return;
    }

    // Lấy danh sách mã vạch
    const barcodes = Array.from(barcodeItems).map(item => item.textContent);

    // Lấy thông tin sản phẩm từ tiêu đề
    const title = document.querySelector('#barcodeList h3');
    let tenSP = 'Sản phẩm';
    let maSP = 'SP';

    if (title) {
        const titleText = title.textContent;
        const match = titleText.match(/\((.*?)\)/);
        if (match) {
            maSP = match[1];
        }
        const nameMatch = titleText.match(/-(.*?)\s*\(/);
        if (nameMatch) {
            tenSP = nameMatch[1].trim();
        }
    }

    // Gọi hàm tạo PDF
    printBarcodesPDF(barcodes, tenSP, maSP);
}

// ==========================================================
// HÀM XỬ LÝ FORM
// ==========================================================

function initializeImportForm() {
    const form = document.getElementById('importForm');
    if (!form) return;

    // Xóa event listener cũ nếu có
    form.removeEventListener('submit', handleImportFormSubmit);

    // Thêm event listener mới
    form.addEventListener('submit', handleImportFormSubmit);
}

function handleImportFormSubmit(e) {
    e.preventDefault();
    console.log("Form submitted - xử lý nhập hàng...");

    const maSP = document.getElementById("productSelect").value;
    const soLuong = document.getElementById("quantityInput").value;
    const product = products.find((p) => p.maSP === maSP);

    if (product && soLuong > 0) {
        importAndCreate(maSP, product.tenSP, soLuong);
    } else {
        showError("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ.");
    }
}

// ==========================================================
// HÀM KHỞI TẠO TRANG NHẬP HÀNG
// ==========================================================

function initializeImportPage() {
    console.log("Khởi tạo trang nhập hàng...");

    // Khởi tạo form
    initializeImportForm();

    // Load danh sách sản phẩm
    loadProducts();
}

// Khởi tạo khi trang load
if (document.body.dataset.page === 'nhaphang') {
    document.addEventListener('DOMContentLoaded', initializeImportPage);
} 