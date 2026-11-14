import prisma from '../config/db.js';

export const logAudit = async (userId, action, entity, entityId, details = null, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details ? details : undefined,
        ipAddress: ipAddress ? String(ipAddress) : null,
      },
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
