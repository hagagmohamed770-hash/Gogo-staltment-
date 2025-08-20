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

        this.sampleCustomers = [
            {
                name: 'شركة التقنية المتقدمة',
                phone: '0123456789',
                email: 'info@tech.com',
                address: 'شارع التكنولوجيا، القاهرة',
                balance: 5000,
                notes: 'عميل VIP'
            },
            {
                name: 'مؤسسة الخدمات الرقمية',
                phone: '0987654321',
                email: 'contact@digital.com',
                address: 'شارع الابتكار، الإسكندرية',
                balance: 3000,
                notes: 'عميل منتظم'
            },
            {
                name: 'شركة الحلول الذكية',
                phone: '0555666777',
                email: 'hello@smart.com',
                address: 'شارع المستقبل، الجيزة',
                balance: 8000,
                notes: 'عميل جديد'
            }
        ];

        this.sampleSuppliers = [
            {
                name: 'شركة المعدات التقنية',
                phone: '0111222333',
                email: 'sales@equipment.com',
                address: 'شارع الصناعة، القاهرة',
                balance: 2000,
                notes: 'مورد موثوق'
            },
            {
                name: 'مؤسسة الخدمات اللوجستية',
                phone: '0444555666',
                email: 'info@logistics.com',
                address: 'شارع النقل، الإسكندرية',
                balance: 1500,
                notes: 'مورد سريع'
            }
        ];

        this.sampleReceivables = [
            {
                receivable_number: 'RCV-001',
                customer_id: 1,
                amount: 5000,
                due_date: '2025-03-15',
                description: 'فاتورة خدمات تطوير',
                status: 'pending'
            },
            {
                receivable_number: 'RCV-002',
                customer_id: 2,
                amount: 3000,
                due_date: '2025-03-20',
                description: 'فاتورة استشارات',
                status: 'pending'
            }
        ];

        this.samplePayables = [
            {
                payable_number: 'PAY-001',
                supplier_id: 1,
                amount: 2000,
                due_date: '2025-03-10',
                description: 'فاتورة معدات',
                status: 'pending'
            },
            {
                payable_number: 'PAY-002',
                supplier_id: 2,
                amount: 1500,
                due_date: '2025-03-25',
                description: 'فاتورة خدمات',
                status: 'pending'
            }
        ];

        this.sampleRevenues = [
            {
                description: 'إيراد من تطوير الموقع',
                customer_id: 1,
                amount: 10000,
                category: 'services',
                date: '2025-01-20',
                notes: 'مشروع تطوير موقع إلكتروني'
            },
            {
                description: 'إيراد من الاستشارات',
                customer_id: 2,
                amount: 5000,
                category: 'consulting',
                date: '2025-01-25',
                notes: 'استشارات تقنية'
            },
            {
                description: 'إيراد من المبيعات',
                customer_id: 3,
                amount: 8000,
                category: 'sales',
                date: '2025-02-01',
                notes: 'بيع برمجيات'
            }
        ];

        this.sampleExpenses = [
            {
                description: 'شراء معدات مكتبية',
                supplier_id: 1,
                amount: 2000,
                category: 'operational',
                date: '2025-01-15',
                notes: 'طابعات وأجهزة'
            },
            {
                description: 'مصاريف تسويق',
                supplier_id: 2,
                amount: 1500,
                category: 'marketing',
                date: '2025-01-20',
                notes: 'إعلانات رقمية'
            },
            {
                description: 'صيانة الأجهزة',
                supplier_id: 1,
                amount: 1000,
                category: 'maintenance',
                date: '2025-02-01',
                notes: 'صيانة دورية'
            }
        ];
    }

    async loadSampleData() {
        try {
            // Wait for app to be available with retry
            let retries = 0;
            while ((!window.app || !window.app.dbManager) && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!window.app || !window.app.dbManager) {
                throw new Error('التطبيق غير جاهز. يرجى الانتظار قليلاً والمحاولة مرة أخرى.');
            }

            // Clear existing data first
            await window.app.dbManager.clearAllData();

            // Load projects first and get their IDs
            const projectIds = [];
            for (const project of this.sampleProjects) {
                const projectData = { ...project };
                delete projectData.project_id; // Remove any existing ID
                const addedProject = await window.app.dbManager.addProject(projectData);
                projectIds.push(addedProject.project_id);
            }

            // Load partners with correct project IDs
            for (let i = 0; i < this.samplePartners.length; i++) {
                const partner = { ...this.samplePartners[i] };
                delete partner.partner_id; // Remove any existing ID
                if (partner.project_id && partner.project_id <= projectIds.length) {
                    partner.project_id = projectIds[partner.project_id - 1];
                }
                await window.app.dbManager.addPartner(partner);
            }

            // Load cashboxes
            for (const cashbox of this.sampleCashboxes) {
                const cashboxData = { ...cashbox };
                delete cashboxData.cashbox_id; // Remove any existing ID
                await window.app.dbManager.addCashbox(cashboxData);
            }

            // Load transactions with correct IDs
            for (const transaction of this.sampleTransactions) {
                const transactionData = { ...transaction };
                delete transactionData.transaction_id; // Remove any existing ID
                
                // Update project and partner IDs
                if (transactionData.linked_project_id && transactionData.linked_project_id <= projectIds.length) {
                    transactionData.linked_project_id = projectIds[transactionData.linked_project_id - 1];
                }
                
                await window.app.dbManager.addTransaction(transactionData);
            }

            // Load customers
            for (const customer of this.sampleCustomers) {
                const customerData = { ...customer };
                delete customerData.customer_id; // Remove any existing ID
                await window.app.dbManager.addCustomer(customerData);
            }

            // Load suppliers
            for (const supplier of this.sampleSuppliers) {
                const supplierData = { ...supplier };
                delete supplierData.supplier_id; // Remove any existing ID
                await window.app.dbManager.addSupplier(supplierData);
            }

            // Load receivables
            for (const receivable of this.sampleReceivables) {
                const receivableData = { ...receivable };
                delete receivableData.receivable_id; // Remove any existing ID
                await window.app.dbManager.addReceivable(receivableData);
            }

            // Load payables
            for (const payable of this.samplePayables) {
                const payableData = { ...payable };
                delete payableData.payable_id; // Remove any existing ID
                await window.app.dbManager.addPayable(payableData);
            }

            // Load revenues
            for (const revenue of this.sampleRevenues) {
                const revenueData = { ...revenue };
                delete revenueData.revenue_id; // Remove any existing ID
                await window.app.dbManager.addRevenue(revenueData);
            }

            // Load expenses
            for (const expense of this.sampleExpenses) {
                const expenseData = { ...expense };
                delete expenseData.expense_id; // Remove any existing ID
                await window.app.dbManager.addExpense(expenseData);
            }

            window.app.showSuccess('تم تحميل البيانات التجريبية بنجاح!');
            
            // Reload current module
            if (window.app.currentModule === 'dashboard') {
                await window.app.loadDashboard();
            } else if (window.app.currentModule === 'partners' && window.partnersModule) {
                await window.partnersModule.loadPartnersModule();
            } else if (window.app.currentModule === 'projects' && window.projectsModule) {
                await window.projectsModule.loadProjectsModule();
            } else {
                // Default to dashboard
                await window.app.loadDashboard();
            }

        } catch (error) {
            console.error('خطأ في تحميل البيانات التجريبية:', error);
            if (window.app && window.app.showError) {
                window.app.showError('خطأ في تحميل البيانات التجريبية: ' + error.message);
            } else {
                alert('خطأ في تحميل البيانات التجريبية: ' + error.message);
            }
        }
    }

    async clearAllData() {
        try {
            // Wait for app to be available with retry
            let retries = 0;
            while ((!window.app || !window.app.dbManager) && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
            }
            
            if (!window.app || !window.app.dbManager) {
                throw new Error('التطبيق غير جاهز. يرجى الانتظار قليلاً والمحاولة مرة أخرى.');
            }

            await window.app.dbManager.clearAllData();
            window.app.showSuccess('تم مسح جميع البيانات بنجاح!');
            
            // Reload current module
            if (window.app.currentModule === 'dashboard') {
                await window.app.loadDashboard();
            } else if (window.app.currentModule === 'partners' && window.partnersModule) {
                await window.partnersModule.loadPartnersModule();
            } else if (window.app.currentModule === 'projects' && window.projectsModule) {
                await window.projectsModule.loadProjectsModule();
            } else {
                // Default to dashboard
                await window.app.loadDashboard();
            }

        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            if (window.app && window.app.showError) {
                window.app.showError('خطأ في مسح البيانات: ' + error.message);
            } else {
                alert('خطأ في مسح البيانات: ' + error.message);
            }
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
                    <li><i class="fas fa-check text-success me-2"></i>3 عملاء</li>
                    <li><i class="fas fa-check text-success me-2"></i>2 موردين</li>
                    <li><i class="fas fa-check text-success me-2"></i>2 سندات قبض</li>
                    <li><i class="fas fa-check text-success me-2"></i>2 سندات صرف</li>
                    <li><i class="fas fa-check text-success me-2"></i>3 إيرادات</li>
                    <li><i class="fas fa-check text-success me-2"></i>3 مصروفات</li>
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