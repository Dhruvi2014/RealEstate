import express from 'express';
import { calculateEmi } from '../controller/emiController.js';

const router = express.Router();

router.post('/calculate', calculateEmi);

export default router;
