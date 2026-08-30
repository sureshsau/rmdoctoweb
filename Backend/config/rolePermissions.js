export const ROLE_PERMISSIONS = {
  admin: ["*"],
  subadmin: ["*"],
  employee: ["*"],
  
  doctor: [
    "appointment.read.all",
    "appointment.create"
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
    "pathology.report.read"
  ],

  typist: [
    "labOrder.read.all",
    "labOrder.status.update",
    "pathology.catalog.read",
    "pathology.accession.read",
    "pathology.accession.create",
    "pathology.accession.update",
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
    "pathology.report.read",
    "pathology.report.enter",
    "pathology.report.submit",
    "pathology.report.verify",
    "pathology.report.send"
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
  
  rmrider: [
    "medicineOrder.read.rider",
    // Riders mark medicine orders delivered after verifying the customer's OTP.
    // updateOrderStatusService still scopes it to the *assigned* rider, so this
    // grants the route, not the order.
    "medicineOrder.status.update",
    "labOrder.read.rider",
    "labOrder.status.update"
  ],
  
  user: []
};
