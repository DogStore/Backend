// src/routes/admin/user.routes.ts
import { Router } from 'express';
import { protect, admin } from '../../middlewares/auth.middleware.js'
import {createAdminUser, updateAdminUser} from '../../controllers/admin/adminUser.controller.js'

const router = Router();

router.post('/users', protect, admin, createAdminUser);
router.put('/users/:id', protect, admin, updateAdminUser); 

export default router;