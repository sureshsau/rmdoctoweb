import {
  deleteVisitService,
  getVisitLocationsService,
  getVisitPlanService,
  getVisitSummaryService,
  getVisitTrackService,
  markVisitService,
  updateShopDetailsService,
} from "../services/visit.service.js";

/* GET /visits/plan
   The working list: every RM Member the caller is responsible for, split into
   pending / completed for the chosen day, week, month or custom range. */
export const getVisitPlanController = async (req, res, next) => {
  try {
    const data = await getVisitPlanService({
      requester: req.user,
      ...req.query,
    });

    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

/* GET /visits/summary — headline counts for dashboard tiles */
export const getVisitSummaryController = async (req, res, next) => {
  try {
    const data = await getVisitSummaryService({
      requester: req.user,
      ...req.query,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/* GET /visits/locations — routes (city / pincode clusters) with pending counts */
export const getVisitLocationsController = async (req, res, next) => {
  try {
    const data = await getVisitLocationsService({
      requester: req.user,
      ...req.query,
    });

    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

/* GET /visits/member/:agentProfileId — track: shop location, photo, history */
export const getVisitTrackController = async (req, res, next) => {
  try {
    const data = await getVisitTrackService({
      requester: req.user,
      agentProfileId: req.params.agentProfileId,
      ...req.query,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/* POST /visits/member/:agentProfileId — tick a meet complete or incomplete */
export const markVisitController = async (req, res, next) => {
  try {
    const data = await markVisitService({
      requester: req.user,
      agentProfileId: req.params.agentProfileId,
      payload: req.body,
      file: req.file || null,
    });

    return res.status(201).json({
      success: true,
      message:
        data.status === "COMPLETED"
          ? "Meet marked complete"
          : "Meet marked incomplete",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/* DELETE /visits/:visitId — undo a meet marked by mistake */
export const deleteVisitController = async (req, res, next) => {
  try {
    const data = await deleteVisitService({
      requester: req.user,
      visitId: req.params.visitId,
    });

    return res.status(200).json({
      success: true,
      message: "Meet record removed",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/* PATCH /visits/member/:agentProfileId/shop — shop photo, name, coordinates */
export const updateShopDetailsController = async (req, res, next) => {
  try {
    const data = await updateShopDetailsService({
      requester: req.user,
      agentProfileId: req.params.agentProfileId,
      payload: req.body,
      file: req.file || null,
    });

    return res.status(200).json({
      success: true,
      message: "Shop details updated",
      data,
    });
  } catch (error) {
    next(error);
  }
};
