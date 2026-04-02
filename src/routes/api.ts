import { Router } from 'express';
import { getProducts, addProduct } from '../controllers/productsController';
import { createOrder, getOrders, updateOrderStatus, getClients, exportOrdersCSV, getStats } from '../controllers/ordersController';
import { login, signup, forgotPassword, updatePassword, logout } from '../controllers/authController';
import { authenticateJWT, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/products', getProducts);
router.post('/orders', createOrder);
router.post('/auth/login', login);
router.post('/auth/register', signup);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/update-password', authenticateJWT, updatePassword);
router.post('/auth/logout', logout);

// Admin routes (JWT + Admin role required)
router.use('/admin', authenticateJWT, authorizeAdmin);

router.get('/admin/orders', getOrders);
router.get('/admin/stats', getStats);
router.patch('/admin/orders/:id/status', updateOrderStatus);
router.post('/admin/products', addProduct);
router.get('/admin/clients', getClients);
router.get('/admin/export/csv', exportOrdersCSV);

export default router;
