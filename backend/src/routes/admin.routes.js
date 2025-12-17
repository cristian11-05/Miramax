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
    downloadReceipt
} from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';
import { upload } from '../services/upload.service.js';

const router = express.Router();

// Login (sin autenticación)
router.post('/login', adminLogin);

// Dashboard
router.get('/dashboard', [authenticateToken, authorizeRole('admin')], getDashboardStats);

// Todas las rutas siguientes requieren autenticación y ser admin, supervisor o support
const requireAuth = [authenticateToken, authorizeRole('admin', 'supervisor', 'support')];
const requireAdmin = [authenticateToken, authorizeRole('admin')];

// ========== CLIENTES ==========
router.get('/clients', requireAuth, getAllClients);
router.post('/clients', requireAdmin, createClient);
router.put('/clients/:id', requireAdmin, updateClient);
router.delete('/clients/:id', requireAdmin, deleteClient);

// ========== COBRADORES ==========
router.get('/collectors', requireAuth, getAllCollectors);
router.post('/collectors', requireAdmin, createCollector);
router.put('/collectors/:id', requireAdmin, updateCollector);
router.delete('/collectors/:id', requireAdmin, deleteCollector);

// ========== DEUDAS ==========
router.get('/debts', requireAuth, getAllDebts);
router.post('/debts', requireAdmin, createDebt);
router.put('/debts/:id', requireAdmin, updateDebt);
router.delete('/debts/:id', requireAdmin, deleteDebt);

// ========== PAGOS ==========
router.get('/payments', requireAuth, getAllPayments);
router.get('/payments/verification', requireAuth, getPendingVerifications); // Nueva ruta
router.put('/payments/:id/verify', [authenticateToken, authorizeRole('admin', 'support')], verifyPayment);
router.put('/payments/:id/reject', [authenticateToken, authorizeRole('admin', 'support')], rejectPayment); // Nueva ruta
router.get('/payments/:id/receipt', [authenticateToken, authorizeRole('admin', 'support')], downloadReceipt);

// ========== CONFIGURACIÓN ==========
router.get('/config', requireAuth, getConfig);
router.put('/config', requireAdmin, updateConfig);
router.post('/config/yape-qr', requireAdmin, upload.single('qr'), uploadYapeQR);

// ========== REPORTES ==========
router.get('/reports', requireAuth, getReports);

export default router;
