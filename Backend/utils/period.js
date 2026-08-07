import AppError from "./AppError.js";

/* Everything the business runs on is local wall-clock time, but Mongo stores
   UTC. Rather than pull in a tz library we keep a fixed offset — the whole
   operation is in one country. Override with APP_TZ_OFFSET_MINUTES if that
   ever changes. Default is IST (+05:30). */
const TZ_OFFSET_MIN = Number(process.env.APP_TZ_OFFSET_MINUTES ?? 330);

export const RANGES = ["day", "week", "month", "custom"];

/** UTC instant of local midnight for the given local calendar date.
 *  Month/day overflow is handled by Date.UTC (e.g. d = 32 rolls over). */
const localDayStart = (y, m, d) =>
  new Date(Date.UTC(y, m, d) - TZ_OFFSET_MIN * 60000);

/** Today's local calendar parts, derived from the current UTC instant. */
const localNowParts = () => {
  const shifted = new Date(Date.now() + TZ_OFFSET_MIN * 60000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    dow: shifted.getUTCDay(), // 0 = Sunday
  };
};

/** Accepts "YYYY-MM-DD" or any ISO string; returns local calendar parts. */
const parseDateInput = (value) => {
  if (!value) return null;

  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (ymd) {
    return { y: Number(ymd[1]), m: Number(ymd[2]) - 1, d: Number(ymd[3]) };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const shifted = new Date(parsed.getTime() + TZ_OFFSET_MIN * 60000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
};

/**
 * Turns a range filter into a half-open [from, to) UTC window.
 *
 *   day    → today, local midnight to midnight
 *   week   → current week, Monday-based
 *   month  → current calendar month
 *   custom → the given from..to dates, both ends inclusive by day
 */
export const resolvePeriod = ({ range = "day", from, to } = {}) => {
  const key = String(range || "day").toLowerCase();

  if (!RANGES.includes(key)) {
    throw new AppError(
      `Unknown range "${range}". Use one of: ${RANGES.join(", ")}`,
      400
    );
  }

  const { y, m, d, dow } = localNowParts();

  if (key === "day") {
    return { range: key, from: localDayStart(y, m, d), to: localDayStart(y, m, d + 1) };
  }

  if (key === "week") {
    const backToMonday = (dow + 6) % 7;
    return {
      range: key,
      from: localDayStart(y, m, d - backToMonday),
      to: localDayStart(y, m, d - backToMonday + 7),
    };
  }

  if (key === "month") {
    return { range: key, from: localDayStart(y, m, 1), to: localDayStart(y, m + 1, 1) };
  }

  // custom
  const start = parseDateInput(from);
  if (!start) {
    throw new AppError("A custom range needs a valid `from` date (YYYY-MM-DD)", 400);
  }

  const end = parseDateInput(to) || start;

  const fromAt = localDayStart(start.y, start.m, start.d);
  const toAt = localDayStart(end.y, end.m, end.d + 1);

  if (toAt <= fromAt) {
    throw new AppError("`to` cannot be earlier than `from`", 400);
  }

  return { range: key, from: fromAt, to: toAt };
};

/** "1 Aug 2026 – 7 Aug 2026" style label for the period the client is viewing. */
export const describePeriod = ({ range, from, to }) => {
  const fmt = (date) =>
    new Date(date.getTime() + TZ_OFFSET_MIN * 60000)
      .toISOString()
      .slice(0, 10);

  // `to` is exclusive — step back a millisecond so the label reads inclusively
  const lastDay = new Date(to.getTime() - 1);

  if (range === "day") return fmt(from);
  return `${fmt(from)} → ${fmt(lastDay)}`;
};
