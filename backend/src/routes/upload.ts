import { Router } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { authenticate } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isImage = (filename: string, mimetype: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return imageExtensions.includes(ext) || mimetype.startsWith('image/');
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const filename = file.originalname;
    const mimetype = file.mimetype;
    
    const image = isImage(filename, mimetype);
    const lastDotIndex = filename.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const baseName = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return {
      folder: 'student-tutor-marketplace-assets',
      resource_type: image ? 'auto' : 'raw',
      public_id: image 
        ? `${cleanBaseName}-${Date.now()}` 
        : `${cleanBaseName}-${Date.now()}${ext}`,
    };
  },
});

const upload = multer({ storage: storage });

// Upload endpoint
router.post('/', authenticate, upload.single('file'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    let url = req.file.path;

    // For raw files, make the URL downloadable by adding fl_attachment
    // Raw Cloudinary URLs look like: .../raw/upload/v123/folder/file.pdf
    // We insert fl_attachment after /upload/ so it becomes: .../raw/upload/fl_attachment/v123/folder/file.pdf
    if (url.includes('/raw/upload/')) {
      url = url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
    }

    res.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
