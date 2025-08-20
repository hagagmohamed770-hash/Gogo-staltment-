// Settlements Management Module
class SettlementsModule {
    constructor() {
        this.currentSettlements = [];
    }

    async loadSettlementsModule() {
        app.currentModule = 'settlements';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadSettlements();
            this.renderSettlementsPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات التسويات: ' + error.message);
        }
    }

    async loadSettlements() {
        this.currentSettlements = await dbManager.getAll('settlements');
        
        // Load related data for each settlement
        for (let settlement of this.currentSettlements) {
            // Load partner name
            if (settlement.partner_id) {
                const partner = await dbManager.get('partners', settlement.partner_id);
                settlement.partner_name = partner ? partner.name : 'غير محدد';
            } else {
                settlement.partner_name = 'غير محدد';
            }

            // Load project name
            if (settlement.linked_project_id) {
                const project = await dbManager.get('projects', settlement.linked_project_id);
                settlement.project_name = project ? project.name : 'غير محدد';
            } else {
                settlement.project_name = 'غير محدد';
            }
        }
    }

    renderSettlementsPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-calculator me-2"></i>
                            إدارة التسويات
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-success btn-custom me-2" onclick="settlementsModule.calculateSettlements()">
                            <i class="fas fa-calculator me-1"></i>
                            حساب التسويات
                        </button>
                        <button class="btn btn-primary btn-custom" onclick="settlementsModule.showAddSettlementModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة تسوية يدوية
                        </button>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="settlementSearch" 
                                   placeholder="البحث في التسويات..." onkeyup="settlementsModule.searchSettlements()">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="projectFilter" onchange="settlementsModule.filterSettlements()">
                            <option value="">جميع المشاريع</option>
                        </select>
                    </div>
                    <div class="col-md-3 text-end">
                        <button class="btn btn-outline-secondary" onclick="settlementsModule.exportSettlements()">
                            <i class="fas fa-download me-1"></i>
                            تصدير
                        </button>
                    </div>
                </div>

                <div id="settlementsTableContainer">
                    ${this.renderSettlementsTable()}
                </div>
            </div>
        `;

        this.loadProjectFilterOptions();
    }

    async loadProjectFilterOptions() {
        const projects = await dbManager.getAll('projects');
        const projectFilter = document.getElementById('projectFilter');
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name;
            projectFilter.appendChild(option);
        });
    }

    renderSettlementsTable() {
        if (this.currentSettlements.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-calculator fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد تسويات مسجلة</h5>
                    <p class="text-muted">قم بحساب التسويات أو إضافة تسوية يدوية للبدء</p>
                </div>
            `;
        }

        const headers = ['الشريك', 'المشروع', 'المبلغ المدفوع', 'الرصيد السابق', 'المبلغ المستحق', 'الرصيد النهائي', 'التاريخ'];
        
        const tableData = this.currentSettlements.map(settlement => ({
            partner: settlement.partner_name,
            project: settlement.project_name,
            payment_amount: app.formatCurrency(settlement.payment_amount),
            previous_balance: app.formatCurrency(settlement.previous_balance),
            outstanding_amount: app.formatCurrency(settlement.outstanding_amount),
            final_balance: app.formatCurrency(settlement.final_balance),
            date: app.formatDate(settlement.date)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `settlementsModule.editSettlement(${settlement.settlement_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `settlementsModule.viewSettlementDetails(${settlement.settlement_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `settlementsModule.deleteSettlement(${settlement.settlement_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async calculateSettlements() {
        try {
            const projects = await dbManager.getAll('projects');
            
            if (projects.length === 0) {
                app.showWarning('لا توجد مشاريع لحساب التسويات');
                return;
            }

            const modalContent = `
                <div class="mb-3">
                    <h6 class="fw-bold">حساب التسويات التلقائي</h6>
                    <p class="text-muted">سيتم حساب التسويات بناءً على المبالغ المدفوعة من كل شريك في المشروع المحدد</p>
                </div>
                
                <div class="mb-3">
                    <label for="settlementProject" class="form-label">اختر المشروع *</label>
                    <select class="form-select" id="settlementProject" required>
                        <option value="">اختر المشروع</option>
                        ${projects.map(project => `
                            <option value="${project.project_id}">${project.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="settlementDate" class="form-label">تاريخ التسوية *</label>
                    <input type="date" class="form-control" id="settlementDate" required>
                </div>
                
                <div class="text-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                        إلغاء
                    </button>
                    <button type="button" class="btn btn-success" onclick="settlementsModule.performSettlementCalculation()">
                        <i class="fas fa-calculator me-1"></i>
                        حساب التسويات
                    </button>
                </div>
            `;

            const modal = app.showModal('حساب التسويات', modalContent);
            
            // Set default date to today
            document.getElementById('settlementDate').value = new Date().toISOString().split('T')[0];
        } catch (error) {
            app.showError('خطأ في تحميل بيانات المشاريع: ' + error.message);
        }
    }

    async performSettlementCalculation() {
        const projectId = document.getElementById('settlementProject').value;
        const settlementDate = document.getElementById('settlementDate').value;

        if (!projectId || !settlementDate) {
            app.showError('يرجى اختيار المشروع وتاريخ التسوية');
            return;
        }

        try {
            // Get all partners in the project
            const partners = await dbManager.getPartnersByProject(projectId);
            
            if (partners.length < 2) {
                app.showWarning('يجب أن يكون هناك شريكين على الأقل لحساب التسويات');
                return;
            }

            // Get all transactions for the project
            const transactions = await dbManager.getTransactionsByProject(projectId);
            
            // Calculate total project amount and each partner's contribution
            let totalProjectAmount = 0;
            const partnerContributions = {};

            // Initialize partner contributions
            partners.forEach(partner => {
                partnerContributions[partner.partner_id] = {
                    partner: partner,
                    totalPaid: 0,
                    totalReceived: 0,
                    netContribution: 0
                };
            });

            // Calculate contributions from transactions
            transactions.forEach(transaction => {
                if (transaction.linked_partner_id && partnerContributions[transaction.linked_partner_id]) {
                    if (transaction.transaction_type === 'expense') {
                        partnerContributions[transaction.linked_partner_id].totalPaid += transaction.amount;
                        totalProjectAmount += transaction.amount;
                    } else if (transaction.transaction_type === 'income') {
                        partnerContributions[transaction.linked_partner_id].totalReceived += transaction.amount;
                    }
                }
            });

            // Calculate net contribution for each partner
            Object.values(partnerContributions).forEach(contribution => {
                contribution.netContribution = contribution.totalPaid - contribution.totalReceived;
            });

            // Calculate average contribution
            const totalNetContributions = Object.values(partnerContributions)
                .reduce((sum, c) => sum + c.netContribution, 0);
            const averageContribution = totalNetContributions / partners.length;

            // Calculate settlements
            const settlements = [];
            Object.values(partnerContributions).forEach(contribution => {
                const outstandingAmount = averageContribution - contribution.netContribution;
                
                if (Math.abs(outstandingAmount) > 0.01) { // Only create settlement if amount is significant
                    settlements.push({
                        partner_id: contribution.partner.partner_id,
                        payment_amount: Math.max(0, outstandingAmount),
                        previous_balance: contribution.partner.current_balance || 0,
                        outstanding_amount: Math.abs(outstandingAmount),
                        final_balance: contribution.partner.current_balance + outstandingAmount,
                        date: settlementDate,
                        linked_project_id: projectId
                    });
                }
            });

            if (settlements.length === 0) {
                app.showInfo('التسويات متوازنة بالفعل - لا توجد تسويات مطلوبة');
                bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
                return;
            }

            // Show settlement preview
            this.showSettlementPreview(settlements, partners, projectId, settlementDate);

        } catch (error) {
            app.showError('خطأ في حساب التسويات: ' + error.message);
        }
    }

    async showSettlementPreview(settlements, partners, projectId, settlementDate) {
        const project = await dbManager.get('projects', projectId);
        
        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">معاينة التسويات - ${project.name}</h6>
                <p class="text-muted">تاريخ التسوية: ${app.formatDate(settlementDate)}</p>
            </div>
            
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>الشريك</th>
                            <th>المبلغ المدفوع</th>
                            <th>الرصيد السابق</th>
                            <th>المبلغ المستحق</th>
                            <th>الرصيد النهائي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${settlements.map(settlement => {
                            const partner = partners.find(p => p.partner_id === settlement.partner_id);
                            return `
                                <tr>
                                    <td>${partner ? partner.name : 'غير محدد'}</td>
                                    <td>${app.formatCurrency(settlement.payment_amount)}</td>
                                    <td>${app.formatCurrency(settlement.previous_balance)}</td>
                                    <td class="${settlement.outstanding_amount > 0 ? 'text-danger' : 'text-success'}">
                                        ${app.formatCurrency(settlement.outstanding_amount)}
                                    </td>
                                    <td>${app.formatCurrency(settlement.final_balance)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                سيتم إنشاء ${settlements.length} تسوية وتحديث أرصدة الشركاء
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                    إلغاء
                </button>
                <button type="button" class="btn btn-success" onclick="settlementsModule.saveCalculatedSettlements(${JSON.stringify(settlements).replace(/"/g, '&quot;')})">
                    <i class="fas fa-save me-1"></i>
                    حفظ التسويات
                </button>
            </div>
        `;

        app.showModal('معاينة التسويات', modalContent);
    }

    async saveCalculatedSettlements(settlements) {
        try {
            // Save all settlements
            for (const settlementData of settlements) {
                await dbManager.addSettlement(settlementData);
                
                // Update partner balance
                await dbManager.updatePartnerBalance(settlementData.partner_id, settlementData.final_balance);
            }

            app.showSuccess(`تم حفظ ${settlements.length} تسوية بنجاح`);
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadSettlementsModule();
        } catch (error) {
            app.showError('خطأ في حفظ التسويات: ' + error.message);
        }
    }

    async showAddSettlementModal() {
        const partners = await dbManager.getAll('partners');
        const projects = await dbManager.getAll('projects');
        
        const modalContent = `
            <form id="addSettlementForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="settlementPartner" class="form-label">الشريك *</label>
                        <select class="form-select" id="settlementPartner" required>
                            <option value="">اختر الشريك</option>
                            ${partners.map(partner => `
                                <option value="${partner.partner_id}">${partner.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="settlementProject" class="form-label">المشروع</label>
                        <select class="form-select" id="settlementProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}">${project.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="paymentAmount" class="form-label">المبلغ المدفوع *</label>
                        <input type="number" class="form-control" id="paymentAmount" 
                               step="0.01" min="0" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="settlementDate" class="form-label">تاريخ التسوية *</label>
                        <input type="date" class="form-control" id="settlementDate" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="previousBalance" class="form-label">الرصيد السابق</label>
                        <input type="number" class="form-control" id="previousBalance" 
                               step="0.01" value="0" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="outstandingAmount" class="form-label">المبلغ المستحق</label>
                        <input type="number" class="form-control" id="outstandingAmount" 
                               step="0.01" value="0">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="finalBalance" class="form-label">الرصيد النهائي</label>
                    <input type="number" class="form-control" id="finalBalance" 
                           step="0.01" value="0" readonly>
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

        const modal = app.showModal('إضافة تسوية يدوية', modalContent);
        
        // Set default date to today
        document.getElementById('settlementDate').value = new Date().toISOString().split('T')[0];
        
        // Add event listeners for automatic calculations
        document.getElementById('settlementPartner').addEventListener('change', () => {
            this.updatePartnerBalance();
        });
        
        document.getElementById('paymentAmount').addEventListener('input', () => {
            this.calculateFinalBalance();
        });
        
        document.getElementById('outstandingAmount').addEventListener('input', () => {
            this.calculateFinalBalance();
        });
        
        document.getElementById('addSettlementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettlement();
        });
    }

    async updatePartnerBalance() {
        const partnerId = document.getElementById('settlementPartner').value;
        if (partnerId) {
            const partner = await dbManager.get('partners', partnerId);
            if (partner) {
                document.getElementById('previousBalance').value = partner.current_balance || 0;
                this.calculateFinalBalance();
            }
        }
    }

    calculateFinalBalance() {
        const previousBalance = parseFloat(document.getElementById('previousBalance').value) || 0;
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value) || 0;
        const outstandingAmount = parseFloat(document.getElementById('outstandingAmount').value) || 0;
        
        const finalBalance = previousBalance + paymentAmount - outstandingAmount;
        document.getElementById('finalBalance').value = finalBalance.toFixed(2);
    }

    async saveSettlement() {
        try {
            const settlementData = {
                partner_id: parseInt(document.getElementById('settlementPartner').value),
                linked_project_id: document.getElementById('settlementProject').value || null,
                payment_amount: parseFloat(document.getElementById('paymentAmount').value),
                previous_balance: parseFloat(document.getElementById('previousBalance').value) || 0,
                outstanding_amount: parseFloat(document.getElementById('outstandingAmount').value) || 0,
                final_balance: parseFloat(document.getElementById('finalBalance').value),
                date: document.getElementById('settlementDate').value
            };

            await dbManager.addSettlement(settlementData);
            
            // Update partner balance
            await dbManager.updatePartnerBalance(settlementData.partner_id, settlementData.final_balance);
            
            app.showSuccess('تم إضافة التسوية بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadSettlementsModule();
        } catch (error) {
            app.showError('خطأ في حفظ التسوية: ' + error.message);
        }
    }

    async editSettlement(settlementId) {
        const settlement = await dbManager.get('settlements', settlementId);
        if (!settlement) {
            app.showError('التسوية غير موجودة');
            return;
        }

        const partners = await dbManager.getAll('partners');
        const projects = await dbManager.getAll('projects');
        
        const modalContent = `
            <form id="editSettlementForm">
                <input type="hidden" id="editSettlementId" value="${settlement.settlement_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editSettlementPartner" class="form-label">الشريك *</label>
                        <select class="form-select" id="editSettlementPartner" required>
                            <option value="">اختر الشريك</option>
                            ${partners.map(partner => `
                                <option value="${partner.partner_id}" 
                                        ${settlement.partner_id == partner.partner_id ? 'selected' : ''}>
                                    ${partner.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editSettlementProject" class="form-label">المشروع</label>
                        <select class="form-select" id="editSettlementProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}" 
                                        ${settlement.linked_project_id == project.project_id ? 'selected' : ''}>
                                    ${project.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editPaymentAmount" class="form-label">المبلغ المدفوع *</label>
                        <input type="number" class="form-control" id="editPaymentAmount" 
                               value="${settlement.payment_amount}" step="0.01" min="0" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editSettlementDate" class="form-label">تاريخ التسوية *</label>
                        <input type="date" class="form-control" id="editSettlementDate" 
                               value="${settlement.date}" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editPreviousBalance" class="form-label">الرصيد السابق</label>
                        <input type="number" class="form-control" id="editPreviousBalance" 
                               value="${settlement.previous_balance}" step="0.01">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editOutstandingAmount" class="form-label">المبلغ المستحق</label>
                        <input type="number" class="form-control" id="editOutstandingAmount" 
                               value="${settlement.outstanding_amount}" step="0.01">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editFinalBalance" class="form-label">الرصيد النهائي</label>
                    <input type="number" class="form-control" id="editFinalBalance" 
                           value="${settlement.final_balance}" step="0.01">
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

        const modal = app.showModal('تعديل التسوية', modalContent);
        
        document.getElementById('editSettlementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateSettlement();
        });
    }

    async updateSettlement() {
        try {
            const settlementId = parseInt(document.getElementById('editSettlementId').value);
            const settlement = await dbManager.get('settlements', settlementId);
            
            if (!settlement) {
                app.showError('التسوية غير موجودة');
                return;
            }

            // Store old values for balance updates
            const oldPartnerId = settlement.partner_id;
            const oldFinalBalance = settlement.final_balance;

            settlement.partner_id = parseInt(document.getElementById('editSettlementPartner').value);
            settlement.linked_project_id = document.getElementById('editSettlementProject').value || null;
            settlement.payment_amount = parseFloat(document.getElementById('editPaymentAmount').value);
            settlement.previous_balance = parseFloat(document.getElementById('editPreviousBalance').value) || 0;
            settlement.outstanding_amount = parseFloat(document.getElementById('editOutstandingAmount').value) || 0;
            settlement.final_balance = parseFloat(document.getElementById('editFinalBalance').value);
            settlement.date = document.getElementById('editSettlementDate').value;

            await dbManager.update('settlements', settlement);

            // Update partner balances
            if (oldPartnerId !== settlement.partner_id) {
                // Revert old partner balance
                const oldPartner = await dbManager.get('partners', oldPartnerId);
                if (oldPartner) {
                    oldPartner.current_balance = oldPartner.current_balance - oldFinalBalance + oldPartner.previous_balance;
                    await dbManager.updatePartnerBalance(oldPartnerId, oldPartner.current_balance);
                }
            }

            // Update new partner balance
            await dbManager.updatePartnerBalance(settlement.partner_id, settlement.final_balance);
            
            app.showSuccess('تم تحديث التسوية بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadSettlementsModule();
        } catch (error) {
            app.showError('خطأ في تحديث التسوية: ' + error.message);
        }
    }

    async viewSettlementDetails(settlementId) {
        const settlement = await dbManager.get('settlements', settlementId);
        if (!settlement) {
            app.showError('التسوية غير موجودة');
            return;
        }

        const partner = await dbManager.get('partners', settlement.partner_id);
        const project = settlement.linked_project_id ? await dbManager.get('projects', settlement.linked_project_id) : null;

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات التسوية</h6>
                    <table class="table table-sm">
                        <tr><td>الشريك:</td><td>${partner ? partner.name : 'غير محدد'}</td></tr>
                        <tr><td>المشروع:</td><td>${project ? project.name : 'غير محدد'}</td></tr>
                        <tr><td>المبلغ المدفوع:</td><td>${app.formatCurrency(settlement.payment_amount)}</td></tr>
                        <tr><td>الرصيد السابق:</td><td>${app.formatCurrency(settlement.previous_balance)}</td></tr>
                        <tr><td>المبلغ المستحق:</td><td>${app.formatCurrency(settlement.outstanding_amount)}</td></tr>
                        <tr><td>الرصيد النهائي:</td><td>${app.formatCurrency(settlement.final_balance)}</td></tr>
                        <tr><td>تاريخ التسوية:</td><td>${app.formatDate(settlement.date)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">ملخص التسوية</h6>
                    <div class="card">
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <h5 class="text-primary">${app.formatCurrency(settlement.payment_amount)}</h5>
                                    <small>المبلغ المدفوع</small>
                                </div>
                                <div class="col-6">
                                    <h5 class="text-danger">${app.formatCurrency(settlement.outstanding_amount)}</h5>
                                    <small>المبلغ المستحق</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <h5 class="${settlement.final_balance >= 0 ? 'text-success' : 'text-danger'}">
                                    ${app.formatCurrency(settlement.final_balance)}
                                </h5>
                                <small>الرصيد النهائي</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        app.showModal(`تفاصيل التسوية - ${settlement.settlement_id}`, modalContent);
    }

    async deleteSettlement(settlementId) {
        const confirmed = await app.confirm('هل أنت متأكد من حذف هذه التسوية؟');
        if (!confirmed) return;

        try {
            const settlement = await dbManager.get('settlements', settlementId);
            if (!settlement) {
                app.showError('التسوية غير موجودة');
                return;
            }

            // Revert partner balance
            const partner = await dbManager.get('partners', settlement.partner_id);
            if (partner) {
                const revertedBalance = partner.current_balance - settlement.final_balance + settlement.previous_balance;
                await dbManager.updatePartnerBalance(settlement.partner_id, revertedBalance);
            }

            await dbManager.delete('settlements', settlementId);
            app.showSuccess('تم حذف التسوية بنجاح');
            await this.loadSettlementsModule();
        } catch (error) {
            app.showError('خطأ في حذف التسوية: ' + error.message);
        }
    }

    searchSettlements() {
        const searchTerm = document.getElementById('settlementSearch').value.toLowerCase();
        const filteredSettlements = this.currentSettlements.filter(settlement => 
            settlement.partner_name.toLowerCase().includes(searchTerm) ||
            settlement.project_name.toLowerCase().includes(searchTerm)
        );

        this.renderFilteredSettlements(filteredSettlements);
    }

    filterSettlements() {
        const projectFilter = document.getElementById('projectFilter').value;
        const searchTerm = document.getElementById('settlementSearch').value.toLowerCase();
        
        let filteredSettlements = this.currentSettlements;
        
        if (projectFilter) {
            filteredSettlements = filteredSettlements.filter(s => s.linked_project_id == projectFilter);
        }
        
        if (searchTerm) {
            filteredSettlements = filteredSettlements.filter(s => 
                s.partner_name.toLowerCase().includes(searchTerm) ||
                s.project_name.toLowerCase().includes(searchTerm)
            );
        }

        this.renderFilteredSettlements(filteredSettlements);
    }

    renderFilteredSettlements(filteredSettlements) {
        const container = document.getElementById('settlementsTableContainer');
        
        if (filteredSettlements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                </div>
            `;
            return;
        }

        const headers = ['الشريك', 'المشروع', 'المبلغ المدفوع', 'الرصيد السابق', 'المبلغ المستحق', 'الرصيد النهائي', 'التاريخ'];
        
        const tableData = filteredSettlements.map(settlement => ({
            partner: settlement.partner_name,
            project: settlement.project_name,
            payment_amount: app.formatCurrency(settlement.payment_amount),
            previous_balance: app.formatCurrency(settlement.previous_balance),
            outstanding_amount: app.formatCurrency(settlement.outstanding_amount),
            final_balance: app.formatCurrency(settlement.final_balance),
            date: app.formatDate(settlement.date)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `settlementsModule.editSettlement(${settlement.settlement_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `settlementsModule.viewSettlementDetails(${settlement.settlement_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `settlementsModule.deleteSettlement(${settlement.settlement_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportSettlements() {
        try {
            const data = await dbManager.getAll('settlements');
            const csvContent = this.convertToCSV(data);
            this.downloadCSV(csvContent, 'settlements_export.csv');
            app.showSuccess('تم تصدير بيانات التسويات بنجاح');
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

// Initialize settlements module
const settlementsModule = new SettlementsModule();

// Global function for navigation
window.loadSettlementsModule = () => settlementsModule.loadSettlementsModule();