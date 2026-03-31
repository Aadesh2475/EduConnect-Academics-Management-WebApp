import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_URL) {
  console.warn('CLOUDINARY_URL is not defined in environment variables');
}

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL || "cloudinary://123456789012345:dummy_secret@dummy_cloud",
  secure: true
});

export default cloudinary;
