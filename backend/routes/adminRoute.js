import express from 'express';
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

router.get('/stats', getAdminStats);
router.get('/appointments', getAllAppointments);
router.put('/appointments/status', updateAppointmentStatus);

// Listing review queue
router.get('/properties/pending', getPendingListings);
router.put('/properties/:id/approve', approveListing);
router.put('/properties/:id/reject', rejectListing);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

export default router;