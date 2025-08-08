/* ===== JAVASCRIPT CHUNG CHO HỆ THỐNG QUẢN LÝ KHO ===== */

// Cấu hình API - CẬP NHẬT SAU KHI DEPLOY RIÊNG BIỆT
const API_CONFIG = {
    // URL cũ (tạm thời giữ lại để test)
    IMPORT_URL: "https://script.google.com/macros/s/AKfycbz1_yEY8FcKuNetaZZnWGwIHfIHpmqECYAz98zoPyLvL_86SaHXP_OfjFWGy8Xtqq_yLw/exec",
    SALES_URL: "https://script.google.com/macros/s/AKfycbyTcrjqRmezNn_DRNLUHKtBaFk3_E8Db0iJeB-tlkSgwjeZVV0oP1gkAb0RJ5Il8CjMmQ/exec",
    DASHBOARD_URL: "https://script.google.com/macros/s/AKfycbxZKv7i0rhenJbFZ9qsPJjlOMj5i8zQXHs7aBte_ZXPfMe3A3SoFUtJJ1ycODKSzhWsHQ/exec"


};

// Biến global
let products = [];
let currentBarcodes = [];

// ==========================================================
// HÀM GIAO TIẾP VỚI API
// ==========================================================

async function sendToAPI(url, action, data) {
    console.log(`API POST Call: ${action}`, data);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: action, ...data }),
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log(`API Response for ${action}:`, responseData);
            return responseData;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Lỗi khi gửi action '${action}':`, error);
        throw error;
    }
}

async function doGetApi(url, action) {
    try {
        const response = await fetch(`${url}?action=${action}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Lỗi khi gọi GET API '${action}':`, error);
        throw error;
    }
}

// ==========================================================
// HÀM LOAD DỮ LIỆU SẢN PHẨM
// ==========================================================

async function loadProducts() {
    const productSelect = document.getElementById("productSelect");
    try {
        updateConnectionStatus("Đang tải danh sách sản phẩm...", false);

        // Gọi tới Google Apps Script
        const response = await doGetApi(API_CONFIG.IMPORT_URL, "getProducts");
        products = response.products || [];

        if (productSelect) {
            populateProductSelect(products);
            productSelect.disabled = false;
        }

        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn) submitBtn.disabled = false;

        updateConnectionStatus("Đã kết nối", true);
    } catch (error) {
        updateConnectionStatus("Lỗi kết nối", false);
        if (productSelect) {
            productSelect.innerHTML = '<option value="">-- Lỗi tải dữ liệu --</option>';
        }
        showError(`Không thể tải sản phẩm: ${error.message}.`);
    }
}

// ==========================================================
// HÀM GIAO DIỆN (UI) CHUNG
// ==========================================================

function updateConnectionStatus(message, isConnected) {
    const indicator = document.getElementById("statusIndicator");
    const text = document.getElementById("connectionText");

    if (indicator) {
        indicator.className = `status-indicator ${isConnected ? "status-connected" : "status-disconnected"}`;
    }
    if (text) text.textContent = message;
}

function populateProductSelect(productsData) {
    const select = document.getElementById("productSelect");
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    productsData.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.maSP;
        option.textContent = `${product.tenSP} (${product.maSP})`;
        select.appendChild(option);
    });
}

function showLoading(show) {
    const loading = document.getElementById("loading");
    const submitBtn = document.getElementById("submitBtn");

    if (loading) loading.style.display = show ? "block" : "none";
    if (submitBtn) submitBtn.disabled = show;
}

function hideAlerts() {
    ["successAlert", "errorAlert", "infoAlert"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

function showAlert(id, message) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
    }
}

function showSuccess(message) {
    showAlert("successAlert", message);
}

function showError(message) {
    showAlert("errorAlert", message);
}

function showInfo(message) {
    showAlert("infoAlert", message);
}

// ==========================================================
// HÀM UTILITY
// ==========================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

function navigateTo(page) {
    window.location.href = page;
}

function setActivePage(pageName) {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.classList.remove("active");
        if (item.getAttribute("data-page") === pageName) {
            item.classList.add("active");
        }
    });
}

async function testConnection() {
    try {
        updateConnectionStatus("Đang test kết nối...", false);
        showLoading(true);

        console.log("=== TEST KẾT NỐI ===");

        // Test bằng cách gửi một request đơn giản
        const response = await sendToAPI(API_CONFIG.IMPORT_URL, "getProducts", {});

        if (response.products) {
            updateConnectionStatus("✅ Kết nối thành công!", true);
            showSuccess("Kết nối thành công! API hoạt động bình thường.");
        } else {
            throw new Error("Response không hợp lệ");
        }
    } catch (error) {
        console.error("Test connection error:", error);
        updateConnectionStatus("❌ Lỗi kết nối", false);
        showError(`Lỗi kết nối: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// ==========================================================
