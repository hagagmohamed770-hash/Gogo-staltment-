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
        this.currentPartners = await app.dbManager.getAll('partners');
        
        // Load project names for each partner
        for (let partner of this.currentPartners) {
            if (partner.project_id) {
                try {
                    const project = await app.dbManager.get('projects', partner.project_id);
                    partner.project_name = project ? project.name : 'غير محدد';
                } catch (error) {
                    partner.project_name = 'غير محدد';
                }
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
                        <button class="btn btn-primary" onclick="partnersModule.showAddPartnerModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة شريك جديد
                        </button>
                    </div>
                </div>

                <div class="search-filter-container">
                    <div class="row">
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
            share: `${partner.share_percentage || 0}%`,
            previous_balance: app.formatCurrency(partner.previous_balance || 0),
            current_balance: app.formatCurrency(partner.current_balance || 0),
            created_at: app.formatDate(partner.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `partnersModule.viewPartnerDetails(${partner.partner_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `partnersModule.editPartner(${partner.partner_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `partnersModule.deletePartner(${partner.partner_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    async showAddPartnerModal() {
        const projects = await app.dbManager.getAll('projects');
        const projectOptions = projects.map(project => 
            `<option value="${project.project_id}">${project.name}</option>`
        ).join('');

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
                            ${projectOptions}
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="partnerShare" class="form-label">نسبة المشاركة (%)</label>
                        <input type="number" class="form-control" id="partnerShare" min="0" max="100" value="0">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="partnerBalance" class="form-label">الرصيد الأولي</label>
                        <input type="number" class="form-control" id="partnerBalance" step="0.01" value="0">
                    </div>
                </div>
                <div class="mb-3">
                    <label for="partnerNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="partnerNotes" rows="3"></textarea>
                </div>
            </form>
        `;

        await app.showModal('إضافة شريك جديد', modalContent);
        
        // Add form submission handler
        document.getElementById('addPartnerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePartner();
        });
    }

    async savePartner() {
        const formData = {
            name: document.getElementById('partnerName').value.trim(),
            project_id: document.getElementById('partnerProject').value || null,
            share_percentage: parseFloat(document.getElementById('partnerShare').value) || 0,
            previous_balance: parseFloat(document.getElementById('partnerBalance').value) || 0,
            current_balance: parseFloat(document.getElementById('partnerBalance').value) || 0,
            notes: document.getElementById('partnerNotes').value.trim()
        };

        if (!formData.name) {
            app.showError('يرجى إدخال اسم الشريك');
            return;
        }

        try {
            await app.dbManager.addPartner(formData);
            app.showSuccess('تم إضافة الشريك بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadPartnersModule();
        } catch (error) {
            app.showError('خطأ في إضافة الشريك: ' + error.message);
        }
    }

    async editPartner(partnerId) {
        const partner = await app.dbManager.get('partners', partnerId);
        if (!partner) {
            app.showError('الشريك غير موجود');
            return;
        }

        const projects = await app.dbManager.getAll('projects');
        const projectOptions = projects.map(project => 
            `<option value="${project.project_id}" ${partner.project_id === project.project_id ? 'selected' : ''}>${project.name}</option>`
        ).join('');

        const modalContent = `
            <form id="editPartnerForm">
                <input type="hidden" id="editPartnerId" value="${partner.partner_id}">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerName" class="form-label">اسم الشريك *</label>
                        <input type="text" class="form-control" id="editPartnerName" value="${partner.name}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerProject" class="form-label">المشروع</label>
                        <select class="form-select" id="editPartnerProject">
                            <option value="">اختر المشروع</option>
                            ${projectOptions}
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerShare" class="form-label">نسبة المشاركة (%)</label>
                        <input type="number" class="form-control" id="editPartnerShare" min="0" max="100" value="${partner.share_percentage || 0}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editPartnerBalance" class="form-label">الرصيد الحالي</label>
                        <input type="number" class="form-control" id="editPartnerBalance" step="0.01" value="${partner.current_balance || 0}">
                    </div>
                </div>
                <div class="mb-3">
                    <label for="editPartnerNotes" class="form-label">ملاحظات</label>
                    <textarea class="form-control" id="editPartnerNotes" rows="3">${partner.notes || ''}</textarea>
                </div>
            </form>
        `;

        await app.showModal('تعديل بيانات الشريك', modalContent);
        
        // Add form submission handler
        document.getElementById('editPartnerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePartner();
        });
    }

    async updatePartner() {
        const partnerId = parseInt(document.getElementById('editPartnerId').value);
        const partner = await app.dbManager.get('partners', partnerId);
        
        if (!partner) {
            app.showError('الشريك غير موجود');
            return;
        }

        const updatedData = {
            ...partner,
            name: document.getElementById('editPartnerName').value.trim(),
            project_id: document.getElementById('editPartnerProject').value || null,
            share_percentage: parseFloat(document.getElementById('editPartnerShare').value) || 0,
            current_balance: parseFloat(document.getElementById('editPartnerBalance').value) || 0,
            notes: document.getElementById('editPartnerNotes').value.trim()
        };

        if (!updatedData.name) {
            app.showError('يرجى إدخال اسم الشريك');
            return;
        }

        try {
            await app.dbManager.update('partners', updatedData);
            app.showSuccess('تم تحديث بيانات الشريك بنجاح');
            
            // Close modal and reload
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            await this.loadPartnersModule();
        } catch (error) {
            app.showError('خطأ في تحديث بيانات الشريك: ' + error.message);
        }
    }

    async viewPartnerDetails(partnerId) {
        const partner = await app.dbManager.get('partners', partnerId);
        if (!partner) {
            app.showError('الشريك غير موجود');
            return;
        }

        let projectName = 'غير محدد';
        if (partner.project_id) {
            try {
                const project = await app.dbManager.get('projects', partner.project_id);
                projectName = project ? project.name : 'غير محدد';
            } catch (error) {
                projectName = 'غير محدد';
            }
        }

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>المعلومات الأساسية</h6>
                    <p><strong>الاسم:</strong> ${partner.name}</p>
                    <p><strong>المشروع:</strong> ${projectName}</p>
                    <p><strong>نسبة المشاركة:</strong> ${partner.share_percentage || 0}%</p>
                </div>
                <div class="col-md-6">
                    <h6>المعلومات المالية</h6>
                    <p><strong>الرصيد السابق:</strong> ${app.formatCurrency(partner.previous_balance || 0)}</p>
                    <p><strong>الرصيد الحالي:</strong> ${app.formatCurrency(partner.current_balance || 0)}</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${app.formatDate(partner.created_at)}</p>
                </div>
            </div>
            ${partner.notes ? `<div class="mt-3"><h6>ملاحظات</h6><p>${partner.notes}</p></div>` : ''}
        `;

        await app.showModal('تفاصيل الشريك', modalContent);
    }

    async deletePartner(partnerId) {
        const confirmed = await app.showConfirm('هل أنت متأكد من حذف هذا الشريك؟', 'تأكيد الحذف');
        
        if (confirmed) {
            try {
                await app.dbManager.delete('partners', partnerId);
                app.showSuccess('تم حذف الشريك بنجاح');
                await this.loadPartnersModule();
            } catch (error) {
                app.showError('خطأ في حذف الشريك: ' + error.message);
            }
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
                    <p class="text-muted">جرب البحث بكلمات مختلفة</p>
                </div>
            `;
            return;
        }

        const headers = ['الاسم', 'المشروع', 'نسبة المشاركة', 'الرصيد السابق', 'الرصيد الحالي', 'تاريخ الإنشاء'];
        
        const tableData = filteredPartners.map(partner => ({
            name: partner.name,
            project: partner.project_name,
            share: `${partner.share_percentage || 0}%`,
            previous_balance: app.formatCurrency(partner.previous_balance || 0),
            current_balance: app.formatCurrency(partner.current_balance || 0),
            created_at: app.formatDate(partner.created_at)
        }));

        const actions = [
            {
                class: 'btn-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `partnersModule.viewPartnerDetails(${partner.partner_id})`
            },
            {
                class: 'btn-warning',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `partnersModule.editPartner(${partner.partner_id})`
            },
            {
                class: 'btn-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `partnersModule.deletePartner(${partner.partner_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }

    async exportPartners() {
        try {
            const csvContent = this.convertToCSV(this.currentPartners);
            this.downloadCSV(csvContent, 'partners.csv');
            app.showSuccess('تم تصدير بيانات الشركاء بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const headers = ['الاسم', 'المشروع', 'نسبة المشاركة', 'الرصيد السابق', 'الرصيد الحالي', 'تاريخ الإنشاء', 'ملاحظات'];
        const csvData = data.map(partner => [
            partner.name,
            partner.project_name,
            `${partner.share_percentage || 0}%`,
            partner.previous_balance || 0,
            partner.current_balance || 0,
            partner.created_at,
            partner.notes || ''
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

// Initialize partners module
const partnersModule = new PartnersModule();

// Global function for navigation
window.loadPartnersModule = () => partnersModule.loadPartnersModule();