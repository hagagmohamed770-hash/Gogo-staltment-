// Main Application Logic
class TreasuryApp {
    constructor() {
        this.currentModule = 'dashboard';
        this.dbManager = null;
    }

    async init() {
        try {
            // Wait for database to be ready
            this.dbManager = new DatabaseManager();
            await this.dbManager.init();
            
            // Load dashboard by default
            this.loadDashboard();
            
            // Add event listeners
            this.addEventListeners();
            
            console.log('تم تهيئة التطبيق بنجاح');
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.showError('خطأ في تهيئة التطبيق: ' + error.message);
        }
    }

    addEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('تم تحميل التطبيق بنجاح');
        });
    }

    // Dashboard
    async loadDashboard() {
        this.currentModule = 'dashboard';
        this.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        `;

        try {
            const stats = await this.dbManager.getDashboardStats();
            this.renderDashboard(stats);
        } catch (error) {
            this.showError('خطأ في تحميل لوحة التحكم: ' + error.message);
        }
    }

    renderDashboard(stats) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2 class="mb-3">
                            <i class="fas fa-tachometer-alt me-2"></i>
                            لوحة التحكم
                        </h2>
                    </div>
                </div>

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

                <div class="row mb-4">
                    <div class="col-lg-6 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-chart-line me-2"></i>
                                الإيرادات والمصروفات
                            </h5>
                            <div class="row">
                                <div class="col-6">
                                    <div class="text-success">
                                        <div class="h4">${this.formatCurrency(stats.totalRevenue || 0)}</div>
                                        <small>إجمالي الإيرادات</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-danger">
                                        <div class="h4">${this.formatCurrency(stats.totalExpenses || 0)}</div>
                                        <small>إجمالي المصروفات</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-6 mb-3">
                        <div class="dashboard-card">
                            <h5 class="card-title">
                                <i class="fas fa-vault me-2"></i>
                                الخزائن
                            </h5>
                            <div class="text-primary">
                                <div class="h4">${this.formatCurrency(stats.totalCashboxBalance || 0)}</div>
                                <small>إجمالي رصيد الخزائن</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colspan="3" class="text-center text-muted">
                                                لا توجد نشاطات حديثة
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation
    updateActiveNav() {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current module
        const currentNavLink = document.querySelector(`[onclick*="${this.currentModule}"]`);
        if (currentNavLink) {
            currentNavLink.classList.add('active');
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    // Alert functions
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showWarning(message) {
        this.showAlert(message, 'warning');
    }

    showInfo(message) {
        this.showAlert(message, 'info');
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer') || this.createAlertContainer();
        
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // Modal functions
    showModal(title, content, size = 'modal-lg') {
        return new Promise((resolve) => {
            const modalHTML = `
                <div class="modal fade" id="appModal" tabindex="-1">
                    <div class="modal-dialog ${size}">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${content}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal
            const existingModal = document.getElementById('appModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = new bootstrap.Modal(document.getElementById('appModal'));
            modal.show();
            
            document.getElementById('appModal').addEventListener('hidden.bs.modal', () => {
                resolve();
            });
        });
    }

    async showConfirm(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            const modalHTML = `
                <div class="modal fade" id="appModal" tabindex="-1">
                    <div class="modal-dialog modal-sm">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${message}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger me-2" onclick="window.confirmResult = true; bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();">
                                    <i class="fas fa-check me-1"></i>
                                    نعم
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="window.confirmResult = false; bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();">
                                    <i class="fas fa-times me-1"></i>
                                    لا
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal
            const existingModal = document.getElementById('appModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = new bootstrap.Modal(document.getElementById('appModal'));
            modal.show();
            
            document.getElementById('appModal').addEventListener('hidden.bs.modal', () => {
                resolve(window.confirmResult || false);
                delete window.confirmResult;
            });
        });
    }

    // Loading state
    showLoading(container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        `;
    }

    // Table utilities
    createTable(headers, data, actions = null) {
        let tableHTML = `
            <div class="table-container">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
        `;
        
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        
        if (actions) {
            tableHTML += '<th>الإجراءات</th>';
        }
        
        tableHTML += `
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        data.forEach(row => {
            tableHTML += '<tr>';
            Object.values(row).forEach(value => {
                tableHTML += `<td>${value}</td>`;
            });
            
            if (actions) {
                tableHTML += '<td>';
                actions.forEach(action => {
                    tableHTML += `
                        <button class="btn btn-sm ${action.class}" onclick="${action.onclick}" title="${action.title}">
                            <i class="${action.icon}"></i>
                        </button>
                    `;
                });
                tableHTML += '</td>';
            }
            
            tableHTML += '</tr>';
        });
        
        tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return tableHTML;
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TreasuryApp();
    app.init();
});

// Global functions for navigation
window.loadDashboard = () => app.loadDashboard();
window.loadPartners = () => window.loadPartnersModule();
window.loadProjects = () => window.loadProjectsModule();
window.loadTransactions = () => window.loadTransactionsModule();
window.loadSettlements = () => window.loadSettlementsModule();
window.loadCashboxes = () => window.loadCashboxesModule();
window.loadReports = () => window.loadReportsModule();
window.backupData = () => window.backupDataModule();
window.restoreData = () => window.restoreDataModule();

// System info function
window.showSystemInfo = () => {
    const systemInfo = {
        version: '1.0.0',
        database: 'IndexedDB',
        storage: navigator.storage ? 'Available' : 'Not Available',
        notifications: 'Push API' in window ? 'Supported' : 'Not Supported',
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
        cores: navigator.hardwareConcurrency || 'Unknown'
    };

    const modalContent = `
        <div class="row">
            <div class="col-md-6">
                <h6>معلومات النظام</h6>
                <table class="table table-sm">
                    <tr><td>الإصدار:</td><td>${systemInfo.version}</td></tr>
                    <tr><td>قاعدة البيانات:</td><td>${systemInfo.database}</td></tr>
                    <tr><td>التخزين:</td><td>${systemInfo.storage}</td></tr>
                    <tr><td>الإشعارات:</td><td>${systemInfo.notifications}</td></tr>
                    <tr><td>اللغة:</td><td>${systemInfo.language}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>معلومات المتصفح</h6>
                <table class="table table-sm">
                    <tr><td>المنصة:</td><td>${systemInfo.platform}</td></tr>
                    <tr><td>الذاكرة:</td><td>${systemInfo.memory}</td></tr>
                    <tr><td>المعالجات:</td><td>${systemInfo.cores}</td></tr>
                    <tr><td>الكوكيز:</td><td>${systemInfo.cookieEnabled ? 'مفعلة' : 'معطلة'}</td></tr>
                    <tr><td>الاتصال:</td><td>${systemInfo.onLine ? 'متصل' : 'غير متصل'}</td></tr>
                </table>
            </div>
        </div>
        <div class="mt-3">
            <h6>معلومات المتصفح التفصيلية</h6>
            <small class="text-muted">${systemInfo.userAgent}</small>
        </div>
    `;

    app.showModal('معلومات النظام', modalContent);
};