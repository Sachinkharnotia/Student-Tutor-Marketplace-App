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

const isPdf = (filename: string, mimetype: string) => {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return ext === '.pdf' || mimetype === 'application/pdf';
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
    const url = req.file.path;
    res.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download proxy endpoint - fetches Cloudinary file and serves it with download headers
router.get('/download', authenticate, async (req: any, res) => {
  try {
    const fileUrl = req.query.url as string;
    if (!fileUrl) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Only allow Cloudinary URLs for security
    if (!fileUrl.includes('cloudinary.com') && !fileUrl.includes('res.cloudinary.com')) {
      return res.status(403).json({ error: 'Only Cloudinary file downloads are allowed' });
    }

    // Extract filename from URL
    const urlParts = fileUrl.split('/');
    let filename = urlParts[urlParts.length - 1].split('?')[0];
    // Clean up Cloudinary public_id timestamps
    filename = decodeURIComponent(filename);

    // Fetch the file from Cloudinary
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch file from storage' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream the response body to the client
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Download proxy error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
