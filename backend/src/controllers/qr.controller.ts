import { Response } from 'express';
import { PrismaClient, LogType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { updateOccupancy, isCapacityFull, getOccupancyStatus } from '../utils/occupancy';
import { findUserSockets } from '../services/socket.service';

const prisma = new PrismaClient();

/**
 * Get current user's QR code
 */
export const getMyQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      message: 'QR code retrieved successfully',
      qrCode: user.qrCode,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Determine if the next log should be ENTRY or EXIT
 * If last log was EXIT or no logs exist → ENTRY
 * If last log was ENTRY → EXIT
 */
const determineLogType = async (userId: string): Promise<LogType> => {
  const lastLog = await prisma.entryExitLog.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' }
  });
  
  if (!lastLog || lastLog.type === LogType.EXIT) {
    return LogType.ENTRY;
  }
  
  return LogType.EXIT;
};

/**
 * Scan QR code and create entry/exit log
 */
export const scanQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }
    
    // Find user by QR code
    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        qrCode: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid QR code', message: 'QR code not found in the system' });
    }
    
    // Determine if this should be an ENTRY or EXIT
    const logType = await determineLogType(user.id);
    
    // If ENTRY, check if capacity is full
    if (logType === LogType.ENTRY) {
      const capacityFull = await isCapacityFull();
      if (capacityFull) {
        return res.status(403).json({ 
          error: 'Library is at maximum capacity',
          message: 'Cannot allow entry. Please try again later.'
        });
      }
    }
    
    // Create entry/exit log
    const log = await prisma.entryExitLog.create({
      data: {
        userId: user.id,
        type: logType
      }
    });
    
    // Update occupancy
    const increment = logType === LogType.ENTRY;
    const occupancyStatus = await updateOccupancy(increment);
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      const percentage = Math.round((occupancyStatus.currentOccupancy / occupancyStatus.maxCapacity) * 100);
      const isAvailable = occupancyStatus.currentOccupancy < occupancyStatus.maxCapacity;
      const isNearCapacity = percentage >= 90;
      const isAtCapacity = occupancyStatus.isAtCapacity;

      // Emit occupancy update to ALL clients (for real-time occupancy display)
      io.emit('occupancy:update', {
        currentOccupancy: occupancyStatus.currentOccupancy,
        maxCapacity: occupancyStatus.maxCapacity,
        percentage,
        isAvailable,
        isNearCapacity,
        isAtCapacity,
        lastUpdated: new Date().toISOString()
      });

      // Emit capacity alerts to ALL clients
      if (isAtCapacity) {
        io.emit('occupancy:alert', {
          type: 'FULL',
          message: 'Library is at maximum capacity!',
          currentOccupancy: occupancyStatus.currentOccupancy,
          maxCapacity: occupancyStatus.maxCapacity,
          percentage,
          isAvailable,
          isNearCapacity,
          isAtCapacity,
          lastUpdated: new Date().toISOString()
        });
      } else if (isNearCapacity) {
        io.emit('occupancy:alert', {
          type: 'WARNING',
          message: 'Library is nearly full!',
          currentOccupancy: occupancyStatus.currentOccupancy,
          maxCapacity: occupancyStatus.maxCapacity,
          percentage,
          isAvailable,
          isNearCapacity,
          isAtCapacity,
          lastUpdated: new Date().toISOString()
        });
      }

      // Emit user action notification ONLY to the specific user who entered/exited
      // We need to find the socket for this specific user
      const userSockets = await findUserSockets(io, user.id);
      userSockets.forEach(socket => {
        socket.emit('user:action', {
          type: logType,
          userName: `${user.firstName} ${user.lastName}`,
          userId: user.id,
          timestamp: log.timestamp,
          currentOccupancy: occupancyStatus.currentOccupancy,
          maxCapacity: occupancyStatus.maxCapacity
        });
      });
    }
    
    res.status(200).json({
      success: true,
      type: logType,
      currentOccupancy: occupancyStatus.currentOccupancy,
      maxCapacity: occupancyStatus.maxCapacity,
      isAtCapacity: occupancyStatus.isAtCapacity,
      userName: `${user.firstName} ${user.lastName}`,
      timestamp: log.timestamp
    });
  } catch (error: any) {
    console.error('Scan QR code error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Get occupancy status
 */
export const getOccupancy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await getOccupancyStatus();
    res.status(200).json(status);
  } catch (error: any) {
    console.error('Get occupancy error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

