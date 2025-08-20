// Projects Management Module
class ProjectsModule {
    constructor() {
        this.currentProjects = [];
    }

    async loadProjectsModule() {
        app.currentModule = 'projects';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            await this.loadProjects();
            this.renderProjectsPage();
        } catch (error) {
            app.showError('خطأ في تحميل بيانات المشاريع: ' + error.message);
        }
    }

    async loadProjects() {
        this.currentProjects = await app.dbManager.getAll('projects');
        
        // Calculate total share percentage for each project
        for (let project of this.currentProjects) {
            const partners = await app.dbManager.getByIndex('partners', 'project_id', project.project_id);
            project.total_share_percentage = partners.reduce((sum, partner) => sum + (partner.share_percentage || 0), 0);
            project.partners_count = partners.length;
        }
    }

    renderProjectsPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <h2>
                            <i class="fas fa-project-diagram me-2"></i>
                            إدارة المشاريع
                        </h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary btn-custom" onclick="projectsModule.showAddProjectModal()">
                            <i class="fas fa-plus me-1"></i>
                            إضافة مشروع جديد
                        </button>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="projectSearch" 
                                   placeholder="البحث في المشاريع..." onkeyup="projectsModule.searchProjects()">
                            <span class="input-group-text">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <select class="form-select d-inline-block w-auto" id="statusFilter" onchange="projectsModule.filterByStatus()">
                            <option value="">جميع الحالات</option>
                            <option value="active">نشط</option>
                            <option value="completed">مكتمل</option>
                            <option value="paused">متوقف</option>
                        </select>
                    </div>
                </div>

                <div id="projectsTableContainer">
                    ${this.renderProjectsTable()}
                </div>
            </div>
        `;
    }

    renderProjectsTable() {
        if (this.currentProjects.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-project-diagram fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد مشاريع مسجلة</h5>
                    <p class="text-muted">قم بإضافة مشروع جديد للبدء</p>
                </div>
            `;
        }

        const headers = ['اسم المشروع', 'الوصف', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة', 'عدد الشركاء', 'إجمالي النسبة'];
        
        const tableData = this.currentProjects.map(project => ({
            name: project.name,
            description: project.description || 'لا يوجد وصف',
            start_date: app.formatDate(project.start_date),
            end_date: project.end_date ? app.formatDate(project.end_date) : 'غير محدد',
            status: this.getStatusBadge(project.status),
            partners_count: project.partners_count || 0,
            total_share: `${project.total_share_percentage || 0}%`
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `projectsModule.editProject(${project.project_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `projectsModule.viewProjectDetails(${project.project_id})`
            },
            {
                class: 'btn-outline-success',
                icon: 'fas fa-users',
                title: 'إدارة الشركاء',
                onclick: `projectsModule.manageProjectPartners(${project.project_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `projectsModule.deleteProject(${project.project_id})`
            }
        ];

        return app.createTable(headers, tableData, actions);
    }

    getStatusBadge(status) {
        const statusMap = {
            'active': '<span class="badge status-active">نشط</span>',
            'completed': '<span class="badge status-completed">مكتمل</span>',
            'paused': '<span class="badge status-pending">متوقف</span>'
        };
        return statusMap[status] || '<span class="badge bg-secondary">غير محدد</span>';
    }

    async showAddProjectModal() {
        const modalContent = `
            <form id="addProjectForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="projectName" class="form-label">اسم المشروع *</label>
                        <input type="text" class="form-control" id="projectName" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="projectStatus" class="form-label">حالة المشروع *</label>
                        <select class="form-select" id="projectStatus" required>
                            <option value="active">نشط</option>
                            <option value="completed">مكتمل</option>
                            <option value="paused">متوقف</option>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="startDate" class="form-label">تاريخ بداية المشروع *</label>
                        <input type="date" class="form-control" id="startDate" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="endDate" class="form-label">تاريخ انتهاء المشروع</label>
                        <input type="date" class="form-control" id="endDate">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="projectDescription" class="form-label">وصف المشروع</label>
                    <textarea class="form-control" id="projectDescription" rows="3" 
                              placeholder="أدخل وصف المشروع..."></textarea>
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

        const modal = app.showModal('إضافة مشروع جديد', modalContent);
        
        // Set default start date to today
        document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProject();
        });
    }

    async saveProject() {
        try {
            const projectData = {
                name: document.getElementById('projectName').value,
                description: document.getElementById('projectDescription').value,
                start_date: document.getElementById('startDate').value,
                end_date: document.getElementById('endDate').value || null,
                status: document.getElementById('projectStatus').value,
                total_share_percentage: 0
            };

            await app.dbManager.addProject(projectData);
            
            app.showSuccess('تم إضافة المشروع بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadProjectsModule();
        } catch (error) {
            app.showError('خطأ في حفظ المشروع: ' + error.message);
        }
    }

    async editProject(projectId) {
        const project = await app.dbManager.get('projects', projectId);
        if (!project) {
            app.showError('المشروع غير موجود');
            return;
        }

        const modalContent = `
            <form id="editProjectForm">
                <input type="hidden" id="editProjectId" value="${project.project_id}">
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editProjectName" class="form-label">اسم المشروع *</label>
                        <input type="text" class="form-control" id="editProjectName" 
                               value="${project.name}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editProjectStatus" class="form-label">حالة المشروع *</label>
                        <select class="form-select" id="editProjectStatus" required>
                            <option value="active" ${project.status === 'active' ? 'selected' : ''}>نشط</option>
                            <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                            <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>متوقف</option>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editStartDate" class="form-label">تاريخ بداية المشروع *</label>
                        <input type="date" class="form-control" id="editStartDate" 
                               value="${project.start_date}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editEndDate" class="form-label">تاريخ انتهاء المشروع</label>
                        <input type="date" class="form-control" id="editEndDate" 
                               value="${project.end_date || ''}">
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editProjectDescription" class="form-label">وصف المشروع</label>
                    <textarea class="form-control" id="editProjectDescription" rows="3">${project.description || ''}</textarea>
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

        const modal = app.showModal('تعديل المشروع', modalContent);
        
        document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProject();
        });
    }

    async updateProject() {
        try {
            const projectId = parseInt(document.getElementById('editProjectId').value);
            const project = await app.dbManager.get('projects', projectId);
            
            if (!project) {
                app.showError('المشروع غير موجود');
                return;
            }

            project.name = document.getElementById('editProjectName').value;
            project.description = document.getElementById('editProjectDescription').value;
            project.start_date = document.getElementById('editStartDate').value;
            project.end_date = document.getElementById('editEndDate').value || null;
            project.status = document.getElementById('editProjectStatus').value;
            project.updated_at = new Date().toISOString();

            await app.dbManager.update('projects', project);
            
            app.showSuccess('تم تحديث المشروع بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadProjectsModule();
        } catch (error) {
            app.showError('خطأ في تحديث المشروع: ' + error.message);
        }
    }

    async viewProjectDetails(projectId) {
        const project = await app.dbManager.get('projects', projectId);
        if (!project) {
            app.showError('المشروع غير موجود');
            return;
        }

        const partners = await app.dbManager.getByIndex('partners', 'project_id', projectId);
        const transactions = await app.dbManager.getByIndex('transactions', 'project_id', projectId);
        const settlements = await app.dbManager.getByIndex('settlements', 'project_id', projectId);

        const totalRevenue = transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">معلومات المشروع</h6>
                    <table class="table table-sm">
                        <tr><td>الاسم:</td><td>${project.name}</td></tr>
                        <tr><td>الوصف:</td><td>${project.description || 'لا يوجد وصف'}</td></tr>
                        <tr><td>الحالة:</td><td>${this.getStatusBadge(project.status)}</td></tr>
                        <tr><td>تاريخ البداية:</td><td>${app.formatDate(project.start_date)}</td></tr>
                        <tr><td>تاريخ الانتهاء:</td><td>${project.end_date ? app.formatDate(project.end_date) : 'غير محدد'}</td></tr>
                        <tr><td>تاريخ الإنشاء:</td><td>${app.formatDate(project.created_at)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">إحصائيات المشروع</h6>
                    <div class="row">
                        <div class="col-6 mb-2">
                            <div class="text-center p-2 bg-light rounded">
                                <h5 class="text-primary">${partners.length}</h5>
                                <small>الشركاء</small>
                            </div>
                        </div>
                        <div class="col-6 mb-2">
                            <div class="text-center p-2 bg-light rounded">
                                <h5 class="text-success">${transactions.length}</h5>
                                <small>المعاملات</small>
                            </div>
                        </div>
                        <div class="col-6 mb-2">
                            <div class="text-center p-2 bg-light rounded">
                                <h5 class="text-info">${settlements.length}</h5>
                                <small>التسويات</small>
                            </div>
                        </div>
                        <div class="col-6 mb-2">
                            <div class="text-center p-2 bg-light rounded">
                                <h5 class="text-warning">${app.formatCurrency(totalRevenue - totalExpenses)}</h5>
                                <small>صافي الربح</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h6 class="fw-bold">الشركاء في المشروع</h6>
                ${partners.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>نسبة المشاركة</th>
                                    <th>الرصيد الحالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${partners.map(p => `
                                    <tr>
                                        <td>${p.name}</td>
                                        <td>${p.share_percentage}%</td>
                                        <td>${app.formatCurrency(p.current_balance || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">لا يوجد شركاء في هذا المشروع</p>'}
            </div>
        `;

        app.showModal(`تفاصيل المشروع - ${project.name}`, modalContent);
    }

    async manageProjectPartners(projectId) {
        const project = await app.dbManager.get('projects', projectId);
        if (!project) {
            app.showError('المشروع غير موجود');
            return;
        }

        const partners = await app.dbManager.getByIndex('partners', 'project_id', projectId);
        const allPartners = await app.dbManager.getAll('partners');

        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">إدارة شركاء المشروع: ${project.name}</h6>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <h6>الشركاء الحاليون</h6>
                    ${partners.length > 0 ? `
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>النسبة</th>
                                        <th>الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${partners.map(p => `
                                        <tr>
                                            <td>${p.name}</td>
                                            <td>${p.share_percentage}%</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-danger" 
                                                        onclick="projectsModule.removePartnerFromProject(${p.partner_id}, ${projectId})">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p class="text-muted">لا يوجد شركاء في هذا المشروع</p>'}
                </div>
                
                <div class="col-md-6">
                    <h6>إضافة شريك جديد</h6>
                    <div class="mb-3">
                        <label for="newPartnerSelect" class="form-label">اختر الشريك</label>
                        <select class="form-select" id="newPartnerSelect">
                            <option value="">اختر شريك...</option>
                            ${allPartners.filter(p => !partners.find(ep => ep.partner_id === p.partner_id))
                                .map(p => `<option value="${p.partner_id}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="newPartnerShare" class="form-label">نسبة المشاركة (%)</label>
                        <input type="number" class="form-control" id="newPartnerShare" 
                               min="0" max="100" step="0.01">
                    </div>
                    <button class="btn btn-primary" onclick="projectsModule.addPartnerToProject(${projectId})">
                        <i class="fas fa-plus me-1"></i>
                        إضافة الشريك
                    </button>
                </div>
            </div>
        `;

        app.showModal('إدارة شركاء المشروع', modalContent);
    }

    async addPartnerToProject(projectId) {
        const partnerId = document.getElementById('newPartnerSelect').value;
        const sharePercentage = parseFloat(document.getElementById('newPartnerShare').value);

        if (!partnerId || !sharePercentage) {
            app.showError('يرجى اختيار الشريك ونسبة المشاركة');
            return;
        }

        try {
            const partner = await app.dbManager.get('partners', parseInt(partnerId));
            partner.project_id = projectId;
            partner.share_percentage = sharePercentage;
            partner.updated_at = new Date().toISOString();

            await app.dbManager.update('partners', partner);
            
            app.showSuccess('تم إضافة الشريك للمشروع بنجاح');
            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
            
            await this.loadProjectsModule();
        } catch (error) {
            app.showError('خطأ في إضافة الشريك: ' + error.message);
        }
    }

    async removePartnerFromProject(partnerId, projectId) {
        const confirmed = await app.confirm('هل أنت متأكد من إزالة هذا الشريك من المشروع؟');
        if (!confirmed) return;

        try {
            const partner = await app.dbManager.get('partners', partnerId);
            partner.project_id = null;
            partner.updated_at = new Date().toISOString();

            await app.dbManager.update('partners', partner);
            
            app.showSuccess('تم إزالة الشريك من المشروع بنجاح');
            await this.manageProjectPartners(projectId);
        } catch (error) {
            app.showError('خطأ في إزالة الشريك: ' + error.message);
        }
    }

    async deleteProject(projectId) {
        const confirmed = await app.confirm('هل أنت متأكد من حذف هذا المشروع؟');
        if (!confirmed) return;

        try {
            // Check if project has partners, transactions, or settlements
            const partners = await app.dbManager.getByIndex('partners', 'project_id', projectId);
            const transactions = await app.dbManager.getByIndex('transactions', 'project_id', projectId);
            const settlements = await app.dbManager.getByIndex('settlements', 'project_id', projectId);

            if (partners.length > 0 || transactions.length > 0 || settlements.length > 0) {
                app.showWarning('لا يمكن حذف المشروع لوجود شركاء أو معاملات أو تسويات مرتبطة به');
                return;
            }

            await app.dbManager.delete('projects', projectId);
            app.showSuccess('تم حذف المشروع بنجاح');
            await this.loadProjectsModule();
        } catch (error) {
            app.showError('خطأ في حذف المشروع: ' + error.message);
        }
    }

    searchProjects() {
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        const filteredProjects = this.currentProjects.filter(project => 
            project.name.toLowerCase().includes(searchTerm) ||
            (project.description && project.description.toLowerCase().includes(searchTerm))
        );

        this.renderFilteredProjects(filteredProjects);
    }

    filterByStatus() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
        
        let filteredProjects = this.currentProjects;
        
        if (statusFilter) {
            filteredProjects = filteredProjects.filter(project => project.status === statusFilter);
        }
        
        if (searchTerm) {
            filteredProjects = filteredProjects.filter(project => 
                project.name.toLowerCase().includes(searchTerm) ||
                (project.description && project.description.toLowerCase().includes(searchTerm))
            );
        }

        this.renderFilteredProjects(filteredProjects);
    }

    renderFilteredProjects(filteredProjects) {
        const container = document.getElementById('projectsTableContainer');
        
        if (filteredProjects.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">لا توجد نتائج</h5>
                </div>
            `;
            return;
        }

        const headers = ['اسم المشروع', 'الوصف', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة', 'عدد الشركاء', 'إجمالي النسبة'];
        
        const tableData = filteredProjects.map(project => ({
            name: project.name,
            description: project.description || 'لا يوجد وصف',
            start_date: app.formatDate(project.start_date),
            end_date: project.end_date ? app.formatDate(project.end_date) : 'غير محدد',
            status: this.getStatusBadge(project.status),
            partners_count: project.partners_count || 0,
            total_share: `${project.total_share_percentage || 0}%`
        }));

        const actions = [
            {
                class: 'btn-outline-primary',
                icon: 'fas fa-edit',
                title: 'تعديل',
                onclick: `projectsModule.editProject(${project.project_id})`
            },
            {
                class: 'btn-outline-info',
                icon: 'fas fa-eye',
                title: 'عرض التفاصيل',
                onclick: `projectsModule.viewProjectDetails(${project.project_id})`
            },
            {
                class: 'btn-outline-success',
                icon: 'fas fa-users',
                title: 'إدارة الشركاء',
                onclick: `projectsModule.manageProjectPartners(${project.project_id})`
            },
            {
                class: 'btn-outline-danger',
                icon: 'fas fa-trash',
                title: 'حذف',
                onclick: `projectsModule.deleteProject(${project.project_id})`
            }
        ];

        container.innerHTML = app.createTable(headers, tableData, actions);
    }
}

// Initialize projects module
const projectsModule = new ProjectsModule();

// Make module globally available
window.projectsModule = projectsModule;

// Global function for navigation
window.loadProjectsModule = () => projectsModule.loadProjectsModule();