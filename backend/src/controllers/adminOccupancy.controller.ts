import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get comprehensive occupancy statistics for admin dashboard
 */
export const getOccupancyStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get current occupancy
    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({
        data: { maxCapacity: 100, currentOccupancy: 0 }
      });
    }

    // Get today's entry/exit logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await prisma.entryExitLog.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate statistics
    const todayEntries = todayLogs.filter(log => log.type === 'ENTRY').length;
    const todayExits = todayLogs.filter(log => log.type === 'EXIT').length;
    const activeUsers = todayEntries - todayExits;

    // Get recent activity (last 20 logs)
    const recentLogs = await prisma.entryExitLog.findMany({
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get hourly statistics for today
    const hourlyStats = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(today);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourLogs = await prisma.entryExitLog.findMany({
        where: {
          timestamp: {
            gte: hourStart,
            lt: hourEnd
          }
        }
      });

      const entries = hourLogs.filter(log => log.type === 'ENTRY').length;
      const exits = hourLogs.filter(log => log.type === 'EXIT').length;

      hourlyStats.push({
        hour: hour.toString().padStart(2, '0') + ':00',
        entries,
        exits,
        netChange: entries - exits
      });
    }

    res.json({
      currentOccupancy: config.currentOccupancy,
      maxCapacity: config.maxCapacity,
      percentage: Math.round((config.currentOccupancy / config.maxCapacity) * 100),
      isAvailable: config.currentOccupancy < config.maxCapacity,
      isNearCapacity: Math.round((config.currentOccupancy / config.maxCapacity) * 100) >= 90,
      isAtCapacity: config.currentOccupancy >= config.maxCapacity,
      todayEntries,
      todayExits,
      activeUsers,
      recentLogs,
      hourlyStats,
      lastUpdated: config.updatedAt
    });
  } catch (error) {
    console.error('Error fetching occupancy stats:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy statistics' });
  }
};

/**
 * Update maximum capacity (Admin only)
 */
export const updateMaxCapacity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { maxCapacity } = req.body;

    if (typeof maxCapacity !== 'number' || maxCapacity < 1 || maxCapacity > 10000) {
      return res.status(400).json({ 
        error: 'Invalid input: maxCapacity must be a number between 1 and 10000' 
      });
    }

    let config = await prisma.systemConfig.findFirst();

    if (!config) {
      config = await prisma.systemConfig.create({
        data: { maxCapacity, currentOccupancy: 0 }
      });
    } else {
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: { 
          maxCapacity,
          currentOccupancy: Math.min(config.currentOccupancy, maxCapacity) // Adjust current if needed
        }
      });
    }

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('occupancy:update', {
        currentOccupancy: config.currentOccupancy,
        maxCapacity: config.maxCapacity,
        percentage: Math.round((config.currentOccupancy / config.maxCapacity) * 100),
        isAvailable: config.currentOccupancy < config.maxCapacity,
        isNearCapacity: Math.round((config.currentOccupancy / config.maxCapacity) * 100) >= 90,
        isAtCapacity: config.currentOccupancy >= config.maxCapacity,
        lastUpdated: config.updatedAt.toISOString()
      });
    }

    res.json({
      currentOccupancy: config.currentOccupancy,
      maxCapacity: config.maxCapacity,
      percentage: Math.round((config.currentOccupancy / config.maxCapacity) * 100),
      isAvailable: config.currentOccupancy < config.maxCapacity,
      isNearCapacity: Math.round((config.currentOccupancy / config.maxCapacity) * 100) >= 90,
      isAtCapacity: config.currentOccupancy >= config.maxCapacity,
      lastUpdated: config.updatedAt
    });
  } catch (error) {
    console.error('Error updating max capacity:', error);
    res.status(500).json({ error: 'Failed to update max capacity' });
  }
};

/**
 * Manually adjust occupancy count (Admin only)
 */
