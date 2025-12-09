// middlewares/uploadProductImages.middleware.ts
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept multiple product images + one flag
export const uploadProductImage = upload.fields([
  { name: 'images', maxCount: 10 },     // product photos
  { name: 'countryFlag', maxCount: 1 } // flag image
]);