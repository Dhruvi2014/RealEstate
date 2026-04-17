import express from 'express';
import { protect } from '../middleware/authmiddleware.js';
import {
  expressInterest,
  updateRequestStatus,
  createPaymentOrder,
  verifyPayment,
  confirmCashPayment,
  getAgentRequests,
  getAllRequests,
  getUserRequests,
  fixDb
} from '../controller/propertyRequestController.js';

const router = express.Router();

router.get('/fixdb', fixDb);

// User routes
router.post('/interest', protect, expressInterest);
router.post('/payment/create/:requestId', protect, createPaymentOrder);
router.post('/payment/verify', protect, verifyPayment);
router.post('/payment/cash/:requestId', protect, confirmCashPayment);
router.get('/user', protect, getUserRequests);

// Agent routes
router.put('/status/:requestId', protect, updateRequestStatus);
router.get('/agent', protect, getAgentRequests);

// Admin routes
router.get('/all', protect, getAllRequests);

export default router;
