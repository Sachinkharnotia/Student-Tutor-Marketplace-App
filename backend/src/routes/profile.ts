import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student completes profile
router.post('/student', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    const currentProfile = await prisma.studentProfile.findUnique({
      where: { userId }
    });

    const status = currentProfile?.status === 'APPROVED' ? 'APPROVED' : 'PENDING';

    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: { 
        phone,
        status
      },
    });

    res.json({ message: 'Student profile updated.', profile });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tutor completes KYC profile
router.post('/tutor', authenticate, authorize(['TUTOR']), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { phone, kycDocument, subjects, hourlyRate } = req.body;

    const currentProfile = await prisma.tutorProfile.findUnique({
      where: { userId }
    });

    const kycStatus = currentProfile?.kycStatus === 'APPROVED' ? 'APPROVED' : 'PENDING';

    const profile = await prisma.tutorProfile.update({
      where: { userId },
      data: {
        phone,
        kycDocument,
        subjects,
        hourlyRate,
        kycStatus,
      },
    });

    res.json({ message: 'Tutor KYC updated.', profile });
  } catch (error) {
    console.error('KYC Submit Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
