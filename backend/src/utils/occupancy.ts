import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get current occupancy from SystemConfig
 */
export const getCurrentOccupancy = async (): Promise<number> => {
  const config = await prisma.systemConfig.findFirst();
  
  if (!config) {
    // Initialize if not exists
    const newConfig = await prisma.systemConfig.create({
      data: {
        maxCapacity: 100,
        currentOccupancy: 0
      }
    });
    return newConfig.currentOccupancy;
  }
  
  return config.currentOccupancy;
};

/**
 * Get maximum capacity from SystemConfig
 */
export const getMaxCapacity = async (): Promise<number> => {
  const config = await prisma.systemConfig.findFirst();
  
  if (!config) {
    const newConfig = await prisma.systemConfig.create({
      data: {
        maxCapacity: 100,
        currentOccupancy: 0
      }
    });
    return newConfig.maxCapacity;
  }
  
  return config.maxCapacity;
};

/**
 * Update occupancy count (increment or decrement)
 */
export const updateOccupancy = async (increment: boolean): Promise<{ currentOccupancy: number; maxCapacity: number; isAtCapacity: boolean }> => {
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
    ? config.currentOccupancy + 1 
    : Math.max(0, config.currentOccupancy - 1);
  
  const updatedConfig = await prisma.systemConfig.update({
    where: { id: config.id },
    data: { 
      currentOccupancy: newOccupancy,
      updatedAt: new Date()
    }
  });
  
  return {
    currentOccupancy: updatedConfig.currentOccupancy,
    maxCapacity: updatedConfig.maxCapacity,
    isAtCapacity: updatedConfig.currentOccupancy >= updatedConfig.maxCapacity
  };
};

/**
 * Check if capacity is full
 */
export const isCapacityFull = async (): Promise<boolean> => {
  const config = await prisma.systemConfig.findFirst();
  
  if (!config) {
    return false;
  }
  
  return config.currentOccupancy >= config.maxCapacity;
};

/**
 * Set maximum capacity
 */
export const setMaxCapacity = async (maxCapacity: number): Promise<{ currentOccupancy: number; maxCapacity: number; isAtCapacity: boolean }> => {
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
  
  return {
    currentOccupancy: config.currentOccupancy,
    maxCapacity: config.maxCapacity,
    isAtCapacity: config.currentOccupancy >= config.maxCapacity
  };
};

/**
 * Get occupancy status
 */
export const getOccupancyStatus = async (): Promise<{ currentOccupancy: number; maxCapacity: number; isAtCapacity: boolean }> => {
  let config = await prisma.systemConfig.findFirst();
  
  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        maxCapacity: 100,
        currentOccupancy: 0
      }
    });
  }
  
  return {
    currentOccupancy: config.currentOccupancy,
    maxCapacity: config.maxCapacity,
    isAtCapacity: config.currentOccupancy >= config.maxCapacity
  };
};

