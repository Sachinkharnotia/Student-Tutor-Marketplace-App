import { z } from 'zod';

export const studentProfileSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(10, 'Phone number must be at least 10 characters long').max(15, 'Phone number cannot exceed 15 characters'),
  }),
});

export const tutorProfileSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(10, 'Phone number must be at least 10 characters long').max(15, 'Phone number cannot exceed 15 characters').optional().or(z.literal('')),
    kycDocument: z.string().min(1, 'KYC ID Proof Document is compulsory.').refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return lowerVal.endsWith('.pdf') || lowerVal.includes('.pdf?');
      },
      { message: 'Only PDF files are accepted for KYC verification.' }
    ),
    subjects: z.array(z.string().trim().min(1, 'Subject name cannot be empty')).min(1, 'At least one subject must be specified'),
    hourlyRate: z.number().positive('Hourly rate must be a positive number'),
  }),
});

// Time pattern validation for "HH:mm" (e.g. "09:00", "17:30")
const timeStringSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: "Time must be in 'HH:mm' format (e.g., '09:00')",
});

export const setAvailabilitySchema = z.object({
  body: z.object({
    availabilities: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 and 6').max(6, 'Day of week must be between 0 and 6'),
        startTime: timeStringSchema,
        endTime: timeStringSchema,
      }).refine((data) => {
        const [startHour, startMin] = data.startTime.split(':').map(Number);
        const [endHour, endMin] = data.endTime.split(':').map(Number);
        const startTotal = startHour * 60 + startMin;
        const endTotal = endHour * 60 + endMin;
        return endTotal > startTotal;
      }, {
        message: 'End time must be after start time',
        path: ['endTime']
      })
    ).min(1, 'At least one availability slot must be specified'),
  }),
});

export const getAvailabilitySchema = z.object({
  params: z.object({
    tutorId: z.string().uuid('Invalid tutor ID format (must be a UUID)'),
  }),
});

export const getTutorsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    minPrice: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().positive('Minimum price must be positive').optional()),
    maxPrice: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().positive('Maximum price must be positive').optional()),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating_desc']).optional(),
    page: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Page must be at least 1').optional()),
    limit: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional()),
  }),
});
