import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student completes profile
router.post('/student', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: { phone },
    });

    res.json({ message: 'Student profile updated. Waiting for admin approval.', profile });
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

    const profile = await prisma.tutorProfile.update({
      where: { userId },
      data: {
        phone,
        kycDocument,
        subjects,
        hourlyRate,
        kycStatus: 'PENDING', // resetting status if resubmitting
      },
    });

    res.json({ message: 'Tutor KYC submitted. Waiting for admin approval.', profile });
  } catch (error) {
    console.error('KYC Submit Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
