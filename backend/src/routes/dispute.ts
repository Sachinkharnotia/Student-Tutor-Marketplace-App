import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Create a dispute (STUDENT only)
router.post('/create', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const { bookingId, reason } = req.body;

    if (!bookingId || !reason) {
      return res.status(400).json({ error: 'bookingId and reason are required' });
    }

    // Verify the booking belongs to this student
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId) {
      return res.status(403).json({ error: 'Unauthorized: This booking does not belong to you' });
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        reason,
        status: 'OPEN'
      }
    });

    res.status(201).json({ message: 'Dispute created successfully', dispute });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
