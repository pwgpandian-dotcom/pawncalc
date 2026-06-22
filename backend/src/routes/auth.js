const router      = require('express').Router();
const jwt         = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User        = require('../models/User');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const sign = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });
  next();
};

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.json({
        token: sign(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// POST /api/auth/register
// Open only when no users exist (first-run bootstrap → admin).
// After that, requires an existing admin JWT.
router.post('/register',
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  async (req, res) => {
    try {
      const userCount = await User.countDocuments();

      // First user ever → auto-admin, no token needed
      if (userCount > 0) {
        // Must be an authenticated admin
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Admin token required' });
        let decoded;
        try { decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); }
        catch { return res.status(401).json({ message: 'Invalid token' }); }
        const caller = await User.findById(decoded.id);
        if (!caller || caller.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      }

      const { name, email, password, role } = req.body;
      if (await User.findOne({ email: email.toLowerCase() })) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const assignedRole = userCount === 0 ? 'admin' : (role || 'staff');
      const user = await User.create({ name, email, password, role: assignedRole });
      res.status(201).json({
        token: sign(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// PATCH /api/auth/password — change own password
router.patch('/password', authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ message: 'Current password incorrect' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: 'Password updated' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
);

module.exports = router;
