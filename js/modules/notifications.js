// Notifications and Alerts Module
class NotificationsModule {
    constructor() {
        this.notifications = [];
        this.settings = this.loadSettings();
        this.checkInterval = null;
    }

    loadSettings() {
        const defaultSettings = {
            enableNotifications: true,
            checkInterval: 60000, // 1 minute
            showLowBalance: true,
            showOverdueInvoices: true,
            showSettlementReminders: true,
            lowBalanceThreshold: 1000,
            overdueDays: 30
        };

        try {
            const saved = localStorage.getItem('notificationSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('Error loading notification settings:', error);
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    }

    async startMonitoring() {
        if (!this.settings.enableNotifications) return;

        try {
            // Initial check
            await this.checkNotifications();

            // Set up periodic checking
            this.checkInterval = setInterval(async () => {
                try {
                    await this.checkNotifications();
                } catch (error) {
                    console.error('Error in periodic notification check:', error);
                }
            }, this.settings.checkInterval);
        } catch (error) {
            console.error('Error starting notification monitoring:', error);
        }
    }

    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkNotifications() {
        try {
            const notifications = [];

            // Check low balance partners
            if (this.settings.showLowBalance) {
                try {
                    const lowBalanceNotifications = await this.checkLowBalancePartners();
                    notifications.push(...lowBalanceNotifications);
                } catch (error) {
                    console.error('Error checking low balance partners:', error);
                }
            }

            // Check overdue invoices
            if (this.settings.showOverdueInvoices) {
                try {
                    const overdueNotifications = await this.checkOverdueInvoices();
                    notifications.push(...overdueNotifications);
                } catch (error) {
                    console.error('Error checking overdue invoices:', error);
                }
            }

            // Check settlement reminders
            if (this.settings.showSettlementReminders) {
                try {
                    const settlementNotifications = await this.checkSettlementReminders();
                    notifications.push(...settlementNotifications);
                } catch (error) {
                    console.error('Error checking settlement reminders:', error);
                }
            }

            // Update notifications
            this.notifications = notifications;
            this.updateNotificationBadge();
            this.showNotifications();

        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    async checkLowBalancePartners() {
        const notifications = [];
        try {
            // Check if app and dbManager are available
            if (!window.app || !window.app.dbManager) {
                console.warn('App or dbManager not available for low balance check');
                return notifications;
            }

            const partners = await window.app.dbManager.getAll('partners');
            
            if (!partners || !Array.isArray(partners)) {
                console.warn('No partners data available');
                return notifications;
            }
            
            partners.forEach(partner => {
                if (partner && partner.current_balance !== undefined && partner.current_balance < this.settings.lowBalanceThreshold) {
                    const formattedBalance = window.app && window.app.formatCurrency ? 
                        window.app.formatCurrency(partner.current_balance) : 
                        `${partner.current_balance} جنيه`;
                    
                    notifications.push({
                        id: `low-balance-${partner.partner_id}`,
                        type: 'warning',
                        title: 'رصيد منخفض',
                        message: `رصيد الشريك ${partner.name} منخفض: ${formattedBalance}`,
                        timestamp: new Date().toISOString(),
                        action: () => this.viewPartnerDetails(partner.partner_id)
                    });
                }
            });
        } catch (error) {
            console.error('Error checking low balance partners:', error);
        }
        return notifications;
    }

    async checkOverdueInvoices() {
        const notifications = [];
        try {
            // Check if app and dbManager are available
            if (!window.app || !window.app.dbManager) {
                console.warn('App or dbManager not available for overdue invoices check');
                return notifications;
            }

            const invoices = await window.app.dbManager.getAll('invoices');
            const now = new Date();
            
            if (!invoices || !Array.isArray(invoices)) {
                console.warn('No invoices data available');
                return notifications;
            }
            
            invoices.forEach(invoice => {
                if (invoice && invoice.status === 'pending' && invoice.due_date) {
                    const dueDate = new Date(invoice.due_date);
                    const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysOverdue > this.settings.overdueDays) {
                        notifications.push({
                            id: `overdue-invoice-${invoice.invoice_id}`,
                            type: 'danger',
                            title: 'فاتورة متأخرة',
                            message: `الفاتورة رقم ${invoice.invoice_id} متأخرة ${daysOverdue} يوم`,
                            timestamp: new Date().toISOString(),
                            action: () => this.viewInvoiceDetails(invoice.invoice_id)
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error checking overdue invoices:', error);
        }
        return notifications;
    }

    async checkSettlementReminders() {
        const notifications = [];
        try {
            // Check if app and dbManager are available
            if (!window.app || !window.app.dbManager) {
                console.warn('App or dbManager not available for settlement reminders check');
                return notifications;
            }

            const projects = await window.app.dbManager.getAll('projects');
            
            if (!projects || !Array.isArray(projects)) {
                console.warn('No projects data available');
                return notifications;
            }
            
            for (const project of projects) {
                if (project && project.status === 'active') {
                    const partners = await window.app.dbManager.getByIndex('partners', 'project_id', project.project_id);
                    
                    if (partners.length >= 2) {
                        // Check if settlements are needed
                        const transactions = await window.app.dbManager.getByIndex('transactions', 'project_id', project.project_id);
                        const settlements = await window.app.dbManager.getByIndex('settlements', 'project_id', project.project_id);
                        
                        if (transactions.length > 0 && settlements.length === 0) {
                            notifications.push({
                                id: `settlement-reminder-${project.project_id}`,
                                type: 'info',
                                title: 'تذكير بالتسويات',
                                message: `مشروع ${project.name} يحتاج إلى تسويات`,
                                timestamp: new Date().toISOString(),
                                action: () => this.calculateSettlements(project.project_id)
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking settlement reminders:', error);
        }
        return notifications;
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = this.notifications.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    showNotifications() {
        if (this.notifications.length === 0) return;

        // Show toast notifications for new notifications
        this.notifications.slice(0, 3).forEach(notification => {
            this.showToast(notification);
        });
    }

    showToast(notification) {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toastId = `toast-${Date.now()}`;
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert">
                <div class="toast-header">
                    <i class="fas ${this.getNotificationIcon(notification.type)} me-2"></i>
                    <strong class="me-auto">${notification.title}</strong>
                    <small>${this.formatTimeAgo(notification.timestamp)}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${notification.message}
                    ${notification.action ? `
                        <div class="mt-2">
                            <button class="btn btn-sm btn-primary" onclick="notificationsModule.handleNotificationAction('${notification.id}')">
                                عرض التفاصيل
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.remove();
            }
        }, 10000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle text-success',
            'warning': 'fa-exclamation-triangle text-warning',
            'danger': 'fa-times-circle text-danger',
            'info': 'fa-info-circle text-info'
        };
        return icons[type] || icons.info;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'الآن';
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `منذ ${diffInDays} يوم`;
    }

    async handleNotificationAction(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.action) {
            notification.action();
        }
    }

    async viewPartnerDetails(partnerId) {
        // Navigate to partner details
        await window.loadPartnersModule();
        // This would be implemented to show specific partner details
    }

    async viewInvoiceDetails(invoiceId) {
        // Navigate to invoice details
        await window.loadTransactionsModule();
        // This would be implemented to show specific invoice details
    }

    async calculateSettlements(projectId) {
        // Navigate to settlements and calculate for specific project
        await window.loadSettlementsModule();
        // This would trigger settlement calculation for the specific project
    }

    showSettingsModal() {
        const modalContent = `
            <form id="notificationSettingsForm">
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="enableNotifications" 
                               ${this.settings.enableNotifications ? 'checked' : ''}>
                        <label class="form-check-label" for="enableNotifications">
                            تفعيل الإشعارات
                        </label>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="showLowBalance" 
                               ${this.settings.showLowBalance ? 'checked' : ''}>
                        <label class="form-check-label" for="showLowBalance">
                            تنبيهات الرصيد المنخفض
                        </label>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="showOverdueInvoices" 
                               ${this.settings.showOverdueInvoices ? 'checked' : ''}>
                        <label class="form-check-label" for="showOverdueInvoices">
                            تنبيهات الفواتير المتأخرة
                        </label>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="showSettlementReminders" 
                               ${this.settings.showSettlementReminders ? 'checked' : ''}>
                        <label class="form-check-label" for="showSettlementReminders">
                            تذكيرات التسويات
                        </label>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="lowBalanceThreshold" class="form-label">حد الرصيد المنخفض</label>
                        <input type="number" class="form-control" id="lowBalanceThreshold" 
                               value="${this.settings.lowBalanceThreshold}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="overdueDays" class="form-label">أيام التأخير</label>
                        <input type="number" class="form-control" id="overdueDays" 
                               value="${this.settings.overdueDays}">
                    </div>
                </div>
            </form>
        `;

        if (window.app && typeof window.app.showModal === 'function') {
            window.app.showModal('إعدادات الإشعارات', modalContent);
        } else {
            console.error('App or showModal not available');
        }
        
        // Add form submission handler
        document.getElementById('notificationSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettings();
        });
    }

    saveNotificationSettings() {
        this.settings = {
            enableNotifications: document.getElementById('enableNotifications').checked,
            showLowBalance: document.getElementById('showLowBalance').checked,
            showOverdueInvoices: document.getElementById('showOverdueInvoices').checked,
            showSettlementReminders: document.getElementById('showSettlementReminders').checked,
            lowBalanceThreshold: parseFloat(document.getElementById('lowBalanceThreshold').value) || 1000,
            overdueDays: parseInt(document.getElementById('overdueDays').value) || 30,
            checkInterval: this.settings.checkInterval
        };

        this.saveSettings();
        
        // Restart monitoring if needed
        if (this.settings.enableNotifications) {
            this.startMonitoring();
        } else {
            this.stopMonitoring();
        }

        if (window.app && typeof window.app.showSuccess === 'function') {
            window.app.showSuccess('تم حفظ إعدادات الإشعارات بنجاح');
        } else {
            console.log('تم حفظ إعدادات الإشعارات بنجاح');
        }
        bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
    }

    getNotificationCount() {
        return this.notifications.length;
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationBadge();
        if (window.app && typeof window.app.showSuccess === 'function') {
            window.app.showSuccess('تم مسح جميع الإشعارات');
        } else {
            console.log('تم مسح جميع الإشعارات');
        }
    }
}

// Initialize notifications module
const notificationsModule = new NotificationsModule();

// Start monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
    notificationsModule.startMonitoring();
});

// Global functions
window.showNotificationSettings = () => notificationsModule.showSettingsModal();
window.clearAllNotifications = () => notificationsModule.clearAllNotifications();