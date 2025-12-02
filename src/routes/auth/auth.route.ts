import express from 'express'
import {registerUser, loginUser, logoutUser, getMe, refreshToken} from '../../controllers/auth/auth.controller.js'
import {protect} from '../../middlewares/auth.middleware.js'

const router = express.Router();

// user register
router.post('/register', registerUser)

// user login for both admin and user
router.post('/login', loginUser);

// user logout & remove token
router.post('/logout', protect, logoutUser)

// user logged-in user info
router.get('/me', protect, getMe)

// get new token from refresh token
router.post('/refresh', refreshToken)


export default router;

