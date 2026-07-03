import Appointment from "../models/appointment.model.js";
import MedicineOrder from "../models/medicine/medicineOrder.model.js";
import LabOrder from "../models/lab/labOrder.model.js";
import AppError from "../utils/AppError.js";

export const getAnalyticsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Construct date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // 1. DOCTOR APPOINTMENTS
    const [appointmentsCount, appointmentsRev] = await Promise.all([
      Appointment.countDocuments(dateFilter),
      Appointment.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$consultationFee" } } }
      ])
    ]);
    const doctorRevenue = appointmentsRev[0]?.total || 0;

    // 2. MEDICINE ORDERS
    const [medicineCount, medicineRev] = await Promise.all([
      MedicineOrder.countDocuments(dateFilter),
      MedicineOrder.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$pricing.payableAmount" } } }
      ])
    ]);
    const medicineRevenue = medicineRev[0]?.total || 0;

    // 3. LAB ORDERS
    const [labCount, labRev] = await Promise.all([
      LabOrder.countDocuments(dateFilter),
      LabOrder.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$pricing.payableAmount" } } }
      ])
    ]);
    const labRevenue = labRev[0]?.total || 0;

    // Aggregated Results
    const totalRevenue = doctorRevenue + medicineRevenue + labRevenue;
    const totalBookings = appointmentsCount + medicineCount + labCount;

    return res.status(200).json({
      success: true,
      data: {
        overall: {
          totalRevenue,
          totalBookings
        },
        doctors: {
          count: appointmentsCount,
          revenue: doctorRevenue
        },
        medicines: {
          count: medicineCount,
          revenue: medicineRevenue
        },
        labs: {
          count: labCount,
          revenue: labRevenue
        }
      }
    });

  } catch (error) {
    console.error("Error in getAnalyticsReport:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
