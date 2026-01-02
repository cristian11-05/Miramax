import express from 'express';
import {
    collectorLogin,
    getAssignedClients,
    registerFieldPayment,
    sendReminder,
    getCollectorStats,
    getWhatsAppHistory,
    getClientDebts
} from '../controllers/collector.controller.js';
import { chatWithAssistant } from '../controllers/chatbot.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { upload } from '../services/upload.service.js';

const router = express.Router();

// Login (sin autenticación)
router.post('/login', collectorLogin);

// Rutas protegidas
router.get('/clients', authenticateToken, getAssignedClients);
router.get('/clients/:id/debts', authenticateToken, getClientDebts);
router.post('/payments', authenticateToken, upload.single('voucher'), registerFieldPayment);
router.post('/send-reminder', authenticateToken, sendReminder);
router.get('/stats', authenticateToken, getCollectorStats);
router.get('/whatsapp-history', authenticateToken, getWhatsAppHistory);
router.post('/chat', authenticateToken, chatWithAssistant);

export default router;
