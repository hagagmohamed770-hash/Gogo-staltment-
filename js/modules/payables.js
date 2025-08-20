// Payables Management Module
class PayablesModule {
    constructor() {
        this.currentPayables = [];
    }

    async loadPayablesModule() {
        app.currentModule = 'payables';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadPayables();
            this.renderPayablesPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات سندات الصرف: ' + error.message);
        }
    }

    async loadPayables() {
        this.currentPayables = await app.dbManager.getAll('payables');
        
        // Load supplier names for each payable
        for (let payable of this.currentPayables) {
            if (payable.supplier_id) {
                try {
                    const supplier = await app.dbManager.get('suppliers', payable.supplier_id);
                    payable.supplier_name = supplier ? supplier.name : 'غير محدد';
                } catch (error) {
                    payable.supplier_name = 'غير محدد';
                }
            } else {
                payable.supplier_name = 'غير محدد';
            }
        }
    }

    renderPayablesPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-credit-card me-2"></i>
                            إدارة سندات الصرف
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="payablesModule.showAddPayableModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة سند صرف جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="payableSearch" 
                                       placeholder="البحث في سندات الصرف..." onkeyup="payablesModule.searchPayables()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="statusFilter" onchange="payablesModule.filterByStatus()">
                                <option value="">جميع الحالات</option>
                                <option value="pending">معلق</option>
                                <option value="paid">مدفوع</option>
                                <option value="overdue">متأخر</option>
                            </select>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-secondary" onclick="payablesModule.exportPayables()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="payablesTableContainer">
                    ${this.renderPayablesTable()}
                </div>
            </div>
        `;
    }

    renderPayablesTable() {
        if (this.currentPayables.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-credit-card fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد سندات صرف مسجلة</h5>
                    <p class="text-muted">قم بإضافة سند صرف جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['رقم السند', 'المورد', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء'];
        
        const tableData = this.currentPayables.map(payable => ({
            number: payable.payable_number,
            supplier: payable.supplier_name,
            amount: app.formatCurrency(payable.amount || 0),
            due_date: app.formatDate(payable.due_date),
            status: this.getStatusBadge(payable.status),
            created_at: app.formatDate(payable.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `payablesModule.viewPayableDetails(${payable.payable_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `payablesModule.editPayable(${payable.payable_id})`
            },
            {
                class: 'btn-success',
                icon: 'fas fa-check',
                title: 'تسديد',
                onclick: `payablesModule.markAsPaid(${payable.payable_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `payablesModule.deletePayable(${payable.payable_id})`
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

    async showAddPayableModal() {
        const suppliers = await app.dbManager.getAll('suppliers');
        const supplierOptions = suppliers.map(supplier => 
            `<option value="${supplier.supplier_id}">${supplier.name}</option>`
        ).join('');

        const modalContent = `
            <form id="addPayableForm">
                <div class="mb-3">
                    <label for="payableNumber" class="form-label">رقم السند *</label>
                    <input type="text" class="form-control" id="payableNumber" required>
                </div>
                <div class="mb-3">
                    <label for="payableSupplier" class="form-label">المورد *</label>
                    <select class="form-select" id="payableSupplier" required>
                        <option value="">اختر المورد...</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="payableAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="payableAmount" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="payableDueDate" class="form-label">تاريخ الاستحقاق *</label>
                    <input type="date" class="form-control" id="payableDueDate" required>
                </div>
                <div class="mb-3">
                    <label for="payableDescription" class="form-label">الوصف</label>
                    <textarea class="form-control" id="payableDescription" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label for="payableNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="payableNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة سند صرف جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="payablesModule.savePayable()">
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

    async savePayable() {
        const formData = {
            payable_number: document.getElementById('payableNumber').value.trim(),
            supplier_id: parseInt(document.getElementById('payableSupplier').value),
            amount: parseFloat(document.getElementById('payableAmount').value) || 0,
            due_date: document.getElementById('payableDueDate').value,
            description: document.getElementById('payableDescription').value.trim(),
            notes: document.getElementById('payableNotes').value.trim(),
            status: 'pending',
            created_at: new Date().toISOString()
        };

        if (!formData.payable_number || !formData.supplier_id || !formData.amount || !formData.due_date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.addPayable(formData);
            app.showSuccess('تم إضافة سند الصرف بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadPayablesModule();
        } catch (error) {
            app.showError('خطأ في إضافة سند الصرف: ' + error.message);
        }
    }

    async editPayable(payableId) {
        const payable = await app.dbManager.get('payables', payableId);
        if (!payable) {
            app.showError('سند الصرف غير موجود');
            return;
        }

        const suppliers = await app.dbManager.getAll('suppliers');
        const supplierOptions = suppliers.map(supplier => 
            `<option value="${supplier.supplier_id}" ${payable.supplier_id === supplier.supplier_id ? 'selected' : ''}>${supplier.name}</option>`
        ).join('');

        const modalContent = `
            <form id="editPayableForm">
                <input type="hidden" id="editPayableId" value="${payable.payable_id}">
                <div class="mb-3">
                    <label for="editPayableNumber" class="form-label">رقم السند *</label>
                    <input type="text" class="form-control" id="editPayableNumber" value="${payable.payable_number}" required>
                </div>
                <div class="mb-3">
                    <label for="editPayableSupplier" class="form-label">المورد *</label>
                    <select class="form-select" id="editPayableSupplier" required>
                        <option value="">اختر المورد...</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editPayableAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="editPayableAmount" value="${payable.amount}" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="editPayableDueDate" class="form-label">تاريخ الاستحقاق *</label>
                    <input type="date" class="form-control" id="editPayableDueDate" value="${payable.due_date}" required>
                </div>
                <div class="mb-3">
                    <label for="editPayableStatus" class="form-label">الحالة</label>
                    <select class="form-select" id="editPayableStatus">
                        <option value="pending" ${payable.status === 'pending' ? 'selected' : ''}>معلق</option>
                        <option value="paid" ${payable.status === 'paid' ? 'selected' : ''}>مدفوع</option>
                        <option value="overdue" ${payable.status === 'overdue' ? 'selected' : ''}>متأخر</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editPayableDescription" class="form-label">الوصف</label>
                    <textarea class="form-control" id="editPayableDescription" rows="3">${payable.description || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="editPayableNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editPayableNotes" rows="3">${payable.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل سند الصرف', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="payablesModule.updatePayable()">
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

    async updatePayable() {
        const payableId = parseInt(document.getElementById('editPayableId').value);
        const payable = await app.dbManager.get('payables', payableId);
        
        if (!payable) {
            app.showError('سند الصرف غير موجود');
            return;
        }

        const updatedData = {
            ...payable,
            payable_number: document.getElementById('editPayableNumber').value.trim(),
            supplier_id: parseInt(document.getElementById('editPayableSupplier').value),
            amount: parseFloat(document.getElementById('editPayableAmount').value) || 0,
            due_date: document.getElementById('editPayableDueDate').value,
            status: document.getElementById('editPayableStatus').value,
            description: document.getElementById('editPayableDescription').value.trim(),
            notes: document.getElementById('editPayableNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.payable_number || !updatedData.supplier_id || !updatedData.amount || !updatedData.due_date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.update('payables', updatedData);
            app.showSuccess('تم تحديث سند الصرف بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadPayablesModule();
        } catch (error) {
            app.showError('خطأ في تحديث سند الصرف: ' + error.message);
        }
    }

    async markAsPaid(payableId) {
        const confirmed = await app.showConfirm(
            'تسديد السند',
            'هل أنت متأكد من تسديد هذا السند؟'
        );
        
        if (confirmed) {
            try {
                const payable = await app.dbManager.get('payables', payableId);
                if (!payable) {
                    app.showError('سند الصرف غير موجود');
                    return;
                }

                payable.status = 'paid';
                payable.paid_date = new Date().toISOString();
                payable.updated_at = new Date().toISOString();

                await app.dbManager.update('payables', payable);
                app.showSuccess('تم تسديد السند بنجاح');
                await this.loadPayablesModule();
            } catch (error) {
                app.showError('خطأ في تسديد السند: ' + error.message);
            }
        }
    }

    async viewPayableDetails(payableId) {
        const payable = await app.dbManager.get('payables', payableId);
        if (!payable) {
            app.showError('سند الصرف غير موجود');
            return;
        }

        let supplierName = 'غير محدد';
        if (payable.supplier_id) {
            try {
                const supplier = await app.dbManager.get('suppliers', payable.supplier_id);
                supplierName = supplier ? supplier.name : 'غير محدد';
            } catch (error) {
                supplierName = 'غير محدد';
            }
        }

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>المعلومات الأساسية</h6>
                    <table class="table table-sm">
                        <tr><td><strong>رقم السند:</strong></td><td>${payable.payable_number}</td></tr>
                        <tr><td><strong>المورد:</strong></td><td>${supplierName}</td></tr>
                        <tr><td><strong>المبلغ:</strong></td><td>${app.formatCurrency(payable.amount || 0)}</td></tr>
                        <tr><td><strong>تاريخ الاستحقاق:</strong></td><td>${app.formatDate(payable.due_date)}</td></tr>
                        <tr><td><strong>الحالة:</strong></td><td>${this.getStatusBadge(payable.status)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(payable.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>الوصف</h6>
                    <p class="text-muted">${payable.description || 'لا يوجد وصف'}</p>
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${payable.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل سند الصرف - ${payable.payable_number}`, modalContent);
    }

    async deletePayable(payableId) {
        const confirmed = await app.showConfirm(
            'حذف سند الصرف',
            'هل أنت متأكد من حذف هذا السند؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('payables', payableId);
                app.showSuccess('تم حذف سند الصرف بنجاح');
                await this.loadPayablesModule();
            } catch (error) {
                app.showError('خطأ في حذف سند الصرف: ' + error.message);
            }
        }
    }

    searchPayables() {
        const searchTerm = document.getElementById('payableSearch').value.toLowerCase();
        const filteredPayables = this.currentPayables.filter(payable => 
            payable.payable_number.toLowerCase().includes(searchTerm) ||
            payable.supplier_name.toLowerCase().includes(searchTerm) ||
            (payable.description && payable.description.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredPayables(filteredPayables);
    }

    filterByStatus() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('payableSearch').value.toLowerCase();
        
        let filteredPayables = this.currentPayables;
        
        if (statusFilter) {
            filteredPayables = filteredPayables.filter(payable => payable.status === statusFilter);
        }
        
        if (searchTerm) {
            filteredPayables = filteredPayables.filter(payable => 
                payable.payable_number.toLowerCase().includes(searchTerm) ||
                payable.supplier_name.toLowerCase().includes(searchTerm) ||
                (payable.description && payable.description.toLowerCase().includes(searchTerm))
            );
        }

        this.renderFilteredPayables(filteredPayables);
    }

    renderFilteredPayables(filteredPayables) {
        const container = document.getElementById('payablesTableContainer');
        
        if (filteredPayables.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['رقم السند', 'المورد', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء'];
        
        const tableData = filteredPayables.map(payable => ({
            number: payable.payable_number,
            supplier: payable.supplier_name,
            amount: app.formatCurrency(payable.amount || 0),
            due_date: app.formatDate(payable.due_date),
            status: this.getStatusBadge(payable.status),
            created_at: app.formatDate(payable.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `payablesModule.viewPayableDetails(${payable.payable_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `payablesModule.editPayable(${payable.payable_id})`
            },
            {
                class: 'btn-success',
                icon: 'fas fa-check',
                title: 'تسديد',
                onclick: `payablesModule.markAsPaid(${payable.payable_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `payablesModule.deletePayable(${payable.payable_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportPayables() {
        try {
            const csvContent = this.convertToCSV(this.currentPayables);
            this.downloadCSV(csvContent, 'payables.csv');
            app.showSuccess('تم تصدير بيانات سندات الصرف بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['رقم السند', 'المورد', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ الإنشاء', 'الوصف', 'ملاحظات'];
        const csvData = data.map(payable => [
            payable.payable_number,
            payable.supplier_name,
            payable.amount || 0,
            payable.due_date,
            payable.status,
            payable.created_at,
            payable.description || '',
            payable.notes || ''
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

// Initialize payables module
const payablesModule = new PayablesModule();

// Make module globally available
window.payablesModule = payablesModule;

// Global function for navigation
window.loadPayablesModule = () => payablesModule.loadPayablesModule();