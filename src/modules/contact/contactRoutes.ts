
import express, { Router } from 'express';
import * as contactController from './contactController.js';

const router: Router = Router();

/**
 * POST /identify - Identity reconciliation endpoint
 * Accepts: { email?: string, phoneNumber?: number }
 * Returns: { contact: { primaryContactId, emails, phoneNumbers, secondaryContactIds } }
 */
router.post('/identify', contactController.identifyContactHandler);

export default router;
