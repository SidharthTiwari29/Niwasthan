// Real, India-specific business logic extracted from the cron route so
// it can be tested directly against known real timestamps, rather than
// only indirectly through a route handler.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Returns the previous full calendar day in India Standard Time
// (UTC+5:30) - this business's own real operating timezone - as a
// real [start, end) UTC range, regardless of what UTC time of day this
// is called at. "Yesterday in IST" is not the same as "the last 24
// hours" or "yesterday in UTC," and a naive server-local-time
// computation would silently misalign a report a founder in India
// reads as "yesterday's numbers."
export function previousIstDayRange(now: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const nowIst = new Date(now.getTime() + IST_OFFSET_MS);
  const todayIstMidnightUtc = new Date(
    Date.UTC(
      nowIst.getUTCFullYear(),
      nowIst.getUTCMonth(),
      nowIst.getUTCDate(),
    ) - IST_OFFSET_MS,
  );
  return {
    start: new Date(todayIstMidnightUtc.getTime() - 24 * 60 * 60 * 1000),
    end: todayIstMidnightUtc,
  };
}
