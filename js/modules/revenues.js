// Revenues Management Module
class RevenuesModule {
    constructor() {
        this.currentRevenues = [];
    }

    async loadRevenuesModule() {
        app.currentModule = 'revenues';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadRevenues();
            this.renderRevenuesPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات الإيرادات: ' + error.message);
        }
    }

    async loadRevenues() {
        this.currentRevenues = await app.dbManager.getAll('revenues');
        
        // Load customer names for each revenue
        for (let revenue of this.currentRevenues) {
            if (revenue.customer_id) {
                try {
                    const customer = await app.dbManager.get('customers', revenue.customer_id);
                    revenue.customer_name = customer ? customer.name : 'غير محدد';
                } catch (error) {
                    revenue.customer_name = 'غير محدد';
                }
            } else {
                revenue.customer_name = 'غير محدد';
            }
        }
    }

    renderRevenuesPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-chart-line me-2"></i>
                            إدارة الإيرادات
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="revenuesModule.showAddRevenueModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة إيراد جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="revenueSearch" 
                                       placeholder="البحث في الإيرادات..." onkeyup="revenuesModule.searchRevenues()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="categoryFilter" onchange="revenuesModule.filterByCategory()">
                                <option value="">جميع الفئات</option>
                                <option value="sales">مبيعات</option>
                                <option value="services">خدمات</option>
                                <option value="consulting">استشارات</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-secondary" onclick="revenuesModule.exportRevenues()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="revenuesTableContainer">
                    ${this.renderRevenuesTable()}
                </div>
            </div>
        `;
    }

    renderRevenuesTable() {
        if (this.currentRevenues.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد إيرادات مسجلة</h5>
                    <p class="text-muted">قم بإضافة إيراد جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['الوصف', 'العميل', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء'];
        
        const tableData = this.currentRevenues.map(revenue => ({
            description: revenue.description,
            customer: revenue.customer_name,
            amount: app.formatCurrency(revenue.amount || 0),
            category: this.getCategoryBadge(revenue.category),
            date: app.formatDate(revenue.date),
            created_at: app.formatDate(revenue.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `revenuesModule.viewRevenueDetails(${revenue.revenue_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `revenuesModule.editRevenue(${revenue.revenue_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `revenuesModule.deleteRevenue(${revenue.revenue_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    getCategoryBadge(category) {
        const badges = {
            'sales': '<span class="badge bg-success">مبيعات</span>',
            'services': '<span class="badge bg-info">خدمات</span>',
            'consulting': '<span class="badge bg-warning">استشارات</span>',
            'other': '<span class="badge bg-secondary">أخرى</span>'
        };
        return badges[category] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async showAddRevenueModal() {
        const customers = await app.dbManager.getAll('customers');
        const customerOptions = customers.map(customer => 
            `<option value="${customer.customer_id}">${customer.name}</option>`
        ).join('');

        const modalContent = `
            <form id="addRevenueForm">
                <div class="mb-3">
                    <label for="revenueDescription" class="form-label">الوصف *</label>
                    <input type="text" class="form-control" id="revenueDescription" required>
                </div>
                <div class="mb-3">
                    <label for="revenueCustomer" class="form-label">العميل</label>
                    <select class="form-select" id="revenueCustomer">
                        <option value="">اختر العميل...</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="revenueAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="revenueAmount" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="revenueCategory" class="form-label">الفئة *</label>
                    <select class="form-select" id="revenueCategory" required>
                        <option value="">اختر الفئة...</option>
                        <option value="sales">مبيعات</option>
                        <option value="services">خدمات</option>
                        <option value="consulting">استشارات</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="revenueDate" class="form-label">تاريخ الإيراد *</label>
                    <input type="date" class="form-control" id="revenueDate" required>
                </div>
                <div class="mb-3">
                    <label for="revenueNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="revenueNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة إيراد جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="revenuesModule.saveRevenue()">
                    <i class="fas fa-save me-1"></i>
                    حفظ الإيراد
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async saveRevenue() {
        const formData = {
            description: document.getElementById('revenueDescription').value.trim(),
            customer_id: document.getElementById('revenueCustomer').value ? parseInt(document.getElementById('revenueCustomer').value) : null,
            amount: parseFloat(document.getElementById('revenueAmount').value) || 0,
            category: document.getElementById('revenueCategory').value,
            date: document.getElementById('revenueDate').value,
            notes: document.getElementById('revenueNotes').value.trim(),
            created_at: new Date().toISOString()
        };

        if (!formData.description || !formData.amount || !formData.category || !formData.date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.addRevenue(formData);
            app.showSuccess('تم إضافة الإيراد بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadRevenuesModule();
        } catch (error) {
            app.showError('خطأ في إضافة الإيراد: ' + error.message);
        }
    }

    async editRevenue(revenueId) {
        const revenue = await app.dbManager.get('revenues', revenueId);
        if (!revenue) {
            app.showError('الإيراد غير موجود');
            return;
        }

        const customers = await app.dbManager.getAll('customers');
        const customerOptions = customers.map(customer => 
            `<option value="${customer.customer_id}" ${revenue.customer_id === customer.customer_id ? 'selected' : ''}>${customer.name}</option>`
        ).join('');

        const modalContent = `
            <form id="editRevenueForm">
                <input type="hidden" id="editRevenueId" value="${revenue.revenue_id}">
                <div class="mb-3">
                    <label for="editRevenueDescription" class="form-label">الوصف *</label>
                    <input type="text" class="form-control" id="editRevenueDescription" value="${revenue.description}" required>
                </div>
                <div class="mb-3">
                    <label for="editRevenueCustomer" class="form-label">العميل</label>
                    <select class="form-select" id="editRevenueCustomer">
                        <option value="">اختر العميل...</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editRevenueAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="editRevenueAmount" value="${revenue.amount}" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="editRevenueCategory" class="form-label">الفئة *</label>
                    <select class="form-select" id="editRevenueCategory" required>
                        <option value="">اختر الفئة...</option>
                        <option value="sales" ${revenue.category === 'sales' ? 'selected' : ''}>مبيعات</option>
                        <option value="services" ${revenue.category === 'services' ? 'selected' : ''}>خدمات</option>
                        <option value="consulting" ${revenue.category === 'consulting' ? 'selected' : ''}>استشارات</option>
                        <option value="other" ${revenue.category === 'other' ? 'selected' : ''}>أخرى</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editRevenueDate" class="form-label">تاريخ الإيراد *</label>
                    <input type="date" class="form-control" id="editRevenueDate" value="${revenue.date}" required>
                </div>
                <div class="mb-3">
                    <label for="editRevenueNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editRevenueNotes" rows="3">${revenue.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل الإيراد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="revenuesModule.updateRevenue()">
                    <i class="fas fa-save me-1"></i>
                    حفظ التغييرات
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async updateRevenue() {
        const revenueId = parseInt(document.getElementById('editRevenueId').value);
        const revenue = await app.dbManager.get('revenues', revenueId);
        
        if (!revenue) {
            app.showError('الإيراد غير موجود');
            return;
        }

        const updatedData = {
            ...revenue,
            description: document.getElementById('editRevenueDescription').value.trim(),
            customer_id: document.getElementById('editRevenueCustomer').value ? parseInt(document.getElementById('editRevenueCustomer').value) : null,
            amount: parseFloat(document.getElementById('editRevenueAmount').value) || 0,
            category: document.getElementById('editRevenueCategory').value,
            date: document.getElementById('editRevenueDate').value,
            notes: document.getElementById('editRevenueNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.description || !updatedData.amount || !updatedData.category || !updatedData.date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.update('revenues', updatedData);
            app.showSuccess('تم تحديث الإيراد بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadRevenuesModule();
        } catch (error) {
            app.showError('خطأ في تحديث الإيراد: ' + error.message);
        }
    }

    async viewRevenueDetails(revenueId) {
        const revenue = await app.dbManager.get('revenues', revenueId);
        if (!revenue) {
            app.showError('الإيراد غير موجود');
            return;
        }

        let customerName = 'غير محدد';
        if (revenue.customer_id) {
            try {
                const customer = await app.dbManager.get('customers', revenue.customer_id);
                customerName = customer ? customer.name : 'غير محدد';
            } catch (error) {
                customerName = 'غير محدد';
            }
        }

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>المعلومات الأساسية</h6>
                    <table class="table table-sm">
                        <tr><td><strong>الوصف:</strong></td><td>${revenue.description}</td></tr>
                        <tr><td><strong>العميل:</strong></td><td>${customerName}</td></tr>
                        <tr><td><strong>المبلغ:</strong></td><td>${app.formatCurrency(revenue.amount || 0)}</td></tr>
                        <tr><td><strong>الفئة:</strong></td><td>${this.getCategoryBadge(revenue.category)}</td></tr>
                        <tr><td><strong>التاريخ:</strong></td><td>${app.formatDate(revenue.date)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(revenue.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${revenue.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل الإيراد - ${revenue.description}`, modalContent);
    }

    async deleteRevenue(revenueId) {
        const confirmed = await app.showConfirm(
            'حذف الإيراد',
            'هل أنت متأكد من حذف هذا الإيراد؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('revenues', revenueId);
                app.showSuccess('تم حذف الإيراد بنجاح');
                await this.loadRevenuesModule();
            } catch (error) {
                app.showError('خطأ في حذف الإيراد: ' + error.message);
            }
        }
    }

    searchRevenues() {
        const searchTerm = document.getElementById('revenueSearch').value.toLowerCase();
        const filteredRevenues = this.currentRevenues.filter(revenue => 
            revenue.description.toLowerCase().includes(searchTerm) ||
            revenue.customer_name.toLowerCase().includes(searchTerm) ||
            (revenue.notes && revenue.notes.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredRevenues(filteredRevenues);
    }

    filterByCategory() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('revenueSearch').value.toLowerCase();
        
        let filteredRevenues = this.currentRevenues;
        
        if (categoryFilter) {
            filteredRevenues = filteredRevenues.filter(revenue => revenue.category === categoryFilter);
        }
        
        if (searchTerm) {
            filteredRevenues = filteredRevenues.filter(revenue => 
                revenue.description.toLowerCase().includes(searchTerm) ||
                revenue.customer_name.toLowerCase().includes(searchTerm) ||
                (revenue.notes && revenue.notes.toLowerCase().includes(searchTerm))
            );
        }

        this.renderFilteredRevenues(filteredRevenues);
    }

    renderFilteredRevenues(filteredRevenues) {
        const container = document.getElementById('revenuesTableContainer');
        
        if (filteredRevenues.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['الوصف', 'العميل', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء'];
        
        const tableData = filteredRevenues.map(revenue => ({
            description: revenue.description,
            customer: revenue.customer_name,
            amount: app.formatCurrency(revenue.amount || 0),
            category: this.getCategoryBadge(revenue.category),
            date: app.formatDate(revenue.date),
            created_at: app.formatDate(revenue.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `revenuesModule.viewRevenueDetails(${revenue.revenue_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `revenuesModule.editRevenue(${revenue.revenue_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `revenuesModule.deleteRevenue(${revenue.revenue_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportRevenues() {
        try {
            const csvContent = this.convertToCSV(this.currentRevenues);
            this.downloadCSV(csvContent, 'revenues.csv');
            app.showSuccess('تم تصدير بيانات الإيرادات بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['الوصف', 'العميل', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء', 'ملاحظات'];
        const csvData = data.map(revenue => [
            revenue.description,
            revenue.customer_name,
            revenue.amount || 0,
            revenue.category,
            revenue.date,
            revenue.created_at,
            revenue.notes || ''
        ]);
        
        return [headers, ...csvData].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize revenues module
const revenuesModule = new RevenuesModule();

// Make module globally available
window.revenuesModule = revenuesModule;

// Global function for navigation
window.loadRevenuesModule = () => revenuesModule.loadRevenuesModule();