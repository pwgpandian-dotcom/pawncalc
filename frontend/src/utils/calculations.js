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
