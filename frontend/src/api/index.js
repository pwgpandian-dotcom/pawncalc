import { supabase } from '../lib/supabaseClient';

// Thin URL-pattern shim over Supabase, matching the shape of the old axios
// client (`{data}` responses, `err.response.data.message` errors) so every
// page's existing fetch/catch code keeps working unchanged.

function apiError(message) {
  const err = new Error(message);
  err.response = { data: { message } };
  return err;
}

function pgError(error, fallback) {
  if (error?.code === '23505') return apiError('That loan number is already in use');
  return apiError(error?.message || fallback);
}

// ---- mappers: snake_case DB rows -> the camelCase shape pages expect -----

function mapLoanListRow(r) {
  return {
    _id: r.id,
    loanNumber: r.loan_number,
    customer: { _id: r.customer_id, name: r.customer_name, phone: r.customer_phone, village: r.customer_village },
    itemType: r.item_type,
    itemDescription: r.item_description,
    itemWeight: r.item_weight,
    itemValue: r.item_value,
    principalAmount: r.principal_amount,
    interestRate: r.interest_rate,
    pawnDate: r.pawn_date,
    expectedCloseDate: r.expected_close_date,
    actualCloseDate: r.actual_close_date,
    status: r.status,
    advanceInterestDeducted: r.advance_interest_deducted,
    advanceInterestAmount: r.advance_interest_amount,
    amountGivenToCustomer: r.amount_given_to_customer,
    closingAmount: r.closing_amount,
    notes: r.notes,
    createdAt: r.created_at,
    originalPrincipal: r.original_principal,
    monthsElapsed: r.months_elapsed,
    paidMonths: r.paid_months,
    accruedInterest: r.accrued_interest,
    paidInterest: r.paid_interest,
    pendingInterest: r.pending_interest,
    settlementAmount: r.settlement_amount,
    isOverdue: r.is_overdue
  };
}

function mapPayment(p) {
  return { _id: p.id, months: p.months, amount: p.amount, paidDate: p.paid_date, notes: p.notes, createdAt: p.created_at };
}
function mapExtra(e) {
  return { _id: e.id, amount: e.amount, date: e.date, reason: e.reason, createdAt: e.created_at };
}

function mapCustomer(c) {
  return {
    _id: c.id, name: c.name, phone: c.phone, phone2: c.phone2, village: c.village, address: c.address,
    idType: c.id_type, idNumber: c.id_number, notes: c.notes, photo: c.photo,
    createdAt: c.created_at, updatedAt: c.updated_at
  };
}

function mapStaff(p) {
  return { _id: p.id, name: p.name, email: p.email, role: p.role, createdAt: p.created_at };
}

async function fetchLoanDetail(id) {
  const [{ data: row, error }, { data: payments, error: payErr }, { data: extras, error: extraErr }] = await Promise.all([
    supabase.rpc('get_loan_detail', { p_loan_id: id }).maybeSingle(),
    supabase.from('loan_payments').select('*').eq('loan_id', id).order('paid_date', { ascending: true }),
    supabase.from('loan_extra_amounts').select('*').eq('loan_id', id).order('date', { ascending: true })
  ]);
  if (error) throw pgError(error, 'Failed to load loan');
  if (payErr || extraErr) throw pgError(payErr || extraErr, 'Failed to load loan');
  if (!row) return null;
  return {
    ...mapLoanListRow(row),
    customer: { _id: row.customer_id, name: row.customer_name, phone: row.customer_phone, village: row.customer_village, address: row.customer_address },
    payments: (payments || []).map(mapPayment),
    extraAmounts: (extras || []).map(mapExtra)
  };
}

