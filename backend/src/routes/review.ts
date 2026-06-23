import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { rateBookingSchema, completeBookingSchema } from '../validations/booking.validation';

const router = Router();

// Submit a review for a completed booking
router.post('/', authenticate, validate(rateBookingSchema), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const { bookingId, rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.studentId !== studentId) {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment,
      },
    });

    res.json({ message: 'Review submitted', review });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete a session (mock endpoint for MVP)
router.post('/complete-session', authenticate, validate(completeBookingSchema), async (req: any, res) => {
  try {
    const tutorId = req.user.id;
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Not authorized to complete this booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });

    res.json({ message: 'Session completed', booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
