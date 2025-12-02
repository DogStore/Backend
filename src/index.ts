import express from 'express';
import 'dotenv/config';
import ConnectDB from './configs/db.config.js'
import authRoute from './routes/auth/auth.route.js'
import adminCategoryRoutes from './routes/admin/adminCategory.route.js';
import adminProductRoutes from './routes/admin/adminProduct.route.js';
import adminOrderRoutes from './routes/admin/adminOrder.route.js';
import productRoutes from './routes/user/product.route.js'
import cartRoutes from './routes/user/cart.route.js';
import orderRoutes from './routes/user/order.route.js';
import categoryRoutes from './routes/user/category.routes.js'
import wishListRoutes from './routes/user/wishlist.route.js'
import couponRoutes from './routes/admin/adminCoupon.route.js';
import userRoutes from './routes/user/user.route.js'
import adminDashboardRoutes from './routes/admin/adminDashboard.route.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Accept JSON input
// Middleware
app.use(express.json());

// Connect with database
await ConnectDB;

// connect with routes
app.use("/api/auth", authRoute)

// Admin Routhes
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes); // Test later
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);


// Public (User) routes
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes );
app.use('/api/wishLists', wishListRoutes);
app.use('/api/users', userRoutes);


// Start server
app.listen(PORT, () => {
    console.log(`App is working on PORT ${PORT}`);
});

