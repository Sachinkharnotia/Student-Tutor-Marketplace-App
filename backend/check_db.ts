import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tutors = await prisma.tutorProfile.findMany({
    where: { 
      kycStatus: 'APPROVED',
      user: { isVerified: true }
    },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  console.log("=== MARKETPLACE TUTORS QUERY RESULT ===");
  console.log("Tutors count:", tutors.length);
  for (const t of tutors) {
    console.log(`Tutor Profile ID: ${t.id} | User ID: ${t.userId} | Name: ${t.user.name} | Rate: ${t.hourlyRate}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
