import express from 'express';
import {
    collectorLogin,
    getAssignedClients,
    registerFieldPayment,
    sendReminder,
    getCollectorStats,
    getWhatsAppHistory
} from '../controllers/collector.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { upload } from '../services/upload.service.js';

const router = express.Router();

// Login (sin autenticación)
router.post('/login', collectorLogin);

// Rutas protegidas
router.get('/clients', authenticateToken, getAssignedClients);
router.post('/payment', authenticateToken, upload.single('voucher'), registerFieldPayment);
router.post('/send-reminder', authenticateToken, sendReminder);
router.get('/stats', authenticateToken, getCollectorStats);
router.get('/whatsapp-history', authenticateToken, getWhatsAppHistory);

export default router;
