import { Request, Response } from 'express';
import { PrismaClient, LogType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export interface LogsFilters {
  userName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get entry/exit logs with filtering and pagination
 */
export const getEntryExitLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userName,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query as LogsFilters;

    // Build where clause for filtering
    const where: any = {};

    // Filter by user name (search in firstName and lastName)
    if (userName) {
      where.user = {
        OR: [
          { firstName: { contains: userName } },
          { lastName: { contains: userName } },
          { email: { contains: userName } }
        ]
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to endDate to include the entire day
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.timestamp.lt = endDateTime;
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Get logs with user information
    const [logs, totalCount] = await Promise.all([
      prisma.entryExitLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take
      }),
      prisma.entryExitLog.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;

    res.json({
      logs,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching entry/exit logs:', error);
    res.status(500).json({ error: 'Failed to fetch entry/exit logs' });
  }
};

/**
 * Get log statistics for dashboard
 */
export const getLogStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setDate(endDateTime.getDate() + 1);
      dateFilter.lt = endDateTime;
    }

    const where = Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {};

    // Get statistics
    const [
      totalLogs,
      entryCount,
      exitCount,
      uniqueUsers,
      todayLogs,
      thisWeekLogs,
      thisMonthLogs
    ] = await Promise.all([
      prisma.entryExitLog.count({ where }),
      prisma.entryExitLog.count({ where: { ...where, type: LogType.ENTRY } }),
      prisma.entryExitLog.count({ where: { ...where, type: LogType.EXIT } }),
      prisma.entryExitLog.findMany({
        where,
        select: { userId: true },
        distinct: ['userId']
      }).then(users => users.length),
      // Today's logs
      prisma.entryExitLog.count({
        where: {
          ...where,
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      // This week's logs
      prisma.entryExitLog.count({
        where: {
          ...where,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // This month's logs
      prisma.entryExitLog.count({
        where: {
          ...where,
          timestamp: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      totalLogs,
      entryCount,
      exitCount,
      uniqueUsers,
      todayLogs,
      thisWeekLogs,
      thisMonthLogs
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
};

/**
 * Get recent activity (last 10 logs)
 */
export const getRecentActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const recentLogs = await prisma.entryExitLog.findMany({
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
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    res.json(recentLogs);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

/**
 * Export logs to CSV (optional feature)
 */
export const exportLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userName,
      startDate,
      endDate
    } = req.query as LogsFilters;

    // Build where clause (same as getEntryExitLogs)
    const where: any = {};

    if (userName) {
      where.user = {
        OR: [
          { firstName: { contains: userName } },
          { lastName: { contains: userName } },
          { email: { contains: userName } }
        ]
      };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        where.timestamp.lt = endDateTime;
      }
    }

    const logs = await prisma.entryExitLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Convert to CSV format
    const csvHeader = 'ID,User Name,Email,Type,Timestamp\n';
    const csvRows = logs.map(log => 
      `${log.id},"${log.user.firstName} ${log.user.lastName}","${log.user.email}",${log.type},"${log.timestamp.toISOString()}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="entry-exit-logs.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
};
