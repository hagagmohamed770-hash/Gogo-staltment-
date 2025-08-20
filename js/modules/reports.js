// Reports Management Module
class ReportsModule {
    constructor() {
        this.currentReports = [];
    }

    async loadReportsModule() {
        app.currentModule = 'reports';
        app.updateActiveNav();
        
        const mainContent = document.getElementById('mainContent');
        app.showLoading(mainContent);

        try {
            this.renderReportsPage();
        } catch (error) {
            app.showError('خطأ في تحميل التقارير: ' + error.message);
        }
    }

    renderReportsPage() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="fade-in">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2>
                            <i class="fas fa-chart-bar me-2"></i>
                            التقارير
                        </h2>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-chart-pie fa-3x text-primary mb-3"></i>
                                <h5 class="card-title">تقرير مالي شامل</h5>
                                <p class="card-text">تقرير شامل عن الإيرادات والمصروفات والأرباح</p>
                                <button class="btn btn-primary" onclick="reportsModule.generateFinancialReport()">
                                    <i class="fas fa-download me-1"></i>
                                    تحميل التقرير
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-users fa-3x text-success mb-3"></i>
                                <h5 class="card-title">تقرير الشركاء</h5>
                                <p class="card-text">تقرير تفصيلي عن الشركاء وأرصدتهم</p>
                                <button class="btn btn-success" onclick="reportsModule.generatePartnersReport()">
                                    <i class="fas fa-download me-1"></i>
                                    تحميل التقرير
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-project-diagram fa-3x text-info mb-3"></i>
                                <h5 class="card-title">تقرير المشاريع</h5>
                                <p class="card-text">تقرير عن حالة المشاريع وأدائها</p>
                                <button class="btn btn-info" onclick="reportsModule.generateProjectsReport()">
                                    <i class="fas fa-download me-1"></i>
                                    تحميل التقرير
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-calculator fa-3x text-warning mb-3"></i>
                                <h5 class="card-title">تقرير التسويات</h5>
                                <p class="card-text">تقرير مفصل عن التسويات بين الشركاء</p>
                                <button class="btn btn-warning" onclick="reportsModule.generateSettlementsReport()">
                                    <i class="fas fa-download me-1"></i>
                                    تحميل التقرير
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-chart-line me-2"></i>
                                    تقرير مخصص
                                </h5>
                            </div>
                            <div class="card-body">
                                <form id="customReportForm">
                                    <div class="mb-3">
                                        <label for="reportType" class="form-label">نوع التقرير</label>
                                        <select class="form-select" id="reportType" required>
                                            <option value="">اختر نوع التقرير</option>
                                            <option value="transactions">معاملات</option>
                                            <option value="partners">شركاء</option>
                                            <option value="projects">مشاريع</option>
                                            <option value="settlements">تسويات</option>
                                            <option value="cashboxes">خزائن</option>
                                        </select>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="startDate" class="form-label">من تاريخ</label>
                                            <input type="date" class="form-control" id="startDate">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="endDate" class="form-label">إلى تاريخ</label>
                                            <input type="date" class="form-control" id="endDate">
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="projectFilter" class="form-label">تصفية حسب المشروع</label>
                                        <select class="form-select" id="projectFilter">
                                            <option value="">جميع المشاريع</option>
                                        </select>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-search me-1"></i>
                                        إنشاء التقرير
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-chart-area me-2"></i>
                                    إحصائيات سريعة
                                </h5>
                            </div>
                            <div class="card-body">
                                <div id="quickStats">
                                    <div class="text-center">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">جاري التحميل...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-history me-2"></i>
                                    التقارير المحفوظة
                                </h5>
                            </div>
                            <div class="card-body">
                                <div id="savedReports">
                                    <p class="text-muted text-center">لا توجد تقارير محفوظة</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadProjectFilterOptions();
        this.loadQuickStats();
    }

    async loadProjectFilterOptions() {
        try {
            const projects = await dbManager.getAll('projects');
            const projectFilter = document.getElementById('projectFilter');
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.project_id;
                option.textContent = project.name;
                projectFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    async loadQuickStats() {
        try {
            const stats = await dbManager.getDashboardStats();
            const quickStats = document.getElementById('quickStats');
            
            quickStats.innerHTML = `
                <div class="row text-center">
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-primary">${stats.totalPartners}</h4>
                            <small>الشركاء</small>
                        </div>
                    </div>
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-success">${stats.totalProjects}</h4>
                            <small>المشاريع</small>
                        </div>
                    </div>
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-info">${stats.totalTransactions}</h4>
                            <small>المعاملات</small>
                        </div>
                    </div>
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-warning">${stats.totalSettlements}</h4>
                            <small>التسويات</small>
                        </div>
                    </div>
                </div>
                
                <div class="row text-center">
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-success">${app.formatCurrency(stats.totalRevenue)}</h4>
                            <small>إجمالي الإيرادات</small>
                        </div>
                    </div>
                    <div class="col-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h4 class="text-danger">${app.formatCurrency(stats.totalExpenses)}</h4>
                            <small>إجمالي المصروفات</small>
                        </div>
                    </div>
                </div>
                
                <div class="text-center">
                    <div class="p-3 bg-light rounded">
                        <h4 class="${stats.netProfit >= 0 ? 'text-success' : 'text-danger'}">
                            ${app.formatCurrency(stats.netProfit)}
                        </h4>
                        <small>صافي الربح</small>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    async generateFinancialReport() {
        try {
            const stats = await dbManager.getDashboardStats();
            const transactions = await dbManager.getAll('transactions');
            const projects = await dbManager.getAll('projects');
            
            const reportData = {
                title: 'التقرير المالي الشامل',
                date: new Date().toLocaleDateString('ar-EG'),
                stats: stats,
                transactions: transactions.slice(0, 50), // Last 50 transactions
                projects: projects
            };

            const reportContent = this.generateFinancialReportHTML(reportData);
            this.downloadReport(reportContent, 'financial_report.html', 'text/html');
            
            app.showSuccess('تم إنشاء التقرير المالي بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء التقرير المالي: ' + error.message);
        }
    }

    generateFinancialReportHTML(data) {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${data.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 5px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f8f9fa; }
                    .positive { color: green; }
                    .negative { color: red; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>تاريخ التقرير: ${data.date}</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${data.stats.totalRevenue.toLocaleString('ar-EG')}</h3>
                        <p>إجمالي الإيرادات</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.stats.totalExpenses.toLocaleString('ar-EG')}</h3>
                        <p>إجمالي المصروفات</p>
                    </div>
                    <div class="stat-card">
                        <h3 class="${data.stats.netProfit >= 0 ? 'positive' : 'negative'}">
                            ${data.stats.netProfit.toLocaleString('ar-EG')}
                        </h3>
                        <p>صافي الربح</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.stats.totalTransactions}</h3>
                        <p>إجمالي المعاملات</p>
                    </div>
                </div>
                
                <h2>آخر المعاملات</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>النوع</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>الوصف</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.transactions.map(t => `
                            <tr>
                                <td>${t.transaction_type === 'income' ? 'إيراد' : 'مصروف'}</td>
                                <td>${t.amount.toLocaleString('ar-EG')}</td>
                                <td>${new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td>${t.description || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    async generatePartnersReport() {
        try {
            const partners = await dbManager.getAll('partners');
            const projects = await dbManager.getAll('projects');
            
            // Load project names for partners
            for (let partner of partners) {
                if (partner.project_id) {
                    const project = projects.find(p => p.project_id === partner.project_id);
                    partner.project_name = project ? project.name : 'غير محدد';
                } else {
                    partner.project_name = 'غير محدد';
                }
            }

            const reportData = {
                title: 'تقرير الشركاء',
                date: new Date().toLocaleDateString('ar-EG'),
                partners: partners
            };

            const reportContent = this.generatePartnersReportHTML(reportData);
            this.downloadReport(reportContent, 'partners_report.html', 'text/html');
            
            app.showSuccess('تم إنشاء تقرير الشركاء بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء تقرير الشركاء: ' + error.message);
        }
    }

    generatePartnersReportHTML(data) {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${data.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>تاريخ التقرير: ${data.date}</p>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>اسم الشريك</th>
                            <th>المشروع</th>
                            <th>نسبة المشاركة</th>
                            <th>الرصيد السابق</th>
                            <th>الرصيد الحالي</th>
                            <th>تاريخ الإنشاء</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.partners.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.project_name}</td>
                                <td>${p.share_percentage}%</td>
                                <td>${(p.previous_balance || 0).toLocaleString('ar-EG')}</td>
                                <td>${(p.current_balance || 0).toLocaleString('ar-EG')}</td>
                                <td>${new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    async generateProjectsReport() {
        try {
            const projects = await dbManager.getAll('projects');
            const partners = await dbManager.getAll('partners');
            const transactions = await dbManager.getAll('transactions');
            
            // Calculate project statistics
            for (let project of projects) {
                const projectPartners = partners.filter(p => p.project_id === project.project_id);
                const projectTransactions = transactions.filter(t => t.linked_project_id === project.project_id);
                
                project.partners_count = projectPartners.length;
                project.total_share = projectPartners.reduce((sum, p) => sum + p.share_percentage, 0);
                project.total_income = projectTransactions
                    .filter(t => t.transaction_type === 'income')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                project.total_expenses = projectTransactions
                    .filter(t => t.transaction_type === 'expense')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
                project.net_profit = project.total_income - project.total_expenses;
            }

            const reportData = {
                title: 'تقرير المشاريع',
                date: new Date().toLocaleDateString('ar-EG'),
                projects: projects
            };

            const reportContent = this.generateProjectsReportHTML(reportData);
            this.downloadReport(reportContent, 'projects_report.html', 'text/html');
            
            app.showSuccess('تم إنشاء تقرير المشاريع بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء تقرير المشاريع: ' + error.message);
        }
    }

    generateProjectsReportHTML(data) {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${data.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f8f9fa; }
                    .positive { color: green; }
                    .negative { color: red; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>تاريخ التقرير: ${data.date}</p>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>اسم المشروع</th>
                            <th>الحالة</th>
                            <th>عدد الشركاء</th>
                            <th>إجمالي النسبة</th>
                            <th>الإيرادات</th>
                            <th>المصروفات</th>
                            <th>صافي الربح</th>
                            <th>تاريخ البداية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.projects.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.status}</td>
                                <td>${p.partners_count}</td>
                                <td>${p.total_share}%</td>
                                <td>${p.total_income.toLocaleString('ar-EG')}</td>
                                <td>${p.total_expenses.toLocaleString('ar-EG')}</td>
                                <td class="${p.net_profit >= 0 ? 'positive' : 'negative'}">
                                    ${p.net_profit.toLocaleString('ar-EG')}
                                </td>
                                <td>${new Date(p.start_date).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    async generateSettlementsReport() {
        try {
            const settlements = await dbManager.getAll('settlements');
            const partners = await dbManager.getAll('partners');
            const projects = await dbManager.getAll('projects');
            
            // Load related data
            for (let settlement of settlements) {
                const partner = partners.find(p => p.partner_id === settlement.partner_id);
                const project = projects.find(p => p.project_id === settlement.linked_project_id);
                
                settlement.partner_name = partner ? partner.name : 'غير محدد';
                settlement.project_name = project ? project.name : 'غير محدد';
            }

            const reportData = {
                title: 'تقرير التسويات',
                date: new Date().toLocaleDateString('ar-EG'),
                settlements: settlements
            };

            const reportContent = this.generateSettlementsReportHTML(reportData);
            this.downloadReport(reportContent, 'settlements_report.html', 'text/html');
            
            app.showSuccess('تم إنشاء تقرير التسويات بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء تقرير التسويات: ' + error.message);
        }
    }

    generateSettlementsReportHTML(data) {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${data.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>تاريخ التقرير: ${data.date}</p>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>الشريك</th>
                            <th>المشروع</th>
                            <th>المبلغ المدفوع</th>
                            <th>الرصيد السابق</th>
                            <th>المبلغ المستحق</th>
                            <th>الرصيد النهائي</th>
                            <th>تاريخ التسوية</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.settlements.map(s => `
                            <tr>
                                <td>${s.partner_name}</td>
                                <td>${s.project_name}</td>
                                <td>${s.payment_amount.toLocaleString('ar-EG')}</td>
                                <td>${s.previous_balance.toLocaleString('ar-EG')}</td>
                                <td>${s.outstanding_amount.toLocaleString('ar-EG')}</td>
                                <td>${s.final_balance.toLocaleString('ar-EG')}</td>
                                <td>${new Date(s.date).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    downloadReport(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Custom report form handler
    async handleCustomReport() {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const projectFilter = document.getElementById('projectFilter').value;

        if (!reportType) {
            app.showError('يرجى اختيار نوع التقرير');
            return;
        }

        try {
            let data;
            let filename;

            switch (reportType) {
                case 'transactions':
                    data = await this.getFilteredTransactions(startDate, endDate, projectFilter);
                    filename = 'transactions_report.html';
                    break;
                case 'partners':
                    data = await this.getFilteredPartners(projectFilter);
                    filename = 'partners_report.html';
                    break;
                case 'projects':
                    data = await this.getFilteredProjects();
                    filename = 'projects_report.html';
                    break;
                case 'settlements':
                    data = await this.getFilteredSettlements(startDate, endDate, projectFilter);
                    filename = 'settlements_report.html';
                    break;
                case 'cashboxes':
                    data = await this.getCashboxesData();
                    filename = 'cashboxes_report.html';
                    break;
                default:
                    app.showError('نوع التقرير غير معروف');
                    return;
            }

            const reportContent = this.generateCustomReportHTML(data);
            this.downloadReport(reportContent, filename, 'text/html');
            
            app.showSuccess('تم إنشاء التقرير المخصص بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء التقرير المخصص: ' + error.message);
        }
    }

    async getFilteredTransactions(startDate, endDate, projectFilter) {
        let transactions = await dbManager.getAll('transactions');
        
        if (startDate) {
            transactions = transactions.filter(t => t.date >= startDate);
        }
        if (endDate) {
            transactions = transactions.filter(t => t.date <= endDate);
        }
        if (projectFilter) {
            transactions = transactions.filter(t => t.linked_project_id == projectFilter);
        }

        return {
            title: 'تقرير المعاملات المخصص',
            date: new Date().toLocaleDateString('ar-EG'),
            transactions: transactions,
            filters: { startDate, endDate, projectFilter }
        };
    }

    async getFilteredPartners(projectFilter) {
        let partners = await dbManager.getAll('partners');
        
        if (projectFilter) {
            partners = partners.filter(p => p.project_id == projectFilter);
        }

        return {
            title: 'تقرير الشركاء المخصص',
            date: new Date().toLocaleDateString('ar-EG'),
            partners: partners,
            filters: { projectFilter }
        };
    }

    async getFilteredSettlements(startDate, endDate, projectFilter) {
        let settlements = await dbManager.getAll('settlements');
        
        if (startDate) {
            settlements = settlements.filter(s => s.date >= startDate);
        }
        if (endDate) {
            settlements = settlements.filter(s => s.date <= endDate);
        }
        if (projectFilter) {
            settlements = settlements.filter(s => s.linked_project_id == projectFilter);
        }

        return {
            title: 'تقرير التسويات المخصص',
            date: new Date().toLocaleDateString('ar-EG'),
            settlements: settlements,
            filters: { startDate, endDate, projectFilter }
        };
    }

    async getCashboxesData() {
        const cashboxes = await dbManager.getAll('cashboxes');
        
        return {
            title: 'تقرير الخزائن',
            date: new Date().toLocaleDateString('ar-EG'),
            cashboxes: cashboxes
        };
    }

    generateCustomReportHTML(data) {
        // This is a generic template that can be customized based on data type
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${data.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .filters { margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    .table th { background-color: #f8f9fa; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>تاريخ التقرير: ${data.date}</p>
                </div>
                
                ${data.filters ? `
                    <div class="filters">
                        <h4>معايير التصفية:</h4>
                        <p>${Object.entries(data.filters).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                    </div>
                ` : ''}
                
                <div class="content">
                    ${this.generateCustomReportContent(data)}
                </div>
            </body>
            </html>
        `;
    }

    generateCustomReportContent(data) {
        // This method should be implemented based on the specific data type
        return '<p>محتوى التقرير المخصص</p>';
    }
}

// Initialize reports module
const reportsModule = new ReportsModule();

// Global function for navigation
window.loadReportsModule = () => reportsModule.loadReportsModule();

// Add event listener for custom report form
document.addEventListener('DOMContentLoaded', () => {
    const customReportForm = document.getElementById('customReportForm');
    if (customReportForm) {
        customReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            reportsModule.handleCustomReport();
        });
    }
});