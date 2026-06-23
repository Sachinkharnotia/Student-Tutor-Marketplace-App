import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { studentProfileSchema, tutorProfileSchema } from '../validations/tutor.validation';

const router = Router();

// Student completes profile
router.post('/student', authenticate, authorize(['STUDENT']), validate(studentProfileSchema), async (req: any, res) => {
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
router.post('/tutor', authenticate, authorize(['TUTOR']), validate(tutorProfileSchema), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { phone, kycDocument, subjects, hourlyRate } = req.body;

    if (!kycDocument) {
      return res.status(400).json({ error: 'KYC ID Proof Document is compulsory.' });
    }

    const docUrlLower = kycDocument.toLowerCase();
    if (!docUrlLower.endsWith('.pdf') && !docUrlLower.includes('.pdf?')) {
      return res.status(400).json({ error: 'Only PDF files are accepted for KYC verification.' });
    }

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

// Delete KYC document (tutor only)
router.delete('/kyc-document', authenticate, authorize(['TUTOR']), async (req: any, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.tutorProfile.update({
      where: { userId },
      data: { kycDocument: null }
    });

    res.json({ message: 'KYC document deleted.', profile });
  } catch (error) {
    console.error('Delete KYC Document Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account (any authenticated user)
router.delete('/delete-account', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Delete in order: reviews & disputes -> bookings -> profiles -> user
    // 1. Get all booking IDs for this user (as student or tutor)
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ studentId: userId }, { tutorId: userId }] },
      select: { id: true }
    });
    const bookingIds = bookings.map(b => b.id);

    // 2. Delete reviews and disputes for those bookings
    if (bookingIds.length > 0) {
      await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.dispute.deleteMany({ where: { bookingId: { in: bookingIds } } });
    }

    // 3. Delete all bookings
    await prisma.booking.deleteMany({
      where: { OR: [{ studentId: userId }, { tutorId: userId }] }
    });

    // 4. Delete profiles
    await prisma.studentProfile.deleteMany({ where: { userId } });
    await prisma.tutorProfile.deleteMany({ where: { userId } });

    // 5. Delete user
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
