import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { getAvailabilitySchema, setAvailabilitySchema } from '../validations/tutor.validation';

const router = Router();

// Get availability for a tutor (publicish, if we have tutor ID)
router.get('/:tutorId', authenticate, validate(getAvailabilitySchema), async (req, res) => {
  try {
    const tutorId = req.params.tutorId as string;
    const availabilities = await prisma.availability.findMany({
      where: { tutorId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json(availabilities);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set availability for the logged-in tutor
router.post('/', authenticate, authorize(['TUTOR']), validate(setAvailabilitySchema), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { availabilities } = req.body; // Array of { dayOfWeek, startTime, endTime }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId }
    });

    if (!tutorProfile) return res.status(404).json({ error: 'Tutor profile not found' });

    // Transaction to replace all availabilities
    await prisma.$transaction([
      prisma.availability.deleteMany({
        where: { tutorId: tutorProfile.id }
      }),
      prisma.availability.createMany({
        data: availabilities.map((a: any) => ({
          tutorId: tutorProfile.id,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime
        }))
      })
    ]);

    const newAvailabilities = await prisma.availability.findMany({
      where: { tutorId: tutorProfile.id },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({ message: 'Availability updated successfully', availabilities: newAvailabilities });
  } catch (error) {
    console.error("Error setting availability:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
