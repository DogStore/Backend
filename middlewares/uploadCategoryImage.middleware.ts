// middlewares/upload.middleware.ts
import multer from 'multer';

// Use memory storage (file in RAM, not disk) — perfect for Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadCategoryImage = upload.single('image');  // 'image' = field name in form-data