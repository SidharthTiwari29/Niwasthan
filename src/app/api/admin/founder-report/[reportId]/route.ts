import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin/authorization";
import { withErrorHandling } from "@/server/errors/handler";
import { prisma } from "@/server/db/prisma";

type RouteParams = { params: Promise<{ reportId: string }> };

export const GET = withErrorHandling(async (_request: Request, { params }: RouteParams) => {
  await requireAdmin();
  const { reportId } = await params;
  const report = await prisma.processReport.findUnique({
    where: { id: reportId },
    include: { deliveries: { orderBy: { createdAt: "desc" } } },
  });
  if (!report) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Process report not found" } }, { status: 404 });
  return NextResponse.json({ report });
});
