/**
 * Google Apps Script Backend Nâng Cấp cho Hệ Thống Quản Lý Kho
 *
 * Hướng dẫn triển khai:
 * 1. Mở Google Apps Script (script.google.com)
 * 2. Tạo project mới hoặc cập nhật project cũ
 * 3. Copy toàn bộ code này vào editor
 * 4. Thay đổi SPREADSHEET_ID thành ID của Google Sheet của bạn
 * 5. Deploy thành Web App
 * 6. Copy URL Web App và cập nhật vào file assets/script.js
 */

// ID của Google Sheet - THAY ĐỔI THÀNH ID CỦA BẠN
// Lấy ID từ URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
const SPREADSHEET_ID = "1kot3RbwFd24wVT2oe6-DLXmBDD6Hc7vK8rgfl_dkEUI"; // THAY ĐỔI THÀNH ID THỰC TẾ CỦA BẠN

// Tên các sheet
const SHEETS = {
  PRODUCTS: "DANH MUC SAN PHAM",
  IMPORT: "NHẬP",
  SALES: "BAN", // Sheet mới cho bán hàng
  BARCODES: "DANH SACH BARCODE",
};

/**
 * Xử lý yêu cầu GET - Lấy danh sách sản phẩm
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "getProducts") {
      return getProducts();
    }

    return createResponse({ error: "Action không hợp lệ" }, 400);
  } catch (error) {
    console.error("Lỗi trong doGet:", error);
    return createResponse({ error: "Lỗi server" }, 500);
  }
}

/**
 * Xử lý yêu cầu POST - Nhập hàng, bán hàng, và lấy dữ liệu dashboard
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case "importProducts":
        return importProducts(data);
      case "sellBarcode":
        return sellBarcode(data);
      case "getDashboardData":
        return getDashboardData(data);
      default:
        return createResponse({ error: "Action không hợp lệ" }, 400);
    }
  } catch (error) {
    console.error("Lỗi trong doPost:", error);
    return createResponse({ error: "Lỗi server" }, 500);
  }
}

/**
 * Lấy danh sách sản phẩm từ sheet DANH MUC SAN PHAM
 */
function getProducts() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
      SHEETS.PRODUCTS
    );
    if (!sheet) {
      throw new Error("Không tìm thấy sheet DANH MUC SAN PHAM");
    }

    const data = sheet.getDataRange().getValues();
    const products = [];

    // Bỏ qua header (row 1), bắt đầu từ row 2
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const tenSP = row[0]; // Cột A - Tên Sản phẩm
      const maSP = row[1]; // Cột B - Mã Sản Phẩm

      if (tenSP && maSP) {
        // Chỉ lấy những dòng có đủ thông tin
        products.push({
          tenSP: tenSP.toString().trim(),
          maSP: maSP.toString().trim(),
        });
      }
    }

    return createResponse({ products: products });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    return createResponse({ error: "Không thể lấy danh sách sản phẩm" }, 500);
  }
}

/**
 * Nhập hàng và tạo mã vạch
 */
