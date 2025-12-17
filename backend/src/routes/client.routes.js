import express from 'express';
import {
    checkDebt,
    getYapeInfo,
    registerPayment,
    uploadVoucher,
    getWhatsAppURL,
    checkPaymentStatus,
    reportPayment
} from '../controllers/client.controller.js';
import { upload } from '../services/upload.service.js';

const router = express.Router();

// Públicas (sin autenticación)
router.get('/check-debt/:dni', checkDebt); // GET con params
router.get('/yape-info', getYapeInfo);
router.post('/payment', registerPayment);
router.post('/upload-voucher', upload.single('voucher'), uploadVoucher);
router.get('/whatsapp-url', getWhatsAppURL);
router.get('/payment-status/:id', checkPaymentStatus);
router.post('/report-payment', reportPayment);

export default router;
