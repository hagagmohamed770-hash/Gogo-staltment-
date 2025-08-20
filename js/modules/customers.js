// Customers Management Module
class CustomersModule {
    constructor() {
        this.currentCustomers = [];
    }

    async loadCustomersModule() {
        app.currentModule = 'customers';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadCustomers();
            this.renderCustomersPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات العملاء: ' + error.message);
        }
    }

    async loadCustomers() {
        this.currentCustomers = await app.dbManager.getAll('customers');
    }

    renderCustomersPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-users me-2"></i>
                            إدارة العملاء
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="customersModule.showAddCustomerModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة عميل جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" class="form-control" id="customerSearch" 
                                       placeholder="البحث في العملاء..." onkeyup="customersModule.searchCustomers()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <button class="btn btn-secondary" onclick="customersModule.exportCustomers()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="customersTableContainer">
                    ${this.renderCustomersTable()}
                </div>
            </div>
        `;
    }

    renderCustomersTable() {
        if (this.currentCustomers.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا يوجد عملاء مسجلين</h5>
                    <p class="text-muted">قم بإضافة عميل جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'تاريخ الإنشاء'];
        
        const tableData = this.currentCustomers.map(customer => ({
            name: customer.name,
            phone: customer.phone || 'غير محدد',
            email: customer.email || 'غير محدد',
            address: customer.address || 'غير محدد',
            balance: app.formatCurrency(customer.balance || 0),
            created_at: app.formatDate(customer.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `customersModule.viewCustomerDetails(${customer.customer_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `customersModule.editCustomer(${customer.customer_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `customersModule.deleteCustomer(${customer.customer_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async showAddCustomerModal() {
        const modalContent = `
            <form id="addCustomerForm">
                <div class="mb-3">
                    <label for="customerName" class="form-label">اسم العميل *</label>
                    <input type="text" class="form-control" id="customerName" required>
                </div>
                <div class="mb-3">
                    <label for="customerPhone" class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-control" id="customerPhone">
                </div>
                <div class="mb-3">
                    <label for="customerEmail" class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="customerEmail">
                </div>
                <div class="mb-3">
                    <label for="customerAddress" class="form-label">العنوان</label>
                    <textarea class="form-control" id="customerAddress" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label for="customerBalance" class="form-label">الرصيد الافتتاحي</label>
                    <input type="number" class="form-control" id="customerBalance" value="0" step="0.01">
                </div>
                <div class="mb-3">
                    <label for="customerNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="customerNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة عميل جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="customersModule.saveCustomer()">
                    <i class="fas fa-save me-1"></i>
                    حفظ العميل
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async saveCustomer() {
        const formData = {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            balance: parseFloat(document.getElementById('customerBalance').value) || 0,
            notes: document.getElementById('customerNotes').value.trim(),
            created_at: new Date().toISOString()
        };

        if (!formData.name) {
            app.showError('اسم العميل مطلوب');
            return;
        }

        try {
            await app.dbManager.addCustomer(formData);
            app.showSuccess('تم إضافة العميل بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadCustomersModule();
        } catch (error) {
            app.showError('خطأ في إضافة العميل: ' + error.message);
        }
    }

    async editCustomer(customerId) {
        const customer = await app.dbManager.get('customers', customerId);
        if (!customer) {
            app.showError('العميل غير موجود');
            return;
        }

        const modalContent = `
            <form id="editCustomerForm">
                <input type="hidden" id="editCustomerId" value="${customer.customer_id}">
                <div class="mb-3">
                    <label for="editCustomerName" class="form-label">اسم العميل *</label>
                    <input type="text" class="form-control" id="editCustomerName" value="${customer.name}" required>
                </div>
                <div class="mb-3">
                    <label for="editCustomerPhone" class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-control" id="editCustomerPhone" value="${customer.phone || ''}">
                </div>
                <div class="mb-3">
                    <label for="editCustomerEmail" class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="editCustomerEmail" value="${customer.email || ''}">
                </div>
                <div class="mb-3">
                    <label for="editCustomerAddress" class="form-label">العنوان</label>
                    <textarea class="form-control" id="editCustomerAddress" rows="3">${customer.address || ''}</textarea>
                </div>
                <div class="mb-3">
                    <label for="editCustomerBalance" class="form-label">الرصيد الحالي</label>
                    <input type="number" class="form-control" id="editCustomerBalance" value="${customer.balance || 0}" step="0.01">
                </div>
                <div class="mb-3">
                    <label for="editCustomerNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editCustomerNotes" rows="3">${customer.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل بيانات العميل', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="customersModule.updateCustomer()">
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

    async updateCustomer() {
        const customerId = parseInt(document.getElementById('editCustomerId').value);
        const customer = await app.dbManager.get('customers', customerId);
        
        if (!customer) {
            app.showError('العميل غير موجود');
            return;
        }

        const updatedData = {
            ...customer,
            name: document.getElementById('editCustomerName').value.trim(),
            phone: document.getElementById('editCustomerPhone').value.trim(),
            email: document.getElementById('editCustomerEmail').value.trim(),
            address: document.getElementById('editCustomerAddress').value.trim(),
            balance: parseFloat(document.getElementById('editCustomerBalance').value) || 0,
            notes: document.getElementById('editCustomerNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.name) {
            app.showError('اسم العميل مطلوب');
            return;
        }

        try {
            await app.dbManager.update('customers', updatedData);
            app.showSuccess('تم تحديث بيانات العميل بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadCustomersModule();
        } catch (error) {
            app.showError('خطأ في تحديث بيانات العميل: ' + error.message);
        }
    }

    async viewCustomerDetails(customerId) {
        const customer = await app.dbManager.get('customers', customerId);
        if (!customer) {
            app.showError('العميل غير موجود');
            return;
        }

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>المعلومات الأساسية</h6>
                    <table class="table table-sm">
                        <tr><td><strong>الاسم:</strong></td><td>${customer.name}</td></tr>
                        <tr><td><strong>رقم الهاتف:</strong></td><td>${customer.phone || 'غير محدد'}</td></tr>
                        <tr><td><strong>البريد الإلكتروني:</strong></td><td>${customer.email || 'غير محدد'}</td></tr>
                        <tr><td><strong>العنوان:</strong></td><td>${customer.address || 'غير محدد'}</td></tr>
                        <tr><td><strong>الرصيد الحالي:</strong></td><td>${app.formatCurrency(customer.balance || 0)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(customer.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${customer.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل العميل - ${customer.name}`, modalContent);
    }

    async deleteCustomer(customerId) {
        const confirmed = await app.showConfirm(
            'حذف العميل',
            'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('customers', customerId);
                app.showSuccess('تم حذف العميل بنجاح');
                await this.loadCustomersModule();
            } catch (error) {
                app.showError('خطأ في حذف العميل: ' + error.message);
            }
        }
    }

    searchCustomers() {
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        const filteredCustomers = this.currentCustomers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            (customer.phone && customer.phone.includes(searchTerm)) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredCustomers(filteredCustomers);
    }

    renderFilteredCustomers(filteredCustomers) {
        const container = document.getElementById('customersTableContainer');
        
        if (filteredCustomers.length === 0) {
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
        
        const tableData = filteredCustomers.map(customer => ({
            name: customer.name,
            phone: customer.phone || 'غير محدد',
            email: customer.email || 'غير محدد',
            address: customer.address || 'غير محدد',
            balance: app.formatCurrency(customer.balance || 0),
            created_at: app.formatDate(customer.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `customersModule.viewCustomerDetails(${customer.customer_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `customersModule.editCustomer(${customer.customer_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `customersModule.deleteCustomer(${customer.customer_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportCustomers() {
        try {
            const csvContent = this.convertToCSV(this.currentCustomers);
            this.downloadCSV(csvContent, 'customers.csv');
            app.showSuccess('تم تصدير بيانات العملاء بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرصيد', 'تاريخ الإنشاء', 'ملاحظات'];
        const csvData = data.map(customer => [
            customer.name,
            customer.phone || '',
            customer.email || '',
            customer.address || '',
            customer.balance || 0,
            customer.created_at,
            customer.notes || ''
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

// Initialize customers module
const customersModule = new CustomersModule();

// Make module globally available
window.customersModule = customersModule;

// Global function for navigation
window.loadCustomersModule = () => customersModule.loadCustomersModule();