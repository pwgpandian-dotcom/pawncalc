const router = require('express').Router();
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/loans/next-number — suggested next loan number (continues the LN000690 sequence)
router.get('/next-number', async (req, res) => {
  try {
    res.json({ next: await Loan.nextLoanNumber() });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

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
    const { customerData, ...loanData } = req.body;
    let customerId = loanData.customer;

    // Inline customer entry: find an existing customer by mobile, or create one.
    if (!customerId && customerData) {
      const name  = (customerData.name || '').trim();
      const phone = (customerData.phone || '').trim();
      if (!name)  return res.status(422).json({ message: 'Customer name is required' });
      if (!/^[0-9]{10}$/.test(phone)) return res.status(422).json({ message: 'Mobile number must be exactly 10 digits' });

      let customer = await Customer.findOne({ phone });
      if (!customer) {
        customer = await Customer.create({ name, phone, village: (customerData.village || '').trim() });
      } else if (!customer.village && customerData.village) {
        // Backfill village if we now have it and the record was missing one.
        customer.village = customerData.village.trim();
        await customer.save();
      }
      customerId = customer._id;
    }

    if (!customerId) return res.status(422).json({ message: 'Customer details are required' });

    const loan = await Loan.create({ ...loanData, customer: customerId, createdBy: req.user.id });
    await loan.populate('customer', 'name phone village');
    res.status(201).json(loan);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'That loan number is already in use' });
    res.status(500).json({ message: e.message });
  }
});

// POST /api/loans/:id/extra — add extra (top-up) amount to an active loan
router.post('/:id/extra', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.status !== 'active') return res.status(400).json({ message: 'Can only add extra amount to an active loan' });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(422).json({ message: 'Enter a valid extra amount' });

    loan.extraAmounts.push({
      amount,
      date:    req.body.date || new Date(),
      reason:  req.body.reason,
      addedBy: req.user.id
    });
    loan.principalAmount       += amount;   // grows the current principal
    loan.amountGivenToCustomer  = (loan.amountGivenToCustomer || 0) + amount;
    await loan.save();
    await loan.populate('customer');
    res.json(loan);
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
