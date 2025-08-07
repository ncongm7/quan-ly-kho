const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI'; // ID ĐÃ ĐÚNG, KHÔNG CẦN THAY ĐỔI

const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};

function doPost(e) {
    try {
        // Lấy dữ liệu từ request
        const postData = JSON.parse(e.postData.contents);
        const barcode = postData.barcode;

        const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.BARCODES);
        const data = sheet.getDataRange().getValues();

        const product = data.find(row => {
            return row[0] === barcode && row[4] === 'Trong Kho';
        });

        if (product) {
            addBarcodeToSales(product);
            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                message: 'Đã thêm sản phẩm vào bán hàng',
                product: product[2]
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
    const newRow = [
        Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss"), // Ngày bán
        product[2], // Tên sản phẩm
        1, // Số lượng
        "" // Ghi chú
    ];
    sheet.appendRow(newRow);
}

// Hàm test để kiểm tra
function doGet(e) {
    return ContentService.createTextOutput('Web App đang hoạt động!');
}

