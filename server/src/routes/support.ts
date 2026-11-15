// FinRescue X — Support Tickets & 1-Minute Callback Routes
import { Router, Response } from 'express';
import { findMany, findById, addRecord, updateRecord } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// POST /api/support/callbacks — Includes 1-minute urgent callbacks
router.post('/callbacks', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId, preferredTime, reason, phone } = req.body;
  const isOneMinute = preferredTime === 'WITHIN_1_MINUTE' || preferredTime === 'IMMEDIATE';

  const callback = {
    id: `cb-${Date.now().toString(36)}`,
    applicationId: applicationId || null,
    merchantId: req.user.merchantId || req.user.id,
    merchantName: req.user.name,
    phone: phone || req.user.mobile,
    preferredTime: preferredTime || 'WITHIN_1_MINUTE',
    isUrgent1Min: isOneMinute,
    reason: reason || 'Urgent Loan Assistance',
    consentGranted: true,
    status: 'REQUESTED',
    countdownSeconds: isOneMinute ? 60 : 3600,
    requestedAt: new Date().toISOString()
  };

  addRecord('callbackRequests', callback);

  // Auto-generate urgent support ticket
  addRecord('supportTickets', {
    id: `ticket-cb-${Date.now().toString(36)}`,
    applicationId: applicationId || null,
    merchantId: req.user.merchantId || req.user.id,
    merchantName: req.user.name,
    merchantPhone: phone || req.user.mobile,
    subject: isOneMinute ? `⚡ URGENT: 1-Minute Callback Requested` : `Callback requested: ${reason}`,
    category: 'CALLBACK_REQUEST',
    priority: isOneMinute ? 'URGENT' : 'HIGH',
    status: 'OPEN',
    assignedTo: 'Auto-Routing Queue (Officer Available)',
    notes: [
      isOneMinute ? '🚨 Priority dispatch: Customer waiting on 60-second timer!' : 'Standard callback request',
      `Reason: ${reason || 'Application recovery'}`
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  addRecord('auditLogs', {
    id: uuid(), actor: req.user.id,
    action: isOneMinute ? 'REQUEST_1_MIN_CALLBACK' : 'REQUEST_CALLBACK',
    entityType: 'CALLBACK', entityId: callback.id,
    details: { reason, isOneMinute }, timestamp: new Date().toISOString()
  });

  res.status(201).json({
    callback,
    message: isOneMinute
      ? '⚡ 1-Minute Callback Initiated! Our representative is dialing your mobile now.'
      : 'Callback request registered successfully.'
  });
});

// GET /api/support/callbacks
router.get('/callbacks', authenticateToken, (req: AuthRequest, res: Response) => {
  let callbacks;
  if (req.user.role === 'admin' || req.user.role === 'support_agent') {
    callbacks = findMany('callbackRequests');
  } else {
    callbacks = findMany('callbackRequests', (c: any) => 
      c.merchantId === req.user.merchantId || c.merchantId === req.user.id
    );
  }
  res.json({ callbacks });
});

// POST /api/support/tickets
router.post('/tickets', authenticateToken, (req: AuthRequest, res: Response) => {
  const { applicationId, subject, category, priority } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });

  const ticket = {
    id: `ticket-${Date.now().toString(36)}`,
    applicationId: applicationId || null,
    merchantId: req.user.merchantId || req.user.id,
    merchantName: req.user.name,
    merchantPhone: req.user.mobile,
    subject, category: category || 'GENERAL',
    priority: priority || 'MEDIUM',
    status: 'OPEN', assignedTo: null,
    notes: [], createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  addRecord('supportTickets', ticket);
  res.status(201).json({ ticket });
});

// GET /api/support/tickets
router.get('/tickets', authenticateToken, (req: AuthRequest, res: Response) => {
  let tickets;
  if (req.user.role === 'admin' || req.user.role === 'support_agent') {
    tickets = findMany('supportTickets');
  } else {
    tickets = findMany('supportTickets', (t: any) => 
      t.merchantId === req.user.merchantId || t.merchantId === req.user.id
    );
  }
  res.json({ tickets });
});

export default router;
