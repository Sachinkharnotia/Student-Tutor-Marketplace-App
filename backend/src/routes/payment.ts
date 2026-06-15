import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// Create Order
router.post('/create-order', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const { tutorId, startTime, endTime, amount } = req.body;

    // Create a pending booking first
    const booking = await prisma.booking.create({
      data: {
        studentId: req.user.id,
        tutorId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        amount,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "USD",
      receipt: booking.id,
    };
    
    const order = await razorpay.orders.create(options);

    res.json({ order, bookingId: booking.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify Payment
router.post('/verify', authenticate, authorize(['STUDENT']), async (req: any, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment is successful, update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentId: razorpay_payment_id
        }
      });
      res.json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

export default router;
