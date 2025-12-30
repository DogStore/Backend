import express from "express";
import {protect} from '../../middlewares/auth.middleware.js'  
import { uploadUserImage } from '../../middlewares/uploadUserImage.middleware.js';
import { updateUserImage } from '../../controllers/user/user.controller.js';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from "../../controllers/user/user.controller.js";

const router = express.Router();
router.use(protect);

// Get logged-in user profile
router.get("/profile", getUserProfile);

// Update user profile
router.put("/profile", updateUserProfile);

// Delete user account
router.delete("/profile", deleteUserAccount);

router.put('/profile/image', protect, uploadUserImage, updateUserImage);

// ----- Address Management ----- //
router.get("/addresses", getUserAddresses);

router.post("/addresses", addUserAddress);

router.put("/addresses/:addressId", updateUserAddress);

router.delete("/addresses/:addressId", deleteUserAddress);

export default router;
