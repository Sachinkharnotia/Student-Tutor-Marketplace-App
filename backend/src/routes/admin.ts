import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { sendKycStatusEmail } from '../utils/mailer';

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
    const pendingStudents = await prisma.studentProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
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

    // Fire-and-forget KYC status email to tutor
    const tutorUser = await prisma.user.findUnique({ where: { id: updatedProfile.userId } });
    if (tutorUser) {
      sendKycStatusEmail(tutorUser.email, tutorUser.name, status as 'APPROVED' | 'REJECTED');
    }

    res.json({ message: `Tutor ${status}`, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify student
router.post('/verify-student', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { studentProfileId, status } = req.body; // status: APPROVED or REJECTED

    const updatedProfile = await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { status },
    });

    res.json({ message: `Student ${status}`, profile: updatedProfile });
  } catch (error) {
    console.error('Verify Student Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isVerified: true, 
        isSuspended: true, 
        createdAt: true,
        studentProfile: { select: { status: true } },
        tutorProfile: { select: { kycStatus: true } }
      },
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

// Analytics
router.get('/analytics', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalTutors = await prisma.user.count({ where: { role: 'TUTOR' } });
    const totalBookings = await prisma.booking.count();

    // Revenue: sum of amount for PAID bookings
    const revenueResult = await prisma.booking.aggregate({
      _sum: { amount: true },
      where: { paymentStatus: 'PAID' }
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    // Bookings per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, amount: true, paymentStatus: true }
    });

    // Group by month
    const monthlyData: Record<string, { bookings: number; revenue: number }> = {};
    recentBookings.forEach(b => {
      const month = b.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) monthlyData[month] = { bookings: 0, revenue: 0 };
      monthlyData[month].bookings++;
      if (b.paymentStatus === 'PAID') monthlyData[month].revenue += b.amount;
    });

    res.json({ totalUsers, totalStudents, totalTutors, totalBookings, totalRevenue, monthlyData });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
