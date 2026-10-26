// controllers/labOrder.controller.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import pdf from "html-pdf-node";
import converter from "number-to-words";
import { fileURLToPath } from 'url';
import LabOrder from "../models/lab/labOrder.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  createLabOrder,
  getUserLabOrdersOverview,
  getLabOrderDetails,
  getAllLabOrdersOverview,
  updateLabOrderStatusService,
  verifyLabOtpService,
  assignCollectionCommunityPartnerService,
  uploadPrescriptionService,
  getPrescriptionService,
  deletePrescriptionService,
  uploadLabReportService,
  createRazorpayLabOrderService,
  verifyRazorpayLabPaymentService,
  getAssignedLabOrdersForRiderService
} from "../services/labOrder.service.js";
import { cleanupUploadedFile } from "../utils/cleanupUploadedFile.js";

/* ═══════════════════════════════════════════════
   PLACE BOOKING
═══════════════════════════════════════════════ */
export const bookLabOrderController = async (req, res) => {
  try {
    const user = req.user;
    const { labId, items, collectionType, collectionAddress, scheduledAt, paymentMode } = req.body;

    const result = await createLabOrder({
      user,
      userId:            user.id,
      labId,
      items,
      collectionType,
      collectionAddress,
      scheduledAt,
      paymentMode
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("bookLabOrderController:", error);
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   USER — OWN ORDERS OVERVIEW
═══════════════════════════════════════════════ */
export const getMyLabOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await getUserLabOrdersOverview({ userId, page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   SINGLE ORDER DETAILS
═══════════════════════════════════════════════ */
export const getLabOrderDetailsController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const requester   = { id: req.user.id, roles: req.user.roles };

    const order = await getLabOrderDetails({ orderId, requester });
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   ADMIN — ALL ORDERS
═══════════════════════════════════════════════ */
export const getAllLabOrdersController = async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      paymentMode,
      collectionType,
      userId,
      labId,
      collectionCommunityPartnerId,
      fromDate,
      toDate,
      page  = 1,
      limit = 20
    } = req.query;

    const result = await getAllLabOrdersOverview({
      filters: { orderStatus, paymentStatus, paymentMode, collectionType, userId, labId, collectionCommunityPartnerId, fromDate, toDate },
      page,
      limit
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   GET ASSIGNED RIDER LAB ORDERS
═══════════════════════════════════════════════ */
export const getAssignedLabOrdersForRiderController = async (req, res) => {
  try {
    const riderId = req.user._id || req.user.id;
    const orders = await getAssignedLabOrdersForRiderService(riderId);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   UPDATE ORDER STATUS
═══════════════════════════════════════════════ */
export const updateLabOrderStatusController = async (req, res) => {
  try {
    const { orderId }                       = req.params;
    const { newStatus = "", cancelReason = "" } = req.body;

    if (!newStatus) {
      return res.status(400).json({ success: false, message: "newStatus is required" });
    }

    const updated = await updateLabOrderStatusService({
      orderId,
      newStatus,
      cancelReason,
      requester: req.user
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${updated.orderStatus}`,
      data: updated
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   OTP VERIFY (sample collection)
═══════════════════════════════════════════════ */
export const verifyLabOtpController = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    if (!orderId || !otp) {
      return res.status(400).json({ success: false, message: "orderId and otp are required" });
    }

    const result = await verifyLabOtpService({
      orderId,
      otp,
      requester: { id: req.user.id || req.user._id, roles: req.user.roles }
    });

    return res.status(200).json({ success: true, message: "Sample collection confirmed", data: result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   ASSIGN COLLECTION AGENT
═══════════════════════════════════════════════ */
export const assignCollectionCommunityPartnerController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId }  = req.body;

    const updated = await assignCollectionCommunityPartnerService({
      orderId,
      communityPartnerUserId: userId,
      requester:   req.user
    });

    return res.status(200).json({
      success: true,
      message: "Collection community_partner assigned successfully",
      data: updated
    });
  } catch (error) {
    console.error("assignCollectionCommunityPartnerController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — UPLOAD
═══════════════════════════════════════════════ */
export const uploadPrescriptionController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Prescription file is required" });
    }

    const result = await uploadPrescriptionService({
      orderId,
      requester: req.user,
      file:      req.file
    });

    return res.status(200).json({ success: true, message: "Prescription uploaded successfully", data: result });
  } catch (error) {
    console.error("uploadPrescriptionController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    await cleanupUploadedFile(req);
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — VIEW
═══════════════════════════════════════════════ */
export const getPrescriptionController = async (req, res) => {
  try {
    const result = await getPrescriptionService({
      orderId:   req.params.orderId,
      requester: req.user
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 404).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   PRESCRIPTION — DELETE
═══════════════════════════════════════════════ */
export const deletePrescriptionController = async (req, res) => {
  try {
    await deletePrescriptionService({
      orderId:   req.params.orderId,
      requester: req.user
    });
    return res.status(200).json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════
   REPORT UPLOAD (admin)
═══════════════════════════════════════════════ */
export const uploadLabReportController = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Report file is required" });
    }

    const result = await uploadLabReportService({
      orderId,
      requester: req.user,
      file:      req.file
    });

    return res.status(200).json({ success: true, message: "Report uploaded successfully", data: result });
  } catch (error) {
    console.error("uploadLabReportController:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  } finally {
    await cleanupUploadedFile(req);
  }
};

/* ═══════════════════════════════════════════════
   RAZORPAY — CREATE
═══════════════════════════════════════════════ */
export const createRazorpayLabOrderController = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const data = await createRazorpayLabOrderService({ orderId, user: req.user });
    return res.status(200).json({ success: true, message: "Razorpay order created", data });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════
   RAZORPAY — VERIFY
═══════════════════════════════════════════════ */
export const verifyRazorpayLabPaymentController = async (req, res, next) => {
  try {
    const result = await verifyRazorpayLabPaymentService(req.body);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════
   DOWNLOAD LAB INVOICE
═══════════════════════════════════════════════ */
export const downloadLabInvoiceController = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await LabOrder.findById(orderId)
      .populate("userId", "name phone")
      .populate("items.testId", "name shortCode")
      .populate("accession", "accessionNo")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Role check (Admin, Subadmin, Receptionist, or the Owner)
    const requesterId = req.user.id || req.user._id;
    const isAdmin = req.user.roles?.some(role => ["admin", "subadmin", "receptionist"].includes(role));

    if (order.userId._id.toString() !== requesterId.toString() && !isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Not allowed to view this invoice" });
    }

    const invoiceNo = `LAB-INV-${order._id.toString().slice(-6).toUpperCase()}`;
    const orderNo = `ORD-${order._id.toString().slice(-6).toUpperCase()}`;

    const data = {
      seller: {
        name: "RMDOCTO,RMIA HEALTH CARE (OPC) PRIVATE LIMITED",
        address: "50/G/2, Ground Square Apartment, Churaman Chowdhury Lane, Berhampore, Murshidabad, West Bengal - 742101",
        gstin: "19AAMCR0757N1ZN",
        mobile: "9434347825",
        email: "info@rmdocto.in",
        place: "West Bengal"
      },
      customer: {
        name: order.userId.name || "Customer",
        address: order.collectionAddress ? `${order.collectionAddress.addressLine1} ${order.collectionAddress.addressLine2 || ''} - ${order.collectionAddress.pincode}` : "N/A",
        phone: order.userId.phone || (order.collectionAddress ? order.collectionAddress.phone : "N/A"),
        userPhone: order.userId.phone || "N/A",
        place: "India"
      },
      invoice: {
        no: order.accession?.accessionNo || invoiceNo,
        date: new Date().toLocaleDateString("en-IN"),
        orderNo: orderNo,
        orderDate: new Date(order.createdAt).toLocaleDateString("en-IN")
      },
      items: order.items.map(item => ({
        name: item.testId ? item.testId.name : "Lab Test",
        hsn: "N/A",
        qty: item.quantity,
        price: item.unitPrice,
        tax: item.gstPercentage || 0,
        discount: 0
      })),
      shipping: order.pricing?.homeCollectionCharge || 0,
      paymentMode: order.paymentMode
    };

    // Read the logo as base64 for embedding in PDF
    const logoPath = path.join(__dirname, "../views/icon.png");
    let logoBase64 = null;
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (err) {
      console.error("Could not read logo icon:", err.message);
    }
    data.logoBase64 = logoBase64;

    // Generate barcodes as base64 PNG images
    const { default: bwipjs } = await import('bwip-js');

    // Barcode for Label (Accession No) or Invoice No fallback
    let invoiceBarcodeBase64 = null;
    const barcodeText1 = order.accession?.accessionNo || invoiceNo;
    try {
      const invoiceBarcodePng = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeText1,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center',
        textsize: 8
      });
      invoiceBarcodeBase64 = `data:image/png;base64,${invoiceBarcodePng.toString('base64')}`;
    } catch (err) {
      console.error("Invoice barcode generation failed:", err.message);
    }
    data.invoiceBarcode = invoiceBarcodeBase64;

    // Barcode for Order No
    let orderBarcodeBase64 = null;
    try {
      const orderBarcodePng = await bwipjs.toBuffer({
        bcid: 'code128',
        text: orderNo,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center',
        textsize: 8
      });
      orderBarcodeBase64 = `data:image/png;base64,${orderBarcodePng.toString('base64')}`;
    } catch (err) {
      console.error("Order barcode generation failed:", err.message);
    }
    data.orderBarcode = orderBarcodeBase64;

    const subtotal = data.items.reduce((acc, item) => {
      const taxable = item.qty * item.price;
      const taxAmount = taxable * (item.tax / 100);
      return acc + taxable + taxAmount;
    }, 0);

    const totalCalculated = Math.round(subtotal + data.shipping);
    data.amountWords = converter.toWords(totalCalculated).toUpperCase();

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/invoice.ejs"),
      data
    );

    const puppeteer = (await import("puppeteer")).default;
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const hasMacChrome = fs.existsSync(macPath);
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(hasMacChrome ? { executablePath: macPath } : {})
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${orderId}.pdf`);

    return res.end(pdfBuffer);

  } catch (error) {
    console.error("PDF Generate Error:", error);
    next(error);
  }
};
