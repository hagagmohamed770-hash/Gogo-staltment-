// Suppliers Management Module
class SuppliersModule {
    constructor() {
        this.currentSuppliers = [];
    }

    async loadSuppliersModule() {
        app.currentModule = 'suppliers';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadSuppliers();
            this.renderSuppliersPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات الموردين: ' + error.message);
        }
    }

    async loadSuppliers() {
        this.currentSuppliers = await app.dbManager.getAll('suppliers');
    }

    renderSuppliersPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-truck me-2"></i>
                            إدارة الموردين
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="suppliersModule.showAddSupplierModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة مورد جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" class="form-control" id="supplierSearch" 
                                       placeholder="البحث في الموردين..." onkeyup="suppliersModule.searchSuppliers()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <button class="btn btn-secondary" onclick="suppliersModule.exportSuppliers()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="suppliersTableContainer">
                    ${this.renderSuppliersTable()}
                </div>
            </div>
        `;
    }

    renderSuppliersTable() {
        if (this.currentSuppliers.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا يوجد موردين مسجلين</h5>
                    <p class="text-muted">قم بإضافة مورد جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'تاريخ الإنشاء'];
        
        const tableData = this.currentSuppliers.map(supplier => ({
            name: supplier.name,
            phone: supplier.phone || 'غير محدد',
            email: supplier.email || 'غير محدد',
            address: supplier.address || 'غير محدد',
            balance: app.formatCurrency(supplier.balance || 0),
            created_at: app.formatDate(supplier.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `suppliersModule.viewSupplierDetails(${supplier.supplier_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `suppliersModule.editSupplier(${supplier.supplier_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `suppliersModule.deleteSupplier(${supplier.supplier_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async showAddSupplierModal() {
        const modalContent = `
            <form id="addSupplierForm">
                <div class="mb-3">
                    <label for="supplierName" class="form-label">اسم المورد *</label>
                    <input type="text" class="form-control" id="supplierName" required>
                </div>
                <div class="mb-3">
                    <label for="supplierPhone" class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-control" id="supplierPhone">
                </div>
                <div class="mb-3">
                    <label for="supplierEmail" class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="supplierEmail">
                </div>
                <div class="mb-3">
                    <label for="supplierAddress" class="form-label">العنوان</label>
                    <textarea class="form-control" id="supplierAddress" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label for="supplierBalance" class="form-label">الرصيد الافتتاحي</label>
                    <input type="number" class="form-control" id="supplierBalance" value="0" step="0.01">
                </div>
                <div class="mb-3">
                    <label for="supplierNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="supplierNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة مورد جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="suppliersModule.saveSupplier()">
                    <i class="fas fa-save me-1"></i>
                    حفظ المورد
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async saveSupplier() {
        const formData = {
            name: document.getElementById('supplierName').value.trim(),
            phone: document.getElementById('supplierPhone').value.trim(),
            email: document.getElementById('supplierEmail').value.trim(),
            address: document.getElementById('supplierAddress').value.trim(),
            balance: parseFloat(document.getElementById('supplierBalance').value) || 0,
            notes: document.getElementById('supplierNotes').value.trim(),
            created_at: new Date().toISOString()
        };

        if (!formData.name) {
            app.showError('اسم المورد مطلوب');
            return;
        }

        try {
            await app.dbManager.addSupplier(formData);
            app.showSuccess('تم إضافة المورد بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadSuppliersModule();
        } catch (error) {
            app.showError('خطأ في إضافة المورد: ' + error.message);
        }
    }

    async editSupplier(supplierId) {
        const supplier = await app.dbManager.get('suppliers', supplierId);
        if (!supplier) {
            app.showError('المورد غير موجود');
            return;
        }

        const modalContent = `
            <form id="editSupplierForm">
                <input type="hidden" id="editSupplierId" value="${supplier.supplier_id}">
                <div class="mb-3">
                    <label for="editSupplierName" class="form-label">اسم المورد *</label>
                    <input type="text" class="form-control" id="editSupplierName" value="${supplier.name}" required>
                </div>
                <div class="mb-3">
                    <label for="editSupplierPhone" class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-control" id="editSupplierPhone" value="${supplier.phone || ''}">
                </div>
                <div class="mb-3">
                    <label for="editSupplierEmail" class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="editSupplierEmail" value="${supplier.email || ''}">
                </div>
                <div class="mb-3">
                    <label for="editSupplierAddress" class="form-label">العنوان</label>
                    <textarea class="form-control" id="editSupplierAddress" rows="3">${supplier.address || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="editSupplierBalance" class="form-label">الرصيد الحالي</label>
                    <input type="number" class="form-control" id="editSupplierBalance" value="${supplier.balance || 0}" step="0.01">
                </div>
                <div class="mb-3">
                    <label for="editSupplierNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editSupplierNotes" rows="3">${supplier.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل بيانات المورد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="suppliersModule.updateSupplier()">
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

    async updateSupplier() {
        const supplierId = parseInt(document.getElementById('editSupplierId').value);
        const supplier = await app.dbManager.get('suppliers', supplierId);
        
        if (!supplier) {
            app.showError('المورد غير موجود');
            return;
        }

        const updatedData = {
            ...supplier,
            name: document.getElementById('editSupplierName').value.trim(),
            phone: document.getElementById('editSupplierPhone').value.trim(),
            email: document.getElementById('editSupplierEmail').value.trim(),
            address: document.getElementById('editSupplierAddress').value.trim(),
            balance: parseFloat(document.getElementById('editSupplierBalance').value) || 0,
            notes: document.getElementById('editSupplierNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.name) {
            app.showError('اسم المورد مطلوب');
            return;
        }

        try {
            await app.dbManager.update('suppliers', updatedData);
            app.showSuccess('تم تحديث بيانات المورد بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadSuppliersModule();
        } catch (error) {
            app.showError('خطأ في تحديث بيانات المورد: ' + error.message);
        }
    }

    async viewSupplierDetails(supplierId) {
        const supplier = await app.dbManager.get('suppliers', supplierId);
        if (!supplier) {
            app.showError('المورد غير موجود');
            return;
        }

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>المعلومات الأساسية</h6>
                    <table class="table table-sm">
                        <tr><td><strong>الاسم:</strong></td><td>${supplier.name}</td></tr>
                        <tr><td><strong>رقم الهاتف:</strong></td><td>${supplier.phone || 'غير محدد'}</td></tr>
                        <tr><td><strong>البريد الإلكتروني:</strong></td><td>${supplier.email || 'غير محدد'}</td></tr>
                        <tr><td><strong>العنوان:</strong></td><td>${supplier.address || 'غير محدد'}</td></tr>
                        <tr><td><strong>الرصيد الحالي:</strong></td><td>${app.formatCurrency(supplier.balance || 0)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(supplier.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${supplier.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل المورد - ${supplier.name}`, modalContent);
    }

    async deleteSupplier(supplierId) {
        const confirmed = await app.showConfirm(
            'حذف المورد',
            'هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('suppliers', supplierId);
                app.showSuccess('تم حذف المورد بنجاح');
                await this.loadSuppliersModule();
            } catch (error) {
                app.showError('خطأ في حذف المورد: ' + error.message);
            }
        }
    }

    searchSuppliers() {
        const searchTerm = document.getElementById('supplierSearch').value.toLowerCase();
        const filteredSuppliers = this.currentSuppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(searchTerm) ||
            (supplier.phone && supplier.phone.includes(searchTerm)) ||
            (supplier.email && supplier.email.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredSuppliers(filteredSuppliers);
    }

    renderFilteredSuppliers(filteredSuppliers) {
        const container = document.getElementById('suppliersTableContainer');
        
        if (filteredSuppliers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'تاريخ الإنشاء'];
        
        const tableData = filteredSuppliers.map(supplier => ({
            name: supplier.name,
            phone: supplier.phone || 'غير محدد',
            email: supplier.email || 'غير محدد',
            address: supplier.address || 'غير محدد',
            balance: app.formatCurrency(supplier.balance || 0),
            created_at: app.formatDate(supplier.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `suppliersModule.viewSupplierDetails(${supplier.supplier_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `suppliersModule.editSupplier(${supplier.supplier_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `suppliersModule.deleteSupplier(${supplier.supplier_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportSuppliers() {
        try {
            const csvContent = this.convertToCSV(this.currentSuppliers);
            this.downloadCSV(csvContent, 'suppliers.csv');
            app.showSuccess('تم تصدير بيانات الموردين بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'تاريخ الإنشاء', 'ملاحظات'];
        const csvData = data.map(supplier => [
            supplier.name,
            supplier.phone || '',
            supplier.email || '',
            supplier.address || '',
            supplier.balance || 0,
            supplier.created_at,
            supplier.notes || ''
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

// Initialize suppliers module
const suppliersModule = new SuppliersModule();

// Make module globally available
window.suppliersModule = suppliersModule;

// Global function for navigation
window.loadSuppliersModule = () => suppliersModule.loadSuppliersModule();