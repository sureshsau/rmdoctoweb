import express from 'express';
import { authenticate, authorize, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';
import { createMedicineOrderMiddleware, createOrderForCustomerMiddleware } from '../validator/medicine/medicineOrder.validator.js';
import {
  assignRMRiderController,
  createOrderForCustomerController,
  createRazorpayMedicineOrder,
  lookupCustomerController,
  getAllMedicineOrdersController,
  getAssignedOrdersForRider,
  getMedicineOrderDetailsController,
  getMedicineOrdersOverviewController,
  orderMedicine,
  updateOrderStatusController,
  verifyOnlinePaymentController,
  verifyOrderOtpController,
  downloadInvoiceController
} from '../controllers/medicineOrderController.js';
import {
  getOrdersByUserController,
  getAgentDownlineOrderStatsController,
  getMarketingAgentNetworkOrderStatsController,
  getAgentOrderAlertsController
} from '../controllers/orderStats.controller.js';


const router = express.Router();

// ---------- STATIC ROUTES FIRST ----------

// ── ORDER STATS ───────────────────────────────────────────────────────────────
// Admin/Subadmin: Medicine orders by a specific user
// GET /stats/user/:userId?range=month
// GET /stats/user/:userId?range=custom&from=2026-01-01&to=2026-03-31
router.get('/stats/user/:userId', authenticate, isAdminOrSubadmin, getOrdersByUserController);

// Agent: Orders across entire downline tree
// GET /stats/agent/downline?range=week
router.get('/stats/agent/downline', authenticate, getAgentDownlineOrderStatsController);

// Marketing Agent: Orders across all assigned agents
// GET /stats/marketing-agent/network?range=today
router.get('/stats/marketing-agent/network', authenticate, getMarketingAgentNetworkOrderStatsController);

// Admin / Marketing Agent: agent follow-up list with order value + contact details
// GET /stats/agent-alerts?range=month&lowThreshold=5000
// Controller scopes the result: admin sees all agents, marketing agent sees only theirs
router.get('/stats/agent-alerts', authenticate, getAgentOrderAlertsController);

// ── EXISTING ROUTES ───────────────────────────────────────────────────────────
// Rider: view assigned orders
router.get('/rider', authenticate, authorize('medicineOrder.read.rider'), getAssignedOrdersForRider);

// Admin: view all orders
router.get('/view/all', authenticate, authorize('medicineOrder.read.all'), getAllMedicineOrdersController);

// Admin / Receptionist: does this phone already belong to a customer?
router.get(
  '/for-customer/lookup',
  authenticate,
  authorize('medicineOrder.create.forCustomer'),
  lookupCustomerController
);

// Admin / Receptionist: place an order on behalf of a customer (name + phone + address)
router.post(
  '/for-customer',
  authenticate,
  authorize('medicineOrder.create.forCustomer'),
  createOrderForCustomerMiddleware,
  createOrderForCustomerController
);

// Verify delivery OTP
router.post('/verify-otp', authenticate, verifyOrderOtpController);

// Razorpay payment
router.post('/payments/razorpay/create', authenticate, createRazorpayMedicineOrder);
router.post('/payments/razorpay/verify', authenticate, verifyOnlinePaymentController);

// Assign RM Rider to an order
router.patch('/assign-rmrider/:orderId', authenticate, authorize('medicineOrder.assign.rider'), assignRMRiderController);

// Update order status
router.patch('/:orderId/status', authenticate, authorize('medicineOrder.status.update'), updateOrderStatusController);

// ---------- MAIN ROUTES ----------

// Place an order
router.post('/', authenticate, createMedicineOrderMiddleware, orderMedicine);

// View own orders overview
router.get('/', authenticate, getMedicineOrdersOverviewController);

// ---------- DYNAMIC ROUTES ALWAYS LAST ----------

// Download invoice
router.get('/:orderId/invoice', authenticate, downloadInvoiceController);

// View single order details
router.get('/:orderId', authenticate, getMedicineOrderDetailsController);

export default router;