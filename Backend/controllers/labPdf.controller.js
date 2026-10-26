import mongoose from "mongoose";
import { generatePathologyReportPdf, generateLabOrderInvoicePdf } from "../services/labPdf.service.js";
import LabOrder from "../models/lab/labOrder.model.js";
import Accession from "../models/lab/accession.model.js";
import PathologyReport from "../models/lab/pathologyReport.model.js";

/**
 * Controller to download/stream live generated test report PDF
 * Works for both:
 * GET /lab/order/:orderId/report-pdf
 * GET /pathology/reports/:id/pdf
 */
export const downloadLabReportPdfController = async (req, res, next) => {
  try {
    const { orderId, id } = req.params;

    let targetOrderId = orderId;
    let targetReportId = id;

    // Validate ID formats if present
    if (targetOrderId && !mongoose.Types.ObjectId.isValid(targetOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (targetReportId && !mongoose.Types.ObjectId.isValid(targetReportId)) {
      return res.status(400).json({ success: false, message: "Invalid report ID" });
    }

    // Role / ownership checks if user is logged in
    if (req.user) {
      const requesterId = req.user.id || req.user._id;
      const isAdminOrStaff = req.user.roles?.some((r) =>
        ["admin", "subadmin", "receptionist", "typist", "lab_technician", "doctor"].includes(r)
      );

      if (!isAdminOrStaff) {
        // Patient check: must be owner of the order or accession
        if (targetOrderId) {
          const ord = await LabOrder.findById(targetOrderId).select("userId");
          if (ord && String(ord.userId) !== String(requesterId)) {
            return res.status(403).json({ success: false, message: "Forbidden: Not your test order" });
          }
        } else if (targetReportId) {
          const rep = await PathologyReport.findById(targetReportId).select("accession status");
          if (rep && rep.status !== "released") {
            return res.status(403).json({ success: false, message: "Report is not released yet" });
          }
          if (rep?.accession) {
            const acc = await Accession.findById(rep.accession).select("patientUser");
            if (acc?.patientUser && String(acc.patientUser) !== String(requesterId)) {
              return res.status(403).json({ success: false, message: "Forbidden: Not your report" });
            }
          }
        }
      }
    }

    const { pdfBuffer, fileName } = await generatePathologyReportPdf({
      reportId: targetReportId,
      orderId: targetOrderId
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("downloadLabReportPdfController error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate report PDF" });
  }
};

/**
 * Controller to download/stream live generated lab order invoice PDF
 * GET /lab/order/:orderId/invoice
 */
export const downloadLabOrderInvoiceController = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await LabOrder.findById(orderId).select("userId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Lab order not found" });
    }

    if (req.user) {
      const requesterId = req.user.id || req.user._id;
      const isAdminOrStaff = req.user.roles?.some((r) =>
        ["admin", "subadmin", "receptionist"].includes(r)
      );

      if (String(order.userId) !== String(requesterId) && !isAdminOrStaff) {
        return res.status(403).json({ success: false, message: "Forbidden: Not allowed to view this invoice" });
      }
    }

    const { pdfBuffer, fileName } = await generateLabOrderInvoicePdf({ orderId });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("downloadLabOrderInvoiceController error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate invoice PDF" });
  }
};
