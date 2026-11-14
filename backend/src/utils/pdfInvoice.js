import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice, customer, items = [], settings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const primaryColor = '#059669'; // Emerald 600
      const secondaryColor = '#0f172a'; // Slate 900
      const mutedColor = '#64748b'; // Slate 500

      // Header Banner
      doc.rect(0, 0, doc.page.width, 12).fill(primaryColor);

      // Business Info (Left Header)
      doc.fillColor(secondaryColor).fontSize(20).font('Helvetica-Bold').text(settings.businessName || 'BARAMATI MESSWALA', 40, 30);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Oblique').text(settings.tagline || 'Manage Your Mess, The Smart Way!', 40, 54);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text(settings.address || 'College Corner, Vidyanagari, Baramati', 40, 68)
        .text(`Phone: ${settings.phone || '+91 9822334455'} | Email: ${settings.email || 'contact@baramatimesswala.com'}`, 40, 80);

      // Invoice Details (Right Header)
      doc.fillColor(secondaryColor).fontSize(16).font('Helvetica-Bold').text('INVOICE', 400, 30, { align: 'right' });
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 52, { align: 'right' })
        .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 66, { align: 'right' })
        .text(`Status: ${invoice.status}`, 400, 80, { align: 'right' });

      doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e2e8f0').stroke();

      // Bill To & Billing Period
      doc.rect(40, 110, 250, 75).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('BILLED TO:', 50, 118);
      doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text(customer.name, 50, 132);
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
        .text(`Customer ID: ${customer.customerCode}`, 50, 147)
        .text(`Phone: ${customer.phone}`, 50, 160);

      doc.rect(305, 110, 250, 75).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('BILLING PERIOD & DUE DATE:', 315, 118);
      doc.fillColor(secondaryColor).fontSize(10).font('Helvetica')
        .text(`Period: ${new Date(invoice.periodStart).toLocaleDateString()} to ${new Date(invoice.periodEnd).toLocaleDateString()}`, 315, 132)
        .text(`Billing Month: ${invoice.billingMonth}/${invoice.billingYear}`, 315, 147)
        .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 315, 160);

      // Line items table
      let y = 205;
      doc.rect(40, y, 515, 24).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text('Description', 50, y + 7)
        .text('Qty', 350, y + 7, { width: 40, align: 'center' })
        .text('Rate', 400, y + 7, { width: 60, align: 'right' })
        .text('Amount (₹)', 470, y + 7, { width: 75, align: 'right' });

      y += 24;

      const lineItems = items.length > 0 ? items : [
        {
          description: `Mess Subscription (${invoice.billingMonth}/${invoice.billingYear})`,
          quantity: 1,
          unitPrice: invoice.subscriptionAmount,
          amount: invoice.subscriptionAmount,
        },
      ];

      doc.font('Helvetica').fontSize(9);
      lineItems.forEach((item, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 22).fill(bg);
        doc.fillColor(secondaryColor)
          .text(item.description, 50, y + 6, { width: 290 })
          .text(String(item.quantity || 1), 350, y + 6, { width: 40, align: 'center' })
          .text(`₹${Number(item.unitPrice).toFixed(2)}`, 400, y + 6, { width: 60, align: 'right' })
          .text(`₹${Number(item.amount).toFixed(2)}`, 470, y + 6, { width: 75, align: 'right' });
        y += 22;
      });

      if (Number(invoice.extraMealCharges) > 0) {
        doc.rect(40, y, 515, 22).fill(lineItems.length % 2 === 0 ? '#ffffff' : '#f8fafc');
        doc.fillColor(secondaryColor)
          .text('Extra Meals / Add-on Meals Charges', 50, y + 6, { width: 290 })
          .text('-', 350, y + 6, { width: 40, align: 'center' })
          .text('-', 400, y + 6, { width: 60, align: 'right' })
          .text(`₹${Number(invoice.extraMealCharges).toFixed(2)}`, 470, y + 6, { width: 75, align: 'right' });
        y += 22;
      }

      if (Number(invoice.guestMealCharges) > 0) {
        doc.rect(40, y, 515, 22).fill('#ffffff');
        doc.fillColor(secondaryColor)
          .text('Guest Meals Charges', 50, y + 6, { width: 290 })
          .text('-', 350, y + 6, { width: 40, align: 'center' })
          .text('-', 400, y + 6, { width: 60, align: 'right' })
          .text(`₹${Number(invoice.guestMealCharges).toFixed(2)}`, 470, y + 6, { width: 75, align: 'right' });
        y += 22;
      }

      // Summary Card
      y += 15;
      const summaryX = 330;
      doc.rect(summaryX, y, 225, 100).fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica')
        .text('Subscription Total:', summaryX + 15, y + 10)
        .text(`₹${Number(invoice.subscriptionAmount).toFixed(2)}`, summaryX + 120, y + 10, { width: 90, align: 'right' })
        .text('Extra & Guest Meals:', summaryX + 15, y + 25)
        .text(`₹${(Number(invoice.extraMealCharges) + Number(invoice.guestMealCharges)).toFixed(2)}`, summaryX + 120, y + 25, { width: 90, align: 'right' })
        .text('Discount / Credits:', summaryX + 15, y + 40)
        .text(`- ₹${Number(invoice.discountAmount).toFixed(2)}`, summaryX + 120, y + 40, { width: 90, align: 'right' });

      doc.moveTo(summaryX + 10, y + 55).lineTo(summaryX + 215, y + 55).strokeColor('#cbd5e1').stroke();

      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor)
        .text('Total Amount:', summaryX + 15, y + 62)
        .text(`₹${Number(invoice.totalAmount).toFixed(2)}`, summaryX + 120, y + 62, { width: 90, align: 'right' });

      doc.font('Helvetica').fontSize(9).fillColor(secondaryColor)
        .text('Amount Paid:', summaryX + 15, y + 80)
        .text(`₹${Number(invoice.paidAmount).toFixed(2)}`, summaryX + 120, y + 80, { width: 90, align: 'right' })
        .text('Balance Due:', summaryX + 15, y + 95)
        .text(`₹${Number(invoice.balanceDue).toFixed(2)}`, summaryX + 120, y + 95, { width: 90, align: 'right' });

      // Payment Info (Left Box)
      doc.rect(40, y, 270, 105).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('PAYMENT INSTRUCTIONS:', 50, y + 10);
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica')
        .text(`Pay via UPI to: ${settings.upiId || 'baramatimesswala@upi'}`, 50, y + 28)
        .text(`Payee Name: ${settings.upiPayeeName || 'Baramati Messwala'}`, 50, y + 42)
        .text('Cash payments accepted at mess counter.', 50, y + 56)
        .text('Submit your transaction reference or screenshot in the customer portal.', 50, y + 70);

      // Footer
      doc.fontSize(8).fillColor(mutedColor).font('Helvetica')
        .text('Thank you for being part of Baramati Messwala family! Fresh, hygienic & healthy meals every day.', 40, 750, { align: 'center', width: 515 })
        .text('MessMate – Smart Mess & Tiffin Management System | Developed by Devidas Pund', 40, 762, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
