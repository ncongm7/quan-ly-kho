/* ===== JAVASCRIPT CHUNG CHO HỆ THỐNG QUẢN LÝ KHO (ĐÃ SỬA LỖI KẾT NỐI) ===== */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxZKv7i0rhenJbFZ9qsPJjlOMj5i8zQXHs7aBte_ZXPfMe3A3SoFUtJJ1ycODKSzhWsHQ/exec"

let products = [];
let currentBarcodes = [];

// ==========================================================
// HÀM GIAO TIẾP VỚI API - SEND AND FORGET (TRÁNH CORS)
// ==========================================================

// ==========================================================
// HÀM GIAO TIẾP VỚI API - SEND AND FORGET (TRÁNH CORS)
// ==========================================================

// Hàm gửi dữ liệu đến API và đọc response
async function sendToAPI(action, data) {
    console.log(`API POST Call: ${action}`, data);
    try {
        const response = await fetch(SCRIPT_URL, {
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

// Hàm giả lập để lấy danh sách sản phẩm (vì không thể đọc response từ GET)
// async function loadProductsFromLocal() {
//     // Danh sách sản phẩm mẫu - bạn có thể thay đổi theo nhu cầu
//     const sampleProducts = [
//         { tenSP: "MÀI DAO", maSP: "MD" },
//         { tenSP: "VÒI PHUN SƯƠNG", maSP: "VPS" },
//         { tenSP: "KẸP INOX", maSP: "KI" },
//         { tenSP: "BẪY CHUỘT", maSP: "BC" },
//         { tenSP: "TẤM CHẮN NẮNG O TÔ", maSP: "TCNO" },
//         { tenSP: "NẠO RAU CỦ", maSP: "NRC" },
//         { tenSP: "KIỀNG BẾP GA", maSP: "KBG" },
//         { tenSP: "KẸP ĐỒ NÓNG", maSP: "KDN" },
//         { tenSP: "ĐẦU NỐI ĐA NĂNG", maSP: "DNDN" },
//         { tenSP: "RƠ LƯỠI", maSP: "RL" },
//         { tenSP: "PHUN THUỐC", maSP: "PT" },
//         { tenSP: "NẠO VẢY CÁ", maSP: "NVC" },
//         { tenSP: "TAY NẮM CỬA", maSP: "TNC" },
//         { tenSP: "GIÁ ĐỠ DT DÁN TƯỜNG", maSP: "GDDT" },
//         { tenSP: "PHAO CHỐNG TRÀN (HPL)", maSP: "PCT" },
//         { tenSP: "XỊT VỆ SINH ( HPL )", maSP: "XVS" },
//         { tenSP: "BÁNH XE ĐỠ CỬA", maSP: "BXDC" },
//         { tenSP: "KHÓA TỦ LẠNH", maSP: "KTL" },
//         { tenSP: "GIÁ ĐỠ VÒI SEN", maSP: "GDVS" },
//         { tenSP: "CHỔI NVS", maSP: "CNVS" },
//         { tenSP: "MÓC TREO DÂY ĐIỆN", maSP: "MTDD" },
//         { tenSP: "CHỐNG VĂNG ( HPL )", maSP: "CV" },
//         { tenSP: "VÒI 360", maSP: "V360" },
//         { tenSP: "BÀN CHẢI ĐA NĂNG", maSP: "BCDN" },
//         { tenSP: "ĐUI ĐÈN", maSP: "DD" },
//         { tenSP: "LÓT MŨ", maSP: "LM" },
//         { tenSP: "XÂM THỊT", maSP: "XT" },
//         { tenSP: "BÀN CHẢI TẮM", maSP: "BCT" },
//         { tenSP: "VAN CỐNG ( HPL )", maSP: "VC" },
//         { tenSP: "ĐẦU TƯỚI NƯỚC TỰ ĐỘNG", maSP: "DTNTD" },
//     ];

//     return { products: sampleProducts };
// }

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

// Biến để tránh hỏi download nhiều lần
let isDownloadPrompted = false;
// Biến để tránh gọi importAndCreate nhiều lần cùng lúc
let isImporting = false;

async function importAndCreate(maSP, tenSP, soLuong) {
    // Kiểm tra nếu đang nhập hàng thì bỏ qua
    if (isImporting) {
        console.log("Đang nhập hàng, bỏ qua request này...");
        return;
    }

    console.log("=== BẮT ĐẦU NHẬP HÀNG ===");
    console.log("Mã SP:", maSP, "Tên SP:", tenSP, "Số lượng:", soLuong);

    isImporting = true;
    showLoading(true);
    hideAlerts();

    // Reset flag
    isDownloadPrompted = false;

    try {
        // Gửi dữ liệu nhập hàng đến API
        console.log("Gửi dữ liệu đến backend...");
        const response = await sendToAPI("importProducts", {
            maSP: maSP,
            tenSP: tenSP,
            soLuong: soLuong,
        });

        if (response.status === 'success') {
            console.log("✅ Nhập hàng thành công!");
            showSuccess(response.message || `✅ Đã nhập thành công ${soLuong} thùng ${tenSP} vào hệ thống!`);
        } else {
            throw new Error(response.message || 'Lỗi không xác định');
        }

        // Hỏi người dùng có muốn download PDF không (chỉ 1 lần)
        console.log("Chuẩn bị hỏi download PDF...");
        setTimeout(() => {
            if (!isDownloadPrompted) {
                console.log("Hiển thị dialog hỏi download...");
                isDownloadPrompted = true;
                if (confirm(`Bạn có muốn download PDF mã vạch cho ${soLuong} thùng ${tenSP} không?`)) {
                    console.log("Người dùng chọn download PDF");
                    generateAndDownloadBarcodes(maSP, tenSP, soLuong);
                } else {
                    console.log("Người dùng từ chối download PDF");
                }
            } else {
                console.log("Đã hỏi download rồi, bỏ qua...");
            }
        }, 1000);

    } catch (error) {
        console.error("Lỗi nhập hàng:", error);
        showError(`Lỗi khi gửi yêu cầu nhập hàng: ${error.message}`);
    } finally {
        showLoading(false);
        isImporting = false; // Reset flag
        console.log("=== KẾT THÚC NHẬP HÀNG ===");
    }
}

async function sellAndLog(barcode) {
    showLoading(true);
    hideAlerts();
    try {
        const response = await sendToAPI("sellBarcode", { barcode });
        if (response.status === 'success') {
            showSuccess(response.message || `Yêu cầu bán sản phẩm với mã '${barcode}' đã được gửi.`);
            return true;
        } else {
            showError(response.message || 'Lỗi không xác định');
            return false;
        }
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

        // Test bằng cách gửi một request đơn giản đến getProducts
        const response = await sendToAPI("getProducts", {});

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

// Hàm tạo và download PDF mã vạch
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

// Hàm tạo PDF mã vạch với jsPDF và JsBarcode
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



// Biến để tránh đăng ký event listener nhiều lần
let isFormListenerAdded = false;

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "nhaphang") {
        loadProducts();

        // Chỉ đăng ký event listener 1 lần
        if (!isFormListenerAdded) {
            isFormListenerAdded = true;
            console.log("Đăng ký event listener cho form nhập hàng...");

            document.getElementById("importForm").addEventListener("submit", (e) => {
                e.preventDefault();
                console.log("Form submitted - xử lý nhập hàng...");

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
    }
    // Thêm logic khởi tạo cho các trang 'banhang', 'dashboard' ở đây
});
