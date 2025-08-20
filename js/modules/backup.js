// Backup and Restore Module
class BackupModule {
    constructor() {
        this.backupInterval = null;
    }

    async backupData() {
        try {
            app.showInfo('جاري إنشاء النسخة الاحتياطية...');
            
            const data = await app.dbManager.exportData();
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: data
            };

            const jsonData = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Create download link
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            link.setAttribute('href', url);
            link.setAttribute('download', `treasury_backup_${timestamp}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Save backup info to localStorage
            this.saveBackupInfo(backupData);
            
            app.showSuccess('تم إنشاء النسخة الاحتياطية بنجاح');
        } catch (error) {
            app.showError('خطأ في إنشاء النسخة الاحتياطية: ' + error.message);
        }
    }

    async restoreData() {
        try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                try {
                    app.showInfo('جاري استعادة البيانات...');
                    
                    const text = await file.text();
                    const backupData = JSON.parse(text);
                    
                    // Validate backup data
                    if (!backupData.data || !backupData.timestamp) {
                        throw new Error('ملف النسخة الاحتياطية غير صالح');
                    }

                    // Show confirmation dialog
                    const confirmed = await app.confirm(
                        `هل أنت متأكد من استعادة البيانات؟\n\n` +
                        `تاريخ النسخة: ${new Date(backupData.timestamp).toLocaleString('ar-EG')}\n` +
                        `تحذير: سيتم استبدال جميع البيانات الحالية!`
                    );

                    if (!confirmed) return;

                    // Restore data
                    await app.dbManager.importData(backupData.data);
                    
                    app.showSuccess('تم استعادة البيانات بنجاح');
                    
                    // Reload current page
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    
                } catch (error) {
                    app.showError('خطأ في استعادة البيانات: ' + error.message);
                }
            };
            
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
            
        } catch (error) {
            app.showError('خطأ في استعادة البيانات: ' + error.message);
        }
    }

    saveBackupInfo(backupData) {
        try {
            const backups = JSON.parse(localStorage.getItem('treasury_backups') || '[]');
            backups.unshift({
                timestamp: backupData.timestamp,
                size: JSON.stringify(backupData).length,
                version: backupData.version
            });
            
            // Keep only last 10 backups
            if (backups.length > 10) {
                backups.splice(10);
            }
            
            localStorage.setItem('treasury_backups', JSON.stringify(backups));
        } catch (error) {
            console.error('Error saving backup info:', error);
        }
    }

    getBackupHistory() {
        try {
            return JSON.parse(localStorage.getItem('treasury_backups') || '[]');
        } catch (error) {
            console.error('Error getting backup history:', error);
            return [];
        }
    }

    async showBackupModal() {
        const backups = this.getBackupHistory();
        
        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">إدارة النسخ الاحتياطية</h6>
                <p class="text-muted">إنشاء واستعادة النسخ الاحتياطية للبيانات</p>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-download fa-2x text-primary mb-3"></i>
                            <h6>إنشاء نسخة احتياطية</h6>
                            <p class="text-muted small">تحميل جميع البيانات كملف JSON</p>
                            <button class="btn btn-primary" onclick="backupModule.backupData()">
                                <i class="fas fa-download me-1"></i>
                                إنشاء نسخة احتياطية
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-upload fa-2x text-success mb-3"></i>
                            <h6>استعادة البيانات</h6>
                            <p class="text-muted small">استعادة البيانات من ملف النسخة الاحتياطية</p>
                            <button class="btn btn-success" onclick="backupModule.restoreData()">
                                <i class="fas fa-upload me-1"></i>
                                استعادة البيانات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <h6>تاريخ النسخ الاحتياطية</h6>
                ${backups.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>الحجم</th>
                                    <th>الإصدار</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${backups.map(backup => `
                                    <tr>
                                        <td>${new Date(backup.timestamp).toLocaleString('ar-EG')}</td>
                                        <td>${(backup.size / 1024).toFixed(2)} KB</td>
                                        <td>${backup.version}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">لا توجد نسخ احتياطية محفوظة</p>'}
            </div>
            
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>تنبيه:</strong> احتفظ بنسخة احتياطية من بياناتك بانتظام لحمايتها من الفقدان.
            </div>
        `;

        app.showModal('إدارة النسخ الاحتياطية', modalContent);
    }

    async setupAutoBackup() {
        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">إعداد النسخ الاحتياطي التلقائي</h6>
                <p class="text-muted">تكوين النسخ الاحتياطي التلقائي للبيانات</p>
            </div>
            
            <div class="mb-3">
                <label for="backupFrequency" class="form-label">تكرار النسخ الاحتياطي</label>
                <select class="form-select" id="backupFrequency">
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label for="backupTime" class="form-label">وقت النسخ الاحتياطي</label>
                <input type="time" class="form-control" id="backupTime" value="02:00">
            </div>
            
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="enableAutoBackup">
                    <label class="form-check-label" for="enableAutoBackup">
                        تفعيل النسخ الاحتياطي التلقائي
                    </label>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                    إلغاء
                </button>
                <button type="button" class="btn btn-primary" onclick="backupModule.saveAutoBackupSettings()">
                    <i class="fas fa-save me-1"></i>
                    حفظ الإعدادات
                </button>
            </div>
        `;

        app.showModal('إعداد النسخ الاحتياطي التلقائي', modalContent);
        
        // Load current settings
        this.loadAutoBackupSettings();
    }

    loadAutoBackupSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('autoBackupSettings') || '{}');
            
