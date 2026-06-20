import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../utils/mailer';

const router = Router();

const getPagination = (query: any) => {
  const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(query.limit || '10'), 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const paginatedResponse = (data: any[], page: number, limit: number, total: number) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});

// Lazy-init so dotenv.config() has run before we read process.env
let razorpay: Razorpay;
function getRazorpay() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    console.log(`[Razorpay] Initializing with key_id: ${keyId ? keyId.substring(0, 12) + '...' : 'MISSING'}`);
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpay;
}

// Create a booking
router.post('/create', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const { tutorId, startTime, endTime, amount } = req.body;

    // Check if student is admin-approved
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    if (!studentProfile || studentProfile.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Only approved students can book tutors and make payments.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const dayOfWeek = start.getDay();

    // Fetch tutor profile and availability
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: tutorId },
      include: { availabilities: true }
    });

    if (!tutorProfile) return res.status(404).json({ error: 'Tutor not found.' });

    // Validate availability
    const isAvailable = tutorProfile.availabilities.some(av => {
      if (av.dayOfWeek !== dayOfWeek) return false;
      const [startHour, startMin] = av.startTime.split(':').map(Number);
      const [endHour, endMin] = av.endTime.split(':').map(Number);
      
      const reqStartHour = start.getHours();
      const reqStartMin = start.getMinutes();
      const reqEndHour = end.getHours();
      const reqEndMin = end.getMinutes();

      const avStartTotalMins = startHour * 60 + startMin;
      const avEndTotalMins = endHour * 60 + endMin;
      const reqStartTotalMins = reqStartHour * 60 + reqStartMin;
      const reqEndTotalMins = reqEndHour * 60 + reqEndMin;

      return reqStartTotalMins >= avStartTotalMins && reqEndTotalMins <= avEndTotalMins;
    });

    if (!isAvailable && tutorProfile.availabilities.length > 0) {
      return res.status(400).json({ error: 'Tutor is not available at this time.' });
    }

    const booking = await prisma.booking.create({
      data: {
        studentId,
        tutorId,
        startTime: start,
        endTime: end,
        amount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Create Razorpay order
    try {
      const order = await getRazorpay().orders.create({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: booking.id,
      });

      res.json({ booking, orderId: order.id });
    } catch (rzpError: any) {
      console.error("Razorpay order creation failed:", rzpError?.message || rzpError);
      res.status(500).json({ error: 'Failed to create payment order. Check Razorpay keys.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a booking
router.post('/cancel', authenticate, async (req: any, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.studentId !== userId && booking.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Already cancelled' });
    }

    const now = new Date();
    const timeDiffHours = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundStatus = booking.refundStatus;

    // Refund logic: if paid and cancelled > 24 hours before
    if (booking.paymentStatus === 'PAID' && timeDiffHours >= 24 && booking.paymentId) {
      try {
        await getRazorpay().payments.refund(booking.paymentId, {
          amount: booking.amount * 100,
          speed: 'normal'
        });
        refundStatus = 'REFUNDED';
      } catch (refundError) {
        console.error("Refund failed:", refundError);
        refundStatus = 'FAILED'; // Could not process refund automatically
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        refundStatus
      },
      include: {
        student: { select: { name: true, email: true } },
        tutor: { select: { name: true } }
      }
    });

    // Fire-and-forget cancellation email to student
    sendBookingCancellationEmail(
      updatedBooking.student.email,
      updatedBooking.student.name,
      updatedBooking.tutor.name,
      updatedBooking.startTime
    );

    res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment webhook or endpoint
router.post('/verify-payment', authenticate, async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
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

      // Fire-and-forget confirmation email to student
      const student = await prisma.user.findUnique({ where: { id: booking.studentId } });
      const tutor = await prisma.user.findUnique({ where: { id: booking.tutorId } });
      if (student && tutor) {
        sendBookingConfirmationEmail(
          student.email,
          student.name,
          tutor.name,
          booking.startTime,
          booking.amount
        );
      }

      res.json({ message: 'Payment verified', booking });
    } else {
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student bookings
router.get('/my-bookings', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const studentId = req.user.id;
    const { page, limit, skip } = getPagination(req.query);
    console.log(`API [GET /my-bookings] called by Student ID: ${studentId}`);
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where: { studentId } }),
      prisma.booking.findMany({
        where: { studentId },
        skip,
        take: limit,
        include: { tutor: { select: { name: true, email: true } } },
        orderBy: { startTime: 'asc' }
      })
    ]);
    console.log(`API [GET /my-bookings] found ${bookings.length} bookings for Student ID: ${studentId}`);
    res.json(paginatedResponse(bookings, page, limit, total));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tutor bookings
router.get('/tutor-bookings', authenticate, authorize(['TUTOR']), async (req: any, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    console.log(`API [GET /tutor-bookings] called by Tutor ID: ${req.user.id}`);
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where: { tutorId: req.user.id } }),
      prisma.booking.findMany({
        where: { tutorId: req.user.id },
        skip,
        take: limit,
        include: { student: { select: { name: true, email: true } } },
        orderBy: { startTime: 'asc' }
      })
    ]);
    console.log(`API [GET /tutor-bookings] found ${bookings.length} bookings for Tutor ID: ${req.user.id}`);
    res.json(paginatedResponse(bookings, page, limit, total));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: any, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = req.user.role === 'TUTOR'
      ? { tutorId: req.user.id }
      : req.user.role === 'STUDENT'
        ? { studentId: req.user.id }
        : {};

    const include = req.user.role === 'TUTOR'
      ? { student: { select: { name: true, email: true } } }
      : { tutor: { select: { name: true, email: true } } };

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include,
        orderBy: { startTime: 'asc' }
      })
    ]);

    res.json(paginatedResponse(bookings, page, limit, total));
  } catch (error) {
    console.error("Fetch bookings error:", error);
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
