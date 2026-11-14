import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { whatsappService } from '../integrations/whatsapp.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { customerId, isRead, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        },
      }),
    ]);

    return successResponse(res, 'Notifications fetched', {
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return successResponse(res, 'Marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

export const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetGroup = 'ALL' } = req.body;

    if (!title || !message) {
      return errorResponse(res, 'Title and message are required', 400);
    }

    const where = targetGroup === 'ACTIVE' ? { status: 'ACTIVE' } : {};
    const customers = await prisma.customer.findMany({
      where,
      select: { id: true, name: true, phone: true },
    });

    for (const cust of customers) {
      whatsappService.sendNotification({
        customerId: cust.id,
        phone: cust.phone,
        templateType: 'ANNOUNCEMENT',
        data: {
          announcementTitle: title,
          message,
        },
      }).catch(err => console.error('Announcement err:', err));
    }

    return successResponse(res, `Announcement sent to ${customers.length} customers.`);
  } catch (error) {
    next(error);
  }
};
