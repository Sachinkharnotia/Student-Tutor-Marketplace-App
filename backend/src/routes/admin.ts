import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get pending tutors
router.get('/pending-tutors', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const pendingTutors = await prisma.tutorProfile.findMany({
      where: { kycStatus: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(pendingTutors);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending students
router.get('/pending-students', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const pendingStudents = await prisma.user.findMany({
      where: { role: 'STUDENT', isVerified: false },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    res.json(pendingStudents);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify tutor
router.post('/verify-tutor', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { tutorProfileId, status } = req.body; // status: APPROVED or REJECTED

    const updatedProfile = await prisma.tutorProfile.update({
      where: { id: tutorProfileId },
      data: { kycStatus: status },
    });

    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: updatedProfile.userId },
        data: { isVerified: true },
      });
    }

    res.json({ message: `Tutor ${status}`, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify student
router.post('/verify-student', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { userId } = req.body; 

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    res.json({ message: 'Student verified', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isVerified: true, isSuspended: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle suspend user
router.post('/suspend', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { userId, isSuspended } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended },
    });
    res.json({ message: isSuspended ? 'User suspended' : 'User unsuspended', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings/payments
router.get('/payments', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const payments = await prisma.booking.findMany({
      include: {
        student: { select: { name: true, email: true } },
        tutor: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process Refund
router.post('/refund', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { bookingId } = req.body;
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { refundStatus: 'REFUNDED' },
    });
    res.json({ message: 'Refund processed', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all disputes
router.get('/disputes', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            student: { select: { name: true, email: true } },
            tutor: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve Dispute
router.post('/resolve-dispute', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { disputeId, resolution } = req.body; // could update booking status too
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'RESOLVED' },
    });
    res.json({ message: 'Dispute resolved', dispute: updatedDispute });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
