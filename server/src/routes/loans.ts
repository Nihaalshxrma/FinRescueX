// FinRescue X — Active Loans & Repayment Routes
import { Router, Response } from 'express';
import { findMany, findById } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/loans
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const isMerchant = !!req.user.merchantId;
  const loans = findMany('activeLoans', (l: any) => 
    l.merchantId === req.user.merchantId || l.merchantId === req.user.id
  );

  // If no loans tied to specific user yet, return the corresponding demo loan
  if (loans.length === 0) {
    const fallbackLoans = findMany('activeLoans', (l: any) => 
      isMerchant ? l.merchantId === 'merchant-1' : l.merchantId === 'user-normal-1'
    );
    return res.json({ loans: fallbackLoans });
  }

  res.json({ loans });
});

// GET /api/loans/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const loan = findById('activeLoans', req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  const txns = findMany('repaymentTransactions', (t: any) => t.loanId === loan.id);
  res.json({ loan, transactions: txns });
});

// GET /api/loans/:id/repayments
router.get('/:id/repayments', authenticateToken, (req: AuthRequest, res: Response) => {
  const txns = findMany('repaymentTransactions', (t: any) => t.loanId === req.params.id);
  const sorted = txns.sort((a: any, b: any) => a.installmentNumber - b.installmentNumber);
  res.json({ repayments: sorted });
});

export default router;
