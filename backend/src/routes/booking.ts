import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

// Create a booking
router.post('/create', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const { tutorId, startTime, endTime, amount } = req.body;

    const booking = await prisma.booking.create({
      data: {
        studentId,
        tutorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        amount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Create Razorpay order (mocking if keys are invalid)
    try {
      const order = await razorpay.orders.create({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: booking.id,
      });

      res.json({ booking, orderId: order.id });
    } catch (rzpError) {
      console.warn("Razorpay order creation failed, likely using mock keys. Returning mock orderId.");
      res.json({ booking, orderId: `mock_order_${booking.id}` });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment webhook or endpoint
router.post('/verify-payment', authenticate, async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // For MVP with mock keys, just update it without signature verification if signature is "MOCK"
    if (razorpaySignature === 'MOCK') {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paymentId: razorpayPaymentId,
        },
      });
      return res.json({ message: 'Payment verified (MOCK)', booking });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock_secret')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpaySignature) {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paymentId: razorpayPaymentId,
        },
      });
      res.json({ message: 'Payment verified', booking });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student bookings
router.get('/my-bookings', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const bookings = await prisma.booking.findMany({
      where: { studentId },
      include: { tutor: { select: { name: true, email: true } } },
      orderBy: { startTime: 'asc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tutor bookings
router.get('/tutor-bookings', authenticate, authorize(['TUTOR']), async (req: any, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { tutorId: req.user.id },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { startTime: 'asc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark booking as completed
router.post('/complete', authenticate, async (req: any, res) => {
  try {
    const { bookingId } = req.body;
    
    // In MVP, allowing either Student or Tutor to mark it complete.
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });
    
    res.json({ message: 'Session completed', booking });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a Rating
router.post('/rate', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    
    // Verify booking belongs to student and is completed
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only rate completed sessions' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment
      }
    });

    res.json({ message: 'Rating submitted successfully', review });
  } catch (error) {
    console.error(error);
    // Unique constraint on bookingId will throw if already rated
    res.status(400).json({ error: 'Failed to submit rating. You may have already rated this session.' });
  }
});

export default router;
