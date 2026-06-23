import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    tutorId: z.string().uuid('Invalid tutor ID format (must be a UUID)'),
    startTime: z.string().datetime({ message: 'Start time must be a valid ISO datetime string' }),
    endTime: z.string().datetime({ message: 'End time must be a valid ISO datetime string' }),
    amount: z.number().positive('Booking amount must be positive'),
  }).refine((data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end.getTime() > start.getTime();
  }, {
    message: 'End time must be after start time',
    path: ['endTime']
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID format (must be a UUID)'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID format (must be a UUID)'),
    razorpayPaymentId: z.string().trim().min(1, 'Razorpay Payment ID is required'),
    razorpayOrderId: z.string().trim().min(1, 'Razorpay Order ID is required'),
    razorpaySignature: z.string().trim().min(1, 'Razorpay Signature is required'),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    page: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Page must be at least 1').optional()),
    limit: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional()),
  }),
});

export const completeBookingSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID format (must be a UUID)'),
  }),
});

export const rateBookingSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID format (must be a UUID)'),
    rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().optional(),
  }),
});
