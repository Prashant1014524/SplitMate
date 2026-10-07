import prisma from '../config/db.js';
import cacheService from '../services/cacheService.js';
import { calculateNetBalances, calculateSimplifiedDebts } from '../services/splitEngine.js';

export async function getGroups(req, res, next) {
  try {
    const userId = req.user.id;

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true, upiId: true, phone: true } }
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const groups = memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      category: m.group.category,
      createdAt: m.group.createdAt,
      members: m.group.members.map(gm => gm.user)
    }));

    res.json({ success: true, data: { groups } });
  } catch (err) {
    next(err);
  }
}

export async function getGroupById(req, res, next) {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, upiId: true, phone: true } }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          category: group.category,
          createdAt: group.createdAt,
          members: group.members.map(gm => gm.user)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { name, category, memberEmails = [] } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    // Resolve member user IDs
    const memberUsers = [req.user];

    for (const email of memberEmails) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail && cleanEmail !== req.user.email.toLowerCase()) {
        let found = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!found) {
          // Auto-provision user shell so they can be invited
          found = await prisma.user.create({
            data: {
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              passwordHash: 'pending_invitation',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`
            }
          });
        }
        memberUsers.push(found);
      }
    }

    // Create Group & Members inside Transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: name.trim(),
          category: category || 'General',
          createdById: userId,
        }
      });

      await tx.groupMember.createMany({
        data: memberUsers.map(u => ({
          groupId: group.id,
          userId: u.id
        }))
      });

      return group;
    });

    res.status(201).json({
      success: true,
      data: {
        group: {
          ...newGroup,
          members: memberUsers.map(u => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, upiId: u.upiId, phone: u.phone }))
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function joinGroup(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const userId = req.user.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!existing) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId
        }
      });
      // Invalidate balance cache
      await cacheService.del(`group:balances:${groupId}`);
    }

    res.json({
      success: true,
      message: 'Successfully joined group!',
      data: { groupId }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cache-Aside Pattern with Redis
 * Benchmark: Cache hits return in <5ms instead of full SQL aggregation!
 */
export async function getGroupBalances(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const cacheKey = `group:balances:${groupId}`;

    // 1. Check Redis Cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        source: 'redis_cache'
      });
    }

    // 2. Cache Miss: Fetch from DB
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, upiId: true, phone: true } } }
        },
        expenses: {
          include: { splits: true }
        },
        settlements: true
      }
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const members = group.members.map(m => m.user);
    const netBalances = calculateNetBalances(members, group.expenses, group.settlements);
    const simplifiedTransactions = calculateSimplifiedDebts(members, group.expenses, group.settlements);

    const result = {
      groupId,
      netBalances,
      simplifiedTransactions,
      members
    };

    // 3. Save to Redis with 5 minute TTL (300 seconds)
    await cacheService.set(cacheKey, result, 300);

    res.json({
      success: true,
      data: result,
      source: 'database'
    });
  } catch (err) {
    next(err);
  }
}
