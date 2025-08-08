// ==========================================================
// GOOGLE APPS SCRIPT - CHỨC NĂNG DASHBOARD (DEPLOYABLE)
// ==========================================================

// ==========================================================
// CÀI ĐẶT
// ==========================================================
const SPREADSHEET_ID = '1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI';

const SHEETS = {
    IMPORT: 'NHẬP',
    SALES: 'BÁN',
    BARCODES: 'DANH SACH BARCODE'
};

// ==========================================================
// ĐIỂM TRUY CẬP API (WEB APP ENTRY POINTS)
// ==========================================================

function doGet(e) {
    try {
        return createJsonResponse({ status: 'error', message: 'Hành động GET không hợp lệ cho dashboard.' });
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
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    const totalStock = barcodes.slice(1).filter(row => row[4] === 'Còn hàng').length;

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