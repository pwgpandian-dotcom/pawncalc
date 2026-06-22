const router = require('express').Router();
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    let loans = await Loan.find(filter).populate('customer', 'name phone').sort({ createdAt: -1 });
    if (q) {
      const rx = new RegExp(q, 'i');
      loans = loans.filter(l => rx.test(l.loanNumber) || rx.test(l.customer?.name) || rx.test(l.itemDescription));
    }
    res.json(loans);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/overdue', async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'active', expectedCloseDate: { $lt: new Date() } })
      .populate('customer', 'name phone').sort({ expectedCloseDate: 1 });
    res.json(loans);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customer');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const loan = await Loan.create({ ...req.body, createdBy: req.user.id });
    await loan.populate('customer', 'name phone');
    res.status(201).json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('customer');
    res.json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/loans/:id/payments — add interest payment
router.post('/:id/payments', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    loan.payments.push(req.body);
    await loan.save();
    await loan.populate('customer', 'name phone');
    res.json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/loans/:id/close
router.patch('/:id/close', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    loan.status = 'closed';
    loan.actualCloseDate = req.body.actualCloseDate || new Date();
    loan.closingAmount = req.body.closingAmount;
    await loan.save();
    await loan.populate('customer', 'name phone');
    res.json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/loans/:id/reopen
router.patch('/:id/reopen', async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, { status: 'active', actualCloseDate: null, closingAmount: null }, { new: true });
    res.json(loan);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
