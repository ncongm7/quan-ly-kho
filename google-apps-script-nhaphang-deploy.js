// ==========================================================
// GOOGLE APPS SCRIPT - CHỨC NĂNG NHẬP HÀNG (DEPLOYABLE)
// ==========================================================

// ==========================================================
// CÀI ĐẶT
// ==========================================================
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';

const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    BARCODES: 'DANH SACH BARCODE'
};

// ==========================================================
// ĐIỂM TRUY CẬP API (WEB APP ENTRY POINTS)
// ==========================================================

function doGet(e) {
    try {
        const action = e.parameter.action;
        if (action === 'getProducts') {
            return handleGetProducts();
        }
        return createJsonResponse({ status: 'error', message: 'Hành động GET không hợp lệ.' });
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
            case 'importProducts':
                return handleImportProducts(data);
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

function handleGetProducts() {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEETS.PRODUCTS);

    const data = sheet.getDataRange().getValues();
    const products = data.slice(1).map(([tenSP, maSP]) => ({ tenSP, maSP })).filter(p => p.tenSP && p.maSP);
    return createJsonResponse({ products });
}

function handleImportProducts(data) {
    const { maSP, tenSP, soLuong } = data;
    if (!maSP || !tenSP || !soLuong || isNaN(parseInt(soLuong))) {
        return createJsonResponse({ status: 'error', message: 'Dữ liệu nhập vào không hợp lệ.' });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
        return createJsonResponse({ status: 'error', message: 'Hệ thống đang bận, vui lòng thử lại sau giây lát.' });
    }

    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
        const currentTime = new Date();

        spreadsheet.getSheetByName(SHEETS.IMPORT).appendRow([currentTime, tenSP, parseInt(soLuong), 'Tự động qua Web App']);

        const barcodeSheet = spreadsheet.getSheetByName(SHEETS.BARCODES);
        const existingData = barcodeSheet.getDataRange().getValues();

        let maxNumber = 0;
        existingData.forEach(row => {
            if (row[1] === maSP) { // Cột B - Mã Sản Phẩm
                const num = parseInt(row[0].split('-').pop()); // Cột A - Mã vạch
                if (!isNaN(num) && num > maxNumber) maxNumber = num;
            }
        });

        const newRows = [];
        const newBarcodes = [];
        for (let i = 1; i <= soLuong; i++) {
            const newNum = maxNumber + i;
            const barcode = `${maSP}-${String(newNum).padStart(3, '0')}`;
            newBarcodes.push(barcode);
            newRows.push([barcode, maSP, tenSP, currentTime, 'Còn hàng']);
        }

        if (newRows.length > 0) {
            barcodeSheet.getRange(barcodeSheet.getLastRow() + 1, 1, newRows.length, 5).setValues(newRows);
        }

        return createJsonResponse({ status: 'success', message: `Hoàn tất! Đã nhập ${soLuong} thùng ${tenSP}.`, newBarcodes });

    } catch (err) {
        return createJsonResponse({ status: 'error', message: `Lỗi khi nhập hàng: ${err.message}` });
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
        [SHEETS.PRODUCTS]: [['Tên Sản phẩm', 'Mã Sản Phẩm']],
        [SHEETS.IMPORT]: [['Ngày Nhập', 'Tên Sản Phẩm', 'Số Lượng', 'Ghi Chú']],
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