import { onRequest } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const api = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  try {
    // If backend app is bundled or mounted
    const { default: app } = await import('../backend/src/app.js');
    return app(req, res);
  } catch (err) {
    console.error('[Firebase Function] Error routing request:', err);
    res.status(500).json({
      success: false,
      message: 'MessMate Firebase Cloud Function Gateway Error',
      error: err.message,
    });
  }
});
