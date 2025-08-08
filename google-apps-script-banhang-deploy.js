// ==========================================================
// GOOGLE APPS SCRIPT - CHỨC NĂNG BÁN HÀNG (DEPLOYABLE)
// ==========================================================

// ==========================================================
// CÀI ĐẶT
// ==========================================================
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';

const SHEETS = {
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};

// ==========================================================
// ĐIỂM TRUY CẬP API (WEB APP ENTRY POINTS)
// ==========================================================

function doGet(e) {
    try {
        return createJsonResponse({ status: 'error', message: 'Hành động GET không hợp lệ cho bán hàng.' });
    } catch (err) {
        Logger.log('Lỗi trong doGet: ' + err.stack);
        return createJsonResponse({ status: 'error', message: 'Lỗi server trong doGet: ' + err.message });
    }
}

function doOptions(e) {
    return ContentService.createTextOutput('')
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        switch (action) {
            case 'sellBarcode':
                return handleSellBarcode(data);
            default:
                return createJsonResponse({ status: 'error', message: 'Hành động POST không hợp lệ.' });
        }
    } catch (err) {
        Logger.log('Lỗi trong doPost: ' + err.stack);
        return createJsonResponse({ status: 'error', message: 'Lỗi server trong doPost: ' + err.message });
    }
}

// ==========================================================
// CÁC HÀM XỬ LÝ LOGIC CHÍNH
// ==========================================================

function handleSellBarcode(data) {
    const { barcode } = data;
    if (!barcode) return createJsonResponse({ status: 'error', message: 'Thiếu mã vạch.' });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) return createJsonResponse({ status: 'error', message: 'Hệ thống đang bận.' });

    try {
        const barcodeSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.BARCODES);
        const textFinder = barcodeSheet.createTextFinder(barcode).matchEntireCell(true).findNext();

        if (!textFinder) {
            return createJsonResponse({ status: 'error', message: 'Mã vạch không hợp lệ.' });
        }

        const row = textFinder.getRow();
        const statusCell = barcodeSheet.getRange(row, 5); // Cột E - Trạng thái

        if (statusCell.getValue() === 'Đã Bán') {
            return createJsonResponse({ status: 'error', message: 'Mã vạch này đã được bán trước đó.' });
        }

        statusCell.setValue('Đã Bán');
        const tenSP = barcodeSheet.getRange(row, 3).getValue();

        SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.SALES).appendRow([new Date(), barcode, tenSP, 'Bán tự động qua Web App']);

        return createJsonResponse({ status: 'success', message: `Đã bán thành công: ${tenSP} (${barcode})` });

    } catch (err) {
        return createJsonResponse({ status: 'error', message: `Lỗi khi bán hàng: ${err.message}` });
    } finally {
        lock.releaseLock();
    }
}

// ==========================================================
// HÀM HỖ TRỢ
// ==========================================================

function createJsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ==========================================================
// HÀM SETUP (chạy bằng tay trong editor để tạo sheet)
// ==========================================================

function setupSheets() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const headers = {
        [SHEETS.SALES]: [['Ngày Bán', 'Mã Vạch Đã Bán', 'Tên Sản Phẩm', 'Ghi Chú']],
        [SHEETS.BARCODES]: [['Mã Vạch', 'Mã Sản Phẩm', 'Tên Sản Phẩm', 'Ngày Nhập', 'Trạng Thái']]
    };

    Object.keys(headers).forEach(sheetName => {
        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log(`Đã tạo sheet: ${sheetName}`);
        }
        sheet.getRange(1, 1, 1, headers[sheetName][0].length)
            .setValues(headers[sheetName])
            .setFontWeight('bold')
            .setBackground('#4a69bd')
            .setFontColor('white');
    });
} 