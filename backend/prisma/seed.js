import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Baramati Messwala database...');

  // 1. Business Settings
  const settings = await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'Baramati Messwala',
      tagline: 'Manage Your Mess, The Smart Way!',
      developerName: 'Devidas Pund',
      phone: '+91 9822334455',
      email: 'contact@baramatimesswala.com',
      address: 'Shop No. 4, College Corner, Vidyanagari, Baramati, Maharashtra 413133',
      googleMapsUrl: 'https://maps.google.com/?q=Baramati+Messwala+Vidyanagari',
      upiId: 'baramatimesswala@upi',
      upiPayeeName: 'Baramati Messwala',
      breakfastStartTime: '07:30',
      breakfastEndTime: '10:00',
      lunchStartTime: '12:00',
      lunchEndTime: '15:00',
      dinnerStartTime: '19:30',
      dinnerEndTime: '22:30',
      extraBreakfastPrice: 40.00,
      extraLunchPrice: 90.00,
      extraDinnerPrice: 90.00,
      guestMealPrice: 110.00,
      expiryReminderDays: '7,3,1',
      whatsappEnabled: false,
    },
  });
  console.log('✔ Business Settings created.');

  // 2. Subscription Plans
  const plansData = [
    {
      name: 'Full Day Monthly (Lunch + Dinner)',
      code: 'M-FULL-2MEAL',
      planType: 'MONTHLY',
      durationDays: 30,
      price: 3200.00,
      includedMeals: ['LUNCH', 'DINNER'],
      description: 'Daily unlimited delicious Lunch and Dinner with weekly Sunday feast.',
    },
    {
      name: 'All Three Meals Monthly (Breakfast + Lunch + Dinner)',
      code: 'M-ALL-3MEAL',
      planType: 'MONTHLY',
      durationDays: 30,
      price: 4200.00,
      includedMeals: ['BREAKFAST', 'LUNCH', 'DINNER'],
      description: 'Complete nutritional cover: Healthy breakfast with tea, wholesome lunch and dinner.',
    },
    {
      name: 'Lunch Only Monthly',
      code: 'M-LUNCH-ONLY',
      planType: 'MONTHLY',
      durationDays: 30,
      price: 1800.00,
      includedMeals: ['LUNCH'],
      description: 'Ideal for college students and working professionals for midday meals.',
    },
    {
      name: 'Dinner Only Monthly',
      code: 'M-DINNER-ONLY',
      planType: 'MONTHLY',
      durationDays: 30,
      price: 1800.00,
      includedMeals: ['DINNER'],
      description: 'Fresh, warm home-style dinner every evening.',
    },
    {
      name: 'Weekly Trial Pack (Lunch + Dinner)',
      code: 'W-TRIAL-2MEAL',
      planType: 'WEEKLY',
      durationDays: 7,
      price: 850.00,
      includedMeals: ['LUNCH', 'DINNER'],
      description: '7-day trial to experience Baramati Messwala taste and hygiene.',
    },
  ];

  const createdPlans = [];
  for (const p of plansData) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    createdPlans.push(plan);
  }
  console.log(`✔ Created ${createdPlans.length} subscription plans.`);

  // 3. Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@baramatimesswala.com' },
    update: {},
    create: {
      email: 'admin@baramatimesswala.com',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✔ Super Admin created: admin@baramatimesswala.com / Admin@123');

  // 4. Staff User
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@baramatimesswala.com' },
    update: {},
    create: {
      email: 'staff@baramatimesswala.com',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      isActive: true,
      staff: {
        create: {
          staffCode: 'STAFF-001',
          name: 'Ramesh Shinde',
          phone: '9876543211',
          email: 'staff@baramatimesswala.com',
          designation: 'Floor Manager & Attendance Incharge',
          role: 'STAFF',
          permissions: ['scan_attendance', 'view_menu', 'customer_search', 'mark_attendance'],
        },
      },
    },
    include: { staff: true },
  });
  console.log('✔ Staff Member created: staff@baramatimesswala.com / Staff@123');

  // 5. Customers
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
  const customersData = [
    {
      email: 'customer@baramatimesswala.com',
      name: 'Amit Patil',
      phone: '9876543212',
      customerCode: 'BMW-2026-001',
      address: 'Hostel No. 2, Room 204, VP College, Baramati',
      emergencyContact: '9876543200 (Father)',
      status: 'ACTIVE',
      planIndex: 0, // M-FULL-2MEAL
    },
    {
      email: 'rohit@baramatimesswala.com',
      name: 'Rohit Deshmukh',
      phone: '9876543213',
      customerCode: 'BMW-2026-002',
      address: 'Flat 301, Sai Plaza, Vidyanagari, Baramati',
      emergencyContact: '9876543201 (Brother)',
      status: 'ACTIVE',
      planIndex: 1, // M-ALL-3MEAL
    },
    {
      email: 'swapnil@baramatimesswala.com',
      name: 'Swapnil Jadhav',
      phone: '9876543214',
      customerCode: 'BMW-2026-003',
      address: 'Surya Residency, Room 12, Baramati',
      emergencyContact: '9876543202 (Uncle)',
      status: 'PAUSED',
      planIndex: 0,
    },
    {
      email: 'priya@baramatimesswala.com',
      name: 'Priya Kulkarni',
      phone: '9876543215',
      customerCode: 'BMW-2026-004',
      address: 'Girls Hostel, Vidyanagari, Baramati',
      emergencyContact: '9876543203 (Mother)',
      status: 'ACTIVE',
      planIndex: 2, // Lunch only
    },
  ];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const c of customersData) {
    const qrToken = 'bmw_qr_' + crypto.randomBytes(16).toString('hex');
    let user = await prisma.user.findUnique({ where: { email: c.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: c.email,
          passwordHash: customerPasswordHash,
          role: 'CUSTOMER',
          isActive: true,
          customer: {
            create: {
              customerCode: c.customerCode,
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.address,
              emergencyContact: c.emergencyContact,
              status: c.status,
              qrToken: qrToken,
              notes: 'Regular student subscriber',
            },
          },
        },
        include: { customer: true },
      });

      const customer = user.customer;
      const selectedPlan = createdPlans[c.planIndex];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10); // started 10 days ago
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + selectedPlan.durationDays);

      // Create Active Subscription
      const sub = await prisma.subscription.create({
        data: {
          customerId: customer.id,
          planId: selectedPlan.id,
          startDate: startDate,
          endDate: endDate,
          amount: selectedPlan.price,
          paidAmount: selectedPlan.price,
          status: c.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE',
          pausedAt: c.status === 'PAUSED' ? new Date() : null,
        },
      });

      // Create Current Month Invoice
      const invMonth = now.getMonth() + 1;
      const invYear = now.getFullYear();
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${invYear}-${customer.customerCode.replace('BMW-', '')}`,
          customerId: customer.id,
          subscriptionId: sub.id,
          billingMonth: invMonth,
          billingYear: invYear,
          periodStart: startDate,
          periodEnd: endDate,
          subscriptionAmount: selectedPlan.price,
          totalAmount: selectedPlan.price,
          paidAmount: selectedPlan.price,
          balanceDue: 0.00,
          status: 'PAID',
          isApprovedByAdmin: true,
          approvedAt: new Date(),
          dueDate: new Date(startDate.getTime() + 5 * 24 * 3600 * 1000),
          items: {
            create: [
              {
                description: `${selectedPlan.name} Subscription (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
                itemType: 'SUBSCRIPTION',
                quantity: 1,
                unitPrice: selectedPlan.price,
                amount: selectedPlan.price,
                date: startDate,
              },
            ],
          },
        },
      });

      // Create Payment
      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-${invYear}-${customer.customerCode.replace('BMW-', '')}`,
          invoiceId: invoice.id,
          customerId: customer.id,
          amount: selectedPlan.price,
          paymentMethod: 'UPI',
          transactionRef: 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000),
          status: 'VERIFIED',
          verifiedAt: new Date(),
          notes: 'Initial subscription payment via Google Pay',
        },
      });

      // Sample attendance for past 5 days
      if (c.status === 'ACTIVE') {
        for (let d = 5; d >= 0; d--) {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - d);
          const dateStr = pastDate.toISOString().split('T')[0];

          if (selectedPlan.includedMeals.includes('LUNCH')) {
            try {
              await prisma.attendance.create({
                data: {
                  customerId: customer.id,
                  mealType: 'LUNCH',
                  date: dateStr,
                  method: 'STAFF_SCANS_CUSTOMER',
                  scannedById: staffUser.staff?.id,
                  isVerified: true,
                },
              });
            } catch (err) {}
          }

          if (selectedPlan.includedMeals.includes('DINNER') && d > 0) {
            try {
              await prisma.attendance.create({
                data: {
                  customerId: customer.id,
                  mealType: 'DINNER',
                  date: dateStr,
                  method: 'CUSTOMER_SCANS_MESS',
                  isVerified: true,
                },
              });
            } catch (err) {}
          }
        }
      }
    }
  }
  console.log('✔ Sample customers, subscriptions, invoices, and attendance created.');

  // 6. Food Menus for Today and the Week
  const daysOffset = [-1, 0, 1, 2, 3, 4, 5];
  const sampleMenus = [
    {
      mealType: 'BREAKFAST',
      title: 'Poha & Hot Masala Chai',
      items: ['Kanda Poha with Sev & Coconut', 'Spicy Tarri', 'Roasted Peanuts', 'Hot Special Masala Chai'],
      description: 'Authentic Maharashtrian breakfast freshly prepared with hand-pounded spices.',
      isSpecial: false,
    },
    {
      mealType: 'LUNCH',
      title: 'Special Maharashtrian Thali',
      items: ['Paneer Kolhapuri', 'Bhendi Fry', 'Chapati (4 pcs) or Jowar Bhakri', 'Amti / Dal Tadka', 'Indrayani Steamed Rice', 'Papad & Pickle', 'Gulab Jamun (1 pc)'],
      description: 'Wholesome royal meal made with pure ghee and farm-fresh local vegetables.',
      isSpecial: true,
      specialNote: 'Special Sunday Sweet Included!',
    },
    {
      mealType: 'DINNER',
      title: 'Sev Bhaji & Fresh Chapati Dinner',
      items: ['Khandeshi Sev Bhaji', 'Aloo Methi Sukhi', 'Phulke / Chapati (4 pcs)', 'Jeera Rice', 'Moong Dal Fry', 'Kachumber Salad', 'Buttermilk / Taak'],
      description: 'Light, comforting and nutritious dinner for perfect digestion and sound sleep.',
      isSpecial: false,
    },
  ];

  for (const offset of daysOffset) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    const dateStr = targetDate.toISOString().split('T')[0];

    for (const menu of sampleMenus) {
      await prisma.foodMenu.upsert({
        where: {
          unique_date_meal_menu: {
            date: dateStr,
            mealType: menu.mealType,
          },
        },
        update: {},
        create: {
          date: dateStr,
          mealType: menu.mealType,
          title: menu.title,
          items: menu.items,
          description: menu.description,
          isSpecial: offset === 0 ? menu.isSpecial : false,
          specialNote: offset === 0 ? menu.specialNote : null,
          isPublished: true,
        },
      });
    }
  }
  console.log('✔ Weekly food menu scheduled & published.');

  // 7. Sample Feedback & Complaints
  const firstCustomer = await prisma.customer.findFirst({ where: { customerCode: 'BMW-2026-001' } });
  if (firstCustomer) {
    await prisma.feedback.create({
      data: {
        customerId: firstCustomer.id,
        rating: 5,
        foodQualityRating: 5,
        hygieneRating: 5,
        serviceRating: 5,
        comments: 'Food taste is exceptionally good, feels just like home-cooked food in Baramati!',
        mealDate: todayStr,
        mealType: 'LUNCH',
      },
    });

    await prisma.complaint.upsert({
      where: { complaintNumber: 'CMP-2026-0001' },
      update: {},
      create: {
        complaintNumber: 'CMP-2026-0001',
        customerId: firstCustomer.id,
        subject: 'Request for slightly less spicy dinner',
        description: 'The sev bhaji was a bit spicy yesterday evening. Would appreciate medium spice.',
        category: 'FOOD_QUALITY',
        status: 'RESOLVED',
        adminResponse: 'Noted! We have instructed our chef to keep dinner spices moderate for student comfort.',
        resolvedAt: new Date(),
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
