import { Request, Response } from 'express';
import { PrismaClient, LibraryStatusType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get current library status
 */
export const getLibraryStatus = async (req: Request, res: Response) => {
  try {
    let status = await prisma.libraryStatus.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!status) {
      // Create default status if none exists
      status = await prisma.libraryStatus.create({
        data: {
          status: LibraryStatusType.OPEN,
          message: 'Library is open',
          isAutoScheduled: false
        }
      });
    }

    res.json({
      id: status.id,
      status: status.status,
      message: status.message,
      isAutoScheduled: status.isAutoScheduled,
      autoOpenTime: status.autoOpenTime,
      autoCloseTime: status.autoCloseTime,
      maintenanceMessage: status.maintenanceMessage,
      lastUpdated: status.updatedAt
    });
  } catch (error) {
    console.error('Error fetching library status:', error);
    res.status(500).json({ error: 'Failed to fetch library status' });
  }
};

/**
 * Update library status (Admin only)
 */
export const updateLibraryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      status, 
      message, 
      isAutoScheduled, 
      autoOpenTime, 
      autoCloseTime, 
      maintenanceMessage 
    } = req.body;

    if (!status || !Object.values(LibraryStatusType).includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Validate time format if provided
    if (autoOpenTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(autoOpenTime)) {
      return res.status(400).json({ error: 'Invalid autoOpenTime format. Use HH:MM' });
    }

    if (autoCloseTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(autoCloseTime)) {
      return res.status(400).json({ error: 'Invalid autoCloseTime format. Use HH:MM' });
    }

    const updatedStatus = await prisma.libraryStatus.create({
      data: {
        status,
        message: message || null,
        isAutoScheduled: isAutoScheduled || false,
        autoOpenTime: autoOpenTime || null,
        autoCloseTime: autoCloseTime || null,
        maintenanceMessage: maintenanceMessage || null,
        updatedBy: req.user?.userId
      }
    });

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('library:statusUpdate', {
        status: updatedStatus.status,
        message: updatedStatus.message,
        isAutoScheduled: updatedStatus.isAutoScheduled,
        autoOpenTime: updatedStatus.autoOpenTime,
        autoCloseTime: updatedStatus.autoCloseTime,
        maintenanceMessage: updatedStatus.maintenanceMessage,
        lastUpdated: updatedStatus.updatedAt.toISOString()
      });
    }

    res.json({
      id: updatedStatus.id,
      status: updatedStatus.status,
      message: updatedStatus.message,
      isAutoScheduled: updatedStatus.isAutoScheduled,
      autoOpenTime: updatedStatus.autoOpenTime,
      autoCloseTime: updatedStatus.autoCloseTime,
      maintenanceMessage: updatedStatus.maintenanceMessage,
      lastUpdated: updatedStatus.updatedAt
    });
  } catch (error) {
    console.error('Error updating library status:', error);
    res.status(500).json({ error: 'Failed to update library status' });
  }
};

/**
 * Get library status history (Admin only)
 */
export const getLibraryStatusHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    
    const history = await prisma.libraryStatus.findMany({
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string) || 50,
      select: {
        id: true,
        status: true,
        message: true,
        isAutoScheduled: true,
        autoOpenTime: true,
        autoCloseTime: true,
        maintenanceMessage: true,
        updatedAt: true,
        updatedBy: true
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching library status history:', error);
    res.status(500).json({ error: 'Failed to fetch library status history' });
  }
};

/**
 * Check if library should be automatically opened/closed based on schedule
 */
export const checkAutoSchedule = async () => {
  try {
    const currentStatus = await prisma.libraryStatus.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!currentStatus || !currentStatus.isAutoScheduled) {
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if it's a weekday (Monday-Friday)
    const isWeekday = currentDay >= 1 && currentDay <= 5;

    if (!isWeekday) {
      return; // Don't auto-schedule on weekends
    }

    let shouldUpdate = false;
    let newStatus = currentStatus.status;
    let newMessage = currentStatus.message;

    // Check if we should open
    if (currentStatus.autoOpenTime && 
        currentTime >= currentStatus.autoOpenTime && 
        currentStatus.status !== LibraryStatusType.OPEN) {
      newStatus = LibraryStatusType.OPEN;
      newMessage = 'Library is now open';
      shouldUpdate = true;
    }

    // Check if we should close
    if (currentStatus.autoCloseTime && 
        currentTime >= currentStatus.autoCloseTime && 
        currentStatus.status !== LibraryStatusType.CLOSED) {
      newStatus = LibraryStatusType.CLOSED;
      newMessage = 'Library is now closed';
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const updatedStatus = await prisma.libraryStatus.create({
        data: {
          status: newStatus,
          message: newMessage,
          isAutoScheduled: true,
          autoOpenTime: currentStatus.autoOpenTime,
          autoCloseTime: currentStatus.autoCloseTime,
          maintenanceMessage: currentStatus.maintenanceMessage,
          updatedBy: 'system'
        }
      });

      // Emit Socket.io event for real-time updates
      const io = global.io; // Access global io instance
      if (io) {
        io.emit('library:statusUpdate', {
          id: updatedStatus.id,
          status: updatedStatus.status,
          message: updatedStatus.message,
          isAutoScheduled: updatedStatus.isAutoScheduled,
          autoOpenTime: updatedStatus.autoOpenTime,
          autoCloseTime: updatedStatus.autoCloseTime,
          maintenanceMessage: updatedStatus.maintenanceMessage,
          lastUpdated: updatedStatus.updatedAt.toISOString(),
          updatedBy: updatedStatus.updatedBy
        });
        console.log('Library status update emitted via Socket.io');
      }

      console.log(`Library status automatically updated to: ${newStatus}`);
    }
  } catch (error) {
    console.error('Error checking auto schedule:', error);
  }
};