function importProducts(data) {
  try {
    const { productCode, quantity } = data;

    if (!productCode || !quantity) {
      return createResponse({ error: "Thiếu thông tin bắt buộc" }, 400);
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Lấy thông tin sản phẩm từ sheet DANH MUC SAN PHAM
    const productSheet = spreadsheet.getSheetByName(SHEETS.PRODUCTS);
    const productData = productSheet.getDataRange().getValues();
    let tenSP = "";

    for (let i = 1; i < productData.length; i++) {
      if (productData[i][1] === productCode) {
        // Cột B - Mã Sản Phẩm
        tenSP = productData[i][0]; // Cột A - Tên Sản Phẩm
        break;
      }
    }

    if (!tenSP) {
      return createResponse(
        { error: "Không tìm thấy sản phẩm với mã: " + productCode },
        400
      );
    }

    // 1. Ghi vào sheet NHẬP
    const importSheet = spreadsheet.getSheetByName(SHEETS.IMPORT);
    if (!importSheet) {
      throw new Error("Không tìm thấy sheet NHẬP");
    }

    const currentTime = new Date();
    importSheet.appendRow([
      currentTime,
      tenSP,
      quantity,
      "Tự động tạo mã vạch",
    ]);

    // 2. Tạo mã vạch mới (tự động không trùng lặp)
    const barcodes = generateBarcodes(productCode, quantity, spreadsheet);

    // 3. Ghi mã vạch vào sheet DANH SACH BARCODE
    const barcodeSheet = spreadsheet.getSheetByName(SHEETS.BARCODES);
    if (!barcodeSheet) {
      throw new Error("Không tìm thấy sheet DANH SACH BARCODE");
    }

    // Ghi từng mã vạch
    barcodes.forEach((barcode) => {
      barcodeSheet.appendRow([
        barcode,
        productCode,
        tenSP,
        currentTime,
        "Trong Kho",
      ]);
    });

    return createResponse({
      status: "success",
      message: `✅ Đã nhập thành công ${quantity} thùng ${tenSP} và tạo ${barcodes.length} mã vạch vào hệ thống!`,
    });
  } catch (error) {
    console.error("Lỗi khi nhập hàng:", error);
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Bán sản phẩm (quét mã vạch)
 */
function sellBarcode(data) {
  try {
    const { barcode } = data;

    if (!barcode) {
      return createResponse({ error: "Thiếu mã vạch" }, 400);
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const barcodeSheet = spreadsheet.getSheetByName(SHEETS.BARCODES);

    if (!barcodeSheet) {
      throw new Error("Không tìm thấy sheet DANH SACH BARCODE");
    }

    // Tìm mã vạch trong sheet
    const barcodeData = barcodeSheet.getDataRange().getValues();
    let foundRow = -1;
    let productInfo = null;

    for (let i = 1; i < barcodeData.length; i++) {
      // Bỏ qua header
      const row = barcodeData[i];
      const currentBarcode = row[0]; // Cột A - Mã Vạch
      const status = row[4]; // Cột E - Trạng Thái

      if (currentBarcode === barcode) {
        foundRow = i + 1; // +1 vì index bắt đầu từ 0
        productInfo = {
          barcode: currentBarcode,
          maSP: row[1], // Cột B - Mã Sản Phẩm
          tenSP: row[2], // Cột C - Tên Sản Phẩm
          status: status,
        };
        break;
      }
    }

    if (foundRow === -1) {
      return createResponse({
        status: "error",
        message: "Mã vạch không hợp lệ",
      });
    }

    if (productInfo.status === "Đã Bán") {
      return createResponse({
        status: "error",
        message: "Mã vạch này đã được bán trước đó",
      });
    }

    // Cập nhật trạng thái thành "Đã Bán"
    barcodeSheet.getRange(foundRow, 5).setValue("Đã Bán"); // Cột E

    // Ghi vào sheet BÁN
    const salesSheet = spreadsheet.getSheetByName(SHEETS.SALES);
    if (!salesSheet) {
      // Tạo sheet BÁN nếu chưa có
      const newSalesSheet = spreadsheet.insertSheet(SHEETS.SALES);
      newSalesSheet
        .getRange("A1:D1")
        .setValues([["Ngày Bán", "Mã Vạch Đã Bán", "Tên Sản Phẩm", "Ghi Chú"]]);
      newSalesSheet
        .getRange("A1:D1")
        .setBackground("#2c3e50")
        .setFontColor("white")
        .setFontWeight("bold");
    }

    const currentTime = new Date();
    salesSheet.appendRow([
      currentTime,
      barcode,
      productInfo.tenSP,
      "Bán tự động",
    ]);

    return createResponse({
      status: "success",
      message: `Đã bán thành công: ${productInfo.tenSP} (${barcode})`,
    });
  } catch (error) {
    console.error("Lỗi khi bán sản phẩm:", error);
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Lấy dữ liệu dashboard
 */
function getDashboardData(data) {
  try {
    const { range = "all" } = data;
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Lấy dữ liệu từ các sheet
    const importData = getSheetData(spreadsheet, SHEETS.IMPORT);
    const salesData = getSheetData(spreadsheet, SHEETS.SALES);
    const barcodeData = getSheetData(spreadsheet, SHEETS.BARCODES);
    const productData = getSheetData(spreadsheet, SHEETS.PRODUCTS);

    // Lọc dữ liệu theo thời gian
    const filteredImports = filterDataByTimeRange(importData, range);
    const filteredSales = filterDataByTimeRange(salesData, range);

    // Tính toán các chỉ số
    const dashboardData = calculateDashboardMetrics(
      filteredImports,
      filteredSales,
      barcodeData,
      productData
    );

    return createResponse({
      status: "success",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    return createResponse({ error: error.message }, 500);
  }
}

/**
 * Lấy dữ liệu từ sheet
 */
function getSheetData(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }
  return sheet.getDataRange().getValues();
}

/**
 * Lọc dữ liệu theo khoảng thời gian
 */
function filterDataByTimeRange(data, range) {
  if (range === "all") {
    return data.slice(1); // Bỏ qua header
  }

  const now = new Date();
  const filteredData = [];

  for (let i = 1; i < data.length; i++) {
    // Bỏ qua header
    const row = data[i];
    const date = new Date(row[0]); // Giả sử cột đầu tiên là ngày

    let include = false;
    switch (range) {
      case "today":
        include = isSameDay(date, now);
        break;
      case "last7days":
        include = isWithinDays(date, now, 7);
        break;
      case "last30days":
        include = isWithinDays(date, now, 30);
        break;
      case "thisMonth":
        include = isSameMonth(date, now);
        break;
    }

    if (include) {
      filteredData.push(row);
    }
  }

  return filteredData;
}

/**
 * Kiểm tra cùng ngày
 */
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Kiểm tra trong khoảng ngày
 */
function isWithinDays(date, now, days) {
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

/**
 * Kiểm tra cùng tháng
 */
function isSameMonth(date1, date2) {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Tính toán các chỉ số dashboard
 */
function calculateDashboardMetrics(imports, sales, barcodes, products) {
  // Tính tổng nhập
  const totalImports = imports.reduce((sum, row) => {
    return sum + (parseInt(row[2]) || 0); // Cột C - Số lượng
  }, 0);

  // Tính tổng bán
  const totalSales = sales.length;

  // Tính tồn kho
  const totalStock = barcodes.filter((row) => row[4] === "Trong Kho").length;

  // Tính doanh thu (giả sử mỗi sản phẩm có giá 100,000 VND)
  const totalRevenue = totalSales * 100000;

  // Top sản phẩm bán chạy
  const productSales = {};
  sales.forEach((row) => {
    const productName = row[2]; // Cột C - Tên Sản Phẩm
    productSales[productName] = (productSales[productName] || 0) + 1;
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, sales: count }));

  // Xu hướng bán hàng (7 ngày gần nhất)
  const salesByDay = {};
  sales.forEach((row) => {
    const date = new Date(row[0]);
    const dateStr = date.toLocaleDateString("vi-VN");
    salesByDay[dateStr] = (salesByDay[dateStr] || 0) + 1;
  });

  const salesTrend = Object.entries(salesByDay)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-7)
    .map(([date, count]) => ({ date, sales: count }));

  // Phân bố tồn kho
  const stockByProduct = {};
  barcodes.forEach((row) => {
    if (row[4] === "Trong Kho") {
      const productName = row[2]; // Cột C - Tên Sản Phẩm
      stockByProduct[productName] = (stockByProduct[productName] || 0) + 1;
    }
  });

  const stockDistribution = Object.entries(stockByProduct)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, stock: count }));

  // Hoạt động gần đây
  const recentActivity = [];

  // Thêm hoạt động bán hàng gần đây
  sales.slice(-5).forEach((row) => {
    recentActivity.push({
      time: new Date(row[0]).toLocaleTimeString("vi-VN"),
      action: "Bán hàng",
      product: row[2],
      barcode: row[1],
    });
  });

  // Thêm hoạt động nhập hàng gần đây
  imports.slice(-5).forEach((row) => {
    recentActivity.push({
      time: new Date(row[0]).toLocaleTimeString("vi-VN"),
      action: "Nhập hàng",
      product: row[1],
      quantity: row[2],
    });
  });

  // Sắp xếp theo thời gian
  recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
  recentActivity.splice(5); // Chỉ lấy 5 hoạt động gần nhất

  return {
    kpi: {
      totalImports,
      totalSales,
      totalStock,
      totalRevenue,
      importsTrend: "+12%", // Tạm thời hardcode
      salesTrend: "+8%",
      stockTrend: "Sản phẩm trong kho",
      revenueTrend: "+15%",
    },
    charts: {
      topProducts,
      salesTrend,
      stockDistribution,
    },
    tables: {
      products: topProducts.map((product) => ({
        name: product.name,
        imports: Math.floor(product.sales * 2), // Giả sử nhập gấp đôi bán
        sales: product.sales,
        stock: stockByProduct[product.name] || 0,
        revenue: product.sales * 100000,
      })),
    },
    recentActivity,
  };
}

/**
 * Tạo mã vạch mới dựa trên mã sản phẩm và số lượng (tự động không trùng lặp)
 */
function generateBarcodes(maSP, soLuong, spreadsheet) {
  try {
    const barcodeSheet = spreadsheet.getSheetByName(SHEETS.BARCODES);
    const barcodes = [];

    // Tìm số thứ tự lớn nhất hiện tại cho mã sản phẩm này
    let maxNumber = 0;
    const existingBarcodes = barcodeSheet.getDataRange().getValues();

    for (let i = 1; i < existingBarcodes.length; i++) {
      // Bỏ qua header
      const row = existingBarcodes[i];
      const barcode = row[0]; // Cột A - Mã Vạch
      const productCode = row[1]; // Cột B - Mã Sản Phẩm

      if (productCode === maSP && barcode) {
        // Tách số thứ tự từ mã vạch (ví dụ: MD-01-015 -> 15)
        const parts = barcode.toString().split("-");
        if (parts.length >= 3) {
          const number = parseInt(parts[2]);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    }

    // Tạo mã vạch mới (bắt đầu từ số tiếp theo)
    for (let i = 1; i <= soLuong; i++) {
      const newNumber = maxNumber + i;
      const barcode = `${maSP}-${newNumber.toString().padStart(3, "0")}`;
      barcodes.push(barcode);
    }

    return barcodes;
  } catch (error) {
    console.error("Lỗi khi tạo mã vạch:", error);
    throw new Error("Không thể tạo mã vạch");
  }
}

/**
 * Tạo response JSON với CORS headers
 */
function createResponse(data, statusCode = 200) {
  const response = ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);

  // Thêm CORS headers để cho phép frontend truy cập
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return response;
}

/**
 * Hàm test để kiểm tra kết nối
 */
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = spreadsheet.getSheets();

    console.log("Kết nối thành công!");
    console.log("Các sheet có sẵn:");
    sheets.forEach((sheet) => {
      console.log("- " + sheet.getName());
    });

    return true;
  } catch (error) {
    console.error("Lỗi kết nối:", error);
    return false;
  }
}

/**
 * Hàm setup ban đầu - chạy một lần để tạo cấu trúc sheet
 */
function setupInitialStructure() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Tạo sheet DANH SACH BARCODE nếu chưa có
    let barcodeSheet = spreadsheet.getSheetByName(SHEETS.BARCODES);
    if (!barcodeSheet) {
      barcodeSheet = spreadsheet.insertSheet(SHEETS.BARCODES);

      // Tạo headers
      barcodeSheet
        .getRange("A1:E1")
        .setValues([
          ["Mã Vạch", "Mã Sản Phẩm", "Tên Sản Phẩm", "Ngày Nhập", "Trạng Thái"],
        ]);

      // Format headers
      barcodeSheet
        .getRange("A1:E1")
        .setBackground("#2c3e50")
        .setFontColor("white")
        .setFontWeight("bold");

      console.log("Đã tạo sheet DANH SACH BARCODE");
    }

    // Tạo sheet BÁN nếu chưa có
    let salesSheet = spreadsheet.getSheetByName(SHEETS.SALES);
    if (!salesSheet) {
      salesSheet = spreadsheet.insertSheet(SHEETS.SALES);

      // Tạo headers
      salesSheet
        .getRange("A1:D1")
        .setValues([["Ngày Bán", "Mã Vạch Đã Bán", "Tên Sản Phẩm", "Ghi Chú"]]);

      // Format headers
      salesSheet
        .getRange("A1:D1")
        .setBackground("#2c3e50")
        .setFontColor("white")
        .setFontWeight("bold");

      console.log("Đã tạo sheet BÁN");
    }

    // Kiểm tra và format sheet DANH MUC SAN PHAM
    const productSheet = spreadsheet.getSheetByName(SHEETS.PRODUCTS);
    if (productSheet) {
      // Format headers nếu chưa có
      const headerRange = productSheet.getRange("A1:B1");
      if (headerRange.getBackground() !== "#2c3e50") {
        headerRange
          .setBackground("#2c3e50")
          .setFontColor("white")
          .setFontWeight("bold");
      }
    }

    console.log("Setup hoàn tất!");
  } catch (error) {
    //script.google.com/macros/s/AKfycbydbk9W3PEYohuaZu-D8-pg9xArS4nk-F7UEejqEcn0Az0rb9nEEwSw0DkO-7RvNpLFMw/exec
    https: console.error("Lỗi setup:", error);
  }
}

/**
 * Hàm xử lý OPTIONS request cho CORS
 */
function doOptions(e) {
  return createResponse({}, 200);
}
