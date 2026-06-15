import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all verified tutors for the marketplace
router.get('/tutors', authenticate, async (req, res) => {
  try {
    const tutors = await prisma.tutorProfile.findMany({
      where: { 
        kycStatus: 'APPROVED',
        user: { isVerified: true }
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
