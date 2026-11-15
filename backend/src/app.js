import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import prisma from './config/db.js';
import { storageService } from './integrations/storage.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import customerRoutes from './routes/customer.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import menuRoutes from './routes/menu.routes.js';
import extraMealRoutes from './routes/extraMeal.routes.js';
import billingRoutes from './routes/billing.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import staffRoutes from './routes/staff.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

// Trust reverse proxy (Render, Cloudflare, AWS ALB)
// Required for accurate client IP detection in express-rate-limit, logs, and security headers
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Allows flexible SPA integration
}));

// CORS Configuration Allowlist
const configuredFrontends = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredFrontends,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://baramatimesswala.com',
  'https://www.baramatimesswala.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Normalize incoming origin by removing trailing slashes
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : null;
    // Allow non-browser requests or matching origins (including preview Vercel domains)
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not permitted.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
  },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit login attempts to prevent brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);

// Static uploads directory (supports both local disk fallback & uploaded media)
const localUploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(localUploadDir));

// Production Health Check with Live Database Connectivity Test
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  let dbStatus = 'disconnected';
  let latencyMs = null;

  try {
    await prisma.$queryRaw`SELECT 1 as live_check;`;
    dbStatus = 'connected';
    latencyMs = Date.now() - start;
  } catch (err) {
    dbStatus = 'error';
    console.error('Database Health Check Failed:', err.message);
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    application: 'MessMate – Smart Mess & Tiffin Management System',
    business: 'Baramati Messwala',
    developer: 'Devidas Pund',
    database: {
      status: dbStatus,
      provider: 'Supabase PostgreSQL',
      latencyMs: latencyMs !== null ? `${latencyMs}ms` : 'N/A',
    },
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Secure signed URL generator for private Supabase Storage files
app.get('/api/storage/secure-url', authenticate, async (req, res, next) => {
  try {
    const { bucket, path: filePath } = req.query;
    if (!bucket || !filePath) {
      return res.status(400).json({ success: false, message: 'Bucket and path are required.' });
    }
    const signedUrl = await storageService.getSignedUrl(bucket, filePath, 3600);
    return res.json({ success: true, url: signedUrl });
  } catch (error) {
    next(error);
  }
});

// Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/extra-meals', extraMealRoutes);
app.use('/api/invoices', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found on MessMate Server.`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
