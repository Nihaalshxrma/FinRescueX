// FinRescue X — Loan Offers Routes
import { Router, Response } from 'express';
import { findMany, findById, updateRecord, addRecord } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET /api/offers/:applicationId
router.get('/:applicationId', authenticateToken, (req: AuthRequest, res: Response) => {
  const offers = findMany('loanOffers', (o: any) => o.applicationId === req.params.applicationId);
  // If no offers exist, generate synthetic ones
  if (offers.length === 0) {
    const app = findById('applications', req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    const generated = generateSyntheticOffers(req.params.applicationId, app.requestedAmountINR);
    generated.forEach(o => addRecord('loanOffers', o));
    return res.json({ offers: generated, note: 'DEMO DATA — These are synthetic offers for hackathon demonstration purposes only.' });
  }
  res.json({ offers, note: 'DEMO DATA — These are synthetic offers for hackathon demonstration purposes only.' });
});

// POST /api/offers/:offerId/select
router.post('/:offerId/select', authenticateToken, (req: AuthRequest, res: Response) => {
  const offer = findById('loanOffers', req.params.offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  
  const app = findById('applications', offer.applicationId);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  updateRecord('applications', app.id, { selectedOfferId: offer.id, selectedOffer: offer, stage: 'STAGE_7_KYC_VERIFICATION', status: 'KYC_PENDING' });
  addRecord('applicationEvents', { id: uuid(), applicationId: app.id, type: 'OFFER_SELECTED', description: `Selected offer from ${offer.lenderName}`, timestamp: new Date().toISOString(), actor: req.user.merchantId });

  res.json({ success: true, selectedOffer: offer, message: 'Offer selected. Proceed to KYC verification.' });
});

// GET /api/offers/:offerId/kfs — Key Fact Statement
router.get('/:offerId/kfs', authenticateToken, (req: AuthRequest, res: Response) => {
  const offer = findById('loanOffers', req.params.offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  
  const kfs = {
    title: 'Key Fact Statement (KFS)',
    disclaimer: 'DEMO DOCUMENT — This Key Fact Statement is generated for hackathon demonstration purposes only. It does not represent an actual lending agreement.',
    lenderName: offer.lenderName,
    lenderType: 'Simulated NBFC / Bank',
    borrowerName: '[To be filled from application]',
    loanAmount: offer.amountINR,
    annualPercentageRate: offer.aprPercentage,
    rateOfInterest: offer.annualRoiPercentage,
    rateType: 'Fixed',
    tenure: `${offer.tenureMonths} months`,
    repaymentFrequency: offer.repaymentFrequency,
    instalmentAmount: offer.instalmentAmountINR,
    totalNumberOfInstalments: offer.totalInstallments,
    totalInterest: offer.totalRepaymentINR - offer.amountINR,
    totalAmountPayable: offer.totalRepaymentINR,
    processingFee: offer.processingFeeINR,
    gstOnProcessingFee: offer.gstOnProcessingFeeINR,
    insuranceCharges: offer.insuranceChargesINR,
    netDisbursement: offer.netDisbursalAmountINR,
    prepaymentTerms: offer.prepaymentForeclosureTerms,
    latePaymentCharges: offer.latePaymentCharges,
    coolingOffPeriod: `${offer.coolingOffDays} days`,
    grievanceRedressal: offer.grievanceRedressalOfficer,
    generatedAt: new Date().toISOString()
  };

  res.json({ kfs });
});

function generateSyntheticOffers(applicationId: string, amount: number): any[] {
  return [
    {
      id: `offer-${Date.now()}-a`, applicationId, lenderId: 'lender-a', lenderName: 'Demo Lender A',
      amountINR: amount, annualRoiPercentage: 16.5, aprPercentage: 18.2,
      tenureMonths: 12, repaymentFrequency: 'MONTHLY',
      processingFeeINR: Math.round(amount * 0.02), gstOnProcessingFeeINR: Math.round(amount * 0.02 * 0.18),
      insuranceChargesINR: 0, netDisbursalAmountINR: Math.round(amount * 0.976),
      totalRepaymentINR: Math.round(amount * 1.092), instalmentAmountINR: Math.round(amount * 1.092 / 12),
      totalInstallments: 12,
      prepaymentForeclosureTerms: 'Prepayment allowed after 3 EMIs. Foreclosure: 2% + GST.',
      latePaymentCharges: '₹500/day, max ₹2,000/instalment.',
      coolingOffDays: 3,
      grievanceRedressalOfficer: { name: 'Mr. Demo Officer', email: 'grievance@demolendera.example', phone: '+91-1800-XXX-XXXX' },
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
    },
    {
      id: `offer-${Date.now()}-b`, applicationId, lenderId: 'lender-b', lenderName: 'Demo Lender B',
      amountINR: amount, annualRoiPercentage: 18.0, aprPercentage: 19.8,
      tenureMonths: 12, repaymentFrequency: 'DAILY',
      processingFeeINR: Math.round(amount * 0.015), gstOnProcessingFeeINR: Math.round(amount * 0.015 * 0.18),
      insuranceChargesINR: 500, netDisbursalAmountINR: Math.round(amount * 0.982),
      totalRepaymentINR: Math.round(amount * 1.104), instalmentAmountINR: Math.round(amount * 1.104 / 360),
      totalInstallments: 360,
      prepaymentForeclosureTerms: 'Prepayment after 90 days. No foreclosure charge.',
      latePaymentCharges: '₹100/day after grace period.',
      coolingOffDays: 3,
      grievanceRedressalOfficer: { name: 'Ms. Demo Manager', email: 'complaints@demolenderb.example', phone: '+91-1800-YYY-YYYY' },
      expiresAt: new Date(Date.now() + 5 * 86400000).toISOString()
    }
  ];
}

export default router;
