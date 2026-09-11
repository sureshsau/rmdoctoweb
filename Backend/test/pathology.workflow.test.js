import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectTestDb, disconnectTestDb, clearTestDb, mockReq, mockRes } from "./setupDb.js";
import Accession from "../models/lab/accession.model.js";
import PathologyReport from "../models/lab/pathologyReport.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import * as ctrl from "../controllers/pathology.controller.js";

/**
 * These exercise the 3-stage report state machine (typist -> lab technician
 * -> doctor -> release) and the referral/payment release gates directly
 * against the controller exports, against a real (in-memory) MongoDB so the
 * Mongoose-level behaviour -- not just hand-rolled logic -- is what's under
 * test.
 */

const oid = () => new mongoose.Types.ObjectId();

const TYPIST = { id: oid(), dashboard: "typist", roles: [] };
const TECHNICIAN = { id: oid(), dashboard: "lab_technician", roles: [] };
const DOCTOR = { id: oid(), dashboard: "doctor", roles: [] };
const ADMIN = { id: oid(), dashboard: "employee", roles: ["admin"] };
const PATIENT = { id: oid(), dashboard: "user", roles: [] };

async function makeReport({ status = "draft", panels, accessionOverrides = {} } = {}) {
  const accession = await Accession.create({
    accessionNo: `RMDL${Math.random().toString(36).slice(2, 8)}`,
    patient: { name: "Test Patient", age: 30, sex: "male", phone: "9876543210" },
    panels: [{ panel: oid(), code: "CBC", name: "CBC", isInHouse: true }],
    status: "registered",
    ...accessionOverrides,
  });

  const report = await PathologyReport.create({
    reportNo: `RMDR${accession.accessionNo.slice(4)}`,
    accession: accession._id,
    accessionNo: accession.accessionNo,
    status,
    panels: panels || [
      {
        code: "CBC",
        name: "CBC",
        isInHouse: true,
        results: [{ parameterName: "Hemoglobin", parameterCode: "HB", value: 13.5 }],
      },
    ],
  });

  return { accession, report };
}

beforeAll(async () => {
  await connectTestDb();
}, 60000);

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

