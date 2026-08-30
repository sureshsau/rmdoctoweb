import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import {
  listPanels,
  getPanel,
  upsertPanel,
  createAccession,
  searchAccessions,
  getAccession,
  updateReferral,
  getReport,
  listReports,
  saveReportValues,
  submitReport,
  verifyReport,
  rejectReport,
  sendReport,
} from "../controllers/pathology.controller.js";

/**
 * Mounted at /pathology -- the in-house reporting workflow.
 * Distinct from /labs (partner lab directory) and /lab/order (customer
 * bookings), which are untouched.
 */
const router = express.Router();

/* ---------- catalogue (analytes + reference ranges) ---------- */
router.get("/panels", authenticate, authorize("pathology.catalog.read"), listPanels);
router.get("/panels/:id", authenticate, authorize("pathology.catalog.read"), getPanel);
router.post("/panels", authenticate, authorize("pathology.catalog.manage"), upsertPanel);
router.put("/panels/:id", authenticate, authorize("pathology.catalog.manage"), upsertPanel);

/* ---------- specimens / accession + barcode ---------- */
router.post("/accessions", authenticate, authorize("pathology.accession.create"), createAccession);
router.get("/accessions", authenticate, authorize("pathology.accession.read"), searchAccessions);
router.get(
  "/accessions/:accessionNo",
  authenticate,
  authorize("pathology.accession.read"),
  getAccession
);
router.patch(
  "/accessions/:accessionNo/referral/:code",
  authenticate,
  authorize("pathology.accession.update"),
  updateReferral
);

/* ---------- report workflow ---------- */
router.get("/reports", authenticate, authorize("pathology.report.read"), listReports);
router.get("/reports/:id", authenticate, authorize("pathology.report.read"), getReport);

// Typist entry + submit. saveReportValues also lets a technician correct
// values in place; that role split is enforced inside the controller.
router.patch("/reports/:id/values", authenticate, authorize("pathology.report.enter"), saveReportValues);
router.post("/reports/:id/submit", authenticate, authorize("pathology.report.submit"), submitReport);

// Technician-only gates.
router.post("/reports/:id/verify", authenticate, authorize("pathology.report.verify"), verifyReport);
router.post("/reports/:id/reject", authenticate, authorize("pathology.report.verify"), rejectReport);
router.post("/reports/:id/send", authenticate, authorize("pathology.report.send"), sendReport);

export default router;