async function createLoan(payload) {
  let customerId = payload.customer;

  if (!customerId && payload.customerData) {
    const { name, phone, village } = payload.customerData;
    if (!name) throw apiError('Customer name is required');
    if (phone && !/^[0-9]{10}$/.test(phone)) throw apiError('Mobile number must be exactly 10 digits');
    const { data: cust, error: custErr } = await supabase
      .from('customers')
      .insert({ name, phone: phone || null, village: village || null })
      .select()
      .single();
    if (custErr) throw pgError(custErr, 'Failed to create customer');
    customerId = cust.id;
  }
  if (!customerId) throw apiError('Customer details are required');

  const { data: userData } = await supabase.auth.getUser();

  const row = {
    loan_number: payload.loanNumber || null,
    customer_id: customerId,
    item_type: payload.itemType,
    item_description: payload.itemDescription,
    item_weight: payload.itemWeight || null,
    item_value: payload.itemValue ?? null,
    principal_amount: payload.principalAmount,
    interest_rate: payload.interestRate,
    pawn_date: payload.pawnDate,
    expected_close_date: payload.expectedCloseDate || null,
    advance_interest_deducted: payload.advanceInterestDeducted || false,
    advance_interest_amount: payload.advanceInterestAmount || 0,
    amount_given_to_customer: payload.amountGivenToCustomer ?? null,
    notes: payload.notes || null,
    created_by: userData?.user?.id || null
  };
  const { data, error } = await supabase.from('loans').insert(row).select('id').single();
  if (error) throw pgError(error, 'Failed to create loan');
  return { _id: data.id };
}

async function addPayment(id, body) {
  const { error } = await supabase.from('loan_payments').insert({
    loan_id: id, months: body.months, amount: body.amount, paid_date: body.paidDate || undefined, notes: body.notes || null
  });
  if (error) throw pgError(error, 'Failed to record payment');
  return fetchLoanDetail(id);
}

async function addExtra(id, body) {
  const { error } = await supabase.rpc('add_loan_extra', {
    p_loan_id: id, p_amount: body.amount, p_date: body.date || undefined, p_reason: body.reason || null
  });
  if (error) throw pgError(error, 'Failed to add extra amount');
  return fetchLoanDetail(id);
}

async function closeLoan(id, body) {
  const { error } = await supabase.from('loans').update({
    status: 'closed', actual_close_date: body.actualCloseDate || undefined, closing_amount: body.closingAmount
  }).eq('id', id);
  if (error) throw pgError(error, 'Failed to close loan');
  return fetchLoanDetail(id);
}

async function listCustomers(q) {
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,id_number.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw pgError(error, 'Failed to load customers');
  return (data || []).map(mapCustomer);
}

async function deleteCustomer(id) {
  const { count, error: countErr } = await supabase
    .from('loans').select('id', { count: 'exact', head: true }).eq('customer_id', id).eq('status', 'active');
  if (countErr) throw pgError(countErr, 'Failed to delete customer');
  if (count > 0) throw apiError('Customer has active loans — close them first');
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw pgError(error, 'Failed to delete customer');
}

async function callAdminStaff(body) {
  const { data, error } = await supabase.functions.invoke('admin-staff', { body });
  if (error) {
    const message = data?.message || error.context?.responseJson?.message || error.message;
    throw apiError(message || 'Staff action failed');
  }
  return data;
}

// ---- the generic REST-shaped client every page already calls -------------

