// FinRescue X — Partner Simulation Routes
import { Router, Response } from 'express';
import { findMany, findById, addRecord } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/partners/status
router.get('/status', (req, res: Response) => {
  const partners = findMany('partners');
  const telemetry = findMany('partnerTelemetry');
  
  const partnerStatus = partners.map((p: any) => {
    const recent = telemetry.filter((t: any) => t.partnerId === p.id).slice(-20);
    const failureCount = recent.filter((t: any) => t.status === 'FAILURE' || t.status === 'TIMEOUT').length;
    const avgLatency = recent.length ? Math.round(recent.reduce((acc: number, cur: any) => acc + cur.latencyMs, 0) / recent.length) : p.avgLatencyMs;
    const successRate = recent.length ? Math.round(((recent.length - failureCount) / recent.length) * 1000) / 10 : p.successRate;

    return {
      ...p,
      avgLatencyMs: avgLatency,
      successRate: successRate,
      sampleSize: recent.length,
      isSimulated: true
    };
  });

  res.json({
    partners: partnerStatus,
    notice: 'Simulated Partner Telemetry — Demo Lenders A, B, C are synthetic integrations.'
  });
});

// POST /api/partners/simulate-event
router.post('/simulate-event', (req, res: Response) => {
  const { partnerId, eventType, latencyMs, statusCode } = req.body;
  const partners = findMany('partners');
  const partner = partners.find((p: any) => p.id === partnerId) || partners[0];

  const status = statusCode === 200 ? 'SUCCESS' : statusCode === 408 ? 'TIMEOUT' : 'FAILURE';
  const newEvent = {
    id: uuid(),
    partnerId: partner.id,
    partnerName: partner.name,
    endpoint: eventType || '/api/submit',
    statusCode: statusCode || 200,
    latencyMs: latencyMs || (status === 'TIMEOUT' ? 5200 : Math.floor(Math.random() * 400 + 150)),
    status: status,
    applicationId: 'FNX-DEMO-1001',
    timestamp: new Date().toISOString()
  };

  addRecord('partnerTelemetry', newEvent);
  res.json({ success: true, event: newEvent });
});

export default router;