export const adjustOccupancy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, amount = 1 } = req.body; // action: 'increment' | 'decrement' | 'set', amount: number

    if (!['increment', 'decrement', 'set'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be increment, decrement, or set' });
    }

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }

    let config = await prisma.systemConfig.findFirst();

    if (!config) {
      config = await prisma.systemConfig.create({
        data: { maxCapacity: 100, currentOccupancy: 0 }
      });
    }

    let newOccupancy = config.currentOccupancy;

    switch (action) {
      case 'increment':
        newOccupancy = Math.min(config.currentOccupancy + amount, config.maxCapacity);
        break;
      case 'decrement':
        newOccupancy = Math.max(config.currentOccupancy - amount, 0);
        break;
      case 'set':
        newOccupancy = Math.min(Math.max(amount, 0), config.maxCapacity);
        break;
    }

    const updatedConfig = await prisma.systemConfig.update({
      where: { id: config.id },
      data: { currentOccupancy: newOccupancy }
    });

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      const percentage = Math.round((updatedConfig.currentOccupancy / updatedConfig.maxCapacity) * 100);
      const isAvailable = updatedConfig.currentOccupancy < updatedConfig.maxCapacity;
      const isNearCapacity = percentage >= 90;
      const isAtCapacity = updatedConfig.currentOccupancy >= updatedConfig.maxCapacity;

      io.emit('occupancy:update', {
        currentOccupancy: updatedConfig.currentOccupancy,
        maxCapacity: updatedConfig.maxCapacity,
        percentage,
        isAvailable,
        isNearCapacity,
        isAtCapacity,
        lastUpdated: updatedConfig.updatedAt.toISOString()
      });

      // Emit capacity alerts to ALL clients
      if (isAtCapacity) {
        io.emit('occupancy:alert', {
          type: 'FULL',
          message: 'Library is at maximum capacity!',
          currentOccupancy: updatedConfig.currentOccupancy,
          maxCapacity: updatedConfig.maxCapacity,
          percentage,
          isAvailable,
          isNearCapacity,
          isAtCapacity,
          lastUpdated: updatedConfig.updatedAt.toISOString()
        });
      } else if (isNearCapacity) {
        io.emit('occupancy:alert', {
          type: 'WARNING',
          message: 'Library is nearly full!',
          currentOccupancy: updatedConfig.currentOccupancy,
          maxCapacity: updatedConfig.maxCapacity,
          percentage,
          isAvailable,
          isNearCapacity,
          isAtCapacity,
          lastUpdated: updatedConfig.updatedAt.toISOString()
        });
      }
    }

    res.json({
      currentOccupancy: updatedConfig.currentOccupancy,
      maxCapacity: updatedConfig.maxCapacity,
      percentage: Math.round((updatedConfig.currentOccupancy / updatedConfig.maxCapacity) * 100),
      isAvailable: updatedConfig.currentOccupancy < updatedConfig.maxCapacity,
      isNearCapacity: Math.round((updatedConfig.currentOccupancy / updatedConfig.maxCapacity) * 100) >= 90,
      isAtCapacity: updatedConfig.currentOccupancy >= updatedConfig.maxCapacity,
      lastUpdated: updatedConfig.updatedAt
    });
  } catch (error) {
    console.error('Error adjusting occupancy:', error);
    res.status(500).json({ error: 'Failed to adjust occupancy' });
  }
};

/**
 * Get occupancy analytics for admin dashboard
 */
export const getOccupancyAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysBack = parseInt(days as string) || 7;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get daily statistics
    const dailyStats = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLogs = await prisma.entryExitLog.findMany({
        where: {
          timestamp: {
            gte: date,
            lt: nextDate
          }
        }
      });

      const entries = dayLogs.filter(log => log.type === 'ENTRY').length;
      const exits = dayLogs.filter(log => log.type === 'EXIT').length;

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        entries,
        exits,
        netChange: entries - exits
      });
    }

    // Get peak hours analysis
    const peakHours = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(startDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(startDate);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourLogs = await prisma.entryExitLog.findMany({
        where: {
          timestamp: {
            gte: hourStart,
            lt: hourEnd
          }
        }
      });

      const entries = hourLogs.filter(log => log.type === 'ENTRY').length;
      const exits = hourLogs.filter(log => log.type === 'EXIT').length;

      peakHours.push({
        hour: hour.toString().padStart(2, '0') + ':00',
        entries,
        exits,
        netChange: entries - exits
      });
    }

    res.json({
      dailyStats,
      peakHours,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: daysBack
      }
    });
  } catch (error) {
    console.error('Error fetching occupancy analytics:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy analytics' });
  }
};
