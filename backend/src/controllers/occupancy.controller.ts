import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OccupancyService } from '../services/occupancy.service';

const prisma = new PrismaClient();

/**
 * Get current occupancy status
 */
export const getOccupancyStatus = async (req: Request, res: Response) => {
  try {
    // Get current occupancy from SystemConfig
    let config = await prisma.systemConfig.findFirst();
    
    if (!config) {
      // Initialize if not exists
      config = await prisma.systemConfig.create({
        data: {
          maxCapacity: 100,
          currentOccupancy: 0
        }
      });
    }

    const percentage = Math.round((config.currentOccupancy / config.maxCapacity) * 100);
    const isAvailable = config.currentOccupancy < config.maxCapacity;
    const isNearCapacity = percentage >= 90;
    const isAtCapacity = config.currentOccupancy >= config.maxCapacity;

    res.json({
      currentOccupancy: config.currentOccupancy,
      maxCapacity: config.maxCapacity,
      percentage,
      isAvailable,
      isNearCapacity,
      isAtCapacity,
      lastUpdated: config.updatedAt
    });
  } catch (error) {
    console.error('Error getting occupancy status:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy status' });
  }
};

/**
 * Update occupancy count (increment or decrement)
 */
export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const { increment } = req.body;
    
    if (typeof increment !== 'boolean') {
      return res.status(400).json({ error: 'Increment must be a boolean value' });
    }

    let config = await prisma.systemConfig.findFirst();
    
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          maxCapacity: 100,
          currentOccupancy: 0
        }
      });
    }

    const newOccupancy = increment 
      ? Math.min(config.currentOccupancy + 1, config.maxCapacity)
      : Math.max(0, config.currentOccupancy - 1);
    
    const updatedConfig = await prisma.systemConfig.update({
      where: { id: config.id },
      data: { 
        currentOccupancy: newOccupancy,
        updatedAt: new Date()
      }
    });

    const percentage = Math.round((updatedConfig.currentOccupancy / updatedConfig.maxCapacity) * 100);
    const isAvailable = updatedConfig.currentOccupancy < updatedConfig.maxCapacity;
    const isNearCapacity = percentage >= 90;
    const isAtCapacity = updatedConfig.currentOccupancy >= updatedConfig.maxCapacity;

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      const occupancyService = new OccupancyService(io);
      await occupancyService.emitOccupancyUpdate();
    }

    res.json({
      currentOccupancy: updatedConfig.currentOccupancy,
      maxCapacity: updatedConfig.maxCapacity,
      percentage,
      isAvailable,
      isNearCapacity,
      isAtCapacity,
      lastUpdated: updatedConfig.updatedAt
    });
  } catch (error) {
    console.error('Error updating occupancy:', error);
    res.status(500).json({ error: 'Failed to update occupancy' });
  }
};

/**
 * Set maximum capacity
 */
export const setMaxCapacity = async (req: Request, res: Response) => {
  try {
    const { maxCapacity } = req.body;
    
    if (!maxCapacity || typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({ error: 'Max capacity must be a positive number' });
    }

    let config = await prisma.systemConfig.findFirst();
    
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          maxCapacity,
          currentOccupancy: 0
        }
      });
    } else {
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: { 
          maxCapacity,
          updatedAt: new Date()
        }
      });
    }

    const percentage = Math.round((config.currentOccupancy / config.maxCapacity) * 100);
    const isAvailable = config.currentOccupancy < config.maxCapacity;
    const isNearCapacity = percentage >= 90;
    const isAtCapacity = config.currentOccupancy >= config.maxCapacity;

    res.json({
      currentOccupancy: config.currentOccupancy,
      maxCapacity: config.maxCapacity,
      percentage,
      isAvailable,
      isNearCapacity,
      isAtCapacity,
      lastUpdated: config.updatedAt
    });
  } catch (error) {
    console.error('Error setting max capacity:', error);
    res.status(500).json({ error: 'Failed to set max capacity' });
  }
};
