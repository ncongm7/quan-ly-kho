const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyA0UE65OgcEbEULFtwW8FmW9m9zpVpD447Xp8wTZX_FEMmXQSLoIXCYQkyFKP2-ZU73Q/exec"

let products = [];
let currentBarcodes = [];

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
// kêt nối đến google apps script
async function doGetApi(action) {
    const response = await fetch(SCRIPT_URL, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action }),
    });
    if (response.ok) {
        const productsData = await response.json();
        return productsData;
    } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

}

/// lấy danh sách sản phẩm
async function loadProducts() {
    const productSelect = document.getElementById("productSelect");
    try {
        updateConnectionStatus("Đang tải danh sách sản phẩm...", false);

        // 🟡 Gọi tới Google Apps Script
        const response = await doGetApi("getProducts", {});
        products = response || [];

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


// load trạng thái kết nối vào html
function updateConnectionStatus(message, isConnected) {
    const indicator = document.getElementById("statusIndicator");
    const text = document.getElementById("connectionText");
    if (indicator)
        indicator.className = `status-indicator ${isConnected ? "status-connected" : "status-disconnected"
            }`;
    if (text) text.textContent = message;
}

// tạo dữ liệu sản phẩm vào option
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