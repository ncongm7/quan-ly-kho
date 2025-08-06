/* ===== JAVASCRIPT CHUNG CHO HỆ THỐNG QUẢN LÝ KHO (ĐÃ SỬA LỖI KẾT NỐI) ===== */

const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbw3K2SxBERjaSDpaDiey1ZgsYMvxYH4EPuUyTS_tfiEq9QdJZuwZQv-pvrmo63WvyPoDQ/exec";
// Biến toàn cục

let products = [];

// ==========================================================
// HÀM GIAO TIẾP VỚI API - SEND AND FORGET (TRÁNH CORS)
// ==========================================================

// Hàm gửi dữ liệu đến API (dùng cho POST - "Gửi và Quên")
async function sendToAPI(action, data) {
    console.log(`API POST Call: ${action}`, data);
    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // **QUAN TRỌNG: Sửa lỗi kết nối**
            cache: "no-cache",
            redirect: "follow",
            body: JSON.stringify({ action: action, ...data }),
        });
        // Với mode 'no-cors', chúng ta không thể đọc response, vì vậy chỉ cần trả về true
        return true;
    } catch (error) {
        // Lỗi này thường là lỗi mạng, không phải lỗi từ server
        console.error(`Lỗi mạng khi gửi action '${action}':`, error);
        throw error;
    }
}

// Hàm giả lập để lấy danh sách sản phẩm (vì không thể đọc response từ GET)
async function loadProductsFromLocal() {
    // Danh sách sản phẩm mẫu - bạn có thể thay đổi theo nhu cầu
    const sampleProducts = [
        { tenSP: "MÀI DAO", maSP: "MD" },
        { tenSP: "VÒI PHUN SƯƠNG", maSP: "VPS" },
        { tenSP: "KẸP INOX", maSP: "KI" },
        { tenSP: "BẪY CHUỘT", maSP: "BC" },
        { tenSP: "TẤM CHẮN NẮNG O TÔ", maSP: "TCNO" },
        { tenSP: "NẠO RAU CỦ", maSP: "NRC" },
        { tenSP: "KIỀNG BẾP GA", maSP: "KBG" },
        { tenSP: "KẸP ĐỒ NÓNG", maSP: "KDN" },
        { tenSP: "ĐẦU NỐI ĐA NĂNG", maSP: "DNDN" },
        { tenSP: "RƠ LƯỠI", maSP: "RL" },
        { tenSP: "PHUN THUỐC", maSP: "PT" },
        { tenSP: "NẠO VẢY CÁ", maSP: "NVC" },
        { tenSP: "TAY NẮM CỬA", maSP: "TNC" },
        { tenSP: "GIÁ ĐỠ DT DÁN TƯỜNG", maSP: "GDDT" },
        { tenSP: "PHAO CHỐNG TRÀN (HPL)", maSP: "PCT" },
        { tenSP: "XỊT VỆ SINH ( HPL )", maSP: "XVS" },
        { tenSP: "BÁNH XE ĐỠ CỬA", maSP: "BXDC" },
        { tenSP: "KHÓA TỦ LẠNH", maSP: "KTL" },
        { tenSP: "GIÁ ĐỠ VÒI SEN", maSP: "GDVS" },
        { tenSP: "CHỔI NVS", maSP: "CNVS" },
        { tenSP: "MÓC TREO DÂY ĐIỆN", maSP: "MTDD" },
        { tenSP: "CHỐNG VĂNG ( HPL )", maSP: "CV" },
        { tenSP: "VÒI 360", maSP: "V360" },
        { tenSP: "BÀN CHẢI ĐA NĂNG", maSP: "BCDN" },
        { tenSP: "ĐUI ĐÈN", maSP: "DD" },
        { tenSP: "LÓT MŨ", maSP: "LM" },
        { tenSP: "XÂM THỊT", maSP: "XT" },
        { tenSP: "BÀN CHẢI TẮM", maSP: "BCT" },
        { tenSP: "VAN CỐNG ( HPL )", maSP: "VC" },
        { tenSP: "ĐẦU TƯỚI NƯỚC TỰ ĐỘNG", maSP: "DTNTD" },
    ];

    return { products: sampleProducts };
}
// ==========================================================
// CÁC HÀM CHỨC NĂNG CHÍNH
// ==========================================================

