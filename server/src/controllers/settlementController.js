import prisma from '../config/db.js';
import cacheService from '../services/cacheService.js';

export async function getSettlements(req, res, next) {
  try {
    const userId = req.user.id;
    const { groupId } = req.query;

    let whereClause = {};

    if (groupId) {
      whereClause = { groupId };
    } else {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true }
      });
      const userGroupIds = memberships.map(m => m.groupId);
      whereClause = { groupId: { in: userGroupIds } };
    }

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: {
        payer: { select: { id: true, name: true, email: true } },
        payee: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } }
      },
      orderBy: { settledAt: 'desc' }
    });

    res.json({ success: true, data: { settlements } });
  } catch (err) {
    next(err);
  }
}

export async function createSettlement(req, res, next) {
  try {
    const { groupId, payerId, payeeId, amount } = req.body;

    const numAmount = parseFloat(amount);
    if (!groupId || !payerId || !payeeId || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid group, payer, payee, and amount are required.' });
    }

    if (payerId === payeeId) {
      return res.status(400).json({ success: false, message: 'Payer and payee cannot be the same person.' });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        payeeId,
        amount: numAmount
      },
      include: {
        payer: { select: { id: true, name: true, email: true } },
        payee: { select: { id: true, name: true, email: true } }
      }
    });

    // Invalidate group cache so next read is recalculated
    await cacheService.del(`group:balances:${groupId}`);

    res.status(201).json({
      success: true,
      data: { settlement }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSettlement(req, res, next) {
  try {
    const { id } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: { id }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found.' });
    }

    await prisma.settlement.delete({ where: { id } });

    await cacheService.del(`group:balances:${settlement.groupId}`);

    res.json({ success: true, message: 'Settlement deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
