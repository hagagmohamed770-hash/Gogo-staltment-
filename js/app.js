// Main Application Logic
class TreasuryApp {
    constructor() {
        this.currentModule = 'dashboard';
        this.init();
    }

    async init() {
        // Wait for database to be ready
        await dbManager.init();
        
        // Load dashboard by default
        this.loadDashboard();
        
        // Add event listeners
        this.addEventListeners();
    }

    addEventListeners() {
        // Navigation event listeners are handled in HTML onclick attributes
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
            const stats = await dbManager.getDashboardStats();
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
                                    <div class="card-value">${stats.totalPartners}</div>
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
                                    <div class="card-value">${stats.totalProjects}</div>
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
                                    <div class="card-value">${stats.totalTransactions}</div>
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
                                    <div class="card-value">${stats.totalSettlements}</div>
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
                    <div class="col-lg-4 col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-chart-line me-2 text-success"></i>
                                    الإيرادات والمصروفات
                                </h5>
                                <div class="row">
                                    <div class="col-6">
                                        <div class="text-success">
                                            <h4>${this.formatCurrency(stats.totalRevenue)}</h4>
                                            <small>إجمالي الإيرادات</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-danger">
                                            <h4>${this.formatCurrency(stats.totalExpenses)}</h4>
                                            <small>إجمالي المصروفات</small>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <div class="text-center">
                                    <h5 class="${stats.netProfit >= 0 ? 'text-success' : 'text-danger'}">
                                        ${this.formatCurrency(stats.netProfit)}
                                    </h5>
                                    <small>صافي الربح</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-vault me-2 text-primary"></i>
                                    الخزائن
                                </h5>
                                <div class="text-center">
                                    <h3 class="text-primary">${this.formatCurrency(stats.totalCashboxBalance)}</h3>
                                    <small>إجمالي رصيد الخزائن</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4 col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-tasks me-2 text-info"></i>
                                    حالة المشاريع
                                </h5>
                                <div class="text-center">
                                    <h3 class="text-info">${stats.activeProjects}</h3>
                                    <small>المشاريع النشطة</small>
                                </div>
                                <div class="progress mt-2">
                                    <div class="progress-bar bg-info" 
                                         style="width: ${stats.totalProjects > 0 ? (stats.activeProjects / stats.totalProjects * 100) : 0}%">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-clock me-2"></i>
                                    آخر النشاطات
                                </h5>
                                <div id="recentActivities">
                                    <div class="text-center text-muted">
                                        <i class="fas fa-info-circle me-2"></i>
                                        سيتم عرض آخر النشاطات هنا
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation functions
    updateActiveNav() {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current module
        const currentNavItem = document.querySelector(`[onclick="load${this.currentModule.charAt(0).toUpperCase() + this.currentModule.slice(1)}()"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ar-EG');
    }

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

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Modal utilities
    showModal(title, content, size = 'modal-lg') {
        const modalId = 'appModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog ${size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = content;
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        return bootstrapModal;
    }

    // Confirmation dialog
    async confirm(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            const modal = this.showModal(title, `
                <div class="text-center">
                    <p>${message}</p>
                    <div class="mt-3">
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
            `, 'modal-sm');
            
            modal._element.addEventListener('hidden.bs.modal', () => {
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

// Initialize app
const app = new TreasuryApp();

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