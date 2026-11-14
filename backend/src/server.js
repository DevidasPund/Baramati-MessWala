import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './config/envValidation.js';
validateEnv();

import app from './app.js';
import { initCronJobs } from './jobs/cronJobs.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`MessMate Server – Baramati Messwala Backend Running!`);
  console.log(`Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Developer: Devidas Pund`);
  console.log(`API URL: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);

  // Initialize automated cron schedulers
  initCronJobs();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});