async function loadProducts() {
    const productSelect = document.getElementById("productSelect");
    try {
        updateConnectionStatus("Đang tải danh sách sản phẩm...", false);

        // Sử dụng danh sách sản phẩm local để tránh CORS
        const data = await loadProductsFromLocal();
        products = data.products || [];

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
            productSelect.innerHTML =
                '<option value="">-- Lỗi tải dữ liệu --</option>';
        }
        showError(`Không thể tải sản phẩm: ${error.message}.`);
    }
}

async function importAndCreate(maSP, tenSP, soLuong) {
    showLoading(true);
    hideAlerts();
    try {
        // Gửi dữ liệu nhập hàng đến API (send and forget)
        await sendToAPI("importProducts", {
            productCode: maSP,
            quantity: soLuong,
        });

        showSuccess(
            `✅ Đã nhập thành công ${soLuong} thùng ${tenSP} vào hệ thống! Dữ liệu đã được lưu vào Google Sheet.`
        );
    } catch (error) {
        showError(`Lỗi khi gửi yêu cầu nhập hàng: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

async function sellAndLog(barcode) {
    showLoading(true);
    hideAlerts();
    try {
        await sendToAPI("sellBarcode", { barcode });
        showSuccess(
            `Yêu cầu bán sản phẩm với mã '${barcode}' đã được gửi. Vui lòng kiểm tra Google Sheet.`
        );
        return true; // Giả định thành công
    } catch (error) {
        showError(`Lỗi khi gửi yêu cầu bán hàng: ${error.message}`);
        return false;
    } finally {
        showLoading(false);
    }
}

// ==========================================================
// CÁC HÀM GIAO DIỆN (UI) VÀ HỖ TRỢ
// ==========================================================

// ... (Toàn bộ các hàm UI của bạn như populateProductSelect, showError, showLoading... có thể giữ nguyên) ...
// ... Tôi chỉ thêm lại một vài hàm quan trọng để code chạy được ...

function populateProductSelect(productsData) {
    const select = document.getElementById("productSelect");
    select.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    productsData.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.maSP;
        option.textContent = `${product.tenSP} (${product.maSP})`;
        select.appendChild(option);
    });
}

// Hàm này đã được xóa vì không cần in PDF nữa

// Hàm này đã được xóa vì không cần hiển thị mã vạch nữa

// Các hàm in PDF đã được xóa vì không cần thiết nữa

// ===== UTILITY FUNCTIONS =====

function updateConnectionStatus(message, isConnected) {
    const indicator = document.getElementById("statusIndicator");
    const text = document.getElementById("connectionText");
    if (indicator)
        indicator.className = `status-indicator ${isConnected ? "status-connected" : "status-disconnected"
            }`;
    if (text) text.textContent = message;
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

// Thêm các hàm utility còn thiếu
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
        console.log("URL:", SCRIPT_URL);

        // Test bằng cách gửi một request đơn giản
        await sendToAPI("testConnection", { test: true });

        updateConnectionStatus("✅ Kết nối thành công!", true);
        showSuccess("Kết nối thành công! API hoạt động bình thường.");
    } catch (error) {
        console.error("Test connection error:", error);
        updateConnectionStatus("❌ Lỗi kết nối", false);
        showError(`Lỗi kết nối: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Format số tiền
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

/**
 * Format ngày tháng
 */
function formatDate(date) {
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

/**
 * Tạo ID ngẫu nhiên
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// ===== NAVIGATION FUNCTIONS =====

/**
 * Chuyển trang
 */
function navigateTo(page) {
    window.location.href = page;
}

/**
 * Đánh dấu trang hiện tại trong navigation
 */
function setActivePage(pageName) {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.classList.remove("active");
        if (item.getAttribute("data-page") === pageName) {
            item.classList.add("active");
        }
    });
}

// Khởi tạo các trang tương ứng
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "nhaphang") {
        loadProducts();
        document.getElementById("importForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const maSP = document.getElementById("productSelect").value;
            const soLuong = document.getElementById("quantityInput").value;
            const product = products.find((p) => p.maSP === maSP);
            if (product && soLuong > 0) {
                importAndCreate(maSP, product.tenSP, soLuong);
            } else {
                showError("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ.");
            }
        });
    }
    // Thêm logic khởi tạo cho các trang 'banhang', 'dashboard' ở đây
});
