// Database Management System using IndexedDB
class DatabaseManager {
    constructor() {
        this.dbName = 'TreasuryManagementDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('خطأ في فتح قاعدة البيانات:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createTables(db);
            };
        });
    }

    createTables(db) {
        // جدول الشركاء
        if (!db.objectStoreNames.contains('partners')) {
            const partnersStore = db.createObjectStore('partners', { keyPath: 'partner_id', autoIncrement: true });
            partnersStore.createIndex('project_id', 'project_id', { unique: false });
            partnersStore.createIndex('name', 'name', { unique: false });
        }

        // جدول المشاريع
        if (!db.objectStoreNames.contains('projects')) {
            const projectsStore = db.createObjectStore('projects', { keyPath: 'project_id', autoIncrement: true });
            projectsStore.createIndex('name', 'name', { unique: false });
            projectsStore.createIndex('status', 'status', { unique: false });
        }

        // جدول المعاملات
        if (!db.objectStoreNames.contains('transactions')) {
            const transactionsStore = db.createObjectStore('transactions', { keyPath: 'transaction_id', autoIncrement: true });
            transactionsStore.createIndex('project_id', 'project_id', { unique: false });
            transactionsStore.createIndex('partner_id', 'partner_id', { unique: false });
            transactionsStore.createIndex('type', 'transaction_type', { unique: false });
            transactionsStore.createIndex('date', 'date', { unique: false });
        }

        // جدول الفواتير
        if (!db.objectStoreNames.contains('invoices')) {
            const invoicesStore = db.createObjectStore('invoices', { keyPath: 'invoice_id', autoIncrement: true });
            invoicesStore.createIndex('transaction_id', 'linked_transaction_id', { unique: false });
            invoicesStore.createIndex('status', 'status', { unique: false });
            invoicesStore.createIndex('due_date', 'due_date', { unique: false });
        }

        // جدول التسويات
        if (!db.objectStoreNames.contains('settlements')) {
            const settlementsStore = db.createObjectStore('settlements', { keyPath: 'settlement_id', autoIncrement: true });
            settlementsStore.createIndex('partner_id', 'partner_id', { unique: false });
            settlementsStore.createIndex('project_id', 'linked_project_id', { unique: false });
            settlementsStore.createIndex('date', 'date', { unique: false });
        }

        // جدول الخزائن
        if (!db.objectStoreNames.contains('cashboxes')) {
            const cashboxesStore = db.createObjectStore('cashboxes', { keyPath: 'cashbox_id', autoIncrement: true });
            cashboxesStore.createIndex('name', 'name', { unique: true });
        }

        // جدول الإيرادات
        if (!db.objectStoreNames.contains('revenue')) {
            const revenueStore = db.createObjectStore('revenue', { keyPath: 'revenue_id', autoIncrement: true });
            revenueStore.createIndex('date', 'date', { unique: false });
        }

        // جدول المصروفات
        if (!db.objectStoreNames.contains('expenses')) {
            const expensesStore = db.createObjectStore('expenses', { keyPath: 'expense_id', autoIncrement: true });
            expensesStore.createIndex('date', 'date', { unique: false });
        }

        console.log('تم إنشاء جميع الجداول بنجاح');
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName, indexName = null, indexValue = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            let request;

            if (indexName && indexValue !== null) {
                const index = store.index(indexName);
                request = index.getAll(indexValue);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Partners specific operations
    async addPartner(partnerData) {
        return this.add('partners', {
            ...partnerData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    async getPartnersByProject(projectId) {
        return this.getAll('partners', 'project_id', projectId);
    }

    async updatePartnerBalance(partnerId, newBalance) {
        const partner = await this.get('partners', partnerId);
        if (partner) {
            partner.current_balance = newBalance;
            partner.updated_at = new Date().toISOString();
            return this.update('partners', partner);
        }
        throw new Error('الشريك غير موجود');
    }

    // Projects specific operations
    async addProject(projectData) {
        return this.add('projects', {
            ...projectData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    async getActiveProjects() {
        return this.getAll('projects', 'status', 'active');
    }

    // Transactions specific operations
    async addTransaction(transactionData) {
        return this.add('transactions', {
            ...transactionData,
            created_at: new Date().toISOString()
        });
    }

    async getTransactionsByProject(projectId) {
        return this.getAll('transactions', 'project_id', projectId);
    }

    async getTransactionsByPartner(partnerId) {
        return this.getAll('transactions', 'partner_id', partnerId);
    }

    // Invoices specific operations
    async addInvoice(invoiceData) {
        return this.add('invoices', {
            ...invoiceData,
            created_at: new Date().toISOString()
        });
    }

    async updateInvoiceStatus(invoiceId, status) {
        const invoice = await this.get('invoices', invoiceId);
        if (invoice) {
            invoice.status = status;
            invoice.updated_at = new Date().toISOString();
            return this.update('invoices', invoice);
        }
        throw new Error('الفاتورة غير موجودة');
    }

    // Settlements specific operations
    async addSettlement(settlementData) {
        return this.add('settlements', {
            ...settlementData,
            created_at: new Date().toISOString()
        });
    }

    async getSettlementsByProject(projectId) {
        return this.getAll('settlements', 'project_id', projectId);
    }

    async getSettlementsByPartner(partnerId) {
        return this.getAll('settlements', 'partner_id', partnerId);
    }

    // Cashboxes specific operations
    async addCashbox(cashboxData) {
        return this.add('cashboxes', {
            ...cashboxData,
            created_at: new Date().toISOString()
        });
    }

    async updateCashboxBalance(cashboxId, newBalance) {
        const cashbox = await this.get('cashboxes', cashboxId);
        if (cashbox) {
            cashbox.current_balance = newBalance;
            cashbox.updated_at = new Date().toISOString();
            return this.update('cashboxes', cashbox);
        }
        throw new Error('الخزنة غير موجودة');
    }

    // Revenue and Expenses operations
    async addRevenue(revenueData) {
        return this.add('revenue', {
            ...revenueData,
            created_at: new Date().toISOString()
        });
    }

    async addExpense(expenseData) {
        return this.add('expenses', {
            ...expenseData,
            created_at: new Date().toISOString()
        });
    }

    // Backup and Restore operations
    async exportData() {
        const data = {};
        const stores = ['partners', 'projects', 'transactions', 'invoices', 'settlements', 'cashboxes', 'revenue', 'expenses'];
        
        for (const store of stores) {
            data[store] = await this.getAll(store);
        }
        
        return data;
    }

    async importData(data) {
        const transaction = this.db.transaction(['partners', 'projects', 'transactions', 'invoices', 'settlements', 'cashboxes', 'revenue', 'expenses'], 'readwrite');
        
        for (const [storeName, records] of Object.entries(data)) {
            const store = transaction.objectStore(storeName);
            store.clear();
            
            for (const record of records) {
                store.add(record);
            }
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Utility functions
    async getDashboardStats() {
        const [partners, projects, transactions, settlements, cashboxes] = await Promise.all([
            this.getAll('partners'),
            this.getAll('projects'),
            this.getAll('transactions'),
            this.getAll('settlements'),
            this.getAll('cashboxes')
        ]);

        const totalRevenue = transactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalCashboxBalance = cashboxes
            .reduce((sum, c) => sum + parseFloat(c.current_balance), 0);

        return {
            totalPartners: partners.length,
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            totalTransactions: transactions.length,
            totalSettlements: settlements.length,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalCashboxBalance
        };
    }
}

// Initialize database
const dbManager = new DatabaseManager();

// Export for use in other modules
window.dbManager = dbManager;