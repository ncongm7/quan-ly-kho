/* ===== JAVASCRIPT CHO CHỨC NĂNG BÁN HÀNG ===== */

// Biến cho scanner
let html5QrcodeScanner = null;
let isScanning = false;
let recentSales = [];

// ==========================================================
// HÀM KHỞI TẠO SCANNER
// ==========================================================

function initializeScanner() {
    try {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 300, height: 100 },
                aspectRatio: 1.0
            },
            false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        isScanning = true;
        updateScanResult('🔄 Sẵn sàng quét mã vạch...', 'info');

    } catch (error) {
        console.error('Lỗi khởi tạo scanner:', error);
        updateScanResult('❌ Không thể khởi tạo camera', 'error');
    }
}

// ==========================================================
// HÀM XỬ LÝ QUÉT MÃ VẠCH
// ==========================================================

async function onScanSuccess(decodedText, decodedResult) {
    console.log('Mã vạch quét được:', decodedText);

    let result = null;

    try {
        // Hiển thị loading
        showMessage('Đang xử lý mã vạch...', 'info');

        // Gửi dữ liệu đến Google Apps Script Web App
        console.log('Đang gửi request với barcode:', decodedText);

        const response = await fetch(API_CONFIG.SALES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                barcode: decodedText
            })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            result = responseData;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu:', error);
        showMessage('Lỗi kết nối đến server', 'error');
        result = { success: false, message: 'Lỗi kết nối đến server' };
    }

    // Dừng scanner
    if (html5QrcodeScanner && isScanning) {
        await html5QrcodeScanner.clear();
        isScanning = false;
    }

    // Cập nhật kết quả và lịch sử
    if (result && result.success) {
        updateScanResult(`✅ ${result.message}: ${result.product} (${result.barcode})`, 'success');
        addToRecentSales(result.barcode, 'Thành công');
        showMessage(result.message, 'success');
    } else {
        updateScanResult(`❌ ${result ? result.message : 'Lỗi kết nối'}`, 'error');
        addToRecentSales(decodedText, 'Thất bại');
        if (result) {
            showMessage(result.message, 'error');
        }
    }

    // Hiển thị nút quét lại
    document.getElementById('restartBtn').style.display = 'inline-block';
}

function onScanFailure(error) {
    // Không cần xử lý gì, scanner sẽ tiếp tục quét
}

// ==========================================================
// HÀM ĐIỀU KHIỂN SCANNER
// ==========================================================

function updateScanResult(message, type = 'info') {
    const resultDiv = document.getElementById('scanResult');
    if (resultDiv) {
        resultDiv.innerHTML = `<p>${message}</p>`;
        resultDiv.className = `scan-result ${type}`;
    }
}

async function restartScanner() {
    try {
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.style.display = 'none';

        updateScanResult('🔄 Khởi động lại camera...', 'info');

        if (html5QrcodeScanner) {
            await html5QrcodeScanner.clear();
        }

        setTimeout(() => {
            initializeScanner();
        }, 1000);

    } catch (error) {
        console.error('Lỗi khởi động lại scanner:', error);
        updateScanResult('❌ Lỗi khởi động lại camera', 'error');
    }
}

async function toggleCamera() {
    if (isScanning) {
        if (html5QrcodeScanner) {
            await html5QrcodeScanner.clear();
            isScanning = false;
        }
        updateScanResult('📹 Camera đã tắt', 'info');
        const toggleBtn = document.getElementById('toggleBtn');
        if (toggleBtn) toggleBtn.textContent = '📹 Bật Camera';
    } else {
        initializeScanner();
        const toggleBtn = document.getElementById('toggleBtn');
        if (toggleBtn) toggleBtn.textContent = '📹 Tắt Camera';
    }
}

// ==========================================================
// HÀM XỬ LÝ NHẬP MÃ VẠCH THỦ CÔNG
// ==========================================================

async function processManualBarcode() {
    const barcode = document.getElementById('manualBarcode').value.trim();

    if (!barcode) {
        showMessage('Vui lòng nhập mã vạch', 'error');
        return;
    }

    try {
        updateScanResult(`⏳ Đang xử lý: ${barcode}`, 'info');
        showMessage('Đang xử lý mã vạch...', 'info');

        // Gửi dữ liệu đến Google Apps Script Web App
        console.log('Đang gửi request với barcode:', barcode);

        const response = await fetch(API_CONFIG.SALES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                barcode: barcode
            })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        let result;
        if (response.ok) {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            result = responseData;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (result.success) {
            updateScanResult(`✅ ${result.message}: ${result.product} (${result.barcode})`, 'success');
            addToRecentSales(result.barcode, 'Thành công');
            const manualBarcode = document.getElementById('manualBarcode');
            if (manualBarcode) manualBarcode.value = '';
            showMessage(result.message, 'success');
        } else {
            updateScanResult(`❌ ${result.message}`, 'error');
            addToRecentSales(barcode, 'Thất bại');
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu:', error);
        updateScanResult(`❌ Lỗi kết nối đến server`, 'error');
        addToRecentSales(barcode, 'Thất bại');
        showMessage('Lỗi kết nối đến server', 'error');
    }
}

// ==========================================================
// HÀM QUẢN LÝ LỊCH SỬ BÁN HÀNG
// ==========================================================

function addToRecentSales(barcode, status) {
    const sale = {
        barcode: barcode,
        status: status,
        time: new Date().toLocaleTimeString('vi-VN')
    };

    recentSales.unshift(sale);

    // Giữ tối đa 10 giao dịch gần nhất
    if (recentSales.length > 10) {
        recentSales = recentSales.slice(0, 10);
    }

    updateRecentSalesDisplay();
}

function updateRecentSalesDisplay() {
    const container = document.getElementById('recentSales');
    if (!container) return;

    if (recentSales.length === 0) {
        container.innerHTML = '<p>Chưa có giao dịch nào</p>';
        return;
    }

    const table = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Thời Gian</th>
                    <th>Mã Vạch</th>
                    <th>Trạng Thái</th>
                </tr>
            </thead>
            <tbody>
                ${recentSales.map(sale => `
                    <tr>
                        <td>${sale.time}</td>
                        <td>${sale.barcode}</td>
                        <td>
                            <span style="color: ${sale.status === 'Thành công' ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                                ${sale.status}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// ==========================================================
// HÀM HIỂN THỊ THÔNG BÁO
// ==========================================================

function showMessage(message, type = 'info') {
    const alertElement = document.getElementById(type + 'Alert');
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.style.display = 'block';

        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }

    // Cũng log ra console
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ==========================================================
// HÀM KHỞI TẠO TRANG BÁN HÀNG
// ==========================================================

function initializeSalesPage() {
    console.log('Trang bán hàng đã load');

    // Test kết nối
    setTimeout(() => {
        testConnection();
    }, 1000);

    // Khởi tạo scanner sau khi trang load xong
    setTimeout(() => {
        initializeScanner();
    }, 2000);

    // Thêm event listener cho input thủ công
    const manualBarcode = document.getElementById('manualBarcode');
    if (manualBarcode) {
        manualBarcode.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                processManualBarcode();
            }
        });
    }
}

// Khởi tạo khi trang load
if (document.body.dataset.page === 'banhang') {
    document.addEventListener('DOMContentLoaded', initializeSalesPage);
} 