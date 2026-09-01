import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middlewire.js";
import {
  listPanels,
  getPanel,
  upsertPanel,
  createAccession,
  createCollectionLabel,
  getCollectionSheet,
  receiveSpecimen,
  searchAccessions,
  getAccession,
  updateReferral,
  getReport,
  listReports,
  saveReportValues,
  submitReport,
  verifyReport,
  sendToDoctor,
  rejectReport,
  saveDoctorRemarks,
  finalVerifyReport,
  returnToTechnician,
  releaseReport,
  listMyReports,
  getMyReport,
} from "../controllers/pathology.controller.js";

/**
 * Mounted at /pathology -- the in-house reporting workflow.
 * Distinct from /labs (partner lab directory) and /lab/order (customer
 * bookings), which are untouched.
 *
 * Three stages, each gated by a permission and again in the controller:
 *   data entry operator  -> submit          (pathology.report.submit)
 *   lab technician       -> verify / send-to-doctor / reject
 *                                           (pathology.report.verify)
 *   doctor / pathologist -> remarks / final-verify / return
 *                                           (pathology.report.doctor)
 *   release to patient   -> release          (pathology.report.release)
 */
const router = express.Router();

/* ---------- catalogue (analytes + reference ranges) ---------- */
router.get("/panels", authenticate, authorize("pathology.catalog.read"), listPanels);
router.get("/panels/:id", authenticate, authorize("pathology.catalog.read"), getPanel);
router.post("/panels", authenticate, authorize("pathology.catalog.manage"), upsertPanel);
router.put("/panels/:id", authenticate, authorize("pathology.catalog.manage"), upsertPanel);

/* ---------- specimens / accession + barcode ---------- */
router.post("/accessions", authenticate, authorize("pathology.accession.create"), createAccession);

// Pre-collection: mint the accession + barcode label for a booked lab order,
// before the sample exists, so the RM rider carries a scannable collection sheet.
router.post(
  "/accessions/collection-label",
  authenticate,
  authorize("pathology.collection.label"),
  createCollectionLabel
);

// Rider / lab: the collection sheet resolved by scanning the label barcode.
router.get(
  "/collection/:accessionNo",
  authenticate,
  authorize("pathology.collection.read"),
  getCollectionSheet
);

router.get("/accessions", authenticate, authorize("pathology.accession.read"), searchAccessions);

// Lab receiving bench: confirm the returned specimen -> creates the draft report.
router.post(
  "/accessions/:accessionNo/receive",
  authenticate,
  authorize("pathology.accession.receive"),
  receiveSpecimen
);

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

/* ---------- patient / user: own released reports only ---------- */
router.get("/my-reports", authenticate, listMyReports);
router.get("/my-reports/:id", authenticate, getMyReport);

/* ---------- report workflow (staff) ---------- */
router.get("/reports", authenticate, authorize("pathology.report.read"), listReports);
router.get("/reports/:id", authenticate, authorize("pathology.report.read"), getReport);

// Data entry: enter values, then send to the lab technician. saveReportValues
// also lets a technician correct values in place; the role split is enforced
// inside the controller.
router.patch("/reports/:id/values", authenticate, authorize("pathology.report.enter"), saveReportValues);
router.post("/reports/:id/submit", authenticate, authorize("pathology.report.submit"), submitReport);

// Lab technician gates.
router.post("/reports/:id/verify", authenticate, authorize("pathology.report.verify"), verifyReport);
router.post("/reports/:id/send-to-doctor", authenticate, authorize("pathology.report.verify"), sendToDoctor);
router.post("/reports/:id/reject", authenticate, authorize("pathology.report.verify"), rejectReport);

// Doctor / pathologist gates.
router.post("/reports/:id/doctor-remarks", authenticate, authorize("pathology.report.doctor"), saveDoctorRemarks);
router.post("/reports/:id/final-verify", authenticate, authorize("pathology.report.doctor"), finalVerifyReport);
router.post("/reports/:id/return", authenticate, authorize("pathology.report.doctor"), returnToTechnician);

// Release to the patient (technician / doctor / admin).
router.post("/reports/:id/release", authenticate, authorize("pathology.report.release"), releaseReport);
// Back-compat alias for the pre-3-stage client.
router.post("/reports/:id/send", authenticate, authorize("pathology.report.release"), releaseReport);

export default router;
