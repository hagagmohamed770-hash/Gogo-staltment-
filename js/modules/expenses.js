// Expenses Management Module
class ExpensesModule {
    constructor() {
        this.currentExpenses = [];
    }

    async loadExpensesModule() {
        app.currentModule = 'expenses';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadExpenses();
            this.renderExpensesPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات المصروفات: ' + error.message);
        }
    }

    async loadExpenses() {
        this.currentExpenses = await app.dbManager.getAll('expenses');
        
        // Load supplier names for each expense
        for (let expense of this.currentExpenses) {
            if (expense.supplier_id) {
                try {
                    const supplier = await app.dbManager.get('suppliers', expense.supplier_id);
                    expense.supplier_name = supplier ? supplier.name : 'غير محدد';
                } catch (error) {
                    expense.supplier_name = 'غير محدد';
                }
            } else {
                expense.supplier_name = 'غير محدد';
            }
        }
    }

    renderExpensesPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-receipt me-2"></i>
                            إدارة المصروفات
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="expensesModule.showAddExpenseModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة مصروف جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="expenseSearch" 
                                       placeholder="البحث في المصروفات..." onkeyup="expensesModule.searchExpenses()">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" id="categoryFilter" onchange="expensesModule.filterByCategory()">
                                <option value="">جميع الفئات</option>
                                <option value="operational">تشغيلي</option>
                                <option value="administrative">إداري</option>
                                <option value="marketing">تسويق</option>
                                <option value="maintenance">صيانة</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-secondary" onclick="expensesModule.exportExpenses()">
                                <i class="fas fa-download me-1"></i>
                                تصدير
                            </button>
                        </div>
                    </div>
                </div>

                <div id="expensesTableContainer">
                    ${this.renderExpensesTable()}
                </div>
            </div>
        `;
    }

    renderExpensesTable() {
        if (this.currentExpenses.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد مصروفات مسجلة</h5>
                    <p class="text-muted">قم بإضافة مصروف جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['الوصف', 'المورد', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء'];
        
        const tableData = this.currentExpenses.map(expense => ({
            description: expense.description,
            supplier: expense.supplier_name,
            amount: app.formatCurrency(expense.amount || 0),
            category: this.getCategoryBadge(expense.category),
            date: app.formatDate(expense.date),
            created_at: app.formatDate(expense.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `expensesModule.viewExpenseDetails(${expense.expense_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `expensesModule.editExpense(${expense.expense_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `expensesModule.deleteExpense(${expense.expense_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    getCategoryBadge(category) {
        const badges = {
            'operational': '<span class="badge bg-primary">تشغيلي</span>',
            'administrative': '<span class="badge bg-info">إداري</span>',
            'marketing': '<span class="badge bg-warning">تسويق</span>',
            'maintenance': '<span class="badge bg-secondary">صيانة</span>',
            'other': '<span class="badge bg-dark">أخرى</span>'
        };
        return badges[category] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async showAddExpenseModal() {
        const suppliers = await app.dbManager.getAll('suppliers');
        const supplierOptions = suppliers.map(supplier => 
            `<option value="${supplier.supplier_id}">${supplier.name}</option>`
        ).join('');

        const modalContent = `
            <form id="addExpenseForm">
                <div class="mb-3">
                    <label for="expenseDescription" class="form-label">الوصف *</label>
                    <input type="text" class="form-control" id="expenseDescription" required>
                </div>
                <div class="mb-3">
                    <label for="expenseSupplier" class="form-label">المورد</label>
                    <select class="form-select" id="expenseSupplier">
                        <option value="">اختر المورد...</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="expenseAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="expenseAmount" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="expenseCategory" class="form-label">الفئة *</label>
                    <select class="form-select" id="expenseCategory" required>
                        <option value="">اختر الفئة...</option>
                        <option value="operational">تشغيلي</option>
                        <option value="administrative">إداري</option>
                        <option value="marketing">تسويق</option>
                        <option value="maintenance">صيانة</option>
                        <option value="other">أخرى</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="expenseDate" class="form-label">تاريخ المصروف *</label>
                    <input type="date" class="form-control" id="expenseDate" required>
                </div>
                <div class="mb-3">
                    <label for="expenseNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="expenseNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        app.showModal('إضافة مصروف جديد', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="expensesModule.saveExpense()">
                    <i class="fas fa-save me-1"></i>
                    حفظ المصروف
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }

    async saveExpense() {
        const formData = {
            description: document.getElementById('expenseDescription').value.trim(),
            supplier_id: document.getElementById('expenseSupplier').value ? parseInt(document.getElementById('expenseSupplier').value) : null,
            amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
            category: document.getElementById('expenseCategory').value,
            date: document.getElementById('expenseDate').value,
            notes: document.getElementById('expenseNotes').value.trim(),
            created_at: new Date().toISOString()
        };

        if (!formData.description || !formData.amount || !formData.category || !formData.date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.addExpense(formData);
            app.showSuccess('تم إضافة المصروف بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadExpensesModule();
        } catch (error) {
            app.showError('خطأ في إضافة المصروف: ' + error.message);
        }
    }

    async editExpense(expenseId) {
        const expense = await app.dbManager.get('expenses', expenseId);
        if (!expense) {
            app.showError('المصروف غير موجود');
            return;
        }

        const suppliers = await app.dbManager.getAll('suppliers');
        const supplierOptions = suppliers.map(supplier => 
            `<option value="${supplier.supplier_id}" ${expense.supplier_id === supplier.supplier_id ? 'selected' : ''}>${supplier.name}</option>`
        ).join('');

        const modalContent = `
            <form id="editExpenseForm">
                <input type="hidden" id="editExpenseId" value="${expense.expense_id}">
                <div class="mb-3">
                    <label for="editExpenseDescription" class="form-label">الوصف *</label>
                    <input type="text" class="form-control" id="editExpenseDescription" value="${expense.description}" required>
                </div>
                <div class="mb-3">
                    <label for="editExpenseSupplier" class="form-label">المورد</label>
                    <select class="form-select" id="editExpenseSupplier">
                        <option value="">اختر المورد...</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editExpenseAmount" class="form-label">المبلغ *</label>
                    <input type="number" class="form-control" id="editExpenseAmount" value="${expense.amount}" required step="0.01" min="0">
                </div>
                <div class="mb-3">
                    <label for="editExpenseCategory" class="form-label">الفئة *</label>
                    <select class="form-select" id="editExpenseCategory" required>
                        <option value="">اختر الفئة...</option>
                        <option value="operational" ${expense.category === 'operational' ? 'selected' : ''}>تشغيلي</option>
                        <option value="administrative" ${expense.category === 'administrative' ? 'selected' : ''}>إداري</option>
                        <option value="marketing" ${expense.category === 'marketing' ? 'selected' : ''}>تسويق</option>
                        <option value="maintenance" ${expense.category === 'maintenance' ? 'selected' : ''}>صيانة</option>
                        <option value="other" ${expense.category === 'other' ? 'selected' : ''}>أخرى</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="editExpenseDate" class="form-label">تاريخ المصروف *</label>
                    <input type="date" class="form-control" id="editExpenseDate" value="${expense.date}" required>
                </div>
                <div class="mb-3">
                    <label for="editExpenseNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editExpenseNotes" rows="3">${expense.notes || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal('تعديل المصروف', modalContent, 'modal-lg');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="expensesModule.updateExpense()">
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

    async updateExpense() {
        const expenseId = parseInt(document.getElementById('editExpenseId').value);
        const expense = await app.dbManager.get('expenses', expenseId);
        
        if (!expense) {
            app.showError('المصروف غير موجود');
            return;
        }

        const updatedData = {
            ...expense,
            description: document.getElementById('editExpenseDescription').value.trim(),
            supplier_id: document.getElementById('editExpenseSupplier').value ? parseInt(document.getElementById('editExpenseSupplier').value) : null,
            amount: parseFloat(document.getElementById('editExpenseAmount').value) || 0,
            category: document.getElementById('editExpenseCategory').value,
            date: document.getElementById('editExpenseDate').value,
            notes: document.getElementById('editExpenseNotes').value.trim(),
            updated_at: new Date().toISOString()
        };

        if (!updatedData.description || !updatedData.amount || !updatedData.category || !updatedData.date) {
            app.showError('جميع الحقول المطلوبة يجب ملؤها');
            return;
        }

        try {
            await app.dbManager.update('expenses', updatedData);
            app.showSuccess('تم تحديث المصروف بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadExpensesModule();
        } catch (error) {
            app.showError('خطأ في تحديث المصروف: ' + error.message);
        }
    }

    async viewExpenseDetails(expenseId) {
        const expense = await app.dbManager.get('expenses', expenseId);
        if (!expense) {
            app.showError('المصروف غير موجود');
            return;
        }

        let supplierName = 'غير محدد';
        if (expense.supplier_id) {
            try {
                const supplier = await app.dbManager.get('suppliers', expense.supplier_id);
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
                        <tr><td><strong>الوصف:</strong></td><td>${expense.description}</td></tr>
                        <tr><td><strong>المورد:</strong></td><td>${supplierName}</td></tr>
                        <tr><td><strong>المبلغ:</strong></td><td>${app.formatCurrency(expense.amount || 0)}</td></tr>
                        <tr><td><strong>الفئة:</strong></td><td>${this.getCategoryBadge(expense.category)}</td></tr>
                        <tr><td><strong>التاريخ:</strong></td><td>${app.formatDate(expense.date)}</td></tr>
                        <tr><td><strong>تاريخ الإنشاء:</strong></td><td>${app.formatDate(expense.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>ملاحظات</h6>
                    <p class="text-muted">${expense.notes || 'لا توجد ملاحظات'}</p>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل المصروف - ${expense.description}`, modalContent);
    }

    async deleteExpense(expenseId) {
        const confirmed = await app.showConfirm(
            'حذف المصروف',
            'هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.'
        );
        
        if (confirmed) {
            try {
                await app.dbManager.delete('expenses', expenseId);
                app.showSuccess('تم حذف المصروف بنجاح');
                await this.loadExpensesModule();
            } catch (error) {
                app.showError('خطأ في حذف المصروف: ' + error.message);
            }
        }
    }

    searchExpenses() {
        const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
        const filteredExpenses = this.currentExpenses.filter(expense => 
            expense.description.toLowerCase().includes(searchTerm) ||
            expense.supplier_name.toLowerCase().includes(searchTerm) ||
            (expense.notes && expense.notes.toLowerCase().includes(searchTerm))
        );
        
        this.renderFilteredExpenses(filteredExpenses);
    }

    filterByCategory() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
        
        let filteredExpenses = this.currentExpenses;
        
        if (categoryFilter) {
            filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
        }
        
        if (searchTerm) {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.description.toLowerCase().includes(searchTerm) ||
                expense.supplier_name.toLowerCase().includes(searchTerm) ||
                (expense.notes && expense.notes.toLowerCase().includes(searchTerm))
            );
        }

        this.renderFilteredExpenses(filteredExpenses);
    }

    renderFilteredExpenses(filteredExpenses) {
        const container = document.getElementById('expensesTableContainer');
        
        if (filteredExpenses.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['الوصف', 'المورد', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء'];
        
        const tableData = filteredExpenses.map(expense => ({
            description: expense.description,
            supplier: expense.supplier_name,
            amount: app.formatCurrency(expense.amount || 0),
            category: this.getCategoryBadge(expense.category),
            date: app.formatDate(expense.date),
            created_at: app.formatDate(expense.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `expensesModule.viewExpenseDetails(${expense.expense_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `expensesModule.editExpense(${expense.expense_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `expensesModule.deleteExpense(${expense.expense_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportExpenses() {
        try {
            const csvContent = this.convertToCSV(this.currentExpenses);
            this.downloadCSV(csvContent, 'expenses.csv');
            app.showSuccess('تم تصدير بيانات المصروفات بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['الوصف', 'المورد', 'المبلغ', 'الفئة', 'التاريخ', 'تاريخ الإنشاء', 'ملاحظات'];
        const csvData = data.map(expense => [
            expense.description,
            expense.supplier_name,
            expense.amount || 0,
            expense.category,
            expense.date,
            expense.created_at,
            expense.notes || ''
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

// Initialize expenses module
const expensesModule = new ExpensesModule();

// Make module globally available
window.expensesModule = expensesModule;

// Global function for navigation
window.loadExpensesModule = () => expensesModule.loadExpensesModule();