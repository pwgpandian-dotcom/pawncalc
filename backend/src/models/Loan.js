const mongoose = require('mongoose');

// Round up: 1 month 2 days = 2 months
function calcMonths(start, end) {
  const days = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  const full = Math.floor(days / 30);
  return (days % 30) > 0 ? full + 1 : full;
}

const paymentSchema = new mongoose.Schema({
  months:   { type: Number, required: true },
  amount:   { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  notes:    String
}, { timestamps: true });

// Top-up / extra principal borrowed after the loan was created
const extraAmountSchema = new mongoose.Schema({
  amount:  { type: Number, required: true },
  date:    { type: Date, default: Date.now },
  reason:  String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
  loanNumber:              { type: String, unique: true },
  customer:                { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  itemType:                { type: String, enum: ['Gold', 'Silver', 'Diamond', 'Electronics', 'Vehicle', 'Other'], default: 'Gold' },
  itemDescription:         { type: String, required: true },
  itemWeight:              String,
  itemValue:               Number,
  principalAmount:         { type: Number, required: true },   // CURRENT principal (original + all extras)
  interestRate:            { type: Number, required: true },
  pawnDate:                { type: Date, required: true, default: Date.now },
  expectedCloseDate:       Date,
  actualCloseDate:         Date,
  status:                  { type: String, enum: ['active', 'closed', 'overdue'], default: 'active' },
  advanceInterestDeducted: { type: Boolean, default: false },
  advanceInterestAmount:   { type: Number, default: 0 },
  amountGivenToCustomer:   Number,
  extraAmounts:            [extraAmountSchema],
  payments:                [paymentSchema],
  closingAmount:           Number,
  notes:                   String,
  createdBy:               { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Loan numbers are "LN" + a 6-digit zero-padded sequence (e.g. LN000690).
// The next number continues from the highest existing number so duplicates can
// never occur, but never dips below LOAN_START — the LN000690 start of the
// current series. Older "LN00128" (5-digit) numbers still seed the sequence via
// their digits, so all existing records are preserved with no data migration.
const LOAN_PREFIX = 'LN';
const LOAN_START  = 690;   // the series begins at LN000690
const LOAN_PAD    = 6;     // 6-digit zero-padded numeric part

function formatLoanNumber(n) {
  return LOAN_PREFIX + String(n).padStart(LOAN_PAD, '0');
}

async function nextLoanNumber() {
  const loans = await mongoose.model('Loan').find({}, 'loanNumber').lean();
  let max = 0;
  for (const l of loans) {
    const n = parseInt(String(l.loanNumber || '').replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return formatLoanNumber(Math.max(max + 1, LOAN_START));
}
loanSchema.statics.nextLoanNumber = nextLoanNumber;

loanSchema.pre('save', async function (next) {
  if (!this.loanNumber) {
    this.loanNumber = await nextLoanNumber();
  }
  if (this.amountGivenToCustomer == null) {
    this.amountGivenToCustomer = this.advanceInterestDeducted
      ? this.principalAmount - this.advanceInterestAmount
      : this.principalAmount;
  }
  next();
});

// Original principal = current principal minus every extra top-up added later.
loanSchema.virtual('originalPrincipal').get(function () {
  const extras = (this.extraAmounts || []).reduce((s, e) => s + (e.amount || 0), 0);
  return this.principalAmount - extras;
});

loanSchema.virtual('monthsElapsed').get(function () {
  return calcMonths(this.pawnDate, this.actualCloseDate || new Date());
});

loanSchema.virtual('paidMonths').get(function () {
  return this.payments.reduce((s, p) => s + (p.months || 0), 0);
});

// Total interest accrued to date, computed per principal-segment so each extra
// top-up only accrues interest from the date it was borrowed (future interest
// on the updated principal — past interest is never inflated retroactively).
loanSchema.virtual('accruedInterest').get(function () {
  const asOf = this.actualCloseDate || new Date();
  const rate = this.interestRate / 100;
  const segments = [{ amount: this.originalPrincipal, date: this.pawnDate }];
  for (const e of (this.extraAmounts || [])) {
    segments.push({ amount: e.amount, date: e.date || e.createdAt || this.pawnDate });
  }
  return segments.reduce((sum, s) => sum + s.amount * rate * calcMonths(s.date, asOf), 0);
});

// Interest already paid (actual rupees recorded across payments).
loanSchema.virtual('paidInterest').get(function () {
  return this.payments.reduce((s, p) => s + (p.amount || 0), 0);
});

loanSchema.virtual('pendingInterest').get(function () {
  return Math.max(this.accruedInterest - this.paidInterest, 0);
});

loanSchema.virtual('settlementAmount').get(function () {
  return this.principalAmount + this.pendingInterest;
});

loanSchema.virtual('isOverdue').get(function () {
  return this.status === 'active' && this.expectedCloseDate && new Date() > this.expectedCloseDate;
});

module.exports = mongoose.model('Loan', loanSchema);
