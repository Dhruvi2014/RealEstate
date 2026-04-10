import express from 'express';
import { handleChat } from '../controller/chatbotController.js';

const router = express.Router();

// Allow anyone to use the chatbot via POST /api/chat
router.post('/chat', handleChat);

export default router;
