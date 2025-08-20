// Sample Data for Testing
class SampleDataManager {
    constructor() {
        this.sampleProjects = [
            {
                name: 'مشروع تطوير الموقع الإلكتروني',
                description: 'تطوير موقع إلكتروني متكامل للشركة',
                start_date: '2025-01-01',
                end_date: '2025-06-30',
                status: 'active',
                total_share_percentage: 0
            },
            {
                name: 'مشروع تطبيق الموبايل',
                description: 'تطوير تطبيق موبايل للعملاء',
                start_date: '2025-02-01',
                end_date: '2025-08-31',
                status: 'active',
                total_share_percentage: 0
            },
            {
                name: 'مشروع التسويق الرقمي',
                description: 'حملة تسويقية رقمية شاملة',
                start_date: '2025-03-01',
                status: 'paused',
                total_share_percentage: 0
            }
        ];

        this.samplePartners = [
            {
                name: 'أحمد محمد',
                project_id: 1,
                share_percentage: 40,
                previous_balance: 5000,
                current_balance: 5000,
                notes: 'شريك مؤسس'
            },
            {
                name: 'فاطمة علي',
                project_id: 1,
                share_percentage: 30,
                previous_balance: 3000,
                current_balance: 3000,
                notes: 'مطور برمجيات'
            },
            {
                name: 'محمد حسن',
                project_id: 1,
                share_percentage: 30,
                previous_balance: 2000,
                current_balance: 2000,
                notes: 'مصمم جرافيك'
            },
            {
                name: 'سارة أحمد',
                project_id: 2,
                share_percentage: 50,
                previous_balance: 8000,
                current_balance: 8000,
                notes: 'مدير المشروع'
            },
            {
                name: 'علي محمود',
                project_id: 2,
                share_percentage: 50,
                previous_balance: 7000,
                current_balance: 7000,
                notes: 'مطور موبايل'
            }
        ];

        this.sampleCashboxes = [
            {
                name: 'الخزنة الرئيسية',
                description: 'الخزنة الرئيسية للشركة',
                initial_balance: 20000,
                current_balance: 20000,
                location: 'المكتب الرئيسي'
            },
            {
                name: 'خزنة المشاريع',
                description: 'خزنة مخصصة للمشاريع',
                initial_balance: 15000,
                current_balance: 15000,
                location: 'قسم المشاريع'
            }
        ];

        this.sampleTransactions = [
            {
                description: 'دفع مقدم للمشروع الأول',
                amount: 10000,
                transaction_type: 'expense',
                linked_project_id: 1,
                linked_partner_id: 1,
                cashbox_id: 1,
                date: '2025-01-15'
            },
            {
                description: 'إيراد من العميل الأول',
                amount: 15000,
                transaction_type: 'income',
                linked_project_id: 1,
                cashbox_id: 1,
                date: '2025-01-20'
            },
            {
                description: 'شراء معدات تطوير',
                amount: 5000,
                transaction_type: 'expense',
                linked_project_id: 2,
                linked_partner_id: 4,
                cashbox_id: 2,
                date: '2025-02-10'
            },
            {
                description: 'إيراد من العميل الثاني',
                amount: 12000,
                transaction_type: 'income',
                linked_project_id: 2,
                cashbox_id: 2,
                date: '2025-02-15'
            }
        ];
    }

    async loadSampleData() {
        try {
            // Load projects
            for (const project of this.sampleProjects) {
                await app.dbManager.addProject(project);
            }

            // Load partners
            for (const partner of this.samplePartners) {
                await app.dbManager.addPartner(partner);
            }

            // Load cashboxes
            for (const cashbox of this.sampleCashboxes) {
                await app.dbManager.addCashbox(cashbox);
            }

            // Load transactions
            for (const transaction of this.sampleTransactions) {
                await app.dbManager.addTransaction(transaction);
            }

            app.showSuccess('تم تحميل البيانات التجريبية بنجاح!');
            
            // Reload dashboard
            if (app.currentModule === 'dashboard') {
                await app.loadDashboard();
            }

        } catch (error) {
            app.showError('خطأ في تحميل البيانات التجريبية: ' + error.message);
        }
    }

    async clearAllData() {
        try {
            await app.dbManager.clearAllData();
            app.showSuccess('تم مسح جميع البيانات بنجاح!');
            
            // Reload dashboard
            if (app.currentModule === 'dashboard') {
                await app.loadDashboard();
            }

        } catch (error) {
            app.showError('خطأ في مسح البيانات: ' + error.message);
        }
    }

    showSampleDataModal() {
        const modalContent = `
            <div class="text-center">
                <i class="fas fa-database fa-3x text-primary mb-3"></i>
                <h5>تحميل البيانات التجريبية</h5>
                <p class="text-muted">
                    سيتم تحميل بيانات تجريبية تتضمن:
                </p>
                <ul class="list-unstyled text-start">
                    <li><i class="fas fa-check text-success me-2"></i>3 مشاريع مختلفة</li>
                    <li><i class="fas fa-check text-success me-2"></i>5 شركاء</li>
                    <li><i class="fas fa-check text-success me-2"></i>2 خزائن</li>
                    <li><i class="fas fa-check text-success me-2"></i>4 معاملات مالية</li>
                </ul>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>تحذير:</strong> سيتم استبدال البيانات الموجودة حالياً
                </div>
            </div>
        `;

        app.showModal('تحميل البيانات التجريبية', modalContent, 'modal-md');
        
        // Add buttons to modal
        const modalBody = document.querySelector('#appModal .modal-body');
        modalBody.innerHTML += `
            <div class="text-center mt-3">
                <button class="btn btn-primary me-2" onclick="sampleDataManager.loadSampleData(); bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();">
                    <i class="fas fa-download me-1"></i>
                    تحميل البيانات
                </button>
                <button class="btn btn-danger me-2" onclick="sampleDataManager.clearAllData(); bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();">
                    <i class="fas fa-trash me-1"></i>
                    مسح جميع البيانات
                </button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-1"></i>
                    إلغاء
                </button>
            </div>
        `;
    }
}

// Initialize sample data manager
const sampleDataManager = new SampleDataManager();

// Global function
window.loadSampleData = () => sampleDataManager.showSampleDataModal();