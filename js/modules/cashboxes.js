// Cashboxes Management Module
class CashboxesModule {
    constructor() {
        this.currentCashboxes = [];
    }

    async loadCashboxesModule() {
        app.currentModule = 'cashboxes';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadCashboxes();
            this.renderCashboxesPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات الخزائن: ' + error.message);
        }
    }

    async loadCashboxes() {
        this.currentCashboxes = await dbManager.getAll('cashboxes');
    }

    renderCashboxesPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-vault me-2"></i>
                            إدارة الخزائن
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-custom" onclick="cashboxesModule.showAddCashboxModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة خزنة جديدة
                        </button>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="cashboxSearch" 
                                   placeholder="البحث في الخزائن..." onkeyup="cashboxesModule.searchCashboxes()">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-outline-secondary" onclick="cashboxesModule.exportCashboxes()">
                            <i class="fas fa-download me-1"></i>
                            تصدير
                        </button>
                    </div>
                </div>

                <div id="cashboxesTableContainer">
                    ${this.renderCashboxesTable()}
                </div>
            </div>
        `;
    }

    renderCashboxesTable() {
        if (this.currentCashboxes.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-vault fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد خزائن مسجلة</h5>
                    <p class="text-muted">قم بإضافة خزنة جديدة للبدء</p>
                </div>
            `;
        }

        const headers = ['اسم الخزنة', 'الرصيد الأولي', 'الرصيد الحالي', 'تاريخ الإنشاء'];
        
        const tableData = this.currentCashboxes.map(cashbox => ({
            name: cashbox.name,
            initial_balance: app.formatCurrency(cashbox.initial_balance),
            current_balance: app.formatCurrency(cashbox.current_balance),
            created_at: app.formatDate(cashbox.created_at)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `cashboxesModule.editCashbox(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `cashboxesModule.viewCashboxDetails(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-warning',
                icon: 'fas fa-exchange-alt',
                title: 'تحويل رصيد',
                onclick: `cashboxesModule.showTransferModal(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `cashboxesModule.deleteCashbox(${cashbox.cashbox_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async showAddCashboxModal() {
        const modalContent = `
            <form id="addCashboxForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="cashboxName" class="form-label">اسم الخزنة *</label>
                        <input type="text" class="form-control" id="cashboxName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="initialBalance" class="form-label">الرصيد الأولي *</label>
                        <input type="number" class="form-control" id="initialBalance" 
                               step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="cashboxDescription" class="form-label">وصف الخزنة</label>
                    <textarea class="form-control" id="cashboxDescription" rows="3" 
                              placeholder="وصف الخزنة..."></textarea>
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                        إلغاء
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i>
                        حفظ
                    </button>
                </div>
            </form>
        `;

        const modal = app.showModal('إضافة خزنة جديدة', modalContent);
        
        document.getElementById('addCashboxForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCashbox();
        });
    }

    async saveCashbox() {
        try {
            const cashboxData = {
                name: document.getElementById('cashboxName').value,
                initial_balance: parseFloat(document.getElementById('initialBalance').value),
                current_balance: parseFloat(document.getElementById('initialBalance').value),
                description: document.getElementById('cashboxDescription').value
            };

            await dbManager.addCashbox(cashboxData);
            
            app.showSuccess('تم إضافة الخزنة بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadCashboxesModule();
        } catch (error) {
            app.showError('خطأ في حفظ الخزنة: ' + error.message);
        }
    }

    async editCashbox(cashboxId) {
        const cashbox = await dbManager.get('cashboxes', cashboxId);
        if (!cashbox) {
            app.showError('الخزنة غير موجودة');
            return;
        }

        const modalContent = `
            <form id="editCashboxForm">
                <input type="hidden" id="editCashboxId" value="${cashbox.cashbox_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCashboxName" class="form-label">اسم الخزنة *</label>
                        <input type="text" class="form-control" id="editCashboxName" 
                               value="${cashbox.name}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editInitialBalance" class="form-label">الرصيد الأولي *</label>
                        <input type="number" class="form-control" id="editInitialBalance" 
                               value="${cashbox.initial_balance}" step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCurrentBalance" class="form-label">الرصيد الحالي *</label>
                        <input type="number" class="form-control" id="editCurrentBalance" 
                               value="${cashbox.current_balance}" step="0.01" required>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editCashboxDescription" class="form-label">وصف الخزنة</label>
                    <textarea class="form-control" id="editCashboxDescription" rows="3">${cashbox.description || ''}</textarea>
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                        إلغاء
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i>
                        تحديث
                    </button>
                </div>
            </form>
        `;

        const modal = app.showModal('تعديل الخزنة', modalContent);
        
        document.getElementById('editCashboxForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateCashbox();
        });
    }

    async updateCashbox() {
        try {
            const cashboxId = parseInt(document.getElementById('editCashboxId').value);
            const cashbox = await dbManager.get('cashboxes', cashboxId);
            
            if (!cashbox) {
                app.showError('الخزنة غير موجودة');
                return;
            }

            cashbox.name = document.getElementById('editCashboxName').value;
            cashbox.initial_balance = parseFloat(document.getElementById('editInitialBalance').value);
            cashbox.current_balance = parseFloat(document.getElementById('editCurrentBalance').value);
            cashbox.description = document.getElementById('editCashboxDescription').value;
            cashbox.updated_at = new Date().toISOString();

            await dbManager.update('cashboxes', cashbox);
            
            app.showSuccess('تم تحديث الخزنة بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadCashboxesModule();
        } catch (error) {
            app.showError('خطأ في تحديث الخزنة: ' + error.message);
        }
    }

    async viewCashboxDetails(cashboxId) {
        const cashbox = await dbManager.get('cashboxes', cashboxId);
        if (!cashbox) {
            app.showError('الخزنة غير موجودة');
            return;
        }

        // Get transactions related to this cashbox
        const transactions = await dbManager.getAll('transactions');
        const cashboxTransactions = transactions.filter(t => 
            t.linked_cashbox_id === cashboxId
        ).slice(0, 10); // Get last 10 transactions

        const totalIncome = cashboxTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = cashboxTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات الخزنة</h6>
                    <table class="table table-sm">
                        <tr><td>الاسم:</td><td>${cashbox.name}</td></tr>
                        <tr><td>الرصيد الأولي:</td><td>${app.formatCurrency(cashbox.initial_balance)}</td></tr>
                        <tr><td>الرصيد الحالي:</td><td>${app.formatCurrency(cashbox.current_balance)}</td></tr>
                        <tr><td>تاريخ الإنشاء:</td><td>${app.formatDate(cashbox.created_at)}</td></tr>
                        <tr><td>الوصف:</td><td>${cashbox.description || 'لا يوجد وصف'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">إحصائيات الخزنة</h6>
                    <div class="card">
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <h5 class="text-success">${app.formatCurrency(totalIncome)}</h5>
                                    <small>إجمالي الإيرادات</small>
                                </div>
                                <div class="col-6">
                                    <h5 class="text-danger">${app.formatCurrency(totalExpenses)}</h5>
                                    <small>إجمالي المصروفات</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <h5 class="${cashbox.current_balance >= 0 ? 'text-success' : 'text-danger'}">
                                    ${app.formatCurrency(cashbox.current_balance)}
                                </h5>
                                <small>الرصيد الحالي</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h6 class="fw-bold">آخر المعاملات</h6>
                ${cashboxTransactions.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>النوع</th>
                                    <th>المبلغ</th>
                                    <th>التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cashboxTransactions.map(t => `
                                    <tr>
                                        <td>
                                            <span class="badge ${t.transaction_type === 'income' ? 'bg-success' : 'bg-danger'}">
                                                ${t.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                                            </span>
                                        </td>
                                        <td>${app.formatCurrency(t.amount)}</td>
                                        <td>${app.formatDate(t.date)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">لا توجد معاملات</p>'}
            </div>
        `;

        app.showModal(`تفاصيل الخزنة - ${cashbox.name}`, modalContent);
    }

    async showTransferModal(cashboxId) {
        const cashbox = await dbManager.get('cashboxes', cashboxId);
        if (!cashbox) {
            app.showError('الخزنة غير موجودة');
            return;
        }

        const otherCashboxes = this.currentCashboxes.filter(c => c.cashbox_id !== cashboxId);
        
        if (otherCashboxes.length === 0) {
            app.showWarning('لا توجد خزائن أخرى للتحويل إليها');
            return;
        }

        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">تحويل رصيد من: ${cashbox.name}</h6>
                <p class="text-muted">الرصيد الحالي: ${app.formatCurrency(cashbox.current_balance)}</p>
            </div>
            
            <form id="transferForm">
                <input type="hidden" id="fromCashboxId" value="${cashbox.cashbox_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="toCashboxId" class="form-label">إلى الخزنة *</label>
                        <select class="form-select" id="toCashboxId" required>
                            <option value="">اختر الخزنة</option>
                            ${otherCashboxes.map(c => `
                                <option value="${c.cashbox_id}">${c.name} (${app.formatCurrency(c.current_balance)})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="transferAmount" class="form-label">المبلغ *</label>
                        <input type="number" class="form-control" id="transferAmount" 
                               step="0.01" min="0.01" max="${cashbox.current_balance}" required>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="transferDescription" class="form-label">سبب التحويل</label>
                    <input type="text" class="form-control" id="transferDescription" 
                           placeholder="سبب التحويل...">
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                        إلغاء
                    </button>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-exchange-alt me-1"></i>
                        تحويل
                    </button>
                </div>
            </form>
        `;

        const modal = app.showModal('تحويل رصيد', modalContent);
        
        document.getElementById('transferForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.performTransfer();
        });
    }

    async performTransfer() {
        try {
            const fromCashboxId = parseInt(document.getElementById('fromCashboxId').value);
            const toCashboxId = parseInt(document.getElementById('toCashboxId').value);
            const amount = parseFloat(document.getElementById('transferAmount').value);
            const description = document.getElementById('transferDescription').value;

            if (fromCashboxId === toCashboxId) {
                app.showError('لا يمكن التحويل إلى نفس الخزنة');
                return;
            }

            const fromCashbox = await dbManager.get('cashboxes', fromCashboxId);
            const toCashbox = await dbManager.get('cashboxes', toCashboxId);

            if (!fromCashbox || !toCashbox) {
                app.showError('الخزنة غير موجودة');
                return;
            }

            if (amount > fromCashbox.current_balance) {
                app.showError('المبلغ أكبر من الرصيد المتاح');
                return;
            }

            // Update cashbox balances
            fromCashbox.current_balance -= amount;
            toCashbox.current_balance += amount;

            await dbManager.update('cashboxes', fromCashbox);
            await dbManager.update('cashboxes', toCashbox);

            // Create transfer transaction record
            const transferData = {
                transaction_type: 'transfer',
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: `تحويل من ${fromCashbox.name} إلى ${toCashbox.name}${description ? ' - ' + description : ''}`,
                linked_cashbox_id: fromCashboxId,
                linked_to_cashbox_id: toCashboxId
            };

            await dbManager.addTransaction(transferData);

            app.showSuccess('تم التحويل بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadCashboxesModule();
        } catch (error) {
            app.showError('خطأ في التحويل: ' + error.message);
        }
    }

    async deleteCashbox(cashboxId) {
        const confirmed = await app.confirm('هل أنت متأكد من حذف هذه الخزنة؟');
        if (!confirmed) return;

        try {
            const cashbox = await dbManager.get('cashboxes', cashboxId);
            if (!cashbox) {
                app.showError('الخزنة غير موجودة');
                return;
            }

            // Check if cashbox has transactions
            const transactions = await dbManager.getAll('transactions');
            const cashboxTransactions = transactions.filter(t => 
                t.linked_cashbox_id === cashboxId
            );

            if (cashboxTransactions.length > 0) {
                app.showWarning('لا يمكن حذف الخزنة لوجود معاملات مرتبطة بها');
                return;
            }

            await dbManager.delete('cashboxes', cashboxId);
            app.showSuccess('تم حذف الخزنة بنجاح');
            await this.loadCashboxesModule();
        } catch (error) {
            app.showError('خطأ في حذف الخزنة: ' + error.message);
        }
    }

    searchCashboxes() {
        const searchTerm = document.getElementById('cashboxSearch').value.toLowerCase();
        const filteredCashboxes = this.currentCashboxes.filter(cashbox => 
            cashbox.name.toLowerCase().includes(searchTerm) ||
            (cashbox.description && cashbox.description.toLowerCase().includes(searchTerm))
        );

        this.renderFilteredCashboxes(filteredCashboxes);
    }

    renderFilteredCashboxes(filteredCashboxes) {
        const container = document.getElementById('cashboxesTableContainer');
        
        if (filteredCashboxes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                </div>
            `;
            return;
        }

        const headers = ['اسم الخزنة', 'الرصيد الأولي', 'الرصيد الحالي', 'تاريخ الإنشاء'];
        
        const tableData = filteredCashboxes.map(cashbox => ({
            name: cashbox.name,
            initial_balance: app.formatCurrency(cashbox.initial_balance),
            current_balance: app.formatCurrency(cashbox.current_balance),
            created_at: app.formatDate(cashbox.created_at)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `cashboxesModule.editCashbox(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `cashboxesModule.viewCashboxDetails(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-warning',
                icon: 'fas fa-exchange-alt',
                title: 'تحويل رصيد',
                onclick: `cashboxesModule.showTransferModal(${cashbox.cashbox_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `cashboxesModule.deleteCashbox(${cashbox.cashbox_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportCashboxes() {
        try {
            const data = await dbManager.getAll('cashboxes');
            const csvContent = this.convertToCSV(data);
            this.downloadCSV(csvContent, 'cashboxes_export.csv');
            app.showSuccess('تم تصدير بيانات الخزائن بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
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

// Initialize cashboxes module
const cashboxesModule = new CashboxesModule();

// Global function for navigation
window.loadCashboxesModule = () => cashboxesModule.loadCashboxesModule();