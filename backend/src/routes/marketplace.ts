import { Router } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation.middleware';
import { getTutorsQuerySchema } from '../validations/tutor.validation';

const router = Router();

// Get all verified tutors for the marketplace
router.get('/tutors', authenticate, validate(getTutorsQuerySchema), async (req, res) => {
  try {
    const { search, subject, minPrice, maxPrice, sortBy } = req.query;
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      kycStatus: 'APPROVED',
      user: { isVerified: true }
    };

    if (search) {
      whereClause.user.name = { contains: String(search), mode: 'insensitive' };
    }

    if (subject) {
      whereClause.subjects = { has: String(subject) };
    }

    if (minPrice || maxPrice) {
      whereClause.hourlyRate = {};
      if (minPrice) whereClause.hourlyRate.gte = parseFloat(String(minPrice));
      if (maxPrice) whereClause.hourlyRate.lte = parseFloat(String(maxPrice));
    }

    let orderByClause: any = {};
    if (sortBy === 'price_asc') orderByClause = { hourlyRate: 'asc' };
    else if (sortBy === 'price_desc') orderByClause = { hourlyRate: 'desc' };

    const [total, tutors] = await prisma.$transaction([
      prisma.tutorProfile.count({ where: whereClause }),
      prisma.tutorProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: Object.keys(orderByClause).length ? orderByClause : undefined,
        include: {
          availabilities: true,
          user: {
            select: {
              name: true,
              email: true,
              bookingsAsTutor: {
                select: {
                  review: true
                }
              }
            }
          }
        }
      })
    ]);

    // If sorting by rating, we have to calculate it in memory
    let processedTutors = tutors.map(tutor => {
      const reviews = tutor.user.bookingsAsTutor.map(b => b.review).filter(r => r !== null);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length 
        : 0;
      
      return {
        ...tutor,
        avgRating,
        reviewCount: reviews.length
      };
    });

    if (sortBy === 'rating_desc') {
      processedTutors.sort((a, b) => b.avgRating - a.avgRating);
    }

    res.json({
      data: processedTutors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Fetch tutors error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
