import express from 'express';
import protect from '../middleware/authmiddleware.js';
import { 
  getAdminStats,
  getAllAppointments,
  updateAppointmentStatus,
  getPendingListings,
  approveListing,
  rejectListing,
  getAllUsers,
  deleteUser
} from '../controller/adminController.js';

const router = express.Router();

router.get('/stats', protect, getAdminStats);
router.get('/appointments', protect, getAllAppointments);
router.put('/appointments/status', protect, updateAppointmentStatus);

// Listing review queue
router.get('/properties/pending', protect, getPendingListings);
router.put('/properties/:id/approve', protect, approveListing);
router.put('/properties/:id/reject', protect, rejectListing);

// User management
router.get('/users', protect, getAllUsers);
router.delete('/users/:id', protect, deleteUser);

export default router;