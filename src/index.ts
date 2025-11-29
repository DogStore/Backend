import express from 'express';
import 'dotenv/config';
import ConnectDB from '../configs/db.config.js'
import authRoute from '../routes/auth/auth.route.js'

const app = express();
const PORT = process.env.PORT || 3001;

// Accept JSON input
// Middleware
app.use(express.json());

// Connect with database
await ConnectDB;

// connect with routes

app.use("/api/auth", authRoute)
// app.use('/api/admin/categories', adminCategoryRoutes); // add this after

app.get('/', (req, res) => res.send('Doghub API Running'));

// Start server
app.listen(PORT, () => {
    console.log(`App is working on PORT ${PORT}`);
});

