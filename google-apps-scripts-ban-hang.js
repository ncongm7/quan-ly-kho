// ==========================================================
// CÀI ĐẶT
// ==========================================================
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';

const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};

// ==========================================================
// ĐIỂM TRUY CẬP API
// ==========================================================

function doGet(e) {
    try {
        const action = e.parameter.action;
        if (action === 'getProducts') {
            return handleGetProducts();
        }
        return createJsonResponse({ status: 'info', message: 'Web App đang hoạt động.' });
    } catch (err) {
        return createJsonResponse({ status: 'error', message: 'Lỗi server trong doGet: ' + err.message });
    }
}

function doPost(e) {
    try {
        // Lấy dữ liệu từ request
        let barcode;

        if (e.postData.type === 'application/json') {
            // Nếu là JSON
            const postData = JSON.parse(e.postData.contents);
            barcode = postData.barcode;
        } else {
            // Nếu là form data
            barcode = e.parameter.barcode;
        }

        if (!barcode) {
            return createJsonResponse({
                success: false,
                message: 'Không nhận được mã vạch'
            });
        }

        return handleSellBarcode(barcode);
    } catch (err) {
        Logger.log('Lỗi trong doPost: ' + err.stack);
        return createJsonResponse({
            success: false,
            message: 'Lỗi server: ' + err.message
        });
    }
}

// ==========================================================
// HÀM XỬ LÝ LOGIC
// ==========================================================

function handleSellBarcode(barcode) {
    try {
        const barcodeSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.BARCODES);
        if (!barcodeSheet) {
            return createJsonResponse({
                success: false,
                message: 'Không tìm thấy sheet DANH SACH BARCODE'
            });
        }

        // Tìm sản phẩm trong sheet
        const data = barcodeSheet.getDataRange().getValues();
        let productRow = -1;
        let product = null;

        for (let i = 0; i < data.length; i++) {
            if (data[i][0] === barcode && data[i][4] === 'Trong Kho') {
                product = data[i];
                productRow = i + 1; // +1 vì index bắt đầu từ 0, nhưng sheet row bắt đầu từ 1
                break;
            }
        }

        if (!product || productRow <= 0) {
            return createJsonResponse({
                success: false,
                message: 'Không tìm thấy sản phẩm hoặc sản phẩm không còn trong kho'
            });
        }

        // Thêm vào sheet bán hàng
        const salesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.SALES);
        if (!salesSheet) {
            return createJsonResponse({
                success: false,
                message: 'Không tìm thấy sheet BÁN'
            });
        }

        const now = new Date();
        const formattedDate = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");

        // Thêm dữ liệu vào sheet BÁN: [Ngày Bán, Tên Sản phẩm, Số Lượng, Ghi Chú]
        salesSheet.appendRow([
            formattedDate,
            product[2], // Tên sản phẩm (cột C)
            1, // Số lượng
            'Bán tự động qua Web App'
        ]);

        // Cập nhật trạng thái sản phẩm thành "Đã Bán"
        barcodeSheet.getRange(productRow, 5).setValue("Đã Bán");

        return createJsonResponse({
            success: true,
            message: 'Đã bán sản phẩm thành công',
            product: product[2],
            barcode: barcode
        });

    } catch (error) {
        Logger.log('Lỗi trong handleSellBarcode: ' + error.stack);
        return createJsonResponse({
            success: false,
            message: 'Lỗi xử lý: ' + error.message
        });
    }
}

function handleGetProducts() {
    try {
        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUCTS);
        if (!sheet) {
            return createJsonResponse({
                success: false,
                message: 'Không tìm thấy sheet sản phẩm.'
            });
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const products = data.slice(1).map(row => {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = row[index];
            });
            return product;
        });

        return createJsonResponse({
            success: true,
            data: products
        });
    } catch (err) {
        return createJsonResponse({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm: ' + err.message
        });
    }
}

function createJsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

