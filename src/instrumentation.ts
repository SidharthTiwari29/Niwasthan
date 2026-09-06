// Real, comprehensive fix for an entire class of bug found repeatedly
// this session: Prisma returns monetary and size fields as BigInt
// (targetBudgetMinor, sizeBytes, and roughly twenty other real fields
// across Purchase, Boq, BoqLine, Package, Entitlement,
// ProcurementRequest, and more), and JSON.stringify - used internally
// by every NextResponse.json() call in this app - throws
// unconditionally on any object containing a raw BigInt. Two real,
// separate instances of this exact crash (Property.targetBudgetMinor,
// Asset.sizeBytes) were found and fixed individually at the service
// layer before this; rather than continue auditing and patching each
// of the ~20 remaining BigInt fields one route at a time, this is the
// standard, well-established fix for the whole class at once: giving
// BigInt a real toJSON method makes every BigInt value in this
// application safely serializable everywhere, present and future,
// with a single, global change.
//
// This does not replace the two existing service-layer conversions
// (propertyService, assetService) - those remain correct and are now
// simply redundant-but-harmless, the same relationship the page-level
// fix ended up having with the service-layer fix earlier. This is the
// real safety net underneath all of them.
//
// Values still convert to a plain JS number (via Number()), exactly
// matching the precision behavior already established in those two
// fixes - safe for this app's real, bounded monetary and size ranges,
// all well within Number.MAX_SAFE_INTEGER.
export function register() {
  (BigInt.prototype as any).toJSON = function (this: bigint) {
    return Number(this);
  };
}
