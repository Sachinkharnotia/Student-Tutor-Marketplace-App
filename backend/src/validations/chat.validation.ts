import { z } from 'zod';

export const getChatMessagesSchema = z.object({
  params: z.object({
    roomId: z.string().uuid('Invalid room ID format (must be a valid UUID booking ID)'),
  }),
  query: z.object({
    page: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Page must be at least 1').optional()),
    limit: z.preprocess((val) => (val === undefined || val === '' ? undefined : Number(val)), z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional()),
  }),
});
