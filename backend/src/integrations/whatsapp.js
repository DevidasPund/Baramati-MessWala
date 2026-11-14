import axios from 'axios';
import prisma from '../config/db.js';

export class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.isEnabled = process.env.WHATSAPP_ENABLED === 'true' && Boolean(this.accessToken) && Boolean(this.phoneNumberId);
  }

  // Format message text based on template and data
  static formatMessage(templateType, data) {
    const messName = 'Baramati Messwala';
    switch (templateType) {
      case 'WELCOME':
        return `🎉 Welcome to *${messName}*, ${data.customerName}!\n\nYour registration is complete. Your Customer ID is: *${data.customerCode}*.\nManage your meals, view your daily menu and scan your attendance directly on MessMate portal.\n\nHelpline: +91 9822334455\n"Manage Your Mess, The Smart Way!"`;

      case 'SUBSCRIPTION_ACTIVATION':
        return `✅ *Subscription Activated!* - ${messName}\n\nHello ${data.customerName}, your subscription *${data.planName}* is now ACTIVE.\n\n📅 Valid From: ${data.startDate} to ${data.endDate}\n💰 Amount: ₹${data.amount}\n🍲 Included Meals: ${data.includedMeals?.join(', ')}\n\nBon Appétit!`;

      case 'EXPIRY_REMINDER':
        return `⚠️ *Subscription Expiry Reminder* - ${messName}\n\nDear ${data.customerName}, your subscription (*${data.planName}*) will expire on *${data.endDate}* (${data.daysLeft} days remaining).\n\nPlease renew in advance through the customer portal to enjoy uninterrupted delicious meals.`;

      case 'RENEWAL_REMINDER':
        return `🔄 *Subscription Renewal Notice* - ${messName}\n\nHi ${data.customerName}, your mess subscription expires tomorrow! Renew today to keep enjoying fresh home-style meals.\nLogin: http://localhost:5173/login`;

      case 'BILL_GENERATED':
        return `📄 *Monthly Bill Generated* - ${messName}\n\nDear ${data.customerName}, your bill for ${data.monthYear} has been generated.\n\nInvoice No: *${data.invoiceNumber}*\nSubscription: ₹${data.subscriptionAmount}\nExtra Meals: ₹${data.extraMealAmount || 0}\nTotal Payable: *₹${data.totalAmount}*\nDue Date: ${data.dueDate}\n\nPlease pay via UPI or Cash.`;

      case 'PAYMENT_REMINDER':
        return `🔔 *Payment Reminder* - ${messName}\n\nDear ${data.customerName}, you have an outstanding balance of *₹${data.balanceDue}* for Invoice *${data.invoiceNumber}*.\nPlease clear your dues at the earliest.`;

      case 'PAYMENT_CONFIRMATION':
        return `💳 *Payment Verified & Received!* - ${messName}\n\nDear ${data.customerName}, we have received your payment of *₹${data.amount}* for Invoice *${data.invoiceNumber}* via ${data.method}.\n\nReceipt/Payment No: *${data.paymentNumber}*\nStatus: CONFIRMED. Thank you!`;

      case 'EXTRA_MEAL_CONFIRMATION':
        return `🍛 *Extra Meal Confirmed* - ${messName}\n\nHello ${data.customerName}, your request for *${data.count}x ${data.mealType}* on ${data.date} has been confirmed.\nCharge: ₹${data.totalAmount} (will be added to your monthly bill).`;

      case 'ANNOUNCEMENT':
        return `📢 *Important Notice* - ${messName}\n\n${data.announcementTitle}\n\n${data.message}\n\n- Baramati Messwala Management`;

      case 'MENU_UPDATE':
        return `🍽️ *Today's Special Menu* - ${messName}\n\n${data.mealType}: *${data.title}*\nDishes: ${Array.isArray(data.items) ? data.items.join(', ') : data.items}\n\nEnjoy hot & fresh meals at Baramati Messwala!`;

      default:
        return data.message || `Notification from ${messName}`;
    }
  }

  // Send WhatsApp or Mock Notification and log to database
  async sendNotification({
    customerId,
    phone,
    templateType,
    data,
    channel = 'BOTH',
  }) {
    const messageText = WhatsAppService.formatMessage(templateType, data);
    let deliveryStatus = 'MOCKED';
    let whatsappMessageId = null;

    if (this.isEnabled && phone) {
      try {
        // Clean phone number: international standard (e.g. 919876543210)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        };

        const res = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        if (res.data?.messages?.[0]?.id) {
          whatsappMessageId = res.data.messages[0].id;
          deliveryStatus = 'SENT';
          console.log(`[WhatsApp API LIVE] Message sent to ${formattedPhone}: ID ${whatsappMessageId}`);
        }
      } catch (error) {
        console.error('[WhatsApp API LIVE Error]:', error.response?.data || error.message);
        deliveryStatus = 'FAILED';
      }
    } else {
      // Mock notification provider for development/testing
      deliveryStatus = 'MOCKED';
      console.log(`[MOCK WhatsApp Provider] Recipient: ${phone || 'Unknown'} | Template: ${templateType}`);
      console.log(`[MOCK Message Body]:\n${messageText}\n----------------------------------`);
    }

    // Always record Notification record in PostgreSQL for customer dashboard & audit
    try {
      const notification = await prisma.notification.create({
        data: {
          customerId,
          title: data.title || templateType.replace(/_/g, ' '),
          message: messageText,
          type: templateType,
          channel: channel,
          deliveryStatus: deliveryStatus,
          whatsappMessageId: whatsappMessageId,
          metadata: data,
        },
      });
      return notification;
    } catch (err) {
      console.error('Error saving notification record:', err);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
