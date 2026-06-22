const router = require('express').Router();
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/reports?from=&to=&status=
router.get('/', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.pawnDate = {};
      if (from) filter.pawnDate.$gte = new Date(from);
      if (to)   filter.pawnDate.$lte = new Date(to);
    }
    const loans = await Loan.find(filter).populate('customer', 'name phone address').sort({ pawnDate: -1 });
    const summary = {
      totalLoans:   loans.length,
      totalPrincipal: loans.reduce((s, l) => s + l.principalAmount, 0),
      totalClosed:  loans.filter(l => l.status === 'closed').length,
      totalRecovered: loans.filter(l => l.status === 'closed').reduce((s, l) => s + (l.closingAmount || 0), 0),
      totalActive:  loans.filter(l => l.status === 'active').length,
      totalOverdue: loans.filter(l => l.status === 'active' && l.expectedCloseDate && new Date() > l.expectedCloseDate).length
    };
    res.json({ loans, summary });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
