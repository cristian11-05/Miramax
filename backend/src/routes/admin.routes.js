import express from 'express';
import {
    adminLogin,
    getAllClients,
    createClient,
    updateClient,
    deleteClient,
    getAllCollectors,
    createCollector,
    updateCollector,
    deleteCollector,
    getAllDebts,
    createDebt,
    updateDebt,
    deleteDebt,
    getAllPayments,
    verifyPayment,
    getConfig,
    updateConfig,
    uploadYapeQR,
    getReports,
    getDashboardStats,
    getPendingVerifications,
    rejectPayment,
    downloadReceipt,
    assignCollectorToLocations
} from '../controllers/admin.controller.js';
import {
    getEarningsStats,
    getCollectorsPerformance,
    resetSystemData,
    exportDebtsReport
} from '../controllers/reports.controller.js';
import { importPayments } from '../controllers/PaymentsController.js';
import { importClients } from '../controllers/clients.controller.js';
import { previewImportClients, confirmImportClients } from '../controllers/clients-import.controller.js';
import { getChatbotReports } from '../controllers/chatbot.controller.js';
import { initDatabase, runSystemTests } from '../controllers/system.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { upload } from '../services/upload.service.js';

const router = express.Router();

// Login (sin autenticación)
router.post('/login', adminLogin);

// Dashboard
router.get('/dashboard', [authenticateToken, authorizeRole('admin')], getDashboardStats);

// Todas las rutas siguientes requieren autenticación y ser admin, supervisor o support
const requireStaff = [authenticateToken, authorizeRole('admin', 'supervisor', 'support')];
const requireAdmin = [authenticateToken, authorizeRole('admin')];

// ========== CLIENTES ==========
router.get('/clients', authenticateToken, getAllClients);
router.post('/clients', requireStaff, createClient);
// Client Import Routes (con IA)
router.post('/clients/import/preview', [authenticateToken, authorizeRole('admin'), upload.single('file')], previewImportClients);
router.post('/clients/import/confirm', [authenticateToken, authorizeRole('admin'), upload.single('file')], confirmImportClients);
router.post('/clients/import', [authenticateToken, authorizeRole('admin'), upload.single('file')], importClients); // Backwards compat
router.put('/clients/:id', requireStaff, updateClient);
router.delete('/clients/:id', requireAdmin, deleteClient);

// ========== COBRADORES ==========
router.get('/collectors', authenticateToken, getAllCollectors);
router.post('/collectors', requireStaff, createCollector);
router.put('/collectors/:id', requireStaff, updateCollector);
router.post('/collectors/:id/assign-locations', requireStaff, assignCollectorToLocations);
router.delete('/collectors/:id', requireAdmin, deleteCollector);

// ========== DEUDAS ==========
router.get('/debts', authenticateToken, getAllDebts);
router.post('/debts', requireStaff, createDebt);
router.put('/debts/:id', requireStaff, updateDebt);
router.delete('/debts/:id', requireAdmin, deleteDebt);

// ========== PAGOS ==========
router.get('/payments', authenticateToken, getAllPayments);
router.post('/payments/import', [authenticateToken, authorizeRole('admin'), upload.single('file')], importPayments);
router.get('/payments/verification', authenticateToken, getPendingVerifications); // Nueva ruta
router.put('/payments/:id/verify', [authenticateToken, authorizeRole('admin', 'support')], verifyPayment);
router.put('/payments/:id/reject', [authenticateToken, authorizeRole('admin', 'support')], rejectPayment); // Nueva ruta
router.get('/payments/:id/receipt', [authenticateToken, authorizeRole('admin', 'support')], downloadReceipt);

// ========== CHATBOT ==========
router.get('/reports/chatbot', [authenticateToken, authorizeRole('admin', 'collector')], getChatbotReports);

// ========== SISTEMA ==========
router.post('/system/init-db', [authenticateToken, authorizeRole('admin')], initDatabase);
router.post('/system/run-tests', [authenticateToken, authorizeRole('admin')], runSystemTests);

// ========== CONFIGURACIÓN ==========
router.get('/config', authenticateToken, getConfig);
router.put('/config', requireAdmin, updateConfig);
router.post('/config/yape-qr', requireAdmin, upload.single('qr'), uploadYapeQR);

// ========== REPORTES ==========
router.get('/reports', authenticateToken, getReports);
router.get('/reports/earnings', authenticateToken, getEarningsStats);
router.get('/reports/collectors', authenticateToken, getCollectorsPerformance);
router.get('/reports/debts', authenticateToken, exportDebtsReport);

// ========== SISTEMA ==========
router.post('/system/reset', requireAdmin, resetSystemData);

export default router;
