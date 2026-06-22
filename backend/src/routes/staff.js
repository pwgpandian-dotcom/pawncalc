const router      = require('express').Router();
const { body, validationResult } = require('express-validator');
const User        = require('../models/User');
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(auth, requireRole('admin'));

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });
  next();
};

// GET /api/staff — list all staff and admins
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/staff — create staff account
router.post('/',
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (await User.findOne({ email: email.toLowerCase() })) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const user = await User.create({ name, email, password, role });
      res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// PATCH /api/staff/:id — update name / role
router.patch('/:id',
  body('role').optional().isIn(['admin', 'staff']),
  validate,
  async (req, res) => {
    try {
      const { name, role } = req.body;
      const update = {};
      if (name) update.name = name.trim();
      if (role) update.role = role;
      const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// PATCH /api/staff/:id/reset-password
router.patch('/:id/reset-password',
  body('newPassword').isLength({ min: 6 }).withMessage('Min 6 characters'),
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: 'Password reset successfully' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
