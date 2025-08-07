const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';

const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};

function doPost(e) {
    try {
        // Lấy dữ liệu từ request (hỗ trợ cả JSON và form data)
        let barcode;

        if (e.postData.type === 'application/json') {
            // Nếu là JSON
            const postData = JSON.parse(e.postData.contents);
            barcode = postData.barcode;
        } else {
            // Nếu là form data (từ mode no-cors)
            const formData = e.parameter;
            barcode = formData.barcode;
        }

        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.BARCODES);
        const data = sheet.getDataRange().getValues();

        // Tìm sản phẩm và vị trí dòng
        let productRow = -1;
        let product = null;

        for (let i = 0; i < data.length; i++) {
            if (data[i][0] === barcode && data[i][4] === 'Trong Kho') {
                product = data[i];
                productRow = i + 1; // +1 vì index bắt đầu từ 0, nhưng sheet row bắt đầu từ 1
                break;
            }
        }

        if (product && productRow > 0) {
            // Thêm vào sheet bán hàng
            addBarcodeToSales(product);

            // Cập nhật trạng thái sản phẩm thành "Đã Bán"
            updateProductStatus(sheet, productRow);

            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                message: 'Đã bán sản phẩm thành công',
                product: product[2],
                barcode: barcode
            })).setMimeType(ContentService.MimeType.JSON);
        } else {
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Không tìm thấy sản phẩm hoặc sản phẩm không còn trong kho'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: 'Lỗi: ' + error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function addBarcodeToSales(product) {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.SALES);
    const now = new Date();

    // Điền đúng cột theo thứ tự: Ngày Bán, Tên Sản phẩm, Số Lượng, Ghi Chú
    const newRow = [
        Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss"), // A: Ngày Bán
        product[2],
        1,
        "Bán tự động qua Web App" // D: Ghi Chú
    ];

    sheet.appendRow(newRow);
}

function updateProductStatus(barcodeSheet, rowNumber) {
    // Cập nhật trạng thái từ "Trong Kho" thành "Đã Bán"
    // Cột E (index 4) là cột Trạng Thái
    barcodeSheet.getRange(rowNumber, 5).setValue("Đã Bán");
}

// Hàm test để kiểm tra
function doGet(e) {
    return ContentService.createTextOutput('Web App đang hoạt động!');
}

