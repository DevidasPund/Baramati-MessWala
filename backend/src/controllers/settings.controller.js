import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';

// Get Public Business Settings (for Website / Public Pages / Footer)
export const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.businessSettings.create({ data: { id: 'default' } });
    }

    // Exclude sensitive WhatsApp keys from public response
    const { whatsappAccessToken, whatsappPhoneId, whatsappAccountId, ...publicData } = settings;

    return successResponse(res, 'Public settings fetched', { settings: publicData });
  } catch (error) {
    next(error);
  }
};

// Get Full Admin Settings
export const getAdminSettings = async (req, res, next) => {
  try {
    let settings = await prisma.businessSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.businessSettings.create({ data: { id: 'default' } });
    }

    return successResponse(res, 'Admin settings fetched', { settings });
  } catch (error) {
    next(error);
  }
};

// Update Business Settings (Admin)
export const updateSettings = async (req, res, next) => {
  try {
    const data = req.body;
    const upiQrImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.tagline && { tagline: data.tagline }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.address && { address: data.address }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.upiId && { upiId: data.upiId }),
        ...(data.upiPayeeName && { upiPayeeName: data.upiPayeeName }),
        ...(upiQrImage && { upiQrImage }),
        ...(data.breakfastStartTime && { breakfastStartTime: data.breakfastStartTime }),
        ...(data.breakfastEndTime && { breakfastEndTime: data.breakfastEndTime }),
        ...(data.lunchStartTime && { lunchStartTime: data.lunchStartTime }),
        ...(data.lunchEndTime && { lunchEndTime: data.lunchEndTime }),
        ...(data.dinnerStartTime && { dinnerStartTime: data.dinnerStartTime }),
        ...(data.dinnerEndTime && { dinnerEndTime: data.dinnerEndTime }),
        ...(data.extraBreakfastPrice && { extraBreakfastPrice: Number(data.extraBreakfastPrice) }),
        ...(data.extraLunchPrice && { extraLunchPrice: Number(data.extraLunchPrice) }),
        ...(data.extraDinnerPrice && { extraDinnerPrice: Number(data.extraDinnerPrice) }),
        ...(data.guestMealPrice && { guestMealPrice: Number(data.guestMealPrice) }),
        ...(data.expiryReminderDays && { expiryReminderDays: data.expiryReminderDays }),
        ...(data.whatsappEnabled !== undefined && { whatsappEnabled: Boolean(data.whatsappEnabled === 'true' || data.whatsappEnabled === true) }),
        ...(data.whatsappAccessToken !== undefined && { whatsappAccessToken: data.whatsappAccessToken }),
        ...(data.whatsappPhoneId !== undefined && { whatsappPhoneId: data.whatsappPhoneId }),
        ...(data.whatsappAccountId !== undefined && { whatsappAccountId: data.whatsappAccountId }),
        ...(data.whatsappApiVersion !== undefined && { whatsappApiVersion: data.whatsappApiVersion }),
      },
      create: {
        id: 'default',
        ...data,
        ...(upiQrImage && { upiQrImage }),
      },
    });

    await logAudit(req.user.id, 'UPDATE_SETTINGS', 'BusinessSettings', 'default', req.body, req);

    return successResponse(res, 'Settings updated successfully', { settings: updated });
  } catch (error) {
    next(error);
  }
};
