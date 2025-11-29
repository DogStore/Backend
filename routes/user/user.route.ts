import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from "../../controllers/user/user.controller";

const router = express.Router();

// Get logged-in user profile
router.get("/profile", getUserProfile);

// Update user profile
router.put("/profile", updateUserProfile);

// Delete user account
router.delete("/profile", deleteUserAccount);

// ----- Address Management ----- //
router.get("/addresses", getUserAddresses);

router.post("/addresses", addUserAddress);

router.put("/addresses/:addressId", updateUserAddress);

router.delete("/addresses/:addressId", deleteUserAddress);

export default router;
