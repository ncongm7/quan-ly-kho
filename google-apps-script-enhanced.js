// ==========================================================
// CÀI ĐẶT
// ==========================================================
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI'; // ID ĐÃ ĐÚNG, KHÔNG CẦN THAY ĐỔI

const SHEETS = {
    PRODUCTS: 'DANH MUC SAN PHAM',
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
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

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        switch (action) {
            case 'importProducts':
                return handleImportProducts(data);
            case 'sellBarcode':
                return handleSellBarcode(data);
            case 'getDashboardData':
                return handleGetDashboardData(data);
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
    if (!sheet) throw new Error(`Không tìm thấy sheet: ${SHEETS.PRODUCTS}`);
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
            newRows.push([barcode, maSP, tenSP, currentTime, 'Trong Kho']);
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

function handleGetDashboardData(data) {
    const { range = 'all' } = data;
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    const importData = spreadsheet.getSheetByName(SHEETS.IMPORT).getDataRange().getValues();
    const salesData = spreadsheet.getSheetByName(SHEETS.SALES).getDataRange().getValues();
    const barcodeData = spreadsheet.getSheetByName(SHEETS.BARCODES).getDataRange().getValues();

    const filteredImports = filterDataByTimeRange(importData, range);
    const filteredSales = filterDataByTimeRange(salesData, range);

    const dashboardMetrics = calculateDashboardMetrics(filteredImports, filteredSales, barcodeData);

    return createJsonResponse({ status: 'success', data: dashboardMetrics });
}

// ==========================================================
// CÁC HÀM HỖ TRỢ (TÍNH TOÁN, LỌC DỮ LIỆU)
// ==========================================================

function createJsonResponse(data) {
    // SỬA LỖI QUAN TRỌNG NHẤT: Bỏ hoàn toàn setHeader
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function filterDataByTimeRange(data, range) {
    if (range === 'all') return data.slice(1);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.slice(1).filter(row => {
        const date = new Date(row[0]);
        if (isNaN(date.getTime())) return false;

        switch (range) {
            case 'today':
                return date >= today;
            case 'last7days':
                const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
                return date >= sevenDaysAgo;
            case 'thisMonth':
                return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            default:
                return true;
        }
    });
}

function calculateDashboardMetrics(imports, sales, barcodes) {
    // KPI Cards
    const totalImports = imports.reduce((sum, row) => sum + (Number(row[2]) || 0), 0);
    const totalSales = sales.length;
    const totalStock = barcodes.slice(1).filter(row => row[4] === 'Trong Kho').length;

    // Chart: Top Products
    const salesByProduct = sales.reduce((acc, row) => {
        const productName = row[2]; // Cột C - Tên SP trong sheet BÁN
        acc[productName] = (acc[productName] || 0) + 1;
        return acc;
    }, {});
    const topProducts = Object.entries(salesByProduct)
        .sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));

    // Chart: Sales Trend (7 ngày qua)
    const salesTrendData = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        salesTrendData[d.toLocaleDateString('vi-VN')] = 0;
    }
    sales.forEach(row => {
        const dateStr = new Date(row[0]).toLocaleDateString('vi-VN');
        if (salesTrendData.hasOwnProperty(dateStr)) {
            salesTrendData[dateStr]++;
        }
    });
    const salesTrend = Object.entries(salesTrendData).map(([date, count]) => ({ date, sales: count }));

    return {
        kpi: { totalImports, totalSales, totalStock },
        charts: { topProducts, salesTrend }
    };
}


// ==========================================================
// HÀM SETUP (chạy bằng tay trong editor để tạo sheet)
// ==========================================================

function setupSheets() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const headers = {
        [SHEETS.PRODUCTS]: [['Tên Sản phẩm', 'Mã Sản Phẩm']],
        [SHEETS.IMPORT]: [['Ngày Nhập', 'Tên Sản Phẩm', 'Số Lượng', 'Ghi Chú']],
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