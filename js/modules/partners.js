// Partners Management Module
class PartnersModule {
    constructor() {
        this.currentPartners = [];
    }

    async loadPartnersModule() {
        app.currentModule = 'partners';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadPartners();
            this.renderPartnersPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات الشركاء: ' + error.message);
        }
    }

    async loadPartners() {
        this.currentPartners = await dbManager.getAll('partners');
        
        // Load project names for each partner
        for (let partner of this.currentPartners) {
            if (partner.project_id) {
                const project = await dbManager.get('projects', partner.project_id);
                partner.project_name = project ? project.name : 'غير محدد';
            } else {
                partner.project_name = 'غير محدد';
            }
        }
    }

    renderPartnersPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-users me-2"></i>
                            إدارة الشركاء
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-custom" onclick="partnersModule.showAddPartnerModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة شريك جديد
                        </button>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="partnerSearch" 
                                   placeholder="البحث في الشركاء..." onkeyup="partnersModule.searchPartners()">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-outline-secondary" onclick="partnersModule.exportPartners()">
                            <i class="fas fa-download me-1"></i>
                            تصدير
                        </button>
                    </div>
                </div>

                <div id="partnersTableContainer">
                    ${this.renderPartnersTable()}
                </div>
            </div>
        `;
    }

    renderPartnersTable() {
        if (this.currentPartners.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد شركاء مسجلين</h5>
                    <p class="text-muted">قم بإضافة شريك جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['الاسم', 'المشروع', 'نسبة المشاركة', 'الرصيد السابق', 'الرصيد الحالي', 'تاريخ الإنشاء'];
        
        const tableData = this.currentPartners.map(partner => ({
            name: partner.name,
            project: partner.project_name,
            share: `${partner.share_percentage}%`,
            previous_balance: app.formatCurrency(partner.previous_balance || 0),
            current_balance: app.formatCurrency(partner.current_balance || 0),
            created_at: app.formatDate(partner.created_at)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `partnersModule.editPartner(${partner.partner_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `partnersModule.viewPartnerDetails(${partner.partner_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `partnersModule.deletePartner(${partner.partner_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async showAddPartnerModal() {
        const projects = await dbManager.getAll('projects');
        
        const modalContent = `
            <form id="addPartnerForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="partnerName" class="form-label">اسم الشريك *</label>
                        <input type="text" class="form-control" id="partnerName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="partnerProject" class="form-label">المشروع</label>
                        <select class="form-select" id="partnerProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}">${project.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="sharePercentage" class="form-label">نسبة المشاركة (%) *</label>
                        <input type="number" class="form-control" id="sharePercentage" 
                               min="0" max="100" step="0.01" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="previousBalance" class="form-label">الرصيد السابق</label>
                        <input type="number" class="form-control" id="previousBalance" 
                               step="0.01" value="0">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="currentBalance" class="form-label">الرصيد الحالي</label>
                        <input type="number" class="form-control" id="currentBalance" 
                               step="0.01" value="0">
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

        const modal = app.showModal('إضافة شريك جديد', modalContent);
        
        document.getElementById('addPartnerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePartner();
        });
    }

    async savePartner() {
        try {
            const partnerData = {
                name: document.getElementById('partnerName').value,
                project_id: document.getElementById('partnerProject').value || null,
                share_percentage: parseFloat(document.getElementById('sharePercentage').value),
                previous_balance: parseFloat(document.getElementById('previousBalance').value) || 0,
                current_balance: parseFloat(document.getElementById('currentBalance').value) || 0
            };

            await dbManager.addPartner(partnerData);
            
            app.showSuccess('تم إضافة الشريك بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadPartnersModule();
        } catch (error) {
            app.showError('خطأ في حفظ الشريك: ' + error.message);
        }
    }

    async editPartner(partnerId) {
        const partner = await dbManager.get('partners', partnerId);
        if (!partner) {
            app.showError('الشريك غير موجود');
            return;
        }

        const projects = await dbManager.getAll('projects');
        
        const modalContent = `
            <form id="editPartnerForm">
                <input type="hidden" id="editPartnerId" value="${partner.partner_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerName" class="form-label">اسم الشريك *</label>
                        <input type="text" class="form-control" id="editPartnerName" 
                               value="${partner.name}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerProject" class="form-label">المشروع</label>
                        <select class="form-select" id="editPartnerProject">
                            <option value="">اختر المشروع</option>
                            ${projects.map(project => `
                                <option value="${project.project_id}" 
                                        ${partner.project_id == project.project_id ? 'selected' : ''}>
                                    ${project.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editSharePercentage" class="form-label">نسبة المشاركة (%) *</label>
                        <input type="number" class="form-control" id="editSharePercentage" 
                               value="${partner.share_percentage}" min="0" max="100" step="0.01" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editPreviousBalance" class="form-label">الرصيد السابق</label>
                        <input type="number" class="form-control" id="editPreviousBalance" 
                               value="${partner.previous_balance || 0}" step="0.01">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCurrentBalance" class="form-label">الرصيد الحالي</label>
                        <input type="number" class="form-control" id="editCurrentBalance" 
                               value="${partner.current_balance || 0}" step="0.01">
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

        const modal = app.showModal('تعديل الشريك', modalContent);
        
        document.getElementById('editPartnerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePartner();
        });
    }

    async updatePartner() {
        try {
            const partnerId = parseInt(document.getElementById('editPartnerId').value);
            const partner = await dbManager.get('partners', partnerId);
            
            if (!partner) {
                app.showError('الشريك غير موجود');
                return;
            }

            partner.name = document.getElementById('editPartnerName').value;
            partner.project_id = document.getElementById('editPartnerProject').value || null;
            partner.share_percentage = parseFloat(document.getElementById('editSharePercentage').value);
            partner.previous_balance = parseFloat(document.getElementById('editPreviousBalance').value) || 0;
            partner.current_balance = parseFloat(document.getElementById('editCurrentBalance').value) || 0;
            partner.updated_at = new Date().toISOString();

            await dbManager.update('partners', partner);
            
            app.showSuccess('تم تحديث الشريك بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadPartnersModule();
        } catch (error) {
            app.showError('خطأ في تحديث الشريك: ' + error.message);
        }
    }

    async viewPartnerDetails(partnerId) {
        const partner = await dbManager.get('partners', partnerId);
        if (!partner) {
            app.showError('الشريك غير موجود');
            return;
        }

        const project = partner.project_id ? await dbManager.get('projects', partner.project_id) : null;
        const transactions = await dbManager.getTransactionsByPartner(partnerId);
        const settlements = await dbManager.getSettlementsByPartner(partnerId);

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات الشريك</h6>
                    <table class="table table-sm">
                        <tr><td>الاسم:</td><td>${partner.name}</td></tr>
                        <tr><td>المشروع:</td><td>${project ? project.name : 'غير محدد'}</td></tr>
                        <tr><td>نسبة المشاركة:</td><td>${partner.share_percentage}%</td></tr>
                        <tr><td>الرصيد السابق:</td><td>${app.formatCurrency(partner.previous_balance || 0)}</td></tr>
                        <tr><td>الرصيد الحالي:</td><td>${app.formatCurrency(partner.current_balance || 0)}</td></tr>
                        <tr><td>تاريخ الإنشاء:</td><td>${app.formatDate(partner.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">إحصائيات</h6>
                    <div class="row">
                        <div class="col-6">
                            <div class="text-center p-3 bg-light rounded">
                                <h4 class="text-primary">${transactions.length}</h4>
                                <small>المعاملات</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="text-center p-3 bg-light rounded">
                                <h4 class="text-success">${settlements.length}</h4>
                                <small>التسويات</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h6 class="fw-bold">آخر المعاملات</h6>
                ${transactions.length > 0 ? `
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
                                ${transactions.slice(0, 5).map(t => `
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

        app.showModal(`تفاصيل الشريك - ${partner.name}`, modalContent);
    }

    async deletePartner(partnerId) {
        const confirmed = await app.confirm('هل أنت متأكد من حذف هذا الشريك؟');
        if (!confirmed) return;

        try {
            // Check if partner has transactions or settlements
            const transactions = await dbManager.getTransactionsByPartner(partnerId);
            const settlements = await dbManager.getSettlementsByPartner(partnerId);

            if (transactions.length > 0 || settlements.length > 0) {
                app.showWarning('لا يمكن حذف الشريك لوجود معاملات أو تسويات مرتبطة به');
                return;
            }

            await dbManager.delete('partners', partnerId);
            app.showSuccess('تم حذف الشريك بنجاح');
            await this.loadPartnersModule();
        } catch (error) {
            app.showError('خطأ في حذف الشريك: ' + error.message);
        }
    }

    searchPartners() {
        const searchTerm = document.getElementById('partnerSearch').value.toLowerCase();
        const filteredPartners = this.currentPartners.filter(partner => 
            partner.name.toLowerCase().includes(searchTerm) ||
            partner.project_name.toLowerCase().includes(searchTerm)
        );

        this.renderFilteredPartners(filteredPartners);
    }

    renderFilteredPartners(filteredPartners) {
        const container = document.getElementById('partnersTableContainer');
        
        if (filteredPartners.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                </div>
            `;
            return;
        }

        const headers = ['الاسم', 'المشروع', 'نسبة المشاركة', 'الرصيد السابق', 'الرصيد الحالي', 'تاريخ الإنشاء'];
        
        const tableData = filteredPartners.map(partner => ({
            name: partner.name,
            project: partner.project_name,
            share: `${partner.share_percentage}%`,
            previous_balance: app.formatCurrency(partner.previous_balance || 0),
            current_balance: app.formatCurrency(partner.current_balance || 0),
            created_at: app.formatDate(partner.created_at)
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `partnersModule.editPartner(${partner.partner_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `partnersModule.viewPartnerDetails(${partner.partner_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `partnersModule.deletePartner(${partner.partner_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportPartners() {
        try {
            const data = await dbManager.getAll('partners');
            const csvContent = this.convertToCSV(data);
            this.downloadCSV(csvContent, 'partners_export.csv');
            app.showSuccess('تم تصدير بيانات الشركاء بنجاح');
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

// Initialize partners module
const partnersModule = new PartnersModule();

// Global function for navigation
window.loadPartnersModule = () => partnersModule.loadPartnersModule();