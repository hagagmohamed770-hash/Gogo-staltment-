// Database Management System using IndexedDB
class DatabaseManager {
    constructor() {
        this.dbName = 'TreasuryManagementDB';
        this.dbVersion = 1;
        this.db = null;
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

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

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

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Partners operations
    async addPartner(partnerData) {
        return this.add('partners', {
            ...partnerData,
            created_at: new Date().toISOString()
        });
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

    // Projects operations
    async addProject(projectData) {
        return this.add('projects', {
            ...projectData,
            created_at: new Date().toISOString()
        });
    }

    // Transactions operations
    async addTransaction(transactionData) {
        const transaction = await this.add('transactions', {
            ...transactionData,
            created_at: new Date().toISOString()
        });

        // Update partner balance if partner_id is provided
        if (transactionData.partner_id) {
            const partner = await this.get('partners', transactionData.partner_id);
            if (partner) {
                const currentBalance = parseFloat(partner.current_balance || 0);
                const amount = parseFloat(transactionData.amount);
                const newBalance = transactionData.transaction_type === 'income' 
                    ? currentBalance + amount 
                    : currentBalance - amount;
                
                await this.updatePartnerBalance(transactionData.partner_id, newBalance);
            }
        }

        // Update cashbox balance if cashbox_id is provided
        if (transactionData.cashbox_id) {
            const cashbox = await this.get('cashboxes', transactionData.cashbox_id);
            if (cashbox) {
                const currentBalance = parseFloat(cashbox.current_balance || 0);
                const amount = parseFloat(transactionData.amount);
                const newBalance = transactionData.transaction_type === 'income' 
                    ? currentBalance + amount 
                    : currentBalance - amount;
                
                await this.updateCashboxBalance(transactionData.cashbox_id, newBalance);
            }
        }

        return transaction;
    }

    // Invoices operations
    async addInvoice(invoiceData) {
        return this.add('invoices', {
            ...invoiceData,
            created_at: new Date().toISOString()
        });
    }

    // Settlements operations
    async addSettlement(settlementData) {
        return this.add('settlements', {
            ...settlementData,
            created_at: new Date().toISOString()
        });
    }

    // Cashboxes operations
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
        try {
            const [partners, projects, transactions, settlements, cashboxes] = await Promise.all([
                this.getAll('partners'),
                this.getAll('projects'),
                this.getAll('transactions'),
                this.getAll('settlements'),
                this.getAll('cashboxes')
            ]);

            const totalRevenue = transactions
                .filter(t => t.transaction_type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const totalExpenses = transactions
                .filter(t => t.transaction_type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const totalCashboxBalance = cashboxes
                .reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);

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
        } catch (error) {
            console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
            return {
                totalPartners: 0,
                totalProjects: 0,
                activeProjects: 0,
                totalTransactions: 0,
                totalSettlements: 0,
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                totalCashboxBalance: 0
            };
        }
    }

    // Clear all data
    async clearAllData() {
        const stores = ['partners', 'projects', 'transactions', 'invoices', 'settlements', 'cashboxes', 'revenue', 'expenses'];
        
        for (const store of stores) {
            const transaction = this.db.transaction([store], 'readwrite');
            const objectStore = transaction.objectStore(store);
            objectStore.clear();
        }
    }
}

// Initialize database
const dbManager = new DatabaseManager();

// Export for use in other modules
window.dbManager = dbManager;