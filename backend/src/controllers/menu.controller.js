import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';
import { whatsappService } from '../integrations/whatsapp.js';

// Get Menu for Today (Public & Dashboard)
export const getTodayMenu = async (req, res, next) => {
  try {
    const todayStr = req.query.date || new Date().toISOString().split('T')[0];

    const menus = await prisma.foodMenu.findMany({
      where: {
        date: todayStr,
        isPublished: true,
      },
      orderBy: { mealType: 'asc' },
    });

    return successResponse(res, "Today's menu fetched", { date: todayStr, menus });
  } catch (error) {
    next(error);
  }
};

// Get Weekly Menu (Public & Dashboard)
export const getWeeklyMenu = async (req, res, next) => {
  try {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const menus = await prisma.foodMenu.findMany({
      where: {
        date: { in: dates },
        isPublished: true,
      },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });

    return successResponse(res, 'Weekly menu fetched', { dates, menus });
  } catch (error) {
    next(error);
  }
};

// List menus with admin filters
export const getAllMenus = async (req, res, next) => {
  try {
    const { date, mealType, isSpecial, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (date) where.date = date;
    if (mealType && mealType !== 'ALL') where.mealType = mealType;
    if (isSpecial === 'true') where.isSpecial = true;

    const [total, menus] = await Promise.all([
      prisma.foodMenu.count({ where }),
      prisma.foodMenu.findMany({
        where,
        skip,
        take,
        orderBy: [{ date: 'desc' }, { mealType: 'asc' }],
      }),
    ]);

    return successResponse(res, 'Menus fetched', {
      menus,
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

// Upsert Menu (Admin)
export const saveMenu = async (req, res, next) => {
  try {
    const { date, mealType, title, items, description, isSpecial, specialNote, isPublished } = req.body;

    if (!date || !mealType || !title || !items) {
      return errorResponse(res, 'Date, meal type, title, and items are required.', 400);
    }

    const parsedItems = Array.isArray(items) ? items : items.split(',').map((s) => s.trim()).filter(Boolean);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const menu = await prisma.foodMenu.upsert({
      where: {
        unique_date_meal_menu: {
          date,
          mealType,
        },
      },
      update: {
        title,
        items: parsedItems,
        description: description || null,
        isSpecial: Boolean(isSpecial === 'true' || isSpecial === true),
        specialNote: specialNote || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished === 'true' || isPublished === true) : true,
        ...(imageUrl && { imageUrl }),
      },
      create: {
        date,
        mealType,
        title,
        items: parsedItems,
        description: description || null,
        isSpecial: Boolean(isSpecial === 'true' || isSpecial === true),
        specialNote: specialNote || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished === 'true' || isPublished === true) : true,
        imageUrl: imageUrl || null,
      },
    });

    await logAudit(req.user.id, 'SAVE_MENU', 'FoodMenu', menu.id, req.body, req);

    return successResponse(res, 'Food menu saved successfully', { menu });
  } catch (error) {
    next(error);
  }
};

// Delete Menu item
export const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.foodMenu.delete({ where: { id } });
    await logAudit(req.user.id, 'DELETE_MENU', 'FoodMenu', id, null, req);

    return successResponse(res, 'Menu item deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Broadcast Menu Announcement
export const broadcastMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await prisma.foodMenu.findUnique({ where: { id } });
    if (!menu) {
      return errorResponse(res, 'Menu not found', 404);
    }

    const activeCustomers = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, phone: true },
    });

    // Send async broadcast
    for (const c of activeCustomers) {
      whatsappService.sendNotification({
        customerId: c.id,
        phone: c.phone,
        templateType: 'MENU_UPDATE',
        data: {
          customerName: c.name,
          mealType: menu.mealType,
          title: menu.title,
          items: menu.items,
        },
      }).catch(err => console.error('Menu broadcast err:', err));
    }

    return successResponse(res, `Menu broadcast queued to ${activeCustomers.length} active members.`);
  } catch (error) {
    next(error);
  }
};
