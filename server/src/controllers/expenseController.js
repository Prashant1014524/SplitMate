import prisma from '../config/db.js';
import cacheService from '../services/cacheService.js';

export async function getExpenses(req, res, next) {
  try {
    const userId = req.user.id;
    const { groupId } = req.query;

    let whereClause = {};

    if (groupId) {
      whereClause = { groupId };
    } else {
      // Find all groups user belongs to
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true }
      });
      const userGroupIds = memberships.map(m => m.groupId);

      whereClause = {
        OR: [
          { payerId: userId, groupId: null }, // Personal
          { groupId: { in: userGroupIds } }    // Group
        ]
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        splits: true,
        payer: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { expenses } });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates expense and individual splits inside an atomic database transaction.
 * Demonstrates ACID properties: if splitting fails, expense creation is rolled back.
 */
export async function createExpense(req, res, next) {
  try {
    const { description, amount, category, groupId, splits = [] } = req.body;
    const payerId = req.user.id;

    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid description and amount are required.' });
    }

    // ACID Transaction
    const newExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description: description.trim(),
          amount: numAmount,
          category: category || 'General',
          payerId,
          groupId: groupId || null
        }
      });

      if (splits.length > 0) {
        await tx.expenseSplit.createMany({
          data: splits.map(s => ({
            expenseId: expense.id,
            userId: s.userId,
            amountOwed: parseFloat(s.amountOwed) || 0
          }))
        });
      }

      return expense;
    });

    // Cache Invalidation: Invalidate cached balances for this group
    if (groupId) {
      await cacheService.del(`group:balances:${groupId}`);
    }

    res.status(201).json({
      success: true,
      data: { expense: newExpense }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    if (expense.payerId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the payer can delete this expense.' });
    }

    await prisma.expense.delete({ where: { id } });

    if (expense.groupId) {
      await cacheService.del(`group:balances:${expense.groupId}`);
    }

    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
