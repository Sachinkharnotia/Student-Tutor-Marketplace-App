import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { getChatMessagesSchema } from '../validations/chat.validation';

const router = Router();

// Get paginated message history for a booking room
router.get('/:roomId/messages', authenticate, validate(getChatMessagesSchema), async (req: any, res) => {
  try {
    const { roomId } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // Verify booking room exists and user is part of it (either student, tutor, or admin)
    const booking = await prisma.booking.findUnique({
      where: { id: roomId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    if (booking.studentId !== req.user.id && booking.tutorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to access this chat' });
    }

    const [total, messages] = await prisma.$transaction([
      prisma.message.count({ where: { roomId } }),
      prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' }, // Fetch latest messages first
        skip,
        take: limit,
      }),
    ]);

    // Format and reverse back to chronological order (ascending) for UI rendering
    const chronologicalMessages = messages.reverse().map((message) => ({
      ...message,
      room: message.roomId,
      message: message.content,
    }));

    res.json({
      data: chronologicalMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch chat messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
