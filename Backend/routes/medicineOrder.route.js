import express from 'express';
import { authenticate, authorize, isAdminOrSubadmin } from '../middlewares/auth.middlewire.js';
import { createMedicineOrderMiddleware, createOrderForCustomerMiddleware } from '../validator/medicine/medicineOrder.validator.js';
import {
  assignDeliveryPartnerController,
  createOrderForCustomerController,
  createRazorpayMedicineOrder,
  lookupCustomerController,
  searchCommunityPartnersForStaffOrderController,
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
  getCommunityPartnerDownlineOrderStatsController,
  getBlockCoordinatorNetworkOrderStatsController,
  getCommunityPartnerOrderAlertsController
} from '../controllers/orderStats.controller.js';


const router = express.Router();

// ---------- STATIC ROUTES FIRST ----------

// ── ORDER STATS ───────────────────────────────────────────────────────────────
// Admin/Subadmin: Medicine orders by a specific user
// GET /stats/user/:userId?range=month
// GET /stats/user/:userId?range=custom&from=2026-01-01&to=2026-03-31
router.get('/stats/user/:userId', authenticate, isAdminOrSubadmin, getOrdersByUserController);

// CommunityPartner: Orders across entire downline tree
// GET /stats/community-partner/downline?range=week
router.get('/stats/community-partner/downline', authenticate, getCommunityPartnerDownlineOrderStatsController);

// Block Coordinator: Orders across all assigned community_partners
// GET /stats/block-coordinator/network?range=today
router.get('/stats/block-coordinator/network', authenticate, getBlockCoordinatorNetworkOrderStatsController);

// Admin / Block Coordinator: community_partner follow-up list with order value + contact details
// GET /stats/community-partner-alerts?range=month&lowThreshold=5000
// Controller scopes the result: admin sees all community_partners, block coordinator sees only theirs
router.get('/stats/community-partner-alerts', authenticate, getCommunityPartnerOrderAlertsController);

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

// Admin / Receptionist: pick an community_partner to place an order for (community_partner pricing)
router.get(
  '/for-customer/community_partners',
  authenticate,
  authorize('medicineOrder.create.forCustomer'),
  searchCommunityPartnersForStaffOrderController
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
router.patch('/assign-delivery_partner/:orderId', authenticate, authorize('medicineOrder.assign.rider'), assignDeliveryPartnerController);

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