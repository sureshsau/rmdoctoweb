export const ROLE_PERMISSIONS = {
  admin: ["*"],
  subadmin: ["*"],
  employee: ["*"],
  
  doctor: [
    "appointment.read.all",
    "appointment.create",
    // Pathology stage 3: final check + verification, and release.
    "pathology.catalog.read",
    "pathology.accession.read",
    "pathology.report.read",
    "pathology.report.doctor",
    "pathology.report.release"
  ],
  
  receptionist: [
    "appointment.read.all",
    "appointment.create",
    "medicineOrder.read.all",
    "medicineOrder.create.forCustomer",
    "labOrder.read.all",
    "labOrder.status.update",
    "user.read.all",
    "pathology.catalog.read",
    "pathology.accession.read",
    "pathology.accession.create",
    "pathology.collection.label",
    "pathology.collection.read",
    "pathology.report.read"
  ],

  typist: [
    "labOrder.read.all",
    "labOrder.status.update",
    "pathology.catalog.read",
    "pathology.accession.read",
    "pathology.accession.create",
    "pathology.accession.update",
    "pathology.accession.receive",
    "pathology.collection.label",
    "pathology.collection.read",
    "pathology.report.read",
    "pathology.report.enter",
    "pathology.report.submit"
  ],

  lab_technician: [
    "labOrder.read.all",
    "labOrder.status.update",
    "labOrder.report.upload",
    "pathology.catalog.read",
    "pathology.catalog.manage",
    "pathology.accession.read",
    "pathology.accession.create",
    "pathology.accession.update",
    "pathology.accession.receive",
    "pathology.collection.label",
    "pathology.collection.read",
    "pathology.report.read",
    "pathology.report.enter",
    "pathology.report.submit",
    "pathology.report.verify",
    "pathology.report.send",
    "pathology.report.release"
  ],
  
  agent: [
    "labOrder.create",
    "appointment.create"
  ],
  
  marketing_agent: [
    "agent.read",
    "agent.create",
    // Meet plan — the service scopes every read/write to their own RM Members
    "visit.read",
    "visit.mark"
  ],
  
  delivery_partner: [
    "medicineOrder.read.rider",
    // Riders mark medicine orders delivered after verifying the customer's OTP.
    // updateOrderStatusService still scopes it to the *assigned* rider, so this
    // grants the route, not the order.
    "medicineOrder.status.update",
    "labOrder.read.rider",
    "labOrder.status.update",
    // Scan the specimen barcode to see the collection sheet (patient, tests,
    // tube checklist). getCollectionSheet still scopes it to the *assigned*
    // rider, so this grants the route, not every collection.
    "pathology.collection.read"
  ],
  
  user: []
};
