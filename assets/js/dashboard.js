/* ===== JAVASCRIPT CHO CHỨC NĂNG DASHBOARD ===== */

// Biến cho dashboard
let dashboardData = {};

// ==========================================================
// HÀM LOAD DỮ LIỆU DASHBOARD
// ==========================================================

async function loadDashboardData() {
    try {
        showLoading(true);
        updateConnectionStatus("Đang tải dữ liệu dashboard...", false);

        const response = await sendToAPI(API_CONFIG.DASHBOARD_URL, "getDashboardData", {});

        if (response.status === 'success') {
            dashboardData = response.data || {};
            updateDashboardDisplay();
            updateConnectionStatus("Đã kết nối", true);
        } else {
            throw new Error(response.message || 'Lỗi không xác định');
        }
    } catch (error) {
        console.error("Lỗi load dashboard:", error);
        updateConnectionStatus("Lỗi kết nối", false);
        showError(`Không thể tải dữ liệu dashboard: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// ==========================================================
// HÀM CẬP NHẬT HIỂN THỊ DASHBOARD
// ==========================================================

function updateDashboardDisplay() {
    // TODO: Implement dashboard display logic
    console.log("Dashboard data:", dashboardData);

    // Placeholder cho dashboard
    const dashboardContainer = document.getElementById('dashboardContent');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = `
            <div class="dashboard-grid">
                <div class="kpi-card">
                    <h3>Tổng Sản Phẩm</h3>
                    <div class="number">${dashboardData.totalProducts || 0}</div>
                    <div class="trend">+5% so với tháng trước</div>
                </div>
                <div class="kpi-card">
                    <h3>Đã Bán Hôm Nay</h3>
                    <div class="number">${dashboardData.todaySales || 0}</div>
                    <div class="trend">+12% so với hôm qua</div>
                </div>
                <div class="kpi-card">
                    <h3>Tổng Kho</h3>
                    <div class="number">${dashboardData.totalStock || 0}</div>
                    <div class="trend">-3% so với tuần trước</div>
                </div>
                <div class="kpi-card">
                    <h3>Doanh Thu</h3>
                    <div class="number">${formatCurrency(dashboardData.revenue || 0)}</div>
                    <div class="trend">+8% so với tháng trước</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>📊 Thống Kê Gần Đây</h3>
                <p style="text-align: center; color: #7f8c8d; padding: 40px;">
                    Dashboard đang được phát triển. Vui lòng quay lại sau!
                </p>
            </div>
        `;
    }
}

// ==========================================================
// HÀM KHỞI TẠO DASHBOARD
// ==========================================================

function initializeDashboard() {
    console.log("Khởi tạo dashboard...");

    // Load dữ liệu dashboard
    loadDashboardData();

    // TODO: Thêm các chức năng dashboard khác
}

// Khởi tạo khi trang load
if (document.body.dataset.page === 'dashboard') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} 