const router   = require('express').Router();
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Loan     = require('../models/Loan');
const auth     = require('../middleware/auth');

router.use(auth);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });
  next();
};

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { $or: [{ name: new RegExp(q.trim(), 'i') }, { phone: new RegExp(q.trim(), 'i') }, { idNumber: new RegExp(q.trim(), 'i') }] }
      : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const loans = await Loan.find({ customer: req.params.id }).sort({ createdAt: -1 });
    res.json({ customer, loans });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/',
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s]{7,15}$/).withMessage('Invalid phone number'),
  validate,
  async (req, res) => {
    try {
      const customer = await Customer.create(req.body);
      res.status(201).json(customer);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

router.put('/:id',
  body('name').optional().trim().notEmpty().withMessage('Name cannot be blank'),
  body('phone').optional().matches(/^[0-9+\-\s]{7,15}$/).withMessage('Invalid phone'),
  validate,
  async (req, res) => {
    try {
      const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.json(customer);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const activeLoans = await Loan.countDocuments({ customer: req.params.id, status: 'active' });
    if (activeLoans > 0) return res.status(400).json({ message: 'Customer has active loans — close them first' });
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
