// Advanced Dashboard Module
class DashboardModule {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
    }

    async loadAdvancedDashboard() {
        app.currentModule = 'dashboard';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.renderAdvancedDashboard();
            this.startAutoRefresh();
        } catch (error) {
            app.showError('خطأ في تحميل لوحة التحكم: ' + error.message);
        }
    }

    async renderAdvancedDashboard() {
        const stats = await app.dbManager.getDashboardStats();
        const recentTransactions = await this.getRecentTransactions();
        const monthlyStats = await this.getMonthlyStats();
        const topPartners = await this.getTopPartners();
        const projectStatuses = await this.getProjectStatuses();

        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <!-- Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="page-header">
                            <h2>
                                <i class="fas fa-tachometer-alt me-2"></i>
                                لوحة التحكم المتقدمة
                            </h2>
                            <p class="mb-0">مرحباً بك في نظام إدارة الخزائن والتسويات</p>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Cards -->
                <div class="row mb-4">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="dashboard-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="card-value">${stats.totalPartners || 0}</div>
                                    <div class="card-label">إجمالي الشركاء</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="dashboard-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="card-value">${stats.totalProjects || 0}</div>
                                    <div class="card-label">إجمالي المشاريع</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-project-diagram"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="dashboard-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="card-value">${stats.totalTransactions || 0}</div>
                                    <div class="card-label">إجمالي المعاملات</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-exchange-alt"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="dashboard-card">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="card-value">${stats.totalSettlements || 0}</div>
                                    <div class="card-label">إجمالي التسويات</div>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-calculator"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Financial Overview -->
                <div class="row mb-4">
                    <div class="col-lg-6 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-chart-line me-2"></i>
                                نظرة مالية عامة
                            </h5>
                            <div class="row">
                                <div class="col-6">
                                    <div class="text-success">
                                        <div class="h4">${app.formatCurrency(stats.totalRevenue || 0)}</div>
                                        <small>إجمالي الإيرادات</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-danger">
                                        <div class="h4">${app.formatCurrency(stats.totalExpenses || 0)}</div>
                                        <small>إجمالي المصروفات</small>
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <div class="h5 ${(stats.netProfit || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                    ${app.formatCurrency(stats.netProfit || 0)}
                                </div>
                                <small>صافي الربح</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-6 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-vault me-2"></i>
                                حالة الخزائن
                            </h5>
                            <div class="text-primary">
                                <div class="h4">${app.formatCurrency(stats.totalCashboxBalance || 0)}</div>
                                <small>إجمالي رصيد الخزائن</small>
                            </div>
                            <div class="mt-3">
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar bg-primary" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts and Analytics -->
                <div class="row mb-4">
                    <div class="col-lg-8 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-chart-bar me-2"></i>
                                الإحصائيات الشهرية
                            </h5>
                            <div id="monthlyChart" style="height: 300px;">
                                <div class="text-center py-5">
                                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">سيتم عرض الرسم البياني هنا</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-pie-chart me-2"></i>
                                حالة المشاريع
                            </h5>
                            <div id="projectStatusChart" style="height: 300px;">
                                <div class="text-center py-5">
                                    <i class="fas fa-pie-chart fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">سيتم عرض الرسم البياني هنا</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activities and Top Partners -->
                <div class="row">
                    <div class="col-lg-8 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-clock me-2"></i>
                                آخر النشاطات
                            </h5>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>النشاط</th>
                                            <th>التاريخ</th>
                                            <th>المبلغ</th>
                                            <th>النوع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderRecentActivities(recentTransactions)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-trophy me-2"></i>
                                أفضل الشركاء
                            </h5>
                            <div class="list-group list-group-flush">
                                ${this.renderTopPartners(topPartners)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-bolt me-2"></i>
                                إجراءات سريعة
                            </h5>
                            <div class="row">
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-primary w-100" onclick="loadPartners()">
                                        <i class="fas fa-plus me-1"></i>
                                        إضافة شريك
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-success w-100" onclick="loadProjects()">
                                        <i class="fas fa-plus me-1"></i>
                                        إضافة مشروع
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-info w-100" onclick="loadTransactions()">
                                        <i class="fas fa-plus me-1"></i>
                                        إضافة معاملة
                                    </button>
                                </div>
                                <div class="col-md-3 mb-2">
                                    <button class="btn btn-warning w-100" onclick="loadSettlements()">
                                        <i class="fas fa-calculator me-1"></i>
                                        حساب التسويات
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts after rendering
        this.initializeCharts(monthlyStats, projectStatuses);
    }

    async getRecentTransactions() {
        try {
            const transactions = await app.dbManager.getAll('transactions');
            return transactions
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);
        } catch (error) {
            console.error('Error getting recent transactions:', error);
            return [];
        }
    }

    async getMonthlyStats() {
        try {
            const transactions = await app.dbManager.getAll('transactions');
            const monthlyData = {};
            
            transactions.forEach(transaction => {
                const date = new Date(transaction.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                
                if (transaction.transaction_type === 'income') {
                    monthlyData[monthKey].income += parseFloat(transaction.amount || 0);
                } else {
                    monthlyData[monthKey].expense += parseFloat(transaction.amount || 0);
                }
            });
            
            return monthlyData;
        } catch (error) {
            console.error('Error getting monthly stats:', error);
            return {};
        }
    }

    async getTopPartners() {
        try {
            const partners = await app.dbManager.getAll('partners');
            return partners
                .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0))
                .slice(0, 5);
        } catch (error) {
            console.error('Error getting top partners:', error);
            return [];
        }
    }

    async getProjectStatuses() {
        try {
            const projects = await app.dbManager.getAll('projects');
            const statuses = { active: 0, completed: 0, paused: 0 };
            
            projects.forEach(project => {
                statuses[project.status] = (statuses[project.status] || 0) + 1;
            });
            
            return statuses;
        } catch (error) {
            console.error('Error getting project statuses:', error);
            return { active: 0, completed: 0, paused: 0 };
        }
    }

    renderRecentActivities(transactions) {
        if (transactions.length === 0) {
            return `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        لا توجد نشاطات حديثة
                    </td>
                </tr>
            `;
        }

        return transactions.map(transaction => `
            <tr>
                <td>
                    <i class="fas ${transaction.transaction_type === 'income' ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'} me-2"></i>
                    ${transaction.description || 'معاملة مالية'}
                </td>
                <td>${app.formatDate(transaction.created_at)}</td>
                <td>${app.formatCurrency(transaction.amount || 0)}</td>
                <td>
                    <span class="badge ${transaction.transaction_type === 'income' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderTopPartners(partners) {
        if (partners.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="fas fa-users fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">لا توجد شركاء</p>
                </div>
            `;
        }

        return partners.map((partner, index) => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">${index + 1}. ${partner.name}</div>
                    <small class="text-muted">${partner.share_percentage || 0}% مشاركة</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold ${(partner.current_balance || 0) >= 0 ? 'text-success' : 'text-danger'}">
                        ${app.formatCurrency(partner.current_balance || 0)}
                    </div>
                    <small class="text-muted">الرصيد</small>
                </div>
            </div>
        `).join('');
    }

    initializeCharts(monthlyStats, projectStatuses) {
        // This would be implemented with a charting library like Chart.js
        // For now, we'll show placeholder content
        console.log('Charts would be initialized here with:', { monthlyStats, projectStatuses });
    }

    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.renderAdvancedDashboard();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Initialize dashboard module
const dashboardModule = new DashboardModule();

// Global function for navigation
window.loadAdvancedDashboard = () => dashboardModule.loadAdvancedDashboard();