const api = {
  async get(url) {
    const [path, qs] = url.split('?');
    const params = new URLSearchParams(qs || '');

    if (path === '/loans') {
      const { data, error } = await supabase.rpc('get_loans_list', {
        p_status: params.get('status') || null,
        p_search: params.get('q') || null
      });
      if (error) throw pgError(error, 'Failed to load loans');
      return { data: (data || []).map(mapLoanListRow) };
    }
    if (path === '/loans/overdue') {
      const { data, error } = await supabase.rpc('get_overdue_loans');
      if (error) throw pgError(error, 'Failed to load overdue loans');
      return { data: (data || []).map(mapLoanListRow) };
    }
    if (path === '/loans/next-number') {
      const { data, error } = await supabase.rpc('next_loan_number');
      if (error) throw pgError(error, 'Failed to get next loan number');
      return { data: { next: data } };
    }
    const loanIdMatch = path.match(/^\/loans\/([^/]+)$/);
    if (loanIdMatch) {
      const loan = await fetchLoanDetail(loanIdMatch[1]);
      if (!loan) throw apiError('Loan not found');
      return { data: loan };
    }
    if (path === '/customers') {
      return { data: await listCustomers(params.get('q')) };
    }
    if (path === '/reports') {
      const { data, error } = await supabase.rpc('get_reports', {
        p_from: params.get('from') || null, p_to: params.get('to') || null, p_status: params.get('status') || null
      });
      if (error) throw pgError(error, 'Failed to load reports');
      return { data };
    }
    if (path === '/dashboard/stats') {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw pgError(error, 'Failed to load dashboard');
      return { data };
    }
    if (path === '/dashboard/recent') {
      const { data, error } = await supabase.rpc('get_recent_loans', { p_limit: 10 });
      if (error) throw pgError(error, 'Failed to load dashboard');
      return {
        data: (data || []).map(r => ({
          _id: r.id, loanNumber: r.loan_number, customer: { name: r.customer_name, phone: r.customer_phone },
          itemDescription: r.item_description, principalAmount: r.principal_amount, interestRate: r.interest_rate,
          pawnDate: r.pawn_date, status: r.status
        }))
      };
    }
    if (path === '/staff') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw pgError(error, 'Failed to load staff');
      return { data: (data || []).map(mapStaff) };
    }
    throw apiError(`Unhandled GET ${url}`);
  },

  async post(url, body) {
    if (url === '/loans') return { data: await createLoan(body) };
    if (url === '/customers') {
      if (!body.name?.trim()) throw apiError('Customer name is required');
      if (body.phone && !/^[0-9]{10}$/.test(body.phone)) throw apiError('Mobile number must be exactly 10 digits');
      const { data, error } = await supabase.from('customers').insert({
        name: body.name, phone: body.phone || null, phone2: body.phone2 || null, village: body.village || null,
        address: body.address || null, id_type: body.idType || 'Aadhaar', id_number: body.idNumber || null,
        notes: body.notes || null, photo: body.photo || null
      }).select().single();
      if (error) throw pgError(error, 'Failed to save customer');
      return { data: mapCustomer(data) };
    }
    const payMatch = url.match(/^\/loans\/([^/]+)\/payments$/);
    if (payMatch) return { data: await addPayment(payMatch[1], body) };
    const extraMatch = url.match(/^\/loans\/([^/]+)\/extra$/);
    if (extraMatch) return { data: await addExtra(extraMatch[1], body) };
    if (url === '/staff') {
      const data = await callAdminStaff({ action: 'create', ...body });
      return { data };
    }
    throw apiError(`Unhandled POST ${url}`);
  },

  async put(url, body) {
    const custMatch = url.match(/^\/customers\/([^/]+)$/);
    if (custMatch) {
      if (body.phone && !/^[0-9]{10}$/.test(body.phone)) throw apiError('Mobile number must be exactly 10 digits');
      const { data, error } = await supabase.from('customers').update({
        name: body.name, phone: body.phone || null, phone2: body.phone2 || null, village: body.village || null,
        address: body.address || null, id_type: body.idType || 'Aadhaar', id_number: body.idNumber || null,
        notes: body.notes || null, photo: body.photo || null
      }).eq('id', custMatch[1]).select().single();
      if (error) throw pgError(error, 'Failed to update customer');
      return { data: mapCustomer(data) };
    }
    throw apiError(`Unhandled PUT ${url}`);
  },

  async patch(url, body) {
    const closeMatch = url.match(/^\/loans\/([^/]+)\/close$/);
    if (closeMatch) return { data: await closeLoan(closeMatch[1], body) };
    const staffMatch = url.match(/^\/staff\/([^/]+)$/);
    if (staffMatch) {
      const { data, error } = await supabase.from('profiles').update(body).eq('id', staffMatch[1]).select().single();
      if (error) throw pgError(error, 'Failed to update staff member');
      return { data: mapStaff(data) };
    }
    throw apiError(`Unhandled PATCH ${url}`);
  },

  async delete(url) {
    const custMatch = url.match(/^\/customers\/([^/]+)$/);
    if (custMatch) { await deleteCustomer(custMatch[1]); return { data: { message: 'Customer deleted' } }; }
    const staffMatch = url.match(/^\/staff\/([^/]+)$/);
    if (staffMatch) {
      const data = await callAdminStaff({ action: 'delete', id: staffMatch[1] });
      return { data };
    }
    throw apiError(`Unhandled DELETE ${url}`);
  }
};

export default api;
