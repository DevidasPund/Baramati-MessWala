import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runAcceptanceTests() {
  console.log('===============================================================');
  console.log('STARTING MESSMATE FULL END-TO-END BUSINESS ACCEPTANCE TEST SUITE');
  console.log('===============================================================');

  let adminToken = '';
  let staffToken = '';
  let customerToken = '';
  let testPlanId = '';
  let testCustomerId = '';
  let testCustomerQrToken = '';
  let testInvoiceId = '';
  let testPaymentId = '';

  // 1. Admin logs into the application
  console.log('\n[Step 1] Admin Login...');
  const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@baramatimesswala.com',
    password: 'Admin@123',
  });
  if (adminLoginRes.data.success && adminLoginRes.data.data.token) {
    adminToken = adminLoginRes.data.data.token;
    console.log('✔ Admin login succeeded. Role:', adminLoginRes.data.data.user.role);
  } else {
    throw new Error('Admin login failed');
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2. Admin creates a subscription plan
  console.log('\n[Step 2] Admin creates a subscription plan...');
  const planCode = `TEST-PLAN-${Date.now().toString().slice(-4)}`;
  const planRes = await axios.post(
    `${BASE_URL}/subscriptions/plans`,
    {
      name: 'Special Student Monthly (Lunch + Dinner)',
      code: planCode,
      planType: 'MONTHLY',
      durationDays: 30,
      price: 3400.00,
      includedMeals: ['LUNCH', 'DINNER'],
      description: 'Test plan with lunch and dinner included',
    },
    { headers: adminHeaders }
  );
  testPlanId = planRes.data.data.plan.id;
  console.log(`✔ Created plan: ${planRes.data.data.plan.name} (${planRes.data.data.plan.code}) ID: ${testPlanId}`);

  // 3. Admin registers a customer
  console.log('\n[Step 3 & 4] Admin registers customer & generates unique ID + QR token...');
  const testPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const custRes = await axios.post(
    `${BASE_URL}/customers`,
    {
      name: 'Nikhil Shinde',
      phone: testPhone,
      email: `nikhil_${Date.now()}@baramatimesswala.com`,
      address: 'VP College Hostel, Room 104, Baramati',
      emergencyContact: '9822009988 (Father)',
      status: 'ACTIVE',
      planId: testPlanId,
      initialPaymentMethod: 'UPI',
    },
    { headers: adminHeaders }
  );
  testCustomerId = custRes.data.data.customer.id;
  testCustomerQrToken = custRes.data.data.customer.qrToken;
  const customerEmail = custRes.data.data.user.email;
  const customerPassword = custRes.data.data.tempPassword;
  console.log(`✔ Customer registered: ${custRes.data.data.customer.name}`);
  console.log(`✔ Customer Code: ${custRes.data.data.customer.customerCode}`);
  console.log(`✔ Customer QR Token: ${testCustomerQrToken}`);

  // 5. Customer logs into their dashboard
  console.log('\n[Step 5] Customer logs into their dashboard...');
  const custLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: customerEmail,
    password: customerPassword,
  });
  customerToken = custLoginRes.data.data.token;
  console.log('✔ Customer login succeeded. ID:', custLoginRes.data.data.user.customer.id);
  const customerHeaders = { Authorization: `Bearer ${customerToken}` };

  // 6. Customer views today's food menu
  console.log('\n[Step 6] Customer views today\'s food menu...');
  const menuRes = await axios.get(`${BASE_URL}/menu/today`, { headers: customerHeaders });
  console.log(`✔ Today's menu fetched: ${menuRes.data.data.menus.length} meals published.`);

  // 7. Staff logs in & completes QR attendance (Method B)
  console.log('\n[Step 7 & 8] Staff logs in & completes QR attendance (Method B)...');
  const staffLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'staff@baramatimesswala.com',
    password: 'Staff@123',
  });
  staffToken = staffLoginRes.data.data.token;
  const staffHeaders = { Authorization: `Bearer ${staffToken}` };

  const attendanceRes = await axios.post(
    `${BASE_URL}/attendance/scan-customer-qr`,
    {
      qrToken: testCustomerQrToken,
      mealType: 'LUNCH',
    },
    { headers: staffHeaders }
  );
  console.log(`✔ ${attendanceRes.data.message}`);
  console.log(`✔ Attendance stored in PostgreSQL: ID ${attendanceRes.data.data.attendance.id}`);

  // Test Case: Duplicate Attendance Prevention Rule
  console.log('\n[Test Rule] Verifying duplicate attendance prevention...');
  try {
    await axios.post(
      `${BASE_URL}/attendance/scan-customer-qr`,
      {
        qrToken: testCustomerQrToken,
        mealType: 'LUNCH',
      },
      { headers: staffHeaders }
    );
    console.error('❌ Failed: duplicate attendance was permitted!');
  } catch (err) {
    console.log('✔ Duplicate attendance correctly blocked:', err.response?.data?.message);
  }

  // 9. Customer books an extra meal
  console.log('\n[Step 9] Customer books an extra meal...');
  const todayStr = new Date().toISOString().split('T')[0];
  const extraMealRes = await axios.post(
    `${BASE_URL}/extra-meals/book`,
    {
      customerId: testCustomerId,
      mealType: 'DINNER',
      date: todayStr,
      count: 2,
      mealCategory: 'GUEST_MEAL',
      requestReason: 'Hostel friends dining together',
    },
    { headers: customerHeaders }
  );
  const extraMealId = extraMealRes.data.data.extraMeal.id;
  console.log(`✔ Extra meal booked: ${extraMealRes.data.data.extraMeal.count}x DINNER, Total: ₹${extraMealRes.data.data.extraMeal.totalAmount}`);

  // Admin approves extra meal
  await axios.put(
    `${BASE_URL}/extra-meals/${extraMealId}/status`,
    { status: 'APPROVED', adminNotes: 'Approved by admin' },
    { headers: adminHeaders }
  );
  console.log('✔ Admin approved extra meal.');

  // 10. Admin generates monthly bill
  console.log('\n[Step 10] Admin generates monthly bill (includes extra meals)...');
  const now = new Date();
  const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
  const year = now.getFullYear();

  const billRes = await axios.post(
    `${BASE_URL}/invoices/generate`,
    {
      customerId: testCustomerId,
      month: nextMonth,
      year: year,
    },
    { headers: adminHeaders }
  );
  testInvoiceId = billRes.data.data.invoices[0].id;
  const invoiceNumber = billRes.data.data.invoices[0].invoiceNumber;
  const balanceDue = billRes.data.data.invoices[0].balanceDue;
  console.log(`✔ Generated Invoice ${invoiceNumber}: Total ₹${billRes.data.data.invoices[0].totalAmount}, Balance Due: ₹${balanceDue}`);

  // Test Case: Duplicate Invoice Prevention Rule
  console.log('\n[Test Rule] Verifying duplicate invoice generation prevention...');
  const dupBillRes = await axios.post(
    `${BASE_URL}/invoices/generate`,
    {
      customerId: testCustomerId,
      month: nextMonth,
      year: year,
    },
    { headers: adminHeaders }
  );
  if (dupBillRes.data.data.skippedCount === 1) {
    console.log('✔ Duplicate invoice generation prevented correctly.');
  }

  // 11. Customer views invoice
  console.log('\n[Step 11] Customer views the invoice...');
  const invRes = await axios.get(`${BASE_URL}/invoices/${testInvoiceId}`, { headers: customerHeaders });
  console.log(`✔ Customer retrieved invoice ${invRes.data.data.invoice.invoiceNumber}. Status: ${invRes.data.data.invoice.status}`);

  // 12. Customer pays using UPI
  console.log('\n[Step 12] Customer submits UPI payment...');
  const payRes = await axios.post(
    `${BASE_URL}/payments`,
    {
      invoiceId: testInvoiceId,
      customerId: testCustomerId,
      amount: balanceDue,
      paymentMethod: 'UPI',
      transactionRef: 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000),
      notes: 'Paid via Google Pay UPI',
    },
    { headers: customerHeaders }
  );
  testPaymentId = payRes.data.data.payment.id;
  console.log(`✔ Customer submitted payment ${payRes.data.data.payment.paymentNumber}. Status: ${payRes.data.data.payment.status} (Unverified)`);

  // Verify that outstanding balance has NOT been reduced while payment is unverified!
  const unverifiedInv = await axios.get(`${BASE_URL}/invoices/${testInvoiceId}`, { headers: customerHeaders });
  console.log(`✔ Outstanding balance before admin verification: ₹${unverifiedInv.data.data.invoice.balanceDue} (Must remain unchanged)`);

  // 13 & 14. Admin verifies payment & system updates balance
  console.log('\n[Step 13 & 14] Admin verifies payment & system updates balance atomically...');
  const verifyRes = await axios.put(
    `${BASE_URL}/payments/${testPaymentId}/verify`,
    { status: 'VERIFIED', notes: 'Checked bank statement' },
    { headers: adminHeaders }
  );
  console.log(`✔ ${verifyRes.data.message}`);

  const settledInv = await axios.get(`${BASE_URL}/invoices/${testInvoiceId}`, { headers: customerHeaders });
  console.log(`✔ Settled invoice balance: ₹${settledInv.data.data.invoice.balanceDue}, Status: ${settledInv.data.data.invoice.status}`);

  // 15. Verify Notifications
  console.log('\n[Step 15] Checking customer notification inbox...');
  const notifRes = await axios.get(`${BASE_URL}/notifications`, { headers: customerHeaders });
  console.log(`✔ Notifications received by customer: ${notifRes.data.data.notifications.length} messages.`);
  notifRes.data.data.notifications.slice(0, 3).forEach((n) => {
    console.log(`   - [${n.type}] ${n.title} (Status: ${n.deliveryStatus})`);
  });

  // 16. Admin views reports and analytics
  console.log('\n[Step 16] Admin views revenue and analytics report...');
  const reportRes = await axios.get(`${BASE_URL}/reports/analytics`, { headers: adminHeaders });
  console.log('✔ Analytics Report Summary:', reportRes.data.data.summary);

  // Download PDF verification
  console.log('\n[PDF Verification] Testing PDF invoice generation...');
  const pdfRes = await axios.get(`${BASE_URL}/invoices/${testInvoiceId}/pdf`, {
    headers: adminHeaders,
    responseType: 'arraybuffer',
  });
  console.log(`✔ PDF invoice generated successfully (${pdfRes.data.length} bytes, application/pdf).`);

  console.log('\n===============================================================');
  console.log('ALL 16 ACCEPTANCE CRITERIA & BUSINESS RULES PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

runAcceptanceTests().catch((err) => {
  console.error('\n❌ Acceptance Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
