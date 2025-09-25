import { Request, Response } from 'express';
import { PrismaClient, LogType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get comprehensive analytics data
 */
export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get basic statistics
    const [
      totalLogs,
      totalEntries,
      totalExits,
      uniqueUsers,
      currentOccupancy,
      maxCapacity
    ] = await Promise.all([
      prisma.entryExitLog.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.entryExitLog.count({
        where: { 
          timestamp: { gte: startDate },
          type: LogType.ENTRY 
        }
      }),
      prisma.entryExitLog.count({
        where: { 
          timestamp: { gte: startDate },
          type: LogType.EXIT 
        }
      }),
      prisma.entryExitLog.findMany({
        where: { timestamp: { gte: startDate } },
        select: { userId: true },
        distinct: ['userId']
      }).then(users => users.length),
      prisma.systemConfig.findFirst().then(config => config?.currentOccupancy || 0),
      prisma.systemConfig.findFirst().then(config => config?.maxCapacity || 100)
    ]);

    // Get hourly data for the period
    const hourlyData = await getHourlyAnalytics(startDate, now);
    
    // Get daily data for the period
    const dailyData = await getDailyAnalytics(startDate, now);
    
    // Get peak hours analysis
    const peakHours = await getPeakHoursAnalysis(startDate, now);
    
    // Get user activity patterns
    const userActivity = await getUserActivityPatterns(startDate, now);
    
    // Get library status history
    const libraryStatusHistory = await getLibraryStatusHistory(startDate, now);

    res.json({
      period,
      summary: {
        totalLogs,
        totalEntries,
        totalExits,
        uniqueUsers,
        currentOccupancy,
        maxCapacity,
        occupancyRate: Math.round((currentOccupancy / maxCapacity) * 100)
      },
      hourlyData,
      dailyData,
      peakHours,
      userActivity,
      libraryStatusHistory
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

/**
 * Get hourly analytics data
 */
const getHourlyAnalytics = async (startDate: Date, endDate: Date) => {
  const logs = await prisma.entryExitLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  // Group by hour
  const hourlyStats: { [key: string]: { entries: number; exits: number; netChange: number } } = {};
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    for (let h = 0; h < 24; h++) {
      const hourKey = `${d.toISOString().split('T')[0]}T${String(h).padStart(2, '0')}:00:00.000Z`;
      hourlyStats[hourKey] = { entries: 0, exits: 0, netChange: 0 };
    }
  }

  logs.forEach(log => {
    const hourKey = new Date(log.timestamp).toISOString().split(':')[0] + ':00:00.000Z';
    if (hourlyStats[hourKey]) {
      if (log.type === LogType.ENTRY) {
        hourlyStats[hourKey].entries++;
        hourlyStats[hourKey].netChange++;
      } else {
        hourlyStats[hourKey].exits++;
        hourlyStats[hourKey].netChange--;
      }
    }
  });

  return Object.keys(hourlyStats).sort().map(key => ({
    hour: key,
    ...hourlyStats[key]
  }));
};

/**
 * Get daily analytics data
 */
const getDailyAnalytics = async (startDate: Date, endDate: Date) => {
  const logs = await prisma.entryExitLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  // Group by day
  const dailyStats: { [key: string]: { entries: number; exits: number; uniqueUsers: number } } = {};
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayKey = d.toISOString().split('T')[0];
    dailyStats[dayKey] = { entries: 0, exits: 0, uniqueUsers: 0 };
  }

  const userSets: { [key: string]: Set<string> } = {};
  
  logs.forEach(log => {
    const dayKey = log.timestamp.toISOString().split('T')[0];
    if (dailyStats[dayKey]) {
      if (log.type === LogType.ENTRY) {
        dailyStats[dayKey].entries++;
      } else {
        dailyStats[dayKey].exits++;
      }
      
      if (!userSets[dayKey]) {
        userSets[dayKey] = new Set();
      }
      userSets[dayKey].add(log.userId);
    }
  });

  // Set unique users count
  Object.keys(dailyStats).forEach(day => {
    dailyStats[day].uniqueUsers = userSets[day]?.size || 0;
  });

  return Object.keys(dailyStats).sort().map(day => ({
    date: day,
    ...dailyStats[day]
  }));
};

/**
 * Get peak hours analysis
 */
const getPeakHoursAnalysis = async (startDate: Date, endDate: Date) => {
  const logs = await prisma.entryExitLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Group by hour of day (0-23)
  const hourStats: { [key: number]: number } = {};
  for (let h = 0; h < 24; h++) {
    hourStats[h] = 0;
  }

  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourStats[hour]++;
  });

  // Find peak hours
  const sortedHours = Object.entries(hourStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  return {
    peakHours: sortedHours,
    averageHourlyActivity: Math.round(Object.values(hourStats).reduce((a, b) => a + b, 0) / 24)
  };
};

/**
 * Get user activity patterns
 */
const getUserActivityPatterns = async (startDate: Date, endDate: Date) => {
  const userActivity = await prisma.entryExitLog.groupBy({
    by: ['userId'],
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });

  // Get user details for top active users
  const userIds = userActivity.map(activity => activity.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  const userMap = new Map(users.map(user => [user.id, user]));

  return userActivity.map(activity => ({
    userId: activity.userId,
    activityCount: activity._count.id,
    user: userMap.get(activity.userId)
  }));
};

/**
 * Get library status history
 */
const getLibraryStatusHistory = async (startDate: Date, endDate: Date) => {
  const statusHistory = await prisma.libraryStatus.findMany({
    where: {
      updatedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  return statusHistory;
};

/**
 * Get real-time analytics (for live updates)
 */
export const getRealTimeAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [
      todayEntries,
      todayExits,
      currentOccupancy,
      maxCapacity,
      recentActivity
    ] = await Promise.all([
      prisma.entryExitLog.count({
        where: {
          timestamp: { gte: todayStart },
          type: LogType.ENTRY
        }
      }),
      prisma.entryExitLog.count({
        where: {
          timestamp: { gte: todayStart },
          type: LogType.EXIT
        }
      }),
      prisma.systemConfig.findFirst().then(config => config?.currentOccupancy || 0),
      prisma.systemConfig.findFirst().then(config => config?.maxCapacity || 100),
      prisma.entryExitLog.findMany({
        where: { timestamp: { gte: new Date(now.getTime() - 60 * 60 * 1000) } }, // Last hour
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
    ]);

    res.json({
      timestamp: now.toISOString(),
      todayEntries,
      todayExits,
      currentOccupancy,
      maxCapacity,
      occupancyRate: Math.round((currentOccupancy / maxCapacity) * 100),
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({ error: 'Failed to fetch real-time analytics' });
  }
};
