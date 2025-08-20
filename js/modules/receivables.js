// Receivables Management Module
class ReceivablesModule {
    constructor() {
        this.currentReceivables = [];
    }

    async loadReceivablesModule() {
        app.currentModule = 'receivables';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadReceivables();
            this.renderReceivablesPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات سندات القبض: ' + error.message);
        }
    }

    async loadReceivables() {
        this.currentReceivables = await app.dbManager.getAll('receivables');
        
        // Load customer names for each receivable
        for (let receivable of this.currentReceivables) {
            if (receivable.customer_id) {
                try {
                    const customer = await app.dbManager.get('customers', receivable.customer_id);
                    receivable.customer_name = customer ? customer.name : 'غير محدد';
                } catch (error) {
                    receivable.customer_name = 'غير محدد';
                }
            } else {
                receivable.customer_name = 'غير محدد';
            }
        }
    }

    renderReceivablesPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-hand-holding-usd me-2"></i>
                            إدارة سندات القبض
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="receivablesModule.showAddReceivableModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة سند قبض جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="receivableSearch" 
                                       placeholder="البحث في سندات القبض..." onkeyup="receivablesModule.searchReceivables()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="statusFilter" onchange="receivablesModule.filterByStatus()">
                                <option value="">جميع الحالات</option>
                                <option value="pending">معلق</option>
                                <option value="paid">مدفوع</option>
                                <option value="overdue">متأخر</option>
                            </select>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-secondary" onclick="receivablesModule.exportReceivables()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="receivablesTableContainer">
                    ${this.renderReceivablesTable()}
                </div>
            </div>
        `;
    }

    renderReceivablesTable() {
        if (this.currentReceivables.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-hand-holding-usd fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد سندات قبض مسجلة</h5>
                    <p class="text-muted">قم بإضافة سند قبض جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['رقم السند', 'العميل', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء'];
        
        const tableData = this.currentReceivables.map(receivable => ({
            number: receivable.receivable_number,
            customer: receivable.customer_name,
            amount: app.formatCurrency(receivable.amount || 0),
            due_date: app.formatDate(receivable.due_date),
            status: this.getStatusBadge(receivable.status),
            created_at: app.formatDate(receivable.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `receivablesModule.viewReceivableDetails(${receivable.receivable_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `receivablesModule.editReceivable(${receivable.receivable_id})`
            },
            {
                class: 'btn-success',
                icon: 'fas fa-check',
                title: 'تسديد',
                onclick: `receivablesModule.markAsPaid(${receivable.receivable_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `receivablesModule.deleteReceivable(${receivable.receivable_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge bg-warning">معلق</span>',
            'paid': '<span class="badge bg-success">مدفوع</span>',
            'overdue': '<span class="badge bg-danger">متأخر</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async showAddReceivableModal() {
        const customers = await app.dbManager.getAll('customers');
        const customerOptions = customers.map(customer => 
            `<option value="${customer.customer_id}">${customer.name}</option>`
        ).join('');

        const modalContent = `
            <form id="addReceivableForm">
                <div class="mb-3">
                    <label for="receivableNumber" class="form-label">رقم السند *</label>
                    <input type="text" class="form-control" id="receivableNumber" required>
                </div>
                <div class="mb-3">
                    <label for="receivableCustomer" class="form-label">العميل *</label>
                    <select class="form-select" id="receivableCustomer" required>
                        <option value="">اختر العميل...</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="receivableAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="receivableAmount" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="receivableDueDate" class="form-label">تاريخ الاستحقاق *</label>
                    <input type="date" class="form-control" id="receivableDueDate" required>
                </div>
                <div class="mb-3">
                    <label for="receivableDescription" class="form-label">الوصف</label>
                    <textarea class="form-control" id="receivableDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label for="receivableNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="receivableNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة سند قبض جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="receivablesModule.saveReceivable()">
                    <i class="fas fa-save me-1"></i>
                    حفظ السند
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async saveReceivable() {
        const formData = {
            receivable_number: document.getElementById('receivableNumber').value.trim(),
            customer_id: parseInt(document.getElementById('receivableCustomer').value),
            amount: parseFloat(document.getElementById('receivableAmount').value) || 0,
            due_date: document.getElementById('receivableDueDate').value,
            description: document.getElementById('receivableDescription').value.trim(),
            notes: document.getElementById('receivableNotes').value.trim(),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        if (!formData.receivable_number || !formData.customer_id || !formData.amount || !formData.due_date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.addReceivable(formData);
            app.showSuccess('تم إضافة سند القبض بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadReceivablesModule();
        } catch (error) {
            app.showError('خطأ في إضافة سند القبض: ' + error.message);
        }
    }

    async editReceivable(receivableId) {
        const receivable = await app.dbManager.get('receivables', receivableId);
        if (!receivable) {
            app.showError('سند القبض غير موجود');
            return;
        }

        const customers = await app.dbManager.getAll('customers');
        const customerOptions = customers.map(customer => 
            `<option value="${customer.customer_id}" ${receivable.customer_id === customer.customer_id ? 'selected' : ''}>${customer.name}</option>`
        ).join('');

        const modalContent = `
            <form id="editReceivableForm">
                <input type="hidden" id="editReceivableId" value="${receivable.receivable_id}">
                <div class="mb-3">
                    <label for="editReceivableNumber" class="form-label">رقم السند *</label>
                    <input type="text" class="form-control" id="editReceivableNumber" value="${receivable.receivable_number}" required>
                </div>
                <div class="mb-3">
                    <label for="editReceivableCustomer" class="form-label">العميل *</label>
                    <select class="form-select" id="editReceivableCustomer" required>
                        <option value="">اختر العميل...</option>
                        ${customerOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editReceivableAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="editReceivableAmount" value="${receivable.amount}" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="editReceivableDueDate" class="form-label">تاريخ الاستحقاق *</label>
                    <input type="date" class="form-control" id="editReceivableDueDate" value="${receivable.due_date}" required>
                </div>
                <div class="mb-3">
                    <label for="editReceivableStatus" class="form-label">الحالة</label>
                    <select class="form-select" id="editReceivableStatus">
                        <option value="pending" ${receivable.status === 'pending' ? 'selected' : ''}>معلق</option>
                        <option value="paid" ${receivable.status === 'paid' ? 'selected' : ''}>مدفوع</option>
                        <option value="overdue" ${receivable.status === 'overdue' ? 'selected' : ''}>متأخر</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editReceivableDescription" class="form-label">الوصف</label>
                    <textarea class="form-control" id="editReceivableDescription" rows="3">${receivable.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="editReceivableNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editReceivableNotes" rows="3">${receivable.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل سند القبض', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="receivablesModule.updateReceivable()">
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

    async updateReceivable() {
        const receivableId = parseInt(document.getElementById('editReceivableId').value);
        const receivable = await app.dbManager.get('receivables', receivableId);
        
        if (!receivable) {
            app.showError('سند القبض غير موجود');
            return;
        }

        const updatedData = {
            ...receivable,
            receivable_number: document.getElementById('editReceivableNumber').value.trim(),
            customer_id: parseInt(document.getElementById('editReceivableCustomer').value),
            amount: parseFloat(document.getElementById('editReceivableAmount').value) || 0,
            due_date: document.getElementById('editReceivableDueDate').value,
            status: document.getElementById('editReceivableStatus').value,
            description: document.getElementById('editReceivableDescription').value.trim(),
            notes: document.getElementById('editReceivableNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.receivable_number || !updatedData.customer_id || !updatedData.amount || !updatedData.due_date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.update('receivables', updatedData);
            app.showSuccess('تم تحديث سند القبض بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadReceivablesModule();
        } catch (error) {
            app.showError('خطأ في تحديث سند القبض: ' + error.message);
        }
    }

    async markAsPaid(receivableId) {
        const confirmed = await app.showConfirm(
            'تسديد السند',
            'هل أنت متأكد من تسديد هذا السند؟'
        );
        
        if (confirmed) {
            try {
                const receivable = await app.dbManager.get('receivables', receivableId);
                if (!receivable) {
                    app.showError('سند القبض غير موجود');
                    return;
                }

                receivable.status = 'paid';
                receivable.paid_date = new Date().toISOString();
                receivable.updated_at = new Date().toISOString();

                await app.dbManager.update('receivables', receivable);
                app.showSuccess('تم تسديد السند بنجاح');
                await this.loadReceivablesModule();
            } catch (error) {
                app.showError('خطأ في تسديد السند: ' + error.message);
            }
        }
    }

    async viewReceivableDetails(receivableId) {
        const receivable = await app.dbManager.get('receivables', receivableId);
        if (!receivable) {
            app.showError('سند القبض غير موجود');
            return;
        }

        let customerName = 'غير محدد';
        if (receivable.customer_id) {
            try {
                const customer = await app.dbManager.get('customers', receivable.customer_id);
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
                        <tr><td><strong>رقم السند:</strong></td><td>${receivable.receivable_number}</td></tr>
                        <tr><td><strong>العميل:</strong></td><td>${customerName}</td></tr>
                        <tr><td><strong>المبلغ:</strong></td><td>${app.formatCurrency(receivable.amount || 0)}</td></tr>
                        <tr><td><strong>تاريخ الاستحقاق:</strong></td><td>${app.formatDate(receivable.due_date)}</td></tr>
                        <tr><td><strong>الحالة:</strong></td><td>${this.getStatusBadge(receivable.status)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(receivable.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>الوصف</h6>
                    <p class="text-muted">${receivable.description || 'لا يوجد وصف'}</p>
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${receivable.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل سند القبض - ${receivable.receivable_number}`, modalContent);
    }

    async deleteReceivable(receivableId) {
        const confirmed = await app.showConfirm(
            'حذف سند القبض',
            'هل أنت متأكد من حذف هذا السند؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('receivables', receivableId);
                app.showSuccess('تم حذف سند القبض بنجاح');
                await this.loadReceivablesModule();
            } catch (error) {
                app.showError('خطأ في حذف سند القبض: ' + error.message);
            }
        }
    }

    searchReceivables() {
        const searchTerm = document.getElementById('receivableSearch').value.toLowerCase();
        const filteredReceivables = this.currentReceivables.filter(receivable => 
            receivable.receivable_number.toLowerCase().includes(searchTerm) ||
            receivable.customer_name.toLowerCase().includes(searchTerm) ||
            (receivable.description && receivable.description.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredReceivables(filteredReceivables);
    }

    filterByStatus() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('receivableSearch').value.toLowerCase();
        
        let filteredReceivables = this.currentReceivables;
        
        if (statusFilter) {
            filteredReceivables = filteredReceivables.filter(receivable => receivable.status === statusFilter);
        }
        
        if (searchTerm) {
            filteredReceivables = filteredReceivables.filter(receivable => 
                receivable.receivable_number.toLowerCase().includes(searchTerm) ||
                receivable.customer_name.toLowerCase().includes(searchTerm) ||
                (receivable.description && receivable.description.toLowerCase().includes(searchTerm))
            );
        }

        this.renderFilteredReceivables(filteredReceivables);
    }

    renderFilteredReceivables(filteredReceivables) {
        const container = document.getElementById('receivablesTableContainer');
        
        if (filteredReceivables.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['رقم السند', 'العميل', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء'];
        
        const tableData = filteredReceivables.map(receivable => ({
            number: receivable.receivable_number,
            customer: receivable.customer_name,
            amount: app.formatCurrency(receivable.amount || 0),
            due_date: app.formatDate(receivable.due_date),
            status: this.getStatusBadge(receivable.status),
            created_at: app.formatDate(receivable.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `receivablesModule.viewReceivableDetails(${receivable.receivable_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `receivablesModule.editReceivable(${receivable.receivable_id})`
            },
            {
                class: 'btn-success',
                icon: 'fas fa-check',
                title: 'تسديد',
                onclick: `receivablesModule.markAsPaid(${receivable.receivable_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `receivablesModule.deleteReceivable(${receivable.receivable_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportReceivables() {
        try {
            const csvContent = this.convertToCSV(this.currentReceivables);
            this.downloadCSV(csvContent, 'receivables.csv');
            app.showSuccess('تم تصدير بيانات سندات القبض بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['رقم السند', 'العميل', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء', 'الوصف', 'ملاحظات'];
        const csvData = data.map(receivable => [
            receivable.receivable_number,
            receivable.customer_name,
            receivable.amount || 0,
            receivable.due_date,
            receivable.status,
            receivable.created_at,
            receivable.description || '',
            receivable.notes || ''
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

// Initialize receivables module
const receivablesModule = new ReceivablesModule();

// Make module globally available
window.receivablesModule = receivablesModule;

// Global function for navigation
window.loadReceivablesModule = () => receivablesModule.loadReceivablesModule();