import express from 'express';
import contactRoutes from '../modules/contact/contactRoutes.js';

const router = express.Router();
export const API_VERSION = '/api/v1';

router.use('/contact', contactRoutes);

export default router