// HÀM TẠO VÀ IN MÃ VẠCH
// ==========================================================

function generateAndDownloadBarcodes(maSP, tenSP, soLuong) {
    try {
        // Tạo danh sách mã vạch
        const barcodes = [];
        for (let i = 1; i <= soLuong; i++) {
            const barcode = `${maSP}-${String(i).padStart(3, '0')}`;
            barcodes.push(barcode);
        }

        // Tạo PDF với jsPDF và JsBarcode
        printBarcodesPDF(barcodes, tenSP, maSP);

        showSuccess(`✅ Đã tạo và download PDF mã vạch cho ${soLuong} thùng ${tenSP}!`);

    } catch (error) {
        showError(`Lỗi khi tạo PDF: ${error.message}`);
    }
}

function printBarcodesPDF(barcodes, tenSP, maSP) {
    if (!barcodes || barcodes.length === 0) return;

    try {
        // Kiểm tra xem có thư viện jsPDF và JsBarcode không
        if (typeof window.jspdf === 'undefined' || typeof JsBarcode === 'undefined') {
            showError("Thư viện jsPDF hoặc JsBarcode chưa được tải. Vui lòng kiểm tra lại.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        // Thêm tiêu đề
        doc.setFontSize(16);
        doc.text(`📦 MÃ VẠCH SẢN PHẨM - ${tenSP} (${maSP})`, 10, 15);
        doc.setFontSize(10);
        doc.text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} | Số lượng: ${barcodes.length} thùng`, 10, 22);

        const BARCODE_WIDTH_MM = 120;
        const BARCODE_HEIGHT_MM = 50;
        const MARGIN = 10;
        let x = MARGIN,
            y = MARGIN + 30; // Bắt đầu sau tiêu đề

        const canvas = document.createElement("canvas");

        for (const code of barcodes) {
            JsBarcode(canvas, code, {
                format: "CODE128",
                width: 4,
                height: 160,
                displayValue: true,
                fontSize: 36,
                margin: 10,
            });
            const dataUrl = canvas.toDataURL("image/jpeg", 1.0);

            if (y + BARCODE_HEIGHT_MM > doc.internal.pageSize.getHeight() - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.addImage(
                dataUrl,
                "JPEG",
                x,
                y,
                BARCODE_WIDTH_MM,
                BARCODE_HEIGHT_MM
            );
            y += BARCODE_HEIGHT_MM + 5; // Khoảng cách giữa các mã
        }

        const filename = `barcodes_${maSP}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error("Lỗi khi tạo PDF:", error);
        showError(`Lỗi khi tạo PDF: ${error.message}`);
    }
}

// ==========================================================
// HÀM KHỞI TẠO CHUNG
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body && document.body.dataset ? document.body.dataset.page : null;
    console.log(`Trang ${page} đã load`);

    // Set active page
    if (page) {
        setActivePage(page);
    }

    // Khởi tạo theo từng trang
    switch (page) {
        case "nhaphang":
            loadProducts();
            break;
        case "banhang":
            // Khởi tạo scanner sau khi trang load xong
            setTimeout(() => {
                if (typeof initializeScanner === 'function') {
                    initializeScanner();
                }
            }, 2000);
            break;
        case "dashboard":
            // Khởi tạo dashboard
            if (typeof initializeDashboard === 'function') {
                initializeDashboard();
            }
            break;
    }

    // Test kết nối sau 1 giây
    setTimeout(() => {
        testConnection();
    }, 1000);
}); 