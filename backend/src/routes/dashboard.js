const router = require('express').Router();
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', async (req, res) => {
  try {
    const [activeLoans, closedLoans, overdueLoans, totalCustomers] = await Promise.all([
      Loan.find({ status: 'active' }),
      Loan.find({ status: 'closed' }),
      Loan.find({ status: 'active', expectedCloseDate: { $lt: new Date() } }),
      Customer.countDocuments()
    ]);

    const activeAmount = activeLoans.reduce((s, l) => s + l.principalAmount, 0);
    const closedAmount = closedLoans.reduce((s, l) => s + (l.closingAmount || 0), 0);
    const overdueAmount = overdueLoans.reduce((s, l) => s + l.principalAmount, 0);

    // Monthly collections (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const closed = await Loan.find({ status: 'closed', actualCloseDate: { $gte: start, $lte: end } });
      months.push({
        month: start.toLocaleString('default', { month: 'short' }),
        loans: closed.length,
        amount: closed.reduce((s, l) => s + (l.closingAmount || 0), 0)
      });
    }

    res.json({
      activeLoans: activeLoans.length,
      activeAmount,
      closedLoans: closedLoans.length,
      closedAmount,
      overdueLoans: overdueLoans.length,
      overdueAmount,
      totalCustomers,
      monthlyData: months
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/recent', async (req, res) => {
  try {
    const loans = await Loan.find().populate('customer', 'name phone').sort({ createdAt: -1 }).limit(10);
    res.json(loans);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
