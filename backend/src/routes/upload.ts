import { Router } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'placeholder_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'placeholder_secret',
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'student-tutor-marketplace-assets',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
    }
  })
});

// Upload endpoint
router.post('/', authenticate, upload.single('file'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // req.file.location contains the S3 URL from multer-s3
    res.json({ url: req.file.location });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
