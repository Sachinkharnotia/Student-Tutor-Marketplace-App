import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    data: { isVerified: true },
  });
  console.log("All users have been verified!");

  // Create an admin user if one doesn't exist
  const adminEmail = "admin@test.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
      }
    });
    console.log("Admin user created: admin@test.com / admin123");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
