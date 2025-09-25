import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetData() {
  try {
    console.log('🧹 Starting data reset...');
    
    // Get current stats before reset
    const currentLogs = await prisma.entryExitLog.count();
    const currentConfig = await prisma.systemConfig.findFirst();
    
    console.log('📊 Current data:');
    console.log(`  - Entry/Exit logs: ${currentLogs}`);
    console.log(`  - Current occupancy: ${currentConfig?.currentOccupancy || 0}`);
    console.log(`  - Max capacity: ${currentConfig?.maxCapacity || 0}`);
    
    // Clear all entry/exit logs
    console.log('\n📝 Clearing all entry/exit logs...');
    const deletedLogs = await prisma.entryExitLog.deleteMany({});
    console.log(`✅ Deleted ${deletedLogs.count} entry/exit logs`);
    
    // Reset occupancy to 0
    console.log('\n👥 Resetting occupancy to 0...');
    
    // Update or create system config
    if (currentConfig) {
      await prisma.systemConfig.update({
        where: { id: currentConfig.id },
        data: { 
          currentOccupancy: 0,
          updatedAt: new Date()
        }
      });
      console.log('✅ Updated existing system config');
    } else {
      await prisma.systemConfig.create({
        data: {
          maxCapacity: 100,
          currentOccupancy: 0
        }
      });
      console.log('✅ Created new system config');
    }
    
    // Verify the reset
    const updatedConfig = await prisma.systemConfig.findFirst();
    const remainingLogs = await prisma.entryExitLog.count();
    
    console.log('\n📊 Reset completed - Current data:');
    console.log(`  - Entry/Exit logs: ${remainingLogs}`);
    console.log(`  - Current occupancy: ${updatedConfig?.currentOccupancy || 0}`);
    console.log(`  - Max capacity: ${updatedConfig?.maxCapacity || 0}`);
    
    console.log('\n✅ Data reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetData()
    .then(() => {
      console.log('🎉 Reset script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset script failed:', error);
      process.exit(1);
    });
}

export { resetData };
