// Transactions Management Module
class TransactionsModule {
    constructor() {
        this.currentTransactions = [];
    }

    async loadTransactionsModule() {
        app.currentModule = 'transactions';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadTransactions();
            this.renderTransactionsPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات المعاملات: ' + error.message);
        }
    }

    async loadTransactions() {
        this.currentTransactions = await app.dbManager.getAll('transactions');
        
        // Load related data for each transaction
        for (let transaction of this.currentTransactions) {
            // Load project name
            if (transaction.linked_project_id) {
                const project = await app.dbManager.get('projects', transaction.linked_project_id);
                transaction.project_name = project ? project.name : 'غير محدد';
            } else {
                transaction.project_name = 'غير محدد';
            }

            // Load partner name
            if (transaction.linked_partner_id) {
                const partner = await app.dbManager.get('partners', transaction.linked_partner_id);
                transaction.partner_name = partner ? partner.name : 'غير محدد';
            } else {
                transaction.partner_name = 'غير محدد';
            }

            // Load invoice details
            if (transaction.linked_invoice_id) {
                const invoice = await app.dbManager.get('invoices', transaction.linked_invoice_id);
                transaction.invoice_number = invoice ? invoice.invoice_number : 'غير محدد';
                transaction.invoice_status = invoice ? invoice.status : 'غير محدد';
            } else {
                transaction.invoice_number = 'غير محدد';
                transaction.invoice_status = 'غير محدد';
            }
        }
    }

    renderTransactionsPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-exchange-alt me-2"></i>
                            إدارة المعاملات
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-custom" onclick="transactionsModule.showAddTransactionModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة معاملة جديدة
                        </button>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-4">
                        <div class="input-group">
                            <input type="text" class="form-control" id="transactionSearch" 
                                   placeholder="البحث في المعاملات..." onkeyup="transactionsModule.searchTransactions()">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="typeFilter" onchange="transactionsModule.filterTransactions()">
                            <option value="">جميع الأنواع</option>
                            <option value="income">إيراد</option>
                            <option value="expense">مصروف</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="projectFilter" onchange="transactionsModule.filterTransactions()">
                            <option value="">جميع المشاريع</option>
                        </select>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-outline-secondary" onclick="transactionsModule.exportTransactions()">
                            <i class="fas fa-download me-1"></i>
                            تصدير
                        </button>
                    </div>
                </div>

                <div id="transactionsTableContainer">
                    ${this.renderTransactionsTable()}
                </div>
            </div>
        `;

        this.loadProjectFilterOptions();
    }

    async loadProjectFilterOptions() {
        const projects = await app.dbManager.getAll('projects');
        const projectFilter = document.getElementById('projectFilter');
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }

    renderTransactionsTable() {
        if (this.currentTransactions.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد معاملات مسجلة</h5>
                    <p class="text-muted">قم بإضافة معاملة جديدة للبدء</p>
                </div>
            `;
        }

        const headers = ['النوع', 'المبلغ', 'التاريخ', 'المشروع', 'الشريك', 'رقم الفاتورة', 'حالة الفاتورة'];
        
        const tableData = this.currentTransactions.map(transaction => ({
            type: this.getTransactionTypeBadge(transaction.transaction_type),
            amount: app.formatCurrency(transaction.amount),
            date: app.formatDate(transaction.date),
            project: transaction.project_name,
            partner: transaction.partner_name,
            invoice_number: transaction.invoice_number,
            invoice_status: this.getInvoiceStatusBadge(transaction.invoice_status)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `transactionsModule.editTransaction(${transaction.transaction_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `transactionsModule.viewTransactionDetails(${transaction.transaction_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `transactionsModule.deleteTransaction(${transaction.transaction_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    getTransactionTypeBadge(type) {
        const typeMap = {
            'income': '<span class="badge bg-success">إيراد</span>',
            'expense': '<span class="badge bg-danger">مصروف</span>'
        };
        return typeMap[type] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    getInvoiceStatusBadge(status) {
        const statusMap = {
            'paid': '<span class="badge bg-success">مدفوع</span>',
            'unpaid': '<span class="badge bg-warning">غير مدفوع</span>',
            'overdue': '<span class="badge bg-danger">متأخر</span>'
        };
        return statusMap[status] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async showAddTransactionModal() {
        const projects = await app.dbManager.getAll('projects');
        const partners = await app.dbManager.getAll('partners');
        
        const modalContent = `
            <form id="addTransactionForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="transactionType" class="form-label">نوع المعاملة *</label>
                        <select class="form-select" id="transactionType" required onchange="transactionsModule.toggleInvoiceFields()">
                            <option value="">اختر النوع</option>
                            <option value="income">إيراد</option>
                            <option value="expense">مصروف</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="transactionAmount" class="form-label">المبلغ *</label>
                        <input type="number" class="form-control" id="transactionAmount" 
                               step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="transactionDate" class="form-label">تاريخ المعاملة *</label>
                        <input type="date" class="form-control" id="transactionDate" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="transactionProject" class="form-label">المشروع</label>
                        <select class="form-select" id="transactionProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}">${project.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="transactionPartner" class="form-label">الشريك</label>
                        <select class="form-select" id="transactionPartner">
                            <option value="">اختر الشريك</option>
                            ${partners.map(partner => `
                                <option value="${partner.partner_id}">${partner.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="transactionDescription" class="form-label">الوصف</label>
                        <input type="text" class="form-control" id="transactionDescription" 
                               placeholder="وصف المعاملة...">
                    </div>
                </div>
                
                <!-- Invoice Fields -->
                <div id="invoiceFields" style="display: none;">
                    <hr>
                    <h6>معلومات الفاتورة</h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="invoiceNumber" class="form-label">رقم الفاتورة</label>
                            <input type="text" class="form-control" id="invoiceNumber" 
                                   placeholder="رقم الفاتورة...">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="invoiceDueDate" class="form-label">تاريخ الاستحقاق</label>
                            <input type="date" class="form-control" id="invoiceDueDate">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="invoiceStatus" class="form-label">حالة الفاتورة</label>
                            <select class="form-select" id="invoiceStatus">
                                <option value="paid">مدفوع</option>
                                <option value="unpaid">غير مدفوع</option>
                                <option value="overdue">متأخر</option>
                            </select>
                        </div>
                    </div>
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

        const modal = app.showModal('إضافة معاملة جديدة', modalContent);
        
        // Set default date to today
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('addTransactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTransaction();
        });
    }

    toggleInvoiceFields() {
        const transactionType = document.getElementById('transactionType').value;
        const invoiceFields = document.getElementById('invoiceFields');
        
        if (transactionType === 'income') {
            invoiceFields.style.display = 'block';
        } else {
            invoiceFields.style.display = 'none';
        }
    }

    async saveTransaction() {
        try {
            const transactionData = {
                transaction_type: document.getElementById('transactionType').value,
                amount: parseFloat(document.getElementById('transactionAmount').value),
                date: document.getElementById('transactionDate').value,
                linked_project_id: document.getElementById('transactionProject').value || null,
                linked_partner_id: document.getElementById('transactionPartner').value || null,
                description: document.getElementById('transactionDescription').value
            };

            // Save transaction first
            const transactionId = await app.dbManager.addTransaction(transactionData);

            // If it's an income transaction and invoice fields are filled, create invoice
            if (transactionData.transaction_type === 'income' && 
                document.getElementById('invoiceNumber').value) {
                
                const invoiceData = {
                    invoice_number: document.getElementById('invoiceNumber').value,
                    amount: transactionData.amount,
                    status: document.getElementById('invoiceStatus').value,
                    due_date: document.getElementById('invoiceDueDate').value || null,
                    linked_transaction_id: transactionId
                };

                await app.dbManager.addInvoice(invoiceData);

                // Update transaction with invoice ID
                const transaction = await app.dbManager.get('transactions', transactionId);
                transaction.linked_invoice_id = transactionId;
                await app.dbManager.update('transactions', transaction);
            }

            // Update partner balance if partner is selected
            if (transactionData.linked_partner_id) {
                await this.updatePartnerBalance(transactionData.linked_partner_id, transactionData.amount, transactionData.transaction_type);
            }

            // Update cashbox balance
            await this.updateCashboxBalance(transactionData.amount, transactionData.transaction_type);
            
            app.showSuccess('تم إضافة المعاملة بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadTransactionsModule();
        } catch (error) {
            app.showError('خطأ في حفظ المعاملة: ' + error.message);
        }
    }

    async updatePartnerBalance(partnerId, amount, transactionType) {
        const partner = await app.dbManager.get('partners', partnerId);
        if (partner) {
            if (transactionType === 'income') {
                partner.current_balance += amount;
            } else {
                partner.current_balance -= amount;
            }
            await app.dbManager.updatePartnerBalance(partnerId, partner.current_balance);
        }
    }

    async updateCashboxBalance(amount, transactionType) {
        const cashboxes = await app.dbManager.getAll('cashboxes');
        if (cashboxes.length > 0) {
            const cashbox = cashboxes[0]; // Use first cashbox for now
            if (transactionType === 'income') {
                cashbox.current_balance += amount;
            } else {
                cashbox.current_balance -= amount;
            }
            await app.dbManager.updateCashboxBalance(cashbox.cashbox_id, cashbox.current_balance);
        }
    }

    async editTransaction(transactionId) {
        const transaction = await app.dbManager.get('transactions', transactionId);
        if (!transaction) {
            app.showError('المعاملة غير موجودة');
            return;
        }

        const projects = await app.dbManager.getAll('projects');
        const partners = await app.dbManager.getAll('partners');
        const invoice = transaction.linked_invoice_id ? await app.dbManager.get('invoices', transaction.linked_invoice_id) : null;
        
        const modalContent = `
            <form id="editTransactionForm">
                <input type="hidden" id="editTransactionId" value="${transaction.transaction_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionType" class="form-label">نوع المعاملة *</label>
                        <select class="form-select" id="editTransactionType" required onchange="transactionsModule.toggleEditInvoiceFields()">
                            <option value="income" ${transaction.transaction_type === 'income' ? 'selected' : ''}>إيراد</option>
                            <option value="expense" ${transaction.transaction_type === 'expense' ? 'selected' : ''}>مصروف</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionAmount" class="form-label">المبلغ *</label>
                        <input type="number" class="form-control" id="editTransactionAmount" 
                               value="${transaction.amount}" step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionDate" class="form-label">تاريخ المعاملة *</label>
                        <input type="date" class="form-control" id="editTransactionDate" 
                               value="${transaction.date}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionProject" class="form-label">المشروع</label>
                        <select class="form-select" id="editTransactionProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}" 
                                        ${transaction.linked_project_id == project.project_id ? 'selected' : ''}>
                                    ${project.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionPartner" class="form-label">الشريك</label>
                        <select class="form-select" id="editTransactionPartner">
                            <option value="">اختر الشريك</option>
                            ${partners.map(partner => `
                                <option value="${partner.partner_id}" 
                                        ${transaction.linked_partner_id == partner.partner_id ? 'selected' : ''}>
                                    ${partner.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editTransactionDescription" class="form-label">الوصف</label>
                        <input type="text" class="form-control" id="editTransactionDescription" 
                               value="${transaction.description || ''}" placeholder="وصف المعاملة...">
                    </div>
                </div>
                
                <!-- Invoice Fields -->
                <div id="editInvoiceFields" style="display: ${transaction.transaction_type === 'income' ? 'block' : 'none'};">
                    <hr>
                    <h6>معلومات الفاتورة</h6>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="editInvoiceNumber" class="form-label">رقم الفاتورة</label>
                            <input type="text" class="form-control" id="editInvoiceNumber" 
                                   value="${invoice ? invoice.invoice_number : ''}" placeholder="رقم الفاتورة...">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="editInvoiceDueDate" class="form-label">تاريخ الاستحقاق</label>
                            <input type="date" class="form-control" id="editInvoiceDueDate" 
                                   value="${invoice ? invoice.due_date || '' : ''}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="editInvoiceStatus" class="form-label">حالة الفاتورة</label>
                            <select class="form-select" id="editInvoiceStatus">
                                <option value="paid" ${invoice && invoice.status === 'paid' ? 'selected' : ''}>مدفوع</option>
                                <option value="unpaid" ${invoice && invoice.status === 'unpaid' ? 'selected' : ''}>غير مدفوع</option>
                                <option value="overdue" ${invoice && invoice.status === 'overdue' ? 'selected' : ''}>متأخر</option>
                            </select>
                        </div>
                    </div>
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

        const modal = app.showModal('تعديل المعاملة', modalContent);
        
        document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateTransaction();
        });
    }

    toggleEditInvoiceFields() {
        const transactionType = document.getElementById('editTransactionType').value;
        const invoiceFields = document.getElementById('editInvoiceFields');
        
        if (transactionType === 'income') {
            invoiceFields.style.display = 'block';
        } else {
            invoiceFields.style.display = 'none';
        }
    }

    async updateTransaction() {
        try {
            const transactionId = parseInt(document.getElementById('editTransactionId').value);
            const transaction = await app.dbManager.get('transactions', transactionId);
            
            if (!transaction) {
                app.showError('المعاملة غير موجودة');
                return;
            }

            // Store old values for balance updates
            const oldAmount = transaction.amount;
            const oldPartnerId = transaction.linked_partner_id;
            const oldType = transaction.transaction_type;

            transaction.transaction_type = document.getElementById('editTransactionType').value;
            transaction.amount = parseFloat(document.getElementById('editTransactionAmount').value);
            transaction.date = document.getElementById('editTransactionDate').value;
            transaction.linked_project_id = document.getElementById('editTransactionProject').value || null;
            transaction.linked_partner_id = document.getElementById('editTransactionPartner').value || null;
            transaction.description = document.getElementById('editTransactionDescription').value;

            await app.dbManager.update('transactions', transaction);

            // Update invoice if exists
            if (transaction.linked_invoice_id) {
                const invoice = await app.dbManager.get('invoices', transaction.linked_invoice_id);
                if (invoice) {
                    invoice.invoice_number = document.getElementById('editInvoiceNumber').value;
                    invoice.amount = transaction.amount;
                    invoice.status = document.getElementById('editInvoiceStatus').value;
                    invoice.due_date = document.getElementById('editInvoiceDueDate').value || null;
                    await app.dbManager.update('invoices', invoice);
                }
            }

            // Update balances
            await this.updateBalancesAfterEdit(oldAmount, oldPartnerId, oldType, transaction);
            
            app.showSuccess('تم تحديث المعاملة بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadTransactionsModule();
        } catch (error) {
            app.showError('خطأ في تحديث المعاملة: ' + error.message);
        }
    }

    async updateBalancesAfterEdit(oldAmount, oldPartnerId, oldType, newTransaction) {
        // Revert old partner balance
        if (oldPartnerId) {
            const oldPartner = await app.dbManager.get('partners', oldPartnerId);
            if (oldPartner) {
                if (oldType === 'income') {
                    oldPartner.current_balance -= oldAmount;
                } else {
                    oldPartner.current_balance += oldAmount;
                }
                await app.dbManager.updatePartnerBalance(oldPartnerId, oldPartner.current_balance);
            }
        }

        // Apply new partner balance
        if (newTransaction.linked_partner_id) {
            await this.updatePartnerBalance(newTransaction.linked_partner_id, newTransaction.amount, newTransaction.transaction_type);
        }

        // Update cashbox balance
        const cashboxes = await app.dbManager.getAll('cashboxes');
        if (cashboxes.length > 0) {
            const cashbox = cashboxes[0];
            // Revert old transaction
            if (oldType === 'income') {
                cashbox.current_balance -= oldAmount;
            } else {
                cashbox.current_balance += oldAmount;
            }
            // Apply new transaction
            if (newTransaction.transaction_type === 'income') {
                cashbox.current_balance += newTransaction.amount;
            } else {
                cashbox.current_balance -= newTransaction.amount;
            }
            await app.dbManager.updateCashboxBalance(cashbox.cashbox_id, cashbox.current_balance);
        }
    }

    async viewTransactionDetails(transactionId) {
        const transaction = await app.dbManager.get('transactions', transactionId);
        if (!transaction) {
            app.showError('المعاملة غير موجودة');
            return;
        }

        const project = transaction.linked_project_id ? await app.dbManager.get('projects', transaction.linked_project_id) : null;
        const partner = transaction.linked_partner_id ? await app.dbManager.get('partners', transaction.linked_partner_id) : null;
        const invoice = transaction.linked_invoice_id ? await app.dbManager.get('invoices', transaction.linked_invoice_id) : null;

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات المعاملة</h6>
                    <table class="table table-sm">
                        <tr><td>النوع:</td><td>${this.getTransactionTypeBadge(transaction.transaction_type)}</td></tr>
                        <tr><td>المبلغ:</td><td>${app.formatCurrency(transaction.amount)}</td></tr>
                        <tr><td>التاريخ:</td><td>${app.formatDate(transaction.date)}</td></tr>
                        <tr><td>المشروع:</td><td>${project ? project.name : 'غير محدد'}</td></tr>
                        <tr><td>الشريك:</td><td>${partner ? partner.name : 'غير محدد'}</td></tr>
                        <tr><td>الوصف:</td><td>${transaction.description || 'لا يوجد وصف'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    ${invoice ? `
                        <h6 class="fw-bold">معلومات الفاتورة</h6>
                        <table class="table table-sm">
                            <tr><td>رقم الفاتورة:</td><td>${invoice.invoice_number}</td></tr>
                            <tr><td>المبلغ:</td><td>${app.formatCurrency(invoice.amount)}</td></tr>
                            <tr><td>الحالة:</td><td>${this.getInvoiceStatusBadge(invoice.status)}</td></tr>
                            <tr><td>تاريخ الاستحقاق:</td><td>${invoice.due_date ? app.formatDate(invoice.due_date) : 'غير محدد'}</td></tr>
                        </table>
                    ` : '<p class="text-muted">لا توجد فاتورة مرتبطة</p>'}
                </div>
            </div>
        `;

        app.showModal(`تفاصيل المعاملة - ${transaction.transaction_id}`, modalContent);
    }

    async deleteTransaction(transactionId) {
        const confirmed = await app.confirm('هل أنت متأكد من حذف هذه المعاملة؟');
        if (!confirmed) return;

        try {
            const transaction = await app.dbManager.get('transactions', transactionId);
            if (!transaction) {
                app.showError('المعاملة غير موجودة');
                return;
            }

            // Delete associated invoice if exists
            if (transaction.linked_invoice_id) {
                await app.dbManager.delete('invoices', transaction.linked_invoice_id);
            }

            // Update partner balance
            if (transaction.linked_partner_id) {
                const partner = await app.dbManager.get('partners', transaction.linked_partner_id);
                if (partner) {
                    if (transaction.transaction_type === 'income') {
                        partner.current_balance -= transaction.amount;
                    } else {
                        partner.current_balance += transaction.amount;
                    }
                    await app.dbManager.updatePartnerBalance(transaction.linked_partner_id, partner.current_balance);
                }
            }

            // Update cashbox balance
            const cashboxes = await app.dbManager.getAll('cashboxes');
            if (cashboxes.length > 0) {
                const cashbox = cashboxes[0];
                if (transaction.transaction_type === 'income') {
                    cashbox.current_balance -= transaction.amount;
                } else {
                    cashbox.current_balance += transaction.amount;
                }
                await app.dbManager.updateCashboxBalance(cashbox.cashbox_id, cashbox.current_balance);
            }

            await app.dbManager.delete('transactions', transactionId);
            app.showSuccess('تم حذف المعاملة بنجاح');
            await this.loadTransactionsModule();
        } catch (error) {
            app.showError('خطأ في حذف المعاملة: ' + error.message);
        }
    }

    searchTransactions() {
        const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
        const filteredTransactions = this.currentTransactions.filter(transaction => 
            transaction.description && transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.project_name.toLowerCase().includes(searchTerm) ||
            transaction.partner_name.toLowerCase().includes(searchTerm) ||
            transaction.invoice_number.toLowerCase().includes(searchTerm)
        );

        this.renderFilteredTransactions(filteredTransactions);
    }

    filterTransactions() {
        const typeFilter = document.getElementById('typeFilter').value;
        const projectFilter = document.getElementById('projectFilter').value;
        const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
        
        let filteredTransactions = this.currentTransactions;
        
        if (typeFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.transaction_type === typeFilter);
        }
        
        if (projectFilter) {
            filteredTransactions = filteredTransactions.filter(t => t.linked_project_id == projectFilter);
        }
        
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                (t.description && t.description.toLowerCase().includes(searchTerm)) ||
                t.project_name.toLowerCase().includes(searchTerm) ||
                t.partner_name.toLowerCase().includes(searchTerm) ||
                t.invoice_number.toLowerCase().includes(searchTerm)
            );
        }

        this.renderFilteredTransactions(filteredTransactions);
    }

    renderFilteredTransactions(filteredTransactions) {
        const container = document.getElementById('transactionsTableContainer');
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                </div>
            `;
            return;
        }

        const headers = ['النوع', 'المبلغ', 'التاريخ', 'المشروع', 'الشريك', 'رقم الفاتورة', 'حالة الفاتورة'];
        
        const tableData = filteredTransactions.map(transaction => ({
            type: this.getTransactionTypeBadge(transaction.transaction_type),
            amount: app.formatCurrency(transaction.amount),
            date: app.formatDate(transaction.date),
            project: transaction.project_name,
            partner: transaction.partner_name,
            invoice_number: transaction.invoice_number,
            invoice_status: this.getInvoiceStatusBadge(transaction.invoice_status)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `transactionsModule.editTransaction(${transaction.transaction_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `transactionsModule.viewTransactionDetails(${transaction.transaction_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `transactionsModule.deleteTransaction(${transaction.transaction_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportTransactions() {
        try {
            const data = await app.dbManager.getAll('transactions');
            const csvContent = this.convertToCSV(data);
            this.downloadCSV(csvContent, 'transactions_export.csv');
            app.showSuccess('تم تصدير بيانات المعاملات بنجاح');
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

// Initialize transactions module
const transactionsModule = new TransactionsModule();

// Global function for navigation
window.loadTransactionsModule = () => transactionsModule.loadTransactionsModule();