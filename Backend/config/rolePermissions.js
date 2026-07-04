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
    "labOrder.read.all",
    "user.read.all"
  ],
  
  agent: [
    "labOrder.create",
    "appointment.create"
  ],
  
  marketing_agent: [
    "agent.read",
    "agent.create"
  ],
  
  rmrider: [
    "medicineOrder.read.rider",
    "labOrder.read.rider",
    "labOrder.status.update"
  ],
  
  user: []
};
