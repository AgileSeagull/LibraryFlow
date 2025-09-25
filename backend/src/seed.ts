import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, generateQRCode } from './utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.entryExitLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Create system configuration
  const systemConfig = await prisma.systemConfig.create({
    data: {
      maxCapacity: 100,
      currentOccupancy: 0
    }
  });

  console.log('✅ System configuration created');

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@libraryflow.com',
      password: adminPassword,
      firstName: 'Library',
      lastName: 'Administrator',
      role: Role.ADMIN,
      qrCode: generateQRCode()
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test students
  const students = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@student.com' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@student.com' },
    { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@student.com' },
    { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@student.com' },
    { firstName: 'David', lastName: 'Brown', email: 'david.brown@student.com' }
  ];

  const studentPassword = await hashPassword('Student123!');
  
  for (const student of students) {
    const user = await prisma.user.create({
      data: {
        email: student.email,
        password: studentPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: Role.STUDENT,
        qrCode: generateQRCode()
      }
    });
    console.log('✅ Student created:', user.email);
  }

  // Create some sample entry/exit logs
  const allUsers = await prisma.user.findMany();
  const sampleLogs = [
    { userId: allUsers[1].id, type: 'ENTRY' },
    { userId: allUsers[2].id, type: 'ENTRY' },
    { userId: allUsers[3].id, type: 'ENTRY' },
    { userId: allUsers[1].id, type: 'EXIT' },
    { userId: allUsers[4].id, type: 'ENTRY' },
  ];

  for (const log of sampleLogs) {
    await prisma.entryExitLog.create({
      data: {
        userId: log.userId,
        type: log.type as any
      }
    });
  }

  console.log('✅ Sample entry/exit logs created');

  // Update system occupancy
  const currentLogs = await prisma.entryExitLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  let currentOccupancy = 0;
  for (const log of currentLogs) {
    if (log.type === 'ENTRY') {
      currentOccupancy++;
    } else if (log.type === 'EXIT') {
      currentOccupancy = Math.max(0, currentOccupancy - 1);
    }
  }

  await prisma.systemConfig.update({
    where: { id: systemConfig.id },
    data: { currentOccupancy }
  });

  console.log('✅ System occupancy updated:', currentOccupancy);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@libraryflow.com / Admin123!');
  console.log('Students: john.doe@student.com / Student123!');
  console.log('Students: jane.smith@student.com / Student123!');
  console.log('Students: mike.johnson@student.com / Student123!');
  console.log('Students: sarah.wilson@student.com / Student123!');
  console.log('Students: david.brown@student.com / Student123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
