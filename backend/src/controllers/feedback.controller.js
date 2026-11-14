import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAudit } from '../middleware/auditLogger.js';

// Submit Feedback (Customer)
export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, foodQualityRating, hygieneRating, serviceRating, comments, mealDate, mealType } = req.body;
    const customerId = req.user.role === 'CUSTOMER' ? req.user.customer?.id : req.body.customerId;

    if (!customerId || !rating) {
      return errorResponse(res, 'Customer and rating (1-5) are required', 400);
    }

    const feedback = await prisma.feedback.create({
      data: {
        customerId,
        rating: Number(rating),
        foodQualityRating: foodQualityRating ? Number(foodQualityRating) : null,
        hygieneRating: hygieneRating ? Number(hygieneRating) : null,
        serviceRating: serviceRating ? Number(serviceRating) : null,
        comments,
        mealDate: mealDate || new Date().toISOString().split('T')[0],
        mealType: mealType || null,
      },
    });

    return successResponse(res, 'Thank you for your valuable feedback!', { feedback }, 201);
  } catch (error) {
    next(error);
  }
};

// Get Feedback List (Admin)
export const getFeedback = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (rating && rating !== 'ALL') where.rating = Number(rating);

    const [total, feedbacks] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
        },
      }),
    ]);

    // Average rating calculation
    const all = await prisma.feedback.findMany({ select: { rating: true } });
    const avgRating = all.length ? (all.reduce((s, f) => s + f.rating, 0) / all.length).toFixed(1) : 5.0;

    return successResponse(res, 'Feedback fetched', {
      feedbacks,
      avgRating: Number(avgRating),
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

// Submit Complaint (Customer)
export const submitComplaint = async (req, res, next) => {
  try {
    const { subject, description, category } = req.body;
    const customerId = req.user.role === 'CUSTOMER' ? req.user.customer?.id : req.body.customerId;

    if (!customerId || !subject || !description) {
      return errorResponse(res, 'Subject and description are required', 400);
    }

    const count = await prisma.complaint.count();
    const complaintNumber = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        customerId,
        subject,
        description,
        category: category || 'FOOD_QUALITY',
        status: 'OPEN',
      },
    });

    await logAudit(req.user.id, 'SUBMIT_COMPLAINT', 'Complaint', complaint.id, req.body, req);

    return successResponse(res, `Complaint ${complaintNumber} registered. Our team will review it shortly.`, { complaint }, 201);
  } catch (error) {
    next(error);
  }
};

// Admin Resolve / Respond to Complaint
export const resolveComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        adminResponse: adminResponse || null,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : null,
      },
      include: { customer: true },
    });

    await logAudit(req.user.id, 'RESOLVE_COMPLAINT', 'Complaint', id, req.body, req);

    return successResponse(res, `Complaint updated to ${status}`, { complaint });
  } catch (error) {
    next(error);
  }
};

// Get Complaints List
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, customerId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.customer?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, customerCode: true, phone: true } },
        },
      }),
    ]);

    return successResponse(res, 'Complaints fetched', {
      complaints,
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