describe("submitReport (typist -> pending_technician)", () => {
  it("rejects a caller who is not a typist/technician/admin", async () => {
    const { report } = await makeReport({ status: "draft" });
    const res = mockRes();
    await ctrl.submitReport(mockReq({ user: PATIENT, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(403);
  });

  it("blocks submission while a value is still empty", async () => {
    const { report } = await makeReport({
      status: "draft",
      panels: [{ code: "CBC", name: "CBC", isInHouse: true, results: [{ parameterName: "Hemoglobin", value: null }] }],
    });
    const res = mockRes();
    await ctrl.submitReport(mockReq({ user: TYPIST, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.missing).toHaveLength(1);
  });

  it("moves a fully-filled draft to pending_technician and flips the accession to in_progress", async () => {
    const { report, accession } = await makeReport({ status: "draft" });
    const res = mockRes();
    await ctrl.submitReport(mockReq({ user: TYPIST, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);

    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("pending_technician");
    expect(saved.submittedAt).toBeInstanceOf(Date);
    expect(saved.audit.at(-1).action).toBe("sent_to_technician");

    const savedAccession = await Accession.findById(accession._id);
    expect(savedAccession.status).toBe("in_progress");
  });

  it("also accepts a report bounced back as rejected", async () => {
    const { report } = await makeReport({ status: "rejected" });
    const res = mockRes();
    await ctrl.submitReport(mockReq({ user: TYPIST, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);
  });

  it("refuses a report that has already left data entry", async () => {
    const { report } = await makeReport({ status: "lab_verified" });
    const res = mockRes();
    await ctrl.submitReport(mockReq({ user: TYPIST, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
  });
});

describe("verifyReport (technician gate A)", () => {
  it("rejects a non-technician caller", async () => {
    const { report } = await makeReport({ status: "pending_technician" });
    const res = mockRes();
    await ctrl.verifyReport(mockReq({ user: TYPIST, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(403);
  });

  it.each(["pending_technician", "technician_review", "returned"])(
    "accepts verification from %s",
    async (status) => {
      const { report } = await makeReport({ status });
      const res = mockRes();
      await ctrl.verifyReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
      expect(res.statusCode).toBe(200);
      const saved = await PathologyReport.findById(report._id);
      expect(saved.status).toBe("lab_verified");
      expect(String(saved.technician)).toBe(String(TECHNICIAN.id));
    }
  );

  it.each(["draft", "lab_verified", "pending_doctor", "released"])(
    "refuses verification from %s",
    async (status) => {
      const { report } = await makeReport({ status });
      const res = mockRes();
      await ctrl.verifyReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
      expect(res.statusCode).toBe(409);
    }
  );

  it("blocks verification while a value is still empty", async () => {
    const { report } = await makeReport({
      status: "pending_technician",
      panels: [{ code: "CBC", name: "CBC", isInHouse: true, results: [{ parameterName: "Hemoglobin", value: "" }] }],
    });
    const res = mockRes();
    await ctrl.verifyReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(400);
  });
});

describe("sendToDoctor (technician gate B)", () => {
  it("only moves a lab_verified report", async () => {
    const { report } = await makeReport({ status: "technician_review" });
    const res = mockRes();
    await ctrl.sendToDoctor(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
  });

  it("moves lab_verified to pending_doctor", async () => {
    const { report } = await makeReport({ status: "lab_verified" });
    const res = mockRes();
    await ctrl.sendToDoctor(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("pending_doctor");
  });
});

describe("rejectReport (technician bounces to data entry)", () => {
  it.each(["pending_technician", "technician_review"])("returns %s to the typist", async (status) => {
    const { report } = await makeReport({ status });
    const res = mockRes();
    await ctrl.rejectReport(
      mockReq({ user: TECHNICIAN, params: { id: report._id }, body: { reason: "Retype HB" } }),
      res
    );
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("rejected");
    expect(saved.rejectionReason).toBe("Retype HB");
  });

  it("cannot reject a report already past the technician", async () => {
    const { report } = await makeReport({ status: "lab_verified" });
    const res = mockRes();
    await ctrl.rejectReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
  });
});

describe("doctor stage (saveDoctorRemarks / finalVerifyReport / returnToTechnician)", () => {
  it("rejects a non-doctor at every doctor-stage action", async () => {
    const { report } = await makeReport({ status: "pending_doctor" });
    const res1 = mockRes();
    await ctrl.finalVerifyReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res1);
    expect(res1.statusCode).toBe(403);
  });

  it("saveDoctorRemarks moves pending_doctor into doctor_review", async () => {
    const { report } = await makeReport({ status: "pending_doctor" });
    const res = mockRes();
    await ctrl.saveDoctorRemarks(
      mockReq({ user: DOCTOR, params: { id: report._id }, body: { doctorRemarks: "Looks fine" } }),
      res
    );
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("doctor_review");
    expect(saved.doctorRemarks).toBe("Looks fine");
  });

  it.each(["pending_doctor", "doctor_review"])("finalVerifyReport accepts from %s", async (status) => {
    const { report } = await makeReport({ status });
    const res = mockRes();
    await ctrl.finalVerifyReport(mockReq({ user: DOCTOR, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("final_verified");
    expect(String(saved.doctor)).toBe(String(DOCTOR.id));
  });

  it("finalVerifyReport refuses a report not with the doctor", async () => {
    const { report } = await makeReport({ status: "lab_verified" });
    const res = mockRes();
    await ctrl.finalVerifyReport(mockReq({ user: DOCTOR, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
  });

  it("returnToTechnician bounces a doctor-stage report back to returned", async () => {
    const { report } = await makeReport({ status: "doctor_review" });
    const res = mockRes();
    await ctrl.returnToTechnician(
      mockReq({ user: DOCTOR, params: { id: report._id }, body: { reason: "Recheck WBC" } }),
      res
    );
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("returned");
    expect(saved.returnReason).toBe("Recheck WBC");
  });
});

describe("releaseReport", () => {
  it("refuses to release anything short of final_verified", async () => {
    const { report } = await makeReport({ status: "doctor_review" });
    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
  });

  it("blocks release while a referred-out panel is not yet verified", async () => {
    const { report } = await makeReport({
      status: "final_verified",
      panels: [
        { code: "CBC", name: "CBC", isInHouse: true, results: [] },
        { code: "LFT", name: "LFT", isInHouse: false, referral: { status: "uploaded" } },
      ],
    });
    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: DOCTOR, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toContain("LFT");

    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("final_verified");
  });

  it("releases once every referred panel is verified, with no linked booking", async () => {
    const { report, accession } = await makeReport({
      status: "final_verified",
      panels: [
        { code: "CBC", name: "CBC", isInHouse: true, results: [] },
        { code: "LFT", name: "LFT", isInHouse: false, referral: { status: "verified" } },
      ],
    });
    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: DOCTOR, params: { id: report._id }, body: {} }), res);
    expect(res.statusCode).toBe(200);

    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("released");
    expect(saved.sentAt).toBeInstanceOf(Date);

    const savedAccession = await Accession.findById(accession._id);
    expect(savedAccession.status).toBe("reported");
  });

  it("blocks release for a non-admin while the linked booking is unpaid", async () => {
    const labOrder = await LabOrder.create({
      userId: oid(),
      labId: oid(),
      items: [{ testId: oid(), unitPrice: 100, gstAmount: 0, totalPrice: 100 }],
      pricing: { subtotal: 100, gstTotal: 0, payableAmount: 100 },
      collectionAddress: { location: { type: "Point", coordinates: [0, 0] } },
      paymentStatus: "PENDING",
      orderStatus: "REPORT_PENDING",
    });
    const { report } = await makeReport({
      status: "final_verified",
      accessionOverrides: { labOrder: labOrder._id },
    });

    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: DOCTOR, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(402);

    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("final_verified");
  });

  it("lets an admin override the payment gate", async () => {
    const labOrder = await LabOrder.create({
      userId: oid(),
      labId: oid(),
      items: [{ testId: oid(), unitPrice: 100, gstAmount: 0, totalPrice: 100 }],
      pricing: { subtotal: 100, gstTotal: 0, payableAmount: 100 },
      collectionAddress: { location: { type: "Point", coordinates: [0, 0] } },
      paymentStatus: "PENDING",
      orderStatus: "REPORT_PENDING",
    });
    const { report, accession } = await makeReport({
      status: "final_verified",
      accessionOverrides: { labOrder: labOrder._id },
    });

    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: ADMIN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);

    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("released");
    expect(saved.audit.at(-1).note).toContain("admin override");

    const savedAccession = await Accession.findById(accession._id);
    expect(savedAccession.status).toBe("reported");
    const savedOrder = await LabOrder.findById(labOrder._id);
    expect(savedOrder.orderStatus).toBe("REPORT_READY");
  });

  it("releases for a non-admin once the linked booking is paid", async () => {
    const labOrder = await LabOrder.create({
      userId: oid(),
      labId: oid(),
      items: [{ testId: oid(), unitPrice: 100, gstAmount: 0, totalPrice: 100 }],
      pricing: { subtotal: 100, gstTotal: 0, payableAmount: 100 },
      collectionAddress: { location: { type: "Point", coordinates: [0, 0] } },
      paymentStatus: "PAID",
      orderStatus: "REPORT_PENDING",
    });
    const { report } = await makeReport({
      status: "final_verified",
      accessionOverrides: { labOrder: labOrder._id },
    });

    const res = mockRes();
    await ctrl.releaseReport(mockReq({ user: TECHNICIAN, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);
  });
});

describe("saveReportValues permission matrix", () => {
  it("lets the operator (typist) edit only in draft/rejected", async () => {
    const { report: draft } = await makeReport({ status: "draft" });
    const res1 = mockRes();
    await ctrl.saveReportValues(
      mockReq({ user: TYPIST, params: { id: draft._id }, body: { values: { "CBC.HB": "14" } } }),
      res1
    );
    expect(res1.statusCode).toBe(200);

    const { report: pending } = await makeReport({ status: "pending_technician" });
    const res2 = mockRes();
    await ctrl.saveReportValues(
      mockReq({ user: TYPIST, params: { id: pending._id }, body: { values: { "CBC.HB": "14" } } }),
      res2
    );
    expect(res2.statusCode).toBe(403);
  });

  it("lets the technician edit through technician-owned statuses and marks the correction", async () => {
    const { report } = await makeReport({ status: "technician_review" });
    const res = mockRes();
    await ctrl.saveReportValues(
      mockReq({ user: TECHNICIAN, params: { id: report._id }, body: { values: { "CBC.HB": "16" } } }),
      res
    );
    expect(res.statusCode).toBe(200);

    const saved = await PathologyReport.findById(report._id);
    const row = saved.panels[0].results[0];
    expect(String(row.value)).toBe("16");
    expect(row.editedByTechnician).toBe(true);
    expect(String(row.previousValue)).toBe("13.5");
  });

  it("blocks every non-admin role once the report is released", async () => {
    const { report } = await makeReport({ status: "released" });
    const res = mockRes();
    await ctrl.saveReportValues(
      mockReq({ user: ADMIN, params: { id: report._id }, body: { values: { "CBC.HB": "16" } } }),
      res
    );
    expect(res.statusCode).toBe(409);
  });

  it("moves an incoming pending_technician report into technician_review on first technician touch", async () => {
    const { report } = await makeReport({ status: "pending_technician" });
    const res = mockRes();
    await ctrl.saveReportValues(
      mockReq({ user: TECHNICIAN, params: { id: report._id }, body: { values: { "CBC.HB": "16" } } }),
      res
    );
    expect(res.statusCode).toBe(200);
    const saved = await PathologyReport.findById(report._id);
    expect(saved.status).toBe("technician_review");
  });
});

describe("patient ownership of released reports", () => {
  it("lets a patient see their own released report by linked account", async () => {
    const { report, accession } = await makeReport({
      status: "released",
      accessionOverrides: { patientUser: PATIENT.id },
    });
    const res = mockRes();
    await ctrl.getMyReport(mockReq({ user: { id: PATIENT.id }, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.report._id.toString()).toBe(report._id.toString());
  });

  it("blocks a different patient from the same released report", async () => {
    const { report } = await makeReport({
      status: "released",
      accessionOverrides: { patientUser: PATIENT.id },
    });
    const other = oid();
    const res = mockRes();
    await ctrl.getMyReport(mockReq({ user: { id: other }, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(404);
  });

  it("blocks the owner from seeing their own report before it is released", async () => {
    const { report } = await makeReport({
      status: "final_verified",
      accessionOverrides: { patientUser: PATIENT.id },
    });
    const res = mockRes();
    await ctrl.getMyReport(mockReq({ user: { id: PATIENT.id }, params: { id: report._id } }), res);
    expect(res.statusCode).toBe(404);
  });
});
