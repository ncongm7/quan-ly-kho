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
