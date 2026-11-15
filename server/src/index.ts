// FinRescue X — Main Server Entry Point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { loadDB, getDB, resetDB } from './database';
import { createSeedData } from './seed';

import authRouter from './routes/auth';
import applicationsRouter from './routes/applications';
import documentsRouter from './routes/documents';
import offersRouter from './routes/offers';
import kycRouter from './routes/kyc';
import bankRouter from './routes/bank';
import consentsRouter from './routes/consents';
import loansRouter from './routes/loans';
import agentRouter from './routes/agent';
import supportRouter from './routes/support';
import intelligenceRouter from './routes/intelligence';
import adminRouter from './routes/admin';
import partnersRouter from './routes/partners';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents safely
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/offers', offersRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/bank', bankRouter);
app.use('/api/consents', consentsRouter);
app.use('/api/loans', loansRouter);
app.use('/api/agent', agentRouter);
app.use('/api/support', supportRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/admin', adminRouter);
app.use('/api/partners', partnersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'FinRescue X Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: 'demo'
  });
});

// Initialize database
loadDB();
const currentDb = getDB();
if (!currentDb.users || currentDb.users.length === 0) {
  console.log('[Init] Seeding baseline demo data...');
  resetDB(createSeedData());
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 FinRescue X Server running on http://localhost:${PORT}`);
    console.log(`⚡ Mode: Hackathon Demo Prototype`);
    console.log(`🛡️ Simulated KYC, Bureau, Bank & Partner Integrations`);
    console.log(`=======================================================`);
  });
}

export default app;
