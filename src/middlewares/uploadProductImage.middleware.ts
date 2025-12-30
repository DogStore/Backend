// middlewares/uploadProductImages.middleware.ts
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadProductImage = upload.fields([
  { name: 'images', maxCount: 10 },  
  { name: 'countryFlag', maxCount: 1 } 
]);