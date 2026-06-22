const mongoose = require('mongoose');

function calcMonths(start, end) {
  const days = (end - start) / (1000 * 60 * 60 * 24);
  const full = Math.floor(days / 30);
  return (days % 30) > 0 ? full + 1 : full;
}

const paymentSchema = new mongoose.Schema({
  months:   { type: Number, required: true },
  amount:   { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  notes:    String
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
  loanNumber:              { type: String, unique: true },
  customer:                { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  itemType:                { type: String, enum: ['Gold', 'Silver', 'Diamond', 'Electronics', 'Vehicle', 'Other'], default: 'Gold' },
  itemDescription:         { type: String, required: true },
  itemWeight:              String,
  itemValue:               Number,
  principalAmount:         { type: Number, required: true },
  interestRate:            { type: Number, required: true },
  pawnDate:                { type: Date, required: true, default: Date.now },
  expectedCloseDate:       Date,
  actualCloseDate:         Date,
  status:                  { type: String, enum: ['active', 'closed', 'overdue'], default: 'active' },
  advanceInterestDeducted: { type: Boolean, default: false },
  advanceInterestAmount:   { type: Number, default: 0 },
  amountGivenToCustomer:   Number,
  payments:                [paymentSchema],
  closingAmount:           Number,
  notes:                   String,
  createdBy:               { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

loanSchema.pre('save', async function (next) {
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `LN${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.amountGivenToCustomer) {
    this.amountGivenToCustomer = this.advanceInterestDeducted
      ? this.principalAmount - this.advanceInterestAmount
      : this.principalAmount;
  }
  next();
});

loanSchema.virtual('monthsElapsed').get(function () {
  return calcMonths(this.pawnDate, this.actualCloseDate || new Date());
});

loanSchema.virtual('paidMonths').get(function () {
  return this.payments.reduce((s, p) => s + (p.months || 0), 0);
});

loanSchema.virtual('pendingMonths').get(function () {
  return Math.max(this.monthsElapsed - this.paidMonths, 0);
});

loanSchema.virtual('pendingInterest').get(function () {
  return this.principalAmount * (this.interestRate / 100) * this.pendingMonths;
});

loanSchema.virtual('settlementAmount').get(function () {
  return this.principalAmount + this.pendingInterest;
});

loanSchema.virtual('isOverdue').get(function () {
  return this.status === 'active' && this.expectedCloseDate && new Date() > this.expectedCloseDate;
});

module.exports = mongoose.model('Loan', loanSchema);