            if (settings.frequency) {
                document.getElementById('backupFrequency').value = settings.frequency;
            }
            if (settings.time) {
                document.getElementById('backupTime').value = settings.time;
            }
            if (settings.enabled !== undefined) {
                document.getElementById('enableAutoBackup').checked = settings.enabled;
            }
        } catch (error) {
            console.error('Error loading auto backup settings:', error);
        }
    }

    async saveAutoBackupSettings() {
        try {
            const settings = {
                frequency: document.getElementById('backupFrequency').value,
                time: document.getElementById('backupTime').value,
                enabled: document.getElementById('enableAutoBackup').checked
            };

            localStorage.setItem('autoBackupSettings', JSON.stringify(settings));

            if (settings.enabled) {
                this.startAutoBackup(settings);
                app.showSuccess('تم تفعيل النسخ الاحتياطي التلقائي');
            } else {
                this.stopAutoBackup();
                app.showSuccess('تم إيقاف النسخ الاحتياطي التلقائي');
            }

            bootstrap.Modal.getInstance(document.getElementById('appModal')).hide();
        } catch (error) {
            app.showError('خطأ في حفظ إعدادات النسخ الاحتياطي: ' + error.message);
        }
    }

    startAutoBackup(settings) {
        this.stopAutoBackup(); // Stop any existing backup

        const interval = this.getBackupInterval(settings.frequency);
        if (interval) {
            this.backupInterval = setInterval(() => {
                this.performAutoBackup();
            }, interval);
        }
    }

    stopAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    }

    getBackupInterval(frequency) {
        const intervals = {
            daily: 24 * 60 * 60 * 1000, // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        return intervals[frequency] || null;
    }

    async performAutoBackup() {
        try {
            console.log('Performing automatic backup...');
            
            const data = await app.dbManager.exportData();
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: data,
                type: 'auto'
            };

            // Save to localStorage (limited size)
            const backups = JSON.parse(localStorage.getItem('auto_backups') || '[]');
            backups.unshift(backupData);
            
            // Keep only last 5 auto backups
            if (backups.length > 5) {
                backups.splice(5);
            }
            
            localStorage.setItem('auto_backups', JSON.stringify(backups));
            
            console.log('Automatic backup completed successfully');
        } catch (error) {
            console.error('Error performing automatic backup:', error);
        }
    }

    async exportToCSV() {
        try {
            app.showInfo('جاري تصدير البيانات...');
            
            const data = await app.dbManager.exportData();
            const csvData = this.convertToCSV(data);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            link.setAttribute('href', url);
            link.setAttribute('download', `treasury_export_${timestamp}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            app.showSuccess('تم تصدير البيانات بنجاح');
        } catch (error) {
            app.showError('خطأ في تصدير البيانات: ' + error.message);
        }
    }

    convertToCSV(data) {
        const csvRows = [];
        
        // Add headers
        const headers = ['Table', 'Record Count'];
        csvRows.push(headers.join(','));
        
        // Add data summary
        Object.entries(data).forEach(([tableName, records]) => {
            csvRows.push(`${tableName},${records.length}`);
        });
        
        return csvRows.join('\n');
    }

    async clearAllData() {
        try {
            const confirmed = await app.confirm(
                'هل أنت متأكد من حذف جميع البيانات؟\n\n' +
                'تحذير: هذا الإجراء لا يمكن التراجع عنه!\n' +
                'تأكد من وجود نسخة احتياطية قبل المتابعة.'
            );

            if (!confirmed) return;

            const confirmedAgain = await app.confirm(
                'تأكيد نهائي:\n\n' +
                'سيتم حذف جميع البيانات نهائياً.\n' +
                'هل أنت متأكد تماماً؟'
            );

            if (!confirmedAgain) return;

            // Clear all data
            const stores = ['partners', 'projects', 'transactions', 'invoices', 'settlements', 'cashboxes', 'revenue', 'expenses'];
            
            for (const store of stores) {
                const transaction = app.dbManager.db.transaction([store], 'readwrite');
                const objectStore = transaction.objectStore(store);
                await new Promise((resolve, reject) => {
                    const request = objectStore.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            app.showSuccess('تم حذف جميع البيانات بنجاح');
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            app.showError('خطأ في حذف البيانات: ' + error.message);
        }
    }

    async showDataManagementModal() {
        const modalContent = `
            <div class="mb-3">
                <h6 class="fw-bold">إدارة البيانات</h6>
                <p class="text-muted">إدارة وتصدير وحذف البيانات</p>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-file-csv fa-2x text-info mb-3"></i>
                            <h6>تصدير إلى CSV</h6>
                            <p class="text-muted small">تصدير البيانات كملف CSV</p>
                            <button class="btn btn-info" onclick="backupModule.exportToCSV()">
                                <i class="fas fa-download me-1"></i>
                                تصدير CSV
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-cog fa-2x text-warning mb-3"></i>
                            <h6>إعدادات النسخ الاحتياطي</h6>
                            <p class="text-muted small">تكوين النسخ الاحتياطي التلقائي</p>
                            <button class="btn btn-warning" onclick="backupModule.setupAutoBackup()">
                                <i class="fas fa-cog me-1"></i>
                                الإعدادات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>منطقة الخطر</h6>
                <p class="mb-2">حذف جميع البيانات من النظام</p>
                <button class="btn btn-danger" onclick="backupModule.clearAllData()">
                    <i class="fas fa-trash me-1"></i>
                    حذف جميع البيانات
                </button>
            </div>
        `;

        app.showModal('إدارة البيانات', modalContent);
    }
}

// Initialize backup module
const backupModule = new BackupModule();

// Global functions for navigation
window.backupDataModule = () => backupModule.showBackupModal();
window.restoreDataModule = () => backupModule.showDataManagementModal();

// Initialize auto backup on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        const settings = JSON.parse(localStorage.getItem('autoBackupSettings') || '{}');
        if (settings.enabled) {
            backupModule.startAutoBackup(settings);
        }
    } catch (error) {
        console.error('Error initializing auto backup:', error);
    }
});