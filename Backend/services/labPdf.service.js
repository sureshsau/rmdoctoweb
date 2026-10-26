import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import ejs from "ejs";
import pdf from "html-pdf-node";
import bwipjs from "bwip-js";
import converter from "number-to-words";

import PathologyReport from "../models/lab/pathologyReport.model.js";
import Accession from "../models/lab/accession.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import LabTest from "../models/lab/labTest.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-read logo icon as base64 for embedding
const getLogoBase64 = () => {
  try {
    const logoPath = path.join(__dirname, "../views/icon.png");
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error("Could not read logo icon:", err.message);
  }
  return null;
};

// Generate barcode image as base64 PNG
const generateBarcodeBase64 = async (text) => {
  if (!text) return null;
  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: String(text),
      scale: 2,
      height: 10,
      includetext: true,
      textxalign: "center",
      textsize: 8
    });
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.error(`Barcode generation failed for ${text}:`, err.message);
    return null;
  }
};

const formatDate = (date) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return String(date);
  }
};

/**
 * Live-generate pathology lab test report PDF in memory from MongoDB
 */
export const generatePathologyReportPdf = async ({ reportId, orderId }) => {
  let report = null;
  let accession = null;
  let order = null;

  if (reportId) {
    report = await PathologyReport.findById(reportId).lean();
    if (report?.accession) {
      accession = await Accession.findById(report.accession).lean();
      if (accession?.labOrder) {
        order = await LabOrder.findById(accession.labOrder).lean();
      }
    }
  } else if (orderId) {
    order = await LabOrder.findById(orderId).populate("items.testId").lean();
    if (!order) {
      throw new Error("Lab order not found");
    }

    if (order.accession) {
      accession = await Accession.findById(order.accession).lean();
      if (accession) {
        report = await PathologyReport.findOne({ accession: accession._id }).lean();
      }
    }

    // Fallback: search accession by labOrder ID
    if (!report) {
      accession = await Accession.findOne({ labOrder: order._id }).lean();
      if (accession) {
        report = await PathologyReport.findOne({ accession: accession._id }).lean();
      }
    }
  }

  // If there's an order without a pathology report yet (e.g. preliminary booking summary)
  if (!report && order) {
    report = {
      reportNo: `BOOK-${order._id.toString().slice(-6).toUpperCase()}`,
      accessionNo: accession?.accessionNo || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      status: order.orderStatus,
      panels: (order.items || []).map((it) => ({
        name: it.testId?.name || "Diagnostic Test",
        code: it.testId?.shortCode || "TEST",
        category: it.testId?.category || "Diagnostics",
        method: "",
        sampleType: it.testId?.sampleType || "Blood",
        results: []
      })),
      doctorRemarks: order.cancelledReason ? `Cancelled: ${order.cancelledReason}` : ""
    };
  }

  if (!report) {
    throw new Error("Report not found for this test order");
  }

  const patient = accession?.patient || {
    name: order?.collectionAddress?.fullName || "Patient",
    age: "",
    sex: "",
    phone: order?.collectionAddress?.phone || "",
    address: `${order?.collectionAddress?.addressLine1 || ""} ${order?.collectionAddress?.pincode || ""}`.trim(),
    rmdId: "",
    referringDoctor: accession?.referringDoctor || "SELF"
  };

  const dates = {
    collectedAt: formatDate(accession?.collectedAt || order?.scheduledAt),
    receivedAt: formatDate(accession?.receivedAt || order?.createdAt),
    sentAt: formatDate(report.sentAt || report.updatedAt || new Date())
  };

  const logoBase64 = getLogoBase64();
  const accessionBarcode = await generateBarcodeBase64(report.accessionNo || "RMDL001");
  const reportBarcode = await generateBarcodeBase64(report.reportNo || "RMDR001");

  const templatePath = path.join(__dirname, "../views/labReport.ejs");
  const html = await ejs.renderFile(templatePath, {
    report,
    patient,
    dates,
    logoBase64,
    accessionBarcode,
    reportBarcode
  });

  const pdfBuffer = await pdf.generatePdf(
    { content: html },
    {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    }
  );

  return {
    pdfBuffer,
    fileName: `LabReport_${(report.reportNo || "Report").replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`
  };
};

/**
 * Live-generate lab order invoice PDF in memory from MongoDB
 */
export const generateLabOrderInvoicePdf = async ({ orderId }) => {
  const order = await LabOrder.findById(orderId)
    .populate("userId", "name email phone")
    .populate("items.testId", "name shortCode pricing")
    .lean();

  if (!order) {
    throw new Error("Lab order not found");
  }

  const invoiceNo = `L-INV-${order._id.toString().slice(-6).toUpperCase()}`;
  const orderNo = order._id.toString().slice(-6).toUpperCase();

  const seller = {
    name: "RMDOCTO, RMIA HEALTH CARE (OPC) PRIVATE LIMITED",
    address: "50/G/2, Ground Square Apartment, Churaman Chowdhury Lane, Berhampore, Murshidabad, West Bengal - 742101",
    gstin: "19AAMCR0757N1ZN",
    mobile: "9434347825",
    email: "info@rmdocto.in",
    place: "West Bengal"
  };

  const customer = {
    name: order.collectionAddress?.fullName || order.userId?.name || "Customer",
    address: `${order.collectionAddress?.addressLine1 || ""} ${order.collectionAddress?.pincode || ""}`.trim() || "West Bengal",
    phone: order.collectionAddress?.phone || order.userId?.phone || "—",
    place: "India"
  };

  const invoice = {
    no: invoiceNo,
    date: new Date().toLocaleDateString("en-IN"),
    orderNo: orderNo,
    orderDate: new Date(order.createdAt).toLocaleDateString("en-IN")
  };

  const items = (order.items || []).map((item) => ({
    name: item.testId?.name || "Diagnostic Lab Test",
    qty: item.quantity || 1,
    price: item.unitPrice || 0
  }));

  const pricing = {
    subtotal: order.pricing?.subtotal || items.reduce((acc, it) => acc + it.price * it.qty, 0),
    homeCollectionCharge: order.pricing?.homeCollectionCharge || 0,
    gstTotal: order.pricing?.gstTotal || 0,
    payableAmount: order.pricing?.payableAmount || 0
  };

  const totalCalculated = Math.round(pricing.payableAmount);
  let amountWords = "ZERO";
  try {
    amountWords = converter.toWords(totalCalculated).toUpperCase();
  } catch {
    amountWords = String(totalCalculated);
  }

  const logoBase64 = getLogoBase64();
  const invoiceBarcode = await generateBarcodeBase64(invoiceNo);
  const orderBarcode = await generateBarcodeBase64(orderNo);

  const templatePath = path.join(__dirname, "../views/labInvoice.ejs");
  const html = await ejs.renderFile(templatePath, {
    seller,
    customer,
    invoice,
    items,
    pricing,
    amountWords,
    serviceType: "Diagnostic Pathology & Health Testing",
    collectionType: order.collectionType === "HOME" ? "Home Collection" : "Walk-In Lab Visit",
    paymentMode: order.paymentMode || "COD",
    paymentStatus: order.paymentStatus || "PENDING",
    logoBase64,
    invoiceBarcode,
    orderBarcode
  });

  const pdfBuffer = await pdf.generatePdf(
    { content: html },
    {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    }
  );

  return {
    pdfBuffer,
    fileName: `Invoice_${orderNo}.pdf`
  };
};
