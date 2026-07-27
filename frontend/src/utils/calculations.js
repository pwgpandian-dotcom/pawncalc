// Round up: 1 month 2 days = 2 months
export function calcMonths(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const ms    = end - start;
  if (ms <= 0) return 0;
  const days  = ms / (1000 * 60 * 60 * 24);
  const full  = Math.floor(days / 30);
  return (days % 30) > 0 ? full + 1 : full;
}

export function calcInterest(principal, rate, months) {
  return principal * (rate / 100) * months;
}

export function calcSettlement(principal, rate, totalMonths, paidMonths = 0) {
  const pending  = Math.max(totalMonths - paidMonths, 0);
  const interest = calcInterest(principal, rate, pending);
  return {
    pending,
    interest,
    total: principal + interest
  };
}

// Auto interest rule: below ₹10,000 → 2.5%/month, otherwise 2%/month.
export function autoInterestRate(amount) {
  return Number(amount) < 10000 ? 2.5 : 2;
}

// Principal segments: the original principal from the pawn date, plus each extra
// top-up from the date it was borrowed. Used for accurate, time-weighted interest.
export function principalSegments(loan) {
  const extras   = loan.extraAmounts || [];
  const extraSum = extras.reduce((s, e) => s + (e.amount || 0), 0);
  const original = (loan.principalAmount || 0) - extraSum;
  const segs = [{ amount: original, date: loan.pawnDate }];
  extras.forEach(e => segs.push({ amount: e.amount, date: e.date || e.createdAt || loan.pawnDate }));
  return segs;
}

// Interest accrued to `asOf`, computed per segment so extras only accrue from
// their own date (future interest on the updated principal).
export function accruedInterest(loan, asOf = new Date()) {
  return principalSegments(loan).reduce(
    (sum, s) => sum + calcInterest(s.amount, loan.interestRate, calcMonths(s.date, asOf)), 0
  );
}

export function paidInterest(loan) {
  return (loan.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
}

// Full settlement for a loan object (handles extra amounts). Returns the current
// principal, interest accrued/paid, pending interest and the settlement total.
export function loanSettlement(loan, asOf = new Date()) {
  const accrued = accruedInterest(loan, asOf);
  const paid    = paidInterest(loan);
  const pending = Math.max(accrued - paid, 0);
  return {
    principal: loan.principalAmount || 0,
    accrued,
    paid,
    interest: pending,
    total: (loan.principalAmount || 0) + pending
  };
}

export function calcPayout(principal, rate, deductAdvance) {
  const interest = deductAdvance ? calcInterest(principal, rate, 1) : 0;
  return {
    interest,
    payout: principal - interest
  };
}

export function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
