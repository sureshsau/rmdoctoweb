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
    "user.read.all"
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
