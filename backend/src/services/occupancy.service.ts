import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OccupancyService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Emit occupancy update to all connected clients
   */
  async emitOccupancyUpdate() {
    try {
      const config = await prisma.systemConfig.findFirst();
      
      if (!config) {
        return;
      }

      const percentage = Math.round((config.currentOccupancy / config.maxCapacity) * 100);
      const isAvailable = config.currentOccupancy < config.maxCapacity;
      const isNearCapacity = percentage >= 90;
      const isAtCapacity = config.currentOccupancy >= config.maxCapacity;

      const occupancyData = {
        currentOccupancy: config.currentOccupancy,
        maxCapacity: config.maxCapacity,
        percentage,
        isAvailable,
        isNearCapacity,
        isAtCapacity,
        lastUpdated: config.updatedAt
      };

      // Emit to all connected clients
      this.io.emit('occupancy:update', occupancyData);

      // Emit capacity alerts if needed
      if (isAtCapacity) {
        this.io.emit('occupancy:alert', {
          type: 'FULL',
          message: 'Library is at maximum capacity!',
          ...occupancyData
        });
      } else if (isNearCapacity) {
        this.io.emit('occupancy:alert', {
          type: 'WARNING',
          message: 'Library is nearly full!',
          ...occupancyData
        });
      }

      console.log('Occupancy update emitted:', occupancyData);
    } catch (error) {
      console.error('Error emitting occupancy update:', error);
    }
  }

  /**
   * Emit capacity alert
   */
  async emitCapacityAlert(type: 'FULL' | 'WARNING', message: string) {
    try {
      const config = await prisma.systemConfig.findFirst();
      
      if (!config) {
        return;
      }

      const percentage = Math.round((config.currentOccupancy / config.maxCapacity) * 100);
      const isAvailable = config.currentOccupancy < config.maxCapacity;
      const isNearCapacity = percentage >= 90;
      const isAtCapacity = config.currentOccupancy >= config.maxCapacity;

      this.io.emit('occupancy:alert', {
        type,
        message,
        currentOccupancy: config.currentOccupancy,
        maxCapacity: config.maxCapacity,
        percentage,
        isAvailable,
        isNearCapacity,
        isAtCapacity,
        lastUpdated: config.updatedAt
      });

      console.log('Capacity alert emitted:', { type, message, percentage });
    } catch (error) {
      console.error('Error emitting capacity alert:', error);
    }
  }
}
