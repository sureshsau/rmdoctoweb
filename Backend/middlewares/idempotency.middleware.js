import IdempotencyKey from "../models/idempotencyKey.model.js";

/**
 * Opt-in idempotency guard for mutating endpoints (wallet transfers, credit
 * grants, etc.). A client that sends an `Idempotency-Key` header gets the
 * exact same response replayed if the same key hits the same route again --
 * a retried request never re-applies the effect. Callers that don't send the
 * header are unaffected (this never blocks a request on its own).
 *
 * A key seen while the first request is still in flight (no stored response
 * yet) gets a 409, rather than racing the original through the handler.
 */
export const idempotency = () => async (req, res, next) => {
  const key = req.header("Idempotency-Key");
  if (!key) return next();

  const route = `${req.method} ${req.baseUrl}${req.route?.path || req.path}`;

  try {
    const doc = await IdempotencyKey.create({ key, route, userId: req.user?.id || null });

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      IdempotencyKey.updateOne({ _id: doc._id }, { status: res.statusCode, response: body }).catch(
        (err) => console.error("idempotency: failed to store response:", err.message)
      );
      return originalJson(body);
    };
    return next();
  } catch (err) {
    if (err.code === 11000) {
      const existing = await IdempotencyKey.findOne({ key, route }).lean();
      if (existing?.response != null) {
        return res.status(existing.status || 200).json(existing.response);
      }
      return res.status(409).json({
        success: false,
        message: "A request with this idempotency key is already being processed",
      });
    }
    return next(err);
  }
};
