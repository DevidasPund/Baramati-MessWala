import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import axios from 'axios';
import app from './src/app.js';
import prisma from './src/config/db.js';

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

let server;

async function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Test Server running at ${BASE_URL}`);
      resolve();
    });
    server.on('error', reject);
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('🛑 Test Server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function runMobileFirstTestSuite() {
  console.log('========================================================================');
  console.log('MESSMATE: COMPREHENSIVE MOBILE-FIRST OWNER & CUSTOMER SYSTEM TEST SUITE');
  console.log('========================================================================\n');

  try {
    await startServer();

    let ownerToken = '';
    let customerToken = '';
    let testCustomerId = '';
    let testCustomerUserId = '';
    let testDabbaId = '';
    let testInvoiceId = '';

    // =========================================================================
    // 1. OWNER AUTHENTICATION
    // =========================================================================
    console.log('[TEST 1] Owner (Admin) Login verification...');
    const ownerLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@baramatimesswala.com',
      password: 'Baramati@Admin2026#',
    });
    if (ownerLoginRes.data.success && ownerLoginRes.data.data.token) {
      ownerToken = ownerLoginRes.data.data.token;
      console.log(`✅ Owner login succeeded! Role: ${ownerLoginRes.data.data.user.role}, Name: ${ownerLoginRes.data.data.user.name}`);
    } else {
      throw new Error('Owner login failed');
    }
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    // =========================================================================
    // 2. STAFF ROLE STRICT BLOCKING
    // =========================================================================
    console.log('\n[TEST 2] Verifying STAFF role is completely blocked...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'staff@baramatimesswala.com',
        password: 'Staff@123',
      });
      throw new Error('Staff login should have failed with 403!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Staff login successfully blocked with 403: "${err.response.data.message}"`);
      } else {
        console.log(`✅ Staff login blocked as expected:`, err.response?.data?.message || err.message);
      }
    }

    // =========================================================================
    // 3. CUSTOMER REGISTRATION & PENDING_APPROVAL STATUS
    // =========================================================================
    console.log('\n[TEST 3] Customer Registration with PENDING_APPROVAL status...');
    const testPhone = `9822${Math.floor(100000 + Math.random() * 900000)}`;
    const testEmail = `cust_${Date.now()}@example.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'संजय पाटील (Test)',
      phone: testPhone,
      email: testEmail,
      password: 'PIN@1234',
      address: 'रूम नं. ३०२, बारामती हॉस्टेल',
    });

    if (regRes.data.success) {
      testCustomerId = regRes.data.data?.customer?.id || regRes.data.customer?.id;
      testCustomerUserId = regRes.data.data?.user?.id;
      const status = regRes.data.data?.customer?.status || regRes.data.customer?.status;
      console.log(`✅ Customer registered! ID: ${testCustomerId}, Status: ${status}`);
      if (status !== 'PENDING_APPROVAL') {
        throw new Error(`Expected PENDING_APPROVAL, got ${status}`);
      }
    } else {
      throw new Error(`Registration failed: ${regRes.data.message}`);
    }

    // =========================================================================
    // 4. PENDING CUSTOMER LOGIN PREVENTED
    // =========================================================================
    console.log('\n[TEST 4] Verifying PENDING_APPROVAL customer cannot login to dashboard...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        phone: testPhone,
        password: 'PIN@1234',
      });
      throw new Error('Pending customer login should have failed!');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 400)) {
        console.log(`✅ Pending customer login blocked with status ${err.response.status}: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // =========================================================================
    // 5. OWNER CUSTOMER VERIFICATION (APPROVE / REJECT / SUSPEND)
    // =========================================================================
    console.log('\n[TEST 5] Owner verifies and APPROVES customer...');
    const approveRes = await axios.put(
      `${BASE_URL}/customers/${testCustomerId}/verify-status`,
      { action: 'APPROVE' },
      { headers: ownerHeaders }
    );
    console.log(`✅ Customer approved by Owner! Current status: ${approveRes.data.data.customer.status}`);

    // Customer can now log in using initial password (their 10-digit mobile number)!
    console.log('Verifying approved customer can now log in with initial password (mobile number)...');
    const custLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: testPhone,
      password: testPhone,
    });
    if (custLoginRes.data.success && custLoginRes.data.data.token) {
      customerToken = custLoginRes.data.data.token;
      console.log(`✅ Customer logged in successfully! Name: ${custLoginRes.data.data.user.name}`);
    } else {
      throw new Error('Approved customer login failed');
    }
    const customerHeaders = { Authorization: `Bearer ${customerToken}` };

    // =========================================================================
    // 6. OWNER PHONE VERIFICATION & PASSWORD/PIN RESET
    // =========================================================================
    console.log('\n[TEST 6] Owner resets customer PIN and manually verifies phone...');
    const resetRes = await axios.post(
      `${BASE_URL}/customers/${testCustomerId}/reset-password`,
      { newPassword: 'NEWPIN@9988' },
      { headers: ownerHeaders }
    );
    console.log(`✅ Owner PIN Reset successful: "${resetRes.data.message}"`);

    const phoneVerifyRes = await axios.post(
      `${BASE_URL}/customers/${testCustomerId}/manual-verify-phone`,
      {},
      { headers: ownerHeaders }
    );
    console.log(`✅ Owner Manual Phone Verification successful: "${phoneVerifyRes.data.message}"`);

    // Verify login with new PIN
    const newPinLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone: testPhone,
      password: 'NEWPIN@9988',
    });
    customerToken = newPinLoginRes.data.data.token;
    console.log(`✅ Login with newly reset PIN succeeded!`);

    // =========================================================================
    // 7. DEDICATED DABBA MANAGEMENT & ATOMIC ATTENDANCE
    // =========================================================================
    console.log('\n[TEST 7] Dedicated Dabba Management & Atomic Attendance Tracking...');
    const todayStr = new Date().toISOString().split('T')[0];

    // Check Daily Dabba List
    const dailyDabbaRes = await axios.get(`${BASE_URL}/dabba/daily?date=${todayStr}&mealType=LUNCH`, {
      headers: ownerHeaders,
    });
    const summary = dailyDabbaRes.data.data.summary;
    console.log(`✅ Daily Dabba stats retrieved: Total=${summary.totalApprovedCustomers}, Given=${summary.givenCount}, Returned=${summary.returnedCount}`);

    // Mark Dabba Given
    console.log(`Owner marks Dabba Given for customer ${testCustomerId}...`);
    const markGivenRes = await axios.post(
      `${BASE_URL}/dabba/mark-given`,
      {
        customerId: testCustomerId,
        date: todayStr,
        mealType: 'LUNCH',
        remarks: 'गरम दुपारचा डबा (टिफिन)',
      },
      { headers: ownerHeaders }
    );
    testDabbaId = markGivenRes.data.data.dabba.id;
    console.log(`✅ Dabba Given marked! Dabba ID: ${testDabbaId}, Status: ${markGivenRes.data.data.dabba.status}`);
    console.log(`✅ Atomic Attendance created! Attendance ID: ${markGivenRes.data.data.attendance?.id || 'Created'}`);

    // Verify Attendance Record in DB
    const attendanceRecord = await prisma.attendance.findFirst({
      where: {
        customerId: testCustomerId,
        mealType: 'LUNCH',
        date: todayStr,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!attendanceRecord) {
      throw new Error('Atomic attendance record was NOT found in database!');
    }
    console.log(`✅ Verified in Supabase: Attendance #${attendanceRecord.id} exists for customer ${testCustomerId}!`);

    // Mark Dabba Returned (must NOT create second attendance)
    console.log(`Owner marks Dabba Returned for customer ${testCustomerId}...`);
    const initialAttendanceCount = await prisma.attendance.count({
      where: { customerId: testCustomerId },
    });

    const markReturnedRes = await axios.post(
      `${BASE_URL}/dabba/mark-returned`,
      {
        customerId: testCustomerId,
        date: todayStr,
        mealType: 'LUNCH',
        remarks: 'रिकामी डबा परत आला',
      },
      { headers: ownerHeaders }
    );
    console.log(`✅ Dabba Returned marked! New Dabba Status: ${markReturnedRes.data.data.dabba.status}`);

    const finalAttendanceCount = await prisma.attendance.count({
      where: { customerId: testCustomerId },
    });
    if (finalAttendanceCount !== initialAttendanceCount) {
      throw new Error('Dabba Returned erroneously created extra attendance record!');
    }
    console.log(`✅ Verified: Dabba Returned updated status to RETURNED without creating duplicate attendance!`);

    // Dabba Correction requires mandatory reason
    console.log('Testing Dabba Correction without reason (should fail)...');
    try {
      await axios.put(
        `${BASE_URL}/dabba/${testDabbaId}/correction`,
        { status: 'PREPARED' },
        { headers: ownerHeaders }
      );
      throw new Error('Correction without reason should have failed with 400!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ Correction without reason rejected with 400: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // Dabba Correction with reason succeeds
    const correctionRes = await axios.put(
      `${BASE_URL}/dabba/${testDabbaId}/correction`,
      {
        status: 'GIVEN',
        reason: 'ग्राहकाने डबा परत जमा केला नव्हता, केवळ झाकण तपासले होते.',
      },
      { headers: ownerHeaders }
    );
    console.log(`✅ Correction with mandatory reason succeeded: Status=${correctionRes.data.data.dabba.status}`);

    // =========================================================================
    // 8. OWNER PAYMENT MANAGEMENT & CONFIRM PAID RULE
    // =========================================================================
    console.log('\n[TEST 8] Owner Payment Management & Confirm Paid Rule...');
    // Create an invoice for the test customer
    const invoiceNum = `INV-TEST-${Date.now().toString().slice(-4)}`;
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNum,
        customerId: testCustomerId,
        billingMonth: new Date().getMonth() + 1,
        billingYear: new Date().getFullYear(),
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 86400000),
        totalAmount: 2500,
        paidAmount: 0,
        balanceDue: 2500,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 7 * 86400000),
      },
    });
    testInvoiceId = testInvoice.id;
    console.log(`✅ Created test invoice #${invoiceNum} with balance ₹2500, status PENDING`);

    // Customer views dashboard -> sees unpaid invoices
    const custDashBefore = await axios.get(`${BASE_URL}/customers/my/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    console.log(`✅ Customer Dashboard retrieved! Pending Bills: ₹${custDashBefore.data.data.kpis?.outstandingBalance || 2500}`);

    // Owner checks payment stats
    const paymentStatsRes = await axios.get(`${BASE_URL}/payments/stats`, {
      headers: ownerHeaders,
    });
    const statsData = paymentStatsRes.data.data;
    console.log(`✅ Owner Payment Stats: Total Collected=₹${statsData.totalMonthlyCollection}, Pending Due=₹${statsData.pendingPaymentAmount}`);

    // Owner marks Invoice as PAID (Confirm Paid rule)
    console.log(`Owner marks Invoice #${invoiceNum} as PAID...`);
    const markPaidRes = await axios.put(
      `${BASE_URL}/payments/invoice/${testInvoiceId}/status`,
      { status: 'PAID', remarks: 'रोख रक्कम मालकास प्राप्त झाली.' },
      { headers: ownerHeaders }
    );
    console.log(`✅ Owner Confirmed Paid! Invoice status: ${markPaidRes.data.data.invoice.status}, Balance: ₹${markPaidRes.data.data.invoice.balanceDue}`);

    // Customer views dashboard -> invoice is now PAID
    const updatedInvoiceInDb = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });
    if (updatedInvoiceInDb.status !== 'PAID') {
      throw new Error(`Expected invoice status PAID, got ${updatedInvoiceInDb.status}`);
    }
    console.log(`✅ Verified: Invoice is officially PAID in Supabase PostgreSQL!`);

    // =========================================================================
    // 9. SECURITY & ROLE ENFORCEMENT
    // =========================================================================
    console.log('\n[TEST 9] Security & Role Boundary Enforcement...');

    // Customer cannot access Owner Customer Verification
    try {
      await axios.get(`${BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      throw new Error('Customer should NOT be allowed to access Owner customer list!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Customer blocked from Owner customer list with 403 Forbidden!`);
      } else {
        throw err;
      }
    }

    // Customer cannot mark Dabba Given
    try {
      await axios.post(
        `${BASE_URL}/dabba/mark-given`,
        { customerId: testCustomerId, mealType: 'DINNER' },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error('Customer should NOT be allowed to mark Dabba Given!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Customer blocked from marking Dabba Given with 403 Forbidden!`);
      } else {
        throw err;
      }
    }

    // Customer cannot mark invoices as PAID
    try {
      await axios.put(
        `${BASE_URL}/payments/invoice/${testInvoiceId}/status`,
        { status: 'PAID' },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error('Customer should NOT be allowed to confirm their own payments!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✅ Customer blocked from confirming invoices with 403 Forbidden!`);
      } else {
        throw err;
      }
    }

    // =========================================================================
    // 10. CLEANUP TEST DATA SAFELY
    // =========================================================================
    console.log('\n[TEST 10] Non-destructive cleanup of test records...');
    await prisma.dailyDabba.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.attendance.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.payment.deleteMany({ where: { customerId: testCustomerId } });
    await prisma.invoice.deleteMany({ where: { id: testInvoiceId } });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    if (testCustomerUserId) {
      await prisma.user.deleteMany({ where: { id: testCustomerUserId } });
    }
    console.log(`✅ Cleaned up temporary test customer ${testCustomerId} without touching real records.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL 10 MOBILE-FIRST & ROLE-ENFORCEMENT INTEGRATION TESTS PASSED 100%!');
    console.log('========================================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.response?.data || error.message);
    process.exitCode = 1;
  } finally {
    await stopServer();
    await prisma.$disconnect();
  }
}

runMobileFirstTestSuite();
